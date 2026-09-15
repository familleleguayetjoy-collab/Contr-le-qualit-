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
  /* Les réglages ne sont pas tenus dans l'état React : ils sont lus à chaque
     rendu depuis la couche de données, et useDonnees redessine l'application
     quand cette couche change. C'est ce qui fait qu'un seuil modifié dans
     Gouvernance est encore là après un rafraîchissement, et qu'il vaut la même
     chose dans tous les écrans qui l'appliquent. */
  useDonnees();
  const cabinetSettings = dbReglages();
  const [apercuCollab, setApercuCollab] = useState(null); // id du collaborateur observé

  /* Où revenir quand on referme un sous-écran partagé. LBC-FT, Documents et
     Manuel s'ouvrent de deux endroits : depuis la barre latérale, et depuis
     l'étape du parcours qui les contient. Le § 40 demande que le retour
     dépende de l'entrée — sans quoi, entré par l'étape 5, on se retrouverait
     dans le hub LBC-FT sans savoir comment regagner son parcours. */
  const [retourEtape, setRetourEtape] = useState(null);

  // Les sections que l'on peut atteindre par les deux chemins.
  const SECTIONS_PARTAGEES = { vigilance: 'lbcft', 'documents-cabinet': 'cabinet', manuel: 'manuel' };

  /* Toute navigation passe par routeEc : une adresse de l'ancienne
     arborescence — un lien gardé dans un écran, un raccourci de la vue
     d'ensemble — arrive à sa destination dans la navigation finale au lieu de
     produire un écran vide.

     origine : 'sidebar' quand le clic vient de la barre latérale — il repart
     alors de zéro et oublie le parcours ; 'parcours:<étape>' quand il vient
     d'une carte affichée à l'intérieur d'une étape. */
  function navigateEc(section, sub, origine) {
    let [s, ss] = routeEc(section, sub);

    if (origine === 'sidebar') setRetourEtape(null);
    else if (origine && origine.startsWith('parcours:')) setRetourEtape(origine.slice(9));

    // Fermer un sous-écran ramène à la racine de sa section. Si l'on y est
    // entré par le parcours, cette racine est l'étape, pas le hub.
    if (!ss && retourEtape && SECTIONS_PARTAGEES[s] && origine !== 'sidebar') {
      s = 'parcours';
      ss = retourEtape;
      setRetourEtape(null);
    }
    if (s === 'parcours') setRetourEtape(null);

    setEcSection(s);
    setEcSub(ss);
    window.scrollTo(0, 0);
  }

  function navigateCollab(section, sub) {
    setCollabSection(section);
    setCollabSub(sub || null);
    window.scrollTo(0, 0);
  }

  /* Les règles que le cabinet se donne — seuil de dépendance, périodicité de
     révision des lettres, nombre de sessions de formation — restent stockées
     une seule fois, mais s'éditent dans le module qui les applique. Le cahier
     interdit de les cacher dans un écran de réglages techniques. */
  function onChangerReglage(cle, valeur) {
    dbMajReglage(cle, valeur);
  }

  /* L'écran Paramètres enregistre plusieurs réglages d'un coup. */
  function onEnregistrerReglages(reglages) {
    Object.keys(reglages).forEach(cle => {
      if (reglages[cle] !== cabinetSettings[cle]) dbMajReglage(cle, reglages[cle]);
    });
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

  /* Le contenu d'une étape du parcours, c'est le module qui existe déjà. Le
     parcours ordonne le travail, il ne le refait pas : deux implémentations de
     la gouvernance, ce serait deux vérités (§ 11). */
  function contenuEtape(code) {
    // Une carte ouverte depuis une étape marque son origine : c'est ce qui
    // permet à son bouton Retour de ramener à l'étape et non au hub.
    const naviguer = (section, sub) => navigateEc(section, sub, 'parcours:' + code);
    if (code === 'cabinet') return h(DocumentsCabinet, { sub: null, navigateEc: naviguer, showToast, encadre: true });
    if (code === 'gouvernance') return h(ECGouvernance, { sub: null, navigateEc: naviguer, showToast, cabinetSettings, onChangerReglage, encadre: true });
    if (code === 'ressources') return h(ECRessources, { sub: null, navigateEc: naviguer, showToast, cabinetSettings, onApercuCollab: setApercuCollab, onChangerReglage, encadre: true });
    if (code === 'missions') return h(ECCycleClient, { key: ecBilanFocus || 'cycle', sub: 'supervision', navigateEc: naviguer, showToast, focusDossier: ecBilanFocus, onFocusHandled: () => setEcBilanFocus(null), encadre: true });
    if (code === 'lbcft') return h(ECVigilanceHub, { sub: null, navigateEc: naviguer, showToast, cabinetSettings, encadre: true });
    if (code === 'qualite') return h(ECQualite, { sub: null, navigateEc: naviguer, showToast, cabinetSettings, encadre: true });
    return h(ManuelDeProcedures, { sub: null, navigateEc: naviguer, showToast, cabinetSettings, encadre: true });
  }

  let content;
  if (espaceAffiche === 'ec') {
    // Navigation finale du § 10 du prompt V6 : sept entrées, deux groupes,
    // les paramètres dans le pied de la barre latérale.
    if (ecSection === 'overview') content = h(ECOverview, { navigateEc, showToast, cabinetSettings, user });

    else if (ecSection === 'parcours') {
      const etape = etapeParcours(ecSub) ? ecSub : PARCOURS_ETAPES[0].code;
      content = h(GuidedControlShell, {
        etape,
        onAller: code => navigateEc('parcours', code),
        contenu: contenuEtape(etape),
      });
    }

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

    else if (ecSection === 'gouvernance') content = h(ECGouvernance, { sub: ecSub, navigateEc, showToast, cabinetSettings, onChangerReglage });
    else if (ecSection === 'ressources') content = h(ECRessources, { sub: ecSub, navigateEc, showToast, cabinetSettings, onApercuCollab: setApercuCollab, onChangerReglage });
    else if (ecSection === 'cycle-client') content = h(ECCycleClient, { key: ecBilanFocus || 'cycle', sub: ecSub, navigateEc, showToast, focusDossier: ecBilanFocus, onFocusHandled: () => setEcBilanFocus(null) });
    else if (ecSection === 'vigilance') content = h(ECVigilanceHub, { sub: ecSub, navigateEc, showToast, cabinetSettings });
    else if (ecSection === 'qualite') content = h(ECQualite, { sub: ecSub, navigateEc, showToast, cabinetSettings });
    else if (ecSection === 'documents-cabinet') content = h(DocumentsCabinet, { sub: ecSub, navigateEc, showToast });
    else if (ecSection === 'manuel') content = h(ManuelDeProcedures, { sub: ecSub, navigateEc, showToast, cabinetSettings });
    else if (ecSection === 'parametres') content = h(ParametresCabinet, { showToast, settings: cabinetSettings, onSave: onEnregistrerReglages });
    else content = h(ECOverview, { navigateEc, showToast, cabinetSettings, user });
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
