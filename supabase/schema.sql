-- ComplyEC — schéma Phase 0 : cabinets, comptes et rôles
--
-- Un "cabinet" est un tenant. Chaque compte (auth.users, géré par Supabase Auth)
-- a une fiche "profile" qui le rattache à un cabinet et lui donne un rôle.
-- Les règles ci-dessous garantissent qu'un collaborateur ne voit jamais un
-- autre cabinet, et qu'il ne peut ni s'auto-promouvoir expert-comptable ni
-- changer son propre rattachement de cabinet.
--
-- Ce fichier est conçu pour être rejoué sans risque (idempotent) : toutes
-- les instructions utilisent IF NOT EXISTS / OR REPLACE / DROP...IF EXISTS,
-- pour pouvoir corriger les policies ou fonctions sans jamais recréer les
-- tables ni toucher aux données déjà présentes. À exécuter dans l'éditeur
-- SQL du projet Supabase (Database > SQL Editor).

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('expert_comptable', 'collaborateur');
  end if;
end
$$;

create table if not exists public.cabinets (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  role public.user_role not null,
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_cabinet_id_idx on public.profiles (cabinet_id);

alter table public.cabinets enable row level security;
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------- fonctions utilitaires (RLS)
--
-- Une policy sur `profiles` qui interroge `profiles` dans sa propre clause
-- USING/WITH CHECK déclenche l'erreur Postgres "infinite recursion detected
-- in policy for relation profiles" (42P17) : la sous-requête est elle-même
-- soumise à la RLS de `profiles`, qui redéclenche la même policy, etc.
-- Solution standard (recommandée par Supabase) : passer par des fonctions
-- SECURITY DEFINER. Une telle fonction s'exécute avec les droits de son
-- propriétaire (le rôle "postgres" du projet, qui contourne la RLS), donc
-- la sous-requête à l'intérieur de la fonction n'est plus filtrée par la
-- policy en cours d'évaluation — plus de récursion, et plus de faille où la
-- RLS empêcherait par erreur un contrôle de sécurité de voir les lignes
-- qu'il doit précisément vérifier.

create or replace function public.user_cabinet_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select cabinet_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_ec_of_cabinet(target_cabinet_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'expert_comptable' and cabinet_id = target_cabinet_id
  )
$$;

create or replace function public.cabinet_has_members(target_cabinet_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where cabinet_id = target_cabinet_id)
$$;

-- ---------------------------------------------------------------- cabinets

-- Un utilisateur connecté peut lire son propre cabinet.
drop policy if exists "cabinet: lecture par ses membres" on public.cabinets;
create policy "cabinet: lecture par ses membres"
  on public.cabinets for select
  using (id = public.user_cabinet_id());

-- Amorçage : n'importe quel utilisateur authentifié peut créer un cabinet.
-- Ce n'est pas un risque en soi — un cabinet vide sans profil associé n'ouvre
-- aucun accès ; c'est la policy suivante qui restreint qui peut en devenir
-- le premier membre.
drop policy if exists "cabinet: creation par un utilisateur authentifie" on public.cabinets;
create policy "cabinet: creation par un utilisateur authentifie"
  on public.cabinets for insert
  with check (auth.uid() is not null);

-- ---------------------------------------------------------------- profiles

-- Chacun voit l'annuaire de son propre cabinet (pour la liste "collaborateurs").
drop policy if exists "profiles: lecture au sein du cabinet" on public.profiles;
create policy "profiles: lecture au sein du cabinet"
  on public.profiles for select
  using (cabinet_id = public.user_cabinet_id());

-- Chacun peut modifier sa propre fiche (téléphone, etc.). Le déclencheur
-- profiles_guard_role_change (plus bas) empêche de changer soi-même son
-- rôle ou son cabinet via cette policy.
drop policy if exists "profiles: modification de sa propre fiche" on public.profiles;
create policy "profiles: modification de sa propre fiche"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Seul l'expert-comptable du cabinet peut créer un profil collaborateur
-- (déclenché après l'invitation Supabase Auth — voir functions/invite-collaborateur).
drop policy if exists "profiles: creation par l'EC du cabinet" on public.profiles;
create policy "profiles: creation par l'EC du cabinet"
  on public.profiles for insert
  with check (public.is_ec_of_cabinet(cabinet_id));

-- Amorçage : le tout premier compte d'un cabinet peut créer sa propre fiche
-- expert-comptable, uniquement si ce cabinet n'a encore aucun membre.
drop policy if exists "profiles: creation du premier EC d'un nouveau cabinet" on public.profiles;
create policy "profiles: creation du premier EC d'un nouveau cabinet"
  on public.profiles for insert
  with check (
    id = auth.uid()
    and role = 'expert_comptable'
    and not public.cabinet_has_members(cabinet_id)
  );

-- Seul l'expert-comptable du cabinet peut modifier les fiches de ses collaborateurs
-- (rôle, désactivation, etc.).
drop policy if exists "profiles: modification par l'EC du cabinet" on public.profiles;
create policy "profiles: modification par l'EC du cabinet"
  on public.profiles for update
  using (public.is_ec_of_cabinet(cabinet_id));

-- ---------------------------------------------------------------- garde-fou rôle/cabinet
--
-- Les policies UPDATE ci-dessus autorisent une ligne (par id, ou par cabinet
-- pour l'EC) mais ne restreignent pas quelles colonnes changent. Sans ce
-- déclencheur, la policy "modification de sa propre fiche" laisserait un
-- collaborateur passer son propre role à 'expert_comptable'. Le déclencheur
-- bloque tout changement de role/cabinet_id qui ne vient pas de l'EC du
-- cabinet d'origine, quelle que soit la policy qui a laissé passer la ligne.
create or replace function public.profiles_guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.cabinet_id is distinct from old.cabinet_id) then
    if not exists (
      select 1 from public.profiles ec
      where ec.id = auth.uid() and ec.role = 'expert_comptable' and ec.cabinet_id = old.cabinet_id
    ) then
      raise exception 'Seul l''expert-comptable du cabinet peut modifier le rôle ou le rattachement d''un compte.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role_change on public.profiles;
create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function public.profiles_guard_role_change();
