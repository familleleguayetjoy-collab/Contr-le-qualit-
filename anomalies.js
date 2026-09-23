/* ComplyEC — Anomalies documentaires
   ===================================

   Une anomalie n'est pas saisie : elle est constatée.

   ComplyEC regarde ce que l'espace documentaire du cabinet contient pour chaque
   dossier. Ce qui manque devient une anomalie ; ce qui réapparaît cesse d'en
   être une. C'est la seule mécanique du module, et elle explique sa forme :
   aucun écran ne propose de « créer une anomalie », puisqu'on ne décrète pas
   qu'une pièce manque.

   Le connecteur Drive n'est pas encore paramétré. L'état documentaire ci-dessous
   est donc celui du jeu de démonstration, et l'écran le dit en toutes lettres.
   Le jour où le connecteur sera branché, seule `driveManques()` changera de
   source : les six familles, les tableaux, les relances et les régularisations
   sont écrits pour ne pas bouger.

   Six familles, et rien d'autre. ComplyEC ne sait pas dire si une lettre de
   mission est trop ancienne, si une pièce d'identité est expirée ou si un
   classement est conforme : il sait dire si le fichier est là. Toute anomalie
   qui demanderait un jugement n'est pas de son ressort. */

'use strict';

/* ------------------------------------------------------------- Les six onglets

   `dossier` : la famille porte sur des dossiers clients.
   `personne` : elle porte sur des membres du cabinet.
   `relances` n'est pas une famille d'anomalies — c'est la vue du travail déjà
   demandé aux collaborateurs. */
const ANOMALIES_ONGLETS = [
  { code: 'lettres', label: 'Lettres de mission', portee: 'dossier' },
  { code: 'identite', label: 'Documents d’identité', portee: 'dossier' },
  { code: 'rbe', label: 'RBE', portee: 'dossier' },
  { code: 'notes', label: 'Notes de synthèse', portee: 'dossier' },
  { code: 'relances', label: 'Relances', portee: 'suivi' },
  { code: 'autres', label: 'Autres documents', portee: 'personne' },
];

function ongletAnomalies(code) {
  return ANOMALIES_ONGLETS.find(o => o.code === code) || ANOMALIES_ONGLETS[0];
}

/* Les sept types d'anomalie que ComplyEC sait constater. `piece` nomme le
   fichier attendu : c'est ce qui s'écrit dans la relance envoyée au
   collaborateur, qui doit savoir quoi déposer sans avoir à deviner. */
const ANOMALIES_TYPES = {
  lettre_mission_absente: {
    onglet: 'lettres', portee: 'dossier',
    libelle: 'Lettre de mission absente',
    piece: 'la lettre de mission signée',
  },
  identite_absente: {
    onglet: 'identite', portee: 'dossier',
    libelle: 'Pièce d’identité absente',
    piece: 'la pièce d’identité du dirigeant',
  },
  rbe_justificatif_absent: {
    onglet: 'rbe', portee: 'dossier',
    libelle: 'Justificatif de consultation RBE absent',
    piece: 'le justificatif de consultation du registre des bénéficiaires effectifs',
  },
  note_synthese_absente: {
    onglet: 'notes', portee: 'dossier',
    libelle: 'Note de synthèse absente',
    piece: 'la note de synthèse annuelle',
  },
  /* Seul type qui ne se relance pas. La note est au dossier : ce qui manque,
     c'est la revue de l'expert-comptable, et lui seul peut la faire. Écrire au
     collaborateur pour la réclamer serait lui demander un travail qui n'est pas
     le sien. `pourLEc` retire donc la case à cocher et met à la place le bouton
     qui ouvre la supervision. */
  note_synthese_non_supervisee: {
    onglet: 'notes', portee: 'dossier', pourLEc: true,
    libelle: 'Note de synthèse non supervisée',
    piece: 'la note de synthèse annuelle, à faire superviser',
  },
  independance_absente: {
    onglet: 'autres', portee: 'personne', groupe: 'independance',
    libelle: 'Déclaration d’indépendance manquante',
    piece: 'la déclaration d’indépendance signée',
  },
  formation_attestation_absente: {
    onglet: 'autres', portee: 'personne', groupe: 'formations',
    libelle: 'Attestation de formation manquante',
    piece: 'l’attestation de présence à la formation',
  },
};

function typeAnomalie(code) { return ANOMALIES_TYPES[code] || null; }

/* Filtre interne de l'onglet Notes de synthèse (§ 4.4). */
const NOTES_FILTRES = [
  { code: 'toutes', label: 'Toutes' },
  { code: 'note_synthese_absente', label: 'Absentes' },
  { code: 'note_synthese_non_supervisee', label: 'Non supervisées' },
];

/* Filtre interne de l'onglet Autres documents (§ 4.6). */
const AUTRES_FILTRES = [
  { code: 'independance', label: 'Indépendance' },
  { code: 'formations', label: 'Formations' },
];

/* --------------------------------------------- Ce que le balayage a constaté

   Une ligne = une pièce attendue qui n'a pas été trouvée dans le dossier, avec
   la date à laquelle ComplyEC l'a constaté. C'est exactement la forme que
   renverra le connecteur Drive : rien d'autre à réécrire le jour venu.

   Données de démonstration — aucun cabinet réel n'est décrit ici. */
const DRIVE_MANQUES_DEMO = [
  { dossier: 'sci-martin', type: 'lettre_mission_absente', detecteLe: '2026-03-12' },
  { dossier: 'sarl-beta', type: 'lettre_mission_absente', detecteLe: '2026-03-18' },
  { dossier: 'sas-vision', type: 'lettre_mission_absente', detecteLe: '2026-03-20' },

  { dossier: 'sci-durand', type: 'identite_absente', detecteLe: '2026-04-02' },
  { dossier: 'eurl-alpes', type: 'identite_absente', detecteLe: '2026-04-08' },
  { dossier: 'sarl-alpha', type: 'identite_absente', detecteLe: '2026-04-12' },
  { dossier: 'eurl-ocean', type: 'identite_absente', detecteLe: '2026-04-14' },

  { dossier: 'sas-nova', type: 'rbe_justificatif_absent', detecteLe: '2026-03-22' },
  { dossier: 'sarl-projet', type: 'rbe_justificatif_absent', detecteLe: '2026-04-18' },
  { dossier: 'sci-riviera', type: 'rbe_justificatif_absent', detecteLe: '2026-04-16' },
  { dossier: 'sci-lumiere', type: 'rbe_justificatif_absent', detecteLe: '2026-04-15' },
  { dossier: 'eurl-nordic', type: 'rbe_justificatif_absent', detecteLe: '2026-05-04' },

  { dossier: 'sas-atlantique', type: 'note_synthese_absente', detecteLe: '2026-02-10' },
  { dossier: 'eurl-nordic', type: 'note_synthese_absente', detecteLe: '2026-02-14' },
  { dossier: 'sci-lumiere', type: 'note_synthese_absente', detecteLe: '2026-06-03' },

  { dossier: 'sas-nova', type: 'note_synthese_non_supervisee', detecteLe: '2026-01-15' },
  { dossier: 'sas-vision', type: 'note_synthese_non_supervisee', detecteLe: '2026-02-01' },
];

/* Relances déjà adressées avant l'ouverture de la démonstration, pour que
   l'onglet Relances montre sa forme sans qu'on ait à en générer une d'abord.
   Elles portent sur des anomalies de la liste ci-dessus : une relance qui
   viserait une pièce déjà déposée n'aurait aucun sens. */
const RELANCES_DEMO = [
  {
    id: 'rel-demo-julie',
    collaborateur: 'julie',
    genereeLe: '2026-08-20',
    elements: [
      { cle: 'lettre_mission_absente|sci-martin', type: 'lettre_mission_absente', dossier: 'sci-martin', personne: null,
        libelle: 'Lettre de mission absente', piece: 'la lettre de mission signée' },
      { cle: 'rbe_justificatif_absent|sarl-projet', type: 'rbe_justificatif_absent', dossier: 'sarl-projet', personne: null,
        libelle: 'Justificatif de consultation RBE absent', piece: 'le justificatif de consultation du registre des bénéficiaires effectifs' },
    ],
  },
  {
    id: 'rel-demo-heddy',
    collaborateur: 'heddy',
    genereeLe: '2026-09-02',
    elements: [
      { cle: 'identite_absente|sci-durand', type: 'identite_absente', dossier: 'sci-durand', personne: null,
        libelle: 'Pièce d’identité absente', piece: 'la pièce d’identité du dirigeant' },
    ],
  },
];

/* Point d'entrée unique de la détection. Aujourd'hui : le jeu de démonstration.
   Demain : le balayage du Drive du cabinet. Aucun appelant n'a à le savoir. */
function driveManques() {
  return DRIVE_MANQUES_DEMO;
}

/* Le connecteur est-il en place ? Les écrans s'en servent pour dire la vérité
   sur l'origine de ce qu'ils affichent, et pour savoir si une régularisation
   peut se constater toute seule ou doit être pointée à la main. */
function driveConnecte() {
  return capaciteReelle('drive');
}

/* ------------------------------------------------------------------- Identité

   Une anomalie n'a pas d'identifiant propre : elle est entièrement décrite par
   le couple (ce qui manque, à qui). Deux balayages successifs produisent donc
   la même clé pour la même anomalie — c'est ce qui permet de retrouver sa
   relance et sa régularisation d'un jour sur l'autre. */
function anomalieCle(a) {
  return `${a.type}|${a.dossier || a.personne}`;
}

/* --------------------------------------------------------- Anomalies dossiers */

function anomaliesDossiers() {
  const regularisees = dbRegularisations();
  const relances = dbRelancesParCle();
  return driveManques().map(m => {
    const cle = `${m.type}|${m.dossier}`;
    const t = ANOMALIES_TYPES[m.type];
    const collabId = dbAttributionDossier(m.dossier);
    /* Une note supervisée cesse d'être une anomalie, et ce n'est pas un
       pointage : la supervision est enregistrée, datée et signée ailleurs.
       L'anomalie sort de la liste parce que le travail a eu lieu. */
    const sup = m.type === 'note_synthese_non_supervisee'
      ? dbSupervisionDuDossier(m.dossier)
      : null;
    return {
      cle,
      type: m.type,
      onglet: t.onglet,
      libelle: t.libelle,
      piece: t.piece,
      pourLEc: !!t.pourLEc,
      dossier: m.dossier,
      dossierInfo: client(m.dossier),
      collaborateur: collabId,
      collaborateurInfo: collaborateur(collabId),
      detecteLe: m.detecteLe,
      derniereRelance: relances[cle] || null,
      regularisee: regularisees[cle]
        || (sup ? { le: sup.revuLe, par: sup.par } : null),
    };
  }).filter(a => a.dossierInfo);
}

/* --------------------------------------------------------- Anomalies personnes

   Deux catégories, et pas une de plus (§ 4.6). Elles ne sont pas constatées
   dans le Drive mais déduites de ce que le cabinet a déjà enregistré :
   la campagne d'indépendance et le registre des formations. Aucune saisie
   supplémentaire — c'est la règle du § 16. */
function anomaliesPersonnes() {
  const regularisees = dbRegularisations();
  const relances = dbRelancesParCle();
  const liste = [];

  function pousser(type, personneId, detecteLe, detail) {
    const cle = `${type}|${personneId}`;
    const t = ANOMALIES_TYPES[type];
    const p = collaborateur(personneId);
    if (!p) return;
    liste.push({
      cle, type, onglet: 'autres', groupe: t.groupe,
      libelle: t.libelle, piece: t.piece, detail: detail || null,
      personne: personneId, personneInfo: p,
      // Une anomalie qui vise une personne se relance auprès d'elle.
      collaborateur: personneId, collaborateurInfo: p,
      detecteLe,
      derniereRelance: relances[cle] || null,
      regularisee: regularisees[cle] || null,
    });
  }

  const annee = currentCalendarYear();
  dbDeclarations(annee)
    .filter(d => d.statut !== 'signee')
    .forEach(d => pousser('independance_absente', d.collaborateur, `${annee}-01-01`, `Campagne ${annee}`));

  // Une attestation ne manque que pour une session déjà passée : réclamer un
  // justificatif de présence à une formation de novembre en septembre serait
  // une anomalie inventée.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  dbFormationsProgrammes().forEach(prog => prog.sessions.forEach(s => {
    if (s.date > aujourdhui) return;
    (s.participants || []).forEach(pid => {
      const att = s.attestations && s.attestations[pid];
      if (att && att.recue) return;
      // La clé porte la session : deux formations manquantes pour la même
      // personne sont deux anomalies, pas une seule qui en écraserait une autre.
      const cle = `formation_attestation_absente|${pid}::${s.id}`;
      const t = ANOMALIES_TYPES.formation_attestation_absente;
      const p = collaborateur(pid);
      if (!p) return;
      liste.push({
        cle, type: 'formation_attestation_absente', onglet: 'autres', groupe: 'formations',
        libelle: t.libelle, piece: t.piece, detail: s.titre,
        personne: pid, personneInfo: p,
        collaborateur: pid, collaborateurInfo: p,
        detecteLe: s.date,
        derniereRelance: dbRelancesParCle()[cle] || null,
        regularisee: dbRegularisations()[cle] || null,
      });
    });
  }));

  return liste;
}

/* ------------------------------------------------------- Lecture par onglet

   Une anomalie régularisée n'est plus une anomalie : elle sort des tableaux.
   Elle reste visible dans l'onglet Relances, où la question posée n'est pas
   « que reste-t-il à faire ? » mais « est-ce que ce que j'ai demandé a été
   fait ? ». */
function anomaliesDeLOnglet(code) {
  const source = code === 'autres' ? anomaliesPersonnes() : anomaliesDossiers();
  return source
    .filter(a => a.onglet === code && !a.regularisee)
    .sort((a, b) => (a.detecteLe < b.detecteLe ? -1 : a.detecteLe > b.detecteLe ? 1 : 0));
}

/* Toutes les anomalies ouvertes, tous onglets confondus. Sert au calcul de la
   synthèse et des relances — jamais à un écran : le § 17 interdit la vue
   générale de toutes les anomalies. */
function anomaliesOuvertes() {
  return anomaliesDossiers().concat(anomaliesPersonnes()).filter(a => !a.regularisee);
}

function anomalieParCle(cle) {
  return anomaliesDossiers().concat(anomaliesPersonnes()).find(a => a.cle === cle) || null;
}

/* Combien d'anomalies ouvertes dans chaque onglet. Sert au badge du segmented
   control — un nombre à côté d'un intitulé, pas un tableau de bord. */
function comptesParOnglet() {
  const c = {};
  ANOMALIES_ONGLETS.forEach(o => { c[o.code] = 0; });
  anomaliesOuvertes().forEach(a => { c[a.onglet] = (c[a.onglet] || 0) + 1; });
  c.relances = relancesOuvertes().length;
  return c;
}

/* --------------------------------------------------------------- Les relances

   Une relance vise une personne, pas une anomalie.

   Paul ne doit pas recevoir douze messages pour douze anomalies (§ 4.5) : la
   sélection faite à l'écran est regroupée par collaborateur, et chacun reçoit
   un seul message qui liste tout ce qui le concerne. */

function relanceJourMaximum(a, b) { return (a || '') > (b || '') ? a : b; }

/* Dernière date de relance connue pour chaque anomalie. */
function dbRelancesParCle() {
  const parCle = {};
  dbRelances().forEach(r => {
    (r.elements || []).forEach(e => {
      parCle[e.cle] = relanceJourMaximum(parCle[e.cle], r.genereeLe);
    });
  });
  return parCle;
}

/* Prépare une relance consolidée par collaborateur concerné, et l'enregistre.
   Renvoie la liste des relances créées, pour que l'écran puisse les ouvrir dans
   la messagerie du cabinet sans relire la base. */
function preparerRelances(cles, cabinetSettings) {
  const toutes = anomaliesDossiers().concat(anomaliesPersonnes());
  /* `pourLEc` est écarté ici aussi, et pas seulement à l'écran : une note non
     supervisée attend l'expert-comptable, jamais le collaborateur. */
  const choisies = toutes.filter(a =>
    cles.indexOf(a.cle) >= 0 && !a.regularisee && !a.pourLEc);
  const parCollab = {};
  choisies.forEach(a => {
    (parCollab[a.collaborateur] = parCollab[a.collaborateur] || []).push(a);
  });

  const genereeLe = new Date().toISOString().slice(0, 10);
  const nouvelles = Object.keys(parCollab).map(collabId => ({
    id: `rel-${Date.now()}-${collabId}`,
    collaborateur: collabId,
    genereeLe,
    elements: parCollab[collabId].map(a => ({
      cle: a.cle,
      type: a.type,
      dossier: a.dossier || null,
      personne: a.personne || null,
      libelle: a.libelle,
      piece: a.piece,
    })),
    message: messageRelanceConsolidee(collabId, parCollab[collabId], cabinetSettings),
  }));

  if (nouvelles.length) dbEnregistrerRelances(nouvelles);
  return nouvelles;
}

/* Le corps du message. Une seule relance, tous les éléments listés, et la
   phrase dit où déposer. Pas de formule creuse : le collaborateur doit pouvoir
   agir en le lisant une fois. */
function messageRelanceConsolidee(collabId, anomalies, cabinetSettings) {
  const p = collaborateur(collabId);
  const prenom = p ? p.nom.split(' ')[0] : '';
  const cabinet = (cabinetSettings && cabinetSettings.nom) || dbReglages().nom;

  // Deux natures de demande, qui ne se règlent pas au même endroit : une pièce
  // de dossier se dépose dans le dossier, un document personnel se transmet au
  // cabinet. Les confondre enverrait le collaborateur au mauvais endroit.
  const surDossier = anomalies.filter(a => a.dossier);
  const surPersonne = anomalies.filter(a => !a.dossier);
  const dossiersDistincts = new Set(surDossier.map(a => a.dossier)).size;

  const corps = [];

  if (surDossier.length) {
    corps.push(surDossier.length > 1
      ? `Les ${surDossier.length} pièces suivantes manquent dans les dossiers dont vous avez la charge :`
      : 'La pièce suivante manque dans un dossier dont vous avez la charge :');
    corps.push('');
    corps.push(surDossier.map(a => `— ${a.dossierInfo ? a.dossierInfo.nom : a.dossier} : ${a.piece}`).join('\n'));
    corps.push('');
    corps.push(surDossier.length === 1
      ? 'Merci de la déposer dans le dossier concerné de l’espace documentaire du cabinet.'
      : (dossiersDistincts === 1
        ? 'Merci de les déposer dans le dossier concerné de l’espace documentaire du cabinet.'
        : 'Merci de les déposer dans chacun des dossiers concernés de l’espace documentaire du cabinet.'));
  }

  if (surPersonne.length) {
    if (corps.length) corps.push('');
    corps.push(surPersonne.length > 1
      ? 'Les documents suivants vous concernent personnellement :'
      : 'Le document suivant vous concerne personnellement :');
    corps.push('');
    corps.push(surPersonne.map(a => `— ${a.piece}${a.detail ? ` (${a.detail})` : ''}`).join('\n'));
    corps.push('');
    corps.push(surPersonne.length > 1
      ? 'Merci de me les transmettre.'
      : 'Merci de me le transmettre.');
  }

  return [`Bonjour${prenom ? ' ' + prenom : ''},`, ''].concat(corps, ['', cabinet]).join('\n');
}

/* Objet de la relance, pour l'ouverture dans la messagerie. */
function objetRelance(anomalies) {
  return anomalies.length > 1
    ? `ComplyEC — ${anomalies.length} pièces à déposer`
    : 'ComplyEC — une pièce à déposer';
}

/* Les relances vues par collaborateur (§ 4.5). Une carte par personne, ouvrable
   sur le détail de ce qu'on lui a demandé et de ce qui est réglé. */
function relancesParCollaborateur() {
  const regularisees = dbRegularisations();
  const ouvertes = {};
  anomaliesOuvertes().forEach(a => { ouvertes[a.cle] = a; });

  const parCollab = {};
  dbRelances().forEach(r => {
    const groupe = parCollab[r.collaborateur] || (parCollab[r.collaborateur] = {
      collaborateur: r.collaborateur,
      collaborateurInfo: collaborateur(r.collaborateur),
      relances: [],
      elements: [],
    });
    groupe.relances.push(r);
    (r.elements || []).forEach(e => {
      // Un même élément relancé deux fois ne compte qu'une fois : c'est la
      // dernière demande qui fait foi.
      const existant = groupe.elements.find(x => x.cle === e.cle);
      const ligne = {
        cle: e.cle,
        libelle: e.libelle,
        dossier: e.dossier,
        dossierInfo: e.dossier ? client(e.dossier) : null,
        personne: e.personne,
        relanceLe: r.genereeLe,
        regularisee: regularisees[e.cle] || null,
        // Réglé = la pièce n'est plus constatée manquante, ou elle a été
        // pointée régularisée à la main.
        reglee: !ouvertes[e.cle],
      };
      if (existant) Object.assign(existant, ligne, { relanceLe: relanceJourMaximum(existant.relanceLe, r.genereeLe) });
      else groupe.elements.push(ligne);
    });
  });

  return Object.keys(parCollab).map(id => {
    const g = parCollab[id];
    g.enAttente = g.elements.filter(e => !e.reglee).length;
    g.reglees = g.elements.length - g.enAttente;
    g.derniereRelance = g.relances.reduce((max, r) => relanceJourMaximum(max, r.genereeLe), null);
    return g;
  }).filter(g => g.collaborateurInfo)
    .sort((a, b) => b.enAttente - a.enAttente || (a.collaborateurInfo.nom < b.collaborateurInfo.nom ? -1 : 1));
}

/* Éléments relancés encore en attente, toutes personnes confondues. */
function relancesOuvertes() {
  return relancesParCollaborateur().reduce((acc, g) => acc.concat(g.elements.filter(e => !e.reglee)), []);
}

/* Depuis combien de jours une relance attend. Sert à teinter la ligne quand le
   délai que le cabinet s'est donné est dépassé — un fait, pas un jugement. */
function joursDepuis(date) {
  if (!date) return null;
  return Math.max(0, Math.round((new Date() - new Date(date + 'T00:00:00')) / 86400000));
}
