// ComplyEC — Écrans du module Expert-comptable
'use strict';

// ============================================================ 1. Vue d'ensemble

function ECOverview({ navigateEc, showToast }) {
  const categories = anomaliesParCategorie();
  const collaborateurs = anomaliesParCollaborateurList();
  const dossiers = anomaliesParDossierList().slice(0, 5);
  const maxColabAnomalies = Math.max(...collaborateurs.map(c => c.anomalies), 1);

  const conformiteItems = [
    { key: 'formations', label: CONFORMITE_CABINET.formationsLBCFT.label, detail: `${CONFORMITE_CABINET.formationsLBCFT.nonAJour.length} collaborateurs non à jour`, color: 'orange' },
    { key: 'declarations', label: CONFORMITE_CABINET.declarationsIndependance.label, detail: `${CONFORMITE_CABINET.declarationsIndependance.manquantes.length} manquantes`, color: 'orange' },
    { key: 'dependance', label: CONFORMITE_CABINET.dependanceEconomique.label, detail: `${CONFORMITE_CABINET.dependanceEconomique.dossiersASurveiller.length} dossiers à surveiller`, color: 'orange' },
    { key: 'diffusion', label: CONFORMITE_CABINET.diffusionProcedures.label, detail: `${CONFORMITE_CABINET.diffusionProcedures.accusesManquants.length} accusés manquants`, color: 'orange' },
    { key: 'classification', label: CONFORMITE_CABINET.classificationRisquesLBCFT.label, detail: CONFORMITE_CABINET.classificationRisquesLBCFT.statut, color: 'rouge' },
  ];

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Bonjour Martin Dupont 👋')),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select' }, h('option', null, '📅 Période : Mai 2026')),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Rapport exporté (démonstration)') }, '⬇ Exporter le rapport')
      )
    ),
    h('div', { className: 'dashboard-grid' },
      h(Card, { title: '1. Priorités par catégories', icon: '📋', iconBg: '#E9F1FE', iconColor: '#2563EB',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'categories') }, 'Voir le détail →') },
        categories.map(c => h('div', { className: 'list-row', key: c.code },
          h('span', { className: 'list-row-label' }, h(Dot, { color: PRIORITE_COULEURS[c.priorite] }), c.label),
          h('span', { className: 'list-row-value' }, c.anomalies)
        ))
      ),
      h(Card, { title: '2. Anomalies par collaborateur', icon: '👤', iconBg: '#E7F7ED', iconColor: '#16A34A',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'collaborateur') }, 'Voir le détail →') },
        collaborateurs.map(c => h('div', { className: 'bar-row', key: c.id },
          h('span', { className: 'bar-name' }, c.nom),
          h('span', { className: 'bar-track' }, h('span', { className: 'bar-fill', style: { width: (c.anomalies / maxColabAnomalies * 100) + '%', background: c.couleur } })),
          h('span', { className: 'bar-value' }, c.anomalies)
        ))
      ),
      h(Card, { title: '3. Dossiers nécessitant votre attention', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'dossier') }, 'Voir le détail →') },
        dossiers.map(d => h('div', { className: 'list-row', key: d.dossier.id },
          h('span', { className: 'list-row-label' }, d.dossier.nom),
          h('span', { className: 'list-row-value' }, d.anomalies + ' problème' + (d.anomalies > 1 ? 's' : ''))
        ))
      ),
      h(Card, { title: '4. Conformité cabinet', icon: '🛡️', iconBg: '#F1EAFE', iconColor: '#7C3AED',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('conformite', null) }, 'Voir le détail →') },
        conformiteItems.map(c => h('div', { className: 'list-row', key: c.key },
          h('span', { className: 'list-row-label' }, h(Dot, { color: c.color }), c.label),
          h('span', { style: { fontWeight: 500, color: 'var(--text-muted)', fontSize: '12.3px' } }, c.detail)
        ))
      )
    )
  );
}

// ============================================================ 2. Supervision bilan

function ECBilan({ showToast, focusDossier, onFocusHandled }) {
  const [exercice, setExercice] = useState(currentExerciceYear());
  const [selected, setSelected] = useState(() => (focusDossier ? BILAN_DOSSIERS.find(b => b.dossier === focusDossier) || null : null));

  useEffect(() => {
    if (focusDossier) {
      const match = BILAN_DOSSIERS.find(b => b.dossier === focusDossier);
      if (match) { setSelected(match); setExercice(match.exercice); }
      if (onFocusHandled) onFocusHandled();
    }
    // eslint-disable-next-line
  }, [focusDossier]);

  if (selected) {
    return h(BilanDetail, { row: selected, onBack: () => setSelected(null), showToast });
  }

  const exerciceOptions = [...new Set([currentExerciceYear(), ...BILAN_DOSSIERS.map(b => b.exercice)])].sort((a, b) => b - a);
  const dossiersExercice = BILAN_DOSSIERS.filter(b => b.exercice === exercice);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Supervision annuelle'), h('p', { className: 'subtitle' }, 'Validation de la note de synthèse de fin de mission')),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select', value: exercice, onChange: e => setExercice(Number(e.target.value)) },
          exerciceOptions.map(y => h('option', { key: y, value: y }, `Exercice : ${y}`))
        ),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Export généré (démonstration)') }, '⬇ Exporter')
      )
    ),
    h('div', { className: 'card' },
      dossiersExercice.length === 0
        ? h(EmptyDetail, { icon: '📅', label: `Aucun dossier pour l'exercice ${exercice}` })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Exercice', 'Collaborateur', 'Note préparée le', 'Statut', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              dossiersExercice.map(b => h('tr', { key: b.id, className: 'clickable', onClick: () => setSelected(b) },
                h('td', { className: 'table-name' }, client(b.dossier).nom),
                h('td', null, b.exercice),
                h('td', null, collaborateur(b.collaborateur).nom),
                h('td', null, formatDate(b.datePreparation)),
                h('td', null, h(Badge, { color: 'vert' }, '● ', b.statut)),
                h('td', null, h('button', { className: 'btn btn-secondary btn-sm', onClick: e => { e.stopPropagation(); setSelected(b); } }, 'Ouvrir'))
              ))
            )
          )
        )
    )
  );
}

function BilanDetail({ row, onBack, showToast }) {
  const c = client(row.dossier);
  const collab = collaborateur(row.collaborateur);
  const rentColor = { positif: 'vert', neutre: 'jaune', negatif: 'rouge' }[row.rentabilite.statut];
  const contColor = row.continuite.statut === 'ok' ? 'vert' : 'orange';
  const [commentaireEC, setCommentaireEC] = useState(row.commentaireEC || '');

  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour à la liste'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, `${c.nom} — Exercice ${row.exercice}`), h('p', { className: 'subtitle' }, `Préparé par ${collab.nom} le ${formatDate(row.datePreparation)}`))
    ),
    h('div', { className: 'stat-icon-row' },
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '📈'), h('div', { className: 'stat-label' }, 'Rentabilité du dossier'), h(Badge, { color: rentColor }, row.rentabilite.label)),
      h('div', { className: 'stat-icon-card' },
        h('span', { className: 'icon' }, '⚠️'), h('div', { className: 'stat-label' }, 'Problèmes comptables'), h(Badge, { color: row.problemes.count > 0 ? 'orange' : 'vert' }, row.problemes.label),
        row.problemes.description ? h('p', { style: { fontSize: 12.3, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 } }, row.problemes.description) : null
      ),
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '✅'), h('div', { className: 'stat-label' }, "Continuité d'exploitation"), h(Badge, { color: contColor }, row.continuite.label)),
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '💬'), h('div', { className: 'stat-label' }, 'Sujets à évoquer lors du bilan'), h('div', { className: 'stat-value' }, row.sujets))
    ),
    h('div', { className: 'comment-box' },
      h('div', { className: 'comment-box-title' }, "🧑‍💼 Réponse de l'expert-comptable au collaborateur"),
      h('textarea', { className: 'form-textarea', style: { minHeight: 90 }, value: commentaireEC, onChange: e => setCommentaireEC(e.target.value), placeholder: 'Rédigez votre retour au collaborateur…' }),
      h('div', { className: 'comment-date' }, row.dateCommentaireEC ? `Dernière mise à jour le ${formatDate(row.dateCommentaireEC)}` : 'Pas encore envoyé')
    ),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 20 } },
      h('button', { className: 'btn btn-primary', onClick: () => { showToast('Supervision validée, réponse transmise et dossier archivé (démonstration)'); onBack(); } }, 'Valider et archiver ✅')
    )
  );
}

// ============================================================ 3. Supervision des anomalies

function ECAnomalies({ sub, navigateEc, showToast, onOpenBilan }) {
  const current = sub || 'categories';
  const tabs = [
    { key: 'categories', label: 'Par catégories' },
    { key: 'collaborateur', label: 'Par collaborateur' },
    { key: 'dossier', label: 'Par dossier' },
    { key: 'relances', label: 'Relances et suivi' },
  ];
  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Supervision des anomalies'), h('p', { className: 'subtitle' }, "Synthèse des anomalies à traiter et suivi des régularisations"))
    ),
    h('div', { className: 'subnav' },
      tabs.map(t => h('button', { key: t.key, className: cx('subnav-btn', current === t.key && 'active'), onClick: () => navigateEc('anomalies', t.key) }, t.label))
    ),
    current === 'categories' && h(AnomaliesParCategorie, { showToast, onOpenBilan }),
    current === 'collaborateur' && h(AnomaliesParCollaborateur, { showToast, onOpenBilan }),
    current === 'dossier' && h(AnomaliesParDossier, { showToast, onOpenBilan }),
    current === 'relances' && h(RelancesSuivi, { showToast })
  );
}

function AnomaliesParCategorie({ showToast, onOpenBilan }) {
  const categories = anomaliesParCategorie();
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);
  const pagination = usePagination(selectedCat ? selectedCat.items : [], 5);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'card' },
      h('div', { className: 'card-title' }, 'Priorités par catégories — synthèse des anomalies à traiter par type'),
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Catégorie', 'Anomalies', 'Dossiers concernés', 'Priorité', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            categories.map(c => h('tr', { key: c.code, className: cx('clickable', selectedCat && selectedCat.code === c.code && 'row-selected'), onClick: () => { setSelectedCat(c); setSelectedAnomalie(null); } },
              h('td', { className: 'table-name' }, c.label),
              h('td', null, c.anomalies),
              h('td', null, c.dossiers, ' dossiers'),
              h('td', null, h(PriorityBadge, { priorite: c.priorite })),
              h('td', { className: 'td-action' }, h('button', { className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail' }, '→'))
            ))
          )
        )
      ),
      selectedCat ? h('div', { style: { marginTop: 18 } },
        h('div', { className: 'card-title' }, `Dossiers concernés — ${selectedCat.label}`),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Collaborateur', 'Dernière action'].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              pagination.pageItems.map(a => h('tr', { key: a.id, className: cx('clickable', selectedAnomalie && selectedAnomalie.id === a.id && 'row-selected'), onClick: () => setSelectedAnomalie(a) },
                h('td', { className: 'table-name' }, client(a.dossier).nom),
                h('td', null, collaborateur(a.collaborateur).nom),
                h('td', null, a.dernierAction)
              ))
            )
          )
        ),
        h(Pagination, { pagination })
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenBilan }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCat ? 'Sélectionnez un dossier pour voir le détail' : 'Sélectionnez une catégorie pour voir les dossiers concernés' }))
    )
  );
}

function AnomaliesParCollaborateur({ showToast, onOpenBilan }) {
  const collaborateurs = anomaliesParCollaborateurList();
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'card' },
      h('div', { className: 'card-title' }, 'Anomalies par collaborateur'),
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Collaborateur', 'Anomalies', 'Dossiers concernés', 'Priorité moyenne', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            collaborateurs.map(c => h('tr', { key: c.id, className: cx('clickable', selectedCollab && selectedCollab.id === c.id && 'row-selected'), onClick: () => { setSelectedCollab(c); setSelectedAnomalie(null); } },
              h('td', { className: 'table-name' }, c.nom),
              h('td', null, c.anomalies),
              h('td', null, c.dossiers, ' dossier', c.dossiers > 1 ? 's' : ''),
              h('td', null, h(PriorityBadge, { priorite: c.prioriteMoyenne })),
              h('td', { className: 'td-action' }, h('button', { className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail' }, '→'))
            ))
          )
        )
      ),
      selectedCollab ? h('div', { style: { marginTop: 18 } },
        h('div', { className: 'card-title' }, `Anomalies de ${selectedCollab.nom}`),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', "Type d'anomalie", 'Priorité', 'Dernière action'].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              selectedCollab.items.map(a => h('tr', { key: a.id, className: cx('clickable', selectedAnomalie && selectedAnomalie.id === a.id && 'row-selected'), onClick: () => setSelectedAnomalie(a) },
                h('td', { className: 'table-name' }, client(a.dossier).nom),
                h('td', null, a.titre),
                h('td', null, h(PriorityBadge, { priorite: a.priorite })),
                h('td', null, a.dernierAction)
              ))
            )
          )
        )
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenBilan }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCollab ? 'Sélectionnez une anomalie pour voir le détail' : 'Sélectionnez un collaborateur pour voir ses anomalies' }))
    )
  );
}

function AnomaliesParDossier({ showToast, onOpenBilan }) {
  const dossiers = anomaliesParDossierList();
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'card' },
      h('div', { className: 'card-title' }, 'Anomalies par dossier — dossiers pour lesquels votre intervention est requise'),
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Dossier', 'Anomalies', 'Priorité', 'Collaborateur', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            dossiers.map(d => h('tr', { key: d.dossier.id, className: cx('clickable', selectedDossier && selectedDossier.dossier.id === d.dossier.id && 'row-selected'), onClick: () => { setSelectedDossier(d); setSelectedAnomalie(null); } },
              h('td', { className: 'table-name' }, d.dossier.nom),
              h('td', null, d.anomalies),
              h('td', null, h(PriorityBadge, { priorite: d.priorite })),
              h('td', null, d.collaborateur.nom),
              h('td', { className: 'td-action' }, h('button', { className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail' }, '→'))
            ))
          )
        )
      ),
      selectedDossier ? h('div', { style: { marginTop: 18 } },
        h('div', { className: 'card-title' }, `Anomalies du dossier ${selectedDossier.dossier.nom}`),
        selectedDossier.items.map(a => h('div', { key: a.id, className: 'list-row', style: { cursor: 'pointer' }, onClick: () => setSelectedAnomalie(a) },
          h('span', { className: 'list-row-label' }, h(Dot, { color: PRIORITE_COULEURS[a.priorite] }), a.titre),
          h('span', null, h(PriorityBadge, { priorite: a.priorite }), ' →')
        ))
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenBilan }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedDossier ? "Sélectionnez une anomalie pour voir le détail" : 'Sélectionnez un dossier pour voir ses anomalies' }))
    )
  );
}

function AnomalieDetailCard({ anomalie, showToast, onOpenBilan }) {
  const c = client(anomalie.dossier);
  const collab = collaborateur(anomalie.collaborateur);
  const isSupervision = anomalie.categorie === 'supervision_manquante';
  const bilanExistant = isSupervision ? BILAN_DOSSIERS.find(b => b.dossier === anomalie.dossier) : null;
  return h('div', { className: 'card' },
    h('div', { className: 'detail-panel-header' }, h('span', { className: 'card-title', style: { margin: 0 } }, 'Détail de l’anomalie'), h(PriorityBadge, { priorite: anomalie.priorite })),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, anomalie.titre)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dossier'), h('div', { className: 'detail-field-value' }, c.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Description'), h('div', { className: 'detail-field-value' }, anomalie.description)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date détectée'), h('div', { className: 'detail-field-value' }, formatDate(anomalie.dateDetection))),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Collaborateur en charge'), h('div', { className: 'detail-field-value' }, collab.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dernière action'), h('div', { className: 'detail-field-value' }, anomalie.dernierAction)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Commentaire'), h('div', { className: 'detail-field-value' }, anomalie.commentaire)),
    bilanExistant ? h('div', { className: 'info-box', style: { marginBottom: 10 } }, 'ℹ️ ', 'La note de synthèse a déjà été transmise par le collaborateur — elle est en attente de votre validation.') : null,
    bilanExistant
      ? h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 6 }, onClick: () => onOpenBilan && onOpenBilan(anomalie.dossier) }, 'Accéder à la note et régulariser →')
      : h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 6 }, onClick: () => showToast('Demande de régularisation envoyée au collaborateur (démonstration)') }, 'Demander au collaborateur de régulariser 📨')
  );
}

function RelancesSuivi({ showToast }) {
  const allRelances = relancesList();
  const [selected, setSelected] = useState(null);
  const [statutFilter, setStatutFilter] = useState('tous');
  const [collabFilter, setCollabFilter] = useState('tous');
  const [sortOrder, setSortOrder] = useState('recent');
  const aFaire = allRelances.filter(r => r.statut === 'a_faire').length;
  const enAttente = allRelances.filter(r => r.statut === 'en_cours' || r.statut === 'en_retard').length;

  const relances = allRelances
    .filter(r => statutFilter === 'tous' || r.statut === statutFilter)
    .filter(r => collabFilter === 'tous' || r.collaborateur === collabFilter)
    .sort((a, b) => sortOrder === 'recent'
      ? new Date(b.dateDemandeEC) - new Date(a.dateDemandeEC)
      : new Date(a.dateDemandeEC) - new Date(b.dateDemandeEC));
  const pagination = usePagination(relances, 5);

  return h('div', null,
    h('div', { className: 'counter-row' },
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '📧'), h('div', null, h('div', { className: 'counter-value' }, allRelances.length), h('div', { className: 'counter-label' }, 'Demandes de régularisation envoyées'))),
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '⏰'), h('div', null, h('div', { className: 'counter-value' }, aFaire), h('div', { className: 'counter-label' }, 'Demandes à faire'))),
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '🔄'), h('div', null, h('div', { className: 'counter-value' }, enAttente), h('div', { className: 'counter-label' }, 'Faites, non régularisées')))
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, 'Suivi des demandes de régularisation adressées aux collaborateurs'),
        h('div', { className: 'filter-row' },
          h('select', { className: 'pill-select', value: statutFilter, onChange: e => setStatutFilter(e.target.value) },
            h('option', { value: 'tous' }, 'Tous les statuts'),
            Object.keys(STATUT_LABELS).map(k => h('option', { key: k, value: k }, STATUT_LABELS[k].label))
          ),
          h('select', { className: 'pill-select', value: collabFilter, onChange: e => setCollabFilter(e.target.value) },
            h('option', { value: 'tous' }, 'Tous les collaborateurs'),
            COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
          ),
          h('select', { className: 'pill-select', value: sortOrder, onChange: e => setSortOrder(e.target.value) },
            h('option', { value: 'recent' }, 'Plus récent d’abord'),
            h('option', { value: 'ancien' }, 'Plus ancien d’abord')
          )
        ),
        relances.length === 0
          ? h(EmptyDetail, { icon: '📭', label: 'Aucune relance ne correspond à ces filtres' })
          : h(React.Fragment, null,
            h('div', { className: 'table-wrap' },
              h('table', { className: 'data-table' },
                h('thead', null, h('tr', null, ['Dossier', 'Anomalie', 'Collaborateur', 'Date demande EC', 'Statut régularisation', ''].map(c => h('th', { key: c }, c)))),
                h('tbody', null,
                  pagination.pageItems.map(r => h('tr', { key: r.id, className: cx('clickable', selected && selected.id === r.id && 'row-selected'), onClick: () => setSelected(r) },
                    h('td', { className: 'table-name' }, r.dossierInfo.nom),
                    h('td', null, r.titre),
                    h('td', null, r.collaborateurInfo.nom),
                    h('td', null, formatDate(r.dateDemandeEC)),
                    h('td', null, h(StatutBadge, { statut: r.statut })),
                    h('td', null, h(DropdownMenu, { items: [
                      { label: '📨 Relancer le collaborateur', onClick: () => showToast('Relance envoyée (démonstration)') },
                      { label: '✅ Marquer comme terminé', onClick: () => showToast('Statut mis à jour (démonstration)') },
                    ] }))
                  ))
                )
              )
            ),
            h(Pagination, { pagination })
          )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h('div', { className: 'card' },
          h('div', { className: 'card-title' }, 'Détail de la relance'),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, selected.titre)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Collaborateur'), h('div', { className: 'detail-field-value' }, selected.collaborateurInfo.nom)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date demande EC'), h('div', { className: 'detail-field-value' }, formatDate(selected.dateDemandeEC))),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Statut'), h(StatutBadge, { statut: selected.statut })),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dernière analyse du Drive'), h('div', { className: 'detail-field-value' }, formatDate(selected.dateDetection))),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Commentaire'), h('div', { className: 'detail-field-value' }, `Demande de régularisation transmise au collaborateur après détection de l'anomalie dans le Drive. ${selected.commentaire}`)),
          h('button', { className: 'btn btn-primary btn-block', onClick: () => showToast('Relance envoyée au collaborateur (démonstration)') }, 'Relancer le collaborateur 📨')
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez une relance pour voir le détail' }))
      )
    )
  );
}

// ============================================================ 4. Mon équipe

function ECEquipe({ showToast }) {
  const [profiles, setProfiles] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    const { data, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) setLoadError(error.message); else { setLoadError(null); setProfiles(data); }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Mon équipe'), h('p', { className: 'subtitle' }, 'Comptes et accès des collaborateurs du cabinet')),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, '+ Ajouter un collaborateur')
      )
    ),
    showForm ? h(InviteCollaborateurForm, {
      onClose: () => setShowForm(false),
      onInvited: () => { setShowForm(false); reload(); },
      showToast,
    }) : null,
    h('div', { className: 'card' },
      loadError ? h('div', { className: 'auth-error' }, loadError) :
      !profiles ? h('div', { className: 'form-help' }, 'Chargement…') :
        profiles.length === 0 ? h(EmptyDetail, { icon: '👥', label: 'Aucun collaborateur pour le moment' }) :
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Nom', 'Rôle', 'E-mail', 'Téléphone', 'Depuis'].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              profiles.map(p => h('tr', { key: p.id },
                h('td', { className: 'table-name' }, `${p.prenom} ${p.nom}`),
                h('td', null, p.role === 'expert_comptable' ? 'Expert-comptable' : 'Collaborateur'),
                h('td', null, p.email),
                h('td', null, p.telephone || '—'),
                h('td', null, formatDate(p.created_at.slice(0, 10)))
              ))
            )
          )
        )
    )
  );
}

function InviteCollaborateurForm({ onClose, onInvited, showToast }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const { data, error: invokeError } = await supabaseClient.functions.invoke('invite-collaborateur', {
        body: { prenom, nom, email, telephone: telephone || null },
      });
      if (invokeError) {
        let message = "Échec de l'invitation.";
        try { message = (await invokeError.context.json()).error || message; } catch {}
        throw new Error(message);
      }
      showToast(`Invitation envoyée à ${email}`);
      onInvited();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return h('div', { className: 'card', style: { marginBottom: 18 } },
    h('div', { className: 'card-title' }, 'Inviter un collaborateur'),
    h('form', { className: 'auth-form', onSubmit: submit },
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'Prénom', h('input', { required: true, value: prenom, onChange: e => setPrenom(e.target.value), autoFocus: true })),
        h('label', { className: 'auth-field' }, 'Nom', h('input', { required: true, value: nom, onChange: e => setNom(e.target.value) }))
      ),
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'E-mail', h('input', { type: 'email', required: true, value: email, onChange: e => setEmail(e.target.value) })),
        h('label', { className: 'auth-field' }, 'Téléphone (optionnel)', h('input', { type: 'tel', value: telephone, onChange: e => setTelephone(e.target.value) }))
      ),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
        h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Annuler'),
        h('button', { type: 'submit', className: 'btn btn-primary', disabled: loading }, loading ? 'Envoi…' : "Envoyer l'invitation")
      )
    )
  );
}

// ============================================================ 5. Conformité cabinet

function ECConformite({ showToast, cabinetSettings }) {
  const cc = CONFORMITE_CABINET;
  const [selectedDependance, setSelectedDependance] = useState(null);
  const [showCartographie, setShowCartographie] = useState(false);
  const [view, setView] = useState(null); // 'formations' | 'declarations' | 'diffusion' | null

  if (selectedDependance) {
    return h(DependanceEconomiqueForm, { record: selectedDependance, onBack: () => setSelectedDependance(null), showToast, cabinetSettings: cabinetSettings || CABINET_SETTINGS_DEFAUT });
  }

  if (showCartographie) {
    return h(CartographieRisques, { onBack: () => setShowCartographie(false), showToast, cabinetNom: (cabinetSettings || CABINET_SETTINGS_DEFAUT).nom });
  }

  if (view === 'formations') return h('div', { className: 'page' }, h(FormationsLBCFTManager, { onBack: () => setView(null), showToast }));
  if (view === 'declarations') return h('div', { className: 'page' }, h(DeclarationIndependanceManager, { onBack: () => setView(null), showToast }));
  if (view === 'diffusion') return h('div', { className: 'page' }, h(DiffusionProceduresManager, { onBack: () => setView(null), showToast }));
  if (view === 'manuel') return h('div', { className: 'page' }, h(ManuelProceduresManager, { onBack: () => setView(null), showToast }));

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Conformité cabinet'), h('p', { className: 'subtitle' }, 'Suivi des obligations réglementaires et déontologiques du cabinet'))
    ),
    h('div', { className: 'grid-2' },
      h(Card, { title: cc.manuelProcedures.label, icon: '📘', iconBg: '#E7F7ED', iconColor: '#16A34A' },
        h(Badge, { color: 'vert' }, '● ', cc.manuelProcedures.statut),
        h('p', { style: { marginTop: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 } }, cc.manuelProcedures.detail),
        h('div', { className: 'form-help' }, 'Dernière mise à jour : ', formatDate(cc.manuelProcedures.derniereMaj)),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => setView('manuel') }, 'Gérer le manuel →')
      ),
      h(Card, { title: cc.diffusionProcedures.label, icon: '📤', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.diffusionProcedures.accusesManquants.length, ' accusés manquants'),
        cc.diffusionProcedures.accusesManquants.map((a, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(a.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Envoyé le ', formatDate(a.dateEnvoi))
        )),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => setView('diffusion') }, 'Gérer la diffusion →')
      ),
      h(Card, { title: cc.formationsLBCFT.label, icon: '🎓', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.formationsLBCFT.nonAJour.length, ' collaborateurs non à jour'),
        cc.formationsLBCFT.nonAJour.map((f, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(f.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Dernière formation : ', formatDate(f.derniereFormation))
        )),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => setView('formations') }, 'Gérer le programme →')
      ),
      h(Card, { title: cc.declarationsIndependance.label, icon: '📜', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.declarationsIndependance.manquantes.length, ' manquantes'),
        cc.declarationsIndependance.manquantes.map((d, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(d.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Exercice ', d.exercice)
        )),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => setView('declarations') }, 'Gérer les déclarations →')
      ),
      h(Card, { title: cc.dependanceEconomique.label, icon: '⚖️', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.dependanceEconomique.dossiersASurveiller.length, ' dossiers à surveiller'),
        cc.dependanceEconomique.dossiersASurveiller.map((d, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, client(d.dossier).nom),
          h('span', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, d.partHonoraires, '% (seuil ', d.seuil, '%)'),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setSelectedDependance(d) }, 'Générer le rapport')
          )
        )),
        h('div', { className: 'form-help', style: { marginTop: 10 } }, 'Un dossier Word détaillant les mesures d’indépendance est généré par dossier concerné.')
      ),
      h(Card, { title: cc.classificationRisquesLBCFT.label, icon: '🧭', iconBg: '#FDECEC', iconColor: '#DC2626' },
        h(Badge, { color: 'rouge' }, cc.classificationRisquesLBCFT.statut),
        h('p', { style: { marginTop: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 } }, cc.classificationRisquesLBCFT.detail),
        h('div', { className: 'form-help' }, 'Dernière révision : ', formatDate(cc.classificationRisquesLBCFT.derniereRevision)),
        h('button', { className: 'btn btn-primary btn-sm', style: { marginTop: 10 }, onClick: () => setShowCartographie(true) }, 'Lancer la révision →')
      )
    )
  );
}

function FormationsLBCFTManager({ onBack, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const programme = FORMATIONS_PROGRAMMES.find(p => p.annee === currentCalendarYear());

  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Formations LBC-FT'), h('p', { className: 'subtitle' }, `Programme ${currentCalendarYear()} et suivi des attestations`)),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, '+ Ajouter une session')
      )
    ),
    showForm ? h(NouvelleSessionFormationForm, { onClose: () => setShowForm(false), showToast }) : null,
    !programme ? h('div', { className: 'card' }, h(EmptyDetail, { icon: '🎓', label: `Aucun programme créé pour ${currentCalendarYear()}` })) :
      programme.sessions.map(s => h('div', { className: 'card', style: { marginBottom: 16 }, key: s.id },
        h('div', { className: 'card-title' }, s.titre),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date'), h('span', { className: 'v' }, formatDate(s.date))),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Organisme'), h('span', { className: 'v' }, s.formateur)),
        h('div', { className: 'table-wrap', style: { marginTop: 14 } },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Collaborateur', 'Attestation', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null, s.participants.map(pid => {
              const att = s.attestations[pid] || { recue: false };
              return h('tr', { key: pid },
                h('td', { className: 'table-name' }, collaborateur(pid).nom),
                h('td', null, att.recue ? h(Badge, { color: 'vert' }, '● Reçue le ', formatDate(att.dateUpload)) : h(Badge, { color: 'orange' }, '● En attente')),
                h('td', null, att.recue ? null : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast(`Rappel envoyé à ${collaborateur(pid).nom}`) }, '📨 Relancer'))
              );
            }))
          )
        )
      ))
  );
}

function NouvelleSessionFormationForm({ onClose, showToast }) {
  const [titre, setTitre] = useState('');
  const [date, setDate] = useState('');
  const [formateur, setFormateur] = useState('');
  const [participants, setParticipants] = useState(() => Object.fromEntries(COLLABORATEURS.map(c => [c.id, true])));

  function submit(e) {
    e.preventDefault();
    showToast(`Session « ${titre} » créée — un dossier Formations/${currentCalendarYear()} a été préparé dans le Drive (démonstration).`);
    onClose();
  }

  return h('div', { className: 'card', style: { marginBottom: 18 } },
    h('div', { className: 'card-title' }, 'Nouvelle session de formation'),
    h('form', { className: 'auth-form', onSubmit: submit },
      h('label', { className: 'auth-field' }, 'Intitulé', h('input', { required: true, value: titre, onChange: e => setTitre(e.target.value), autoFocus: true })),
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'Date', h('input', { type: 'date', required: true, value: date, onChange: e => setDate(e.target.value) })),
        h('label', { className: 'auth-field' }, 'Organisme de formation', h('input', { required: true, value: formateur, onChange: e => setFormateur(e.target.value) }))
      ),
      h('div', { className: 'auth-field' },
        'Collaborateurs concernés',
        h('div', { className: 'checkbox-grid' }, COLLABORATEURS.map(c => h('label', { className: 'checkbox-row', key: c.id },
          h('input', { type: 'checkbox', checked: !!participants[c.id], onChange: () => setParticipants(p => ({ ...p, [c.id]: !p[c.id] })) }), c.nom
        )))
      ),
      h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
        h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Annuler'),
        h('button', { type: 'submit', className: 'btn btn-primary' }, 'Créer la session')
      )
    )
  );
}

function DeclarationIndependanceManager({ onBack, showToast }) {
  const rows = declarationsIndependanceAnnee(currentCalendarYear());
  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Déclarations d’indépendance'), h('p', { className: 'subtitle' }, `Exercice ${currentCalendarYear()}`)),
      h('div', { className: 'page-header-actions' }, h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'))
    ),
    h('div', { className: 'card' },
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Collaborateur', 'Statut', 'Date de signature', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null, rows.map(d => h('tr', { key: d.collaborateur },
            h('td', { className: 'table-name' }, collaborateur(d.collaborateur).nom),
            h('td', null, d.statut === 'signee' ? h(Badge, { color: 'vert' }, '● Signée') : h(Badge, { color: 'orange' }, '● En attente')),
            h('td', null, d.statut === 'signee' ? formatDate(d.dateSignature) : '—'),
            h('td', null, d.statut === 'signee' ? null : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast(`Rappel envoyé à ${collaborateur(d.collaborateur).nom}`) }, '📨 Relancer'))
          )))
        )
      )
    )
  );
}

function DiffusionProceduresManager({ onBack, showToast }) {
  const [selected, setSelected] = useState(PROCEDURES_VERSIONS[0]);
  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Diffusion des procédures'), h('p', { className: 'subtitle' }, 'Historique des versions et accusés de lecture signés')),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: () => showToast('Nouvelle version diffusée à tous les collaborateurs (démonstration)') }, '📤 Diffuser une nouvelle version')
      )
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, 'Versions diffusées'),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Version', 'Diffusée le', 'Accusés signés', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null, PROCEDURES_VERSIONS.map(v => {
              const total = Object.keys(v.accuses).length;
              const signes = Object.values(v.accuses).filter(a => a.signe).length;
              return h('tr', { key: v.id, className: cx('clickable', selected && selected.id === v.id && 'row-selected'), onClick: () => setSelected(v) },
                h('td', { className: 'table-name' }, v.version),
                h('td', null, formatDate(v.dateDiffusion)),
                h('td', null, h(Badge, { color: signes === total ? 'vert' : 'orange' }, signes, '/', total))
              );
            }))
          )
        )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h('div', { className: 'card' },
          h('div', { className: 'card-title' }, `Détail — ${selected.version}`),
          h('p', { style: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 } }, selected.resume),
          Object.entries(selected.accuses).map(([id, a]) => h('div', { className: 'list-row', key: id },
            h('span', { className: 'list-row-label' }, collaborateur(id).nom),
            a.signe ? h(Badge, { color: 'vert' }, '● Signé le ', formatDate(a.dateSignature)) :
              h('span', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                h(Badge, { color: 'orange' }, '● En attente'),
                h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast(`Rappel envoyé à ${collaborateur(id).nom}`) }, 'Relancer')
              )
          ))
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez une version' }))
      )
    )
  );
}

const MANUEL_STATUT_COULEUR = { a_jour: 'vert', a_reviser: 'orange', manquant: 'rouge' };
const MANUEL_STATUT_LABEL = { a_jour: 'À jour', a_reviser: 'À réviser', manquant: 'Chapitre manquant' };

function ManuelProceduresManager({ onBack, showToast }) {
  const [chapitres, setChapitres] = useState(PROCEDURES_MANUEL_CHAPITRES);
  const [selected, setSelected] = useState(chapitres[0]);
  const [verifying, setVerifying] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  function selectChapitre(c) {
    setSelected(c);
    setSuggestions(null);
  }

  function verifierAvecIA() {
    setVerifying(true);
    setSuggestions(null);
    setTimeout(() => {
      setSuggestions(IA_VERIFICATION_MANUEL_DEMO[selected.id] || []);
      setVerifying(false);
    }, 1200);
  }

  function marquerAJour() {
    const today = new Date().toISOString().slice(0, 10);
    setChapitres(prev => prev.map(c => c.id === selected.id ? { ...c, statut: 'a_jour', derniereMaj: today } : c));
    setSelected(prev => ({ ...prev, statut: 'a_jour', derniereMaj: today }));
    showToast('Chapitre marqué à jour (démonstration)');
  }

  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Manuel de procédures'), h('p', { className: 'subtitle' }, 'Plan-type du manuel — statut de chaque chapitre et aide à la relecture')),
      h('div', { className: 'page-header-actions' }, h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'))
    ),
    h('div', { className: 'info-box', style: { marginBottom: 16 } },
      'ℹ️ ',
      "Le contenu réglementaire détaillé de chaque chapitre reste à définir avec le cabinet — cette page suit uniquement la structure et le statut de relecture. La vérification par IA propose des points de contrôle génériques (démonstration), à confirmer par l'expert-comptable."
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, 'Chapitres du manuel'),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Chapitre', 'Statut', 'Dernière mise à jour'].map(c => h('th', { key: c }, c)))),
            h('tbody', null, chapitres.map(c => h('tr', { key: c.id, className: cx('clickable', selected && selected.id === c.id && 'row-selected'), onClick: () => selectChapitre(c) },
              h('td', { className: 'table-name' }, c.titre),
              h('td', null, h(Badge, { color: MANUEL_STATUT_COULEUR[c.statut] }, '● ', MANUEL_STATUT_LABEL[c.statut])),
              h('td', null, c.derniereMaj ? formatDate(c.derniereMaj) : '—')
            )))
          )
        )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h('div', { className: 'card' },
          h('div', { className: 'card-title' }, selected.titre),
          h(Badge, { color: MANUEL_STATUT_COULEUR[selected.statut] }, '● ', MANUEL_STATUT_LABEL[selected.statut]),
          h('div', { className: 'form-help', style: { marginTop: 10 } }, 'Dernière mise à jour : ', selected.derniereMaj ? formatDate(selected.derniereMaj) : 'jamais rédigé'),
          h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 } },
            h('button', { className: 'btn btn-secondary btn-sm', disabled: verifying, onClick: verifierAvecIA }, verifying ? 'Analyse en cours…' : '🤖 Vérifier avec l’IA'),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Édition du chapitre (démonstration)') }, '✏️ Éditer le chapitre'),
            selected.statut !== 'a_jour' ? h('button', { className: 'btn btn-primary btn-sm', onClick: marquerAJour }, '✓ Marquer à jour') : null
          ),
          suggestions ? h('div', { style: { marginTop: 14 } },
            h('div', { className: 'form-help', style: { marginBottom: 8 } }, 'Points à vérifier suggérés (démonstration) :'),
            suggestions.length > 0 ? suggestions.map((s, i) => h('div', { className: 'list-row', key: i }, h('span', { className: 'list-row-label' }, '• ', s))) :
              h('div', { className: 'form-help' }, 'Aucune suggestion disponible pour ce chapitre.')
          ) : null
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez un chapitre' }))
      )
    )
  );
}

const CARTO_PARAGRAPHE_STYLE = { fontSize: 13.3, color: 'var(--text)', lineHeight: 1.7, margin: '0 0 10px' };

function CartographieRisques({ onBack, showToast, cabinetNom }) {
  const stats = cartographieStats();
  const pct = n => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const motiveesNormale = stats.analyseMotivee.filter(d => d.niveauRetenu === 'Normale');
  cabinetNom = cabinetNom || CABINET_SETTINGS_DEFAUT.nom;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Cartographie des risques'), h('p', { className: 'subtitle' }, `Classification des risques LBC-FT du cabinet — arrêtée au ${formatDate(stats.dateArrete)}`)),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: () => showToast('Cartographie exportée au format PDF (démonstration)') }, '⬇ Exporter en PDF')
      )
    ),

    h('div', { className: 'fiche-vigilance' },
      h('div', { className: 'doc-runhead' },
        h('span', null, 'Cartographie des risques LBC-FT'),
        h('span', null, `${cabinetNom} · ${formatDate(stats.dateArrete)}`)
      ),

      h('div', { className: 'fiche-vigilance-header' },
        h('div', null,
          h('div', { className: 'fiche-vigilance-eyebrow' }, 'Lutte anti-blanchiment · LBC-FT'),
          h('div', { className: 'fiche-vigilance-title' }, 'Cartographie des risques')
        ),
        h('div', { className: 'fiche-vigilance-date' }, h('div', { className: 'k doc-mono' }, "Date d'arrêté des données"), h('div', { className: 'v' }, formatDate(stats.dateArrete)))
      ),

      h(DocSection, { n: '1', title: 'Vue d’ensemble du portefeuille', dark: true },
        h('div', { className: 'doc-stat-block' },
          h('div', { className: 'doc-stat-hero' },
            h('div', { className: 'k' }, 'Dossiers analysés'),
            h('div', { className: 'v' }, stats.total)
          ),
          h('div', { className: 'doc-stat-mini-grid' },
            h('div', { className: 'doc-stat-mini tone-green' }, h('div', { className: 'k' }, 'Vigilance allégée'), h('div', { className: 'v' }, stats.allegee.length, ' ', h('span', { className: 'pct' }, `(${pct(stats.allegee.length)} %)`))),
            h('div', { className: 'doc-stat-mini tone-gold' }, h('div', { className: 'k' }, 'Vigilance normale'), h('div', { className: 'v' }, stats.normale.length, ' ', h('span', { className: 'pct' }, `(${pct(stats.normale.length)} %)`))),
            h('div', { className: 'doc-stat-mini tone-red' }, h('div', { className: 'k' }, 'Vigilance renforcée'), h('div', { className: 'v' }, stats.renforcee.length, ' ', h('span', { className: 'pct' }, `(${pct(stats.renforcee.length)} %)`))),
            h('div', { className: 'field-tile', style: { textAlign: 'center' } }, h('div', { className: 'ft-label doc-mono' }, 'Non encore analysés'), h('div', { className: 'ft-value', style: { fontSize: 20 } }, stats.nonAnalyses.length))
          )
        ),
        h('div', { className: 'doc-stat-row3' },
          h('div', { className: 'field-tile', style: { textAlign: 'center' } }, h('div', { className: 'ft-label doc-mono' }, 'Date d’arrêté des données'), h('div', { className: 'ft-value' }, formatDate(stats.dateArrete))),
          h('div', { className: 'field-tile', style: { textAlign: 'center' } }, h('div', { className: 'ft-label doc-mono' }, 'Date d’édition'), h('div', { className: 'ft-value' }, formatDate(stats.dateArrete))),
          h('div', { className: 'field-tile', style: { textAlign: 'center' } }, h('div', { className: 'ft-label doc-mono' }, 'Dossiers en analyse motivée'), h('div', { className: 'ft-value' }, `${stats.analyseMotivee.length} (${motiveesNormale.length} normale + ${stats.renforcee.length} renforcée)`))
        ),
        h('p', { style: { ...CARTO_PARAGRAPHE_STYLE, marginTop: 18 } }, "La présente cartographie constitue la classification des risques de blanchiment de capitaux et de financement du terrorisme du cabinet, établie en application des articles L. 561-4-1 et suivants du code monétaire et financier. Le risque de chaque dossier est apprécié selon quatre critères — Caractéristiques du client, Activité du client, Localisation du client et Missions proposées — chacun coté Faible, Moyen ou Élevé."),
        h('p', { style: { ...CARTO_PARAGRAPHE_STYLE, margin: 0 } }, `Aucun dossier n'est placé en vigilance allégée : le cabinet a fait le choix de ne pas y recourir en l'absence de décision expresse et documentée du référent LBC-FT. Sur ${stats.total} dossiers analysés, ${stats.analyseMotivee.length} ont fait l'objet d'une analyse motivée au titre d'au moins un facteur de risque identifié.`)
      ),

      stats.nonAnalyses.length > 0 ? h(Card, { title: 'Dossiers en attente d’analyse' },
        stats.nonAnalyses.map(d => h('div', { className: 'list-row', key: d.dossier },
          h('span', { className: 'list-row-label' }, client(d.dossier).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, collaborateur(client(d.dossier).collaborateur).nom)
        ))
      ) : null,

      h(DocSection, { n: '2', title: 'Dossiers faisant l’objet d’une analyse motivée', dark: true },
        h('p', { style: CARTO_PARAGRAPHE_STYLE }, "La présente section recense les dossiers pour lesquels au moins un facteur de risque a été identifié et a fait l'objet d'un examen documenté."),
        h('div', { className: 'doc-subheading', style: { marginTop: 18 } }, h('span', { className: 'bar' }), `A. Vigilance normale avec justification motivée — ${motiveesNormale.length} dossiers`),
        motiveesNormale.map(d => h('div', { key: d.dossier, style: { padding: '10px 0', borderBottom: '1px solid var(--doc-border)' } },
          h('b', { style: { fontSize: 13.3, color: 'var(--doc-navy)' } }, client(d.dossier).nom),
          h('p', { style: { margin: '4px 0 0', fontSize: 12.8, color: 'var(--text-muted)', lineHeight: 1.6 } }, d.justification)
        )),
        h('div', { className: 'doc-subheading accent-red', style: { marginTop: 22 } }, h('span', { className: 'bar' }), `B. Vigilance renforcée — ${stats.renforcee.length} dossiers`),
        stats.renforcee.map(d => h('div', { key: d.dossier, style: { padding: '10px 0', borderBottom: '1px solid var(--doc-border)' } },
          h('b', { style: { fontSize: 13.3, color: 'var(--doc-navy)' } }, client(d.dossier).nom),
          h('p', { style: { margin: '4px 0 0', fontSize: 12.8, color: 'var(--text-muted)', lineHeight: 1.6 } }, d.justification)
        ))
      ),

      h(DocSection, { n: '3', title: 'Contrôles et mesures d’atténuation en place', dark: true },
        [
          ['Formation', "Les collaborateurs du cabinet bénéficient d'une sensibilisation aux obligations de lutte contre le blanchiment de capitaux et le financement du terrorisme, adaptée à leur niveau de responsabilité."],
          ['Référent LBC-FT et responsabilités', `Le référent LBC-FT désigné au sein du cabinet est ${EXPERT_COMPTABLE.nom}, expert-comptable. Il est chargé de la supervision du dispositif de vigilance et constitue le point de contact interne pour toute question relative à la classification des dossiers.`],
          ['Remontée interne des soupçons et déclaration à TRACFIN', "Tout élément suscitant un doute fait l'objet d'une remontée interne auprès du référent LBC-FT, qui apprécie l'opportunité d'une déclaration de soupçon à TRACFIN."],
          ['Vigilance exercée dans la durée', "La vigilance ne se limite pas à l'entrée en relation : les dossiers en vigilance renforcée font l'objet d'un suivi rapproché et d'une réévaluation en cas d'évolution significative (changement d'actionnariat, d'activité ou événement inhabituel)."],
        ].map(([titre, texte], i) => h('div', { className: 'callout-row', key: i, style: { flexDirection: 'column', gap: 4 } },
          h('b', { style: { color: 'var(--doc-navy)' } }, titre),
          texte
        ))
      ),

      h(DocSection, { n: '4', title: 'Conclusion générale', dark: true },
        h('p', { style: { ...CARTO_PARAGRAPHE_STYLE, margin: 0 } }, `Au vu des éléments qui précèdent, le profil de risque LBC-FT du cabinet apparaît globalement maîtrisé au regard de la nature de sa clientèle et de son activité. Sur ${stats.total} dossiers analysés, ${stats.analyseMotivee.length} ont fait l'objet d'une analyse motivée : ${motiveesNormale.length} classés en vigilance normale et ${stats.renforcee.length} classés en vigilance renforcée.${stats.nonAnalyses.length ? ` ${stats.nonAnalyses.length} dossier(s) restent à analyser.` : ''}`)
      ),

      h(DocSection, { n: '5', title: 'Validation', dark: true },
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Expert-comptable et référent LBC-FT'), h('span', { className: 'v' }, EXPERT_COMPTABLE.nom)),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date'), h('span', { className: 'v' }, formatDate(stats.dateArrete)))
      ),

      h('div', { className: 'doc-runfoot' },
        h('span', null, `${cabinetNom} — Cartographie des risques LBC-FT`),
        h('span', null, `Cartographie arrêtée au ${formatDate(stats.dateArrete)}`)
      )
    )
  );
}

function DependanceEconomiqueForm({ record, onBack, showToast, cabinetSettings }) {
  const c = client(record.dossier);
  const [societe, setSociete] = useState(c.nom);
  const [partCA, setPartCA] = useState(record.partHonoraires);
  const [mesures, setMesures] = useState(record.mesures);
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;

  function generer() {
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    const logoHtml = settings.logoDataUrl ? `<img src="${settings.logoDataUrl}" style="height:36pt; margin-bottom:10pt;">` : '';
    const html = `
      ${logoHtml}
      <p style="font-size:11pt; font-weight:bold; margin:0;">${settings.nom}</p>
      <p style="font-size:9pt; color:#666; margin:0 0 22pt;">${settings.adresse}${settings.telephone ? ' — ' + settings.telephone : ''}</p>
      <h1 style="font-size:16pt; margin-bottom:2pt;">Note de dépendance économique</h1>
      <p style="font-size:9.5pt; color:#666; margin-top:0;">Établie le ${today}, conformément aux règles d'indépendance du code de déontologie des professionnels de l'expertise comptable (décret n° 2007-1387 du 27 septembre 2007).</p>
      <p><b>Dossier concerné :</b> ${societe}</p>
      <p><b>Part du chiffre d'affaires du cabinet :</b> ${partCA}%</p>
      <p><b>Seuil d'alerte fixé par le cabinet :</b> ${record.seuil}%</p>
      <h2 style="font-size:13pt;">Mesures prises par le cabinet pour garantir son indépendance</h2>
      <p>${mesures.replace(/\n/g, '<br>')}</p>
      <p style="margin-top:30pt;">Le ${today}</p>
      <p><b>${EXPERT_COMPTABLE.nom}</b><br>Expert-comptable, référent LBC-FT du cabinet</p>
      <p style="margin-top:24pt; color:#999; font-size:8pt;">Document généré par ComplyEC.</p>
    `;
    downloadWordDoc(`Note_dependance_economique_${societe.replace(/\s+/g, '_')}.doc`, 'Note de dépendance économique', html);
    showToast('Document Word généré et téléchargé.');
  }

  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour à la conformité'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Dépendance économique'), h('p', { className: 'subtitle' }, `Note pour le dossier ${societe}`))
    ),
    h(Card, { title: 'Informations du dossier' },
      h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, 'Nom de la société'),
        h('input', { className: 'form-input', value: societe, onChange: e => setSociete(e.target.value) })
      ),
      h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, "Part du chiffre d'affaires du cabinet"),
        h('div', { className: 'input-with-btn', style: { maxWidth: 160 } },
          h('input', { className: 'form-input', value: partCA, onChange: e => setPartCA(e.target.value) }),
          h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '%')
        ),
        h('div', { className: 'form-help' }, `Seuil d'alerte du cabinet : ${record.seuil}%`)
      ),
      h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, "Mesures prises par le cabinet pour garantir son indépendance"),
        h('textarea', { className: 'form-textarea', style: { minHeight: 130 }, value: mesures, onChange: e => setMesures(e.target.value) })
      ),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
        h('button', { className: 'btn btn-primary', onClick: generer }, '⬇ Générer le document Word')
      )
    )
  );
}

// ============================================================ Paramètres du cabinet

function ParametresCabinet({ showToast, settings, onSave }) {
  const [draft, setDraft] = useState(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  function handleLogoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft(prev => ({ ...prev, logoDataUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  function save() {
    onSave(draft);
    showToast('Paramètres du cabinet enregistrés (démonstration)');
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Paramètres du cabinet'), h('p', { className: 'subtitle' }, 'Identité, signature et connexions externes'))
    ),
    h('div', { className: 'grid-2' },
      h(Card, { title: 'Identité du cabinet', icon: '🏢', iconBg: '#E9F1FE', iconColor: '#2563EB' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Nom du cabinet'),
          h('input', { className: 'form-input', value: draft.nom, onChange: e => setDraft(prev => ({ ...prev, nom: e.target.value })) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Adresse'),
          h('input', { className: 'form-input', value: draft.adresse, onChange: e => setDraft(prev => ({ ...prev, adresse: e.target.value })) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Téléphone'),
          h('input', { className: 'form-input', value: draft.telephone, onChange: e => setDraft(prev => ({ ...prev, telephone: e.target.value })) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Logo du cabinet'),
          h('div', { style: { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' } },
            draft.logoDataUrl
              ? h('img', { src: draft.logoDataUrl, alt: 'Logo du cabinet', style: { height: 48, maxWidth: 160, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, padding: 4 } })
              : h('div', { style: { height: 48, width: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-faint)', fontSize: 12 } }, 'Aucun logo'),
            h('label', { className: 'btn btn-secondary btn-sm', style: { cursor: 'pointer', display: 'inline-flex' } },
              '📎 Choisir un fichier',
              h('input', { type: 'file', accept: 'image/png,image/jpeg,image/svg+xml', style: { display: 'none' }, onChange: handleLogoFile })
            )
          ),
          h('div', { className: 'form-help', style: { marginTop: 6 } }, 'Utilisé sur les lettres de mission, rapports et e-mails générés par le cabinet.')
        )
      ),
      h('div', null,
        h(Card, { title: 'Signature e-mail par défaut', icon: '✍️', iconBg: '#FEF3E1', iconColor: '#B45309' },
          h('div', { className: 'form-group' },
            h('textarea', { className: 'form-textarea', style: { minHeight: 130, fontFamily: 'inherit' }, value: draft.signature, onChange: e => setDraft(prev => ({ ...prev, signature: e.target.value })) })
          ),
          h('div', { className: 'form-help', style: { marginBottom: 6 } }, 'Aperçu'),
          h('div', { style: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 12.8, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 } },
            draft.logoDataUrl ? h('img', { src: draft.logoDataUrl, alt: '', style: { height: 28, marginBottom: 6, display: 'block' } }) : null,
            draft.signature
          )
        ),
        h(Card, { title: 'Connexions externes', icon: '🔗', iconBg: '#F1EAFE', iconColor: '#7C3AED', style: { marginTop: 18 } },
          h('div', { className: 'list-row' },
            h('span', { className: 'list-row-label' }, '📧 Outlook / Microsoft 365'),
            h(Badge, { color: 'gris' }, '○ Non connecté')
          ),
          h('div', { className: 'list-row' },
            h('span', { className: 'list-row-label' }, '📁 Google Drive'),
            h(Badge, { color: 'gris' }, '○ Non connecté')
          ),
          h('div', { className: 'form-help', style: { marginTop: 10 } },
            "La connexion à Outlook et à Google Drive nécessite une configuration côté administrateur (identifiants d'application, autorisations OAuth) qui n'est pas encore réalisée pour ce cabinet — ces intégrations seront activées lors du déploiement définitif."
          )
        )
      )
    ),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 18 } },
      h('button', { className: 'btn btn-primary', disabled: !dirty, onClick: save }, '💾 Enregistrer les paramètres')
    )
  );
}
