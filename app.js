// ComplyEC — Point d'entrée de l'application
'use strict';

function App({ authProfile, onSignOut }) {
  const [space, setSpace] = useState(authProfile ? (authProfile.role === 'expert_comptable' ? 'ec' : 'collab') : null);
  const [ecSection, setEcSection] = useState('overview');
  const [ecSub, setEcSub] = useState(null);
  const [ecBilanFocus, setEcBilanFocus] = useState(null);
  const [collabSection, setCollabSection] = useState('overview');
  const [collabSub, setCollabSub] = useState(null);
  const [toastNode, showToast] = useToast();
  const [cabinetSettings, setCabinetSettings] = useState(CABINET_SETTINGS_DEFAUT);
  const [apercuCollab, setApercuCollab] = useState(null); // id du collaborateur observé

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

  if (!authProfile && !space) {
    return h(SpaceSelector, { onSelect: setSpace });
  }

  let user = authProfile
    ? { nom: `${authProfile.prenom} ${authProfile.nom}`, role: authProfile.role === 'expert_comptable' ? 'Expert-comptable' : 'Collaborateur comptable', initiales: initialesDe(authProfile.prenom, authProfile.nom) }
    : (space === 'ec' ? { nom: EXPERT_COMPTABLE.nom, role: EXPERT_COMPTABLE.role, initiales: EXPERT_COMPTABLE.initiales } : { nom: 'Julie Bernard', role: 'Collaboratrice comptable', initiales: 'JB' });

  // En aperçu, la coque prend l'identité du collaborateur observé : c'est bien
  // son écran que l'expert-comptable regarde, pas le sien déguisé.
  const collabObserve = apercuCollab ? collaborateur(apercuCollab) : null;
  const espaceAffiche = apercuCollab ? 'collab' : space;
  if (collabObserve) {
    const [prenomObs, ...resteObs] = collabObserve.nom.split(' ');
    user = { nom: collabObserve.nom, role: 'Collaborateur comptable', initiales: initialesDe(prenomObs, resteObs.join(' ')) };
  }

  function quitterApercu() {
    setApercuCollab(null);
    setCollabSection('overview');
    setCollabSub(null);
  }

  let content;
  if (espaceAffiche === 'ec') {
    if (ecSection === 'overview') content = h(ECOverview, { navigateEc, showToast });
    else if (ecSection === 'entree-mission') {
      if (ecSub === 'contractualisation') {
        content = h(ContractualisationWizard, { key: 'ec-contract', showToast, collaborateurConnecte: collaborateur('julie'), onFinish: () => navigateEc('overview', null) });
      } else if (ecSub === 'suivi-ldm') {
        content = h(ECSuiviLettresMission, { showToast, onReviser: () => navigateEc('entree-mission', 'contractualisation') });
      } else {
        content = h(ReprisePage, { showToast });
      }
    }
    else if (ecSection === 'bilan') content = h(ECBilan, { key: ecBilanFocus || 'bilan', showToast, focusDossier: ecBilanFocus, onFocusHandled: () => setEcBilanFocus(null) });
    else if (ecSection === 'anomalies') content = h(ECAnomalies, { sub: ecSub, navigateEc, showToast, onOpenBilan: openBilanFor });
    else if (ecSection === 'conformite') content = h(ECConformite, { showToast, cabinetSettings });
    else if (ecSection === 'vigilance') content = h(ECVigilance, { sub: ecSub, showToast, cabinetSettings });
    else if (ecSection === 'equipe') content = h(ECEquipe, { showToast, onApercuCollab: setApercuCollab });
    else if (ecSection === 'dossiers') content = h(ECDossiers, { showToast, onOpenBilan: openBilanFor, onNouveauDossier: () => navigateEc('entree-mission', 'contractualisation') });
    else if (ecSection === 'regularisation') content = h(RegularisationAnciensDossiers, { showToast });
    else if (ecSection === 'parametres') content = h(ParametresCabinet, { showToast, settings: cabinetSettings, onSave: setCabinetSettings });
    else content = h(ECOverview, { navigateEc, showToast });
  } else {
    if (collabSection === 'overview') content = h(CollabOverview, { navigateCollab, showToast });
    else if (collabSection === 'nouveau') content = h(CollabNouveauDossier, { showToast });
    else if (collabSection === 'dossiers') content = h(CollabDossiers, { sub: collabSub, navigateCollab, showToast });
    else if (collabSection === 'synthese') content = h(CollabNoteSynthese, { showToast });
    else if (collabSection === 'relances') content = h(CollabRelances, { showToast });
    else if (collabSection === 'conformite') content = h(CollabConformite, { showToast });
    else if (collabSection === 'regularisation') content = h(RegularisationAnciensDossiers, { showToast });
    else content = h(CollabOverview, { navigateCollab, showToast });
  }

  const contentKey = espaceAffiche === 'ec' ? `ec-${ecSection}-${ecSub}-${ecBilanFocus}` : `collab-${apercuCollab || 'moi'}-${collabSection}-${collabSub}`;

  return h('div', { className: cx('app-shell', apercuCollab && 'en-apercu') },
    h(Sidebar, {
      space: espaceAffiche,
      section: espaceAffiche === 'ec' ? ecSection : collabSection,
      sub: espaceAffiche === 'ec' ? ecSub : collabSub,
      onNavigate: espaceAffiche === 'ec' ? navigateEc : navigateCollab,
      onSwitchSpace: apercuCollab ? quitterApercu : (authProfile ? onSignOut : () => setSpace(null)),
      switchTitle: apercuCollab ? 'Quitter l’aperçu' : (authProfile ? 'Se déconnecter' : "Changer d'espace"),
      switchIcon: apercuCollab ? '↩' : (authProfile ? '⏻' : '⇄'),
      user,
    }),
    h('div', { className: 'main-area' },
      apercuCollab ? h('div', { className: 'apercu-banner' },
        h('span', { className: 'apercu-banner-dot' }),
        h('span', null, 'Aperçu de l’espace de ', h('b', null, collabObserve.nom), ' — vous voyez exactement ce que ce collaborateur voit.'),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: quitterApercu }, '↩ Revenir à mon espace')
      ) : null,
      h('div', { className: 'page-transition', key: contentKey }, content)
    ),
    toastNode
  );
}
