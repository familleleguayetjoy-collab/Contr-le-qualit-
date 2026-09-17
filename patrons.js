/* =====================================================================
   Les six patrons d'écran — phase 1 de la refonte V3
   =====================================================================

   Le cahier V3 pose une règle avant toute autre : « toute nouvelle page doit
   rentrer dans P1 à P6 ». Ce fichier est la bibliothèque de ces six patrons.
   Aucun d'eux n'invente de langage graphique — chacun emballe des briques qui
   existaient déjà (FormSection, split-layout, Card, TableauTrie, Pagination,
   badges) pour qu'on cesse de les réassembler à la main écran par écran.

   L'intérêt n'est pas d'écrire moins de code : c'est qu'un utilisateur
   reconnaisse une fonction avant d'avoir lu son titre. Deux écrans bâtis sur
   le même patron se ressemblent parce qu'ils sont le même code, pas parce que
   quelqu'un s'est appliqué à les faire se ressembler.

     P1  ThemeHub             2 à 4 grandes cartes, une destination par carte
     P2  Stepper + wizard-footer     (déjà en place, voir utils.js/wizard.js)
     P3  ActionListDetail     liste paginée à gauche, fiche à droite
     P4  CampaignView         progression + liste + fiche, traitée ligne à ligne
     P5  DocumentPreviewShell feuille à gauche, variables et sources à droite
     P6  FinalValidation      récapitulatif vert de ce qui va être produit

   S'y ajoute SourceInfoRow, qui n'est pas un écran mais la ligne élémentaire
   du pipeline documentaire : une information, sa valeur, son état et sa
   source. Jamais de score.

   Ce fichier ne connaît aucune donnée métier. Il se charge après utils.js et
   n'appelle FormSection qu'au rendu, donc l'ordre des scripts n'a pas
   d'importance au-delà de cela.
   ===================================================================== */

/* ---------------------------------------------------------------- États

   Le § 5.1 du cahier fixe cinq états pour une information, et leur couleur.
   Ils vivent ici une seule fois : un écran qui affiche « à confirmer » en
   violet et un autre qui l'affiche en orange, c'est déjà une incohérence de
   trop. */
const ETATS_INFO = {
  auto: { badge: 'bleu', libelle: 'auto', aide: 'Récupérée automatiquement depuis une source technique de confiance — modifiable.' },
  a_confirmer: { badge: 'violet', libelle: 'à confirmer', aide: 'Trouvée dans un document déposé. Elle doit être confirmée avant d’être utilisée.' },
  confirmee: { badge: 'vert', libelle: 'confirmée', aide: 'Donnée canonique : elle est reprise partout sans être ressaisie.' },
  a_renseigner: { badge: 'orange', libelle: 'à renseigner', aide: 'Introuvable dans les documents déposés. À saisir à la main.' },
  contradictoire: { badge: 'rouge', libelle: 'contradictoire', aide: 'Deux sources ne concordent pas. Une décision humaine est obligatoire.' },
};

/* ------------------------------------------------------------- CadreHub

   Un même hub s'affiche à deux endroits : seul, avec son titre en haut de
   page ; ou à l'intérieur d'une étape du parcours de préparation, qui porte
   déjà son titre et sa navigation. Dans le second cas il ne doit rendre ni
   `.page` ni H1 — deux titres sur un écran font croire qu'on a changé de
   page alors qu'on n'a pas bougé.

   Les actions d'en-tête, elles, suivent le hub dans les deux cas : elles font
   partie de ce qu'il propose, pas de son décor. */
function CadreHub({ encadre, titre, actions, children }) {
  if (encadre) {
    return h(React.Fragment, null,
      actions ? h('div', { className: 'parcours-actions' }, actions) : null,
      children
    );
  }
  return h('div', { className: 'page' },
    h(EnteteHub, { titre, actions }),
    children
  );
}

/* ============================================================ P1 — ThemeHub

   Un thème, deux à quatre destinations. La carte entière est cliquable, pas
   seulement un lien à l'intérieur : sur un écran de choix, la cible doit être
   aussi grande que possible.

   Le compteur ne s'affiche que s'il appelle une action. « 12 dossiers » sur une
   carte ne sert à personne ; « 3 à relancer » dit quoi faire. Une carte sans
   rien à signaler n'affiche donc aucun chiffre.

   Une carte d'entrée en mission porte en plus deux ou trois points courts :
   le cahier les prévoit là où le choix engage un parcours entier et mérite
   d'être expliqué en une ligne. Partout ailleurs, le titre suffit.

   cartes : [{ cle, icone, titre, points, compteur, tonCompteur, libelleAction,
               onOuvrir, indisponible, raisonIndisponible }] */
function ThemeHub({ cartes, colonnes }) {
  // Quatre cartes au plus, sauf le dépôt documentaire, que le cahier décrit
  // explicitement en grille 2×3 (S52). Au-delà de six, on pagine plutôt que
  // d'entasser.
  const maxi = colonnes === 3 ? 6 : 4;
  const visibles = cartes.filter(c => c).slice(0, maxi);
  return h('div', { className: cx('hub-grid', colonnes === 2 && visibles.length === 2 && 'hub-deux', colonnes === 3 && 'hub-trois') },
    visibles.map(c => h('button', {
      key: c.cle,
      className: cx('hub-carte', c.indisponible && 'indisponible'),
      disabled: !!c.indisponible,
      onClick: c.indisponible ? undefined : c.onOuvrir,
    },
      h('span', { className: 'hub-icone' }, c.icone),
      h('span', { className: 'hub-titre' }, c.titre),
      c.points && c.points.length
        ? h('span', { className: 'hub-points' },
          c.points.slice(0, 3).map((p, i) => h('span', { className: 'hub-point', key: i }, p)))
        : null,
      c.compteur
        ? h('span', { className: 'hub-compteur' }, h(Badge, { color: c.tonCompteur || 'orange' }, c.compteur))
        : null,
      h('span', { className: 'hub-fleche' },
        c.indisponible ? (c.raisonIndisponible || 'Bientôt') : (c.libelleAction || 'Ouvrir →'))
    ))
  );
}

/* ------------------------------------------------- Tableau trié et paginé

   La liste du patron P3, et le tableau de tous les écrans de pilotage.

   Les quatre onglets de la supervision des anomalies affichaient chacun leurs
   tableaux à leur manière, avec une barre de défilement quand la liste était
   longue. Ils partagent ce composant depuis : en-tête cliquable pour trier,
   pages numérotées, jamais de défilement interne. Il a quitté ec.js pour cette
   bibliothèque quand ActionListDetail en a eu besoin — les réclamations, les
   non-conformités et le portefeuille LBC-FT trieront leurs lignes exactement
   comme les anomalies, parce que c'est le même code. */
function TableauTrie({ colonnes, lignes, cle, parPage = 6, selection, onSelect, triDefaut, vide }) {
  const [tri, setTri] = useState(triDefaut || { col: null, sens: 'asc' });
  /* `parPage` est un maximum, pas une promesse : le même tableau n'a pas la
     même place selon la résolution et selon qu'il s'affiche seul ou dans une
     étape de parcours, qui lui prend une centaine de pixels. On mesure donc ce
     qui tient et on prend le plus petit des deux.

     Une liste à la fois paginée et défilante est le pire des deux mondes : on
     croit avoir tout vu, et deux lignes se cachent sous le bord du cadre. */
  const cadre = useRef(null);
  const tiennent = useLignesQuiTiennent(cadre, { maxi: parPage, defaut: parPage, mini: 2 });

  const colonne = colonnes.find(c => c.code === tri.col);
  const triees = colonne && colonne.valeur
    ? lignes.slice().sort((a, b) => {
      const va = colonne.valeur(a), vb = colonne.valeur(b);
      const cmp = (typeof va === 'number' && typeof vb === 'number')
        ? va - vb
        : String(va).localeCompare(String(vb), 'fr', { numeric: true });
      return tri.sens === 'asc' ? cmp : -cmp;
    })
    : lignes;

  const pagination = usePagination(triees, Math.min(parPage, tiennent));

  function trierPar(code) {
    setTri(prev => (prev.col === code ? { col: code, sens: prev.sens === 'asc' ? 'desc' : 'asc' } : { col: code, sens: 'asc' }));
    pagination.setPage(1);
  }

  if (lignes.length === 0) return h(EmptyDetail, { icon: '✅', label: vide || 'Rien à afficher' });

  return h(React.Fragment, null,
    h('div', { className: 'table-wrap', ref: cadre },
      h('table', { className: 'data-table' },
        h('thead', null, h('tr', null,
          colonnes.map(c => h('th', {
            key: c.code,
            className: cx(c.valeur && 'th-sortable', tri.col === c.code && 'th-sorted', c.classe),
            onClick: c.valeur ? () => trierPar(c.code) : undefined,
          }, c.titre, c.valeur ? h('span', { className: 'th-arrow' }, tri.col === c.code ? (tri.sens === 'asc' ? '▲' : '▼') : '↕') : null))
        )),
        h('tbody', null,
          pagination.pageItems.map(l => h('tr', {
            key: cle(l),
            className: cx('clickable', selection && selection === cle(l) && 'row-selected'),
            onClick: onSelect ? () => onSelect(l) : undefined,
          }, colonnes.map(c => h('td', { key: c.code, className: c.classe }, c.rendu(l)))))
        )
      )
    ),
    h(Pagination, { pagination })
  );
}

/* ==================================================== P3 — ActionListDetail

   Le patron de tous les écrans « une liste d'objets à traiter » : réclamations,
   non-conformités, portefeuille LBC-FT, dépendance économique. C'est
   exactement la mise en page des anomalies, qui sert de référence.

   La liste est paginée et triable par ses en-têtes ; le volet de droite montre
   la ligne choisie, ou dit quoi faire quand rien n'est choisi. Six lignes
   visibles par défaut : au-delà, on pagine plutôt que de faire défiler. */
function ActionListDetail({
  titreListe, iconeListe = '📋', tonListe = 'bleu', sousTitreListe,
  colonnes, lignes, cle, parPage = 6, triDefaut, vide,
  selection, onSelect,
  detail, detailVide = 'Sélectionnez une ligne pour voir le détail',
  detailIcone = '👈',
}) {
  return h('div', { className: 'split-layout with-detail' },
    h(FormSection, { icon: iconeListe, title: titreListe, ton: tonListe, subtitle: sousTitreListe },
      h(TableauTrie, { colonnes, lignes, cle, parPage, triDefaut, vide, selection, onSelect })
    ),
    h('div', { className: 'detail-panel' },
      detail || h(EmptyDetail, { icon: detailIcone, label: detailVide })
    )
  );
}

/* ========================================================= P4 — CampaignView

   Une campagne, c'est la même opération répétée sur plusieurs personnes ou
   dossiers : déclarations d'indépendance, interrogations du RBE, contrôles PPE.
   La règle du cahier est qu'on doit pouvoir la traiter ligne par ligne sans
   jamais changer de page.

   D'où la forme : une progression qu'on lit d'un coup d'œil, les tuiles qui
   la détaillent (trois au plus), puis la liste et la fiche du patron P3
   juste en dessous. L'action principale vit en haut à droite et change de
   libellé selon l'état — « Lancer la campagne » tant qu'elle n'existe pas,
   « Relancer les retardataires » ensuite.

   Cinq lignes et non six : la progression et les tuiles mangent une centaine
   de pixels au-dessus de la liste, et à 1366 × 768 la sixième ligne se
   retrouvait coupée en deux par le cadre. Mesuré — le cahier admet cinq ou six,
   on prend cinq ici et six pour P3, qui n'a rien au-dessus de lui.

   tuiles : [{ libelle, valeur, ton }] — trois maximum */
function CampaignView({ faits, total, libelleProgression, tuiles = [], action, parPage = 5, ...listDetail }) {
  const pct = total > 0 ? Math.round((faits / total) * 100) : 0;
  return h(React.Fragment, null,
    h('div', { className: 'campagne-entete' },
      h('div', { className: 'campagne-avancement' },
        h('div', { className: 'campagne-ligne' },
          h('span', { className: 'campagne-compte' }, faits, ' sur ', total),
          h('span', { className: 'campagne-libelle' }, libelleProgression || 'traités'),
          action
            ? h('button', {
              className: 'btn btn-primary campagne-action',
              onClick: action.onClick, disabled: !!action.desactivee,
            }, action.libelle)
            : null
        ),
        h('div', { className: 'campagne-jauge' },
          h('div', { className: 'campagne-jauge-remplie', style: { width: pct + '%' } })
        )
      ),
      tuiles.length
        ? h('div', { className: 'campagne-tuiles' },
          tuiles.slice(0, 3).map(t => h('div', { className: cx('campagne-tuile', t.ton && 'ton-' + t.ton), key: t.libelle },
            h('div', { className: 'campagne-tuile-valeur' }, t.valeur),
            h('div', { className: 'campagne-tuile-libelle' }, t.libelle)
          ))
        )
        : null
    ),
    h(ActionListDetail, Object.assign({ parPage }, listDetail))
  );
}

/* ------------------------------------------------------------ SourceInfoRow

   Une information et son état, dans le pipeline « source → donnée confirmée ».

   Trois règles du cahier tiennent dans ce composant. La valeur est toujours
   accompagnée de l'endroit d'où elle vient — sans source, pas de confirmation
   possible. L'état est un badge compact, jamais une bannière. Et il n'y a
   aucun pourcentage de confiance : l'IA propose une valeur et montre où elle
   l'a lue, elle ne note pas son propre travail.

   etat : 'auto' | 'a_confirmer' | 'confirmee' | 'a_renseigner' | 'contradictoire' */
function SourceInfoRow({ libelle, valeur, etat = 'a_confirmer', source, extrait, confirmeeLe, onConfirmer, onCorriger }) {
  const e = ETATS_INFO[etat] || ETATS_INFO.a_confirmer;
  return h('div', { className: cx('info-source', 'etat-' + etat) },
    h('div', { className: 'info-source-tete' },
      h('span', { className: 'info-source-libelle' }, libelle),
      h('span', { className: 'info-source-etat', title: e.aide },
        etat === 'confirmee' && confirmeeLe
          ? h(Badge, { color: 'vert' }, '✓ confirmée le ', formatDate(confirmeeLe))
          : h(Badge, { color: e.badge }, e.libelle)
      )
    ),
    h('div', { className: 'info-source-valeur' },
      valeur || h('span', { className: 'info-source-vide' }, 'Non trouvée')),
    source
      ? h('div', { className: 'info-source-provenance' },
        h('span', { className: 'info-source-doc' }, '📄 ', source),
        extrait ? h('span', { className: 'info-source-extrait' }, '« ', extrait, ' »') : null)
      : null,
    (onConfirmer || onCorriger)
      ? h('div', { className: 'info-source-actions' },
        onConfirmer ? h('button', { className: 'btn btn-primary btn-sm', onClick: onConfirmer }, 'Confirmer') : null,
        onCorriger ? h('button', { className: 'btn btn-secondary btn-sm', onClick: onCorriger }, 'Corriger') : null)
      : null
  );
}

/* ================================================ P5 — DocumentPreviewShell

   Un document à relire avant de le produire. La feuille occupe la part large,
   ses variables et leurs sources le panneau de droite.

   Le cahier interdit d'en faire un éditeur, et c'est volontaire : si une
   valeur est fausse dans la feuille, elle est fausse dans la donnée, et c'est
   la donnée qu'il faut corriger. Corriger le document laisserait les deux en
   désaccord sans que personne le sache. Le panneau renvoie donc à la source,
   il n'ouvre pas de champ de saisie. */
function DocumentPreviewShell({
  titreDocument, iconeDocument = '📄', tonDocument = 'vert', feuille,
  titrePanneau = 'Variables et sources', iconePanneau = '🔗', tonPanneau = 'violet',
  panneau, actions,
}) {
  return h('div', { className: 'two-col-preview' },
    h(FormSection, { icon: iconeDocument, title: titreDocument, ton: tonDocument },
      h('div', { className: 'apercu-feuille' }, feuille)
    ),
    h(FormSection, { icon: iconePanneau, title: titrePanneau, ton: tonPanneau },
      h('div', { className: 'apercu-panneau' }, panneau),
      actions ? h('div', { className: 'apercu-actions' }, actions) : null
    )
  );
}

/* ==================================================== P6 — FinalValidation

   La fin d'un parcours. Un écran vert qui dit ce qui va être créé, enregistré
   ou diffusé — et rien d'autre. Le cahier interdit d'y glisser un dernier
   champ métier : ce qui n'a pas été décidé avant ne se décide pas ici.

   sorties : [{ icone, libelle, detail }] */
function FinalValidation({ titre = 'À la validation', sorties = [], rappel, actions }) {
  return h(React.Fragment, null,
    h(FormSection, { icon: '✅', title: titre, ton: 'vert' },
      sorties.map((s, i) => h('div', { className: 'validation-sortie', key: i },
        h('span', { className: 'validation-icone' }, s.icone || '•'),
        h('span', { className: 'validation-libelle' }, s.libelle),
        s.detail ? h('span', { className: 'validation-detail' }, s.detail) : null
      )),
      rappel ? h('p', { className: 'validation-rappel' }, rappel) : null
    ),
    actions ? h('div', { className: 'wizard-footer' }, actions) : null
  );
}

/* ============================================== EditableValueRow & modal

   Une valeur du référentiel, telle qu'elle s'affiche partout : le libellé, la
   valeur, sa source quand elle en a une, et un crayon discret pour la changer.

   Le crayon ouvre une vraie fenêtre de saisie qui écrit dans la couche de
   données. C'est le remplacement des boutons qui affichaient « Modification
   des responsables (démonstration) » : ils laissaient croire le travail fait.

   Le § 36 impose Annuler / Enregistrer, sans enregistrement silencieux : une
   décision métier se prend explicitement, et doit pouvoir être annulée. */
function EditableValueRow({ libelle, valeur, source, absent, onModifier }) {
  return h('div', { className: 'valeur-ligne' },
    h('div', { className: 'valeur-texte' },
      h('div', { className: 'valeur-libelle' }, libelle),
      h('div', { className: cx('valeur-valeur', absent && 'absente') }, valeur || 'À renseigner'),
      source ? h('div', { className: 'valeur-source' }, source) : null
    ),
    onModifier
      // Jamais une icône seule sur une action importante : le crayon porte son
      // intitulé, comme le demande la règle n° 1.
      ? h('button', { className: 'btn btn-secondary btn-sm', onClick: onModifier }, '✏️ Modifier')
      : null
  );
}

/* La fenêtre de saisie. `options` la transforme en liste déroulante, sinon
   c'est un champ libre. Elle ne sait pas où la valeur ira : elle rend ce que
   l'utilisateur a saisi, et l'appelant écrit. */
function FunctionalEditModal({ titre, libelle, valeur, options, aide, source, onAnnuler, onEnregistrer }) {
  const [saisie, setSaisie] = useState(valeur === null || valeur === undefined ? '' : String(valeur));
  const inchange = String(saisie).trim() === String(valeur === null || valeur === undefined ? '' : valeur).trim();

  function enregistrer() {
    const v = String(saisie).trim();
    if (!v || inchange) return;
    onEnregistrer(v);
  }

  return h(Modal, { title: titre || `Modifier « ${libelle} »`, onClose: onAnnuler, width: 560 },
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, libelle),
      options && options.length
        ? h('select', {
          className: 'form-input', value: saisie, autoFocus: true,
          onChange: e => setSaisie(e.target.value),
        },
          h('option', { value: '' }, '— Choisir —'),
          options.map(o => h('option', { key: o.valeur || o, value: o.valeur || o }, o.libelle || o))
        )
        : h('input', {
          className: 'form-input', value: saisie, autoFocus: true,
          onChange: e => setSaisie(e.target.value),
          onKeyDown: e => { if (e.key === 'Enter') enregistrer(); },
        }),
      aide ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } }, aide) : null,
      source ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } }, 'Source actuelle : ', source) : null
    ),
    h('div', { className: 'modal-actions' },
      h('button', { className: 'btn btn-secondary', onClick: onAnnuler }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary',
        disabled: !String(saisie).trim() || inchange,
        onClick: enregistrer,
      }, 'Enregistrer')
    )
  );
}

/* =====================================================================
   REFONTE — Champs de panneau latéral
   =====================================================================

   Quatre composants, et toute la saisie de l'application passe par eux. Un
   champ a toujours son intitulé au-dessus, jamais à l'intérieur : une étiquette
   qui disparaît dès qu'on tape oblige à se souvenir de ce qu'on remplit.

   L'aide, quand il y en a une, tient sur une ligne et dit ce que le champ
   attend — pas ce qu'il est. */

function ChampPanneau({ label, valeur, onChange, type, lignes, aide, suffixe, disabled, placeholder }) {
  const id = useMemo(() => 'champ-' + Math.random().toString(36).slice(2, 9), []);
  const commun = {
    id, value: valeur === null || valeur === undefined ? '' : valeur,
    onChange: e => onChange(e.target.value),
    disabled: !!disabled,
    placeholder: placeholder || undefined,
    className: 'champ-saisie',
  };
  return h('div', { className: 'champ-panneau' },
    h('label', { className: 'champ-label', htmlFor: id }, label),
    h('div', { className: cx('champ-boite', suffixe && 'avec-suffixe') },
      lignes
        ? h('textarea', Object.assign({}, commun, { rows: lignes }))
        : h('input', Object.assign({}, commun, { type: type || 'text' })),
      suffixe ? h('span', { className: 'champ-suffixe' }, suffixe) : null
    ),
    aide ? h('p', { className: 'champ-aide' }, aide) : null
  );
}

/* Un choix entre deux à quatre options. En ligne quand elles sont courtes, en
   colonne quand ce sont des phrases — une phrase tronquée dans un bouton ne
   permet pas de choisir. */
function ChoixPanneau({ label, valeur, options, onChange, aide, colonne }) {
  return h('div', { className: 'champ-panneau' },
    h('span', { className: 'champ-label' }, label),
    h('div', { className: cx('choix-options', colonne && 'en-colonne') },
      options.map(o => h('button', {
        key: o.code,
        type: 'button',
        className: cx('choix-option', valeur === o.code && 'actif'),
        'aria-pressed': valeur === o.code ? 'true' : 'false',
        onClick: () => onChange(o.code),
      }, o.label))
    ),
    aide ? h('p', { className: 'champ-aide' }, aide) : null
  );
}

/* Oui / Non, et rien d'autre. Un interrupteur seul laisse deviner ce que
   « éteint » veut dire ; deux boutons nommés ne le laissent pas. */
function BasculePanneau({ label, valeur, onChange, aide }) {
  return h(ChoixPanneau, {
    label, aide,
    valeur: valeur ? 'oui' : 'non',
    options: [{ code: 'oui', label: 'Oui' }, { code: 'non', label: 'Non' }],
    onChange: v => onChange(v === 'oui'),
  });
}

/* Compteur à deux boutons : c'est la forme demandée au § 6.2 pour l'effectif.
   Elle évite d'ouvrir un clavier pour passer de 2 à 3. */
function CompteurPanneau({ label, valeur, onChange, min }) {
  const n = Number(valeur) || 0;
  const plancher = min === undefined ? 0 : min;
  return h('div', { className: 'compteur-ligne' },
    h('span', { className: 'compteur-label' }, label),
    h('div', { className: 'compteur-commandes' },
      h('button', {
        type: 'button', className: 'compteur-btn',
        'aria-label': `Retirer un(e) ${label}`,
        disabled: n <= plancher,
        onClick: () => onChange(Math.max(plancher, n - 1)),
      }, '−'),
      h('span', { className: 'compteur-valeur' }, n),
      h('button', {
        type: 'button', className: 'compteur-btn',
        'aria-label': `Ajouter un(e) ${label}`,
        onClick: () => onChange(n + 1),
      }, '+')
    )
  );
}

/* =====================================================================
   REFONTE — Les grandes cartes de navigation
   =====================================================================

   L'objet central de l'identité. Une carte porte un gros logo centré et un
   titre. Pas de sous-titre, pas de compte, pas de détail : si le titre ne
   suffit pas, c'est le titre qu'il faut changer.

   Le même composant sert l'accueil, l'entrée en mission et les cinq hubs
   internes. Une seule définition, donc une seule chose à corriger le jour où
   le dessin évoluera. */

/* Les tracés. Un seul jeu, appelé par son nom depuis les listes de cartes. */
const TRACES_CARTES = {
  plume: ['M4 20c0-6 3-11 9-13l4-1-1 4c-2 6-7 9-13 9z', 'M4 20l7-7'],
  alerte: ['M12 4.5 3.5 19h17L12 4.5z', 'M12 10.5v4', 'M12 17.2h.01'],
  dossier: ['M3.5 7.5h6l1.6 2h9.4v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5v-11z',
    'M8 14.5l2.4 2.4 5-5'],
  reglage: ['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  courrier: ['M3.5 6.5h17v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z', 'M3.5 7 12 13l8.5-6'],
  contrat: ['M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z',
    'M14 3.5v4h4', 'M8.5 13h7M8.5 16.5h4.5'],
  batiment: ['M4.5 20.5V5.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15', 'M14.5 10.5h4a1 1 0 0 1 1 1v9',
    'M3 20.5h18', 'M8 8.5h3M8 12.5h3M8 16.5h3'],
  equipe: ['M3.5 20v-1.4A3.6 3.6 0 0 1 7.1 15h4.8a3.6 3.6 0 0 1 3.6 3.6V20',
    'M9.5 11.6a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7', 'M17.2 15.3A3.6 3.6 0 0 1 20.5 19v1'],
  serveur: ['M3.5 5.5h17v5h-17zM3.5 13.5h17v5h-17z', 'M7 8h.01M7 16h.01'],
  signature: ['M4 17.5c3.5 0 3.5-9 7-9s3.5 9 7 9', 'M3 20.5h18'],
  balance: ['M12 4.5v15', 'M5 8.5h14', 'M5 8.5 2.5 14h5zM19 8.5 16.5 14h5z', 'M8 20.5h8'],
  loupe: ['M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z', 'M15.8 15.8 21 21'],
  graphe: ['M3.5 19.5V9M9 19.5V4.5M14.5 19.5v-7M20 19.5V8'],
  bouclier: ['M12 3.5 19.5 7v5.2c0 4-3.1 7.1-7.5 8.3C7.6 19.3 4.5 16.2 4.5 12.2V7z',
    'M9 12.2 11.2 14.5 15.5 10'],
  calendrier: ['M4.5 6h15v13.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z', 'M4.5 10h15',
    'M8.5 3.5v4M15.5 3.5v4'],
  alerteCercle: ['M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z', 'M12 8.5v4.5', 'M12 16h.01'],
  bulle: ['M20.5 12.5c0 3.9-3.8 7-8.5 7-1 0-2-.15-2.9-.42L4 20.5l1.6-3.6A6.6 6.6 0 0 1 3.5 12.5c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z'],
  liste: ['M8.5 6.5h12M8.5 12h12M8.5 17.5h12', 'M4 6.5h.01M4 12h.01M4 17.5h.01'],
  prise: ['M8.5 3.5v5M15.5 3.5v5', 'M5.5 8.5h13v3a6.5 6.5 0 0 1-13 0z', 'M12 18v3'],
  etincelle: ['M12 3.5 13.9 9.4 19.8 11.3 13.9 13.2 12 19.1 10.1 13.2 4.2 11.3 10.1 9.4z',
    'M18.5 4.2l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z'],
};

function IconeCarte({ nom, taille = 34 }) {
  const d = TRACES_CARTES[nom];
  if (!d) return null;
  return h('svg', {
    width: taille, height: taille, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.5,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': 'true', focusable: 'false',
  }, d.map((p, i) => h('path', { key: i, d: p })));
}

/* Une grille de grandes cartes. `cartes` : [{ key, label, icone, teinte }].
   `colonnes` force la largeur d'une rangée quand il y en a peu — deux cartes
   étalées sur toute la page paraîtraient étirées. */
function CartesHub({ cartes, onOuvrir, colonnes }) {
  return h('div', {
    className: cx('hub-grille', colonnes && 'hub-grille-' + colonnes),
  },
    cartes.map(c => h('button', {
      key: c.key,
      // `faite` marque une brique déjà remplie : une coche, et rien de plus.
      className: cx('hub-carte', 'teinte-' + (c.teinte || 'bleu'), c.faite && 'faite'),
      onClick: () => onOuvrir(c.key),
    },
      h('span', { className: 'hub-carte-lueur', 'aria-hidden': 'true' }),
      h('span', { className: 'hub-carte-icone' }, h(IconeCarte, { nom: c.icone, taille: 38 })),
      h('span', { className: 'hub-carte-titre' }, c.label)
    ))
  );
}

/* Le retour depuis un écran ouvert par une carte. Discret, en haut à gauche,
   et il nomme le hub d'où l'on vient : « ← LCB-FT » se comprend sans avoir à
   se souvenir du chemin. */
function RetourHub({ vers, onRetour }) {
  return h('button', { className: 'retour-hub', onClick: onRetour },
    h('span', { 'aria-hidden': 'true' }, '←'), vers);
}
