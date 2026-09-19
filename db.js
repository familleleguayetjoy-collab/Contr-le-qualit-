// ComplyEC — accès aux données
'use strict';

/* Un seul fichier parle à la base.

   Aujourd'hui, les écrans lisent directement les tableaux de data.js. Le jour
   où les migrations SQL seront passées dans le projet Supabase, il faudra
   remplacer ces lectures par des requêtes — et si chaque écran fait la sienne,
   la bascule devient impossible à relire et impossible à annuler.

   D'où ce module : une fonction par lecture et par écriture, un aiguillage
   unique, et deux implémentations derrière chacune.

     DB_MODE = 'demo'      → renvoie les données de démonstration de data.js,
                             c'est-à-dire exactement ce que l'application
                             affiche aujourd'hui ;
     DB_MODE = 'supabase'  → interroge les tables créées par
                             supabase/schema.sql, schema_002 et schema_003.

   État d'avancement, sans enjoliver : le mode « demo » est vérifié, chaque
   fonction renvoie la même chose que ce que les écrans lisent aujourd'hui. Le
   mode « supabase » est écrit d'après le schéma mais n'a jamais été exécuté
   contre une vraie base — les migrations ne sont pas encore passées. Ne pas
   basculer DB_MODE sans avoir relu MIGRATION.md et testé sur un cabinet
   d'essai. */

const DB_MODE = 'demo';

function dbEnBase() { return DB_MODE === 'supabase'; }

/* Toute requête passe par ici : une erreur Supabase remonte en exception
   lisible plutôt qu'en `data` valant null, qui produirait un écran vide sans
   explication. */
async function dbAppel(construireRequete) {
  const { data, error } = await construireRequete(supabaseClient);
  if (error) throw new Error(error.message || 'Erreur de lecture en base.');
  return data || [];
}

// =====================================================================
// Cabinet : identité, seuils et rôles Tracfin
// =====================================================================

async function dbCabinet() {
  if (!dbEnBase()) return { ...CABINET_SETTINGS_DEFAUT };
  const lignes = await dbAppel(c => c.from('cabinets').select('*').limit(1));
  const r = lignes[0];
  if (!r) return { ...CABINET_SETTINGS_DEFAUT };
  return {
    nom: r.nom,
    adresse: r.adresse || '',
    telephone: r.telephone || '',
    logoDataUrl: r.logo_url || null,
    signature: r.signature || '',
    seuilDependance: Number(r.seuil_dependance),
    ldmRevisionMois: Number(r.ldm_revision_mois),
    sessionsLbcftParAn: Number(r.sessions_lbcft_par_an),
    declarantTracfin: r.declarant_tracfin || '',
    correspondantTracfin: r.correspondant_tracfin || '',
    tracfinDeclareAuService: Boolean(r.tracfin_declare_au_service),
  };
}

async function dbEnregistrerCabinet(settings) {
  if (!dbEnBase()) return settings;
  const lignes = await dbAppel(c => c.from('cabinets').select('id').limit(1));
  if (!lignes[0]) throw new Error("Aucun cabinet n'est rattaché à ce compte.");
  await dbAppel(c => c.from('cabinets').update({
    nom: settings.nom,
    adresse: settings.adresse,
    telephone: settings.telephone,
    logo_url: settings.logoDataUrl,
    signature: settings.signature,
    seuil_dependance: settings.seuilDependance,
    ldm_revision_mois: settings.ldmRevisionMois,
    sessions_lbcft_par_an: settings.sessionsLbcftParAn,
    declarant_tracfin: settings.declarantTracfin,
    correspondant_tracfin: settings.correspondantTracfin,
    tracfin_declare_au_service: settings.tracfinDeclareAuService,
  }).eq('id', lignes[0].id).select());
  return settings;
}

// =====================================================================
// Collaborateurs
// =====================================================================

async function dbCollaborateurs() {
  if (!dbEnBase()) {
    return COLLABORATEURS.map(c => ({
      ...c,
      dateEmbauche: COLLABORATEURS_EMBAUCHE[c.id] || null,
      dateDepart: null,
    })).concat(ANCIENS_COLLABORATEURS.map(c => ({ ...c, initiales: initialesDe(...c.nom.split(' ')) })));
  }
  const lignes = await dbAppel(c => c.from('profiles').select('*').order('nom'));
  return lignes.map(r => ({
    id: r.id,
    nom: `${r.prenom} ${r.nom}`,
    role: r.fonction || (r.role === 'expert_comptable' ? 'Expert-comptable' : 'Collaborateur comptable'),
    initiales: initialesDe(r.prenom, r.nom),
    dateEmbauche: r.date_embauche,
    dateDepart: r.date_depart,
  }));
}

/* Comptes de l'équipe, tels que l'écran « Mon équipe » les affiche : nom,
   rôle, e-mail, téléphone, date de création du compte. L'e-mail et le
   téléphone n'existent que dans la base — en démonstration ils restent vides
   plutôt qu'inventés, et l'écran l'indique. */
async function dbEquipe() {
  if (!dbEnBase()) {
    return [{ id: 'ec', prenom: EXPERT_COMPTABLE.nom.split(' ')[0], nom: EXPERT_COMPTABLE.nom.split(' ').slice(1).join(' '), role: 'expert_comptable', email: null, telephone: null, created_at: null }]
      .concat(COLLABORATEURS.map(c => ({
        id: c.id,
        prenom: c.nom.split(' ')[0],
        nom: c.nom.split(' ').slice(1).join(' '),
        role: 'collaborateur',
        email: null,
        telephone: null,
        created_at: COLLABORATEURS_EMBAUCHE[c.id] ? COLLABORATEURS_EMBAUCHE[c.id] + 'T00:00:00Z' : null,
      })));
  }
  return dbAppel(c => c.from('profiles').select('*').order('created_at', { ascending: false }));
}

// =====================================================================
// Dossiers clients
// =====================================================================

async function dbDossiers() {
  if (!dbEnBase()) return CLIENTS.slice();
  const lignes = await dbAppel(c => c.from('dossiers').select('*').order('nom'));
  return lignes.map(r => ({
    id: r.id, nom: r.nom, forme: r.forme, siret: r.siret,
    dirigeant: r.dirigeant, activite: r.activite, adresse: r.adresse,
    collaborateur: r.collaborateur_id,
  }));
}

/* Import en masse depuis un tableur, pour la reprise des anciens dossiers.
   Renvoie le nombre de lignes réellement écrites ; en démonstration, rien
   n'est écrit et l'écran le dit. */
async function dbImporterDossiers(lignes) {
  if (!dbEnBase()) return { ecrits: 0, demo: true };
  await dbAppel(c => c.from('dossiers').insert(lignes).select('id'));
  return { ecrits: lignes.length, demo: false };
}

// =====================================================================
// Anomalies
// =====================================================================

async function dbAnomalies() {
  if (!dbEnBase()) return ANOMALIES.slice();
  const lignes = await dbAppel(c => c.from('anomalies').select('*').order('date_detection', { ascending: false }));
  return lignes.map(r => ({
    id: r.id, dossier: r.dossier_id, categorie: r.categorie,
    collaborateur: r.collaborateur_id, priorite: r.priorite,
    titre: r.titre, description: r.description,
    dateDetection: r.date_detection, dernierAction: r.dernier_action,
    statut: r.statut, dateDemandeEC: r.date_demande_ec, commentaire: r.commentaire,
  }));
}

async function dbMajAnomalie(id, champs) {
  if (!dbEnBase()) return { id, ...champs };
  const majuscule = {
    statut: champs.statut,
    dernier_action: champs.dernierAction,
    commentaire: champs.commentaire,
    date_demande_ec: champs.dateDemandeEC,
  };
  Object.keys(majuscule).forEach(k => majuscule[k] === undefined && delete majuscule[k]);
  await dbAppel(c => c.from('anomalies').update(majuscule).eq('id', id).select());
  return { id, ...champs };
}

// =====================================================================
// Lettres de mission
// =====================================================================
//
// L'absence de ligne pour un dossier signifie « aucune lettre » : c'est cette
// table, et elle seule, qui dit si une lettre existe et depuis quand.

async function dbLettresMission() {
  if (!dbEnBase()) return { ...LETTRES_MISSION };
  const lignes = await dbAppel(c => c.from('lettres_mission')
    .select('*').order('version', { ascending: false }));
  const parDossier = {};
  // Seule la version la plus récente fait foi.
  lignes.forEach(r => {
    if (parDossier[r.dossier_id]) return;
    parDossier[r.dossier_id] = {
      dateSignature: r.date_signature,
      derniereActualisation: r.derniere_actualisation,
      signataire: r.signataire,
      honorairesMensuels: r.honoraires_mensuels_ht === null ? null : Number(r.honoraires_mensuels_ht),
      nomFichier: r.nom_fichier,
      version: r.version,
      genereeParLogiciel: r.generee_par_logiciel,
    };
  });
  return parDossier;
}

async function dbEnregistrerLettreMission(dossierId, lettre) {
  if (!dbEnBase()) return lettre;
  const existantes = await dbAppel(c => c.from('lettres_mission')
    .select('version').eq('dossier_id', dossierId).order('version', { ascending: false }).limit(1));
  const version = existantes[0] ? existantes[0].version + 1 : 1;
  await dbAppel(c => c.from('lettres_mission').insert({
    dossier_id: dossierId,
    version,
    date_signature: lettre.dateSignature,
    derniere_actualisation: lettre.derniereActualisation || new Date().toISOString().slice(0, 10),
    signataire: lettre.signataire,
    cabinet_emetteur: lettre.cabinetEmetteur,
    categorie: lettre.categorie,
    honoraires_mensuels_ht: lettre.honorairesMensuels,
    honoraires_annuels_ht: lettre.honorairesAnnuels,
    nom_fichier: lettre.nomFichier,
    generee_par_logiciel: true,
  }).select());
  return { ...lettre, version };
}

async function dbEnregistrerAnalyseLettre(analyse) {
  if (!dbEnBase()) return analyse;
  await dbAppel(c => c.from('lettres_mission_analyses').insert({
    dossier_id: analyse.dossierId || null,
    nom_fichier: analyse.nom,
    mission_presentation: analyse.presentation,
    annee_la_plus_recente: analyse.anneeLaPlusRecente,
    rubriques_presentes_pct: analyse.rubriquesPresentesPct,
    rubriques: analyse.rubriques || [],
    alertes: analyse.alertes || [],
  }).select());
  return analyse;
}

// =====================================================================
// Vigilance LBC-FT et connaissance de la relation d'affaires
// =====================================================================

async function dbVigilance() {
  if (!dbEnBase()) {
    return DOSSIERS_LBCFT.map(d => Object.assign({}, d, {
      connaissance: vigilanceConnaissance(d.dossier),
    }));
  }
  const [analyses, benefs] = await Promise.all([
    dbAppel(c => c.from('vigilance_analyses').select('*')),
    dbAppel(c => c.from('beneficiaires_effectifs').select('*')),
  ]);
  const parDossier = {};
  benefs.forEach(b => {
    (parDossier[b.dossier_id] = parDossier[b.dossier_id] || []).push({
      nom: b.nom,
      part: b.part === null ? null : Number(b.part),
      verifie: b.identite_verifiee,
      piece: b.piece_justificative,
    });
  });
  return analyses.map(r => ({
    dossier: r.dossier_id,
    statut: 'complete',
    derniereAnalyse: r.derniere_analyse,
    adresse: r.adresse,
    classification: r.classification,
    operationsParticulieres: r.operations_particulieres || [],
    niveauCalcule: r.niveau_calcule,
    niveauRetenu: r.niveau_retenu,
    justification: r.justification,
    connaissance: {
      beneficiaires: parDossier[r.dossier_id] || [],
      beneficiairesOk: (parDossier[r.dossier_id] || []).length > 0
        && (parDossier[r.dossier_id] || []).every(b => b.verifie),
      ppe: { statut: r.ppe_statut || 'a_verifier', detail: r.ppe_detail || '' },
      origineFonds: { etat: r.origine_fonds_etat || 'a_faire', detail: r.origine_fonds_detail || '' },
    },
  }));
}

async function dbEnregistrerVigilance(dossierId, analyse) {
  if (!dbEnBase()) return analyse;
  await dbAppel(c => c.from('vigilance_analyses').upsert({
    dossier_id: dossierId,
    adresse: analyse.adresse,
    classification: analyse.classification,
    niveau_calcule: analyse.niveauCalcule,
    niveau_retenu: analyse.niveauRetenu,
    operations_particulieres: analyse.operationsParticulieres || [],
    justification: analyse.justification,
    derniere_analyse: new Date().toISOString().slice(0, 10),
    ppe_statut: analyse.ppe && analyse.ppe.statut,
    ppe_detail: analyse.ppe && analyse.ppe.detail,
    origine_fonds_etat: analyse.origineFonds && analyse.origineFonds.etat,
    origine_fonds_detail: analyse.origineFonds && analyse.origineFonds.detail,
  }, { onConflict: 'dossier_id' }).select());

  // Les bénéficiaires effectifs sont remplacés en bloc : la liste saisie fait
  // foi, un bénéficiaire retiré doit disparaître.
  const benefs = (analyse.beneficiaires || []).filter(b => (b.nom || '').trim());
  await dbAppel(c => c.from('beneficiaires_effectifs').delete().eq('dossier_id', dossierId).select());
  if (benefs.length) {
    await dbAppel(c => c.from('beneficiaires_effectifs').insert(benefs.map(b => ({
      dossier_id: dossierId,
      nom: b.nom.trim(),
      part: b.part === '' || b.part === undefined ? null : Number(b.part),
      identite_verifiee: Boolean(b.verifie),
      piece_justificative: b.piece || null,
      date_verification: b.verifie ? new Date().toISOString().slice(0, 10) : null,
    }))).select());
  }
  return analyse;
}

// =====================================================================
// Dépendance économique
// =====================================================================

async function dbDependance(seuil) {
  if (!dbEnBase()) return dependanceASurveiller(seuil);
  const s = Number(seuil === undefined || seuil === null || seuil === '' ? SEUIL_DEPENDANCE_DEFAUT : seuil);
  const lignes = await dbAppel(c => c.from('dependance_economique')
    .select('*').gt('part_honoraires', s).order('part_honoraires', { ascending: false }));
  return lignes.map(r => ({
    dossier: r.dossier_id,
    partHonoraires: Number(r.part_honoraires).toFixed(1),
    seuil: String(s),
    mesures: r.mesures,
  }));
}

// =====================================================================
// Formations LBC-FT
// =====================================================================

async function dbFormations() {
  if (!dbEnBase()) return FORMATIONS_PROGRAMMES.slice();
  const [sessions, participations] = await Promise.all([
    dbAppel(c => c.from('formations_sessions').select('*').order('date')),
    dbAppel(c => c.from('formations_participations').select('*')),
  ]);
  const parAnnee = {};
  sessions.forEach(s => {
    const attestations = {};
    const participants = [];
    participations.filter(p => p.session_id === s.id).forEach(p => {
      participants.push(p.collaborateur_id);
      attestations[p.collaborateur_id] = { recue: p.attestation_recue, dateUpload: p.date_reception };
    });
    (parAnnee[s.annee] = parAnnee[s.annee] || []).push({
      id: s.id, titre: s.titre, date: s.date, formateur: s.organisme, participants, attestations,
    });
  });
  return Object.keys(parAnnee).map(a => ({ id: 'prog-' + a, annee: Number(a), sessions: parAnnee[a] }));
}

async function dbFormationsAccueil() {
  if (!dbEnBase()) return { ...FORMATIONS_ACCUEIL };
  const lignes = await dbAppel(c => c.from('formations_accueil').select('*'));
  const out = {};
  lignes.forEach(r => { out[r.collaborateur_id] = { date: r.date, organisme: r.organisme }; });
  return out;
}

// =====================================================================
// Conformité : déclarations, diffusion, manuel
// =====================================================================

async function dbDeclarationsIndependance() {
  if (!dbEnBase()) return DECLARATIONS_INDEPENDANCE.slice();
  const lignes = await dbAppel(c => c.from('declarations_independance').select('*'));
  return lignes.map(r => ({
    collaborateur: r.collaborateur_id, exercice: r.exercice,
    statut: r.statut, dateSignature: r.date_signature,
  }));
}

async function dbProceduresVersions() {
  if (!dbEnBase()) return PROCEDURES_VERSIONS.slice();
  const [versions, accuses] = await Promise.all([
    dbAppel(c => c.from('procedures_versions').select('*').order('date_diffusion', { ascending: false })),
    dbAppel(c => c.from('procedures_accuses').select('*')),
  ]);
  return versions.map(v => {
    const a = {};
    accuses.filter(x => x.version_id === v.id).forEach(x => {
      a[x.collaborateur_id] = { signe: x.signe, dateSignature: x.date_signature };
    });
    return { id: v.id, version: v.version, dateDiffusion: v.date_diffusion, resume: v.resume, accuses: a };
  });
}

async function dbManuelChapitres() {
  if (!dbEnBase()) {
    return PROCEDURES_MANUEL_CHAPITRES.map(c => ({ ...c, reponses: {} }));
  }
  const lignes = await dbAppel(c => c.from('manuel_chapitres').select('*').order('ordre'));
  // Le plan reste celui du logiciel : une base vide ne doit pas faire
  // disparaître les chapitres à rédiger, elle doit les montrer comme manquants.
  return PROCEDURES_MANUEL_CHAPITRES.map(chap => {
    const r = lignes.find(x => x.slug === chap.id);
    return r
      ? { id: chap.id, titre: chap.titre, statut: r.statut, derniereMaj: r.derniere_maj, reponses: r.reponses || {} }
      : { ...chap, reponses: {} };
  });
}

async function dbEnregistrerChapitre(slug, titre, reponses, ordre) {
  if (!dbEnBase()) return { slug, reponses };
  await dbAppel(c => c.from('manuel_chapitres').upsert({
    slug, titre, ordre,
    statut: 'a_jour',
    derniere_maj: new Date().toISOString().slice(0, 10),
    reponses: reponses || {},
  }, { onConflict: 'cabinet_id,slug' }).select());
  return { slug, reponses };
}

// =====================================================================
// Trace des documents produits
// =====================================================================
//
// Un contrôleur demande la pièce datée, pas l'écran qui l'a affichée. Chaque
// document généré laisse une ligne — jamais modifiable, par construction (le
// schéma ne porte aucune policy UPDATE sur cette table).

async function dbTracerDocument(type, nomFichier, dossierId) {
  if (!dbEnBase()) return { type, nomFichier, dossierId, genereLe: new Date().toISOString() };
  await dbAppel(c => c.from('documents_generes').insert({
    type, nom_fichier: nomFichier, dossier_id: dossierId || null,
  }).select());
  return { type, nomFichier, dossierId };
}

async function dbDocumentsGeneres(type) {
  if (!dbEnBase()) return [];
  const lignes = await dbAppel(c => {
    let q = c.from('documents_generes').select('*').order('genere_le', { ascending: false });
    if (type) q = q.eq('type', type);
    return q;
  });
  return lignes.map(r => ({
    id: r.id, type: r.type, nomFichier: r.nom_fichier,
    dossier: r.dossier_id, genereLe: r.genere_le,
  }));
}

// =====================================================================
// Registre des capacités externes — § 9 du prompt V6
// =====================================================================
/*
   Un bouton qui promet une action que le logiciel ne sait pas faire est pire
   qu'un bouton absent : l'utilisateur croit le travail fait. Ce registre dit,
   pour chaque capacité, si elle existe vraiment, et sous quelle forme.

     available  — la capacité fonctionne réellement ici et maintenant ;
     mode       — 'real'      : le logiciel exécute l'action ;
                  'manual'    : l'action se fait ailleurs, ComplyEC enregistre
                                le résultat que l'utilisateur constate ;
                  'unavailable' : rien n'est possible pour l'instant.
     raison     — ce qu'il faudrait pour que la capacité existe.

   La règle d'usage est simple : un écran n'affiche « Vérifier » que si la
   capacité est 'real'. En 'manual', il affiche « Renseigner le résultat » et
   demande la date, la source et la conclusion — ce qui est honnête et reste
   opposable à un contrôleur. En 'unavailable', l'action n'apparaît pas.
*/

const CAPACITES = {
  extractionIA: {
    available: false, mode: 'unavailable',
    label: 'Lecture automatique des documents',
    raison: 'Demande une fonction serveur : une clé Anthropic placée dans le navigateur serait lisible par tous les utilisateurs.',
  },
  registreLegal: {
    available: false, mode: 'manual',
    label: 'Interrogation du registre du commerce',
    raison: 'Aucun connecteur INPI n’est configuré. Les informations se saisissent depuis le Kbis déposé.',
  },
  rbe: {
    available: false, mode: 'manual',
    label: 'Registre des bénéficiaires effectifs',
    raison: 'La consultation se fait sur data.inpi.fr ; ComplyEC enregistre la date, la personne et le résultat constaté.',
  },
  sanctionsGel: {
    available: false, mode: 'manual',
    label: 'Gel des avoirs et sanctions',
    raison: 'La consultation se fait sur le registre national des gels ; ComplyEC enregistre le résultat constaté.',
  },
  sendEmail: {
    available: false, mode: 'manual',
    label: 'Envoi d’e-mails',
    raison: 'Aucun service d’envoi n’est raccordé. ComplyEC rédige la relance consolidée, l’enregistre à sa date, et l’ouvre dans la messagerie du cabinet — c’est vous qui l’envoyez.',
  },
  drive: {
    available: false, mode: 'unavailable',
    label: 'Espace documentaire du cabinet',
    raison: 'Le connecteur Drive n’est pas encore paramétré. Les anomalies affichées proviennent du jeu de démonstration, et une régularisation se pointe à la main.',
  },
  wordGeneration: {
    available: true, mode: 'real',
    label: 'Génération de documents Word',
    raison: null,
  },
  zipExport: {
    available: false, mode: 'unavailable',
    label: 'Export d’une archive ZIP',
    raison: 'La compression n’est pas embarquée dans l’application.',
  },
  supabasePersistence: {
    available: false, mode: 'unavailable',
    label: 'Enregistrement en base Supabase',
    raison: 'Les migrations SQL n’ont pas encore été exécutées ; les données sont conservées localement.',
  },
  persistanceLocale: {
    available: true, mode: 'real',
    label: 'Conservation locale des données de démonstration',
    raison: null,
  },
};

function capacite(cle) {
  return CAPACITES[cle] || { available: false, mode: 'unavailable', label: cle, raison: null };
}

function capaciteReelle(cle) { return capacite(cle).mode === 'real'; }
function capaciteManuelle(cle) { return capacite(cle).mode === 'manual'; }

/* Enveloppe d'une action dépendant d'une capacité : elle rend l'action réelle,
   son équivalent manuel, ou rien — jamais un bouton qui ment. */
function CapabilityGate({ cle, reel, manuel, indisponible }) {
  const c = capacite(cle);
  if (c.mode === 'real') return reel || null;
  if (c.mode === 'manual') return manuel !== undefined ? manuel : null;
  return indisponible !== undefined ? indisponible : null;
}

/* Mention lisible de ce qu'une capacité absente implique, à placer là où
   l'utilisateur pourrait s'attendre à un bouton. */
function MentionCapacite({ cle }) {
  const c = capacite(cle);
  if (c.mode === 'real') return null;
  return h('p', { className: 'conf-detail', style: { marginBottom: 0 } }, c.raison);
}

// =====================================================================
// Persistance du mode démonstration — phase A du prompt V6
// =====================================================================
/*
   Jusqu'ici, le mode démonstration lisait les constantes de data.js et ne
   gardait rien : une modification disparaissait au rechargement. Le § 7 du
   prompt V6 demande que les mutations survivent au refresh — et, surtout,
   qu'elles passent par cette couche plutôt que par un store parallèle que les
   écrans iraient consulter en douce.

   D'où la forme retenue. Les constantes de data.js deviennent des semences :
   elles ne bougent jamais. Les modifications s'empilent dans un calque
   conservé dans localStorage, et chaque lecture rend la semence recouverte de
   son calque. Les écrans, eux, ne connaissent que les fonctions db*.

   Trois conséquences utiles. Une donnée n'existe qu'une fois : modifier le
   déclarant Tracfin le change partout, puisque tout le monde lit la même
   fonction. Le calque est versionné, donc une future évolution de forme peut
   être migrée au lieu d'être perdue. Et resetDemoData() rend le jeu de
   démonstration à son état d'origine, ce dont une démonstration a besoin.

   En mode Supabase, ce calque n'existe pas : les mêmes fonctions écrivent en
   base. Aucun écran n'a à savoir lequel des deux est actif.
*/

const DEMO_CLE = 'complyec.demo';
const DEMO_VERSION = 4;

/* Forme vide du calque. Chaque rubrique correspond à une famille de données ;
   une rubrique absente vaut « aucune modification ». */
function demoEtatVide() {
  return {
    version: DEMO_VERSION,
    reglages: {},            // seuils et règles que le cabinet se donne
    referentiel: {},         // informations du cabinet : valeur et statut
    roles: {},               // titulaires des rôles
    reclamations: [],        // ajoutées depuis l'écran Réclamations
    nonConformites: [],      // ajoutées, ou créées depuis une réclamation
    ncModifs: {},            // modifications des non-conformités existantes
    vigilances: {},          // analyses enregistrées, par dossier
    rbe: {},                 // consultations du registre des bénéficiaires
    controles: {},           // contrôles PPE, gel et pays
    risquesQualite: {},      // validations de risques qualité
    formations: {},          // sessions et attestations ajoutées
    prestataires: {},        // confirmations d'outils et prestataires
    manuelVersions: [],      // versions publiées
    packs: [],               // instantanés du dossier de contrôle
    manuelParties: {},       // parties relues et validées
    cartographies: [],       // arrêtés datés de la cartographie LBC-FT
    documents: {},           // fichiers déposés par catégorie
    journal: [],             // journal des validations (§ 34)
    relances: [],            // relances consolidées adressées aux collaborateurs
    regularisations: {},     // anomalies pointées régularisées, par clé
    attributions: {},        // dossier → collaborateur qui en a la charge
    clients: [],             // liste des clients importée depuis un tableur
    manuelCabinet: {},       // réponses du formulaire en trois étapes du manuel
    traitements: [],         // registre RGPD des traitements, édité dans l'outil
    traitementsModifs: {},   // modifications des traitements d'origine
    charteIa: null,          // charte d'utilisation de l'IA, une fois créée
    contratsPrestataires: {},// contrats déposés, par prestataire
    surveillance: {},        // étapes validées du programme annuel, par année
    campagnes: {},           // campagnes d'indépendance, par année
    dependanceModifs: {},    // lignes de dépendance modifiées ou retirées
    dependanceAjouts: [],    // lignes de dépendance ajoutées
    gouvernance: {},         // experts inscrits et actionnariat
    supervisions: {},        // notes de synthèse revues par l'expert-comptable
  };
}

let demoEtat = null;
const demoAbonnes = new Set();

function demoDisponible() {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem('complyec.test', '1');
    localStorage.removeItem('complyec.test');
    return true;
  } catch (e) {
    return false;
  }
}

const DEMO_PERSISTE = demoDisponible();

/* Migration de version : on ne jette pas le calque d'un utilisateur parce que
   sa forme a changé, on complète ce qui manque. */
function demoMigrer(brut) {
  const vide = demoEtatVide();
  if (!brut || typeof brut !== 'object') return vide;
  const fusion = Object.assign({}, vide, brut);
  fusion.version = DEMO_VERSION;
  Object.keys(vide).forEach(k => {
    if (fusion[k] === null || fusion[k] === undefined) fusion[k] = vide[k];
    if (Array.isArray(vide[k]) && !Array.isArray(fusion[k])) fusion[k] = vide[k];
  });
  return fusion;
}

function demoLireEtat() {
  if (demoEtat) return demoEtat;
  if (!DEMO_PERSISTE) { demoEtat = demoEtatVide(); return demoEtat; }
  try {
    demoEtat = demoMigrer(JSON.parse(localStorage.getItem(DEMO_CLE)));
  } catch (e) {
    demoEtat = demoEtatVide();
  }
  return demoEtat;
}

function demoSauver() {
  if (!DEMO_PERSISTE) return;
  try {
    localStorage.setItem(DEMO_CLE, JSON.stringify(demoEtat));
  } catch (e) {
    // Quota dépassé ou stockage refusé : l'application continue de
    // fonctionner en mémoire, mais on ne prétend pas avoir persisté.
    console.warn('ComplyEC : impossible d’enregistrer localement.', e);
  }
}

/* Toute mutation passe ici : elle modifie le calque, l'enregistre, puis
   prévient les écrans. Le recalcul des compteurs dépendants découle du rendu,
   il n'est pas à écrire à la main écran par écran. */
function demoMuter(fn) {
  const etat = demoLireEtat();
  fn(etat);
  demoSauver();
  demoAbonnes.forEach(f => { try { f(); } catch (e) { /* composant démonté */ } });
}

/* Abonnement d'un écran aux données. Sans lui, une mutation changerait le
   calque sans que rien ne se réaffiche. */
function useDonnees() {
  const [, redessiner] = useState(0);
  useEffect(() => {
    const f = () => redessiner(n => n + 1);
    demoAbonnes.add(f);
    return () => demoAbonnes.delete(f);
  }, []);
  return demoLireEtat();
}

/* Remise à zéro explicite, demandée au § 7.1. Elle vide le calque : les
   semences de data.js réapparaissent telles quelles. */
function resetDemoData() {
  demoEtat = demoEtatVide();
  if (DEMO_PERSISTE) {
    try { localStorage.removeItem(DEMO_CLE); } catch (e) { /* sans objet */ }
  }
  demoAbonnes.forEach(f => { try { f(); } catch (e) { /* composant démonté */ } });
}

/* Le journal des validations (§ 34). Il ne s'affiche pas dans la barre
   latérale : on le consulte depuis le pack de contrôle et le manuel. */
function dbJournaliser(action, element, reference) {
  demoMuter(e => {
    const t = new Date();
    e.journal.unshift({
      // `id` pour que la liste puisse s'afficher sans clé ambiguë, `date` au
      // format court pour l'affichage, `horodatage` complet pour le tri :
      // deux validations le même jour doivent rester dans leur ordre.
      id: 'j-' + t.getTime() + '-' + Math.round(Math.random() * 1000),
      horodatage: t.toISOString(),
      date: t.toISOString().slice(0, 10),
      heure: t.toTimeString().slice(0, 5),
      utilisateur: EXPERT_COMPTABLE.nom,
      action, element, reference: reference || null,
    });
    if (e.journal.length > 200) e.journal.length = 200;
  });
}

function dbJournal() { return demoLireEtat().journal; }

// ---------------------------------------------------------------------
// Lectures : semence de data.js recouverte du calque
// ---------------------------------------------------------------------

/* Les règles que le cabinet se donne. */
function dbReglages() {
  return Object.assign({}, CABINET_SETTINGS_DEFAUT, demoLireEtat().reglages);
}

async function dbMajReglage(cle, valeur) {
  if (dbEnBase()) {
    await dbAppel(c => c.from('cabinets').update({ [cle]: valeur }).neq('id', '').select());
  }
  demoMuter(e => { e.reglages[cle] = valeur; });
  return valeur;
}

/* Le référentiel des informations du cabinet. Une modification confirme
   l'information et date la confirmation : c'est ce qui la rend canonique. */
function dbReferentiel() {
  const calque = demoLireEtat().referentiel;
  return REFERENTIEL_INFOS.map(i => (calque[i.cle] ? Object.assign({}, i, calque[i.cle]) : i));
}

function dbInfo(cle) {
  return dbReferentiel().find(i => i.cle === cle) || null;
}

function dbValeur(cle, defaut) {
  const i = dbInfo(cle);
  return i && i.valeur ? i.valeur : (defaut === undefined ? null : defaut);
}

async function dbMajInformation(cle, valeur, options) {
  const o = options || {};
  const modif = {
    valeur,
    statut: o.statut || 'confirmee',
    confirmeLe: o.confirmeLe || new Date().toISOString().slice(0, 10),
    confirmePar: o.confirmePar || EXPERT_COMPTABLE.nom,
  };
  if (dbEnBase()) {
    await dbAppel(c => c.from('cabinet_infos').upsert({
      cle, valeur, statut: modif.statut, confirme_le: modif.confirmeLe, confirme_par: modif.confirmePar,
    }).select());
  }
  demoMuter(e => { e.referentiel[cle] = Object.assign({}, e.referentiel[cle], modif); });
  dbJournaliser('Information confirmée', (dbInfo(cle) || {}).libelle || cle, valeur);
  return modif;
}

async function dbConfirmerInformations(cles) {
  const date = new Date().toISOString().slice(0, 10);
  demoMuter(e => {
    cles.forEach(cle => {
      e.referentiel[cle] = Object.assign({}, e.referentiel[cle], {
        statut: 'confirmee', confirmeLe: date, confirmePar: EXPERT_COMPTABLE.nom,
      });
    });
  });
  dbJournaliser('Informations confirmées en lot', `${cles.length} informations`, null);
  return cles.length;
}

/* Les titulaires des rôles du cabinet. Le déclarant Tracfin vit dans le
   référentiel : le modifier depuis Organisation le change partout, ce que la
   matrice de cohérence du § 43 vérifie. */
function dbRoles() {
  const calque = demoLireEtat().roles;
  return ROLES_CABINET.map(r => {
    const titulaire = calque[r.code] !== undefined
      ? calque[r.code]
      : (r.titulaireCle ? dbValeur(r.titulaireCle) : (r.titulaire || null));
    return Object.assign({}, r, { titulaireEffectif: titulaire });
  });
}

async function dbMajRole(code, titulaire) {
  const role = ROLES_CABINET.find(r => r.code === code);
  if (role && role.titulaireCle) {
    await dbMajInformation(role.titulaireCle, titulaire);
  } else {
    demoMuter(e => { e.roles[code] = titulaire; });
  }
  dbJournaliser('Rôle modifié', role ? role.label : code, titulaire);
  return titulaire;
}

function dbRolesNonCouverts() { return dbRoles().filter(r => !r.titulaireEffectif); }

/* Réclamations et non-conformités. */
function dbReclamations() {
  return demoLireEtat().reclamations.concat(RECLAMATIONS);
}

async function dbAjouterReclamation(r) {
  const ligne = Object.assign({
    id: 'rec-' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    etat: 'en-cours', reponse: null, dateReponse: null, suites: null,
  }, r);
  if (dbEnBase()) await dbAppel(c => c.from('reclamations').insert(ligne).select());
  demoMuter(e => { e.reclamations.unshift(ligne); });
  dbJournaliser('Réclamation enregistrée', client(ligne.dossier) ? client(ligne.dossier).nom : ligne.dossier, ligne.id);
  return ligne;
}

async function dbCloturerReclamation(id, reponse) {
  demoMuter(e => {
    const locale = e.reclamations.find(x => x.id === id);
    const maj = { etat: 'cloturee', reponse, dateReponse: new Date().toISOString().slice(0, 10) };
    if (locale) Object.assign(locale, maj);
    else e.reclamations.unshift(Object.assign({}, RECLAMATIONS.find(x => x.id === id), maj));
  });
  dbJournaliser('Réclamation clôturée', id, null);
}

function dbNonConformites() {
  const etat = demoLireEtat();
  const base = NON_CONFORMITES.map(n => (etat.ncModifs[n.id] ? Object.assign({}, n, etat.ncModifs[n.id]) : n));
  const toutes = etat.nonConformites.concat(base);
  return toutes.map(n => Object.assign({}, n, { etat: etatNonConformite(n) }));
}

async function dbCreerNonConformite(nc) {
  const ligne = Object.assign({
    id: 'nc-' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    gravite: 'Majeure', portee: 'isole',
    cause: null, action: null, responsable: null, echeance: null, efficacite: null,
  }, nc);
  if (dbEnBase()) await dbAppel(c => c.from('non_conformites').insert(ligne).select());
  demoMuter(e => { e.nonConformites.unshift(ligne); });
  dbJournaliser('Non-conformité créée', client(ligne.dossier) ? client(ligne.dossier).nom : ligne.dossier, ligne.id);
  return ligne;
}

async function dbMajNonConformite(id, champs) {
  demoMuter(e => {
    const locale = e.nonConformites.find(x => x.id === id);
    if (locale) Object.assign(locale, champs);
    else e.ncModifs[id] = Object.assign({}, e.ncModifs[id], champs);
  });
  dbJournaliser('Non-conformité mise à jour', id, null);
}

/* Analyses de vigilance. Une analyse enregistrée recouvre la semence du
   dossier : le portefeuille, les dossiers sensibles et la cartographie la
   voient immédiatement. */
function dbVigilanceDossiers() {
  const calque = demoLireEtat().vigilances;
  return DOSSIERS_LBCFT.map(d => (calque[d.dossier]
    ? Object.assign({}, d, calque[d.dossier], { statut: 'complete' })
    : d));
}

async function dbEnregistrerAnalyse(dossierId, analyse) {
  const ligne = Object.assign({
    derniereAnalyse: new Date().toISOString().slice(0, 10),
    valideePar: EXPERT_COMPTABLE.nom,
  }, analyse);
  if (dbEnBase()) await dbEnregistrerVigilance(dossierId, ligne);
  demoMuter(e => { e.vigilances[dossierId] = Object.assign({}, e.vigilances[dossierId], ligne); });
  dbJournaliser('Vigilance validée', client(dossierId) ? client(dossierId).nom : dossierId, ligne.niveauRetenu || null);
  return ligne;
}

/* Campagne d'interrogation du registre des bénéficiaires effectifs. */
function dbCampagneRbe() {
  const calque = demoLireEtat().rbe;
  return CAMPAGNE_RBE.map(r => (calque[r.dossier] ? Object.assign({}, r, calque[r.dossier]) : r));
}

async function dbEnregistrerRbe(dossierId, resultat) {
  const ligne = Object.assign({
    consulteLe: new Date().toISOString().slice(0, 10),
    par: 'martin',
  }, resultat);
  demoMuter(e => { e.rbe[dossierId] = Object.assign({}, e.rbe[dossierId], ligne); });
  dbJournaliser('Registre des bénéficiaires consulté', client(dossierId) ? client(dossierId).nom : dossierId, ligne.resultat || null);
  return ligne;
}

/* Contrôles ciblés : personnes politiquement exposées, gel, pays à risque. */
function dbControles() {
  const calque = demoLireEtat().controles;
  return CONTROLES_CIBLES.map(c => (calque[c.id] ? Object.assign({}, c, calque[c.id]) : c));
}

async function dbEnregistrerControle(id, resultat) {
  const ligne = Object.assign({
    date: new Date().toISOString().slice(0, 10),
    par: 'martin',
  }, resultat);
  demoMuter(e => { e.controles[id] = Object.assign({}, e.controles[id], ligne); });
  const c = CONTROLES_CIBLES.find(x => x.id === id);
  dbJournaliser('Contrôle enregistré', c ? `${CONTROLE_TYPES[c.type].court} — ${client(c.dossier).nom}` : id, ligne.resultat || null);
  return ligne;
}

/* Risques qualité. */
function dbRisquesQualite() {
  const calque = demoLireEtat().risquesQualite;
  return RISQUES_QUALITE.map(r => (calque[r.id] ? Object.assign({}, r, calque[r.id]) : r));
}

async function dbValiderRisqueQualite(id, champs) {
  const ligne = Object.assign({ etat: 'valide', revuLe: new Date().toISOString().slice(0, 10) }, champs);
  demoMuter(e => { e.risquesQualite[id] = Object.assign({}, e.risquesQualite[id], ligne); });
  const r = RISQUES_QUALITE.find(x => x.id === id);
  dbJournaliser('Risque qualité validé', r ? r.domaine : id, null);
  return ligne;
}

/* Outils et prestataires. */
function dbPrestataires() {
  const calque = demoLireEtat().prestataires;
  return OUTILS_PRESTATAIRES.map(o => (calque[o.id] ? Object.assign({}, o, calque[o.id]) : o));
}

async function dbConfirmerPrestataire(id, champs) {
  const ligne = Object.assign({ derniereConfirmation: new Date().toISOString().slice(0, 10) }, champs);
  demoMuter(e => { e.prestataires[id] = Object.assign({}, e.prestataires[id], ligne); });
  const o = OUTILS_PRESTATAIRES.find(x => x.id === id);
  dbJournaliser('Prestataire confirmé', o ? o.nom : id, null);
  return ligne;
}

/* Formations : sessions ajoutées et attestations reçues. */
function dbFormationsProgrammes() {
  const calque = demoLireEtat().formations;
  return FORMATIONS_PROGRAMMES.map(prog => Object.assign({}, prog, {
    sessions: prog.sessions.map(s => {
      const m = calque['s:' + s.id];
      const attestations = Object.assign({}, s.attestations);
      Object.keys(calque).forEach(k => {
        if (k.startsWith('a:' + s.id + ':')) {
          attestations[k.split(':')[2]] = calque[k];
        }
      });
      return Object.assign({}, s, m || {}, { attestations });
    }).concat((calque['ajoutees:' + prog.annee] || [])),
  }));
}

async function dbAjouterSessionFormation(annee, session) {
  const ligne = Object.assign({ id: 'sess-' + Date.now(), attestations: {} }, session);
  demoMuter(e => {
    const cle = 'ajoutees:' + annee;
    e.formations[cle] = (e.formations[cle] || []).concat([ligne]);
  });
  dbJournaliser('Session de formation créée', ligne.titre, ligne.date);
  return ligne;
}

async function dbEnregistrerAttestation(sessionId, collabId) {
  demoMuter(e => {
    e.formations['a:' + sessionId + ':' + collabId] = { recue: true, dateUpload: new Date().toISOString().slice(0, 10) };
  });
  dbJournaliser('Attestation de formation reçue', collaborateur(collabId) ? collaborateur(collabId).nom : collabId, sessionId);
}

/* Déclarations d'indépendance : relances et signatures. */
function dbDeclarations(annee) {
  const calque = demoLireEtat().referentiel;
  return declarationsIndependanceAnnee(annee).map(d => {
    const m = calque['decl:' + annee + ':' + d.collaborateur];
    return m ? Object.assign({}, d, m) : d;
  });
}

async function dbRelancerDeclaration(annee, collabId) {
  const date = new Date().toISOString().slice(0, 10);
  demoMuter(e => {
    const cle = 'decl:' + annee + ':' + collabId;
    e.referentiel[cle] = Object.assign({}, e.referentiel[cle], { relanceLe: date });
  });
  return date;
}

/* Cartographie LBC-FT : chaque arrêté est un instantané daté et immuable. */
function dbCartographies() { return demoLireEtat().cartographies; }

async function dbArreterCartographie(synthese) {
  const snapshot = Object.assign({
    date: new Date().toISOString().slice(0, 10),
    utilisateur: EXPERT_COMPTABLE.nom,
  }, synthese);
  demoMuter(e => { e.cartographies.unshift(snapshot); });
  dbJournaliser('Cartographie LBC-FT arrêtée', `au ${formatDate(snapshot.date)}`, String(snapshot.total || ''));
  return snapshot;
}

/* Manuel : parties validées et versions publiées. Une version publiée est
   immuable — on n'écrit jamais par-dessus, on en ajoute une nouvelle.

   Le statut n'est pas conservé : il se déduit. La version en vigueur est la
   plus récemment approuvée, les autres sont remplacées. Conserver le statut
   obligerait à modifier les lignes antérieures à chaque publication, et un
   oubli produirait deux versions « en vigueur » — exactement le genre de
   contradiction qu'un contrôleur relève. */
function dbManuelVersions() {
  const toutes = demoLireEtat().manuelVersions.concat(MANUEL_VERSIONS)
    .map(v => Object.assign({}, v));
  const cle = v => String(v.dateEffet || v.dateApprobation || v.date || '');
  const rang = toutes.slice().sort((a, b) => (cle(a) < cle(b) ? 1 : cle(a) > cle(b) ? -1 : 0));
  const enVigueur = rang.length ? rang[0] : null;
  toutes.forEach(v => { v.statut = (v === enVigueur ? 'en-vigueur' : 'remplacee'); });
  return toutes;
}

function dbManuelPartiesValidees() { return demoLireEtat().manuelParties; }

async function dbValiderPartieManuel(code) {
  demoMuter(e => { e.manuelParties[code] = { valideeLe: new Date().toISOString().slice(0, 10) }; });
}

async function dbPublierManuel(version) {
  const ligne = Object.assign({
    date: new Date().toISOString().slice(0, 10),
    dateEffet: new Date().toISOString().slice(0, 10),
    approbateur: 'martin',
    dateApprobation: new Date().toISOString().slice(0, 10),
  }, version);
  demoMuter(e => {
    // Aucune version antérieure n'est retouchée : le statut se déduit de la
    // date d'effet à la lecture (voir dbManuelVersions).
    e.manuelVersions.unshift(ligne);
    e.manuelParties = {};
  });
  dbJournaliser('Manuel publié', ligne.numero, ligne.objet || null);
  return ligne;
}

/* Documents produits par ComplyEC.

   L'état « à régénérer » se déduit, il n'est pas conservé : un document est à
   régénérer dès qu'une des informations qu'il imprime a été modifiée après sa
   dernière génération. C'est l'exigence du § 11 — « modifier une donnée
   canonique marque les documents dépendants à régénérer » — et la conserver
   dans une propriété obligerait à penser à la mettre à jour partout, ce qu'on
   oublierait un jour. Un manuel qui se dirait « à jour » en imprimant l'ancien
   déclarant Tracfin est exactement le document qu'un contrôleur relèvera. */
function dbDocumentsGeneres() {
  return DOCUMENTS_GENERES.map(d => {
    const modifiees = (d.variables || []).filter(cle => {
      const info = dbInfo(cle);
      return info && info.confirmeLe && info.confirmeLe > d.date;
    });
    if (!modifiees.length) return Object.assign({}, d);
    const libelles = modifiees.map(cle => (dbInfo(cle) || {}).libelle || cle);
    return Object.assign({}, d, {
      etat: 'a-regenerer',
      motif: d.etat === 'a-regenerer' && d.motif
        ? d.motif
        : `${libelles.join(', ')} ${pluriel(libelles.length, 'a été modifiée', 'ont été modifiées')} depuis cette version.`,
    });
  });
}

/* Documents déposés. Les fichiers eux-mêmes ne sont pas conservés — seuls leur
   nom et leur catégorie le sont. Prétendre stocker le contenu d'un PDF dans
   localStorage serait un faux succès. */
function dbSources() {
  const calque = demoLireEtat().documents;
  const ajoutes = Object.keys(calque).reduce((acc, cat) => acc.concat(calque[cat]), []);
  const retires = new Set(ajoutes.filter(s => s.retire).map(s => s.id));
  return ajoutes.filter(s => !s.retire).concat(SOURCES_DOCUMENTS.filter(s => !retires.has(s.id)));
}

async function dbDeposerFichiers(categorie, fichiers) {
  const lignes = Array.from(fichiers).map((f, i) => ({
    id: 'src-' + Date.now() + '-' + i,
    categorie, nom: f.name, type: 'Déposé le ' + formatDate(new Date().toISOString().slice(0, 10)),
    dateDepot: new Date().toISOString().slice(0, 10),
    etatExtraction: CAPACITES.extractionIA.available ? 'en-attente' : 'non-lu',
    pages: null, version: 'v1', taille: f.size || null,
  }));
  demoMuter(e => { e.documents[categorie] = (e.documents[categorie] || []).concat(lignes); });
  return lignes;
}

async function dbRetirerFichier(id) {
  demoMuter(e => {
    let trouve = false;
    Object.keys(e.documents).forEach(cat => {
      e.documents[cat] = e.documents[cat].filter(s => {
        if (s.id === id) { trouve = true; return false; }
        return true;
      });
    });
    if (!trouve) {
      // Fichier de la semence : on le marque retiré dans le calque.
      const s = SOURCES_DOCUMENTS.find(x => x.id === id);
      if (s) e.documents[s.categorie] = (e.documents[s.categorie] || []).concat([{ id, retire: true }]);
    }
  });
}

/* Packs de contrôle — § 33 du prompt V6.

   Un pack est un instantané : il fige ce que le cabinet pouvait montrer à une
   date et à une heure données. Les travaux postérieurs ne le modifient pas, et
   c'est tout son intérêt — un contrôleur qui revient sur un pack de la semaine
   dernière doit y retrouver ce qu'il a vu la semaine dernière.

   D'où la forme : on copie l'état des pièces au moment de l'arrêté, on ne
   garde pas une référence vers un calcul qui bougerait. */
function dbPacks() { return demoLireEtat().packs; }

const PACK_ETATS_LISIBLES = {
  ok: 'Disponible',
  partiel: 'Incomplète',
  absent: 'Manquante',
  externe: 'Hors ComplyEC',
};

async function dbPreparerPack(etat, reglages) {
  const t = new Date();
  const version = manuelVersionEnVigueur();
  const annexes = [];
  etat.composantes.forEach(c => c.preuves.forEach(p => annexes.push({
    composante: c.titre,
    libelle: p.libelle,
    source: p.source || null,
    etat: p.etat,
    etatLisible: PACK_ETATS_LISIBLES[p.etat] || p.etat,
    detail: p.detail || null,
  })));

  const pack = {
    id: 'pack-' + t.getTime(),
    date: t.toISOString().slice(0, 10),
    heure: t.toTimeString().slice(0, 5),
    utilisateur: EXPERT_COMPTABLE.nom,
    manuel: version ? `${version.numero}, en vigueur depuis le ${formatDate(version.dateEffet)}` : null,
    disponibles: etat.ok,
    aCompleter: etat.aTraiter,
    horsComplyEC: etat.externe,
    seuilDependance: (reglages || {}).seuilDependance || null,
    annexes,
  };

  demoMuter(e => { e.packs.unshift(pack); if (e.packs.length > 20) e.packs.length = 20; });
  dbJournaliser('Pack de contrôle préparé', `au ${formatDate(pack.date)} à ${pack.heure}`,
    `${pack.disponibles} pièces disponibles`);
  return pack;
}

/* =====================================================================
   Anomalies documentaires : attribution, relances, régularisations
   =====================================================================

   Trois écritures, trois questions.

   Qui a la charge du dossier ? — réglée dans Paramètres > Utilisateurs, et
   c'est elle qui décide à qui part la relance. Sans elle, ComplyEC saurait
   qu'une pièce manque sans savoir à qui le dire.

   Qu'ai-je demandé, et quand ? — la relance consolidée, conservée telle
   qu'elle a été générée. Une relance ne se réécrit pas après coup.

   Est-ce réglé ? — la régularisation. Le jour où le connecteur Drive est
   paramétré, elle se constate toute seule : la pièce réapparaît, l'anomalie
   sort de la liste. En attendant, elle se pointe à la main, datée et signée,
   et l'écran ne prétend pas le contraire. */

/* --- Attribution des dossiers ------------------------------------------- */

/* Le collaborateur qui a la charge d'un dossier. La valeur d'origine est celle
   du dossier lui-même ; Paramètres > Utilisateurs peut la changer, et c'est
   cette modification qui fait foi ensuite. */
function dbAttributionDossier(dossierId) {
  const perso = demoLireEtat().attributions[dossierId];
  if (perso) return perso;
  const c = client(dossierId);
  return c ? c.collaborateur : null;
}

/* Tous les dossiers d'un collaborateur, attribution personnalisée comprise. */
function dbDossiersDuCollaborateur(collabId) {
  return CLIENTS.filter(c => dbAttributionDossier(c.id) === collabId);
}

async function dbMajAttribution(dossierId, collabId) {
  demoMuter(e => { e.attributions[dossierId] = collabId; });
  const d = client(dossierId);
  const p = collaborateur(collabId);
  dbJournaliser('Dossier réattribué', d ? d.nom : dossierId, p ? p.nom : collabId);
  return true;
}

/* --- Relances ------------------------------------------------------------ */

function dbRelances() { return demoLireEtat().relances.concat(RELANCES_DEMO); }

function dbEnregistrerRelances(nouvelles) {
  demoMuter(e => { nouvelles.forEach(r => e.relances.unshift(r)); });
  nouvelles.forEach(r => {
    const p = collaborateur(r.collaborateur);
    dbJournaliser('Relance préparée', p ? p.nom : r.collaborateur,
      `${r.elements.length} élément${r.elements.length > 1 ? 's' : ''}`);
  });
  return nouvelles;
}

/* --- Régularisations ----------------------------------------------------- */

function dbRegularisations() { return demoLireEtat().regularisations; }

async function dbMarquerRegularise(cle, libelle) {
  const le = new Date().toISOString().slice(0, 10);
  demoMuter(e => { e.regularisations[cle] = { le, par: EXPERT_COMPTABLE.nom }; });
  dbJournaliser('Anomalie régularisée', libelle || cle, `constaté le ${formatDate(le)}`);
  return true;
}

async function dbAnnulerRegularisation(cle) {
  demoMuter(e => { delete e.regularisations[cle]; });
  return true;
}

/* --- Liste des clients importée ------------------------------------------ */

/* Le manuel a besoin de savoir combien de dossiers le cabinet suit. On ne le
   demande pas : on importe la liste, et on la compte (§ 6.1). */
function dbClientsImportes() { return demoLireEtat().clients; }

async function dbImporterListeClients(lignes) {
  demoMuter(e => { e.clients = lignes.slice(); });
  dbJournaliser('Liste des clients importée', `${lignes.length} ligne${lignes.length > 1 ? 's' : ''}`, null);
  return lignes.length;
}

/* Nombre de dossiers suivis : la liste importée si elle existe, sinon le
   portefeuille connu de ComplyEC. Jamais une saisie de l'utilisateur. */
function dbNombreDeClients() {
  const importes = dbClientsImportes();
  return importes.length ? importes.length : CLIENTS.length;
}

/* --- Formulaire cabinet du manuel ---------------------------------------- */

function dbManuelCabinet() { return demoLireEtat().manuelCabinet; }

async function dbMajManuelCabinet(champs) {
  demoMuter(e => { e.manuelCabinet = Object.assign({}, e.manuelCabinet, champs); });
  return true;
}

/* --- Registre RGPD des traitements --------------------------------------- */

function dbTraitements() {
  const modifs = demoLireEtat().traitementsModifs;
  const base = TRAITEMENTS_RGPD.map(t => Object.assign({}, t, modifs[t.id] || {}));
  return base.concat(demoLireEtat().traitements);
}

async function dbEnregistrerTraitement(traitement) {
  const existeDansBase = TRAITEMENTS_RGPD.some(t => t.id === traitement.id);
  demoMuter(e => {
    if (existeDansBase) {
      e.traitementsModifs[traitement.id] = Object.assign({}, e.traitementsModifs[traitement.id], traitement);
    } else {
      const i = e.traitements.findIndex(t => t.id === traitement.id);
      if (i >= 0) e.traitements[i] = traitement; else e.traitements.push(traitement);
    }
  });
  dbJournaliser('Traitement RGPD enregistré', traitement.finalite, null);
  return traitement;
}

async function dbSupprimerTraitement(id) {
  demoMuter(e => { e.traitements = e.traitements.filter(t => t.id !== id); });
  return true;
}

/* --- Charte IA ------------------------------------------------------------ */

function dbCharteIa() { return demoLireEtat().charteIa; }

async function dbEnregistrerCharteIa(charte) {
  const maj = Object.assign({ majLe: new Date().toISOString().slice(0, 10) }, charte);
  demoMuter(e => { e.charteIa = maj; });
  dbJournaliser('Charte IA enregistrée', `version du ${formatDate(maj.majLe)}`, null);
  return maj;
}

/* --- Contrats des prestataires -------------------------------------------- */

function dbContratsPrestataires() { return demoLireEtat().contratsPrestataires; }

async function dbDeposerContratPrestataire(prestataireId, fichier) {
  const le = new Date().toISOString().slice(0, 10);
  demoMuter(e => {
    e.contratsPrestataires[prestataireId] = { nom: fichier.nom, taille: fichier.taille, le };
  });
  dbJournaliser('Contrat prestataire déposé', fichier.nom, null);
  return true;
}

/* --- Programme annuel de surveillance ------------------------------------

   Six étapes (§ 11.1), et tout vit ici : l'échantillon, les actions
   correctives et l'évaluation annuelle ne sont pas des rubriques de menu, ce
   sont des moments du même processus annuel. */
function dbSurveillance() {
  const etat = demoLireEtat().surveillance || {};
  return etat[String(currentCalendarYear())] || {};
}

async function dbValiderEtapeSurveillance(code, donnees) {
  const annee = String(currentCalendarYear());
  const le = new Date().toISOString().slice(0, 10);
  demoMuter(e => {
    e.surveillance = e.surveillance || {};
    e.surveillance[annee] = e.surveillance[annee] || {};
    e.surveillance[annee][code] = Object.assign({ le, par: EXPERT_COMPTABLE.nom }, donnees || {});
  });
  const etape = SURVEILLANCE_PROGRAMME.find(x => x.code === code);
  dbJournaliser('Surveillance annuelle', etape ? etape.label : code, `validée le ${formatDate(le)}`);
  return true;
}

async function dbRouvrirEtapeSurveillance(code) {
  const annee = String(currentCalendarYear());
  demoMuter(e => {
    if (e.surveillance && e.surveillance[annee]) delete e.surveillance[annee][code];
  });
  return true;
}

/* --- Campagne d'indépendance ---------------------------------------------

   Une campagne par année civile : on génère les attestations, on les diffuse,
   on constate les retours. Trois dates, et c'est tout ce qu'il y a à retenir —
   le reste se déduit des déclarations elles-mêmes. */
function dbCampagneIndependance(annee) {
  const etat = demoLireEtat().campagnes || {};
  return etat[String(annee)] || { genereeLe: null, diffuseeLe: null };
}

async function dbGenererAttestations(annee) {
  const le = new Date().toISOString().slice(0, 10);
  demoMuter(e => {
    e.campagnes = e.campagnes || {};
    e.campagnes[String(annee)] = Object.assign({}, e.campagnes[String(annee)], { genereeLe: le });
  });
  dbJournaliser('Attestations d’indépendance générées', `Campagne ${annee}`, formatDate(le));
  return le;
}

async function dbDiffuserAttestations(annee) {
  const le = new Date().toISOString().slice(0, 10);
  demoMuter(e => {
    e.campagnes = e.campagnes || {};
    e.campagnes[String(annee)] = Object.assign({}, e.campagnes[String(annee)], { diffuseeLe: le });
  });
  dbJournaliser('Attestations d’indépendance diffusées', `Campagne ${annee}`, formatDate(le));
  return le;
}

/* --- Registre des formations ---------------------------------------------

   Un seul registre (§ 8). Les formations LCB-FT n'y ont pas de registre à part :
   elles y portent un indicateur, et un filtre suffit à les retrouver.

   Les sessions d'origine sont des formations LCB-FT externes : c'est ce
   qu'elles sont, pas une hypothèse. */
function dbRegistreFormations() {
  const liste = [];
  dbFormationsProgrammes().forEach(prog => prog.sessions.forEach(s => {
    liste.push({
      id: s.id,
      annee: prog.annee,
      nom: s.titre,
      organisme: s.organisme || s.formateur || '',
      interne: s.interne === undefined ? false : !!s.interne,
      lbcft: s.lbcft === undefined ? true : !!s.lbcft,
      date: s.date,
      participants: s.participants || [],
      attestations: s.attestations || {},
    });
  }));
  return liste.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

async function dbAjouterFormation(f) {
  const annee = Number(String(f.date).slice(0, 4)) || currentCalendarYear();
  return dbAjouterSessionFormation(annee, {
    titre: f.nom,
    organisme: f.organisme,
    interne: !!f.interne,
    lbcft: !!f.lbcft,
    date: f.date,
    participants: f.participants || COLLABORATEURS.map(c => c.id),
  });
}

/* --- Dépendance économique ------------------------------------------------

   Les honoraires se constatent, la part se calcule. Le chiffre d'affaires du
   cabinet vient de l'étape 1 du manuel : il n'est pas redemandé ici. */
function dbChiffreAffairesCabinet() {
  const cab = dbManuelCabinet().cabinet || {};
  const saisi = Number(cab.chiffreAffaires);
  return saisi > 0 ? saisi : null;
}

function dbDependanceLignes() {
  const etat = demoLireEtat();
  const modifs = etat.dependanceModifs || {};
  const ca = dbChiffreAffairesCabinet() || CABINET_CA_DEFAUT;
  const base = DEPENDANCE_LIGNES
    .filter(l => !(modifs[l.id] && modifs[l.id].supprimee))
    .map(l => Object.assign({}, l, modifs[l.id] || {}));
  return base.concat(etat.dependanceAjouts || []).map(l => {
    const honoraires = Number(l.honoraires) || 0;
    return Object.assign({}, l, { part: ca > 0 ? (honoraires / ca) * 100 : 0 });
  }).sort((a, b) => b.part - a.part);
}

async function dbEnregistrerDependance(ligne) {
  const dansBase = DEPENDANCE_LIGNES.some(l => l.id === ligne.id);
  demoMuter(e => {
    e.dependanceModifs = e.dependanceModifs || {};
    e.dependanceAjouts = e.dependanceAjouts || [];
    if (dansBase) {
      e.dependanceModifs[ligne.id] = Object.assign({}, e.dependanceModifs[ligne.id], ligne);
    } else if (ligne.id) {
      const i = e.dependanceAjouts.findIndex(l => l.id === ligne.id);
      if (i >= 0) e.dependanceAjouts[i] = ligne; else e.dependanceAjouts.push(ligne);
    } else {
      e.dependanceAjouts.push(Object.assign({}, ligne, { id: 'dep-' + Date.now() }));
    }
  });
  dbJournaliser('Dépendance économique', ligne.client, null);
  return true;
}

async function dbSupprimerDependance(id) {
  const dansBase = DEPENDANCE_LIGNES.some(l => l.id === id);
  demoMuter(e => {
    e.dependanceModifs = e.dependanceModifs || {};
    e.dependanceAjouts = e.dependanceAjouts || [];
    if (dansBase) e.dependanceModifs[id] = Object.assign({}, e.dependanceModifs[id], { supprimee: true });
    else e.dependanceAjouts = e.dependanceAjouts.filter(l => l.id !== id);
  });
  return true;
}

/* --- Suivi du registre des bénéficiaires effectifs ------------------------

   Ne pas confondre avec l'anomalie documentaire du même nom.

   Ici : le registre a-t-il été consulté, quand, et le résultat concorde-t-il ?
   C'est une donnée métier LCB-FT, et elle vient de Contractualisation quand le
   dossier y est passé.

   Là-bas, dans Anomalies > RBE : le justificatif de cette consultation est-il
   déposé dans le dossier ? C'est une question documentaire.

   Les deux peuvent diverger — un registre consulté sans justificatif classé est
   exactement le cas qu'un contrôleur relève. Les mélanger les rendrait tous
   les deux inutiles. */
function dbSuiviRbe() {
  const consultations = dbCampagneRbe();
  return CLIENTS.map(c => {
    const r = consultations.find(x => x.dossier === c.id);
    return {
      dossier: c.id,
      dossierInfo: c,
      consulteLe: r ? r.consulteLe : null,
      par: r ? r.par : null,
      resultat: r ? r.resultat : null,
      divergence: r ? r.divergence : null,
      beneficiaires: r ? (r.beneficiaires || []) : [],
      // D'où vient la ligne : du parcours de contractualisation, ou d'une
      // saisie faite ici. L'écran le dit, pour qu'on sache ce qu'on regarde.
      source: r && r.consulteLe ? (r.saisieDirecte ? 'saisie' : 'contractualisation') : null,
    };
  });
}

async function dbEnregistrerSuiviRbe(dossierId, champs) {
  demoMuter(e => {
    e.rbe[dossierId] = Object.assign({}, e.rbe[dossierId], champs, { saisieDirecte: true });
  });
  const d = client(dossierId);
  dbJournaliser('Suivi RBE mis à jour', d ? d.nom : dossierId,
    champs.resultat === 'divergence' ? 'divergence signalée' : 'concordant');
  return true;
}

/* --- Supervision des notes de synthèse -----------------------------------

   Superviser une note, ce n'est pas cocher une case : l'expert-comptable lit
   ce que le collaborateur a écrit, puis il ajoute deux choses que lui seul
   peut écrire — son retour sur le plan comptable, et ce qui est prévu pour
   l'assemblée générale ordinaire. Les deux sont conservés datés et signés,
   parce que c'est exactement la preuve que demande un contrôleur.

   Aucune relance n'est possible depuis cet écran : la note est déjà au
   dossier, le collaborateur a fait son travail. Ce qui manque est la revue de
   l'expert-comptable, et elle ne se délègue pas. */
function dbSupervisions() { return demoLireEtat().supervisions; }

function dbSupervisionDuDossier(dossierId) {
  return demoLireEtat().supervisions[dossierId] || null;
}

async function dbEnregistrerSupervision(dossierId, champs) {
  const ligne = Object.assign({
    revuLe: new Date().toISOString().slice(0, 10),
    par: EXPERT_COMPTABLE.nom,
  }, champs);
  demoMuter(e => {
    e.supervisions[dossierId] = Object.assign({}, e.supervisions[dossierId], ligne);
  });
  const d = client(dossierId);
  dbJournaliser('Note de synthèse supervisée', d ? d.nom : dossierId, null);
  return ligne;
}

/* --- Gouvernance ----------------------------------------------------------

   Qui dirige, qui signe, qui détient. Trois listes, saisies une fois, reprises
   par le manuel — jamais redemandées ailleurs. */
function dbGouvernance() {
  const g = demoLireEtat().gouvernance || {};
  return {
    expertsInscrits: g.expertsInscrits || GOUVERNANCE_DEFAUT.expertsInscrits,
    actionnariat: g.actionnariat || GOUVERNANCE_DEFAUT.actionnariat,
  };
}

async function dbMajGouvernance(champs) {
  demoMuter(e => { e.gouvernance = Object.assign({}, e.gouvernance, champs); });
  dbJournaliser('Gouvernance mise à jour', Object.keys(champs).join(', '), null);
  return true;
}
