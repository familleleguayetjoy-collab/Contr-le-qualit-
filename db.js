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
    score: analyse.score,
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
