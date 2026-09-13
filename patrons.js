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
  const visibles = cartes.filter(c => c).slice(0, 4);
  return h('div', { className: cx('hub-grid', colonnes === 2 && visibles.length === 2 && 'hub-deux') },
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

  const pagination = usePagination(triees, parPage);

  function trierPar(code) {
    setTri(prev => (prev.col === code ? { col: code, sens: prev.sens === 'asc' ? 'desc' : 'asc' } : { col: code, sens: 'asc' }));
    pagination.setPage(1);
  }

  if (lignes.length === 0) return h(EmptyDetail, { icon: '✅', label: vide || 'Rien à afficher' });

  return h(React.Fragment, null,
    h('div', { className: 'table-wrap' },
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
