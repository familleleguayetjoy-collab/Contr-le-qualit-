// ComplyEC — semences de démonstration et passage aux données du cabinet
'use strict';

/* data.js contient deux sortes de constantes, qui se ressemblent :

   — des RÉFÉRENCES, vraies pour tout cabinet : les catégories d'anomalies,
     les modèles de lettres de mission du cabinet, les textes réglementaires
     vérifiés, les questions du manuel, les listes de pays et de divisions
     NAF. Elles ne bougent pas ;

   — des SEMENCES de démonstration : quinze dossiers fictifs, cinq
     collaborateurs inventés, un expert-comptable « Martin Dupont », des
     signatures, des analyses, des réclamations, des prestataires… Elles
     servent à montrer le logiciel.

   En données réelles, les semences doivent disparaître : un dossier fictif
   affiché à côté des dossiers du cabinet serait une donnée fausse à l'écran,
   et une signature inventée dans une liste remise à un contrôleur serait une
   faute. Elles sont vidées en place (même tableau, même objet), pour que
   tout le code qui les lit continue de fonctionner sans être réécrit. Ce qui
   les remplace vient du cabinet : l'équipe de ses comptes, ses clients de
   l'import, ses saisies dans ComplyEC.

   La liste ci-dessous est l'inventaire fait le 30 octobre 2026, constante par
   constante. Une semence ajoutée plus tard doit être ajoutée ici : la
   recette « reel » cherche les noms de la démonstration sur chaque écran et
   échoue si elle en trouve un. */

const SEMENCES_TABLEAUX_A_VIDER = () => [
  ANCIENS_COLLABORATEURS, ANOMALIES, FORMATIONS_PROGRAMMES, DECLARATIONS_INDEPENDANCE,
  PROCEDURES_VERSIONS, DEPENDANCE_LIGNES, BILAN_DOSSIERS, DOSSIERS_LBCFT_A_LANCER,
  RECLAMATIONS, CAMPAGNE_RBE, NON_CONFORMITES, ECHANTILLON_SURVEILLANCE, MANUEL_VERSIONS,
  CONTROLES_CIBLES, OUTILS_PRESTATAIRES, TRAITEMENTS_RGPD, SOURCES_DOCUMENTS, SUPPLEANCES,
  DRIVE_MANQUES_DEMO, RELANCES_DEMO,
];

const SEMENCES_OBJETS_A_VIDER = () => [
  COLLABORATEURS_EMBAUCHE, LETTRES_MISSION, FORMATIONS_ACCUEIL, DEPENDANCE_PART_HONORAIRES,
  DEPENDANCE_MESURES, DOSSIERS_LBCFT_DETAIL, NOTES_SYNTHESE_DEMO, PPE_ATTESTATIONS_DEMO,
];

const COULEURS_EQUIPE = ['#2563EB', '#F59E0B', '#16A34A', '#9333EA', '#DC2626', '#0891B2', '#CA8A04', '#4C7DF0'];

function viderTableau(t) { if (Array.isArray(t)) t.length = 0; }
function viderObjet(o) { if (o && typeof o === 'object') Object.keys(o).forEach(k => { delete o[k]; }); }

function normaliserNom(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/* L'équipe : les comptes du cabinet. Les collaborateurs sont les comptes
   « collaborateur » ; l'expert-comptable affiché est la personne connectée
   si elle est expert-comptable, sinon le premier expert-comptable du cabinet. */
function semencesEquipeReelle() {
  const cab = cabinetReel();
  const equipe = (cab && cab.equipe) || [];
  const collabs = equipe.filter(p => p.role === 'collaborateur')
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
  COLLABORATEURS.length = 0;
  collabs.forEach((p, i) => COLLABORATEURS.push({
    id: p.id,
    nom: `${p.prenom || ''} ${p.nom || ''}`.trim(),
    role: 'Collaborateur comptable',
    initiales: initialesDe(p.prenom, p.nom),
    couleur: COULEURS_EQUIPE[i % COULEURS_EQUIPE.length],
    email: p.email || '',
    telephone: p.telephone || '',
  }));
  const ec = cab.profil.role === 'expert_comptable'
    ? cab.profil
    : (equipe.find(p => p.role === 'expert_comptable') || {});
  EXPERT_COMPTABLE.id = ec.id || null;
  EXPERT_COMPTABLE.nom = `${ec.prenom || ''} ${ec.nom || ''}`.trim() || 'Expert-comptable';
  EXPERT_COMPTABLE.initiales = initialesDe(ec.prenom, ec.nom);
  EXPERT_COMPTABLE.email = ec.email || '';
}

/* La forme juridique, quand l'import ne la donne pas : elle se lit souvent
   en tête de la raison sociale. Elle sert à savoir si le registre des
   bénéficiaires effectifs s'applique (personne morale). Rien n'est deviné
   au-delà : sans indication, la forme reste vide et la règle le dit. */
const FORMES_EN_TETE = ['SELARL', 'SELAS', 'SASU', 'SAS', 'SARL', 'EURL', 'SCI', 'SCM', 'SCP', 'SNC', 'SA', 'SC', 'GIE', 'GAEC', 'EARL'];
function formeDepuisNom(nom) {
  const mots = String(nom || '').toUpperCase().replace(/\./g, '').split(/[^A-Z]+/).filter(Boolean);
  const f = FORMES_EN_TETE.find(x => mots[0] === x || mots[mots.length - 1] === x);
  return f || '';
}

/* Un nom de collaborateur tel qu'il figure dans le tableur (« Julie
   Bernard », « BERNARD Julie », « JB ») rapproché d'un compte. Sans
   correspondance sûre, le dossier reste sans collaborateur : il s'attribue
   ensuite dans Paramètres. */
function collaborateurDepuisTexte(texte) {
  const t = normaliserNom(texte);
  if (!t) return null;
  const exact = COLLABORATEURS.find(c => normaliserNom(c.nom) === t
    || normaliserNom(c.nom.split(' ').reverse().join(' ')) === t);
  if (exact) return exact.id;
  const parInitiales = COLLABORATEURS.filter(c => normaliserNom(c.initiales) === t);
  if (parInitiales.length === 1) return parInitiales[0].id;
  const parPrenom = COLLABORATEURS.filter(c => normaliserNom(c.nom.split(' ')[0]) === t);
  if (parPrenom.length === 1) return parPrenom[0].id;
  const parNom = COLLABORATEURS.filter(c => normaliserNom(c.nom.split(' ').slice(1).join(' ')) === t);
  if (parNom.length === 1) return parNom[0].id;
  return null;
}

/* Les dossiers : la liste importée depuis le tableur du cabinet. L'identifiant
   est tiré du SIREN quand il est connu (il ne change pas si la raison sociale
   change), sinon du nom. */
function clientsDepuisImport(lignes) {
  const vus = {};
  return (lignes || []).filter(l => l && String(l.nom || '').trim()).map(l => {
    const chiffres = String(l.siren || '').replace(/\D/g, '');
    let id = chiffres.length >= 9 ? 'c-' + chiffres.slice(0, 9) : 'c-' + normaliserNom(l.nom).replace(/ /g, '-');
    if (vus[id]) { vus[id] += 1; id = id + '-' + vus[id]; } else vus[id] = 1;
    return {
      id,
      nom: String(l.nom).trim(),
      forme: String(l.forme || '').trim().toUpperCase() || formeDepuisNom(l.nom),
      siret: String(l.siren || '').trim(),
      collaborateur: collaborateurDepuisTexte(l.collaborateur),
      collaborateurImporte: String(l.collaborateur || '').trim(),
      dirigeant: '', activite: '', naf: '',
      importe: true,
    };
  });
}

let SEMENCES_IMPORT_LU = null;

/* Appelé à chaque changement en données réelles : si la liste importée a
   changé (un nouvel import, ou celui d'un collègue), le portefeuille suit. */
function semencesSynchroniserClients() {
  if (!modeCabinetReel()) return;
  const lignes = demoLireEtat().clients || [];
  const signature = JSON.stringify(lignes) + '|' + COLLABORATEURS.map(c => c.id).join(',');
  if (signature === SEMENCES_IMPORT_LU) return;
  SEMENCES_IMPORT_LU = signature;
  const clients = clientsDepuisImport(lignes);
  CLIENTS.length = 0;
  clients.forEach(c => CLIENTS.push(c));
  DOSSIERS_LBCFT.length = 0;
  CLIENTS.forEach(c => DOSSIERS_LBCFT.push({ dossier: c.id, statut: 'a_lancer', derniereAnalyse: null }));
}

/* Le grand passage : appelé une fois, à l'ouverture d'un cabinet en données
   réelles, avant le premier affichage. */
function semencesBasculerEnReel() {
  const cab = cabinetReel();
  SEMENCES_TABLEAUX_A_VIDER().forEach(viderTableau);
  SEMENCES_OBJETS_A_VIDER().forEach(viderObjet);

  semencesEquipeReelle();

  // Identité du cabinet : seul le nom est connu (création du compte). Le
  // reste se renseigne dans Paramètres ; rien n'est inventé d'ici là.
  Object.assign(CABINET_SETTINGS_DEFAUT, {
    nom: cab.nom || '',
    adresse: '', telephone: '', emailExpert: EXPERT_COMPTABLE.email || '',
    declarantTracfin: '', correspondantTracfin: '',
    signature: `${EXPERT_COMPTABLE.nom}\nExpert-comptable`,
    mentionsLegales: '', formeJuridique: '', conseilRegional: '', numeroInscription: '',
  });

  // Le référentiel du cabinet : chaque information est à renseigner, sauf ce
  // que ComplyEC sait de lui-même.
  REFERENTIEL_INFOS.forEach(i => {
    ['repere', 'extrait', 'obtenuLe', 'confirmeLe', 'confirmePar'].forEach(k => { delete i[k]; });
    i.sourceId = null;
    i.valeur = null;
    i.statut = 'a_renseigner';
  });
  const denomination = REFERENTIEL_INFOS.find(i => i.cle === 'cabinet.denomination');
  if (denomination) Object.assign(denomination, { valeur: cab.nom || null, statut: 'a_confirmer', note: 'Nom saisi à la création du compte' });

  // Les rôles : aucun titulaire tant que le cabinet ne les a pas désignés.
  ROLES_CABINET.forEach(r => { if ('titulaire' in r) r.titulaire = null; });

  // Gouvernance : les experts inscrits et l'actionnariat se saisissent.
  if (GOUVERNANCE_DEFAUT) {
    GOUVERNANCE_DEFAUT.expertsInscrits = [];
    GOUVERNANCE_DEFAUT.actionnariat = [];
  }

  // La classification des risques n'a jamais été arrêtée dans ComplyEC.
  if (CONFORMITE_CABINET && CONFORMITE_CABINET.classificationRisquesLBCFT) {
    CONFORMITE_CABINET.classificationRisquesLBCFT.derniereRevision = null;
    CONFORMITE_CABINET.classificationRisquesLBCFT.statut = 'Jamais arrêtée dans ComplyEC';
  }

  // Les risques qualité restent proposés comme point de départ, mais rien
  // n'y est présenté comme validé, ni rattaché à un contexte inventé.
  RISQUES_QUALITE.forEach(r => {
    r.contexte = '';
    r.etat = 'a-valider';
    r.echeance = null;
    r.responsable = null;
  });

  // Les parcours d'entrée en mission démarrent vides : aucune société fictive
  // ne doit se glisser dans un courrier ou une lettre de mission.
  Object.keys(SCENARIO_NOUVEAU_CLIENT).forEach(k => { SCENARIO_NOUVEAU_CLIENT[k] = ''; });
  SCENARIO_NOUVEAU_CLIENT.dirigeantCivilite = 'M.';
  Object.keys(SCENARIO_CABINET_CONFRERE).forEach(k => { SCENARIO_CABINET_CONFRERE[k] = ''; });

  SEMENCES_IMPORT_LU = null;
  semencesSynchroniserClients();
}
