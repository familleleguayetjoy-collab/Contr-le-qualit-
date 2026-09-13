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

  /* Toute navigation passe par routeEc : une adresse de l'ancienne
     arborescence — un lien gardé dans un écran, un raccourci de la vue
     d'ensemble — arrive à sa destination dans la navigation V3 au lieu de
     produire un écran vide. */
  function navigateEc(section, sub) {
    const [s, ss] = routeEc(section, sub);
    setEcSection(s);
    setEcSub(ss);
    window.scrollTo(0, 0);
  }

  function navigateCollab(section, sub) {
    setCollabSection(section);
    setCollabSub(sub || null);
    window.scrollTo(0, 0);
  }

  function openBilanFor(dossierId) {
    setEcBilanFocus(dossierId);
    setEcSection('cycle-client');
    setEcSub('supervision');
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
    // Navigation finale du § 2 du cahier V3 : onze entrées, quatre groupes.
    if (ecSection === 'overview') content = h(ECOverview, { navigateEc, showToast, cabinetSettings });

    else if (ecSection === 'entree-mission') {
      if (ecSub === 'contractualisation') {
        content = h(ContractualisationWizard, { key: 'ec-contract', showToast, cabinetSettings, collaborateurConnecte: collaborateur('julie'), onFinish: () => navigateEc('overview', null) });
      } else if (ecSub === 'courrier') {
        content = h(ReprisePage, { showToast, cabinetSettings });
      } else {
        content = h(ECEntreeMission, { navigateEc });
      }
    }

    else if (ecSection === 'anomalies') {
      // Dossiers & anomalies absorbe le portefeuille et la régularisation :
      // ce sont des vues du même sujet, pas trois entrées de menu.
      if (ecSub === 'dossier-cabinet') content = h(ECDossiers, { showToast, onOpenBilan: openBilanFor, onNouveauDossier: () => navigateEc('entree-mission', 'contractualisation') });
      else if (ecSub === 'regularisation') content = h(RegularisationAnciensDossiers, { showToast });
      else if (ecSub === 'lettres') content = h(RegularisationLettresMission, { showToast, onRefaire: () => navigateEc('entree-mission', 'contractualisation') });
      else content = h(ECAnomalies, { sub: ecSub, navigateEc, showToast, cabinetSettings, onOpenBilan: openBilanFor });
    }

    else if (ecSection === 'gouvernance') content = h(ECGouvernance, { sub: ecSub, navigateEc, showToast, cabinetSettings });
    else if (ecSection === 'ressources') content = h(ECRessources, { sub: ecSub, navigateEc, showToast, cabinetSettings, onApercuCollab: setApercuCollab });
    else if (ecSection === 'cycle-client') content = h(ECCycleClient, { key: ecBilanFocus || 'cycle', sub: ecSub, navigateEc, showToast, focusDossier: ecBilanFocus, onFocusHandled: () => setEcBilanFocus(null) });
    else if (ecSection === 'vigilance') content = h(ECVigilanceHub, { sub: ecSub, navigateEc, showToast, cabinetSettings });
    else if (ecSection === 'qualite') content = h(ECQualite, { sub: ecSub, navigateEc, showToast, cabinetSettings });
    else if (ecSection === 'documents-cabinet') content = h(DocumentsCabinet, { sub: ecSub, navigateEc, showToast });
    else if (ecSection === 'manuel') {
      // La diffusion du manuel deviendra l'écran S61 en phase 7 ; d'ici là
      // elle reste accessible depuis l'entrée Manuel, et non plus depuis une
      // rubrique « Conformité cabinet » que la navigation V3 supprime.
      content = ecSub === 'diffusion'
        ? h('div', { className: 'page' }, h(DiffusionProceduresManager, { onBack: () => navigateEc('manuel', null), showToast }))
        : h('div', { className: 'page' }, h(ManuelProceduresManager, { showToast, settings: cabinetSettings, onDiffusion: () => navigateEc('manuel', 'diffusion') }));
    }
    else if (ecSection === 'parametres') content = h(ParametresCabinet, { showToast, settings: cabinetSettings, onSave: setCabinetSettings });
    else content = h(ECOverview, { navigateEc, showToast, cabinetSettings });
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
