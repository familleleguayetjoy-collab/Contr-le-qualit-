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

// Réglages du cabinet (identité, signature, connexions externes). Modifiables
// dans l'écran Paramètres — persistés uniquement en mémoire dans cette
// démonstration (pas encore de table Supabase dédiée).
const CABINET_SETTINGS_DEFAUT = {
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
  { code: 'piece_expiree', label: 'Pièces expirées', priorite: 'Haute' },
  { code: 'document_manquant', label: 'Documents manquants', priorite: 'Haute' },
  { code: 'supervision_manquante', label: 'Supervisions annuelles manquantes', priorite: 'Moyenne' },
  { code: 'classement_non_conforme', label: 'Classement non conforme', priorite: 'Faible' },
];

function categorieInfo(code) { return CATEGORIES_ANOMALIES.find(c => c.code === code); }

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
    { modele: 'Le cabinet est dirigé par {associes} associé(s). La responsabilité générale de la qualité est confiée à {referent}. Le pilotage du cabinet fait l’objet d’une réunion {reunion}. Les délégations de signature {delegation:sont formalisées par écrit|ne font pas l’objet d’une formalisation écrite à ce jour}.' },
  ],
  deontologie: [
    { code: 'declaration', label: 'À quelle fréquence les collaborateurs signent-ils leur déclaration d’indépendance ?', type: 'choix', options: ['À chaque exercice', 'À chaque entrée en relation', 'Les deux'] },
    { code: 'seuil', label: 'À partir de quelle part du chiffre d’affaires un dossier est-il considéré en dépendance économique ?', type: 'nombre', defaut: '10', suffixe: '%' },
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
    { code: 'sessions', label: 'Combien de sessions LBC-FT sont organisées par an ?', type: 'nombre', defaut: '2' },
    { code: 'suivi', label: 'Comment les attestations de formation sont-elles conservées ?', type: 'choix', options: ['Dans l’outil, dossier Formations', 'Dans le Drive du cabinet', 'Format papier'] },
    { modele: 'Le cabinet vise {heures} heures de formation par collaborateur et par an, conformément à l’obligation de mise à jour des connaissances de l’article 145 du code de déontologie. {sessions} session(s) consacrée(s) à la LBC-FT sont organisées chaque année. Les attestations sont conservées {suivi}.' },
  ],
  archivage: [
    { code: 'duree', label: 'Combien d’années les dossiers sont-ils conservés ?', type: 'nombre', defaut: '10' },
    { code: 'support', label: 'Sur quel support les dossiers sont-ils archivés ?', type: 'choix', options: ['Numérique uniquement', 'Papier uniquement', 'Numérique et papier'] },
    { code: 'restitution', label: 'Sous quel délai les documents du client lui sont-ils restitués en fin de mission ?', type: 'choix', options: ['Sous 15 jours', 'Sous 30 jours', 'Sous 2 mois'] },
    { modele: 'Les dossiers sont conservés {duree} ans sur support {support}. En fin de mission, les documents appartenant au client lui sont restitués {restitution}, le cabinet conservant copie des éléments nécessaires à la justification de ses diligences.' },
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
    dossiersASurveiller: [
      { dossier: 'sas-nova', partHonoraires: '6.2', seuil: '5', mesures: "Facturation au tarif standard du cabinet, absence de lien capitalistique avec le client, revue annuelle de la relation par un second expert-comptable associé." },
      { dossier: 'sci-durand', partHonoraires: '5.8', seuil: '5', mesures: "Diversification du portefeuille clients engagée, plafonnement des missions complémentaires confiées au cabinet, supervision renforcée de la mission." },
    ],
  },
  classificationRisquesLBCFT: {
    label: 'Classification des risques LBC-FT',
    derniereRevision: '2025-05-02',
    statut: 'Non révisée depuis 14 mois',
    detail: "La classification des risques LBC-FT du cabinet doit être révisée annuellement. La dernière revue date de mai 2025.",
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

// --- Notes de synthèse (module collaborateur > Dossiers existants) ----------

const NOTE_SYNTHESE_CHAMPS = [
  { code: 'rentabilite', label: 'Rentabilité du dossier' },
  { code: 'problemes', label: 'Problèmes comptables identifiés' },
  { code: 'continuite', label: "Continuité d'exploitation" },
  { code: 'sujets', label: 'Sujets à évoquer lors du bilan' },
];
