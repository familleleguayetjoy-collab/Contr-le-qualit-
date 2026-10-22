// ComplyEC — Espace collaborateur
'use strict';

/* L'espace du collaborateur.

   Mêmes couleurs, même barre, mêmes tableaux que l'espace de
   l'expert-comptable : on ne change pas de logiciel en changeant de rôle. Cinq
   entrées, et le collaborateur n'y voit que les dossiers qui lui sont
   attribués dans Paramètres.

   Ce qui reste à l'expert-comptable n'apparaît pas ici : la préparation du
   contrôle (sauf la formation), la cartographie, les responsables, la
   gouvernance, la supervision. Le registre des bénéficiaires effectifs ne
   s'ouvre pas : le collaborateur prévient l'expert-comptable, qui le
   consulte. */

/* Le collaborateur connecté et l'espace affiché. Fixés par App à chaque rendu,
   lus par les écrans partagés — le parcours d'entrée en mission notamment. */
let COLLAB_COURANT = 'julie';
let ESPACE_COURANT = 'ec';
function collabCourant() { return COLLAB_COURANT; }
function estEspaceCollab() { return ESPACE_COURANT === 'collab'; }
function definirEspaceCourant(espace, collabId) {
  ESPACE_COURANT = espace;
  if (collabId) COLLAB_COURANT = collabId;
}

/* Retrouve, pour un compte connecté, la fiche du collaborateur qui lui
   correspond. En démonstration, c'est Julie Bernard. */
function collabDuProfil(profil) {
  if (!profil) return 'julie';
  const complet = `${profil.prenom || ''} ${profil.nom || ''}`.trim().toLowerCase();
  const trouve = dbCollaborateursTous().find(c => c.nom.toLowerCase() === complet);
  return trouve ? trouve.id : 'julie';
}

const prenomDe = id => ((personneNom(id) || '').split(' ')[0]) || '';

// -------------------------------------------------------- Ce qu'il y a à faire

/* Les onglets d'anomalies du collaborateur : ceux qui portent sur ses
   dossiers. Les relances sont celles qu'il reçoit, et les « autres documents »
   le concernent lui-même : ils sont dans Mes obligations. */
const COLLAB_ONGLETS = ['lettres', 'identite', 'rbe', 'notes'];

function anomaliesDuCollab(code, id) {
  return anomaliesDeLOnglet(code).filter(a => a.collaborateur === id);
}

/* L'année de la campagne d'indépendance en cours. */
const anneeEnCours = () => Number(currentCalendarYear());

/* Ses obligations, chacune avec son état. Sert à l'accueil et à l'écran
   « Mes obligations » : les deux ne peuvent pas dire deux choses
   différentes. */
function obligationsDuCollab(id) {
  const annee = anneeEnCours();
  const decl = dbDeclarations(annee).find(d => d.collaborateur === id);
  const manuel = manuelVersionEnVigueur();
  const charte = dbCharteIa();
  const sessions = [];
  dbFormationsProgrammes().forEach(p => p.sessions.forEach(s => {
    if ((s.participants || []).indexOf(id) >= 0) sessions.push(s);
  }));
  return {
    annee,
    independance: decl ? (decl.statut === 'signee' ? decl.dateSignature : null) : null,
    independanceAttendue: !!decl,
    manuel,
    manuelAccuse: manuel ? dbManuelAccuse(manuel.numero, id) : null,
    documents: charte ? [{ id: 'charte-ia', label: 'Charte d’utilisation de l’IA', lu: dbLecture('charte-ia', id),
      ouvrir: () => telechargerCharteIa(charte, dbReglages()) }] : [],
    sessions: sessions.map(s => ({ session: s, recue: !!((s.attestations || {})[id] || {}).recue })),
  };
}

/* La liste « À faire » : une ligne par chose à faire, la plus urgente en
   haut, et un bouton qui mène directement là où elle se fait. */
function aFaireDuCollab(id) {
  const lignes = [];
  const n = (code, filtre) => anomaliesDuCollab(code, id).filter(filtre || (() => true)).length;
  const ajouter = (nb, singulier, plurielTexte, aller, ton) => {
    if (nb) lignes.push({ texte: `${nb} ${pluriel(nb, singulier, plurielTexte)}`, aller, ton });
  };
  ajouter(n('lettres'), 'lettre de mission à préparer', 'lettres de mission à préparer', ['anomalies', 'lettres'], 'ambre');
  ajouter(n('identite'), 'pièce d’identité à déposer', 'pièces d’identité à déposer', ['anomalies', 'identite'], 'ambre');
  ajouter(n('rbe', a => !dbSignalementRbe(a.dossier)), 'RBE à signaler à l’expert-comptable', 'RBE à signaler à l’expert-comptable', ['anomalies', 'rbe'], 'ambre');
  ajouter(n('notes', a => a.type === 'note_synthese_absente'), 'note de synthèse à rédiger', 'notes de synthèse à rédiger', ['anomalies', 'notes'], 'menthe');

  const o = obligationsDuCollab(id);
  if (o.independanceAttendue && !o.independance) lignes.push({ texte: `Attestation d’indépendance ${o.annee} à signer`, aller: ['obligations'], ton: 'violet' });
  if (o.manuel && !o.manuelAccuse) lignes.push({ texte: `Manuel de procédures ${o.manuel.numero} à lire et approuver`, aller: ['obligations'], ton: 'violet' });
  o.documents.filter(d => !d.lu).forEach(d => lignes.push({ texte: `${d.label} à lire`, aller: ['obligations'], ton: 'violet' }));
  const sansAttestation = o.sessions.filter(s => !s.recue).length;
  ajouter(sansAttestation, 'attestation de formation à déposer', 'attestations de formation à déposer', ['obligations'], 'violet');

  actionsCorrectivesDuCollab(id).filter(nc => !nc.faiteLe).forEach(nc => lignes.push({
    texte: `Action corrective — ${client(nc.dossier) ? client(nc.dossier).nom : nc.dossier}`,
    detail: nc.action || nc.constat, nc, ton: 'rouge',
  }));
  return lignes;
}

/* Les actions correctives que l'expert-comptable a adressées au collaborateur
   à l'issue de la surveillance annuelle. */
function actionsCorrectivesDuCollab(id) {
  return dbNonConformites().filter(nc => nc.relanceLe && !nc.efficacite
    && nc.etat !== 'cloturee' && dbAttributionDossier(nc.dossier) === id);
}

// ------------------------------------------------------------------- Accueil

function CollabAccueil({ moi, navigate, showToast }) {
  useDonnees();
  const lignes = aFaireDuCollab(moi);

  async function faite(nc) {
    await dbMajNonConformite(nc.id, { faiteLe: new Date().toISOString().slice(0, 10), faitePar: moi });
    showToast('Action signalée comme faite : l’expert-comptable la vérifiera.');
  }

  return h('div', { className: 'page page-collab-accueil' },
    h('header', { className: 'collab-entete' },
      h('h1', null, `Bonjour ${prenomDe(moi)}`),
      lignes.length
        ? h('p', { className: 'collab-entete-compte' }, `${lignes.length} ${pluriel(lignes.length, 'chose à faire', 'choses à faire')}`)
        : null
    ),
    lignes.length
      ? h('ul', { className: 'afaire-liste' },
        lignes.map((l, i) => h('li', { key: i, className: cx('afaire-ligne', 'teinte-' + l.ton) },
          h('span', { className: 'afaire-marque', 'aria-hidden': 'true' }),
          h('span', { className: 'afaire-texte' },
            h('span', { className: 'afaire-titre' }, l.texte),
            l.detail ? h('span', { className: 'afaire-detail' }, l.detail) : null),
          l.nc
            ? h('button', { className: 'btn btn-secondary', onClick: () => faite(l.nc) }, 'C’est fait')
            : h('button', { className: 'btn btn-primary', onClick: () => navigate(l.aller[0], l.aller[1] || null) }, 'Ouvrir →')
        )))
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '✓'),
        h('p', null, 'Rien à faire pour l’instant.'))
  );
}

// -------------------------------------------------------------- Anomalies

/* Les types de pièce qu'on dépose. Le code entre dans le nom du fichier : il
   doit se lire d'un coup d'œil dans un dossier du Drive. */
const DEPOT_TYPES = [
  { code: 'LDM', label: 'Lettre de mission signée' },
  { code: 'CNI', label: 'Pièce d’identité', personne: true },
  { code: 'DOMICILE', label: 'Justificatif de domicile', personne: true },
  { code: 'KBIS', label: 'Extrait RNE ou Kbis' },
  { code: 'STATUTS', label: 'Statuts' },
  { code: 'NOTE', label: 'Note de synthèse' },
  { code: 'FORMATION', label: 'Attestation de formation', personne: true },
  { code: 'AUTRE', label: 'Autre pièce' },
];

const DEPOT_PAR_ANOMALIE = {
  lettre_mission_absente: 'LDM',
  identite_absente: 'CNI',
  note_synthese_absente: 'NOTE',
};

/* Un nom de fichier sans accent ni espace : il passe partout, dans le Drive
   comme dans une pièce jointe. */
function morceauNom(texte) {
  return String(texte || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Le nom donné à la pièce : année-mois, type, dossier, personne, puis un
   numéro de version si une pièce du même nom existe déjà. */
function nomDepot({ type, dossierNom, personne, extension, depots }) {
  const mois = new Date().toISOString().slice(0, 7);
  const base = [mois, type, morceauNom(dossierNom), personne ? morceauNom(personne) : null].filter(Boolean).join('_');
  const deja = (depots || dbDepots()).filter(d => d.base === base).length;
  return { base, nom: `${base}${deja ? '_v' + (deja + 1) : ''}${extension ? '.' + extension : ''}` };
}

/* Tant que le Drive n'est pas raccordé, la pièce renommée est remise au
   collaborateur, qui la range lui-même : ComplyEC ne dit pas l'avoir
   classée. */
function telechargerRenomme(fichier, nom) {
  const url = URL.createObjectURL(fichier);
  const a = document.createElement('a');
  a.href = url; a.download = nom;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function PanneauDepot({ anomalie, moi, onFermer, showToast }) {
  const dossier = anomalie.dossierInfo;
  const [type, setType] = useState(DEPOT_PAR_ANOMALIE[anomalie.type] || 'AUTRE');
  const [personne, setPersonne] = useState(dossier ? dossier.dirigeant || '' : '');
  const [fichier, setFichier] = useState(null);
  const t = DEPOT_TYPES.find(x => x.code === type);
  const extension = fichier && fichier.name.indexOf('.') >= 0 ? fichier.name.split('.').pop().toLowerCase() : 'pdf';
  const nom = nomDepot({ type, dossierNom: dossier ? dossier.nom : '', personne: t.personne ? personne : null, extension });

  async function valider() {
    await dbEnregistrerDepot({ dossier: anomalie.dossier, type, personne: t.personne ? personne : null,
      base: nom.base, nomFichier: nom.nom, nomOrigine: fichier.name, par: moi });
    if (DEPOT_PAR_ANOMALIE[anomalie.type] === type) {
      await dbMarquerRegularise(anomalie.cle, `${anomalie.libelle} — ${dossier ? dossier.nom : ''} — pièce déposée par ${personneNom(moi)}`);
    }
    if (driveConnecte()) {
      showToast(`Pièce enregistrée sous le nom ${nom.nom}.`);
    } else {
      telechargerRenomme(fichier, nom.nom);
      showToast(`Pièce renommée ${nom.nom} et téléchargée : rangez-la dans le dossier du client.`);
    }
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: 'Déposer la pièce',
    sousTitre: dossier ? dossier.nom : '',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: valider, disabled: !fichier || (t.personne && !personne.trim()) },
        'Valider le dépôt')),
  },
    h('div', { className: 'depot-champs' },
      h(ListePanneau, {
        label: 'Type de pièce', valeur: type, onChange: setType,
        options: DEPOT_TYPES.filter(x => x.code !== 'FORMATION').map(x => ({ code: x.code, label: x.label })),
      }),
      t.personne ? h(ChampPanneau, { label: 'Personne concernée', valeur: personne, onChange: setPersonne }) : null,
      h('div', { className: 'champ-panneau' },
        h('span', { className: 'champ-label' }, 'Fichier'),
        h('label', { className: 'depot-fichier' },
          h('input', { type: 'file', onChange: e => setFichier(e.target.files && e.target.files[0]) }),
          h('span', { className: 'btn btn-secondary' }, fichier ? 'Changer de fichier' : 'Choisir le fichier'),
          h('span', { className: 'depot-fichier-nom' }, fichier ? fichier.name : 'Aucun fichier choisi'))),
      h('div', { className: 'depot-nom' },
        h('span', { className: 'champ-label' }, 'Nom donné à la pièce'),
        h('code', null, nom.nom))
    )
  );
}

function CollabAnomalies({ moi, onglet, navigate, showToast }) {
  useDonnees();
  const actif = COLLAB_ONGLETS.indexOf(onglet) >= 0 ? onglet : COLLAB_ONGLETS[0];
  const [selection, setSelection] = useState([]);
  const [aDeposer, setADeposer] = useState(null);
  const [aRediger, setARediger] = useState(null);
  const lignes = anomaliesDuCollab(actif, moi);
  const choisies = lignes.filter(l => selection.indexOf(l.cle) >= 0);
  const comptes = {};
  COLLAB_ONGLETS.forEach(c => { comptes[c] = anomaliesDuCollab(c, moi).length; });

  function allerOnglet(code) { setSelection([]); navigate('anomalies', code); }

  function marquerRegularise() {
    choisies.forEach(l => dbMarquerRegularise(l.cle, `${l.libelle} — ${l.dossierInfo ? l.dossierInfo.nom : ''} — régularisé par ${personneNom(moi)}`));
    const n = choisies.length;
    setSelection([]);
    showToast(`${n} ${pluriel(n, 'anomalie régularisée', 'anomalies régularisées')}.`);
  }

  async function signaler(l) {
    await dbSignalerRbe(l.dossier, moi, l.dossierInfo ? l.dossierInfo.nom : '');
    showToast('L’expert-comptable est prévenu : la demande apparaît sur sa ligne RBE.');
  }

  const vides = {
    lettres: 'Toutes vos lettres de mission sont au dossier.',
    identite: 'Toutes les pièces d’identité de vos dossiers sont là.',
    rbe: 'Aucun RBE à faire consulter sur vos dossiers.',
    notes: 'Toutes vos notes de synthèse sont au dossier.',
  };

  return h('div', { className: cx('page page-anomalies', 'onglet-' + actif) },
    h('div', { className: 'anomalies-entete' }, h('h1', null, 'Anomalies')),
    h('div', { className: 'segments', role: 'tablist' },
      ANOMALIES_ONGLETS.filter(o => COLLAB_ONGLETS.indexOf(o.code) >= 0).map(o => h('button', {
        key: o.code, role: 'tab',
        'aria-selected': actif === o.code ? 'true' : 'false',
        className: cx('segment', actif === o.code && 'actif'),
        onClick: () => allerOnglet(o.code),
      }, o.label, comptes[o.code] ? h('span', { className: 'segment-compte' }, comptes[o.code]) : null))
    ),
    h(TableauAnomalies, {
      lignes, colonneAnomalie: actif === 'notes', colonneSujet: 'Dossier',
      selection, onSelection: setSelection,
      delaiJours: Number(dbReglages().relanceDelaiJours || CABINET_SETTINGS_DEFAUT.relanceDelaiJours),
      vide: vides[actif], modeCollab: true, onSignaler: signaler,
    }),
    lignes.some(l => !l.pourLEc) ? h('div', { className: cx('barre-actions', choisies.length && 'visible') },
      h('span', { className: 'barre-actions-compte' },
        choisies.length
          ? `${choisies.length} ${pluriel(choisies.length, 'élément sélectionné', 'éléments sélectionnés')}`
          : (actif === 'notes' ? 'Cochez un dossier pour rédiger sa note' : 'Cochez un dossier pour déposer sa pièce')),
      h('button', { className: 'btn btn-tertiaire', disabled: !choisies.length, onClick: marquerRegularise }, 'Marquer régularisé'),
      /* Une note de synthèse ne se dépose pas : elle se rédige ici, et la
         valider la transmet à l'expert-comptable. */
      choisies.length === 1 && choisies[0].type === 'note_synthese_absente'
        ? h('button', { className: 'btn btn-primary', onClick: () => setARediger(choisies[0]) }, 'Rédiger la note')
        : h('button', {
          className: 'btn btn-primary', disabled: choisies.length !== 1,
          title: choisies.length > 1 ? 'Une pièce à la fois : cochez un seul dossier.' : undefined,
          onClick: () => setADeposer(choisies[0]),
        }, 'Déposer la pièce')
    ) : null,
    aRediger ? h(PanneauNoteSynthese, {
      anomalie: aRediger, moi, showToast,
      onFermer: () => { setARediger(null); setSelection([]); },
    }) : null,
    aDeposer ? h(PanneauDepot, {
      anomalie: aDeposer, moi, showToast,
      onFermer: () => { setADeposer(null); setSelection([]); },
    }) : null
  );
}

/* Le RBE dans le parcours d'entrée en mission, côté collaborateur : le
   registre ne s'ouvre pas, l'expert-comptable est prévenu. */
function SignalementRbeLigne({ nom, sansTitre }) {
  useDonnees();
  const cle = 'nouveau:' + morceauNom(nom || '');
  const signal = dbSignalementRbe(cle);
  return h('div', { className: cx('verif-ligne', sansTitre && 'verif-ligne-nue', signal && 'faite-ok') },
    sansTitre ? null : h('div', { className: 'verif-tete' },
      h('span', { className: cx('cq-pastille', signal ? 'vert' : 'gris') }, signal ? '✓' : '·'),
      h('span', { className: 'verif-nom' }, 'Registre des bénéficiaires effectifs')),
    h('div', { className: 'verif-detail' }, signal
      ? `L’expert-comptable a été prévenu le ${formatDate(signal.le)}.`
      : 'Consulté par l’expert-comptable.'),
    signal ? null : h('div', { className: 'verif-actions' },
      h('button', {
        className: 'btn btn-primary btn-sm',
        onClick: () => dbSignalerRbe(cle, collabCourant(), nom),
      }, 'Prévenir l’expert-comptable'))
  );
}

// -------------------------------------------------------- Mes obligations

function PanneauIndependance({ annee, moi, onFermer, showToast }) {
  const [coche, setCoche] = useState(false);
  async function signer() {
    await dbSignerDeclaration(annee, moi);
    showToast(`Attestation d’indépendance ${annee} signée.`);
    onFermer();
  }
  return h(PanneauLateral, {
    ouvert: true, titre: `Attestation d’indépendance ${annee}`, sousTitre: personneNom(moi), onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', disabled: !coche, onClick: signer }, 'Signer')),
  },
    h('section', { className: 'attestation-lue' },
      h('p', null, 'Je soussigné(e) ', h('strong', null, personneNom(moi)), ', déclare :'),
      h('ul', { className: 'attestation-lue-engagements' },
        ATTESTATION_INDEPENDANCE_ENGAGEMENTS.map((e, i) => h('li', { key: i }, e))),
      h('p', { className: 'attestation-lue-fondement' }, ATTESTATION_INDEPENDANCE_FONDEMENT)),
    h('label', { className: 'case-ligne obligation-engagement' },
      h('input', { type: 'checkbox', checked: coche, onChange: () => setCoche(!coche) }),
      h('span', { className: 'case-texte' }, 'J’atteste l’exactitude de cette déclaration.'))
  );
}

/* Une ligne d'obligation : ce qu'il faut faire, son état, et le bouton. */
function LigneObligation({ titre, etat, fait, children }) {
  return h('li', { className: cx('obligation-ligne', fait ? 'faite' : 'a-faire') },
    h('span', { className: 'obligation-marque', 'aria-hidden': 'true' }, fait ? '✓' : '●'),
    h('span', { className: 'obligation-texte' },
      h('span', { className: 'obligation-titre' }, titre),
      h('span', { className: 'obligation-etat' }, etat)),
    h('span', { className: 'obligation-actions' }, children)
  );
}

function CollabObligations({ moi, showToast }) {
  useDonnees();
  const o = obligationsDuCollab(moi);
  const [signer, setSigner] = useState(false);
  const champs = useRef({});

  async function deposerAttestation(s, fichier) {
    if (!fichier) return;
    await dbEnregistrerAttestation(s.id, moi);
    const ext = fichier.name.indexOf('.') >= 0 ? fichier.name.split('.').pop().toLowerCase() : 'pdf';
    const nom = `${String(s.date || '').slice(0, 7)}_FORMATION_${morceauNom(personneNom(moi))}.${ext}`;
    if (!driveConnecte()) telechargerRenomme(fichier, nom);
    showToast(driveConnecte()
      ? 'Attestation de formation enregistrée.'
      : `Attestation pointée reçue, renommée ${nom} et téléchargée : rangez-la dans votre dossier de formation.`);
  }

  return h('div', { className: 'page page-obligations' },
    h('div', { className: 'anomalies-entete' }, h('h1', null, 'Mes obligations')),
    h('div', { className: 'obligations-grille' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-violet' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'À signer')),
        h('ul', { className: 'obligations-liste' },
          o.independanceAttendue
            ? h(LigneObligation, {
              titre: `Attestation d’indépendance ${o.annee}`, fait: !!o.independance,
              etat: o.independance ? `Signée le ${formatDate(o.independance)}` : 'À signer',
            }, o.independance ? null : h('button', { className: 'btn btn-primary', onClick: () => setSigner(true) }, 'Lire et signer'))
            : h(LigneObligation, { titre: `Attestation d’indépendance ${o.annee}`, fait: true, etat: 'Pas encore demandée par l’expert-comptable' }),
          o.manuel
            ? h(LigneObligation, {
              titre: `Manuel de procédures ${o.manuel.numero}`, fait: !!o.manuelAccuse,
              etat: o.manuelAccuse
                ? (typeof o.manuelAccuse === 'string' ? `Lu et approuvé le ${formatDate(o.manuelAccuse)}` : 'Lu et approuvé')
                : `En vigueur depuis le ${formatDate(o.manuel.dateEffet)}`,
            },
              h('button', { className: 'btn btn-secondary', onClick: () => telechargerVersionManuel(o.manuel) }, 'Ouvrir'),
              o.manuelAccuse ? null : h('button', {
                className: 'btn btn-primary',
                onClick: async () => { await dbAccuserManuel(o.manuel.numero, moi); showToast('Manuel lu et approuvé.'); },
              }, 'Lu et approuvé'))
            : h(LigneObligation, { titre: 'Manuel de procédures', fait: true, etat: 'Pas encore publié par l’expert-comptable' })
        )
      ),
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-bleu' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'À lire')),
        o.documents.length
          ? h('ul', { className: 'obligations-liste' },
            o.documents.map(d => h(LigneObligation, {
              key: d.id, titre: d.label, fait: !!d.lu,
              etat: d.lu ? `Pris connaissance le ${formatDate(d.lu)}` : 'À lire',
            },
              h('button', { className: 'btn btn-secondary', onClick: d.ouvrir }, 'Ouvrir'),
              d.lu ? null : h('button', {
                className: 'btn btn-primary',
                onClick: async () => { await dbEnregistrerLecture(d.id, moi, d.label); showToast('Lecture enregistrée.'); },
              }, 'J’en ai pris connaissance'))))
          : h('p', { className: 'obligations-vide' }, 'Aucun document diffusé pour l’instant.')
      ),
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe obligations-formations' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Mes formations')),
        o.sessions.length
          ? h('ul', { className: 'obligations-liste' },
            o.sessions.map(({ session: s, recue }) => h(LigneObligation, {
              key: s.id, titre: s.titre, fait: recue,
              etat: `${formatDate(s.date)} — ${recue ? 'attestation reçue' : 'attestation à déposer'}`,
            }, recue ? null : h(React.Fragment, null,
              h('button', {
                className: 'btn btn-primary',
                onClick: () => champs.current[s.id] && champs.current[s.id].click(),
              }, 'Déposer l’attestation'),
              h('input', {
                type: 'file', style: { display: 'none' }, tabIndex: -1, 'aria-hidden': 'true',
                ref: el => { champs.current[s.id] = el; },
                onChange: e => deposerAttestation(s, e.target.files && e.target.files[0]),
            })))))
          : h('p', { className: 'obligations-vide' }, 'Aucune formation enregistrée à votre nom.')
      )
    ),
    signer ? h(PanneauIndependance, { annee: o.annee, moi, showToast, onFermer: () => setSigner(false) }) : null
  );
}

// ---------------------------------------------------------------- Paramètres

function CollabParametres({ moi, showToast }) {
  useDonnees();
  const fiche = collaborateur(moi) || {};
  const profil = dbProfilCollab(moi);
  const [email, setEmail] = useState(profil.email || fiche.email || '');
  const [telephone, setTelephone] = useState(profil.telephone || '');
  const [mdp, setMdp] = useState('');
  const [mdp2, setMdp2] = useState('');
  const [erreurMdp, setErreurMdp] = useState(null);
  const dossiers = CLIENTS.concat(dbDossiersAjoutes()).filter(c => dbAttributionDossier(c.id) === moi);
  const [creation, setCreation] = useState(false);
  const modifie = email !== (profil.email || fiche.email || '') || telephone !== (profil.telephone || '');

  async function enregistrer() {
    await dbMajProfilCollab(moi, { email: email.trim(), telephone: telephone.trim() });
    showToast('Coordonnées enregistrées.');
  }

  async function changerMdp() {
    if (mdp.length < 8) { setErreurMdp('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (mdp !== mdp2) { setErreurMdp('Les deux mots de passe ne correspondent pas.'); return; }
    setErreurMdp(null);
    let err = null;
    try {
      ({ error: err } = await supabaseClient.auth.updateUser({ password: mdp }));
    } catch (leve) { err = leve; }
    if (err) { setErreurMdp(typeof messageErreurAuth === 'function' ? messageErreurAuth(err) : (err.message || String(err))); return; }
    setMdp(''); setMdp2('');
    showToast('Mot de passe modifié.');
  }

  function demanderDossier() {
    const sujet = 'Attribution d’un dossier dans ComplyEC';
    const corps = `Bonjour,\n\nPourriez-vous m’attribuer le dossier suivant dans ComplyEC : \n\nMerci,\n${personneNom(moi)}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
  }

  return h('div', { className: 'page page-collab-parametres' },
    h('div', { className: 'anomalies-entete' }, h('h1', null, 'Paramètres')),
    h('div', { className: 'collab-param-grille' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit' },
        h('header', { className: 'bloc-carte-entete' },
          h('h2', null, 'Mon profil'),
          h('div', { className: 'bloc-carte-actions' },
            h('button', { className: 'btn btn-primary btn-sm', disabled: !modifie, onClick: enregistrer },
              modifie ? 'Enregistrer' : 'Enregistré'))),
        h('div', { className: 'collab-param-champs' },
          h(ChampPanneau, { label: 'Nom', valeur: fiche.nom || personneNom(moi), onChange: () => {}, disabled: true }),
          h(ChampPanneau, { label: 'Fonction', valeur: fiche.role || '', onChange: () => {}, disabled: true }),
          h(ChampPanneau, { label: 'E-mail', type: 'email', valeur: email, onChange: setEmail }),
          h(ChampPanneau, { label: 'Téléphone', type: 'tel', valeur: telephone, onChange: setTelephone })
        )
      ),
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-bleu' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Mot de passe')),
        h('div', { className: 'collab-param-champs' },
          h(ChampPanneau, { label: 'Nouveau mot de passe', type: 'password', valeur: mdp, onChange: setMdp }),
          h(ChampPanneau, { label: 'Confirmer', type: 'password', valeur: mdp2, onChange: setMdp2 }),
          erreurMdp ? h('p', { className: 'champ-erreur' }, erreurMdp) : null,
          h('div', null, h('button', { className: 'btn btn-primary', disabled: !mdp || !mdp2, onClick: changerMdp }, 'Changer le mot de passe'))
        )
      ),
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe collab-param-dossiers' },
        h('header', { className: 'bloc-carte-entete' },
          h('h2', null, 'Mes dossiers'),
          h('span', { className: 'bloc-carte-compte' }, dossiers.length)),
        dossiers.length
          ? h('ul', { className: 'collab-dossiers-liste' },
            dossiers.map(c => h('li', { key: c.id },
              h('span', { className: 'collab-dossier-nom' }, c.nom),
              h('span', { className: 'collab-dossier-forme' }, c.forme))))
          : h('p', { className: 'obligations-vide' }, 'Aucun dossier ne vous est attribué.'),
        h('div', { className: 'collab-dossiers-pied' },
          h('button', { className: 'btn btn-secondary', onClick: demanderDossier }, 'Demander un dossier à l’expert-comptable'),
          h('button', { className: 'btn btn-primary', onClick: () => setCreation(true) }, '+ Créer un dossier'))
      ),
      h(BlocDrive, { moi })
    ),
    creation ? h(PanneauCreationDossier, { moi, showToast, onFermer: () => setCreation(false) }) : null
  );
}

// ------------------------------------------------------- Note de synthèse

/* Les réponses possibles à chaque constat. Le statut choisi colore la note
   chez l'expert-comptable — vert, orangé, rouge — comme celles déjà
   enregistrées. */
const NOTE_CHOIX = {
  rentabilite: [
    { statut: 'positif', label: 'Rentable' }, { statut: 'neutre', label: 'À l’équilibre' }, { statut: 'negatif', label: 'Non rentable' }],
  problemes: [
    { statut: 'ok', label: 'Aucun point' }, { statut: 'attention', label: 'Points à suivre' }, { statut: 'risque', label: 'Point bloquant' }],
  continuite: [
    { statut: 'ok', label: 'Aucun risque identifié' }, { statut: 'attention', label: 'À surveiller' }, { statut: 'risque', label: 'Risque avéré' }],
};

/* Le dossier où la note se range dans le Drive. À caler sur l'arborescence
   que le cabinet arrêtera avec ses associés. */
function rangementNote(annee) { return `01_Comptable / ${annee}`; }

function telechargerNote(dossier, note) {
  const e = echapperHtml;
  const lignes = NOTE_SYNTHESE_CONSTATS.map(c =>
    `<tr><td><b>${e(c.label)}</b></td><td>${e((note[c.code] || {}).label || '—')}</td><td>${e(note[c.detail] || '')}</td></tr>`).join('');
  const nom = `${new Date().toISOString().slice(0, 7)}_NOTE_${morceauNom(dossier.nom)}.doc`;
  downloadWordDoc(nom, `Note de synthèse — ${dossier.nom}`,
    `<h1>Note de synthèse — exercice ${note.exercice}</h1>
     <p><b>Dossier :</b> ${e(dossier.nom)} — <b>Rédigée par :</b> ${e(personneNom(note.redigeePar) || '')}, le ${formatDate(note.redigeeLe)}</p>
     <table><tr><th>Constat</th><th>Appréciation</th><th>Détail</th></tr>${lignes}</table>
     <h2>Sujets à évoquer au rendez-vous bilan</h2><p>${e(note.sujets || '—')}</p>
     <h2>Commentaire du collaborateur</h2><p>${e(note.commentaireCollab || '—')}</p>`);
  return nom;
}

function PanneauNoteSynthese({ anomalie, moi, onFermer, showToast }) {
  const dossier = anomalie.dossierInfo;
  const exercice = Number(currentCalendarYear()) - 1;
  const [form, setForm] = useState({});
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));
  const complet = NOTE_SYNTHESE_CONSTATS.every(c => form[c.code]);

  async function valider() {
    const note = { redigeePar: moi, exercice, sujets: (form.sujets || '').trim(), commentaireCollab: (form.commentaire || '').trim() };
    NOTE_SYNTHESE_CONSTATS.forEach(c => { note[c.code] = form[c.code]; note[c.detail] = (form[c.detail] || '').trim(); });
    const enregistree = await dbEnregistrerNoteSynthese(anomalie.dossier, note);
    const nom = telechargerNote(dossier, enregistree);
    showToast(driveConnecte()
      ? `Note transmise à l’expert-comptable et rangée dans ${rangementNote(exercice)}.`
      : `Note transmise à l’expert-comptable. ${nom} est téléchargée : rangez-la dans ${rangementNote(exercice)}.`);
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true, large: true,
    titre: `Note de synthèse — exercice ${exercice}`,
    sousTitre: dossier ? dossier.nom : '',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', disabled: !complet, onClick: valider,
        title: complet ? undefined : 'Répondez aux trois constats.' }, 'Valider et transmettre à l’expert-comptable')),
  },
    h('div', { className: 'note-form' },
      NOTE_SYNTHESE_CONSTATS.map(c => h('div', { key: c.code, className: 'note-constat' },
        h('span', { className: 'champ-label' }, c.label),
        h('div', { className: 'note-choix' },
          NOTE_CHOIX[c.code].map(o => h('button', {
            key: o.statut, type: 'button',
            className: cx('note-option', 'ton-' + (NOTE_SYNTHESE_TONS[o.statut] || 'gris'), form[c.code] && form[c.code].statut === o.statut && 'actif'),
            onClick: () => maj(c.code, o),
          }, o.label))),
        h('textarea', {
          className: 'form-input note-detail', rows: 2, placeholder: 'En une ou deux phrases',
          'aria-label': `${c.label} — détail`,
          value: form[c.detail] || '', onChange: e => maj(c.detail, e.target.value),
        }))),
      h(ChampPanneau, { label: 'Sujets à évoquer au rendez-vous bilan', lignes: 2, valeur: form.sujets || '', onChange: v => maj('sujets', v) }),
      h(ChampPanneau, { label: 'Votre commentaire pour l’expert-comptable', lignes: 2, valeur: form.commentaire || '', onChange: v => maj('commentaire', v) })
    )
  );
}

// ------------------------------------------------------------ Mes dossiers

/* Créer un dossier : le SIRET suffit, l'annuaire public donne le reste. Le
   dossier entre dans ComplyEC, attribué à celui qui le crée, et son
   arborescence est celle du cabinet. */
function PanneauCreationDossier({ moi, onFermer, showToast }) {
  const [siret, setSiret] = useState('');
  const [fiche, setFiche] = useState(null);
  const [etat, setEtat] = useState(null);

  async function chercher() {
    setEtat('recherche');
    const r = await rechercherEntreprise(siret);
    if (r.trouve) { setFiche(r.fiche); setEtat(r.source); } else { setFiche({ siret, societe: '' }); setEtat('inconnu'); }
  }

  async function creer() {
    const d = await dbAjouterDossier(Object.assign({}, fiche, { siret: fiche.siret || siret }), moi);
    showToast(driveConnecte()
      ? `${d.nom} créé, avec son arborescence dans le Drive.`
      : `${d.nom} créé dans ComplyEC. L’arborescence sera créée dans le Drive dès qu’il sera raccordé.`);
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true, titre: 'Créer un dossier', onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', disabled: !fiche || !String(fiche.societe || '').trim(), onClick: creer }, 'Créer le dossier')),
  },
    h('div', { className: 'creation-dossier' },
      h('div', { className: 'creation-siret' },
        h(ChampPanneau, { label: 'SIRET ou SIREN', valeur: siret, onChange: v => { setSiret(v); setFiche(null); setEtat(null); } }),
        h('button', { className: 'btn btn-secondary', disabled: siret.replace(/\D/g, '').length < 9 || etat === 'recherche', onClick: chercher },
          etat === 'recherche' ? 'Recherche…' : 'Rechercher')),
      etat && etat !== 'recherche'
        ? h('p', { className: cx('creation-etat', etat === 'inconnu' ? 'ko' : 'ok') },
          etat === 'annuaire' ? '✓ Trouvé dans l’annuaire des entreprises'
            : etat === 'demo' ? '✓ Trouvé dans le jeu de démonstration (annuaire injoignable)'
              : 'Introuvable : saisissez la dénomination.')
        : null,
      fiche ? h(React.Fragment, null,
        h(ChampPanneau, { label: 'Dénomination', valeur: fiche.societe || '', onChange: v => setFiche(f => Object.assign({}, f, { societe: v })) }),
        h(ChampPanneau, { label: 'Dirigeant', valeur: fiche.dirigeant || '', onChange: v => setFiche(f => Object.assign({}, f, { dirigeant: v })) }),
        h('div', { className: 'creation-arbo' },
          h('span', { className: 'champ-label' }, 'Arborescence créée'),
          h('ul', null, DRIVE_TREE.map(r => h('li', { key: r.name }, r.name)))))
        : null
    )
  );
}

/* Le Drive, tel qu'il sera branché. Tant que le connecteur n'est pas posé,
   les deux actions disent ce qu'elles feront, sans prétendre le faire. */
function BlocDrive({ moi }) {
  const branche = driveConnecte();
  return h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-violet collab-param-drive' },
    h('header', { className: 'bloc-carte-entete' },
      h('h2', null, 'Drive du cabinet'),
      h('span', { className: 'bloc-carte-compte' }, branche ? 'raccordé' : 'non raccordé')),
    h('div', { className: 'drive-actions' },
      h('div', { className: 'drive-action' },
        h('strong', null, 'Actualiser mes dossiers'),
        h('span', null, 'Un dossier créé dans le Drive apparaît dans ComplyEC.'),
        h('button', { className: 'btn btn-secondary', disabled: !branche }, '↻ Actualiser')),
      h('div', { className: 'drive-action' },
        h('strong', null, 'Ranger un dossier avec Claude'),
        h('span', null, 'Claude lit les pièces d’un dossier, les renomme et les classe dans l’arborescence du cabinet.'),
        h('button', { className: 'btn btn-secondary', disabled: !branche }, '✨ Choisir un dossier'))),
    branche ? null : h('p', { className: 'drive-note' }, 'Ces deux actions s’activeront quand le connecteur Drive sera posé.'));
}
