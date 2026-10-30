-- ComplyEC — données partagées du cabinet (30 octobre 2026)
--
-- Jusqu'ici, tout ce que l'on enregistrait dans ComplyEC (signatures,
-- régularisations, signalements RBE, formations, analyses de vigilance…)
-- restait dans le navigateur de la personne qui l'avait saisi. Un pilote à
-- plusieurs postes est impossible dans ces conditions : ce que signe un
-- collaborateur, l'expert-comptable ne le voit pas.
--
-- Ce fichier ajoute :
--   1. un interrupteur par cabinet : démonstration (par défaut) ou données
--      réelles. Tant qu'il n'est pas basculé, rien ne change pour personne ;
--   2. la table etat_cabinet : une ligne par famille de données (« signatures »,
--      « regularisations », « rbe »…), avec un numéro de version. Deux
--      personnes qui enregistrent en même temps ne s'écrasent pas : la
--      seconde est refusée, relit, réapplique sa modification et réessaie ;
--   3. la table etat_historique : chaque écriture y laisse une ligne, qui ne
--      peut être ni modifiée ni supprimée depuis l'application. C'est la trace
--      qui permet de reconstituer qui a enregistré quoi, et quand ;
--   4. la règle de droits : un collaborateur n'écrit que dans les familles
--      qui relèvent de son travail (ses signatures, ses dépôts, ses
--      formations…) ; le reste est réservé à l'expert-comptable.
--
-- Prérequis : schema.sql (cabinets, profiles, user_cabinet_id()).
-- Idempotent : peut être rejoué sans risque.

-- --------------------------------------------------------------- 1. interrupteur

alter table public.cabinets add column if not exists donnees_reelles boolean not null default false;
alter table public.cabinets add column if not exists donnees_reelles_depuis timestamptz;

-- Seul l'expert-comptable du cabinet bascule son cabinet en données réelles.
-- La bascule est définitive : revenir à la démonstration ferait afficher des
-- dossiers fictifs à une équipe qui travaille sur des dossiers réels.
create or replace function public.cabinet_passer_en_reel()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cab uuid;
  v_role public.user_role;
  v_depuis timestamptz;
begin
  select cabinet_id, role into v_cab, v_role from public.profiles where id = auth.uid();
  if v_cab is null then
    raise exception 'Aucun cabinet n''est rattaché à ce compte.';
  end if;
  if v_role <> 'expert_comptable' then
    raise exception 'Seul l''expert-comptable du cabinet peut faire ce choix.' using errcode = '42501';
  end if;
  update public.cabinets
     set donnees_reelles = true,
         donnees_reelles_depuis = coalesce(donnees_reelles_depuis, now())
   where id = v_cab
  returning donnees_reelles_depuis into v_depuis;
  return v_depuis;
end;
$$;

revoke all on function public.cabinet_passer_en_reel() from public;
grant execute on function public.cabinet_passer_en_reel() to authenticated;

-- --------------------------------------------------------------- 2. état partagé

create table if not exists public.etat_cabinet (
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  cle text not null,
  valeur jsonb not null default 'null'::jsonb,
  version bigint not null default 1,
  maj_le timestamptz not null default now(),
  maj_par uuid,
  primary key (cabinet_id, cle)
);

alter table public.etat_cabinet enable row level security;

-- Lecture : les membres du cabinet, et eux seuls.
drop policy if exists "etat: lecture par les membres du cabinet" on public.etat_cabinet;
create policy "etat: lecture par les membres du cabinet"
  on public.etat_cabinet for select
  using (cabinet_id = public.user_cabinet_id());

-- Aucune policy d'écriture : on n'écrit que par etat_ecrire(), qui contrôle
-- les droits, la version, l'auteur et la trace.

-- --------------------------------------------------------------- 3. historique

create table if not exists public.etat_historique (
  id bigserial primary key,
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  cle text not null,
  version bigint not null,
  valeur jsonb not null,
  ecrit_le timestamptz not null default now(),
  ecrit_par uuid
);

create index if not exists etat_historique_cabinet_cle_idx
  on public.etat_historique (cabinet_id, cle, version);

alter table public.etat_historique enable row level security;

-- L'expert-comptable relit l'historique de son cabinet. Personne, depuis
-- l'application, ne peut le modifier ni le supprimer : aucune policy
-- d'écriture n'est créée.
drop policy if exists "historique: lecture par l'EC du cabinet" on public.etat_historique;
create policy "historique: lecture par l'EC du cabinet"
  on public.etat_historique for select
  using (public.is_ec_of_cabinet(cabinet_id));

-- --------------------------------------------------------------- 4. écriture

-- Les familles qu'un collaborateur peut écrire. Toutes les autres
-- (réglages, rôles, gouvernance, manuel, campagnes, supervision,
-- cartographie, liste des clients, attributions…) sont réservées à
-- l'expert-comptable. Garder cette liste identique à ETAT_CLES_COLLABORATEUR
-- dans db.js.
create or replace function public.etat_cles_collaborateur()
returns text[]
language sql
immutable
as $$
  select array[
    'journal', 'dossiersAjoutes', 'formations', 'depots', 'lectures',
    'notesSynthese', 'ncModifs', 'nonConformites', 'profilsCollab',
    'regularisations', 'signalementsRbe', 'signatures', 'manuelAccuses',
    'detections'
  ]::text[]
$$;

-- Écrit une famille de données si la version lue est toujours la bonne.
-- Renvoie la nouvelle version, ou -1 si quelqu'un a écrit entre-temps :
-- l'application relit alors la famille, réapplique sa modification et
-- réessaie. Personne n'écrase le travail d'un autre sans le savoir.
create or replace function public.etat_ecrire(p_cle text, p_valeur jsonb, p_version_attendue bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cab uuid;
  v_role public.user_role;
  v_reel boolean;
  v_actuelle bigint;
  v_nouvelle bigint;
  v_trace jsonb;
begin
  select p.cabinet_id, p.role into v_cab, v_role from public.profiles p where p.id = auth.uid();
  if v_cab is null then
    raise exception 'Aucun cabinet n''est rattaché à ce compte.' using errcode = '42501';
  end if;
  select donnees_reelles into v_reel from public.cabinets where id = v_cab;
  if not coalesce(v_reel, false) then
    raise exception 'Ce cabinet est encore en démonstration : rien n''est enregistré en base.' using errcode = '42501';
  end if;
  if p_cle is null or p_cle !~ '^[A-Za-z][A-Za-z0-9]*$' then
    raise exception 'Nom de famille de données invalide.';
  end if;
  if v_role <> 'expert_comptable' and not (p_cle = any (public.etat_cles_collaborateur())) then
    raise exception 'Cette information est réservée à l''expert-comptable.' using errcode = '42501';
  end if;

  select version into v_actuelle
    from public.etat_cabinet
   where cabinet_id = v_cab and cle = p_cle
   for update;

  if v_actuelle is null then
    if coalesce(p_version_attendue, 0) <> 0 then
      return -1;
    end if;
    insert into public.etat_cabinet (cabinet_id, cle, valeur, version, maj_le, maj_par)
    values (v_cab, p_cle, coalesce(p_valeur, 'null'::jsonb), 1, now(), auth.uid())
    on conflict (cabinet_id, cle) do nothing;
    if not found then
      return -1;  -- quelqu'un a créé la famille au même instant
    end if;
    v_nouvelle := 1;
  else
    if v_actuelle <> p_version_attendue then
      return -1;
    end if;
    v_nouvelle := v_actuelle + 1;
    update public.etat_cabinet
       set valeur = coalesce(p_valeur, 'null'::jsonb), version = v_nouvelle, maj_le = now(), maj_par = auth.uid()
     where cabinet_id = v_cab and cle = p_cle;
  end if;

  -- Le journal est déjà une trace : on n'en garde que la dernière entrée,
  -- pour ne pas recopier deux cents lignes à chaque écriture.
  v_trace := case
    when p_cle = 'journal' and jsonb_typeof(p_valeur) = 'array' then coalesce(p_valeur -> 0, 'null'::jsonb)
    else coalesce(p_valeur, 'null'::jsonb)
  end;
  insert into public.etat_historique (cabinet_id, cle, version, valeur, ecrit_par)
  values (v_cab, p_cle, v_nouvelle, v_trace, auth.uid());

  return v_nouvelle;
end;
$$;

revoke all on function public.etat_ecrire(text, jsonb, bigint) from public;
grant execute on function public.etat_ecrire(text, jsonb, bigint) to authenticated;

-- --------------------------------------------------------------- 5. temps réel

-- Ce qu'un membre de l'équipe enregistre apparaît chez les autres sans
-- recharger la page. La règle de lecture ci-dessus s'applique aussi à ce
-- canal : on ne reçoit que les lignes de son cabinet.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'etat_cabinet'
     ) then
    execute 'alter publication supabase_realtime add table public.etat_cabinet';
  end if;
end
$$;
