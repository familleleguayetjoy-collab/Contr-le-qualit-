// ComplyEC — Paramètres › Mise en service et pilote
'use strict';

/* Un écran pour l'expert-comptable qui met le logiciel en service et le
   met à l'épreuve sur un pilote. Trois questions, trois rectangles :

   1. Où en est la mise en service ? Démonstration ou données réelles, et la
      liste des étapes, chacune cochée par un fait (clients importés,
      collaborateurs invités, dossiers attribués, état de départ figé).
   2. Quel est l'état de départ ? La photographie du portefeuille AVANT
      toute régularisation : sans elle, le pilote ne mesure rien.
   3. Que donnent les règles ? Par règle : dossiers concernés, anomalies
      détectées, régularisées (et comment), faux positifs, délais. Les
      chiffres s'exportent, anonymisés, pour le mémoire. */

function etapesMiseEnService() {
  const reel = modeCabinetReel();
  const clients = CLIENTS.length;
  const collabs = COLLABORATEURS.length;
  const sansCollab = CLIENTS.filter(c => !dbAttributionDossier(c.id)).length;
  const t0 = (demoLireEtat().pilote || {}).etatDepart;
  const associes = Object.values(demoLireEtat().driveDossiers || {}).filter(Boolean).length;
  return [
    { code: 'reel', fait: reel, titre: 'Données réelles du cabinet activées',
      detail: reel ? `Depuis le ${formatDate(String(cabinetReel().depuis || '').slice(0, 10)) || '—'}` : 'Le cabinet est en démonstration.' },
    { code: 'clients', fait: reel && clients > 0, titre: 'Liste des clients importée',
      detail: reel ? (clients ? `${clients} ${pluriel(clients, 'dossier', 'dossiers')}` : 'Aucun dossier pour l’instant.') : '—' },
    { code: 'equipe', fait: reel && collabs > 0, titre: 'Collaborateurs invités',
      detail: reel ? (collabs ? `${collabs} ${pluriel(collabs, 'compte', 'comptes')} collaborateur` : 'Invitez-les dans « Utilisateurs et gouvernance ».') : '—' },
    { code: 'attribution', fait: reel && clients > 0 && sansCollab === 0, titre: 'Chaque dossier a son collaborateur',
      detail: reel && clients ? (sansCollab ? `${sansCollab} ${pluriel(sansCollab, 'dossier', 'dossiers')} sans collaborateur` : 'Tous attribués') : '—' },
    { code: 't0', fait: !!t0, titre: 'État de départ du pilote figé',
      detail: t0 ? `Le ${formatDate(t0.le)}, référentiel ${t0.version}` : 'À faire avant toute régularisation.' },
    /* La lecture seule suffit à régulariser ; le classement automatique
       (écriture dans le Drive) n'est pas posé, et l'écran ne le prétend pas. */
    { code: 'drive', fait: reel && associes > 0, titre: 'Drive du cabinet lu (lecture seule)',
      detail: reel && associes > 0
        ? `${associes} ${pluriel(associes, 'dossier associé', 'dossiers associés')} à leur dossier du Drive`
        : 'Pas encore : voir le guide du Drive.' },
  ];
}

/* Le passage aux données réelles : définitif, donc confirmé, et dit en
   clair avant le clic. */
function PanneauPasserEnReel({ onFermer, showToast }) {
  const [compris, setCompris] = useState(false);
  const [enCours, setEnCours] = useState(false);
  async function valider() {
    setEnCours(true);
    const { error } = await supabaseClient.rpc('cabinet_passer_en_reel');
    if (error) {
      setEnCours(false);
      showToast(`Le passage n’a pas pu se faire : ${error.message}`);
      return;
    }
    showToast('Cabinet passé en données réelles : la page se recharge.');
    setTimeout(() => window.location.reload(), 900);
  }
  return h(PanneauLateral, {
    ouvert: true, titre: 'Passer aux données réelles du cabinet', onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', disabled: !compris || enCours, onClick: valider }, 'Passer aux données réelles')),
  },
    h('ul', { className: 'pilote-consequences' },
      h('li', null, 'Les dossiers, les personnes et les signatures de la démonstration disparaissent pour toute l’équipe.'),
      h('li', null, 'Tout ce qui sera saisi ensuite est enregistré dans la base du cabinet et partagé avec l’équipe.'),
      h('li', null, 'Le choix est définitif pour ce cabinet : on ne revient pas à la démonstration.'),
      h('li', null, 'Ensuite : importer la liste des clients, inviter les collaborateurs, attribuer les dossiers, puis figer l’état de départ.')),
    h('label', { className: 'case-ligne obligation-engagement' },
      h('input', { type: 'checkbox', checked: compris, onChange: () => setCompris(!compris) }),
      h('span', { className: 'case-texte' }, 'J’ai compris : le cabinet passe en données réelles.')));
}

function PanneauReferentiel({ onFermer }) {
  return h(PanneauLateral, {
    ouvert: true, large: true, titre: `Référentiel des règles — version ${REGLES_VERSION.numero}`,
    sousTitre: `Arrêté le ${formatDate(REGLES_VERSION.date)}`, onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
      h('button', { className: 'btn btn-primary', onClick: exporterReferentiel }, 'Exporter le référentiel')),
  },
    h('p', { className: 'panneau-explication' },
      'Les fondements sont ceux que ComplyEC cite ailleurs : ils restent à relire dans le texte en vigueur avant d’être repris dans un document.'),
    REGLES.map(r => h('section', { key: r.code, className: 'regle-fiche' },
      h('h3', null, `${r.code} — ${r.diligence}`),
      h('dl', null,
        h('dt', null, 'Obligation'), h('dd', null, r.obligation),
        h('dt', null, 'Fondement'), h('dd', null, r.fondement),
        h('dt', null, 'Preuve attendue'), h('dd', null, r.preuve),
        h('dt', null, 'Quand'), h('dd', null, r.temporalite),
        h('dt', null, 'Qui régularise'), h('dd', null, `${r.responsable}, sous ${r.delaiJours} jours`),
        h('dt', null, 'Part de jugement'), h('dd', null, r.jugement)))));
}

function ParamPilote({ showToast }) {
  useDonnees();
  const [passer, setPasser] = useState(false);
  const [referentiel, setReferentiel] = useState(false);
  const [regulariser, setRegulariser] = useState(false);
  const reel = modeCabinetReel();
  const etapes = etapesMiseEnService();
  const faites = etapes.filter(e => e.fait).length;
  const mesures = mesuresPilote();
  const t0 = mesures.etatDepart;
  const installation = typeof ETAT_INSTALLATION !== 'undefined' ? ETAT_INSTALLATION : null;
  const peutPasser = !reel && installation && installation.connecte && installation.migration005;

  async function figer() {
    await figerEtatDepart();
    showToast('État de départ figé : les mesures du pilote partent de maintenant.');
  }

  /* Ce qui empêche, s'il y a lieu, de passer aux données réelles : dit tel
     quel, avec ce qu'il faut faire. */
  let blocage = null;
  if (!reel && !peutPasser) {
    blocage = !installation || !installation.connecte
      ? 'Démonstration sans connexion au serveur du cabinet.'
      : 'Le script supabase/schema_005_etat_partage.sql n’a pas encore été exécuté sur le projet Supabase (voir le guide de mise en service).';
  }

  if (regulariser) return h(RegularisationDossiers, { onRetour: () => setRegulariser(false), showToast });

  const prop = mesures.propositions;

  return h(RubriquePage, {
    titre: 'Mise en service et pilote',
    actions: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: () => setReferentiel(true) },
        `Référentiel des règles (v${REGLES_VERSION.numero})`),
      h('button', { className: 'btn btn-primary', onClick: () => setRegulariser(true) }, 'Régulariser dossier par dossier')),
  },
    h('div', { className: 'pilote-grille' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Mise en service'),
          h('span', { className: 'bloc-carte-compte' }, `${faites} / ${etapes.length}`)),
        h('div', { className: 'pilote-corps' },
          h('ul', { className: 'obligations-liste' }, etapes.map(e => h('li', {
            key: e.code, className: cx('obligation-ligne', e.fait ? 'faite' : 'a-faire'),
          },
            h('span', { className: 'obligation-marque', 'aria-hidden': 'true' }, e.fait ? '✓' : '●'),
            h('span', { className: 'obligation-texte' },
              h('span', { className: 'obligation-titre' }, e.titre),
              h('span', { className: 'obligation-etat' }, e.detail))))),
          reel
            ? h('div', { className: 'pilote-import' },
              h('span', { className: 'champ-label' }, 'Liste des clients (Excel ou CSV)'),
              h(ImportClients, { showToast, libelle: CLIENTS.length ? 'Remplacer la liste des clients' : 'Importer la liste des clients' }))
            : h('div', { className: 'pilote-demo' },
              h('p', null, 'Le cabinet est en démonstration : les dossiers et les personnes affichés sont fictifs, et rien n’est partagé avec l’équipe.'),
              peutPasser
                ? h('button', { className: 'btn btn-primary', onClick: () => setPasser(true) }, 'Passer aux données réelles…')
                : h('p', { className: 'pilote-blocage' }, blocage)))),

      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Pilote : état de départ et mesures'),
          h('span', { className: 'bloc-carte-compte' }, `${mesures.dossiers} ${pluriel(mesures.dossiers, 'dossier', 'dossiers')}`)),
        h('div', { className: 'pilote-corps' },
          t0
            ? h('p', { className: 'pilote-t0' }, '✓ État de départ figé le ', h('strong', null, formatDate(t0.le)),
              ` par ${t0.par} — référentiel ${t0.version}, ${t0.dossiers} ${pluriel(t0.dossiers, 'dossier', 'dossiers')}, `
              + `${t0.ouvertes.length} ${pluriel(t0.ouvertes.length, 'anomalie ouverte', 'anomalies ouvertes')}.`)
            : h('div', { className: 'pilote-t0 a-faire' },
              h('p', null, 'Figez l’état de départ avant toute régularisation : c’est la référence à laquelle le pilote sera comparé.'),
              h('button', {
                className: 'btn btn-primary', disabled: !reel || !CLIENTS.length, onClick: figer,
                title: !reel ? 'En démonstration, les mesures n’ont pas de sens.' : (!CLIENTS.length ? 'Importez d’abord la liste des clients.' : undefined),
              }, 'Figer l’état de départ')),
          h('div', { className: 'tableau-moderne-enveloppe pilote-mesures' },
            h('table', { className: 'tableau-moderne' },
              h('thead', null, h('tr', null,
                ['Règle', 'Dossiers', 'Détectées', 'Réglées', 'Sans objet', 'Ouvertes', 'Délai médian'].map(t => h('th', { key: t }, t)))),
              h('tbody', null, mesures.regles.map(r => h('tr', { key: r.regle },
                h('td', { className: 'col-principale', title: r.diligence }, `${r.regle} — ${r.court}`),
                h('td', null, r.applicables),
                h('td', null, r.detectees),
                h('td', null, r.regularisees),
                h('td', null, r.fauxPositifs),
                h('td', null, r.ouvertes),
                h('td', null, r.delaiMedianJours === null ? '—' : `${r.delaiMedianJours} j`)))))),
          prop && prop.rattachees
            ? h('p', { className: 'pilote-propositions' },
              `${prop.rattachees} ${pluriel(prop.rattachees, 'pièce rattachée', 'pièces rattachées')} depuis le Drive. `
              + (prop.proposees
                ? `ComplyEC avait proposé un fichier pour ${prop.proposees} d’entre elles ; sa proposition a été retenue ${prop.retenues} fois.`
                : 'ComplyEC n’avait proposé aucun fichier.'))
            : null,
          h('div', { className: 'pilote-exports' },
            h('button', { className: 'btn btn-secondary', disabled: !mesures.dossiers, onClick: () => exporterResultatsPilote(true) }, 'Exporter les résultats (anonymisés)'),
            h('button', { className: 'btn btn-secondary', onClick: exporterMesuresJson }, 'Exporter les mesures')))),
    ),
    passer ? h(PanneauPasserEnReel, { onFermer: () => setPasser(false), showToast }) : null,
    referentiel ? h(PanneauReferentiel, { onFermer: () => setReferentiel(false) }) : null
  );
}
