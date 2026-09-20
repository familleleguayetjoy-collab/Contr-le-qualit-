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

// ----------------------------------------------------------------- Accueil

/* Le titre d'accueil. Une phrase, pas un tableau de bord.

   Il tient en deux lignes : le bonjour, puis la seule chose à savoir pour
   cliquer — ces quatre carrés sont tout le logiciel. Rien d'autre n'est écrit
   ici, parce que rien d'autre n'aide à choisir. */
function AccueilBienvenue() {
  return h('header', { className: 'scene-entete' },
    h('h1', { className: 'scene-titre' },
      'Bienvenue dans ',
      h('span', { className: 'scene-titre-accent' }, 'ComplyEC')
    ),
    h('p', { className: 'scene-sous-titre' }, 'Par où souhaitez-vous commencer ?')
  );
}

function ECAccueil({ navigateEc }) {
  return h('div', { className: 'page page-accueil' },
    h('div', { className: 'scene' },
      h(AccueilBienvenue),
      h(CartesHub, {
        cartes: ACCUEIL_CARRES,
        colonnes: 2,
        onOuvrir: key => navigateEc(key, null),
      })
    )
  );
}

// -------------------------------------------------------- Entrée en mission

/* La flèche qui relie les deux carrés.

   Ce n'est pas un trait mais une forme pleine : un croissant qui s'épaissit en
   descendant, terminé par une pointe franche. Elle dit l'ordre — lettre de
   reprise, puis contractualisation — et elle se voit sans qu'on la cherche.

   Deux corrections demandées le 20 septembre.

   La pointe s'arrêtait à 496 px, mesurés à 1366 × 768, soit 72 px seulement
   dans la hauteur du second carré : elle montrait le bas de l'écran plutôt que
   le carré. Le dessin est donc plus haut que large — un cadre de 100 × 155 au
   lieu d'un carré — et sa pointe revient vers la gauche, du côté des carrés,
   au lieu de filer vers la droite. Posée au bas de la gouttière, elle part du
   premier carré et arrive dans le second.

   Le dégradé, lui, allait d'un bleu à un violet trop proches pour se voir à
   cette taille. Il part maintenant d'un bleu clair et finit sur un violet
   franc, dans l'ordre des deux carrés qu'il relie.

   Elle garde ses proportions (preserveAspectRatio par défaut) : une forme
   pleine étirée deviendrait un trait mou.

   Elle est décorative : le sens est déjà porté par l'ordre de lecture et par
   les intitulés, et un lecteur d'écran n'a rien à faire d'un dessin. */
function FlecheEnchainement() {
  return h('svg', {
    className: 'entree-fleche',
    viewBox: '0 0 100 155',
    'aria-hidden': 'true', focusable: 'false',
  },
    h('defs', null,
      h('linearGradient', { id: 'degradeFleche', x1: '0.15', y1: '0', x2: '0.45', y2: '1' },
        h('stop', { offset: '0%', stopColor: '#6E9BF7' }),
        h('stop', { offset: '45%', stopColor: '#4C7DF0' }),
        h('stop', { offset: '100%', stopColor: '#6D4FD6' })
      )
    ),
    h('path', {
      className: 'entree-fleche-forme',
      d: 'M 10 10'
        + ' C 70 14, 96 52, 68 96'          // bord extérieur : fin au départ, épais en bas
        + ' L 88 106'                       // barbe extérieure
        + ' L 30 148'                       // pointe, ramenée vers le carré du bas
        + ' L 20 86'                        // barbe intérieure
        + ' L 48 94'                        // retour sur le corps
        + ' C 66 60, 46 32, 14 20'          // bord intérieur, qui remonte au départ
        + ' Z',
    })
  );
}

/* Les deux cartes de l'entrée en mission, avec leur teinte propre. Les
   intitulés viennent d'ENTREE_SOUS : la barre de gauche et cet écran ne
   peuvent pas diverger. */
const ENTREE_CARTES = ENTREE_SOUS.map((e, i) => Object.assign({}, e, {
  icone: i === 0 ? 'courrier' : 'contrat',
  teinte: i === 0 ? 'bleu' : 'violet',
}));

function ECEntreeMission({ navigateEc }) {
  return h('div', { className: 'page page-entree' },
    h('div', { className: 'scene' },
      h('header', { className: 'scene-entete' },
        h('h1', { className: 'scene-titre' }, 'Entrée en mission')
      ),
      h('div', { className: 'entree-scene' },
        h('div', { className: 'entree-colonne' },
          ENTREE_CARTES.map(c => h('button', {
            key: c.key,
            className: `hub-carte entree-carte teinte-${c.teinte}`,
            onClick: () => navigateEc('entree-mission', c.key),
          },
            h('span', { className: 'hub-carte-lueur', 'aria-hidden': 'true' }),
            h('span', { className: 'hub-carte-icone' }, h(IconeCarte, { nom: c.icone, taille: 38 })),
            h('span', { className: 'hub-carte-titre' }, c.label)
          ))
        ),
        h('div', { className: 'entree-gouttiere' }, h(FlecheEnchainement))
      )
    )
  );
}
