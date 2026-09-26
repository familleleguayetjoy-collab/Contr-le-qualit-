/* ComplyEC — Accueil et entrée en mission
   =======================================

   Deux écrans qui ne montrent presque rien, et c'est leur travail.

   L'accueil porte quatre titres. Pas un chiffre, pas un pourcentage, pas un
   badge : un expert-comptable qui ouvre son logiciel n'a pas à lire un tableau
   de bord avant de savoir où aller. Les nombres existent — ils sont dans la
   synthèse du contrôle, où ils veulent dire quelque chose.

   L'entrée en mission porte deux titres. Le fond des deux
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

/* Les deux cartes de l'entrée en mission. Elles ont la forme, la taille et
   les teintes des carrés de l'indépendance : un même geste, un même dessin,
   d'une rubrique à l'autre. Les intitulés viennent d'ENTREE_SOUS : la barre
   de gauche et cet écran ne peuvent pas diverger. */
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
      h(CartesHub, {
        cartes: ENTREE_CARTES,
        colonnes: 2,
        onOuvrir: key => navigateEc('entree-mission', key),
      })
    )
  );
}
