/* ComplyEC — Accueil et entrée en mission
   =======================================

   Deux écrans qui ne montrent presque rien, et c'est leur travail.

   L'accueil porte quatre titres. Pas un chiffre, pas un pourcentage, pas un
   badge : un expert-comptable qui ouvre son logiciel n'a pas à lire un tableau
   de bord avant de savoir où aller. Les nombres existent — ils sont dans la
   synthèse du contrôle, où ils veulent dire quelque chose.

   L'entrée en mission porte deux titres et une flèche. Le fond des deux
   processus qu'elle ouvre est gelé : ni les champs, ni la logique, ni les
   contrôles, ni les règles métier n'ont bougé. */

'use strict';

// -------------------------------------------------------------- Les icônes
//
// Quatre traits, jamais de couleur propre : l'icône prend la teinte de son
// carré. Elle accompagne l'intitulé, elle ne le remplace pas — une action
// importante ne se désigne jamais par une icône seule.

function IconeAccueil({ nom }) {
  const commun = {
    width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': 'true', focusable: 'false',
  };
  if (nom === 'plume') {
    return h('svg', commun,
      h('path', { d: 'M4 20c0-6 3-11 9-13l4-1-1 4c-2 6-7 9-13 9z' }),
      h('path', { d: 'M4 20l7-7' })
    );
  }
  if (nom === 'alerte') {
    return h('svg', commun,
      h('path', { d: 'M12 4.5 3.5 19h17L12 4.5z' }),
      h('path', { d: 'M12 10v4' }),
      h('path', { d: 'M12 17h.01' })
    );
  }
  if (nom === 'dossier') {
    return h('svg', commun,
      h('path', { d: 'M3.5 7.5h6l1.6 2h9.4v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-11z' }),
      h('path', { d: 'M8 14.5l2.4 2.4 5-5' })
    );
  }
  if (nom === 'reglage') {
    // Roue dentée : la convention universelle des réglages. Un soleil ou des
    // curseurs demanderaient d'être interprétés.
    return h('svg', commun,
      h('circle', { cx: 12, cy: 12, r: 3.1 }),
      h('path', { d: 'M19.1 14.6a1.5 1.5 0 0 0 .3 1.65l.05.06a1.8 1.8 0 1 1-2.55 2.55l-.06-.06a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V20a1.8 1.8 0 1 1-3.6 0v-.09a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.65.3l-.06.06a1.8 1.8 0 1 1-2.55-2.55l.06-.06a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4a1.8 1.8 0 1 1 0-3.6h.09a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.65l-.06-.06A1.8 1.8 0 1 1 7.65 4.9l.06.06a1.5 1.5 0 0 0 1.65.3h.07A1.5 1.5 0 0 0 10.35 4V4a1.8 1.8 0 1 1 3.6 0v.09a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.06-.06a1.8 1.8 0 1 1 2.55 2.55l-.06.06a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9H20a1.8 1.8 0 1 1 0 3.6h-.09a1.5 1.5 0 0 0-1.37.9z' })
    );
  }
  return null;
}

// ----------------------------------------------------------------- Accueil

function ECAccueil({ navigateEc }) {
  return h('div', { className: 'page page-accueil' },
    h('div', { className: 'accueil-grille' },
      ACCUEIL_CARRES.map(c => h('button', {
        key: c.key,
        className: `accueil-carre teinte-${c.teinte}`,
        onClick: () => navigateEc(c.key, null),
      },
        h('span', { className: 'accueil-carre-icone' }, h(IconeAccueil, { nom: c.icone })),
        h('span', { className: 'accueil-carre-titre' }, c.label)
      ))
    )
  );
}

// -------------------------------------------------------- Entrée en mission

/* La flèche qui relie les deux carrés.

   Elle part du côté droit du premier, descend en s'arrondissant, et revient
   vers le côté droit du second. Elle dit l'ordre — lettre de reprise, puis
   contractualisation — sans transformer la page en schéma.

   Elle est décorative : le sens est déjà porté par l'ordre de lecture et par
   les intitulés, et un lecteur d'écran n'a rien à faire d'un trait. */
function FlecheEnchainement() {
  return h('svg', {
    className: 'entree-fleche',
    viewBox: '0 0 96 300', preserveAspectRatio: 'none',
    'aria-hidden': 'true', focusable: 'false',
  },
    h('path', {
      className: 'entree-fleche-trait',
      d: 'M2 74 C 62 74, 84 104, 84 150 C 84 196, 62 226, 12 226',
      fill: 'none',
    }),
    // Pointe, dirigée vers le carré du bas.
    h('path', {
      className: 'entree-fleche-pointe',
      d: 'M20 218 L10 226 L20 234',
      fill: 'none',
    })
  );
}

const ENTREE_ETAPES = [
  { key: 'courrier', label: 'Lettre de reprise', teinte: 'indigo' },
  { key: 'contractualisation', label: 'Contractualisation', teinte: 'violet' },
];

function ECEntreeMission({ navigateEc }) {
  return h('div', { className: 'page page-entree' },
    h('div', { className: 'entree-scene' },
      h('div', { className: 'entree-colonne' },
        ENTREE_ETAPES.map(e => h('button', {
          key: e.key,
          className: `entree-carre teinte-${e.teinte}`,
          onClick: () => navigateEc('entree-mission', e.key),
        }, h('span', { className: 'entree-carre-titre' }, e.label)))
      ),
      h('div', { className: 'entree-gouttiere' }, h(FlecheEnchainement))
    )
  );
}
