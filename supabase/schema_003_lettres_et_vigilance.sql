-- ComplyEC — schéma Phase 2 : ce que la phase 1 ne couvrait pas encore
--
-- Fait suite à schema.sql puis schema_002_donnees_metier.sql. À exécuter dans
-- l'éditeur SQL du projet Supabase, une seule fois, dans cet ordre.
--
-- Ce fichier ajoute les tables et colonnes correspondant aux écrans construits
-- depuis la phase 1 : réglages du cabinet, lettres de mission, dépendance
-- économique, connaissance de la relation d'affaires (bénéficiaire effectif,
-- PPE, origine des fonds), formation d'accueil LBC-FT et conservation des
-- justificatifs, réponses du manuel de procédures.
--
-- Comme en phase 1, chaque ligne porte un cabinet_id et les policies RLS
-- s'appuient sur les fonctions SECURITY DEFINER user_cabinet_id() et
-- is_ec_of_cabinet() déjà créées.

-- =====================================================================
-- 0. Correction : une catégorie d'anomalie manquait à la contrainte
-- =====================================================================
--
-- CATEGORIES_ANOMALIES comporte « ldm_non_actualisee » (lettre de mission
-- trop ancienne), absente du check de la phase 1 : toute insertion de cette
-- catégorie aurait été rejetée par Postgres.

alter table public.anomalies drop constraint if exists anomalies_categorie_check;
alter table public.anomalies add constraint anomalies_categorie_check
  check (categorie in (
    'lettre_mission', 'ldm_non_actualisee', 'piece_expiree',
    'document_manquant', 'classement_non_conforme', 'supervision_manquante'
  ));

-- =====================================================================
-- 1. Réglages du cabinet
-- =====================================================================
--
-- Aucun texte ne chiffre ces seuils : ce sont les règles que le cabinet se
-- donne, et une seule valeur doit servir partout (écrans, documents générés,
-- manuel de procédures). Les valeurs par défaut reprennent celles du logiciel.

alter table public.cabinets add column if not exists seuil_dependance numeric(5,2) not null default 10;
alter table public.cabinets add column if not exists ldm_revision_mois int not null default 12;
alter table public.cabinets add column if not exists sessions_lbcft_par_an int not null default 2;

-- Article R. 561-23 du code monétaire et financier : le cabinet désigne un
-- déclarant (habilité à signer les déclarations de soupçon de l'article
-- L. 561-15) et un correspondant (interlocuteur de Tracfin), et communique
-- leur identité à Tracfin et à l'autorité de contrôle. Les deux rôles sont
-- distincts, même tenus par la même personne.
alter table public.cabinets add column if not exists declarant_tracfin text;
alter table public.cabinets add column if not exists correspondant_tracfin text;
alter table public.cabinets add column if not exists tracfin_declare_au_service boolean not null default false;

-- =====================================================================
-- 2. Collaborateurs : dates d'entrée et de sortie
-- =====================================================================
--
-- Nécessaires à l'article D. 561-38-1-1 (décret n° 2026-310 du 24 avril 2026) :
-- la formation LBC-FT est due dès l'embauche, et les justificatifs se
-- conservent pendant toute la durée des fonctions puis cinq ans après le
-- départ. Sans ces deux dates, ni l'une ni l'autre ne peut être établie.

alter table public.profiles add column if not exists fonction text;
alter table public.profiles add column if not exists date_embauche date;
alter table public.profiles add column if not exists date_depart date;

-- Un collaborateur parti n'est plus dans les effectifs mais reste au registre
-- de formation : cette vue donne les personnes encore sous obligation de
-- conservation des justificatifs.
create or replace view public.registre_formation_conservation as
  select
    p.id, p.cabinet_id, p.nom, p.prenom, p.fonction,
    p.date_embauche, p.date_depart,
    (p.date_depart + interval '5 years')::date as conserver_jusqu_au
  from public.profiles p
  where p.date_depart is not null
    and p.date_depart + interval '5 years' >= current_date;

-- Formation LBC-FT d'accueil, distincte des sessions annuelles : elle se donne
-- à l'arrivée de la personne, pas au rythme du programme du cabinet.
create table if not exists public.formations_accueil (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id() references public.cabinets(id) on delete cascade,
  collaborateur_id uuid not null unique references public.profiles(id) on delete cascade,
  date date not null,
  organisme text,
  justificatif_url text,
  created_at timestamptz not null default now()
);

create index if not exists formations_accueil_cabinet_id_idx on public.formations_accueil (cabinet_id);

alter table public.formations_accueil enable row level security;

drop policy if exists "formations_accueil: lecture au sein du cabinet" on public.formations_accueil;
create policy "formations_accueil: lecture au sein du cabinet"
  on public.formations_accueil for select
  using (cabinet_id = public.user_cabinet_id());

drop policy if exists "formations_accueil: gestion par l'EC du cabinet" on public.formations_accueil;
create policy "formations_accueil: gestion par l'EC du cabinet"
  on public.formations_accueil for all
  using (public.is_ec_of_cabinet(cabinet_id))
  with check (public.is_ec_of_cabinet(cabinet_id));

-- =====================================================================
-- 3. Lettres de mission
-- =====================================================================
--
-- Article 151 du décret n° 2012-432 : contrat écrit définissant la mission,
-- les droits et obligations de chacun et les conditions financières.
--
-- L'absence de ligne pour un dossier signifie « aucune lettre de mission » :
-- c'est cette table, et elle seule, qui dit si une lettre existe et depuis
-- quand. Les anomalies de catégorie « lettre_mission » et
-- « ldm_non_actualisee » s'en déduisent — elles ne la contredisent pas.

create table if not exists public.lettres_mission (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id() references public.cabinets(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  version int not null default 1,
  date_signature date,
  derniere_actualisation date,
  signataire text,
  cabinet_emetteur text,
  categorie text,
  honoraires_mensuels_ht numeric(10,2),
  honoraires_annuels_ht numeric(10,2),
  nom_fichier text,
  fichier_url text,
  -- Rempli quand la lettre a été produite par ComplyEC : le nom de fichier
  -- structuré permet de la reconnaître sans l'ouvrir.
  generee_par_logiciel boolean not null default false,
  created_at timestamptz not null default now(),
  unique (dossier_id, version)
);

create index if not exists lettres_mission_cabinet_id_idx on public.lettres_mission (cabinet_id);
create index if not exists lettres_mission_dossier_id_idx on public.lettres_mission (dossier_id);

alter table public.lettres_mission enable row level security;

drop policy if exists "lettres_mission: lecture au sein du cabinet" on public.lettres_mission;
create policy "lettres_mission: lecture au sein du cabinet"
  on public.lettres_mission for select
  using (cabinet_id = public.user_cabinet_id());

-- L'EC et le collaborateur en charge du dossier peuvent produire une lettre.
drop policy if exists "lettres_mission: creation au sein du cabinet" on public.lettres_mission;
create policy "lettres_mission: creation au sein du cabinet"
  on public.lettres_mission for insert
  with check (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

drop policy if exists "lettres_mission: modification au sein du cabinet" on public.lettres_mission;
create policy "lettres_mission: modification au sein du cabinet"
  on public.lettres_mission for update
  using (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

-- Supprimer une lettre de mission revient à effacer une preuve : réservé à l'EC.
drop policy if exists "lettres_mission: suppression par l'EC du cabinet" on public.lettres_mission;
create policy "lettres_mission: suppression par l'EC du cabinet"
  on public.lettres_mission for delete
  using (public.is_ec_of_cabinet(cabinet_id));

-- Analyses des lettres anciennes déposées dans l'outil de régularisation.
create table if not exists public.lettres_mission_analyses (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id() references public.cabinets(id) on delete cascade,
  dossier_id uuid references public.dossiers(id) on delete set null,
  nom_fichier text not null,
  date_analyse date not null default current_date,
  mission_presentation boolean,
  annee_la_plus_recente int,
  score int,
  -- Rubriques présentes/manquantes et alertes, telles que produites par
  -- l'analyse : conservées pour pouvoir justifier la conclusion plus tard.
  rubriques jsonb not null default '[]'::jsonb,
  alertes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lettres_mission_analyses_cabinet_id_idx on public.lettres_mission_analyses (cabinet_id);

alter table public.lettres_mission_analyses enable row level security;

drop policy if exists "ldm_analyses: lecture au sein du cabinet" on public.lettres_mission_analyses;
create policy "ldm_analyses: lecture au sein du cabinet"
  on public.lettres_mission_analyses for select
  using (cabinet_id = public.user_cabinet_id());

drop policy if exists "ldm_analyses: ecriture au sein du cabinet" on public.lettres_mission_analyses;
create policy "ldm_analyses: ecriture au sein du cabinet"
  on public.lettres_mission_analyses for all
  using (cabinet_id = public.user_cabinet_id())
  with check (cabinet_id = public.user_cabinet_id());

-- =====================================================================
-- 4. Dépendance économique
-- =====================================================================
--
-- Article 146 du décret n° 2012-432 : le professionnel évite toute situation
-- pouvant faire présumer d'un manque d'indépendance. Aucun texte ne chiffre
-- de seuil : c'est cabinets.seuil_dependance qui le porte, et la liste des
-- dossiers concernés se déduit de la part réelle des honoraires.

create table if not exists public.dependance_economique (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id() references public.cabinets(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  exercice int not null,
  part_honoraires numeric(5,2) not null,
  mesures text,
  note_etablie_le date,
  note_url text,
  unique (dossier_id, exercice)
);

create index if not exists dependance_economique_cabinet_id_idx on public.dependance_economique (cabinet_id);

alter table public.dependance_economique enable row level security;

drop policy if exists "dependance: lecture au sein du cabinet" on public.dependance_economique;
create policy "dependance: lecture au sein du cabinet"
  on public.dependance_economique for select
  using (cabinet_id = public.user_cabinet_id());

drop policy if exists "dependance: gestion par l'EC du cabinet" on public.dependance_economique;
create policy "dependance: gestion par l'EC du cabinet"
  on public.dependance_economique for all
  using (public.is_ec_of_cabinet(cabinet_id))
  with check (public.is_ec_of_cabinet(cabinet_id));

-- =====================================================================
-- 5. Connaissance de la relation d'affaires (LBC-FT)
-- =====================================================================
--
-- La classification à quatre critères de la phase 1 ne dit ni qui est derrière
-- le client, ni s'il est politiquement exposé, ni d'où vient l'argent. Ce sont
-- pourtant les trois points qu'un contrôleur ouvre en premier :
--   - bénéficiaire effectif : CMF art. L. 561-2-2 (définition) et L. 561-5
--     (identification et vérification de l'identité) ;
--   - personne politiquement exposée : CMF art. R. 561-18 ;
--   - origine du patrimoine et des fonds : CMF art. R. 561-20-2.

alter table public.vigilance_analyses add column if not exists ppe_statut text
  check (ppe_statut in ('non', 'oui', 'a_verifier'));
alter table public.vigilance_analyses add column if not exists ppe_detail text;
alter table public.vigilance_analyses add column if not exists origine_fonds_etat text
  check (origine_fonds_etat in ('documentee', 'partielle', 'a_faire'));
alter table public.vigilance_analyses add column if not exists origine_fonds_detail text;

-- Un dossier peut avoir plusieurs bénéficiaires effectifs, chacun avec sa
-- quote-part et la pièce sur laquelle son identité a été vérifiée. Une table
-- plutôt qu'un jsonb : on veut pouvoir compter ceux dont l'identité n'est pas
-- vérifiée sans lire chaque dossier.
create table if not exists public.beneficiaires_effectifs (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id() references public.cabinets(id) on delete cascade,
  dossier_id uuid not null references public.dossiers(id) on delete cascade,
  nom text not null,
  part numeric(5,2),
  identite_verifiee boolean not null default false,
  piece_justificative text,
  date_verification date,
  created_at timestamptz not null default now()
);

create index if not exists beneficiaires_effectifs_cabinet_id_idx on public.beneficiaires_effectifs (cabinet_id);
create index if not exists beneficiaires_effectifs_dossier_id_idx on public.beneficiaires_effectifs (dossier_id);

alter table public.beneficiaires_effectifs enable row level security;

drop policy if exists "beneficiaires: lecture au sein du cabinet" on public.beneficiaires_effectifs;
create policy "beneficiaires: lecture au sein du cabinet"
  on public.beneficiaires_effectifs for select
  using (cabinet_id = public.user_cabinet_id());

drop policy if exists "beneficiaires: ecriture par l'EC ou le collaborateur du dossier" on public.beneficiaires_effectifs;
create policy "beneficiaires: ecriture par l'EC ou le collaborateur du dossier"
  on public.beneficiaires_effectifs for all
  using (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  )
  with check (
    cabinet_id = public.user_cabinet_id()
    and (
      public.is_ec_of_cabinet(cabinet_id)
      or exists (select 1 from public.dossiers d where d.id = dossier_id and d.collaborateur_id = auth.uid())
    )
  );

-- =====================================================================
-- 6. Manuel de procédures : les réponses, pas seulement le texte
-- =====================================================================
--
-- La phase 1 ne stockait que `contenu`. Conserver les réponses permet de
-- rouvrir un chapitre, de le modifier et de régénérer le document sans tout
-- ressaisir — et de savoir quels passages restent à compléter.

alter table public.manuel_chapitres add column if not exists reponses jsonb not null default '{}'::jsonb;
alter table public.manuel_chapitres add column if not exists ordre int;

-- =====================================================================
-- 7. Traces à conserver pour le contrôle qualité
-- =====================================================================
--
-- Les écrans produisent aujourd'hui des documents (fiche de vigilance, note de
-- dépendance, registre de formation, dossier de contrôle, manuel) sans en
-- garder trace. Un contrôleur demande la pièce datée, pas l'écran.

create table if not exists public.documents_generes (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id() references public.cabinets(id) on delete cascade,
  dossier_id uuid references public.dossiers(id) on delete set null,
  type text not null check (type in (
    'lettre_mission', 'fiche_vigilance', 'note_dependance', 'manuel_procedures',
    'registre_formation', 'dossier_controle', 'cartographie_risques', 'courrier_reprise'
  )),
  nom_fichier text not null,
  genere_le timestamptz not null default now(),
  genere_par uuid references public.profiles(id) on delete set null,
  fichier_url text
);

create index if not exists documents_generes_cabinet_id_idx on public.documents_generes (cabinet_id);
create index if not exists documents_generes_type_idx on public.documents_generes (cabinet_id, type);

alter table public.documents_generes enable row level security;

drop policy if exists "documents: lecture au sein du cabinet" on public.documents_generes;
create policy "documents: lecture au sein du cabinet"
  on public.documents_generes for select
  using (cabinet_id = public.user_cabinet_id());

drop policy if exists "documents: creation au sein du cabinet" on public.documents_generes;
create policy "documents: creation au sein du cabinet"
  on public.documents_generes for insert
  with check (cabinet_id = public.user_cabinet_id());

-- Une trace ne se réécrit pas : pas de policy UPDATE. Seul l'EC peut supprimer.
drop policy if exists "documents: suppression par l'EC du cabinet" on public.documents_generes;
create policy "documents: suppression par l'EC du cabinet"
  on public.documents_generes for delete
  using (public.is_ec_of_cabinet(cabinet_id));
