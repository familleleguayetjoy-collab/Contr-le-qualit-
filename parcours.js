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

/* Le stepper du § 13.1 : sept pastilles numérotées, cliquables partout.

   On prépare son contrôle dans le désordre, selon ce qu'on a sous la main — un
   parcours qui imposerait son ordre ferait perdre du temps au lieu d'en faire
   gagner. Une étape terminée est verte, l'étape courante porte la teinte de son
   sujet, les autres restent grises.

   L'état ne repose jamais sur la seule couleur : la pastille d'une étape
   terminée porte une coche, et le titre de l'écran répète le rang en toutes
   lettres. Une couleur seule exclut ceux qui ne la distinguent pas. */
function ParcoursFil({ courante, onAller, etat }) {
  return h('div', { className: 'parcours-fil', role: 'navigation', 'aria-label': 'Étapes de la préparation' },
    PARCOURS_ETAPES.map((e, i) => {
      const actif = e.code === courante;
      const s = etat && etat.etapes ? etat.etapes[e.code] : null;
      const pret = s && s.pret;
      return h('button', {
        key: e.code,
        className: cx('parcours-fil-etape', actif && 'active', pret && 'pret'),
        onClick: () => onAller(e.code),
        'aria-current': actif ? 'step' : undefined,
        title: `Étape ${i + 1} sur ${PARCOURS_ETAPES.length} — ${e.titre}`,
      },
        h('span', { className: 'parcours-fil-rang' }, pret && !actif ? '✓' : String(i + 1)),
        h('span', { className: 'parcours-fil-titre' }, e.court || e.titre)
      );
    })
  );
}

/* Sur mobile, le § 13.1 remplace le fil par un rang, une barre et un nom :
   sept pastilles côte à côte sur 390 px seraient illisibles.

   S'y ajoute une liste déroulante des sept étapes. Sans elle, un utilisateur
   sur téléphone ne pourrait atteindre l'étape 5 qu'en passant par les quatre
   précédentes : le fil du bureau, lui, laisse aller n'importe où. Une liste
   déroulante n'est pas un geste à deviner — c'est le contrôle que tout le
   monde connaît. */
function ParcoursFilMobile({ courante, onAller, etat }) {
  const e = etapeParcours(courante);
  const pretes = etat ? etat.pretes : 0;
  return h('div', { className: 'parcours-fil-mobile' },
    h('div', { className: 'parcours-fil-mobile-ligne' },
      h('span', null, `Étape ${e.rang} sur ${PARCOURS_ETAPES.length}`),
      h('span', null, `${pretes} ${pluriel(pretes, 'terminée', 'terminées')}`)
    ),
    h('div', { className: 'parcours-fil-mobile-barre' },
      h('span', { style: { width: Math.round(e.rang / PARCOURS_ETAPES.length * 100) + '%' } })
    ),
    h('select', {
      className: 'parcours-fil-mobile-choix',
      'aria-label': 'Aller à une étape',
      value: courante,
      onChange: ev => onAller(ev.target.value),
    },
      PARCOURS_ETAPES.map((x, i) => {
        const s = etat && etat.etapes ? etat.etapes[x.code] : null;
        return h('option', { key: x.code, value: x.code },
          `${i + 1}. ${x.titre}${s && s.pret ? ' — terminée' : ''}`);
      })
    )
  );
}

/* En-tête d'une étape : son rang, son titre, et le passage d'une étape à
   l'autre. Les deux boutons portent le nom de l'étape qu'ils ouvrent —
   « Suivant → » seul obligerait à cliquer pour savoir où l'on va. */
function ParcoursEntete({ code, onAller, actions }) {
  const etape = etapeParcours(code);
  const precedente = etape.rang > 1 ? PARCOURS_ETAPES[etape.rang - 2] : null;
  return h('div', { className: 'page-header' },
    h('div', null,
      h('div', { className: 'parcours-rang' }, `Étape ${etape.rang} sur ${PARCOURS_ETAPES.length}`),
      h('h1', null, etape.titre)
    ),
    h('div', { className: 'page-header-actions' },
      actions,
      precedente
        ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(precedente.code) }, '← ' + precedente.court)
        : null
    )
  );
}

/* La teinte dominante de chaque étape, telle que le prompt la fixe étape par
   étape. Elle n'ajoute aucune information : elle aide seulement à reconnaître
   d'un coup d'œil où l'on se trouve. */
const PARCOURS_TONS = {
  cabinet: 'violet', gouvernance: 'bleu', ressources: 'bleu', missions: 'bleu',
  lbcft: 'violet', qualite: 'dore', manuel: 'vert',
};

/* Le corps d'une étape (§ 13.2) : ce qu'il reste à faire à gauche, ce qui est
   déjà prêt à droite.

   L'ancien écran montrait quatre grandes cartes de thèmes. Il fallait les
   ouvrir une à une pour savoir laquelle demandait du travail. Ici la question
   « qu'est-ce qui me reste ? » a sa réponse avant tout clic, et chaque ligne
   mène directement à l'écran qui la traite. */
function ParcoursEtape({ code, etat, naviguer, onAller, showToast }) {
  const s = etat.etapes[code];
  // La valeur en cours d'édition : null tant qu'aucune fenêtre n'est ouverte.
  const [edite, setEdite] = useState(null);
  const ton = PARCOURS_TONS[code] || 'bleu';
  /* Tous les travaux de l'étape s'affichent, faits ou non : c'est ce qui
     permet de voir ce qui reste sans rien ouvrir, et d'atteindre celui qui est
     déjà fait quand on veut simplement le relire. Ceux qui restent viennent en
     premier — le tri est fait par le moteur d'état. */
  const lignes = s.chantiers.slice(0, 4);
  const enPlus = s.chantiers.length - lignes.length;
  const suivante = etapeParcours(code).rang < PARCOURS_ETAPES.length
    ? PARCOURS_ETAPES[etapeParcours(code).rang]
    : null;

  /* Le bouton principal est dynamique (§ 14) : il annonce le travail qu'il
     ouvre, pas un « Continuer » qui ne dit rien. Quand l'étape est prête, il
     emmène à la suivante. */
  const principal = s.restes.length
    ? { libelle: s.restes[0].court, aller: () => naviguer(s.restes[0].section, s.restes[0].sub) }
    : (suivante ? { libelle: suivante.titre + ' →', aller: () => onAller(suivante.code) } : null);

  return h(React.Fragment, null,
    h('div', { className: 'parcours-colonnes' },
      h(FormSection, { icon: s.pret ? '✅' : '📝', title: 'À finaliser', ton },
        h(React.Fragment, null,
          /* Quand tout est fait, un message vert compact prend la tête de la
             colonne (§ 13.2) — sans faire disparaître les travaux, qu'on doit
             pouvoir rouvrir pour les relire. */
          s.pret
            ? h('div', { className: 'parcours-pret' },
              h('span', { className: 'parcours-pret-marque' }, '✓'),
              h('div', null,
                h('div', { className: 'parcours-pret-titre' }, 'Cette étape est prête.'),
                h('div', { className: 'parcours-reste-detail' }, 'Rien ne reste à traiter ici avant le contrôle.')
              )
            )
            : null,
          h('div', { className: 'parcours-restes' },
            lignes.map(x => h('div', {
              className: cx('parcours-reste', x.fait && 'fait'), key: x.cle,
              // Le nom stable du travail, indépendant du libellé d'action qui
              // change avec les compteurs. Les recettes s'y accrochent.
              'data-travail': x.libelleFait,
            },
              x.fait
                ? h('span', { className: 'parcours-reste-marque' }, '✓')
                : h('span', { className: cx('accueil-pastille', 'urgence-' + x.urgence) }),
              h('div', { className: 'parcours-reste-texte' },
                h('div', { className: 'parcours-reste-titre' }, x.fait ? x.libelleFait : x.libelle),
                x.detail ? h('div', { className: 'parcours-reste-detail' }, x.detail) : null
              ),
              h('button', { className: 'btn btn-secondary btn-sm', onClick: () => naviguer(x.section, x.sub) }, 'Ouvrir')
            )),
            /* Quatre lignes au maximum : au-delà, on dit combien il en reste
               plutôt que d'allonger la liste hors de l'écran. */
            enPlus > 0
              ? h('div', { className: 'parcours-reste-plus' },
                `${enPlus} ${pluriel(enPlus, 'autre point', 'autres points')} à cette étape.`)
              : null
          )
        )
      ),
      h(FormSection, { icon: '📌', title: 'Déjà prêt', ton: 'gris' },
        h('div', { className: 'parcours-faits' },
          s.faits.map((f, i) => (f.cle
            ? h(EditableValueRow, {
              key: f.cle, libelle: f.libelle, valeur: f.detail, absent: !f.detail,
              onModifier: () => setEdite(f),
            })
            : h('div', { className: 'parcours-fait', key: i },
              h('div', { className: 'parcours-fait-libelle' }, f.libelle),
              f.detail ? h('div', { className: 'parcours-reste-detail' }, f.detail) : null
            )))
        )
      )
    ),

    /* La fenêtre de saisie écrit dans la couche de données : la valeur change
       partout à la fois, et les documents qui l'impriment repassent en « à
       régénérer » (§ 11). C'est le remplacement des boutons qui affichaient
       « Modification des responsables (démonstration) ». */
    edite
      ? h(FunctionalEditModal, {
        libelle: edite.libelle,
        valeur: edite.detail,
        options: edite.options,
        onAnnuler: () => setEdite(null),
        onEnregistrer: async valeur => {
          const cle = edite.cle;
          await dbMajInformation(cle, valeur);
          const dependants = documentsDependantDe(cle).filter(d => d.etat === 'a-regenerer');
          setEdite(null);
          if (showToast) {
            showToast(dependants.length
              ? `${edite.libelle} enregistré. ${dependants.length} ${pluriel(dependants.length, 'document passe', 'documents passent')} en « à régénérer ».`
              : `${edite.libelle} enregistré.`);
          }
        },
      })
      : null,
    /* Pied visible : d'où l'on vient, où l'on va. Le cahier exige qu'un retour
       en arrière soit toujours possible. */
    h('div', { className: 'parcours-pied' },
      h('div', { className: 'parcours-pied-etat' },
        `${etat.pretes} ${pluriel(etat.pretes, 'étape prête', 'étapes prêtes')} sur ${etat.total}`),
      principal
        ? h('button', { className: 'btn btn-primary', onClick: principal.aller }, principal.libelle)
        : null
    )
  );
}

/* L'enveloppe du parcours. Elle ne connaît pas le détail des étapes : elle
   assemble l'en-tête, le fil et le corps. */
function GuidedControlShell({ etape, onAller, naviguer, etat, contenu, actions, showToast }) {
  const e = etat || computeControlJourneyState();
  /* La dernière étape porte les deux accès secondaires du § 27 : le mode
     « Contrôle demain » et la simulation. Ils ne sont pas dans la barre
     latérale — on n'y va que lorsqu'on prépare vraiment un contrôle. */
  const actionsEtape = etape === 'manuel'
    ? h(React.Fragment, null,
      actions,
      naviguer ? h('button', { className: 'btn btn-secondary', onClick: () => naviguer('controle', 'simulation') }, '🎧 Simulation') : null,
      naviguer ? h('button', { className: 'btn btn-secondary', onClick: () => naviguer('controle', null) }, '📅 Contrôle demain') : null
    )
    : actions;
  return h('div', { className: 'page' },
    h(ParcoursEntete, { code: etape, onAller, actions: actionsEtape }),
    h(ParcoursFil, { courante: etape, onAller, etat: e }),
    h(ParcoursFilMobile, { courante: etape, onAller, etat: e }),
    h('div', { className: 'parcours-contenu' },
      contenu || h(ParcoursEtape, { key: etape, code: etape, etat: e, naviguer, onAller, showToast })
    )
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

/* Un chantier d'une étape : un des travaux qui la composent.

   Le § 15 et le § 16 nomment ces travaux étape par étape — Organisation,
   Indépendance, Dépendance pour la gouvernance ; Équipe, Formation, Outils,
   RGPD pour les ressources. Ils s'affichent tous, faits ou non : c'est ce qui
   permet de voir ce qui reste sans rien ouvrir, et d'atteindre celui qui est
   déjà fait quand on veut simplement le relire.

   `libelle` dit quoi faire et combien il en reste — « Analyser 5 dossiers »,
   pas « Portefeuille ». `court` est le libellé du bouton principal de l'étape.
   `urgence` : 0 bloque, 1 presse, 2 peut attendre. */
function chantier(o) {
  return {
    cle: o.cle,
    libelle: o.libelle,
    // Le libellé quand le travail est fait : on ne dit pas « Analyser 0
    // dossier », on dit ce qui est acquis.
    libelleFait: o.libelleFait || o.libelle,
    detail: o.detail || null,
    section: o.section,
    sub: o.sub || null,
    fait: !!o.fait,
    // `urgence || 2` aurait ramené l'urgence 0 — la plus forte — au rang 2 :
    // les actions bloquantes seraient passées derrière les autres.
    urgence: o.urgence === undefined ? 2 : o.urgence,
    court: o.court || o.libelle,
  };
}

/* Un fait acquis, à montrer dans la colonne « Déjà prêt ».

   `cle` est la clé du référentiel quand la valeur est modifiable : la colonne
   affiche alors un bouton Modifier qui ouvre une vraie saisie et écrit dans la
   couche de données. Sans clé, le fait est une constatation, pas une valeur —
   « 6 dossiers couverts sur 13 » ne se modifie pas à la main. */
function fait(libelle, detail, cle, options) {
  return { libelle, detail: detail || null, cle: cle || null, options: options || null };
}

/* Les personnes du cabinet, pour désigner un titulaire de rôle. On ne saisit
   pas un nom à la main quand la liste existe : une faute de frappe créerait un
   second « Martin Dupond » que plus rien ne rapprocherait du premier. */
function nomsDuCabinet() {
  return [EXPERT_COMPTABLE.nom].concat(COLLABORATEURS.map(c => c.nom))
    .filter((n, i, t) => t.indexOf(n) === i);
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
    const bloquantes = infosManquantes().length;
    const aConfirmer = infosAConfirmer().length;
    const sources = dbSources();

    etapes.cabinet = {
      chantiers: [
        chantier({
          cle: 'depot', section: 'documents-cabinet', sub: null, urgence: 2,
          libelle: 'Déposer les documents du cabinet',
          libelleFait: `${sources.length} ${pluriel(sources.length, 'document déposé', 'documents déposés')}`,
          detail: sources.length ? null : 'Aucun document n’a encore été déposé.',
          fait: sources.length > 0, court: 'Continuer les documents',
        }),
        chantier({
          cle: 'aConfirmer', section: 'documents-cabinet', sub: 'a-confirmer', urgence: 1,
          libelle: `Confirmer ${aConfirmer} ${pluriel(aConfirmer, 'information')}`,
          libelleFait: 'Toutes les informations trouvées sont confirmées',
          detail: aConfirmer ? 'Extraites d’un document, elles attendent votre validation.' : null,
          fait: aConfirmer === 0,
          court: `Confirmer ${aConfirmer} ${pluriel(aConfirmer, 'information')}`,
        }),
        chantier({
          cle: 'manquantes', section: 'documents-cabinet', sub: 'manquantes', urgence: 0,
          libelle: `Compléter ${bloquantes} ${pluriel(bloquantes, 'information manquante', 'informations manquantes')}`,
          libelleFait: 'Aucune information ne manque',
          detail: bloquantes ? 'Sans elles, le manuel ne peut pas être produit.' : null,
          fait: bloquantes === 0,
          court: `Compléter ${bloquantes} ${pluriel(bloquantes, 'information')}`,
        }),
      ],
      /* Le § 14 nomme les six valeurs que cette colonne doit porter. Ce sont
         des valeurs, pas des compteurs : un contrôleur qui demande la
         dénomination du cabinet veut la lire. Une valeur absente se voit —
         elle n'est pas comblée par une invention. */
      faits: [
        fait('Dénomination', dbValeur('cabinet.denomination'), 'cabinet.denomination'),
        fait('Forme juridique', dbValeur('cabinet.forme'), 'cabinet.forme'),
        fait('Adresse', dbValeur('cabinet.adresse'), 'cabinet.adresse'),
        fait('Inscription à l’Ordre', dbValeur('cabinet.inscription'), 'cabinet.inscription'),
        fait('Effectif', dbValeur('orga.effectif'), 'orga.effectif'),
        fait('Responsable principal', dbValeur('orga.gerant'), 'orga.gerant'),
      ],
      rienFait: sources.length === 0 && dbReferentiel().every(i => !i.valeur),
      bloque: identiteManquante.length > 0 || bloquantes > 0,
    };
  })();

  /* ------------------------------------------------------- 2. Gouvernance */
  (() => {
    const roles = dbRoles();
    const sansTitulaire = dbRolesNonCouverts();
    const declarations = dbDeclarations(annee);
    const declKo = declarations.filter(d => d.statut !== 'signee');
    const dependances = dependanceASurveiller(r.seuilDependance);
    const sansMesure = dependances.filter(d => !d.mesures || !d.mesures.length);

    const titulaire = code => {
      const x = roles.find(y => y.code === code);
      return x && x.titulaireEffectif ? x.titulaireEffectif : null;
    };
    const signees = declarations.length - declKo.length;

    etapes.gouvernance = {
      chantiers: [
        chantier({
          cle: 'roles', section: 'gouvernance', sub: 'organisation', urgence: 0,
          libelle: `Désigner ${sansTitulaire.length} ${pluriel(sansTitulaire.length, 'responsable')}`,
          libelleFait: 'Organisation & responsabilités',
          detail: sansTitulaire.length
            ? sansTitulaire.map(x => x.label).join(', ') + '.'
            : `${roles.length} ${pluriel(roles.length, 'rôle couvert', 'rôles couverts')}.`,
          fait: sansTitulaire.length === 0, court: 'Désigner les responsables',
        }),
        chantier({
          cle: 'independance', section: 'gouvernance', sub: 'independance', urgence: 1,
          libelle: `Recueillir ${declKo.length} ${pluriel(declKo.length, 'déclaration')} d’indépendance`,
          libelleFait: 'Indépendance',
          detail: `Campagne ${annee} : ${signees} ${pluriel(signees, 'signée', 'signées')} sur ${declarations.length}.`,
          fait: declKo.length === 0, court: 'Ouvrir la campagne',
        }),
        chantier({
          cle: 'dependance', section: 'gouvernance', sub: 'dependance', urgence: 1,
          libelle: `Documenter les mesures de ${sansMesure.length} ${pluriel(sansMesure.length, 'dossier')}`,
          libelleFait: 'Dépendance économique',
          detail: `Seuil de ${pourcent(r.seuilDependance)} — ${dependances.length} ${pluriel(dependances.length, 'dossier suivi', 'dossiers suivis')}.`,
          fait: sansMesure.length === 0, court: 'Documenter les mesures',
        }),
      ],
      faits: [
        fait('Responsable qualité', titulaire('qualite'), 'orga.responsableQualite', nomsDuCabinet()),
        fait('Déclarant Tracfin', titulaire('declarant'), 'lbcft.declarant', nomsDuCabinet()),
        fait('Correspondant Tracfin', titulaire('correspondant'), 'lbcft.correspondant', nomsDuCabinet()),
        fait(`Campagne d’indépendance ${annee}`, `${signees} ${pluriel(signees, 'signée', 'signées')} sur ${declarations.length}.`),
      ],
      rienFait: sansTitulaire.length === roles.length,
      bloque: false,
    };
  })();

  /* --------------------------------------------------------- 3. Ressources */
  (() => {
    const sansAttestation = formationsNonAJour();
    const prestataires = dbPrestataires();
    const aConfirmer = prestatairesAConfirmer();
    const traitements = traitementsARevoir();

    etapes.ressources = {
      chantiers: [
        chantier({
          cle: 'equipe', section: 'ressources', sub: 'equipe', urgence: 2,
          libelle: 'Équipe', libelleFait: 'Équipe',
          detail: `${COLLABORATEURS.length} ${pluriel(COLLABORATEURS.length, 'collaborateur décrit', 'collaborateurs décrits')}.`,
          fait: true, court: 'Voir l’équipe',
        }),
        chantier({
          cle: 'formation', section: 'ressources', sub: 'formation', urgence: 1,
          libelle: `Réunir ${sansAttestation.length} ${pluriel(sansAttestation.length, 'attestation')} de formation`,
          libelleFait: 'Formation',
          detail: sansAttestation.length
            ? 'Formation LBC-FT — article L. 561-33 du code monétaire et financier.'
            : 'Toutes les attestations de la dernière session sont reçues.',
          fait: sansAttestation.length === 0, court: 'Suivre les formations',
        }),
        chantier({
          cle: 'prestataires', section: 'ressources', sub: 'outils', urgence: 2,
          libelle: `Confirmer ${aConfirmer.length} ${pluriel(aConfirmer.length, 'prestataire')}`,
          libelleFait: 'Outils & prestataires',
          detail: `${prestataires.length - aConfirmer.length} ${pluriel(prestataires.length - aConfirmer.length, 'fiche confirmée', 'fiches confirmées')} sur ${prestataires.length}.`,
          fait: aConfirmer.length === 0, court: 'Confirmer les prestataires',
        }),
        chantier({
          cle: 'rgpd', section: 'ressources', sub: 'rgpd', urgence: 2,
          libelle: `Revoir ${traitements.length} ${pluriel(traitements.length, 'traitement')} du registre RGPD`,
          libelleFait: 'RGPD & données',
          detail: traitements.length ? 'Aucune revue n’est datée.' : 'Le registre des traitements est à jour.',
          fait: traitements.length === 0, court: 'Revoir le registre RGPD',
        }),
      ],
      faits: [
        fait('Effectif du cabinet', `${COLLABORATEURS.length} ${pluriel(COLLABORATEURS.length, 'personne')}`),
        fait('Infogérant', dbValeur('info.infogerant'), 'info.infogerant'),
        fait('Hébergement des données', dbValeur('info.hebergement'), 'info.hebergement'),
        fait('Dernier test de restauration', dbValeur('info.testRestauration'), 'info.testRestauration'),
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

    etapes.missions = {
      chantiers: [
        chantier({
          cle: 'ldm', section: 'anomalies', sub: 'lettres', urgence: 0,
          libelle: `Régulariser ${aRegulariser} ${pluriel(aRegulariser, 'lettre de mission', 'lettres de mission')}`,
          libelleFait: 'Lettres de mission',
          detail: aRegulariser
            ? `${ldm.absentes.length} ${pluriel(ldm.absentes.length, 'absente')}, ${ldm.critiques.length} ${pluriel(ldm.critiques.length, 'à refaire', 'à refaire')}.`
            : `${ldm.aJour.length} ${pluriel(ldm.aJour.length, 'lettre à jour', 'lettres à jour')} sur ${ldm.lignes.length}.`,
          fait: aRegulariser === 0, court: 'Régulariser les lettres',
        }),
        chantier({
          cle: 'supervision', section: 'cycle-client', sub: 'supervision', urgence: 2,
          libelle: 'Supervision des bilans', libelleFait: 'Supervision des bilans',
          detail: 'Notes de synthèse préparées par les collaborateurs.',
          fait: true, court: 'Ouvrir la supervision',
        }),
        chantier({
          cle: 'reclamations', section: 'cycle-client', sub: 'reclamations', urgence: 1,
          libelle: `Clôturer ${reclamations.length} ${pluriel(reclamations.length, 'réclamation')}`,
          libelleFait: 'Réclamations',
          detail: reclamations.length
            ? 'Une réponse a pu être apportée sans que la fiche soit close.'
            : `${dbReclamations().length} ${pluriel(dbReclamations().length, 'réclamation enregistrée', 'réclamations enregistrées')}, toutes closes.`,
          fait: reclamations.length === 0, court: 'Ouvrir les réclamations',
        }),
      ],
      faits: [
        fait(`Lettres à jour`, `${ldm.aJour.length} sur ${ldm.lignes.length}.`),
        fait('Réclamations enregistrées', String(dbReclamations().length)),
        /* Le § 17 est explicite : maintien et sortie de mission se suivent dans
           Quadra. ComplyEC le dit et n'offre aucun bouton « Gérer » — proposer
           un écran qui ne fait rien serait pire que ne rien proposer. */
        fait('Maintien des missions', 'Suivi dans Quadra, hors ComplyEC.'),
        fait('Sorties de mission', 'Suivi dans Quadra, hors ComplyEC.'),
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
    const critiques = aTraiter.filter(t => t.priorite === 'Critique').length;

    etapes.lbcft = {
      chantiers: [
        chantier({
          cle: 'roles-lbcft', section: 'gouvernance', sub: 'organisation', urgence: 0,
          libelle: `Désigner ${rolesKo.length} ${pluriel(rolesKo.length, 'responsable')} LBC-FT`,
          libelleFait: 'Organisation du dispositif',
          detail: rolesKo.length
            ? rolesKo.map(x => x.label).join(', ') + '.'
            : 'Référent, déclarant et correspondant sont désignés.',
          fait: rolesKo.length === 0, court: 'Désigner les responsables',
        }),
        chantier({
          cle: 'vigilance', section: 'vigilance', sub: 'a-traiter', urgence: critiques ? 0 : 1,
          libelle: `Analyser ${aTraiter.length} ${pluriel(aTraiter.length, 'dossier')}`,
          libelleFait: 'Couverture du portefeuille',
          detail: aTraiter.length
            ? (critiques ? `${critiques} ${pluriel(critiques, 'dossier critique', 'dossiers critiques')}.` : 'Analyse jamais faite ou échue.')
            : `${couverts.length} ${pluriel(couverts.length, 'dossier couvert', 'dossiers couverts')} sur ${dossiers.length}.`,
          fait: aTraiter.length === 0, court: 'Continuer le parcours LBC-FT',
        }),
        chantier({
          cle: 'rbe', section: 'vigilance', sub: 'campagne-rbe', urgence: 1,
          libelle: `Traiter ${divergences.length} ${pluriel(divergences.length, 'divergence')} au registre des bénéficiaires`,
          libelleFait: 'Registre des bénéficiaires effectifs',
          detail: divergences.length
            ? 'Article L. 561-45-1 du code monétaire et financier.'
            : 'Aucune divergence à signaler.',
          fait: divergences.length === 0, court: 'Traiter les divergences',
        }),
        chantier({
          cle: 'controles', section: 'vigilance', sub: 'campagne-controles', urgence: 2,
          libelle: `Faire ${controles.length} ${pluriel(controles.length, 'contrôle ciblé', 'contrôles ciblés')}`,
          libelleFait: 'Contrôles ciblés',
          detail: controles.length ? 'Gel des avoirs, PPE, pays à risque.' : 'Tous les contrôles ciblés sont faits.',
          fait: controles.length === 0, court: 'Faire les contrôles',
        }),
        chantier({
          cle: 'cartographie', section: 'vigilance', sub: 'cartographie', urgence: 2,
          libelle: derniereCarto ? 'Actualiser la cartographie LBC-FT' : 'Arrêter la cartographie LBC-FT',
          libelleFait: 'Cartographie LBC-FT',
          detail: derniereCarto
            ? `Dernier arrêté le ${formatDate(derniereCarto.date)}.`
            : 'Jamais arrêtée.',
          fait: !!derniereCarto && !cartoPerimee,
          court: derniereCarto ? 'Actualiser la cartographie' : 'Arrêter la cartographie',
        }),
      ],
      faits: [
        fait('Dossiers couverts', `${couverts.length} sur ${dossiers.length}.`),
        fait('Vigilance renforcée', String(dossiers.filter(d => d.niveauRetenu === 'Renforcée').length)),
        fait('Cartographie arrêtée', derniereCarto ? formatDate(derniereCarto.date) : null),
        fait('Déclarant Tracfin', dbValeur('lbcft.declarant'), 'lbcft.declarant', nomsDuCabinet()),
      ],
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
    const tous = dbRisquesQualite();
    /* Une non-conformité ouverte ne bloque pas si son plan d'action est tracé
       (§ 44) : c'est précisément ce que la NPMQ attend d'un cabinet — non pas
       zéro incident, mais un incident traité. */
    const ncSansPlan = dbNonConformites().filter(n => etatNonConformite(n) === 'ouverte');
    const ncSuivies = dbNonConformites().filter(n => etatNonConformite(n) === 'attente-efficacite');
    const controlesFaits = dbControles().filter(c => c.date).length;
    const evaluationPerimee = anneeDe(QUALITE_DERNIERE_REVUE) < annee;

    etapes.qualite = {
      chantiers: [
        chantier({
          cle: 'risques', section: 'qualite', sub: 'carto-qualite', urgence: 1,
          libelle: `Valider ${risques.length} ${pluriel(risques.length, 'domaine de risque', 'domaines de risque')}`,
          libelleFait: 'Cartographie des risques qualité',
          detail: `${tous.length - risques.length} ${pluriel(tous.length - risques.length, 'domaine revu', 'domaines revus')} sur ${tous.length}.`,
          fait: risques.length === 0, court: 'Valider les risques',
        }),
        chantier({
          cle: 'nc', section: 'qualite', sub: 'non-conformites', urgence: 0,
          libelle: `Ouvrir un plan d’action sur ${ncSansPlan.length} ${pluriel(ncSansPlan.length, 'non-conformité', 'non-conformités')}`,
          libelleFait: 'Non-conformités',
          detail: ncSansPlan.length
            ? 'Constatée mais sans action décidée.'
            : `${ncSuivies.length} ${pluriel(ncSuivies.length, 'suivie', 'suivies')}, plan d’action tracé.`,
          fait: ncSansPlan.length === 0, court: 'Traiter les non-conformités',
        }),
        chantier({
          cle: 'surveillance', section: 'qualite', sub: 'surveillance', urgence: 2,
          libelle: 'Mener la surveillance annuelle',
          libelleFait: 'Surveillance annuelle',
          detail: `${ECHANTILLON_SURVEILLANCE.length} ${pluriel(ECHANTILLON_SURVEILLANCE.length, 'dossier')} dans l’échantillon.`,
          fait: controlesFaits > 0, court: 'Ouvrir la surveillance',
        }),
        chantier({
          cle: 'evaluation', section: 'qualite', sub: 'evaluation', urgence: 2,
          libelle: 'Actualiser l’évaluation annuelle',
          libelleFait: 'Évaluation annuelle',
          detail: `Dernière revue le ${formatDate(QUALITE_DERNIERE_REVUE)}.`,
          fait: !evaluationPerimee, court: 'Actualiser l’évaluation',
        }),
      ],
      faits: [
        fait('Domaines validés', `${tous.length - risques.length} sur ${tous.length}.`),
        fait('Non-conformités ouvertes', String(ncOuvertes().length)),
        fait('Échantillon de surveillance', `${ECHANTILLON_SURVEILLANCE.length} dossiers`),
        fait('Dernière revue qualité', formatDate(QUALITE_DERNIERE_REVUE)),
      ],
      rienFait: risques.length === tous.length && controlesFaits === 0,
      perime: evaluationPerimee && !risques.length && !ncSansPlan.length,
      bloque: false,
    };
  })();

  /* ------------------------------------------------- 7. Manuel & contrôle */
  (() => {
    const parties = MANUEL_PARTIES.map(p => ({ p, e: etatPartieManuel(p) }));
    const bloquees = parties.filter(x => x.e.bloque);
    const version = manuelVersionEnVigueur();
    const validees = Object.keys(dbManuelPartiesValidees()).length;
    const documents = dbDocumentsGeneres();
    const aRegenerer = documents.filter(d => d.etat === 'a-regenerer');

    etapes.manuel = {
      chantiers: [
        chantier({
          cle: 'manuel', section: 'manuel', sub: null, urgence: bloquees.length ? 0 : 1,
          libelle: bloquees.length
            ? `Compléter ${bloquees.length} ${pluriel(bloquees.length, 'partie')} du manuel`
            : (validees < MANUEL_PARTIES.length
              ? `Relire ${MANUEL_PARTIES.length - validees} ${pluriel(MANUEL_PARTIES.length - validees, 'partie')} du manuel`
              : 'Publier le manuel'),
          libelleFait: 'Manuel de procédures',
          detail: bloquees.length
            ? bloquees.map(x => x.p.titre).join(', ') + '.'
            : `${validees} ${pluriel(validees, 'partie relue', 'parties relues')} sur ${MANUEL_PARTIES.length}.`,
          fait: !bloquees.length && validees >= MANUEL_PARTIES.length && !!version,
          court: bloquees.length ? 'Compléter le manuel' : 'Préparer le manuel',
        }),
        chantier({
          cle: 'preuves', section: 'qualite', sub: 'dossier-controle', urgence: 1,
          libelle: `Régénérer ${aRegenerer.length} ${pluriel(aRegenerer.length, 'document')}`,
          libelleFait: 'Preuves du contrôle',
          detail: aRegenerer.length
            ? 'Une information qu’ils impriment a changé depuis leur dernière version.'
            : `${documents.length} ${pluriel(documents.length, 'document à jour', 'documents à jour')}.`,
          fait: aRegenerer.length === 0, court: 'Voir les preuves',
        }),
        chantier({
          cle: 'pack', section: 'controle', sub: 'pack', urgence: 2,
          libelle: 'Préparer le pack de contrôle',
          libelleFait: 'Pack de contrôle',
          detail: dbPacks().length
            ? `Dernier pack arrêté le ${formatDate(dbPacks()[0].date)}.`
            : 'Rassemble le manuel, les registres et les preuves à une date donnée.',
          fait: dbPacks().length > 0, court: 'Préparer le pack',
        }),
      ],
      faits: [
        fait('Version du manuel', version ? version.numero : null),
        fait('Date de publication', version ? formatDate(version.dateEffet) : null),
        fait('Parties relues', `${validees} sur ${MANUEL_PARTIES.length}.`),
        fait('Documents disponibles', `${documents.length - aRegenerer.length} à jour sur ${documents.length}.`),
        fait('Dernière évaluation annuelle', formatDate(QUALITE_DERNIERE_REVUE)),
      ],
      rienFait: !version && validees === 0,
      bloque: bloquees.length > 0,
    };
  })();

  /* ------------------------------------------------- Statut de chaque étape */
  PARCOURS_ETAPES.forEach((e, i) => {
    const s = etapes[e.code];
    s.code = e.code;
    s.titre = e.titre;
    s.court = e.court;
    s.icone = e.icone;
    s.rang = i + 1;
    s.chantiers.sort((a, b) => (a.fait === b.fait ? a.urgence - b.urgence : (a.fait ? 1 : -1)));
    // `restes` : ce qui reste réellement à faire. C'est ce que lit l'accueil.
    s.restes = s.chantiers.filter(c => !c.fait);
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
