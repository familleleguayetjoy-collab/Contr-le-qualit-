# Inspection de l'architecture avant modification

Rapport demandé au § 29 du prompt complémentaire. Aucune modification
structurelle n'a été faite avant sa remise. Chaque affirmation renvoie au
fichier et à la ligne où elle se vérifie.

---

## 1. Le modèle de données existant concernant les dossiers

### En mode démonstration (mode actif aujourd'hui, `DB_MODE = 'demo'`, db.js:27)

La base des dossiers est une constante figée : `CLIENTS`, data.js:92, quinze
lignes. Champs réellement présents :

| Champ | Exemple | Commentaire |
|---|---|---|
| `id` | `'sas-nova'` | identifiant interne, sous forme de slug, stable |
| `nom` | `'SAS NOVA'` | |
| `forme` | `'SAS'` | |
| `siret` | `'812 345 678 00014'` | SIRET seul, pas de SIREN distinct |
| `collaborateur` | `'nathalie'` | valeur d'origine, recouvrable (voir § 4) |
| `dirigeant` | `'Claire Nova'` | |
| `activite` | `'Conseil en communication'` | |

Lecture par `client(id)`, data.js:110. Il n'existe **aucune** fonction
`dbDossiers()` : les écrans lisent `CLIENTS` directement ou via `client()`.

**Champs demandés par le prompt et absents :** statut du dossier (entrée en
mission / actif / sorti), expert-comptable responsable, lien Drive, source de
création (import Excel / ajout manuel / lettre de reprise), SIREN comme champ
propre.

### En mode Supabase (migrations non exécutées)

Table `public.dossiers`, supabase/schema_002_donnees_metier.sql:32 :
`id uuid`, `cabinet_id`, `nom`, `forme`, `siret`, `dirigeant`, `activite`,
`adresse`, `collaborateur_id`, `created_at`. RLS activée, lecture au sein du
cabinet, suppression réservée à l'EC. Mêmes champs manquants que ci-dessus,
plus `adresse` en plus.

### Point important : il existe déjà une seconde liste parallèle

`e.clients` (db.js:604) est une liste de dossiers **distincte de `CLIENTS`**,
alimentée par `dbImporterListeClients()` (db.js:1252) et lue par exactement
deux fonctions : `dbClientsImportes()` (db.js:1250) et `dbNombreDeClients()`
(db.js:1260), qui n'en tire qu'un comptage pour le manuel.

C'est précisément le cas que le prompt interdit : un import de portefeuille qui
ne nourrit rien d'autre qu'un compteur. Les anomalies, la LCB-FT, le suivi RBE
et les attributions ne voient pas ces lignes.

---

## 2. Comment les dossiers sont actuellement créés

**Réponse courte : ils ne le sont pas.** `CLIENTS` est une constante littérale.
Il y a trois endroits qui en donnent l'apparence, et aucun n'écrit dans la base
lue par les écrans.

### a. Import du manuel, `ImportClients` (manuel.js)

Chaîne : `parseFeuilleDeCalcul()` puis `extraireLignesDossiers()` (utils.js:749)
puis `dbImporterListeClients()` (db.js:1252) qui écrit dans `e.clients`.
Colonnes reconnues : nom, forme, siren/siret, collaborateur
(`IMPORT_CLIENTS_COLONNES`, data.js:3579 ; motifs de détection automatique
dans `extraireLignesDossiers`). Résultat : un comptage, rien de plus.

À noter, `extraireLignesDossiers` marque `valid: !!(nom && siren)`,
utils.js:763 : une ligne sans SIREN est déclarée invalide. Le prompt demande le
nom comme seul minimum.

### b. Import de régularisation, `RegularisationAnciensDossiers` (utils.js:768)

Chaîne : même lecture de fichier, puis `dbImporterDossiers()` (db.js:144) qui
fait un `insert` dans la table Supabase `dossiers`, et **retourne
`{ ecrits: 0, demo: true }` sans rien écrire en mode démonstration** (db.js:145).
L'écran le dit honnêtement dans son message (utils.js:838).

Cet écran contient déjà le rapprochement de collaborateur demandé au prompt :
`matchCollaborateur()` (utils.js:787), nom complet puis prénom seul, et
**jamais d'attribution au hasard** ; les lignes non rapprochées passent quand
même, avec un décompte affiché (utils.js:836).

Il n'est atteignable que depuis l'espace collaborateur (app.js:119,
utils.js:574). L'expert-comptable n'y a pas accès.

Son bouton de dépôt de fichier est encore un `<label>` enveloppant un `input`
masqué (utils.js:857), donc inatteignable au clavier. Le même défaut a déjà été
corrigé ailleurs.

### c. Fin de la contractualisation (wizard.js:1605)

```js
onClick: () => {
  showToast('Dossier créé — lettre, analyse LBC-FT et demandes enregistrées.');
  if (onFinish) onFinish();
}
```

Aucune écriture. Le message affirme une création qui n'a pas lieu, et
l'enregistrement de l'analyse LCB-FT annoncé ne se produit pas non plus
(`dbEnregistrerAnalyse` n'est pas appelé depuis ce bouton). C'est un écart à la
règle n° 1, rubrique « dire la vérité sur l'état du produit ».

Même situation à la fin de la reprise déontologique (wizard.js:347) : un toast,
et rien d'autre.

---

## 3. Comment ils sont reliés au Drive

**Il n'existe aucun lien entre un dossier et un emplacement Drive.** Aucun
champ `driveUrl`, `lienDrive`, `drive_url` ou équivalent, ni dans `CLIENTS`, ni
dans la table `dossiers`, ni dans le calque de démonstration. Vérifié par
recherche sur l'ensemble des sources.

Ce qui existe :

- `DRIVE_TREE` (data.js:1140) : le **plan de classement type** du cabinet,
  quatre racines (dossier permanent, comptable, juridique, social), avec
  exercices dérivés de `ANNEES_REPRISE`. C'est un modèle d'arborescence, pas un
  chemin réel.
- `capacite('drive')` (db.js:505) : `available: false`, `mode: 'unavailable'`,
  motif « Le connecteur Drive n'est pas encore paramétré ».
- L'étape 2 de la contractualisation laisse cocher les sous-dossiers à créer,
  et son bouton de finalisation (wizard.js:1596) affiche selon la capacité soit
  « Arborescence créée », soit « Arborescence type retenue : N emplacements à
  créer dans votre Drive. ComplyEC n'y est pas raccordé. » Ce point est honnête.
- `driveManques()` (anomalies.js:160) retourne `DRIVE_MANQUES_DEMO`, dix-sept
  lignes du jeu d'essai. C'est le point d'entrée unique prévu pour le futur
  scan réel, documenté comme tel en tête de anomalies.js.

**Les trois états demandés (lié / non trouvé / à confirmer) n'existent nulle
part.**

---

## 4. Comment ils sont affectés aux collaborateurs

C'est la partie la plus propre de l'existant, et elle est déjà conforme à ce
que demande le prompt.

- `dbAttributionDossier(dossierId)` (db.js:1196) : renvoie l'attribution
  personnalisée du calque si elle existe, sinon la valeur d'origine du dossier.
- `dbDossiersDuCollaborateur(collabId)` (db.js:1204) : filtre inverse.
- `dbMajAttribution(dossierId, collabId)` (db.js:1208) : écrit dans le calque et
  journalise.
- Saisie dans Paramètres > Utilisateurs (`PanneauUtilisateur`, parametres.js).
- Les anomalies s'en servent déjà pour savoir à qui adresser une relance :
  `anomaliesDossiers()` (anomalies.js:189) appelle `dbAttributionDossier`, pas
  `client().collaborateur`.

Collaborateurs : `COLLABORATEURS` (data.js:6), cinq lignes, champs `id`, `nom`,
`role`, `initiales`, `couleur`. **Aucune adresse e-mail.** En base, la table
`profiles` (schema.sql:31) porte bien un `email text not null`.

Il n'existe pas de notion de « collaborateur à affecter » : un dossier sans
attribution renvoie simplement `null`, et rien ne le regroupe.

---

## 5. Où sont stockées les analyses LCB-FT

Un seul endroit, et c'est bien fait.

- Semences : `DOSSIERS_LBCFT_DETAIL` (data.js:1328), douze dossiers analysés,
  puis `DOSSIERS_LBCFT` (data.js:1415) qui projette **tous** les `CLIENTS` :
  ceux sans détail reçoivent `{ statut: 'a_lancer', derniereAnalyse: null }`.
  Le portefeuille est donc déjà exhaustif.
- Calque : `e.vigilances`, clé = id du dossier (db.js:589).
- Lecture : `dbVigilanceDossiers()` (db.js:873), semence recouverte du calque.
- Écriture : `dbEnregistrerAnalyse(dossierId, analyse)` (db.js:880), qui pose
  `statut: 'complete'`, date du jour et validateur, et journalise.
- En base : table `vigilance_analyses` (schema_002:132), une ligne par dossier
  en upsert, l'absence de ligne valant « à lancer ».
- Cartographie : `cartographieStats()` (data.js:1435) compte séparément
  `analyses` et `nonAnalyses`. **Les dossiers non analysés ne sont donc jamais
  comptés en risque faible**, ce que le prompt exige.

Écran : `LbcftPortefeuille` (lbcft.js:35). Les dossiers non analysés y
apparaissent avec un badge gris « à analyser » (lbcft.js:55), et le bouton de
leur fiche est intitulé « Mettre à jour la vigilance » (lbcft.js:87), qui ouvre
`onMettreAJour` puis le parcours de vigilance existant en plein écran
(lbcft.js:630, `RubriqueLbcft`).

Le seul écart au prompt est donc **un intitulé** : « Mettre à jour la
vigilance » sur un dossier jamais analysé, là où le prompt veut « Faire
l'analyse ». Le parcours ouvert derrière est déjà le bon.

---

## 6. Où est stocké l'état RBE

La séparation entre donnée métier et preuve documentaire, exigée par le prompt,
**existe déjà et est documentée dans le code** (db.js, commentaire précédant
`dbSuiviRbe`).

### Donnée métier LCB-FT

- Semence : `CAMPAGNE_RBE` (data.js:2852), six lignes, champs `dossier`,
  `consulteLe`, `par`, `resultat` (`concordant` | `divergence`),
  `beneficiaires`, `divergence`.
- Calque : `e.rbe` (db.js:590).
- Lecture : `dbCampagneRbe()` (db.js:892), et `dbSuiviRbe()` (db.js:1489) qui
  projette sur **tous** les `CLIENTS` et indique la provenance de chaque ligne
  (`'contractualisation'` ou `'saisie'`).
- Écritures : `dbEnregistrerRbe()` (db.js:897) depuis le parcours de vigilance,
  `dbEnregistrerSuiviRbe()` (db.js:1508) depuis l'écran de suivi, qui pose
  `saisieDirecte: true`.
- Écran : LCB-FT > Suivi RBE (`SuiviRbe`, lbcft.js).
- En base : table `beneficiaires_effectifs` (schema_003:271).

### Preuve documentaire

- Type d'anomalie `rbe_justificatif_absent` (anomalies.js), onglet `rbe`, pièce
  attendue « le justificatif de consultation du registre des bénéficiaires
  effectifs ».
- Constaté par `driveManques()`, jamais par la campagne.
- Écran : Anomalies > RBE.

Les deux ne se croisent nulle part dans le code. Rien à corriger sur ce point.

---

## 7. Comment les e-mails peuvent aujourd'hui être envoyés

**Aucun envoi automatique n'existe.** `capacite('sendEmail')` (db.js:495) :
`available: false`, `mode: 'manual'`, motif « Aucun service d'envoi n'est
raccordé ».

Deux chemins `mailto:` seulement :

1. `PanneauRelances.ouvrirMessagerie()` (anomalies_ui.js:165) :
   `window.location.href = 'mailto:?subject=…&body=…'`. **Sans destinataire**,
   puisque les collaborateurs n'ont pas d'adresse. Un bouton « Copier » est
   proposé à côté.
2. Reprise déontologique, e-mail au confrère (wizard.js:311), avec
   destinataire, celui-là étant saisi à l'écran.

Ce qui existe déjà et couvre une bonne part du § 22 :

- `preparerRelances(cles, cabinetSettings)` (anomalies.js:328) : regroupe les
  anomalies choisies **par collaborateur**, produit un message par
  collaborateur, et enregistre la date de génération via
  `dbEnregistrerRelances()` (db.js:1220).
- `messageRelanceConsolidee()` (anomalies.js:359) : sépare dans le corps les
  pièces de dossier (à déposer dans le dossier) des documents personnels (à
  transmettre au cabinet).
- Onglet Relances (`OngletRelances`, anomalies_ui.js) : historique en lecture
  seule, date, collaborateur, nombre d'éléments.
- `MentionCapacite` affiche le motif là où l'utilisateur attendrait un envoi.

Manquent : le bouton « Demander la régularisation » sur chacune des quatre
pages d'anomalies dossier, le panneau d'aperçu avant envoi (« N collaborateurs
seront contactés / M anomalies concernées »), l'abstraction de fournisseur
(Microsoft 365 / Gmail), et les adresses e-mail des collaborateurs.

L'exigence « ne jamais envoyer un e-mail en silence » est aujourd'hui
respectée par construction : rien ne part sans que l'utilisateur ne clique dans
sa propre messagerie.

---

## 8. Les migrations et changements de données nécessaires

### Niveau 1 : socle dossier unique (indispensable)

**Mode démonstration.** Introduire `dbDossiers()` comme point de lecture
unique, sur le modèle exact de `dbVigilanceDossiers()` : semence `CLIENTS`,
recouverte par un calque `e.dossiers` (ajouts) et `e.dossiersModifs`
(modifications). Aucun écran n'a à changer de forme, seulement de source.
`DEMO_VERSION` passe de 3 à 4, `demoMigrer()` complète les rubriques absentes
sans rien jeter (db.js:636 : déjà écrit pour ça).

Champs à ajouter au dossier :

| Champ | Valeurs | Défaut pour l'existant |
|---|---|---|
| `siren` | 9 chiffres | dérivé des 9 premiers chiffres de `siret` |
| `statut` | `entree_mission` / `actif` / `sorti` | `actif` |
| `responsableEc` | id d'un expert inscrit | l'EC unique du cabinet |
| `drive` | `{ etat: 'lie' / 'non_trouve' / 'a_confirmer', url }` | `a_confirmer` |
| `source` | `import` / `manuel` / `lettre_reprise` / `origine` | `origine` |

**Migration SQL `schema_004_dossiers.sql`** (nouveau fichier, à exécuter après
les trois autres) :

```sql
alter table public.dossiers add column if not exists siren text;
alter table public.dossiers add column if not exists statut text not null
  default 'actif' check (statut in ('entree_mission','actif','sorti'));
alter table public.dossiers add column if not exists responsable_ec_id uuid
  references public.profiles(id) on delete set null;
alter table public.dossiers add column if not exists drive_etat text not null
  default 'a_confirmer' check (drive_etat in ('lie','non_trouve','a_confirmer'));
alter table public.dossiers add column if not exists drive_url text;
alter table public.dossiers add column if not exists source text not null
  default 'manuel' check (source in ('import','manuel','lettre_reprise'));
create unique index if not exists dossiers_cabinet_siren_idx
  on public.dossiers (cabinet_id, siren) where siren is not null;
```

Aucune donnée existante n'est perdue : toutes les colonnes ajoutées ont un
défaut.

### Niveau 2 : suppression de la liste parallèle

`e.clients` et `dbImporterListeClients()` disparaissent au profit de
`dbDossiers()`. `dbNombreDeClients()` devient `dbDossiers().length`. Le
formulaire du manuel ne change pas d'aspect : il lit déjà un nombre.

### Niveau 3 : e-mails

Ajouter `email` aux collaborateurs. En démonstration, champ optionnel dans le
calque `e.collaborateursModifs` ; en base, la colonne `profiles.email` existe
déjà (schema.sql:37), rien à migrer.

Table des campagnes de relance, pour que l'onglet Relances reste un historique
consultable après bascule en base :

```sql
create table if not exists public.relances_campagnes (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid not null default public.user_cabinet_id()
    references public.cabinets(id) on delete cascade,
  categorie text not null,
  generee_le date not null default current_date,
  etat text not null default 'preparee'
    check (etat in ('preparee','brouillons','envoyee')),
  nb_collaborateurs integer not null default 0,
  nb_anomalies integer not null default 0,
  created_at timestamptz not null default now()
);
```

### Ce qui ne demande aucune migration

Les analyses LCB-FT, le suivi RBE, les attributions de dossiers et le modèle
d'anomalies sont déjà à la bonne forme. Ils ne demandent que du câblage et un
intitulé de bouton.

---

## Modifications minimales proposées

Classées par coût croissant. Rien n'est engagé avant validation.

1. **Dire la vérité à la fin de la contractualisation.** Le bouton
   « Terminer » écrit réellement le dossier via `dbDossiers`, enregistre
   l'analyse LCB-FT via `dbEnregistrerAnalyse()`, et n'annonce que ce qui a
   eu lieu. Corrige un écart à la règle n° 1. Coût : faible.

2. **`dbDossiers()` comme base unique**, avec les cinq champs ajoutés et le
   passage de `DEMO_VERSION` à 4. Les écrans qui lisent `CLIENTS` ou `client()`
   passent à `dbDossiers()` / `dossier(id)`. Coût : moyen, mécanique, sans
   changement visuel.

3. **Gestionnaire de portefeuille unique**, un seul composant d'import,
   atteignable depuis Paramètres > Informations cabinet. Il reprend le
   rapprochement de collaborateur déjà écrit (utils.js:787), assouplit la règle
   de validité au seul nom, ajoute la déduplication en trois passes (id
   interne, puis SIREN/SIRET, puis nom) avec demande d'arbitrage en cas
   d'ambiguïté et jamais de fusion silencieuse, et propose « + Ajouter un
   dossier ». Il remplace `ImportClients` et `RegularisationAnciensDossiers`,
   dont le bouton de dépôt est au passage rendu accessible au clavier. Coût :
   c'est le gros morceau.

4. **« Faire l'analyse »** au lieu de « Mettre à jour la vigilance » quand
   `statut === 'a_lancer'`, même parcours derrière. Coût : une ligne.

5. **« Demander la régularisation »** sur chacune des quatre pages d'anomalies
   dossier, agissant sur la seule catégorie affichée, avec panneau d'aperçu
   (« N collaborateurs seront contactés, M anomalies concernées ») et bouton
   final « Envoyer les demandes » ou « Créer les brouillons » selon le
   fournisseur raccordé. `preparerRelances()` fait déjà le regroupement par
   collaborateur : seuls l'aperçu et l'appel par catégorie sont à écrire. Coût :
   moyen.

6. **Abstraction de fournisseur d'e-mail** (`envoyerEmail` avec implémentations
   Microsoft 365, Gmail et `mailto`), une adresse par collaborateur, et une
   adresse manquante qui ne bloque jamais la campagne. Coût : moyen, et l'envoi
   réel restera indisponible tant qu'aucun fournisseur n'est raccordé, ce que
   les écrans continueront de dire.

### Ce que je ne compte pas créer, conformément au § 3

Vue portefeuille de la contractualisation, fiche client générique, écran de
revue intermédiaire, écran de finalisation supplémentaire, vue équipe complexe
des relances, détail collaborateur complexe, écran séparé de composition de
relance.
