/* ComplyEC — Préparer le contrôle
   ===============================

   Huit rubriques derrière un menu latéral léger. Pas huit grandes cartes
   colorées : ce n'est pas un choix qu'on fait une fois, c'est un classeur dans
   lequel on circule. Le menu reste donc visible et compact, et seul l'espace
   central change.

   Chaque rubrique vit dans le fichier qui porte déjà son métier — la
   surveillance dans qualite.js, la LCB-FT dans lbcft.js, le manuel dans
   manuel.js. Ce fichier-ci ne fait que les assembler, plus les deux rubriques
   qui n'ont pas de métier propre : la supervision, qui lit les anomalies, et la
   synthèse, qui compte. */

'use strict';

// -------------------------------------------------------- En-tête de rubrique

/* Un titre, et des actions à droite s'il y en a. Jamais de sous-titre ajouté
   pour remplir : si le titre suffit, il n'y a que le titre. */
function RubriqueEntete({ titre, actions, retour }) {
  return h('header', { className: cx('rubrique-entete', retour && 'avec-retour') },
    retour,
    h('h1', null, titre),
    actions ? h('div', { className: 'rubrique-actions' }, actions) : null
  );
}

/* `retour` n'apparaît que sur un écran ouvert par une carte de hub : il nomme
   le hub d'où l'on vient, pour qu'on n'ait pas à s'en souvenir. */
function RubriquePage({ titre, actions, retour, dense, children }) {
  return h('div', { className: cx('rubrique-page', dense && 'dense') },
    h(RubriqueEntete, { titre, actions, retour }),
    children
  );
}

// ----------------------------------------------- Rubrique 5 : Supervision
//
// Deux situations, pas une de plus (§ 10). Les données viennent du module
// Anomalies : aucune saisie n'est demandée ici, et rien n'y est stocké.

/* Deux situations qui n'appellent pas le même geste, donc deux couleurs.

   « Absentes » est une pièce qui manque : le collaborateur doit la déposer,
   c'est une relance. « Non supervisées » est un travail de l'expert-comptable
   lui-même : la note est là, elle attend sa revue. Les confondre enverrait la
   demande à la mauvaise personne. */
const SUPERVISION_VUES = [
  { code: 'note_synthese_absente', label: 'Absentes', teinte: 'ambre' },
  { code: 'note_synthese_non_supervisee', label: 'Non supervisées', teinte: 'violet' },
];

/* Le panneau de supervision d'une note.

   À gauche de l'écran, ce que le collaborateur a écrit : quatre points, tels
   qu'il les a rédigés, en lecture seule. L'expert-comptable ne réécrit pas le
   travail de son collaborateur, il le supervise.

   En dessous, les deux champs qui sont les siens : son retour sur le plan
   comptable, et ce qui est prévu pour l'assemblée générale ordinaire. Le
   premier est obligatoire — une supervision sans retour n'est pas une
   supervision, et un contrôleur qui trouverait une case cochée sans une ligne
   écrite le relèverait. */
function PanneauSupervision({ anomalie, onFermer, showToast }) {
  const dossierId = anomalie.dossier;
  const note = noteSyntheseDuDossier(dossierId);
  const deja = dbSupervisionDuDossier(dossierId);
  const [retour, setRetour] = useState(deja ? deja.retourComptable || '' : '');
  const [ago, setAgo] = useState(deja ? deja.ago || '' : '');

  const redacteur = note ? collaborateur(note.redigeePar) : null;

  async function superviser() {
    if (!retour.trim()) {
      showToast('Écrivez votre retour sur le plan comptable avant de superviser.');
      return;
    }
    await dbEnregistrerSupervision(dossierId, { retourComptable: retour.trim(), ago: ago.trim() });
    showToast('Note supervisée — votre retour est enregistré et daté.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: anomalie.dossierInfo ? anomalie.dossierInfo.nom : dossierId,
    sousTitre: note
      ? `Note rédigée par ${redacteur ? redacteur.nom : note.redigeePar} le ${formatDate(note.redigeeLe)}`
      : 'Note au dossier, contenu non repris dans ComplyEC',
    onFermer, large: true,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
      h('button', { className: 'btn btn-primary', onClick: superviser },
        deja ? 'Mettre à jour la supervision' : 'Superviser la note')
    ),
  },
    note
      ? h('section', { className: 'supervision-note' },
        h('h3', { className: 'supervision-sous-titre' }, 'Ce que le collaborateur a écrit'),
        NOTE_SYNTHESE_CHAMPS.map(c => h('div', { className: 'supervision-bloc', key: c.code },
          h('div', { className: 'supervision-bloc-label' }, c.label),
          h('p', { className: 'supervision-bloc-texte' }, note[c.code] || '—')
        ))
      )
      : h('p', { className: 'conf-detail' },
        'Le contenu de la note n’est pas repris dans ComplyEC pour ce dossier : ouvrez-la dans le dossier avant de la superviser.'),

    h('section', { className: 'supervision-retour' },
      h('h3', { className: 'supervision-sous-titre' }, 'Votre supervision'),
      h(ChampPanneau, {
        label: 'Retour sur le plan comptable',
        aide: 'Ce que vous répondez aux points soulevés, et ce qui reste à corriger avant la liasse.',
        valeur: retour, onChange: setRetour, lignes: 5,
      }),
      h(ChampPanneau, {
        label: 'Ce qui est prévu pour l’assemblée générale ordinaire',
        aide: 'Affectation du résultat, points à porter à l’ordre du jour, date envisagée.',
        valeur: ago, onChange: setAgo, lignes: 4,
      }),
      deja
        ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          `Supervisée le ${formatDate(deja.revuLe)} par ${deja.par}.`)
        : null
    )
  );
}

function RubriqueSupervision({ navigateEc, cabinetSettings, showToast }) {
  const [vue, setVue] = useState('note_synthese_absente');
  const [ouverte, setOuverte] = useState(null);
  useDonnees();
  const toutes = anomaliesDeLOnglet('notes');
  const lignes = toutes.filter(a => a.type === vue);
  const delai = Number(cabinetSettings.relanceDelaiJours || CABINET_SETTINGS_DEFAUT.relanceDelaiJours);
  const vueCourante = SUPERVISION_VUES.find(v => v.code === vue);

  return h(RubriquePage, { titre: 'Supervision des dossiers' },
    h('div', { className: 'selecteurs-sobres' },
      SUPERVISION_VUES.map(v => {
        const n = toutes.filter(a => a.type === v.code).length;
        return h('button', {
          key: v.code,
          className: cx('selecteur-sobre', 'teinte-' + v.teinte, vue === v.code && 'actif'),
          onClick: () => setVue(v.code),
        },
          h('span', { className: 'selecteur-nombre' }, n),
          h('span', { className: 'selecteur-label' }, v.label)
        );
      })
    ),

    /* Une note absente se relance : c'est le collaborateur qui la doit. Une
       note non supervisée ne se relance pas : c'est l'expert-comptable qui la
       doit. Les deux tableaux ne portent donc ni les mêmes colonnes, ni le
       même geste. */
    vue === 'note_synthese_non_supervisee'
      ? h('p', { className: 'supervision-rappel' },
        'Ces notes sont au dossier. Ce qui manque est votre revue : ouvrez-en une pour lire ce que le collaborateur a écrit et y répondre.')
      : null,

    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'),
            h('th', null, vue === 'note_synthese_non_supervisee' ? 'Rédigée par' : 'Collaborateur'),
            h('th', null, vue === 'note_synthese_non_supervisee' ? 'Rédigée le' : 'Détectée le'),
            vue === 'note_synthese_non_supervisee' ? null : h('th', null, 'Dernière relance'),
            h('th', null, 'Statut')
          )),
          h('tbody', null, lignes.map(l => {
            const st = statutAnomalie(l, delai);
            const note = noteSyntheseDuDossier(l.dossier);
            const superviser = vue === 'note_synthese_non_supervisee';
            return h('tr', {
              key: l.cle,
              className: 'ligne-cliquable',
              /* Une note absente emmène là où elle se relance, dans l'onglet
                 Anomalies. Une note à superviser ouvre le panneau de revue :
                 c'est ici que le travail se fait. */
              onClick: () => (superviser ? setOuverte(l) : navigateEc('anomalies', 'notes')),
            },
              h('td', { className: 'col-principale' }, l.dossierInfo ? l.dossierInfo.nom : l.dossier),
              h('td', null, l.collaborateurInfo ? l.collaborateurInfo.nom : '—'),
              h('td', { className: 'col-date' },
                formatDate(superviser && note ? note.redigeeLe : l.detecteLe)),
              superviser ? null : h('td', { className: 'col-date' },
                l.derniereRelance ? formatDate(l.derniereRelance) : '—'),
              h('td', null, superviser
                ? h(Pastille, { ton: 'violet' }, 'À superviser')
                : h(Pastille, { ton: st.ton }, st.label))
            );
          }))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '✓'),
        h('p', null, vue === 'note_synthese_absente'
          ? 'Toutes les notes de synthèse sont au dossier.'
          : 'Toutes les notes de synthèse ont été supervisées.')
      ),

    ouverte ? h(PanneauSupervision, {
      anomalie: ouverte,
      onFermer: () => setOuverte(null),
      showToast,
    }) : null
  );
}

// ------------------------------------------------- Rubrique 8 : Synthèse
//
// Un pourcentage, et au plus quatre urgences. Rien d'autre (§ 13).

/* L'anneau de progression. Fin, sobre, sans quadrillage ni légende : il donne
   une proportion, pas une analyse. */
function AnneauProgression({ valeur }) {
  const rayon = 66;
  const circonference = 2 * Math.PI * rayon;
  const rempli = circonference * Math.max(0, Math.min(100, valeur)) / 100;
  return h('div', { className: 'anneau' },
    h('svg', { viewBox: '0 0 160 160', 'aria-hidden': 'true', focusable: 'false' },
      h('circle', {
        cx: 80, cy: 80, r: rayon, fill: 'none',
        stroke: 'var(--sec-teal-bord)', strokeWidth: 9,
      }),
      h('circle', {
        cx: 80, cy: 80, r: rayon, fill: 'none',
        stroke: 'var(--sec-teal)', strokeWidth: 9, strokeLinecap: 'round',
        strokeDasharray: `${rempli} ${circonference}`,
        transform: 'rotate(-90 80 80)',
      })
    ),
    h('div', { className: 'anneau-valeur' },
      h('span', { className: 'anneau-nombre' }, valeur),
      h('span', { className: 'anneau-unite' }, '%')
    )
  );
}

function RubriqueSynthese({ navigateEc, cabinetSettings }) {
  const etat = etatPreparation(cabinetSettings);

  return h(RubriquePage, { titre: 'Synthèse du contrôle' },
    h('div', { className: 'synthese-corps' },
      h('section', { className: 'synthese-jauge' },
        h(AnneauProgression, { valeur: etat.completude }),
        h('p', { className: 'synthese-legende' }, 'Préparation')
      ),

      h('section', { className: 'synthese-urgences' },
        h('h2', null, 'À traiter en priorité'),
        etat.urgences.length
          ? h('div', { className: 'urgences-grille' },
            etat.urgences.map((u, i) => h('button', {
              key: i,
              className: 'urgence-carte',
              onClick: () => navigateEc(u.section, u.sub),
            },
              h('span', { className: 'urgence-texte' }, u.libelle),
              h('span', { className: 'urgence-fleche' }, '→')
            ))
          )
          /* S'il ne reste rien, on ne complète pas la grille pour faire nombre :
             on le dit. */
          : h('div', { className: 'anomalies-vide' },
            h('span', { className: 'anomalies-vide-marque' }, '✓'),
            h('p', null, 'Aucune urgence : les obligations suivies par ComplyEC sont couvertes.')
          )
      )
    )
  );
}

// ------------------------------------------------------------- La coque

function ECPreparerControle({ rubrique, navigateEc, showToast, cabinetSettings, onChangerReglage, onApercuCollab }) {
  useDonnees();
  const actif = CONTROLE_RUBRIQUES.some(r => r.key === rubrique) ? rubrique : 'synthese';
  const commun = { navigateEc, showToast, cabinetSettings, onChangerReglage, onApercuCollab };

  let contenu;
  if (actif === 'manuel') contenu = h(RubriqueManuel, commun);
  else if (actif === 'independance') contenu = h(RubriqueIndependance, commun);
  else if (actif === 'formations') contenu = h(RubriqueFormations, commun);
  else if (actif === 'lbcft') contenu = h(RubriqueLbcft, commun);
  else if (actif === 'supervision') contenu = h(RubriqueSupervision, commun);
  else if (actif === 'surveillance') contenu = h(RubriqueSurveillance, commun);
  else if (actif === 'rgpd') contenu = h(RubriqueRgpd, commun);
  else contenu = h(RubriqueSynthese, commun);

  /* Plus de second menu latéral : les huit rubriques sont dans la barre de
     gauche, et doubler la colonne revenait à faire lire deux menus. */
  return h('div', { className: 'page page-controle' },
    h('div', { className: 'controle-contenu', key: actif }, contenu)
  );
}
