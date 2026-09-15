// ComplyEC — Documents du cabinet (S52 à S58) — phase 3 de la refonte V3
'use strict';

/* =====================================================================
   Le pipeline : source → information proposée → donnée confirmée
   =====================================================================

   Ces sept écrans sont le cœur de la refonte. Tout le reste en dépend : le
   manuel, les notes, les registres se nourrissent des données confirmées ici,
   et la règle de source unique (§ 1.3) veut qu'aucun autre écran ne redemande
   ce que celui-ci sait déjà.

   Deux choses ne s'y font jamais. L'IA n'y conclut rien — elle propose une
   valeur, montre où elle l'a lue, et attend. Et l'aperçu d'un document n'y
   devient pas un éditeur : si une valeur est fausse dans la feuille, elle est
   fausse dans la donnée, et c'est la donnée qu'on corrige. Corriger le
   document laisserait les deux en désaccord sans que personne le sache.
   ===================================================================== */

/* Bandeau de franchise, affiché partout où une valeur vient d'une lecture de
   document. Tant que la fonction serveur d'extraction n'est pas déployée, les
   valeurs proposées sont des exemples — et l'écran le dit plutôt que de
   laisser croire qu'un document a réellement été lu. */
function MentionExtraction() {
  if (EXTRACTION_DISPONIBLE) return null;
  return h('div', { className: 'mention-simulee' },
    h('span', { className: 'mention-simulee-puce' }, '⚠'),
    h('span', null, EXTRACTION_MENTION)
  );
}

function BadgeEtatInfo({ info }) {
  const e = ETATS_INFO[info.statut] || ETATS_INFO.a_confirmer;
  if (info.statut === 'confirmee' && info.confirmeLe) {
    return h(Badge, { color: 'vert' }, '✓ ', formatDate(info.confirmeLe));
  }
  return h(Badge, { color: e.badge }, e.libelle);
}

// ==================================================== S52 — Documents du cabinet

/* Le module documentaire : le parcours en quatre étapes, et les écrans qu'il
   ouvre.

   Les sept catégories en grandes cartes disaient où ranger un fichier, pas ce
   qu'il restait à faire. Les anciennes adresses restent valides — un lien vers
   `documents-cabinet/manquantes` ou vers une catégorie ouvre toujours son
   écran. */
function DocumentsCabinet({ sub, navigateEc, showToast, encadre }) {
  const retour = () => navigateEc('documents-cabinet', null);

  if (sub === 'a-confirmer') return h(InformationsAConfirmer, { onBack: retour, showToast });
  if (sub === 'referentiel') return h(ReferentielInformations, { onBack: retour, showToast });
  if (sub === 'manquantes') return h(InformationsManquantes, { onBack: retour, showToast });
  if (sub === 'generes') return h(DocumentsGeneres, { onBack: retour, showToast });
  if (sub && sub.startsWith('cat-')) {
    return h(CategorieDocuments, { code: sub.slice(4), onBack: retour, showToast });
  }

  /* Sans sous-écran, ou sur un code d'étape : le parcours guidé, ouvert à la
     première étape qui n'est pas prête. */
  return h(DocumentsGuidedShell, {
    etape: sub,
    onAller: code => navigateEc('documents-cabinet', code),
    navigateEc, showToast,
  });
}

// ================================================== S53 — Catégorie de documents

function CategorieDocuments({ code, onBack, showToast }) {
  const cat = docCategorie(code);
  const [fichiers, setFichiers] = useState(() => sourcesDeCategorie(code));
  const [choisi, setChoisi] = useState(null);
  const [survol, setSurvol] = useState(false);

  /* Un dépôt n'est pas un classement : le fichier arrive dans sa catégorie et
     c'est tout. Le cahier interdit la GED à arborescence profonde. */
  function deposer(liste) {
    const ajouts = Array.from(liste).map((f, i) => ({
      id: 'src-local-' + Date.now() + '-' + i,
      categorie: code, nom: f.name, type: 'Déposé à l’instant',
      dateDepot: new Date().toISOString().slice(0, 10),
      etatExtraction: 'en-attente', pages: null, version: 'v1', local: true,
    }));
    if (!ajouts.length) return;
    setFichiers(prev => ajouts.concat(prev));
    showToast(`${ajouts.length} ${pluriel(ajouts.length, 'fichier déposé', 'fichiers déposés')}. ${EXTRACTION_DISPONIBLE ? 'Lecture en cours.' : 'La lecture demande la fonction serveur, pas encore déployée.'}`);
  }

  const colonnes = [
    { code: 'nom', titre: 'Fichier', classe: 'table-name', valeur: f => f.nom, rendu: f => f.nom },
    { code: 'type', titre: 'Type', valeur: f => f.type, rendu: f => f.type },
    { code: 'date', titre: 'Déposé le', valeur: f => f.dateDepot, rendu: f => formatDate(f.dateDepot) },
    { code: 'etat', titre: 'Lecture', valeur: f => f.etatExtraction,
      rendu: f => h(Badge, { color: SOURCE_ETATS[f.etatExtraction].couleur }, SOURCE_ETATS[f.etatExtraction].label) },
  ];

  const infos = choisi ? infosDeSource(choisi.id) : [];
  const fiche = choisi
    ? h(Card, {
      title: choisi.nom, subtitle: `${choisi.type} — déposé le ${formatDate(choisi.dateDepot)}`,
      icon: '📄', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: choisi.etatExtraction === 'traite' ? 'vert' : choisi.etatExtraction === 'non-lisible' ? 'orange' : 'bleu',
    },
      choisi.etatExtraction === 'non-lisible'
        ? h('p', { className: 'conf-detail', style: { marginTop: 0 } },
          'Ce document n’a pas pu être lu : il s’agit d’un scan sans couche texte. Les informations qu’il porte sont à saisir à la main.')
        : null,
      infos.length
        ? h(React.Fragment, null,
          h('div', { className: 'detail-field-label', style: { marginBottom: 8 } },
            `${infos.length} ${pluriel(infos.length, 'information détectée', 'informations détectées')}`),
          infos.map(i => h(SourceInfoRow, {
            key: i.cle, libelle: i.libelle, valeur: i.valeur, etat: i.statut,
            source: i.repere ? `${choisi.nom} — ${i.repere}` : choisi.nom,
            extrait: i.extrait, confirmeeLe: i.confirmeLe,
          })))
        : h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          choisi.etatExtraction === 'en-attente'
            ? 'Ce document n’a pas encore été lu.'
            : 'Aucune information ciblée n’a été trouvée dans ce document.'),
      h('div', { style: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Ouverture du fichier (démonstration)') }, 'Ouvrir le fichier'),
        h('button', {
          className: 'btn btn-secondary btn-sm',
          onClick: () => {
            setFichiers(prev => prev.filter(f => f.id !== choisi.id));
            setChoisi(null);
            showToast(`${choisi.nom} retiré de la catégorie.`);
          },
        }, 'Retirer')
      )
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: cat.label, onRetour: onBack }),
    /* Zone de dépôt franche : le cahier demande un grand rectangle explicite,
       glisser-déposer ou parcourir. Les deux gestes font la même chose. */
    h('label', {
      className: cx('depot-zone', survol && 'survol'),
      onDragOver: e => { e.preventDefault(); setSurvol(true); },
      onDragLeave: () => setSurvol(false),
      onDrop: e => { e.preventDefault(); setSurvol(false); deposer(e.dataTransfer.files); },
    },
      h('span', { className: 'depot-icone' }, '📥'),
      h('span', { className: 'depot-titre' }, 'Déposer des fichiers dans « ', cat.label, ' »'),
      h('span', { className: 'depot-aide' }, 'Glissez vos documents ici, ou cliquez pour les choisir.'),
      h('span', { className: 'depot-attendus' }, cat.typiques),
      h('input', { type: 'file', multiple: true, style: { display: 'none' }, onChange: e => { deposer(e.target.files); e.target.value = ''; } })
    ),
    h(ActionListDetail, {
      titreListe: 'Fichiers déposés', iconeListe: cat.icone, tonListe: 'violet',
      sousTitreListe: String(fichiers.length),
      colonnes, lignes: fichiers, cle: f => f.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucun fichier dans cette catégorie pour le moment.',
      selection: choisi && choisi.id, onSelect: setChoisi,
      detail: fiche, detailIcone: '📄',
      detailVide: 'Choisissez un fichier pour voir ce qui en a été tiré',
    })
  );
}

// ================================================= S54 — Informations à confirmer

function InformationsAConfirmer({ onBack, showToast, dansParcours, navigateEc }) {
  const [confirmees, setConfirmees] = useState({});
  const [filtre, setFiltre] = useState('a-confirmer');
  const [choisie, setChoisie] = useState(null);

  const toutes = REFERENTIEL_INFOS.map(i => (confirmees[i.cle]
    ? Object.assign({}, i, { statut: 'confirmee', confirmeLe: confirmees[i.cle], confirmePar: EXPERT_COMPTABLE.nom })
    : i));

  const filtres = [
    { code: 'a-confirmer', label: 'À confirmer', test: i => i.statut === 'a_confirmer' },
    { code: 'contradictoires', label: 'Contradictoires', test: i => i.statut === 'contradictoire' },
    { code: 'recentes', label: 'Confirmées récemment', test: i => i.statut === 'confirmee' },
  ];
  const actif = filtres.find(f => f.code === filtre);
  const lignes = toutes.filter(actif.test);
  const sansAlerte = toutes.filter(infoSansAlerte);

  /* La confirmation écrit dans la couche de données : l'information devient
     canonique, tous les écrans qui la lisent la reprennent, et les documents
     qui l'impriment repassent en « à régénérer ». Elle ne vivait auparavant
     que dans l'état de l'écran et disparaissait au rafraîchissement. */
  async function confirmer(cles, message) {
    await dbConfirmerInformations(cles);
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const maj = {};
    cles.forEach(c => { maj[c] = aujourdhui; });
    setConfirmees(prev => Object.assign({}, prev, maj));
    setChoisie(null);
    showToast(message);
  }

  const colonnes = [
    { code: 'libelle', titre: 'Information', classe: 'table-name', valeur: i => i.libelle, rendu: i => i.libelle },
    { code: 'valeur', titre: 'Valeur proposée', valeur: i => i.valeur || '', rendu: i => i.valeur || h('span', { className: 'info-source-vide' }, 'Non trouvée') },
    { code: 'etat', titre: 'État', valeur: i => i.statut, rendu: i => h(BadgeEtatInfo, { info: i }) },
  ];

  const courante = choisie ? toutes.find(i => i.cle === choisie) : null;
  const source = courante && courante.sourceId ? SOURCES_DOCUMENTS.find(s => s.id === courante.sourceId) : null;

  const fiche = courante
    ? h(Card, {
      title: courante.libelle,
      subtitle: source ? `${source.nom} — ${courante.repere || 'document entier'}` : 'Aucune source',
      icon: '🔎', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: courante.statut === 'contradictoire' ? 'orange' : 'bleu',
    },
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Valeur proposée'),
        h('div', { className: 'detail-field-value', style: { fontSize: 16, fontWeight: 700 } },
          courante.valeur || h('span', { className: 'info-source-vide' }, 'Non trouvée'))),
      courante.extrait
        ? h('div', { className: 'detail-field' },
          h('div', { className: 'detail-field-label' }, 'Passage d’origine'),
          h('blockquote', { className: 'extrait-source' }, '« ', courante.extrait, ' »'))
        : null,
      courante.statut === 'contradictoire'
        ? h('div', { className: 'info-box', style: { marginBottom: 14 } }, '⚠️ ',
          'Deux sources ne concordent pas. Le cahier des charges interdit de trancher automatiquement : la décision vous revient.')
        : null,
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Où cette valeur ressortira'),
        h('div', { className: 'detail-field-value' }, courante.usages.join(' · '))),
      courante.statut === 'confirmee'
        ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          'Confirmée le ', formatDate(courante.confirmeLe), ' par ', courante.confirmePar, '.')
        : h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('button', { className: 'btn btn-primary btn-sm', onClick: () => confirmer([courante.cle], `${courante.libelle} confirmée.`) }, 'Confirmer'),
          h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('La correction se fait dans le référentiel (démonstration).') }, 'Corriger'),
          h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Marquée « non trouvée » : elle passera dans les informations manquantes (démonstration).') }, 'Non trouvée')
        )
    )
    : null;

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Informations à confirmer',
    actions: h(React.Fragment, null,
      onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
      /* Le référentiel complet reste atteignable : c'est la liste de toutes
         les données canoniques du cabinet, celle qu'on consulte pour vérifier
         d'où vient une valeur. Sans ce raccourci, le parcours l'aurait rendue
         inaccessible. */
      navigateEc
        ? h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('documents-cabinet', 'referentiel') },
          '📚 Référentiel des informations')
        : null,
      sansAlerte.length
        ? h('button', {
          className: 'btn btn-primary',
          onClick: () => confirmer(sansAlerte.map(i => i.cle),
            `${sansAlerte.length} ${pluriel(sansAlerte.length, 'information confirmée', 'informations confirmées')}.`),
        }, `✓ Confirmer les ${sansAlerte.length} valeurs sans alerte`)
        : null
    ),
  },
    h(MentionExtraction),
    /* Les contradictions ne sont jamais dans le lot : elles demandent une
       décision, pas un acquiescement. */
    h('div', { className: 'tabs', style: { marginBottom: 14 } },
      filtres.map(f => h('button', {
        key: f.code, className: cx('tab', filtre === f.code && 'active'),
        onClick: () => { setFiltre(f.code); setChoisie(null); },
      }, f.label, ' ', h('span', { className: 'tab-compte' }, toutes.filter(f.test).length)))
    ),
    h(ActionListDetail, {
      titreListe: actif.label, iconeListe: '🔎', tonListe: 'violet',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: i => i.cle, parPage: 5,
      vide: filtre === 'a-confirmer' ? 'Tout est confirmé.' : 'Rien dans cette vue.',
      selection: choisie, onSelect: i => setChoisie(i.cle),
      detail: fiche, detailIcone: '🔎',
      detailVide: 'Choisissez une information pour voir d’où elle vient',
    })
  );
}

// =============================================== S55 — Référentiel des informations

function ReferentielInformations({ onBack, showToast }) {
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('toutes');
  const [choisie, setChoisie] = useState(null);

  const terme = recherche.trim().toLowerCase();
  const lignes = REFERENTIEL_INFOS.filter(i =>
    (categorie === 'toutes' || i.categorie === categorie)
    && (!terme || i.libelle.toLowerCase().includes(terme) || String(i.valeur || '').toLowerCase().includes(terme)));

  const colonnes = [
    { code: 'libelle', titre: 'Information', classe: 'table-name', valeur: i => i.libelle, rendu: i => i.libelle },
    { code: 'valeur', titre: 'Valeur', valeur: i => i.valeur || '', rendu: i => i.valeur || h('span', { className: 'info-source-vide' }, 'Non renseignée') },
    { code: 'etat', titre: 'État', valeur: i => i.statut, rendu: i => h(BadgeEtatInfo, { info: i }) },
  ];

  const courante = choisie ? REFERENTIEL_INFOS.find(i => i.cle === choisie) : null;
  const source = courante && courante.sourceId ? SOURCES_DOCUMENTS.find(s => s.id === courante.sourceId) : null;
  const dependants = courante ? documentsDependantDe(courante.cle) : [];

  const fiche = courante
    ? h(Card, {
      title: courante.libelle, subtitle: docCategorie(courante.categorie).label,
      icon: '📚', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: courante.statut === 'confirmee' ? 'vert' : 'bleu',
    },
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Valeur'),
        h('div', { className: 'detail-field-value', style: { fontSize: 16, fontWeight: 700 } },
          courante.valeur || h('span', { className: 'info-source-vide' }, 'Non renseignée'))),
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Provenance'),
        h('div', { className: 'detail-field-value' },
          source ? `${source.nom}${courante.repere ? ' — ' + courante.repere : ''}` : (courante.note || 'Saisie dans ComplyEC'))),
      courante.confirmeLe
        ? h('div', { className: 'detail-field' },
          h('div', { className: 'detail-field-label' }, 'Confirmée'),
          h('div', { className: 'detail-field-value' }, `Le ${formatDate(courante.confirmeLe)} par ${courante.confirmePar}`))
        : null,
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Usages'),
        h('div', { className: 'detail-field-value' }, courante.usages.join(' · '))),
      /* La conséquence d'une modification est dite avant, pas après : c'est
         la règle de recette « modifier une donnée canonique marque les
         documents dépendants à régénérer ». */
      dependants.length
        ? h('div', { className: 'info-box', style: { marginBottom: 14 } }, 'ℹ️ ',
          `Modifier cette valeur marquera ${dependants.length} ${pluriel(dependants.length, 'document', 'documents')} à régénérer : `,
          dependants.map(d => d.type).join(', '), '.')
        : null,
      h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Modification d’une information canonique (démonstration).') },
        'Modifier cette information')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Référentiel des informations', onRetour: onBack }),
    h('div', { className: 'filter-row', style: { marginBottom: 14 } },
      h('input', {
        className: 'form-input', style: { maxWidth: 300 }, placeholder: 'Rechercher une information…',
        value: recherche, onChange: e => setRecherche(e.target.value),
      }),
      h('select', { className: 'pill-select', value: categorie, onChange: e => { setCategorie(e.target.value); setChoisie(null); } },
        h('option', { value: 'toutes' }, 'Toutes les catégories'),
        DOC_CATEGORIES.map(c => h('option', { key: c.code, value: c.code }, c.label))
      )
    ),
    h(ActionListDetail, {
      titreListe: 'Ce que ComplyEC sait du cabinet', iconeListe: '📚',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: i => i.cle, parPage: 5,
      vide: 'Aucune information ne correspond à cette recherche.',
      selection: choisie, onSelect: i => setChoisie(i.cle),
      detail: fiche, detailIcone: '📚',
      detailVide: 'Choisissez une information pour voir sa source et ses usages',
    })
  );
}

// ================================================ S56 — Informations manquantes

function InformationsManquantes({ onBack, showToast, dansParcours }) {
  const themes = themesInformationsManquantes();
  const [etape, setEtape] = useState(1);
  const [reponses, setReponses] = useState({});

  if (!themes.length) {
    return h('div', { className: 'page' },
      h(EnteteHub, { titre: 'Informations manquantes', onRetour: onBack }),
      h(FormSection, { icon: '✅', title: 'Aucun trou à combler', ton: 'vert' },
        h('p', { className: 'conf-detail', style: { margin: 0 } },
          'Toutes les informations attendues ont été trouvées dans les documents déposés ou saisies.'))
    );
  }

  const theme = themes[Math.min(etape, themes.length) - 1];
  const connues = infosDeCategorie(theme.code).filter(i => i.statut === 'confirmee' || i.statut === 'auto');
  const dernier = etape >= themes.length;

  function suivant() {
    if (dernier) { showToast('Informations complétées (démonstration).'); onBack(); return; }
    setEtape(e => e + 1);
  }

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Informations manquantes',
    actions: onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
  },
    h(Stepper, { steps: themes.map(t => t.label), current: etape }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'grid-2 colonnes-egales' },
          /* À gauche ce qui est déjà su, en lecture seule : le cahier interdit
             de redemander une information qu'un autre module détient. La
             montrer évite aussi de répondre à côté. */
          h(FormSection, { icon: '📗', title: 'Ce que nous savons déjà', ton: 'bleu' },
            connues.length
              ? connues.map(i => h('div', { className: 'list-row', key: i.cle },
                h('span', { className: 'list-row-label' }, i.libelle),
                h('span', { className: 'conf-note' }, i.valeur)))
              : h('p', { className: 'conf-detail', style: { margin: 0 } },
                'Rien n’est encore confirmé dans cette catégorie.')
          ),
          h(FormSection, { icon: '✍️', title: 'À compléter', ton: 'dore', subtitle: String(theme.manquantes.length) },
            /* Deux à quatre questions par écran : au-delà, on ajoute une étape.
               Ce n'est pas un formulaire de quatre-vingts champs. */
            theme.manquantes.slice(0, 4).map(i => h('div', { className: 'form-group', key: i.cle },
              h('label', { className: 'form-label' }, i.libelle),
              h('input', {
                className: 'form-input', value: reponses[i.cle] || '',
                placeholder: 'Votre réponse',
                onChange: e => setReponses(r => Object.assign({}, r, { [i.cle]: e.target.value })),
              }),
              h('div', { className: 'form-help' },
                i.note ? i.note + ' ' : '',
                'Utilisée dans : ', i.usages.join(', '), '.')
            )),
            theme.manquantes.length > 4
              ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
                `${theme.manquantes.length - 4} autres questions de cette catégorie suivront.`)
              : null
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        etape > 1 ? h('button', { className: 'btn btn-secondary', onClick: () => setEtape(e => e - 1) }, '← Retour') : null,
        h('button', { className: 'btn btn-primary', onClick: suivant },
          dernier ? '✅ Terminer' : 'Confirmer et continuer →')
      )
    )
  );
}

// ==================================================== S57 — Documents générés

function DocumentsGeneres({ onBack, showToast, dansParcours }) {
  const [choisi, setChoisi] = useState(null);
  const [apercu, setApercu] = useState(null);

  if (apercu) return h(ApercuDocument, { document: apercu, onBack: () => setApercu(null), showToast });

  const colonnes = [
    { code: 'type', titre: 'Document', classe: 'table-name', valeur: d => d.type, rendu: d => d.type },
    { code: 'version', titre: 'Version', valeur: d => d.version, rendu: d => d.version },
    { code: 'date', titre: 'Généré le', valeur: d => d.date, rendu: d => formatDate(d.date) },
    { code: 'etat', titre: 'État', valeur: d => d.etat,
      rendu: d => h(Badge, { color: d.etat === 'a-jour' ? 'vert' : 'orange' }, d.etat === 'a-jour' ? 'À jour' : 'À régénérer') },
  ];

  const fiche = choisi
    ? h(Card, {
      title: choisi.type, subtitle: `${choisi.version} — ${formatDate(choisi.date)}`,
      icon: '📄', iconBg: '#E6F6EC', iconColor: '#15803D',
      tone: choisi.etat === 'a-jour' ? 'vert' : 'orange',
    },
      choisi.motif
        ? h('div', { className: 'info-box', style: { marginBottom: 14 } }, '⚠️ ', choisi.motif)
        : null,
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Variables reprises'),
        h('div', { className: 'detail-field-value' },
          choisi.variables.map(v => {
            const info = REFERENTIEL_INFOS.find(i => i.cle === v);
            return h('div', { className: 'list-row', key: v },
              h('span', { className: 'list-row-label' }, info ? info.libelle : v),
              h('span', { className: 'conf-note' }, info && info.valeur ? info.valeur : '—'));
          }))),
      h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-primary btn-sm', onClick: () => setApercu(choisi) }, 'Aperçu'),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast(`${choisi.type} régénéré à partir des données confirmées (démonstration).`) },
          'Générer une nouvelle version')
      )
    )
    : null;

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Documents générés',
    actions: onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
  },
    h(ActionListDetail, {
      titreListe: 'Productions du cabinet', iconeListe: '📄', tonListe: 'vert',
      sousTitreListe: String(dbDocumentsGeneres().length),
      colonnes, lignes: dbDocumentsGeneres(), cle: d => d.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucun document généré pour le moment.',
      selection: choisi && choisi.id, onSelect: setChoisi,
      detail: fiche, detailIcone: '📄',
      detailVide: 'Choisissez un document pour voir ses variables',
    })
  );
}

// =================================================== S58 — Aperçu d'un document

function ApercuDocument({ document: doc, onBack, showToast }) {
  const variables = doc.variables.map(v => REFERENTIEL_INFOS.find(i => i.cle === v)).filter(Boolean);
  const alertes = variables.filter(v => v.statut !== 'confirmee');

  const feuille = [
    doc.type.toUpperCase(),
    '',
    (REFERENTIEL_INFOS.find(i => i.cle === 'cabinet.denomination') || {}).valeur || '',
    (REFERENTIEL_INFOS.find(i => i.cle === 'cabinet.adresse') || {}).valeur || '',
    '',
    `Version ${doc.version} — établie le ${formatDateLong(doc.date)}`,
    '',
    'Ce document est produit à partir des informations confirmées du cabinet.',
    'Chaque valeur reprise ci-dessous provient du référentiel : elle n’a pas été',
    'saisie dans le document, et se corrige à sa source.',
    '',
    ...variables.map(v => `${v.libelle} : ${v.valeur || '— à renseigner —'}`),
    '',
    `${(REFERENTIEL_INFOS.find(i => i.cle === 'orga.gerant') || {}).valeur || ''}`,
    'Expert-comptable',
  ].join('\n');

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: doc.type, onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => showToast(`${doc.nom} généré (démonstration).`) },
        '⬇ Générer le document'),
    }),
    h(DocumentPreviewShell, {
      titreDocument: `${doc.nom} — ${doc.version}`,
      feuille,
      titrePanneau: 'Variables et sources',
      panneau: h(React.Fragment, null,
        alertes.length
          ? h('div', { className: 'info-box', style: { marginBottom: 12 } }, '⚠️ ',
            `${alertes.length} ${pluriel(alertes.length, 'valeur n’est pas confirmée', 'valeurs ne sont pas confirmées')}. `,
            'Le document peut être produit, mais ces valeurs restent à valider.')
          : null,
        variables.map(v => h(SourceInfoRow, {
          key: v.cle, libelle: v.libelle, valeur: v.valeur, etat: v.statut,
          source: v.sourceId ? (SOURCES_DOCUMENTS.find(s => s.id === v.sourceId) || {}).nom : (v.note || 'Saisie dans ComplyEC'),
          confirmeeLe: v.confirmeLe,
        }))
      ),
      actions: h('p', { className: 'conf-detail', style: { margin: 0 } },
        'Une valeur fausse se corrige dans le référentiel, jamais dans l’aperçu : corriger le document laisserait les deux en désaccord.'),
    })
  );
}

/* =====================================================================
   Parcours Documents en quatre étapes — § 28 du prompt V6
   =====================================================================

   Le module affichait sept catégories en grandes cartes. On y voyait où
   ranger un fichier, pas ce qu'il restait à faire : les informations à
   confirmer et celles qui manquaient vivaient derrière deux boutons d'en-tête,
   et rien ne disait dans quel ordre s'y prendre.

   Le parcours suit l'ordre du travail : déposer ce qu'on a, confirmer ce que
   ComplyEC y a trouvé, compléter ce qui manque, produire les documents. C'est
   le même sous-parcours que l'étape 1 du parcours principal, avec le même
   état : ouvrir « Documents du cabinet » depuis la barre latérale ou l'étape 1
   mène ici (§ 11).
   ===================================================================== */

const DOCUMENTS_ETAPES = [
  { code: 'deposer', titre: 'Déposer les documents', court: 'Déposer', ton: 'violet' },
  { code: 'confirmer', titre: 'Confirmer les informations trouvées', court: 'Confirmer', ton: 'violet' },
  { code: 'completer', titre: 'Compléter ce qui manque', court: 'Compléter', ton: 'bleu' },
  { code: 'produire', titre: 'Produire les documents', court: 'Produire', ton: 'vert' },
];

function etapeDocuments(code) {
  const i = DOCUMENTS_ETAPES.findIndex(e => e.code === code);
  return i < 0 ? null : Object.assign({ rang: i + 1 }, DOCUMENTS_ETAPES[i]);
}

/* L'état des quatre étapes, déduit des faits. Déposer est « fait » dès qu'un
   document existe : le § 44 précise qu'une information saisie à la main et
   validée vaut preuve, le dépôt n'est donc jamais obligatoire. */
function computeDocumentsJourneyState() {
  const sources = dbSources();
  const aConfirmer = infosAConfirmer();
  const manquantes = infosManquantes();
  const documents = dbDocumentsGeneres();
  const aRegenerer = documents.filter(d => d.etat === 'a-regenerer');

  const etapes = {
    deposer: {
      pret: sources.length > 0,
      resume: `${sources.length} ${pluriel(sources.length, 'document déposé', 'documents déposés')}`,
      reste: sources.length ? null : 'Aucun document déposé.',
    },
    confirmer: {
      pret: aConfirmer.length === 0,
      resume: aConfirmer.length
        ? `${aConfirmer.length} ${pluriel(aConfirmer.length, 'information')} à confirmer`
        : 'Toutes les informations trouvées sont confirmées',
      reste: aConfirmer.length ? `${aConfirmer.length} ${pluriel(aConfirmer.length, 'information attend', 'informations attendent')} votre validation.` : null,
    },
    completer: {
      pret: manquantes.length === 0,
      resume: manquantes.length
        ? `${manquantes.length} ${pluriel(manquantes.length, 'information manquante', 'informations manquantes')}`
        : 'Aucune information ne manque',
      reste: manquantes.length ? 'Sans elles, le manuel ne peut pas être produit.' : null,
    },
    produire: {
      pret: aRegenerer.length === 0 && documents.length > 0,
      resume: `${documents.length - aRegenerer.length} ${pluriel(documents.length - aRegenerer.length, 'document à jour', 'documents à jour')} sur ${documents.length}`,
      reste: aRegenerer.length
        ? `${aRegenerer.length} ${pluriel(aRegenerer.length, 'document est', 'documents sont')} à régénérer.`
        : null,
    },
  };

  DOCUMENTS_ETAPES.forEach((e, i) => {
    Object.assign(etapes[e.code], { code: e.code, titre: e.titre, court: e.court, ton: e.ton, rang: i + 1 });
  });

  const liste = DOCUMENTS_ETAPES.map(e => etapes[e.code]);
  const pretes = liste.filter(s => s.pret).length;
  const courante = liste.find(s => !s.pret) || liste[liste.length - 1];
  return { etapes, liste, pretes, total: liste.length, courante };
}

/* Le fil des quatre étapes. Même grammaire que les deux autres parcours : on
   reconnaît la mécanique avant d'avoir lu le titre. */
function DocumentsFil({ courante, onAller, etat }) {
  return h('div', { className: 'parcours-fil', role: 'navigation', 'aria-label': 'Étapes du dépôt documentaire' },
    DOCUMENTS_ETAPES.map((e, i) => {
      const actif = e.code === courante;
      const pret = etat.etapes[e.code].pret;
      return h('button', {
        key: e.code,
        className: cx('parcours-fil-etape', actif && 'active', pret && 'pret'),
        onClick: () => onAller(e.code),
        'aria-current': actif ? 'step' : undefined,
        title: `Étape ${i + 1} sur ${DOCUMENTS_ETAPES.length} — ${e.titre}`,
      },
        h('span', { className: 'parcours-fil-rang' }, pret && !actif ? '✓' : String(i + 1)),
        h('span', { className: 'parcours-fil-titre' }, e.court)
      );
    })
  );
}

function DocumentsGuidedShell({ etape, onAller, navigateEc, showToast }) {
  const etat = computeDocumentsJourneyState();
  const code = etapeDocuments(etape) ? etape : etat.courante.code;
  const e = etapeDocuments(code);
  const suivante = e.rang < DOCUMENTS_ETAPES.length ? DOCUMENTS_ETAPES[e.rang] : null;
  const precedente = e.rang > 1 ? DOCUMENTS_ETAPES[e.rang - 2] : null;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'parcours-rang' }, `Étape ${e.rang} sur ${DOCUMENTS_ETAPES.length} — documents du cabinet`),
        h('h1', null, e.titre)
      ),
      h('div', { className: 'page-header-actions' },
        precedente
          ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(precedente.code) }, '← ' + precedente.court)
          : null,
        suivante
          ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(suivante.code) }, suivante.court + ' →')
          : null
      )
    ),
    h(DocumentsFil, { courante: code, onAller, etat }),
    h('div', { className: 'parcours-contenu' },
      code === 'deposer' ? h(DocumentsDeposer, { navigateEc, showToast })
        : code === 'confirmer' ? h(InformationsAConfirmer, { showToast, dansParcours: true, navigateEc })
          : code === 'completer' ? h(InformationsManquantes, { showToast, dansParcours: true })
            : h(DocumentsGeneres, { showToast, dansParcours: true })
    )
  );
}

/* Étape 1 — Déposer (§ 28.1).

   Des pastilles de catégorie, pas sept grandes cartes : le choix de la
   catégorie n'est pas le travail, c'est un préalable d'un clic. La colonne de
   droite dit ce que ComplyEC cherche dans cette catégorie, pour qu'on sache
   quel document aller chercher. */
function DocumentsDeposer({ navigateEc, showToast }) {
  const [categorie, setCategorie] = useState(DOC_CATEGORIES[0].code);
  const cat = docCategorie(categorie);
  const fichiers = sourcesDeCategorie(categorie);
  const infos = infosDeCategorie(categorie);

  return h(React.Fragment, null,
    h('div', { className: 'doc-pills' },
      DOC_CATEGORIES.map(c => {
        const n = sourcesDeCategorie(c.code).length;
        return h('button', {
          key: c.code,
          className: cx('doc-pill', c.code === categorie && 'active'),
          onClick: () => setCategorie(c.code),
        }, c.icone, ' ', c.label, h('span', { className: 'doc-pill-compte' }, n));
      })
    ),
    h('div', { className: 'documents-colonnes' },
      h(FormSection, { icon: cat.icone, title: cat.label, ton: 'violet',
        subtitle: `${fichiers.length} ${pluriel(fichiers.length, 'fichier')}` },
        h(DepotFichiers, { code: categorie, showToast }),
        fichiers.length
          ? h('div', { className: 'depot-liste' },
            fichiers.slice(0, 5).map(f => h('div', { className: 'depot-ligne', key: f.id },
              h('span', { className: 'depot-nom' }, '📄 ', f.nom),
              h('span', { className: 'depot-date' }, formatDate(f.dateDepot))
            )),
            fichiers.length > 5
              ? h('div', { className: 'conf-detail', style: { marginBottom: 0 } },
                `${fichiers.length - 5} ${pluriel(fichiers.length - 5, 'autre fichier', 'autres fichiers')} dans cette catégorie.`)
              : null
          )
          : h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            'Aucun fichier déposé dans cette catégorie. Le dépôt n’est pas obligatoire : une information saisie à la main et confirmée vaut preuve.')
      ),
      h(FormSection, { icon: '🔎', title: 'Informations recherchées', ton: 'violet',
        subtitle: `${infos.length}` },
        h('div', { className: 'parcours-faits' },
          infos.slice(0, 7).map(i => h('div', { className: 'parcours-fait', key: i.cle },
            h('div', { className: 'parcours-fait-libelle' }, i.libelle),
            h('div', { className: 'parcours-reste-detail' },
              i.valeur || h('span', { className: 'valeur-valeur absente' }, 'À renseigner'))
          ))
        ),
        h(MentionExtraction)
      )
    )
  );
}

/* Le dépôt lui-même. Les fichiers ne sont pas conservés : leur nom et leur
   catégorie le sont. Prétendre stocker le contenu d'un PDF dans le navigateur
   serait un faux succès, et l'écran le dit. */
function DepotFichiers({ code, showToast }) {
  const champ = useRef(null);

  async function deposer(liste) {
    const fichiers = Array.from(liste || []);
    if (!fichiers.length) return;
    await dbDeposerFichiers(code, fichiers.map(f => ({ name: f.name, size: f.size })));
    showToast(`${fichiers.length} ${pluriel(fichiers.length, 'fichier déposé', 'fichiers déposés')} dans ${docCategorie(code).label}.`);
  }

  return h('div', { className: 'dropzone-simple' },
    h('input', {
      ref: champ, type: 'file', multiple: true, style: { display: 'none' },
      onChange: e => { deposer(e.target.files); e.target.value = ''; },
    }),
    h('div', { className: 'dropzone-icone' }, '📥'),
    h('div', { className: 'dropzone-titre' }, 'Déposer des fichiers'),
    h('div', { className: 'dropzone-detail' },
      'Le nom et la catégorie sont conservés. Le contenu des fichiers n’est pas stocké par ComplyEC.'),
    h('button', { className: 'btn btn-primary', onClick: () => champ.current && champ.current.click() },
      'Choisir des fichiers')
  );
}
