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

   Elle part du côté droit du premier, descend en s'arrondissant, et revient
   vers le côté droit du second. Elle dit l'ordre — lettre de reprise, puis
   contractualisation — sans transformer la page en schéma.

   Elle est décorative : le sens est déjà porté par l'ordre de lecture et par
   les intitulés, et un lecteur d'écran n'a rien à faire d'un trait. */
/* Le trait est épais et dégradé : il part dans le bleu de la lettre de reprise
   et arrive dans le violet de la contractualisation. Le dégradé suit donc le
   trajet, il ne décore pas — on voit d'où l'on part et où l'on arrive.

   preserveAspectRatio vaut « none » : le tracé s'étire à la hauteur réelle des
   deux cartes. C'est pourquoi la pointe est dessinée à part, avec un repère
   qui, lui, garde ses proportions. */
function FlecheEnchainement() {
  return h('svg', {
    className: 'entree-fleche',
    viewBox: '0 0 96 300', preserveAspectRatio: 'none',
    'aria-hidden': 'true', focusable: 'false',
  },
    h('defs', null,
      h('linearGradient', { id: 'degradeFleche', x1: '0', y1: '0', x2: '0', y2: '1' },
        h('stop', { offset: '0%', stopColor: 'var(--a-bleu)' }),
        h('stop', { offset: '100%', stopColor: 'var(--a-violet)' })
      )
    ),
    h('path', {
      className: 'entree-fleche-trait',
      d: 'M2 74 C 62 74, 84 104, 84 150 C 84 196, 62 226, 12 226',
      fill: 'none',
    }),
    // Pointe, dirigée vers le carré du bas.
    h('path', {
      className: 'entree-fleche-pointe',
      d: 'M22 216 L9 226 L22 236',
      fill: 'none',
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
        h('h1', { className: 'scene-titre' }, 'Entrée en mission'),
        h('p', { className: 'scene-sous-titre' }, 'Deux étapes, dans cet ordre.')
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
