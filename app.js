// ComplyEC — Point d'entrée de l'application
'use strict';

/* Cinq entrées pour l'expert-comptable, et l'accueil est la première.

   Les deux espaces partagent la même barre latérale bleue : elle ne change
   que de contenu. L'espace collaborateur n'est pas concerné par la refonte et
   garde ses sept entrées. */

function App({ authProfile, onSignOut }) {
  const [space, setSpace] = useState(authProfile ? (authProfile.role === 'expert_comptable' ? 'ec' : 'collab') : null);
  const [ecSection, setEcSection] = useState('accueil');
  const [ecSub, setEcSub] = useState(null);
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

  /* Toute navigation passe par routeEc : une adresse de l'arborescence
     précédente — un lien gardé dans un écran, un raccourci d'une recette —
     arrive à sa destination actuelle au lieu de produire un écran vide. */
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

  /* Les règles que le cabinet se donne — seuil de dépendance, périodicité de
     révision des lettres, nombre de sessions de formation — restent stockées
     une seule fois, et s'éditent dans Paramètres. */
  function onChangerReglage(cle, valeur) {
    dbMajReglage(cle, valeur);
  }

  function onEnregistrerReglages(reglages) {
    Object.keys(reglages).forEach(cle => {
      if (reglages[cle] !== cabinetSettings[cle]) dbMajReglage(cle, reglages[cle]);
    });
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
    if (ecSection === 'accueil') content = h(ECAccueil, { navigateEc });

    else if (ecSection === 'entree-mission') {
      /* Le fond de ces deux processus est gelé : ni les champs, ni la logique,
         ni les contrôles, ni les règles métier. Seul l'écran d'entrée a été
         retravaillé. */
      if (ecSub === 'contractualisation') {
        content = h(ContractualisationWizard, {
          key: 'ec-contract', showToast, cabinetSettings,
          collaborateurConnecte: collaborateur('julie'),
          onFinish: () => navigateEc('entree-mission', null),
        });
      } else if (ecSub === 'courrier') {
        content = h(ReprisePage, { showToast, cabinetSettings });
      } else {
        content = h(ECEntreeMission, { navigateEc });
      }
    }

    else if (ecSection === 'anomalies') {
      content = h(ECAnomalies, { onglet: ecSub, navigateEc, showToast, cabinetSettings });
    }

    else if (ecSection === 'controle') {
      content = h(ECPreparerControle, { rubrique: ecSub, navigateEc, showToast, cabinetSettings, onChangerReglage, onApercuCollab: setApercuCollab });
    }

    else if (ecSection === 'parametres') {
      content = h(ECParametres, { rubrique: ecSub, navigateEc, showToast, settings: cabinetSettings, onSave: onEnregistrerReglages, onChangerReglage });
    }

    else content = h(ECAccueil, { navigateEc });
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

  const contentKey = espaceAffiche === 'ec'
    ? `ec-${ecSection}-${ecSub}`
    : `collab-${apercuCollab || 'moi'}-${collabSection}-${collabSub}`;

  const sortie = {
    onSwitchSpace: apercuCollab ? quitterApercu : (authProfile ? onSignOut : () => setSpace(null)),
    switchTitle: apercuCollab ? 'Quitter l’aperçu' : (authProfile ? 'Se déconnecter' : "Changer d'espace"),
    switchIcon: apercuCollab ? '↩' : (authProfile ? '⏻' : '⇄'),
  };

  return h('div', { className: cx('app-shell', apercuCollab && 'en-apercu') },
    h(Sidebar, Object.assign({
      space: espaceAffiche,
      section: espaceAffiche === 'ec' ? ecSection : collabSection,
      sub: espaceAffiche === 'ec' ? ecSub : collabSub,
      onNavigate: espaceAffiche === 'ec' ? navigateEc : navigateCollab,
      user,
    }, sortie)),
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
