// ComplyEC — Écrans du module Collaborateur
'use strict';

const COLLABORATEUR_CONNECTE = collaborateur('julie');

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

// ============================================================ 2. Dossiers existants

function CollabDossiersExistants({ showToast }) {
  const mesDossiers = CLIENTS.filter(c => c.collaborateur === COLLABORATEUR_CONNECTE.id);
  const [selected, setSelected] = useState(null);

  if (selected) {
    return h(DossierExistantDetail, { clientData: selected, onBack: () => setSelected(null), showToast });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Dossiers existants'), h('p', { className: 'subtitle' }, 'Vos dossiers clients — lettres de mission, pièces, Drive, vigilance LBC-FT et supervision'))
    ),
    h('div', { className: 'card' },
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Dossier', 'Forme juridique', 'Dirigeant', 'Activité', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            mesDossiers.map(c => h('tr', { key: c.id, className: 'clickable', onClick: () => setSelected(c) },
              h('td', { className: 'table-name' }, c.nom),
              h('td', null, c.forme),
              h('td', null, c.dirigeant),
              h('td', null, c.activite),
              h('td', null, h('button', { className: 'btn btn-secondary btn-sm', onClick: e => { e.stopPropagation(); setSelected(c); } }, 'Ouvrir'))
            ))
          )
        )
      )
    )
  );
}

function DossierExistantDetail({ clientData, onBack, showToast }) {
  const [tab, setTab] = useState('ldm');
  const tabs = [
    { key: 'ldm', label: 'Lettres de mission' },
    { key: 'pieces', label: 'Pièces justificatives' },
    { key: 'drive', label: 'Arborescence Drive' },
    { key: 'lbcft', label: 'Vigilance LBC-FT' },
    { key: 'supervision', label: 'Supervision annuelle' },
  ];
  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour aux dossiers'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, clientData.nom), h('p', { className: 'subtitle' }, `${clientData.forme} — ${clientData.dirigeant} — ${clientData.activite}`))
    ),
    h('div', { className: 'tabs' },
      tabs.map(t => h('button', { key: t.key, className: cx('tab-btn', tab === t.key && 'active'), onClick: () => setTab(t.key) }, t.label))
    ),
    tab === 'ldm' && h(TabLettresMission, { clientData, showToast }),
    tab === 'pieces' && h(TabPiecesJustificatives, { clientData, showToast }),
    tab === 'drive' && h(TabArborescenceDrive, { clientData }),
    tab === 'lbcft' && h(TabVigilanceLBCFT, { clientData, showToast }),
    tab === 'supervision' && h(TabSupervisionAnnuelle, { clientData, showToast })
  );
}

function TabLettresMission({ clientData, showToast }) {
  return h('div', { className: 'grid-2' },
    h(Card, { title: 'Lettre de mission en vigueur' },
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Statut'), h(Badge, { color: 'vert' }, '● Signée')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Type de mission'), h('span', { className: 'v' }, 'Présentation + social')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Signataire'), h('span', { className: 'v' }, 'Julien Lesnes')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Honoraires mensuels HT'), h('span', { className: 'v' }, '350 €')),
      h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date de signature'), h('span', { className: 'v' }, '15/09/2025')),
      h('div', { style: { display: 'flex', gap: 10, marginTop: 14 } },
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
    { label: "Pièce d'identité du dirigeant", statut: 'ok' },
    { label: 'KBIS de moins de 3 mois', statut: 'ok' },
    { label: 'Attestation PPE', statut: 'ok' },
    { label: 'Registre des bénéficiaires effectifs', statut: 'ok' },
    { label: 'RIB professionnel', statut: 'ok' },
  ];
  anomaliesDossier.forEach(a => {
    const idx = piecesStandard.findIndex(p => a.titre.toLowerCase().includes(p.label.toLowerCase().split(' ')[0]));
    if (idx >= 0) piecesStandard[idx].statut = 'probleme';
    else piecesStandard.push({ label: a.titre, statut: 'probleme' });
  });
  return h(Card, { title: 'Pièces justificatives du dossier permanent' },
    piecesStandard.map((p, i) => h('div', { className: 'list-row', key: i },
      h('span', { className: 'list-row-label' }, h(Dot, { color: p.statut === 'ok' ? 'vert' : 'rouge' }), p.label),
      p.statut === 'ok' ? h(Badge, { color: 'vert' }, '✓ Conforme') : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Demande de mise à jour envoyée au client (démonstration)') }, 'Demander au client')
    ))
  );
}

function TabArborescenceDrive({ clientData }) {
  const folders = [
    { name: '01_Comptable', files: 24 },
    { name: '02_Juridique', files: 8 },
    { name: '03_Social', files: 15 },
    { name: '04_Dossier annuel', files: 6 },
  ];
  return h(Card, { title: `Arborescence Drive — ${clientData.nom}` },
    h('div', { className: 'folder-list' },
      folders.map(f => h('div', { className: 'folder-item', key: f.name },
        h('span', null, '📁'), h('span', { style: { flex: 1 } }, f.name), h('span', { className: 'form-help', style: { margin: 0 } }, f.files, ' fichiers')
      ))
    )
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

function TabSupervisionAnnuelle({ clientData, showToast }) {
  const bilan = BILAN_DOSSIERS.find(b => b.dossier === clientData.id);
  const [champs, setChamps] = useState(() => ({
    rentabilite: bilan ? bilan.rentabilite.label : '',
    problemes: bilan ? bilan.problemes.label : '',
    continuite: bilan ? bilan.continuite.label : '',
    sujets: bilan ? bilan.sujets : '',
  }));

  return h(Card, { title: `Note de synthèse — Exercice 2025`,
    footer: h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 } },
      h('button', { className: 'btn btn-secondary', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
      h('button', { className: 'btn btn-primary', onClick: () => showToast('Note de synthèse transmise à l’expert-comptable (démonstration)') }, "Transmettre à l'expert-comptable →")
    ) },
    bilan ? h(Badge, { color: 'vert' }, '● Préparée le ', formatDate(bilan.datePreparation)) : h(Badge, { color: 'orange' }, '● Brouillon non transmis'),
    h('div', { style: { marginTop: 14 } },
      NOTE_SYNTHESE_CHAMPS.map(f => h('div', { className: 'form-group', key: f.code },
        h('label', { className: 'form-label' }, f.label),
        h('textarea', { className: 'form-textarea', style: { minHeight: 50 }, value: champs[f.code], onChange: e => setChamps(prev => ({ ...prev, [f.code]: e.target.value })) })
      ))
    ),
    bilan ? h('div', { className: 'comment-box', style: { marginTop: 6 } },
      h('div', { className: 'comment-box-title' }, "🧑‍💼 Commentaire de l'expert-comptable"),
      h('p', null, bilan.commentaireEC),
      h('div', { className: 'comment-date' }, '📅 ', formatDate(bilan.dateCommentaireEC))
    ) : null
  );
}

// ============================================================ 3. Relances et suivi

function CollabRelances({ showToast }) {
  const mesRelances = relancesList().filter(r => r.collaborateur === COLLABORATEUR_CONNECTE.id);
  const [statuts, setStatuts] = useState(() => Object.fromEntries(mesRelances.map(r => [r.id, r.statut])));

  function updateStatut(id, statut) { setStatuts(prev => ({ ...prev, [id]: statut })); showToast('Statut mis à jour (démonstration)'); }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Relances & suivi'), h('p', { className: 'subtitle' }, "Suivi des actions demandées par l'expert-comptable"))
    ),
    h('div', { className: 'card' },
      h('div', { className: 'card-title' }, "Relances demandées par l'expert-comptable"),
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['Client', 'Objet de la relance', 'Date demande EC', 'Statut', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null,
            mesRelances.map(r => h('tr', { key: r.id },
              h('td', { className: 'table-name' }, r.dossierInfo.nom),
              h('td', null, r.titre),
              h('td', null, formatDate(r.dateDemandeEC)),
              h('td', null, h('select', { className: 'form-select', style: { width: 130 }, value: statuts[r.id], onChange: e => updateStatut(r.id, e.target.value) },
                Object.entries(STATUT_LABELS).map(([k, v]) => h('option', { key: k, value: k }, v.label))
              )),
              h('td', null, h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast('Détail affiché (démonstration)') }, 'Voir'))
            ))
          )
        )
      )
    ),
    h('div', { className: 'form-help', style: { marginTop: 10 } }, 'ℹ️ Le statut est renseigné par le collaborateur et visible par l’expert-comptable en temps réel.')
  );
}
