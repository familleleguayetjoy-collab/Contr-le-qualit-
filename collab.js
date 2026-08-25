// ComplyEC — Écrans du module Collaborateur
'use strict';

const COLLABORATEUR_CONNECTE = collaborateur('julie');

function mesAnomaliesList() { return ANOMALIES.filter(a => a.collaborateur === COLLABORATEUR_CONNECTE.id); }
function mesDossiersList() { return CLIENTS.filter(c => c.collaborateur === COLLABORATEUR_CONNECTE.id); }

// ============================================================ 0. Vue d'ensemble

function CollabOverview({ navigateCollab, showToast }) {
  const mesDossiers = mesDossiersList();
  const mesAnomalies = mesAnomaliesList();

  const categoriesPortefeuille = CATEGORIES_ANOMALIES
    .map(cat => ({ ...cat, count: mesAnomalies.filter(a => a.categorie === cat.code).length }))
    .filter(c => c.count > 0);

  const dossiersAttention = mesDossiers
    .map(c => ({ client: c, count: mesAnomalies.filter(a => a.dossier === c.id).length }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const vigilanceALancer = mesDossiers.filter(c => DOSSIERS_LBCFT.find(d => d.dossier === c.id).statut === 'a_lancer');
  const mesRelancesEnAttente = relancesList().filter(r => r.collaborateur === COLLABORATEUR_CONNECTE.id && r.statut !== 'termine').slice(0, 5);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Bonjour Julie 👋'), h('p', { className: 'subtitle' }, "Vue d'ensemble de votre portefeuille"))
    ),
    h('div', { className: 'grid-2', style: { marginBottom: 18 } },
      h(Card, { title: 'Anomalies par catégorie', icon: '📋', iconBg: '#E9F1FE', iconColor: '#2563EB',
        footer: categoriesPortefeuille.length > 0 ? h('button', { className: 'card-link', onClick: () => navigateCollab('dossiers', 'categories') }, 'Voir le détail →') : null },
        categoriesPortefeuille.length > 0 ? categoriesPortefeuille.map(c => h('div', { className: 'list-row', key: c.code },
          h('span', { className: 'list-row-label' }, h(Dot, { color: PRIORITE_COULEURS[c.priorite] }), c.label),
          h('span', { className: 'list-row-value' }, c.count)
        )) : h(EmptyDetail, { icon: '✅', label: 'Aucune anomalie sur votre portefeuille' })
      ),
      h(Card, { title: 'Dossiers nécessitant votre attention', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309',
        footer: dossiersAttention.length > 0 ? h('button', { className: 'card-link', onClick: () => navigateCollab('dossiers', 'dossier') }, 'Voir le détail →') : null },
        dossiersAttention.length > 0 ? dossiersAttention.map(d => h('div', { className: 'list-row', key: d.client.id },
          h('span', { className: 'list-row-label' }, d.client.nom),
          h('span', { className: 'list-row-value' }, d.count + ' problème' + (d.count > 1 ? 's' : ''))
        )) : h(EmptyDetail, { icon: '✅', label: 'Tous vos dossiers sont conformes' })
      )
    ),
    h('div', { className: 'grid-2' },
      h(Card, { title: 'Vigilance LBC-FT à traiter', icon: '🔍', iconBg: '#F1EAFE', iconColor: '#7C3AED' },
        vigilanceALancer.length > 0 ? vigilanceALancer.map(c => h('div', { className: 'list-row', key: c.id },
          h('span', { className: 'list-row-label' }, c.nom),
          h(Badge, { color: 'orange' }, '● Analyse à lancer')
        )) : h(EmptyDetail, { icon: '✅', label: 'Toutes les analyses sont à jour' })
      ),
      h(Card, { title: 'Relances en attente', icon: '📨', iconBg: '#FDECEC', iconColor: '#DC2626',
        footer: mesRelancesEnAttente.length > 0 ? h('button', { className: 'card-link', onClick: () => navigateCollab('relances') }, 'Voir le détail →') : null },
        mesRelancesEnAttente.length > 0 ? mesRelancesEnAttente.map(r => h('div', { className: 'list-row', key: r.id },
          h('span', { className: 'list-row-label' }, r.dossierInfo.nom + ' — ' + r.titre),
          h(StatutBadge, { statut: r.statut })
        )) : h(EmptyDetail, { icon: '✅', label: 'Aucune relance en attente' })
      )
    )
  );
}

// ============================================================ 1. Nouveau dossier

function CollabNouveauDossier({ showToast }) {
  const [resetKey, setResetKey] = useState(0);
  return h(ContractualisationWizard, {
    key: resetKey,
    showToast,
    collaborateurConnecte: COLLABORATEUR_CONNECTE,
    onFinish: () => setResetKey(k => k + 1),
  });
}

// ============================================================ 2. Dossiers existants (par catégories / par dossier)

function CollabDossiers({ sub, navigateCollab, showToast }) {
  const current = sub || 'categories';
  const [openedDossier, setOpenedDossier] = useState(null);

  if (openedDossier) {
    return h(DossierExistantDetail, { clientData: openedDossier, onBack: () => setOpenedDossier(null), showToast });
  }

  const tabs = [
    { key: 'categories', label: 'Par catégories' },
    { key: 'dossier', label: 'Par dossier' },
  ];

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Dossiers existants'), h('p', { className: 'subtitle' }, 'Votre portefeuille — anomalies et suivi, dossier par dossier'))
    ),
    h('div', { className: 'subnav' },
      tabs.map(t => h('button', { key: t.key, className: cx('subnav-btn', current === t.key && 'active'), onClick: () => navigateCollab('dossiers', t.key) }, t.label))
    ),
    current === 'categories' && h(CollabAnomaliesParCategorie, { showToast, onOpenDossier: setOpenedDossier }),
    current === 'dossier' && h(CollabAnomaliesParDossier, { showToast, onOpenDossier: setOpenedDossier })
  );
}

function CollabAnomaliesParCategorie({ showToast, onOpenDossier }) {
  const mesAnomalies = mesAnomaliesList();
  const categories = CATEGORIES_ANOMALIES.map(cat => {
    const items = mesAnomalies.filter(a => a.categorie === cat.code);
    const dossiers = new Set(items.map(a => a.dossier));
    return { ...cat, anomalies: items.length, dossiers: dossiers.size, items };
  }).filter(c => c.anomalies > 0);

  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);
  const pagination = usePagination(selectedCat ? selectedCat.items : [], 5);

  if (categories.length === 0) {
    return h('div', { className: 'card' }, h(EmptyDetail, { icon: '✅', label: 'Aucune anomalie sur votre portefeuille — tous vos dossiers sont conformes.' }));
  }

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'card' },
      h('div', { className: 'card-title' }, 'Anomalies de mon portefeuille — par catégorie'),
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Catégorie', 'Anomalies', 'Dossiers concernés', 'Priorité', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            categories.map(c => h('tr', { key: c.code, className: cx('clickable', selectedCat && selectedCat.code === c.code && 'row-selected'), onClick: () => { setSelectedCat(c); setSelectedAnomalie(null); } },
              h('td', { className: 'table-name' }, c.label),
              h('td', null, c.anomalies),
              h('td', null, c.dossiers, ' dossier', c.dossiers > 1 ? 's' : ''),
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
            h('thead', null, h('tr', null, ['Dossier', 'Dernière action'].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              pagination.pageItems.map(a => h('tr', { key: a.id, className: cx('clickable', selectedAnomalie && selectedAnomalie.id === a.id && 'row-selected'), onClick: () => setSelectedAnomalie(a) },
                h('td', { className: 'table-name' }, client(a.dossier).nom),
                h('td', null, a.dernierAction)
              ))
            )
          )
        ),
        h(Pagination, { pagination })
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(CollabAnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenDossier }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCat ? 'Sélectionnez un dossier pour voir le détail' : 'Sélectionnez une catégorie pour voir les dossiers concernés' }))
    )
  );
}

function CollabAnomaliesParDossier({ showToast, onOpenDossier }) {
  const mesDossiers = mesDossiersList();
  const mesAnomalies = mesAnomaliesList();
  const dossiers = mesDossiers.map(c => {
    const items = mesAnomalies.filter(a => a.dossier === c.id);
    const priorites = items.map(a => a.priorite);
    const prioriteMax = ['Critique', 'Haute', 'Moyenne', 'Faible'].find(p => priorites.includes(p)) || null;
    return { client: c, items, anomalies: items.length, priorite: prioriteMax };
  }).sort((a, b) => b.anomalies - a.anomalies);

  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'card' },
      h('div', { className: 'card-title' }, 'Mes dossiers — anomalies par dossier'),
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Dossier', 'Anomalies', 'Priorité', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            dossiers.map(d => h('tr', { key: d.client.id, className: cx('clickable', selectedDossier && selectedDossier.client.id === d.client.id && 'row-selected'), onClick: () => { setSelectedDossier(d); setSelectedAnomalie(null); } },
              h('td', { className: 'table-name' }, d.client.nom),
              h('td', null, d.anomalies),
              h('td', null, d.anomalies > 0 ? h(PriorityBadge, { priorite: d.priorite }) : h(Badge, { color: 'vert' }, '✓ Conforme')),
              h('td', null, h('button', { className: 'btn btn-secondary btn-sm', onClick: e => { e.stopPropagation(); onOpenDossier(d.client); } }, 'Ouvrir le dossier'))
            ))
          )
        )
      ),
      selectedDossier ? h('div', { style: { marginTop: 18 } },
        h('div', { className: 'card-title' }, `Anomalies du dossier ${selectedDossier.client.nom}`),
        selectedDossier.items.length > 0 ? selectedDossier.items.map(a => h('div', { className: 'list-row', key: a.id, style: { cursor: 'pointer' }, onClick: () => setSelectedAnomalie(a) },
          h('span', { className: 'list-row-label' }, h(Dot, { color: PRIORITE_COULEURS[a.priorite] }), a.titre),
          h('span', null, h(PriorityBadge, { priorite: a.priorite }), ' →')
        )) : h(EmptyDetail, { icon: '✅', label: 'Ce dossier est conforme, aucune anomalie.' })
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(CollabAnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenDossier }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedDossier ? 'Sélectionnez une anomalie pour voir le détail' : 'Sélectionnez un dossier pour voir le détail' }))
    )
  );
}

function CollabAnomalieDetailCard({ anomalie, showToast, onOpenDossier }) {
  const c = client(anomalie.dossier);
  return h('div', { className: 'card' },
    h('div', { className: 'detail-panel-header' }, h('span', { className: 'card-title', style: { margin: 0 } }, 'Détail de l’anomalie'), h(PriorityBadge, { priorite: anomalie.priorite })),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, anomalie.titre)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dossier'), h('div', { className: 'detail-field-value' }, c.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Description'), h('div', { className: 'detail-field-value' }, anomalie.description)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date détectée'), h('div', { className: 'detail-field-value' }, formatDate(anomalie.dateDetection))),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dernière action'), h('div', { className: 'detail-field-value' }, anomalie.dernierAction)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, "Commentaire de l'expert-comptable"), h('div', { className: 'detail-field-value' }, anomalie.commentaire)),
    h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 6 }, onClick: () => onOpenDossier(c) }, 'Ouvrir le dossier →')
  );
}

// ------------------------------------------------------ Détail d'un dossier (4 onglets)

function DossierExistantDetail({ clientData, onBack, showToast }) {
  const [tab, setTab] = useState('ldm');
  const tabs = [
    { key: 'ldm', label: 'Lettres de mission' },
    { key: 'pieces', label: 'Pièces justificatives' },
    { key: 'drive', label: 'Arborescence Drive' },
    { key: 'lbcft', label: 'Vigilance LBC-FT' },
  ];
  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, clientData.nom), h('p', { className: 'subtitle' }, `${clientData.forme} — ${clientData.dirigeant} — ${clientData.activite}`))
    ),
    h('div', { className: 'tabs' },
      tabs.map(t => h('button', { key: t.key, className: cx('tab-btn', tab === t.key && 'active'), onClick: () => setTab(t.key) }, t.label))
    ),
    tab === 'ldm' && h(TabLettresMission, { clientData, showToast }),
    tab === 'pieces' && h(TabPiecesJustificatives, { clientData, showToast }),
    tab === 'drive' && h(TabArborescenceDrive, { clientData }),
    tab === 'lbcft' && h(TabVigilanceLBCFT, { clientData, showToast })
  );
}

function TabLettresMission({ clientData, showToast }) {
  return h('div', { className: 'grid-2' },
    h(Card, { title: 'Lettre de mission en vigueur' },
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Statut'), h(Badge, { color: 'vert' }, '● Signée')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Type de mission'), h('span', { className: 'v' }, 'Présentation + social')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Signataire'), h('span', { className: 'v' }, 'Julien Lesnes')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Honoraires mensuels HT'), h('span', { className: 'v' }, '350 €')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Montant du bulletin'), h('span', { className: 'v' }, '18 €/salarié')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date de signature'), h('span', { className: 'v' }, '15/09/2025')),
      h('div', { style: { display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Téléchargement du PDF (démonstration)') }, '⬇ Télécharger le PDF'),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Nouvel avenant préparé (démonstration)') }, '📝 Générer un avenant')
      )
    ),
    h(Card, { title: 'Historique des versions' },
      h('div', { className: 'list-row' }, h('span', null, 'Lettre de mission — v1'), h(Badge, { color: 'vert' }, 'Signée le 15/09/2025')),
      h('div', { className: 'list-row' }, h('span', null, 'Devis initial'), h(Badge, { color: 'gris' }, 'Archivé'))
    )
  );
}

function TabPiecesJustificatives({ clientData, showToast }) {
  const anomaliesDossier = ANOMALIES.filter(a => a.dossier === clientData.id && (a.categorie === 'piece_expiree' || a.categorie === 'document_manquant'));
  const piecesStandard = [
    { label: "Pièce d'identité (CNI) du dirigeant", match: 'identité', statut: 'ok' },
    { label: 'KBIS de moins de 3 mois', match: 'kbis', statut: 'ok' },
    { label: 'Attestation PPE', match: 'ppe', statut: 'ok' },
    { label: 'Registre des bénéficiaires effectifs (RBE)', match: 'néficiaires', statut: 'ok' },
  ];
  anomaliesDossier.forEach(a => {
    const idx = piecesStandard.findIndex(p => a.titre.toLowerCase().includes(p.match));
    if (idx >= 0) piecesStandard[idx].statut = 'probleme';
  });
  return h(Card, { title: 'Pièces justificatives du dossier permanent' },
    piecesStandard.map((p, i) => h('div', { className: 'list-row', key: i },
      h('span', { className: 'list-row-label' }, h(Dot, { color: p.statut === 'ok' ? 'vert' : 'rouge' }), p.label),
      p.statut === 'ok' ? h(Badge, { color: 'vert' }, '✓ Conforme') : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Demande de mise à jour envoyée au client (démonstration)') }, 'Demander au client')
    ))
  );
}

function TabArborescenceDrive({ clientData }) {
  return h(Card, { title: `Arborescence Drive — ${clientData.nom}` },
    h(FolderTree, { nodes: DRIVE_TREE })
  );
}

function TabVigilanceLBCFT({ clientData, showToast }) {
  const [lancement, setLancement] = useState(false);
  const record = DOSSIERS_LBCFT.find(d => d.dossier === clientData.id);
  const aLancer = record.statut === 'a_lancer' && !lancement;

  if (aLancer) {
    return h(Card, { title: 'Vigilance LBC-FT' },
      h('div', { className: 'empty-detail', style: { padding: '30px 10px' } },
        h('div', { className: 'empty-icon' }, '🔍'),
        h('div', null, "Aucune analyse de vigilance n'a encore été réalisée pour ce dossier."),
        h('button', { className: 'btn btn-primary', style: { marginTop: 14 }, onClick: () => setLancement(true) }, "Lancer l'analyse →")
      )
    );
  }

  const niveau = lancement ? 'Faible' : record.niveauRetenu;
  return h(Card, { title: 'Vigilance LBC-FT' },
    h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Niveau proposé'), h(Badge, { color: niveau === 'Faible' ? 'vert' : 'rouge' }, niveau)),
    h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Niveau retenu'), h(Badge, { color: niveau === 'Faible' ? 'vert' : 'rouge' }, niveau)),
    h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dernière analyse'), h('span', { className: 'v' }, formatDate(record.derniereAnalyse))),
    h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 14 }, onClick: () => showToast('Analyse LBC-FT relancée (démonstration)') }, '🔄 Relancer une analyse')
  );
}

// ============================================================ 3. Note de synthèse annuelle

function CollabNoteSynthese({ showToast }) {
  const mesDossiers = mesDossiersList();
  const [selected, setSelected] = useState(null);

  if (selected) {
    return h(NoteSyntheseForm, { clientData: selected, onBack: () => setSelected(null), showToast });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Note de synthèse annuelle'), h('p', { className: 'subtitle' }, 'Préparez et transmettez la note de synthèse de fin de mission pour chacun de vos dossiers'))
    ),
    h('div', { className: 'card' },
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Dossier', 'Exercice', 'Statut', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            mesDossiers.map(c => {
              const bilan = BILAN_DOSSIERS.find(b => b.dossier === c.id);
              return h('tr', { key: c.id, className: 'clickable', onClick: () => setSelected(c) },
                h('td', { className: 'table-name' }, c.nom),
                h('td', null, '2025'),
                h('td', null, bilan ? h(Badge, { color: 'vert' }, '● Transmise le ' + formatDate(bilan.datePreparation)) : h(Badge, { color: 'orange' }, '● Brouillon à transmettre')),
                h('td', null, h('button', { className: 'btn btn-secondary btn-sm', onClick: e => { e.stopPropagation(); setSelected(c); } }, 'Ouvrir'))
              );
            })
          )
        )
      )
    )
  );
}

function NoteSyntheseForm({ clientData, onBack, showToast }) {
  const bilan = BILAN_DOSSIERS.find(b => b.dossier === clientData.id);
  const [champs, setChamps] = useState(() => ({
    rentabilite: bilan ? bilan.rentabilite.label : '',
    problemes: bilan ? (bilan.problemes.description || bilan.problemes.label) : '',
    continuite: bilan ? bilan.continuite.label : '',
    sujets: bilan ? bilan.sujets : '',
  }));

  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour à la liste'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, clientData.nom), h('p', { className: 'subtitle' }, 'Note de synthèse — Exercice 2025'))
    ),
    h(Card, {
      footer: h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 } },
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
        h('button', { className: 'btn btn-primary', onClick: () => { showToast('Note de synthèse transmise à l’expert-comptable (démonstration)'); onBack(); } }, "Transmettre à l'expert-comptable →")
      ) },
      bilan ? h(Badge, { color: 'vert' }, '● Déjà transmise le ' + formatDate(bilan.datePreparation)) : h(Badge, { color: 'orange' }, '● Brouillon non transmis'),
      h('div', { style: { marginTop: 14 } },
        NOTE_SYNTHESE_CHAMPS.map(f => h('div', { className: 'form-group', key: f.code },
          h('label', { className: 'form-label' }, f.label),
          h('textarea', { className: 'form-textarea', style: { minHeight: 60 }, value: champs[f.code], onChange: e => setChamps(prev => ({ ...prev, [f.code]: e.target.value })) })
        ))
      ),
      bilan && bilan.commentaireEC ? h('div', { className: 'comment-box', style: { marginTop: 6 } },
        h('div', { className: 'comment-box-title' }, "🧑‍💼 Réponse de l'expert-comptable"),
        h('p', null, bilan.commentaireEC),
        h('div', { className: 'comment-date' }, '📅 ', formatDate(bilan.dateCommentaireEC))
      ) : null
    )
  );
}

// ============================================================ 4. Relances et suivi

function CollabRelances({ showToast }) {
  const mesRelances = relancesList().filter(r => r.collaborateur === COLLABORATEUR_CONNECTE.id);
  const [statuts, setStatuts] = useState(() => Object.fromEntries(mesRelances.map(r => [r.id, r.statut])));
  const [selected, setSelected] = useState(null);

  function updateStatut(id, statut) { setStatuts(prev => ({ ...prev, [id]: statut })); showToast('Statut mis à jour (démonstration)'); }

  const aFaire = mesRelances.filter(r => statuts[r.id] === 'a_faire').length;
  const enCours = mesRelances.filter(r => statuts[r.id] === 'en_cours' || statuts[r.id] === 'en_retard').length;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Relances & suivi'), h('p', { className: 'subtitle' }, "Suivi des actions demandées par l'expert-comptable"))
    ),
    h('div', { className: 'counter-row' },
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '📨'), h('div', null, h('div', { className: 'counter-value' }, mesRelances.length), h('div', { className: 'counter-label' }, 'Demandes reçues'))),
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '⏰'), h('div', null, h('div', { className: 'counter-value' }, aFaire), h('div', { className: 'counter-label' }, 'À faire'))),
      h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '🔄'), h('div', null, h('div', { className: 'counter-value' }, enCours), h('div', { className: 'counter-label' }, 'En cours / en retard')))
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, "Relances demandées par l'expert-comptable"),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Client', 'Objet de la relance', 'Date demande EC', 'Statut', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              mesRelances.map(r => h('tr', { key: r.id, className: cx('clickable', selected && selected.id === r.id && 'row-selected'), onClick: () => setSelected(r) },
                h('td', { className: 'table-name' }, r.dossierInfo.nom),
                h('td', null, r.titre),
                h('td', null, formatDate(r.dateDemandeEC)),
                h('td', null, h('select', {
                  className: 'form-select', style: { width: 130 }, value: statuts[r.id],
                  onClick: e => e.stopPropagation(),
                  onChange: e => updateStatut(r.id, e.target.value),
                }, Object.entries(STATUT_LABELS).map(([k, v]) => h('option', { key: k, value: k }, v.label)))),
                h('td', null, h('button', { className: 'btn btn-secondary btn-sm', onClick: e => { e.stopPropagation(); setSelected(r); } }, 'Voir'))
              ))
            )
          )
        )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h('div', { className: 'card' },
          h('div', { className: 'detail-panel-header' }, h('span', { className: 'card-title', style: { margin: 0 } }, 'Détail de la relance'), h(StatutBadge, { statut: statuts[selected.id] })),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, selected.titre)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dossier'), h('div', { className: 'detail-field-value' }, selected.dossierInfo.nom)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date demande EC'), h('div', { className: 'detail-field-value' }, formatDate(selected.dateDemandeEC))),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Description'), h('div', { className: 'detail-field-value' }, selected.description)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, "Commentaire de l'expert-comptable"), h('div', { className: 'detail-field-value' }, selected.commentaire)),
          h('div', { className: 'form-group', style: { marginTop: 4 } },
            h('label', { className: 'form-label' }, 'Mettre à jour le statut'),
            h('select', { className: 'form-select', value: statuts[selected.id], onChange: e => updateStatut(selected.id, e.target.value) },
              Object.entries(STATUT_LABELS).map(([k, v]) => h('option', { key: k, value: k }, v.label))
            )
          ),
          h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 10 }, onClick: () => updateStatut(selected.id, 'termine') }, '✅ Marquer comme régularisé')
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez une relance pour voir le détail' }))
      )
    ),
    h('div', { className: 'form-help', style: { marginTop: 10 } }, 'ℹ️ Le statut est renseigné par le collaborateur et visible par l’expert-comptable en temps réel.')
  );
}
