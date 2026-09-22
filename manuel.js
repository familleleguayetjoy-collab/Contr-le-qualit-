// ComplyEC — Manuel de procédures (S59 à S61A) — phase 7 de la refonte V3
'use strict';

/* =====================================================================
   Le manuel : une publication, pas un traitement de texte
   =====================================================================

   Quatre écrans : voir ce qui est prêt, relire, publier, retrouver.

   Le manuel est l'aboutissement du pipeline documentaire. Tout ce qui a été
   déposé, extrait, confirmé, décidé dans les modules finit ici sous forme de
   phrases. Aucune partie ne possède sa copie privée d'une variable : si le
   déclarant Tracfin change, c'est le référentiel qu'on corrige, et le chapitre
   LBC-FT se régénère.

   D'où deux interdits. Pas d'éditeur libre : corriger le texte laisserait le
   manuel et la donnée en désaccord. Et une version publiée ne se modifie
   jamais — elle se remplace. C'est ce qui permet à un contrôleur de savoir
   quelles règles le cabinet s'appliquait à une date donnée.
   ===================================================================== */

/* Le parcours guidé en quatre étapes de la version précédente a disparu avec
   l'ancienne arborescence : le manuel se remplit désormais en trois étapes
   dans « Préparer le contrôle ». Sa génération, elle, n'a pas bougé.

   Le texte est celui que les six parties composent à partir des données
   confirmées : ce n'est pas une rédaction libre, et une valeur absente s'y
   voit — elle n'est pas comblée par une invention. La génération Word est une
   capacité réelle du navigateur, le bouton peut donc exister. */
function telechargerVersionManuel(version) {
  const corps = MANUEL_PARTIES.map((p, i) => {
    const texte = texteManuelPartie(p.code) || '';
    const paragraphes = texte.split('\n').slice(2)
      .map(l => (l.trim() ? `<p style="text-align:justify; margin:0 0 6pt;">${docxEchapper(l)}</p>` : '<p style="margin:0 0 6pt;">&nbsp;</p>'))
      .join('');
    return `<h2 style="font-size:13pt; margin-top:18pt;">${i + 1}. ${docxEchapper(p.titre)}</h2>${paragraphes}`;
  }).join('');

  downloadWordDoc(
    `Manuel_de_procedures_${version.numero}.doc`,
    `Manuel de procédures ${version.numero}`,
    `<h1 style="font-size:17pt;">Manuel de procédures du cabinet</h1>
     <p style="font-size:9.5pt; color:#666;">Version ${docxEchapper(version.numero)}, en vigueur depuis le ${formatDateLong(version.dateEffet)}.
     Approuvée par ${docxEchapper(personneNom(version.approbateur))} le ${formatDateLong(version.dateApprobation)}.</p>
     <p style="font-size:9.5pt; color:#666;">Établi en application de la norme professionnelle de management de la qualité (arrêtée le 30 mai 2024, applicable depuis le 1<sup>er</sup> janvier 2025), des articles 141 à 169 du décret n° 2012-432 du 30 mars 2012 portant code de déontologie des professionnels de l’expertise comptable, et, pour le volet LBC-FT, des articles L. 561-1 et suivants du code monétaire et financier.</p>
     ${corps}`
  );
}

/* =====================================================================
   REFONTE — Rubrique « Manuel de procédures »
   =====================================================================

   Trois briques, donc trois cartes. L'objectif n'est pas de faire écrire le
   manuel au cabinet : c'est de lui demander les quelques informations que
   ComplyEC ne peut pas deviner, puis de produire le document.

   La rédaction elle-même, le plan en six parties et les textes réglementaires
   ne sont pas touchés : ils sont validés, et hors de portée. */

/* Deux carrés en haut, un rectangle en dessous. Les trois briques ne sont pas
   de même poids : l'organisation informatique porte à elle seule deux pages de
   questions, elle prend la largeur. */
const MANUEL_CARTES = [
  { key: 'cabinet', label: 'Cabinet et activité', icone: 'batiment', teinte: 'bleu' },
  { key: 'equipe', label: 'Équipe', icone: 'equipe', teinte: 'violet' },
  { key: 'informatique', label: 'Organisation informatique et moyens', icone: 'serveur', teinte: 'acier', large: true },
];

function RubriqueManuel({ showToast, cabinetSettings, navigateEc }) {
  useDonnees();
  const [vue, setVue] = useState(null);
  const cab = dbManuelCabinet();
  const version = manuelVersionEnVigueur();
  const validees = MANUEL_CARTES.filter(c => cab[c.key] && cab[c.key].valideeLe).length;
  const complet = validees === MANUEL_CARTES.length;

  async function publier() {
    const precedentes = dbManuelVersions();
    const numero = 'v' + (precedentes.length + 1);
    await dbPublierManuel({ numero, objet: 'Manuel établi à partir du formulaire cabinet.' });
    showToast(`Manuel publié en version ${numero}.`);
  }

  if (!vue) {
    /* Une carte déjà remplie porte une coche discrète. C'est le seul ornement
       admis : il dit ce qui reste à faire sans ajouter une ligne de texte. */
    const cartes = MANUEL_CARTES.map(c => Object.assign({}, c, {
      faite: !!(cab[c.key] && cab[c.key].valideeLe),
    }));
    /* Le bouton de publication est toujours là, même quand il ne peut pas
       encore servir : caché, il laissait sans réponse la question « à quel
       moment peut-on générer le manuel ? ». Désactivé et accompagné de ce qui
       manque, il y répond depuis l'écran. */
    const reste = MANUEL_CARTES.length - validees;
    return h(RubriquePage, {
      titre: 'Manuel de procédures',
      actions: h(React.Fragment, null,
        version
          ? h(Pastille, { ton: 'vert' }, `Version ${version.numero} depuis le ${formatDate(version.dateEffet)}`)
          : null,
        complet
          ? null
          : h('span', { className: 'manuel-prealable' },
            `${reste} ${pluriel(reste, 'étape à valider', 'étapes à valider')} avant de publier`),
        h('button', {
          className: 'btn btn-primary',
          disabled: !complet,
          title: complet ? undefined : 'Validez les trois étapes ci-dessous.',
          onClick: publier,
        }, version ? 'Publier une nouvelle version' : 'Publier le manuel')
      ),
    },
      h(CartesHub, { cartes, onOuvrir: setVue, colonnes: 2 })
    );
  }

  const carte = MANUEL_CARTES.find(c => c.key === vue);
  return h(RubriquePage, {
    titre: carte.label,
    retour: h(RetourHub, { vers: 'Manuel de procédures', onRetour: () => setVue(null) }),
  },
    vue === 'cabinet' ? h(EtapeCabinetActivite, { showToast, onSuivant: () => setVue(null) })
      : vue === 'equipe' ? h(EtapeEquipe, { showToast, onSuivant: () => setVue(null) })
        : h(EtapeInformatique, { showToast, onSuivant: () => setVue(null) })
  );
}

/* Pied d'étape : le bouton qui valide, et rien d'autre. Une étape validée
   garde la trace de sa date — c'est ce qui fait le décompte du chemin. */
function PiedEtapeManuel({ code, valideeLe, onValider, libelle }) {
  return h('div', { className: 'etape-pied' },
    valideeLe
      ? h(Pastille, { ton: 'vert' }, `Validée le ${formatDate(valideeLe)}`)
      : h('span', { className: 'etape-pied-vide' }),
    h('button', { className: 'btn btn-primary', onClick: onValider },
      libelle || (valideeLe ? 'Enregistrer' : 'Valider cette étape'))
  );
}

// ------------------------------------------------ Étape 1 — Cabinet et activité

function EtapeCabinetActivite({ showToast, onSuivant }) {
  const enregistre = dbManuelCabinet().cabinet || {};
  const [form, setForm] = useState(Object.assign(
    { chiffreAffaires: '', dateCloture: '', tenue: '', revision: '', social: '', juridique: '', autres: '' },
    enregistre
  ));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  const total = MANUEL_ACTIVITES.reduce((n, a) => n + (Number(form[a.code]) || 0), 0);
  const importes = dbClientsImportes();

  async function valider() {
    await dbMajManuelCabinet({
      cabinet: Object.assign({}, form, { valideeLe: new Date().toISOString().slice(0, 10) }),
    });
    showToast('Étape « Cabinet et activité » validée.');
    onSuivant();
  }

  /* Trois blocs, et rien d'autre : les deux chiffres du cabinet, la
     répartition de son activité, et sa liste de clients. Chacun porte son
     titre et occupe toute la largeur : c'est un formulaire qu'on remplit une
     fois par an, il n'a pas à tenir dans une colonne étroite. */
  return h('div', { className: 'etape-carte manuel-etape' },
    h('section', { className: 'manuel-bloc' },
      h('h3', null, 'Le cabinet'),
      h('div', { className: 'etape-grille-2' },
        h(ChampPanneau, {
          label: 'Chiffre d’affaires du dernier exercice', type: 'number', suffixe: '€',
          valeur: form.chiffreAffaires, onChange: v => maj('chiffreAffaires', v),
        }),
        h(ChampPanneau, {
          label: 'Date de clôture du cabinet', type: 'date',
          valeur: form.dateCloture, onChange: v => maj('dateCloture', v),
        })
      )
    ),

    h('section', { className: 'manuel-bloc' },
      h('h3', null, 'Répartition de l’activité'),
      /* Cinq carrés, une couleur par métier. Le pourcentage se saisit dans le
         carré : le libellé, le champ et la couleur sont au même endroit. */
      h('div', { className: 'activites-grille' },
        MANUEL_ACTIVITES.map(a => h('div', {
          key: a.code,
          className: cx('activite-carre', 'teinte-' + a.teinte, Number(form[a.code]) > 0 && 'rempli'),
        },
          h('label', { className: 'activite-label', htmlFor: 'act-' + a.code }, a.label),
          h('div', { className: 'activite-saisie' },
            h('input', {
              id: 'act-' + a.code, className: 'activite-champ', type: 'number',
              min: 0, max: 100, inputMode: 'numeric',
              value: form[a.code] === undefined ? '' : form[a.code],
              onChange: e => maj(a.code, e.target.value),
            }),
            h('span', { className: 'activite-suffixe' }, '%')
          )
        ))
      ),
      /* Le total ne s'affiche que lorsqu'il a quelque chose à dire : une somme
         qui ne fait pas 100 %. À zéro, « Total : 0 % » n'apprenait rien. */
      total > 0 && total !== 100
        ? h('p', { className: 'repartition-total ecart' },
          `Total : ${total} % — la somme ne fait pas 100 %.`)
        : null
    ),

    h('section', { className: 'manuel-bloc manuel-bloc-clients' },
      h('h3', null, 'Liste des clients'),
      importes.length
        ? h('div', { className: 'import-resume' },
          h(Pastille, { ton: 'vert' }, `${importes.length} ${pluriel(importes.length, 'client importé', 'clients importés')}`),
          h(ImportClients, { showToast, libelle: 'Réimporter un fichier Excel' })
        )
        : h(ImportClients, { showToast, libelle: 'Importer un fichier Excel' }),
    ),

    h(PiedEtapeManuel, { code: 'cabinet', valideeLe: enregistre.valideeLe, onValider: valider })
  );
}

/* L'import de la liste clients : un bouton, un aperçu, une validation.
   Les colonnes sont reconnues quel que soit leur intitulé exact ; celles qui ne
   le sont pas se choisissent à la main, plutôt que de faire échouer l'import. */
function ImportClients({ showToast, libelle }) {
  const [lignes, setLignes] = useState(null);
  const [entetes, setEntetes] = useState([]);
  const [mapping, setMapping] = useState({});
  const [erreur, setErreur] = useState(null);
  const champ = useRef(null);

  async function lire(e) {
    const fichier = e.target.files && e.target.files[0];
    if (!fichier) return;
    setErreur(null);
    try {
      const brut = await parseFeuilleDeCalcul(fichier);
      if (!brut.length) throw new Error('Ce fichier ne contient aucune ligne.');
      const cols = Object.keys(brut[0]);
      // Reconnaissance automatique : on cherche, pour chaque colonne attendue,
      // un intitulé qui contient l'un de ses motifs.
      const auto = {};
      IMPORT_CLIENTS_COLONNES.forEach(c => {
        const trouve = cols.find(k => c.motifs.some(m => normaliseEntete(k).includes(normaliseEntete(m))));
        if (trouve) auto[c.code] = trouve;
      });
      setEntetes(cols);
      setMapping(auto);
      setLignes(brut);
    } catch (err) {
      setErreur(err.message || 'Impossible de lire ce fichier.');
      setLignes(null);
    }
  }

  function annuler() {
    setLignes(null); setErreur(null); setMapping({}); setEntetes([]);
    if (champ.current) champ.current.value = '';
  }

  async function valider() {
    if (!mapping.nom) { showToast('Indiquez quelle colonne porte le nom du client.'); return; }
    const prepare = lignes.map(l => ({
      nom: String(l[mapping.nom] || '').trim(),
      siren: mapping.siren ? String(l[mapping.siren] || '').trim() : '',
      forme: mapping.forme ? String(l[mapping.forme] || '').trim() : '',
      collaborateur: mapping.collaborateur ? String(l[mapping.collaborateur] || '').trim() : '',
    })).filter(l => l.nom);
    if (!prepare.length) { showToast('Aucune ligne ne porte de nom de client.'); return; }
    await dbImporterListeClients(prepare);
    showToast(`${prepare.length} ${pluriel(prepare.length, 'client importé', 'clients importés')}.`);
    annuler();
  }

  if (!lignes) {
    /* Un vrai bouton, pas une étiquette déguisée : une <label> autour d'un
       champ masqué ne reçoit pas le focus au clavier, et l'import devient
       inatteignable pour qui ne se sert pas de la souris. */
    return h('div', null,
      /* Bouton d'action principale de son rectangle : il prend la taille et le
         bleu franc de la maison. Le bleu nuit du bouton primaire était si
         sombre qu'il se lisait comme désactivé. */
      h('button', {
        className: 'btn btn-accent btn-lg',
        onClick: () => champ.current && champ.current.click(),
      }, libelle),
      h('input', {
        type: 'file', accept: '.xlsx,.xls,.csv',
        style: { display: 'none' }, tabIndex: -1, 'aria-hidden': 'true',
        ref: champ, onChange: lire,
      }),
      erreur ? h('p', { className: 'champ-erreur' }, erreur) : null
    );
  }

  const apercu = lignes.slice(0, 5);
  return h('div', { className: 'import-panneau' },
    h('div', { className: 'import-mapping' },
      IMPORT_CLIENTS_COLONNES.map(c => h('label', { className: 'import-mapping-ligne', key: c.code },
        h('span', null, c.label, c.obligatoire ? ' *' : ''),
        h('select', {
          className: 'champ-saisie',
          value: mapping[c.code] || '',
          onChange: e => setMapping(m => Object.assign({}, m, { [c.code]: e.target.value })),
        },
          h('option', { value: '' }, '— aucune —'),
          entetes.map(k => h('option', { key: k, value: k }, k))
        )
      ))
    ),
    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          IMPORT_CLIENTS_COLONNES.map(c => h('th', { key: c.code }, c.label)))),
        h('tbody', null, apercu.map((l, i) => h('tr', { key: i },
          IMPORT_CLIENTS_COLONNES.map(c => h('td', { key: c.code },
            mapping[c.code] ? String(l[mapping[c.code]] || '') : h('span', { className: 'cellule-vide' }, '—')))
        )))
      )
    ),
    h('div', { className: 'import-pied' },
      h('span', null, `${lignes.length} ${pluriel(lignes.length, 'ligne lue', 'lignes lues')} — ${apercu.length} ${pluriel(apercu.length, 'affichée', 'affichées')}.`),
      h('button', { className: 'btn btn-secondary btn-sm', onClick: annuler }, 'Annuler'),
      h('button', { className: 'btn btn-primary btn-sm', onClick: valider }, 'Valider l’import')
    )
  );
}

// ---------------------------------------------------------- Étape 2 — Équipe

function EtapeEquipe({ showToast, onSuivant }) {
  const enregistre = dbManuelCabinet().equipe || {};
  const [form, setForm] = useState(Object.assign(
    { serviceSocialDistinct: false, bureauSecondaire: false, bureauEffectif: 0 },
    enregistre
  ));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));
  const effectif = MANUEL_EQUIPE_CATEGORIES.reduce((n, c) => n + (Number(form[c.code]) || 0), 0);

  async function valider() {
    await dbMajManuelCabinet({
      equipe: Object.assign({}, form, { valideeLe: new Date().toISOString().slice(0, 10) }),
    });
    showToast('Étape « Équipe » validée.');
    onSuivant();
  }

  /* Deux rectangles côte à côte : qui compose l'équipe à gauche, comment elle
     est organisée à droite. Ce sont deux questions différentes, elles ne se
     lisent pas l'une à la suite de l'autre. */
  return h('div', { className: 'etape-carte manuel-etape' },
    h('div', { className: 'manuel-rangee' },
      /* Les deux rectangles portent la même menthe : ils posent deux questions
         sur le même sujet, l'équipe, et deux couleurs les faisaient lire comme
         deux thèmes différents. */
      h('section', { className: 'manuel-bloc teinte-menthe' },
        h('h3', null, 'Qui compose l’équipe'),
        h('div', { className: 'compteurs-liste' },
          MANUEL_EQUIPE_CATEGORIES.map(c => h(CompteurPanneau, {
            key: c.code, label: c.label,
            valeur: form[c.code] || 0,
            onChange: v => maj(c.code, v),
          }))
        )
      ),
      h('div', { className: 'pile-cartes' },
      h('section', { className: 'manuel-bloc teinte-menthe' },
        h('h3', null, 'Comment elle est organisée'),
        h(BasculePanneau, {
          label: 'Service social distinct',
          valeur: form.serviceSocialDistinct,
          onChange: v => maj('serviceSocialDistinct', v),
        }),
        h(BasculePanneau, {
          label: 'Bureau secondaire',
          valeur: form.bureauSecondaire,
          onChange: v => maj('bureauSecondaire', v),
        }),
        form.bureauSecondaire
          ? h(CompteurPanneau, {
            label: 'Collaborateurs concernés',
            valeur: form.bureauEffectif || 0,
            onChange: v => maj('bureauEffectif', v),
          })
          : null
      ),
      /* L'effectif total n'est pas une question : c'est la somme des réponses
         de gauche. Il sort donc de ce rectangle-là et prend le sien, sous
         « Comment elle est organisée », dans la colonne de droite. */
      h('section', { className: 'manuel-bloc manuel-bloc-total' },
        h('div', { className: 'effectif-total' },
          h('span', { className: 'effectif-total-nombre' }, effectif),
          h('span', { className: 'effectif-total-label' },
            pluriel(effectif, 'personne au cabinet', 'personnes au cabinet'))
        )
      )
      )
    ),

    h(PiedEtapeManuel, { code: 'equipe', valideeLe: enregistre.valideeLe, onValider: valider })
  );
}

// ----------------------------------- Étape 3 — Organisation informatique et moyens

function EtapeInformatique({ showToast, onSuivant }) {
  const enregistre = dbManuelCabinet().informatique || {};
  const [form, setForm] = useState(Object.assign({}, enregistre));
  const [page, setPage] = useState(1);
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function valider() {
    await dbMajManuelCabinet({
      informatique: Object.assign({}, form, { valideeLe: new Date().toISOString().slice(0, 10) }),
    });
    showToast('Étape « Organisation informatique » validée.');
    onSuivant();
  }

  /* Douze questions à la suite faisaient un mur. Elles se rangent par
     catégorie, chacune dans son rectangle avec son titre en exergue, et les
     catégories se répartissent sur deux pages : les logiciels d'abord, les
     moyens matériels ensuite. */
  function question(q) {
    const reponse = form[q.code];
    const ouvre = q.suite && reponse === q.suite.si;
    return h('div', { className: 'question-ligne', key: q.code },
      h('div', { className: 'question-tete' },
        h('span', { className: 'question-label' }, q.label),
        h('div', { className: 'choix-options question-choix' },
          MANUEL_REPONSES.map(r => h('button', {
            key: r.code, type: 'button',
            className: cx('choix-option', reponse === r.code && 'actif'),
            'aria-pressed': reponse === r.code ? 'true' : 'false',
            onClick: () => maj(q.code, r.code),
          }, r.label))
        )
      ),
      /* Le champ de précision n'apparaît que lorsqu'il a un sens :
         l'interface se réduit d'elle-même. */
      ouvre
        ? h('div', { className: 'question-suite' },
          h(ChampPanneau, {
            label: q.suite.label, type: q.suite.type,
            valeur: form[q.suite.code] || '',
            onChange: v => maj(q.suite.code, v),
          })
        )
        : null
    );
  }

  const groupesDeLaPage = MANUEL_INFORMATIQUE_GROUPES.filter(g => g.page === page);
  const derniere = page === MANUEL_INFORMATIQUE_PAGES.length;

  /* Combien de questions restent sans réponse sur cette page : on ne bloque
     pas le passage, mais on dit ce qui manque. */
  const sansReponse = MANUEL_INFORMATIQUE
    .filter(q => groupesDeLaPage.some(g => g.code === q.groupe))
    .filter(q => !form[q.code]).length;

  return h('div', { className: 'etape-carte manuel-etape' },
    h('div', { className: 'manuel-pages' },
      MANUEL_INFORMATIQUE_PAGES.map(p => h('button', {
        key: p.numero, type: 'button',
        className: cx('manuel-page-onglet', page === p.numero && 'actif'),
        onClick: () => setPage(p.numero),
      }, `${p.numero}. ${p.label}`))
    ),

    groupesDeLaPage.map(g => h('section', {
      key: g.code, className: cx('manuel-bloc', 'teinte-' + g.teinte),
    },
      h('h3', { className: 'manuel-bloc-titre' }, g.label),
      h('div', { className: 'questionnaire' },
        MANUEL_INFORMATIQUE.filter(q => q.groupe === g.code).map(question)
      )
    )),

    sansReponse
      ? h('p', { className: 'champ-aide' },
        `${sansReponse} ${pluriel(sansReponse, 'question sans réponse', 'questions sans réponse')} sur cette page.`)
      : null,

    derniere
      ? h(PiedEtapeManuel, { code: 'informatique', valideeLe: enregistre.valideeLe, onValider: valider })
      : h('div', { className: 'manuel-pied-page' },
        h('button', { className: 'btn btn-primary', onClick: () => setPage(page + 1) },
          'Page suivante →')
      )
  );
}
