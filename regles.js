// ComplyEC — référentiel des règles de contrôle (OUTIL 1 du mémoire)
'use strict';

/* Une anomalie n'est pas saisie : elle résulte d'une règle appliquée à un
   dossier. Ce fichier tient ces règles, une par diligence suivie, avec tout
   ce qui permet de les discuter : l'obligation, son fondement, le risque
   couvert, la preuve attendue, les dossiers concernés, la criticité, la
   personne chargée de régulariser et le délai.

   Le référentiel est VERSIONNÉ. Chaque anomalie détectée garde le numéro de
   la version qui l'a produite, chaque régularisation aussi : un résultat se
   relit toujours avec la règle qui l'a établi (plan, P3 ch. 2 S3 §2).

   Les fondements cités ici sont ceux que ComplyEC citait déjà ailleurs ;
   aucun n'a été ajouté de mémoire. Ils restent marqués « à vérifier » dans
   l'export tant que le cabinet ne les a pas relus dans le texte en vigueur.

   En démonstration, la détection reste celle du jeu d'essai (anomalies.js).
   En données réelles, c'est ce référentiel qui la produit. */

const REGLES_VERSION = {
  numero: '1.0',
  date: '2026-10-30',
  motif: 'Première version, arrêtée pour le pilote.',
};

/* Chaque modification du référentiel ajoute une ligne ici, avec son motif.
   C'est le circuit de modification du plan (P3 ch. 2 S3 §2) : on ne change
   pas une règle sans dire pourquoi, ni sans changer de version. */
const REGLES_HISTORIQUE = [
  { numero: '1.0', date: '2026-10-30', changements: [
    'Sept règles sur les dossiers (lettre de mission, identité, RBE, note de synthèse, supervision, vigilance, PPE) et deux sur les personnes (indépendance, formation).',
    'Le RBE s’applique aux personnes morales ; une forme juridique inconnue le rend applicable par prudence (faux positifs attendus, à mesurer).',
  ] },
];

/* Formes de personnes morales, lues en tête de la forme déclarée à l'import. */
const FORMES_PERSONNE_MORALE = ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SCI', 'SCM', 'SCP', 'SNC', 'SC',
  'SELARL', 'SELAS', 'SELAFA', 'SELCA', 'GIE', 'GAEC', 'EARL', 'SCEA', 'ASSOCIATION', 'SOCIETE', 'SOCIÉTÉ'];

/* true : personne morale ; false : personne physique ; null : on ne sait pas. */
function reglePersonneMorale(c) {
  const f = String((c && c.forme) || '').toUpperCase().trim();
  if (!f) return null;
  return FORMES_PERSONNE_MORALE.some(x => f === x || f.indexOf(x + ' ') === 0 || f.indexOf(x) === 0);
}

function regleNoteRedigee(c) { return !!(dbNotesSynthese() || {})[c.id]; }
function regleNotePresente(c) {
  return regleNoteRedigee(c) || !!dbRegularisations()['note_synthese_absente|' + c.id];
}

const REGLES = [
  {
    code: 'R1', court: 'Lettre de mission', type: 'lettre_mission_absente', onglet: 'lettres', portee: 'dossier',
    diligence: 'Lettre de mission signée',
    temporalite: 'Initiale, puis à chaque changement de mission',
    obligation: 'Chaque mission est encadrée par une lettre de mission acceptée par le client.',
    fondement: 'Décret n° 2012-432, art. 151',
    risque: 'Mission exercée sans cadre contractuel ; observation du contrôleur sur le dossier.',
    preuve: 'Lettre de mission signée, au dossier permanent.',
    modesPreuve: ['Pièce déposée par le collaborateur', 'Lettre établie dans ComplyEC', 'Pointée « présente au dossier »'],
    applicable: () => true,
    satisfaite: () => false,
    criticite: 'Majeure', responsable: 'Collaborateur du dossier', delaiJours: 30,
    jugement: 'Aucun : la règle constate la présence de la pièce, pas son contenu.',
  },
  {
    code: 'R2', court: 'Pièce d’identité', type: 'identite_absente', onglet: 'identite', portee: 'dossier',
    diligence: 'Pièce d’identité du client ou de son dirigeant',
    temporalite: 'Initiale, puis à expiration de la pièce',
    obligation: 'Le client est identifié et son identité vérifiée sur présentation d’un document probant.',
    fondement: 'CMF, art. L. 561-5',
    risque: 'Identification non justifiée ; manquement LCB-FT relevé au contrôle.',
    preuve: 'Copie de la pièce d’identité en cours de validité, au dossier permanent.',
    modesPreuve: ['Pièce déposée par le collaborateur', 'Pointée « présente au dossier »'],
    applicable: () => true,
    satisfaite: () => false,
    criticite: 'Majeure', responsable: 'Collaborateur du dossier', delaiJours: 30,
    jugement: 'La validité de la pièce (date d’expiration) reste à vérifier par la personne qui la dépose.',
  },
  {
    code: 'R3', court: 'Registre RBE', type: 'rbe_justificatif_absent', onglet: 'rbe', portee: 'dossier', pourLEc: true,
    diligence: 'Consultation du registre des bénéficiaires effectifs',
    temporalite: 'Initiale, puis à chaque événement modifiant la gouvernance',
    obligation: 'Les bénéficiaires effectifs sont identifiés ; une divergence avec le registre est signalée.',
    fondement: 'CMF, art. L. 561-2-2 et L. 561-5 ; art. L. 561-45-1 pour le signalement des divergences',
    risque: 'Bénéficiaire effectif inconnu du cabinet ; divergence non signalée.',
    preuve: 'Consultation datée du registre, consignée dans ComplyEC (concordance ou divergence).',
    modesPreuve: ['Consultation consignée par l’expert-comptable', 'Pointée « présente au dossier »'],
    applicable: c => reglePersonneMorale(c) !== false,
    satisfaite: c => !!((dbConsultationRbe(c.id) || {}).consulteLe),
    criticite: 'Majeure', responsable: 'Expert-comptable (seul habilité à consulter le registre)', delaiJours: 30,
    jugement: 'Le verdict (concordance ou divergence) est déduit de la comparaison saisie ; le signalement reste une décision de l’expert-comptable.',
    note: 'Forme juridique inconnue : la règle s’applique par prudence.',
  },
  {
    code: 'R4', court: 'Note de synthèse', type: 'note_synthese_absente', onglet: 'notes', portee: 'dossier',
    diligence: 'Note de synthèse de l’exercice',
    temporalite: 'Annuelle, à l’établissement des comptes',
    obligation: 'Les travaux de l’exercice sont résumés dans une note de synthèse au dossier.',
    fondement: 'NP 2300',
    risque: 'Travaux non documentés ; supervision impossible à démontrer.',
    preuve: 'Note de synthèse rédigée dans ComplyEC, ou note existante pointée présente.',
    modesPreuve: ['Note rédigée dans ComplyEC', 'Pointée « présente au dossier »'],
    applicable: () => true,
    satisfaite: c => regleNoteRedigee(c),
    criticite: 'Moyenne', responsable: 'Collaborateur du dossier', delaiJours: 60,
    jugement: 'Le contenu de la note relève du collaborateur, sa revue de l’expert-comptable (règle R5).',
  },
  {
    code: 'R5', court: 'Supervision', type: 'note_synthese_non_supervisee', onglet: 'notes', portee: 'dossier', pourLEc: true,
    diligence: 'Supervision de la note de synthèse',
    temporalite: 'Annuelle, après la note',
    obligation: 'L’expert-comptable revoit les travaux et en garde la trace.',
    fondement: 'NP 2300',
    risque: 'Supervision non démontrable au contrôle des dossiers.',
    preuve: 'Revue datée et signée dans ComplyEC.',
    modesPreuve: ['Supervision enregistrée dans ComplyEC'],
    applicable: c => regleNotePresente(c),
    satisfaite: c => !!dbSupervisionDuDossier(c.id),
    criticite: 'Majeure', responsable: 'Expert-comptable', delaiJours: 30,
    jugement: 'La revue est un acte de jugement professionnel : ComplyEC n’en constate que la trace.',
  },
  {
    code: 'R6', court: 'Vigilance LCB-FT', type: 'vigilance_absente', onglet: null, portee: 'dossier',
    suivi: 'Préparer le contrôle › LCB-FT › Vigilance LCB-FT',
    diligence: 'Analyse de vigilance LCB-FT',
    temporalite: 'Initiale, puis périodique selon le niveau de vigilance',
    obligation: 'Chaque relation d’affaires fait l’objet d’une évaluation du risque et d’un niveau de vigilance.',
    fondement: 'CMF, art. L. 561-5 et L. 561-5-1',
    risque: 'Niveau de vigilance non établi ; mesures inadaptées au risque.',
    preuve: 'Analyse enregistrée dans ComplyEC, niveau retenu par l’expert-comptable.',
    modesPreuve: ['Analyse enregistrée dans ComplyEC'],
    applicable: () => true,
    satisfaite: c => dbVigilanceDossiers().some(d => d.dossier === c.id && d.statut === 'complete'),
    criticite: 'Majeure', responsable: 'Collaborateur, niveau retenu par l’expert-comptable', delaiJours: 60,
    jugement: 'Le niveau de vigilance définitif est une décision de l’expert-comptable.',
  },
  {
    code: 'R7', court: 'Attestation PPE', type: 'ppe_attestation_absente', onglet: null, portee: 'dossier',
    suivi: 'Préparer le contrôle › LCB-FT › Attestations PPE',
    diligence: 'Attestation PPE du client',
    temporalite: 'Initiale, puis à chaque changement de dirigeant ou de bénéficiaire',
    obligation: 'Le statut de personne politiquement exposée est établi pour le client et ses bénéficiaires.',
    fondement: 'CMF, art. R. 561-18',
    risque: 'Personne exposée non détectée ; vigilance renforcée non appliquée.',
    preuve: 'Attestation signée par le client, déposée au dossier.',
    modesPreuve: ['Attestation déposée dans ComplyEC'],
    applicable: () => true,
    satisfaite: c => !!(((demoLireEtat().attestationsPpe || {})[c.id] || {}).deposeeLe),
    criticite: 'Moyenne', responsable: 'Collaborateur du dossier', delaiJours: 60,
    jugement: 'La qualification PPE reste à confirmer par l’expert-comptable.',
  },
  {
    code: 'R8', court: 'Indépendance', type: 'independance_absente', onglet: 'autres', portee: 'personne',
    diligence: 'Déclaration annuelle d’indépendance',
    temporalite: 'Annuelle, au 1er janvier',
    obligation: 'Chaque membre de l’équipe atteste chaque année de son indépendance.',
    fondement: 'Décret n° 2012-432, art. 145 et suivants',
    risque: 'Indépendance non démontrée ; menace non détectée.',
    preuve: 'Attestation signée électroniquement dans ComplyEC.',
    modesPreuve: ['Signature électronique simple dans ComplyEC'],
    criticite: 'Majeure', responsable: 'Chaque collaborateur', delaiJours: 30,
    jugement: 'Aucun : la règle constate la signature.',
  },
  {
    code: 'R9', court: 'Formation', type: 'formation_attestation_absente', onglet: 'autres', portee: 'personne',
    diligence: 'Attestation de formation',
    temporalite: 'À chaque session suivie',
    obligation: 'La participation aux formations, notamment LCB-FT, est justifiée.',
    fondement: 'CMF, art. L. 561-33 (formation LCB-FT)',
    risque: 'Formation non démontrable au contrôle.',
    preuve: 'Attestation déposée dans « Mes obligations ».',
    modesPreuve: ['Attestation déposée par le collaborateur'],
    criticite: 'Moyenne', responsable: 'Chaque collaborateur', delaiJours: 30,
    jugement: 'Aucun : la règle constate le dépôt.',
  },
];

function regleDuType(type) { return REGLES.find(r => r.type === type) || null; }

function aujourdhuiIso() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/* Les dossiers suivis : le portefeuille importé et les dossiers créés. */
function reglesDossiers() {
  return CLIENTS.concat(typeof dbDossiersAjoutes === 'function' ? dbDossiersAjoutes() : []);
}

/* Applique les règles « dossier » au portefeuille : une ligne par règle non
   satisfaite. La régularisation (pièce déposée, pointage, sans objet) est
   appliquée ensuite par anomaliesDossiers, comme pour la démonstration. */
function reglesEvaluer() {
  const detections = demoLireEtat().detections || {};
  const lignes = [];
  reglesDossiers().forEach(c => {
    REGLES.filter(r => r.portee === 'dossier').forEach(r => {
      let applicable = false;
      try { applicable = !!r.applicable(c); } catch (e) { applicable = false; }
      if (!applicable) return;
      let ok = false;
      try { ok = !!r.satisfaite(c); } catch (e) { ok = false; }
      const cle = `${r.type}|${c.id}`;
      const d = detections[cle];
      lignes.push({
        dossier: c.id, type: r.type, regle: r.code, cle, satisfaite: ok,
        affichee: !!r.onglet,
        detecteLe: d ? d.premiere : aujourdhuiIso(),
        version: d ? d.version : REGLES_VERSION.numero,
      });
    });
  });
  return lignes;
}

/* Ce que la page Anomalies affiche en données réelles. */
function reglesConstatsDossiers() {
  return reglesEvaluer().filter(l => !l.satisfaite && l.affichee)
    .map(l => ({ dossier: l.dossier, type: l.type, detecteLe: l.detecteLe, version: l.version }));
}

/* La date de première détection de chaque anomalie, et la version de la
   règle qui l'a produite, sont enregistrées une fois pour toutes. Sans elles,
   on ne peut mesurer ni l'ancienneté d'une anomalie ni le délai de sa
   régularisation. Écrit hors du rendu, et seulement ce qui est nouveau. */
let REGLES_DETECTION_MINUTERIE = null;
function reglesPlanifierDetections() {
  if (!modeCabinetReel()) return;
  if (REGLES_DETECTION_MINUTERIE) clearTimeout(REGLES_DETECTION_MINUTERIE);
  REGLES_DETECTION_MINUTERIE = setTimeout(reglesEnregistrerDetections, 1200);
}

function reglesEnregistrerDetections() {
  REGLES_DETECTION_MINUTERIE = null;
  if (!modeCabinetReel()) return;
  const connues = demoLireEtat().detections || {};
  const nouvelles = reglesEvaluer().filter(l => !l.satisfaite && !connues[l.cle]);
  if (!nouvelles.length) return;
  const le = aujourdhuiIso();
  demoMuter(e => {
    e.detections = Object.assign({}, e.detections);
    nouvelles.forEach(l => {
      if (!e.detections[l.cle]) e.detections[l.cle] = { premiere: le, version: REGLES_VERSION.numero, regle: l.regle };
    });
  });
}

// ------------------------------------------------------ Mesures du pilote

/* Natures de régularisation : comment l'anomalie est sortie de la liste. */
const NATURES_REGULARISATION = {
  piece: 'Pièce déposée',
  etablie: 'Document établi dans ComplyEC',
  pointage: 'Pointée présente au dossier',
  sans_objet: 'Sans objet (faux positif)',
  constat: 'Diligence faite dans ComplyEC',
};

function joursEntre(a, b) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000));
}

function mediane(valeurs) {
  if (!valeurs.length) return null;
  const v = valeurs.slice().sort((x, y) => x - y);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
}

/* Une ligne par règle « dossier » : combien de dossiers concernés, combien
   d'anomalies détectées, régularisées (et comment), encore ouvertes, et le
   délai de régularisation. Les chiffres du pilote sortent d'ici, pas d'un
   relevé fait à la main. */
function mesuresPilote() {
  const regs = dbRegularisations();
  const detections = demoLireEtat().detections || {};
  const evaluation = reglesEvaluer();
  const lignes = REGLES.filter(r => r.portee === 'dossier').map(r => {
    const ev = evaluation.filter(l => l.regle === r.code);
    const detectees = Object.keys(detections).filter(k => k.indexOf(r.type + '|') === 0);
    const parNature = {};
    const delais = [];
    let regularisees = 0;
    detectees.forEach(k => {
      const reg = regs[k];
      const ligne = ev.find(l => l.cle === k);
      if (reg) {
        regularisees += 1;
        const n = reg.nature || 'pointage';
        parNature[n] = (parNature[n] || 0) + 1;
        const j = joursEntre(detections[k].premiere, reg.le);
        if (j !== null) delais.push(j);
      } else if (ligne && ligne.satisfaite) {
        regularisees += 1;
        parNature.constat = (parNature.constat || 0) + 1;
      }
    });
    return {
      regle: r.code, type: r.type, diligence: r.diligence, court: r.court,
      applicables: ev.length,
      conformes: ev.filter(l => l.satisfaite || regs[l.cle]).length,
      detectees: detectees.length,
      regularisees,
      parNature,
      fauxPositifs: parNature.sans_objet || 0,
      ouvertes: ev.filter(l => !l.satisfaite && !regs[l.cle]).length,
      delaiMedianJours: mediane(delais),
      delaiMoyenJours: delais.length ? Math.round(delais.reduce((a, b) => a + b, 0) / delais.length) : null,
    };
  });
  return {
    version: REGLES_VERSION.numero,
    calculeLe: new Date().toISOString(),
    dossiers: reglesDossiers().length,
    etatDepart: (demoLireEtat().pilote || {}).etatDepart || null,
    regles: lignes,
  };
}

/* L'état de départ : la photographie du portefeuille au lancement du pilote.
   C'est la référence de comparaison du plan (P3 ch. 1 S1 §3) : on la fige
   AVANT de régulariser, sinon on ne mesure plus rien. */
async function figerEtatDepart() {
  const m = mesuresPilote();
  const etat = {
    le: aujourdhuiIso(),
    horodatage: new Date().toISOString(),
    par: auteurCourant(),
    version: REGLES_VERSION.numero,
    dossiers: m.dossiers,
    regles: m.regles.map(r => ({ regle: r.regle, applicables: r.applicables, ouvertes: r.ouvertes, conformes: r.conformes })),
    ouvertes: reglesEvaluer().filter(l => !l.satisfaite && !dbRegularisations()[l.cle]).map(l => l.cle),
  };
  demoMuter(e => { e.pilote = Object.assign({}, e.pilote, { etatDepart: etat }); });
  dbJournaliser('État de départ du pilote figé', `${etat.dossiers} dossiers`, `référentiel ${etat.version}`);
  return etat;
}

// ------------------------------------------------------------- Exports

function csvCellule(v) {
  const t = v === null || v === undefined ? '' : String(v);
  return /[;"\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

function telechargerTexte(nom, contenu, type) {
  const blob = new Blob(['﻿', contenu], { type: type || 'text/plain;charset=utf-8' });
  return remettreFichier(nom, blob);
}

/* Le détail, dossier par dossier, anonymisé par défaut : le mémoire et ses
   annexes ne citent aucun client. « Dossier 001 » remplace le nom, dans un
   ordre stable. */
function exporterResultatsPilote(anonymiser) {
  const regs = dbRegularisations();
  const detections = demoLireEtat().detections || {};
  const dossiers = reglesDossiers().slice().sort((a, b) => a.id.localeCompare(b.id));
  const alias = {};
  dossiers.forEach((c, i) => { alias[c.id] = 'Dossier ' + String(i + 1).padStart(3, '0'); });
  const entetes = ['dossier', 'forme', 'regle', 'diligence', 'statut', 'detectee_le', 'version_regle', 'regularisee_le', 'nature', 'delai_jours'];
  const lignes = reglesEvaluer().map(l => {
    const c = client(l.dossier) || {};
    const r = REGLES.find(x => x.code === l.regle);
    const reg = regs[l.cle];
    const d = detections[l.cle];
    const statut = l.satisfaite ? 'conforme' : (reg ? (reg.nature === 'sans_objet' ? 'sans_objet' : 'regularisee') : 'ouverte');
    return [
      anonymiser ? alias[l.dossier] : (c.nom || l.dossier),
      c.forme || '', l.regle, r ? r.diligence : '', statut,
      d ? d.premiere : '', d ? d.version : '',
      reg ? reg.le : '', reg ? (reg.nature || 'pointage') : '',
      d && reg ? joursEntre(d.premiere, reg.le) : '',
    ];
  });
  const csv = [entetes].concat(lignes).map(l => l.map(csvCellule).join(';')).join('\n');
  return telechargerTexte(`ComplyEC_pilote_${aujourdhuiIso()}${anonymiser ? '_anonymise' : ''}.csv`, csv, 'text/csv;charset=utf-8');
}

/* Le référentiel lui-même, tel qu'il est appliqué : c'est l'OUTIL 1 du
   mémoire, extrait du logiciel et non recopié à la main. */
function exporterReferentiel() {
  const entetes = ['code', 'diligence', 'portee', 'temporalite', 'obligation', 'fondement (à vérifier)', 'risque', 'preuve attendue', 'modes de preuve', 'criticite', 'responsable', 'delai (jours)', 'part de jugement'];
  const lignes = REGLES.map(r => [r.code, r.diligence, r.portee, r.temporalite, r.obligation, r.fondement, r.risque, r.preuve,
    (r.modesPreuve || []).join(' / '), r.criticite, r.responsable, r.delaiJours, r.jugement]);
  const csv = [[`Référentiel ComplyEC version ${REGLES_VERSION.numero} du ${REGLES_VERSION.date}`], entetes].concat(lignes)
    .map(l => l.map(csvCellule).join(';')).join('\n');
  return telechargerTexte(`ComplyEC_referentiel_v${REGLES_VERSION.numero}.csv`, csv, 'text/csv;charset=utf-8');
}

function exporterMesuresJson() {
  const contenu = JSON.stringify({ referentiel: REGLES_VERSION, historique: REGLES_HISTORIQUE, mesures: mesuresPilote() }, null, 2);
  return telechargerTexte(`ComplyEC_mesures_${aujourdhuiIso()}.json`, contenu, 'application/json;charset=utf-8');
}
