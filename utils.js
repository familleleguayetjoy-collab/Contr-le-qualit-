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
  return h('div', { className: 'stepper' },
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
  );
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
];

const NAV_COLLAB = [
  { key: 'nouveau', label: 'Nouveau dossier', icon: '📝' },
  { key: 'existants', label: 'Dossiers existants', icon: '📁' },
  { key: 'relances', label: 'Relances et suivi', icon: '📈' },
];

function Sidebar({ space, section, sub, onNavigate, onSwitchSpace, user }) {
  const nav = space === 'ec' ? NAV_EC : NAV_COLLAB;
  const [openKey, setOpenKey] = useState(section);
  useEffect(() => { setOpenKey(section); }, [section]);

  return h('aside', { className: 'sidebar' },
    h('div', { className: 'sidebar-logo' }, h('span', { className: 'logo-mark' }, '🛡️'), 'ComplyEC'),
    h('nav', { className: 'sidebar-nav' },
      nav.map(item => {
        const isActive = section === item.key;
        if (!item.submenu) {
          return h('button', {
            key: item.key,
            className: cx('nav-item', isActive && 'active'),
            onClick: () => onNavigate(item.key, null),
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
              onClick: () => onNavigate(item.key, s.key),
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
      h('button', { className: 'switch-space-btn', title: "Changer d'espace", onClick: onSwitchSpace }, '⇄')
    )
  );
}

// ------------------------------------------------------------- Space selector

function SpaceSelector({ onSelect }) {
  return h('div', { className: 'select-space-screen' },
    h('div', { className: 'select-space-card' },
      h('div', { className: 'select-space-logo' },
        h('span', { className: 'logo-mark' }, '🛡️'),
        h('span', { style: { fontSize: '26px', fontWeight: 800, color: 'var(--navy)' } }, 'ComplyEC')
      ),
      h('div', { className: 'select-space-title' }, 'Bienvenue sur ComplyEC'),
      h('p', { className: 'select-space-sub' }, 'Sélectionnez votre espace pour continuer — version de démonstration'),
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
