// ComplyEC — Point d'entrée de l'application
'use strict';

/* Cinq entrées pour l'expert-comptable, et l'accueil est la première.

   Les deux espaces partagent la même barre latérale bleue : elle ne change
   que de contenu. L'espace collaborateur a cinq entrées, aux mêmes
   teintes. */

function App({ authProfile, onSignOut }) {
  const [space, setSpace] = useState(authProfile ? (authProfile.role === 'expert_comptable' ? 'ec' : 'collab') : null);
  const [ecSection, setEcSection] = useState('accueil');
  const [ecSub, setEcSub] = useState(null);
  const [collabSection, setCollabSection] = useState('accueil');
  const [collabSub, setCollabSub] = useState(null);
  const [toastNode, showToast] = useToast();
  /* Les réglages ne sont pas tenus dans l'état React : ils sont lus à chaque
     rendu depuis la couche de données, et useDonnees redessine l'application
     quand cette couche change. C'est ce qui fait qu'un seuil modifié dans
     Gouvernance est encore là après un rafraîchissement, et qu'il vaut la même
     chose dans tous les écrans qui l'appliquent. */
  useDonnees();
  const cabinetSettings = dbReglages();
  /* Le statut choisi à la connexion. Il ne donne aucun droit : un compte
     collaborateur n'ouvre jamais l'espace de l'expert-comptable. Mais un
     expert-comptable qui choisit « Collaborateur » veut voir cet espace : il
     l'ouvre en aperçu, sur le premier collaborateur, qu'il peut changer. */
  const statutChoisi = typeof lireStatut === 'function' ? lireStatut() : null;
  const estEc = authProfile && authProfile.role === 'expert_comptable';
  const [apercuCollab, setApercuCollab] = useState(() => (
    estEc && statutChoisi === 'collab' && dbCollaborateursTous().length
      ? dbCollaborateursTous()[0].id : null)); // id du collaborateur observé
  useEffect(() => {
    if (authProfile && !estEc && statutChoisi === 'ec') {
      showToast('Votre compte est un compte collaborateur : c’est votre espace qui s’ouvre.');
      if (typeof retenirStatut === 'function') retenirStatut('collab');
    }
  }, []);

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
    setCollabSub(sub || (section === 'anomalies' ? 'lettres' : null));
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
  /* Le collaborateur affiché : celui qu'on observe en aperçu, sinon celui
     qui est connecté. Les écrans partagés le lisent pour savoir qui agit. */
  const moi = apercuCollab || collabDuProfil(authProfile && authProfile.role !== 'expert_comptable' ? authProfile : null);
  definirEspaceCourant(espaceAffiche, espaceAffiche === 'collab' ? moi : null);
  if (collabObserve) {
    const [prenomObs, ...resteObs] = collabObserve.nom.split(' ');
    user = { nom: collabObserve.nom, role: 'Collaborateur comptable', initiales: initialesDe(prenomObs, resteObs.join(' ')) };
  }

  function quitterApercu() {
    if (typeof retenirStatut === 'function' && statutChoisi === 'collab') retenirStatut('ec');
    setApercuCollab(null);
    setCollabSection('accueil');
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
        content = h(ReprisePage, {
          key: 'ec-reprise', showToast, cabinetSettings,
          onFinish: () => navigateEc('entree-mission', null),
        });
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
    /* Le parcours d'entrée en mission est celui de l'expert-comptable, mot
       pour mot : seul le registre des bénéficiaires effectifs y change. */
    if (collabSection === 'entree-mission') {
      if (collabSub === 'contractualisation') {
        content = h(ContractualisationWizard, {
          key: 'collab-contract', showToast, cabinetSettings,
          collaborateurConnecte: collaborateur(moi),
          onFinish: () => navigateCollab('entree-mission', null),
        });
      } else if (collabSub === 'courrier') {
        content = h(ReprisePage, {
          key: 'collab-reprise', showToast, cabinetSettings,
          onFinish: () => navigateCollab('entree-mission', null),
        });
      } else {
        content = h(ECEntreeMission, { navigateEc: navigateCollab });
      }
    }
    else if (collabSection === 'anomalies') content = h(CollabAnomalies, { moi, onglet: collabSub, navigate: navigateCollab, showToast });
    else if (collabSection === 'obligations') content = h(CollabObligations, { moi, showToast });
    else if (collabSection === 'parametres') content = h(CollabParametres, { moi, showToast });
    else content = h(CollabAccueil, { moi, navigate: navigateCollab, showToast });
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
        h('span', null, 'Aperçu de l’espace de'),
        h('select', {
          className: 'form-input apercu-choix', value: apercuCollab,
          'aria-label': 'Collaborateur observé',
          onChange: e => { setApercuCollab(e.target.value); setCollabSection('accueil'); setCollabSub(null); },
        }, dbCollaborateursTous().map(c => h('option', { key: c.id, value: c.id }, c.nom))),
        h('span', { className: 'apercu-banner-note' }, 'vous voyez exactement ce que ce collaborateur voit.'),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: quitterApercu }, '↩ Revenir à mon espace')
      ) : null,
      typeof BandeauEnregistrement === 'function' ? h(BandeauEnregistrement) : null,
      h('div', { className: 'page-transition', key: contentKey }, content)
    ),
    toastNode
  );
}
