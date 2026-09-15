/* =====================================================================
   Parcours guidé de préparation au contrôle — § 10, § 11 et § 40 du V6
   =====================================================================

   L'ancienne barre latérale posait à l'expert-comptable une question qu'il ne
   sait pas trancher : dans quelle rubrique range-t-on la gouvernance, les
   ressources, le cycle client ? Le parcours pose la seule question utile —
   qu'est-ce qui reste à faire avant le contrôle — et l'ordonne en sept étapes.

   Le principe qui gouverne ce fichier est celui du § 11 : un raccourci ne crée
   jamais un second module. Chaque étape affiche le module qui existe déjà.
   Ouvrir « LBC-FT » depuis la barre latérale ou depuis l'étape 5 mène au même
   composant, sur les mêmes données. Si ce fichier finissait par contenir sa
   propre version de la gouvernance, le cabinet aurait deux vérités et le
   contrôleur trouverait la contradiction avant nous.

   Ce que le parcours ajoute, et qui n'existait nulle part : le rang de
   l'étape, ce qui vient avant, ce qui vient après, et le retour au bon
   endroit.
   ===================================================================== */

/* Fil des sept étapes. Cliquable partout : le cahier interdit d'enfermer
   quelqu'un dans un ordre imposé — on prépare son contrôle dans le désordre,
   selon ce qu'on a sous la main. */
function ParcoursFil({ courante, onAller, etat }) {
  return h('div', { className: 'parcours-fil' },
    PARCOURS_ETAPES.map((e, i) => {
      const actif = e.code === courante;
      const info = etat ? etat[e.code] : null;
      const ton = info ? info.statut : null;
      return h('button', {
        key: e.code,
        className: cx('parcours-fil-etape', actif && 'active', ton && 'etat-' + ton),
        onClick: () => onAller(e.code),
        'aria-current': actif ? 'step' : undefined,
      },
        h('span', { className: 'parcours-fil-rang' }, String(i + 1)),
        h('span', { className: 'parcours-fil-titre' }, e.titre)
      );
    })
  );
}

/* En-tête d'une étape : son rang, son titre, et la navigation vers l'étape
   précédente ou suivante. Les deux boutons portent le nom de l'étape qu'ils
   ouvrent — « Suivant → » seul obligerait à cliquer pour savoir où l'on va. */
function ParcoursEntete({ code, onAller, actions }) {
  const etape = etapeParcours(code);
  const precedente = etape.rang > 1 ? PARCOURS_ETAPES[etape.rang - 2] : null;
  const suivante = etape.rang < PARCOURS_ETAPES.length ? PARCOURS_ETAPES[etape.rang] : null;
  return h('div', { className: 'page-header' },
    h('div', null,
      h('div', { className: 'parcours-rang' }, `Étape ${etape.rang} sur ${PARCOURS_ETAPES.length}`),
      h('h1', null, etape.titre)
    ),
    h('div', { className: 'page-header-actions' },
      actions,
      precedente
        ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(precedente.code) }, '← ' + precedente.titre)
        : null,
      suivante
        ? h('button', { className: 'btn btn-primary', onClick: () => onAller(suivante.code) }, suivante.titre + ' →')
        : null
    )
  );
}

/* L'enveloppe du parcours. Elle ne connaît pas le contenu des étapes : elle
   reçoit le module à afficher et se contente de l'encadrer. */
function GuidedControlShell({ etape, onAller, contenu, actions }) {
  return h('div', { className: 'page' },
    h(ParcoursEntete, { code: etape, onAller, actions }),
    h(ParcoursFil, { courante: etape, onAller }),
    h('div', { className: 'parcours-contenu' }, contenu)
  );
}
