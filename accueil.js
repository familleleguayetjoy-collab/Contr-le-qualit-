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

   Ce n'est plus un trait mais une forme pleine : un croissant qui s'épaissit
   en descendant, terminé par une pointe franche dirigée vers le carré du bas.
   Elle dit l'ordre — lettre de reprise, puis contractualisation — et elle se
   voit sans qu'on la cherche.

   Elle garde ses proportions (preserveAspectRatio par défaut) : une forme
   pleine étirée à la hauteur de la gouttière deviendrait un trait mou. Elle se
   centre donc dans la gouttière, à sa taille propre.

   Elle est décorative : le sens est déjà porté par l'ordre de lecture et par
   les intitulés, et un lecteur d'écran n'a rien à faire d'un dessin. */
function FlecheEnchainement() {
  return h('svg', {
    className: 'entree-fleche',
    viewBox: '0 0 100 100',
    'aria-hidden': 'true', focusable: 'false',
  },
    h('defs', null,
      h('linearGradient', { id: 'degradeFleche', x1: '0.1', y1: '0', x2: '0.5', y2: '1' },
        h('stop', { offset: '0%', stopColor: 'var(--a-bleu)' }),
        h('stop', { offset: '100%', stopColor: 'var(--a-violet)' })
      )
    ),
    h('path', {
      className: 'entree-fleche-forme',
      d: 'M 12 12'
        + ' C 58 9, 93 39, 84 72'          // bord extérieur : fin au départ, épais en bas
        + ' L 100 66'                       // barbe extérieure
        + ' L 66 100'                       // pointe, dirigée vers le carré du bas
        + ' L 42 62'                        // barbe intérieure
        + ' L 62 68'                        // retour sur le corps
        + ' C 69 43, 46 26, 16 22'          // bord intérieur, qui remonte au départ
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
