-- ComplyEC — schéma Phase 0 : cabinets, comptes et rôles
--
-- Un "cabinet" est un tenant. Chaque compte (auth.users, géré par Supabase Auth)
-- a une fiche "profile" qui le rattache à un cabinet et lui donne un rôle.
-- Les règles ci-dessous garantissent qu'un collaborateur ne voit jamais un
-- autre cabinet, et qu'il ne peut pas s'auto-promouvoir expert-comptable.
--
-- À exécuter dans l'éditeur SQL du projet Supabase (Database > SQL Editor).

create extension if not exists "pgcrypto";

create type public.user_role as enum ('expert_comptable', 'collaborateur');

create table public.cabinets (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  role public.user_role not null,
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  created_at timestamptz not null default now()
);

create index profiles_cabinet_id_idx on public.profiles (cabinet_id);

alter table public.cabinets enable row level security;
alter table public.profiles enable row level security;

-- Un utilisateur connecté peut lire son propre cabinet.
create policy "cabinet: lecture par ses membres"
  on public.cabinets for select
  using (id in (select cabinet_id from public.profiles where id = auth.uid()));

-- Chacun voit l'annuaire de son propre cabinet (pour la liste "collaborateurs").
create policy "profiles: lecture au sein du cabinet"
  on public.profiles for select
  using (cabinet_id in (select cabinet_id from public.profiles where id = auth.uid()));

-- Chacun peut modifier sa propre fiche (téléphone, etc.) mais pas son rôle
-- ni son cabinet — ces deux colonnes ne sont modifiables que par l'EC (policy suivante).
create policy "profiles: modification de sa propre fiche"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Seul l'expert-comptable du cabinet peut créer un profil collaborateur
-- (déclenché après l'invitation Supabase Auth — voir functions/invite-collaborateur).
create policy "profiles: creation par l'EC du cabinet"
  on public.profiles for insert
  with check (
    exists (
      select 1 from public.profiles ec
      where ec.id = auth.uid() and ec.role = 'expert_comptable' and ec.cabinet_id = profiles.cabinet_id
    )
  );

-- Seul l'expert-comptable du cabinet peut modifier les fiches de ses collaborateurs
-- (rôle, désactivation, etc.).
create policy "profiles: modification par l'EC du cabinet"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles ec
      where ec.id = auth.uid() and ec.role = 'expert_comptable' and ec.cabinet_id = profiles.cabinet_id
    )
  );
