-- ComplyEC — schéma Phase 1 : données métier du cabinet
--
-- Fait suite à schema.sql (cabinets, profiles). Ajoute les tables qui
-- remplacent les données de démonstration figées dans data.js : dossiers
-- clients, anomalies, vigilance LBC-FT, bilans, formations, déclarations
-- d'indépendance, diffusion des procédures, manuel de procédures — plus
-- l'identité du cabinet (logo, signature).
--
-- Toutes les tables suivent le même principe que schema.sql : chaque ligne
-- porte un cabinet_id, et les policies RLS s'appuient sur les fonctions
-- SECURITY DEFINER déjà créées (user_cabinet_id, is_ec_of_cabinet) pour
-- éviter tout risque de récursion RLS ou de fuite entre cabinets.
--
-- À exécuter dans l'éditeur SQL du projet Supabase, après schema.sql,
-- une seule fois.

-- ---------------------------------------------------------------- identité du cabinet

alter table public.cabinets add column if not exists adresse text;
alter table public.cabinets add column if not exists telephone text;
alter table public.cabinets add column if not exists logo_url text;
alter table public.cabinets add column if not exists signature text;

-- Seul l'EC du cabinet peut modifier son identité (logo, adresse...).
create policy "cabinet: modification par l'EC du cabinet"
  on public.cabinets for update
  using (public.is_ec_of_cabinet(id));

-- ---------------------------------------------------------------- dossiers (clients)

create table public.dossiers (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  nom text not null,
  forme text,
  siret text,
  dirigeant text,
  activite text,
  adresse text,
  collaborateur_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index dossiers_cabinet_id_idx on public.dossiers (cabinet_id);
create index dossiers_collaborateur_id_idx on public.dossiers (collaborateur_id);

alter table public.dossiers enable row level security;

create policy "dossiers: lecture au sein du cabinet"
  on public.dossiers for select
  using (cabinet_id = public.user_cabinet_id());

create policy "dossiers: creation au sein du cabinet"
  on public.dossiers for insert
  with check (cabinet_id = public.user_cabinet_id());

create policy "dossiers: modification au sein du cabinet"
  on public.dossiers for update
  using (cabinet_id = public.user_cabinet_id());

-- Seul l'EC peut supprimer un dossier (un collaborateur ne doit jamais
-- pouvoir faire disparaître un client de sa propre initiative).
create policy "dossiers: suppression par l'EC du cabinet"
  on public.dossiers for delete
  using (public.is_ec_of_cabinet(cabinet_id));

-- ---------------------------------------------------------------- anomalies (+ relances)
--
-- Une "relance" n'est pas une table séparée : c'est une anomalie dont
-- date_demande_ec est renseignée (voir relancesList() dans data.js, qui
-- filtre déjà ainsi côté client).

create table public.anomalies (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  categorie text not null check (categorie in ('lettre_mission', 'piece_expiree', 'document_manquant', 'classement_non_conforme', 'supervision_manquante')),
  collaborateur_id uuid references public.profiles(id) on delete set null,
  priorite text not null check (priorite in ('Critique', 'Haute', 'Moyenne', 'Faible')),
  titre text not null,
  description text,
  date_detection date,
  dernier_action text,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'en_retard', 'termine')),
  date_demande_ec date,
  commentaire text,
  created_at timestamptz not null default now()
);

create index anomalies_cabinet_id_idx on public.anomalies (cabinet_id);
create index anomalies_dossier_id_idx on public.anomalies (dossier_id);
create index anomalies_collaborateur_id_idx on public.anomalies (collaborateur_id);

alter table public.anomalies enable row level security;

create policy "anomalies: lecture au sein du cabinet"
  on public.anomalies for select
  using (cabinet_id = public.user_cabinet_id());

create policy "anomalies: creation par l'EC du cabinet"
  on public.anomalies for insert
  with check (public.is_ec_of_cabinet(cabinet_id));

-- Un collaborateur ne modifie (statut, dernier_action...) que les anomalies
-- qui lui sont assignées ; l'EC modifie tout dans son cabinet.
create policy "anomalies: modification au sein du cabinet"
  on public.anomalies for update
  using (
    cabinet_id = public.user_cabinet_id()
    and (public.is_ec_of_cabinet(cabinet_id) or collaborateur_id = auth.uid())
  );

create policy "anomalies: suppression par l'EC du cabinet"
  on public.anomalies for delete
  using (public.is_ec_of_cabinet(cabinet_id));

-- ---------------------------------------------------------------- vigilance LBC-FT
--
-- Une ligne par dossier (upsert) : l'absence de ligne pour un dossier
-- signifie "analyse à lancer", exactement comme DOSSIERS_LBCFT_A_LANCER
-- dans data.js aujourd'hui.

create table public.vigilance_analyses (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  dossier_id uuid not null unique references public.dossiers(id) on delete cascade,
  adresse text,
  classification jsonb not null,
  niveau_calcule text not null,
  niveau_retenu text not null,
  operations_particulieres text[] not null default '{}',
  justification text,
  derniere_analyse date not null default current_date,
  updated_at timestamptz not null default now()
);

create index vigilance_analyses_cabinet_id_idx on public.vigilance_analyses (cabinet_id);

alter table public.vigilance_analyses enable row level security;

create policy "vigilance: lecture au sein du cabinet"
  on public.vigilance_analyses for select
  using (cabinet_id = public.user_cabinet_id());

-- Seuls l'EC et le collaborateur assigné au dossier peuvent créer/modifier
-- son analyse de vigilance.
create policy "vigilance: creation au sein du cabinet"
  on public.vigilance_analyses for insert
  with check (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

create policy "vigilance: modification au sein du cabinet"
  on public.vigilance_analyses for update
  using (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------- bilans / note de synthèse
--
-- Même enregistrement pour le "bilan" (vue EC, structurée) et la "note de
-- synthèse" (formulaire collaborateur, texte libre) : rentabilite/problemes/
-- continuite sont des jsonb qui acceptent les deux formes ({statut,label}
-- ou {label} en texte libre), pour rester compatibles avec les deux écrans
-- existants sans les faire diverger.

create table public.bilans (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  exercice int not null,
  collaborateur_id uuid references public.profiles(id) on delete set null,
  date_preparation date,
  statut text not null default 'Brouillon',
  rentabilite jsonb,
  problemes jsonb,
  continuite jsonb,
  sujets text,
  commentaire_ec text,
  date_commentaire_ec date,
  commentaire_collab text,
  date_commentaire_collab date,
  unique (dossier_id, exercice)
);

create index bilans_cabinet_id_idx on public.bilans (cabinet_id);

alter table public.bilans enable row level security;

create policy "bilans: lecture au sein du cabinet"
  on public.bilans for select
  using (cabinet_id = public.user_cabinet_id());

-- Un collaborateur ne prépare/modifie que le bilan des dossiers qui lui
-- sont assignés (note de synthèse) ; l'EC prépare/commente tout.
create policy "bilans: creation au sein du cabinet"
  on public.bilans for insert
  with check (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

create policy "bilans: modification au sein du cabinet"
  on public.bilans for update
  using (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------- formations LBC-FT

create table public.formations_sessions (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  annee int not null,
  titre text not null,
  date date,
  organisme text,
  created_at timestamptz not null default now()
);

create table public.formations_participations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.formations_sessions(id) on delete cascade,
  collaborateur_id uuid not null references public.profiles(id) on delete cascade,
  attestation_recue boolean not null default false,
  date_reception date,
  unique (session_id, collaborateur_id)
);

create index formations_sessions_cabinet_id_idx on public.formations_sessions (cabinet_id);
create index formations_participations_session_id_idx on public.formations_participations (session_id);

alter table public.formations_sessions enable row level security;
alter table public.formations_participations enable row level security;

create policy "formations_sessions: lecture au sein du cabinet"
  on public.formations_sessions for select
  using (cabinet_id = public.user_cabinet_id());

create policy "formations_sessions: gestion par l'EC du cabinet"
  on public.formations_sessions for all
  using (public.is_ec_of_cabinet(cabinet_id))
  with check (public.is_ec_of_cabinet(cabinet_id));

-- Les participations se lisent/modifient via la session parente : un
-- collaborateur doit voir (et déposer son attestation sur) ses propres
-- lignes, l'EC gère tout.
create policy "formations_participations: lecture au sein du cabinet"
  on public.formations_participations for select
  using (
    exists (select 1 from public.formations_sessions s where s.id = session_id and s.cabinet_id = public.user_cabinet_id())
  );

create policy "formations_participations: creation par l'EC du cabinet"
  on public.formations_participations for insert
  with check (
    exists (select 1 from public.formations_sessions s where s.id = session_id and public.is_ec_of_cabinet(s.cabinet_id))
  );

-- Un collaborateur ne dépose son attestation que sur sa propre ligne ;
-- l'EC peut tout modifier (relance, correction...).
create policy "formations_participations: modification au sein du cabinet"
  on public.formations_participations for update
  using (
    collaborateur_id = auth.uid()
    or exists (select 1 from public.formations_sessions s where s.id = session_id and public.is_ec_of_cabinet(s.cabinet_id))
  );

-- ---------------------------------------------------------------- déclarations d'indépendance

create table public.declarations_independance (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  collaborateur_id uuid not null references public.profiles(id) on delete cascade,
  exercice int not null,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'signee')),
  date_signature date,
  unique (collaborateur_id, exercice)
);

create index declarations_independance_cabinet_id_idx on public.declarations_independance (cabinet_id);

alter table public.declarations_independance enable row level security;

create policy "declarations: lecture au sein du cabinet"
  on public.declarations_independance for select
  using (cabinet_id = public.user_cabinet_id());

-- L'EC amorce la ligne "en_attente" (ou la crée via un job annuel) ; seul
-- le collaborateur concerné peut la signer (passer à statut = 'signee').
create policy "declarations: creation par l'EC du cabinet"
  on public.declarations_independance for insert
  with check (public.is_ec_of_cabinet(cabinet_id));

create policy "declarations: signature par le collaborateur concerne"
  on public.declarations_independance for update
  using (collaborateur_id = auth.uid() and cabinet_id = public.user_cabinet_id())
  with check (collaborateur_id = auth.uid() and cabinet_id = public.user_cabinet_id());

-- ---------------------------------------------------------------- diffusion des procédures

create table public.procedures_versions (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  version text not null,
  date_diffusion date not null default current_date,
  resume text,
  created_at timestamptz not null default now()
);

create table public.procedures_accuses (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.procedures_versions(id) on delete cascade,
  collaborateur_id uuid not null references public.profiles(id) on delete cascade,
  signe boolean not null default false,
  date_signature date,
  unique (version_id, collaborateur_id)
);

create index procedures_versions_cabinet_id_idx on public.procedures_versions (cabinet_id);
create index procedures_accuses_version_id_idx on public.procedures_accuses (version_id);

alter table public.procedures_versions enable row level security;
alter table public.procedures_accuses enable row level security;

create policy "procedures_versions: lecture au sein du cabinet"
  on public.procedures_versions for select
  using (cabinet_id = public.user_cabinet_id());

create policy "procedures_versions: creation par l'EC du cabinet"
  on public.procedures_versions for insert
  with check (public.is_ec_of_cabinet(cabinet_id));

create policy "procedures_accuses: lecture au sein du cabinet"
  on public.procedures_accuses for select
  using (
    exists (select 1 from public.procedures_versions v where v.id = version_id and v.cabinet_id = public.user_cabinet_id())
  );

-- Seul le collaborateur concerné peut signer son propre accusé de lecture.
create policy "procedures_accuses: signature par le collaborateur concerne"
  on public.procedures_accuses for update
  using (collaborateur_id = auth.uid())
  with check (collaborateur_id = auth.uid());

create policy "procedures_accuses: creation au sein du cabinet"
  on public.procedures_accuses for insert
  with check (
    exists (select 1 from public.procedures_versions v where v.id = version_id and v.cabinet_id = public.user_cabinet_id())
  );

-- ---------------------------------------------------------------- manuel de procédures

create table public.manuel_chapitres (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null references public.cabinets(id) on delete cascade,
  slug text not null,
  titre text not null,
  statut text not null default 'manquant' check (statut in ('a_jour', 'a_reviser', 'manquant')),
  derniere_maj date,
  contenu text,
  unique (cabinet_id, slug)
);

create index manuel_chapitres_cabinet_id_idx on public.manuel_chapitres (cabinet_id);

alter table public.manuel_chapitres enable row level security;

create policy "manuel_chapitres: lecture au sein du cabinet"
  on public.manuel_chapitres for select
  using (cabinet_id = public.user_cabinet_id());

create policy "manuel_chapitres: gestion par l'EC du cabinet"
  on public.manuel_chapitres for all
  using (public.is_ec_of_cabinet(cabinet_id))
  with check (public.is_ec_of_cabinet(cabinet_id));
