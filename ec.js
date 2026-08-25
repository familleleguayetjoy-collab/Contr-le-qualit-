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
      h('div', null, h('h1', null, 'Bonjour Martin Dupont 👋'), h('p', { className: 'subtitle' }, "Vue d'ensemble du cabinet")),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select' }, h('option', null, '📅 Période : Mai 2026')),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Rapport exporté (démonstration)') }, '⬇ Exporter le rapport')
      )
    ),
    h('div', { className: 'grid-2', style: { marginBottom: 18 } },
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
      )
    ),
    h('div', { className: 'grid-2' },
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
              h('td', null, h('button', { className: 'btn btn-secondary btn-sm' }, 'Voir le détail'))
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
              h('td', null, h('button', { className: 'btn btn-secondary btn-sm' }, 'Voir le détail'))
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
              h('td', null, h('button', { className: 'btn btn-secondary btn-sm' }, 'Voir le détail'))
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
      loadError ? h('div', { className: 'auth-error' }, loadError) : null,
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
      const { data: { session } } = await supabaseClient.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/invite-collaborateur`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ prenom, nom, email, telephone: telephone || null }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Échec de l'invitation.");
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

function ECConformite({ showToast }) {
  const cc = CONFORMITE_CABINET;
  const [selectedDependance, setSelectedDependance] = useState(null);

  if (selectedDependance) {
    return h(DependanceEconomiqueForm, { record: selectedDependance, onBack: () => setSelectedDependance(null), showToast });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Conformité cabinet'), h('p', { className: 'subtitle' }, 'Suivi des obligations réglementaires et déontologiques du cabinet'))
    ),
    h('div', { className: 'grid-2' },
      h(Card, { title: cc.manuelProcedures.label, icon: '📘', iconBg: '#E7F7ED', iconColor: '#16A34A' },
        h(Badge, { color: 'vert' }, '● ', cc.manuelProcedures.statut),
        h('p', { style: { marginTop: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 } }, cc.manuelProcedures.detail),
        h('div', { className: 'form-help' }, 'Dernière mise à jour : ', formatDate(cc.manuelProcedures.derniereMaj))
      ),
      h(Card, { title: cc.diffusionProcedures.label, icon: '📤', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.diffusionProcedures.accusesManquants.length, ' accusés manquants'),
        cc.diffusionProcedures.accusesManquants.map((a, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(a.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Envoyé le ', formatDate(a.dateEnvoi))
        )),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => showToast('Relance de diffusion envoyée (démonstration)') }, '📨 Relancer les collaborateurs')
      ),
      h(Card, { title: cc.formationsLBCFT.label, icon: '🎓', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.formationsLBCFT.nonAJour.length, ' collaborateurs non à jour'),
        cc.formationsLBCFT.nonAJour.map((f, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(f.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Dernière formation : ', formatDate(f.derniereFormation))
        )),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => showToast('Rappel de formation envoyé (démonstration)') }, '📨 Envoyer un rappel')
      ),
      h(Card, { title: cc.declarationsIndependance.label, icon: '📜', iconBg: '#FEF3E1', iconColor: '#B45309' },
        h(Badge, { color: 'orange' }, cc.declarationsIndependance.manquantes.length, ' manquantes'),
        cc.declarationsIndependance.manquantes.map((d, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(d.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Exercice ', d.exercice)
        )),
        h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 10 }, onClick: () => showToast('Demande de déclaration envoyée (démonstration)') }, '📨 Demander les déclarations')
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
        h('button', { className: 'btn btn-primary btn-sm', style: { marginTop: 10 }, onClick: () => showToast('Révision de la classification des risques lancée (démonstration)') }, 'Lancer la révision →')
      )
    )
  );
}

function DependanceEconomiqueForm({ record, onBack, showToast }) {
  const c = client(record.dossier);
  const [societe, setSociete] = useState(c.nom);
  const [partCA, setPartCA] = useState(record.partHonoraires);
  const [mesures, setMesures] = useState(record.mesures);

  function generer() {
    const html = `
      <h1 style="font-size:16pt;">Note de dépendance économique</h1>
      <p><b>Dossier :</b> ${societe}</p>
      <p><b>Part du chiffre d'affaires du cabinet :</b> ${partCA}%</p>
      <p><b>Seuil d'alerte du cabinet :</b> ${record.seuil}%</p>
      <h2 style="font-size:13pt;">Mesures prises par le cabinet pour garantir son indépendance</h2>
      <p>${mesures.replace(/\n/g, '<br>')}</p>
      <p style="margin-top:24pt; color:#666; font-size:9pt;">Document généré automatiquement par ComplyEC — démonstration.</p>
    `;
    downloadWordDoc(`Dependance_economique_${societe.replace(/\s+/g, '_')}.doc`, 'Note de dépendance économique', html);
    showToast('Document Word généré et téléchargé (démonstration)');
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
