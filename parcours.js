/* =====================================================================
   Parcours guidé de préparation au contrôle — § 10, § 11 et § 40 du V6
   =====================================================================

   L'ancienne barre latérale posait à l'expert-comptable une question qu'il ne
   sait pas trancher : dans quelle rubrique range-t-on la gouvernance, les
   ressources, le cycle client ? Le parcours pose la seule question utile —
   qu'est-ce qui reste à faire avant le contrôle — et l'ordonne en sept étapes.

   Le principe qui gouverne ce fichier est celui du § 11 : un raccourci ne crée
   jamais un second module. Chaque étape affiche le module qui existe déjà.
   Ouvrir « LBC-FT » depuis la barre latérale ou depuis l'étape 5 mène au même
   composant, sur les mêmes données. Si ce fichier finissait par contenir sa
   propre version de la gouvernance, le cabinet aurait deux vérités et le
   contrôleur trouverait la contradiction avant nous.

   Ce que le parcours ajoute, et qui n'existait nulle part : le rang de
   l'étape, ce qui vient avant, ce qui vient après, et le retour au bon
   endroit.
   ===================================================================== */

/* Fil des sept étapes. Cliquable partout : le cahier interdit d'enfermer
   quelqu'un dans un ordre imposé — on prépare son contrôle dans le désordre,
   selon ce qu'on a sous la main. */
function ParcoursFil({ courante, onAller, etat }) {
  return h('div', { className: 'parcours-fil' },
    PARCOURS_ETAPES.map((e, i) => {
      const actif = e.code === courante;
      const info = etat ? etat[e.code] : null;
      const ton = info ? info.statut : null;
      return h('button', {
        key: e.code,
        className: cx('parcours-fil-etape', actif && 'active', ton && 'etat-' + ton),
        onClick: () => onAller(e.code),
        'aria-current': actif ? 'step' : undefined,
      },
        h('span', { className: 'parcours-fil-rang' }, String(i + 1)),
        h('span', { className: 'parcours-fil-titre' }, e.court || e.titre)
      );
    })
  );
}

/* En-tête d'une étape : son rang, son titre, et la navigation vers l'étape
   précédente ou suivante. Les deux boutons portent le nom de l'étape qu'ils
   ouvrent — « Suivant → » seul obligerait à cliquer pour savoir où l'on va. */
function ParcoursEntete({ code, onAller, actions }) {
  const etape = etapeParcours(code);
  const precedente = etape.rang > 1 ? PARCOURS_ETAPES[etape.rang - 2] : null;
  const suivante = etape.rang < PARCOURS_ETAPES.length ? PARCOURS_ETAPES[etape.rang] : null;
  return h('div', { className: 'page-header' },
    h('div', null,
      h('div', { className: 'parcours-rang' }, `Étape ${etape.rang} sur ${PARCOURS_ETAPES.length}`),
      h('h1', null, etape.titre)
    ),
    h('div', { className: 'page-header-actions' },
      actions,
      precedente
        ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(precedente.code) }, '← ' + precedente.titre)
        : null,
      suivante
        ? h('button', { className: 'btn btn-primary', onClick: () => onAller(suivante.code) }, suivante.titre + ' →')
        : null
    )
  );
}

/* L'enveloppe du parcours. Elle ne connaît pas le contenu des étapes : elle
   reçoit le module à afficher et se contente de l'encadrer. */
function GuidedControlShell({ etape, onAller, contenu, actions }) {
  return h('div', { className: 'page' },
    h(ParcoursEntete, { code: etape, onAller, actions }),
    h(ParcoursFil, { courante: etape, onAller }),
    h('div', { className: 'parcours-contenu' }, contenu)
  );
}

/* =====================================================================
   computeControlJourneyState — § 44 du prompt V6
   =====================================================================

   L'état d'une étape se déduit des faits du cabinet, jamais d'un compteur de
   clics. Le § 44 est formel : « N'invente pas une simple progression basée sur
   des clics. » Un parcours qui se colorerait en vert parce qu'on a visité un
   écran mentirait à l'utilisateur au moment précis où il a le plus besoin
   qu'on lui dise la vérité — la veille de son contrôle.

   Cinq états, et ce qu'ils veulent dire :

     not_started  rien n'a été fait dans cette étape ;
     in_progress  une partie du travail est faite, il en reste ;
     ready        tout est fait, et rien n'est périmé ;
     stale        tout a été fait, mais une échéance que le cabinet s'est
                  donnée est passée : « à actualiser », pas « à refaire » ;
     blocked      une information manque, et elle se saisit ailleurs.

   La distinction entre `stale` et `not_started` vient du § 45 : un dispositif
   prêt l'an dernier n'est pas un dispositif jamais monté, et le dire
   autrement ferait recommencer un travail déjà fait.

   Aucun délai juridique n'est inventé ici. Les échéances utilisées sont celles
   que le cabinet s'est lui-même données et qui figurent déjà dans ses données
   (périodicité de vigilance, rythme annuel de revue), conformément au § 45.
   ===================================================================== */

/* Un reste à faire : ce qu'il manque, en une ligne, et où aller le traiter.
   Le libellé est écrit du point de vue de l'utilisateur — « 3 dossiers
   restent à analyser », pas « portefeuille : couverture incomplète ». */
function reste(cle, libelle, detail, section, sub, urgence) {
  // `urgence || 2` aurait ramené l'urgence 0 — la plus forte — au rang 2 :
  // les actions bloquantes seraient passées derrière les autres, et la seule
  // qui empêche vraiment d'avancer serait sortie des quatre affichées.
  return {
    cle, libelle, detail: detail || null, section, sub: sub || null,
    urgence: urgence === undefined ? 2 : urgence,
  };
}

/* Un fait acquis, à montrer dans la colonne « Déjà prêt ». */
function fait(libelle, detail) {
  return { libelle, detail: detail || null };
}

function anneeDe(date) {
  return date ? Number(String(date).slice(0, 4)) : null;
}

function computeControlJourneyState(reglages) {
  const r = reglages || dbReglages();
  const annee = currentCalendarYear();
  const etapes = {};

  /* ------------------------------------------------- 1. Cabinet & documents

     Le dépôt documentaire n'est pas obligatoire : le § 44 précise qu'une
     information saisie à la main et validée vaut preuve. Ce qui compte, c'est
     que le moteur du manuel ne soit pas bloqué. */
  (() => {
    const identite = ['cabinet.denomination', 'cabinet.forme', 'cabinet.adresse', 'cabinet.inscription'];
    const identiteManquante = identite.filter(c => !dbValeur(c));
    const bloquantes = MANUEL_PARTIES.reduce((n, p) => n + etatPartieManuel(p).manquantes.length, 0);
    const aConfirmer = infosAConfirmer().length;
    const renseignees = dbReferentiel().filter(i => i.valeur).length;

    const restes = [];
    if (identiteManquante.length) {
      restes.push(reste('identite', `Compléter l’identité du cabinet`,
        `${identiteManquante.length} ${pluriel(identiteManquante.length, 'information')} sur ${identite.length}.`,
        'documents-cabinet', 'manquantes', 0));
    }
    if (bloquantes) {
      restes.push(reste('bloquantes', `Renseigner ${bloquantes} ${pluriel(bloquantes, 'information')} que le manuel exige`,
        'Sans elles, le manuel ne peut pas être produit.', 'documents-cabinet', 'manquantes', 0));
    }
    if (aConfirmer) {
      restes.push(reste('aConfirmer', `Confirmer ${aConfirmer} ${pluriel(aConfirmer, 'information')}`,
        'Extraites d’un document, elles attendent votre validation.', 'documents-cabinet', 'a-confirmer', 1));
    }

    etapes.cabinet = {
      restes,
      faits: [
        fait(`${renseignees} ${pluriel(renseignees, 'information renseignée', 'informations renseignées')}`),
        fait(`${dbSources().length} ${pluriel(dbSources().length, 'document déposé', 'documents déposés')}`),
      ],
      rienFait: renseignees === 0,
      bloque: identiteManquante.length > 0 || bloquantes > 0,
    };
  })();

  /* ------------------------------------------------------- 2. Gouvernance */
  (() => {
    const sansTitulaire = dbRolesNonCouverts();
    const declKo = dbDeclarations(annee).filter(d => d.statut !== 'signee');
    const dependances = dependanceASurveiller(r.seuilDependance);
    const sansMesure = dependances.filter(d => !d.mesures || !d.mesures.length);
    const roles = dbRoles();

    const restes = [];
    if (sansTitulaire.length) {
      restes.push(reste('roles', `Désigner ${sansTitulaire.length} ${pluriel(sansTitulaire.length, 'responsable')}`,
        sansTitulaire.map(x => x.label).join(', ') + '.', 'gouvernance', 'organisation', 0));
    }
    if (declKo.length) {
      restes.push(reste('independance', `Recueillir ${declKo.length} ${pluriel(declKo.length, 'déclaration')} d’indépendance`,
        `Campagne ${annee}.`, 'gouvernance', 'independance', 1));
    }
    if (sansMesure.length) {
      restes.push(reste('dependance', `Documenter les mesures de ${sansMesure.length} ${pluriel(sansMesure.length, 'dossier')}`,
        `Au-dessus du seuil de ${pourcent(r.seuilDependance)} que le cabinet s’est fixé.`, 'gouvernance', 'dependance', 1));
    }

    etapes.gouvernance = {
      restes,
      faits: [
        fait(`${roles.length - sansTitulaire.length} ${pluriel(roles.length - sansTitulaire.length, 'rôle couvert', 'rôles couverts')} sur ${roles.length}`),
        fait(`${dependances.length} ${pluriel(dependances.length, 'dossier suivi', 'dossiers suivis')} au titre de la dépendance`),
      ],
      rienFait: sansTitulaire.length === roles.length,
      bloque: false,
    };
  })();

  /* --------------------------------------------------------- 3. Ressources */
  (() => {
    const sansAttestation = formationsNonAJour();
    const prestataires = prestatairesAConfirmer();
    const traitements = traitementsARevoir();
    const accuses = diffusionAccusesManquants();

    const restes = [];
    if (sansAttestation.length) {
      restes.push(reste('formation', `Réunir ${sansAttestation.length} ${pluriel(sansAttestation.length, 'attestation')} de formation`,
        'Formation LBC-FT — article L. 561-33 du code monétaire et financier.', 'ressources', 'formation', 1));
    }
    if (prestataires.length) {
      restes.push(reste('prestataires', `Confirmer ${prestataires.length} ${pluriel(prestataires.length, 'prestataire')}`,
        'Leur fiche n’a jamais été validée.', 'ressources', 'outils', 2));
    }
    if (traitements.length) {
      restes.push(reste('rgpd', `Revoir ${traitements.length} ${pluriel(traitements.length, 'traitement')} du registre RGPD`,
        'Aucune revue n’est datée.', 'ressources', 'rgpd', 2));
    }
    if (accuses.length) {
      restes.push(reste('diffusion', `Relancer ${accuses.length} ${pluriel(accuses.length, 'accusé')} de lecture`,
        'Diffusion de la dernière version des procédures.', 'manuel', 'diffusion', 2));
    }

    etapes.ressources = {
      restes,
      faits: [
        fait(`${COLLABORATEURS.length} ${pluriel(COLLABORATEURS.length, 'collaborateur décrit', 'collaborateurs décrits')}`),
        fait(`${dbPrestataires().length - prestataires.length} ${pluriel(dbPrestataires().length - prestataires.length, 'prestataire confirmé', 'prestataires confirmés')} sur ${dbPrestataires().length}`),
      ],
      rienFait: false,
      bloque: false,
    };
  })();

  /* ----------------------------------------------------------- 4. Missions */
  (() => {
    const reclamations = reclamationsOuvertes();
    const ldm = ldmSuiviCabinet(r);
    const aRegulariser = ldm.absentes.length + ldm.critiques.length;

    const restes = [];
    if (aRegulariser) {
      restes.push(reste('ldm', `Régulariser ${aRegulariser} ${pluriel(aRegulariser, 'lettre de mission', 'lettres de mission')}`,
        `${ldm.absentes.length} ${pluriel(ldm.absentes.length, 'absente')}, ${ldm.critiques.length} ${pluriel(ldm.critiques.length, 'à refaire', 'à refaire')}.`,
        'anomalies', 'lettres', 0));
    }
    if (reclamations.length) {
      restes.push(reste('reclamations', `Clôturer ${reclamations.length} ${pluriel(reclamations.length, 'réclamation')}`,
        'Une réponse a pu être apportée sans que la fiche soit close.', 'cycle-client', 'reclamations', 1));
    }
    if (ldm.aReviser.length) {
      restes.push(reste('ldm-revision', `Réviser ${ldm.aReviser.length} ${pluriel(ldm.aReviser.length, 'lettre de mission', 'lettres de mission')}`,
        `Périodicité de ${r.periodiciteLdm || 3} ans retenue par le cabinet.`, 'anomalies', 'lettres', 2));
    }

    etapes.missions = {
      restes,
      faits: [
        fait(`${ldm.aJour.length} ${pluriel(ldm.aJour.length, 'lettre à jour', 'lettres à jour')} sur ${ldm.lignes.length}`),
        fait(`${dbReclamations().length} ${pluriel(dbReclamations().length, 'réclamation enregistrée', 'réclamations enregistrées')}`),
        fait('Maintien et sortie de mission', 'Suivis dans Quadra, hors ComplyEC.'),
      ],
      rienFait: false,
      bloque: false,
    };
  })();

  /* ------------------------------------------------------------- 5. LBC-FT */
  (() => {
    const roles = dbRoles().filter(x => ['declarant', 'correspondant', 'lbcft'].includes(x.code));
    const rolesKo = roles.filter(x => !x.titulaireEffectif);
    const aTraiter = vigilanceATraiter();
    const dossiers = dbVigilanceDossiers();
    const couverts = dossiers.filter(d => d.statut === 'complete');
    const divergences = rbeDivergences();
    const controles = controlesAFaire();
    const cartographies = dbCartographies();
    const derniereCarto = cartographies.length ? cartographies[0] : null;
    // Le cabinet arrête sa cartographie une fois par an : une cartographie de
    // l'année civile précédente est à actualiser, pas à refaire.
    const cartoPerimee = derniereCarto && anneeDe(derniereCarto.date) < annee;

    const restes = [];
    if (rolesKo.length) {
      restes.push(reste('roles-lbcft', `Désigner ${rolesKo.length} ${pluriel(rolesKo.length, 'responsable')} LBC-FT`,
        rolesKo.map(x => x.label).join(', ') + '.', 'gouvernance', 'organisation', 0));
    }
    if (aTraiter.length) {
      const critiques = aTraiter.filter(t => t.priorite === 'Critique').length;
      restes.push(reste('vigilance', `Analyser ${aTraiter.length} ${pluriel(aTraiter.length, 'dossier')}`,
        critiques ? `${critiques} ${pluriel(critiques, 'dossier critique', 'dossiers critiques')}.` : 'Analyse jamais faite ou échue.',
        'vigilance', 'a-traiter', critiques ? 0 : 1));
    }
    if (divergences.length) {
      restes.push(reste('rbe', `Traiter ${divergences.length} ${pluriel(divergences.length, 'divergence')} au registre des bénéficiaires`,
        'Article L. 561-45-1 du code monétaire et financier.', 'vigilance', 'campagne-rbe', 1));
    }
    if (controles.length) {
      restes.push(reste('controles', `Faire ${controles.length} ${pluriel(controles.length, 'contrôle ciblé', 'contrôles ciblés')}`,
        'Gel des avoirs, PPE, pays à risque.', 'vigilance', 'campagne-controles', 2));
    }
    if (!derniereCarto || cartoPerimee) {
      restes.push(reste('cartographie', derniereCarto ? 'Actualiser la cartographie LBC-FT' : 'Arrêter la cartographie LBC-FT',
        derniereCarto ? `Dernier arrêté le ${formatDate(derniereCarto.date)}.` : 'Jamais arrêtée.',
        'vigilance', 'cartographie', 2));
    }

    etapes.lbcft = {
      restes,
      faits: [
        fait(`${couverts.length} ${pluriel(couverts.length, 'dossier couvert', 'dossiers couverts')} sur ${dossiers.length}`),
        derniereCarto
          ? fait('Cartographie arrêtée', `Le ${formatDate(derniereCarto.date)}.`)
          : null,
      ].filter(Boolean),
      rienFait: couverts.length === 0,
      // Une cartographie de l'an dernier est périmée, pas absente : le § 45
      // demande de dire « à actualiser » et non « à refaire ».
      perime: !!cartoPerimee,
      bloque: false,
    };
  })();

  /* ------------------------------------------ 6. Surveillance & qualité */
  (() => {
    const risques = risquesQualiteAValider();
    /* Une non-conformité ouverte ne bloque pas si son plan d'action est tracé
       (§ 44) : c'est précisément ce que la NPMQ attend d'un cabinet — non pas
       zéro incident, mais un incident traité. */
    const ncSansPlan = dbNonConformites().filter(n => etatNonConformite(n) === 'ouverte');
    const ncSuivies = dbNonConformites().filter(n => etatNonConformite(n) === 'attente-efficacite');
    const controles = dbControles().filter(c => c.date).length;
    const evaluation = QUALITE_DERNIERE_REVUE;
    const evaluationPerimee = anneeDe(evaluation) < annee;

    const restes = [];
    if (risques.length) {
      restes.push(reste('risques', `Valider ${risques.length} ${pluriel(risques.length, 'domaine de risque', 'domaines de risque')}`,
        'Cartographie des risques qualité.', 'qualite', 'carto-qualite', 1));
    }
    if (ncSansPlan.length) {
      restes.push(reste('nc', `Ouvrir un plan d’action sur ${ncSansPlan.length} ${pluriel(ncSansPlan.length, 'non-conformité', 'non-conformités')}`,
        'Constatée mais sans action décidée.', 'qualite', 'non-conformites', 0));
    }
    if (evaluationPerimee) {
      restes.push(reste('evaluation', 'Actualiser l’évaluation annuelle du système qualité',
        `Dernière revue le ${formatDate(evaluation)}.`, 'qualite', 'evaluation', 2));
    }

    etapes.qualite = {
      restes,
      faits: [
        fait(`${dbRisquesQualite().length - risques.length} ${pluriel(dbRisquesQualite().length - risques.length, 'domaine validé', 'domaines validés')} sur ${dbRisquesQualite().length}`),
        ncSuivies.length ? fait(`${ncSuivies.length} ${pluriel(ncSuivies.length, 'non-conformité suivie', 'non-conformités suivies')}`, 'Plan d’action tracé, efficacité à vérifier.') : null,
        fait(`${ECHANTILLON_SURVEILLANCE.length} ${pluriel(ECHANTILLON_SURVEILLANCE.length, 'dossier')} dans l’échantillon de surveillance`),
      ].filter(Boolean),
      rienFait: risques.length === dbRisquesQualite().length && controles === 0,
      perime: evaluationPerimee && !risques.length && !ncSansPlan.length,
      bloque: false,
    };
  })();

  /* ------------------------------------------------- 7. Manuel & contrôle */
  (() => {
    const parties = MANUEL_PARTIES.map(p => ({ p, e: etatPartieManuel(p) }));
    const bloquees = parties.filter(x => x.e.bloque);
    const aConfirmer = parties.filter(x => !x.e.bloque && !x.e.pret);
    const version = manuelVersionEnVigueur();
    const validees = Object.keys(dbManuelPartiesValidees()).length;

    const restes = [];
    if (bloquees.length) {
      restes.push(reste('manuel-bloque', `Compléter ${bloquees.length} ${pluriel(bloquees.length, 'partie')} du manuel`,
        bloquees.map(x => x.p.titre).join(', ') + '.', 'documents-cabinet', 'manquantes', 0));
    }
    if (aConfirmer.length) {
      restes.push(reste('manuel-confirmer', `Confirmer les données de ${aConfirmer.length} ${pluriel(aConfirmer.length, 'partie')}`,
        'Elles sont renseignées mais pas encore validées.', 'documents-cabinet', 'a-confirmer', 1));
    }
    if (!bloquees.length && validees < MANUEL_PARTIES.length) {
      restes.push(reste('manuel-relire', `Relire ${MANUEL_PARTIES.length - validees} ${pluriel(MANUEL_PARTIES.length - validees, 'partie')} du manuel`,
        'La publication s’ouvre une fois les six parties relues.', 'manuel', 'apercu', 1));
    }
    if (!version) {
      restes.push(reste('manuel-publier', 'Publier la première version du manuel', null, 'manuel', 'publication', 1));
    }

    etapes.manuel = {
      restes,
      faits: [
        version ? fait(`Manuel ${version.numero} en vigueur`, `Depuis le ${formatDate(version.dateEffet)}.`) : null,
        fait(`${validees} ${pluriel(validees, 'partie relue', 'parties relues')} sur ${MANUEL_PARTIES.length}`),
      ].filter(Boolean),
      rienFait: !version && validees === 0,
      bloque: bloquees.length > 0,
    };
  })();

  /* ------------------------------------------------- Statut de chaque étape */
  PARCOURS_ETAPES.forEach((e, i) => {
    const s = etapes[e.code];
    s.code = e.code;
    s.titre = e.titre;
    s.icone = e.icone;
    s.rang = i + 1;
    s.restes.sort((a, b) => a.urgence - b.urgence);
    if (s.bloque) s.statut = 'blocked';
    else if (!s.restes.length) s.statut = 'ready';
    else if (s.perime && s.restes.every(x => x.urgence >= 2)) s.statut = 'stale';
    else if (s.rienFait) s.statut = 'not_started';
    else s.statut = 'in_progress';
    s.pret = s.statut === 'ready';
  });

  const liste = PARCOURS_ETAPES.map(e => etapes[e.code]);
  const pretes = liste.filter(s => s.pret).length;
  /* L'étape « courante » est la première qui n'est pas prête : c'est là qu'il
     reste du travail, donc là qu'on veut être emmené. Si tout est prêt, on
     ouvre la dernière, qui porte le pack de contrôle. */
  const courante = liste.find(s => !s.pret) || liste[liste.length - 1];

  return {
    etapes, liste, pretes, total: liste.length, courante,
    // Toutes les actions restantes du cabinet, les plus urgentes d'abord.
    actions: liste.reduce((acc, s) => acc.concat(s.restes.map(x => Object.assign({ etape: s.code, etapeTitre: s.titre }, x))), [])
      .sort((a, b) => a.urgence - b.urgence),
    // Le socle initial est-il posé ? Tant que non, l'accueil parle de mise en
    // place ; ensuite, de préparation du contrôle (§ 12.1).
    enPlace: liste.filter(s => s.statut !== 'not_started').length >= liste.length - 1,
  };
}
