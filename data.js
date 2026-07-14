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
  { id: 'a02', dossier: 'sas-nova', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: "Pièce d'identité expirée", description: "La pièce d'identité du dirigeant est arrivée à expiration.", dateDetection: '2026-04-10', dernierAction: 'Relance envoyée le 02/05', statut: 'en_cours', dateDemandeEC: '2026-05-02', commentaire: "Pièce d'identité arrivée à expiration, à renouveler auprès du client." },
  { id: 'a03', dossier: 'sas-nova', categorie: 'document_manquant', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Bénéficiaires effectifs manquants', description: "Le registre des bénéficiaires effectifs n'a pas été collecté.", dateDetection: '2026-03-22', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-03', commentaire: "Document obligatoire dans le cadre de la vigilance LBC-FT." },
  { id: 'a04', dossier: 'sas-nova', categorie: 'classement_non_conforme', collaborateur: 'nathalie', priorite: 'Moyenne', titre: 'Classement non conforme', description: "L'arborescence Drive du dossier ne respecte pas le plan de classement du cabinet.", dateDetection: '2026-04-28', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "Les documents comptables ne sont pas classés dans les bons sous-dossiers." },

  { id: 'a05', dossier: 'sci-durand', categorie: 'piece_expiree', collaborateur: 'heddy', priorite: 'Haute', titre: "Pièce d'identité expirée", description: "Carte d'identité du gérant expirée depuis le 03/2026.", dateDetection: '2026-04-02', dernierAction: 'Relance envoyée le 01/05', statut: 'en_cours', dateDemandeEC: '2026-05-01', commentaire: "Pièce à renouveler avant la prochaine échéance de dépôt." },
  { id: 'a06', dossier: 'sci-durand', categorie: 'document_manquant', collaborateur: 'heddy', priorite: 'Haute', titre: 'Relevés bancaires manquants', description: 'Les relevés bancaires de mars et avril 2026 sont absents du Drive.', dateDetection: '2026-04-30', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Nécessaires pour finaliser le lettrage du dossier." },
  { id: 'a07', dossier: 'sci-durand', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission signée n’a été retrouvée dans le Drive.', dateDetection: '2026-03-12', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-04', commentaire: "Aucune lettre de mission trouvée dans le dossier Drive." },

  { id: 'a08', dossier: 'sarl-projet', categorie: 'document_manquant', collaborateur: 'julie', priorite: 'Haute', titre: 'Justificatifs de frais manquants', description: 'Plusieurs justificatifs de frais du T1 2026 sont manquants.', dateDetection: '2026-04-18', dernierAction: 'Relance envoyée le 03/05', statut: 'en_cours', dateDemandeEC: '2026-05-03', commentaire: "Justificatifs nécessaires pour la déductibilité des charges." },
  { id: 'a09', dossier: 'sarl-projet', categorie: 'piece_expiree', collaborateur: 'julie', priorite: 'Haute', titre: 'Attestation PPE expirée', description: "L'attestation PPE du dirigeant date de plus de 3 ans.", dateDetection: '2026-04-05', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "À renouveler dans le cadre de la vigilance LBC-FT." },
  { id: 'a10', dossier: 'sarl-projet', categorie: 'classement_non_conforme', collaborateur: 'julie', priorite: 'Moyenne', titre: 'Classement non conforme', description: 'Les pièces sociales sont classées dans le dossier comptable.', dateDetection: '2026-04-29', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "À reclasser selon le plan de classement du cabinet." },

  { id: 'a11', dossier: 'eurl-alpes', categorie: 'piece_expiree', collaborateur: 'thomas', priorite: 'Haute', titre: "Pièce d'identité expirée", description: "Pièce d'identité du dirigeant expirée.", dateDetection: '2026-04-08', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-04', commentaire: "À renouveler avant la clôture de l'exercice." },
  { id: 'a12', dossier: 'eurl-alpes', categorie: 'document_manquant', collaborateur: 'thomas', priorite: 'Haute', titre: 'KBIS manquant', description: 'Le dernier extrait KBIS n’a pas été collecté.', dateDetection: '2026-04-20', dernierAction: 'Relance envoyée le 28/04', statut: 'en_cours', dateDemandeEC: '2026-04-28', commentaire: "Document requis pour la mise à jour du dossier permanent." },

  { id: 'a13', dossier: 'sas-vision', categorie: 'classement_non_conforme', collaborateur: 'heddy', priorite: 'Faible', titre: 'Classement non conforme', description: 'Les factures fournisseurs ne sont pas nommées selon la convention du cabinet.', dateDetection: '2026-04-25', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Renommage à effectuer selon la convention AAAA-MM-fournisseur." },
  { id: 'a14', dossier: 'sas-vision', categorie: 'supervision_manquante', collaborateur: 'heddy', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "La supervision annuelle de l'exercice 2025 n'a pas encore été réalisée.", dateDetection: '2026-02-01', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-07', commentaire: "À planifier avant la prochaine réunion bilan." },

  { id: 'a15', dossier: 'sci-martin', categorie: 'lettre_mission', collaborateur: 'julie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission trouvée dans le dossier Drive.', dateDetection: '2026-03-12', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-02', commentaire: "Aucune lettre de mission trouvée dans le dossier Drive." },
  { id: 'a16', dossier: 'sarl-beta', categorie: 'lettre_mission', collaborateur: 'julie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Le dossier a été ouvert sans génération de lettre de mission.', dateDetection: '2026-03-18', dernierAction: 'Relance envoyée le 02/05', statut: 'en_cours', dateDemandeEC: '2026-05-02', commentaire: "Lettre de mission à générer via le module de contractualisation." },
  { id: 'a17', dossier: 'sas-vision', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Lettre de mission introuvable pour l’exercice en cours.', dateDetection: '2026-03-20', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-05', commentaire: "À régulariser rapidement, dossier en mission de présentation." },
  { id: 'a18', dossier: 'sas-innov', categorie: 'lettre_mission', collaborateur: 'nathalie', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Aucune lettre de mission signée retrouvée.', dateDetection: '2026-03-25', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-03', commentaire: "Dossier repris récemment, lettre de mission à établir en priorité." },
  { id: 'a19', dossier: 'eurl-nordic', categorie: 'lettre_mission', collaborateur: 'heddy', priorite: 'Critique', titre: 'Lettre de mission manquante', description: 'Lettre de mission non signée par le client.', dateDetection: '2026-04-01', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-06', commentaire: "Relance client à prévoir pour signature." },

  { id: 'a20', dossier: 'sci-lumiere', categorie: 'document_manquant', collaborateur: 'julie', priorite: 'Haute', titre: 'Bail commercial manquant', description: 'Le bail commercial actualisé n’a pas été transmis.', dateDetection: '2026-04-15', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-07', commentaire: "Nécessaire pour le contrôle des loyers comptabilisés." },
  { id: 'a21', dossier: 'sarl-alpha', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Pièce expirée', description: "Attestation d'assurance décennale expirée.", dateDetection: '2026-04-12', dernierAction: 'Relance envoyée le 30/04', statut: 'en_cours', dateDemandeEC: '2026-04-30', commentaire: "À renouveler auprès de l'assureur du client." },
  { id: 'a22', dossier: 'eurl-ocean', categorie: 'piece_expiree', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Pièce expirée', description: 'Passeport du dirigeant expiré.', dateDetection: '2026-04-14', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-08', commentaire: "À renouveler dans le cadre de la vigilance LBC-FT." },
  { id: 'a23', dossier: 'sci-riviera', categorie: 'document_manquant', collaborateur: 'nathalie', priorite: 'Haute', titre: 'Bénéficiaires effectifs manquants', description: 'Registre des bénéficiaires effectifs non transmis.', dateDetection: '2026-04-16', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-08', commentaire: "Document requis pour la vigilance LBC-FT." },

  { id: 'a24', dossier: 'sas-atlantique', categorie: 'supervision_manquante', collaborateur: 'julie', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "Supervision de l'exercice 2025 non réalisée.", dateDetection: '2026-02-10', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-09', commentaire: "À planifier avant la clôture définitive." },
  { id: 'a25', dossier: 'eurl-nordic', categorie: 'supervision_manquante', collaborateur: 'heddy', priorite: 'Moyenne', titre: 'Supervision annuelle manquante', description: "Supervision de l'exercice 2025 non réalisée.", dateDetection: '2026-02-14', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-09', commentaire: "Dossier en attente de planification." },
  { id: 'a26', dossier: 'sas-innov', categorie: 'classement_non_conforme', collaborateur: 'lucas', priorite: 'Faible', titre: 'Classement non conforme', description: 'Documents fiscaux classés hors de l’arborescence standard.', dateDetection: '2026-04-27', dernierAction: 'Aucune action', statut: 'a_faire', dateDemandeEC: '2026-05-10', commentaire: "À reclasser selon le plan de classement du cabinet." },
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

// --- Conformité cabinet -----------------------------------------------------

const CONFORMITE_CABINET = {
  manuelProcedures: {
    label: 'Manuel de procédures',
    statut: 'À jour',
    derniereMaj: '2026-01-10',
    detail: "Le manuel de procédures du cabinet a été mis à jour le 10/01/2026 et couvre l'ensemble des obligations LBC-FT et qualité.",
  },
  diffusionProcedures: {
    label: 'Diffusion des procédures',
    accusesManquants: [
      { collaborateur: 'lucas', dateEnvoi: '2026-04-01' },
      { collaborateur: 'thomas', dateEnvoi: '2026-04-01' },
    ],
  },
  formationsLBCFT: {
    label: 'Formations LBC-FT',
    nonAJour: [
      { collaborateur: 'julie', derniereFormation: '2024-03-12' },
      { collaborateur: 'nathalie', derniereFormation: '2024-01-20' },
      { collaborateur: 'heddy', derniereFormation: '2023-11-05' },
      { collaborateur: 'thomas', derniereFormation: '2024-02-18' },
      { collaborateur: 'lucas', derniereFormation: '2023-09-30' },
    ],
  },
  declarationsIndependance: {
    label: 'Déclarations d’indépendance',
    manquantes: [
      { collaborateur: 'julie', exercice: 2025 },
      { collaborateur: 'heddy', exercice: 2025 },
      { collaborateur: 'lucas', exercice: 2025 },
    ],
  },
  dependanceEconomique: {
    label: 'Dépendance économique',
    dossiersASurveiller: [
      { dossier: 'sas-nova', partHonoraires: '6.2%', seuil: '5%' },
      { dossier: 'sci-durand', partHonoraires: '5.8%', seuil: '5%' },
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
    problemes: { count: 2, label: '2 points signalés' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Trésorerie, rémunération du dirigeant',
    commentaireEC: "Les points signalés ont été examinés. Merci de corriger les deux anomalies comptables relevées et de prévoir un échange avec le client sur la trésorerie lors du rendez-vous bilan. Supervision validée sous réserve de ces ajustements.",
    dateCommentaireEC: '2026-05-16',
    commentaireCollab: "Dossier globalement rentable. Deux points comptables restent à fiabiliser avant finalisation. Aucun élément ne remet en cause la continuité d'exploitation. À évoquer lors du bilan : niveau de trésorerie et arbitrage sur la rémunération du dirigeant.",
    dateCommentaireCollab: '2026-05-15' },
  { id: 'b2', dossier: 'sci-durand', exercice: 2025, collaborateur: 'heddy', datePreparation: '2026-05-11', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 0, label: 'Aucun point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Renouvellement du bail commercial',
    commentaireEC: "Dossier propre, aucune remarque particulière. Validation possible en l'état.",
    dateCommentaireEC: '2026-05-15',
    commentaireCollab: "Exercice stable, loyers encaissés normalement. À évoquer : échéance du bail commercial en fin d'année.",
    dateCommentaireCollab: '2026-05-14' },
  { id: 'b3', dossier: 'sarl-projet', exercice: 2025, collaborateur: 'julie', datePreparation: '2026-05-10', statut: 'Prêt',
    rentabilite: { statut: 'neutre', label: 'À surveiller' },
    problemes: { count: 3, label: '3 points signalés' },
    continuite: { statut: 'attention', label: 'Trésorerie tendue' },
    sujets: 'Plan de trésorerie, recouvrement clients',
    commentaireEC: "Marge en baisse par rapport à N-1. Merci de préparer un point spécifique sur le recouvrement client avant le rendez-vous bilan.",
    dateCommentaireEC: '2026-05-14',
    commentaireCollab: "Chiffre d'affaires stable mais marge en recul. Retards de règlement de deux clients importants à signaler en rendez-vous bilan.",
    dateCommentaireCollab: '2026-05-13' },
  { id: 'b4', dossier: 'eurl-alpes', exercice: 2025, collaborateur: 'thomas', datePreparation: '2026-05-09', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Investissement matériel prévu N+1',
    commentaireEC: "Bon exercice. Point à valider sur le traitement comptable de l'investissement prévu l'année prochaine.",
    dateCommentaireEC: '2026-05-13',
    commentaireCollab: "Exercice bénéficiaire. Le dirigeant envisage un investissement matériel important l'an prochain, à anticiper.",
    dateCommentaireCollab: '2026-05-12' },
  { id: 'b5', dossier: 'sas-vision', exercice: 2025, collaborateur: 'heddy', datePreparation: '2026-05-08', statut: 'Prêt',
    rentabilite: { statut: 'negatif', label: 'Déficitaire' },
    problemes: { count: 2, label: '2 points signalés' },
    continuite: { statut: 'attention', label: 'À surveiller' },
    sujets: 'Financement R&D, crédit impôt recherche',
    commentaireEC: "Déficit à confirmer avant clôture. Vérifier l'éligibilité au CIR avant le rendez-vous bilan.",
    dateCommentaireEC: '2026-05-12',
    commentaireCollab: "Exercice déficitaire lié aux investissements R&D. Dossier CIR en cours de constitution.",
    dateCommentaireCollab: '2026-05-11' },
  { id: 'b6', dossier: 'sci-lumiere', exercice: 2025, collaborateur: 'julie', datePreparation: '2026-05-07', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 0, label: 'Aucun point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Aucun sujet particulier',
    commentaireEC: "Dossier conforme, aucune réserve.",
    dateCommentaireEC: '2026-05-11',
    commentaireCollab: "Rien à signaler pour cet exercice.",
    dateCommentaireCollab: '2026-05-10' },
  { id: 'b7', dossier: 'sarl-alpha', exercice: 2025, collaborateur: 'nathalie', datePreparation: '2026-05-06', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Renouvellement assurance décennale',
    commentaireEC: "Bon exercice. Veiller au renouvellement de l'assurance décennale évoqué en anomalie.",
    dateCommentaireEC: '2026-05-10',
    commentaireCollab: "Activité en croissance. Assurance décennale à renouveler rapidement.",
    dateCommentaireCollab: '2026-05-09' },
  { id: 'b8', dossier: 'eurl-ocean', exercice: 2025, collaborateur: 'nathalie', datePreparation: '2026-05-05', statut: 'Prêt',
    rentabilite: { statut: 'neutre', label: 'À surveiller' },
    problemes: { count: 2, label: '2 points signalés' },
    continuite: { statut: 'attention', label: 'Change et taux de fret' },
    sujets: 'Impact du taux de change sur la marge',
    commentaireEC: "Marge impactée par les variations de change. À évoquer avec le client lors du bilan.",
    dateCommentaireEC: '2026-05-09',
    commentaireCollab: "Activité d'import-export sensible aux taux de change du semestre, marge en léger recul.",
    dateCommentaireCollab: '2026-05-08' },
  { id: 'b9', dossier: 'sas-atlantique', exercice: 2025, collaborateur: 'julie', datePreparation: '2026-05-04', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 1, label: '1 point signalé' },
    continuite: { statut: 'ok', label: 'Aucun risque identifié' },
    sujets: 'Renouvellement de flotte',
    commentaireEC: "Exercice solide. Anticiper le financement du renouvellement de flotte évoqué par le dirigeant.",
    dateCommentaireEC: '2026-05-08',
    commentaireCollab: "Bonne activité sur l'exercice. Le dirigeant prévoit un investissement de renouvellement de flotte.",
    dateCommentaireCollab: '2026-05-07' },
  { id: 'b10', dossier: 'eurl-nordic', exercice: 2025, collaborateur: 'heddy', datePreparation: '2026-05-03', statut: 'Prêt',
    rentabilite: { statut: 'positif', label: 'Rentable' },
    problemes: { count: 0, label: 'Aucun point signalé' },
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
  activite: 'Marchands de biens immobiliers',
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
  '3 derniers FEC', 'Journaux de paie', 'Tableau des charges',
  'Fiche de paramétrage paie', 'Contrats de travail', 'Avenants aux contrats de travail',
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

const DOSSIERS_LBCFT = CLIENTS.map(c => ({
  dossier: c.id,
  niveauPropose: ['sas-nova', 'eurl-ocean'].includes(c.id) ? 'Renforcée' : 'Faible',
  niveauRetenu: ['sas-nova', 'eurl-ocean'].includes(c.id) ? 'Renforcée' : 'Faible',
  statut: ['sarl-beta', 'sas-innov', 'sci-riviera'].includes(c.id) ? 'a_lancer' : 'complete',
  derniereAnalyse: '2026-04-15',
}));

// --- Notes de synthèse (module collaborateur > Dossiers existants) ----------

const NOTE_SYNTHESE_CHAMPS = [
  { code: 'rentabilite', label: 'Rentabilité du dossier' },
  { code: 'problemes', label: 'Problèmes comptables identifiés' },
  { code: 'continuite', label: "Continuité d'exploitation" },
  { code: 'sujets', label: 'Sujets à évoquer lors du bilan' },
];
