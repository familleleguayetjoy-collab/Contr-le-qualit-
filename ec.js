// ComplyEC — Écrans du module Expert-comptable
'use strict';

// ============================================================ 1. Vue d'ensemble

function ECOverview({ navigateEc, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const categories = anomaliesParCategorie();
  const collaborateurs = anomaliesParCollaborateurList();
  const dossiers = anomaliesParDossierList().slice(0, 5);
  const maxColabAnomalies = Math.max(...collaborateurs.map(c => c.anomalies), 1);

  const conformiteItems = [
    { key: 'formations', label: CONFORMITE_CABINET.formationsLBCFT.label, detail: `${CONFORMITE_CABINET.formationsLBCFT.nonAJour.length} collaborateurs non à jour`, color: 'orange' },
    { key: 'declarations', label: CONFORMITE_CABINET.declarationsIndependance.label, detail: `${CONFORMITE_CABINET.declarationsIndependance.manquantes.length} manquantes`, color: 'orange' },
    { key: 'dependance', label: CONFORMITE_CABINET.dependanceEconomique.label, detail: (n => `${n} ${pluriel(n, 'dossier')} à surveiller`)(dependanceASurveiller(settings.seuilDependance).length), color: 'orange' },
    { key: 'diffusion', label: CONFORMITE_CABINET.diffusionProcedures.label, detail: `${CONFORMITE_CABINET.diffusionProcedures.accusesManquants.length} accusés manquants`, color: 'orange' },
  ];

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Bonjour Martin Dupont')),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select' }, h('option', null, '📅 Période : Mai 2026')),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Rapport exporté (démonstration)') }, '⬇ Exporter le rapport')
      )
    ),
    h('div', { className: 'dashboard-grid' },
      h(Card, { title: '1. Priorités par catégories', icon: '📋', iconBg: '#E9F1FE', iconColor: '#2563EB',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'categories') }, 'Voir le détail →') },
        categories.map(c => h('div', { className: 'list-row', key: c.code },
          h('span', { className: 'list-row-label' }, h(Dot, { color: PRIORITE_COULEURS[c.priorite] }), c.label),
          h('span', { className: 'list-row-value' }, c.anomalies)
        ))
      ),
      h(Card, { title: '2. Anomalies par collaborateur', icon: '👤', iconBg: '#E7F7ED', iconColor: '#16A34A',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'collaborateur') }, 'Voir le détail →') },
        collaborateurs.map(c => h('div', { className: 'bar-row', key: c.id },
          h('span', { className: 'bar-name' }, c.nom),
          h('span', { className: 'bar-track' }, h('span', { className: 'bar-fill', style: { width: (c.anomalies / maxColabAnomalies * 100) + '%', '--bar-color': c.couleur } })),
          h('span', { className: 'bar-value' }, c.anomalies)
        ))
      ),
      h(Card, { title: '3. Dossiers nécessitant votre attention', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('anomalies', 'dossier') }, 'Voir le détail →') },
        dossiers.map(d => h('div', { className: 'list-row', key: d.dossier.id },
          h('span', { className: 'list-row-label' }, h(Dot, { color: urgenceDossier(d.anomalies) }), d.dossier.nom),
          h('span', { className: 'list-row-value' }, d.anomalies + ' problème' + (d.anomalies > 1 ? 's' : ''))
        ))
      ),
      h(Card, { title: '4. Conformité cabinet', icon: '🛡️', iconBg: '#F1EAFE', iconColor: '#7C3AED',
        footer: h('button', { className: 'card-link', onClick: () => navigateEc('gouvernance', null) }, 'Voir le détail →') },
        conformiteItems.map(c => h('div', { className: 'list-row', key: c.key },
          h('span', { className: 'list-row-label' }, h(Dot, { color: c.color }), c.label),
          h('span', { style: { fontWeight: 500, color: 'var(--text-muted)', fontSize: '12.3px' } }, c.detail)
        ))
      )
    )
  );
}

// ==================================================== Les hubs de la navigation V3
/*
   Le cahier V3 remplace les sous-menus déroulants par des hubs : on clique une
   entrée de menu, on voit ses thèmes en grandes cartes, on en ouvre un. Rien
   n'est caché derrière un chevron, et la barre latérale reste courte.

   Chaque hub suit la même mécanique : sans sous-écran demandé il montre ses
   cartes, avec un sous-écran il le rend et offre le retour au hub. Les compteurs
   ne s'affichent que lorsqu'ils appellent une action — « 3 à relancer » dit quoi
   faire, « 12 dossiers » ne dit rien.

   Les cartes des thèmes qui restent à construire le disent franchement, avec le
   numéro de la phase qui les apportera. Une carte muette laisserait croire à une
   panne ; une carte datée dit où en est le produit.
*/

/* En-tête commun aux hubs et à leurs sous-écrans : un titre, rien dessous, et
   le retour au hub quand on en a ouvert un. Le cahier interdit les sous-titres
   de page — ce qui explique un écran se lit dans ses cartes, pas au-dessus. */
function EnteteHub({ titre, onRetour, libelleRetour = '← Retour', actions }) {
  return h('div', { className: 'page-header' },
    h('div', null, h('h1', null, titre)),
    (onRetour || actions)
      ? h('div', { className: 'page-header-actions' },
        onRetour ? h('button', { className: 'btn btn-secondary', onClick: onRetour }, libelleRetour) : null,
        actions
      )
      : null
  );
}

/* Écran d'un thème que la refonte n'a pas encore atteint. Il ne fait pas
   semblant : il dit ce qui est prévu et quand. */
function HubAConstruire({ titre, phase, prevu, onRetour }) {
  return h('div', { className: 'page' },
    h(EnteteHub, { titre, onRetour }),
    h(FormSection, { icon: '🚧', title: 'Écran prévu, pas encore construit', ton: 'gris' },
      h('p', { className: 'conf-detail', style: { marginTop: 0 } },
        'Cet écran est spécifié au cahier des charges V3 et sera livré en ', h('b', null, 'phase ' + phase), '.'),
      prevu ? h('p', { className: 'conf-detail' }, prevu) : null,
      h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
        'Rien n’est simulé ici : tant que l’écran n’existe pas, ComplyEC ne fait pas croire qu’il fonctionne.')
    )
  );
}

// ----------------------------------------------------- S02 — Entrée en mission

function ECEntreeMission({ navigateEc }) {
  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Entrée en mission' }),
    h(ThemeHub, {
      colonnes: 2,
      cartes: [
        {
          cle: 'courrier', icone: '✉️', titre: 'Reprise déontologique',
          points: [
            'Le dossier vient d’un confrère',
            'Courrier et e-mail de reprise, pièces à réclamer',
            'Article 163 du décret n° 2012-432',
          ],
          libelleAction: 'Commencer →',
          onOuvrir: () => navigateEc('entree-mission', 'courrier'),
        },
        {
          cle: 'contractualisation', icone: '📝', titre: 'Contractualisation',
          points: [
            'Nouveau client ou nouvelle mission',
            'Lettre de mission, Drive, analyse LBC-FT',
            'Dix étapes, de la société à la validation',
          ],
          libelleAction: 'Commencer →',
          onOuvrir: () => navigateEc('entree-mission', 'contractualisation'),
        },
      ],
    })
  );
}

// ------------------------------------ S18 — Gouvernance & règles professionnelles

function ECGouvernance({ sub, navigateEc, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const retour = () => navigateEc('gouvernance', null);
  const dependances = dependanceASurveiller(settings.seuilDependance);
  const manquantes = declarationsIndependanceAnnee(currentCalendarYear()).filter(d => d.statut !== 'signee');

  if (sub === 'independance') return h(CampagneIndependance, { onBack: retour, showToast });
  if (sub === 'dependance') return h('div', { className: 'page' }, h(DependanceEconomiqueListe, { onBack: retour, showToast, cabinetSettings: settings }));
  if (sub === 'organisation') return h(OrganisationResponsabilites, { onBack: retour, showToast });

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Gouvernance & règles professionnelles' }),
    h(ThemeHub, { cartes: [
      { cle: 'organisation', icone: '🏛️', titre: 'Organisation & responsabilités',
        compteur: (n => (n ? `${n} ${pluriel(n, 'rôle non couvert', 'rôles non couverts')}` : null))(rolesNonCouverts().length),
        tonCompteur: 'rouge',
        onOuvrir: () => navigateEc('gouvernance', 'organisation') },
      { cle: 'independance', icone: '📜', titre: 'Indépendance',
        compteur: manquantes.length ? `${manquantes.length} à relancer` : null,
        onOuvrir: () => navigateEc('gouvernance', 'independance') },
      { cle: 'dependance', icone: '⚖️', titre: 'Dépendance économique',
        compteur: dependances.length ? `${dependances.length} ${pluriel(dependances.length, 'dossier')} au-dessus du seuil` : null,
        onOuvrir: () => navigateEc('gouvernance', 'dependance') },
    ] })
  );
}

// --------------------------------------- S22 — Ressources & moyens du cabinet

function ECRessources({ sub, navigateEc, showToast, cabinetSettings, onApercuCollab }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const retour = () => navigateEc('ressources', null);

  if (sub === 'equipe') return h(EquipeSMQ, { showToast, onApercuCollab, onBack: retour, navigateEc });
  if (sub === 'formation') return h(FormationPilotage, { showToast, cabinetSettings: settings, onBack: retour, navigateEc });
  if (sub === 'sessions') return h('div', { className: 'page' }, h(FormationsLBCFTManager, { showToast, cabinetSettings: settings, onBack: () => navigateEc('ressources', 'formation') }));
  if (sub === 'outils') return h(OutilsPrestataires, { onBack: retour, showToast, navigateEc });
  if (sub === 'rgpd') return h(RgpdHub, { navigateEc, showToast });
  if (sub === 'rgpd-traitements') return h(RgpdTraitements, { onBack: () => navigateEc('ressources', 'rgpd'), showToast });
  if (sub === 'rgpd-prestataires' || sub === 'rgpd-mesures') return h(RgpdPrestataires, { onBack: () => navigateEc('ressources', 'rgpd'), showToast, navigateEc });

  // Le compteur de la carte Formation ne parle que s'il appelle une action :
  // ce sont les attestations manquantes, pas le nombre de sessions tenues.
  const sansAttestation = formationsNonAJour();
  const manqueFormation = sansAttestation.length
    ? `${sansAttestation.length} ${pluriel(sansAttestation.length, 'attestation')} ${pluriel(sansAttestation.length, 'manquante')}`
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Ressources & moyens du cabinet' }),
    h(ThemeHub, { cartes: [
      { cle: 'equipe', icone: '👥', titre: 'Équipe', onOuvrir: () => navigateEc('ressources', 'equipe') },
      { cle: 'formation', icone: '🎓', titre: 'Formation', compteur: manqueFormation, onOuvrir: () => navigateEc('ressources', 'formation') },
      { cle: 'outils', icone: '🧰', titre: 'Outils & prestataires',
        compteur: (n => (n ? `${n} à confirmer` : null))(prestatairesAConfirmer().length), tonCompteur: 'violet',
        onOuvrir: () => navigateEc('ressources', 'outils') },
      { cle: 'rgpd', icone: '🔐', titre: 'RGPD & données',
        compteur: (n => (n ? `${n} ${pluriel(n, 'traitement à revoir', 'traitements à revoir')}` : null))(traitementsARevoir().length), tonCompteur: 'violet',
        onOuvrir: () => navigateEc('ressources', 'rgpd') },
    ] })
  );
}

// ------------------------------------------- S29/S30 — Cycle de la relation client

/* Le cahier est explicite : pas de page hub intermédiaire ici, on ouvre
   directement deux onglets. La supervision des bilans y prend sa place — elle
   relève du cycle des missions, pas d'une rubrique à part. */
function ECCycleClient({ sub, navigateEc, showToast, focusDossier, onFocusHandled }) {
  const onglet = sub === 'reclamations' ? 'reclamations' : 'supervision';

  const onglets = h('div', { className: 'tabs' },
    h('button', {
      className: cx('tab', onglet === 'supervision' && 'active'),
      onClick: () => navigateEc('cycle-client', 'supervision'),
    }, 'Supervision'),
    h('button', {
      className: cx('tab', onglet === 'reclamations' && 'active'),
      onClick: () => navigateEc('cycle-client', 'reclamations'),
    }, 'Réclamations')
  );

  if (onglet === 'reclamations') return h(RegistreReclamations, { showToast, entete: onglets });

  return h(ECBilan, { showToast, focusDossier, onFocusHandled, entete: onglets });
}

/* ------------------------------------------------ S21 — Dépendance économique

   Patron P3 : la liste des dossiers suivis à gauche, la fiche du dossier
   choisi à droite. Trois chiffres courts au-dessus pour situer — le seuil que
   le cabinet s'est donné, le nombre de dossiers suivis, et ceux qui le
   dépassent.

   Le cahier prévoit aussi le chiffre d'affaires de référence dans ce bandeau.
   Il n'existe pas encore comme donnée canonique du cabinet : l'inventer
   afficherait un chiffre faux, alors la tuile est absente jusqu'à ce que le
   référentiel le porte. */
function DependanceEconomiqueListe({ onBack, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const seuil = Number(settings.seuilDependance || SEUIL_DEPENDANCE_DEFAUT);
  const suivis = dependanceTousDossiers(seuil);
  const auDessus = suivis.filter(d => d.depasse);
  const [choisi, setChoisi] = useState(null);
  const [redige, setRedige] = useState(null);

  if (redige) {
    return h(DependanceEconomiqueForm, {
      record: redige, onBack: () => setRedige(null), showToast, cabinetSettings: settings,
    });
  }

  const colonnes = [
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: d => client(d.dossier).nom, rendu: d => client(d.dossier).nom },
    { code: 'part', titre: 'Part des honoraires', valeur: d => Number(d.partHonoraires), rendu: d => pourcent(d.partHonoraires) },
    { code: 'etat', titre: 'Situation', valeur: d => (d.depasse ? 0 : 1),
      rendu: d => h(Badge, { color: d.depasse ? 'orange' : 'vert' }, d.depasse ? 'Au-dessus du seuil' : 'Sous le seuil') },
  ];

  const fiche = choisi
    ? h(Card, {
      title: client(choisi.dossier).nom,
      subtitle: choisi.depasse ? 'Note d’indépendance requise' : 'Aucune note requise',
      icon: '⚖️', iconBg: '#FEF3E1', iconColor: '#B45309',
      tone: choisi.depasse ? 'orange' : 'vert',
    },
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Part des honoraires'),
        h(Badge, { color: choisi.depasse ? 'orange' : 'vert' }, pourcent(choisi.partHonoraires))),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Seuil du cabinet'),
        h('span', { className: 'conf-note' }, pourcent(seuil))),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Écart'),
        h('span', { className: 'conf-note' },
          (choisi.depasse ? '+ ' : '− '),
          Math.abs(Number(choisi.partHonoraires) - seuil).toFixed(1).replace('.', ','), ' points')),
      h('div', { className: 'detail-field', style: { marginTop: 14 } },
        h('div', { className: 'detail-field-label' }, 'Mesures de sauvegarde'),
        h('div', { className: 'detail-field-value' }, choisi.mesures || 'Aucune mesure décrite pour ce dossier.')),
      choisi.depasse
        ? h('button', { className: 'btn btn-primary btn-block', onClick: () => setRedige(choisi) }, 'Rédiger la note →')
        : h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          'Ce dossier reste sous le seuil que le cabinet s’est fixé : aucune note d’indépendance n’est attendue.')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Dépendance économique', onRetour: onBack }),
    h('div', { className: 'campagne-tuiles', style: { marginBottom: 18 } },
      h('div', { className: 'campagne-tuile' },
        h('div', { className: 'campagne-tuile-valeur' }, pourcent(seuil)),
        h('div', { className: 'campagne-tuile-libelle' }, 'Seuil fixé par le cabinet')),
      h('div', { className: 'campagne-tuile' },
        h('div', { className: 'campagne-tuile-valeur' }, suivis.length),
        h('div', { className: 'campagne-tuile-libelle' }, pluriel(suivis.length, 'dossier suivi', 'dossiers suivis'))),
      h('div', { className: cx('campagne-tuile', auDessus.length && 'ton-orange') },
        h('div', { className: 'campagne-tuile-valeur' }, auDessus.length),
        h('div', { className: 'campagne-tuile-libelle' }, 'Au-dessus du seuil'))
    ),
    h(ActionListDetail, {
      titreListe: 'Dossiers suivis', iconeListe: '⚖️',
      colonnes, lignes: suivis, cle: d => d.dossier, parPage: 5,
      triDefaut: { col: 'part', sens: 'desc' },
      vide: 'Aucun dossier ne pèse assez pour être suivi.',
      selection: choisi && choisi.dossier, onSelect: setChoisi,
      detail: fiche, detailIcone: '⚖️',
      detailVide: 'Choisissez un dossier pour voir son calcul et ses mesures',
    })
  );
}

// ------------------------------------------------------------- S31 — LBC-FT

function ECVigilanceHub({ sub, navigateEc, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const retour = () => navigateEc('vigilance', null);

  if (sub === 'portefeuille' || sub === 'analyses') {
    return h(ECVigilance, { sub: 'analyses', showToast, cabinetSettings: settings, onBack: retour });
  }
  if (sub === 'cartographie') return h(CartographieRisques, { showToast, cabinetNom: settings.nom, onBack: retour });
  if (sub === 'a-traiter') return h(HubAConstruire, {
    titre: 'LBC-FT — À traiter', phase: 5, onRetour: retour,
    prevu: 'Les dossiers dont la vigilance est à mettre à jour, à cause d’une échéance, d’un changement de bénéficiaire effectif ou d’une analyse jamais faite.',
  });
  if (sub === 'campagnes') return h(HubAConstruire, {
    titre: 'Campagnes & contrôles LBC-FT', phase: 5, onRetour: retour,
    prevu: 'Campagne d’interrogation du registre des bénéficiaires effectifs, contrôles PPE et gel des avoirs, sur le patron campagne.',
  });

  const aAnalyser = DOSSIERS_LBCFT.filter(d => d.statut !== 'complete');

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'LBC-FT' }),
    h(ThemeHub, { cartes: [
      { cle: 'a-traiter', icone: '📌', titre: 'À traiter',
        compteur: aAnalyser.length ? `${aAnalyser.length} ${pluriel(aAnalyser.length, 'dossier')}` : null,
        onOuvrir: () => navigateEc('vigilance', 'a-traiter') },
      { cle: 'portefeuille', icone: '🔍', titre: 'Portefeuille', onOuvrir: () => navigateEc('vigilance', 'portefeuille') },
      { cle: 'cartographie', icone: '🗺️', titre: 'Cartographie', onOuvrir: () => navigateEc('vigilance', 'cartographie') },
      { cle: 'campagnes', icone: '📨', titre: 'Campagnes & contrôles', onOuvrir: () => navigateEc('vigilance', 'campagnes') },
    ] })
  );
}

// ------------------------------------------------- S42 — Surveillance & qualité

function ECQualite({ sub, navigateEc, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const retour = () => navigateEc('qualite', null);

  if (sub === 'dossier-controle') return h(PreparationControleQualite, { showToast, cabinetSettings: settings, navigateEc, onBack: retour });
  if (sub === 'carto-qualite') return h(HubAConstruire, {
    titre: 'Cartographie des risques qualité', phase: 6, onRetour: retour,
    prevu: 'Un risque par domaine du système de management de la qualité : contexte, importance, occurrence, réponse retenue, responsable et échéance.',
  });
  if (sub === 'non-conformites') return h(HubAConstruire, {
    titre: 'Non-conformités', phase: 6, onRetour: retour,
    prevu: 'Constat, gravité, incidence, cause, action corrective, responsable, échéance et mesure de l’efficacité.',
  });
  if (sub === 'surveillance') return h(HubAConstruire, {
    titre: 'Surveillance annuelle', phase: 6, onRetour: retour,
    prevu: 'Tirage de l’échantillon, contrôle dossier par dossier, puis synthèse annuelle.',
  });
  if (sub === 'evaluation') return h(HubAConstruire, {
    titre: 'Évaluation annuelle du SMQ', phase: 6, onRetour: retour,
    prevu: 'La conclusion annuelle de l’expert-comptable sur le système de management de la qualité, prévue par la NPMQ.',
  });

  const etat = preparationControleQualite(settings);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Surveillance & qualité',
      actions: h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('qualite', 'dossier-controle') },
        '📂 Dossier de contrôle'),
    }),
    h(ThemeHub, { cartes: [
      { cle: 'carto-qualite', icone: '🗺️', titre: 'Cartographie des risques qualité', onOuvrir: () => navigateEc('qualite', 'carto-qualite') },
      { cle: 'non-conformites', icone: '🛠️', titre: 'Non-conformités', onOuvrir: () => navigateEc('qualite', 'non-conformites') },
      { cle: 'surveillance', icone: '🔬', titre: 'Surveillance annuelle', onOuvrir: () => navigateEc('qualite', 'surveillance') },
      { cle: 'evaluation', icone: '🎯', titre: 'Évaluation annuelle',
        compteur: etat.aTraiter ? `${etat.aTraiter} ${pluriel(etat.aTraiter, 'pièce')} à réunir` : null,
        onOuvrir: () => navigateEc('qualite', 'evaluation') },
    ] })
  );
}

// ============================================================ 2. Supervision bilan

function ECBilan({ showToast, focusDossier, onFocusHandled, entete }) {
  const [exercice, setExercice] = useState(currentExerciceYear());
  const [selected, setSelected] = useState(() => (focusDossier ? BILAN_DOSSIERS.find(b => b.dossier === focusDossier) || null : null));
  const [filtreCollab, setFiltreCollab] = useState('tous');
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState({ col: 'datePreparation', sens: 'desc' });

  function trierPar(col) {
    setTri(prev => (prev.col === col ? { col, sens: prev.sens === 'asc' ? 'desc' : 'asc' } : { col, sens: 'asc' }));
  }

  useEffect(() => {
    if (focusDossier) {
      const match = BILAN_DOSSIERS.find(b => b.dossier === focusDossier);
      if (match) { setSelected(match); setExercice(match.exercice); }
      if (onFocusHandled) onFocusHandled();
    }
    // eslint-disable-next-line
  }, [focusDossier]);

  if (selected) {
    return h(BilanDetail, { row: selected, onBack: () => setSelected(null), showToast });
  }

  const exerciceOptions = [...new Set([currentExerciceYear(), ...BILAN_DOSSIERS.map(b => b.exercice)])].sort((a, b) => b - a);
  const dossiersExercice = BILAN_DOSSIERS
    .filter(b => b.exercice === exercice)
    .filter(b => filtreCollab === 'tous' || b.collaborateur === filtreCollab)
    .filter(b => {
      const q = recherche.trim().toLowerCase();
      return !q || client(b.dossier).nom.toLowerCase().includes(q);
    })
    .slice()
    .sort((a, b) => {
      const val = r => ({
        dossier: client(r.dossier).nom,
        collaborateur: collaborateur(r.collaborateur).nom,
        datePreparation: r.datePreparation,
        statut: r.statut,
      })[tri.col];
      const va = val(a), vb = val(b);
      const cmp = String(va).localeCompare(String(vb), 'fr', { numeric: true });
      return tri.sens === 'asc' ? cmp : -cmp;
    });

  const pagination = usePagination(dossiersExercice, 20);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Cycle de la relation client')),
      h('div', { className: 'page-header-actions' },
        h('select', { className: 'pill-select', value: exercice, onChange: e => setExercice(Number(e.target.value)) },
          exerciceOptions.map(y => h('option', { key: y, value: y }, `Exercice : ${y}`))
        ),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Export généré (démonstration)') }, '⬇ Exporter')
      )
    ),
    // Les onglets Supervision / Réclamations du cycle client, quand l'écran
    // est ouvert depuis cette entrée de menu.
    entete || null,
    /* Bandeau de titre plein plutôt que titre discret : c'est le contenu
       principal de l'écran, il doit se voir avant les filtres. */
    h(FormSection, { icon: '📊', title: `Notes de synthèse — exercice ${exercice}`, ton: 'bleu',
      subtitle: `${dossiersExercice.length} ${pluriel(dossiersExercice.length, 'note')}`,
      style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' } },
      h('div', { className: 'filter-row' },
        h('input', {
          className: 'form-input', style: { maxWidth: 260 }, placeholder: 'Rechercher un dossier…',
          value: recherche, onChange: e => setRecherche(e.target.value),
        }),
        h('select', { className: 'form-select', style: { maxWidth: 220 }, value: filtreCollab, onChange: e => setFiltreCollab(e.target.value) },
          h('option', { value: 'tous' }, 'Tous les collaborateurs'),
          COLLABORATEURS.map(co => h('option', { key: co.id, value: co.id }, co.nom))
        ),
        (recherche || filtreCollab !== 'tous')
          ? h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { setRecherche(''); setFiltreCollab('tous'); } }, '✕ Réinitialiser')
          : null
      ),
      dossiersExercice.length === 0
        ? h(EmptyDetail, { icon: '📅', label: 'Aucun dossier ne correspond à ces filtres' })
        /* En-tête figé et liste numérotée : sur vingt lignes, on perd sinon de
           vue à quelle colonne on lit, et on ne sait plus où l'on en est. */
        : h(React.Fragment, null,
          h('div', { className: 'table-wrap entete-figee' },
            h('table', { className: 'data-table' },
              h('thead', null, h('tr', null,
                [[null, 'N°'], ['dossier', 'Dossier'], ['exercice', 'Exercice'], ['collaborateur', 'Collaborateur'], ['datePreparation', 'Note préparée le'], ['statut', 'Statut'], [null, '']].map(([col, label], i) =>
                  h('th', {
                    key: label || 'action' + i,
                    className: cx(col && 'th-sortable', tri.col === col && 'th-sorted', label === 'N°' && 'th-num'),
                    onClick: col ? () => trierPar(col) : undefined,
                  }, label, col ? h('span', { className: 'th-arrow' }, tri.col === col ? (tri.sens === 'asc' ? '▲' : '▼') : '↕') : null)
                )
              )),
              h('tbody', null,
                pagination.pageItems.map((b, i) => h('tr', { key: b.id, className: 'clickable', onClick: () => setSelected(b) },
                  h('td', { className: 'td-num' }, pagination.premierIndex + i + 1),
                  h('td', { className: 'table-name' }, client(b.dossier).nom),
                  h('td', null, b.exercice),
                  h('td', null, collaborateur(b.collaborateur).nom),
                  h('td', null, formatDate(b.datePreparation)),
                  h('td', null, h(Badge, { color: 'vert' }, '● ', b.statut)),
                  h('td', { className: 'td-action' }, h('button', { className: 'row-open-btn', 'aria-label': 'Ouvrir la note', title: 'Ouvrir la note', onClick: e => { e.stopPropagation(); setSelected(b); } }, '→'))
                ))
              )
            )
          ),
          h(Pagination, { pagination })
        )
    )
  );
}

function BilanDetail({ row, onBack, showToast }) {
  const c = client(row.dossier);
  const collab = collaborateur(row.collaborateur);
  const rentColor = { positif: 'vert', neutre: 'jaune', negatif: 'rouge' }[row.rentabilite.statut];
  const contColor = row.continuite.statut === 'ok' ? 'vert' : 'orange';
  const [commentaireEC, setCommentaireEC] = useState(row.commentaireEC || '');

  return h('div', { className: 'page' },
    h('button', { className: 'breadcrumb-back', onClick: onBack }, '← Retour à la liste'),
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, `${c.nom} — exercice ${row.exercice}`))
    ),
    /* Deux carrés : à gauche ce que le collaborateur a relevé, à droite ce que
       l'expert-comptable répond. Les quatre constats forment une grille 2×2 de
       tuiles identiques — un constat par tuile, toujours à la même place. */
    h('div', { className: 'grid-2 colonnes-egales' },
      h(FormSection, { icon: '📋', title: `Ce que ${collab.nom.split(' ')[0]} a relevé`, ton: 'bleu',
        style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },
        h('div', { className: 'note-corps' },
          h('div', { className: 'note-tuiles' },
            /* Chaque constat porte son propre détail : un état seul (« 2 points
               signalés ») ne dit pas ce qui a été relevé, et le renvoi vers un
               bloc séparé obligeait à chercher ailleurs dans l'écran. */
            h('div', { className: 'note-tuile' },
              h('span', { className: 'note-tuile-icone' }, '📈'),
              h('span', { className: 'note-tuile-cle' }, 'Rentabilité du dossier'),
              h('span', { className: 'note-tuile-valeur' }, h(Badge, { color: rentColor }, row.rentabilite.label))
            ),
            h('div', { className: 'note-tuile' },
              h('span', { className: 'note-tuile-icone' }, '✅'),
              h('span', { className: 'note-tuile-cle' }, 'Continuité d’exploitation'),
              h('span', { className: 'note-tuile-valeur' }, h(Badge, { color: contColor }, row.continuite.label))
            ),
            h('div', { className: 'note-tuile large' },
              h('span', { className: 'note-tuile-icone' }, '⚠️'),
              h('span', { className: 'note-tuile-cle' }, 'Problèmes comptables'),
              h('span', { className: 'note-tuile-valeur' }, h(Badge, { color: row.problemes.count > 0 ? 'orange' : 'vert' }, row.problemes.label)),
              row.problemes.description
                ? h('p', { className: 'note-tuile-texte' }, row.problemes.description)
                : null
            ),
            h('div', { className: 'note-tuile large' },
              h('span', { className: 'note-tuile-icone' }, '💬'),
              h('span', { className: 'note-tuile-cle' }, 'Sujets à évoquer au bilan'),
              h('p', { className: 'note-tuile-texte' }, row.sujets)
            )
          ),
          /* La note rédigée par le collaborateur existait dans les données mais
             n'était affichée nulle part : l'expert-comptable validait sans lire
             ce que son collaborateur avait écrit. */
          row.commentaireCollab ? h('div', { className: 'note-mot' },
            h('div', { className: 'note-mot-tete' },
              h('span', { className: 'avatar' }, collab.initiales || initialesDe(...collab.nom.split(' '))),
              h('span', { className: 'note-mot-cle' }, 'Note de ', collab.nom.split(' ')[0]),
              row.dateCommentaireCollab
                ? h('span', { className: 'note-mot-date' }, 'le ' + formatDate(row.dateCommentaireCollab))
                : null
            ),
            h('p', null, row.commentaireCollab)
          ) : null
        )
      ),
      h(FormSection, { icon: '🧑‍💼', title: 'Votre réponse au collaborateur', ton: 'bleu',
        style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },
        h('textarea', {
          className: 'form-textarea note-reponse',
          value: commentaireEC, onChange: e => setCommentaireEC(e.target.value),
          placeholder: 'Rédigez votre retour au collaborateur…',
        }),
        h('div', { className: 'note-pied' },
          h('span', { className: 'form-help', style: { margin: 0 } },
            row.dateCommentaireEC ? `Dernière mise à jour le ${formatDate(row.dateCommentaireEC)}` : 'Pas encore envoyé'),
          h('button', {
            className: 'btn btn-primary',
            onClick: () => { showToast('Supervision validée, réponse transmise et dossier archivé (démonstration)'); onBack(); },
          }, '✅ Valider et archiver')
        )
      )
    )
  );
}

// ============================================================ 3. Supervision des anomalies

function ECAnomalies({ sub, navigateEc, showToast, onOpenBilan, cabinetSettings }) {
  const current = sub || 'categories';
  const tabs = [
    { key: 'categories', label: 'Par catégories' },
    { key: 'collaborateur', label: 'Par collaborateur' },
    { key: 'dossier', label: 'Par dossier' },
    { key: 'relances', label: 'Relances et suivi' },
  ];
  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Dossiers & anomalies'))
    ),
    h('div', { className: 'subnav' },
      tabs.map(t => h('button', { key: t.key, className: cx('subnav-btn', current === t.key && 'active'), onClick: () => navigateEc('anomalies', t.key) }, t.label))
    ),
    current === 'categories' && h(AnomaliesParCategorie, { showToast, onOpenBilan }),
    current === 'collaborateur' && h(AnomaliesParCollaborateur, { showToast, onOpenBilan }),
    current === 'dossier' && h(AnomaliesParDossier, { showToast, onOpenBilan }),
    current === 'relances' && h(RelancesSuivi, { showToast, cabinetSettings })
  );
}

/* Relance groupée : plutôt que d'ouvrir chaque anomalie l'une après l'autre,
   on choisit les priorités concernées et on relance tout d'un coup. */
function RelanceGroupee({ anomalies, showToast }) {
  const [choix, setChoix] = useState({ Critique: true, Haute: true, Moyenne: false, Faible: false });
  const retenues = anomalies.filter(a => choix[a.priorite]);
  const collabs = new Set(retenues.map(a => a.collaborateur));

  return h(FormSection, { icon: '📨', title: 'Relancer en une fois', ton: 'bleu' },
    h('div', { className: 'relance-choix' },
      ['Critique', 'Haute', 'Moyenne', 'Faible'].map(p => {
        const n = anomalies.filter(a => a.priorite === p).length;
        return h('label', { className: cx('relance-case', !n && 'vide'), key: p },
          h('input', {
            type: 'checkbox', checked: !!choix[p], disabled: !n,
            onChange: () => setChoix(prev => ({ ...prev, [p]: !prev[p] })),
          }),
          h('span', { className: 'relance-case-nom' }, h(Dot, { color: PRIORITE_COULEURS[p] }), p),
          h('span', { className: 'relance-case-nb' }, n)
        );
      })
    ),
    h('button', {
      className: 'btn btn-primary btn-block', style: { marginTop: 12 },
      disabled: retenues.length === 0,
      onClick: () => showToast(`Relance envoyée à ${collabs.size} ${pluriel(collabs.size, 'collaborateur')} pour ${retenues.length} ${pluriel(retenues.length, 'anomalie')} (démonstration).`),
    }, retenues.length
      ? `📨 Relancer ${retenues.length} ${pluriel(retenues.length, 'anomalie')}`
      : 'Choisissez au moins une priorité')
  );
}

function AnomaliesParCategorie({ showToast, onOpenBilan }) {
  const categories = anomaliesParCategorie();
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);
  const toutes = categories.flatMap(c => c.items);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'stack-col' },
      h(FormSection, { icon: '📋', title: 'Priorités par catégories', ton: 'bleu' },
        h(TableauTrie, {
          lignes: categories, cle: c => c.code, parPage: 4,
          selection: selectedCat && selectedCat.code,
          onSelect: c => { setSelectedCat(c); setSelectedAnomalie(null); },
          triDefaut: { col: 'anomalies', sens: 'desc' },
          colonnes: [
            { code: 'label', titre: 'Catégorie', classe: 'table-name', valeur: c => c.label, rendu: c => c.label },
            { code: 'anomalies', titre: 'Anomalies', valeur: c => c.anomalies, rendu: c => c.anomalies },
            { code: 'dossiers', titre: 'Dossiers', valeur: c => c.dossiers, rendu: c => c.dossiers },
            { code: 'priorite', titre: 'Priorité', valeur: c => ORDRE_PRIORITE[c.priorite], rendu: c => h(PriorityBadge, { priorite: c.priorite }) },
            { code: 'action', titre: '', classe: 'td-action', rendu: () => h('button', { className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail' }, '→') },
          ],
        })
      ),
      selectedCat ? h(FormSection, { icon: '📁', title: `Dossiers concernés — ${selectedCat.label}`, ton: 'bleu', style: { marginTop: 16 } },
        h(TableauTrie, {
          lignes: selectedCat.items, cle: a => a.id, parPage: 3,
          selection: selectedAnomalie && selectedAnomalie.id,
          onSelect: setSelectedAnomalie,
          triDefaut: { col: 'dossier', sens: 'asc' },
          colonnes: [
            { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: a => client(a.dossier).nom, rendu: a => client(a.dossier).nom },
            { code: 'collaborateur', titre: 'Collaborateur', valeur: a => collaborateur(a.collaborateur).nom, rendu: a => collaborateur(a.collaborateur).nom },
            { code: 'action', titre: 'Dernière action', valeur: a => a.dernierAction, rendu: a => a.dernierAction },
          ],
        })
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenBilan }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCat ? 'Sélectionnez un dossier pour voir le détail' : 'Sélectionnez une catégorie pour voir les dossiers concernés' })),
      h(RelanceGroupee, { anomalies: toutes, showToast })
    )
  );
}

function AnomaliesParCollaborateur({ showToast, onOpenBilan }) {
  const collaborateurs = anomaliesParCollaborateurList();
  const [selectedCollab, setSelectedCollab] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);
  const toutes = collaborateurs.flatMap(c => c.items);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'stack-col' },
      h(FormSection, { icon: '👤', title: 'Anomalies par collaborateur', ton: 'bleu' },
        h(TableauTrie, {
          lignes: collaborateurs, cle: c => c.id, parPage: 4,
          selection: selectedCollab && selectedCollab.id,
          onSelect: c => { setSelectedCollab(c); setSelectedAnomalie(null); },
          triDefaut: { col: 'anomalies', sens: 'desc' },
          colonnes: [
            { code: 'nom', titre: 'Collaborateur', classe: 'table-name', valeur: c => c.nom, rendu: c => c.nom },
            { code: 'anomalies', titre: 'Anomalies', valeur: c => c.anomalies, rendu: c => c.anomalies },
            { code: 'dossiers', titre: 'Dossiers', valeur: c => c.dossiers, rendu: c => c.dossiers },
            { code: 'priorite', titre: 'Priorité', valeur: c => ORDRE_PRIORITE[c.prioriteMoyenne], rendu: c => h(PriorityBadge, { priorite: c.prioriteMoyenne }) },
            { code: 'action', titre: '', classe: 'td-action', rendu: () => h('button', { className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail' }, '→') },
          ],
        })
      ),
      selectedCollab ? h(FormSection, { icon: '⚠️', title: `Anomalies de ${selectedCollab.nom}`, ton: 'bleu', style: { marginTop: 16 } },
        h(TableauTrie, {
          lignes: selectedCollab.items, cle: a => a.id, parPage: 3,
          selection: selectedAnomalie && selectedAnomalie.id,
          onSelect: setSelectedAnomalie,
          triDefaut: { col: 'priorite', sens: 'asc' },
          colonnes: [
            { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: a => client(a.dossier).nom, rendu: a => client(a.dossier).nom },
            { code: 'titre', titre: 'Type d’anomalie', valeur: a => a.titre, rendu: a => a.titre },
            { code: 'priorite', titre: 'Priorité', valeur: a => ORDRE_PRIORITE[a.priorite], rendu: a => h(PriorityBadge, { priorite: a.priorite }) },
          ],
        })
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenBilan }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedCollab ? 'Sélectionnez une anomalie pour voir le détail' : 'Sélectionnez un collaborateur pour voir ses anomalies' })),
      h(RelanceGroupee, { anomalies: toutes, showToast })
    )
  );
}

function AnomaliesParDossier({ showToast, onOpenBilan }) {
  const dossiers = anomaliesParDossierList();
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedAnomalie, setSelectedAnomalie] = useState(null);
  const toutes = dossiers.flatMap(d => d.items);

  return h('div', { className: 'split-layout with-detail' },
    h('div', { className: 'stack-col' },
      h(FormSection, { icon: '📁', title: 'Anomalies par dossier', ton: 'bleu' },
        h(TableauTrie, {
          lignes: dossiers, cle: d => d.dossier.id, parPage: 4,
          selection: selectedDossier && selectedDossier.dossier.id,
          onSelect: d => { setSelectedDossier(d); setSelectedAnomalie(null); },
          triDefaut: { col: 'anomalies', sens: 'desc' },
          colonnes: [
            { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: d => d.dossier.nom, rendu: d => d.dossier.nom },
            { code: 'anomalies', titre: 'Anomalies', valeur: d => d.anomalies, rendu: d => d.anomalies },
            { code: 'priorite', titre: 'Priorité', valeur: d => ORDRE_PRIORITE[d.priorite], rendu: d => h(PriorityBadge, { priorite: d.priorite }) },
            { code: 'collaborateur', titre: 'Collaborateur', valeur: d => d.collaborateur.nom, rendu: d => d.collaborateur.nom },
            { code: 'action', titre: '', classe: 'td-action', rendu: () => h('button', { className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail' }, '→') },
          ],
        })
      ),
      selectedDossier ? h(FormSection, { icon: '⚠️', title: `Anomalies du dossier ${selectedDossier.dossier.nom}`, ton: 'bleu', style: { marginTop: 16 } },
        h(TableauTrie, {
          lignes: selectedDossier.items, cle: a => a.id, parPage: 3,
          selection: selectedAnomalie && selectedAnomalie.id,
          onSelect: setSelectedAnomalie,
          triDefaut: { col: 'priorite', sens: 'asc' },
          colonnes: [
            { code: 'titre', titre: 'Anomalie', classe: 'table-name', valeur: a => a.titre, rendu: a => a.titre },
            { code: 'priorite', titre: 'Priorité', valeur: a => ORDRE_PRIORITE[a.priorite], rendu: a => h(PriorityBadge, { priorite: a.priorite }) },
            { code: 'action', titre: 'Dernière action', valeur: a => a.dernierAction, rendu: a => a.dernierAction },
          ],
        })
      ) : null
    ),
    h('div', { className: 'detail-panel' },
      selectedAnomalie ? h(AnomalieDetailCard, { anomalie: selectedAnomalie, showToast, onOpenBilan }) :
        h('div', { className: 'card' }, h(EmptyDetail, { label: selectedDossier ? 'Sélectionnez une anomalie pour voir le détail' : 'Sélectionnez un dossier pour voir ses anomalies' })),
      h(RelanceGroupee, { anomalies: toutes, showToast })
    )
  );
}

function AnomalieDetailCard({ anomalie, showToast, onOpenBilan }) {
  const c = client(anomalie.dossier);
  const collab = collaborateur(anomalie.collaborateur);
  const isSupervision = anomalie.categorie === 'supervision_manquante';
  const bilanExistant = isSupervision ? BILAN_DOSSIERS.find(b => b.dossier === anomalie.dossier) : null;
  return h('div', { className: 'card' },
    h('div', { className: 'detail-panel-header' }, h('span', { className: 'card-title', style: { margin: 0 } }, 'Détail de l’anomalie'), h(PriorityBadge, { priorite: anomalie.priorite })),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, anomalie.titre)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dossier'), h('div', { className: 'detail-field-value' }, c.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Description'), h('div', { className: 'detail-field-value' }, anomalie.description)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date détectée'), h('div', { className: 'detail-field-value' }, formatDate(anomalie.dateDetection))),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Collaborateur en charge'), h('div', { className: 'detail-field-value' }, collab.nom)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dernière action'), h('div', { className: 'detail-field-value' }, anomalie.dernierAction)),
    h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Commentaire'), h('div', { className: 'detail-field-value' }, anomalie.commentaire)),
    bilanExistant ? h('div', { className: 'info-box', style: { marginBottom: 10 } }, 'ℹ️ ', 'La note de synthèse a déjà été transmise par le collaborateur — elle est en attente de votre validation.') : null,
    bilanExistant
      ? h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 6 }, onClick: () => onOpenBilan && onOpenBilan(anomalie.dossier) }, 'Accéder à la note et régulariser →')
      : h('button', { className: 'btn btn-primary btn-block', style: { marginTop: 6 }, onClick: () => showToast('Demande de régularisation envoyée au collaborateur (démonstration)') }, 'Demander au collaborateur de régulariser 📨')
  );
}

function RelancesSuivi({ showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const allRelances = relancesList(settings);
  const [selected, setSelected] = useState(null);
  const [statutFilter, setStatutFilter] = useState('tous');
  const [collabFilter, setCollabFilter] = useState('tous');
  const [sortOrder, setSortOrder] = useState('recent');
  // Les trois compteurs découpent l'ensemble sans recouvrement : sans réponse,
  // en cours, traitées. Le retard se surajoute et se compte à part.
  const sansReponse = allRelances.filter(r => r.statut === 'a_faire').length;
  const enCours = allRelances.filter(r => r.statut === 'en_cours').length;
  const traitees = allRelances.filter(r => r.statut === 'termine').length;
  const enRetard = allRelances.filter(r => r.enRetard).length;

  const relances = allRelances
    .filter(r => statutFilter === 'tous'
      || (statutFilter === 'en_retard' ? r.enRetard : r.statut === statutFilter))
    .filter(r => collabFilter === 'tous' || r.collaborateur === collabFilter)
    .sort((a, b) => sortOrder === 'recent'
      ? new Date(b.dateDemandeEC) - new Date(a.dateDemandeEC)
      : new Date(a.dateDemandeEC) - new Date(b.dateDemandeEC));
  const pagination = usePagination(relances, 5);

  return h('div', null,
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, allRelances.length),
        h('div', { className: 'stat-tile-label' }, pluriel(allRelances.length, 'demande'), ' ', pluriel(allRelances.length, 'envoyée'))),
      h('div', { className: cx('stat-tile', sansReponse ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, sansReponse),
        h('div', { className: 'stat-tile-label' }, 'sans réponse du collaborateur')),
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, enCours),
        h('div', { className: 'stat-tile-label' }, 'en cours de traitement')),
      h('div', { className: cx('stat-tile', enRetard ? 'rouge' : 'vert') },
        h('div', { className: 'stat-tile-value' }, enRetard),
        h('div', { className: 'stat-tile-label' }, `sans suite depuis plus de ${settings.relanceDelaiJours} jours`)),
      h('div', { className: cx('stat-tile', traitees ? 'vert' : 'gris') },
        h('div', { className: 'stat-tile-value' }, traitees),
        h('div', { className: 'stat-tile-label' }, pluriel(traitees, 'régularisée'))) 
    ),
    h('div', { className: 'split-layout with-detail' },
      h('div', { className: 'card' },
        h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Suivi des demandes de régularisation adressées aux collaborateurs')),
        h('div', { className: 'filter-row' },
          h('select', { className: 'pill-select', value: statutFilter, onChange: e => setStatutFilter(e.target.value) },
            h('option', { value: 'tous' }, 'Tous les statuts'),
            h('option', { value: 'a_faire' }, 'Sans réponse'),
            h('option', { value: 'en_cours' }, 'En cours de traitement'),
            h('option', { value: 'en_retard' }, `Sans suite depuis plus de ${settings.relanceDelaiJours} jours`),
            h('option', { value: 'termine' }, 'Régularisées')
          ),
          h('select', { className: 'pill-select', value: collabFilter, onChange: e => setCollabFilter(e.target.value) },
            h('option', { value: 'tous' }, 'Tous les collaborateurs'),
            COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
          ),
          h('select', { className: 'pill-select', value: sortOrder, onChange: e => setSortOrder(e.target.value) },
            h('option', { value: 'recent' }, 'Plus récent d’abord'),
            h('option', { value: 'ancien' }, 'Plus ancien d’abord')
          )
        ),
        relances.length === 0
          ? h(EmptyDetail, { icon: '📭', label: 'Aucune relance ne correspond à ces filtres' })
          : h(React.Fragment, null,
            h('div', { className: 'table-wrap' },
              h('table', { className: 'data-table' },
                h('thead', null, h('tr', null, ['Dossier et anomalie', 'Collaborateur', 'Demande envoyée', 'Statut', ''].map(c => h('th', { key: c }, c)))),
                h('tbody', null,
                  pagination.pageItems.map(r => h('tr', { key: r.id, className: cx('clickable', selected && selected.id === r.id && 'row-selected'), onClick: () => setSelected(r) },
                    // Cinq colonnes tiennent dans le volet, six débordaient et
                    // rognaient le statut : l'anomalie se lit sous son dossier.
                    h('td', { className: 'table-name' },
                      r.dossierInfo.nom,
                      h('div', { style: { fontWeight: 500, color: 'var(--text-muted)', fontSize: 12.8, marginTop: 2 } }, r.titre)),
                    h('td', null, r.collaborateurInfo.nom),
                    // La date et le délai dans la même cellule : une colonne de
                    // plus faisait déborder le tableau et rognait le statut.
                    h('td', null,
                      formatDate(r.dateDemandeEC),
                      h('div', { style: { marginTop: 3 } }, r.enRetard
                        ? h(Badge, { color: 'rouge' }, 'sans suite depuis ', r.joursEcoules, ' j')
                        : h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } }, 'il y a ', r.joursEcoules, ' ', pluriel(r.joursEcoules, 'jour')))),
                    h('td', null, h(StatutBadge, { statut: r.statut })),
                    h('td', null, h(DropdownMenu, { items: [
                      { label: '📨 Relancer le collaborateur', onClick: () => showToast('Relance envoyée (démonstration)') },
                      { label: '✅ Marquer comme terminé', onClick: () => showToast('Statut mis à jour (démonstration)') },
                    ] }))
                  ))
                )
              )
            ),
            h(Pagination, { pagination })
          )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h('div', { className: 'card' },
          h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Détail de la relance')),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Anomalie'), h('div', { className: 'detail-field-value' }, selected.titre)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Collaborateur'), h('div', { className: 'detail-field-value' }, selected.collaborateurInfo.nom)),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Date demande EC'), h('div', { className: 'detail-field-value' }, formatDate(selected.dateDemandeEC))),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Statut'), h(StatutBadge, { statut: selected.statut })),
          h('div', { className: 'detail-field' },
            h('div', { className: 'detail-field-label' }, 'Délai écoulé'),
            h('div', { className: 'detail-field-value' },
              selected.enRetard
                ? h(Badge, { color: 'rouge' }, 'Sans suite depuis ', selected.joursEcoules, ' jours')
                : h('span', null, selected.joursEcoules, ' ', pluriel(selected.joursEcoules, 'jour')),
              h('div', { className: 'form-help', style: { marginTop: 4 } },
                `Le cabinet considère une demande sans suite au-delà de ${selected.delaiCabinet} jours. Ce délai se règle dans Paramètres du cabinet.`))),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Dernière analyse du Drive'), h('div', { className: 'detail-field-value' }, formatDate(selected.dateDetection))),
          h('div', { className: 'detail-field' }, h('div', { className: 'detail-field-label' }, 'Commentaire'), h('div', { className: 'detail-field-value' }, `Demande de régularisation transmise au collaborateur après détection de l'anomalie dans le Drive. ${selected.commentaire}`)),
          h('button', { className: 'btn btn-primary btn-block', onClick: () => showToast('Relance envoyée au collaborateur (démonstration)') }, 'Relancer le collaborateur 📨')
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez une relance pour voir le détail' }))
      )
    )
  );
}

// ============================================================ 4. Mon équipe

function ECEquipe({ showToast, onApercuCollab, onBack }) {
  const [profiles, setProfiles] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function reload() {
    try {
      const liste = await dbEquipe();
      setLoadError(null);
      setProfiles(liste);
    } catch (err) {
      setLoadError(err.message || 'Impossible de charger les comptes.');
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Équipe')),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, '+ Ajouter un collaborateur')
      )
    ),
    showForm ? h(Modal, { title: 'Ajouter un collaborateur', onClose: () => setShowForm(false) },
      h(InviteCollaborateurForm, {
        onClose: () => setShowForm(false),
        onInvited: () => { setShowForm(false); reload(); },
        showToast,
      })
    ) : null,
    onApercuCollab ? h(Card, { title: 'Voir l’application comme un collaborateur', subtitle: 'Ouvre son espace en lecture — utile pour l’accompagner ou vérifier ce qu’il voit.', icon: '👁', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'bleu', style: { marginBottom: 18 } },
      h('div', { className: 'apercu-choix' },
        COLLABORATEURS.map(co => h('button', {
          key: co.id, className: 'apercu-btn', onClick: () => onApercuCollab(co.id),
        }, h('span', { className: 'avatar' }, co.initiales || initialesDe(...co.nom.split(' '))), co.nom))
      )
    ) : null,
    h('div', { className: 'card' },
      loadError ? h('div', { className: 'auth-error' }, loadError) :
      !profiles ? h('div', { className: 'form-help' }, 'Chargement…') :
        profiles.length === 0 ? h(EmptyDetail, { icon: '👥', label: 'Aucun collaborateur pour le moment' }) :
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Nom', 'Rôle', 'E-mail', 'Téléphone', 'Depuis'].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              profiles.map(p => h('tr', { key: p.id },
                h('td', { className: 'table-name' }, `${p.prenom} ${p.nom}`),
                h('td', null, p.role === 'expert_comptable' ? 'Expert-comptable' : 'Collaborateur'),
                h('td', null, p.email || '—'),
                h('td', null, p.telephone || '—'),
                h('td', null, p.created_at ? formatDate(p.created_at.slice(0, 10)) : '—')
              ))
            )
          ),
          dbEnBase() ? null : h('p', { className: 'form-help', style: { marginTop: 12 } },
            'ℹ️ Base non branchée : cette liste vient du jeu de démonstration. Les e-mails et téléphones n’existent que dans la base ; la colonne « Depuis » affiche ici la date d’entrée dans le cabinet, et non la date de création du compte.')
        )
    )
  );
}

function InviteCollaborateurForm({ onClose, onInvited, showToast }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const { data, error: invokeError } = await supabaseClient.functions.invoke('invite-collaborateur', {
        body: { prenom, nom, email, telephone: telephone || null },
      });
      if (invokeError) {
        let message = "Échec de l'invitation.";
        try { message = (await invokeError.context.json()).error || message; } catch {}
        throw new Error(message);
      }
      showToast(`Invitation envoyée à ${email}`);
      onInvited();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return h('div', { className: 'card', style: { marginBottom: 18 } },
    h('div', { className: 'card-title' }, h('span', { className: 'card-title-ink' }, 'Inviter un collaborateur')),
    h('form', { className: 'auth-form', onSubmit: submit },
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'Prénom', h('input', { required: true, value: prenom, onChange: e => setPrenom(e.target.value), autoFocus: true })),
        h('label', { className: 'auth-field' }, 'Nom', h('input', { required: true, value: nom, onChange: e => setNom(e.target.value) }))
      ),
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'E-mail', h('input', { type: 'email', required: true, value: email, onChange: e => setEmail(e.target.value) })),
        h('label', { className: 'auth-field' }, 'Téléphone (optionnel)', h('input', { type: 'tel', value: telephone, onChange: e => setTelephone(e.target.value) }))
      ),
      error ? h('div', { className: 'auth-error' }, error) : null,
      h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
        h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Annuler'),
        h('button', { type: 'submit', className: 'btn btn-primary', disabled: loading }, loading ? 'Envoi…' : "Envoyer l'invitation")
      )
    )
  );
}

// ============================================ Préparation du contrôle qualité

/* Le contrôle qualité se prépare avec des pièces, pas avec des intentions.
   Cet écran répond à une seule question : « si le contrôleur arrive demain,
   qu'est-ce que je peux lui poser sur la table, et qu'est-ce qui manque ? »

   Chaque composante du système de management de la qualité tient dans son
   rectangle titré, et chaque ligne dit franchement où on en est — y compris
   quand la preuve ne sort pas de ComplyEC. */
function PreparationControleQualite({ showToast, cabinetSettings, navigateEc, onBack }) {
  const etat = preparationControleQualite(cabinetSettings || CABINET_SETTINGS_DEFAUT);
  const composantesCompletes = etat.composantes.filter(c => c.nbATraiter === 0).length;
  // Deux façons de lire le même état : la liste de travail, et le tableau que
  // le contrôleur, lui, veut voir. La première par défaut : c'est celle qui
  // fait avancer le cabinet.
  const [vue, setVue] = useState('afaire');
  /* Les deux vues se feuillettent au lieu de défiler : une page de tâches, et
     deux composantes à la fois pour la vue du contrôleur. */
  const [pageCompo, setPageCompo] = useState(0);
  const [sensCompo, setSensCompo] = useState(1);

  function genererDossier() {
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    const corps = etat.composantes.map((c, i) => {
      const lignes = c.preuves.map(pr => {
        const e = CQ_ETATS[pr.etat];
        return `<tr>
            <td style="border:1px solid #C8D0DC; padding:5pt; width:52%;">${pr.libelle}<br><span style="font-size:8.5pt; color:#666;">${pr.source}</span></td>
            <td style="border:1px solid #C8D0DC; padding:5pt; width:16%;">${e.label}</td>
            <td style="border:1px solid #C8D0DC; padding:5pt; width:32%; font-size:9.5pt;">${pr.detail}</td>
          </tr>`;
      }).join('');
      return `<h2 style="font-size:13pt; margin-top:20pt;">${i + 1}. ${c.titreNorme || c.titre}</h2>
        <p style="font-size:10pt; color:#555; margin-top:0;">${c.resume}</p>
        <table style="border-collapse:collapse; width:100%; font-size:10pt;">
          <tr style="background:#EEF3FA;">
            <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Pièce attendue</th>
            <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">État</th>
            <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Situation au ${today}</th>
          </tr>${lignes}
        </table>`;
    }).join('');

    downloadWordDoc('Dossier_de_controle_qualite.doc', 'Dossier de contrôle qualité',
      `<h1 style="font-size:17pt;">Dossier de préparation du contrôle qualité</h1>
       <p style="font-size:9.5pt; color:#666;">Arrêté au ${today}. Structuré selon les huit composantes du système de management de la qualité prévues par la norme professionnelle de management de la qualité (NPMQ, ${NPMQ_ARRETE}).</p>
       <p><b>Pièces disponibles :</b> ${etat.ok} sur ${etat.total} — <b>à réunir :</b> ${etat.aTraiter} — <b>à fournir hors ComplyEC :</b> ${etat.externe}.</p>
       ${corps}
       <p style="margin-top:28pt; color:#999; font-size:8pt;">État établi automatiquement par ComplyEC à partir des données saisies dans le cabinet. Les pièces marquées « À fournir hors ComplyEC » ne sont pas produites par le logiciel et doivent être jointes par le cabinet.</p>`);
    showToast('Dossier de contrôle généré au format Word.');
  }

  const pastille = e => h('span', { className: cx('cq-pastille', CQ_ETATS[e].couleur), title: CQ_ETATS[e].label }, CQ_ETATS[e].puce);
  const pageAFaire = usePagination(etat.aFaire, 4);
  const nbPagesCompo = Math.max(1, Math.ceil(etat.composantes.length / 2));

  // ---------------------------------------------------- Liste de travail
  const listeAFaire = etat.aFaire.length === 0
    ? h('div', { className: 'card' }, h(EmptyDetail, { icon: '✅', label: 'Rien ne manque : votre dossier de contrôle est complet.' }))
    : h(React.Fragment, null,
      h('div', { className: 'cq-liste' },
        pageAFaire.pageItems.map((t, i) => h('div', { className: cx('cq-tache', t.etat), key: i },
          h('div', { className: 'cq-tache-rang' }, pageAFaire.premierIndex + i + 1),
          h('div', { className: 'cq-tache-corps' },
            h('div', { className: 'cq-tache-titre' },
              t.faire,
              t.nb > 1 ? h('span', { className: 'cq-tache-compte' }, t.nb) : null),
            h('div', { className: 'cq-tache-detail' }, t.detail),
            h('div', { className: 'cq-tache-meta' },
              h('span', { className: cx('badge', t.etat === 'absent' ? 'rouge' : 'orange') },
                t.etat === 'absent' ? 'Rien à montrer' : 'Incomplet'),
              h('span', { className: 'cq-source' }, t.source)
            )
          ),
          t.ou && navigateEc
            ? h('button', {
              className: 'btn btn-primary btn-sm cq-tache-bouton',
              onClick: () => navigateEc(t.ou[0], t.ou[1]),
            }, 'Y aller →')
            : h('span', { className: 'form-help', style: { margin: 0, maxWidth: 150 } }, 'À faire hors du logiciel')
        ))
      ),
      h(Pagination, { pagination: pageAFaire })
    );

  // ------------------------------------------- Vue par composante (contrôleur)
  const vueControleur = h(React.Fragment, null,
    h('div', { className: 'compo-nav' },
      h('button', {
        className: 'compo-fleche', 'aria-label': 'Composantes précédentes', disabled: pageCompo === 0,
        onClick: () => { setSensCompo(-1); setPageCompo(p => Math.max(0, p - 1)); },
      }, '‹'),
      h('span', { className: 'compo-rang' },
        `Composantes ${pageCompo * 2 + 1}–${Math.min(pageCompo * 2 + 2, etat.composantes.length)} sur ${etat.composantes.length}`),
      h('button', {
        className: 'compo-fleche', 'aria-label': 'Composantes suivantes', disabled: pageCompo >= nbPagesCompo - 1,
        onClick: () => { setSensCompo(1); setPageCompo(p => Math.min(nbPagesCompo - 1, p + 1)); },
      }, '›')
    ),
    h('div', { className: cx('cq-grid', 'compo-paire', sensCompo > 0 ? 'vers-droite' : 'vers-gauche'), key: pageCompo },
      etat.composantes.slice(pageCompo * 2, pageCompo * 2 + 2).map(c => h(FormSection, { key: c.id, icon: c.icone, title: c.titre, ton: c.ton },
        h('p', { className: 'cq-resume' },
          c.resume,
          c.titreNorme ? h('span', { className: 'cq-titre-norme' }, 'Dans la norme : ', c.titreNorme) : null
        ),
        c.preuves.map((pr, j) => h('div', { className: 'cq-preuve', key: j },
          pastille(pr.etat),
          h('div', { className: 'cq-preuve-corps' },
            h('div', { className: 'cq-preuve-titre' }, pr.libelle),
            h('div', { className: 'cq-preuve-detail' }, pr.detail),
            h('span', { className: 'cq-source' }, pr.source)
          )
        ))
      ))
    )
  );

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Dossier de contrôle')
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        h('button', { className: 'btn btn-primary', onClick: genererDossier }, '📄 Générer le dossier pour le contrôleur')
      )
    ),
    h('div', { className: 'filter-row', style: { marginBottom: 18 } },
      h('button', { className: cx('subnav-btn', vue === 'afaire' && 'active'), onClick: () => setVue('afaire') },
        'Ce qu’il vous reste à faire (', etat.aFaire.length, ')'),
      h('button', { className: cx('subnav-btn', vue === 'norme' && 'active'), onClick: () => setVue('norme') },
        'Vue du contrôleur, par composante')
    ),
    vue === 'afaire' ? listeAFaire : vueControleur
  );
}

// ========================================== Régularisation des anciennes lettres

/* Deux outils, dans l'ordre où on s'en sert : on dépose les lettres anciennes,
   l'outil dit lesquelles tiennent la route, puis on refait celles qui ne
   tiennent pas par le parcours habituel. Rien à apprendre. */
function RegularisationLettresMission({ showToast, onRefaire }) {
  const [analyses, setAnalyses] = useState([]);
  const [enCours, setEnCours] = useState(0);

  async function deposer(evenement) {
    const fichiers = [...(evenement.target.files || [])];
    evenement.target.value = '';
    if (!fichiers.length) return;
    setEnCours(fichiers.length);
    const resultats = [];
    for (const f of fichiers) {
      try {
        const nomStructure = ldmLireNomFichier(f.name);
        const texte = await docxLireTexte(f);
        const a = ldmAnalyserTexte(texte);
        resultats.push({ nom: f.name, nomStructure, ...a });
      } catch (err) {
        resultats.push({ nom: f.name, erreur: err.message, rubriques: [], manquantes: [], presentes: [], alertes: [], score: 0 });
      }
      setEnCours(n => n - 1);
    }
    setAnalyses(prev => [...resultats, ...prev]);
    showToast(`${resultats.length} ${pluriel(resultats.length, 'lettre')} ${pluriel(resultats.length, 'analysée')}.`);
  }

  const aRefaire = analyses.filter(a => !a.erreur && (a.manquantes.length > 0 || a.alertes.length > 0));

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Anciennes lettres de mission')
      ),
      h('div', { className: 'page-header-actions' },
        analyses.length ? h('button', { className: 'btn btn-secondary', onClick: () => setAnalyses([]) }, 'Vider la liste') : null,
        h('label', { className: 'btn btn-accent btn-fichier' },
          enCours ? `Analyse… (${enCours})` : '📎 Déposer des lettres',
          h('input', {
            type: 'file', accept: '.docx', multiple: true,
            className: 'input-fichier-couvrant', onChange: deposer,
            'aria-label': 'Déposer des lettres de mission à analyser',
          })
        )
      )
    ),

    analyses.length === 0
      ? h('div', { className: 'grid-2' },
        h(FormSection, { icon: '1️⃣', title: 'Déposer les lettres existantes', ton: 'bleu' },
          h('p', { style: { fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)', margin: '0 0 16px' } },
            'Sélectionnez autant de fichiers Word que vous voulez. L’outil lit chaque lettre et vérifie qu’elle contient les rubriques attendues lors d’un contrôle qualité.'),
          h('label', { className: 'btn btn-accent btn-fichier btn-block' },
            '📎 Choisir des fichiers',
            h('input', {
              type: 'file', accept: '.docx', multiple: true,
              className: 'input-fichier-couvrant', onChange: deposer,
              'aria-label': 'Choisir des lettres de mission',
            })
          ),
          h('div', { className: 'form-help' }, 'Les fichiers restent sur votre poste : l’analyse se fait dans le navigateur.')
        ),
        h(FormSection, { icon: '2️⃣', title: 'Refaire celles qui le nécessitent', ton: 'vert' },
          h('p', { style: { fontSize: 15, lineHeight: 1.65, color: 'var(--text-muted)', margin: 0 } },
            'Pour chaque lettre incomplète, un bouton ouvre le parcours de contractualisation habituel, préparé pour produire une lettre à jour à partir de vos modèles.')
        )
      )
      : h(Card, {
        title: `${analyses.length} ${pluriel(analyses.length, 'lettre')} ${pluriel(analyses.length, 'analysée')}`,
        subtitle: aRefaire.length ? `${aRefaire.length} à refaire.` : 'Toutes contiennent les rubriques attendues.',
        icon: '📝', iconBg: '#E9F1FE', iconColor: '#2563EB',
        tone: aRefaire.length ? 'orange' : 'vert',
      },
        h('div', { className: 'analyses-liste' },
          analyses.map((a, i) => h('div', { className: 'analyse-ligne', key: a.nom + i },
            h('div', { className: 'analyse-tete' },
              h('div', { className: 'analyse-nom' },
                a.nom,
                a.nomStructure
                  ? h(Badge, { color: 'bleu' }, 'Produite par ComplyEC')
                  : h(Badge, { color: 'gris' }, 'Origine externe')
              ),
              a.erreur
                ? h(Badge, { color: 'rouge' }, 'Illisible')
                : h(Badge, { color: a.manquantes.length ? 'orange' : 'vert' },
                  a.manquantes.length ? `${a.manquantes.length} ${pluriel(a.manquantes.length, 'rubrique')} ${pluriel(a.manquantes.length, 'manquante')}` : 'Complète')
            ),
            a.erreur
              ? h('div', { className: 'form-help' }, a.erreur)
              : h('div', null,
                a.alertes.map((al, j) => h('div', { className: 'info-box info-box-alerte', key: j, style: { marginBottom: 10 } }, '⚠️ ', al)),
                a.manquantes.length
                  ? h('div', { className: 'form-help', style: { marginTop: 0, marginBottom: 12 } },
                    'Manque : ', a.manquantes.map(m => m.label).join(' · '))
                  : null,
                h('div', { className: 'analyse-rubriques' },
                  a.rubriques.map(r => h('span', {
                    key: r.code,
                    className: cx('rubrique-puce', r.trouve ? 'ok' : (r.obligatoire ? 'ko' : 'option')),
                    title: `${r.trouve ? 'Présente' : (r.obligatoire ? 'Manquante' : 'Facultative, absente')} — exigence : ${r.source}`,
                  }, r.trouve ? '✓ ' : '· ', r.label, h('span', { className: 'rubrique-source' }, r.source))
                )),
                h('div', { className: 'form-help', style: { marginTop: 10 } },
                  a.presentation
                    ? 'Lettre lue comme une mission de présentation : les mentions de la norme NP 2300 sont vérifiées.'
                    : 'Lettre lue comme une mission d’assistance : les mentions propres à la NP 2300 ne sont pas exigées et ne sont donc pas vérifiées.'),
                (a.manquantes.length || a.alertes.length)
                  ? h('button', {
                    className: 'btn btn-primary btn-sm', style: { marginTop: 14 },
                    onClick: () => { if (onRefaire) onRefaire(); else showToast('Parcours de refonte ouvert (démonstration)'); },
                  }, 'Refaire cette lettre →')
                  : null
              )
          ))
        )
      ),

    h('div', { className: 'info-box', style: { marginTop: 18 } }, 'ℹ️ ',
      h('span', null,
        'Les exigences vérifiées viennent de la norme ',
        h('b', null, 'NP 2300'),
        ' (mentions minimales de la lettre de mission), de l’',
        h('b', null, 'article 151 du décret n° 2012-432'),
        ' (contrat écrit, droits et obligations, conditions financières), et des points relevés en pratique lors des contrôles. La détection se fait par repérage de formulations : c’est une aide à la relecture, pas un avis — une rubrique présente mais mal rédigée sera comptée comme présente.'))
  );
}

// ============================================================ 4 bis. Mes dossiers

/* Vue cabinet du portefeuille : le tableau des dossiers, jusque-là accessible
   seulement au détour de l'import de régularisation, devient une entrée à part
   entière. C'est aussi d'ici qu'on affecte un dossier à un collaborateur. */
function ECDossiers({ showToast, onOpenBilan, onNouveauDossier }) {
  const [recherche, setRecherche] = useState('');
  const [filtreCollab, setFiltreCollab] = useState('tous');

  const lignes = CLIENTS
    .filter(c => filtreCollab === 'tous' || c.collaborateur === filtreCollab)
    .filter(c => {
      const q = recherche.trim().toLowerCase();
      if (!q) return true;
      return c.nom.toLowerCase().includes(q) || (c.siret || '').includes(q);
    });

  const parCollab = COLLABORATEURS.map(co => ({ co, n: CLIENTS.filter(c => c.collaborateur === co.id).length }));
  const sansCollab = CLIENTS.filter(c => !c.collaborateur).length;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Dossiers du cabinet')
      ),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Export du portefeuille généré (démonstration)') }, '⬇ Exporter'),
        onNouveauDossier ? h('button', { className: 'btn btn-primary', onClick: onNouveauDossier }, '+ Nouveau dossier') : null
      )
    ),
    h('div', { className: 'stat-band' },
      h('div', { className: 'stat-tile bleu' },
        h('div', { className: 'stat-tile-value' }, CLIENTS.length),
        h('div', { className: 'stat-tile-label' }, 'dossiers au portefeuille')
      ),
      h('div', { className: 'stat-tile vert' },
        h('div', { className: 'stat-tile-value' }, parCollab.filter(p => p.n > 0).length),
        h('div', { className: 'stat-tile-label' }, 'collaborateurs affectés')
      ),
      h('div', { className: cx('stat-tile', sansCollab ? 'orange' : 'vert') },
        h('div', { className: 'stat-tile-value' }, sansCollab),
        h('div', { className: 'stat-tile-label' }, 'dossiers sans collaborateur')
      )
    ),
    h(Card, { title: 'Portefeuille du cabinet', subtitle: 'Filtrez par collaborateur ou cherchez un dossier.', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'bleu' },
      h('div', { className: 'filter-row' },
        h('input', {
          className: 'form-input', style: { maxWidth: 280 }, placeholder: 'Rechercher un dossier ou un SIRET…',
          value: recherche, onChange: e => setRecherche(e.target.value),
        }),
        h('select', { className: 'form-select', style: { maxWidth: 220 }, value: filtreCollab, onChange: e => setFiltreCollab(e.target.value) },
          h('option', { value: 'tous' }, 'Tous les collaborateurs'),
          COLLABORATEURS.map(co => h('option', { key: co.id, value: co.id }, co.nom))
        )
      ),
      lignes.length === 0
        ? h(EmptyDetail, { icon: '🔎', label: 'Aucun dossier ne correspond à cette recherche' })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Forme', 'SIRET', 'Collaborateur', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              lignes.map(c => h('tr', { key: c.id, className: 'clickable', onClick: () => onOpenBilan && onOpenBilan(c.id) },
                h('td', { className: 'table-name' }, c.nom),
                h('td', null, c.forme || '—'),
                h('td', null, c.siret || '—'),
                h('td', null, c.collaborateur
                  ? collaborateur(c.collaborateur).nom
                  : h(Badge, { color: 'orange' }, 'Non affecté')),
                h('td', { className: 'td-action' }, h('button', {
                  className: 'row-open-btn', 'aria-label': 'Ouvrir le dossier', title: 'Ouvrir le dossier',
                  onClick: e => { e.stopPropagation(); if (onOpenBilan) onOpenBilan(c.id); },
                }, '→'))
              ))
            )
          )
        )
    )
  );
}

/* ------------------------------------------- Analyse de vigilance en étapes

   Reprendre une analyse suivait jusqu'ici un chemin à part : un long document
   sombre qu'il fallait faire défiler, sans rapport visuel avec le reste. Elle
   emprunte désormais exactement le parcours de la contractualisation — mêmes
   étapes, mêmes rubriques, mêmes couleurs, même pied de page — pour que
   l'utilisateur n'ait rien à réapprendre d'un écran à l'autre.

   Les quatre étapes reprennent les étapes 7, 8 et 9 de l'entrée en mission,
   suivies de la fiche telle qu'elle sera classée au dossier. */

const VIGILANCE_ETAPES = ['Qui est derrière', 'Cotation du risque', 'Niveau de vigilance', 'Fiche de vigilance'];

function AnalyseVigilanceWizard({ record, clientData, cabinetSettings, showToast, onBack }) {
  const cabinet = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const connaissance = vigilanceConnaissance(record.dossier);
  const [etape, setEtape] = useState(1);

  /* Exactement l'analyse de la contractualisation : même état, mêmes écrans.
     Seule différence, tout est prérempli par l'analyse précédente — on la
     reprend, on ne la recommence pas. */
  const vig = useEtatVigilance({
    beneficiaires: connaissance.beneficiaires,
    beInterroge: (connaissance.beneficiaires || []).length > 0,
    ppeStatut: connaissance.ppe.statut,
    ppeDetail: connaissance.ppe.detail,
    origineEtat: connaissance.origineFonds.etat,
    origineDetail: connaissance.origineFonds.detail,
    basesVerifiees: VIGILANCE_BASES.map(b => b.code),
    resultatsBases: VIGILANCE_RESULTATS_DEMO,
    classification: record.classification,
    niveauRetenu: record.niveauRetenu,
    justification: record.justification,
  });

  // Fiche telle qu'elle sera classée, construite à partir des saisies en cours.
  const ficheAJour = Object.assign({}, record, {
    classification: vig.classification,
    niveauCalcule: vig.niveauPropose,
    niveauRetenu: vig.niveauRetenu,
    justification: vig.justification,
    derniereAnalyse: new Date().toISOString().slice(0, 10),
  });

  function suivant() { setEtape(e => Math.min(VIGILANCE_ETAPES.length, e + 1)); }
  function precedent() { setEtape(e => Math.max(1, e - 1)); }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, `Analyse de vigilance — ${clientData.nom}`)
      )
      // Pas de bouton dans l'en-tête : le retour est au pied de page, à la
      // même place que dans l'assistant d'entrée en mission.
    ),
    h(Stepper, { steps: VIGILANCE_ETAPES, current: etape }),

    etape === 1 && h('div', { className: 'step-body' },
      h(VigilanceEtapePersonnes, { v: vig }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour à la liste'),
        h('button', { className: 'btn btn-primary', onClick: suivant }, 'Continuer →')
      )
    ),

    etape === 2 && h('div', { className: 'step-body' },
      h(VigilanceEtapeCotation, {
        v: vig,
        identite: [
          ['Client', clientData.nom],
          ['Forme', clientData.forme],
          ['Activité', clientData.activite],
          ['Siège', record.adresse || '—'],
          ['Dirigeant', clientData.dirigeant],
        ],
      }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
        h('button', { className: 'btn btn-primary', onClick: suivant }, 'Continuer →')
      )
    ),

    etape === 3 && h('div', { className: 'step-body' },
      h(VigilanceEtapeNiveau, {
        v: vig, showToast,
        contexteSynthese: {
          client: clientData.nom,
          activite: clientData.activite,
          operations: record.operationsParticulieres || [],
        },
      }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', {
          className: 'btn btn-primary',
          disabled: vig.niveauRetenu !== vig.niveauPropose && !vig.justification.trim(),
          onClick: suivant,
        }, 'Voir la fiche →')
      )
    ),

    // Étape propre à la reprise : la fiche telle qu'elle sera classée. Dans la
    // contractualisation, elle est remplacée par la validation du dossier.
    etape === 4 && h('div', { className: 'step-body' },
      h(FormSection, { icon: '📄', title: 'Fiche de vigilance', ton: 'violet',
        style: { display: 'flex', flexDirection: 'column', minHeight: 0, flex: '1 1 auto' } },
        h('div', { className: 'fiche-cadre' },
          h(FicheVigilance, {
            clientData, record: ficheAJour,
            referent: collaborateur(clientData.collaborateur).nom, cabinet,
          })
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', { className: 'btn btn-secondary', onClick: () => window.print() }, '🖨️ Imprimer en PDF'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => { showToast(`Analyse de ${clientData.nom} arrêtée en vigilance ${vig.niveauRetenu.toLowerCase()} (démonstration).`); onBack(); },
        }, '✅ Arrêter l’analyse')
      )
    )
  );
}

// ============================================================ 5 bis. Vigilance LBC-FT

/* Les quatre volets qui relèvent de la lutte anti-blanchiment vivaient
   dispersés dans « Conformité cabinet ». Ils forment leur propre section : un
   expert-comptable qui prépare un contrôle LBC-FT les ouvre ensemble. */
function ECVigilance({ sub, showToast, cabinetSettings, onBack }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const [analyseOuverte, setAnalyseOuverte] = useState(null);
  // Un écran peut en ouvrir un autre du même onglet sans passer par le menu.
  const [vueForcee, setVueForcee] = useState(null);
  useEffect(() => { setVueForcee(null); }, [sub]);
  const vue = vueForcee || sub || 'analyses';

  if (vue === 'formations') return h('div', { className: 'page' }, h(FormationsLBCFTManager, { showToast, cabinetSettings: settings }));
  if (vue === 'cartographie') return h(CartographieRisques, { showToast, cabinetNom: settings.nom });

  if (analyseOuverte) {
    return h(AnalyseVigilanceWizard, {
      key: analyseOuverte.dossier,
      record: analyseOuverte,
      clientData: client(analyseOuverte.dossier),
      cabinetSettings: settings,
      showToast,
      onBack: () => setAnalyseOuverte(null),
    });
  }

  const analyses = DOSSIERS_LBCFT.filter(d => d.statut === 'complete');
  const aLancer = DOSSIERS_LBCFT.filter(d => d.statut !== 'complete');
  const renforcees = analyses.filter(d => d.niveauRetenu === 'Renforcée');

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Portefeuille LBC-FT')
      ),
      onBack ? h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour')) : null
    ),
    h(Card, { title: 'Analyses arrêtées', subtitle: 'Cliquez une ligne pour rouvrir la fiche de vigilance.', icon: '🔍', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'bleu' },
      analyses.length === 0
        ? h(EmptyDetail, { icon: '🔍', label: 'Aucune analyse arrêtée pour le moment' })
        : h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Dossier', 'Collaborateur', 'Analysée le', 'Niveau retenu', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null,
              analyses.map(d => {
                const c = client(d.dossier);
                return h('tr', { key: d.dossier, className: 'clickable', onClick: () => setAnalyseOuverte(d) },
                  h('td', { className: 'table-name' }, c.nom),
                  h('td', null, collaborateur(c.collaborateur).nom),
                  h('td', null, formatDate(d.derniereAnalyse)),
                  h('td', null, h(Badge, { color: niveauVigilanceCouleur(d.niveauRetenu) }, d.niveauRetenu)),
                  h('td', { className: 'td-action' }, h('button', {
                    className: 'row-open-btn', 'aria-label': 'Rouvrir l’analyse', title: 'Rouvrir l’analyse',
                    onClick: e => { e.stopPropagation(); setAnalyseOuverte(d); },
                  }, '→'))
                );
              })
            )
          )
        )
    )
  );
}

function FormationsLBCFTManager({ onBack, showToast, cabinetSettings }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const sessionsAttendues = Number(settings.sessionsLbcftParAn || SESSIONS_ATTENDUES_PAR_AN);
  const [showForm, setShowForm] = useState(false);
  const programme = FORMATIONS_PROGRAMMES.find(p => p.annee === currentCalendarYear());
  /* Les sessions vivent dans l'état de l'écran : « Créer la session » n'ajoutait
     rien à la liste, elle affichait seulement un message et la session
     disparaissait. Idem pour les relances, qui ne laissaient aucune trace. */
  const [sessionsAjoutees, setSessionsAjoutees] = useState([]);
  const [relancesEnvoyees, setRelancesEnvoyees] = useState({});
  const sessions = (programme ? programme.sessions : []).concat(sessionsAjoutees);

  function ajouterSession(session) {
    setSessionsAjoutees(l => l.concat([session]));
    showToast(`Session « ${session.titre} » ajoutée au programme ${currentCalendarYear()}.`);
  }

  function relancer(sessionId, pid) {
    const cle = sessionId + '|' + pid;
    setRelancesEnvoyees(r => ({ ...r, [cle]: new Date().toISOString().slice(0, 10) }));
    showToast(`Rappel envoyé à ${collaborateur(pid).nom}.`);
  }

  function relancerTout() {
    const maj = {};
    sessionsPassees.forEach(se => se.participants.forEach(pid => {
      if (!(se.attestations[pid] && se.attestations[pid].recue)) maj[se.id + '|' + pid] = new Date().toISOString().slice(0, 10);
    }));
    setRelancesEnvoyees(r => ({ ...r, ...maj }));
    showToast(`Rappel envoyé pour ${Object.keys(maj).length} ${pluriel(Object.keys(maj).length, 'attestation')}.`);
  }
  const sessionsFaites = sessions.length;
  /* Une séance qui n'a pas encore eu lieu ne peut pas produire d'attestation :
     la compter « en attente » ferait apparaître un manque là où il n'y en a
     pas, à l'écran comme dans le registre remis au contrôleur. */
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const sessionsPassees = sessions.filter(s => s.date <= aujourdhui);
  const attestations = sessionsPassees.flatMap(s => s.participants.map(pid => (s.attestations[pid] || { recue: false })));
  const attestationsRecues = sessions.flatMap(s => s.participants.map(pid => (s.attestations[pid] || { recue: false }))).filter(a => a.recue).length;
  const enAttenteTotal = attestations.filter(a => !a.recue).length;
  const registre = registreFormation();

  /* Le décret impose de pouvoir montrer les justificatifs, pas seulement de
     former. Ce document réunit ce que le texte énumère : identité, poste,
     dates, durée, organisme, et la date jusqu'à laquelle les pièces doivent
     être conservées pour les personnes parties. */
  function genererRegistre() {
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    const lignes = registre.toutes.map(l => `<tr>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.nom}${l.parti ? ' <i>(parti·e)</i>' : ''}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.role}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${formatDate(l.dateEmbauche)}${l.dateDepart ? ' → ' + formatDate(l.dateDepart) : ''}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.accueil.date ? formatDate(l.accueil.date) : 'Non suivie'}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.derniereFormation ? formatDate(l.derniereFormation) : 'Aucune'}</td>
        <td style="border:1px solid #C8D0DC; padding:5pt;">${l.conserverJusquA ? formatDate(l.conserverJusquA) : 'Pendant toute la durée des fonctions'}</td>
      </tr>`).join('');

    const detailSessions = FORMATIONS_PROGRAMMES.map(prog => prog.sessions.map(sess => {
      const sessAVenir = sess.date > new Date().toISOString().slice(0, 10);
      const rows = sess.participants.map(pid => {
        const att = sess.attestations[pid] || { recue: false };
        const justificatif = att.recue ? 'Attestation reçue le ' + formatDate(att.dateUpload)
          : sessAVenir ? 'Séance non encore tenue' : 'Attestation non reçue';
        return `<tr>
            <td style="border:1px solid #C8D0DC; padding:5pt;">${collaborateur(pid).nom}</td>
            <td style="border:1px solid #C8D0DC; padding:5pt;">${collaborateur(pid).role}</td>
            <td style="border:1px solid #C8D0DC; padding:5pt;">${justificatif}</td>
          </tr>`;
      }).join('');
      return `<h3 style="font-size:12pt; margin-top:16pt;">${sess.titre}</h3>
        <p style="font-size:10pt; margin-top:0;">Séance ${sessAVenir ? 'programmée le' : 'du'} ${formatDate(sess.date)} — organisme : ${sess.formateur}.</p>
        <table style="border-collapse:collapse; width:100%; font-size:10pt;">
          <tr style="background:#EEF3FA;"><th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Participant</th><th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Fonction</th><th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Justificatif</th></tr>
          ${rows}
        </table>`;
    }).join('')).join('');

    downloadWordDoc('Registre_de_formation_LBC-FT.doc', 'Registre de formation LBC-FT',
      `<h1 style="font-size:17pt;">Registre de formation LBC-FT</h1>
       <p style="font-size:9.5pt; color:#666;">Arrêté au ${today}. Établi en application de l’article D. 561-38-1-1 du code monétaire et financier, créé par le ${FORMATION_DECRET} et en vigueur depuis le 26 avril 2026, qui impose de former les personnes concourant aux obligations LBC-FT dès leur embauche puis régulièrement, d’adapter le contenu et la fréquence aux risques et aux fonctions exercées, et de conserver les justificatifs pendant la durée des fonctions puis ${FORMATION_CONSERVATION_ANS} ans après le départ.</p>
       <h2 style="font-size:13pt; margin-top:20pt;">1. Personnes concernées</h2>
       <table style="border-collapse:collapse; width:100%; font-size:10pt;">
         <tr style="background:#EEF3FA;">
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Nom</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Fonction</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Période</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Formation d’accueil</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Dernière formation</th>
           <th style="border:1px solid #C8D0DC; padding:5pt; text-align:left;">Justificatifs à conserver jusqu’au</th>
         </tr>
         ${lignes}
       </table>
       <h2 style="font-size:13pt; margin-top:22pt;">2. Sessions et justificatifs</h2>
       ${detailSessions}
       <p style="margin-top:26pt; color:#999; font-size:8pt;">Les attestations, feuilles d’émargement et supports de formation correspondants sont conservés par le cabinet ; le présent registre en donne l’inventaire, il ne s’y substitue pas.</p>`);
    showToast('Registre de formation généré au format Word.');
  }

  const pastilleAccueil = etat => h('span', { className: cx('cq-pastille', etat === 'ok' ? 'vert' : etat === 'partiel' ? 'orange' : 'rouge') },
    etat === 'ok' ? '\u2713' : etat === 'partiel' ? '!' : '\u2715');

  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Formations LBC-FT')),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        enAttenteTotal > 0 ? h('button', {
          className: 'btn btn-secondary',
          onClick: relancerTout,
        }, `📨 Relancer les ${enAttenteTotal} attestations`) : null,
        h('button', { className: 'btn btn-secondary', onClick: genererRegistre }, '📄 Registre de formation'),
        h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, '+ Ajouter une session')
      )
    ),
    showForm ? h(Modal, { title: 'Nouvelle session de formation', onClose: () => setShowForm(false) },
      h(NouvelleSessionFormationForm, { onClose: () => setShowForm(false), onCreer: ajouterSession })
    ) : null,
    h('div', { className: 'cq-scroll' },
      h(FormSection, { icon: '🎒', title: 'Formation dès l’embauche et conservation des justificatifs', ton: 'violet' },
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Personne', 'Fonction', 'Entrée', 'Formation d’accueil', 'Dernière formation', 'Justificatifs'].map(c => h('th', { key: c }, c)))),
            h('tbody', null, registre.toutes.map(l => h('tr', { key: l.id, style: l.parti ? { opacity: 0.78 } : null },
              h('td', { className: 'table-name' }, l.nom, l.parti ? h('span', { className: 'form-help', style: { display: 'block', margin: 0 } }, 'Parti·e le ' + formatDate(l.dateDepart)) : null),
              h('td', null, l.role),
              h('td', null, formatDate(l.dateEmbauche)),
              h('td', null, h('span', { style: { display: 'flex', alignItems: 'center', gap: 9 } },
                pastilleAccueil(l.accueil.etat),
                h('span', null, l.accueil.detail)
              )),
              h('td', null, l.derniereFormation ? formatDate(l.derniereFormation) : h('span', { style: { color: 'var(--text-muted)' } }, 'Aucune')),
              h('td', null, l.conserverJusquA
                ? h(Badge, { color: l.conserverJusquA >= new Date().toISOString().slice(0, 10) ? 'orange' : 'gris' }, 'Conserver jusqu’au ', formatDate(l.conserverJusquA))
                : h('span', { style: { color: 'var(--text-muted)' } }, 'Durée des fonctions'))
            )))
          )
        )
      ),
      sessions.length === 0 ? h('div', { className: 'card' }, h(EmptyDetail, { icon: '🎓', label: `Aucune session programmée pour ${currentCalendarYear()}` })) :
        sessions.map(s => h(FormSection, { key: s.id, icon: '🎓', title: s.titre, ton: 'bleu', style: { marginTop: 20 } },
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date'), h('span', { className: 'v' }, formatDate(s.date))),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Organisme'), h('span', { className: 'v' }, s.formateur)),
          h('div', { className: 'table-wrap', style: { marginTop: 14 } },
            h('table', { className: 'data-table' },
              h('thead', null, h('tr', null, ['Collaborateur', 'Fonction', 'Attestation', ''].map(c => h('th', { key: c }, c)))),
              h('tbody', null, s.participants.map(pid => {
                const att = s.attestations[pid] || { recue: false };
                const aVenir = s.date > aujourdhui;
                return h('tr', { key: pid },
                  h('td', { className: 'table-name' }, collaborateur(pid).nom),
                  h('td', null, collaborateur(pid).role),
                  h('td', null, att.recue ? h(Badge, { color: 'vert' }, '● Reçue le ', formatDate(att.dateUpload))
                    : aVenir ? h(Badge, { color: 'bleu' }, '● Séance à venir')
                      : h(Badge, { color: 'orange' }, '● En attente')),
                  h('td', null, (att.recue || aVenir) ? null
                    : relancesEnvoyees[s.id + '|' + pid]
                      ? h('span', { className: 'form-help', style: { margin: 0 } }, 'Relancé le ', formatDate(relancesEnvoyees[s.id + '|' + pid]))
                      : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => relancer(s.id, pid) }, '📨 Relancer'))
                );
              }))
            )
          )
        ))
    )
  );
}

function NouvelleSessionFormationForm({ onClose, onCreer }) {
  const [titre, setTitre] = useState('');
  const [date, setDate] = useState('');
  const [formateur, setFormateur] = useState('');
  const [participants, setParticipants] = useState(() => Object.fromEntries(COLLABORATEURS.map(c => [c.id, true])));

  function submit(e) {
    e.preventDefault();
    const retenus = COLLABORATEURS.filter(c => participants[c.id]).map(c => c.id);
    onCreer({
      id: 'sess-' + Date.now(),
      titre: titre.trim(),
      date,
      formateur: formateur.trim(),
      participants: retenus,
      attestations: {},
    });
    onClose();
  }

  return h('form', { className: 'auth-form', onSubmit: submit },
      h('label', { className: 'auth-field' }, 'Intitulé', h('input', { required: true, value: titre, onChange: e => setTitre(e.target.value), autoFocus: true })),
      h('div', { className: 'auth-field-row' },
        h('label', { className: 'auth-field' }, 'Date', h('input', { type: 'date', required: true, value: date, onChange: e => setDate(e.target.value) })),
        h('label', { className: 'auth-field' }, 'Organisme de formation', h('input', { required: true, value: formateur, onChange: e => setFormateur(e.target.value) }))
      ),
      h('div', { className: 'auth-field' },
        'Collaborateurs concernés',
        h('div', { className: 'checkbox-grid' }, COLLABORATEURS.map(c => h('label', { className: 'checkbox-row', key: c.id },
          h('input', { type: 'checkbox', checked: !!participants[c.id], onChange: () => setParticipants(p => ({ ...p, [c.id]: !p[c.id] })) }), c.nom
        )))
      ),
    h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' } },
      h('button', { type: 'button', className: 'btn btn-secondary', onClick: onClose }, 'Annuler'),
      h('button', { type: 'submit', className: 'btn btn-primary' }, 'Créer la session')
    )
  );
}

function DiffusionProceduresManager({ onBack, showToast }) {
  const [selected, setSelected] = useState(PROCEDURES_VERSIONS[0]);
  const derniere = PROCEDURES_VERSIONS[0];
  const totalD = Object.keys(derniere.accuses).length;
  const signesD = Object.values(derniere.accuses).filter(a => a.signe).length;
  const enAttente = Object.entries(derniere.accuses).filter(([, a]) => !a.signe);

  return h(React.Fragment, null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Diffusion des procédures')
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        enAttente.length > 0 ? h('button', {
          className: 'btn btn-secondary',
          onClick: () => showToast(`Rappel envoyé aux ${enAttente.length} collaborateurs n’ayant pas signé (démonstration)`),
        }, `📨 Relancer les ${enAttente.length} retardataires`) : null,
        h('button', { className: 'btn btn-primary', onClick: () => showToast('Nouvelle version diffusée à tous les collaborateurs (démonstration)') }, '📤 Diffuser une version')
      )
    ),
    h('div', { className: 'split-layout with-detail' },
      h(Card, { title: 'Versions diffusées', subtitle: 'Cliquez une version pour voir qui l’a signée.', icon: '📤', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'bleu' },
        h('div', { className: 'table-wrap' },
          h('table', { className: 'data-table' },
            h('thead', null, h('tr', null, ['Version', 'Diffusée le', 'Accusés signés', ''].map(c => h('th', { key: c }, c)))),
            h('tbody', null, PROCEDURES_VERSIONS.map(v => {
              const total = Object.keys(v.accuses).length;
              const signes = Object.values(v.accuses).filter(a => a.signe).length;
              return h('tr', { key: v.id, className: cx('clickable', selected && selected.id === v.id && 'row-selected'), onClick: () => setSelected(v) },
                h('td', { className: 'table-name' }, v.version),
                h('td', null, formatDate(v.dateDiffusion)),
                h('td', null, h(Badge, { color: signes === total ? 'vert' : 'orange' }, signes, '/', total)),
                h('td', { className: 'td-action' }, h('button', {
                  className: 'row-open-btn', 'aria-label': 'Voir le détail', title: 'Voir le détail',
                  onClick: e => { e.stopPropagation(); setSelected(v); },
                }, '→'))
              );
            }))
          )
        )
      ),
      h('div', { className: 'detail-panel' },
        selected ? h(Card, {
          title: selected.version,
          subtitle: `Diffusée le ${formatDate(selected.dateDiffusion)}`,
          icon: '📘', iconBg: '#E9F1FE', iconColor: '#2563EB',
          tone: Object.values(selected.accuses).every(a => a.signe) ? 'vert' : 'orange',
          footer: Object.values(selected.accuses).some(a => !a.signe)
            ? h('button', {
              className: 'btn btn-secondary btn-sm card-action',
              onClick: () => showToast('Rappel envoyé aux collaborateurs concernés (démonstration)'),
            }, '📨 Relancer les non-signataires')
            : null,
        },
          h('p', { style: { fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 } }, selected.resume),
          Object.entries(selected.accuses).map(([id, a]) => h('div', { className: 'list-row', key: id },
            h('span', { className: 'list-row-label' }, h(Dot, { color: a.signe ? 'vert' : 'orange' }), collaborateur(id).nom),
            a.signe
              ? h('span', { style: { fontSize: 12.3, color: 'var(--text-muted)' } }, 'Signé le ', formatDate(a.dateSignature))
              : h(Badge, { color: 'orange' }, 'En attente')
          ))
        ) : h('div', { className: 'card' }, h(EmptyDetail, { label: 'Sélectionnez une version' }))
      )
    )
  );
}

const MANUEL_STATUT_COULEUR = { a_jour: 'vert', a_reviser: 'orange', manquant: 'rouge' };
const MANUEL_STATUT_LABEL = { a_jour: 'À jour', a_reviser: 'À réviser', manquant: 'Chapitre manquant' };

/* Rédige la phrase du chapitre à partir des réponses. La syntaxe
   {code:si oui|si non} choisit une formulation selon une réponse oui/non ;
   {code} insère simplement la réponse. */
/* `marqueVide` distingue l'aperçu à l'écran du document remis.

   À l'écran, un « … » suffit pour montrer qu'il reste à répondre. Dans un
   manuel imprimé et posé devant un contrôleur, il passerait inaperçu : on y
   écrit « [à compléter] », qui se voit et se cherche. */
function redigerParagraphe(modele, reponses, marqueVide) {
  const vide = marqueVide || '…';
  return modele.replace(/\{(\w[\w-]*)(?::([^|}]*)\|([^}]*))?\}/g, (_, code, siOui, siNon) => {
    const v = reponses[code];
    if (siOui !== undefined) {
      if (v === undefined || v === '') return vide;
      return v === 'oui' ? siOui : siNon;
    }
    if (v === undefined || v === '') return vide;
    return String(v);
  });
}

/* Compte les passages encore vides d'un chapitre, réponses par défaut
   comprises : c'est ce qui permet de prévenir avant de générer le document. */
function manuelPassagesVides(modele, reponses, valeurDefaut, questions) {
  const complet = Object.assign(
    Object.fromEntries(questions.map(q => [q.code, valeurDefaut(q)])),
    reponses || {}
  );
  const codes = [];
  modele.replace(/\{(\w[\w-]*)(?::[^|}]*\|[^}]*)?\}/g, (_, code) => {
    const v = complet[code];
    if (v === undefined || v === '') codes.push(code);
    return '';
  });
  return codes;
}

function ManuelProceduresManager({ onBack, showToast, settings, onDiffusion }) {
  const params = settings || CABINET_SETTINGS_DEFAUT;
  // Une question peut être préremplie par un réglage du cabinet (le seuil de
  // dépendance économique, par exemple). Le manuel dit alors exactement ce que
  // les écrans appliquent : pas deux chiffres pour la même règle.
  const valeurDefaut = q => (q.depuisParametre && params[q.depuisParametre] !== undefined
    ? String(params[q.depuisParametre])
    : (q.defaut || ''));
  const [chapitres, setChapitres] = useState(PROCEDURES_MANUEL_CHAPITRES);
  const [reponses, setReponses] = useState({});
  const [index, setIndex] = useState(0);
  const [enRedaction, setEnRedaction] = useState(false);

  const chapitre = chapitres[index];
  const questions = (MANUEL_QUESTIONNAIRE[chapitre.id] || []).filter(q => q.code);
  const modele = (MANUEL_QUESTIONNAIRE[chapitre.id] || []).find(q => q.modele);
  const reponsesChapitre = reponses[chapitre.id] || {};
  const repondues = questions.filter(q => (reponsesChapitre[q.code] || '') !== '').length;
  const complet = repondues === questions.length && questions.length > 0;
  const rediges = chapitres.filter(c => c.statut === 'a_jour').length;

  function repondre(code, valeur) {
    setReponses(prev => ({ ...prev, [chapitre.id]: { ...(prev[chapitre.id] || {}), [code]: valeur } }));
  }

  function validerChapitre() {
    const today = new Date().toISOString().slice(0, 10);
    setChapitres(prev => prev.map(c => (c.id === chapitre.id ? { ...c, statut: 'a_jour', derniereMaj: today } : c)));
    showToast(`Chapitre « ${chapitre.titre} » rédigé.`);
    if (index < chapitres.length - 1) setIndex(index + 1);
    else setEnRedaction(false);
  }

  /* Chapitres encore incomplets, réponses par défaut comprises. Sert à
     prévenir avant de produire le document plutôt qu'à interdire : le cabinet
     peut vouloir un brouillon, mais il doit savoir ce qu'il imprime. */
  function chapitresIncomplets() {
    return chapitres.map(c => {
      const qs = MANUEL_QUESTIONNAIRE[c.id] || [];
      const m = qs.find(q => q.modele);
      if (!m) return { titre: c.titre, vides: ['tout le chapitre'] };
      const vides = manuelPassagesVides(m.modele, reponses[c.id], valeurDefaut, qs.filter(q => q.code));
      return vides.length ? { titre: c.titre, vides } : null;
    }).filter(Boolean);
  }

  function genererManuel() {
    const corps = chapitres.map((c, i) => {
      const qs = MANUEL_QUESTIONNAIRE[c.id] || [];
      const m = qs.find(q => q.modele);
      // Le document remis part des mêmes valeurs que l'aperçu à l'écran :
      // les réponses par défaut y sont donc appliquées, et non ignorées.
      const valeurs = Object.assign(
        Object.fromEntries(qs.filter(q => q.code).map(q => [q.code, valeurDefaut(q)])),
        reponses[c.id] || {}
      );
      const texte = m
        ? redigerParagraphe(m.modele, valeurs, '[à compléter]')
        : '[Chapitre à rédiger.]';
      return `<h2 style="font-size:13pt; margin-top:20pt;">${i + 1}. ${c.titre}</h2><p style="text-align:justify;">${texte}</p>`;
    }).join('');
    const incomplets = chapitresIncomplets();
    const avertissement = incomplets.length
      ? `<p style="border:1pt solid #C2620A; background:#FDF3E3; color:#8A4708; padding:8pt; font-size:10pt;"><b>Document incomplet.</b> ${incomplets.length} ${pluriel(incomplets.length, 'chapitre')} ${pluriel(incomplets.length, 'comporte', 'comportent')} encore des passages marqués « [à compléter] » : ${incomplets.map(c => c.titre).join(', ')}. Ce manuel ne doit pas être diffusé en l'état.</p>`
      : '';
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    downloadWordDoc('Manuel_de_procedures.doc', 'Manuel de procédures',
      `<h1 style="font-size:17pt;">Manuel de procédures du cabinet</h1>
       <p style="font-size:9.5pt; color:#666;">Version du ${today}. Établi en application de la norme professionnelle de management de la qualité (NPMQ, arrêtée le 30 mai 2024, applicable depuis le 1<sup>er</sup> janvier 2025), des articles 141 à 169 du décret n° 2012-432 du 30 mars 2012 portant code de déontologie, et, pour le volet LBC-FT, des articles L. 561-1 et suivants du code monétaire et financier.</p>
       ${avertissement}
       ${corps}
       <p style="margin-top:28pt; color:#999; font-size:8pt;">Document généré par ComplyEC — à relire et valider par l'expert-comptable avant diffusion.</p>`);
    showToast(incomplets.length
      ? `Manuel généré, avec ${incomplets.length} ${pluriel(incomplets.length, 'chapitre')} à compléter.`
      : 'Manuel généré au format Word.');
  }

  // Prévient avant de produire un manuel incomplet, sans l'interdire.
  const [confirmationManuel, setConfirmationManuel] = useState(null);

  function demanderGeneration() {
    const incomplets = chapitresIncomplets();
    if (incomplets.length) { setConfirmationManuel(incomplets); return; }
    genererManuel();
  }

  // ---- Écran de rédaction guidée, chapitre par chapitre ----
  if (enRedaction) {
    return h(React.Fragment, null,
      h('div', { className: 'page-header' },
        h('div', null,
          h('h1', null, 'Rédaction du manuel'),
        ),
        h('div', { className: 'page-header-actions' },
          h('button', { className: 'btn btn-secondary', onClick: () => setEnRedaction(false) }, '← Revenir au plan')
        )
      ),
      h('div', { className: 'manuel-progress' },
        chapitres.map((c, i) => h('button', {
          key: c.id,
          className: cx('manuel-step', i === index && 'active', c.statut === 'a_jour' && 'done'),
          onClick: () => setIndex(i),
          title: c.titre,
        }, c.statut === 'a_jour' ? '✓' : i + 1))
      ),
      h(Card, {
        title: chapitre.titre,
        subtitle: 'Répondez aux questions : le paragraphe se rédige à droite au fur et à mesure.',
        icon: '📘', iconBg: '#E7F7ED', iconColor: '#16A34A',
        tone: complet ? 'vert' : 'bleu',
      },
        h('div', { className: 'grid-2' },
          h('div', null,
            h(FormSection, { icon: '❓', title: `Questions (${repondues}/${questions.length})` },
              questions.map(q => h('div', { className: 'form-group', key: q.code },
                h('label', { className: 'form-label' }, q.label),
                q.type === 'oui_non'
                  ? h('div', { className: 'toggle-pair' },
                    h('button', { className: cx('toggle-btn', reponsesChapitre[q.code] === 'oui' && 'selected yes'), onClick: () => repondre(q.code, 'oui') }, 'Oui'),
                    h('button', { className: cx('toggle-btn', reponsesChapitre[q.code] === 'non' && 'selected no'), onClick: () => repondre(q.code, 'non') }, 'Non')
                  )
                  : q.type === 'choix'
                    ? h('select', {
                      className: 'form-select', value: reponsesChapitre[q.code] || '',
                      onChange: e => repondre(q.code, e.target.value),
                    }, h('option', { value: '' }, '— Choisir —'), q.options.map(o => h('option', { key: o, value: o.toLowerCase() }, o)))
                    : q.type === 'texte_long'
                      ? h('textarea', {
                        className: 'form-textarea', rows: 3, placeholder: q.placeholder || '',
                        value: reponsesChapitre[q.code] || '', onChange: e => repondre(q.code, e.target.value),
                      })
                      : h('div', { className: q.suffixe ? 'input-with-btn' : '' },
                        h('input', {
                          className: 'form-input', type: q.type === 'nombre' ? 'number' : 'text',
                          placeholder: q.placeholder || '',
                          value: reponsesChapitre[q.code] !== undefined ? reponsesChapitre[q.code] : valeurDefaut(q),
                          onChange: e => repondre(q.code, e.target.value),
                        }),
                        q.suffixe ? h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, q.suffixe) : null
                      )
              ))
            )
          ),
          h('div', { className: 'result-panel' },
            h('div', { className: 'result-panel-eyebrow' }, 'Paragraphe rédigé'),
            h('div', { className: 'letter-preview', style: { marginTop: 10 } },
              modele ? redigerParagraphe(modele.modele, { ...Object.fromEntries(questions.map(q => [q.code, valeurDefaut(q)])), ...reponsesChapitre })
                : 'Aucune trame disponible pour ce chapitre.'),
            h('div', { className: 'result-panel-note', style: { marginTop: 12 } },
              'Le texte reprend vos réponses. Vous pourrez le retoucher dans le document Word final.'),
            h('div', { style: { marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 } },
              index > 0 ? h('button', { className: 'btn btn-secondary btn-block', onClick: () => setIndex(index - 1) }, '← Chapitre précédent') : null,
              h('button', { className: 'btn btn-primary btn-block', disabled: !complet, onClick: validerChapitre },
                index < chapitres.length - 1 ? 'Valider et continuer →' : 'Valider le dernier chapitre')
            )
          )
        )
      )
    );
  }

  // ---- Plan du manuel : état d'avancement et point d'entrée ----
  const premierIncomplet = chapitres.findIndex(c => c.statut !== 'a_jour');

  return h(React.Fragment, null,
    confirmationManuel ? h(Modal, { title: 'Ce manuel est encore incomplet', onClose: () => setConfirmationManuel(null) },
      h('p', { style: { fontSize: 14, lineHeight: 1.6, marginTop: 0 } },
        confirmationManuel.length, ' ', pluriel(confirmationManuel.length, 'chapitre'), ' ',
        pluriel(confirmationManuel.length, 'comporte', 'comportent'),
        ' encore des passages sans réponse. Ils apparaîtront dans le document sous la forme ',
        h('b', null, '« [à compléter] »'), ', et le manuel portera un avertissement en première page.'),
      h('div', { className: 'folder-list', style: { marginBottom: 16 } },
        confirmationManuel.map(c => h('div', { className: 'folder-item', key: c.titre },
          h('span', null, '⚠️'),
          h('span', { style: { flex: 1 } }, c.titre),
          h('span', { style: { color: 'var(--text-muted)', fontSize: 12.5 } },
            c.vides.length, ' ', pluriel(c.vides.length, 'passage'))
        ))
      ),
      h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-secondary', onClick: () => setConfirmationManuel(null) }, 'Revenir compléter'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => { setConfirmationManuel(null); genererManuel(); },
        }, 'Générer quand même')
      )
    ) : null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Manuel de procédures')
      ),
      h('div', { className: 'page-header-actions' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
        onDiffusion ? h('button', { className: 'btn btn-secondary', onClick: onDiffusion }, '📤 Diffusion') : null,
        h('button', { className: 'btn btn-secondary', onClick: demanderGeneration }, '⬇ Générer le manuel Word'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => { setIndex(premierIncomplet >= 0 ? premierIncomplet : 0); setEnRedaction(true); },
        }, rediges === 0 ? 'Commencer la rédaction →' : 'Reprendre la rédaction →')
      )
    ),
    h(Card, { title: 'Plan du manuel', subtitle: 'Cliquez un chapitre pour le rédiger ou le reprendre.', icon: '📘', iconBg: '#E7F7ED', iconColor: '#16A34A', tone: 'bleu' },
      h('div', { className: 'table-wrap' },
        h('table', { className: 'data-table' },
          h('thead', null, h('tr', null, ['#', 'Chapitre', 'Statut', 'Dernière mise à jour', ''].map(c => h('th', { key: c }, c)))),
          h('tbody', null, chapitres.map((c, i) => h('tr', {
            key: c.id, className: 'clickable',
            onClick: () => { setIndex(i); setEnRedaction(true); },
          },
            h('td', null, i + 1),
            h('td', { className: 'table-name' }, c.titre),
            h('td', null, h(Badge, { color: MANUEL_STATUT_COULEUR[c.statut] }, MANUEL_STATUT_LABEL[c.statut])),
            h('td', null, c.derniereMaj ? formatDate(c.derniereMaj) : '—'),
            h('td', { className: 'td-action' }, h('button', {
              className: 'row-open-btn', 'aria-label': 'Rédiger ce chapitre', title: 'Rédiger ce chapitre',
              onClick: e => { e.stopPropagation(); setIndex(i); setEnRedaction(true); },
            }, '→'))
          )))
        )
      )
    )
  );
}

/* La cartographie reprenait les couleurs et la mise en page d'un document
   importé — bandeau sombre, pastilles dorées, texte au fil de l'eau — sans
   rapport avec le reste du logiciel, et son contenu débordait de l'écran.

   Elle emprunte désormais le parcours de la contractualisation : rubriques à
   bandeau plein, deux colonnes, pied d'étape, et chaque étape tient à l'écran.
   Les deux sections les plus longues (les dossiers motivés) ont été séparées
   en deux étapes plutôt que d'être repliées dans un cadre qui défile. */
const CARTO_ETAPES = ['Portefeuille', 'Vigilance normale', 'Vigilance renforcée', 'Contrôles', 'Conclusion'];

const CARTO_CONTROLES = [
  ['🎓', 'Formation', "Les collaborateurs du cabinet bénéficient d'une sensibilisation aux obligations de lutte contre le blanchiment de capitaux et le financement du terrorisme, adaptée à leur niveau de responsabilité."],
  ['🛡️', 'Référent LBC-FT et responsabilités', `Le référent LBC-FT désigné au sein du cabinet est ${EXPERT_COMPTABLE.nom}, expert-comptable. Il est chargé de la supervision du dispositif de vigilance et constitue le point de contact interne pour toute question relative à la classification des dossiers.`],
  ['🛰️', 'Remontée interne des soupçons', "Tout élément suscitant un doute fait l'objet d'une remontée interne auprès du référent LBC-FT, qui apprécie l'opportunité d'une déclaration de soupçon à TRACFIN."],
  ['🔁', 'Vigilance exercée dans la durée', "La vigilance ne se limite pas à l'entrée en relation : les dossiers en vigilance renforcée font l'objet d'un suivi rapproché et d'une réévaluation en cas d'évolution significative (changement d'actionnariat, d'activité ou événement inhabituel)."],
];

/* Liste de dossiers motivés : le dossier à gauche, sa justification à droite.
   Paginée, comme partout ailleurs — pas de cadre qui défile. */
function CartoDossiersMotives({ dossiers, vide }) {
  const pagination = usePagination(dossiers, 3);
  if (dossiers.length === 0) return h(EmptyDetail, { icon: '✅', label: vide });
  return h(React.Fragment, null,
    h('div', { className: 'carto-liste' },
      pagination.pageItems.map(d => h('div', { className: 'carto-dossier', key: d.dossier },
        h('div', { className: 'carto-dossier-tete' },
          h('span', { className: 'carto-dossier-nom' }, client(d.dossier).nom),
          h(Badge, { color: niveauVigilanceCouleur(d.niveauRetenu) }, d.niveauRetenu)
        ),
        h('p', { className: 'carto-dossier-texte' }, d.justification)
      ))
    ),
    h(Pagination, { pagination })
  );
}

function CartographieRisques({ onBack, showToast, cabinetNom }) {
  const stats = cartographieStats();
  const pct = n => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const motiveesNormale = stats.analyseMotivee.filter(d => d.niveauRetenu === 'Normale');
  cabinetNom = cabinetNom || CABINET_SETTINGS_DEFAUT.nom;

  const [etape, setEtape] = useState(1);
  const suivant = () => setEtape(e => Math.min(CARTO_ETAPES.length, e + 1));
  const precedent = () => setEtape(e => Math.max(1, e - 1));

  const repartition = [
    { nom: 'Vigilance allégée', n: stats.allegee.length, couleur: 'vert' },
    { nom: 'Vigilance normale', n: stats.normale.length, couleur: 'bleu' },
    { nom: 'Vigilance renforcée', n: stats.renforcee.length, couleur: 'rouge' },
  ];

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Cartographie des risques'),
      )
    ),
    h(Stepper, { steps: CARTO_ETAPES, current: etape }),

    // ---- 1. Portefeuille ----
    etape === 1 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2 colonnes-egales' },
        h(FormSection, { icon: '📊', title: 'Répartition du portefeuille', ton: 'violet',
          subtitle: `${stats.total} ${pluriel(stats.total, 'dossier')} ${pluriel(stats.total, 'analysé')}` },
          repartition.map(r => h('div', { className: 'repartition-ligne', key: r.nom },
            h('div', { className: 'repartition-tete' },
              h('span', { className: 'repartition-nom' }, r.nom),
              h('span', { className: 'repartition-nb' }, r.n, ' ', h('span', { className: 'repartition-pct' }, `(${pct(r.n)} %)`))
            ),
            h('div', { className: 'bar-track' },
              h('div', { className: cx('bar-fill', 'niv-' + r.couleur), style: { width: pct(r.n) + '%' } })
            )
          )),
          h('div', { className: 'recap-voyants', style: { marginTop: 16 } },
            [['Analyses motivées', `${stats.analyseMotivee.length} sur ${stats.total}`, 'bleu'],
             ['Non encore analysés', String(stats.nonAnalyses.length), stats.nonAnalyses.length ? 'orange' : 'vert'],
             ['Données arrêtées au', formatDate(stats.dateArrete), 'bleu'],
            ].map(([cle, valeur, couleur]) => h('div', { className: cx('recap-voyant', couleur), key: cle },
              h('span', { className: 'recap-voyant-cle' }, cle),
              h('span', { className: 'recap-voyant-valeur' }, valeur)
            ))
          )
        ),
        h('div', { className: 'pile-cartes' },
          h(FormSection, { icon: '⚖️', title: 'Méthode retenue', ton: 'violet' },
            h('p', { className: 'carto-texte' }, 'La présente cartographie constitue la classification des risques de blanchiment de capitaux et de financement du terrorisme du cabinet, établie en application des articles L. 561-4-1 et suivants du code monétaire et financier.'),
            h('p', { className: 'carto-texte' }, 'Le risque de chaque dossier est apprécié selon quatre critères — caractéristiques du client, activité, localisation et missions proposées — chacun coté Faible, Moyen ou Élevé.'),
            h('p', { className: 'carto-texte', style: { marginBottom: 0 } }, 'Aucun dossier n’est placé en vigilance allégée : le cabinet a fait le choix de ne pas y recourir en l’absence de décision expresse et documentée du référent LBC-FT.')
          ),
          stats.nonAnalyses.length ? h(FormSection, { icon: '⏳', title: 'Dossiers en attente d’analyse', ton: 'violet',
            subtitle: String(stats.nonAnalyses.length) },
            stats.nonAnalyses.map(d => h('div', { className: 'list-row', key: d.dossier },
              h('span', { className: 'list-row-label' }, client(d.dossier).nom),
              h('span', { className: 'conf-note' }, collaborateur(client(d.dossier).collaborateur).nom)
            ))
          ) : null
        )
      ),
      h('div', { className: 'wizard-footer' },
        onBack ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : h('span'),
        h('button', { className: 'btn btn-primary', onClick: suivant }, 'Continuer →')
      )
    ),

    // ---- 2. Vigilance normale avec justification motivée ----
    etape === 2 && h('div', { className: 'step-body' },
      h(FormSection, { icon: '📁', title: 'Vigilance normale avec justification motivée', ton: 'violet',
        subtitle: `${motiveesNormale.length} ${pluriel(motiveesNormale.length, 'dossier')}` },
        h('p', { className: 'carto-texte' }, 'Dossiers pour lesquels au moins un facteur de risque a été identifié et a fait l’objet d’un examen documenté, sans justifier une vigilance renforcée.'),
        h(CartoDossiersMotives, { dossiers: motiveesNormale, vide: 'Aucun dossier dans cette catégorie.' })
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: suivant }, 'Continuer →')
      )
    ),

    // ---- 3. Vigilance renforcée ----
    etape === 3 && h('div', { className: 'step-body' },
      h(FormSection, { icon: '🔴', title: 'Vigilance renforcée', ton: 'violet',
        subtitle: `${stats.renforcee.length} ${pluriel(stats.renforcee.length, 'dossier')}` },
        h('p', { className: 'carto-texte' }, 'Dossiers faisant l’objet d’une surveillance accrue et de pièces complémentaires, avec réévaluation en cas d’évolution significative.'),
        h(CartoDossiersMotives, { dossiers: stats.renforcee, vide: 'Aucun dossier en vigilance renforcée.' })
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: suivant }, 'Continuer →')
      )
    ),

    // ---- 4. Contrôles et mesures d'atténuation ----
    etape === 4 && h('div', { className: 'step-body' },
      h('div', { className: 'carto-controles' },
        CARTO_CONTROLES.map(([icone, titre, texte]) => h(FormSection, { key: titre, icon: icone, title: titre, ton: 'violet' },
          h('p', { className: 'carto-texte', style: { marginBottom: 0 } }, texte)
        ))
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: suivant }, 'Continuer →')
      )
    ),

    // ---- 5. Conclusion et validation ----
    etape === 5 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2 colonnes-egales' },
        h(FormSection, { icon: '📝', title: 'Conclusion générale', ton: 'violet' },
          h('p', { className: 'carto-texte' },
            `Au vu des éléments qui précèdent, le profil de risque LBC-FT du cabinet apparaît globalement maîtrisé au regard de la nature de sa clientèle et de son activité.`),
          h('p', { className: 'carto-texte' },
            `Sur ${stats.total} dossiers analysés, ${stats.analyseMotivee.length} ont fait l’objet d’une analyse motivée : ${motiveesNormale.length} classés en vigilance normale et ${stats.renforcee.length} classés en vigilance renforcée.`),
          stats.nonAnalyses.length
            ? h('p', { className: 'carto-texte', style: { marginBottom: 0 } },
              `${stats.nonAnalyses.length} ${pluriel(stats.nonAnalyses.length, 'dossier')} ${pluriel(stats.nonAnalyses.length, 'reste', 'restent')} à analyser.`)
            : null
        ),
        h(FormSection, { icon: '✅', title: 'Validation', ton: 'violet' },
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Cabinet'), h('span', { className: 'v' }, cabinetNom)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Référent LBC-FT'), h('span', { className: 'v' }, EXPERT_COMPTABLE.nom)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Date d’arrêté'), h('span', { className: 'v' }, formatDate(stats.dateArrete))),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dossiers couverts'), h('span', { className: 'v' }, `${stats.total} analysés, ${stats.nonAnalyses.length} restant à analyser`)),
          h('div', { className: 'form-help', style: { marginTop: 14 } },
            'Une fois arrêtée, la cartographie est datée et conservée : c’est la pièce que le contrôleur demandera au titre de l’article L. 561-4-1.')
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: precedent }, '← Retour'),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Cartographie exportée au format PDF (démonstration)') }, '⬇ Exporter en PDF'),
        h('button', { className: 'btn btn-primary', onClick: () => showToast('Cartographie arrêtée et datée (démonstration)') }, '✅ Arrêter la cartographie')
      )
    )
  );
}

/* Cet écran ne sert qu'à deux choses : constater qu'un dossier pèse plus que
   le seuil que le cabinet s'est fixé, et sortir la note qui dit ce qu'on fait
   pour rester indépendant. Le nom du client et sa part d'honoraires viennent
   du dossier : les ressaisir était une source d'erreur, pas une liberté. Seules
   les mesures se rédigent ici. */
function DependanceEconomiqueForm({ record, onBack, showToast, cabinetSettings }) {
  const c = client(record.dossier);
  const societe = c.nom;
  const partCA = record.partHonoraires;
  const [mesures, setMesures] = useState(record.mesures);
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;

  function generer() {
    const today = formatDateLong(new Date().toISOString().slice(0, 10));
    const logoHtml = settings.logoDataUrl ? `<img src="${settings.logoDataUrl}" style="height:36pt; margin-bottom:10pt;">` : '';
    const html = `
      ${logoHtml}
      <p style="font-size:11pt; font-weight:bold; margin:0;">${settings.nom}</p>
      <p style="font-size:9pt; color:#666; margin:0 0 22pt;">${settings.adresse}${settings.telephone ? ' — ' + settings.telephone : ''}</p>
      <h1 style="font-size:16pt; margin-bottom:2pt;">Note de dépendance économique</h1>
      <p style="font-size:9.5pt; color:#666; margin-top:0;">Établie le ${today}, conformément aux règles d'indépendance du code de déontologie des professionnels de l'expertise comptable (articles 141 à 169 du décret n° 2012-432 du 30 mars 2012).</p>
      <p><b>Dossier concerné :</b> ${societe}</p>
      <p><b>Part du chiffre d'affaires du cabinet :</b> ${pourcent(partCA)}</p>
      <p><b>Seuil d'alerte fixé par le cabinet :</b> ${pourcent(record.seuil)}</p>
      <h2 style="font-size:13pt;">Mesures prises par le cabinet pour garantir son indépendance</h2>
      <p>${mesures.replace(/\n/g, '<br>')}</p>
      <p style="margin-top:30pt;">Le ${today}</p>
      <p><b>${EXPERT_COMPTABLE.nom}</b><br>Expert-comptable, référent LBC-FT du cabinet</p>
      <p style="margin-top:24pt; color:#999; font-size:8pt;">Document généré par ComplyEC.</p>
    `;
    downloadWordDoc(`Note_dependance_economique_${societe.replace(/\s+/g, '_')}.doc`, 'Note de dépendance économique', html);
    showToast('Document Word généré et téléchargé.');
  }

  const depassement = (Number(partCA) - Number(record.seuil)).toFixed(1).replace('.', ',');

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Dépendance économique')),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: generer }, '⬇ Générer la note Word')
      )
    ),
    h('div', { className: 'grid-2 colonnes-egales hauteur-contenu' },
      /* Le nom du dossier se lit dans le bandeau du premier cadre plutôt que
         dans le titre de page : le titre reste alors sur une seule ligne avec
         ses deux boutons, quelle que soit la longueur de la raison sociale. */
      h(FormSection, { icon: '⚖️', title: `${societe} — ce que pèse le dossier`, ton: 'bleu' },
        h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Part des honoraires du cabinet'),
          h(Badge, { color: 'orange' }, pourcent(partCA))
        ),
        h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Seuil fixé par le cabinet'),
          h('span', { className: 'conf-note' }, pourcent(record.seuil))
        ),
        h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Dépassement'),
          h('span', { className: 'conf-note' }, '+ ', depassement, ' points')
        ),
        h('p', { className: 'conf-detail' },
          'Le seuil se modifie dans les paramètres du cabinet. Aucun texte ne le fixe : ',
          'le code de déontologie (articles 141 à 169 du décret n° 2012-432 du 30 mars 2012) ',
          'impose l’indépendance, pas un pourcentage. La note ci-contre sert à montrer ',
          'ce que le cabinet fait pour la préserver.')
      ),
      h(FormSection, { icon: '🛡️', title: 'Mesures de sauvegarde', ton: 'bleu' },
        h('textarea', {
          className: 'form-textarea', style: { minHeight: 210 }, value: mesures,
          onChange: e => setMesures(e.target.value),
          placeholder: 'Décrivez les mesures prises pour préserver l’indépendance du cabinet…',
        }),
        h('div', { className: 'form-help' },
          'Ce texte est le seul à rédiger : la note Word y ajoute l’en-tête du cabinet, ',
          'le dossier, les deux pourcentages ci-contre et la signature.')
      )
    )
  );
}

// ============================================================ Paramètres du cabinet

function ParametresCabinet({ showToast, settings, onSave }) {
  const [draft, setDraft] = useState(settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);

  function handleLogoFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft(prev => ({ ...prev, logoDataUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  function save() {
    onSave(draft);
    showToast('Paramètres du cabinet enregistrés (démonstration)');
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Paramètres')),
      // Le bouton d'enregistrement vit dans l'en-tête : il reste visible quel
      // que soit le défilement, plutôt que d'être rogné en bas de page.
      h('button', { className: 'btn btn-primary', disabled: !dirty, onClick: save }, '💾 Enregistrer les paramètres')
    ),
    h('div', { className: 'grid-2' },
      h('div', null,
      h(Card, { title: 'Identité du cabinet', icon: '🏢', iconBg: '#E9F1FE', iconColor: '#2563EB' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Nom du cabinet'),
          h('input', { className: 'form-input', value: draft.nom, onChange: e => setDraft(prev => ({ ...prev, nom: e.target.value })) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Adresse'),
          h('input', { className: 'form-input', value: draft.adresse, onChange: e => setDraft(prev => ({ ...prev, adresse: e.target.value })) })
        ),
        h('div', { className: 'grid-2', style: { gap: 16 } },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Téléphone'),
            h('input', { className: 'form-input', value: draft.telephone, onChange: e => setDraft(prev => ({ ...prev, telephone: e.target.value })) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Seuil de dépendance'),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('input', {
                className: 'form-input', type: 'number', min: 1, max: 100, step: 1, style: { maxWidth: 92 },
                value: draft.seuilDependance,
                onChange: e => setDraft(prev => ({ ...prev, seuilDependance: e.target.value === '' ? '' : Number(e.target.value) })),
              }),
              h('span', { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-muted)' } }, '% du CA')
            )
          )
        ),
        h('div', { className: 'grid-2', style: { gap: 16 } },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Révision des lettres'),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('input', {
                className: 'form-input', type: 'number', min: 1, max: 120, step: 1, style: { maxWidth: 92 },
                value: draft.ldmRevisionMois,
                onChange: e => setDraft(prev => ({ ...prev, ldmRevisionMois: e.target.value === '' ? '' : Number(e.target.value) })),
              }),
              h('span', { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-muted)' } }, 'mois')
            )
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Sessions LBC-FT / an'),
            h('input', {
              className: 'form-input', type: 'number', min: 0, max: 12, step: 1, style: { maxWidth: 92 },
              value: draft.sessionsLbcftParAn,
              onChange: e => setDraft(prev => ({ ...prev, sessionsLbcftParAn: e.target.value === '' ? '' : Number(e.target.value) })),
            })
          )
        ),
        h('div', { className: 'form-help', style: { margin: '-4px 0 16px' } },
          'Aucun de ces trois chiffres n’est imposé par un texte : ce sont les règles que le cabinet se donne. Ils servent partout dans le logiciel, manuel de procédures compris.'),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Logo du cabinet'),
          h('div', { style: { display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' } },
            draft.logoDataUrl
              ? h('img', { src: draft.logoDataUrl, alt: 'Logo du cabinet', style: { height: 48, maxWidth: 160, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, padding: 4 } })
              : h('div', { style: { height: 48, width: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 8, color: '#4E5563', fontSize: 12.5 } }, 'Aucun logo'),
            h('label', { className: 'btn btn-secondary btn-sm', style: { cursor: 'pointer', display: 'inline-flex' } },
              '📎 Choisir un fichier',
              h('input', { type: 'file', accept: 'image/png,image/jpeg,image/svg+xml', style: { display: 'none' }, onChange: handleLogoFile })
            )
          ),
          h('div', { className: 'form-help', style: { marginTop: 6 } }, 'Utilisé sur les documents et e-mails générés.')
        )
      ),
        h(Card, { title: 'Déclarant et correspondant Tracfin', subtitle: 'Deux rôles distincts, exigés par l’article R. 561-23.', icon: '🛰️', iconBg: '#FDECEC', iconColor: '#DC2626', style: { marginTop: 18 } },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Déclarant — signe les déclarations de soupçon'),
            h('input', { className: 'form-input', value: draft.declarantTracfin || '', onChange: e => setDraft(prev => ({ ...prev, declarantTracfin: e.target.value })) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Correspondant — répond aux demandes de Tracfin'),
            h('input', { className: 'form-input', value: draft.correspondantTracfin || '', onChange: e => setDraft(prev => ({ ...prev, correspondantTracfin: e.target.value })) })
          ),
          h('label', { className: 'checkbox-row' },
            h('input', { type: 'checkbox', checked: Boolean(draft.tracfinDeclareAuService), onChange: e => setDraft(prev => ({ ...prev, tracfinDeclareAuService: e.target.checked })) }),
            h('span', null, 'Ces désignations ont été communiquées à Tracfin et au Conseil de l’Ordre')
          ),
          h('div', { className: 'form-help', style: { marginTop: 8 } },
            'L’article R. 561-23 impose aussi de communiquer ces identités à Tracfin et à l’autorité de contrôle, et de signaler tout changement.')
        ),
      ),
      h('div', null,
        h(Card, { title: 'Signature e-mail par défaut', icon: '✍️', iconBg: '#FEF3E1', iconColor: '#B45309' },
          h('div', { className: 'form-group' },
            h('textarea', { className: 'form-textarea', style: { minHeight: 130, fontFamily: 'inherit' }, value: draft.signature, onChange: e => setDraft(prev => ({ ...prev, signature: e.target.value })) })
          ),
          h('div', { className: 'form-help', style: { marginBottom: 6 } }, 'Aperçu'),
          h('div', { style: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, fontSize: 12.8, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 } },
            draft.logoDataUrl ? h('img', { src: draft.logoDataUrl, alt: '', style: { height: 28, marginBottom: 6, display: 'block' } }) : null,
            draft.signature
          )
        ),
        h(Card, { title: 'Connexions externes', icon: '🔗', iconBg: '#F1EAFE', iconColor: '#7C3AED', style: { marginTop: 18 } },
          h('div', { className: 'list-row' },
            h('span', { className: 'list-row-label' }, '📧 Outlook / Microsoft 365'),
            h(Badge, { color: 'gris' }, '○ Non connecté')
          ),
          h('div', { className: 'list-row' },
            h('span', { className: 'list-row-label' }, '📁 Google Drive'),
            h(Badge, { color: 'gris' }, '○ Non connecté')
          ),
          h('div', { className: 'form-help', style: { marginTop: 10 } },
            "La connexion à Outlook et à Google Drive nécessite une configuration côté administrateur (identifiants d'application, autorisations OAuth) qui n'est pas encore réalisée pour ce cabinet — ces intégrations seront activées lors du déploiement définitif."
          )
        )
      )
    ),
  );
}
