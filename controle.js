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
function RubriqueEntete({ titre, actions }) {
  return h('header', { className: 'rubrique-entete' },
    h('h1', null, titre),
    actions ? h('div', { className: 'rubrique-actions' }, actions) : null
  );
}

function RubriquePage({ titre, actions, dense, children }) {
  return h('div', { className: cx('rubrique-page', dense && 'dense') },
    h(RubriqueEntete, { titre, actions }),
    children
  );
}

// ----------------------------------------------- Rubrique 5 : Supervision
//
// Deux situations, pas une de plus (§ 10). Les données viennent du module
// Anomalies : aucune saisie n'est demandée ici, et rien n'y est stocké.

const SUPERVISION_VUES = [
  { code: 'note_synthese_absente', label: 'Absentes' },
  { code: 'note_synthese_non_supervisee', label: 'Non supervisées' },
];

function RubriqueSupervision({ navigateEc, cabinetSettings }) {
  const [vue, setVue] = useState('note_synthese_absente');
  const toutes = anomaliesDeLOnglet('notes');
  const lignes = toutes.filter(a => a.type === vue);
  const delai = Number(cabinetSettings.relanceDelaiJours || CABINET_SETTINGS_DEFAUT.relanceDelaiJours);

  return h(RubriquePage, { titre: 'Supervision des dossiers' },
    h('div', { className: 'selecteurs-sobres' },
      SUPERVISION_VUES.map(v => {
        const n = toutes.filter(a => a.type === v.code).length;
        return h('button', {
          key: v.code,
          className: cx('selecteur-sobre', vue === v.code && 'actif'),
          onClick: () => setVue(v.code),
        },
          h('span', { className: 'selecteur-nombre' }, n),
          h('span', { className: 'selecteur-label' }, v.label)
        );
      })
    ),

    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'),
            h('th', null, 'Collaborateur'),
            h('th', null, 'Détectée le'),
            h('th', null, 'Dernière relance'),
            h('th', null, 'Statut')
          )),
          h('tbody', null, lignes.map(l => {
            const st = statutAnomalie(l, delai);
            return h('tr', {
              key: l.cle,
              className: 'ligne-cliquable',
              // Cliquer un dossier emmène là où l'anomalie se traite : dans
              // l'onglet Anomalies, pas dans un troisième écran qui en
              // recopierait le contenu.
              onClick: () => navigateEc('anomalies', 'notes'),
            },
              h('td', { className: 'col-principale' }, l.dossierInfo ? l.dossierInfo.nom : l.dossier),
              h('td', null, l.collaborateurInfo ? l.collaborateurInfo.nom : '—'),
              h('td', { className: 'col-date' }, formatDate(l.detecteLe)),
              h('td', { className: 'col-date' }, l.derniereRelance ? formatDate(l.derniereRelance) : '—'),
              h('td', null, h(Pastille, { ton: st.ton }, st.label))
            );
          }))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '✓'),
        h('p', null, vue === 'note_synthese_absente'
          ? 'Toutes les notes de synthèse sont au dossier.'
          : 'Toutes les notes de synthèse ont été supervisées.')
      )
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

  return h('div', { className: 'page page-controle' },
    h('div', { className: 'controle-shell' },
      h('nav', { className: 'controle-menu', 'aria-label': 'Rubriques du contrôle' },
        CONTROLE_RUBRIQUES.map(r => h('button', {
          key: r.key,
          className: cx('controle-menu-item', actif === r.key && 'actif'),
          'aria-current': actif === r.key ? 'page' : null,
          onClick: () => navigateEc('controle', r.key),
        }, r.label))
      ),
      h('div', { className: 'controle-contenu', key: actif }, contenu)
    )
  );
}
