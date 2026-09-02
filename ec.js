// ComplyEC — Écrans du module Expert-comptable
'use strict';

// ============================================================ 1. Vue d'ensemble

function ECOverview({ navigateEc, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const categories = anomaliesParCategorie();
  const collaborateurs = anomaliesParCollaborateurList();
  const dossiers = anomaliesParDossierList().slice(0, 5);
  const maxColabAnomalies = Math.max(...collaborateurs.map(c => c.anomalies), 1);

  const conformiteItems = [
    { key: 'formations', label: CONFORMITE_CABINET.formationsLBCFT.label, detail: `${CONFORMITE_CABINET.formationsLBCFT.nonAJour.length} collaborateurs non à jour`, color: 'orange' },
    { key: 'declarations', label: CONFORMITE_CABINET.declarationsIndependance.label, detail: `${CONFORMITE_CABINET.declarationsIndependance.manquantes.length} manquantes`, color: 'orange' },
    { key: 'dependance', label: CONFORMITE_CABINET.dependanceEconomique.label, detail: (n => `${n} ${pluriel(n, 'dossier')} à surveiller`)(dependanceASurveiller(settings.seuilDependance).length), color: 'orange' },
    { key: 'diffusion', label: CONFORMITE_CABINET.diffusionProcedures.label, detail: `${CONFORMITE_CABINET.diffusionProcedures.accusesManquants.length} accusés manquants`, color: 'orange' },
    { key: 'classification', label: CONFORMITE_CABINET.classificationRisquesLBCFT.label, detail: CONFORMITE_CABINET.classificationRisquesLBCFT.statut, color: 'rouge' },
  ];

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Bonjour Martin Dupont')),
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
          h('span', { className: 'bar-track' }, h('span', { className: 'bar-fill', style: { width: (c.anomalies / maxColabAnomalies * 100) + '%', '--bar-color': c.couleur } })),
          h('span', { className: 'bar-value' }, c.anomalies)
        ))
      ),
      h(Card, { title: '3. Dossiers nécessitant votre attention', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'dossier') }, 'Voir le détail →') },
        dossiers.map(d => h('div', { className: 'list-row', key: d.dossier.id },
          h('span', { className: 'list-row-label' }, h(Dot, { color: urgenceDossier(d.anomalies) }), d.dossier.nom),
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
  const [filtreCollab, setFiltreCollab] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState({ col: 'datePreparation', sens: 'desc' });

  function trierPar(col) {
    setTri(prev => (prev.col === col ? { col, sens: prev.sens === 'asc' ? 'desc' : 'asc' } : { col, sens: 'asc' }));
  }

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
  const dossiersExercice = BILAN_DOSSIERS
    .filter(b => b.exercice === exercice)
    .filter(b => filtreCollab === 'tous' || b.collaborateur === filtreCollab)
    .filter(b => {
      const q = recherche.trim().toLowerCase();
      return !q || client(b.dossier).nom.toLowerCase().includes(q);
    })
    .slice()
    .sort((a, b) => {
      const val = r => ({
        dossier: client(r.dossier).nom,
        collaborateur: collaborateur(r.collaborateur).nom,
        datePreparation: r.datePreparation,
        statut: r.statut,
      })[tri.col];
      const va = val(a), vb = val(b);
      const cmp = String(va).localeCompare(String(vb), 'fr', { numeric: true });
      return tri.sens === 'asc' ? cmp : -cmp;
    });

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Supervision annuelle'), h('p', { className: 'subtitle' }, 'Valider les notes de fin de mission préparées par votre équipe.')),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select', value: exercice, onChange: e => setExercice(Number(e.target.value)) },
          exerciceOptions.map(y => h('option', { key: y, value: y }, `Exercice : ${y}`))
        ),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Export généré (démonstration)') }, '⬇ Exporter')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, dossiersExercice.length),
        h('div', { className: 'stat-tile-label' }, 'notes prêtes à valider')
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, new Set(dossiersExercice.map(b => b.collaborateur)).size),
        h('div', { className: 'stat-tile-label' }, 'collaborateurs concernés')
      ),
      h('div', { className: 'stat-tile violet' },
        h('div', { className: 'stat-tile-value' }, exercice),
        h('div', { className: 'stat-tile-label' }, 'exercice supervisé')
      )
    ),
    h(Card, { title: `Notes de synthèse — exercice ${exercice}`, subtitle: 'Cliquez une ligne pour ouvrir la note et la valider.', icon: '📊', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu' },
      h('div', { className: 'filter-row' },
        h('input', {
          className: 'form-input', style: { maxWidth: 260 }, placeholder: 'Rechercher un dossier…',
          value: recherche, onChange: e => setRecherche(e.target.value),
        }),
        h('select', { className: 'form-select', style: { maxWidth: 220 }, value: filtreCollab, onChange: e => setFiltreCollab(e.target.value) },
          h('option', { value: 'tous' }, 'Tous les collaborateurs'),
          COLLABORATEURS.map(co => h('option', { key: co.id, value: co.id }, co.nom))
        ),
        (recherche || filtreCollab !== 'tous')
          ? h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { setRecherche(''); setFiltreCollab('tous'); } }, '✕ Réinitialiser')
          : null
      ),
      dossiersExercice.length === 0
        ? h(EmptyDetail, { icon: '📅', label: 'Aucun dossier ne correspond à ces filtres' })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null,
              [['dossier', 'Dossier'], ['exercice', 'Exercice'], ['collaborateur', 'Collaborateur'], ['datePreparation', 'Note préparée le'], ['statut', 'Statut'], [null, '']].map(([col, label]) =>
                h('th', {
                  key: label || 'action',
                  className: cx(col && 'th-sortable', tri.col === col && 'th-sorted'),
                  onClick: col ? () => trierPar(col) : undefined,
                }, label, col ? h('span', { className: 'th-arrow' }, tri.col === col ? (tri.sens === 'asc' ? '▲' : '▼') : '↕') : null)
              )
            )),
            h('tbody', null,
              dossiersExercice.map(b => h('tr', { key: b.id, className: 'clickable', onClick: () => setSelected(b) },
                h('td', { className: 'table-name' }, client(b.dossier).nom),
                h('td', null, b.exercice),
                h('td', null, collaborateur(b.collaborateur).nom),
                h('td', null, formatDate(b.datePreparation)),
                h('td', null, h(Badge, { color: 'vert' }, '● ', b.statut)),
                h('td', { className: 'td-action' }, h('button', { className: 'row-open-btn', 'aria-label': 'Ouvrir la note', title: 'Ouvrir la note', onClick: e => { e.stopPropagation(); setSelected(b); } }, '→'))
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
    h('div', { className: 'stack-col' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Priorités par catégories — synthèse des anomalies à traiter par type')),
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
        )
      ),
      selectedCat ? h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, `Dossiers concernés — ${selectedCat.label}`)),
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
    h('div', { className: 'stack-col' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Anomalies par collaborateur')),
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
        )
      ),
      selectedCollab ? h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, `Anomalies de ${selectedCollab.nom}`)),
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
    h('div', { className: 'stack-col' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Anomalies par dossier — dossiers pour lesquels votre intervention est requise')),
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
        )
      ),
      selectedDossier ? h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, `Anomalies du dossier ${selectedDossier.dossier.nom}`)),
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
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile bleu' }, h('div', { className: 'stat-tile-value' }, allRelances.length), h('div', { className: 'stat-tile-label' }, 'demandes envoyées')),
      h('div', { className: 'stat-tile orange' }, h('div', { className: 'stat-tile-value' }, aFaire), h('div', { className: 'stat-tile-label' }, 'demandes à faire')),
      h('div', { className: 'stat-tile rouge' }, h('div', { className: 'stat-tile-value' }, enAttente), h('div', { className: 'stat-tile-label' }, 'faites, non régularisées'))
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Suivi des demandes de régularisation adressées aux collaborateurs')),
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
          h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Détail de la relance')),
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

function ECEquipe({ showToast, onApercuCollab }) {
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
    showForm ? h(Modal, { title: 'Ajouter un collaborateur', onClose: () => setShowForm(false) },
      h(InviteCollaborateurForm, {
        onClose: () => setShowForm(false),
        onInvited: () => { setShowForm(false); reload(); },
        showToast,
      })
    ) : null,
    onApercuCollab ? h(Card, { title: 'Voir l’application comme un collaborateur', subtitle: 'Ouvre son espace en lecture — utile pour l’accompagner ou vérifier ce qu’il voit.', icon: '👁', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'bleu', style: { marginBottom: 18 } },
      h('div', { className: 'apercu-choix' },
        COLLABORATEURS.map(co => h('button', {
          key: co.id, className: 'apercu-btn', onClick: () => onApercuCollab(co.id),
        }, h('span', { className: 'avatar' }, co.initiales || initialesDe(...co.nom.split(' '))), co.nom))
      )
    ) : null,
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
                h('td', null, p.created_at ? formatDate(p.created_at.slice(0, 10)) : '—')
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
    h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Inviter un collaborateur')),
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
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  // Le seuil vient des paramètres du cabinet, jamais d'une valeur écrite en
  // dur : c'est le même chiffre que celui du manuel de procédures.
  const dependances = dependanceASurveiller(settings.seuilDependance);
  const cc = CONFORMITE_CABINET;
  const [selectedDependance, setSelectedDependance] = useState(null);
  const [view, setView] = useState(null); // 'declarations' | 'diffusion' | 'manuel' | null

  if (selectedDependance) {
    return h(DependanceEconomiqueForm, { record: selectedDependance, onBack: () => setSelectedDependance(null), showToast, cabinetSettings: settings });
  }

  if (view === 'declarations') return h('div', { className: 'page' }, h(DeclarationIndependanceManager, { onBack: () => setView(null), showToast }));
  if (view === 'diffusion') return h('div', { className: 'page' }, h(DiffusionProceduresManager, { onBack: () => setView(null), showToast }));
  if (view === 'manuel') return h('div', { className: 'page' }, h(ManuelProceduresManager, { onBack: () => setView(null), showToast, settings }));

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Conformité cabinet'), h('p', { className: 'subtitle' }, 'Manuel, diffusion, indépendance et dépendance économique.'))
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile rouge' },
        h('div', { className: 'stat-tile-value' }, PROCEDURES_MANUEL_CHAPITRES.length),
        h('div', { className: 'stat-tile-label' }, 'chapitres de manuel à rédiger')
      ),
      h('div', { className: 'stat-tile orange' },
        h('div', { className: 'stat-tile-value' }, cc.declarationsIndependance.manquantes.length + cc.diffusionProcedures.accusesManquants.length),
        h('div', { className: 'stat-tile-label' }, 'signatures en attente')
      ),
      h('div', { className: 'stat-tile orange' },
        h('div', { className: 'stat-tile-value' }, dependances.length),
        h('div', { className: 'stat-tile-label' }, pluriel(dependances.length, 'dossier'), ' en dépendance économique')
      )
    ),
    h('div', { className: 'dashboard-grid' },
      h(Card, { title: cc.manuelProcedures.label, subtitle: 'Le socle écrit de vos procédures qualité et LBC-FT.', icon: '📘', iconBg: '#FDECEC', iconColor: '#DC2626', tone: 'rouge',
        footer: h('button', { className: 'btn btn-primary btn-sm card-action', onClick: () => setView('manuel') }, 'Rédiger le manuel →') },
        h(Badge, { color: 'rouge' }, '● ', cc.manuelProcedures.statut),
        h('p', { style: { marginTop: 12, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 } }, cc.manuelProcedures.detail),
        h('div', { className: 'form-help' }, PROCEDURES_MANUEL_CHAPITRES.length, ' chapitres à couvrir')
      ),
      h(Card, { title: cc.diffusionProcedures.label, subtitle: 'Qui a lu et signé la dernière version.', icon: '📤', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'orange',
        footer: h('button', { className: 'btn btn-secondary btn-sm card-action', onClick: () => setView('diffusion') }, 'Gérer la diffusion →') },
        h(Badge, { color: 'orange' }, cc.diffusionProcedures.accusesManquants.length, ' accusés manquants'),
        cc.diffusionProcedures.accusesManquants.map((a, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(a.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Envoyé le ', formatDate(a.dateEnvoi))
        ))
      ),
      h(Card, { title: cc.declarationsIndependance.label, subtitle: 'À recueillir une fois par exercice, par collaborateur.', icon: '📜', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'orange',
        footer: h('button', { className: 'btn btn-secondary btn-sm card-action', onClick: () => setView('declarations') }, 'Gérer les déclarations →') },
        h(Badge, { color: 'orange' }, cc.declarationsIndependance.manquantes.length, ' manquantes'),
        cc.declarationsIndependance.manquantes.map((d, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, collaborateur(d.collaborateur).nom),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'Exercice ', d.exercice)
        ))
      ),
      h(Card, { title: cc.dependanceEconomique.label, subtitle: `Clients pesant plus de ${pourcent(settings.seuilDependance)} de vos honoraires.`, icon: '⚖️', iconBg: '#FEF3E1', iconColor: '#B45309', tone: dependances.length ? 'orange' : 'vert' },
        h(Badge, { color: dependances.length ? 'orange' : 'vert' }, dependances.length, ' ', pluriel(dependances.length, 'dossier'), ' à surveiller'),
        dependances.map((d, i) => h('div', { className: 'list-row', key: i },
          h('span', { className: 'list-row-label' }, client(d.dossier).nom),
          h('span', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, pourcent(d.partHonoraires), ' (seuil ', pourcent(d.seuil), ')'),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setSelectedDependance(d) }, 'Générer le rapport')
          )
        )),
        h('div', { className: 'form-help', style: { marginTop: 10 } },
          dependances.length
            ? `Un dossier Word détaillant les mesures d’indépendance est généré par dossier concerné. Le seuil de ${pourcent(settings.seuilDependance)} se règle dans Paramètres du cabinet.`
            : `Aucun client ne dépasse le seuil de ${pourcent(settings.seuilDependance)} fixé par le cabinet. Ce seuil se règle dans Paramètres du cabinet.`)
      )
    )
  );
}

// ============================================ Préparation du contrôle qualité

/* Le contrôle qualité se prépare avec des pièces, pas avec des intentions.
   Cet écran répond à une seule question : « si le contrôleur arrive demain,
   qu'est-ce que je peux lui poser sur la table, et qu'est-ce qui manque ? »

   Chaque composante du système de management de la qualité tient dans son
   rectangle titré, et chaque ligne dit franchement où on en est — y compris
   quand la preuve ne sort pas de ComplyEC. */
function PreparationControleQualite({ showToast, cabinetSettings }) {
  const etat = preparationControleQualite(cabinetSettings || CABINET_SETTINGS_DEFAUT);
  const composantesCompletes = etat.composantes.filter(c => c.nbATraiter === 0).length;

  function genererDossier() {
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    const corps = etat.composantes.map((c, i) => {
      const lignes = c.preuves.map(p => {
        const e = CQ_ETATS[p.etat];
        return `<tr>
            <td style="border:1px solid #C8D0DC; padding:5pt; width:52%;">${p.libelle}<br><span style="font-size:8.5pt; color:#666;">${p.source}</span></td>
            <td style="border:1px solid #C8D0DC; padding:5pt; width:16%;">${e.label}</td>
            <td style="border:1px solid #C8D0DC; padding:5pt; width:32%; font-size:9.5pt;">${p.detail}</td>
          </tr>`;
      }).join('');
      return `<h2 style="font-size:13pt; margin-top:20pt;">${i + 1}. ${c.titre}</h2>
        <p style="font-size:10pt; color:#555; margin-top:0;">${c.resume}</p>
        <table style="border-collapse:collapse; width:100%; font-size:10pt;">
          <tr style="background:#EEF3FA;">
            <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Pièce attendue</th>
            <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">État</th>
            <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Situation au ${today}</th>
          </tr>${lignes}
        </table>`;
    }).join('');

    downloadWordDoc('Dossier_de_controle_qualite.doc', 'Dossier de contrôle qualité',
      `<h1 style="font-size:17pt;">Dossier de préparation du contrôle qualité</h1>
       <p style="font-size:9.5pt; color:#666;">Arrêté au ${today}. Structuré selon les huit composantes du système de management de la qualité prévues par la norme professionnelle de management de la qualité (NPMQ, ${NPMQ_ARRETE}).</p>
       <p><b>Pièces disponibles :</b> ${etat.ok} sur ${etat.total} — <b>à réunir :</b> ${etat.aTraiter} — <b>à fournir hors ComplyEC :</b> ${etat.externe}.</p>
       ${corps}
       <p style="margin-top:28pt; color:#999; font-size:8pt;">État établi automatiquement par ComplyEC à partir des données saisies dans le cabinet. Les pièces marquées « À fournir hors ComplyEC » ne sont pas produites par le logiciel et doivent être jointes par le cabinet.</p>`);
    showToast('Dossier de contrôle généré au format Word.');
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Préparation du contrôle qualité'),
        h('p', { className: 'subtitle' }, 'Ce que le contrôleur va demander, et ce que vous pouvez lui remettre aujourd’hui.')
      ),
      h('button', { className: 'btn btn-primary', onClick: genererDossier }, '📄 Générer le dossier de contrôle')
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, etat.ok),
        h('div', { className: 'stat-tile-label' }, pluriel(etat.ok, 'pièce'), ' ', pluriel(etat.ok, 'disponible'))
      ),
      h('div', { className: 'stat-tile rouge' },
        h('div', { className: 'stat-tile-value' }, etat.aTraiter),
        h('div', { className: 'stat-tile-label' }, pluriel(etat.aTraiter, 'pièce'), ' à réunir')
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, composantesCompletes, ' / ', etat.composantes.length),
        h('div', { className: 'stat-tile-label' }, pluriel(composantesCompletes, 'composante'), ' ', pluriel(composantesCompletes, 'complète'))
      ),
      h('div', { className: 'stat-tile orange' },
        h('div', { className: 'stat-tile-value' }, etat.externe),
        h('div', { className: 'stat-tile-label' }, pluriel(etat.externe, 'pièce'), ' à fournir hors ComplyEC')
      )
    ),
    h('div', { className: 'cq-barre' },
      h('div', { className: 'cq-legende' },
        h('span', null, h('i', { className: 'vert' }), 'Preuve disponible'),
        h('span', null, h('i', { className: 'orange' }), 'Preuve incomplète'),
        h('span', null, h('i', { className: 'rouge' }), 'Preuve manquante'),
        h('span', null, h('i', { className: 'gris' }), 'À fournir hors ComplyEC')
      ),
      h('div', { className: 'form-help', style: { margin: 0 } },
        'Référentiel : norme professionnelle de management de la qualité (NPMQ), ', NPMQ_ARRETE, '.')
    ),
    h('div', { className: 'cq-scroll' },
      h('div', { className: 'cq-grid' },
        etat.composantes.map(c => h(FormSection, { key: c.id, icon: c.icone, title: c.titre, ton: c.ton },
          h('p', { className: 'cq-resume' }, c.resume),
          c.preuves.map((p, j) => {
            const e = CQ_ETATS[p.etat];
            return h('div', { className: 'cq-preuve', key: j },
              h('span', { className: cx('cq-pastille', e.couleur), title: e.label }, e.puce),
              h('div', { className: 'cq-preuve-corps' },
                h('div', { className: 'cq-preuve-titre' }, p.libelle),
                h('div', { className: 'cq-preuve-detail' }, p.detail),
                h('span', { className: 'cq-source' }, p.source)
              )
            );
          })
        ))
      )
    )
  );
}

// ========================================== Régularisation des anciennes lettres

/* Deux outils, dans l'ordre où on s'en sert : on dépose les lettres anciennes,
   l'outil dit lesquelles tiennent la route, puis on refait celles qui ne
   tiennent pas par le parcours habituel. Rien à apprendre. */
function RegularisationLettresMission({ showToast, onRefaire }) {
  const [analyses, setAnalyses] = useState([]);
  const [enCours, setEnCours] = useState(0);

  async function deposer(evenement) {
    const fichiers = [...(evenement.target.files || [])];
    evenement.target.value = '';
    if (!fichiers.length) return;
    setEnCours(fichiers.length);
    const resultats = [];
    for (const f of fichiers) {
      try {
        const nomStructure = ldmLireNomFichier(f.name);
        const texte = await docxLireTexte(f);
        const a = ldmAnalyserTexte(texte);
        resultats.push({ nom: f.name, nomStructure, ...a });
      } catch (err) {
        resultats.push({ nom: f.name, erreur: err.message, rubriques: [], manquantes: [], presentes: [], alertes: [], score: 0 });
      }
      setEnCours(n => n - 1);
    }
    setAnalyses(prev => [...resultats, ...prev]);
    showToast(`${resultats.length} ${pluriel(resultats.length, 'lettre')} ${pluriel(resultats.length, 'analysée')}.`);
  }

  const aRefaire = analyses.filter(a => !a.erreur && (a.manquantes.length > 0 || a.alertes.length > 0));

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Anciennes lettres de mission'),
        h('p', { className: 'subtitle' }, 'Déposez-les : l’outil dit lesquelles sont à refaire.')
      ),
      h('div', { className: 'page-header-actions' },
        analyses.length ? h('button', { className: 'btn btn-secondary', onClick: () => setAnalyses([]) }, 'Vider la liste') : null,
        h('label', { className: 'btn btn-accent btn-fichier' },
          enCours ? `Analyse… (${enCours})` : '📎 Déposer des lettres',
          h('input', {
            type: 'file', accept: '.docx', multiple: true,
            className: 'input-fichier-couvrant', onChange: deposer,
            'aria-label': 'Déposer des lettres de mission à analyser',
          })
        )
      )
    ),

    analyses.length === 0
      ? h('div', { className: 'grid-2' },
        h(FormSection, { icon: '1️⃣', title: 'Déposer les lettres existantes', ton: 'bleu' },
          h('p', { style: { fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)', margin: '0 0 16px' } },
            'Sélectionnez autant de fichiers Word que vous voulez. L’outil lit chaque lettre et vérifie qu’elle contient les rubriques attendues lors d’un contrôle qualité.'),
          h('label', { className: 'btn btn-accent btn-fichier btn-block' },
            '📎 Choisir des fichiers',
            h('input', {
              type: 'file', accept: '.docx', multiple: true,
              className: 'input-fichier-couvrant', onChange: deposer,
              'aria-label': 'Choisir des lettres de mission',
            })
          ),
          h('div', { className: 'form-help' }, 'Les fichiers restent sur votre poste : l’analyse se fait dans le navigateur.')
        ),
        h(FormSection, { icon: '2️⃣', title: 'Refaire celles qui le nécessitent', ton: 'vert' },
          h('p', { style: { fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 } },
            'Pour chaque lettre incomplète, un bouton ouvre le parcours de contractualisation habituel, préparé pour produire une lettre à jour à partir de vos modèles.')
        )
      )
      : h(Card, {
        title: `${analyses.length} ${pluriel(analyses.length, 'lettre')} ${pluriel(analyses.length, 'analysée')}`,
        subtitle: aRefaire.length ? `${aRefaire.length} à refaire.` : 'Toutes contiennent les rubriques attendues.',
        icon: '📝', iconBg: '#E9F1FE', iconColor: '#2563EB',
        tone: aRefaire.length ? 'orange' : 'vert',
      },
        h('div', { className: 'analyses-liste' },
          analyses.map((a, i) => h('div', { className: 'analyse-ligne', key: a.nom + i },
            h('div', { className: 'analyse-tete' },
              h('div', { className: 'analyse-nom' },
                a.nom,
                a.nomStructure
                  ? h(Badge, { color: 'bleu' }, 'Produite par ComplyEC')
                  : h(Badge, { color: 'gris' }, 'Origine externe')
              ),
              a.erreur
                ? h(Badge, { color: 'rouge' }, 'Illisible')
                : h(Badge, { color: a.manquantes.length ? 'orange' : 'vert' },
                  a.manquantes.length ? `${a.manquantes.length} ${pluriel(a.manquantes.length, 'rubrique')} ${pluriel(a.manquantes.length, 'manquante')}` : 'Complète')
            ),
            a.erreur
              ? h('div', { className: 'form-help' }, a.erreur)
              : h('div', null,
                a.alertes.map((al, j) => h('div', { className: 'info-box info-box-alerte', key: j, style: { marginBottom: 10 } }, '⚠️ ', al)),
                a.manquantes.length
                  ? h('div', { className: 'form-help', style: { marginTop: 0, marginBottom: 12 } },
                    'Manque : ', a.manquantes.map(m => m.label).join(' · '))
                  : null,
                h('div', { className: 'analyse-rubriques' },
                  a.rubriques.map(r => h('span', {
                    key: r.code,
                    className: cx('rubrique-puce', r.trouve ? 'ok' : (r.obligatoire ? 'ko' : 'option')),
                    title: `${r.trouve ? 'Présente' : (r.obligatoire ? 'Manquante' : 'Facultative, absente')} — exigence : ${r.source}`,
                  }, r.trouve ? '✓ ' : '· ', r.label, h('span', { className: 'rubrique-source' }, r.source))
                )),
                h('div', { className: 'form-help', style: { marginTop: 10 } },
                  a.presentation
                    ? 'Lettre lue comme une mission de présentation : les mentions de la norme NP 2300 sont vérifiées.'
                    : 'Lettre lue comme une mission d’assistance : les mentions propres à la NP 2300 ne sont pas exigées et ne sont donc pas vérifiées.'),
                (a.manquantes.length || a.alertes.length)
                  ? h('button', {
                    className: 'btn btn-primary btn-sm', style: { marginTop: 14 },
                    onClick: () => { if (onRefaire) onRefaire(); else showToast('Parcours de refonte ouvert (démonstration)'); },
                  }, 'Refaire cette lettre →')
                  : null
              )
          ))
        )
      ),

    h('div', { className: 'info-box', style: { marginTop: 18 } }, 'ℹ️ ',
      h('span', null,
        'Les exigences vérifiées viennent de la norme ',
        h('b', null, 'NP 2300'),
        ' (mentions minimales de la lettre de mission), de l’',
        h('b', null, 'article 151 du décret n° 2012-432'),
        ' (contrat écrit, droits et obligations, conditions financières), et des points relevés en pratique lors des contrôles. La détection se fait par repérage de formulations : c’est une aide à la relecture, pas un avis — une rubrique présente mais mal rédigée sera comptée comme présente.'))
  );
}

// ================================================= 1 ter. Suivi des lettres de mission

/* En contrôle qualité, la lettre de mission ancienne est relevée bien plus
   souvent que la lettre absente. L'écran classe le portefeuille par ancienneté
   d'actualisation et permet de relancer la révision dossier par dossier. */
function ECSuiviLettresMission({ showToast, onReviser, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const seuils = ldmSeuils(settings);
  const [filtre, setFiltre] = useState('tous');
  const suivi = ldmSuiviCabinet(settings);

  const lignes = suivi.lignes
    .filter(l => filtre === 'tous'
      || (filtre === 'a_traiter' && l.statut.etat !== 'a_jour')
      || filtre === l.statut.etat)
    .slice()
    .sort((a, b) => (b.statut.mois || 9999) - (a.statut.mois || 9999));

  const aTraiter = suivi.absentes.length + suivi.critiques.length + suivi.aReviser.length;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Suivi des lettres de mission'),
        h('p', { className: 'subtitle' }, 'Ancienneté d’actualisation, dossier par dossier.')
      ),
      h('div', { className: 'page-header-actions' },
        aTraiter > 0 ? h('button', {
          className: 'btn btn-primary',
          onClick: () => showToast(`Campagne de révision lancée sur ${aTraiter} ${pluriel(aTraiter, 'dossier')} (démonstration)`),
        }, `📨 Lancer la révision des ${aTraiter} dossiers`) : null
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: cx('stat-tile', suivi.critiques.length ? 'rouge' : 'vert') },
        h('div', { className: 'stat-tile-value' }, suivi.critiques.length),
        h('div', { className: 'stat-tile-label' }, `non actualisées depuis plus de ${seuils.critique} mois` )
      ),
      h('div', { className: cx('stat-tile', suivi.aReviser.length ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, suivi.aReviser.length),
        h('div', { className: 'stat-tile-label' }, `à réviser (plus de ${seuils.alerte} mois)`)
      ),
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, suivi.aJour.length),
        h('div', { className: 'stat-tile-label' }, 'à jour')
      )
    ),
    h(Card, {
      title: 'Portefeuille',
      subtitle: 'La ligne la plus ancienne remonte en premier.',
      icon: '📝', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: aTraiter ? 'orange' : 'vert',
    },
      h('div', { className: 'filter-row' },
        [['tous', 'Tous'], ['a_traiter', 'À traiter'], ['critique', 'Les plus anciennes'], ['a_reviser', 'À réviser'], ['a_jour', 'À jour']]
          .map(([cle, label]) => h('button', {
            key: cle, className: cx('subnav-btn', filtre === cle && 'active'), onClick: () => setFiltre(cle),
          }, label))
      ),
      lignes.length === 0
        ? h(EmptyDetail, { icon: '✅', label: 'Aucun dossier dans cette catégorie' })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Collaborateur', 'Signée le', 'Dernière actualisation', 'État', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null, lignes.map(({ client: c, statut }) => h('tr', { key: c.id },
              h('td', { className: 'table-name' }, c.nom),
              h('td', null, collaborateur(c.collaborateur).nom),
              h('td', null, statut.dateSignature ? formatDate(statut.dateSignature) : '—'),
              h('td', null, statut.derniereActualisation ? formatDate(statut.derniereActualisation) : '—'),
              h('td', null, h(Badge, { color: statut.couleur }, statut.label)),
              h('td', { className: 'td-action' },
                statut.etat === 'a_jour'
                  ? null
                  : h('button', {
                    className: 'btn btn-secondary btn-sm',
                    onClick: () => { if (onReviser) onReviser(); else showToast(`Révision ouverte pour ${c.nom} (démonstration)`); },
                  }, 'Réviser')
              )
            )))
          )
        )
    ),
    h('div', { className: 'info-box', style: { marginTop: 18 } }, 'ℹ️ ',
      `Aucun texte n’impose une révision à échéance fixe : le seuil de ${seuils.alerte} mois se règle dans Paramètres du cabinet. C’est en revanche le point le plus fréquemment relevé lors des contrôles qualité.`)
  );
}

// ============================================================ 4 bis. Mes dossiers

/* Vue cabinet du portefeuille : le tableau des dossiers, jusque-là accessible
   seulement au détour de l'import de régularisation, devient une entrée à part
   entière. C'est aussi d'ici qu'on affecte un dossier à un collaborateur. */
function ECDossiers({ showToast, onOpenBilan, onNouveauDossier }) {
  const [recherche, setRecherche] = useState('');
  const [filtreCollab, setFiltreCollab] = useState('tous');

  const lignes = CLIENTS
    .filter(c => filtreCollab === 'tous' || c.collaborateur === filtreCollab)
    .filter(c => {
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return c.nom.toLowerCase().includes(q) || (c.siret || '').includes(q);
    });

  const parCollab = COLLABORATEURS.map(co => ({ co, n: CLIENTS.filter(c => c.collaborateur === co.id).length }));
  const sansCollab = CLIENTS.filter(c => !c.collaborateur).length;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Mes dossiers'),
        h('p', { className: 'subtitle' }, 'Le portefeuille du cabinet et son affectation.')
      ),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Export du portefeuille généré (démonstration)') }, '⬇ Exporter'),
        onNouveauDossier ? h('button', { className: 'btn btn-primary', onClick: onNouveauDossier }, '+ Nouveau dossier') : null
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, CLIENTS.length),
        h('div', { className: 'stat-tile-label' }, 'dossiers au portefeuille')
      ),
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, parCollab.filter(p => p.n > 0).length),
        h('div', { className: 'stat-tile-label' }, 'collaborateurs affectés')
      ),
      h('div', { className: cx('stat-tile', sansCollab ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, sansCollab),
        h('div', { className: 'stat-tile-label' }, 'dossiers sans collaborateur')
      )
    ),
    h(Card, { title: 'Portefeuille du cabinet', subtitle: 'Filtrez par collaborateur ou cherchez un dossier.', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'bleu' },
      h('div', { className: 'filter-row' },
        h('input', {
          className: 'form-input', style: { maxWidth: 280 }, placeholder: 'Rechercher un dossier ou un SIRET…',
          value: recherche, onChange: e => setRecherche(e.target.value),
        }),
        h('select', { className: 'form-select', style: { maxWidth: 220 }, value: filtreCollab, onChange: e => setFiltreCollab(e.target.value) },
          h('option', { value: 'tous' }, 'Tous les collaborateurs'),
          COLLABORATEURS.map(co => h('option', { key: co.id, value: co.id }, co.nom))
        )
      ),
      lignes.length === 0
        ? h(EmptyDetail, { icon: '🔎', label: 'Aucun dossier ne correspond à cette recherche' })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Forme', 'SIRET', 'Collaborateur', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              lignes.map(c => h('tr', { key: c.id, className: 'clickable', onClick: () => onOpenBilan && onOpenBilan(c.id) },
                h('td', { className: 'table-name' }, c.nom),
                h('td', null, c.forme || '—'),
                h('td', null, c.siret || '—'),
                h('td', null, c.collaborateur
                  ? collaborateur(c.collaborateur).nom
                  : h(Badge, { color: 'orange' }, 'Non affecté')),
                h('td', { className: 'td-action' }, h('button', {
                  className: 'row-open-btn', 'aria-label': 'Ouvrir le dossier', title: 'Ouvrir le dossier',
                  onClick: e => { e.stopPropagation(); if (onOpenBilan) onOpenBilan(c.id); },
                }, '→'))
              ))
            )
          )
        )
    )
  );
}

// ============================================================ 5 bis. Vigilance LBC-FT

/* Les quatre volets qui relèvent de la lutte anti-blanchiment vivaient
   dispersés dans « Conformité cabinet ». Ils forment leur propre section : un
   expert-comptable qui prépare un contrôle LBC-FT les ouvre ensemble. */
function ECVigilance({ sub, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const [analyseOuverte, setAnalyseOuverte] = useState(null);
  const vue = sub || 'analyses';

  if (vue === 'formations') return h('div', { className: 'page' }, h(FormationsLBCFTManager, { showToast, cabinetSettings: settings }));
  if (vue === 'cartographie') return h(CartographieRisques, { showToast, cabinetNom: settings.nom });
  if (vue === 'classification') return h(ClassificationRisquesLBCFT, { showToast });

  if (analyseOuverte) {
    const c = client(analyseOuverte.dossier);
    return h('div', { className: 'page page-stack' },
      h('div', { className: 'page-header' },
        h('div', null,
          h('h1', null, `Analyse de vigilance — ${c.nom}`),
          h('p', { className: 'subtitle' }, `Dernière analyse du ${formatDate(analyseOuverte.derniereAnalyse)}`)
        ),
        h('div', { className: 'page-header-actions' },
          h('button', { className: 'btn btn-secondary', onClick: () => setAnalyseOuverte(null) }, '← Retour à la liste'),
          h('button', { className: 'btn btn-accent', onClick: () => showToast('Analyse rouverte pour mise à jour (démonstration)') }, 'Reprendre cette analyse →')
        )
      ),
      h(Card, { title: 'Fiche de vigilance', subtitle: 'Telle qu’elle a été arrêtée lors de la dernière revue.', icon: '🔍', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'bleu' },
        h(FicheVigilance, { clientData: c, record: analyseOuverte, referent: collaborateur(c.collaborateur).nom, cabinet: settings })
      )
    );
  }

  const analyses = DOSSIERS_LBCFT.filter(d => d.statut === 'complete');
  const aLancer = DOSSIERS_LBCFT.filter(d => d.statut !== 'complete');
  const renforcees = analyses.filter(d => d.niveauRetenu === 'Renforcée');

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Analyses de vigilance'),
        h('p', { className: 'subtitle' }, 'Rouvrir une analyse déjà arrêtée pour la mettre à jour.')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, analyses.length),
        h('div', { className: 'stat-tile-label' }, 'analyses arrêtées')
      ),
      h('div', { className: 'stat-tile rouge' },
        h('div', { className: 'stat-tile-value' }, renforcees.length),
        h('div', { className: 'stat-tile-label' }, 'en vigilance renforcée')
      ),
      h('div', { className: 'stat-tile orange' },
        h('div', { className: 'stat-tile-value' }, aLancer.length),
        h('div', { className: 'stat-tile-label' }, 'analyses à lancer')
      )
    ),
    h(Card, { title: 'Analyses arrêtées', subtitle: 'Cliquez une ligne pour rouvrir la fiche de vigilance.', icon: '🔍', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'bleu' },
      analyses.length === 0
        ? h(EmptyDetail, { icon: '🔍', label: 'Aucune analyse arrêtée pour le moment' })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Collaborateur', 'Analysée le', 'Niveau retenu', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              analyses.map(d => {
                const c = client(d.dossier);
                return h('tr', { key: d.dossier, className: 'clickable', onClick: () => setAnalyseOuverte(d) },
                  h('td', { className: 'table-name' }, c.nom),
                  h('td', null, collaborateur(c.collaborateur).nom),
                  h('td', null, formatDate(d.derniereAnalyse)),
                  h('td', null, h(Badge, { color: niveauVigilanceCouleur(d.niveauRetenu) }, d.niveauRetenu)),
                  h('td', { className: 'td-action' }, h('button', {
                    className: 'row-open-btn', 'aria-label': 'Rouvrir l’analyse', title: 'Rouvrir l’analyse',
                    onClick: e => { e.stopPropagation(); setAnalyseOuverte(d); },
                  }, '→'))
                );
              })
            )
          )
        )
    )
  );
}

/* Écran d'état de la classification : il dit où en est le cabinet et ouvre la
   révision. Le document lui-même est la cartographie. */
function ClassificationRisquesLBCFT({ showToast }) {
  const cc = CONFORMITE_CABINET.classificationRisquesLBCFT;
  const stats = cartographieStats();
  const mois = moisDepuis(cc.derniereRevision);
  const enRetard = mois > 12;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Classification des risques'),
        h('p', { className: 'subtitle' }, 'L’état de la classification LBC-FT du cabinet, à réviser chaque année.')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: cx('stat-tile', enRetard ? 'rouge' : 'vert') },
        h('div', { className: 'stat-tile-value' }, mois),
        h('div', { className: 'stat-tile-label' }, 'mois depuis la dernière revue')
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, stats.total),
        h('div', { className: 'stat-tile-label' }, 'dossiers classifiés')
      ),
      h('div', { className: 'stat-tile orange' },
        h('div', { className: 'stat-tile-value' }, stats.nonAnalyses.length),
        h('div', { className: 'stat-tile-label' }, 'dossiers non analysés')
      )
    ),
    h(Card, {
      title: 'État de la classification',
      subtitle: enRetard ? 'La revue annuelle est dépassée : elle doit être relancée.' : 'La revue annuelle est à jour.',
      icon: '🧭', iconBg: enRetard ? '#FDECEC' : '#E7F7ED', iconColor: enRetard ? '#DC2626' : '#16A34A',
      tone: enRetard ? 'rouge' : 'vert',
    },
      h(Badge, { color: enRetard ? 'rouge' : 'vert' }, cc.statut),
      h('p', { style: { marginTop: 14, fontSize: 13.4, color: 'var(--text-muted)', lineHeight: 1.65 } }, cc.detail),
      h('div', { className: 'form-help', style: { marginTop: 8 } }, 'Dernière révision : ', formatDate(cc.derniereRevision)),
      h('div', { className: 'info-box', style: { marginTop: 16 } }, 'ℹ️ ',
        'La révision se fait dans « Cartographie des risques », qui reprend les analyses de vigilance dossier par dossier et produit le document daté à conserver.')
    )
  );
}

/* Le cabinet programme deux sessions LBC-FT par an : le compteur se lit par
   rapport à cet attendu, pas dans l'absolu. */
// Nombre de sessions LBC-FT que le cabinet se fixe par an. Réglé dans
// Paramètres du cabinet, et repris tel quel par le manuel de procédures :
// deux chiffres différents pour la même règle seraient relevés en contrôle.
const SESSIONS_ATTENDUES_PAR_AN = 2;

function FormationsLBCFTManager({ onBack, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const sessionsAttendues = Number(settings.sessionsLbcftParAn || SESSIONS_ATTENDUES_PAR_AN);
  const [showForm, setShowForm] = useState(false);
  const programme = FORMATIONS_PROGRAMMES.find(p => p.annee === currentCalendarYear());
  const sessions = programme ? programme.sessions : [];
  const sessionsFaites = sessions.length;
  const attestations = sessions.flatMap(s => s.participants.map(pid => (s.attestations[pid] || { recue: false })));
  const attestationsRecues = attestations.filter(a => a.recue).length;
  const enAttenteTotal = attestations.length - attestationsRecues;
  const registre = registreFormation();

  /* Le décret impose de pouvoir montrer les justificatifs, pas seulement de
     former. Ce document réunit ce que le texte énumère : identité, poste,
     dates, durée, organisme, et la date jusqu'à laquelle les pièces doivent
     être conservées pour les personnes parties. */
  function genererRegistre() {
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    const lignes = registre.toutes.map(l => `<tr>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.nom}${l.parti ? ' <i>(parti·e)</i>' : ''}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.role}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${formatDate(l.dateEmbauche)}${l.dateDepart ? ' → ' + formatDate(l.dateDepart) : ''}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.accueil.date ? formatDate(l.accueil.date) : 'Non suivie'}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.derniereFormation ? formatDate(l.derniereFormation) : 'Aucune'}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.conserverJusquA ? formatDate(l.conserverJusquA) : 'Pendant toute la durée des fonctions'}</td>
      </tr>`).join('');

    const detailSessions = FORMATIONS_PROGRAMMES.map(prog => prog.sessions.map(sess => {
      const rows = sess.participants.map(pid => {
        const att = sess.attestations[pid] || { recue: false };
        return `<tr>
            <td style="border:1px solid #C8D0DC; padding:5pt;">${collaborateur(pid).nom}</td>
            <td style="border:1px solid #C8D0DC; padding:5pt;">${collaborateur(pid).role}</td>
            <td style="border:1px solid #C8D0DC; padding:5pt;">${att.recue ? 'Attestation reçue le ' + formatDate(att.dateUpload) : 'Attestation non reçue'}</td>
          </tr>`;
      }).join('');
      return `<h3 style="font-size:12pt; margin-top:16pt;">${sess.titre}</h3>
        <p style="font-size:10pt; margin-top:0;">Séance du ${formatDate(sess.date)} — organisme : ${sess.formateur}.</p>
        <table style="border-collapse:collapse; width:100%; font-size:10pt;">
          <tr style="background:#EEF3FA;"><th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Participant</th><th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Fonction</th><th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Justificatif</th></tr>
          ${rows}
        </table>`;
    }).join('')).join('');

    downloadWordDoc('Registre_de_formation_LBC-FT.doc', 'Registre de formation LBC-FT',
      `<h1 style="font-size:17pt;">Registre de formation LBC-FT</h1>
       <p style="font-size:9.5pt; color:#666;">Arrêté au ${today}. Établi en application de l’article D. 561-38-1-1 du code monétaire et financier, créé par le ${FORMATION_DECRET} et en vigueur depuis le 26 avril 2026, qui impose de former les personnes concourant aux obligations LBC-FT dès leur embauche puis régulièrement, d’adapter le contenu et la fréquence aux risques et aux fonctions exercées, et de conserver les justificatifs pendant la durée des fonctions puis ${FORMATION_CONSERVATION_ANS} ans après le départ.</p>
       <h2 style="font-size:13pt; margin-top:20pt;">1. Personnes concernées</h2>
       <table style="border-collapse:collapse; width:100%; font-size:10pt;">
         <tr style="background:#EEF3FA;">
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Nom</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Fonction</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Période</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Formation d’accueil</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Dernière formation</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Justificatifs à conserver jusqu’au</th>
         </tr>
         ${lignes}
       </table>
       <h2 style="font-size:13pt; margin-top:22pt;">2. Sessions et justificatifs</h2>
       ${detailSessions}
       <p style="margin-top:26pt; color:#999; font-size:8pt;">Les attestations, feuilles d’émargement et supports de formation correspondants sont conservés par le cabinet ; le présent registre en donne l’inventaire, il ne s’y substitue pas.</p>`);
    showToast('Registre de formation généré au format Word.');
  }

  const pastilleAccueil = etat => h('span', { className: cx('cq-pastille', etat === 'ok' ? 'vert' : etat === 'partiel' ? 'orange' : 'rouge') },
    etat === 'ok' ? '\u2713' : etat === 'partiel' ? '!' : '\u2715');

  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Formations LBC-FT'), h('p', { className: 'subtitle' }, `Programme ${currentCalendarYear()}, formations d’accueil et registre des justificatifs`)),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        enAttenteTotal > 0 ? h('button', {
          className: 'btn btn-secondary',
          onClick: () => showToast(`Rappel envoyé aux ${enAttenteTotal} collaborateurs sans attestation (démonstration)`),
        }, `📨 Relancer les ${enAttenteTotal} attestations`) : null,
        h('button', { className: 'btn btn-secondary', onClick: genererRegistre }, '📄 Registre de formation'),
        h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, '+ Ajouter une session')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: cx('stat-tile', sessionsFaites >= sessionsAttendues ? 'vert' : 'orange') },
        h('div', { className: 'stat-tile-value' }, `${sessionsFaites}/${sessionsAttendues}`),
        h('div', { className: 'stat-tile-label' }, `sessions programmées en ${currentCalendarYear()}`)
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, attestationsRecues),
        h('div', { className: 'stat-tile-label' }, pluriel(attestationsRecues, 'attestation'), ' ', pluriel(attestationsRecues, 'reçue'))
      ),
      h('div', { className: cx('stat-tile', enAttenteTotal ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, enAttenteTotal),
        h('div', { className: 'stat-tile-label' }, pluriel(enAttenteTotal, 'attestation'), ' en attente')
      ),
      h('div', { className: cx('stat-tile', registre.accueilManquant.length ? 'rouge' : 'vert') },
        h('div', { className: 'stat-tile-value' }, registre.accueilManquant.length),
        h('div', { className: 'stat-tile-label' }, pluriel(registre.accueilManquant.length, 'formation'), ' d’accueil ', pluriel(registre.accueilManquant.length, 'manquante'))
      )
    ),
    showForm ? h(Modal, { title: 'Nouvelle session de formation', onClose: () => setShowForm(false) },
      h(NouvelleSessionFormationForm, { onClose: () => setShowForm(false), showToast })
    ) : null,
    h('div', { className: 'cq-scroll' },
      h(FormSection, { icon: '🎒', title: 'Formation dès l’embauche et conservation des justificatifs', ton: 'violet' },
        h('p', { className: 'cq-resume' },
          'Depuis le ', FORMATION_DECRET, ', la formation LBC-FT est due dès l’embauche puis régulièrement, adaptée aux fonctions exercées, et ses justificatifs se conservent pendant la durée des fonctions puis ', FORMATION_CONSERVATION_ANS, ' ans après le départ (', FORMATION_ARTICLE, '). Le texte ne fixe aucun délai chiffré pour la formation d’accueil : les ', FORMATION_DELAI_ACCUEIL_JOURS, ' jours retenus ci-dessous sont ceux que le cabinet se donne.'),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Personne', 'Fonction', 'Entrée', 'Formation d’accueil', 'Dernière formation', 'Justificatifs'].map(c => h('th', { key: c }, c)))),
            h('tbody', null, registre.toutes.map(l => h('tr', { key: l.id, style: l.parti ? { opacity: 0.78 } : null },
              h('td', { className: 'table-name' }, l.nom, l.parti ? h('span', { className: 'form-help', style: { display: 'block', margin: 0 } }, 'Parti·e le ' + formatDate(l.dateDepart)) : null),
              h('td', null, l.role),
              h('td', null, formatDate(l.dateEmbauche)),
              h('td', null, h('span', { style: { display: 'flex', alignItems: 'center', gap: 9 } },
                pastilleAccueil(l.accueil.etat),
                h('span', null, l.accueil.detail)
              )),
              h('td', null, l.derniereFormation ? formatDate(l.derniereFormation) : h('span', { style: { color: 'var(--text-muted)' } }, 'Aucune')),
              h('td', null, l.conserverJusquA
                ? h(Badge, { color: l.conserverJusquA >= new Date().toISOString().slice(0, 10) ? 'orange' : 'gris' }, 'À conserver jusqu’au ', formatDate(l.conserverJusquA))
                : h('span', { style: { color: 'var(--text-muted)' } }, 'Durée des fonctions'))
            )))
          )
        )
      ),
      !programme ? h('div', { className: 'card' }, h(EmptyDetail, { icon: '🎓', label: `Aucun programme créé pour ${currentCalendarYear()}` })) :
        programme.sessions.map(s => h(FormSection, { key: s.id, icon: '🎓', title: s.titre, ton: 'bleu', style: { marginTop: 20 } },
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date'), h('span', { className: 'v' }, formatDate(s.date))),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Organisme'), h('span', { className: 'v' }, s.formateur)),
          h('div', { className: 'table-wrap', style: { marginTop: 14 } },
            h('table', { className: 'data-table' },
              h('thead', null, h('tr', null, ['Collaborateur', 'Fonction', 'Attestation', ''].map(c => h('th', { key: c }, c)))),
              h('tbody', null, s.participants.map(pid => {
                const att = s.attestations[pid] || { recue: false };
                return h('tr', { key: pid },
                  h('td', { className: 'table-name' }, collaborateur(pid).nom),
                  h('td', null, collaborateur(pid).role),
                  h('td', null, att.recue ? h(Badge, { color: 'vert' }, '● Reçue le ', formatDate(att.dateUpload)) : h(Badge, { color: 'orange' }, '● En attente')),
                  h('td', null, att.recue ? null : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast(`Rappel envoyé à ${collaborateur(pid).nom}`) }, '📨 Relancer'))
                );
              }))
            )
          )
        ))
    )
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

  return h('form', { className: 'auth-form', onSubmit: submit },
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
    h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' } },
      h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Annuler'),
      h('button', { type: 'submit', className: 'btn btn-primary' }, 'Créer la session')
    )
  );
}

function DeclarationIndependanceManager({ onBack, showToast }) {
  const rows = declarationsIndependanceAnnee(currentCalendarYear());
  const manquantes = rows.filter(d => d.statut !== 'signee');
  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Déclarations d’indépendance'),
        h('p', { className: 'subtitle' }, `Une déclaration par collaborateur et par exercice — ${currentCalendarYear()}.`)
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        manquantes.length > 0 ? h('button', {
          className: 'btn btn-primary',
          onClick: () => showToast(`Rappel envoyé aux ${manquantes.length} collaborateurs n’ayant pas signé (démonstration)`),
        }, `📨 Relancer les ${manquantes.length} manquantes`) : null
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, rows.length - manquantes.length),
        h('div', { className: 'stat-tile-label' }, 'déclarations signées')
      ),
      h('div', { className: cx('stat-tile', manquantes.length ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, manquantes.length),
        h('div', { className: 'stat-tile-label' }, 'encore attendues')
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, currentCalendarYear()),
        h('div', { className: 'stat-tile-label' }, 'exercice concerné')
      )
    ),
    h(Card, { title: 'Suivi des déclarations', subtitle: 'Relancez individuellement, ou tout le monde d’un coup depuis l’en-tête.', icon: '📜', iconBg: '#FEF3E1', iconColor: '#B45309', tone: manquantes.length ? 'orange' : 'vert' },
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
  const derniere = PROCEDURES_VERSIONS[0];
  const totalD = Object.keys(derniere.accuses).length;
  const signesD = Object.values(derniere.accuses).filter(a => a.signe).length;
  const enAttente = Object.entries(derniere.accuses).filter(([, a]) => !a.signe);

  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Diffusion des procédures'),
        h('p', { className: 'subtitle' }, 'Qui a reçu, lu et signé chaque version du manuel.')
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        enAttente.length > 0 ? h('button', {
          className: 'btn btn-secondary',
          onClick: () => showToast(`Rappel envoyé aux ${enAttente.length} collaborateurs n’ayant pas signé (démonstration)`),
        }, `📨 Relancer les ${enAttente.length} retardataires`) : null,
        h('button', { className: 'btn btn-primary', onClick: () => showToast('Nouvelle version diffusée à tous les collaborateurs (démonstration)') }, '📤 Diffuser une version')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, derniere.version),
        h('div', { className: 'stat-tile-label' }, 'version en vigueur')
      ),
      h('div', { className: cx('stat-tile', signesD === totalD ? 'vert' : 'orange') },
        h('div', { className: 'stat-tile-value' }, signesD + '/' + totalD),
        h('div', { className: 'stat-tile-label' }, 'accusés de lecture signés')
      ),
      h('div', { className: 'stat-tile violet' },
        h('div', { className: 'stat-tile-value' }, PROCEDURES_VERSIONS.length),
        h('div', { className: 'stat-tile-label' }, 'versions diffusées')
      )
    ),
    h('div', { className: 'split-layout with-detail' },
      h(Card, { title: 'Versions diffusées', subtitle: 'Cliquez une version pour voir qui l’a signée.', icon: '📤', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'bleu' },
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Version', 'Diffusée le', 'Accusés signés', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null, PROCEDURES_VERSIONS.map(v => {
              const total = Object.keys(v.accuses).length;
              const signes = Object.values(v.accuses).filter(a => a.signe).length;
              return h('tr', { key: v.id, className: cx('clickable', selected && selected.id === v.id && 'row-selected'), onClick: () => setSelected(v) },
                h('td', { className: 'table-name' }, v.version),
                h('td', null, formatDate(v.dateDiffusion)),
                h('td', null, h(Badge, { color: signes === total ? 'vert' : 'orange' }, signes, '/', total)),
                h('td', { className: 'td-action' }, h('button', {
                  className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail',
                  onClick: e => { e.stopPropagation(); setSelected(v); },
                }, '→'))
              );
            }))
          )
        )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h(Card, {
          title: selected.version,
          subtitle: `Diffusée le ${formatDate(selected.dateDiffusion)}`,
          icon: '📘', iconBg: '#E9F1FE', iconColor: '#2563EB',
          tone: Object.values(selected.accuses).every(a => a.signe) ? 'vert' : 'orange',
          footer: Object.values(selected.accuses).some(a => !a.signe)
            ? h('button', {
              className: 'btn btn-secondary btn-sm card-action',
              onClick: () => showToast('Rappel envoyé aux collaborateurs concernés (démonstration)'),
            }, '📨 Relancer les non-signataires')
            : null,
        },
          h('p', { style: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 } }, selected.resume),
          Object.entries(selected.accuses).map(([id, a]) => h('div', { className: 'list-row', key: id },
            h('span', { className: 'list-row-label' }, h(Dot, { color: a.signe ? 'vert' : 'orange' }), collaborateur(id).nom),
            a.signe
              ? h('span', { style: { fontSize: 12.3, color: 'var(--text-muted)' } }, 'Signé le ', formatDate(a.dateSignature))
              : h(Badge, { color: 'orange' }, 'En attente')
          ))
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez une version' }))
      )
    )
  );
}

const MANUEL_STATUT_COULEUR = { a_jour: 'vert', a_reviser: 'orange', manquant: 'rouge' };
const MANUEL_STATUT_LABEL = { a_jour: 'À jour', a_reviser: 'À réviser', manquant: 'Chapitre manquant' };

/* Rédige la phrase du chapitre à partir des réponses. La syntaxe
   {code:si oui|si non} choisit une formulation selon une réponse oui/non ;
   {code} insère simplement la réponse. */
/* `marqueVide` distingue l'aperçu à l'écran du document remis.

   À l'écran, un « … » suffit pour montrer qu'il reste à répondre. Dans un
   manuel imprimé et posé devant un contrôleur, il passerait inaperçu : on y
   écrit « [à compléter] », qui se voit et se cherche. */
function redigerParagraphe(modele, reponses, marqueVide) {
  const vide = marqueVide || '…';
  return modele.replace(/\{(\w[\w-]*)(?::([^|}]*)\|([^}]*))?\}/g, (_, code, siOui, siNon) => {
    const v = reponses[code];
    if (siOui !== undefined) {
      if (v === undefined || v === '') return vide;
      return v === 'oui' ? siOui : siNon;
    }
    if (v === undefined || v === '') return vide;
    return String(v);
  });
}

/* Compte les passages encore vides d'un chapitre, réponses par défaut
   comprises : c'est ce qui permet de prévenir avant de générer le document. */
function manuelPassagesVides(modele, reponses, valeurDefaut, questions) {
  const complet = Object.assign(
    Object.fromEntries(questions.map(q => [q.code, valeurDefaut(q)])),
    reponses || {}
  );
  const codes = [];
  modele.replace(/\{(\w[\w-]*)(?::[^|}]*\|[^}]*)?\}/g, (_, code) => {
    const v = complet[code];
    if (v === undefined || v === '') codes.push(code);
    return '';
  });
  return codes;
}

function ManuelProceduresManager({ onBack, showToast, settings }) {
  const params = settings || CABINET_SETTINGS_DEFAUT;
  // Une question peut être préremplie par un réglage du cabinet (le seuil de
  // dépendance économique, par exemple). Le manuel dit alors exactement ce que
  // les écrans appliquent : pas deux chiffres pour la même règle.
  const valeurDefaut = q => (q.depuisParametre && params[q.depuisParametre] !== undefined
    ? String(params[q.depuisParametre])
    : (q.defaut || ''));
  const [chapitres, setChapitres] = useState(PROCEDURES_MANUEL_CHAPITRES);
  const [reponses, setReponses] = useState({});
  const [index, setIndex] = useState(0);
  const [enRedaction, setEnRedaction] = useState(false);

  const chapitre = chapitres[index];
  const questions = (MANUEL_QUESTIONNAIRE[chapitre.id] || []).filter(q => q.code);
  const modele = (MANUEL_QUESTIONNAIRE[chapitre.id] || []).find(q => q.modele);
  const reponsesChapitre = reponses[chapitre.id] || {};
  const repondues = questions.filter(q => (reponsesChapitre[q.code] || '') !== '').length;
  const complet = repondues === questions.length && questions.length > 0;
  const rediges = chapitres.filter(c => c.statut === 'a_jour').length;

  function repondre(code, valeur) {
    setReponses(prev => ({ ...prev, [chapitre.id]: { ...(prev[chapitre.id] || {}), [code]: valeur } }));
  }

  function validerChapitre() {
    const today = new Date().toISOString().slice(0, 10);
    setChapitres(prev => prev.map(c => (c.id === chapitre.id ? { ...c, statut: 'a_jour', derniereMaj: today } : c)));
    showToast(`Chapitre « ${chapitre.titre} » rédigé.`);
    if (index < chapitres.length - 1) setIndex(index + 1);
    else setEnRedaction(false);
  }

  /* Chapitres encore incomplets, réponses par défaut comprises. Sert à
     prévenir avant de produire le document plutôt qu'à interdire : le cabinet
     peut vouloir un brouillon, mais il doit savoir ce qu'il imprime. */
  function chapitresIncomplets() {
    return chapitres.map(c => {
      const qs = MANUEL_QUESTIONNAIRE[c.id] || [];
      const m = qs.find(q => q.modele);
      if (!m) return { titre: c.titre, vides: ['tout le chapitre'] };
      const vides = manuelPassagesVides(m.modele, reponses[c.id], valeurDefaut, qs.filter(q => q.code));
      return vides.length ? { titre: c.titre, vides } : null;
    }).filter(Boolean);
  }

  function genererManuel() {
    const corps = chapitres.map((c, i) => {
      const qs = MANUEL_QUESTIONNAIRE[c.id] || [];
      const m = qs.find(q => q.modele);
      // Le document remis part des mêmes valeurs que l'aperçu à l'écran :
      // les réponses par défaut y sont donc appliquées, et non ignorées.
      const valeurs = Object.assign(
        Object.fromEntries(qs.filter(q => q.code).map(q => [q.code, valeurDefaut(q)])),
        reponses[c.id] || {}
      );
      const texte = m
        ? redigerParagraphe(m.modele, valeurs, '[à compléter]')
        : '[Chapitre à rédiger.]';
      return `<h2 style="font-size:13pt; margin-top:20pt;">${i + 1}. ${c.titre}</h2><p style="text-align:justify;">${texte}</p>`;
    }).join('');
    const incomplets = chapitresIncomplets();
    const avertissement = incomplets.length
      ? `<p style="border:1pt solid #C2620A; background:#FDF3E3; color:#8A4708; padding:8pt; font-size:10pt;"><b>Document incomplet.</b> ${incomplets.length} ${pluriel(incomplets.length, 'chapitre')} ${pluriel(incomplets.length, 'comporte', 'comportent')} encore des passages marqués « [à compléter] » : ${incomplets.map(c => c.titre).join(', ')}. Ce manuel ne doit pas être diffusé en l'état.</p>`
      : '';
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    downloadWordDoc('Manuel_de_procedures.doc', 'Manuel de procédures',
      `<h1 style="font-size:17pt;">Manuel de procédures du cabinet</h1>
       <p style="font-size:9.5pt; color:#666;">Version du ${today}. Établi en application de la norme professionnelle de management de la qualité (NPMQ, arrêtée le 30 mai 2024, applicable depuis le 1<sup>er</sup> janvier 2025), des articles 141 à 169 du décret n° 2012-432 du 30 mars 2012 portant code de déontologie, et, pour le volet LBC-FT, des articles L. 561-1 et suivants du code monétaire et financier.</p>
       ${avertissement}
       ${corps}
       <p style="margin-top:28pt; color:#999; font-size:8pt;">Document généré par ComplyEC — à relire et valider par l'expert-comptable avant diffusion.</p>`);
    showToast(incomplets.length
      ? `Manuel généré, avec ${incomplets.length} ${pluriel(incomplets.length, 'chapitre')} à compléter.`
      : 'Manuel généré au format Word.');
  }

  // Prévient avant de produire un manuel incomplet, sans l'interdire.
  const [confirmationManuel, setConfirmationManuel] = useState(null);

  function demanderGeneration() {
    const incomplets = chapitresIncomplets();
    if (incomplets.length) { setConfirmationManuel(incomplets); return; }
    genererManuel();
  }

  // ---- Écran de rédaction guidée, chapitre par chapitre ----
  if (enRedaction) {
    return h(React.Fragment, null,
      h('div', { className: 'page-header' },
        h('div', null,
          h('h1', null, 'Rédaction du manuel'),
          h('p', { className: 'subtitle' }, `Chapitre ${index + 1} sur ${chapitres.length} — ${chapitre.titre}`)
        ),
        h('div', { className: 'page-header-actions' },
          h('button', { className: 'btn btn-secondary', onClick: () => setEnRedaction(false) }, '← Revenir au plan')
        )
      ),
      h('div', { className: 'manuel-progress' },
        chapitres.map((c, i) => h('button', {
          key: c.id,
          className: cx('manuel-step', i === index && 'active', c.statut === 'a_jour' && 'done'),
          onClick: () => setIndex(i),
          title: c.titre,
        }, c.statut === 'a_jour' ? '✓' : i + 1))
      ),
      h(Card, {
        title: chapitre.titre,
        subtitle: 'Répondez aux questions : le paragraphe se rédige à droite au fur et à mesure.',
        icon: '📘', iconBg: '#E7F7ED', iconColor: '#16A34A',
        tone: complet ? 'vert' : 'bleu',
      },
        h('div', { className: 'grid-2' },
          h('div', null,
            h(FormSection, { icon: '❓', title: `Questions (${repondues}/${questions.length})` },
              questions.map(q => h('div', { className: 'form-group', key: q.code },
                h('label', { className: 'form-label' }, q.label),
                q.type === 'oui_non'
                  ? h('div', { className: 'toggle-pair' },
                    h('button', { className: cx('toggle-btn', reponsesChapitre[q.code] === 'oui' && 'selected yes'), onClick: () => repondre(q.code, 'oui') }, 'Oui'),
                    h('button', { className: cx('toggle-btn', reponsesChapitre[q.code] === 'non' && 'selected no'), onClick: () => repondre(q.code, 'non') }, 'Non')
                  )
                  : q.type === 'choix'
                    ? h('select', {
                      className: 'form-select', value: reponsesChapitre[q.code] || '',
                      onChange: e => repondre(q.code, e.target.value),
                    }, h('option', { value: '' }, '— Choisir —'), q.options.map(o => h('option', { key: o, value: o.toLowerCase() }, o)))
                    : q.type === 'texte_long'
                      ? h('textarea', {
                        className: 'form-textarea', rows: 3, placeholder: q.placeholder || '',
                        value: reponsesChapitre[q.code] || '', onChange: e => repondre(q.code, e.target.value),
                      })
                      : h('div', { className: q.suffixe ? 'input-with-btn' : '' },
                        h('input', {
                          className: 'form-input', type: q.type === 'nombre' ? 'number' : 'text',
                          placeholder: q.placeholder || '',
                          value: reponsesChapitre[q.code] !== undefined ? reponsesChapitre[q.code] : valeurDefaut(q),
                          onChange: e => repondre(q.code, e.target.value),
                        }),
                        q.suffixe ? h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, q.suffixe) : null
                      )
              ))
            )
          ),
          h('div', { className: 'result-panel' },
            h('div', { className: 'result-panel-eyebrow' }, 'Paragraphe rédigé'),
            h('div', { className: 'letter-preview', style: { marginTop: 10 } },
              modele ? redigerParagraphe(modele.modele, { ...Object.fromEntries(questions.map(q => [q.code, valeurDefaut(q)])), ...reponsesChapitre })
                : 'Aucune trame disponible pour ce chapitre.'),
            h('div', { className: 'result-panel-note', style: { marginTop: 12 } },
              'Le texte reprend vos réponses. Vous pourrez le retoucher dans le document Word final.'),
            h('div', { style: { marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 } },
              index > 0 ? h('button', { className: 'btn btn-secondary btn-block', onClick: () => setIndex(index - 1) }, '← Chapitre précédent') : null,
              h('button', { className: 'btn btn-primary btn-block', disabled: !complet, onClick: validerChapitre },
                index < chapitres.length - 1 ? 'Valider et continuer →' : 'Valider le dernier chapitre')
            )
          )
        )
      )
    );
  }

  // ---- Plan du manuel : état d'avancement et point d'entrée ----
  const premierIncomplet = chapitres.findIndex(c => c.statut !== 'a_jour');

  return h(React.Fragment, null,
    confirmationManuel ? h(Modal, { title: 'Ce manuel est encore incomplet', onClose: () => setConfirmationManuel(null) },
      h('p', { style: { fontSize: 14, lineHeight: 1.6, marginTop: 0 } },
        confirmationManuel.length, ' ', pluriel(confirmationManuel.length, 'chapitre'), ' ',
        pluriel(confirmationManuel.length, 'comporte', 'comportent'),
        ' encore des passages sans réponse. Ils apparaîtront dans le document sous la forme ',
        h('b', null, '« [à compléter] »'), ', et le manuel portera un avertissement en première page.'),
      h('div', { className: 'folder-list', style: { marginBottom: 16 } },
        confirmationManuel.map(c => h('div', { className: 'folder-item', key: c.titre },
          h('span', null, '⚠️'),
          h('span', { style: { flex: 1 } }, c.titre),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } },
            c.vides.length, ' ', pluriel(c.vides.length, 'passage'))
        ))
      ),
      h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-secondary', onClick: () => setConfirmationManuel(null) }, 'Revenir compléter'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => { setConfirmationManuel(null); genererManuel(); },
        }, 'Générer quand même')
      )
    ) : null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Manuel de procédures'),
        h('p', { className: 'subtitle' }, 'Répondez chapitre par chapitre : le manuel s’écrit à partir de vos réponses.')
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        h('button', { className: 'btn btn-secondary', onClick: demanderGeneration }, '⬇ Générer le manuel Word'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => { setIndex(premierIncomplet >= 0 ? premierIncomplet : 0); setEnRedaction(true); },
        }, rediges === 0 ? 'Commencer la rédaction →' : 'Reprendre la rédaction →')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: cx('stat-tile', rediges === chapitres.length ? 'vert' : 'orange') },
        h('div', { className: 'stat-tile-value' }, `${rediges}/${chapitres.length}`),
        h('div', { className: 'stat-tile-label' }, 'chapitres rédigés')
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, chapitres.filter(c => c.statut === 'a_reviser').length),
        h('div', { className: 'stat-tile-label' }, 'chapitres à réviser')
      ),
      h('div', { className: cx('stat-tile', chapitres.some(c => c.statut === 'manquant') ? 'rouge' : 'vert') },
        h('div', { className: 'stat-tile-value' }, chapitres.filter(c => c.statut === 'manquant').length),
        h('div', { className: 'stat-tile-label' }, 'chapitres manquants')
      )
    ),
    h(Card, { title: 'Plan du manuel', subtitle: 'Cliquez un chapitre pour le rédiger ou le reprendre.', icon: '📘', iconBg: '#E7F7ED', iconColor: '#16A34A', tone: 'bleu' },
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['#', 'Chapitre', 'Statut', 'Dernière mise à jour', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null, chapitres.map((c, i) => h('tr', {
            key: c.id, className: 'clickable',
            onClick: () => { setIndex(i); setEnRedaction(true); },
          },
            h('td', null, i + 1),
            h('td', { className: 'table-name' }, c.titre),
            h('td', null, h(Badge, { color: MANUEL_STATUT_COULEUR[c.statut] }, MANUEL_STATUT_LABEL[c.statut])),
            h('td', null, c.derniereMaj ? formatDate(c.derniereMaj) : '—'),
            h('td', { className: 'td-action' }, h('button', {
              className: 'row-open-btn', 'aria-label': 'Rédiger ce chapitre', title: 'Rédiger ce chapitre',
              onClick: e => { e.stopPropagation(); setIndex(i); setEnRedaction(true); },
            }, '→'))
          )))
        )
      )
    )
  );
}

const CARTO_ETAPES = ['Portefeuille', 'Analyses motivées', 'Contrôles', 'Conclusion', 'Validation'];

const CARTO_PARAGRAPHE_STYLE = { fontSize: 13.3, color: 'var(--text)', lineHeight: 1.7, margin: '0 0 10px' };

function CartographieRisques({ onBack, showToast, cabinetNom }) {
  const stats = cartographieStats();
  const pct = n => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const motiveesNormale = stats.analyseMotivee.filter(d => d.niveauRetenu === 'Normale');
  cabinetNom = cabinetNom || CABINET_SETTINGS_DEFAUT.nom;

  const [etape, setEtape] = useState(1);
  const sections = [h(React.Fragment, null,
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
      ) : null
    ),
    h(React.Fragment, null,
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
      )
    ),
    h(React.Fragment, null,
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
      )
    ),
    h(React.Fragment, null,
      h(DocSection, { n: '4', title: 'Conclusion générale', dark: true },
        h('p', { style: { ...CARTO_PARAGRAPHE_STYLE, margin: 0 } }, `Au vu des éléments qui précèdent, le profil de risque LBC-FT du cabinet apparaît globalement maîtrisé au regard de la nature de sa clientèle et de son activité. Sur ${stats.total} dossiers analysés, ${stats.analyseMotivee.length} ont fait l'objet d'une analyse motivée : ${motiveesNormale.length} classés en vigilance normale et ${stats.renforcee.length} classés en vigilance renforcée.${stats.nonAnalyses.length ? ` ${stats.nonAnalyses.length} dossier(s) restent à analyser.` : ''}`)
      )
    ),
    h(React.Fragment, null,
      h(DocSection, { n: '5', title: 'Validation', dark: true },
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Expert-comptable et référent LBC-FT'), h('span', { className: 'v' }, EXPERT_COMPTABLE.nom)),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date d’arrêté'), h('span', { className: 'v' }, formatDate(stats.dateArrete))),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dossiers couverts'), h('span', { className: 'v' }, `${stats.total} analysés, ${stats.nonAnalyses.length} restant à analyser`))
      ),
      h('div', { className: 'doc-runfoot' },
        h('span', null, `${cabinetNom} — Cartographie des risques LBC-FT`),
        h('span', null, `Cartographie arrêtée au ${formatDate(stats.dateArrete)}`)
      )
    )];

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Cartographie des risques'),
        h('p', { className: 'subtitle' }, `Étape ${etape} sur ${CARTO_ETAPES.length} — ${CARTO_ETAPES[etape - 1]} · données arrêtées au ${formatDate(stats.dateArrete)}`)
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Cartographie exportée au format PDF (démonstration)') }, '⬇ Exporter en PDF')
      )
    ),
    h(Stepper, { steps: CARTO_ETAPES, current: etape }),

    h('div', { className: 'fiche-vigilance carto-etape' },
      h('div', { className: 'fiche-vigilance-header' },
        h('div', null,
          h('div', { className: 'fiche-vigilance-eyebrow' }, 'Lutte anti-blanchiment · LBC-FT'),
          h('div', { className: 'fiche-vigilance-title' }, 'Cartographie des risques')
        ),
        h('div', { className: 'fiche-vigilance-date' }, h('div', { className: 'k doc-mono' }, "Date d'arrêté des données"), h('div', { className: 'v' }, formatDate(stats.dateArrete)))
      ),
      sections[etape - 1]
    ),

    h('div', { className: 'wizard-footer', style: { marginTop: 18 } },
      etape > 1
        ? h('button', { className: 'btn btn-secondary', onClick: () => setEtape(etape - 1) }, '← Étape précédente')
        : h('span'),
      etape < CARTO_ETAPES.length
        ? h('button', { className: 'btn btn-primary', onClick: () => setEtape(etape + 1) }, 'Étape suivante →')
        : h('button', { className: 'btn btn-primary', onClick: () => showToast('Cartographie arrêtée et datée (démonstration)') }, 'Arrêter la cartographie ✅')
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
      <p style="font-size:9.5pt; color:#666; margin-top:0;">Établie le ${today}, conformément aux règles d'indépendance du code de déontologie des professionnels de l'expertise comptable (articles 141 à 169 du décret n° 2012-432 du 30 mars 2012).</p>
      <p><b>Dossier concerné :</b> ${societe}</p>
      <p><b>Part du chiffre d'affaires du cabinet :</b> ${pourcent(partCA)}</p>
      <p><b>Seuil d'alerte fixé par le cabinet :</b> ${pourcent(record.seuil)}</p>
      <h2 style="font-size:13pt;">Mesures prises par le cabinet pour garantir son indépendance</h2>
      <p>${mesures.replace(/\n/g, '<br>')}</p>
      <p style="margin-top:30pt;">Le ${today}</p>
      <p><b>${EXPERT_COMPTABLE.nom}</b><br>Expert-comptable, référent LBC-FT du cabinet</p>
      <p style="margin-top:24pt; color:#999; font-size:8pt;">Document généré par ComplyEC.</p>
    `;
    downloadWordDoc(`Note_dependance_economique_${societe.replace(/\s+/g, '_')}.doc`, 'Note de dépendance économique', html);
    showToast('Document Word généré et téléchargé.');
  }

  const depassement = Number(partCA) - Number(record.seuil);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Dépendance économique'),
        h('p', { className: 'subtitle' }, `Note d’indépendance pour le dossier ${societe}.`)
      ),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour à la conformité'),
        h('button', { className: 'btn btn-primary', onClick: generer }, '⬇ Générer le document Word')
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: cx('stat-tile', depassement > 0 ? 'rouge' : 'vert') },
        h('div', { className: 'stat-tile-value' }, pourcent(partCA)),
        h('div', { className: 'stat-tile-label' }, 'du chiffre d’affaires du cabinet')
      ),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, pourcent(record.seuil)),
        h('div', { className: 'stat-tile-label' }, 'seuil d’alerte du cabinet')
      ),
      h('div', { className: cx('stat-tile', depassement > 0 ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, (depassement > 0 ? '+' : '') + depassement.toFixed(1) + ' pts'),
        h('div', { className: 'stat-tile-label' }, depassement > 0 ? 'au-dessus du seuil' : 'sous le seuil')
      )
    ),
    h('div', { className: 'grid-2' },
      h(Card, { title: 'Éléments de la note', subtitle: 'Ces champs alimentent directement le document Word.', icon: '⚖️', iconBg: '#FEF3E1', iconColor: '#B45309', tone: depassement > 0 ? 'orange' : 'vert' },
        h(FormSection, { icon: '🏢', title: 'Dossier concerné', ton: 'bleu' },
          h('div', { className: 'grid-2' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Nom de la société'),
              h('input', { className: 'form-input', value: societe, onChange: e => setSociete(e.target.value) })
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Part du chiffre d’affaires'),
              h('div', { className: 'input-with-btn' },
                h('input', { className: 'form-input', value: partCA, onChange: e => setPartCA(e.target.value) }),
                h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '%')
              )
            )
          )
        ),
        h(FormSection, { icon: '🛡️', title: 'Mesures de sauvegarde', ton: 'vert' },
          h('textarea', {
            className: 'form-textarea', style: { minHeight: 150 }, value: mesures,
            onChange: e => setMesures(e.target.value),
            placeholder: 'Décrivez les mesures prises pour préserver l’indépendance du cabinet…',
          }),
          h('div', { className: 'form-help' }, 'Reprises telles quelles dans la note générée.')
        )
      ),
      h('div', { className: 'result-panel' },
        h('div', { className: 'result-panel-eyebrow' }, 'Aperçu de la note'),
        h('div', { className: 'letter-preview', style: { marginTop: 10 } },
`NOTE DE DÉPENDANCE ÉCONOMIQUE

${settings.nom}
${settings.adresse}

Établie le ${formatDateLong(new Date().toISOString().slice(0, 10))}, conformément aux règles d'indépendance du code de déontologie des professionnels de l'expertise comptable (articles 141 à 169 du décret n° 2012-432 du 30 mars 2012).

Dossier concerné : ${societe}
Part du chiffre d'affaires du cabinet : ${pourcent(partCA)}
Seuil d'alerte fixé par le cabinet : ${pourcent(record.seuil)}

MESURES PRISES PAR LE CABINET POUR GARANTIR SON INDÉPENDANCE

${mesures}

${EXPERT_COMPTABLE.nom}
Expert-comptable, référent LBC-FT du cabinet`
        ),
        h('div', { className: 'info-box', style: { marginTop: 12 } }, 'ℹ️ ',
          'Le document Word reprend l’en-tête, le logo et la signature définis dans les paramètres du cabinet.')
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
      h('div', null, h('h1', null, 'Paramètres du cabinet'), h('p', { className: 'subtitle' }, 'Identité, seuils, rôles Tracfin, signature et connexions externes')),
      // Le bouton d'enregistrement vit dans l'en-tête : il reste visible quel
      // que soit le défilement, plutôt que d'être rogné en bas de page.
      h('button', { className: 'btn btn-primary', disabled: !dirty, onClick: save }, '💾 Enregistrer les paramètres')
    ),
    h('div', { className: 'grid-2' },
      h('div', null,
      h(Card, { title: 'Identité du cabinet', icon: '🏢', iconBg: '#E9F1FE', iconColor: '#2563EB' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Nom du cabinet'),
          h('input', { className: 'form-input', value: draft.nom, onChange: e => setDraft(prev => ({ ...prev, nom: e.target.value })) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Adresse'),
          h('input', { className: 'form-input', value: draft.adresse, onChange: e => setDraft(prev => ({ ...prev, adresse: e.target.value })) })
        ),
        h('div', { className: 'grid-2', style: { gap: 16 } },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Téléphone'),
            h('input', { className: 'form-input', value: draft.telephone, onChange: e => setDraft(prev => ({ ...prev, telephone: e.target.value })) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Seuil de dépendance'),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('input', {
                className: 'form-input', type: 'number', min: 1, max: 100, step: 1, style: { maxWidth: 92 },
                value: draft.seuilDependance,
                onChange: e => setDraft(prev => ({ ...prev, seuilDependance: e.target.value === '' ? '' : Number(e.target.value) })),
              }),
              h('span', { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-muted)' } }, '% du CA')
            )
          )
        ),
        h('div', { className: 'grid-2', style: { gap: 16 } },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Révision des lettres de mission'),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('input', {
                className: 'form-input', type: 'number', min: 1, max: 120, step: 1, style: { maxWidth: 92 },
                value: draft.ldmRevisionMois,
                onChange: e => setDraft(prev => ({ ...prev, ldmRevisionMois: e.target.value === '' ? '' : Number(e.target.value) })),
              }),
              h('span', { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-muted)' } }, 'mois')
            )
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Sessions LBC-FT par an'),
            h('input', {
              className: 'form-input', type: 'number', min: 0, max: 12, step: 1, style: { maxWidth: 92 },
              value: draft.sessionsLbcftParAn,
              onChange: e => setDraft(prev => ({ ...prev, sessionsLbcftParAn: e.target.value === '' ? '' : Number(e.target.value) })),
            })
          )
        ),
        h('div', { className: 'form-help', style: { margin: '-4px 0 16px' } },
          'Aucun de ces trois chiffres n’est imposé par un texte : ce sont les règles que le cabinet se donne. Ils servent partout dans le logiciel, manuel de procédures compris.'),
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
          h('div', { className: 'form-help', style: { marginTop: 6 } }, 'Utilisé sur les documents et e-mails générés.')
        )
      ),
        h(Card, { title: 'Déclarant et correspondant Tracfin', subtitle: 'Deux rôles distincts, exigés par l’article R. 561-23.', icon: '🛰️', iconBg: '#FDECEC', iconColor: '#DC2626', style: { marginTop: 18 } },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Déclarant — signe les déclarations de soupçon'),
            h('input', { className: 'form-input', value: draft.declarantTracfin || '', onChange: e => setDraft(prev => ({ ...prev, declarantTracfin: e.target.value })) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Correspondant — répond aux demandes de Tracfin'),
            h('input', { className: 'form-input', value: draft.correspondantTracfin || '', onChange: e => setDraft(prev => ({ ...prev, correspondantTracfin: e.target.value })) })
          ),
          h('label', { className: 'checkbox-row' },
            h('input', { type: 'checkbox', checked: Boolean(draft.tracfinDeclareAuService), onChange: e => setDraft(prev => ({ ...prev, tracfinDeclareAuService: e.target.checked })) }),
            h('span', null, 'Ces désignations ont été communiquées à Tracfin et au Conseil de l’Ordre')
          ),
          h('div', { className: 'form-help', style: { marginTop: 8 } },
            'L’article R. 561-23 impose aussi de communiquer ces identités à Tracfin et à l’autorité de contrôle, et de signaler tout changement.')
        ),
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
  );
}
