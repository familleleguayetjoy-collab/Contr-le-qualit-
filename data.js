// ComplyEC — données de démonstration (100% fictives, codées en dur)
// Toutes les vues sont calculées à partir de ces tableaux uniques afin que les
// chiffres restent cohérents d'un écran à l'autre (vue d'ensemble, par catégorie,
// par collaborateur, par dossier, relances...).

const COLLABORATEURS = [
  { id: 'julie', nom: 'Julie Bernard', role: 'Collaboratrice comptable', initiales: 'JB', couleur: '#2563EB' },
  { id: 'nathalie', nom: 'Nathalie Petit', role: 'Collaboratrice comptable', initiales: 'NP', couleur: '#F59E0B' },
  { id: 'heddy', nom: 'Heddy Lamri', role: 'Collaborateur comptable', initiales: 'HL', couleur: '#EAB308' },
  { id: 'thomas', nom: 'Thomas Durand', role: 'Collaborateur comptable', initiales: 'TD', couleur: '#16A34A' },
  { id: 'lucas', nom: 'Lucas Morel', role: 'Collaborateur comptable', initiales: 'LM', couleur: '#0EA5E9' },
];

const EXPERT_COMPTABLE = { nom: 'Martin Dupont', role: 'Expert-comptable', initiales: 'MD' };

/* Dates d'entrée dans le cabinet. Le décret n° 2026-310 impose une formation
   LBC-FT dès l'embauche : sans cette date, on ne peut pas dire si elle a été
   faite dans les temps. */
const COLLABORATEURS_EMBAUCHE = {
  julie: '2019-09-02',
  nathalie: '2021-03-15',
  heddy: '2023-01-09',
  thomas: '2025-11-03',
  lucas: '2026-06-01',
};

/* Collaborateurs partis. Ils ne comptent plus dans les effectifs, mais leurs
   justificatifs de formation doivent être conservés cinq ans après leur
   départ : ils restent donc au registre, avec la date jusqu'à laquelle les
   pièces ne doivent pas être détruites. */
const ANCIENS_COLLABORATEURS = [
  { id: 'sophie', nom: 'Sophie Renard', role: 'Collaboratrice comptable', dateEmbauche: '2018-04-02', dateDepart: '2025-02-28' },
];

// Réglages du cabinet (identité, signature, connexions externes). Modifiables
// dans l'écran Paramètres — persistés uniquement en mémoire dans cette
// démonstration (pas encore de table Supabase dédiée).
/* Part du chiffre d'affaires du cabinet au-delà de laquelle un client est
   considéré en dépendance économique.

   Aucun texte ne fixe de pourcentage : le code de déontologie (décret
   n° 2012-432) impose l'indépendance sans la chiffrer. 10 % est le repère
   couramment retenu par la profession. C'est donc un réglage du cabinet, et
   une seule valeur sert partout — écran de conformité, note de dépendance et
   manuel de procédures — pour qu'un contrôleur ne trouve jamais deux seuils
   différents dans deux documents du même cabinet. */
const SEUIL_DEPENDANCE_DEFAUT = 10;

/* L'article R. 561-23 du code monétaire et financier impose de désigner, et de
   déclarer à Tracfin et à l'autorité de contrôle, un déclarant — habilité à
   signer les déclarations de soupçon de l'article L. 561-15 — et un
   correspondant, chargé de répondre aux demandes de Tracfin. Ce sont deux rôles
   distincts, même s'ils peuvent être tenus par la même personne dans un petit
   cabinet. */
const CABINET_SETTINGS_DEFAUT = {
  seuilDependance: SEUIL_DEPENDANCE_DEFAUT,
  sessionsLbcftParAn: 2,
  ldmRevisionMois: 12,
  declarantTracfin: 'Martin Dupont',
  correspondantTracfin: 'Martin Dupont',
  tracfinDeclareAuService: false,
  nom: 'Cabinet Dupont & Associés',
  adresse: '12 rue des Comptes, 75008 Paris',
  telephone: '01 42 00 00 00',
  logoDataUrl: null,
  signature: "Martin Dupont\nExpert-comptable\nCabinet Dupont & Associés\n12 rue des Comptes, 75008 Paris\nTél. 01 42 00 00 00",
};

const CLIENTS = [
  { id: 'sas-nova', nom: 'SAS NOVA', forme: 'SAS', siret: '812 345 678 00014', collaborateur: 'nathalie', dirigeant: 'Claire Nova', activite: 'Conseil en communication' },
  { id: 'sci-durand', nom: 'SCI DURAND', forme: 'SCI', siret: '803 221 456 00021', collaborateur: 'heddy', dirigeant: 'Paul Durand', activite: 'Location immobilière' },
  { id: 'sarl-projet', nom: 'SARL PROJET', forme: 'SARL', siret: '791 654 321 00033', collaborateur: 'julie', dirigeant: 'Anaïs Roche', activite: 'Bureau d’études' },
  { id: 'eurl-alpes', nom: 'EURL ALPES', forme: 'EURL', siret: '845 112 998 00019', collaborateur: 'thomas', dirigeant: 'Marc Chevalier', activite: 'Négoce de matériel de montagne' },
  { id: 'sas-vision', nom: 'SAS VISION', forme: 'SAS', siret: '822 774 110 00027', collaborateur: 'heddy', dirigeant: 'Sophie Vidal', activite: 'Édition de logiciels' },
  { id: 'sci-martin', nom: 'SCI MARTIN', forme: 'SCI', siret: '789 456 123 00012', collaborateur: 'julie', dirigeant: 'Denis Martin', activite: 'Location immobilière' },
  { id: 'sarl-beta', nom: 'SARL BETA', forme: 'SARL', siret: '834 221 776 00045', collaborateur: 'julie', dirigeant: 'Farid Belkacem', activite: 'Négoce alimentaire' },
  { id: 'sas-innov', nom: 'SAS INNOV', forme: 'SAS', siret: '811 998 442 00018', collaborateur: 'nathalie', dirigeant: 'Camille Roux', activite: 'R&D électronique' },
  { id: 'sci-lumiere', nom: 'SCI LUMIÈRE', forme: 'SCI', siret: '798 334 210 00024', collaborateur: 'julie', dirigeant: 'Isabelle Lumière', activite: 'Location immobilière' },
  { id: 'sarl-alpha', nom: 'SARL ALPHA', forme: 'SARL', siret: '856 112 340 00031', collaborateur: 'nathalie', dirigeant: 'Karim Alami', activite: 'Menuiserie' },
  { id: 'eurl-ocean', nom: 'EURL OCEAN', forme: 'EURL', siret: '867 220 991 00016', collaborateur: 'nathalie', dirigeant: 'Yann Le Guen', activite: 'Import-export' },
  { id: 'sarl-dupont-immo', nom: 'SARL Dupont Immobilier', forme: 'SARL', siret: '531 234 567 00019', collaborateur: 'julie', dirigeant: 'Jean Dupont', activite: 'Marchands de biens immobiliers' },
  { id: 'sci-riviera', nom: 'SCI Riviera', forme: 'SCI', siret: '812 774 665 00022', collaborateur: 'nathalie', dirigeant: 'Michel Rey', activite: 'Location immobilière' },
  { id: 'sas-atlantique', nom: 'SAS Atlantique', forme: 'SAS', siret: '844 556 332 00029', collaborateur: 'julie', dirigeant: 'Nadia Fabre', activite: 'Transport maritime' },
  { id: 'eurl-nordic', nom: 'EURL Nordic', forme: 'EURL', siret: '822 998 110 00013', collaborateur: 'heddy', dirigeant: 'Erik Lund', activite: 'Import de mobilier scandinave' },
];

function client(id) { return CLIENTS.find(c => c.id === id); }
function collaborateur(id) { return COLLABORATEURS.find(c => c.id === id); }

const CATEGORIES_ANOMALIES = [
  { code: 'lettre_mission', label: 'Lettres de mission manquantes', priorite: 'Critique' },
  { code: 'ldm_non_actualisee', label: 'Lettres de mission non actualisées', priorite: 'Haute' },
  { code: 'piece_expiree', label: 'Pièces expirées', priorite: 'Haute' },
  { code: 'document_manquant', label: 'Documents manquants', priorite: 'Haute' },
  { code: 'supervision_manquante', label: 'Supervisions annuelles manquantes', priorite: 'Moyenne' },
  { code: 'classement_non_conforme', label: 'Classement non conforme', priorite: 'Faible' },
];

function categorieInfo(code) { return CATEGORIES_ANOMALIES.find(c => c.code === code); }

/* ------------------------------------------- Formulation de l'activité

   La lettre écrit « Votre activité principale est {activité}. » Un libellé
   recopié d'un annuaire — « Marchands de biens immobiliers », « Conseil pour
   les affaires » — y tombe mal. Les règles ci-dessous produisent une tournure
   qui s'insère correctement dans la phrase : minuscule initiale, singulier des
   têtes de groupe les plus courantes, articles parasites retirés.

   C'est une aide : la formulation reste modifiable et l'aperçu de la phrase
   complète est affiché pour qu'on juge sur pièce. */

const ACTIVITE_PLURIELS = [
  [/^marchands\b/i, 'marchand'], [/^conseils\b/i, 'conseil'], [/^travaux\b/i, 'travaux'],
  [/^activités\b/i, 'activité'], [/^services\b/i, 'service'], [/^ventes\b/i, 'vente'],
  [/^locations\b/i, 'location'], [/^transports\b/i, 'transport'], [/^commerces\b/i, 'commerce'],
  [/^fabrications\b/i, 'fabrication'], [/^installations\b/i, 'installation'],
  [/^réparations\b/i, 'réparation'], [/^études\b/i, 'étude'], [/^prestations\b/i, 'prestation'],
];

function reformulerActivite(brut) {
  let t = String(brut || '').trim();
  if (!t) return '';
  t = t.replace(/[.;]+$/, '').replace(/\s{2,}/g, ' ');
  // Un libellé tout en capitales est illisible dans une phrase.
  if (t === t.toUpperCase() && /[A-ZÀ-Þ]{4,}/.test(t)) t = t.toLowerCase();
  // Articles et amorces parasites.
  t = t.replace(/^(l['’]|la |le |les |une |un |des |du |de la )/i, '');
  t = t.replace(/^(activité de |activité d['’]|société de |société d['’]|entreprise de )/i, '');
  // Singulier des têtes de groupe courantes.
  for (const [motif, remplacement] of ACTIVITE_PLURIELS) {
    if (motif.test(t)) { t = t.replace(motif, remplacement); break; }
  }
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/* Phrase telle qu'elle apparaîtra dans la lettre, pour jugement sur pièce. */
function phraseActivite(activite, adresse) {
  const a = reformulerActivite(activite) || '…';
  const lieu = adresse ? ` Votre siège social est situé ${adresse}.` : '';
  return `Votre activité principale est ${a}.${lieu}`;
}

/* ---------------------------------- Nom de fichier normalisé des lettres générées

   Une lettre produite par ComplyEC porte un nom structuré, ce qui permet de la
   reconnaître plus tard sans l'ouvrir : cabinet, client, catégorie, date
   d'établissement et version. Une lettre qui ne suit pas ce motif vient
   forcément d'ailleurs et doit être analysée. */

const LDM_PREFIXE = 'LDM';

function ldmAssainir(texte) {
  return String(texte || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, 40);
}

function ldmNomFichier({ cabinet, client, categorie, date, version }) {
  const d = date || new Date().toISOString().slice(0, 10);
  return [
    LDM_PREFIXE,
    ldmAssainir(cabinet),
    ldmAssainir(client),
    ldmAssainir(categorie),
    d,
    'v' + (version || 1),
  ].join('_') + '.docx';
}

/* Reconnaît un nom produit par le logiciel. Renvoie null pour toute autre
   lettre — c'est précisément ce qui permet de trier les documents à analyser. */
function ldmLireNomFichier(nom) {
  const m = /^LDM_([A-Z0-9-]+)_([A-Z0-9-]+)_([A-Z0-9-]+)_(\d{4}-\d{2}-\d{2})_v(\d+)\.docx$/i.exec(String(nom || ''));
  if (!m) return null;
  return { cabinet: m[1], client: m[2], categorie: m[3], date: m[4], version: Number(m[5]), genereeParLogiciel: true };
}

/* ------------------------------------------ Analyse d'une lettre existante

   Les rubriques ci-dessous sont celles qu'un contrôleur cherche dans une lettre
   de mission (article 151 du code de déontologie et norme NP 2300) et qui
   figurent effectivement dans les modèles du cabinet. La détection se fait par
   repérage de formulations dans le texte du document : c'est une aide à la
   relecture, pas un avis. L'écran le dit. */

const LDM_RUBRIQUES_ATTENDUES = [
  // --- Exigées par la norme NP 2300 (« la lettre de mission comporte au
  //     moins… »), agréée par arrêté du 1er septembre 2016. Les cinq rubriques
  //     ci-dessous correspondent aux mentions vérifiées dans le texte de la
  //     norme : nature et objectif de la mission — y compris le fait qu'elle
  //     ne constitue ni un audit ni un examen limité —, responsabilités
  //     respectives du professionnel et de la direction, référence au code de
  //     déontologie et à la norme, et mention que la mission ne vise pas à
  //     déceler erreurs, actes illégaux ou autres irrégularités. Rien d'autre
  //     n'est classé ici : une mention présentée à tort comme exigée par la
  //     norme ferait conclure à une non-conformité inexistante.
  { code: 'nature_objectif', label: 'Nature et objectif de la mission', source: 'NP 2300', obligatoire: true,
    motifs: [/nature et objectif|objectif de (la|cette) mission/i, /mission de présentation|mission d.assistance|mission d.accompagnement|assurance de niveau modéré/i] },
  { code: 'ni_audit', label: 'Précision « ni audit ni examen limité »', source: 'NP 2300', obligatoire: true,
    motifs: [/ni un audit|ni audit|n.est pas un audit|examen limité/i] },
  { code: 'responsabilites', label: 'Responsabilités respectives du professionnel et de la direction', source: 'NP 2300', obligatoire: true,
    motifs: [/responsabilités respectives|obligations respectives|obligations du client|responsabilité de la direction/i] },
  { code: 'referentiel', label: 'Référence au code de déontologie et à la norme', source: 'NP 2300', obligatoire: true,
    motifs: [/code de déontologie/i], motifsComplementaires: [/norme professionnelle|NP 2300|norme applicable/i] },
  { code: 'pas_deceler', label: 'Mention « la mission ne vise pas à déceler erreurs et irrégularités »', source: 'NP 2300', obligatoire: true,
    motifs: [/déceler des erreurs|actes illégaux|irrégularités/i] },

  // --- Exigées par l'article 151 du décret n° 2012-432 : contrat écrit
  //     définissant la mission, droits et obligations, conditions financières.
  { code: 'parties', label: 'Identification des parties', source: 'Art. 151', obligatoire: true,
    motifs: [/lettre de mission/i], motifsComplementaires: [/votre entreprise|dénomination|entre les soussign|siège social/i] },
  { code: 'honoraires', label: 'Conditions financières (honoraires et règlement)', source: 'Art. 151', obligatoire: true,
    motifs: [/honoraires/i], motifsComplementaires: [/total des honoraires|montant|€|euros|règlement/i] },

  // --- Attendues en pratique lors d'un contrôle qualité, sans être listées
  //     comme telles par la norme.
  { code: 'duree', label: 'Durée de la mission et reconduction', source: 'Pratique', obligatoire: true,
    motifs: [/durée de la mission|tacite reconduction/i] },
  { code: 'resiliation', label: 'Résiliation et interruption', source: 'Pratique', obligatoire: true,
    motifs: [/résilia|interrompre la mission|dénonciation/i] },
  { code: 'secret', label: 'Secret professionnel', source: 'Pratique', obligatoire: true,
    motifs: [/secret professionnel/i] },
  // Figure dans tous les modèles du cabinet et se relit utilement, mais je n'ai
  // pas pu vérifier qu'elle compte parmi les mentions minimales de la NP 2300 :
  // elle est donc classée en pratique de place, et non comme exigence de norme.
  { code: 'limites_travaux', label: 'Limites des travaux (réalité, exhaustivité, inventaires, contrôle interne)', source: 'Pratique', obligatoire: true,
    motifs: [/réalité et de l.exhaustivité|inventaires physiques|contrôle interne|limites des travaux/i] },
  { code: 'lbcft', label: 'Obligations d’identification (LBC-FT)', source: 'Pratique', obligatoire: true,
    motifs: [/obligations d.identification|blanchiment|LCB-FT|LBC-FT|vigilance/i] },
  { code: 'rgpd', label: 'Protection des données personnelles', source: 'Pratique', obligatoire: true,
    motifs: [/données à caractère personnel|RGPD|protection des données/i] },
  { code: 'assurance', label: 'Responsabilité et assurance', source: 'Pratique', obligatoire: false,
    motifs: [/responsabilité civile|assurance/i] },
  { code: 'differends', label: 'Différends et droit applicable', source: 'Pratique', obligatoire: false,
    motifs: [/différend|droit applicable|attribution de compétence/i] },
  { code: 'signature', label: 'Mention d’acceptation et signature', source: 'Art. 151', obligatoire: true,
    motifs: [/bon pour accord|acceptation des conditions|signature/i] },
];

/* La NP 2300 s'applique à la mission de présentation des comptes. Une lettre
   d'assistance déclarative (IRPP, revenus fonciers) n'a pas à porter ses
   mentions : les réclamer produirait de faux manquements, ce qui est pire que
   de ne rien dire. On regarde donc d'abord de quelle mission il s'agit. */
function ldmEstMissionPresentation(texte) {
  const t = String(texte || '');
  if (/assistance (à l'établissement de la déclaration|déclarative|IR\b|aux revenus fonciers)/i.test(t)) return false;
  return /mission de présentation|présentation des comptes|comptes annuels/i.test(t);
}

function ldmAnalyserTexte(texte) {
  const t = String(texte || '');
  const presentation = ldmEstMissionPresentation(t);
  const rubriques = LDM_RUBRIQUES_ATTENDUES
    .filter(r => r.source !== 'NP 2300' || presentation)
    .map(r => {
      const trouve = r.motifs.some(m => m.test(t))
        && (!r.motifsComplementaires || r.motifsComplementaires.some(m => m.test(t)));
      return { ...r, trouve };
    });
  const manquantes = rubriques.filter(r => !r.trouve && r.obligatoire);
  const presentes = rubriques.filter(r => r.trouve);

  // Un texte abrogé dans une lettre est une faute lourde : on le signale à part.
  const alertes = [];
  if (/2007-1387/.test(t)) {
    alertes.push('La lettre cite le décret n° 2007-1387, abrogé depuis 2012 et remplacé par le décret n° 2012-432.');
  }
  if (/ordonnance n° 45-2138/i.test(t) && !/2012-432/.test(t)) {
    alertes.push('La lettre ne cite pas le décret n° 2012-432, qui porte le code de déontologie en vigueur.');
  }
  const annees = (t.match(/\b(19|20)\d{2}\b/g) || []).map(Number).filter(a => a >= 2000 && a <= 2100);
  const plusRecente = annees.length ? Math.max(...annees) : null;

  const manquantesNorme = manquantes.filter(r => r.source === 'NP 2300' || r.source === 'Art. 151');
  return {
    presentation, rubriques, presentes, manquantes, manquantesNorme, alertes, anneeLaPlusRecente: plusRecente,
    score: Math.round((presentes.length / rubriques.length) * 100),
  };
}

/* ------------------------------------------- Actualisation des lettres de mission

   Le contrôle qualité relève bien plus souvent une lettre de mission *ancienne*
   qu'une lettre *absente* : d'après les chiffres de la campagne 2025 relayés
   par la presse professionnelle, l'actualisation représente la majorité des
   observations. Il n'existe pas d'obligation normative chiffrée imposant une
   révision annuelle — c'est une bonne pratique, pas une règle sanctionnée comme
   telle. Le seuil ci-dessous est donc un réglage du cabinet, pas un texte, et
   l'écran le dit. */

/* Aucun texte n'impose de réviser une lettre de mission à échéance fixe : ces
   deux seuils sont des réglages du cabinet, et l'écran des paramètres permet
   de les changer. Le seuil critique vaut le double du seuil d'alerte, pour
   qu'un seul réglage suffise. */
const LDM_SEUIL_ALERTE_MOIS = 12;   // au-delà : à réviser
const LDM_SEUIL_CRITIQUE_MOIS = 24; // au-delà : ancienneté difficilement défendable

function ldmSeuils(settings) {
  const alerte = Number((settings && settings.ldmRevisionMois) || LDM_SEUIL_ALERTE_MOIS);
  return { alerte, critique: alerte * 2 };
}

const LETTRES_MISSION = {
  'sas-nova': { dateSignature: '2023-04-10', derniereActualisation: '2026-01-10', signataire: 'Julien LESNES', honorairesMensuels: 150 },
  'sci-durand': { dateSignature: '2023-04-11', derniereActualisation: '2026-02-11', signataire: 'Thierry BOZZOLA', honorairesMensuels: 195 },
  'sarl-projet': { dateSignature: '2022-03-12', derniereActualisation: '2025-03-03', signataire: 'Julien LESNES', honorairesMensuels: 240 },
  'eurl-alpes': { dateSignature: '2022-04-13', derniereActualisation: '2025-04-04', signataire: 'Thierry BOZZOLA', honorairesMensuels: 285 },
  'sas-vision': { dateSignature: '2019-05-14', derniereActualisation: '2019-05-14', signataire: 'Julien LESNES', honorairesMensuels: 330 },
  'sci-martin': { dateSignature: '2020-06-15', derniereActualisation: '2020-06-15', signataire: 'Thierry BOZZOLA', honorairesMensuels: 375 },
  'sarl-beta': { dateSignature: '2021-07-16', derniereActualisation: '2021-07-16', signataire: 'Julien LESNES', honorairesMensuels: 420 },
  'sas-innov': { dateSignature: '2023-04-17', derniereActualisation: '2026-03-17', signataire: 'Thierry BOZZOLA', honorairesMensuels: 465 },
  'sci-lumiere': { dateSignature: '2023-04-18', derniereActualisation: '2026-04-18', signataire: 'Julien LESNES', honorairesMensuels: 510 },
  'sarl-alpha': { dateSignature: '2022-02-10', derniereActualisation: '2025-04-02', signataire: 'Thierry BOZZOLA', honorairesMensuels: 150 },
  'eurl-ocean': { dateSignature: '2022-03-11', derniereActualisation: '2025-05-03', signataire: 'Julien LESNES', honorairesMensuels: 195 },
  'sarl-dupont-immo': { dateSignature: '2022-04-12', derniereActualisation: '2022-04-12', signataire: 'Thierry BOZZOLA', honorairesMensuels: 240 },
  'sci-riviera': { dateSignature: '2019-05-13', derniereActualisation: '2019-05-13', signataire: 'Julien LESNES', honorairesMensuels: 285 },
  'sas-atlantique': { dateSignature: '2020-06-14', derniereActualisation: '2020-06-14', signataire: 'Thierry BOZZOLA', honorairesMensuels: 330 },
  'eurl-nordic': { dateSignature: '2023-04-15', derniereActualisation: '2026-05-15', signataire: 'Julien LESNES', honorairesMensuels: 375 },
};

function ldmStatut(dossierId, settings) {
  const l = LETTRES_MISSION[dossierId];
  if (!l) return { etat: 'absente', label: 'Aucune lettre de mission', couleur: 'rouge', mois: null };
  const seuils = ldmSeuils(settings);
  const mois = moisDepuis(l.derniereActualisation);
  if (mois >= seuils.critique) return { ...l, etat: 'critique', label: `Non actualisée depuis ${Math.floor(mois / 12)} ans`, couleur: 'rouge', mois };
  if (mois >= seuils.alerte) return { ...l, etat: 'a_reviser', label: `À réviser (${mois} mois)`, couleur: 'orange', mois };
  return { ...l, etat: 'a_jour', label: `À jour (${mois} mois)`, couleur: 'vert', mois };
}

function ldmSuiviCabinet(settings) {
  const lignes = CLIENTS.map(c => ({ client: c, statut: ldmStatut(c.id, settings) }));
  return {
    lignes,
    absentes: lignes.filter(l => l.statut.etat === 'absente'),
    critiques: lignes.filter(l => l.statut.etat === 'critique'),
    aReviser: lignes.filter(l => l.statut.etat === 'a_reviser'),
    aJour: lignes.filter(l => l.statut.etat === 'a_jour'),
  };
}

// Chaque anomalie est rattachée à un dossier, une catégorie et un collaborateur.
// Toutes les vues (vue d'ensemble, par catégorie, par collaborateur, par dossier,
// relances & suivi) sont dérivées de ce tableau unique.
const ANOMALIES = [
  { id: 'a01', dossier: 'sas-nova', categorie: 'supervision_manquante', collaborateur: 'nathalie', priorite: 'Critique', titre: 'Absence de supervision annuelle', description: "Aucune supervision annuelle n'a été réalisée pour l'exercice 2025.", dateDetection: '2026-01-15', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-02', commentaire: "Dans le cadre des obligations LBC-FT, une supervision annuelle est requise pour évaluer les risques et mettre à jour les informations." },
  { id: 'a02', dossier: 'sas-nova', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "La pièce d'identité du dirigeant est arrivée à expiration.", dateDetection: '2026-04-10', dernierAction: 'Relance envoyée le 02/05', statut: 'en_cours', dateDemandeEC: '2026-05-02', commentaire: "Pièce d'identité arrivée à expiration, à renouveler auprès du client." },
  { id: 'a03', dossier: 'sas-nova', categorie: 'document_manquant', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Bénéficiaires effectifs (RBE) manquants', description: "Le registre des bénéficiaires effectifs n'a pas été collecté.", dateDetection: '2026-03-22', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-03', commentaire: "Document obligatoire dans le cadre de la vigilance LBC-FT." },
  { id: 'a04', dossier: 'sas-nova', categorie: 'classement_non_conforme', collaborateur: 'nathalie', priorite: 'Moyenne', titre: 'Classement non conforme', description: "L'arborescence Drive du dossier ne respecte pas le plan de classement du cabinet.", dateDetection: '2026-04-28', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "Les documents comptables ne sont pas classés dans les bons sous-dossiers." },

  { id: 'a05', dossier: 'sci-durand', categorie: 'piece_expiree', collaborateur: 'heddy', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "Carte d'identité du gérant expirée depuis le 03/2026.", dateDetection: '2026-04-02', dernierAction: 'Relance envoyée le 01/05', statut: 'en_cours', dateDemandeEC: '2026-05-01', commentaire: "Pièce à renouveler avant la prochaine échéance de dépôt." },
  { id: 'a06', dossier: 'sci-durand', categorie: 'document_manquant', collaborateur: 'heddy', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS du dossier n’a pas été collecté.', dateDetection: '2026-04-30', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Nécessaire pour la mise à jour du dossier permanent." },
  { id: 'a07', dossier: 'sci-durand', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission signée n’a été retrouvée dans le Drive.', dateDetection: '2026-03-12', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-04', commentaire: "Aucune lettre de mission trouvée dans le dossier Drive." },

  { id: 'a08', dossier: 'sarl-projet', categorie: 'document_manquant', collaborateur: 'julie', priorite: 'Haute', titre: 'Bénéficiaires effectifs (RBE) manquants', description: "Le registre des bénéficiaires effectifs n'a pas été collecté.", dateDetection: '2026-04-18', dernierAction: 'Relance envoyée le 03/05', statut: 'en_cours', dateDemandeEC: '2026-05-03', commentaire: "Document obligatoire dans le cadre de la vigilance LBC-FT." },
  { id: 'a09', dossier: 'sarl-projet', categorie: 'piece_expiree', collaborateur: 'julie', priorite: 'Haute', titre: 'Attestation PPE expirée', description: "L'attestation PPE du dirigeant date de plus de 3 ans.", dateDetection: '2026-04-05', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "À renouveler dans le cadre de la vigilance LBC-FT." },
  { id: 'a10', dossier: 'sarl-projet', categorie: 'classement_non_conforme', collaborateur: 'julie', priorite: 'Moyenne', titre: 'Classement non conforme', description: 'Les pièces sociales sont classées dans le dossier comptable.', dateDetection: '2026-04-29', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "À reclasser selon le plan de classement du cabinet." },

  { id: 'a11', dossier: 'eurl-alpes', categorie: 'piece_expiree', collaborateur: 'thomas', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "Pièce d'identité du dirigeant expirée.", dateDetection: '2026-04-08', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-04', commentaire: "À renouveler avant la clôture de l'exercice." },
  { id: 'a12', dossier: 'eurl-alpes', categorie: 'document_manquant', collaborateur: 'thomas', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS n’a pas été collecté.', dateDetection: '2026-04-20', dernierAction: 'Relance envoyée le 28/04', statut: 'en_cours', dateDemandeEC: '2026-04-28', commentaire: "Document requis pour la mise à jour du dossier permanent." },

  { id: 'a13', dossier: 'sas-vision', categorie: 'classement_non_conforme', collaborateur: 'heddy', priorite: 'Faible', titre: 'Classement non conforme', description: 'Les factures fournisseurs ne sont pas nommées selon la convention du cabinet.', dateDetection: '2026-04-25', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Renommage à effectuer selon la convention AAAA-MM-fournisseur." },
  { id: 'a14', dossier: 'sas-vision', categorie: 'supervision_manquante', collaborateur: 'heddy', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "La supervision annuelle de l'exercice 2025 n'a pas encore été réalisée.", dateDetection: '2026-02-01', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-07', commentaire: "À planifier avant la prochaine réunion bilan." },

  { id: 'a15', dossier: 'sci-martin', categorie: 'lettre_mission', collaborateur: 'julie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission trouvée dans le dossier Drive.', dateDetection: '2026-03-12', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-02', commentaire: "Aucune lettre de mission trouvée dans le dossier Drive." },
  { id: 'a16', dossier: 'sarl-beta', categorie: 'lettre_mission', collaborateur: 'julie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Le dossier a été ouvert sans génération de lettre de mission.', dateDetection: '2026-03-18', dernierAction: 'Relance envoyée le 02/05', statut: 'en_cours', dateDemandeEC: '2026-05-02', commentaire: "Lettre de mission à générer via le module de contractualisation." },
  { id: 'a17', dossier: 'sas-vision', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Lettre de mission introuvable pour l’exercice en cours.', dateDetection: '2026-03-20', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "À régulariser rapidement, dossier en mission de présentation." },
  { id: 'a18', dossier: 'sas-innov', categorie: 'lettre_mission', collaborateur: 'nathalie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission signée retrouvée.', dateDetection: '2026-03-25', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-03', commentaire: "Dossier repris récemment, lettre de mission à établir en priorité." },
  { id: 'a19', dossier: 'eurl-nordic', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Lettre de mission non signée par le client.', dateDetection: '2026-04-01', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Relance client à prévoir pour signature." },

  { id: 'a20', dossier: 'sci-lumiere', categorie: 'document_manquant', collaborateur: 'julie', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS du dossier n’a pas été collecté.', dateDetection: '2026-04-15', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-07', commentaire: "Nécessaire pour la mise à jour du dossier permanent." },
  { id: 'a21', dossier: 'sarl-alpha', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Attestation PPE expirée', description: "L'attestation PPE du dirigeant date de plus de 3 ans.", dateDetection: '2026-04-12', dernierAction: 'Relance envoyée le 30/04', statut: 'en_cours', dateDemandeEC: '2026-04-30', commentaire: "À renouveler dans le cadre de la vigilance LBC-FT." },
  { id: 'a22', dossier: 'eurl-ocean', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "Pièce d'identité du dirigeant expirée.", dateDetection: '2026-04-14', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-08', commentaire: "À renouveler auprès du client." },
  { id: 'a23', dossier: 'sci-riviera', categorie: 'document_manquant', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Bénéficiaires effectifs (RBE) manquants', description: 'Registre des bénéficiaires effectifs non transmis.', dateDetection: '2026-04-16', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-08', commentaire: "Document requis pour la vigilance LBC-FT." },

  { id: 'a24', dossier: 'sas-atlantique', categorie: 'supervision_manquante', collaborateur: 'julie', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "Supervision de l'exercice 2025 non réalisée.", dateDetection: '2026-02-10', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-09', commentaire: "À planifier avant la clôture définitive." },
  { id: 'a25', dossier: 'eurl-nordic', categorie: 'supervision_manquante', collaborateur: 'heddy', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "Supervision de l'exercice 2025 non réalisée.", dateDetection: '2026-02-14', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-09', commentaire: "Dossier en attente de planification." },
  { id: 'a26', dossier: 'sas-innov', categorie: 'classement_non_conforme', collaborateur: 'nathalie', priorite: 'Faible', titre: 'Classement non conforme', description: 'Documents fiscaux classés hors de l’arborescence standard.', dateDetection: '2026-04-27', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-10', commentaire: "À reclasser selon le plan de classement du cabinet." },
];

function anomaliesParCategorie() {
  return CATEGORIES_ANOMALIES.map(cat => {
    const items = ANOMALIES.filter(a => a.categorie === cat.code);
    const dossiers = new Set(items.map(a => a.dossier));
    return { ...cat, anomalies: items.length, dossiers: dossiers.size, items };
  });
}

function anomaliesParCollaborateurList() {
  return COLLABORATEURS.map(col => {
    const items = ANOMALIES.filter(a => a.collaborateur === col.id);
    const dossiers = new Set(items.map(a => a.dossier));
    const priorites = items.map(a => a.priorite);
    const prioriteMax = ['Critique', 'Haute', 'Moyenne', 'Faible'].find(p => priorites.includes(p)) || 'Faible';
    return { ...col, anomalies: items.length, dossiers: dossiers.size, prioriteMoyenne: prioriteMax, items };
  }).sort((a, b) => b.anomalies - a.anomalies);
}

function anomaliesParDossierList() {
  const dossierIds = [...new Set(ANOMALIES.map(a => a.dossier))];
  return dossierIds.map(id => {
    const items = ANOMALIES.filter(a => a.dossier === id);
    const priorites = items.map(a => a.priorite);
    const prioriteMax = ['Critique', 'Haute', 'Moyenne', 'Faible'].find(p => priorites.includes(p)) || 'Faible';
    const collabId = items[0].collaborateur;
    return { dossier: client(id), anomalies: items.length, priorite: prioriteMax, collaborateur: collaborateur(collabId), items };
  }).sort((a, b) => b.anomalies - a.anomalies);
}

function relancesList() {
  return ANOMALIES.filter(a => a.dateDemandeEC).map(a => ({ ...a, dossierInfo: client(a.dossier), collaborateurInfo: collaborateur(a.collaborateur) }))
    .sort((a, b) => new Date(b.dateDemandeEC) - new Date(a.dateDemandeEC));
}

// L'exercice comptable en cours de supervision est celui clos au 31/12 de
// l'année précédente : tant que l'année civile N n'est pas terminée, on
// supervise l'exercice N-1. Ce calcul bascule donc automatiquement au 1er
// janvier, sans configuration.
function currentExerciceYear() {
  return new Date().getFullYear() - 1;
}

// À l'inverse, les obligations "annuelles cabinet" (formations, déclaration
// d'indépendance) portent sur l'année civile en cours, pas sur un exercice
// clos : elles redémarrent au 1er janvier.
function currentCalendarYear() {
  return new Date().getFullYear();
}

const STATUT_LABELS = {
  a_faire: { label: 'À faire', couleur: 'orange' },
  en_cours: { label: 'En cours', couleur: 'bleu' },
  en_retard: { label: 'En retard', couleur: 'rouge' },
  termine: { label: 'Terminé', couleur: 'vert' },
};

const PRIORITE_COULEURS = {
  Critique: 'rouge',
  Haute: 'orange',
  Moyenne: 'jaune',
  Faible: 'vert',
};

// --- Formations LBC-FT -------------------------------------------------------

const FORMATIONS_PROGRAMMES = [
  { id: 'form-2026', annee: 2026, sessions: [
    { id: 's1', titre: 'Actualisation LBC-FT — obligations déclaratives Tracfin', date: '2026-03-18', formateur: 'CNCC Formation',
      participants: ['julie', 'nathalie', 'heddy', 'thomas', 'lucas'],
      attestations: {
        julie: { recue: true, dateUpload: '2026-03-20' },
        nathalie: { recue: false },
        heddy: { recue: true, dateUpload: '2026-03-19' },
        thomas: { recue: false },
        lucas: { recue: false },
      } },
    { id: 's2', titre: 'Gel des avoirs et sanctions internationales', date: '2026-09-10', formateur: 'CNCC Formation',
      participants: ['julie', 'nathalie', 'heddy', 'thomas', 'lucas'],
      attestations: {
        julie: { recue: false }, nathalie: { recue: false }, heddy: { recue: false }, thomas: { recue: false }, lucas: { recue: false },
      } },
  ] },
];

// Un collaborateur est "à jour" s'il a une attestation reçue pour la dernière
// session déjà passée du programme de l'année en cours.
function formationsNonAJour() {
  const programme = FORMATIONS_PROGRAMMES.find(p => p.annee === currentCalendarYear());
  if (!programme) return COLLABORATEURS.map(c => ({ collaborateur: c.id, derniereFormation: dernierAttestationRecue(c.id) }));
  const today = new Date();
  const sessionsPassees = programme.sessions.filter(s => new Date(s.date) <= today);
  const derniereSession = sessionsPassees[sessionsPassees.length - 1];
  if (!derniereSession) return [];
  return derniereSession.participants
    .filter(pid => !(derniereSession.attestations[pid] && derniereSession.attestations[pid].recue))
    .map(pid => ({ collaborateur: pid, derniereFormation: dernierAttestationRecue(pid) }));
}

function dernierAttestationRecue(collabId) {
  let last = null;
  FORMATIONS_PROGRAMMES.forEach(prog => prog.sessions.forEach(s => {
    const a = s.attestations[collabId];
    if (a && a.recue && (!last || s.date > last)) last = s.date;
  }));
  return last;
}

/* ------------------------------------- Registre de formation LBC-FT

   L'article D. 561-38-1-1 du code monétaire et financier, créé par le décret
   n° 2026-310 du 24 avril 2026 (en vigueur depuis le 26 avril 2026), a
   transformé une obligation jusque-là diffuse en obligation précise :

   - former les personnes qui concourent aux obligations LBC-FT dès leur
     embauche, puis de manière régulière ;
   - adapter le contenu ET la fréquence aux risques identifiés ainsi qu'aux
     fonctions, activités et positions hiérarchiques des personnes concernées ;
   - conserver les justificatifs pendant toute la durée des fonctions, puis
     cinq ans après le départ de la personne.

   Le texte ne fixe pas de périodicité chiffrée : le rythme retenu est celui
   du cabinet, et l'outil le présente comme tel. */

const FORMATION_DECRET = 'décret n° 2026-310 du 24 avril 2026';
const FORMATION_ARTICLE = 'CMF art. D. 561-38-1-1';
const FORMATION_CONSERVATION_ANS = 5;
// Délai que le cabinet se donne pour former un nouvel arrivant. Le décret dit
// « dès l'embauche » sans chiffrer : c'est donc un réglage interne.
const FORMATION_DELAI_ACCUEIL_JOURS = 90;

/* Formation d'accueil LBC-FT, distincte des sessions annuelles : elle se donne
   à l'arrivée de la personne, pas au rythme du programme du cabinet. */
const FORMATIONS_ACCUEIL = {
  julie: { date: '2019-09-16' },
  nathalie: { date: '2021-04-02' },
  heddy: { date: '2023-02-20' },
  thomas: null,   // embauché en novembre 2025, jamais formé à l'accueil
  lucas: null,    // embauché en juin 2026, formation d'accueil non encore faite
  sophie: { date: '2018-05-14' },
};

function joursEntre(isoA, isoB) {
  return Math.round((new Date(isoB + 'T00:00:00') - new Date(isoA + 'T00:00:00')) / 86400000);
}

function ajouterAnnees(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setFullYear(d.getFullYear() + n);
  return d.toISOString().slice(0, 10);
}

/* Une ligne par personne — présente ou partie — avec ce qu'un contrôleur
   demande : quand elle est entrée, si elle a été formée à l'arrivée, quand
   remonte sa dernière formation, et jusqu'à quand ses pièces se conservent. */
function registreFormation() {
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const ligne = (id, nom, role, dateEmbauche, dateDepart) => {
    const accueil = FORMATIONS_ACCUEIL[id] || null;
    const delai = accueil ? joursEntre(dateEmbauche, accueil.date) : null;
    let etatAccueil, detailAccueil;
    if (accueil) {
      etatAccueil = delai <= FORMATION_DELAI_ACCUEIL_JOURS ? 'ok' : 'partiel';
      detailAccueil = `Suivie le ${formatDate(accueil.date)}, ${delai} ${pluriel(delai, 'jour')} après l'embauche`;
    } else {
      const anciennete = joursEntre(dateEmbauche, dateDepart || aujourdhui);
      etatAccueil = 'absent';
      detailAccueil = `Jamais suivie — dans le cabinet depuis ${anciennete} ${pluriel(anciennete, 'jour')}`;
    }
    const derniere = dernierAttestationRecue(id);
    return {
      id, nom, role, dateEmbauche, dateDepart,
      accueil: { etat: etatAccueil, detail: detailAccueil, date: accueil ? accueil.date : null },
      derniereFormation: derniere,
      // Pendant les fonctions, puis cinq ans après le départ.
      conserverJusquA: dateDepart ? ajouterAnnees(dateDepart, FORMATION_CONSERVATION_ANS) : null,
      parti: Boolean(dateDepart),
    };
  };

  const presents = COLLABORATEURS.map(c => ligne(c.id, c.nom, c.role, COLLABORATEURS_EMBAUCHE[c.id]));
  const partis = ANCIENS_COLLABORATEURS.map(c => ligne(c.id, c.nom, c.role, c.dateEmbauche, c.dateDepart));
  return {
    presents,
    partis,
    toutes: presents.concat(partis),
    accueilManquant: presents.filter(l => l.accueil.etat === 'absent'),
    accueilTardif: presents.filter(l => l.accueil.etat === 'partiel'),
    // Une pièce encore sous obligation de conservation ne doit pas être détruite.
    conservationEnCours: partis.filter(l => l.conserverJusquA >= aujourdhui),
  };
}

// --- Déclaration d'indépendance ----------------------------------------------
// Portée par année civile (et non par exercice clos) : le modèle est renvoyé
// à signer au 1er janvier de chaque année.

const DECLARATIONS_INDEPENDANCE = [
  { collaborateur: 'julie', exercice: 2026, statut: 'signee', dateSignature: '2026-01-08' },
  { collaborateur: 'nathalie', exercice: 2026, statut: 'signee', dateSignature: '2026-01-06' },
  { collaborateur: 'heddy', exercice: 2026, statut: 'en_attente' },
  { collaborateur: 'thomas', exercice: 2026, statut: 'en_attente' },
  { collaborateur: 'lucas', exercice: 2026, statut: 'en_attente' },
];

function declarationsIndependanceAnnee(annee) {
  return DECLARATIONS_INDEPENDANCE.filter(d => d.exercice === annee);
}

function declarationsManquantes() {
  return declarationsIndependanceAnnee(currentCalendarYear())
    .filter(d => d.statut !== 'signee')
    .map(d => ({ collaborateur: d.collaborateur, exercice: d.exercice }));
}

// --- Diffusion des procédures -------------------------------------------------

const PROCEDURES_VERSIONS = [
  { id: 'v3', version: 'v3', dateDiffusion: '2026-01-10',
    resume: "Mise à jour des seuils de vigilance LBC-FT et ajout de la procédure de gel des avoirs.",
    accuses: {
      julie: { signe: true, dateSignature: '2026-01-11' },
      nathalie: { signe: true, dateSignature: '2026-01-12' },
      heddy: { signe: true, dateSignature: '2026-01-10' },
      thomas: { signe: false },
      lucas: { signe: false },
    } },
  { id: 'v2', version: 'v2', dateDiffusion: '2025-06-02',
    resume: "Révision du barème d'honoraires et clarification de la procédure de lettre de mission.",
    accuses: {
      julie: { signe: true, dateSignature: '2025-06-03' },
      nathalie: { signe: true, dateSignature: '2025-06-03' },
      heddy: { signe: true, dateSignature: '2025-06-04' },
      thomas: { signe: true, dateSignature: '2025-06-05' },
      lucas: { signe: true, dateSignature: '2025-06-02' },
    } },
];

function diffusionAccusesManquants() {
  const derniere = PROCEDURES_VERSIONS[0];
  return Object.keys(derniere.accuses)
    .filter(id => !derniere.accuses[id].signe)
    .map(id => ({ collaborateur: id, dateEnvoi: derniere.dateDiffusion }));
}

// --- Conformité cabinet -----------------------------------------------------

// Plan-type courant d'un manuel de procédures de cabinet (gouvernance, LBC-FT,
// contrôle qualité, missions...). Les statuts et dates sont modifiables dans
// l'outil ; le contenu réglementaire détaillé de chaque chapitre reste à la
// charge du cabinet (les exigences précises n'étant pas encore consolidées).
const PROCEDURES_MANUEL_CHAPITRES = [
  { id: 'gouvernance', titre: 'Gouvernance et organisation du cabinet', statut: 'manquant', derniereMaj: null },
  { id: 'deontologie', titre: 'Déontologie et indépendance', statut: 'manquant', derniereMaj: null },
  { id: 'lbcft', titre: 'Vigilance et lutte contre le blanchiment (LBC-FT)', statut: 'manquant', derniereMaj: null },
  { id: 'entree-mission', titre: 'Entrée en relation et lettres de mission', statut: 'manquant', derniereMaj: null },
  { id: 'controle-qualite', titre: 'Contrôle qualité des missions', statut: 'manquant', derniereMaj: null },
  { id: 'formation', titre: 'Formation continue des collaborateurs', statut: 'manquant', derniereMaj: null },
  { id: 'archivage', titre: 'Archivage et conservation des dossiers', statut: 'manquant', derniereMaj: null },
  { id: 'secret-pro', titre: 'Secret professionnel et protection des données', statut: 'manquant', derniereMaj: null },
  { id: 'revue-independante', titre: 'Revue indépendante des missions à risque', statut: 'manquant', derniereMaj: null },
  { id: 'surveillance-smq', titre: 'Surveillance du système qualité et actions correctives', statut: 'manquant', derniereMaj: null },
];

/* Trame de rédaction du manuel de procédures.

   Le cabinet part souvent de zéro : plutôt que de lui présenter un plan-type
   vide, l'outil pose les questions chapitre par chapitre et rédige le
   paragraphe à partir des réponses. Chaque question porte son intitulé, son
   type et, quand elle en a, ses choix. `modele` est la phrase produite, où
   {code} est remplacé par la réponse correspondante.

   Le contenu réglementaire de référence est celui des articles 141 à 169 du
   décret n° 2012-432 du 30 mars 2012 (code de déontologie) et, pour le volet
   LBC-FT, des articles L. 561-1 et suivants du code monétaire et financier. */
const MANUEL_QUESTIONNAIRE = {
  gouvernance: [
    { code: 'associes', label: 'Combien d’associés dirigent le cabinet ?', type: 'nombre', defaut: '1' },
    { code: 'referent', label: 'Qui assure la responsabilité générale de la qualité au sein du cabinet ?', type: 'texte', placeholder: 'Nom et qualité' },
    { code: 'reunion', label: 'À quelle fréquence se tiennent les réunions de pilotage ?', type: 'choix', options: ['Hebdomadaire', 'Mensuelle', 'Trimestrielle', 'Annuelle'] },
    { code: 'delegation', label: 'Les délégations de signature sont-elles formalisées par écrit ?', type: 'oui_non' },
    { modele: 'Le nombre d’associés dirigeant le cabinet est de {associes}. La responsabilité générale de la qualité est confiée à {referent}. Le pilotage du cabinet fait l’objet d’une réunion {reunion}. Les délégations de signature {delegation:sont formalisées par écrit|ne font pas l’objet d’une formalisation écrite à ce jour}.' },
  ],
  deontologie: [
    { code: 'declaration', label: 'À quelle fréquence les collaborateurs signent-ils leur déclaration d’indépendance ?', type: 'choix', options: ['À chaque exercice', 'À chaque entrée en relation', 'Les deux'] },
    { code: 'seuil', label: 'À partir de quelle part du chiffre d’affaires un dossier est-il considéré en dépendance économique ?', type: 'nombre', defaut: String(SEUIL_DEPENDANCE_DEFAUT), depuisParametre: 'seuilDependance', suffixe: '%' },
    { code: 'conflit', label: 'Qui tranche un conflit d’intérêts identifié en cours de mission ?', type: 'texte', placeholder: 'Nom et qualité' },
    { code: 'registre', label: 'Le cabinet tient-il un registre des situations d’indépendance examinées ?', type: 'oui_non' },
    { modele: 'Conformément aux articles 145 et suivants du code de déontologie, chaque collaborateur signe une déclaration d’indépendance {declaration}. Un dossier représentant plus de {seuil} % du chiffre d’affaires du cabinet fait l’objet d’une note de dépendance économique motivée. Tout conflit d’intérêts identifié est tranché par {conflit}. Le cabinet {registre:tient un registre des situations examinées|ne tient pas de registre formalisé à ce jour}.' },
  ],
  lbcft: [
    { code: 'referent', label: 'Qui est le référent LBC-FT du cabinet ?', type: 'texte', placeholder: 'Nom et qualité' },
    { code: 'quand', label: 'À quel moment l’analyse de vigilance est-elle réalisée ?', type: 'choix', options: ['Avant l’acceptation de la mission', 'À l’entrée en relation', 'Dans le mois suivant l’entrée en relation'] },
    { code: 'revue', label: 'À quelle fréquence la classification des risques du cabinet est-elle révisée ?', type: 'choix', options: ['Annuelle', 'Semestrielle', 'À chaque changement significatif'] },
    { code: 'soupcon', label: 'Qui procède à la déclaration de soupçon auprès de Tracfin ?', type: 'texte', placeholder: 'Nom et qualité' },
    { modele: 'En application des articles L. 561-1 et suivants du code monétaire et financier, le référent LBC-FT du cabinet est {referent}. Une analyse de vigilance est réalisée {quand}, selon les quatre critères de classification (caractéristiques du client, activité, localisation, missions proposées). La classification des risques du cabinet fait l’objet d’une révision {revue}. Toute déclaration de soupçon est établie et transmise à Tracfin par {soupcon}.' },
  ],
  'entree-mission': [
    { code: 'confrere', label: 'Le cabinet informe-t-il systématiquement le confrère prédécesseur avant d’accepter une reprise ?', type: 'oui_non' },
    { code: 'signature', label: 'Comment la lettre de mission est-elle signée ?', type: 'choix', options: ['Signature électronique', 'Signature manuscrite', 'Les deux selon le client'] },
    { code: 'delai', label: 'Sous quel délai la lettre de mission est-elle établie après l’accord du client ?', type: 'choix', options: ['Avant tout début de mission', 'Sous 15 jours', 'Sous 30 jours'] },
    { code: 'pieces', label: 'Quelles pièces sont exigées avant l’ouverture du dossier ?', type: 'texte_long', placeholder: 'Pièce d’identité du dirigeant, KBIS, statuts…' },
    { modele: 'Aucune mission n’est acceptée sans lettre de mission signée, établie {delai}. La signature est recueillie par {signature}. Le cabinet {confrere:informe systématiquement le confrère prédécesseur avant toute reprise de dossier, conformément au devoir de confraternité|n’a pas formalisé à ce jour la procédure d’information du confrère prédécesseur}. Les pièces exigées avant ouverture du dossier sont : {pieces}.' },
  ],
  'controle-qualite': [
    { code: 'frequence', label: 'À quelle fréquence les dossiers sont-ils revus par un second regard ?', type: 'choix', options: ['À chaque bilan', 'Annuellement par échantillon', 'Semestriellement'] },
    { code: 'qui', label: 'Qui réalise la supervision des dossiers ?', type: 'texte', placeholder: 'Nom et qualité' },
    { code: 'trace', label: 'Comment la supervision est-elle tracée ?', type: 'choix', options: ['Note de synthèse validée dans l’outil', 'Feuille de revue signée', 'Les deux'] },
    { code: 'anomalie', label: 'Que fait le cabinet d’une anomalie détectée lors du contrôle ?', type: 'texte_long', placeholder: 'Demande de régularisation au collaborateur, délai, suivi…' },
    { modele: 'Les dossiers font l’objet d’une supervision {frequence}, réalisée par {qui}. La supervision est tracée par {trace}. Traitement des anomalies détectées : {anomalie}' },
  ],
  formation: [
    { code: 'heures', label: 'Combien d’heures de formation par collaborateur et par an le cabinet vise-t-il ?', type: 'nombre', defaut: '40' },
    { code: 'sessions', label: 'Combien de sessions LBC-FT sont organisées par an ?', type: 'nombre', defaut: '2', depuisParametre: 'sessionsLbcftParAn' },
    { code: 'accueil', label: 'Sous quel délai un nouvel arrivant reçoit-il sa formation LBC-FT d’accueil ?', type: 'choix', options: ['Avant sa prise de poste', 'Dans le mois suivant son arrivée', 'Dans les trois mois suivant son arrivée'] },
    { code: 'adaptation', label: 'Comment le contenu de la formation est-il adapté aux fonctions de chacun ?', type: 'texte_long', placeholder: 'Ex. : module commun à tous, module approfondi pour les collaborateurs en charge de l’entrée en relation et pour le correspondant Tracfin…' },
    { code: 'suivi', label: 'Comment les justificatifs de formation sont-ils conservés ?', type: 'choix', options: ['Dans l’outil, dossier Formations', 'Dans le Drive du cabinet', 'Format papier'] },
    { modele: 'Le cabinet vise {heures} heures de formation par collaborateur et par an, conformément à l’obligation de mise à jour des connaissances de l’article 145 du code de déontologie. Le nombre de sessions consacrées à la LBC-FT est de {sessions} par an. Tout nouvel arrivant appelé à concourir aux obligations de vigilance reçoit une formation LBC-FT {accueil}. Le contenu et la fréquence sont adaptés aux risques identifiés et aux fonctions exercées : {adaptation}. Les justificatifs sont conservés {suivi}, pendant toute la durée des fonctions puis cinq ans après le départ de la personne concernée. Ces règles appliquent l’article D. 561-38-1-1 du code monétaire et financier, créé par le décret n° 2026-310 du 24 avril 2026 ; ce texte n’impose aucune périodicité chiffrée, le rythme retenu ci-dessus est celui que le cabinet s’est fixé.' },
  ],
  archivage: [
    { code: 'duree', label: 'Combien d’années les dossiers sont-ils conservés ?', type: 'nombre', defaut: '10' },
    { code: 'support', label: 'Sur quel support les dossiers sont-ils archivés ?', type: 'choix', options: ['Numérique uniquement', 'Papier uniquement', 'Numérique et papier'] },
    { code: 'restitution', label: 'Sous quel délai les documents du client lui sont-ils restitués en fin de mission ?', type: 'choix', options: ['Sous 15 jours', 'Sous 30 jours', 'Sous 2 mois'] },
    { modele: 'Les dossiers sont conservés {duree} ans sur support {support}. En fin de mission, les documents appartenant au client lui sont restitués {restitution}, le cabinet conservant copie des éléments nécessaires à la justification de ses diligences.' },
  ],
  'revue-independante': [
    { code: 'criteres', label: 'Quels critères déclenchent une revue indépendante ?', type: 'texte_long', placeholder: 'Dossier coté en vigilance renforcée, honoraires supérieurs à un seuil, secteur sensible, premier exercice…' },
    { code: 'reviseur', label: 'Qui réalise la revue indépendante ?', type: 'texte', placeholder: 'Nom et qualité — une personne non intervenue sur la mission' },
    { code: 'moment', label: 'À quel moment la revue est-elle achevée ?', type: 'choix', options: ['Avant la remise des comptes au client', 'Avant la signature de l’attestation', 'Avant l’envoi de la liasse fiscale'] },
    { code: 'trace', label: 'Comment la revue est-elle tracée ?', type: 'choix', options: ['Fiche de revue signée et datée', 'Note dans le dossier de travail', 'Les deux'] },
    { modele: 'Le cabinet soumet à revue indépendante les missions répondant aux critères suivants : {criteres} La revue est confiée à {reviseur}, qui n’est pas intervenu sur la mission. Elle est achevée {moment} et tracée par {trace}. Conformément au paragraphe 31 de la norme professionnelle de management de la qualité (NPMQ), cette revue reste facultative dans son principe : ce sont les critères ci-dessus, arrêtés par le cabinet, qui la rendent obligatoire en interne.' },
  ],
  'surveillance-smq': [
    { code: 'frequence', label: 'À quelle fréquence le système qualité est-il revu ?', type: 'choix', options: ['Annuelle', 'Semestrielle', 'Trimestrielle'] },
    { code: 'responsable', label: 'Qui conduit la revue interne du système qualité ?', type: 'texte', placeholder: 'Nom et qualité' },
    { code: 'registre', label: 'Où sont consignées les non-conformités constatées ?', type: 'texte', placeholder: 'Registre des non-conformités tenu dans…' },
    { code: 'correctives', label: 'Comment l’efficacité des actions correctives est-elle vérifiée ?', type: 'texte_long', placeholder: 'Nouvelle revue du point concerné à échéance fixée, contrôle par sondage…' },
    { modele: 'Le système de management de la qualité fait l’objet d’une revue interne {frequence}, conduite par {responsable}. Les non-conformités constatées sont consignées dans {registre}. Chaque non-conformité donne lieu à une action corrective datée, dont l’efficacité est vérifiée selon les modalités suivantes : {correctives} Cette surveillance répond aux paragraphes 32 à 45 de la NPMQ, qui n’imposent ni fréquence ni rapport formalisé : le rythme retenu ci-dessus est celui que le cabinet s’est fixé.' },
  ],
  'secret-pro': [
    { code: 'engagement', label: 'Les collaborateurs signent-ils un engagement de confidentialité ?', type: 'oui_non' },
    { code: 'acces', label: 'Comment les accès aux dossiers clients sont-ils restreints ?', type: 'texte_long', placeholder: 'Comptes nominatifs, droits par dossier, mots de passe…' },
    { code: 'rgpd', label: 'Qui est le référent protection des données du cabinet ?', type: 'texte', placeholder: 'Nom et qualité' },
    { modele: 'Le secret professionnel s’impose à l’ensemble du cabinet. Les collaborateurs {engagement:signent un engagement de confidentialité à leur entrée|ne signent pas à ce jour d’engagement de confidentialité distinct de leur contrat de travail}. Restriction des accès : {acces} Le référent protection des données est {rgpd}.' },
  ],
};

// Suggestions génériques (démonstration) pour amorcer une relecture de chapitre
// à l'aide de l'IA. Ce ne sont pas des exigences réglementaires exhaustives ni
// à jour — elles servent de point de départ à vérifier par le cabinet, en
// attendant une liste d'attentes consolidée pour chaque chapitre.
const IA_VERIFICATION_MANUEL_DEMO = {
  gouvernance: ['Vérifier que les rôles et délégations entre associés sont formalisés.', 'Vérifier la fréquence des réunions de pilotage du cabinet.'],
  deontologie: ['Vérifier la procédure de déclaration d’indépendance et sa fréquence de renouvellement.', 'Vérifier le traitement des conflits d’intérêts identifiés en cours de mission.'],
  lbcft: ['Vérifier que la procédure reflète la dernière classification des risques du cabinet.', 'Vérifier la cohérence avec le référentiel NPLAB utilisé dans l’outil.', 'Vérifier les modalités de déclaration de soupçon (Tracfin).'],
  'entree-mission': ['Vérifier la checklist des pièces demandées à l’entrée en relation.', 'Vérifier le circuit de signature de la lettre de mission.'],
  'controle-qualite': ['Vérifier la fréquence des revues de dossiers par un second expert-comptable.', 'Vérifier le traitement des anomalies détectées lors des contrôles.'],
  formation: ['Vérifier le programme annuel de formation LBC-FT.', 'Vérifier le suivi des attestations de formation par collaborateur.'],
  archivage: ['Vérifier la durée légale de conservation des dossiers.', 'Vérifier les modalités d’archivage numérique et les accès associés.'],
  'secret-pro': ['Vérifier les engagements de confidentialité des collaborateurs.', 'Vérifier les mesures de sécurité applicables aux données clients.'],
};

/* Poids réel de chaque client dans les honoraires du cabinet. Les dossiers à
   surveiller ne sont pas listés en dur : ils se déduisent de ce poids et du
   seuil réglé par le cabinet, sinon les deux finiraient par se contredire. */
const DEPENDANCE_PART_HONORAIRES = {
  'sas-nova': 14.2,
  'sci-durand': 11.6,
  'sarl-projet': 8.4,
};

const DEPENDANCE_MESURES = {
  'sas-nova': "Facturation au tarif standard du cabinet, absence de lien capitalistique avec le client, revue annuelle de la relation par un second expert-comptable associé.",
  'sci-durand': "Diversification du portefeuille clients engagée, plafonnement des missions complémentaires confiées au cabinet, supervision renforcée de la mission.",
  'sarl-projet': "Suivi trimestriel du poids du dossier dans les honoraires, aucune mission complémentaire acceptée sans revue préalable.",
};

function dependanceASurveiller(seuil) {
  const s = Number(seuil !== undefined && seuil !== null && seuil !== '' ? seuil : SEUIL_DEPENDANCE_DEFAUT);
  return Object.keys(DEPENDANCE_PART_HONORAIRES)
    .filter(id => DEPENDANCE_PART_HONORAIRES[id] > s)
    .sort((a, b) => DEPENDANCE_PART_HONORAIRES[b] - DEPENDANCE_PART_HONORAIRES[a])
    .map(id => ({
      dossier: id,
      partHonoraires: DEPENDANCE_PART_HONORAIRES[id].toFixed(1),
      seuil: String(s),
      mesures: DEPENDANCE_MESURES[id],
    }));
}

const CONFORMITE_CABINET = {
  manuelProcedures: {
    label: 'Manuel de procédures',
    statut: 'À rédiger',
    derniereMaj: null,
    detail: "Le cabinet ne dispose pas encore de manuel de procédures écrit. L'assistant pose les questions chapitre par chapitre et rédige le document à partir de vos réponses.",
  },
  diffusionProcedures: {
    label: 'Diffusion des procédures',
    accusesManquants: diffusionAccusesManquants(),
  },
  formationsLBCFT: {
    label: 'Formations LBC-FT',
    nonAJour: formationsNonAJour(),
  },
  declarationsIndependance: {
    label: 'Déclarations d’indépendance',
    manquantes: declarationsManquantes(),
  },
  dependanceEconomique: {
    label: 'Dépendance économique',
    // La liste des dossiers concernés n'est pas figée ici : elle dépend du
    // seuil réglé par le cabinet et s'obtient par dependanceASurveiller().
  },
  classificationRisquesLBCFT: {
    label: 'Classification des risques LBC-FT',
    derniereRevision: '2025-05-02',
    statut: 'Non révisée depuis 14 mois',
    // L'article L. 561-4-1 impose une classification « régulièrement
    // actualisée », sans fixer de périodicité : la revue annuelle est le
    // rythme que le cabinet s'est donné, pas une obligation du texte.
    detail: "L'article L. 561-4-1 impose de tenir la classification régulièrement actualisée, sans fixer d'échéance. Le cabinet s'est donné un rythme annuel ; la dernière revue date de mai 2025.",
  },
};

// --- Supervision bilan -------------------------------------------------------

const BILAN_DOSSIERS = [
  { id: 'b1', dossier: 'sas-nova', exercice: 2025, collaborateur: 'nathalie', datePreparation: '2026-05-12', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 2, label: '2 points signalés', description: "Deux écarts de lettrage identifiés sur les comptes fournisseurs et une provision à ajuster sur les congés payés." },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Trésorerie, rémunération du dirigeant',
    commentaireEC: "Les points signalés ont été examinés. Merci de corriger les deux anomalies comptables relevées et de prévoir un échange avec le client sur la trésorerie lors du rendez-vous bilan. Supervision validée sous réserve de ces ajustements.",
    dateCommentaireEC: '2026-05-16',
    commentaireCollab: "Dossier globalement rentable. Deux points comptables restent à fiabiliser avant finalisation. Aucun élément ne remet en cause la continuité d'exploitation. À évoquer lors du bilan : niveau de trésorerie et arbitrage sur la rémunération du dirigeant.",
    dateCommentaireCollab: '2026-05-15' },
  { id: 'b2', dossier: 'sci-durand', exercice: 2025, collaborateur: 'heddy', datePreparation: '2026-05-11', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 0, label: 'Aucun point signalé', description: '' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Renouvellement du bail commercial',
    commentaireEC: "Dossier propre, aucune remarque particulière. Validation possible en l'état.",
    dateCommentaireEC: '2026-05-15',
    commentaireCollab: "Exercice stable, loyers encaissés normalement. À évoquer : échéance du bail commercial en fin d'année.",
    dateCommentaireCollab: '2026-05-14' },
  { id: 'b3', dossier: 'sarl-projet', exercice: 2025, collaborateur: 'julie', datePreparation: '2026-05-10', statut: 'Prêt',
    rentabilite: { statut: 'neutre', label: 'À surveiller' },
    problemes: { count: 3, label: '3 points signalés', description: "Marge en baisse par rapport à N-1, deux retards de règlement clients non provisionnés, et un stock à valoriser." },
    continuite: { statut: 'attention', label: 'Trésorerie tendue' },
    sujets: 'Plan de trésorerie, recouvrement clients',
    commentaireEC: "Marge en baisse par rapport à N-1. Merci de préparer un point spécifique sur le recouvrement client avant le rendez-vous bilan.",
    dateCommentaireEC: '2026-05-14',
    commentaireCollab: "Chiffre d'affaires stable mais marge en recul. Retards de règlement de deux clients importants à signaler en rendez-vous bilan.",
    dateCommentaireCollab: '2026-05-13' },
  { id: 'b4', dossier: 'eurl-alpes', exercice: 2025, collaborateur: 'thomas', datePreparation: '2026-05-09', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé', description: "Traitement comptable de l'investissement matériel prévu à anticiper (financement non encore formalisé)." },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Investissement matériel prévu N+1',
    commentaireEC: "Bon exercice. Point à valider sur le traitement comptable de l'investissement prévu l'année prochaine.",
    dateCommentaireEC: '2026-05-13',
    commentaireCollab: "Exercice bénéficiaire. Le dirigeant envisage un investissement matériel important l'an prochain, à anticiper.",
    dateCommentaireCollab: '2026-05-12' },
  { id: 'b5', dossier: 'sas-vision', exercice: 2025, collaborateur: 'heddy', datePreparation: '2026-05-08', statut: 'Prêt',
    rentabilite: { statut: 'negatif', label: 'Déficitaire' },
    problemes: { count: 2, label: '2 points signalés', description: "Déficit à confirmer avant clôture ; éligibilité au crédit d'impôt recherche (CIR) à vérifier." },
    continuite: { statut: 'attention', label: 'À surveiller' },
    sujets: 'Financement R&D, crédit impôt recherche',
    commentaireEC: "Déficit à confirmer avant clôture. Vérifier l'éligibilité au CIR avant le rendez-vous bilan.",
    dateCommentaireEC: '2026-05-12',
    commentaireCollab: "Exercice déficitaire lié aux investissements R&D. Dossier CIR en cours de constitution.",
    dateCommentaireCollab: '2026-05-11' },
  { id: 'b6', dossier: 'sci-lumiere', exercice: 2025, collaborateur: 'julie', datePreparation: '2026-05-07', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 0, label: 'Aucun point signalé', description: '' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Aucun sujet particulier',
    commentaireEC: "Dossier conforme, aucune réserve.",
    dateCommentaireEC: '2026-05-11',
    commentaireCollab: "Rien à signaler pour cet exercice.",
    dateCommentaireCollab: '2026-05-10' },
  { id: 'b7', dossier: 'sarl-alpha', exercice: 2025, collaborateur: 'nathalie', datePreparation: '2026-05-06', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé', description: "Assurance décennale arrivée à expiration, à renouveler avant la clôture." },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Renouvellement assurance décennale',
    commentaireEC: "Bon exercice. Veiller au renouvellement de l'assurance décennale évoqué en anomalie.",
    dateCommentaireEC: '2026-05-10',
    commentaireCollab: "Activité en croissance. Assurance décennale à renouveler rapidement.",
    dateCommentaireCollab: '2026-05-09' },
  { id: 'b8', dossier: 'eurl-ocean', exercice: 2025, collaborateur: 'nathalie', datePreparation: '2026-05-05', statut: 'Prêt',
    rentabilite: { statut: 'neutre', label: 'À surveiller' },
    problemes: { count: 2, label: '2 points signalés', description: "Marge impactée par les variations de change ; écart de change non régularisé sur deux factures import." },
    continuite: { statut: 'attention', label: 'Change et taux de fret' },
    sujets: 'Impact du taux de change sur la marge',
    commentaireEC: "Marge impactée par les variations de change. À évoquer avec le client lors du bilan.",
    dateCommentaireEC: '2026-05-09',
    commentaireCollab: "Activité d'import-export sensible aux taux de change du semestre, marge en léger recul.",
    dateCommentaireCollab: '2026-05-08' },
  { id: 'b9', dossier: 'sas-atlantique', exercice: 2025, collaborateur: 'julie', datePreparation: '2026-05-04', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé', description: "Financement du renouvellement de flotte à anticiper comptablement (crédit-bail ou emprunt)." },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Renouvellement de flotte',
    commentaireEC: "Exercice solide. Anticiper le financement du renouvellement de flotte évoqué par le dirigeant.",
    dateCommentaireEC: '2026-05-08',
    commentaireCollab: "Bonne activité sur l'exercice. Le dirigeant prévoit un investissement de renouvellement de flotte.",
    dateCommentaireCollab: '2026-05-07' },
  { id: 'b10', dossier: 'eurl-nordic', exercice: 2025, collaborateur: 'heddy', datePreparation: '2026-05-03', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 0, label: 'Aucun point signalé', description: '' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Aucun sujet particulier',
    commentaireEC: "Dossier conforme, aucune réserve.",
    dateCommentaireEC: '2026-05-07',
    commentaireCollab: "Rien à signaler pour cet exercice.",
    dateCommentaireCollab: '2026-05-06' },
];

// --- Scénario fixe : contractualisation & reprise déontologique --------------

const SCENARIO_NOUVEAU_CLIENT = {
  siret: '531 234 567 00019',
  societe: 'SARL Dupont Immobilier',
  adresse: '12 rue de la Liberté, 06000 Nice',
  formeJuridique: 'SARL',
  dirigeant: 'Jean Dupont',
  dirigeantCivilite: 'M.',
  dirigeantPrenom: 'Jean',
  dirigeantNom: 'Dupont',
  activite: 'Marchands de biens immobiliers',
  dateCloture: '31/12',
};

const SCENARIO_CABINET_CONFRERE = {
  siret: '444 987 654 00022',
  cabinet: 'Cabinet Martin & Associés',
  adresse: '15 rue de la République, 69002 Lyon',
  formeJuridique: 'SARL',
  nomConfrere: 'Martin',
  prenomConfrere: 'Pierre',
  emailConfrere: 'pierre.martin@cabinet.fr',
};

const PIECES_REPRISE = [
  '3 derniers FEC', '3 dernières liasses fiscales', 'Journaux de paie', 'Tableau des charges',
  'Fiche de paramétrage paie', 'Contrats de travail', 'Avenants aux contrats de travail',
];

// --- Arborescence Drive ------------------------------------------------------
// Structure utilisée à la fois par l'assistant de contractualisation (étapes 2
// et 6) et par l'onglet "Arborescence Drive" des dossiers existants.

const ANNEE_COURANTE = '2026';

const DRIVE_TREE = [
  { name: '00_Dossier permanent', children: [] },
  { name: '01_Comptable', children: [ANNEE_COURANTE] },
  { name: '02_Juridique', children: [{ name: 'AGO', children: [ANNEE_COURANTE] }] },
  { name: '03_Social', children: ['Prévoyance', 'Mutuelle', 'Contrats & avenants', 'DPAE', 'Sorties salariés'] },
  { name: '04_Dossier annuel', children: ['Lettre de mission', 'KBIS', 'CNI', 'Attestation PPE', 'RBE', 'Carte grise', "Tableau d'emprunt"] },
];

const DOCUMENTS_A_COLLECTER = [
  { label: 'Statuts de la société', mode: 'Récupérable via API', action: 'Récupérer' },
  { label: 'Bénéficiaires effectifs', mode: 'Interrogeable via API', action: 'Interroger' },
];

const DOCUMENTS_A_DEMANDER_CLIENT = [
  "Pièce d'identité du dirigeant", 'Attestation PPE', 'KBIS',
];

const VIGILANCE_INFOS_PREREMPLIES = [
  { icone: '🏢', label: 'Nature du client', valeur: 'Société' },
  { icone: '🗓️', label: 'Activité', valeur: 'Activité standard' },
  { icone: '🌍', label: 'Pays / Localisation', valeur: 'France métropolitaine' },
  { icone: '🎯', label: 'Mission', valeur: 'Présentation + social' },
  { icone: '👥', label: 'Salariés', valeur: 'Oui' },
  { icone: '👤', label: 'Bénéficiaires effectifs', valeur: 'Identifiés' },
];

const VIGILANCE_POINTS_A_CONFIRMER = [
  { code: 'ppe', label: 'Client ou bénéficiaire effectif PPE ?' },
  { code: 'international', label: 'Relations ou opérations internationales ?' },
  { code: 'structure', label: 'Structure juridique complexe ?' },
  { code: 'autre', label: 'Autres éléments de vigilance identifiés ?' },
];

// --- Dossiers existants (module collaborateur) : vigilance LBC-FT -----------
//
// Classification à 4 critères ("NPLAB") : Caractéristiques du client, Activité
// du client, Localisation du client, Missions proposées — chacun coté Faible /
// Moyen / Élevé. Le niveau de vigilance résulte de la cotation la plus élevée
// obtenue sur l'un des quatre critères (règle de combinaison du cabinet) : un
// critère Élevé entraîne une vigilance Renforcée, sinon Normale. La vigilance
// Allégée n'est appliquée que sur décision expresse du référent LBC-FT — elle
// n'est donc jamais un résultat automatique du calcul.

const NPLAB_CRITERES = [
  { code: 'caracteristiquesClient', label: 'Caractéristiques du client' },
  { code: 'activiteClient', label: 'Activité du client' },
  { code: 'localisationClient', label: 'Localisation du client' },
  { code: 'missionsProposees', label: 'Missions proposées' },
];

function niveauCalculeVigilance(classification) {
  const valeurs = Object.values(classification);
  return valeurs.includes('Élevé') ? 'Renforcée' : 'Normale';
}

// Démonstration du pré-remplissage par IA à partir de la retranscription du
// premier entretien : le branchement réel (lecture du contenu du fichier par
// l'API Anthropic depuis une fonction serveur) est une étape ultérieure — ici,
// on ne simule que le résultat pour valider le parcours proposé.
const IA_SUGGESTIONS_VIGILANCE_DEMO = [
  {
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operations: [],
    justification: "D'après la retranscription du premier entretien, le client exerce une activité commerciale courante sans élément d'alerte particulier évoqué (aucune mention de personne politiquement exposée, d'opération internationale ou de structure juridique complexe). Une vigilance normale est suggérée, à confirmer par le collaborateur au regard des pièces du dossier.",
  },
  {
    classification: { caracteristiquesClient: 'Moyen', activiteClient: 'Moyen', localisationClient: 'Élevé', missionsProposees: 'Faible' },
    operations: ["Le client mentionne des flux financiers réguliers avec un partenaire commercial situé hors de l'Union européenne."],
    justification: "La retranscription fait apparaître des relations commerciales avec un partenaire situé hors de l'Union européenne, facteur de vigilance au titre du critère Localisation. Aucun autre élément sensible n'a été identifié dans l'entretien. Une vigilance renforcée est suggérée sur ce facteur géographique, à confirmer par le collaborateur.",
  },
  {
    classification: { caracteristiquesClient: 'Élevé', activiteClient: 'Faible', localisationClient: 'Faible', missionsProposees: 'Moyen' },
    operations: ['Le dirigeant indique exercer un mandat électif local — à vérifier au titre du statut de personne politiquement exposée (PPE).'],
    justification: "Le dirigeant a évoqué en entretien un mandat électif local, ce qui peut caractériser une personne politiquement exposée au sens de l'article R. 561-18 du code monétaire et financier et justifie une attention renforcée à l'origine des fonds. Une vigilance renforcée est suggérée sur ce facteur, sous réserve de confirmation du statut PPE par le collaborateur.",
  },
];

/* ------------------- Connaissance de la relation d'affaires (LBC-FT)

   Trois éléments qu'un contrôleur ouvre en premier dans un dossier, et que la
   classification à quatre critères ne dit pas :

   - le bénéficiaire effectif, c'est-à-dire la personne physique qui est
     réellement derrière le client — le code monétaire et financier en donne la
     définition à l'article L. 561-2-2 et impose de l'identifier et de vérifier
     son identité à l'article L. 561-5 ;
   - le statut de personne politiquement exposée, défini à l'article R. 561-18 ;
   - l'origine du patrimoine et des fonds, que l'article R. 561-20-2 impose
     d'établir, en particulier lorsque le client ou son bénéficiaire effectif
     est une personne politiquement exposée.

   Ce que le cabinet n'a pas encore recueilli reste marqué comme tel : un
   dossier incomplet doit se voir, pas se deviner. */

const VIGILANCE_PPE_STATUTS = {
  non: { label: 'Non — aucune fonction concernée', couleur: 'vert' },
  oui: { label: 'Oui — personne politiquement exposée', couleur: 'rouge' },
  a_verifier: { label: 'À vérifier', couleur: 'orange' },
};

const VIGILANCE_ORIGINE_ETATS = {
  documentee: { label: 'Documentée', couleur: 'vert' },
  partielle: { label: 'Partiellement documentée', couleur: 'orange' },
  a_faire: { label: 'À documenter', couleur: 'rouge' },
};

const VIGILANCE_CONNAISSANCE = {
  'sas-nova': {
    beneficiaires: [{ nom: 'Claire Nova', part: 100, piece: 'Statuts et extrait Kbis du 12/03/2024', verifie: true }],
    ppe: { statut: 'oui', detail: 'Mandat électif local exercé depuis mars 2020.' },
    origineFonds: { etat: 'documentee', detail: "Honoraires de conseil encaissés par virement ; les relevés bancaires sont cohérents avec les factures émises. Aucun apport externe sur l'exercice." },
  },
  'sci-durand': {
    beneficiaires: [
      { nom: 'Paul Durand', part: 60, piece: 'Statuts du 04/09/2019', verifie: true },
      { nom: 'Hélène Durand', part: 40, piece: 'Statuts du 04/09/2019', verifie: true },
    ],
    ppe: { statut: 'non', detail: '' },
    origineFonds: { etat: 'documentee', detail: 'Loyers encaissés au titre des baux en cours et apport initial en compte courant justifié par acte notarié.' },
  },
  'sarl-projet': {
    beneficiaires: [{ nom: 'Anaïs Roche', part: 100, piece: 'Statuts du 22/01/2022', verifie: true }],
    ppe: { statut: 'non', detail: '' },
    origineFonds: { etat: 'documentee', detail: "Chiffre d'affaires du bureau d'études, clients publics et privés identifiés." },
  },
  'sarl-dupont-immo': {
    beneficiaires: [{ nom: 'Jean Dupont', part: 100, piece: 'Statuts du 15/06/2015', verifie: true }],
    ppe: { statut: 'a_verifier', detail: "Le dirigeant siège au conseil d'administration d'un office public de l'habitat : fonction à confronter à la liste de l'article R. 561-18." },
    origineFonds: { etat: 'partielle', detail: "Le financement des dernières acquisitions repose sur des apports en compte courant dont l'origine n'est pas encore justifiée. Pièces demandées au client." },
  },
  'sas-atlantique': {
    beneficiaires: [
      { nom: 'Nadia Fabre', part: 55, piece: 'Registre des mouvements de titres au 31/12/2025', verifie: true },
      { nom: 'Holding maritime NF (bénéficiaire effectif non encore remonté)', part: 45, piece: null, verifie: false },
    ],
    ppe: { statut: 'non', detail: '' },
    origineFonds: { etat: 'partielle', detail: "Les flux liés aux affrètements hors Union européenne restent à rapprocher des contrats. Demande en cours auprès du client." },
  },
  'eurl-nordic': {
    beneficiaires: [{ nom: 'Erik Lund', part: 100, piece: "Registre du commerce danois, traduction jointe", verifie: true }],
    ppe: { statut: 'non', detail: '' },
    origineFonds: { etat: 'documentee', detail: 'Achats de mobilier auprès de fournisseurs scandinaves identifiés, réglés par virement bancaire depuis le compte de la société.' },
  },
};

/* Renvoie toujours un objet exploitable : pour un dossier non renseigné, on
   déclare franchement que rien n'a été recueilli plutôt que de renvoyer un
   vide qui passerait pour une absence de risque. */
function vigilanceConnaissance(dossierId) {
  const brut = VIGILANCE_CONNAISSANCE[dossierId];
  if (!brut) {
    return {
      beneficiaires: [],
      ppe: { statut: 'a_verifier', detail: '' },
      origineFonds: { etat: 'a_faire', detail: '' },
      complete: false,
    };
  }
  const beneficiairesOk = brut.beneficiaires.length > 0 && brut.beneficiaires.every(b => b.verifie);
  return Object.assign({}, brut, {
    complete: beneficiairesOk && brut.ppe.statut !== 'a_verifier' && brut.origineFonds.etat === 'documentee',
    beneficiairesOk,
  });
}

/* Vue cabinet : où en est la connaissance de la relation d'affaires sur les
   dossiers dont l'analyse de vigilance est faite. */
function vigilanceConnaissanceStats() {
  const analyses = DOSSIERS_LBCFT.filter(d => d.statut === 'complete');
  const lignes = analyses.map(d => Object.assign({ dossier: d.dossier }, vigilanceConnaissance(d.dossier)));
  return {
    lignes,
    total: lignes.length,
    beneficiairesOk: lignes.filter(l => l.beneficiairesOk).length,
    ppeAVerifier: lignes.filter(l => l.ppe.statut === 'a_verifier'),
    ppeAverees: lignes.filter(l => l.ppe.statut === 'oui'),
    origineDocumentee: lignes.filter(l => l.origineFonds.etat === 'documentee').length,
    origineAFaire: lignes.filter(l => l.origineFonds.etat !== 'documentee'),
  };
}

const DOSSIERS_LBCFT_A_LANCER = ['sarl-beta', 'sas-innov', 'sci-riviera'];

const DOSSIERS_LBCFT_DETAIL = {
  'sas-nova': {
    adresse: 'Marseille (13)',
    classification: { caracteristiquesClient: 'Élevé', activiteClient: 'Faible', localisationClient: 'Faible', missionsProposees: 'Moyen' },
    operationsParticulieres: ['La dirigeante exerce un mandat électif local — client identifié comme personne politiquement exposée (PPE) au sens de l’article R. 561-18.'],
    niveauRetenu: 'Renforcée',
    justification: "La société exerce une activité de conseil en communication sans facteur géographique ou sectoriel particulier. La dirigeante étant une personne politiquement exposée, une attention renforcée est portée à l'origine des fonds et à la cohérence des flux avec l'activité déclarée. À la date de la revue, aucune opération incohérente n'a été relevée. Compte tenu du statut PPE de la dirigeante, le dossier est classé en vigilance renforcée, avec un suivi annuel de son mandat.",
  },
  'sci-durand': {
    adresse: 'Annecy (74)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de location immobilière, secteur cité dans les typologies TRACFIN au titre de l'opacité des structures de détention. Le cabinet connaît le dirigeant et la composition du capital de longue date. Les loyers encaissés sont cohérents avec les baux en vigueur. Le dossier est classé en vigilance normale.",
  },
  'sarl-projet': {
    adresse: 'Grenoble (38)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Faible', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de bureau d'études sans facteur de risque particulier identifié. Les flux observés sont cohérents avec l'activité déclarée. Le dossier est classé en vigilance normale.",
  },
  'eurl-alpes': {
    adresse: 'Chambéry (73)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de négoce de matériel de montagne, impliquant des flux d'achat-revente à surveiller. Les marges et les règlements observés sont cohérents avec l'activité. Le dossier est classé en vigilance normale, avec une attention portée à la cohérence des stocks.",
  },
  'sas-vision': {
    adresse: 'Annecy (74)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Faible', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité d'édition de logiciels sans facteur de risque particulier identifié. Le dossier est classé en vigilance normale.",
  },
  'sci-martin': {
    adresse: 'Valence (26)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de location immobilière. Le cabinet dispose d'une connaissance régulière du dirigeant et des flux locatifs. Le dossier est classé en vigilance normale.",
  },
  'sci-lumiere': {
    adresse: 'Grenoble (38)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de location immobilière sans anomalie relevée sur les flux locatifs. Le dossier est classé en vigilance normale.",
  },
  'sarl-alpha': {
    adresse: 'Chambéry (73)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Moyen' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de menuiserie recourant ponctuellement à la sous-traitance. Le cabinet vérifie la cohérence des contrats de sous-traitance et des règlements associés. Aucun écart significatif n'a été relevé. Le dossier est classé en vigilance normale.",
  },
  'eurl-ocean': {
    adresse: 'Marseille (13)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Élevé', missionsProposees: 'Moyen' },
    operationsParticulieres: ['Flux financiers réguliers avec des partenaires commerciaux situés hors de l’Union européenne.'],
    niveauRetenu: 'Renforcée',
    justification: "La société exerce une activité d'import-export impliquant des partenaires commerciaux et des flux financiers hors de l'Union européenne. Une attention renforcée est portée à l'identité des partenaires étrangers, à la justification économique des opérations ainsi qu'à l'origine et à la destination des fonds. À la date de la revue, les flux examinés apparaissent cohérents avec l'objet social. Compte tenu du facteur géographique, le dossier est classé en vigilance renforcée.",
  },
  'sarl-dupont-immo': {
    adresse: 'Nice (06)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de marchand de biens immobiliers, secteur particulièrement cité dans les typologies TRACFIN. Une attention est portée à l'origine des apports en compte courant et à la cohérence du plan de financement de chaque opération. Aucune anomalie n'a été relevée à la date de la revue. Le dossier est classé en vigilance normale.",
  },
  'sas-atlantique': {
    adresse: 'La Rochelle (17)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société exerce une activité de transport maritime. Les flux observés sont cohérents avec les contrats de transport en vigueur. Le dossier est classé en vigilance normale.",
  },
  'eurl-nordic': {
    adresse: 'Annecy (74)',
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Moyen', localisationClient: 'Faible', missionsProposees: 'Faible' },
    operationsParticulieres: [],
    niveauRetenu: 'Normale',
    justification: "La société importe du mobilier depuis des pays scandinaves, tous membres de l'Espace économique européen et non listés à risque. Les flux d'importation observés sont cohérents avec l'activité déclarée. Le dossier est classé en vigilance normale.",
  },
};

const DOSSIERS_LBCFT = CLIENTS.map(c => {
  const detail = DOSSIERS_LBCFT_DETAIL[c.id];
  if (!detail) {
    return { dossier: c.id, statut: 'a_lancer', derniereAnalyse: null };
  }
  return {
    dossier: c.id,
    statut: 'complete',
    derniereAnalyse: '2026-04-15',
    adresse: detail.adresse,
    classification: detail.classification,
    operationsParticulieres: detail.operationsParticulieres,
    niveauCalcule: niveauCalculeVigilance(detail.classification),
    niveauRetenu: detail.niveauRetenu,
    justification: detail.justification,
  };
});

// Agrège DOSSIERS_LBCFT pour la cartographie des risques du cabinet (écran
// Conformité cabinet > Classification des risques LBC-FT > Lancer la révision).
function cartographieStats() {
  const analyses = DOSSIERS_LBCFT.filter(d => d.statut === 'complete');
  const nonAnalyses = DOSSIERS_LBCFT.filter(d => d.statut === 'a_lancer');
  return {
    total: analyses.length,
    normale: analyses.filter(d => d.niveauRetenu === 'Normale'),
    renforcee: analyses.filter(d => d.niveauRetenu === 'Renforcée'),
    allegee: analyses.filter(d => d.niveauRetenu === 'Allégée'),
    nonAnalyses,
    analyseMotivee: analyses.filter(d => Object.values(d.classification).some(v => v !== 'Faible')),
    dateArrete: new Date().toISOString().slice(0, 10),
  };
}


/* ---------------------------------------------------------------- Lettres de mission

   Les 40 modèles fournis par le cabinet se croisent selon quatre axes :
   le cabinet émetteur, la catégorie de contractant, et les options
   « avec/sans tenue », « avec/sans social », « avec/sans JP » (juridique et
   patrimonial), plus la variante « ancien forfait ». Le catalogue ci-dessous
   est généré à partir des noms de fichiers réels : il permet de désigner le
   bon modèle sans le chercher à la main.

   `null` sur un axe signifie que le modèle ne fait pas de distinction sur cet
   axe (une lettre BNC ne parle pas de tenue de comptabilité, par exemple). */

const LDM_CABINETS = [
  { id: 'aec', nom: 'Alpes Expertise Comptable', sigle: 'AEC' },
  { id: 's2a', nom: 'Sud Alpes Audit', sigle: 'S2A' },
  { id: 'nathalie', nom: 'Nathalie', sigle: 'NAT' },
];

const LDM_CATEGORIES = [
  { id: 'societe', nom: 'Société' },
  { id: 'ei', nom: 'Entreprise individuelle' },
  { id: 'bnc', nom: 'Activité BNC' },
  { id: 'sci', nom: 'SCI' },
  { id: 'irpp', nom: 'Déclaration IRPP' },
  { id: 'rf', nom: 'Revenus fonciers' },
  { id: 'rj', nom: 'Redressement judiciaire' },
];

const LDM_SIGNATAIRES = ['Thierry BOZZOLA', 'Julien LESNES'];

const LDM_CATALOGUE = [
  { cabinet: 'aec', categorie: 'bnc', tenue: null, social: true, jp: false, ancienForfait: true, libelle: "Activité BNC - Avec social Sans JP - Ancien forfait", fichier: "BNC/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Activité BNC - Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 'aec', categorie: 'bnc', tenue: null, social: true, jp: false, ancienForfait: false, libelle: "Activité BNC - Avec social Sans JP", fichier: "BNC/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Activité BNC - Avec social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'bnc', tenue: null, social: false, jp: false, ancienForfait: false, libelle: "Activité BNC - Sans social Sans JP", fichier: "BNC/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Activité BNC - Sans social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'bnc', tenue: null, social: true, jp: false, ancienForfait: true, libelle: "Activité BNC - Avec social Sans JP - Ancien forfait", fichier: "BNC/SUD ALPES AUDIT/Lettre de mission S2A - Activité BNC - Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 's2a', categorie: 'bnc', tenue: null, social: true, jp: false, ancienForfait: false, libelle: "Activité BNC - Avec social Sans JP", fichier: "BNC/SUD ALPES AUDIT/Lettre de mission S2A - Activité BNC - Avec social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'bnc', tenue: null, social: false, jp: false, ancienForfait: false, libelle: "Activité BNC - Sans social Sans JP", fichier: "BNC/SUD ALPES AUDIT/Lettre de mission S2A - Activité BNC - Sans social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'ei', tenue: true, social: true, jp: false, ancienForfait: true, libelle: "Mission de présentation EI - Avec tenue Avec social Sans JP - Ancien forfait", fichier: "ENTREPRISE INDIVIDUELLE/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation EI - Avec tenue Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 'aec', categorie: 'ei', tenue: true, social: true, jp: false, ancienForfait: false, libelle: "Mission de présentation EI - Avec tenue Avec social Sans JP", fichier: "ENTREPRISE INDIVIDUELLE/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation EI - Avec tenue Avec social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'ei', tenue: true, social: false, jp: false, ancienForfait: false, libelle: "Mission de présentation EI - Avec tenue Sans social Sans JP", fichier: "ENTREPRISE INDIVIDUELLE/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation EI - Avec tenue Sans social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'ei', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Mission de compte de campagne", fichier: "ENTREPRISE INDIVIDUELLE/SUD ALPES AUDIT/Lettre de mission S2A - Mission de compte de campagne.docx" },
  { cabinet: 's2a', categorie: 'ei', tenue: true, social: true, jp: false, ancienForfait: true, libelle: "Mission de présentation EI - Avec tenue Avec social Sans JP - Ancien forfait", fichier: "ENTREPRISE INDIVIDUELLE/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation EI - Avec tenue Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 's2a', categorie: 'ei', tenue: true, social: true, jp: false, ancienForfait: false, libelle: "Mission de présentation EI - Avec tenue Avec social Sans JP", fichier: "ENTREPRISE INDIVIDUELLE/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation EI - Avec tenue Avec social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'ei', tenue: true, social: false, jp: false, ancienForfait: false, libelle: "Mission de présentation EI - Avec tenue Sans social Sans JP", fichier: "ENTREPRISE INDIVIDUELLE/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation EI - Avec tenue Sans social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'irpp', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Assistance IR", fichier: "IRPP/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Assistance IR.docx" },
  { cabinet: 's2a', categorie: 'irpp', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Assistance IR", fichier: "IRPP/SUD ALPES AUDIT/Lettre de mission S2A - Assistance IR.docx" },
  { cabinet: 'aec', categorie: 'rj', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Mission d'accompagnement d'une entreprise en difficulté (procédure collective)", fichier: "REDRESSEMENT JUDICIAIRE/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission d'accompagnement d'une entreprise en difficulté (procédure collective).docx" },
  { cabinet: 's2a', categorie: 'rj', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Mission d'accompagnement d'une entreprise en difficulté (procédure collective)", fichier: "REDRESSEMENT JUDICIAIRE/SUD ALPES AUDIT/Lettre de mission S2A - Mission d'accompagnement d'une entreprise en difficulté (procédure collective).docx" },
  { cabinet: 'aec', categorie: 'rf', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Assistance RF", fichier: "REVENUS FONCIERS/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Assistance RF.docx" },
  { cabinet: 's2a', categorie: 'rf', tenue: null, social: null, jp: null, ancienForfait: false, libelle: "Assistance RF", fichier: "REVENUS FONCIERS/SUD ALPES AUDIT/Lettre de mission S2A - Assistance RF.docx" },
  { cabinet: 'aec', categorie: 'sci', tenue: null, social: true, jp: false, ancienForfait: false, libelle: "Assistance SCI - Avec social Sans JP", fichier: "SCI/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Assistance SCI - Avec social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'sci', tenue: null, social: false, jp: false, ancienForfait: false, libelle: "Assistance SCI - Sans social Sans JP", fichier: "SCI/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Assistance SCI - Sans social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'sci', tenue: null, social: true, jp: false, ancienForfait: false, libelle: "Assistance SCI - Avec social Sans JP", fichier: "SCI/SUD ALPES AUDIT/Lettre de mission S2A - Assistance SCI - Avec social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'sci', tenue: null, social: false, jp: false, ancienForfait: false, libelle: "Assistance SCI - Sans social Sans JP", fichier: "SCI/SUD ALPES AUDIT/Lettre de mission S2A - Assistance SCI - Sans social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'societe', tenue: true, social: true, jp: false, ancienForfait: true, libelle: "Mission de présentation Société - Avec tenue Avec social Sans JP - Ancien forfait", fichier: "SOCIETES/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation Société - Avec tenue Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 'aec', categorie: 'societe', tenue: true, social: true, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Avec tenue Avec social Sans JP", fichier: "SOCIETES/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation Société - Avec tenue Avec social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'societe', tenue: true, social: false, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Avec tenue Sans social Sans JP", fichier: "SOCIETES/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation Société - Avec tenue Sans social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'societe', tenue: false, social: true, jp: false, ancienForfait: true, libelle: "Mission de présentation Société - Sans tenue Avec social Sans JP - Ancien forfait", fichier: "SOCIETES/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation Société - Sans tenue Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 'aec', categorie: 'societe', tenue: false, social: true, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Sans tenue Avec social Sans JP", fichier: "SOCIETES/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation Société - Sans tenue Avec social Sans JP.docx" },
  { cabinet: 'aec', categorie: 'societe', tenue: false, social: false, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Sans tenue Sans social Sans JP", fichier: "SOCIETES/ALPES EXPERTISE COMPTABLE/Lettre de mission AEC - Mission de présentation Société - Sans tenue Sans social Sans JP.docx" },
  { cabinet: 'nathalie', categorie: 'societe', tenue: true, social: false, jp: null, ancienForfait: false, libelle: "Mission de présentation Société - Avec tenue Sans social", fichier: "SOCIETES/NATHALIE/Lettre de mission Nathalie - Mission de présentation Société - Avec tenue Sans social.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: true, social: true, jp: true, ancienForfait: true, libelle: "Mission de présentation Société - Avec tenue Avec social Avec JP - Ancien forfait", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Avec tenue Avec social Avec JP - Ancien forfait.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: true, social: true, jp: true, ancienForfait: false, libelle: "Mission de présentation Société - Avec tenue Avec social Avec JP", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Avec tenue Avec social Avec JP.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: true, social: true, jp: false, ancienForfait: true, libelle: "Mission de présentation Société - Avec tenue Avec social Sans JP - Ancien forfait", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Avec tenue Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: true, social: true, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Avec tenue Avec social Sans JP", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Avec tenue Avec social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: true, social: false, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Avec tenue Sans social Sans JP", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Avec tenue Sans social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: false, social: true, jp: true, ancienForfait: true, libelle: "Mission de présentation Société - Sans tenue Avec social Avec JP - Ancien forfait", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Sans tenue Avec social Avec JP - Ancien forfait.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: false, social: true, jp: true, ancienForfait: false, libelle: "Mission de présentation Société - Sans tenue Avec social Avec JP", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Sans tenue Avec social Avec JP.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: false, social: true, jp: false, ancienForfait: true, libelle: "Mission de présentation Société - Sans tenue Avec social Sans JP - Ancien forfait", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Sans tenue Avec social Sans JP - Ancien forfait.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: false, social: true, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Sans tenue Avec social Sans JP", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Sans tenue Avec social Sans JP.docx" },
  { cabinet: 's2a', categorie: 'societe', tenue: false, social: false, jp: false, ancienForfait: false, libelle: "Mission de présentation Société - Sans tenue Sans social Sans JP", fichier: "SOCIETES/SUD ALPES AUDIT/Lettre de mission S2A - Mission de présentation Société - Sans tenue Sans social Sans JP.docx" },
];

/* Choisit le modèle qui colle le mieux aux options retenues. Un axe que le
   modèle ne distingue pas (null) n'est jamais un motif d'écart. */
function ldmModele(choix) {
  const candidats = LDM_CATALOGUE.filter(m =>
    m.cabinet === choix.cabinet &&
    m.categorie === choix.categorie &&
    m.ancienForfait === !!choix.ancienForfait);
  if (candidats.length === 0) return null;
  function ecart(m) {
    let e = 0;
    ['tenue', 'social', 'jp'].forEach(axe => {
      if (m[axe] !== null && m[axe] !== !!choix[axe]) e += 1;
    });
    return e;
  }
  return candidats.slice().sort((a, b) => ecart(a) - ecart(b))[0];
}

/* Axes réellement proposés pour une catégorie : inutile de demander « avec ou
   sans tenue » si aucun modèle de la catégorie ne fait la distinction. */
function ldmAxesUtiles(cabinet, categorie) {
  const c = LDM_CATALOGUE.filter(m => m.cabinet === cabinet && m.categorie === categorie);
  return {
    tenue: c.some(m => m.tenue !== null) && new Set(c.map(m => m.tenue)).size > 1,
    social: c.some(m => m.social !== null) && new Set(c.map(m => m.social)).size > 1,
    jp: c.some(m => m.jp !== null) && new Set(c.map(m => m.jp)).size > 1,
    ancienForfait: new Set(c.map(m => m.ancienForfait)).size > 1,
  };
}

/* Champs à remplir dans la lettre, tels qu'ils figurent dans les contrôles de
   contenu Word. `calcule` marque les montants déduits des autres : ils ne sont
   jamais saisis à la main, pour qu'aucune incohérence ne parte au client. */
const LDM_CHAMPS_COMMUNS = [
  { code: 'civilite', label: 'Civilité', type: 'liste', options: ['Madame', 'Monsieur', 'Madame, Monsieur', 'Docteur', 'Maître'] },
  { code: 'villeSignature', label: 'Ville de signature', type: 'texte', placeholder: 'Nice' },
  { code: 'signataire', label: 'Expert-comptable signataire', type: 'liste', options: LDM_SIGNATAIRES },
  { code: 'modePrelevement', label: 'Mode de prélèvement', type: 'liste', options: ['Prélèvement automatique', 'Virement', 'Chèque'] },
];

const LDM_CHAMPS_PAR_CATEGORIE = {
  societe: [
    { code: 'denomination', label: 'Dénomination sociale', type: 'texte' },
    { code: 'formeSociete', label: 'Forme de société', type: 'liste', options: ['SAS', 'SASU', 'SA', 'SARL', 'EURL', 'SELARL', 'SELAS', 'SPFPL'] },
    { code: 'representant', label: 'Identité du représentant légal', type: 'texte' },
    { code: 'fonction', label: 'Fonction du représentant', type: 'liste', options: ['Président', 'Directeur général', 'Gérant'] },
    { code: 'activite', label: 'Activité principale de l’entreprise', type: 'texte', aide: 'Reprise telle quelle dans « Votre activité principale est… »', placeholder: 'la marchande de biens immobiliers' },
    { code: 'adresse', label: 'Adresse du siège social', type: 'texte' },
    { code: 'ouverture', label: 'Ouverture de l’exercice', type: 'date' },
    { code: 'cloture', label: 'Clôture de l’exercice', type: 'date' },
    { code: 'salaries', label: 'Nombre de salariés', type: 'liste', options: ['1 salarié', '2 salariés', '3 salariés', '4 salariés', '5 salariés', '6 salariés', '7 salariés', '8 salariés', '9 salariés', '10 salariés et plus'] },
    { code: 'regimeFiscal', label: 'Régime fiscal', type: 'liste', options: ['IS', 'IR'] },
    { code: 'modeReglement', label: 'Mode de règlement', type: 'liste', options: ['fin de mois', 'le 10 du mois', 'le 15 du mois'] },
  ],
  ei: [
    { code: 'denomination', label: 'Dénomination', type: 'texte' },
    { code: 'formeExercice', label: 'Forme d’exercice', type: 'liste', options: ['Entreprise individuelle', 'EIRL', 'Micro-entreprise'] },
    { code: 'representant', label: 'Identité du chef d’entreprise', type: 'texte' },
    { code: 'activite', label: 'Activité principale de l’entreprise', type: 'texte', aide: 'Reprise telle quelle dans « Votre activité principale est… »' },
    { code: 'adresse', label: 'Adresse du siège social', type: 'texte' },
    { code: 'ouverture', label: 'Ouverture de l’exercice', type: 'date' },
    { code: 'cloture', label: 'Clôture de l’exercice', type: 'date' },
    { code: 'salaries', label: 'Nombre de salariés', type: 'liste', options: ['1 salarié', '2 salariés', '3 salariés', '4 salariés', '5 salariés', '6 salariés', '7 salariés', '8 salariés', '9 salariés', '10 salariés et plus'] },
    { code: 'regimeFiscal', label: 'Régime fiscal', type: 'liste', options: ['IS', 'IR'] },
    { code: 'modeReglement', label: 'Mode de règlement', type: 'liste', options: ['fin de mois', 'le 10 du mois', 'le 15 du mois'] },
  ],
  bnc: [
    { code: 'representant', label: 'Identité du chef d’entreprise', type: 'texte' },
    { code: 'formeExercice', label: 'Forme d’exercice', type: 'liste', options: ['Entreprise individuelle', 'SELARL', 'SELAS', 'Société civile de moyens'] },
    { code: 'activite', label: 'Activité principale', type: 'texte', aide: 'Reprise telle quelle dans « Votre activité principale est… »' },
    { code: 'adresse', label: 'Adresse de l’entreprise', type: 'texte' },
    { code: 'ouverture', label: 'Ouverture de l’exercice', type: 'date' },
    { code: 'cloture', label: 'Clôture de l’exercice', type: 'date' },
    { code: 'tva', label: 'Assujetti à la TVA ?', type: 'liste', options: ['Oui', 'Non'] },
    { code: 'salaries', label: 'Nombre de salariés', type: 'liste', options: ['1 salarié', '2 salariés', '3 salariés', '4 salariés', '5 salariés et plus'] },
    { code: 'regimeFiscal', label: 'Régime fiscal', type: 'liste', options: ['IS', 'IR'] },
  ],
  sci: [
    { code: 'denomination', label: 'Dénomination sociale', type: 'texte' },
    { code: 'representant', label: 'Identité du représentant légal', type: 'texte' },
    { code: 'adresse', label: 'Adresse du siège social', type: 'texte' },
    { code: 'ouverture', label: 'Ouverture de l’exercice', type: 'date' },
    { code: 'cloture', label: 'Clôture de l’exercice', type: 'date' },
    { code: 'tva', label: 'Assujettie à la TVA ?', type: 'liste', options: ['Oui', 'Non'] },
    { code: 'salaries', label: 'Nombre de salariés', type: 'liste', options: ['Aucun salarié', '1 salarié', '2 salariés', '3 salariés et plus'] },
    { code: 'regimeFiscal', label: 'Régime fiscal', type: 'liste', options: ['IS', 'IR'] },
  ],
  irpp: [
    { code: 'contribuables', label: 'Identité du ou des contribuables', type: 'texte' },
    { code: 'adresse', label: 'Adresse du ou des contribuables', type: 'texte' },
    { code: 'ouvertureService', label: 'Ouverture du service de déclaration', type: 'date' },
  ],
  rf: [
    { code: 'contribuables', label: 'Identité du ou des contribuables', type: 'texte' },
    { code: 'adresse', label: 'Adresse du ou des contribuables', type: 'texte' },
    { code: 'ouvertureService', label: 'Ouverture du service de déclaration', type: 'date' },
  ],
  rj: [
    { code: 'denomination', label: 'Dénomination sociale', type: 'texte' },
    { code: 'formeSociete', label: 'Forme de société', type: 'liste', options: ['SAS', 'SASU', 'SA', 'SARL', 'EURL', 'SELARL', 'SELAS', 'SPFPL'] },
    { code: 'representant', label: 'Identité du représentant légal', type: 'texte' },
    { code: 'fonction', label: 'Fonction du représentant', type: 'liste', options: ['Président', 'Directeur général', 'Gérant'] },
    { code: 'activite', label: 'Activité principale de l’entreprise', type: 'texte' },
    { code: 'adresse', label: 'Adresse du siège social', type: 'texte' },
    { code: 'ouverture', label: 'Ouverture de l’exercice', type: 'date' },
    { code: 'cloture', label: 'Clôture de l’exercice', type: 'date' },
    { code: 'salaries', label: 'Nombre de salariés', type: 'liste', options: ['1 salarié', '2 salariés', '3 salariés', '4 salariés', '5 salariés et plus'] },
    { code: 'regimeFiscal', label: 'Régime fiscal', type: 'liste', options: ['IS', 'IR'] },
  ],
};

/* Les catégories qui ne facturent qu'un honoraire annuel (déclarations) contre
   celles qui facturent au mois. */
const LDM_CATEGORIES_ANNUELLES = ['irpp', 'rf'];

const LDM_TAUX_TVA = 0.20;

/* Tous les montants de la lettre découlent de deux saisies : l'honoraire
   comptable et, s'il y a lieu, l'honoraire social. Les calculer ici garantit
   qu'aucune incohérence de total ne part chez le client. */
function ldmMontants({ categorie, mensuelCompta, mensuelSocial, annuelDirect }) {
  const annuelSeul = LDM_CATEGORIES_ANNUELLES.indexOf(categorie) !== -1;
  const c = Number(mensuelCompta) || 0;
  const s = Number(mensuelSocial) || 0;
  const totalMensuelHT = annuelSeul ? 0 : c + s;
  const totalAnnuelHT = annuelSeul ? (Number(annuelDirect) || 0) : totalMensuelHT * 12;
  const tvaMensuelle = totalMensuelHT * LDM_TAUX_TVA;
  const tvaAnnuelle = totalAnnuelHT * LDM_TAUX_TVA;
  return {
    annuelSeul,
    comptaMensuelHT: c, comptaAnnuelHT: c * 12,
    socialMensuelHT: s, socialAnnuelHT: s * 12,
    totalMensuelHT, totalAnnuelHT,
    tvaMensuelle, tvaAnnuelle,
    totalMensuelTTC: totalMensuelHT + tvaMensuelle,
    totalAnnuelTTC: totalAnnuelHT + tvaAnnuelle,
  };
}

/* Traduit les réponses de l'assistant vers les alias exacts des contrôles de
   contenu Word. Un alias qui revient deux fois dans la lettre (honoraire
   comptable puis social) reçoit un tableau. */
function ldmValeursWord({ categorie, champs, montants, natureLabel }) {
  const c = champs || {};
  const m = montants;
  const jourMois = iso => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };
  const identite = [c.denomination, c.representant].filter(Boolean).join(' — ');

  const v = {
    'Madame ou Monsieur': c.civilite,
    'Ville de signature': c.villeSignature,
    "Identité de l'expert-comptable signataire": c.signataire,
    'Mode de prélèvement': c.modePrelevement,
    'Mode de règlement': c.modeReglement,
    'Dénomination sociale': c.denomination,
    'Dénomination sociale + Identité du représentant légal': identite || c.contribuables,
    'Identité du représentant légal': c.representant,
    "Identité du chef d'entreprise": c.representant,
    'Identité du ou des contribuables': c.contribuables,
    'Forme de société': c.formeSociete,
    "Forme d'exercice": c.formeExercice,
    'Fonction du représentant': c.fonction,
    "Activité principale de l'entreprise": reformulerActivite(c.activite),
    'Activité principale': reformulerActivite(c.activite),
    'Adresse du siège social': c.adresse,
    "Adresse de l'entreprise individuelle": c.adresse,
    'Adresse du ou des contribuables': c.adresse,
    'Nombre de salarié': c.salaries,
    'Régime fiscal': c.regimeFiscal,
    'Assujettissement à la TVA ?': c.tva,
    "Date d'ouverture de l'exercice en cours": formatDateLong(c.ouverture),
    'Date de clôture de l\'exercice en cours': formatDateLong(c.cloture),
    "Date d'ouverture": formatDateLong(c.ouverture),
    'Date de clôture': formatDateLong(c.cloture),
    "Date d'ouverture du service de déclaration": formatDateLong(c.ouvertureService),
    "Jour et mois d'ouverture (sans l'année)": jourMois(c.ouverture),
    "Jour et mois de clôture (sans l'année)": jourMois(c.cloture),
  };

  if (m) {
    // Première occurrence : volet comptable. Seconde : volet social.
    v['Montant mensuel HT'] = [euros(m.comptaMensuelHT), euros(m.socialMensuelHT)];
    v['Montant annuel HT'] = [euros(m.comptaAnnuelHT), euros(m.socialAnnuelHT), euros(m.totalAnnuelHT)];
    v['Montant total des honoraires mensuels HT'] = euros(m.totalMensuelHT);
    v['Montant total des honoraires annuels HT'] = euros(m.totalAnnuelHT);
    v['Montant total HT des honoraires mensuels'] = euros(m.totalMensuelHT);
    v['Montant total HT des honoraires annuels'] = euros(m.totalAnnuelHT);
    v['Montant de la TVA'] = [euros(m.tvaMensuelle), euros(m.tvaAnnuelle)];
    v['Montant total des honoraires mensuels TTC'] = euros(m.totalMensuelTTC);
    v['Montant total des honoraires annuels TTC'] = euros(m.totalAnnuelTTC);
  }

  Object.keys(v).forEach(k => { if (v[k] === undefined || v[k] === '') delete v[k]; });
  return v;
}

function euros(n) {
  return (Math.round(Number(n) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// --- Notes de synthèse (module collaborateur > Dossiers existants) ----------

const NOTE_SYNTHESE_CHAMPS = [
  { code: 'rentabilite', label: 'Rentabilité du dossier' },
  { code: 'problemes', label: 'Problèmes comptables identifiés' },
  { code: 'continuite', label: "Continuité d'exploitation" },
  { code: 'sujets', label: 'Sujets à évoquer lors du bilan' },
];

/* ------------------------------------------- Préparation du contrôle qualité

   Le contrôle qualité de l'Ordre se prépare en réunissant des preuves, pas en
   récitant des principes. Cette partie liste, composante par composante du
   système de management de la qualité (SMQ), la preuve que le contrôleur
   demande, et va chercher dans l'outil si le cabinet l'a ou non.

   Référentiel retenu : la norme professionnelle de management de la qualité
   (NPMQ), agréée par l'arrêté du 30 mai 2024 et applicable depuis le
   1er janvier 2025, qui structure le SMQ en huit composantes reliées entre
   elles. Les intitulés ci-dessous sont ceux de la norme.

   Règle de franchise : quand ComplyEC ne produit pas la preuve, on l'écrit
   (« hors outil ») au lieu de laisser croire que le point est couvert. */

const NPMQ_ARRETE = 'arrêté du 30 mai 2024, applicable depuis le 1er janvier 2025';

const CQ_ETATS = {
  ok:      { label: 'Preuve disponible', couleur: 'vert',   puce: '✓' },
  partiel: { label: 'Preuve incomplète', couleur: 'orange', puce: '!' },
  absent:  { label: 'Preuve manquante',  couleur: 'rouge',  puce: '✕' },
  externe: { label: 'À fournir hors ComplyEC', couleur: 'gris', puce: '·' },
};

function cqChapitreManuel(id) {
  const c = PROCEDURES_MANUEL_CHAPITRES.find(x => x.id === id);
  if (!c) return { etat: 'absent', detail: 'Chapitre absent du plan du manuel.' };
  if (c.statut === 'a_jour') return { etat: 'ok', detail: `Chapitre « ${c.titre} » rédigé${c.derniereMaj ? ' le ' + formatDate(c.derniereMaj) : ''}.` };
  if (c.statut === 'a_reviser') return { etat: 'partiel', detail: `Chapitre « ${c.titre} » rédigé mais à réviser.` };
  return { etat: 'absent', detail: `Chapitre « ${c.titre} » non rédigé.` };
}

/* Construit l'état réel du dossier de contrôle à partir des données de l'outil.
   Chaque preuve porte son intitulé, le texte qui la fonde, son état et une
   phrase qui dit où on en est — pas un simple voyant. */
function preparationControleQualite(settings) {
  const seuilDependance = (settings && settings.seuilDependance) || SEUIL_DEPENDANCE_DEFAUT;
  const dependances = dependanceASurveiller(seuilDependance);
  const ldm = ldmSuiviCabinet(settings);
  const carto = cartographieStats();
  const declManquantes = declarationsManquantes();
  const formationsKO = formationsNonAJour();
  const registre = registreFormation();
  const connaissance = vigilanceConnaissanceStats();
  const accusesKO = diffusionAccusesManquants();
  const nbCollab = COLLABORATEURS.length;
  const ldmNonAJour = ldm.absentes.length + ldm.critiques.length + ldm.aReviser.length;

  const composantes = [
    {
      id: 'risques',
      icone: '🎯',
      titre: 'Processus d’évaluation des risques de la structure',
      ton: 'violet',
      resume: "Identifier ce qui peut faire rater une mission, et le formaliser.",
      preuves: [
        Object.assign({ libelle: 'Cartographie des risques du cabinet', source: 'NPMQ' },
          carto.total > 0
            ? { etat: carto.nonAnalyses.length ? 'partiel' : 'ok',
                detail: `${carto.total} ${pluriel(carto.total, 'dossier')} ${pluriel(carto.total, 'analysé')} sur ${carto.total + carto.nonAnalyses.length}${carto.nonAnalyses.length ? ` — ${carto.nonAnalyses.length} ${pluriel(carto.nonAnalyses.length, 'reste', 'restent')} à analyser.` : '.'}` }
            : { etat: 'absent', detail: 'Aucune analyse de risque enregistrée.' }),
        Object.assign({ libelle: 'Classification des risques LBC-FT du cabinet', source: 'CMF art. L. 561-4-1' },
          { etat: 'partiel', detail: `Dernière révision : ${formatDate(CONFORMITE_CABINET.classificationRisquesLBCFT.derniereRevision)}. ${CONFORMITE_CABINET.classificationRisquesLBCFT.statut}.` }),
        { libelle: 'Objectifs qualité chiffrés et suivis dans le temps', source: 'NPMQ', etat: 'externe',
          detail: "ComplyEC ne fixe pas d'objectifs qualité : à formaliser par la direction du cabinet." },
      ],
    },
    {
      id: 'gouvernance',
      icone: '🏛️',
      titre: 'Gouvernance et leadership',
      ton: 'bleu',
      resume: "Montrer que la direction porte le système qualité, par écrit.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Gouvernance et organisation du cabinet » du manuel', source: 'NPMQ' }, cqChapitreManuel('gouvernance')),
        { libelle: 'Désignation du responsable du système de management de la qualité', source: 'NPMQ', etat: 'externe',
          detail: "La nomination se matérialise par une décision écrite du cabinet, à conserver dans le dossier de contrôle." },
        { libelle: 'Déclarant et correspondant Tracfin désignés et communiqués', source: 'CMF art. R. 561-23',
          etat: (settings && settings.declarantTracfin && settings.correspondantTracfin)
            ? (settings.tracfinDeclareAuService ? 'ok' : 'partiel')
            : 'absent',
          detail: (settings && settings.declarantTracfin && settings.correspondantTracfin)
            ? `Déclarant : ${settings.declarantTracfin}. Correspondant : ${settings.correspondantTracfin}.` +
              (settings.tracfinDeclareAuService
                ? ' Désignations communiquées à Tracfin et au Conseil de l’Ordre.'
                : ' Reste à communiquer ces identités à Tracfin et au Conseil de l’Ordre, comme l’impose l’article R. 561-23.')
            : 'Aucun déclarant ni correspondant renseigné dans les paramètres du cabinet.' },
        Object.assign({ libelle: 'Chapitre « Surveillance du système qualité »', source: 'NPMQ' }, cqChapitreManuel('surveillance-smq')),
      ],
    },
    {
      id: 'ethique',
      icone: '⚖️',
      titre: 'Règles d’éthique applicables, dont l’indépendance',
      ton: 'orange',
      resume: "Prouver que chacun s’est engagé et que les cas de dépendance sont traités.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Déontologie et indépendance » du manuel', source: 'Décret 2012-432, art. 141 à 169' }, cqChapitreManuel('deontologie')),
        // L'article 146 impose l'indépendance ; il n'impose pas la déclaration
        // annuelle signée. C'est le moyen de preuve retenu par le cabinet, et
        // l'intitulé ne doit pas laisser croire à une obligation de forme.
        { libelle: `Déclarations d’indépendance signées (exercice ${currentCalendarYear()})`, source: 'Preuve d’indépendance — décret 2012-432, art. 146',
          etat: declManquantes.length === 0 ? 'ok' : (declManquantes.length < nbCollab ? 'partiel' : 'absent'),
          detail: declManquantes.length === 0
            ? `Les ${nbCollab} collaborateurs ont signé.`
            : `${nbCollab - declManquantes.length} ${pluriel(nbCollab - declManquantes.length, 'signature')} sur ${nbCollab} — ${pluriel(declManquantes.length, 'manque', 'manquent')} : ${declManquantes.map(d => collaborateur(d.collaborateur).nom).join(', ')}.` },
        { libelle: 'Notes de dépendance économique pour les clients au-dessus du seuil', source: 'Décret 2012-432, art. 146',
          etat: dependances.length === 0 ? 'ok' : 'partiel',
          detail: dependances.length === 0
            ? `Aucun client ne dépasse le seuil de ${pourcent(seuilDependance)} fixé par le cabinet.`
            : `${dependances.length} ${pluriel(dependances.length, 'dossier')} au-dessus du seuil de ${pourcent(seuilDependance)} : la note est générée à la demande, pensez à la classer signée.` },
      ],
    },
    {
      id: 'acceptation',
      icone: '🤝',
      titre: 'Acceptation et maintien des relations clients et des missions',
      ton: 'vert',
      resume: "Une lettre de mission à jour et une vigilance LBC-FT documentée, pour chaque dossier.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Entrée en relation et lettres de mission » du manuel', source: 'NPMQ' }, cqChapitreManuel('entree-mission')),
        { libelle: 'Lettres de mission signées et actualisées', source: 'Décret 2012-432, art. 151',
          etat: ldmNonAJour === 0 ? 'ok' : (ldm.aJour.length ? 'partiel' : 'absent'),
          detail: `${ldm.aJour.length} à jour sur ${ldm.lignes.length}` +
            (ldm.absentes.length ? ` — ${ldm.absentes.length} ${pluriel(ldm.absentes.length, 'absente')}` : '') +
            (ldm.critiques.length ? `, ${ldm.critiques.length} non ${pluriel(ldm.critiques.length, 'actualisée')} depuis plus de deux ans` : '') +
            (ldm.aReviser.length ? `, ${ldm.aReviser.length} à réviser` : '') + '.' },
        { libelle: 'Fiche de vigilance LBC-FT par dossier', source: 'CMF art. L. 561-5 et L. 561-5-1',
          etat: carto.nonAnalyses.length === 0 ? 'ok' : (carto.total ? 'partiel' : 'absent'),
          detail: `${carto.total} ${pluriel(carto.total, 'fiche')} sur ${carto.total + carto.nonAnalyses.length}` +
            (carto.nonAnalyses.length ? ` — restent à faire : ${carto.nonAnalyses.map(d => client(d.dossier).nom).join(', ')}.` : '.') },
        { libelle: 'Bénéficiaires effectifs identifiés et identité vérifiée', source: 'CMF art. L. 561-2-2 et L. 561-5',
          etat: connaissance.total === 0 ? 'absent' : (connaissance.beneficiairesOk === connaissance.total ? 'ok' : 'partiel'),
          detail: `${connaissance.beneficiairesOk} ${pluriel(connaissance.beneficiairesOk, 'dossier')} sur ${connaissance.total} avec un bénéficiaire effectif identifié et vérifié.` },
        { libelle: 'Origine du patrimoine et des fonds établie', source: 'CMF art. R. 561-20-2',
          etat: connaissance.total === 0 ? 'absent' : (connaissance.origineAFaire.length === 0 ? 'ok' : 'partiel'),
          detail: connaissance.origineAFaire.length === 0
            ? `Documentée sur les ${connaissance.total} dossiers analysés.`
            : `Reste à établir sur ${connaissance.origineAFaire.length} ${pluriel(connaissance.origineAFaire.length, 'dossier')} : ${connaissance.origineAFaire.map(l => client(l.dossier).nom).join(', ')}.` },
        { libelle: 'Statut de personne politiquement exposée tranché', source: 'CMF art. R. 561-18',
          etat: connaissance.total === 0 ? 'absent' : (connaissance.ppeAVerifier.length === 0 ? 'ok' : 'partiel'),
          detail: connaissance.ppeAVerifier.length === 0
            ? `Statut tranché sur les ${connaissance.total} dossiers analysés (dont ${connaissance.ppeAverees.length} ${pluriel(connaissance.ppeAverees.length, 'PPE avérée', 'PPE avérées')}).`
            : `Encore à vérifier sur ${connaissance.ppeAVerifier.length} ${pluriel(connaissance.ppeAVerifier.length, 'dossier')} : ${connaissance.ppeAVerifier.map(l => client(l.dossier).nom).join(', ')}.` },
        Object.assign({ libelle: 'Chapitre « Vigilance et lutte contre le blanchiment » du manuel', source: 'CMF art. L. 561-32' }, cqChapitreManuel('lbcft')),
      ],
    },
    {
      id: 'ressources',
      icone: '🎓',
      titre: 'Ressources humaines, technologiques et intellectuelles',
      ton: 'violet',
      resume: "Des collaborateurs formés, et la trace de leurs formations.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Formation continue des collaborateurs » du manuel', source: 'NPMQ' }, cqChapitreManuel('formation')),
        { libelle: 'Attestations de formation LBC-FT de l’année en cours', source: 'CMF art. L. 561-33',
          etat: formationsKO.length === 0 ? 'ok' : (formationsKO.length < nbCollab ? 'partiel' : 'absent'),
          detail: formationsKO.length === 0
            ? 'Tous les collaborateurs sont à jour sur la dernière session passée.'
            : `Attestation non reçue pour : ${formationsKO.map(f => collaborateur(f.collaborateur).nom).join(', ')}.` },
        { libelle: 'Formation LBC-FT dispensée dès l’embauche', source: FORMATION_ARTICLE,
          etat: registre.accueilManquant.length === 0 ? (registre.accueilTardif.length ? 'partiel' : 'ok') : 'absent',
          detail: registre.accueilManquant.length === 0
            ? (registre.accueilTardif.length
                ? `Tous les arrivants ont été formés, mais ${registre.accueilTardif.length} au-delà du délai que le cabinet s'est fixé.`
                : 'Chaque arrivant a reçu sa formation d’accueil dans les délais du cabinet.')
            : `Jamais suivie par : ${registre.accueilManquant.map(l => l.nom).join(', ')}.` },
        { libelle: 'Registre des justificatifs de formation, conservés 5 ans après le départ', source: FORMATION_ARTICLE,
          etat: 'partiel',
          detail: `Le registre est produit en Word depuis l'écran Formations LBC-FT. ${registre.conservationEnCours.length === 0 ? 'Aucune pièce de personne partie n’est encore sous obligation de conservation.' : `${registre.conservationEnCours.length} ${pluriel(registre.conservationEnCours.length, 'personne partie', 'personnes parties')} dont les pièces ne doivent pas être détruites : ${registre.conservationEnCours.map(l => `${l.nom} (jusqu'au ${formatDate(l.conserverJusquA)})`).join(', ')}.`}` },
        { libelle: 'Suivi de la formation continue des professionnels inscrits', source: 'Obligation de formation continue de l’Ordre', etat: 'externe',
          detail: "Le décompte des heures est tenu hors ComplyEC : joindre l'état de formation délivré par le Conseil régional." },
      ],
    },
    {
      id: 'realisation',
      icone: '📋',
      titre: 'Réalisation des missions',
      ton: 'bleu',
      resume: "La supervision doit se voir dans les dossiers, pas seulement dans les têtes.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Contrôle qualité des missions » du manuel', source: 'NPMQ' }, cqChapitreManuel('controle-qualite')),
        { libelle: 'Trace de la supervision des dossiers de bilan', source: 'NP 2300',
          etat: BILAN_DOSSIERS.length ? 'partiel' : 'absent',
          detail: `${BILAN_DOSSIERS.length} ${pluriel(BILAN_DOSSIERS.length, 'dossier')} ${pluriel(BILAN_DOSSIERS.length, 'suivi')} dans la supervision bilan. Les revues sont visibles à l'écran mais ne sont pas encore archivées en pièce datée et signée.` },
        Object.assign({ libelle: 'Chapitre « Revue indépendante des missions à risque »', source: 'NPMQ' }, cqChapitreManuel('revue-independante')),
        Object.assign({ libelle: 'Chapitre « Archivage et conservation des dossiers » du manuel', source: 'NPMQ' }, cqChapitreManuel('archivage')),
      ],
    },
    {
      id: 'information',
      icone: '📢',
      titre: 'Information et communication',
      ton: 'orange',
      resume: "Les procédures doivent être diffusées, et la diffusion prouvée.",
      preuves: [
        { libelle: 'Accusés de lecture de la dernière version des procédures', source: 'NPMQ',
          etat: accusesKO.length === 0 ? 'ok' : (accusesKO.length < nbCollab ? 'partiel' : 'absent'),
          detail: accusesKO.length === 0
            ? `Version ${PROCEDURES_VERSIONS[0].version} signée par les ${nbCollab} collaborateurs.`
            : `Version ${PROCEDURES_VERSIONS[0].version} : ${accusesKO.length} ${pluriel(accusesKO.length, 'accusé')} ${pluriel(accusesKO.length, 'manquant')} — ${accusesKO.map(a => collaborateur(a.collaborateur).nom).join(', ')}.` },
        Object.assign({ libelle: 'Chapitre « Secret professionnel et protection des données »', source: 'Code de déontologie (décret 2012-432)' }, cqChapitreManuel('secret-pro')),
        { libelle: 'Communication au client des conditions de la mission', source: 'Décret 2012-432, art. 151',
          etat: ldm.absentes.length === 0 ? 'ok' : 'partiel',
          detail: ldm.absentes.length === 0
            ? 'Chaque dossier dispose d’une lettre de mission remise au client.'
            : `${ldm.absentes.length} ${pluriel(ldm.absentes.length, 'dossier')} sans lettre de mission remise.` },
      ],
    },
    {
      id: 'surveillance',
      icone: '🔁',
      titre: 'Processus de surveillance et de correction',
      ton: 'gris',
      resume: "Contrôler son propre système, et corriger ce qui ne va pas.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Surveillance du système qualité et actions correctives »', source: 'NPMQ' }, cqChapitreManuel('surveillance-smq')),
        { libelle: 'Relevé des anomalies détectées et de leur traitement', source: 'NPMQ',
          etat: ANOMALIES.length ? 'partiel' : 'absent',
          detail: `${ANOMALIES.length} ${pluriel(ANOMALIES.length, 'anomalie')} ${pluriel(ANOMALIES.length, 'suivie')} dans l'outil. Le plan d'action correctif associé reste à formaliser par écrit.` },
        { libelle: 'Rapport annuel de surveillance du SMQ', source: 'NPMQ', etat: 'externe',
          detail: "La norme n'impose pas de rapport type : ComplyEC fournit les états, la conclusion écrite reste celle du cabinet." },
      ],
    },
  ];

  composantes.forEach(c => {
    c.nbOk = c.preuves.filter(p => p.etat === 'ok').length;
    c.nbATraiter = c.preuves.filter(p => p.etat === 'absent' || p.etat === 'partiel').length;
    c.nbExterne = c.preuves.filter(p => p.etat === 'externe').length;
  });

  const toutes = composantes.reduce((acc, c) => acc.concat(c.preuves), []);
  return {
    composantes,
    total: toutes.length,
    ok: toutes.filter(p => p.etat === 'ok').length,
    aTraiter: toutes.filter(p => p.etat === 'absent' || p.etat === 'partiel').length,
    externe: toutes.filter(p => p.etat === 'externe').length,
  };
}
