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

/* Repli du nombre de sessions LBC-FT annuelles, quand le cabinet vide le champ
   dans ses paramètres. Le code s'en servait déjà comme filet — mais la
   constante n'existait nulle part, et vider le champ faisait donc disparaître
   l'écran Formations sur une ReferenceError. Aucun texte n'impose deux sessions
   par an : c'est la règle que le cabinet se donne, et elle reste modifiable. */
const SESSIONS_ATTENDUES_PAR_AN = 2;

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
  relanceDelaiJours: 30,
  declarantTracfin: 'Martin Dupont',
  correspondantTracfin: 'Martin Dupont',
  tracfinDeclareAuService: false,
  nom: 'Cabinet Dupont & Associés',
  adresse: '12 rue des Comptes, 75008 Paris',
  telephone: '01 42 00 00 00',
  logoDataUrl: null,
  signature: "Martin Dupont\nExpert-comptable",
  /* Mentions du pied de page du papier à en-tête, telles qu'elles figurent sur
     les courriers du cabinet. Elles se règlent dans Paramètres du cabinet. */
  mentionsLegales: "12 RUE DES COMPTES, 75008 PARIS — TÉL. 01.42.00.00.00\n"
    + "S.A.R.L. AU CAPITAL DE 8.000 € — R.C.S. PARIS B 420 536 518\n"
    + "SIRET 420 536 518 00046 — NAF 6920Z\n"
    + "SOCIÉTÉ D’EXPERTISE COMPTABLE INSCRITE À L’ORDRE DES EXPERTS-COMPTABLES",

  /* Identité du cabinet telle que Paramètres la fait saisir (§ 14). Ces valeurs
     sont celles qu'impriment le manuel et les courriers : une seule saisie, et
     elles servent partout. */
  formeJuridique: 'SARL',
  conseilRegional: 'Conseil régional de l’Ordre des experts-comptables de Paris Île-de-France',
  numeroInscription: '14-0001234',
  etablissementSecondaire: false,
  adresseSecondaire: '',
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
  // « Activités de conseil » → « conseil » : l'amorce est reprise par la phrase
  // qui l'entoure, la répéter donne « une activité d'activité de conseil ».
  t = t.replace(/^(activités? d['’]|activités? de |sociétés? d['’]|sociétés? de |entreprises? d['’]|entreprises? de )/i, '');
  // Singulier des têtes de groupe courantes.
  for (const [motif, remplacement] of ACTIVITE_PLURIELS) {
    if (motif.test(t)) { t = t.replace(motif, remplacement); break; }
  }
  // Un sigle garde ses capitales : « r&D électronique » n'est pas une activité.
  const premier = t.split(/[\s-]/)[0];
  const estSigle = premier.length <= 5 && premier === premier.toUpperCase() && /[A-Z]/.test(premier);
  return estSigle ? t : t.charAt(0).toLowerCase() + t.slice(1);
}

/* Élision devant voyelle ou h muet : « une activité d'import-export », pas
   « de import-export ». */
function elision(prefixe, mot) {
  return /^[aeiouyàâäéèêëîïôöûüh]/i.test(String(mot || '').trim())
    ? prefixe.replace(/e$/, '’')
    : prefixe + ' ';
}

/* Phrase telle qu'elle apparaîtra dans la lettre, pour jugement sur pièce.

   « Votre activité principale est marchand de biens immobiliers » est fautif :
   une société n'« est » pas un marchand. La tournure « exerce une activité
   de … » se construit correctement quel que soit le libellé du code NAF, qu'il
   désigne un métier (marchand de biens, expert-comptable) ou une action
   (location immobilière, conseil en communication) — et elle évite d'avoir à
   deviner le genre du nom pour choisir un article.

   Le sujet s'accorde à la nature du contractant : une association n'est pas
   une société, une entreprise individuelle non plus. */
function sujetContractant(nature) {
  if (/association/i.test(nature || '')) return 'Votre association';
  if (/entreprise individuelle|particulier/i.test(nature || '')) return 'Votre entreprise';
  return 'Votre société';
}

function phraseActivite(activite, adresse, nature) {
  const a = reformulerActivite(activite);
  const sujet = sujetContractant(nature);
  const debut = a
    ? `${sujet} exerce une activité ${elision('de', a)}${a}.`
    : `${sujet} exerce une activité de …`;
  if (!adresse) return debut;
  // « situé au 12 rue… » quand l'adresse commence par un numéro, « situé 12 bis
  // avenue… » sinon : la préposition suit le texte réel, pas une hypothèse.
  const prefixe = /^\d/.test(String(adresse).trim()) ? 'au ' : '';
  return `${debut} Son siège social est situé ${prefixe}${adresse}.`;
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
    /* Part des rubriques attendues effectivement présentes. Ce n'est pas un
       score de conformité, et il n'est affiché nulle part : une lettre peut
       porter toutes ses rubriques et rester inadaptée à la mission. Il sert à
       ordonner les lettres à refaire, rien de plus. */
    rubriquesPresentesPct: Math.round((presentes.length / rubriques.length) * 100),
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

/* Trois dossiers n'ont volontairement aucune entrée : ce sont ceux dont la
   lettre est absente. C'est cette table, et elle seule, qui dit si une lettre
   existe et depuis quand — les anomalies de catégorie « lettre de mission »
   en découlent, elles ne la contredisent pas. */
const LETTRES_MISSION = {
  'sas-nova': { dateSignature: '2023-04-10', derniereActualisation: '2026-01-10', signataire: 'Julien LESNES', honorairesMensuels: 150 },
  'sci-durand': { dateSignature: '2023-04-11', derniereActualisation: '2026-02-11', signataire: 'Thierry BOZZOLA', honorairesMensuels: 195 },
  'sarl-projet': { dateSignature: '2022-03-12', derniereActualisation: '2025-03-03', signataire: 'Julien LESNES', honorairesMensuels: 240 },
  'eurl-alpes': { dateSignature: '2022-04-13', derniereActualisation: '2025-04-04', signataire: 'Thierry BOZZOLA', honorairesMensuels: 285 },
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
  { id: 'a02', dossier: 'sas-nova', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "La pièce d'identité du dirigeant est arrivée à expiration.", dateDetection: '2026-04-10', dernierAction: 'Régularisé et vérifié', statut: 'termine', dateDemandeEC: '2026-05-02', commentaire: "Pièce d'identité arrivée à expiration, à renouveler auprès du client." },
  { id: 'a03', dossier: 'sas-nova', categorie: 'document_manquant', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Bénéficiaires effectifs (RBE) manquants', description: "Le registre des bénéficiaires effectifs n'a pas été collecté.", dateDetection: '2026-03-22', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-03', commentaire: "Document obligatoire dans le cadre de la vigilance LBC-FT." },
  { id: 'a04', dossier: 'sas-nova', categorie: 'classement_non_conforme', collaborateur: 'nathalie', priorite: 'Moyenne', titre: 'Classement non conforme', description: "L'arborescence Drive du dossier ne respecte pas le plan de classement du cabinet.", dateDetection: '2026-04-28', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "Les documents comptables ne sont pas classés dans les bons sous-dossiers." },

  { id: 'a05', dossier: 'sci-durand', categorie: 'piece_expiree', collaborateur: 'heddy', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "Carte d'identité du gérant expirée depuis le 03/2026.", dateDetection: '2026-04-02', dernierAction: 'Relance envoyée le 01/05', statut: 'en_cours', dateDemandeEC: '2026-05-01', commentaire: "Pièce à renouveler avant la prochaine échéance de dépôt." },
  { id: 'a06', dossier: 'sci-durand', categorie: 'document_manquant', collaborateur: 'heddy', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS du dossier n’a pas été collecté.', dateDetection: '2026-04-30', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Nécessaire pour la mise à jour du dossier permanent." },
  { id: 'a07', dossier: 'sarl-dupont-immo', categorie: 'ldm_non_actualisee', collaborateur: 'julie', priorite: 'Haute', titre: 'Lettre de mission non actualisée', description: 'La lettre en vigueur date d’avril 2022 et ne couvre plus le périmètre réel de la mission.', dateDetection: '2026-03-12', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-04', commentaire: "Refaire la lettre par le parcours de contractualisation." },

  { id: 'a08', dossier: 'sarl-projet', categorie: 'document_manquant', collaborateur: 'julie', priorite: 'Haute', titre: 'Bénéficiaires effectifs (RBE) manquants', description: "Le registre des bénéficiaires effectifs n'a pas été collecté.", dateDetection: '2026-04-18', dernierAction: 'Relance envoyée le 03/05', statut: 'en_cours', dateDemandeEC: '2026-05-03', commentaire: "Document obligatoire dans le cadre de la vigilance LBC-FT." },
  { id: 'a09', dossier: 'sarl-projet', categorie: 'piece_expiree', collaborateur: 'julie', priorite: 'Haute', titre: 'Attestation PPE expirée', description: "L'attestation PPE du dirigeant date de plus de 3 ans.", dateDetection: '2026-04-05', dernierAction: 'Régularisé et vérifié', statut: 'termine', dateDemandeEC: '2026-05-05', commentaire: "À renouveler dans le cadre de la vigilance LBC-FT." },
  { id: 'a10', dossier: 'sarl-projet', categorie: 'classement_non_conforme', collaborateur: 'julie', priorite: 'Moyenne', titre: 'Classement non conforme', description: 'Les pièces sociales sont classées dans le dossier comptable.', dateDetection: '2026-04-29', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "À reclasser selon le plan de classement du cabinet." },

  { id: 'a11', dossier: 'eurl-alpes', categorie: 'piece_expiree', collaborateur: 'thomas', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "Pièce d'identité du dirigeant expirée.", dateDetection: '2026-04-08', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-04', commentaire: "À renouveler avant la clôture de l'exercice." },
  { id: 'a12', dossier: 'eurl-alpes', categorie: 'document_manquant', collaborateur: 'thomas', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS n’a pas été collecté.', dateDetection: '2026-04-20', dernierAction: 'Relance envoyée le 28/04', statut: 'en_cours', dateDemandeEC: '2026-04-28', commentaire: "Document requis pour la mise à jour du dossier permanent." },

  { id: 'a13', dossier: 'sas-vision', categorie: 'classement_non_conforme', collaborateur: 'heddy', priorite: 'Faible', titre: 'Classement non conforme', description: 'Les factures fournisseurs ne sont pas nommées selon la convention du cabinet.', dateDetection: '2026-04-25', dernierAction: 'Régularisé et vérifié', statut: 'termine', dateDemandeEC: '2026-05-06', commentaire: "Renommage à effectuer selon la convention AAAA-MM-fournisseur." },
  { id: 'a14', dossier: 'sas-vision', categorie: 'supervision_manquante', collaborateur: 'heddy', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "La supervision annuelle de l'exercice 2025 n'a pas encore été réalisée.", dateDetection: '2026-02-01', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-07', commentaire: "À planifier avant la prochaine réunion bilan." },

  { id: 'a15', dossier: 'sci-martin', categorie: 'lettre_mission', collaborateur: 'julie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission trouvée dans le dossier Drive.', dateDetection: '2026-03-12', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-02', commentaire: "Aucune lettre de mission trouvée dans le dossier Drive." },
  { id: 'a16', dossier: 'sarl-beta', categorie: 'lettre_mission', collaborateur: 'julie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Le dossier a été ouvert sans génération de lettre de mission.', dateDetection: '2026-03-18', dernierAction: 'Relance envoyée le 02/05', statut: 'en_cours', dateDemandeEC: '2026-05-02', commentaire: "Lettre de mission à générer via le module de contractualisation." },
  { id: 'a17', dossier: 'sas-vision', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Lettre de mission introuvable pour l’exercice en cours.', dateDetection: '2026-03-20', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "À régulariser rapidement, dossier en mission de présentation." },
  { id: 'a18', dossier: 'sci-riviera', categorie: 'ldm_non_actualisee', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Lettre de mission non actualisée', description: 'La lettre remonte à mai 2019 : honoraires et périmètre ont changé depuis.', dateDetection: '2026-03-25', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-03', commentaire: "Ancienneté difficilement défendable en contrôle." },
  { id: 'a19', dossier: 'sas-atlantique', categorie: 'ldm_non_actualisee', collaborateur: 'julie', priorite: 'Haute', titre: 'Lettre de mission non actualisée', description: 'La lettre date de juin 2020 et ne mentionne pas le volet social repris depuis.', dateDetection: '2026-04-01', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Refaire la lettre avant la prochaine clôture." },

  { id: 'a20', dossier: 'sci-lumiere', categorie: 'document_manquant', collaborateur: 'julie', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS du dossier n’a pas été collecté.', dateDetection: '2026-04-15', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-07', commentaire: "Nécessaire pour la mise à jour du dossier permanent." },
  { id: 'a21', dossier: 'sarl-alpha', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Attestation PPE expirée', description: "L'attestation PPE du dirigeant date de plus de 3 ans.", dateDetection: '2026-04-12', dernierAction: 'Relance envoyée le 30/04', statut: 'en_cours', dateDemandeEC: '2026-04-30', commentaire: "À renouveler dans le cadre de la vigilance LBC-FT." },
  { id: 'a22', dossier: 'eurl-ocean', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: "Pièce d'identité (CNI) expirée", description: "Pièce d'identité du dirigeant expirée.", dateDetection: '2026-04-14', dernierAction: 'Régularisé et vérifié', statut: 'termine', dateDemandeEC: '2026-05-08', commentaire: "À renouveler auprès du client." },
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

/* Le retard ne se déclare pas, il se constate.

   Le statut d'une anomalie est saisi par le collaborateur : personne ne repasse
   marquer « en retard » une demande oubliée, et une demande de mai encore « à
   faire » en septembre ne se voyait donc nulle part. Le retard est désormais
   calculé à partir de la date de demande, sans toucher au statut saisi. */
function relanceJoursEcoules(dateDemande) {
  if (!dateDemande) return null;
  return Math.max(0, Math.round((new Date() - new Date(dateDemande + 'T00:00:00')) / 86400000));
}

function relancesList(settings) {
  const delai = Number((settings && settings.relanceDelaiJours) || CABINET_SETTINGS_DEFAUT.relanceDelaiJours);
  return ANOMALIES.filter(a => a.dateDemandeEC).map(a => {
    const jours = relanceJoursEcoules(a.dateDemandeEC);
    const ouverte = a.statut !== 'termine';
    return {
      ...a,
      dossierInfo: client(a.dossier),
      collaborateurInfo: collaborateur(a.collaborateur),
      joursEcoules: jours,
      enRetard: ouverte && jours !== null && jours > delai,
      delaiCabinet: delai,
    };
  }).sort((a, b) => new Date(b.dateDemandeEC) - new Date(a.dateDemandeEC));
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

/* Rang d'une priorité, pour trier du plus urgent au moins urgent. Sans cela,
   un tri alphabétique placerait « Critique » après « Basse ». */
const ORDRE_PRIORITE = { Critique: 1, Haute: 2, Moyenne: 3, Faible: 4 };

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
  const programme = dbFormationsProgrammes().find(p => p.annee === currentCalendarYear());
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
  dbFormationsProgrammes().forEach(prog => prog.sessions.forEach(s => {
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

/* ----------------------------------------------- Dépendance économique

   Le tableau du § 7.2 demande les honoraires, pas seulement une part : c'est
   l'honoraire qui se constate, la part qui se calcule. Le chiffre d'affaires
   du cabinet est saisi une seule fois, à l'étape 1 du manuel, et sert ici —
   on ne le redemande pas.

   Chiffre d'affaires de repli tant que le manuel n'est pas rempli. Il est
   annoncé comme tel à l'écran : une part calculée sur un CA supposé serait
   fausse sans le dire. */
const CABINET_CA_DEFAUT = 1250000;

/* Trois lignes de départ, dont deux sous le seuil : c'est la règle du cabinet
   qui doit se voir à l'écran. Sous 10 % du chiffre d'affaires, il n'y a rien à
   analyser ni à mettre en place, et écrire un paragraphe là où « Non
   significatif » suffit donne à relire ce qui n'a pas à l'être. */
const DEPENDANCE_LIGNES = [
  { id: 'dep-nova', client: 'SAS NOVA', honoraires: 177500,
    analyse: "Le client représente 14,2 % du chiffre d’affaires du cabinet, au-dessus du seuil de 10 % retenu. Le poids du dossier tient à la reprise du volet social en 2024.",
    mesure: "Facturation au tarif standard du cabinet, absence de lien capitalistique avec le client, revue annuelle de la relation par un second expert-comptable associé." },
  { id: 'dep-durand', client: 'SCI DURAND', honoraires: 145000,
    analyse: "Le client représente 11,6 % du chiffre d’affaires du cabinet, au-dessus du seuil de 10 % retenu. Groupe de trois SCI suivies par le cabinet, facturées ensemble.",
    mesure: "Diversification du portefeuille clients engagée, plafonnement des missions complémentaires confiées au cabinet, supervision renforcée de la mission." },
  { id: 'dep-projet', client: 'SARL PROJET', honoraires: 105000,
    analyse: 'Non significatif',
    mesure: 'Non significatif' },
];

/* Tous les dossiers dont le poids dans les honoraires est suivi, qu'ils
   dépassent le seuil ou non. L'écran de dépendance économique en a besoin :
   ne montrer que les dossiers au-dessus du seuil donnerait une liste sans
   point de comparaison, et masquerait celui qui s'en approche. */
function dependanceTousDossiers(seuil) {
  const s = Number(seuil !== undefined && seuil !== null && seuil !== '' ? seuil : SEUIL_DEPENDANCE_DEFAUT);
  return Object.keys(DEPENDANCE_PART_HONORAIRES)
    .sort((a, b) => DEPENDANCE_PART_HONORAIRES[b] - DEPENDANCE_PART_HONORAIRES[a])
    .map(id => ({
      dossier: id,
      partHonoraires: DEPENDANCE_PART_HONORAIRES[id].toFixed(1),
      seuil: String(s),
      depasse: DEPENDANCE_PART_HONORAIRES[id] > s,
      mesures: DEPENDANCE_MESURES[id],
    }));
}

/* Les dossiers au-dessus du seuil. Une seule source : les lignes du tableau de
   dépendance, celles-là mêmes que l'écran affiche et laisse modifier. */
function dependanceASurveiller(seuil) {
  const s = Number(seuil !== undefined && seuil !== null && seuil !== '' ? seuil : SEUIL_DEPENDANCE_DEFAUT);
  return dbDependanceLignes()
    .filter(l => l.part > s)
    .map(l => ({
      dossier: l.id,
      client: l.client,
      partHonoraires: l.part.toFixed(1),
      seuil: String(s),
      mesures: l.mesure ? [l.mesure] : [],
    }));
}

const CONFORMITE_CABINET = {
  manuelProcedures: {
    label: 'Manuel de procédures',
    statut: 'À rédiger',
    derniereMaj: null,
    detail: "Le cabinet ne dispose pas encore de manuel de procédures écrit. L'assistant pose les questions chapitre par chapitre et rédige le document à partir de vos réponses.",
  },
  /* Ces trois listes se lisent au moment de l'affichage, pas au chargement du
     fichier. Calculées une fois pour toutes, elles auraient donné l'état du
     cabinet au démarrage de la page : une attestation reçue ou une déclaration
     signée dans la séance n'aurait rien changé à l'écran. */
  diffusionProcedures: {
    label: 'Diffusion des procédures',
    get accusesManquants() { return diffusionAccusesManquants(); },
  },
  formationsLBCFT: {
    label: 'Formations LBC-FT',
    get nonAJour() { return formationsNonAJour(); },
  },
  declarationsIndependance: {
    label: 'Déclarations d’indépendance',
    get manquantes() { return declarationsManquantes(); },
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

/* Recherche d'une société par son SIRET.

   Le bouton « Analyser » affichait la même fiche quel que soit le numéro
   saisi : il ne cherchait rien. Ici le numéro est réellement confronté aux
   dossiers connus — espaces et points ignorés, recherche possible sur les neuf
   chiffres du SIREN seul. Quand rien ne correspond, on le dit au lieu de
   présenter une fiche qui n'a rien à voir.

   En production, cette fonction sera remplacée par un appel à l'API Sirene
   via une fonction serveur ; sa signature ne changera pas. */
function siretNormalise(v) {
  return String(v || '').replace(/[^0-9]/g, '');
}

function rechercherSiret(valeur) {
  const cible = siretNormalise(valeur);
  if (cible.length < 9) {
    return { trouve: false, motif: 'Un SIRET comporte 14 chiffres (ou 9 pour le SIREN).' };
  }
  const candidats = [SCENARIO_NOUVEAU_CLIENT].concat(CLIENTS.map(c => ({
    siret: c.siret,
    societe: c.nom,
    adresse: c.adresse || '',
    formeJuridique: c.forme,
    dirigeant: c.dirigeant,
    dirigeantCivilite: 'M.',
    dirigeantPrenom: String(c.dirigeant || '').split(' ')[0] || '',
    dirigeantNom: String(c.dirigeant || '').split(' ').slice(1).join(' '),
    activite: c.activite,
  })));
  const trouve = candidats.find(c => {
    const s = siretNormalise(c.siret);
    return s === cible || s.slice(0, 9) === cible;
  });
  return trouve
    ? { trouve: true, fiche: trouve }
    : { trouve: false, motif: 'Aucune société ne porte ce numéro dans le jeu de démonstration.' };
}

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

/* Formulation de chaque pièce telle qu'elle se lit dans une phrase suivie :
   la case à cocher dit « 3 derniers FEC », le message au confrère écrit « les
   trois derniers FEC ». Une pièce ajoutée à la main n'a pas de formulation :
   elle est reprise telle quelle, en minuscule initiale. */
const PIECES_REPRISE_PHRASES = {
  '3 derniers FEC': 'les trois derniers FEC',
  '3 dernières liasses fiscales': 'les trois dernières liasses fiscales',
  'Journaux de paie': 'les journaux de paie',
  'Tableau des charges': 'le tableau des charges sociales',
  'Fiche de paramétrage paie': 'la fiche de paramétrage de paie',
  'Contrats de travail': 'les contrats de travail',
  'Avenants aux contrats de travail': 'les éventuels avenants aux contrats de travail',
};

function piecePhrase(libelle) {
  return PIECES_REPRISE_PHRASES[libelle]
    || String(libelle || '').charAt(0).toLowerCase() + String(libelle || '').slice(1);
}

// --- Arborescence Drive ------------------------------------------------------
// Structure utilisée à la fois par l'assistant de contractualisation (étapes 2
// et 6) et par l'onglet "Arborescence Drive" des dossiers existants.

const ANNEE_COURANTE = '2026';

/* Reprendre un dossier, c'est récupérer les exercices antérieurs : les FEC et
   les liasses des trois exercices précédents ont donc leur dossier dès la
   création, sinon ils finissent en vrac à la racine. */
const ANNEES_REPRISE = [0, 1, 2, 3].map(n => String(Number(ANNEE_COURANTE) - n));

const DRIVE_TREE = [
  /* Le dossier permanent réunit les pièces qui ne changent pas d'un exercice à
     l'autre — les statuts y compris, qui étaient classés à tort au juridique.
     L'ancien « dossier annuel » n'existe plus : son contenu est permanent. */
  { name: '00_Dossier permanent', children: [
    'Statuts à jour', 'Lettre de mission', 'KBIS', 'CNI',
    'Attestation PPE', 'RBE', 'Carte grise', "Tableau d'emprunt",
  ], ajoutable: true },
  { name: '01_Comptable', children: ANNEES_REPRISE.map(a => ({ name: a, children: ['FEC', 'Liasse fiscale', 'Contrôle TVA'] })), ajoutParAnnee: true },
  { name: '02_Juridique', children: ANNEES_REPRISE.slice(0, 2).map(a => ({ name: a, children: ['AGO', 'Évaluation parts sociales', 'Acquisition de titres'] })), ajoutParAnnee: true },
  { name: '03_Social', children: ['Prévoyance', 'Mutuelle', 'Contrats', 'Avenants', 'DPAE', 'Sorties salariés'], ajoutable: true },
];

/* Les documents juridiques que le cabinet dépose lui-même à l'ouverture.

   Il n'y a pas d'interrogation automatique ici. Le registre des bénéficiaires
   effectifs est fermé depuis le 31 juillet 2024 à qui n'est ni autorité de
   contrôle ni personne assujettie, et l'accès d'un expert-comptable suppose
   une demande préalable auprès de l'INPI, avec son compte professionnel : rien
   de tout cela ne se fait par un appel de programme depuis un navigateur.

   Deux catégories, parce que les deux ne se classent pas au même endroit :

     — les statuts ne changent pas d'un exercice à l'autre, ils vont au dossier
       permanent. C'est le choix de classement retenu par le cabinet, qui les
       avait auparavant au juridique ;
     — les autres pièces juridiques — procès-verbaux d'assemblée, cessions de
       parts, évaluations de titres — sont datées, elles vont au juridique, dans
       le dossier de leur exercice. */
const DOCUMENTS_JURIDIQUES_CATEGORIES = [
  {
    code: 'statuts-constitutifs',
    label: 'Statuts constitutifs',
    aide: 'Statuts d’origine, tels que déposés à la constitution.',
    racine: '00_Dossier permanent',
    sousDossier: 'Statuts à jour',
    parAnnee: false,
    // Mots par lesquels l'INPI nomme ce type d'acte.
    motifs: [/statuts?\s*constitutifs?/i, /statuts?\s*d.origine/i],
  },
  {
    code: 'statuts-jour',
    label: 'Statuts mis à jour',
    aide: 'Dernière version consolidée des statuts.',
    racine: '00_Dossier permanent',
    sousDossier: 'Statuts à jour',
    parAnnee: false,
    motifs: [/statuts?\s*(mis\s*)?à\s*jour/i, /statuts?\s*consolid/i, /^statuts?\b/i],
  },
  {
    code: 'pv-ag',
    label: 'Procès-verbaux d’assemblées générales',
    aide: 'Assemblées générales ordinaires et extraordinaires.',
    racine: '02_Juridique',
    sousDossier: null,
    parAnnee: true,
    motifs: [/proc[eè]s[-\s]?verbal/i, /\bpv\b/i, /assembl[eé]e/i, /\bag[oe]?\b/i],
  },
  {
    code: 'capital',
    label: 'Actes de modification du capital social',
    aide: 'Augmentations, réductions, apports.',
    racine: '02_Juridique',
    sousDossier: null,
    parAnnee: true,
    motifs: [/capital/i, /augmentation/i, /r[eé]duction/i, /apport/i],
  },
  {
    code: 'statutaire',
    label: 'Actes relatifs aux modifications statutaires',
    aide: 'Changement de dirigeant, d’objet, de siège, de dénomination.',
    racine: '02_Juridique',
    sousDossier: null,
    parAnnee: true,
    motifs: [/modification/i, /transfert\s*de\s*si[eè]ge/i, /d[eé]nomination/i, /g[eé]rant/i, /pr[eé]sident/i, /objet\s*social/i],
  },
];

/* Reconnaître un acte à son nom de fichier.

   L'INPI nomme ses actes de façon lisible ; le nom suffit dans la grande
   majorité des cas. La catégorie proposée reste modifiable : ComplyEC propose
   un classement, il ne le décrète pas, et un acte mal rangé au dossier
   permanent est un acte qu'on ne retrouvera pas.

   L'année, elle, se lit dans le nom quand il la porte ; sinon elle reste celle
   choisie à l'écran. */
function devinerCategorieJuridique(nomFichier) {
  const nom = String(nomFichier || '');
  for (const c of DOCUMENTS_JURIDIQUES_CATEGORIES) {
    if ((c.motifs || []).some(m => m.test(nom))) return c.code;
  }
  return null;
}

function devinerAnneeJuridique(nomFichier) {
  const m = String(nomFichier || '').match(/(19|20)\d{2}/);
  if (!m) return null;
  const annee = Number(m[0]);
  const courante = Number(ANNEE_COURANTE);
  return annee >= 1990 && annee <= courante ? String(annee) : null;
}

/* Où ira le fichier, une fois le connecteur Drive paramétré. La phrase est
   écrite avant le dépôt : on doit pouvoir la lire et la contester. */
function destinationJuridique(categorieCode, annee) {
  const c = DOCUMENTS_JURIDIQUES_CATEGORIES.find(x => x.code === categorieCode);
  if (!c) return '';
  if (c.parAnnee) return `${c.racine} / ${annee || ANNEE_COURANTE}`;
  return c.sousDossier ? `${c.racine} / ${c.sousDossier}` : c.racine;
}

const DOCUMENTS_A_DEMANDER_CLIENT = [
  "Pièce d'identité", 'Attestation PPE', 'KBIS',
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
  const analyses = dbVigilanceDossiers().filter(d => d.statut === 'complete');
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
  const dossiers = dbVigilanceDossiers();
  const analyses = dossiers.filter(d => d.statut === 'complete');
  const nonAnalyses = dossiers.filter(d => d.statut === 'a_lancer');
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
    { code: 'activite', label: 'Activité principale de l’entreprise', type: 'texte', placeholder: 'Marchand de biens immobiliers' },
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

// Tarif du cabinet par bulletin de paie, en euros hors taxes.
const LDM_MONTANT_BULLETIN_DEFAUT = 35;

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

/* Ce que le collaborateur a écrit dans sa note, dossier par dossier.

   La note de synthèse annuelle suit le modèle du cabinet, retrouvé dans la
   première version de l'outil : quatre constats, et le commentaire du
   collaborateur qui les accompagne.

     — la rentabilité du dossier, cotée puis expliquée ;
     — les problèmes comptables suivis, comptés puis détaillés ;
     — la continuité d'exploitation ;
     — les sujets à évoquer au rendez-vous bilan.

   Superviser, c'est lire tout cela, puis écrire deux choses que seul
   l'expert-comptable peut écrire : son retour sur le plan comptable, et ce
   qui est prévu pour l'assemblée générale ordinaire. */
const NOTES_SYNTHESE_DEMO = {
  'sas-nova': {
    redigeePar: 'nathalie',
    redigeeLe: '2026-01-09',
    exercice: 2025,
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    detailRentabilite: 'Honoraires de 7 800 € HT pour 34 heures passées. Le budget est tenu malgré deux situations intermédiaires non prévues au départ.',
    detailProblemes: 'Des frais de réception de 4 300 € ne sont appuyés que par des tickets, sans mention des personnes invitées. La déductibilité n’est pas démontrable en l’état.',
    detailContinuite: 'Chiffre d’affaires en hausse de 12 %, trésorerie positive toute l’année.',
    sujets: 'Justification des frais de réception, et renouvellement du mandat de la dirigeante, qui est également conseillère municipale.',
    commentaireCollab: 'Dossier sain et rentable. Le seul point ouvert est la justification des frais de réception, que j’ai demandée au client à deux reprises sans retour à ce jour.',
  },
  'sas-vision': {
    redigeePar: 'heddy',
    redigeeLe: '2026-01-28',
    exercice: 2025,
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    detailRentabilite: 'Honoraires de 6 200 € HT pour 28 heures. Dossier bien tenu, temps conforme au budget.',
    detailProblemes: 'Crédit d’impôt recherche calculé par le client sans relevé du temps passé par ingénieur. Le point doit être documenté avant le dépôt de la liasse.',
    detailContinuite: 'Les capitaux propres couvrent largement le capital social.',
    sujets: 'Justification du crédit d’impôt recherche, et affectation du résultat.',
    commentaireCollab: 'Exercice sans difficulté. Le crédit d’impôt recherche est le seul sujet technique : je n’ai pas les éléments pour le valider seul.',
  },
  'sci-martin': {
    redigeePar: 'julie',
    redigeeLe: '2026-03-04',
    exercice: 2025,
    rentabilite: { statut: 'neutre', label: 'À surveiller' },
    problemes: { count: 2, label: '2 points signalés' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    detailRentabilite: 'Honoraires annuels de 2 400 € HT pour environ 14 heures passées. Le temps de saisie augmente avec le nombre de baux.',
    detailProblemes: 'Deux appels de charges de copropriété ne sont pas justifiés par un décompte. Le compte courant d’associé augmente de 18 000 € sans convention écrite.',
    detailContinuite: 'Les loyers couvrent l’échéance d’emprunt et la trésorerie reste positive.',
    sujets: 'Régularisation du compte courant, et passage éventuel à la TVA sur les locaux professionnels.',
    commentaireCollab: 'Dossier simple mais chronophage. La convention de compte courant manque depuis deux exercices.',
  },
  'sarl-beta': {
    redigeePar: 'julie',
    redigeeLe: '2026-03-11',
    exercice: 2025,
    rentabilite: { statut: 'negatif', label: 'Non rentable' },
    problemes: { count: 3, label: '3 points signalés' },
    continuite: { statut: 'attention', label: 'Capitaux propres à reconstituer' },
    detailRentabilite: 'Honoraires de 4 800 € HT pour 31 heures. La reprise de l’antériorité a coûté six heures non prévues.',
    detailProblemes: 'Écart d’inventaire de 7 200 € non expliqué à la clôture. Trois factures fournisseurs manquantes sur décembre.',
    detailContinuite: 'Capitaux propres inférieurs à la moitié du capital social : la consultation des associés prévue à l’article L. 223-42 du code de commerce doit être évoquée.',
    sujets: 'Écart d’inventaire, capitaux propres, et renégociation des honoraires pour l’exercice suivant.',
    commentaireCollab: 'Exercice difficile. Les capitaux propres appellent une décision des associés dans les quatre mois de l’approbation des comptes.',
  },
};

/* Les trois constats se lisent comme trois voyants, avec leur couleur. */
const NOTE_SYNTHESE_CONSTATS = [
  { code: 'rentabilite', label: 'Rentabilité du dossier', detail: 'detailRentabilite' },
  { code: 'problemes', label: 'Problèmes comptables suivis', detail: 'detailProblemes' },
  { code: 'continuite', label: 'Continuité d’exploitation', detail: 'detailContinuite' },
];

const NOTE_SYNTHESE_TONS = {
  positif: 'vert', ok: 'vert',
  neutre: 'orange', attention: 'orange',
  negatif: 'rouge', risque: 'rouge',
};

function tonConstat(constat) {
  if (!constat) return 'gris';
  if (constat.statut) return NOTE_SYNTHESE_TONS[constat.statut] || 'gris';
  if (typeof constat.count === 'number') return constat.count ? 'orange' : 'vert';
  return 'gris';
}

function noteSyntheseDuDossier(dossierId) {
  return NOTES_SYNTHESE_DEMO[dossierId] || null;
}

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

/* Où chaque chapitre attendu par le dossier de contrôle se trouve dans le
   manuel réellement produit. Sans cette table, le dossier lisait un second
   plan de manuel, figé dans les semences : publier le manuel ne changeait
   rien à ce que le dossier de contrôle annonçait, et le cabinet voyait deux
   vérités sur le même document. */
const CQ_CHAPITRE_VERS_PARTIE = {
  gouvernance: 'gouvernance',
  deontologie: 'gouvernance',
  lbcft: 'lbcft',
  'entree-mission': 'cycle',
  'controle-qualite': 'qualite',
  formation: 'ressources',
  archivage: 'ressources',
  'secret-pro': 'ressources',
  'revue-independante': 'qualite',
  'surveillance-smq': 'qualite',
};

function cqChapitreManuel(id) {
  const c = PROCEDURES_MANUEL_CHAPITRES.find(x => x.id === id);
  const titre = c ? c.titre : id;
  const partie = MANUEL_PARTIES.find(p => p.code === CQ_CHAPITRE_VERS_PARTIE[id]);
  if (!partie) return { etat: 'absent', detail: `Chapitre « ${titre} » absent du plan du manuel.` };

  const etat = etatPartieManuel(partie);
  const version = manuelVersionEnVigueur();

  /* Trois états, et ils se déduisent des faits :
       — la partie manque une information : le chapitre ne peut pas exister ;
       — elle est complète mais aucune version n'est publiée : il existe en
         projet, ce qu'un contrôleur ne peut pas consulter ;
       — elle est complète et le manuel est publié : le chapitre est
         opposable, et on dit depuis quand. */
  if (etat.bloque) {
    return {
      etat: 'absent',
      detail: `Chapitre « ${titre} » : ${etat.manquantes.length} ${pluriel(etat.manquantes.length, 'information manquante', 'informations manquantes')} dans la partie « ${partie.titre} ».`,
    };
  }
  if (!version) {
    return {
      etat: 'partiel',
      detail: `Chapitre « ${titre} » rédigé, mais aucune version du manuel n’est publiée.`,
    };
  }
  return {
    etat: 'ok',
    detail: `Chapitre « ${titre} », manuel ${version.numero} en vigueur depuis le ${formatDate(version.dateEffet)}.`,
  };
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
      titre: 'Connaître les risques de votre cabinet',
      titreNorme: 'Processus d’évaluation des risques de la structure',
      ton: 'violet',
      resume: "Identifier ce qui peut faire rater une mission, et le formaliser.",
      preuves: [
        Object.assign({ libelle: 'Cartographie des risques du cabinet', source: 'NPMQ', faire: 'Terminer la cartographie des risques', ou: ['vigilance', 'cartographie'] },
          carto.total > 0
            ? { etat: carto.nonAnalyses.length ? 'partiel' : 'ok',
                detail: `${carto.total} ${pluriel(carto.total, 'dossier')} ${pluriel(carto.total, 'analysé')} sur ${carto.total + carto.nonAnalyses.length}${carto.nonAnalyses.length ? ` — ${carto.nonAnalyses.length} ${pluriel(carto.nonAnalyses.length, 'reste', 'restent')} à analyser.` : '.'}` }
            : { etat: 'absent', detail: 'Aucune analyse de risque enregistrée.' }),
        Object.assign({ libelle: 'Classification des risques LBC-FT du cabinet', source: 'CMF art. L. 561-4-1', faire: 'Réviser la classification des risques', ou: ['vigilance', 'cartographie'] },
          { etat: 'partiel', detail: `Dernière révision : ${formatDate(CONFORMITE_CABINET.classificationRisquesLBCFT.derniereRevision)}. ${CONFORMITE_CABINET.classificationRisquesLBCFT.statut}.` }),
        { libelle: 'Objectifs qualité chiffrés et suivis dans le temps', source: 'NPMQ', etat: 'externe',
          detail: "ComplyEC ne fixe pas d'objectifs qualité : à formaliser par la direction du cabinet." },
      ],
    },
    {
      id: 'gouvernance',
      icone: '🏛️',
      titre: 'Écrire qui pilote la qualité',
      titreNorme: 'Gouvernance et leadership',
      ton: 'bleu',
      resume: "Montrer que la direction porte le système qualité, par écrit.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Gouvernance et organisation du cabinet » du manuel', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('gouvernance')),
        { libelle: 'Désignation du responsable du système de management de la qualité', source: 'NPMQ', etat: 'externe',
          detail: "La nomination se matérialise par une décision écrite du cabinet, à conserver dans le dossier de contrôle." },
        { libelle: 'Déclarant et correspondant Tracfin désignés et communiqués', source: 'CMF art. R. 561-23',
          faire: 'Renseigner et déclarer ces deux rôles', ou: ['parametres', null],
          etat: (settings && settings.declarantTracfin && settings.correspondantTracfin)
            ? (settings.tracfinDeclareAuService ? 'ok' : 'partiel')
            : 'absent',
          detail: (settings && settings.declarantTracfin && settings.correspondantTracfin)
            ? `Déclarant : ${settings.declarantTracfin}. Correspondant : ${settings.correspondantTracfin}.` +
              (settings.tracfinDeclareAuService
                ? ' Désignations communiquées à Tracfin et au Conseil de l’Ordre.'
                : ' Reste à communiquer ces identités à Tracfin et au Conseil de l’Ordre, comme l’impose l’article R. 561-23.')
            : 'Aucun déclarant ni correspondant renseigné dans les paramètres du cabinet.' },
        // Le chapitre « Surveillance du système qualité » est porté par la
        // composante Surveillance, plus bas : le compter ici aussi le faisait
        // apparaître deux fois dans le total des pièces.
        { libelle: 'Politique qualité écrite et portée par la direction', source: 'NPMQ', etat: 'externe',
          detail: "La décision qui arrête la politique qualité du cabinet et désigne son responsable se prend en réunion de direction : joindre le compte rendu au dossier." },
      ],
    },
    {
      id: 'ethique',
      icone: '⚖️',
      titre: 'Prouver votre indépendance',
      titreNorme: 'Règles d’éthique applicables, dont l’indépendance',
      ton: 'orange',
      resume: "Prouver que chacun s’est engagé et que les cas de dépendance sont traités.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Déontologie et indépendance » du manuel', source: 'Décret 2012-432, art. 141 à 169', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('deontologie')),
        // L'article 146 impose l'indépendance ; il n'impose pas la déclaration
        // annuelle signée. C'est le moyen de preuve retenu par le cabinet, et
        // l'intitulé ne doit pas laisser croire à une obligation de forme.
        { libelle: `Déclarations d’indépendance signées (exercice ${currentCalendarYear()})`, source: 'Preuve d’indépendance — décret 2012-432, art. 146',
          faire: 'Relancer les collaborateurs qui n’ont pas signé', ou: ['gouvernance', 'independance'],
          etat: declManquantes.length === 0 ? 'ok' : (declManquantes.length < nbCollab ? 'partiel' : 'absent'),
          detail: declManquantes.length === 0
            ? `Les ${nbCollab} collaborateurs ont signé.`
            : `${nbCollab - declManquantes.length} ${pluriel(nbCollab - declManquantes.length, 'signature')} sur ${nbCollab} — ${pluriel(declManquantes.length, 'manque', 'manquent')} : ${declManquantes.map(d => collaborateur(d.collaborateur).nom).join(', ')}.` },
        { libelle: 'Notes de dépendance économique pour les clients au-dessus du seuil', source: 'Décret 2012-432, art. 146',
          faire: 'Générer et classer les notes de dépendance', ou: ['gouvernance', 'dependance'],
          etat: dependances.length === 0 ? 'ok' : 'partiel',
          detail: dependances.length === 0
            ? `Aucun client ne dépasse le seuil de ${pourcent(seuilDependance)} fixé par le cabinet.`
            : `${dependances.length} ${pluriel(dependances.length, 'dossier')} au-dessus du seuil de ${pourcent(seuilDependance)} : la note est générée à la demande, pensez à la classer signée.` },
      ],
    },
    {
      id: 'acceptation',
      icone: '🤝',
      titre: 'Tenir vos lettres de mission et vos fiches LBC-FT à jour',
      titreNorme: 'Acceptation et maintien des relations clients et des missions',
      ton: 'vert',
      resume: "Une lettre de mission à jour et une vigilance LBC-FT documentée, pour chaque dossier.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Entrée en relation et lettres de mission » du manuel', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('entree-mission')),
        { libelle: 'Lettres de mission signées et actualisées', source: 'Décret 2012-432, art. 151',
          faire: 'Refaire les lettres absentes ou trop anciennes', ou: ['anomalies', 'lettres'],
          etat: ldmNonAJour === 0 ? 'ok' : (ldm.aJour.length ? 'partiel' : 'absent'),
          detail: `${ldm.aJour.length} à jour sur ${ldm.lignes.length}` +
            (ldm.absentes.length ? ` — ${ldm.absentes.length} ${pluriel(ldm.absentes.length, 'absente')}` : '') +
            (ldm.critiques.length ? `, ${ldm.critiques.length} non ${pluriel(ldm.critiques.length, 'actualisée')} depuis plus de deux ans` : '') +
            (ldm.aReviser.length ? `, ${ldm.aReviser.length} à réviser` : '') + '.' },
        { libelle: 'Fiche de vigilance LBC-FT par dossier', source: 'CMF art. L. 561-5 et L. 561-5-1',
          faire: 'Analyser les dossiers qui n’ont pas de fiche', ou: ['vigilance', 'portefeuille'],
          etat: carto.nonAnalyses.length === 0 ? 'ok' : (carto.total ? 'partiel' : 'absent'),
          detail: `${carto.total} ${pluriel(carto.total, 'fiche')} sur ${carto.total + carto.nonAnalyses.length}` +
            (carto.nonAnalyses.length ? ` — restent à faire : ${carto.nonAnalyses.map(d => client(d.dossier).nom).join(', ')}.` : '.') },
        { libelle: 'Bénéficiaires effectifs identifiés et identité vérifiée', source: 'CMF art. L. 561-2-2 et L. 561-5',
          faire: 'Compléter les bénéficiaires effectifs manquants', ou: ['vigilance', 'portefeuille'],
          etat: connaissance.total === 0 ? 'absent' : (connaissance.beneficiairesOk === connaissance.total ? 'ok' : 'partiel'),
          detail: `${connaissance.beneficiairesOk} ${pluriel(connaissance.beneficiairesOk, 'dossier')} sur ${connaissance.total} avec un bénéficiaire effectif identifié et vérifié.` },
        { libelle: 'Origine du patrimoine et des fonds établie', source: 'CMF art. R. 561-20-2',
          faire: 'Documenter l’origine des fonds', ou: ['vigilance', 'portefeuille'],
          etat: connaissance.total === 0 ? 'absent' : (connaissance.origineAFaire.length === 0 ? 'ok' : 'partiel'),
          detail: connaissance.origineAFaire.length === 0
            ? `Documentée sur les ${connaissance.total} dossiers analysés.`
            : `Reste à établir sur ${connaissance.origineAFaire.length} ${pluriel(connaissance.origineAFaire.length, 'dossier')} : ${connaissance.origineAFaire.map(l => client(l.dossier).nom).join(', ')}.` },
        { libelle: 'Statut de personne politiquement exposée tranché', source: 'CMF art. R. 561-18',
          faire: 'Trancher les statuts PPE en attente', ou: ['vigilance', 'portefeuille'],
          etat: connaissance.total === 0 ? 'absent' : (connaissance.ppeAVerifier.length === 0 ? 'ok' : 'partiel'),
          detail: connaissance.ppeAVerifier.length === 0
            ? `Statut tranché sur les ${connaissance.total} dossiers analysés (dont ${connaissance.ppeAverees.length} ${pluriel(connaissance.ppeAverees.length, 'PPE avérée', 'PPE avérées')}).`
            : `Encore à vérifier sur ${connaissance.ppeAVerifier.length} ${pluriel(connaissance.ppeAVerifier.length, 'dossier')} : ${connaissance.ppeAVerifier.map(l => client(l.dossier).nom).join(', ')}.` },
        Object.assign({ libelle: 'Chapitre « Vigilance et lutte contre le blanchiment » du manuel', source: 'CMF art. L. 561-32', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('lbcft')),
      ],
    },
    {
      id: 'ressources',
      icone: '🎓',
      titre: 'Former vos collaborateurs et le prouver',
      titreNorme: 'Ressources humaines, technologiques et intellectuelles',
      ton: 'violet',
      resume: "Des collaborateurs formés, et la trace de leurs formations.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Formation continue des collaborateurs » du manuel', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('formation')),
        { libelle: 'Attestations de formation LBC-FT de l’année en cours', source: 'CMF art. L. 561-33',
          faire: 'Réclamer les attestations manquantes', ou: ['ressources', 'formation'],
          etat: formationsKO.length === 0 ? 'ok' : (formationsKO.length < nbCollab ? 'partiel' : 'absent'),
          detail: formationsKO.length === 0
            ? 'Tous les collaborateurs sont à jour sur la dernière session passée.'
            : `Attestation non reçue pour : ${formationsKO.map(f => collaborateur(f.collaborateur).nom).join(', ')}.` },
        { libelle: 'Formation LBC-FT dispensée dès l’embauche', source: FORMATION_ARTICLE,
          faire: 'Programmer la formation d’accueil manquante', ou: ['ressources', 'formation'],
          etat: registre.accueilManquant.length === 0 ? (registre.accueilTardif.length ? 'partiel' : 'ok') : 'absent',
          detail: registre.accueilManquant.length === 0
            ? (registre.accueilTardif.length
                ? `Tous les arrivants ont été formés, mais ${registre.accueilTardif.length} au-delà du délai que le cabinet s'est fixé.`
                : 'Chaque arrivant a reçu sa formation d’accueil dans les délais du cabinet.')
            : `Jamais suivie par : ${registre.accueilManquant.map(l => l.nom).join(', ')}.` },
        { libelle: 'Registre des justificatifs de formation, conservés 5 ans après le départ', source: FORMATION_ARTICLE,
          faire: 'Éditer le registre de formation',
          ou: ['ressources', 'formation'],
          etat: 'partiel',
          detail: `Le registre est produit en Word depuis l'écran Formations LBC-FT. ${registre.conservationEnCours.length === 0 ? 'Aucune pièce de personne partie n’est encore sous obligation de conservation.' : `${registre.conservationEnCours.length} ${pluriel(registre.conservationEnCours.length, 'personne partie', 'personnes parties')} dont les pièces ne doivent pas être détruites : ${registre.conservationEnCours.map(l => `${l.nom} (jusqu'au ${formatDate(l.conserverJusquA)})`).join(', ')}.`}` },
        { libelle: 'Suivi de la formation continue des professionnels inscrits', source: 'Obligation de formation continue de l’Ordre', etat: 'externe',
          detail: "Le décompte des heures est tenu hors ComplyEC : joindre l'état de formation délivré par le Conseil régional." },
      ],
    },
    {
      id: 'realisation',
      icone: '📋',
      titre: 'Montrer que vous supervisez les dossiers',
      titreNorme: 'Réalisation des missions',
      ton: 'bleu',
      resume: "La supervision doit se voir dans les dossiers, pas seulement dans les têtes.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Contrôle qualité des missions » du manuel', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('controle-qualite')),
        { libelle: 'Trace de la supervision des dossiers de bilan', source: 'NP 2300',
          faire: 'Passer en revue la supervision des bilans', ou: ['cycle-client', 'supervision'],
          etat: BILAN_DOSSIERS.length ? 'partiel' : 'absent',
          detail: `${BILAN_DOSSIERS.length} ${pluriel(BILAN_DOSSIERS.length, 'dossier')} ${pluriel(BILAN_DOSSIERS.length, 'suivi')} dans la supervision bilan. Les revues sont visibles à l'écran mais ne sont pas encore archivées en pièce datée et signée.` },
        Object.assign({ libelle: 'Chapitre « Revue indépendante des missions à risque »', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('revue-independante')),
        Object.assign({ libelle: 'Chapitre « Archivage et conservation des dossiers » du manuel', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('archivage')),
      ],
    },
    {
      id: 'information',
      icone: '📢',
      titre: 'Diffuser vos procédures et le faire signer',
      titreNorme: 'Information et communication',
      ton: 'orange',
      resume: "Les procédures doivent être diffusées, et la diffusion prouvée.",
      preuves: [
        { libelle: 'Accusés de lecture de la dernière version des procédures', source: 'NPMQ',
          faire: 'Relancer les accusés de lecture manquants', ou: ['manuel', null],
          etat: accusesKO.length === 0 ? 'ok' : (accusesKO.length < nbCollab ? 'partiel' : 'absent'),
          detail: accusesKO.length === 0
            ? `Version ${PROCEDURES_VERSIONS[0].version} signée par les ${nbCollab} collaborateurs.`
            : `Version ${PROCEDURES_VERSIONS[0].version} : ${accusesKO.length} ${pluriel(accusesKO.length, 'accusé')} ${pluriel(accusesKO.length, 'manquant')} — ${accusesKO.map(a => collaborateur(a.collaborateur).nom).join(', ')}.` },
        Object.assign({ libelle: 'Chapitre « Secret professionnel et protection des données »', source: 'Code de déontologie (décret 2012-432)', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('secret-pro')),
        { libelle: 'Communication au client des conditions de la mission', source: 'Décret 2012-432, art. 151',
          faire: 'Remettre une lettre de mission aux dossiers qui n’en ont pas', ou: ['anomalies', 'lettres'],
          etat: ldm.absentes.length === 0 ? 'ok' : 'partiel',
          detail: ldm.absentes.length === 0
            ? 'Chaque dossier dispose d’une lettre de mission remise au client.'
            : `${ldm.absentes.length} ${pluriel(ldm.absentes.length, 'dossier')} sans lettre de mission remise.` },
      ],
    },
    {
      id: 'surveillance',
      icone: '🔁',
      titre: 'Contrôler votre propre organisation',
      titreNorme: 'Processus de surveillance et de correction',
      ton: 'gris',
      resume: "Contrôler son propre système, et corriger ce qui ne va pas.",
      preuves: [
        Object.assign({ libelle: 'Chapitre « Surveillance du système qualité et actions correctives »', source: 'NPMQ', faire: 'Rédiger votre manuel de procédures', ou: ['manuel', null] }, cqChapitreManuel('surveillance-smq')),
        { libelle: 'Relevé des anomalies détectées et de leur traitement', source: 'NPMQ',
          faire: 'Traiter les demandes de régularisation sans suite', ou: ['anomalies', 'relances'],
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

  /* La liste des choses à faire, dans l'ordre où les faire.

     C'est cette liste qu'un expert-comptable veut voir en arrivant : une
     phrase à l'impératif, ce qui manque exactement, et le bouton qui l'emmène
     à l'écran où le régler. Les preuves manquantes passent devant les preuves
     incomplètes ; à état égal, on garde l'ordre des composantes, qui va du
     cadre général au détail. */
  const brut = [];
  composantes.forEach(c => c.preuves.forEach(pr => {
    if (pr.etat !== 'absent' && pr.etat !== 'partiel') return;
    brut.push({
      faire: pr.faire || pr.libelle,
      libelle: pr.libelle,
      detail: pr.detail,
      etat: pr.etat,
      source: pr.source,
      ou: pr.ou || null,
      composante: c.titre,
      icone: c.icone,
    });
  }));

  /* Dix lignes intitulées « Rédiger ce chapitre du manuel » à la suite, ce
     n'est pas une liste de travail : c'est une seule tâche, écrire le manuel.
     Les tâches qui portent le même intitulé et mènent au même écran sont donc
     réunies, avec le décompte et le détail de chacune. */
  const parCle = new Map();
  brut.forEach(t => {
    const cle = t.faire + '|' + (t.ou ? t.ou.join('/') : '');
    const g = parCle.get(cle);
    if (!g) { parCle.set(cle, Object.assign({}, t, { nb: 1, details: [t.detail] })); return; }
    g.nb += 1;
    g.details.push(t.detail);
    // Un groupe est « absent » dès qu'une de ses lignes l'est.
    if (t.etat === 'absent') g.etat = 'absent';
  });

  const aFaire = [...parCle.values()].map(g => {
    if (g.nb === 1) return g;
    return Object.assign({}, g, {
      // Le détail devient le décompte, la liste précise reste consultable.
      detail: `${g.nb} ${pluriel(g.nb, 'point')} ${pluriel(g.nb, 'concerné')}. Le premier : ${g.details[0]}`,
    });
  });
  aFaire.sort((x, y) => (x.etat === y.etat ? y.nb - x.nb : x.etat === 'absent' ? -1 : 1));

  return {
    composantes,
    aFaire,
    total: toutes.length,
    ok: toutes.filter(p => p.etat === 'ok').length,
    aTraiter: toutes.filter(p => p.etat === 'absent' || p.etat === 'partiel').length,
    externe: toutes.filter(p => p.etat === 'externe').length,
  };
}

/* ------------------------------- Vérifications LBC-FT sur les personnes

   Avant de coter un risque, on regarde qui est derrière le client. Les points
   ci-dessous sont ceux qu'un contrôleur s'attend à voir tracés dans le dossier.

   Une seule de ces bases est consultable en ligne par le cabinet sans
   convention préalable : le registre des bénéficiaires effectifs, dont l'accès
   a été restreint puis rouvert aux personnes justifiant d'un intérêt légitime.
   Les autres se consultent sur les sites publics indiqués. Aucune n'est
   interrogée automatiquement par ComplyEC aujourd'hui : la case est cochée par
   la personne qui a fait la vérification, et c'est cette trace qui compte. */

/* Bénéficiaires effectifs récupérables auprès du registre tenu par l'INPI.

   La donnée existe et se récupère : c'est la même interrogation que celle qui
   remplit la fiche légale. Ce que renvoie ici la démonstration est fictif,
   comme le client SARL Dupont Immobilier ; le branchement réel se fera par la
   même fonction serveur que le reste des appels aux registres. */
const RBE_REPONSE_DEMO = [
  { nom: 'Jean Dupont', part: 60, piece: 'Registre des bénéficiaires effectifs — extrait du 12/03/2026', verifie: true },
  { nom: 'Hélène Dupont', part: 40, piece: 'Registre des bénéficiaires effectifs — extrait du 12/03/2026', verifie: true },
];

/* Résultat que renvoie chaque vérification en base.

   Rien n'est interrogé pour de bon : le client de démonstration est fictif, il
   n'existe dans aucun registre. Ces réponses montrent la forme qu'aura le
   résultat une fois les interrogations branchées, et l'écran le dit. */
/* Chaque résultat porte un verdict court — ce que l'œil doit saisir en
   premier — et le détail qui le justifie.

   Le statut PPE portait un « ! » alors que son texte constate qu'aucune
   fonction n'a été relevée : une vérification qui ne trouve rien est un
   résultat favorable. La réserve (« à reconfirmer si la gouvernance change »)
   est une note, pas une alerte. */
const VIGILANCE_RESULTATS_DEMO = {
  rbe: { issue: 'ok', verdict: '2 bénéficiaires confirmés', texte: 'Deux bénéficiaires effectifs déclarés, conformes aux statuts : Jean Dupont (60 %) et Hélène Dupont (40 %).' },
  gel: { issue: 'ok', verdict: 'Aucune correspondance', texte: 'Ni la société, ni ses bénéficiaires effectifs, ni ses dirigeants ne figurent au registre national des gels d’avoirs.' },
  sanctions: { issue: 'ok', verdict: 'Aucune correspondance', texte: 'Aucune correspondance avec les listes de sanctions de l’Union européenne et des Nations unies.' },
  ppe: { issue: 'ok', verdict: 'Aucune fonction PPE', texte: 'Aucune fonction de l’article R. 561-18 relevée pour les bénéficiaires effectifs. À reconfirmer si la gouvernance change.' },
  presse: { issue: 'ok', verdict: 'Rien de défavorable', texte: 'Aucun article ni décision défavorable trouvé au nom de la société ou de ses dirigeants.' },
};

/* Les cinq vérifications, et où elles se font réellement.

   Aucune n'est automatisable depuis le navigateur. Le registre national des
   gels publie bien une interface de programmation, mais une page servie depuis
   un fichier local ne peut pas l'interroger : le navigateur refuse l'appel
   d'origine croisée, et il faudrait une fonction serveur pour le relayer. Le
   registre des bénéficiaires effectifs, lui, est fermé depuis le 31 juillet
   2024 à tout autre que les autorités de contrôle et les personnes assujetties
   — un expert-comptable y accède, mais après demande d'accès, avec son compte
   professionnel, jamais par un appel anonyme.

   ComplyEC fait donc ce qu'il peut faire honnêtement : il ouvre la bonne page
   officielle, et il enregistre ce que l'expert-comptable y a constaté.

   Les adresses ci-dessous ont été relevées sur les domaines officiels. Elles
   n'ont pas pu être ouvertes depuis l'environnement de développement, dont la
   sortie réseau est filtrée : à vérifier au premier clic. */
const VIGILANCE_BASES = [
  {
    code: 'rbe',
    label: 'Registre des bénéficiaires effectifs',
    detail: 'Confronter les bénéficiaires déclarés au registre tenu par l’INPI, et relever tout écart avec les statuts.',
    source: 'CMF art. L. 561-2-2 et L. 561-5',
    ou: 'Consultation avec votre compte professionnel, via Comptexpert',
    lien: 'https://www.experts-comptables.fr/comptexpert',
    lienLabel: 'Ouvrir Comptexpert',
    // Depuis le 31 juillet 2024, l'accès aux données des bénéficiaires
    // effectifs suppose une demande préalable auprès de l'INPI au titre de la
    // qualité d'assujetti (CMF art. L. 561-2).
    lienSecondaire: 'https://data.inpi.fr/content/editorial/acces_BE',
    lienSecondaireLabel: 'Demander l’accès à l’INPI',
  },
  {
    code: 'gel',
    label: 'Registre national des gels d’avoirs',
    detail: 'Vérifier que ni le client, ni ses bénéficiaires effectifs, ni ses dirigeants ne figurent sur la liste des personnes et entités faisant l’objet d’une mesure de gel.',
    source: 'CMF art. L. 562-4',
    ou: 'Registre tenu par la direction générale du Trésor, consultable librement',
    lien: 'https://gels-avoirs.dgtresor.gouv.fr/List',
    lienLabel: 'Ouvrir le registre des gels',
  },
  {
    code: 'sanctions',
    label: 'Sanctions financières internationales',
    detail: 'Contrôler les listes de sanctions de l’Union européenne et des Nations unies, notamment si le client a des flux hors Union européenne.',
    source: 'Règlements de l’Union européenne',
    ou: 'Carte des sanctions de l’Union européenne',
    lien: 'https://www.sanctionsmap.eu/',
    lienLabel: 'Ouvrir la carte des sanctions',
  },
  {
    code: 'ppe',
    label: 'Statut de personne politiquement exposée',
    detail: 'Confronter les fonctions exercées par le client, ses bénéficiaires effectifs et leurs proches à la liste des fonctions de l’article R. 561-18.',
    source: 'CMF art. R. 561-18 ; arrêté du 17 mars 2023 fixant la liste des fonctions nationales politiquement exposées',
    ou: 'Liste des fonctions nationales, publiée au Journal officiel',
    lien: 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047324763',
    lienLabel: 'Ouvrir la liste des fonctions',
  },
  {
    code: 'presse',
    label: 'Recherche de presse défavorable',
    detail: 'Rechercher le nom du client et de ses dirigeants dans la presse et les décisions publiées, et consigner ce qui ressort.',
    source: 'Approche par les risques — CMF art. L. 561-4-1',
    ou: 'Recherche libre : aucune base officielle ne tient cette information',
  },
];

/* --------------------------------- Synthèse de l'analyse de vigilance

   Le texte proposé au bas du parcours résume ce que le cabinet a effectivement
   constaté, pour que la justification ne parte pas d'une page blanche.

   Il est rédigé ici, dans le navigateur, à partir des seules données saisies :
   aucun appel à un service extérieur, donc aucune clé à exposer et aucun
   fonctionnement dégradé quand le réseau manque. Le jour où le cabinet voudra
   une rédaction par modèle de langage, c'est cette fonction qu'il faudra
   remplacer par un appel à une fonction serveur — jamais par un appel direct
   depuis le navigateur, qui exposerait la clé à tous les utilisateurs. */

function redigerSyntheseVigilance({ client, activite, classification, beneficiaires, ppe, origineFonds, operations, niveauCalcule, justification, basesVerifiees }) {
  const p = [];
  const nom = client || 'Le client';

  // Même singularisation que la phrase de la lettre : « une activité de
  // marchand de biens », pas « de Marchands de biens ».
  const activiteLisible = reformulerActivite(activite || '').replace(/^(la|le|les|l’|l')\s*/i, '') || 'nature non précisée';
  p.push(`${nom} exerce une activité de ${activiteLisible}.`);

  const bes = (beneficiaires || []).filter(b => (b.nom || '').trim());
  if (bes.length === 0) {
    p.push("Aucun bénéficiaire effectif n'a encore été identifié : ce point reste à compléter avant de conclure.");
  } else {
    const verifies = bes.filter(b => b.verifie);
    p.push(`${bes.length === 1 ? 'Le bénéficiaire effectif identifié est' : `Les ${bes.length} bénéficiaires effectifs identifiés sont`} ${bes.map(b => b.nom.trim() + (b.part ? ` (${pourcent(b.part)})` : '')).join(', ')}.`
      + (verifies.length === bes.length
        ? (bes.length === 1 ? ' Son identité a été vérifiée sur pièce.' : ' Leur identité a été vérifiée sur pièce.')
        : (bes.length === 1
          ? ' Son identité reste à vérifier sur pièce.'
          : ` L'identité de ${bes.length - verifies.length} d'entre eux reste à vérifier sur pièce.`)));
  }

  const ppeStatut = (ppe && ppe.statut) || 'a_verifier';
  if (ppeStatut === 'oui') {
    p.push(`Le client ou son bénéficiaire effectif est une personne politiquement exposée au sens de l'article R. 561-18${ppe.detail ? ` : ${ppe.detail.replace(/\.$/, '')}` : ''}. Une vigilance renforcée s'impose de ce seul fait, avec une attention particulière portée à l'origine du patrimoine et des fonds.`);
  } else if (ppeStatut === 'non') {
    p.push("Ni le client ni son bénéficiaire effectif n'exerce de fonction figurant à l'article R. 561-18.");
  } else {
    p.push("Le statut de personne politiquement exposée n'a pas encore été tranché.");
  }

  const etatOrigine = (origineFonds && origineFonds.etat) || 'a_faire';
  if (etatOrigine === 'documentee') {
    p.push(`L'origine du patrimoine et des fonds est documentée${origineFonds.detail ? ` : ${origineFonds.detail.replace(/\.$/, '')}` : ''}.`);
  } else if (etatOrigine === 'partielle') {
    p.push(`L'origine des fonds n'est que partiellement établie${origineFonds.detail ? ` : ${origineFonds.detail.replace(/\.$/, '')}` : ''}.`);
  } else {
    p.push("L'origine du patrimoine et des fonds reste à établir.");
  }

  // Les libellés des critères sont cités entre guillemets : les accorder à
  // l'article produisait « la caractéristiques du client ».
  const eleves = NPLAB_CRITERES.filter(c => classification[c.code] === 'Élevé').map(c => `« ${c.label} »`);
  const moyens = NPLAB_CRITERES.filter(c => classification[c.code] === 'Moyen').map(c => `« ${c.label} »`);
  if (eleves.length) p.push(`La cotation retient un risque élevé sur ${pluriel(eleves.length, 'le critère', 'les critères')} ${eleves.join(' et ')}.`);
  else if (moyens.length) p.push(`La cotation ne retient aucun critère élevé ; ${pluriel(moyens.length, 'le critère', 'les critères')} ${moyens.join(' et ')} ${pluriel(moyens.length, 'est coté', 'sont cotés')} au niveau moyen.`);
  else p.push('Les quatre critères sont cotés au niveau faible.');

  if ((operations || []).length) {
    p.push(`Opérations relevées : ${operations.join(' ')}`);
  }

  const faites = (basesVerifiees || []).length;
  if (faites) {
    p.push(`${faites} ${pluriel(faites, 'vérification')} ${pluriel(faites, 'externe')} ${pluriel(faites, 'a été effectuée', 'ont été effectuées')} : ${VIGILANCE_BASES.filter(b => (basesVerifiees || []).includes(b.code)).map(b => b.label.toLowerCase()).join(', ')}.`);
  } else {
    p.push("Aucune vérification en base externe n'a été consignée à ce stade.");
  }

  if (justification && justification.trim()) {
    p.push(`Le collaborateur en charge du dossier précise : ${justification.trim().replace(/\s*\.?$/, '.')}`);
  }

  p.push(`Au vu de ces éléments, une vigilance ${String(niveauCalcule || 'Normale').toLowerCase()} est proposée.`);
  return p.join(' ');
}

/* =====================================================================
   Le pipeline documentaire — phase 3 de la refonte V3
   =====================================================================

   Le cahier V3 pose un enchaînement en six temps (§ 1.1) : le cabinet dépose
   ses documents par catégorie, ComplyEC y cherche des informations
   précisément définies, l'utilisateur confirme, les modules vivent sur les
   données confirmées, les cartographies sont arrêtées à une date, et les
   modèles validés reçoivent ces données.

   Trois règles gouvernent tout ce qui suit.

   La première est la source unique (§ 1.3) : une donnée canonique existe une
   seule fois. Le seuil de dépendance, le déclarant Tracfin, l'assureur
   n'auront jamais deux valeurs différentes dans deux écrans.

   La deuxième est que l'IA propose et ne conclut pas (§ 5.2). Elle retourne
   une valeur, le document où elle l'a lue et un extrait court. Elle
   n'affiche aucun score de confiance et ne décide pas qu'un document est
   conforme.

   La troisième est qu'on dit la vérité sur l'état du produit. L'extraction
   réelle suppose une fonction serveur qui n'est pas déployée — la clé
   Anthropic ne peut pas vivre dans le navigateur, où n'importe quel
   utilisateur la lirait. Tant qu'elle ne l'est pas, les valeurs proposées
   ci-dessous sont des exemples, et les écrans le disent.
   ===================================================================== */

const EXTRACTION_DISPONIBLE = false;
const EXTRACTION_MENTION = 'Extraction simulée : la lecture réelle des documents demande une fonction serveur, pas encore déployée.';

/* Les huit catégories de dépôt du § 5.3. « informations » n'est pas de la
   décoration : c'est le référentiel de ce que l'IA a le droit de chercher.
   Elle ne lit pas librement un document pour en tirer ce qu'elle veut. */
const DOC_CATEGORIES = [
  {
    code: 'cabinet', label: 'Cabinet & identité', icone: '🏢',
    typiques: 'Kbis, attestation d’inscription à l’Ordre, statuts, papier à en-tête, attestation RCP.',
    informations: 'Dénomination, forme juridique, adresses, numéro d’inscription, assureur et numéro de police.',
  },
  {
    code: 'organisation', label: 'Organisation & équipe', icone: '👥',
    typiques: 'Organigramme, fiches de fonction, délégations, liste des salariés.',
    informations: 'Rôles, rattachements, fonctions transverses, suppléances.',
  },
  {
    code: 'formation', label: 'Formation', icone: '🎓',
    typiques: 'Attestations de formation, plan de formation annuel.',
    informations: 'Personne, thème, date, organisme, durée, justificatif.',
  },
  {
    code: 'informatique', label: 'Informatique & prestataires', icone: '💻',
    typiques: 'Contrat d’infogérance, licences logicielles, contrat d’hébergement, coffre-fort numérique.',
    informations: 'Prestataire, service rendu, accès aux données, sauvegarde, double authentification, hébergement, test de restauration.',
  },
  {
    code: 'rgpd', label: 'RGPD & données', icone: '🔐',
    typiques: 'Registre des traitements, clauses de confidentialité, contrats de sous-traitance (art. 28 RGPD).',
    informations: 'Traitements, finalités, supports, destinataires, sous-traitants, transferts hors UE.',
  },
  {
    code: 'lbcft-qualite', label: 'LBC-FT & qualité', icone: '🛡️',
    typiques: 'Désignations Tracfin, procédures LBC-FT, anciennes cartographies, rapports de contrôle qualité, registres.',
    informations: 'Rôles, méthode d’analyse, règles internes, historique de surveillance.',
  },
  {
    code: 'missions', label: 'Missions & modèles', icone: '📑',
    typiques: 'Modèles de lettre de mission, conditions générales, modes opératoires.',
    informations: 'Règles communes reprises dans le manuel. Les lettres restent générées dans Entrée en mission.',
  },
];

/* Documents déposés — SourceDocument du § 9.3.
   etatExtraction : 'traite' | 'en-attente' | 'non-lisible' */
const SOURCES_DOCUMENTS = [
  { id: 'src-kbis', categorie: 'cabinet', nom: 'Kbis_Cabinet_Dupont_2026.pdf', type: 'Kbis', dateDepot: '2026-01-14', etatExtraction: 'traite', pages: 2, version: 'v1' },
  { id: 'src-ordre', categorie: 'cabinet', nom: 'Attestation_inscription_Ordre_2026.pdf', type: 'Attestation Ordre', dateDepot: '2026-01-14', etatExtraction: 'traite', pages: 1, version: 'v1' },
  { id: 'src-rcp', categorie: 'cabinet', nom: 'Attestation_RCP_2026.pdf', type: 'Attestation d’assurance', dateDepot: '2026-01-16', etatExtraction: 'traite', pages: 2, version: 'v1' },
  { id: 'src-statuts', categorie: 'cabinet', nom: 'Statuts_cabinet_2019.pdf', type: 'Statuts', dateDepot: '2026-01-16', etatExtraction: 'en-attente', pages: 18, version: 'v1' },
  { id: 'src-organi', categorie: 'organisation', nom: 'Organigramme_2026.pdf', type: 'Organigramme', dateDepot: '2026-01-20', etatExtraction: 'traite', pages: 1, version: 'v2' },
  { id: 'src-salaries', categorie: 'organisation', nom: 'Liste_salaries_janvier_2026.xlsx', type: 'Liste du personnel', dateDepot: '2026-01-20', etatExtraction: 'traite', pages: 1, version: 'v1' },
  { id: 'src-delegation', categorie: 'organisation', nom: 'Delegation_signature_Lesnes.pdf', type: 'Délégation', dateDepot: '2026-02-02', etatExtraction: 'non-lisible', pages: 1, version: 'v1' },
  { id: 'src-plan-form', categorie: 'formation', nom: 'Plan_de_formation_2026.docx', type: 'Plan de formation', dateDepot: '2026-01-22', etatExtraction: 'traite', pages: 3, version: 'v1' },
  { id: 'src-att-julie', categorie: 'formation', nom: 'Attestation_LBCFT_Bernard_mars2026.pdf', type: 'Attestation', dateDepot: '2026-03-20', etatExtraction: 'traite', pages: 1, version: 'v1' },
  { id: 'src-infog', categorie: 'informatique', nom: 'Contrat_infogerance_ACME_IT.pdf', type: 'Contrat', dateDepot: '2026-02-10', etatExtraction: 'traite', pages: 12, version: 'v1' },
  { id: 'src-heberg', categorie: 'informatique', nom: 'Contrat_hebergement_OVH.pdf', type: 'Contrat', dateDepot: '2026-02-10', etatExtraction: 'traite', pages: 9, version: 'v1' },
  { id: 'src-rgpd-reg', categorie: 'rgpd', nom: 'Registre_traitements_2024.xlsx', type: 'Registre', dateDepot: '2026-02-18', etatExtraction: 'traite', pages: 1, version: 'v1' },
  { id: 'src-tracfin', categorie: 'lbcft-qualite', nom: 'Designation_declarant_Tracfin.pdf', type: 'Désignation', dateDepot: '2026-01-28', etatExtraction: 'traite', pages: 1, version: 'v1' },
  { id: 'src-carto-2024', categorie: 'lbcft-qualite', nom: 'Cartographie_risques_2024.pdf', type: 'Cartographie', dateDepot: '2026-01-28', etatExtraction: 'traite', pages: 6, version: 'v1' },
];

const SOURCE_ETATS = {
  traite: { label: 'Lu', couleur: 'vert' },
  'en-attente': { label: 'À lire', couleur: 'orange' },
  'non-lisible': { label: 'Illisible', couleur: 'rouge' },
};

/* Le référentiel — CabinetInfo du § 9.3.

   statut : 'auto' | 'a_confirmer' | 'confirmee' | 'a_renseigner' | 'contradictoire'
   usages : où la donnée ressort. C'est ce qui rend la règle de source unique
   vérifiable : on voit, pour chaque valeur, tout ce qu'elle alimente. */
const REFERENTIEL_INFOS = [
  { cle: 'cabinet.denomination', categorie: 'cabinet', libelle: 'Dénomination du cabinet', valeur: 'Cabinet Dupont & Associés',
    statut: 'confirmee', sourceId: 'src-kbis', repere: 'page 1', extrait: 'Dénomination sociale : CABINET DUPONT & ASSOCIES',
    obtenuLe: '2026-01-14', confirmeLe: '2026-01-15', confirmePar: 'Martin Dupont',
    usages: ['Manuel, page de garde', 'En-tête des courriers', 'Notes de dépendance'] },
  { cle: 'cabinet.forme', categorie: 'cabinet', libelle: 'Forme juridique', valeur: 'Société à responsabilité limitée',
    statut: 'confirmee', sourceId: 'src-kbis', repere: 'page 1', extrait: 'Forme juridique : SARL',
    obtenuLe: '2026-01-14', confirmeLe: '2026-01-15', confirmePar: 'Martin Dupont',
    usages: ['Manuel, chapitre Gouvernance'] },
  { cle: 'cabinet.adresse', categorie: 'cabinet', libelle: 'Adresse du siège', valeur: '12 rue de la Paix, 75002 Paris',
    statut: 'confirmee', sourceId: 'src-kbis', repere: 'page 1', extrait: 'Siège social : 12 rue de la Paix 75002 PARIS',
    obtenuLe: '2026-01-14', confirmeLe: '2026-01-15', confirmePar: 'Martin Dupont',
    usages: ['En-tête des courriers', 'Manuel, page de garde', 'Lettres de mission'] },
  { cle: 'cabinet.inscription', categorie: 'cabinet', libelle: 'Numéro d’inscription à l’Ordre', valeur: '75 12 3456',
    statut: 'a_confirmer', sourceId: 'src-ordre', repere: 'page 1', extrait: 'inscrite au tableau de l’Ordre sous le numéro 75 12 3456',
    obtenuLe: '2026-01-14',
    usages: ['Manuel, page de garde', 'Lettres de mission'] },
  { cle: 'cabinet.assureur', categorie: 'cabinet', libelle: 'Assureur en responsabilité civile', valeur: 'MMA IARD',
    statut: 'a_confirmer', sourceId: 'src-rcp', repere: 'page 1', extrait: 'MMA IARD Assurances Mutuelles — attestation d’assurance responsabilité civile professionnelle',
    obtenuLe: '2026-01-16',
    usages: ['Manuel, chapitre Gouvernance', 'Lettres de mission'] },
  { cle: 'cabinet.police', categorie: 'cabinet', libelle: 'Numéro de police RCP', valeur: '114 782 996',
    statut: 'contradictoire', sourceId: 'src-rcp', repere: 'page 2', extrait: 'Police n° 114 782 996 — le corps de l’attestation mentionne 114 782 998 en page 1',
    obtenuLe: '2026-01-16',
    usages: ['Manuel, chapitre Gouvernance'] },
  { cle: 'cabinet.dateInscription', categorie: 'cabinet', libelle: 'Date d’inscription à l’Ordre', valeur: null,
    statut: 'a_renseigner', sourceId: null, obtenuLe: null,
    usages: ['Manuel, page de garde'] },

  { cle: 'orga.gerant', categorie: 'organisation', libelle: 'Gérant', valeur: 'Martin Dupont',
    statut: 'confirmee', sourceId: 'src-organi', repere: 'page 1', extrait: 'Martin Dupont — Gérant, expert-comptable',
    obtenuLe: '2026-01-20', confirmeLe: '2026-01-21', confirmePar: 'Martin Dupont',
    usages: ['Manuel, chapitre Gouvernance', 'Signature des documents'] },
  { cle: 'orga.effectif', categorie: 'organisation', libelle: 'Effectif du cabinet', valeur: '6 personnes',
    statut: 'auto', sourceId: null, obtenuLe: '2026-09-13',
    usages: ['Manuel, chapitre Gouvernance'],
    note: 'Compté sur les comptes collaborateurs actifs dans ComplyEC.' },
  { cle: 'orga.responsableQualite', categorie: 'organisation', libelle: 'Responsable du système qualité', valeur: null,
    statut: 'a_renseigner', sourceId: null, obtenuLe: null,
    usages: ['Manuel, chapitre Surveillance', 'Évaluation annuelle du SMQ'] },
  { cle: 'orga.suppleance', categorie: 'organisation', libelle: 'Suppléance de l’expert-comptable', valeur: null,
    statut: 'a_renseigner', sourceId: 'src-delegation', obtenuLe: null,
    usages: ['Manuel, chapitre Gouvernance'],
    note: 'La délégation déposée n’a pas pu être lue : document scanné sans couche texte.' },

  { cle: 'info.infogerant', categorie: 'informatique', libelle: 'Infogérant', valeur: 'ACME IT Services',
    statut: 'a_confirmer', sourceId: 'src-infog', repere: 'page 1', extrait: 'Le prestataire ACME IT SERVICES, ci-après « le Prestataire »',
    obtenuLe: '2026-02-10',
    usages: ['Manuel, chapitre Sécurité', 'Registre RGPD — sous-traitants'] },
  { cle: 'info.hebergement', categorie: 'informatique', libelle: 'Lieu d’hébergement des données', valeur: 'France (Roubaix et Gravelines)',
    statut: 'a_confirmer', sourceId: 'src-heberg', repere: 'page 3', extrait: 'Les données sont hébergées dans les centres de données de Roubaix et Gravelines',
    obtenuLe: '2026-02-10',
    usages: ['Manuel, chapitre Sécurité', 'Registre RGPD — transferts'] },
  { cle: 'info.sauvegarde', categorie: 'informatique', libelle: 'Fréquence des sauvegardes', valeur: 'Quotidienne, conservation 30 jours',
    statut: 'a_confirmer', sourceId: 'src-infog', repere: 'page 7', extrait: 'sauvegarde quotidienne incrémentale, rétention de trente jours',
    obtenuLe: '2026-02-10',
    usages: ['Manuel, chapitre Sécurité'] },
  { cle: 'info.testRestauration', categorie: 'informatique', libelle: 'Dernier test de restauration', valeur: null,
    statut: 'a_renseigner', sourceId: null, obtenuLe: null,
    usages: ['Manuel, chapitre Sécurité', 'Dossier de contrôle qualité'] },

  { cle: 'rgpd.nbTraitements', categorie: 'rgpd', libelle: 'Traitements inscrits au registre', valeur: '7 traitements',
    statut: 'a_confirmer', sourceId: 'src-rgpd-reg', repere: 'onglet « Registre »', extrait: 'sept lignes renseignées, dernière mise à jour en novembre 2024',
    obtenuLe: '2026-02-18',
    usages: ['Manuel, chapitre Protection des données'] },
  { cle: 'rgpd.dpo', categorie: 'rgpd', libelle: 'Délégué à la protection des données', valeur: null,
    statut: 'a_renseigner', sourceId: null, obtenuLe: null,
    usages: ['Manuel, chapitre Protection des données'] },

  { cle: 'lbcft.declarant', categorie: 'lbcft-qualite', libelle: 'Déclarant Tracfin', valeur: 'Martin Dupont',
    statut: 'confirmee', sourceId: 'src-tracfin', repere: 'page 1', extrait: 'désigne Monsieur Martin DUPONT en qualité de déclarant',
    obtenuLe: '2026-01-28', confirmeLe: '2026-01-29', confirmePar: 'Martin Dupont',
    usages: ['Manuel, chapitre LBC-FT', 'Paramètres du cabinet', 'Fiches de vigilance'] },
  { cle: 'lbcft.correspondant', categorie: 'lbcft-qualite', libelle: 'Correspondant Tracfin', valeur: 'Julie Bernard',
    statut: 'a_confirmer', sourceId: 'src-tracfin', repere: 'page 1', extrait: 'et Madame Julie BERNARD en qualité de correspondant',
    obtenuLe: '2026-01-28',
    usages: ['Manuel, chapitre LBC-FT', 'Paramètres du cabinet'] },
  { cle: 'lbcft.derniereCartographie', categorie: 'lbcft-qualite', libelle: 'Dernière cartographie des risques', valeur: '2024',
    statut: 'a_confirmer', sourceId: 'src-carto-2024', repere: 'page 1', extrait: 'Cartographie des risques arrêtée au 31 décembre 2024',
    obtenuLe: '2026-01-28',
    usages: ['Manuel, chapitre LBC-FT', 'Dossier de contrôle qualité'] },
];

/* Documents produits par ComplyEC — PublicationVersion du § 9.3.
   etat : 'a-jour' | 'a-regenerer' */
const DOCUMENTS_GENERES = [
  { id: 'doc-manuel', type: 'Manuel de procédures', nom: 'Manuel_de_procedures_v1.docx', version: 'v1', date: '2026-02-24',
    etat: 'a-regenerer', variables: ['cabinet.denomination', 'cabinet.adresse', 'orga.gerant', 'lbcft.declarant', 'info.infogerant'],
    motif: 'L’infogérant a changé depuis la dernière génération.' },
  { id: 'doc-carto', type: 'Cartographie LBC-FT', nom: 'Cartographie_risques_2026.docx', version: 'v1', date: '2026-09-11',
    etat: 'a-jour', variables: ['cabinet.denomination', 'lbcft.declarant'] },
  { id: 'doc-dep-nova', type: 'Note de dépendance économique', nom: 'Note_dependance_SAS_NOVA.docx', version: 'v2', date: '2026-06-02',
    etat: 'a-jour', variables: ['cabinet.denomination', 'cabinet.adresse', 'orga.gerant'] },
  { id: 'doc-cq', type: 'Dossier de contrôle qualité', nom: 'Dossier_de_controle_qualite.docx', version: 'v1', date: '2026-05-18',
    etat: 'a-regenerer', variables: ['cabinet.denomination', 'lbcft.derniereCartographie', 'info.testRestauration'],
    motif: 'La cartographie 2026 a été arrêtée après cette version.' },
];

// ------------------------------------------------------------- Lectures

function docCategorie(code) {
  return DOC_CATEGORIES.find(c => c.code === code) || { code, label: code, icone: '📄', typiques: '', informations: '' };
}

function sourcesDeCategorie(code) {
  return dbSources().filter(s => s.categorie === code);
}

function infosDeCategorie(code) {
  return dbReferentiel().filter(i => i.categorie === code);
}

function infosDeSource(sourceId) {
  return dbReferentiel().filter(i => i.sourceId === sourceId);
}

/* Ce qui attend une décision humaine : proposé par une lecture de document, ou
   contradictoire entre deux sources. Une valeur récupérée d'une source
   technique de confiance n'y figure pas — elle est modifiable, pas à valider. */
function infosAConfirmer() {
  return dbReferentiel().filter(i => i.statut === 'a_confirmer' || i.statut === 'contradictoire');
}

function infosManquantes() {
  return dbReferentiel().filter(i => i.statut === 'a_renseigner');
}

/* Une valeur « sans alerte » se confirme en lot : source unique, pas de
   contradiction, et un extrait qui porte la valeur. Le cahier l'exige
   explicitement — quarante confirmations unitaires évidentes sont quarante
   clics de trop. Les contradictions, elles, ne sont jamais confirmables en
   lot : elles demandent une décision. */
function infoSansAlerte(info) {
  return info.statut === 'a_confirmer' && !!info.sourceId && !!info.extrait;
}

function etatCategorieDocuments(code) {
  const sources = sourcesDeCategorie(code);
  const infos = infosDeCategorie(code);
  return {
    fichiers: sources.length,
    aLire: sources.filter(s => s.etatExtraction !== 'traite').length,
    aConfirmer: infos.filter(i => i.statut === 'a_confirmer' || i.statut === 'contradictoire').length,
    aRenseigner: infos.filter(i => i.statut === 'a_renseigner').length,
  };
}

/* Les documents qui dépendent d'une information : c'est la mécanique du
   § 11 « Modifier une donnée canonique marque les documents dépendants à
   régénérer ». */
function documentsDependantDe(cle) {
  return dbDocumentsGeneres().filter(d => d.variables.includes(cle));
}

/* Les sources déposées, semence et dépôts confondus. */
function sourcesToutes() { return dbSources(); }

/* Les thèmes de l'assistant des informations manquantes. Un thème sans trou
   réel ne devient pas une étape : le cahier interdit de poser une question
   déjà résolue ailleurs. */
function themesInformationsManquantes() {
  return DOC_CATEGORIES
    .map(c => ({ code: c.code, label: c.label, icone: c.icone, manquantes: infosDeCategorie(c.code).filter(i => i.statut === 'a_renseigner') }))
    .filter(t => t.manquantes.length > 0);
}

/* =====================================================================
   Organisation, ressources et registres — phase 4 de la refonte V3
   ===================================================================== */

/* Les rôles que la NPMQ et le code monétaire et financier attendent d'un
   cabinet. Chacun cite le texte qui le fonde, parce qu'un contrôleur demandera
   au titre de quoi le rôle existe — et parce qu'un rôle inventé serait une
   charge de travail que personne n'a demandée.

   Le déclarant et le correspondant Tracfin sont deux rôles distincts de
   l'article R. 561-23 du code monétaire et financier, même quand la même
   personne les tient dans un petit cabinet. */
const ROLES_CABINET = [
  { code: 'gerant', label: 'Gérant', famille: 'direction',
    fondement: 'Statuts du cabinet', titulaireCle: 'orga.gerant' },
  { code: 'expert', label: 'Expert-comptable signataire', famille: 'direction',
    fondement: 'Décret n° 2012-432, art. 141 à 169', titulaire: 'Martin Dupont' },
  { code: 'qualite', label: 'Responsable du système de management de la qualité', famille: 'transverse',
    fondement: 'NPMQ, arrêté du 30 mai 2024', titulaireCle: 'orga.responsableQualite' },
  { code: 'surveillance', label: 'Responsable de la surveillance du système qualité', famille: 'transverse',
    fondement: 'NPMQ, composante Surveillance', titulaire: null },
  { code: 'formation', label: 'Responsable de la formation', famille: 'transverse',
    fondement: 'NPMQ, composante Ressources humaines', titulaire: 'Martin Dupont' },
  { code: 'lbcft', label: 'Référent LBC-FT', famille: 'transverse',
    fondement: 'CMF, art. L. 561-32', titulaire: 'Martin Dupont' },
  { code: 'declarant', label: 'Déclarant Tracfin', famille: 'transverse',
    fondement: 'CMF, art. R. 561-23', titulaireCle: 'lbcft.declarant' },
  { code: 'correspondant', label: 'Correspondant Tracfin', famille: 'transverse',
    fondement: 'CMF, art. R. 561-23', titulaireCle: 'lbcft.correspondant' },
  { code: 'rgpd', label: 'Référent protection des données', famille: 'transverse',
    fondement: 'RGPD, art. 37 et suivants', titulaireCle: 'rgpd.dpo' },
  /* Deux rôles ajoutés à la demande du § 14.

     Le suppléant Tracfin n'est pas une commodité : l'article R. 561-23 du code
     monétaire et financier impose de désigner un déclarant et un correspondant,
     et la pratique attend qu'une suppléance soit prévue pour que le cabinet
     reste joignable pendant une absence.

     Le responsable IA ne relève d'aucun texte : c'est le cabinet qui décide de
     confier à quelqu'un l'application de sa charte. L'écran ne prétend pas le
     contraire. */
  { code: 'suppleant', label: 'Suppléant Tracfin', famille: 'transverse',
    fondement: 'CMF, art. R. 561-23 — suppléance de la fonction', titulaire: null },
  { code: 'ia', label: 'Responsable IA', famille: 'transverse',
    fondement: 'Règle interne du cabinet — application de la charte IA', titulaire: null },
];

/* Les sept rôles que l'écran Paramètres fait désigner (§ 14), plus le déclarant
   Tracfin, qui est une obligation de l'article R. 561-23 et qu'on ne peut donc
   pas retirer de la liste sans faire disparaître une désignation exigée. */
const RESPONSABLES_A_DESIGNER = [
  'qualite', 'surveillance', 'formation', 'lbcft', 'ia', 'declarant', 'correspondant', 'suppleant',
];

const SUPPLEANCES = [
  { role: 'lbcft', titulaire: 'Martin Dupont', suppleant: 'Julie Bernard', depuis: '2026-01-29', source: 'src-tracfin' },
];

function titulaireRole(role) {
  const r = dbRoles().find(x => x.code === role.code);
  return r ? r.titulaireEffectif : null;
}

function rolesNonCouverts() { return dbRolesNonCouverts(); }

/* Outils et prestataires qui touchent aux données du cabinet — § 5.3.

   « accesDonnees » est la seule question qui compte pour le secret
   professionnel : un prestataire qui voit les dossiers clients relève de
   l'article 28 du RGPD et du secret de l'article 226-13 du code pénal.

   Une information non trouvée dans le contrat s'affiche « à confirmer avec le
   prestataire », jamais « non conforme » : le cahier l'interdit explicitement,
   et ComplyEC ne juge pas un contrat. */
const OUTILS_PRESTATAIRES = [
  { id: 'acme', nom: 'ACME IT Services', type: 'Infogérance', usage: 'Maintenance des postes et du réseau',
    accesDonnees: true, sourceId: 'src-infog', derniereConfirmation: null,
    mesures: { mfa: 'Oui, sur les comptes d’administration', sauvegarde: 'Quotidienne, conservation 30 jours', hebergement: null, restauration: null, droits: 'Revue annuelle des accès' } },
  { id: 'ovh', nom: 'OVHcloud', type: 'Hébergement', usage: 'Hébergement de la base et des documents',
    accesDonnees: true, sourceId: 'src-heberg', derniereConfirmation: null,
    mesures: { mfa: null, sauvegarde: 'Réplication sur deux centres', hebergement: 'France — Roubaix et Gravelines', restauration: null, droits: null } },
  { id: 'quadra', nom: 'Quadra (Cegid)', type: 'Logiciel métier', usage: 'Production comptable et paie',
    accesDonnees: true, sourceId: null, derniereConfirmation: '2026-02-14',
    mesures: { mfa: 'Oui', sauvegarde: 'Assurée par l’éditeur', hebergement: 'France', restauration: null, droits: 'Par profil utilisateur' } },
  { id: 'drive', nom: 'Google Workspace', type: 'Bureautique et stockage', usage: 'Drive des dossiers clients, messagerie',
    accesDonnees: true, sourceId: null, derniereConfirmation: null,
    mesures: { mfa: 'Oui, obligatoire', sauvegarde: null, hebergement: null, restauration: null, droits: 'Par dossier partagé' } },
  { id: 'jedeclare', nom: 'jedeclare.com', type: 'Portail déclaratif', usage: 'Télétransmission fiscale et sociale',
    accesDonnees: true, sourceId: null, derniereConfirmation: '2026-01-30',
    mesures: { mfa: 'Oui', sauvegarde: null, hebergement: 'France', restauration: null, droits: null } },
  { id: 'coffre', nom: 'Coffre-fort numérique client', type: 'Échange de documents', usage: 'Remise des documents aux clients',
    accesDonnees: true, sourceId: null, derniereConfirmation: null,
    mesures: { mfa: null, sauvegarde: null, hebergement: null, restauration: null, droits: null } },
];

const MESURES_LIBELLES = {
  mfa: 'Double authentification',
  sauvegarde: 'Sauvegarde',
  hebergement: 'Lieu d’hébergement',
  restauration: 'Test de restauration',
  droits: 'Gestion des droits d’accès',
};

function prestatairesAConfirmer() {
  return dbPrestataires().filter(o => !o.derniereConfirmation);
}

function mesuresManquantes(outil) {
  return Object.keys(MESURES_LIBELLES).filter(k => !outil.mesures[k]);
}

/* Registre des traitements — RGPD, article 30. Les six traitements d'un
   cabinet d'expertise comptable : ils ne sont pas inventés, ils suivent le
   modèle de registre que la CNIL publie pour les petites structures. */
const TRAITEMENTS_RGPD = [
  { id: 't-clients', finalite: 'Gestion des dossiers clients', role: 'Responsable de traitement',
    base: 'Exécution du contrat de mission', personnes: 'Clients, dirigeants, bénéficiaires effectifs',
    donnees: 'Identité, coordonnées, données financières et fiscales', support: 'Quadra, Drive',
    duree: '10 ans après la fin de la mission (art. L. 123-22 du code de commerce)',
    destinataires: 'Administration fiscale, organismes sociaux', transferts: 'Aucun', derniereRevue: '2024-11-18' },
  { id: 't-paie', finalite: 'Établissement de la paie des clients', role: 'Sous-traitant',
    base: 'Exécution du contrat de mission', personnes: 'Salariés des clients',
    donnees: 'Identité, NIR, rémunération, absences', support: 'Quadra Paie',
    duree: '5 ans', destinataires: 'Organismes sociaux, DSN', transferts: 'Aucun', derniereRevue: '2024-11-18' },
  { id: 't-lbcft', finalite: 'Vigilance LBC-FT et connaissance du client', role: 'Responsable de traitement',
    base: 'Obligation légale (CMF, art. L. 561-2 et suivants)', personnes: 'Clients, bénéficiaires effectifs, PPE',
    donnees: 'Identité, origine des fonds, résultats de vérification en base',
    support: 'ComplyEC', duree: '5 ans après la fin de la relation (CMF, art. L. 561-12)',
    destinataires: 'Tracfin en cas de déclaration', transferts: 'Aucun', derniereRevue: null },
  { id: 't-rh', finalite: 'Gestion du personnel du cabinet', role: 'Responsable de traitement',
    base: 'Exécution du contrat de travail', personnes: 'Collaborateurs du cabinet',
    donnees: 'Identité, contrat, formation, évaluations', support: 'Dossiers RH',
    duree: '5 ans après le départ', destinataires: 'Organismes sociaux', transferts: 'Aucun', derniereRevue: '2024-11-18' },
  { id: 't-prospect', finalite: 'Prospection et relation commerciale', role: 'Responsable de traitement',
    base: 'Intérêt légitime', personnes: 'Prospects',
    donnees: 'Identité professionnelle, coordonnées', support: 'Messagerie, tableur',
    duree: '3 ans sans contact', destinataires: 'Aucun', transferts: 'Aucun', derniereRevue: null },
  { id: 't-qualite', finalite: 'Contrôle qualité et surveillance des missions', role: 'Responsable de traitement',
    base: 'Obligation professionnelle (NPMQ)', personnes: 'Collaborateurs, clients supervisés',
    donnees: 'Dossiers contrôlés, constats, actions correctives', support: 'ComplyEC',
    duree: '6 ans', destinataires: 'Contrôleur qualité de l’Ordre', transferts: 'Aucun', derniereRevue: null },
];

function traitementsARevoir() {
  return TRAITEMENTS_RGPD.filter(t => !t.derniereRevue);
}

/* Registre des réclamations — NPMQ, composante « Réclamations et
   allégations ». Le cahier veut un registre vivant, capable de déclencher une
   non-conformité, pas une boîte à archives. */
const RECLAMATIONS = [
  { id: 'rec-1', date: '2026-02-12', dossier: 'sarl-dupont-immo', canal: 'Téléphone',
    objet: 'Retard dans la remise de la liasse fiscale', traitePar: 'julie',
    reponse: 'Liasse transmise le 14/02 avec un mot d’excuse du cabinet.', dateReponse: '2026-02-14',
    etat: 'cloturee', suites: 'Aucune suite : incident isolé lié à un arrêt maladie.' },
  { id: 'rec-2', date: '2026-04-03', dossier: 'sas-nova', canal: 'E-mail',
    objet: 'Honoraires facturés au-delà de la lettre de mission', traitePar: 'martin',
    reponse: 'Entretien téléphonique le 05/04, avoir de 340 € émis.', dateReponse: '2026-04-05',
    etat: 'cloturee', suites: 'Non-conformité ouverte : la lettre de mission n’avait pas été actualisée.' },
  { id: 'rec-3', date: '2026-08-28', dossier: 'sci-durand', canal: 'Courrier',
    objet: 'Erreur d’affectation d’une écriture de TVA', traitePar: 'nathalie',
    reponse: null, dateReponse: null,
    etat: 'en-cours', suites: null },
];

const RECLAMATION_ETATS = {
  'en-cours': { label: 'En cours', couleur: 'orange' },
  cloturee: { label: 'Clôturée', couleur: 'vert' },
};

/* Le traitement d'une réclamation peut revenir à un collaborateur comme à
   l'expert-comptable, qui n'est pas dans la liste des collaborateurs. */
function personneNom(id) {
  if (id === 'martin') return EXPERT_COMPTABLE.nom;
  const c = collaborateur(id);
  return c ? c.nom : id;
}

function reclamationsOuvertes() {
  return dbReclamations().filter(r => r.etat !== 'cloturee');
}

/* Chronologie de formation d'un collaborateur, toutes sessions confondues. */
function formationsDuCollaborateur(collabId) {
  const lignes = [];
  dbFormationsProgrammes().forEach(prog => prog.sessions.forEach(s => {
    if (!s.participants.includes(collabId)) return;
    const a = s.attestations[collabId] || {};
    lignes.push({
      id: s.id + '-' + collabId, titre: s.titre, date: s.date, formateur: s.formateur,
      attestation: !!a.recue, dateUpload: a.dateUpload || null,
      passee: new Date(s.date) <= new Date(),
    });
  }));
  return lignes.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function etatFormationCollaborateur(collabId) {
  const lignes = formationsDuCollaborateur(collabId).filter(l => l.passee);
  if (!lignes.length) return { code: 'jamais', label: 'Jamais formé', couleur: 'rouge' };
  const manquantes = lignes.filter(l => !l.attestation).length;
  if (manquantes) return { code: 'sans-preuve', label: `${manquantes} ${pluriel(manquantes, 'attestation manquante', 'attestations manquantes')}`, couleur: 'orange' };
  return { code: 'a-jour', label: 'À jour', couleur: 'vert' };
}

/* =====================================================================
   LBC-FT — phase 5 de la refonte V3
   ===================================================================== */

/* Une phrase, pas une dissertation : le cahier veut « des raisons factuelles
   courtes, jamais une dissertation IA » sur l'écran des mesures. Le texte long
   reste réservé à la fiche de vigilance, qui est un document. */
function resumeCotation(classification) {
  if (!classification) return 'Aucune cotation enregistrée.';
  const eleves = NPLAB_CRITERES.filter(c => classification[c.code] === 'Élevé').map(c => c.label.toLowerCase());
  const moyens = NPLAB_CRITERES.filter(c => classification[c.code] === 'Moyen').map(c => c.label.toLowerCase());
  if (eleves.length) {
    return `Risque élevé retenu sur ${pluriel(eleves.length, 'le critère', 'les critères')} ${eleves.join(' et ')}.`;
  }
  if (moyens.length) {
    return `Aucun critère élevé ; ${pluriel(moyens.length, 'le critère', 'les critères')} ${moyens.join(' et ')} ${pluriel(moyens.length, 'est coté', 'sont cotés')} au niveau moyen.`;
  }
  return 'Les quatre critères sont cotés au niveau faible.';
}

/* Ce qui appelle une mise à jour de vigilance. Aucun de ces motifs n'est une
   opinion : chacun se déduit d'une date, d'un événement ou d'une absence.
   L'échéance de revue vient de la règle que le cabinet se donne — le code
   monétaire et financier impose une actualisation « pendant toute la durée de
   la relation d'affaires » (art. L. 561-5-1) sans fixer de fréquence. */
const VIGILANCE_MOTIFS = {
  jamais: { label: 'Jamais analysé', priorite: 'Critique', detail: 'Le dossier n’a aucune fiche de vigilance.' },
  echue: { label: 'Revue échue', priorite: 'Haute', detail: 'La dernière analyse dépasse la périodicité que le cabinet s’est fixée.' },
  rbe: { label: 'Bénéficiaires à revérifier', priorite: 'Haute', detail: 'Le registre des bénéficiaires effectifs n’a pas été interrogé depuis la dernière analyse.' },
  ppe: { label: 'Statut PPE à revoir', priorite: 'Haute', detail: 'Le dossier porte une personne politiquement exposée : le statut se vérifie chaque année.' },
  renforcee: { label: 'Vigilance renforcée', priorite: 'Moyenne', detail: 'Un dossier en vigilance renforcée fait l’objet d’un suivi plus fréquent.' },
};

const VIGILANCE_PERIODICITE_MOIS = 12;

/* Les dossiers dont la vigilance appelle une action, avec le motif qui le
   justifie. Un dossier peut cumuler plusieurs motifs : on retient le plus
   grave, et on liste les autres. */
function vigilanceATraiter() {
  const aujourdhui = new Date('2026-09-13T00:00:00');
  const ordre = ['Critique', 'Haute', 'Moyenne', 'Faible'];
  return dbVigilanceDossiers().map(d => {
    const motifs = [];
    if (d.statut !== 'complete') {
      motifs.push('jamais');
    } else {
      const mois = Math.round((aujourdhui - new Date(d.derniereAnalyse + 'T00:00:00')) / (1000 * 60 * 60 * 24 * 30.44));
      if (mois >= VIGILANCE_PERIODICITE_MOIS) motifs.push('echue');
      if (d.niveauRetenu === 'Renforcée') motifs.push('renforcee');
      if ((d.operationsParticulieres || []).some(o => /politiquement exposée|PPE/i.test(o))) motifs.push('ppe');
    }
    if (!motifs.length) return null;
    const principal = motifs.slice().sort((a, b) => ordre.indexOf(VIGILANCE_MOTIFS[a].priorite) - ordre.indexOf(VIGILANCE_MOTIFS[b].priorite))[0];
    return {
      dossier: d.dossier, motifs, principal,
      priorite: VIGILANCE_MOTIFS[principal].priorite,
      derniereAnalyse: d.derniereAnalyse,
      niveau: d.niveauRetenu || null,
    };
  }).filter(Boolean)
    .sort((a, b) => ordre.indexOf(a.priorite) - ordre.indexOf(b.priorite));
}

/* Événements détectables depuis la dernière analyse. Le cahier demande de
   préremplir ce qui est détectable, et de faire confirmer le reste. Ce qui est
   proposé ici vient d'une source technique ou d'une absence constatée, jamais
   d'une interprétation. */
const VIGILANCE_EVENEMENTS = {
  'sas-nova': [
    { code: 'mandat', libelle: 'Mandat électif de la dirigeante renouvelé en mars 2026', source: 'Vérification PPE annuelle', propose: true },
    { code: 'rbe', libelle: 'Registre des bénéficiaires effectifs non réinterrogé depuis avril 2026', source: 'Absence de trace dans ComplyEC', propose: true },
  ],
  'sci-durand': [
    { code: 'honoraires', libelle: 'Part du dossier dans les honoraires passée de 9,8 % à 11,6 %', source: 'Calcul sur les honoraires du cabinet', propose: true },
  ],
  'sarl-projet': [
    { code: 'aucun', libelle: 'Aucun changement détecté depuis la dernière analyse', source: 'ComplyEC', propose: false },
  ],
};

function evenementsDepuisDerniereAnalyse(dossierId) {
  return VIGILANCE_EVENEMENTS[dossierId] || [
    { code: 'aucun', libelle: 'Aucun changement détecté depuis la dernière analyse', source: 'ComplyEC', propose: false },
  ];
}

/* Mesures de vigilance proposées selon le niveau retenu. Déterministes : le
   cahier veut que le logiciel propose à partir de règles, et que l'humain
   retienne. Les mesures renforcées reprennent l'article L. 561-10-2 du code
   monétaire et financier — examen renforcé, origine des fonds, surveillance
   accrue. */
const MESURES_VIGILANCE = {
  Allégée: [
    { code: 'actualisation-3', libelle: 'Actualisation tous les trois ans', detail: 'Revue du dossier à échéance triennale.' },
    { code: 'aucune-mesure', libelle: 'Aucune mesure complémentaire', detail: 'Le dossier ne présente pas de facteur de risque identifié.' },
  ],
  Normale: [
    { code: 'actualisation-1', libelle: 'Actualisation annuelle', detail: 'Revue du dossier à chaque exercice.' },
    { code: 'rbe-annuel', libelle: 'Interrogation annuelle du registre des bénéficiaires', detail: 'Contrôle des bénéficiaires effectifs une fois par an.' },
    { code: 'coherence', libelle: 'Contrôle de cohérence des flux', detail: 'Rapprochement des flux avec l’activité déclarée en cours de mission.' },
  ],
  Renforcée: [
    { code: 'actualisation-6', libelle: 'Actualisation semestrielle', detail: 'Revue du dossier deux fois par an.' },
    { code: 'origine-fonds', libelle: 'Justification de l’origine des fonds', detail: 'Recherche de l’origine des fonds engagés (CMF, art. L. 561-10-2).' },
    { code: 'surveillance', libelle: 'Surveillance renforcée des opérations', detail: 'Examen des opérations inhabituelles et conservation des conclusions.' },
    { code: 'validation-ec', libelle: 'Validation par l’expert-comptable', detail: 'Toute nouvelle mission sur ce dossier passe par le référent LBC-FT.' },
  ],
};

function mesuresProposees(niveau) {
  return MESURES_VIGILANCE[niveau] || MESURES_VIGILANCE.Normale;
}

/* Campagne d'interrogation du registre des bénéficiaires effectifs.
   « divergence » est le seul résultat qui appelle une action : l'article
   L. 561-45-1 du code monétaire et financier impose de signaler à l'INPI
   toute divergence entre le registre et ce que le cabinet connaît. */
const CAMPAGNE_RBE = [
  { dossier: 'sas-nova', consulteLe: '2026-04-14', par: 'martin', resultat: 'concordant', beneficiaires: ['Claire Nova — 100 %'], divergence: null },
  { dossier: 'sci-durand', consulteLe: '2026-04-14', par: 'martin', resultat: 'divergence', beneficiaires: ['Paul Durand — 50 %', 'Marie Durand — 50 %'],
    divergence: 'Le registre ne mentionne que Paul Durand ; les statuts déposés font état de deux associés à parts égales.' },
  { dossier: 'sarl-projet', consulteLe: null, par: null, resultat: null, beneficiaires: [], divergence: null },
  { dossier: 'sarl-dupont-immo', consulteLe: null, par: null, resultat: null, beneficiaires: [], divergence: null },
  { dossier: 'sci-riviera', consulteLe: null, par: null, resultat: null, beneficiaires: [], divergence: null },
  { dossier: 'sas-atlantique', consulteLe: null, par: null, resultat: null, beneficiaires: [], divergence: null },
];

/* Attestations « personne politiquement exposée ».

   L'article R. 561-18 du code monétaire et financier définit les fonctions qui
   font d'un client, d'un bénéficiaire effectif ou d'un proche une personne
   politiquement exposée, et l'arrêté du 17 mars 2023 en fixe la liste
   nationale. Le cabinet fait signer au dirigeant une attestation sur sa
   situation, et la classe au dossier permanent.

   Ce que ComplyEC suit ici est documentaire : l'attestation est-elle au
   dossier ? La qualité de PPE elle-même, elle, se constate dans l'analyse de
   vigilance, et les deux ne se confondent pas.

   Semences : les dossiers pour lesquels l'attestation est déjà signée. */
const PPE_ATTESTATIONS_DEMO = {
  'sas-nova': { deposeeLe: '2026-01-12', ppe: true, detail: 'La dirigeante exerce un mandat de conseillère municipale.' },
  'sci-durand': { deposeeLe: '2026-01-15', ppe: false, detail: null },
  'sarl-projet': { deposeeLe: '2026-02-03', ppe: false, detail: null },
  'eurl-alpes': { deposeeLe: '2026-02-10', ppe: false, detail: null },
  'sas-vision': { deposeeLe: '2026-02-18', ppe: false, detail: null },
  'sci-martin': { deposeeLe: '2026-03-02', ppe: false, detail: null },
  'sarl-alpha': { deposeeLe: '2026-03-09', ppe: false, detail: null },
  'eurl-ocean': { deposeeLe: '2026-03-16', ppe: false, detail: null },
};

const RBE_RESULTATS = {
  concordant: { label: 'Concordant', couleur: 'vert' },
  divergence: { label: 'Divergence', couleur: 'rouge' },
};

/* Contrôles ciblés : personnes politiquement exposées, gel des avoirs, pays à
   risque. Le gel relève de l'article L. 562-4 du code monétaire et financier,
   et la liste des pays à risque de l'arrêté qui transpose la liste européenne.
   Le contrôle se trace : date, personne, source consultée, résultat. */
const CONTROLES_CIBLES = [
  { id: 'ctl-1', dossier: 'sas-nova', type: 'ppe', source: 'Vérification du mandat électif',
    date: '2026-04-14', par: 'martin', resultat: 'positif', commentaire: 'Mandat de conseillère municipale confirmé — vigilance renforcée maintenue.' },
  { id: 'ctl-2', dossier: 'sas-nova', type: 'gel', source: 'Registre national des gels (DG Trésor)',
    date: '2026-04-14', par: 'martin', resultat: 'negatif', commentaire: 'Aucune correspondance.' },
  { id: 'ctl-3', dossier: 'sci-durand', type: 'gel', source: 'Registre national des gels (DG Trésor)',
    date: '2026-04-14', par: 'martin', resultat: 'negatif', commentaire: 'Aucune correspondance.' },
  { id: 'ctl-4', dossier: 'sas-atlantique', type: 'pays', source: 'Liste des pays tiers à haut risque (règlement délégué (UE) 2016/1675)',
    date: null, par: null, resultat: null, commentaire: null },
  { id: 'ctl-5', dossier: 'eurl-nordic', type: 'pays', source: 'Liste des pays tiers à haut risque (règlement délégué (UE) 2016/1675)',
    date: null, par: null, resultat: null, commentaire: null },
  { id: 'ctl-6', dossier: 'sarl-projet', type: 'gel', source: 'Registre national des gels (DG Trésor)',
    date: null, par: null, resultat: null, commentaire: null },
];

const CONTROLE_TYPES = {
  ppe: { label: 'Personne politiquement exposée', court: 'PPE', fondement: 'CMF, art. R. 561-18' },
  gel: { label: 'Gel des avoirs', court: 'Gel', fondement: 'CMF, art. L. 562-4' },
  pays: { label: 'Pays à risque', court: 'Pays', fondement: 'Liste des pays tiers à haut risque annexée au règlement délégué (UE) 2016/1675' },
};

const CONTROLE_RESULTATS = {
  positif: { label: 'Correspondance', couleur: 'orange' },
  negatif: { label: 'Rien à signaler', couleur: 'vert' },
};

function controlesAFaire() { return dbControles().filter(c => !c.date); }
function rbeAConsulter() { return dbCampagneRbe().filter(r => !r.consulteLe); }
function rbeDivergences() { return dbCampagneRbe().filter(r => r.resultat === 'divergence'); }

/* =====================================================================
   Système de management de la qualité — phase 6 de la refonte V3
   =====================================================================

   La NPMQ (norme professionnelle de management de la qualité, arrêté du
   30 mai 2024, applicable depuis le 1er janvier 2025) structure le système en
   huit composantes. La cartographie des risques qualité suit ces composantes :
   ce n'est pas un découpage inventé, c'est celui que le contrôleur attend.
   ===================================================================== */

const RISQUES_QUALITE = [
  {
    id: 'rq-gouv', domaine: 'Gouvernance et leadership', icone: '🏛️',
    objectif: 'Que la direction porte réellement la qualité, et pas seulement dans un document.',
    contexte: 'Cabinet de six personnes, un seul expert-comptable signataire, pas de responsable qualité désigné.',
    risque: 'La qualité repose entièrement sur une personne : son absence prolongée arrêterait la supervision.',
    importance: 'Élevée', occurrence: 'Possible',
    reponse: 'Supervision documentée dans ComplyEC, revue annuelle du système.',
    action: 'Désigner un responsable du système qualité et un suppléant.',
    responsable: 'martin', echeance: '2026-12-31', etat: 'a-valider',
  },
  {
    id: 'rq-deonto', domaine: 'Déontologie et indépendance', icone: '⚖️',
    objectif: 'Qu’aucune mission ne soit acceptée ou maintenue au mépris de l’indépendance.',
    contexte: 'Déclarations annuelles collectées ; deux dossiers au-dessus du seuil de dépendance que le cabinet s’est fixé.',
    risque: 'Un dossier devenu prépondérant altère le jugement sans que personne ne s’en aperçoive à temps.',
    importance: 'Élevée', occurrence: 'Rare',
    reponse: 'Seuil de dépendance surveillé, note d’indépendance établie au-delà.',
    action: 'Revoir le seuil à la clôture de chaque exercice.',
    responsable: 'martin', echeance: '2027-01-31', etat: 'valide',
  },
  {
    id: 'rq-accept', domaine: 'Acceptation et maintien des missions', icone: '🤝',
    objectif: 'Que chaque mission commence par une lettre et une analyse de vigilance.',
    contexte: 'Entrée en mission outillée dans ComplyEC ; des dossiers anciens restent sans lettre à jour.',
    risque: 'Une mission se poursuit sans lettre de mission actualisée, contrairement à la norme NP 2300.',
    importance: 'Élevée', occurrence: 'Avérée',
    reponse: 'Détection automatique des lettres absentes ou anciennes.',
    action: 'Refaire les lettres signalées par la régularisation des anciens dossiers.',
    responsable: 'julie', echeance: '2026-12-31', etat: 'a-valider',
  },
  {
    id: 'rq-real', domaine: 'Réalisation des missions', icone: '⚙️',
    objectif: 'Que le travail soit supervisé avant d’être remis au client.',
    contexte: 'Supervision annuelle tenue dans ComplyEC ; plusieurs dossiers sans note de synthèse validée.',
    risque: 'Des comptes sont remis sans revue par l’expert-comptable.',
    importance: 'Élevée', occurrence: 'Possible',
    reponse: 'Note de synthèse obligatoire avant remise, supervision tracée.',
    action: 'Traiter les supervisions manquantes avant la prochaine réunion bilan.',
    responsable: 'martin', echeance: '2026-11-30', etat: 'a-valider',
  },
  {
    id: 'rq-ressources', domaine: 'Ressources humaines et matérielles', icone: '👥',
    objectif: 'Que chacun soit formé et outillé pour ce qu’on lui demande.',
    contexte: 'Cinq collaborateurs, deux sessions LBC-FT par an, attestations partiellement collectées.',
    risque: 'Un collaborateur traite un dossier sans la formation LBC-FT exigée par l’article L. 561-33.',
    importance: 'Moyenne', occurrence: 'Possible',
    reponse: 'Programme annuel de formation, suivi des attestations.',
    action: 'Relancer les attestations manquantes avant la clôture.',
    responsable: 'martin', echeance: '2026-12-15', etat: 'a-valider',
  },
  {
    id: 'rq-info', domaine: 'Information et communication', icone: '📡',
    objectif: 'Que les procédures soient connues, pas seulement écrites.',
    contexte: 'Manuel de procédures en cours de rédaction, accusés de lecture partiellement signés.',
    risque: 'Les procédures existent mais ne sont pas appliquées faute d’être connues.',
    importance: 'Moyenne', occurrence: 'Possible',
    reponse: 'Diffusion tracée avec accusé de lecture par version.',
    action: 'Relancer les accusés manquants après la publication du manuel.',
    responsable: 'martin', echeance: '2027-02-28', etat: 'a-valider',
  },
  {
    id: 'rq-surveillance', domaine: 'Surveillance et actions correctives', icone: '🔬',
    objectif: 'Que le système se contrôle lui-même et se corrige.',
    contexte: 'Surveillance annuelle à mettre en place ; registre des non-conformités ouvert en 2026.',
    risque: 'Les défauts se répètent faute d’être relevés et corrigés.',
    importance: 'Élevée', occurrence: 'Possible',
    reponse: 'Contrôle annuel d’un échantillon de dossiers, registre des non-conformités.',
    action: 'Réaliser la première campagne de surveillance annuelle.',
    responsable: 'martin', echeance: '2026-12-31', etat: 'a-valider',
  },
  {
    id: 'rq-secret', domaine: 'Secret professionnel et sécurité', icone: '🔒',
    objectif: 'Que les données des clients restent chez le cabinet et ses prestataires autorisés.',
    contexte: 'Six outils accèdent aux données ; le test de restauration des sauvegardes n’est pas documenté.',
    risque: 'Une perte de données ne pourrait pas être réparée, faute de restauration éprouvée.',
    importance: 'Élevée', occurrence: 'Rare',
    reponse: 'Sauvegarde quotidienne, double authentification sur les accès sensibles.',
    action: 'Faire réaliser et documenter un test de restauration par l’infogérant.',
    responsable: 'martin', echeance: '2026-12-31', etat: 'a-valider',
  },
];

const QUALITE_DERNIERE_REVUE = '2026-01-20';

function risquesQualiteAValider() { return dbRisquesQualite().filter(r => r.etat !== 'valide'); }

/* Registre des non-conformités — NPMQ, composante Surveillance et actions
   correctives. Une non-conformité n'est close qu'une fois son efficacité
   vérifiée : c'est ce qui distingue une action corrective d'une intention. */
const NON_CONFORMITES = [
  {
    id: 'nc-1', date: '2026-04-05', origine: 'Réclamation client', reference: 'rec-2',
    dossier: 'sas-nova', gravite: 'Majeure', portee: 'systemique',
    constat: 'Des honoraires ont été facturés au-delà de ce que prévoyait la lettre de mission.',
    incidence: 'Réclamation du client, avoir de 340 € émis, risque de contestation sur d’autres dossiers.',
    cause: 'La lettre de mission n’avait pas été actualisée après l’extension de la mission à la paie.',
    action: 'Revue systématique des lettres de mission lors de toute extension de mission.',
    responsable: 'martin', echeance: '2026-07-31',
    efficacite: null,
  },
  {
    id: 'nc-2', date: '2026-06-18', origine: 'Supervision', reference: null,
    dossier: 'eurl-nordic', gravite: 'Mineure', portee: 'isole',
    constat: 'Le dossier permanent ne contenait pas les statuts à jour après la modification de 2025.',
    incidence: 'Aucune conséquence sur les comptes ; pièce manquante au dossier.',
    cause: 'Oubli au moment de la mise à jour du dossier permanent.',
    action: 'Statuts récupérés et classés ; rappel de la procédure au collaborateur.',
    responsable: 'heddy', echeance: '2026-07-15',
    efficacite: { date: '2026-08-20', constat: 'Contrôle du dossier permanent : pièces complètes.', concluant: true },
  },
  {
    id: 'nc-3', date: '2026-09-02', origine: 'Contrôle interne', reference: null,
    dossier: 'sci-riviera', gravite: 'Majeure', portee: 'isole',
    constat: 'Aucune analyse de vigilance LBC-FT n’a été réalisée depuis l’entrée en relation.',
    incidence: 'Manquement à l’obligation de vigilance de l’article L. 561-5 du code monétaire et financier.',
    cause: null, action: null, responsable: null, echeance: null,
    efficacite: null,
  },
].map(n => Object.assign(n, { etat: etatNonConformite(n) }));

/* L'état se déduit des faits au lieu d'être stocké à côté d'eux : une
   non-conformité « en attente d'efficacité » dont l'échéance n'est pas encore
   passée serait une contradiction, et c'est exactement l'incohérence qu'un
   champ recopié finit par produire. */
function etatNonConformite(n) {
  if (!n.action) return 'ouverte';
  if (n.efficacite) return 'cloturee';
  return 'attente-efficacite';
}

const NC_ETATS = {
  ouverte: { label: 'Ouverte', couleur: 'rouge' },
  'attente-efficacite': { label: 'Efficacité à vérifier', couleur: 'orange' },
  cloturee: { label: 'Clôturée', couleur: 'vert' },
};

const NC_GRAVITES = ['Mineure', 'Majeure', 'Critique'];

function ncOuvertes() { return dbNonConformites().filter(n => n.etat !== 'cloturee'); }

/* Surveillance annuelle — les critères de sélection de l'échantillon. La NPMQ
   demande un échantillon motivé, pas un tirage au sort : chaque dossier retenu
   doit l'être pour une raison que le cabinet peut expliquer. */
const CRITERES_ECHANTILLON = [
  { code: 'signataire', label: 'Au moins un dossier par signataire', actif: true },
  { code: 'renforcee', label: 'Tout dossier en vigilance renforcée', actif: true },
  { code: 'nouvelle', label: 'Toute relation nouée dans l’année', actif: true },
  { code: 'social', label: 'Au moins un dossier avec mission sociale', actif: true },
  { code: 'reclamation', label: 'Tout dossier ayant fait l’objet d’une réclamation', actif: true },
];

/* Les six étapes du programme annuel de surveillance (§ 11.1).

   La NPMQ (arrêté du 30 mai 2024, applicable depuis le 1er janvier 2025) demande
   au cabinet de surveiller son propre système : arrêter un programme, contrôler
   un échantillon de dossiers, consigner ses constats, décider des actions, puis
   porter une conclusion annuelle. Ces cinq moments plus le choix de
   l'échantillon font un seul processus, qui vit dans un seul écran — et non
   trois rubriques de menu séparées. */
const SURVEILLANCE_PROGRAMME = [
  { code: 'programme', label: 'Programme', resume: 'Ce que le cabinet décide de contrôler cette année, et pourquoi.' },
  { code: 'echantillon', label: 'Échantillon', resume: 'Les dossiers retenus et le motif de chaque choix.' },
  { code: 'controle', label: 'Contrôle', resume: 'Les points vérifiés sur chaque dossier de l’échantillon.' },
  { code: 'constats', label: 'Constats', resume: 'Ce qui a été relevé, dossier par dossier.' },
  { code: 'actions', label: 'Actions correctives', resume: 'Ce que le cabinet décide de corriger, et sous quel délai.' },
  { code: 'evaluation', label: 'Évaluation annuelle', resume: 'La conclusion portée sur le système de management de la qualité.' },
];

function etapeSurveillance(code) {
  const i = SURVEILLANCE_PROGRAMME.findIndex(e => e.code === code);
  return i < 0 ? null : Object.assign({ rang: i + 1 }, SURVEILLANCE_PROGRAMME[i]);
}

const ECHANTILLON_SURVEILLANCE = [
  { dossier: 'sas-nova', motif: 'Vigilance renforcée et réclamation client en avril' },
  { dossier: 'sci-durand', motif: 'Dossier au-dessus du seuil de dépendance économique' },
  { dossier: 'sarl-dupont-immo', motif: 'Relation nouée dans l’année' },
  { dossier: 'eurl-nordic', motif: 'Non-conformité relevée en juin' },
  { dossier: 'sas-atlantique', motif: 'Mission sociale — bulletins de paie' },
  { dossier: 'sci-martin', motif: 'Dossier du signataire non couvert par les autres critères' },
];

/* Les points contrôlés sur chaque dossier de l'échantillon. Chacun renvoie à
   ce que ComplyEC sait déjà : le contrôleur vérifie, il ne ressaisit pas. */
const POINTS_CONTROLE = [
  { code: 'ldm', label: 'Lettre de mission signée et à jour', source: 'Entrée en mission' },
  { code: 'vigilance', label: 'Analyse de vigilance LBC-FT au dossier', source: 'LBC-FT — portefeuille' },
  { code: 'dp', label: 'Dossier permanent complet', source: 'Dossiers & anomalies' },
  { code: 'supervision', label: 'Note de synthèse validée par l’expert-comptable', source: 'Cycle client — supervision' },
  { code: 'archivage', label: 'Classement conforme à la procédure du cabinet', source: 'Arborescence Drive' },
  { code: 'facturation', label: 'Honoraires conformes à la lettre de mission', source: 'Quadra' },
];

const CONTROLE_VERDICTS = {
  conforme: { label: 'Conforme', couleur: 'vert', puce: '✓' },
  'non-conforme': { label: 'Non conforme', couleur: 'rouge', puce: '✗' },
  'sans-objet': { label: 'Sans objet', couleur: 'gris', puce: '–' },
};

/* Évaluation annuelle du système — la conclusion que la NPMQ demande à
   l'expert-comptable de porter chaque année. Les trois options sont celles de
   la norme : le logiciel prépare les faits, l'humain conclut. */
const EVALUATION_CONCLUSIONS = [
  { code: 'adapte', label: 'Adapté et efficace', detail: 'Le système atteint ses objectifs ; aucune défaillance significative relevée.' },
  { code: 'ameliorations', label: 'Adapté avec améliorations', detail: 'Le système atteint ses objectifs ; des points d’amélioration sont identifiés et suivis.' },
  { code: 'insuffisant', label: 'Insuffisant', detail: 'Une ou plusieurs défaillances empêchent le système d’atteindre ses objectifs.' },
];

function faitsEvaluationAnnuelle() {
  return [
    { code: 'risques', libelle: 'Risques qualité revus', valeur: `${dbRisquesQualite().filter(r => r.etat === 'valide').length} sur ${dbRisquesQualite().length}`,
      detail: `Dernière revue le ${formatDate(QUALITE_DERNIERE_REVUE)}.` },
    { code: 'nc', libelle: 'Non-conformités', valeur: String(dbNonConformites().length),
      detail: `${ncOuvertes().length} ${pluriel(ncOuvertes().length, 'reste', 'restent')} à clôturer.` },
    { code: 'reclamations', libelle: 'Réclamations', valeur: String(dbReclamations().length),
      detail: `${reclamationsOuvertes().length} ${pluriel(reclamationsOuvertes().length, 'en cours')}.` },
    { code: 'surveillance', libelle: 'Dossiers contrôlés', valeur: `0 sur ${ECHANTILLON_SURVEILLANCE.length}`,
      detail: 'La campagne de surveillance annuelle n’a pas encore été menée.' },
  ];
}

/* =====================================================================
   Le manuel de procédures — phase 7 de la refonte V3
   =====================================================================

   Six grandes parties et six annexes, conformes au § 8 du cahier. La
   structure suit celle du cabinet : ComplyEC ne produit pas un manuel
   « simplifié » qui oublierait des sujets.

   Ce qui change, c'est l'origine des phrases. Chaque partie dit d'où elle
   vient : d'un module vivant, d'une source documentaire, ou d'une question
   posée une fois dans l'assistant des informations manquantes. Aucune partie
   ne possède sa copie privée d'une variable — la règle de source unique du
   § 1.3 vaut d'abord pour le manuel, puisque c'est lui qui les rassemble
   toutes.
   ===================================================================== */

const MANUEL_PARTIES = [
  {
    code: 'preambule', titre: 'Préambule & présentation', icone: '📖',
    themes: 'Objet et finalité du manuel, présentation du cabinet, inscription à l’Ordre, diffusion et confidentialité.',
    origine: 'Référentiel du cabinet et clauses validées.',
    variables: ['cabinet.denomination', 'cabinet.forme', 'cabinet.adresse', 'cabinet.inscription'],
  },
  {
    code: 'gouvernance', titre: 'Gouvernance & règles professionnelles', icone: '🏛️',
    themes: 'Direction et responsabilités, politique qualité, indépendance, conflits d’intérêts, secret professionnel, confraternité, assurances.',
    origine: 'Gouvernance, indépendance et dépendance économique ; l’assurance vient d’une source déposée, jamais d’une saisie.',
    variables: ['orga.gerant', 'orga.responsableQualite', 'cabinet.assureur', 'cabinet.police'],
  },
  {
    code: 'ressources', titre: 'Ressources & moyens', icone: '🧰',
    themes: 'Fonctions et recrutement, formation, affectation, documentation technique, système d’information, infogérance, RGPD, locaux et administration interne.',
    origine: 'Équipe, formation, outils et prestataires, RGPD ; les locaux et l’administration interne passent par l’assistant des informations manquantes.',
    variables: ['orga.effectif', 'info.infogerant', 'info.hebergement', 'info.sauvegarde', 'info.testRestauration', 'rgpd.nbTraitements'],
  },
  {
    code: 'cycle', titre: 'Cycle de la relation client et des missions', icone: '🔄',
    themes: 'Acceptation des missions, lettres de mission, planification, supervision, documentation, honoraires et impayés, réclamations, archives.',
    origine: 'Entrée en mission, supervision et registre des réclamations. Le maintien et la sortie sont décrits mais restent opérés dans Quadra.',
    variables: ['cabinet.denomination'],
  },
  {
    code: 'lbcft', titre: 'Lutte contre le blanchiment', icone: '🔍',
    themes: 'Classification des risques, identification du client et des bénéficiaires effectifs, personnes politiquement exposées, gel des avoirs, vigilance, déclaration à Tracfin, formation et contrôle.',
    origine: 'Analyses de dossier, campagnes, cartographie LBC-FT et rôles désignés.',
    variables: ['lbcft.declarant', 'lbcft.correspondant', 'lbcft.derniereCartographie'],
  },
  {
    code: 'qualite', titre: 'Surveillance & qualité', icone: '🎯',
    themes: 'Risques qualité, surveillance continue et périodique, non-conformités, évaluation annuelle, organisation de la qualité, mise à jour du manuel.',
    origine: 'Cartographie qualité, non-conformités, surveillance annuelle et évaluation.',
    variables: ['orga.responsableQualite'],
  },
];

/* Les six annexes sont des instantanés de registres vivants : elles ne se
   rédigent pas, elles se datent. C'est ce qui les rend opposables. */
const MANUEL_ANNEXES = [
  { code: 'a1', titre: 'Cartographie des risques qualité', source: 'Surveillance & qualité', compte: () => RISQUES_QUALITE.length },
  { code: 'a2', titre: 'Classification des risques LBC-FT', source: 'LBC-FT — cartographie', compte: () => dbVigilanceDossiers().filter(d => d.statut === 'complete').length },
  { code: 'a3', titre: 'Registre des réclamations', source: 'Cycle de la relation client', compte: () => RECLAMATIONS.length },
  { code: 'a4', titre: 'Registre des non-conformités', source: 'Surveillance & qualité', compte: () => NON_CONFORMITES.length },
  { code: 'a5', titre: 'Registre des activités de traitement', source: 'RGPD & données', compte: () => TRAITEMENTS_RGPD.length },
  { code: 'a6', titre: 'Programme annuel de surveillance', source: 'Surveillance annuelle', compte: () => ECHANTILLON_SURVEILLANCE.length },
];

/* L'état d'une partie se déduit de ses variables : une partie est prête quand
   toutes celles qu'elle reprend sont confirmées ou récupérées automatiquement.
   Rien n'est stocké, donc rien ne peut mentir. */
function etatPartieManuel(partie) {
  const infos = partie.variables.map(c => dbInfo(c)).filter(Boolean);
  const bloquantes = infos.filter(i => i.statut === 'a_renseigner' || i.statut === 'contradictoire');
  const aConfirmer = infos.filter(i => i.statut === 'a_confirmer');
  return {
    variables: infos,
    manquantes: bloquantes,
    aConfirmer,
    pret: bloquantes.length === 0 && aConfirmer.length === 0,
    bloque: bloquantes.length > 0,
  };
}

function manuelPretAGenerer() {
  return MANUEL_PARTIES.every(p => !etatPartieManuel(p).bloque);
}

/* Versions publiées. Une version publiée est immuable : le cahier l'écrit deux
   fois, et c'est ce qui permet à un contrôleur de savoir quelles règles le
   cabinet s'appliquait à une date donnée. */
const MANUEL_VERSIONS = [
  {
    numero: 'v1.0', date: '2025-03-12', dateEffet: '2025-04-01',
    objet: 'Première version du manuel, établie à l’entrée en vigueur de la NPMQ.',
    approbateur: 'martin', dateApprobation: '2025-03-12',
    diffusion: { date: '2025-03-14', destinataires: ['julie', 'nathalie', 'heddy'], accuses: ['julie', 'nathalie'] },
    statut: 'remplacee',
  },
  {
    numero: 'v2.0', date: '2026-02-24', dateEffet: '2026-03-01',
    objet: 'Refonte des chapitres LBC-FT après la désignation du déclarant et du correspondant Tracfin.',
    approbateur: 'martin', dateApprobation: '2026-02-24',
    diffusion: { date: '2026-02-26', destinataires: ['julie', 'nathalie', 'heddy', 'thomas'], accuses: ['julie', 'heddy'] },
    statut: 'en-vigueur',
  },
];

const MANUEL_VERSION_STATUTS = {
  'en-vigueur': { label: 'En vigueur', couleur: 'vert' },
  remplacee: { label: 'Remplacée', couleur: 'gris' },
};

function manuelVersionEnVigueur() {
  return dbManuelVersions().find(v => v.statut === 'en-vigueur') || null;
}

function prochainNumeroManuel() {
  const v = manuelVersionEnVigueur();
  if (!v) return 'v1.0';
  const majeur = Number(String(v.numero).replace(/^v/, '').split('.')[0]) || 1;
  return `v${majeur + 1}.0`;
}

/* Le texte d'une partie, composé à partir des données confirmées. Ce n'est pas
   une rédaction libre : chaque phrase reprend une variable du référentiel ou
   une clause validée, et une valeur absente se voit — elle n'est pas comblée
   par une formule creuse. */
function texteManuelPartie(code) {
  const partie = MANUEL_PARTIES.find(p => p.code === code);
  // Le texte lit la couche de données, jamais la semence : une valeur changée
  // dans un écran doit s'imprimer telle quelle dans le manuel.
  const v = cle => dbValeur(cle, '[à renseigner]');
  const entete = [
    partie.titre.toUpperCase(),
    '',
  ];
  const corps = {
    preambule: [
      `Le présent manuel décrit l'organisation et les procédures de ${v('cabinet.denomination')},`,
      `${v('cabinet.forme').toLowerCase()} dont le siège est situé ${v('cabinet.adresse')}, inscrite au tableau`,
      `de l'Ordre des experts-comptables sous le numéro ${v('cabinet.inscription')}.`,
      '',
      'Il est établi en application de la norme professionnelle de management de la',
      'qualité, applicable depuis le 1er janvier 2025, et du code de déontologie des',
      'professionnels de l\'expertise comptable (décret n° 2012-432 du 30 mars 2012).',
      '',
      'Il est diffusé à l\'ensemble des collaborateurs du cabinet et couvert par le',
      'secret professionnel. Sa reproduction hors du cabinet est interdite.',
    ],
    gouvernance: [
      `La direction du cabinet est assurée par ${v('orga.gerant')}, gérant et`,
      'expert-comptable signataire.',
      '',
      `La responsabilité du système de management de la qualité est confiée à`,
      `${v('orga.responsableQualite')}.`,
      '',
      'INDÉPENDANCE',
      'Chaque collaborateur souscrit une déclaration annuelle d\'indépendance. Le',
      'cabinet surveille la part que représente chaque dossier dans ses honoraires et',
      'établit une note de sauvegarde au-delà du seuil qu\'il s\'est fixé.',
      '',
      'ASSURANCE',
      `Le cabinet est assuré auprès de ${v('cabinet.assureur')}, police n° ${v('cabinet.police')}.`,
    ],
    ressources: [
      `Le cabinet compte ${v('orga.effectif')}.`,
      '',
      'FORMATION',
      'Un programme annuel de formation est arrêté chaque année. La formation à la',
      'lutte contre le blanchiment est obligatoire pour tous les collaborateurs',
      '(article L. 561-33 du code monétaire et financier) ; les justificatifs sont',
      'conservés.',
      '',
      'SYSTÈME D\'INFORMATION',
      `La maintenance informatique est confiée à ${v('info.infogerant')}.`,
      `Les données sont hébergées ${v('info.hebergement')}.`,
      `Les sauvegardes sont réalisées selon la périodicité suivante : ${v('info.sauvegarde')}.`,
      `Dernier test de restauration : ${v('info.testRestauration')}.`,
      '',
      'PROTECTION DES DONNÉES',
      `Le registre des activités de traitement comporte ${v('rgpd.nbTraitements')}.`,
    ],
    cycle: [
      'ACCEPTATION DES MISSIONS',
      'Aucune mission n\'est engagée sans lettre de mission signée et sans analyse de',
      'vigilance au titre de la lutte contre le blanchiment.',
      '',
      'LETTRES DE MISSION',
      'Les lettres de mission sont établies à partir des modèles du cabinet et',
      'comportent les mentions de la norme professionnelle NP 2300.',
      '',
      'SUPERVISION',
      'Chaque mission fait l\'objet d\'une note de synthèse validée par',
      'l\'expert-comptable avant remise des travaux au client.',
      '',
      'RÉCLAMATIONS',
      'Toute réclamation est inscrite au registre, traitée et close par une réponse',
      'écrite. Une réclamation révélant une défaillance donne lieu à une',
      'non-conformité.',
      '',
      'MAINTIEN ET SORTIE DE MISSION',
      'Les procédures de maintien et de sortie sont décrites ci-après ; leur suivi',
      'opérationnel est assuré dans l\'outil de production du cabinet.',
    ],
    lbcft: [
      'CLASSIFICATION DES RISQUES',
      'Le cabinet établit et tient à jour une classification des risques de',
      'blanchiment et de financement du terrorisme, en application de l\'article',
      'L. 561-4-1 du code monétaire et financier.',
      '',
      'RÔLES DÉSIGNÉS',
      `Déclarant Tracfin : ${v('lbcft.declarant')}.`,
      `Correspondant Tracfin : ${v('lbcft.correspondant')}.`,
      'Ces deux rôles sont distincts au sens de l\'article R. 561-23 du code monétaire',
      'et financier, et déclarés à Tracfin comme à l\'autorité de contrôle.',
      '',
      'VIGILANCE',
      'Chaque dossier fait l\'objet d\'une analyse cotant quatre critères, et d\'un',
      'niveau de vigilance retenu par le référent. Les bénéficiaires effectifs sont',
      'identifiés et vérifiés ; toute divergence avec le registre est signalée à',
      'l\'INPI (article L. 561-45-1).',
      '',
      `Dernière cartographie arrêtée : ${v('lbcft.derniereCartographie')}.`,
    ],
    qualite: [
      'RISQUES QUALITÉ',
      'Le cabinet identifie ses risques qualité par domaine du système de management',
      'de la qualité, et arrête pour chacun une réponse, un responsable et une',
      'échéance.',
      '',
      'SURVEILLANCE',
      'Un échantillon de dossiers est contrôlé chaque année selon des critères',
      'arrêtés par le cabinet. Les constats donnent lieu à des non-conformités',
      'suivies jusqu\'à vérification de leur efficacité.',
      '',
      'ÉVALUATION ANNUELLE',
      `${v('orga.responsableQualite')} conclut chaque année sur l'efficacité du système.`,
      '',
      'MISE À JOUR DU MANUEL',
      'Le manuel est revu à chaque évolution significative de l\'organisation ou de la',
      'réglementation. Une version publiée n\'est jamais modifiée : elle est remplacée.',
    ],
  };
  return entete.concat(corps[code] || []).join('\n');
}

/* Les trois vérifications externes de l'étape « Vérifications » du parcours de
   vigilance (§ 22.3 du prompt V6).

   Elles remplacent les cinq bases interrogeables de la version précédente, qui
   renvoyaient un résultat fabriqué : le logiciel affirmait « Aucune
   correspondance » sans avoir rien consulté. C'était le pire des faux succès
   possibles — un expert-comptable qui s'en serait prévalu devant Tracfin aurait
   attesté d'un contrôle qui n'avait pas eu lieu.

   Aucun connecteur n'étant raccordé, ComplyEC ne consulte rien : il enregistre
   ce que l'expert-comptable a constaté, avec la date, la source et sa
   conclusion. C'est exactement ce que le registre des capacités appelle le mode
   « manual », et c'est opposable à un contrôleur.

   Les trois références sont vérifiées et datées :
     — registre des bénéficiaires effectifs : CMF art. L. 561-2-2, L. 561-5 et
       L. 561-45-1 pour l'obligation de signalement des divergences ;
     — gel des avoirs et sanctions : CMF art. L. 562-4 ;
     — pays à haut risque : liste des pays tiers à haut risque annexée au
       règlement délégué (UE) 2016/1675 du 14 juillet 2016, que l'article
       L. 561-10 du code monétaire et financier rend opposable.

   Un « arrêté du 27 juillet 2023 » figurait ici pour la liste des pays à haut
   risque. Recherche faite sur Légifrance, aucun texte de cette date ne porte
   cet objet : la référence a été remplacée par celle qui a pu être vérifiée.
   C'est la deuxième fois qu'une référence non vérifiée se glisse dans un
   livrable, après le décret 2007-1387. */
const VIGILANCE_VERIFICATIONS = [
  {
    code: 'rbe',
    icone: '🏛️',
    label: 'Registre des bénéficiaires effectifs',
    detail: 'Confronter les bénéficiaires déclarés au registre tenu par l’INPI et relever tout écart avec les statuts.',
    source: 'CMF art. L. 561-2-2 et L. 561-5',
    ou: 'data.inpi.fr',
    capacite: 'rbe',
  },
  {
    code: 'gel',
    icone: '🚫',
    label: 'Gel des avoirs et sanctions',
    detail: 'Vérifier que ni le client, ni ses bénéficiaires effectifs, ni ses dirigeants ne font l’objet d’une mesure de gel ou d’une sanction internationale.',
    source: 'CMF art. L. 562-4',
    ou: 'gels-avoirs.dgtresor.gouv.fr et liste consolidée de l’Union européenne',
    capacite: 'sanctionsGel',
  },
  {
    code: 'pays',
    icone: '🌍',
    label: 'Pays ou zones à risque',
    detail: 'Vérifier si le client, ses bénéficiaires effectifs ou ses flux se rattachent à un pays figurant sur la liste des pays à haut risque.',
    source: 'Liste des pays tiers à haut risque annexée au règlement délégué (UE) 2016/1675 ; CMF art. L. 561-10',
    ou: 'Liste annexée au règlement délégué, telle que modifiée à ce jour',
    capacite: 'registreLegal',
  },
];

const VIGILANCE_ISSUES = [
  { code: 'ok', libelle: 'Aucun élément identifié', ton: 'vert' },
  { code: 'examen', libelle: 'Élément à examiner', ton: 'orange' },
];

function verificationVigilance(code) {
  return VIGILANCE_VERIFICATIONS.find(v => v.code === code) || null;
}

/* Les dossiers qui demandent l'attention de l'expert-comptable — § 23 du V6.

   À ne pas confondre avec la couverture du portefeuille, qui mesure si chaque
   dossier a été analysé. Un portefeuille entièrement couvert peut contenir
   trois dossiers sensibles, et un portefeuille à moitié couvert n'en contenir
   aucun : les deux questions sont distinctes, et les mélanger conduisait à
   croire le travail fini parce que le compteur de couverture était plein.

   Les motifs viennent tous d'un fait constaté, jamais d'une appréciation :
   niveau renforcé retenu, personne politiquement exposée, divergence relevée
   au registre des bénéficiaires effectifs, ou contrôle ciblé positif. */
function dossiersSensiblesLbcft() {
  const divergences = rbeDivergences().map(r => r.dossier);
  const controlesPositifs = dbControles().filter(c => c.resultat === 'positif').map(c => c.dossier);

  return dbVigilanceDossiers().map(d => {
    const motifs = [];
    if (d.niveauRetenu === 'Renforcée') motifs.push('Vigilance renforcée retenue');
    if ((d.operationsParticulieres || []).some(o => /politiquement exposée|PPE/i.test(o))) {
      motifs.push('Personne politiquement exposée');
    }
    if (divergences.includes(d.dossier)) motifs.push('Divergence au registre des bénéficiaires effectifs');
    if (controlesPositifs.includes(d.dossier)) motifs.push('Contrôle ciblé positif à examiner');
    if (!motifs.length) return null;

    /* Un dossier sensible est traité quand son analyse est à jour et que des
       mesures y ont été consignées. Ouvrir sa fiche ne suffit pas : le § 24
       l'interdit explicitement pour les contrôles, et la raison vaut ici. */
    const mesures = (d.mesures || []).length;
    const aJour = d.statut === 'complete' && d.derniereAnalyse
      && Math.round((new Date('2026-09-13T00:00:00') - new Date(d.derniereAnalyse + 'T00:00:00'))
        / (1000 * 60 * 60 * 24 * 30.44)) < VIGILANCE_PERIODICITE_MOIS;

    return {
      dossier: d.dossier,
      motifs,
      principal: motifs[0],
      niveau: d.niveauRetenu || null,
      derniereAnalyse: d.derniereAnalyse || null,
      mesures,
      traite: !!(aJour && mesures > 0),
      reste: aJour
        ? (mesures ? null : 'Aucune mesure n’est consignée pour ce dossier.')
        : 'L’analyse doit être mise à jour avant de conclure.',
    };
  }).filter(Boolean);
}

/* =====================================================================
   REFONTE — Le formulaire cabinet du manuel (§ 6)
   =====================================================================

   Le manuel a besoin de quelques informations que ComplyEC ne peut pas
   déduire : ce que le cabinet facture, comment il est composé, avec quoi il
   travaille. Trois étapes, et rien d'autre.

   Deux questions sont explicitement écartées (§ 17) :

   — le nombre total de dossiers : il se compte à partir de la liste clients
     importée, et une liste importée vaut mieux qu'un nombre recopié ;
   — la date de clôture majoritaire des clients : on retient le 31 décembre,
     qui est le cas de l'immense majorité des dossiers d'un cabinet français.

   Rien de ce qui figure déjà dans Paramètres n'est redemandé ici. */

const MANUEL_ETAPES = [
  { code: 'cabinet', label: 'Cabinet et activité' },
  { code: 'equipe', label: 'Équipe' },
  { code: 'informatique', label: 'Organisation informatique et moyens' },
];

/* Date de clôture retenue pour les dossiers clients. Elle n'est pas demandée :
   elle est posée, et le manuel l'écrit telle quelle. */
const CLOTURE_CLIENTS_RETENUE = '31 décembre';

/* Répartition de l'activité du cabinet. Les cinq postes couvrent ce qu'un
   cabinet facture ; leur somme doit faire 100 %, et l'écran le dit sans
   bloquer — un cabinet qui arrondit à 99 % n'a pas commis de faute. */
/* Répartition de l'activité du cabinet, en pourcentage. Une couleur par
   métier : cinq champs identiques côte à côte se confondent, cinq carrés
   colorés se retrouvent d'un coup d'œil. */
const MANUEL_ACTIVITES = [
  { code: 'tenue', label: 'Tenue', teinte: 'bleu' },
  { code: 'revision', label: 'Révision', teinte: 'violet' },
  { code: 'audit', label: 'Audit', teinte: 'ambre' },
  { code: 'social', label: 'Social', teinte: 'menthe' },
  { code: 'juridique', label: 'Juridique', teinte: 'acier' },
];

/* Composition de l'équipe. Les sept catégories sont celles d'un cabinet
   d'expertise comptable ; elles se comptent, elles ne se décrivent pas. */
const MANUEL_EQUIPE_CATEGORIES = [
  { code: 'experts', label: 'Experts-comptables' },
  { code: 'memorialistes', label: 'Mémorialistes' },
  { code: 'chefs', label: 'Chefs ou directeurs de mission' },
  { code: 'collaborateurs', label: 'Collaborateurs' },
  { code: 'alternants', label: 'Alternants' },
  { code: 'saisie', label: 'Aides à la saisie' },
  { code: 'administratif', label: 'Administratif' },
];

/* Organisation informatique et moyens.

   Questionnaire conditionnel : une question fermée, et un champ de précision
   qui n'apparaît que lorsqu'il a un sens. Demander le nom de l'infogérant à un
   cabinet qui n'en a pas est la meilleure façon de faire remplir n'importe
   quoi.

   `suite` décrit ce qui s'ouvre, et pour quelle réponse. */
/* Les catégories de l'organisation informatique, et sur quelle page chacune
   se remplit. Douze questions à la suite formaient un mur : on ne savait pas
   où l'on en était, ni ce qui restait. Elles se rangent donc par nature, sur
   deux pages : les logiciels d'un côté, les moyens matériels de l'autre. */
const MANUEL_INFORMATIQUE_GROUPES = [
  { code: 'logiciels', label: 'Les logiciels du cabinet', page: 1, teinte: 'bleu' },
  { code: 'acces', label: 'Les accès et les mots de passe', page: 1, teinte: 'violet' },
  { code: 'serveurs', label: 'Les serveurs et les sauvegardes', page: 2, teinte: 'menthe' },
  { code: 'locaux', label: 'Les locaux', page: 2, teinte: 'ambre' },
];

const MANUEL_INFORMATIQUE_PAGES = [
  { numero: 1, label: 'Logiciels et accès' },
  { numero: 2, label: 'Serveurs, sauvegardes et locaux' },
];

const MANUEL_INFORMATIQUE = [
  { code: 'production', groupe: 'logiciels', label: 'Logiciel de production comptable',
    suite: { si: 'oui', code: 'productionNom', label: 'Lequel ?' } },
  { code: 'paie', groupe: 'logiciels', label: 'Logiciel de paie',
    suite: { si: 'oui', code: 'paieNom', label: 'Lequel ?' } },
  { code: 'juridique', groupe: 'logiciels', label: 'Logiciel juridique',
    suite: { si: 'oui', code: 'juridiqueNom', label: 'Lequel ?' } },
  { code: 'precompta', groupe: 'logiciels', label: 'Outil de pré-comptabilité',
    suite: { si: 'oui', code: 'precomptaNom', label: 'Lequel ?' } },
  { code: 'ged', groupe: 'logiciels', label: 'Espace documentaire ou GED',
    suite: { si: 'oui', code: 'gedNom', label: 'Lequel ?' } },
  { code: 'motsDePasse', groupe: 'acces', label: 'Gestionnaire de mots de passe',
    suite: { si: 'oui', code: 'motsDePasseNom', label: 'Lequel ?' } },
  { code: 'serveurInterne', groupe: 'serveurs', label: 'Serveur interne' },
  { code: 'serveurInfogere', groupe: 'serveurs', label: 'Serveur infogéré',
    suite: { si: 'oui', code: 'infogerant', label: 'Nom de l’infogérant' } },
  { code: 'sauvegarde', groupe: 'serveurs', label: 'Sauvegarde du cabinet',
    suite: { si: 'oui', code: 'sauvegardePrestataire', label: 'Prestataire ou solution' } },
  { code: 'restauration', groupe: 'serveurs', label: 'Test de restauration réalisé',
    suite: { si: 'oui', code: 'restaurationDate', label: 'Date du dernier test', type: 'date' } },
  { code: 'mfa', groupe: 'acces', label: 'Double authentification (MFA)',
    suite: { si: 'oui', code: 'mfaPerimetre', label: 'Sur quels accès ?' } },
  { code: 'alarme', groupe: 'locaux', label: 'Alarme ou télésurveillance des locaux',
    suite: { si: 'oui', code: 'alarmePrestataire', label: 'Prestataire' } },
];

/* Les trois réponses possibles. « Sans objet » n'est pas « Non » : un cabinet
   sans serveur n'a pas de serveur non sauvegardé, il n'a pas de serveur. */
const MANUEL_REPONSES = [
  { code: 'oui', label: 'Oui' },
  { code: 'non', label: 'Non' },
  { code: 'na', label: 'Sans objet' },
];

/* Colonnes attendues dans la liste clients importée. Seul le nom est
   obligatoire : c'est lui qui fait un dossier. */
const IMPORT_CLIENTS_COLONNES = [
  { code: 'nom', label: 'Nom du client', obligatoire: true,
    motifs: ['nom', 'client', 'raison sociale', 'denomination', 'dénomination'] },
  { code: 'siren', label: 'SIREN ou SIRET', obligatoire: false,
    motifs: ['siren', 'siret', 'identifiant'] },
  { code: 'forme', label: 'Forme juridique', obligatoire: false,
    motifs: ['forme', 'juridique', 'type'] },
  { code: 'collaborateur', label: 'Collaborateur', obligatoire: false,
    motifs: ['collaborateur', 'responsable', 'gestionnaire', 'charge'] },
];

/* Gouvernance du cabinet — valeurs de départ de la démonstration. */
const GOUVERNANCE_DEFAUT = {
  expertsInscrits: [
    { nom: 'Martin Dupont', numero: '14-0001234' },
  ],
  actionnariat: [
    { nom: 'Martin Dupont', part: 100 },
  ],
};
