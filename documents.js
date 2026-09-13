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

function DocumentsCabinet({ sub, navigateEc, showToast }) {
  const retour = () => navigateEc('documents-cabinet', null);

  if (sub === 'a-confirmer') return h(InformationsAConfirmer, { onBack: retour, showToast });
  if (sub === 'referentiel') return h(ReferentielInformations, { onBack: retour, showToast });
  if (sub === 'manquantes') return h(InformationsManquantes, { onBack: retour, showToast });
  if (sub === 'generes') return h(DocumentsGeneres, { onBack: retour, showToast });
  if (sub && sub.startsWith('cat-')) {
    return h(CategorieDocuments, { code: sub.slice(4), onBack: retour, showToast });
  }

  const aConfirmer = infosAConfirmer().length;
  const manquantes = infosManquantes().length;
  const aRegenerer = DOCUMENTS_GENERES.filter(d => d.etat === 'a-regenerer').length;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Documents du cabinet',
      actions: h(React.Fragment, null,
        manquantes
          ? h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('documents-cabinet', 'manquantes') },
            `❓ ${manquantes} ${pluriel(manquantes, 'information manquante', 'informations manquantes')}`)
          : null,
        aConfirmer
          ? h('button', { className: 'btn btn-primary', onClick: () => navigateEc('documents-cabinet', 'a-confirmer') },
            `✓ ${aConfirmer} ${pluriel(aConfirmer, 'information à confirmer', 'informations à confirmer')}`)
          : null
      ),
    }),
    h(MentionExtraction),
    h(ThemeHub, {
      colonnes: 3,
      cartes: DOC_CATEGORIES.slice(0, 6).map(c => {
        const e = etatCategorieDocuments(c.code);
        return {
          cle: c.code, icone: c.icone, titre: c.label,
          compteur: e.aConfirmer ? `${e.aConfirmer} à confirmer` : (e.aLire ? `${e.aLire} à lire` : null),
          tonCompteur: e.aConfirmer ? 'violet' : 'orange',
          libelleAction: `${e.fichiers} ${pluriel(e.fichiers, 'fichier')} →`,
          onOuvrir: () => navigateEc('documents-cabinet', 'cat-' + c.code),
        };
      }),
    }),
    /* La septième catégorie et les documents produits vivent sous la grille :
       le cahier veut six cartes visibles, pas huit entassées. */
    h('div', { className: 'docs-pied' },
      DOC_CATEGORIES.slice(6).map(c => {
        const e = etatCategorieDocuments(c.code);
        return h('button', { className: 'docs-pied-lien', key: c.code, onClick: () => navigateEc('documents-cabinet', 'cat-' + c.code) },
          c.icone, ' ', c.label, h('span', { className: 'docs-pied-compte' }, `${e.fichiers} ${pluriel(e.fichiers, 'fichier')}`));
      }),
      h('button', { className: 'docs-pied-lien', onClick: () => navigateEc('documents-cabinet', 'referentiel') },
        '📚 Référentiel des informations',
        h('span', { className: 'docs-pied-compte' }, `${REFERENTIEL_INFOS.length} informations`)),
      h('button', { className: 'docs-pied-lien', onClick: () => navigateEc('documents-cabinet', 'generes') },
        '📄 Documents générés',
        h('span', { className: 'docs-pied-compte' },
          aRegenerer ? h(Badge, { color: 'orange' }, `${aRegenerer} à régénérer`) : `${DOCUMENTS_GENERES.length} documents`))
    )
  );
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

function InformationsAConfirmer({ onBack, showToast }) {
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

  function confirmer(cles, message) {
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

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Informations à confirmer',
      onRetour: onBack,
      actions: sansAlerte.length
        ? h('button', {
          className: 'btn btn-primary',
          onClick: () => confirmer(sansAlerte.map(i => i.cle),
            `${sansAlerte.length} ${pluriel(sansAlerte.length, 'information confirmée', 'informations confirmées')}.`),
        }, `✓ Confirmer les ${sansAlerte.length} valeurs sans alerte`)
        : null,
    }),
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

function InformationsManquantes({ onBack, showToast }) {
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

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Informations manquantes', onRetour: onBack }),
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

function DocumentsGeneres({ onBack, showToast }) {
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

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Documents générés', onRetour: onBack }),
    h(ActionListDetail, {
      titreListe: 'Productions du cabinet', iconeListe: '📄', tonListe: 'vert',
      sousTitreListe: String(DOCUMENTS_GENERES.length),
      colonnes, lignes: DOCUMENTS_GENERES, cle: d => d.id, parPage: 5,
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
