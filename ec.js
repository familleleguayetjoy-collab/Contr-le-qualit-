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

function ECBilan({ showToast }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return h(BilanDetail, { row: selected, onBack: () => setSelected(null), showToast });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Supervision annuelle'), h('p', { className: 'subtitle' }, 'Validation de la note de synthèse de fin de mission')),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select' }, h('option', null, 'Exercice : 2025')),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Export généré (démonstration)') }, '⬇ Exporter')
      )
    ),
    h('div', { className: 'card' },
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Dossier', 'Exercice', 'Collaborateur', 'Note préparée le', 'Statut', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            BILAN_DOSSIERS.map(b => h('tr', { key: b.id, className: 'clickable', onClick: () => setSelected(b) },
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
  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour à la liste'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, `${c.nom} — Exercice ${row.exercice}`), h('p', { className: 'subtitle' }, `Préparé par ${collab.nom} le ${formatDate(row.datePreparation)}`))
    ),
    h('div', { className: 'stat-icon-row' },
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '📈'), h('div', { className: 'stat-label' }, 'Rentabilité du dossier'), h(Badge, { color: rentColor }, row.rentabilite.label)),
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '⚠️'), h('div', { className: 'stat-label' }, 'Problèmes comptables'), h(Badge, { color: row.problemes.count > 0 ? 'orange' : 'vert' }, row.problemes.label)),
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '✅'), h('div', { className: 'stat-label' }, "Continuité d'exploitation"), h(Badge, { color: contColor }, row.continuite.label)),
      h('div', { className: 'stat-icon-card' }, h('span', { className: 'icon' }, '💬'), h('div', { className: 'stat-label' }, 'Sujets à évoquer lors du bilan'), h('div', { className: 'stat-value' }, row.sujets))
    ),
    h('div', { className: 'grid-2' },
      h('div', { className: 'comment-box' },
        h('div', { className: 'comment-box-title' }, "🧑‍💼 Commentaire de l'expert-comptable"),
        h('p', null, row.commentaireEC),
        h('div', { className: 'comment-date' }, '📅 ', formatDate(row.dateCommentaireEC))
      ),
      h('div', { className: 'comment-box' },
        h('div', { className: 'comment-box-title' }, '🧑 Commentaire du collaborateur comptable'),
        h('p', null, row.commentaireCollab),
        h('div', { className: 'comment-date' }, '📅 ', formatDate(row.dateCommentaireCollab))
      )
    ),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 20 } },
      h('button', { className: 'btn btn-primary', onClick: () => { showToast('Supervision validée et archivée (démonstration)'); onBack(); } }, 'Valider et archiver ✅')
    )
  );
}

// ============================================================ 3. Supervision des anomalies

function ECAnomalies({ sub, navigateEc, showToast }) {
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
    current === 'categories' && h(AnomaliesParCategorie, { showToast }),
    current === 'collaborateur' && h(AnomaliesParCollaborateur, { showToast }),
    current === 'dossier' && h(AnomaliesParDossier, { showToast }),
    current === 'relances' && h(RelancesSuivi, { showToast })
  );
}

function AnomaliesParCategorie({ showToast }) {
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
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCat ? 'Sélectionnez un dossier pour voir le détail' : 'Sélectionnez une catégorie pour voir les dossiers concernés' }))
    )
  );
}

function AnomaliesParCollaborateur({ showToast }) {
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
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCollab ? 'Sélectionnez une anomalie pour voir le détail' : 'Sélectionnez un collaborateur pour voir ses anomalies' }))
    )
  );
}

function AnomaliesParDossier({ showToast }) {
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
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedDossier ? "Sélectionnez une anomalie pour voir le détail" : 'Sélectionnez un dossier pour voir ses anomalies' }))
    )
  );
}

function AnomalieDetailCard({ anomalie, showToast }) {
  const c = client(anomalie.dossier);
  const collab = collaborateur(anomalie.collaborateur);
  return h('div', { className: 'card' },
    h('div', { className: 'detail-panel-header' }, h('span', { className: 'card-title', style: { margin: 0 } }, 'Détail de l’anomalie'), h(PriorityBadge, { priorite: anomalie.priorite })),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, anomalie.titre)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dossier'), h('div', { className: 'detail-field-value' }, c.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Description'), h('div', { className: 'detail-field-value' }, anomalie.description)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date détectée'), h('div', { className: 'detail-field-value' }, formatDate(anomalie.dateDetection))),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Collaborateur en charge'), h('div', { className: 'detail-field-value' }, collab.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dernière action'), h('div', { className: 'detail-field-value' }, anomalie.dernierAction)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Commentaire'), h('div', { className: 'detail-field-value' }, anomalie.commentaire)),
    h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 6 }, onClick: () => showToast('Demande de régularisation envoyée au collaborateur (démonstration)') }, 'Demander au collaborateur de régulariser 📨')
  );
}

function RelancesSuivi({ showToast }) {
  const relances = relancesList();
  const [selected, setSelected] = useState(null);
  const aFaire = relances.filter(r => r.statut === 'a_faire').length;
  const enAttente = relances.filter(r => r.statut === 'en_cours' || r.statut === 'en_retard').length;

  return h('div', null,
    h('div', { className: 'counter-row' },
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '📧'), h('div', null, h('div', { className: 'counter-value' }, relances.length), h('div', { className: 'counter-label' }, 'Demandes de régularisation envoyées'))),
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '⏰'), h('div', null, h('div', { className: 'counter-value' }, aFaire), h('div', { className: 'counter-label' }, 'Demandes à faire'))),
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '🔄'), h('div', null, h('div', { className: 'counter-value' }, enAttente), h('div', { className: 'counter-label' }, 'Faites, non régularisées')))
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, 'Suivi des demandes de régularisation adressées aux collaborateurs'),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Anomalie', 'Collaborateur', 'Date demande EC', 'Statut régularisation', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              relances.map(r => h('tr', { key: r.id, className: cx('clickable', selected && selected.id === r.id && 'row-selected'), onClick: () => setSelected(r) },
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

// ============================================================ 4. Conformité cabinet

function ECConformite({ showToast }) {
  const cc = CONFORMITE_CABINET;
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
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, d.partHonoraires, ' des honoraires (seuil ', d.seuil, ')')
        ))
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
