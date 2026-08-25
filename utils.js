// ComplyEC — fonctions utilitaires et composants UI partagés
'use strict';

const h = React.createElement;
const { useState, useEffect, useMemo, useRef } = React;

function cx(...args) { return args.filter(Boolean).join(' '); }

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateLong(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function moisDepuis(iso) {
  const d = new Date(iso + 'T00:00:00');
  const now = new Date('2026-07-14T00:00:00');
  return Math.max(0, Math.round((now - d) / (1000 * 60 * 60 * 24 * 30.44)));
}

const PRIORITE_EMOJI = { Critique: '🔴', Haute: '🟠', Moyenne: '🟡', Faible: '🟢' };

// ------------------------------------------------------------- Toast (global)

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  function showToast(message) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(message);
    timerRef.current = setTimeout(() => setToast(null), 3200);
  }
  const node = toast ? h('div', { className: 'toast' }, h('span', null, '✅'), toast) : null;
  return [node, showToast];
}

// ------------------------------------------------------------------- Badges

function Badge({ color = 'gris', children }) {
  return h('span', { className: cx('badge', color) }, children);
}

function PriorityBadge({ priorite }) {
  const color = PRIORITE_COULEURS[priorite] || 'gris';
  return h('span', { className: cx('badge', color) }, PRIORITE_EMOJI[priorite] || '', ' ', priorite);
}

function StatutBadge({ statut }) {
  const info = STATUT_LABELS[statut] || { label: statut, couleur: 'gris' };
  return h('span', { className: cx('badge', info.couleur) }, info.label);
}

function Dot({ color }) { return h('span', { className: cx('dot', color) }); }

function initialesDe(prenom, nom) {
  return ((prenom || '?')[0] + (nom || '?')[0]).toUpperCase();
}

// -------------------------------------------------------------------- Card

function Card(props) {
  const { title, icon, iconBg, iconColor, children, footer, style } = props;
  return h('div', { className: 'card', style },
    title ? h('div', { className: 'card-title' },
      icon ? h('span', { className: 'card-icon', style: { background: iconBg || 'var(--blue-light)', color: iconColor || 'var(--blue)' } }, icon) : null,
      title
    ) : null,
    children,
    footer || null
  );
}

// --------------------------------------------------------------- Empty state

function EmptyDetail({ icon = '👈', label = 'Sélectionnez une ligne pour voir le détail' }) {
  return h('div', { className: 'empty-detail' }, h('div', { className: 'empty-icon' }, icon), h('div', null, label));
}

// ------------------------------------------------------------ Fiche de vigilance

function niveauVigilanceCouleur(niveau) {
  return niveau === 'Renforcée' ? 'rouge' : niveau === 'Allégée' ? 'vert' : 'jaune';
}

function niveauCritereCouleur(niveau) {
  return niveau === 'Élevé' ? 'rouge' : niveau === 'Moyen' ? 'jaune' : 'vert';
}

// Section numérotée réutilisable pour les documents générés (fiche de
// vigilance = variante claire, cartographie des risques = variante sombre).
function DocSection({ n, title, note, dark, children }) {
  return h('div', { className: dark ? 'doc-section-dark' : 'doc-section' },
    h('div', { className: 'doc-section-head' },
      h('div', { className: 'doc-badge' }, n),
      h('h3', null, title),
      note ? h('span', { className: 'doc-section-note' }, note) : null
    ),
    h('div', { className: 'doc-section-body' }, children)
  );
}

// Échelle à 3 points (allégée / normale / renforcée) : le niveau retenu
// s'affiche en plus grand et plus saturé, les deux autres restent en points
// discrets — reprend l'indicateur du gabarit source.
function DocDotScale({ niveau }) {
  const ordre = [['Allégée', 'allegee'], ['Normale', 'normale'], ['Renforcée', 'renforcee']];
  return h('div', { className: 'doc-dot-scale' },
    ordre.map(([label, cls]) => h('span', { key: cls, className: cx('dot', cls, niveau === label && 'active') }))
  );
}

// Reproduit le format "fiche de vigilance" du cabinet : identification du
// client, classification NPLAB à 4 critères obligatoires, opérations
// particulières relevées, puis conclusion avec niveau calculé automatiquement
// et niveau retenu (qui peut différer, sur justification motivée).
function FicheVigilance({ clientData, record, referent }) {
  const c = record.classification;
  return h('div', { className: 'fiche-vigilance' },
    h('div', { className: 'fiche-vigilance-header' },
      h('div', null,
        h('div', { className: 'fiche-vigilance-eyebrow' }, 'Lutte anti-blanchiment · LBC-FT'),
        h('div', { className: 'fiche-vigilance-title' }, 'Fiche de vigilance')
      ),
      h('div', { className: 'fiche-vigilance-date' },
        h('div', { className: 'k doc-mono' }, "Date de l'analyse"),
        h('div', { className: 'v' }, formatDate(record.derniereAnalyse))
      )
    ),

    h(DocSection, { n: '01', title: 'Identification du client' },
      h('div', { className: 'field-tile-row cols-2' },
        h('div', { className: 'field-tile' }, h('div', { className: 'ft-label doc-mono' }, 'Client'), h('div', { className: 'ft-value' }, clientData.nom)),
        h('div', { className: 'field-tile' }, h('div', { className: 'ft-label doc-mono' }, 'Adresse du siège'), h('div', { className: 'ft-value' }, record.adresse || 'France'))
      ),
      h('div', { className: 'field-tile-row cols-3' },
        h('div', { className: 'field-tile' }, h('div', { className: 'ft-label doc-mono' }, 'Forme juridique'), h('div', { className: 'ft-value' }, clientData.forme || '—')),
        h('div', { className: 'field-tile' }, h('div', { className: 'ft-label doc-mono' }, 'SIRET'), h('div', { className: 'ft-value' }, clientData.siret || '—')),
        h('div', { className: 'field-tile' }, h('div', { className: 'ft-label doc-mono' }, 'Activité / Code NAF'), h('div', { className: 'ft-value' }, clientData.activite))
      )
    ),

    h(DocSection, { n: '02', title: 'Classification NPLAB', note: '4 critères obligatoires' },
      h('div', { className: 'classification-grid' },
        NPLAB_CRITERES.map(crit => h('div', { className: cx('classification-card', 'niv-' + c[crit.code]), key: crit.code },
          h('div', { className: 'cc-label' }, crit.label),
          h('div', { className: 'cc-value' }, c[crit.code])
        ))
      )
    ),

    (record.operationsParticulieres && record.operationsParticulieres.length > 0) ? h(DocSection, { n: '03', title: 'Opérations particulières' },
      record.operationsParticulieres.map((op, i) => h('div', { className: 'callout-row', key: i }, op))
    ) : null,

    h(DocSection, { n: '04', title: 'Conclusion et niveau retenu' },
      h('div', { className: 'doc-conclusion-grid' },
        h('div', { className: 'doc-conclusion-tile' },
          h('div', { className: 'k doc-mono' }, 'Niveau calculé automatiquement'),
          h('div', { className: 'v' }, record.niveauCalcule)
        ),
        h('div', { className: cx('doc-conclusion-tile', 'retenu', 'niv-' + record.niveauRetenu) },
          h('div', null,
            h('div', { className: 'k doc-mono' }, 'Niveau de vigilance retenu'),
            h('div', { className: 'v' }, record.niveauRetenu)
          ),
          h(DocDotScale, { niveau: record.niveauRetenu })
        )
      ),
      h('p', { style: { marginTop: 16, fontSize: 13.3, color: 'var(--text)', lineHeight: 1.7 } }, record.justification),
      h('div', { className: 'kv-line', style: { marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 } },
        h('span', { className: 'k' }, 'Expert-comptable et référent LBC-FT'),
        h('span', { className: 'v' }, referent || EXPERT_COMPTABLE.nom)
      )
    )
  );
}

// ------------------------------------------------------------------ Pagination

function usePagination(items, pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);
  return {
    pageItems, page: clampedPage, totalPages, setPage,
    rangeLabel: items.length === 0 ? '0 résultat' : `${start + 1}-${Math.min(start + pageSize, items.length)} sur ${items.length}`,
  };
}

function Pagination({ pagination }) {
  if (pagination.totalPages <= 1) return null;
  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
  return h('div', { className: 'pagination-row' },
    h('span', null, pagination.rangeLabel),
    h('div', { className: 'pagination-btns' },
      pages.map(p => h('button', {
        key: p,
        className: cx('page-btn', p === pagination.page && 'active'),
        onClick: () => pagination.setPage(p),
      }, p))
    )
  );
}

// ---------------------------------------------------------------- Stepper

function Stepper({ steps, current }) {
  const pct = Math.round(((current - 1) / (steps.length - 1)) * 100);
  return h(React.Fragment, null,
    h('div', { className: 'stepper' },
      steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const isCurrent = idx === current;
        return h(React.Fragment, { key: idx },
          h('div', { className: 'stepper-step' },
            h('div', { className: cx('stepper-circle', done && 'done', isCurrent && 'current') }, done ? '✓' : idx),
            h('div', { className: cx('stepper-label', (done || isCurrent) && 'active') }, label)
          ),
          i < steps.length - 1 ? h('div', { className: cx('stepper-line', done && 'done') }) : null
        );
      })
    ),
    h('div', { className: 'stepper-mobile' },
      h('div', { className: 'stepper-mobile-label' }, `Étape ${current} sur ${steps.length} — ${steps[current - 1]}`),
      h('div', { className: 'stepper-mobile-track' }, h('div', { className: 'stepper-mobile-fill', style: { width: pct + '%' } }))
    )
  );
}

// -------------------------------------------------------------- Folder tree

function FolderTree({ nodes, filesInfo }) {
  return h('div', { className: 'folder-tree' },
    nodes.map((node, i) => h(FolderTreeNode, { key: i, node, filesInfo }))
  );
}

function FolderTreeNode({ node, filesInfo }) {
  const isString = typeof node === 'string';
  const name = isString ? node : node.name;
  const children = isString ? null : node.children;
  const isLeaf = !children || children.length === 0;
  const files = filesInfo && filesInfo[name];
  return h('div', { className: 'folder-tree-node' },
    h('div', { className: cx('folder-tree-row', isLeaf && 'leaf') },
      h('span', { className: 'check' }, isLeaf ? '📄' : '📁'),
      h('span', { style: { flex: 1 } }, name),
      files ? h('span', { className: 'form-help', style: { margin: 0 } }, files, ' fichiers') : (!isLeaf ? null : h('span', { className: 'check' }, '✅'))
    ),
    children && children.length > 0 ? h('div', { className: 'folder-tree-children' },
      children.map((child, i) => h(FolderTreeNode, { key: i, node: child, filesInfo }))
    ) : null
  );
}

// ----------------------------------------------------------- Word export

function downloadWordDoc(filename, title, bodyHtml) {
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family:Calibri, Arial, sans-serif; font-size:12pt; color:#16213A;">${bodyHtml}</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ------------------------------------------------------------- Dropdown menu

function DropdownMenu({ label = '···', items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onDocClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);
  return h('div', { className: 'dropdown-menu-wrap', ref },
    h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setOpen(o => !o) }, label),
    open && h('div', { className: 'dropdown-menu' },
      items.map((it, i) => h('button', { key: i, onClick: () => { it.onClick(); setOpen(false); } }, it.label))
    )
  );
}

// ----------------------------------------------------------------- Sidebar

const NAV_EC = [
  { key: 'overview', label: "Vue d'ensemble", icon: '🏠' },
  { key: 'entree-mission', label: 'Entrée en mission', icon: '📝', submenu: [
    { key: 'courrier', label: 'Courrier de reprise déontologique' },
    { key: 'contractualisation', label: 'Contractualisation' },
  ] },
  { key: 'bilan', label: 'Supervision bilan', icon: '📊' },
  { key: 'anomalies', label: 'Supervision des anomalies', icon: '⚠️', submenu: [
    { key: 'categories', label: 'Par catégories' },
    { key: 'collaborateur', label: 'Par collaborateur' },
    { key: 'dossier', label: 'Par dossier' },
    { key: 'relances', label: 'Relances et suivi' },
  ] },
  { key: 'conformite', label: 'Conformité cabinet', icon: '🛡️' },
  { key: 'equipe', label: 'Mon équipe', icon: '👥' },
  { key: 'regularisation', label: 'Régularisation des anciens dossiers', icon: '🗂️' },
];

const NAV_COLLAB = [
  { key: 'overview', label: "Vue d'ensemble", icon: '🏠' },
  { key: 'nouveau', label: 'Nouveau dossier', icon: '📝' },
  { key: 'dossiers', label: 'Dossiers existants', icon: '📁', submenu: [
    { key: 'categories', label: 'Par catégories' },
    { key: 'dossier', label: 'Par dossier' },
  ] },
  { key: 'synthese', label: 'Note de synthèse annuelle', icon: '📊' },
  { key: 'relances', label: 'Relances et suivi', icon: '📈' },
  { key: 'conformite', label: 'Conformité', icon: '🛡️' },
  { key: 'regularisation', label: 'Régularisation des anciens dossiers', icon: '🗂️' },
];

function Sidebar({ space, section, sub, onNavigate, onSwitchSpace, user, switchTitle = "Changer d'espace", switchIcon = '⇄' }) {
  const nav = space === 'ec' ? NAV_EC : NAV_COLLAB;
  const [openKey, setOpenKey] = useState(section);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setOpenKey(section); }, [section]);

  function go(key, subKey) {
    onNavigate(key, subKey);
    setMobileOpen(false);
  }

  return h(React.Fragment, null,
    h('div', { className: 'mobile-topbar' },
      h('button', { className: 'hamburger-btn', 'aria-label': 'Ouvrir le menu', onClick: () => setMobileOpen(true) }, '☰'),
      h('div', { className: 'mobile-topbar-logo' }, h('span', { className: 'logo-mark' }, '🛡️'), 'ComplyEC')
    ),
    mobileOpen ? h('div', { className: 'sidebar-backdrop', onClick: () => setMobileOpen(false) }) : null,
    h('aside', { className: cx('sidebar', mobileOpen && 'mobile-open') },
      h('div', { className: 'sidebar-logo' },
        h('span', { className: 'logo-mark' }, '🛡️'), 'ComplyEC',
        h('button', { className: 'sidebar-close-btn', 'aria-label': 'Fermer le menu', onClick: () => setMobileOpen(false) }, '✕')
      ),
      h('nav', { className: 'sidebar-nav' },
        nav.map(item => {
          const isActive = section === item.key;
          if (!item.submenu) {
            return h('button', {
              key: item.key,
              className: cx('nav-item', isActive && 'active'),
              onClick: () => go(item.key, null),
            }, h('span', { className: 'nav-icon' }, item.icon), item.label);
          }
          const open = openKey === item.key;
          return h(React.Fragment, { key: item.key },
            h('button', {
              className: cx('nav-item', isActive && 'active'),
              onClick: () => setOpenKey(open ? null : item.key),
            }, h('span', { className: 'nav-icon' }, item.icon), item.label, h('span', { className: cx('nav-chevron', open && 'open') }, '›')),
            open ? h('div', { className: 'nav-submenu' },
              item.submenu.map(s => h('button', {
                key: s.key,
                className: cx('nav-subitem', isActive && sub === s.key && 'active'),
                onClick: () => go(item.key, s.key),
              }, s.label))
            ) : null
          );
        })
      ),
      h('div', { className: 'sidebar-footer' },
        h('div', { className: 'avatar' }, user.initiales),
        h('div', null,
          h('div', { className: 'sidebar-footer-name' }, user.nom),
          h('div', { className: 'sidebar-footer-role' }, user.role),
          h('div', { className: 'status-dot-row' }, h('span', { className: 'status-dot' }), 'En ligne')
        ),
        h('button', { className: 'switch-space-btn', title: switchTitle, onClick: onSwitchSpace }, switchIcon)
      )
    )
  );
}

// ------------------------------------------------------------- Space selector

function SpaceSelector({ onSelect }) {
  return h('div', { className: 'select-space-screen' },
    h('div', { className: 'space-blob b1' }),
    h('div', { className: 'space-blob b2' }),
    h('div', { className: 'space-blob b3' }),
    h('div', { className: 'select-space-content' },
      h('div', { className: 'select-space-eyebrow' }, h('span', { className: 'eyebrow-dot' }), 'ComplyEC · Version de démonstration'),
      h('h1', { className: 'select-space-hero-title' }, 'Le contrôle qualité, ', h('span', null, 'sans friction')),
      h('p', { className: 'select-space-hero-sub' }, 'Choisissez votre espace pour piloter la conformité du cabinet ou gérer votre portefeuille de dossiers.'),
      h('div', { className: 'select-space-options' },
        h('button', { className: 'space-option', onClick: () => onSelect('ec') },
          h('div', { className: 'avatar' }, 'MD'),
          h('div', { className: 'space-option-title' }, 'Espace Expert-comptable'),
          h('div', { className: 'space-option-name' }, 'Martin Dupont'),
          h('div', { className: 'space-option-desc' }, 'Supervision du cabinet, contrôle qualité, conformité et pilotage des anomalies.'),
          h('div', { className: 'space-option-cta' }, 'Entrer →')
        ),
        h('button', { className: 'space-option', onClick: () => onSelect('collab') },
          h('div', { className: 'avatar' }, 'JB'),
          h('div', { className: 'space-option-title' }, 'Espace Collaborateur'),
          h('div', { className: 'space-option-name' }, 'Julie Bernard'),
          h('div', { className: 'space-option-desc' }, 'Ouverture de dossiers, suivi de la vigilance LBC-FT et des relances.'),
          h('div', { className: 'space-option-cta' }, 'Entrer →')
        )
      ),
      h('div', { className: 'select-space-footer' }, 'Toutes les données affichées sont fictives — démonstration à usage interne.')
    )
  );
}

// ---------------------------------------------- Régularisation des anciens dossiers

function normaliseEntete(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function parseFeuilleDeCalcul(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const feuille = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(feuille, { defval: '' }));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(reader.error || new Error('Lecture du fichier impossible.'));
    reader.readAsArrayBuffer(file);
  });
}

// Colonnes attendues : Nom / Forme juridique / SIREN / Collaborateur (facultatif),
// reconnues quel que soit l'intitulé exact ou l'ordre des colonnes dans le fichier.
function extraireLignesDossiers(lignesBrutes) {
  return lignesBrutes.map((ligne, i) => {
    const n = {};
    Object.keys(ligne).forEach(k => { n[normaliseEntete(k)] = ligne[k]; });
    const nom = n.nom || n.nomsociete || n.societe || n.raisonsociale || n.client || n.denomination || '';
    const forme = n.forme || n.formejuridique || n.type || n.typesociete || n.formesociale || '';
    const siren = n.siren || n.siret || '';
    const collab = n.collaborateur || n.gestionnaire || n.responsable || '';
    return {
      ligne: i + 2,
      nom: String(nom).trim(),
      forme: String(forme).trim(),
      siren: String(siren).trim(),
      collaborateur: String(collab).trim(),
      valid: !!(String(nom).trim() && String(siren).trim()),
    };
  }).filter(r => r.nom || r.siren);
}

function RegularisationAnciensDossiers({ showToast }) {
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    try {
      const raw = await parseFeuilleDeCalcul(file);
      const parsed = extraireLignesDossiers(raw);
      if (parsed.length === 0) throw new Error('Aucune ligne exploitable trouvée. Vérifiez que le fichier contient bien des colonnes Nom, Forme juridique et SIREN.');
      setRows(parsed);
    } catch (err) {
      setError(err.message || 'Impossible de lire ce fichier.');
      setRows(null);
    }
  }

  function reset() {
    setRows(null); setFileName(''); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function confirmerImport() {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      showToast(`${validCount} dossier(s) importé(s) — arborescence Drive créée pour chacun (démonstration).`);
      reset();
    }, 500);
  }

  const validCount = rows ? rows.filter(r => r.valid).length : 0;
  const invalidCount = rows ? rows.length - validCount : 0;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Régularisation des anciens dossiers'), h('p', { className: 'subtitle' }, "Outils dédiés à la reprise de dossiers déjà existants, ouverts avant l'usage de ComplyEC"))
    ),

    h(Card, { title: 'Import de la liste des dossiers existants', icon: '📥', iconBg: '#E9F1FE', iconColor: '#2563EB' },
      h('p', { style: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 } },
        "Déposez un fichier Excel ou CSV contenant au minimum les colonnes Nom, Forme juridique et SIREN. Chaque ligne valide sera transformée en dossier client, avec création automatique de son arborescence Drive."
      ),
      !rows ? h('div', null,
        h('label', { className: 'btn btn-secondary', style: { cursor: 'pointer', display: 'inline-flex' } },
          '📎 Choisir un fichier (.xlsx, .xls, .csv)',
          h('input', { ref: fileInputRef, type: 'file', accept: '.xlsx,.xls,.csv', style: { display: 'none' }, onChange: handleFile })
        ),
        error ? h('div', { className: 'auth-error', style: { marginTop: 12, maxWidth: 480 } }, error) : null
      ) : h('div', null,
        h('div', { className: 'form-help', style: { marginBottom: 10 } }, `Fichier : ${fileName} — ${rows.length} ligne(s) détectée(s)`),
        h('div', { className: 'counter-row', style: { marginBottom: 16 } },
          h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '✅'), h('div', null, h('div', { className: 'counter-value' }, validCount), h('div', { className: 'counter-label' }, 'Lignes valides'))),
          h('div', { className: 'counter-card' }, h('span', { className: 'counter-icon' }, '⚠️'), h('div', null, h('div', { className: 'counter-value' }, invalidCount), h('div', { className: 'counter-label' }, 'Lignes incomplètes (nom ou SIREN manquant)')))
        ),
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Ligne', 'Nom', 'Forme juridique', 'SIREN', 'Collaborateur', ''].map(cLabel => h('th', { key: cLabel }, cLabel)))),
            h('tbody', null, rows.map(r => h('tr', { key: r.ligne },
              h('td', null, r.ligne),
              h('td', { className: 'table-name' }, r.nom || '—'),
              h('td', null, r.forme || '—'),
              h('td', null, r.siren || '—'),
              h('td', null, r.collaborateur || '—'),
              h('td', null, r.valid ? h(Badge, { color: 'vert' }, '● Valide') : h(Badge, { color: 'orange' }, '● Incomplète'))
            )))
          )
        ),
        h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 } },
          h('button', { className: 'btn btn-secondary', onClick: reset }, 'Choisir un autre fichier'),
          h('button', { className: 'btn btn-primary', disabled: validCount === 0 || importing, onClick: confirmerImport }, importing ? 'Import en cours…' : `Importer ${validCount} dossier(s) →`)
        )
      )
    ),

    h(Card, { title: 'Reprendre une ancienne analyse de vigilance LBC-FT', icon: '📎', iconBg: '#FEF3E1', iconColor: '#B45309', style: { marginTop: 18 } },
      h('p', { style: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 } },
        "Pour un dossier déjà suivi avant ComplyEC, déposez le ou les documents de son ancienne analyse de vigilance — ils serviront de source à la fiche de vigilance et à la cartographie des risques du cabinet, sans qu'il soit nécessaire de la refaire intégralement."
      ),
      h('label', { className: 'btn btn-secondary', style: { cursor: 'pointer', display: 'inline-flex' } },
        '📎 Déposer un ou plusieurs fichiers',
        h('input', { type: 'file', multiple: true, style: { display: 'none' }, onChange: e => { if (e.target.files.length) { showToast(`${e.target.files.length} fichier(s) rattaché(s) au dossier (démonstration).`); e.target.value = ''; } } })
      )
    )
  );
}

// ---------------------------------------------------------------- ErrorBoundary

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('ComplyEC crash:', error, info); }
  render() {
    if (this.state.error) {
      return h('div', { className: 'error-boundary' },
        h('h2', null, 'Une erreur est survenue'),
        h('p', null, "Cet écran de démonstration a rencontré un problème inattendu."),
        h('p', { style: { color: 'var(--text-faint)', fontSize: 12 } }, String(this.state.error && this.state.error.message || this.state.error)),
        h('button', { className: 'btn btn-primary', onClick: () => window.location.reload() }, "Recharger l'application")
      );
    }
    return this.props.children;
  }
}
