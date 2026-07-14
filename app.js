// ComplyEC — Point d'entrée de l'application
'use strict';

function App() {
  const [space, setSpace] = useState(null);
  const [ecSection, setEcSection] = useState('overview');
  const [ecSub, setEcSub] = useState(null);
  const [ecBilanFocus, setEcBilanFocus] = useState(null);
  const [collabSection, setCollabSection] = useState('overview');
  const [collabSub, setCollabSub] = useState(null);
  const [toastNode, showToast] = useToast();

  function navigateEc(section, sub) {
    setEcSection(section);
    setEcSub(sub);
    window.scrollTo(0, 0);
  }

  function navigateCollab(section, sub) {
    setCollabSection(section);
    setCollabSub(sub || null);
    window.scrollTo(0, 0);
  }

  function openBilanFor(dossierId) {
    setEcBilanFocus(dossierId);
    setEcSection('bilan');
    setEcSub(null);
    window.scrollTo(0, 0);
  }

  if (!space) {
    return h(SpaceSelector, { onSelect: setSpace });
  }

  const user = space === 'ec' ? { nom: EXPERT_COMPTABLE.nom, role: EXPERT_COMPTABLE.role, initiales: EXPERT_COMPTABLE.initiales } : { nom: 'Julie Bernard', role: 'Collaboratrice comptable', initiales: 'JB' };

  let content;
  if (space === 'ec') {
    if (ecSection === 'overview') content = h(ECOverview, { navigateEc, showToast });
    else if (ecSection === 'entree-mission') {
      content = ecSub === 'contractualisation'
        ? h(ContractualisationWizard, { key: 'ec-contract', showToast, collaborateurConnecte: collaborateur('julie'), onFinish: () => navigateEc('overview', null) })
        : h(ReprisePage, { showToast });
    }
    else if (ecSection === 'bilan') content = h(ECBilan, { key: ecBilanFocus || 'bilan', showToast, focusDossier: ecBilanFocus, onFocusHandled: () => setEcBilanFocus(null) });
    else if (ecSection === 'anomalies') content = h(ECAnomalies, { sub: ecSub, navigateEc, showToast, onOpenBilan: openBilanFor });
    else if (ecSection === 'conformite') content = h(ECConformite, { showToast });
    else content = h(ECOverview, { navigateEc, showToast });
  } else {
    if (collabSection === 'overview') content = h(CollabOverview, { navigateCollab, showToast });
    else if (collabSection === 'nouveau') content = h(CollabNouveauDossier, { showToast });
    else if (collabSection === 'dossiers') content = h(CollabDossiers, { sub: collabSub, navigateCollab, showToast });
    else if (collabSection === 'synthese') content = h(CollabNoteSynthese, { showToast });
    else if (collabSection === 'relances') content = h(CollabRelances, { showToast });
    else content = h(CollabOverview, { navigateCollab, showToast });
  }

  return h('div', { className: 'app-shell' },
    h(Sidebar, {
      space,
      section: space === 'ec' ? ecSection : collabSection,
      sub: space === 'ec' ? ecSub : collabSub,
      onNavigate: space === 'ec' ? navigateEc : navigateCollab,
      onSwitchSpace: () => setSpace(null),
      user,
    }),
    h('div', { className: 'main-area' }, content),
    toastNode
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(ErrorBoundary, null, h(App)));
