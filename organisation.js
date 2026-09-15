// ComplyEC — Organisation, ressources et registres (S19 à S30) — phase 4
'use strict';

/* =====================================================================
   Ce que le cabinet est, et avec quoi il travaille
   =====================================================================

   Quatre familles d'écrans : qui porte quel rôle, qui compose l'équipe et où
   elle en est de sa formation, quels outils touchent aux données, et ce que le
   registre RGPD contient.

   Une règle traverse tout : ComplyEC ne juge pas. Un contrat dont on ne
   connaît pas la clause de sauvegarde affiche « à confirmer avec le
   prestataire », jamais « non conforme ». Le cahier l'interdit, et c'est
   juste : lire un contrat et conclure à sa conformité est un travail
   d'expert-comptable, pas de logiciel.

   Une autre, tout aussi ferme : ne pas devenir un SIRH. Pas de paie, pas de
   congés, pas de rémunération. L'écran Équipe ne porte que ce qui sert au
   système de management de la qualité.
   ===================================================================== */

// =========================================== S19 — Organisation & responsabilités

function OrganisationResponsabilites({ onBack, showToast }) {
  const direction = ROLES_CABINET.filter(r => r.famille === 'direction');
  const transverses = ROLES_CABINET.filter(r => r.famille === 'transverse');
  const nonCouverts = rolesNonCouverts();

  function ligneRole(role) {
    const titulaire = titulaireRole(role);
    return h('div', { className: 'role-ligne', key: role.code },
      h('div', { className: 'role-corps' },
        h('div', { className: 'role-label' }, role.label),
        h('div', { className: 'role-fondement' }, role.fondement)
      ),
      titulaire
        ? h('span', { className: 'role-titulaire' }, titulaire)
        : h(Badge, { color: 'orange' }, 'non couvert')
    );
  }

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Organisation & responsabilités',
      onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => showToast('Modification des responsables (démonstration).') },
        'Modifier les responsables'),
    }),
    /* Un rôle sans titulaire n'est pas une case vide à remplir : c'est une
       obligation professionnelle que personne ne porte. On le dit avant la
       liste, pas après. */
    nonCouverts.length
      ? h('div', { className: 'mention-simulee', style: { borderLeftColor: '#DC2626', borderColor: '#F3C4C4', background: 'linear-gradient(180deg, #FFF8F8, #FDEFEF)', color: '#8B2020' } },
        h('span', { className: 'mention-simulee-puce' }, '⚠'),
        h('span', null,
          `${nonCouverts.length} ${pluriel(nonCouverts.length, 'rôle n’est pas couvert', 'rôles ne sont pas couverts')} : `,
          nonCouverts.map(r => r.label).join(', '), '. Un contrôleur qualité le demandera.'))
      : null,
    h('div', { className: 'grid-2 colonnes-egales hauteur-contenu' },
      h(FormSection, { icon: '🏛️', title: 'Direction & experts-comptables', ton: 'bleu' },
        direction.map(ligneRole)
      ),
      h(FormSection, { icon: '🎯', title: 'Fonctions transverses', ton: 'bleu', subtitle: String(transverses.length) },
        transverses.map(ligneRole)
      )
    ),
    SUPPLEANCES.length
      ? h(FormSection, { icon: '🔁', title: 'Suppléances et délégations', ton: 'bleu', style: { marginTop: 18 } },
        SUPPLEANCES.map((s, i) => {
          const role = ROLES_CABINET.find(r => r.code === s.role);
          return h('div', { className: 'list-row', key: i },
            h('span', { className: 'list-row-label' }, role ? role.label : s.role),
            h('span', { className: 'conf-note' }, `${s.titulaire} — suppléé par ${s.suppleant} depuis le ${formatDate(s.depuis)}`));
        }))
      : null
  );
}

// ======================================================= S20 — Indépendance

/* Le patron campagne : une opération répétée sur plusieurs personnes, traitée
   ligne par ligne sans changer de page. Ce que faisaient déjà les deux listes
   de l'écran précédent, mais sur la forme commune à toutes les campagnes du
   produit — RBE, PPE, formation ciblée. */
function CampagneIndependance({ onBack, showToast }) {
  const annee = currentCalendarYear();
  const lignes = declarationsIndependanceAnnee(annee);
  const [relances, setRelances] = useState({});
  const [choisi, setChoisi] = useState(null);

  const signees = lignes.filter(d => d.statut === 'signee');
  const attente = lignes.filter(d => d.statut !== 'signee');
  const anomalies = lignes.filter(d => d.anomalie);

  function relancer(ids, message) {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const maj = {};
    ids.forEach(id => { maj[id] = aujourdhui; });
    setRelances(r => Object.assign({}, r, maj));
    showToast(message);
  }

  const colonnes = [
    { code: 'nom', titre: 'Collaborateur', classe: 'table-name',
      valeur: d => collaborateur(d.collaborateur).nom,
      rendu: d => h('span', { className: 'list-row-label' },
        h('span', { className: 'avatar' }, collaborateur(d.collaborateur).initiales),
        collaborateur(d.collaborateur).nom) },
    { code: 'etat', titre: 'État', valeur: d => (d.statut === 'signee' ? 1 : 0),
      rendu: d => h(Badge, { color: d.statut === 'signee' ? 'vert' : 'orange' }, d.statut === 'signee' ? 'Signée' : 'En attente') },
    { code: 'date', titre: 'Depuis le', valeur: d => d.dateSignature || relances[d.collaborateur] || '',
      rendu: d => (d.statut === 'signee'
        ? formatDate(d.dateSignature)
        : (relances[d.collaborateur]
          ? h('span', { className: 'conf-note' }, 'Relancé le ', formatDate(relances[d.collaborateur]))
          : h('span', { className: 'conf-note' }, '—'))) },
  ];

  const courant = choisi ? lignes.find(d => d.collaborateur === choisi) : null;
  const fiche = courant
    ? h(Card, {
      title: collaborateur(courant.collaborateur).nom,
      subtitle: `Déclaration d’indépendance — exercice ${annee}`,
      icon: '📜', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: courant.statut === 'signee' ? 'vert' : 'orange',
    },
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'État'),
        h(Badge, { color: courant.statut === 'signee' ? 'vert' : 'orange' },
          courant.statut === 'signee' ? `Signée le ${formatDate(courant.dateSignature)}` : 'En attente')),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Anomalie déclarée'),
        h('span', { className: 'conf-note' }, courant.anomalie || 'Aucune')),
      h('div', { className: 'detail-field', style: { marginTop: 12 } },
        h('div', { className: 'detail-field-label' }, 'Ce que la déclaration engage'),
        h('div', { className: 'detail-field-value' },
          'L’absence de lien personnel, financier ou professionnel susceptible d’altérer le jugement, au sens des articles 145 et suivants du décret n° 2012-432.')),
      courant.statut === 'signee'
        ? null
        : (relances[courant.collaborateur]
          ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            'Relancé le ', formatDate(relances[courant.collaborateur]), '.')
          : h('button', {
            className: 'btn btn-primary btn-sm',
            onClick: () => relancer([courant.collaborateur], `Rappel envoyé à ${collaborateur(courant.collaborateur).nom}.`),
          }, '📨 Relancer'))
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Indépendance', onRetour: onBack }),
    h(CampaignView, {
      faits: signees.length, total: lignes.length,
      libelleProgression: `déclarations signées pour ${annee}`,
      tuiles: [
        { libelle: 'Signées', valeur: signees.length, ton: 'vert' },
        { libelle: 'En attente', valeur: attente.length, ton: attente.length ? 'orange' : null },
        { libelle: 'Anomalies déclarées', valeur: anomalies.length, ton: anomalies.length ? 'rouge' : null },
      ],
      action: attente.length
        ? {
          libelle: `📨 Relancer les ${attente.length} en attente`,
          onClick: () => relancer(attente.map(d => d.collaborateur),
            `Rappel envoyé à ${attente.length} ${pluriel(attente.length, 'collaborateur')}.`),
        }
        : null,
      titreListe: `Déclarations ${annee}`, iconeListe: '📜',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: d => d.collaborateur,
      selection: choisi, onSelect: d => setChoisi(d.collaborateur),
      detail: fiche, detailIcone: '📜',
      detailVide: 'Choisissez un collaborateur pour voir sa déclaration',
    })
  );
}

// ============================================================ S23 — Équipe

function EquipeSMQ({ onBack, showToast, onApercuCollab, navigateEc }) {
  const [choisi, setChoisi] = useState(null);
  const declarations = declarationsIndependanceAnnee(currentCalendarYear());

  const colonnes = [
    { code: 'nom', titre: 'Collaborateur', classe: 'table-name', valeur: c => c.nom,
      rendu: c => h('span', { className: 'list-row-label' },
        h('span', { className: 'avatar' }, c.initiales), c.nom) },
    { code: 'role', titre: 'Fonction', valeur: c => c.role, rendu: c => c.role },
    { code: 'formation', titre: 'Formation LBC-FT',
      valeur: c => etatFormationCollaborateur(c.id).code,
      rendu: c => { const e = etatFormationCollaborateur(c.id); return h(Badge, { color: e.couleur }, e.label); } },
    { code: 'independance', titre: 'Indépendance',
      valeur: c => ((declarations.find(d => d.collaborateur === c.id) || {}).statut === 'signee' ? 1 : 0),
      rendu: c => {
        const d = declarations.find(x => x.collaborateur === c.id);
        return h(Badge, { color: d && d.statut === 'signee' ? 'vert' : 'orange' },
          d && d.statut === 'signee' ? 'Signée' : 'En attente');
      } },
  ];

  const rolesDe = id => ROLES_CABINET.filter(r => titulaireRole(r) === (collaborateur(id) || {}).nom);

  const fiche = choisi
    ? (() => {
      const c = collaborateur(choisi);
      const roles = rolesDe(choisi);
      const supp = SUPPLEANCES.filter(s => s.suppleant === c.nom);
      return h(Card, {
        title: c.nom, subtitle: c.role,
        icon: '👤', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu',
      },
        h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Entré le'),
          h('span', { className: 'conf-note' }, formatDate(COLLABORATEURS_EMBAUCHE[c.id]))),
        h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Responsabilités transverses'),
          h('span', { className: 'conf-note' }, roles.length ? roles.map(r => r.label).join(', ') : 'Aucune')),
        h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Suppléance'),
          h('span', { className: 'conf-note' },
            supp.length ? supp.map(s => (ROLES_CABINET.find(r => r.code === s.role) || {}).label).join(', ') : 'Aucune')),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' } },
          h('button', { className: 'btn btn-primary btn-sm', onClick: () => showToast('Modification de la fiche (démonstration).') }, 'Modifier la fiche'),
          h('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigateEc('ressources', 'formation') }, 'Ouvrir la formation'),
          onApercuCollab ? h('button', { className: 'btn btn-secondary btn-sm', onClick: () => onApercuCollab(c.id) }, 'Voir son espace') : null
        )
      );
    })()
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Équipe', onRetour: onBack }),
    h(ActionListDetail, {
      titreListe: 'Collaborateurs du cabinet', iconeListe: '👥',
      sousTitreListe: String(COLLABORATEURS.length),
      colonnes, lignes: COLLABORATEURS, cle: c => c.id, parPage: 5,
      vide: 'Aucun collaborateur enregistré.',
      selection: choisi, onSelect: c => setChoisi(c.id),
      detail: fiche, detailIcone: '👤',
      detailVide: 'Choisissez un collaborateur pour voir sa fiche',
    })
  );
}

// ================================================= S24/S25 — Formation

function FormationPilotage({ onBack, showToast, cabinetSettings, navigateEc, onChangerReglage }) {
  const settings = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const attendues = Number(settings.sessionsLbcftParAn || SESSIONS_ATTENDUES_PAR_AN);
  const [choisi, setChoisi] = useState(null);
  const [fiche, setFiche] = useState(null);
  const [demandes, setDemandes] = useState({});
  const [sessionsEdite, setSessionsEdite] = useState(attendues);
  useEffect(() => { setSessionsEdite(attendues); }, [attendues]);

  if (fiche) return h(FicheFormation, { collabId: fiche, onBack: () => setFiche(null), showToast });

  const etats = COLLABORATEURS.map(c => ({ c, etat: etatFormationCollaborateur(c.id) }));
  const aJour = etats.filter(e => e.etat.code === 'a-jour');
  const sansPreuve = etats.filter(e => e.etat.code === 'sans-preuve');
  const jamais = etats.filter(e => e.etat.code === 'jamais');

  const colonnes = [
    { code: 'nom', titre: 'Collaborateur', classe: 'table-name', valeur: e => e.c.nom,
      rendu: e => h('span', { className: 'list-row-label' }, h('span', { className: 'avatar' }, e.c.initiales), e.c.nom) },
    { code: 'derniere', titre: 'Dernière formation',
      valeur: e => dernierAttestationRecue(e.c.id) || '',
      rendu: e => { const d = dernierAttestationRecue(e.c.id); return d ? formatDate(d) : h('span', { className: 'info-source-vide' }, 'Aucune'); } },
    { code: 'etat', titre: 'Justificatifs', valeur: e => e.etat.code,
      rendu: e => h(Badge, { color: e.etat.couleur }, e.etat.label) },
  ];

  const courant = choisi ? etats.find(e => e.c.id === choisi) : null;
  const detail = courant
    ? h(Card, {
      title: courant.c.nom, subtitle: courant.etat.label,
      icon: '🎓', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: courant.etat.couleur === 'vert' ? 'vert' : 'orange',
    },
      formationsDuCollaborateur(courant.c.id).slice(0, 3).map(l => h('div', { className: 'list-row', key: l.id },
        h('span', { className: 'list-row-label' }, l.titre),
        h(Badge, { color: l.attestation ? 'vert' : (l.passee ? 'orange' : 'gris') },
          l.attestation ? 'attestation reçue' : (l.passee ? 'sans attestation' : 'à venir')))),
      h('div', { style: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-primary btn-sm', onClick: () => setFiche(courant.c.id) }, 'Ouvrir la fiche formation'),
        demandes[courant.c.id]
          ? h('span', { className: 'conf-note' }, 'Attestation demandée le ', formatDate(demandes[courant.c.id]))
          : h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => {
              setDemandes(d => Object.assign({}, d, { [courant.c.id]: new Date().toISOString().slice(0, 10) }));
              showToast(`Attestation demandée à ${courant.c.nom}.`);
            },
          }, 'Demander une attestation')
      )
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Formation', onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => showToast('Ajout d’une formation (démonstration).') },
        '+ Ajouter une formation'),
    }),
    h(CampaignView, {
      faits: aJour.length, total: etats.length,
      libelleProgression: 'collaborateurs à jour de leurs justificatifs',
      tuiles: [
        { libelle: 'À jour', valeur: aJour.length, ton: 'vert' },
        { libelle: 'Attestations manquantes', valeur: sansPreuve.length, ton: sansPreuve.length ? 'orange' : null },
        /* La règle que le cabinet se donne s'édite là où elle s'applique. Aucun
           texte n'impose un nombre de sessions par an : c'est une décision du
           cabinet, reprise telle quelle dans le manuel. */
        { libelle: 'Sessions prévues par an', ton: null, valeur: h('input', {
          className: 'tuile-champ', type: 'number', min: 0, max: 12, step: 1,
          value: sessionsEdite,
          onChange: e => setSessionsEdite(e.target.value === '' ? '' : Number(e.target.value)),
          onBlur: () => {
            if (sessionsEdite === '' || Number(sessionsEdite) === attendues) return;
            if (onChangerReglage) onChangerReglage('sessionsLbcftParAn', Number(sessionsEdite));
            showToast(`Le cabinet prévoit désormais ${sessionsEdite} ${pluriel(sessionsEdite, 'session')} par an.`);
          },
        }) },
      ],
      titreListe: 'Suivi par collaborateur', iconeListe: '🎓',
      sousTitreListe: String(etats.length),
      colonnes, lignes: etats, cle: e => e.c.id,
      triDefaut: { col: 'etat', sens: 'asc' },
      vide: 'Aucun collaborateur.',
      selection: choisi, onSelect: e => setChoisi(e.c.id),
      detail, detailIcone: '🎓',
      detailVide: 'Choisissez un collaborateur pour voir ses formations',
    })
  );
}

function FicheFormation({ collabId, onBack, showToast }) {
  const c = collaborateur(collabId);
  const lignes = formationsDuCollaborateur(collabId);
  const [choisie, setChoisie] = useState(null);

  const colonnes = [
    { code: 'date', titre: 'Date', valeur: l => l.date, rendu: l => formatDate(l.date) },
    { code: 'titre', titre: 'Formation', classe: 'table-name', valeur: l => l.titre, rendu: l => l.titre },
    { code: 'preuve', titre: 'Attestation', valeur: l => (l.attestation ? 1 : 0),
      rendu: l => h(Badge, { color: l.attestation ? 'vert' : (l.passee ? 'orange' : 'gris') },
        l.attestation ? 'Reçue' : (l.passee ? 'Manquante' : 'À venir')) },
  ];

  const courante = choisie ? lignes.find(l => l.id === choisie) : null;
  const detail = courante
    ? h(Card, {
      title: courante.titre, subtitle: `${courante.formateur} — ${formatDate(courante.date)}`,
      icon: '📎', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: courante.attestation ? 'vert' : 'orange',
    },
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Attestation'),
        h(Badge, { color: courante.attestation ? 'vert' : 'orange' },
          courante.attestation ? `Reçue le ${formatDate(courante.dateUpload)}` : 'Manquante')),
      h('div', { className: 'detail-field', style: { marginTop: 12 } },
        h('div', { className: 'detail-field-label' }, 'Pourquoi la conserver'),
        h('div', { className: 'detail-field-value' },
          'La formation du personnel à la lutte contre le blanchiment est une obligation de l’article L. 561-33 du code monétaire et financier. Le justificatif est la seule preuve opposable.')),
      courante.attestation
        ? null
        : h('button', { className: 'btn btn-primary btn-sm', onClick: () => showToast('Attestation jointe (démonstration).') },
          '📎 Joindre une attestation')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: `Formation — ${c.nom}`, onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => showToast('Ajout d’une formation (démonstration).') },
        '+ Ajouter une formation'),
    }),
    h(ActionListDetail, {
      titreListe: 'Chronologie', iconeListe: '🎓',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: l => l.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune formation enregistrée pour ce collaborateur.',
      selection: choisie, onSelect: l => setChoisie(l.id),
      detail, detailIcone: '📎',
      detailVide: 'Choisissez une formation pour voir sa preuve',
    })
  );
}

// ================================================= S26 — Outils & prestataires

function OutilsPrestataires({ onBack, showToast, navigateEc }) {
  const [choisi, setChoisi] = useState(null);
  const [confirmes, setConfirmes] = useState({});

  const lignes = OUTILS_PRESTATAIRES.map(o => (confirmes[o.id]
    ? Object.assign({}, o, { derniereConfirmation: confirmes[o.id] })
    : o));

  const colonnes = [
    { code: 'nom', titre: 'Outil ou prestataire', classe: 'table-name', valeur: o => o.nom, rendu: o => o.nom },
    { code: 'type', titre: 'Type', valeur: o => o.type, rendu: o => o.type },
    { code: 'acces', titre: 'Accès aux données', valeur: o => (o.accesDonnees ? 0 : 1),
      rendu: o => h(Badge, { color: o.accesDonnees ? 'orange' : 'gris' }, o.accesDonnees ? 'Oui' : 'Non') },
    { code: 'confirme', titre: 'Confirmé le', valeur: o => o.derniereConfirmation || '',
      rendu: o => (o.derniereConfirmation ? formatDate(o.derniereConfirmation) : h(Badge, { color: 'violet' }, 'à confirmer')) },
  ];

  const courant = choisi ? lignes.find(o => o.id === choisi) : null;
  const source = courant && courant.sourceId ? SOURCES_DOCUMENTS.find(s => s.id === courant.sourceId) : null;
  const manquantes = courant ? mesuresManquantes(courant) : [];

  const detail = courant
    ? h(Card, {
      title: courant.nom, subtitle: `${courant.type} — ${courant.usage}`,
      icon: '🧰', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: courant.derniereConfirmation ? 'vert' : 'bleu',
    },
      Object.keys(MESURES_LIBELLES).map(k => h('div', { className: 'list-row', key: k },
        h('span', { className: 'list-row-label' }, MESURES_LIBELLES[k]),
        courant.mesures[k]
          ? h('span', { className: 'conf-note' }, courant.mesures[k])
          : h(Badge, { color: 'violet' }, 'à confirmer avec le prestataire'))),
      /* Jamais « non conforme » : ComplyEC ne lit pas un contrat pour en tirer
         une conclusion juridique. Il dit ce qu'il ne sait pas. */
      manquantes.length
        ? h('p', { className: 'conf-detail' },
          `${manquantes.length} ${pluriel(manquantes.length, 'point reste', 'points restent')} à vérifier auprès du prestataire. `,
          'ComplyEC ne conclut pas à la conformité ou non-conformité d’un contrat : il signale ce qui n’a pas été trouvé.')
        : null,
      source
        ? h('div', { className: 'detail-field' },
          h('div', { className: 'detail-field-label' }, 'Document source'),
          h('div', { className: 'detail-field-value' }, '📄 ', source.nom))
        : null,
      h('div', { style: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' } },
        courant.derniereConfirmation
          ? h('span', { className: 'conf-note' }, 'Confirmé le ', formatDate(courant.derniereConfirmation))
          : h('button', {
            className: 'btn btn-primary btn-sm',
            onClick: () => {
              setConfirmes(c => Object.assign({}, c, { [courant.id]: new Date().toISOString().slice(0, 10) }));
              showToast(`${courant.nom} confirmé.`);
            },
          }, 'Confirmer les informations'),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => navigateEc('documents-cabinet', 'cat-informatique') },
          '📥 Déposer un contrat')
      )
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Outils & prestataires', onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => showToast('Ajout d’un outil ou prestataire (démonstration).') },
        '+ Ajouter'),
    }),
    h(ActionListDetail, {
      titreListe: 'Ce qui touche aux données du cabinet', iconeListe: '🧰', tonListe: 'violet',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: o => o.id, parPage: 5,
      triDefaut: { col: 'confirme', sens: 'asc' },
      vide: 'Aucun outil enregistré.',
      selection: choisi, onSelect: o => setChoisi(o.id),
      detail, detailIcone: '🧰',
      detailVide: 'Choisissez un outil pour voir ses mesures de sécurité',
    })
  );
}

// ==================================================== S27 — RGPD & données

function RgpdHub({ sub, navigateEc, showToast }) {
  const retour = () => navigateEc('ressources', 'rgpd');

  if (sub === 'traitements') return h(RgpdTraitements, { onBack: retour, showToast });
  if (sub === 'prestataires') return h(RgpdPrestataires, { onBack: retour, showToast, navigateEc });
  if (sub === 'mesures') return h(RgpdPrestataires, { onBack: retour, showToast, navigateEc, vue: 'mesures' });

  const aRevoir = traitementsARevoir().length;
  const aConfirmer = prestatairesAConfirmer().length;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'RGPD & données', onRetour: () => navigateEc('ressources', null) }),
    h(ThemeHub, { cartes: [
      { cle: 'traitements', icone: '📋', titre: 'Traitements',
        compteur: aRevoir ? `${aRevoir} à revoir` : null, tonCompteur: 'violet',
        onOuvrir: () => navigateEc('ressources', 'rgpd-traitements') },
      { cle: 'prestataires', icone: '🤝', titre: 'Prestataires & sous-traitants',
        compteur: aConfirmer ? `${aConfirmer} à confirmer` : null, tonCompteur: 'violet',
        onOuvrir: () => navigateEc('ressources', 'rgpd-prestataires') },
      { cle: 'mesures', icone: '🔒', titre: 'Mesures de sécurité',
        onOuvrir: () => navigateEc('ressources', 'rgpd-mesures') },
    ] })
  );
}

function RgpdTraitements({ onBack, showToast }) {
  const [choisi, setChoisi] = useState(null);

  const colonnes = [
    { code: 'finalite', titre: 'Finalité', classe: 'table-name', valeur: t => t.finalite, rendu: t => t.finalite },
    { code: 'role', titre: 'Rôle', valeur: t => t.role, rendu: t => t.role },
    { code: 'revue', titre: 'Dernière revue', valeur: t => t.derniereRevue || '',
      rendu: t => (t.derniereRevue ? formatDate(t.derniereRevue) : h(Badge, { color: 'violet' }, 'jamais revue')) },
  ];

  const courant = choisi ? TRAITEMENTS_RGPD.find(t => t.id === choisi) : null;
  const champs = courant
    ? [
      ['Base légale', courant.base],
      ['Personnes concernées', courant.personnes],
      ['Données traitées', courant.donnees],
      ['Support', courant.support],
      ['Durée de conservation', courant.duree],
      ['Destinataires', courant.destinataires],
      ['Transferts hors UE', courant.transferts],
    ]
    : [];

  const detail = courant
    ? h(Card, {
      title: courant.finalite, subtitle: courant.role,
      icon: '📋', iconBg: '#F1EAFE', iconColor: '#7C3AED',
      tone: courant.derniereRevue ? 'bleu' : 'orange',
    },
      /* Champs compacts : le cahier interdit qu'une ligne du registre dépasse
         le viewport. Sept lignes courtes, pas un formulaire déroulant. */
      champs.map(([k, v]) => h('div', { className: 'list-row', key: k },
        h('span', { className: 'list-row-label' }, k),
        h('span', { className: 'conf-note', style: { textAlign: 'right', maxWidth: '62%' } }, v))),
      h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 12 }, onClick: () => showToast('Modification du traitement (démonstration).') },
        'Modifier le traitement')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Registre des traitements', onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => showToast('Ajout d’un traitement (démonstration).') },
        '+ Ajouter un traitement'),
    }),
    h(ActionListDetail, {
      titreListe: 'Traitements du cabinet', iconeListe: '📋', tonListe: 'violet',
      sousTitreListe: String(TRAITEMENTS_RGPD.length),
      colonnes, lignes: TRAITEMENTS_RGPD, cle: t => t.id, parPage: 5,
      vide: 'Aucun traitement enregistré.',
      selection: choisi, onSelect: t => setChoisi(t.id),
      detail, detailIcone: '📋',
      detailVide: 'Choisissez un traitement pour voir sa fiche',
    })
  );
}

function RgpdPrestataires({ onBack, showToast, navigateEc, vue }) {
  return h(OutilsPrestataires, { onBack, showToast, navigateEc });
}

// ========================================= S30 — Cycle client — Réclamations

function RegistreReclamations({ showToast, entete, encadre }) {
  const [choisie, setChoisie] = useState(null);
  const [nc, setNc] = useState({});

  const colonnes = [
    { code: 'date', titre: 'Date', valeur: r => r.date, rendu: r => formatDate(r.date) },
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: r => client(r.dossier).nom, rendu: r => client(r.dossier).nom },
    { code: 'objet', titre: 'Objet', valeur: r => r.objet, rendu: r => r.objet },
    { code: 'etat', titre: 'État', valeur: r => r.etat,
      rendu: r => h(Badge, { color: RECLAMATION_ETATS[r.etat].couleur }, RECLAMATION_ETATS[r.etat].label) },
  ];

  const courante = choisie ? RECLAMATIONS.find(r => r.id === choisie) : null;
  const detail = courante
    ? h(Card, {
      title: client(courante.dossier).nom,
      subtitle: `Reçue le ${formatDate(courante.date)} par ${courante.canal.toLowerCase()}`,
      icon: '📣', iconBg: '#E9F1FE', iconColor: '#2563EB',
      tone: courante.etat === 'cloturee' ? 'vert' : 'orange',
    },
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Objet'),
        h('div', { className: 'detail-field-value' }, courante.objet)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Traitée par'),
        h('span', { className: 'conf-note' }, personneNom(courante.traitePar))),
      h('div', { className: 'detail-field', style: { marginTop: 10 } },
        h('div', { className: 'detail-field-label' }, 'Réponse apportée'),
        h('div', { className: 'detail-field-value' },
          courante.reponse
            ? `${courante.reponse} (${formatDate(courante.dateReponse)})`
            : h('span', { className: 'info-source-vide' }, 'Aucune réponse enregistrée'))),
      courante.suites
        ? h('div', { className: 'detail-field' },
          h('div', { className: 'detail-field-label' }, 'Suites'),
          h('div', { className: 'detail-field-value' }, courante.suites))
        : null,
      h('div', { style: { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' } },
        courante.etat === 'cloturee'
          ? null
          : h('button', { className: 'btn btn-primary btn-sm', onClick: () => showToast('Réclamation clôturée (démonstration).') }, 'Clôturer'),
        /* La non-conformité reprend la référence de la réclamation : le cahier
           l'exige, et c'est ce qui évite de ressaisir le contexte. */
        nc[courante.id]
          ? h('span', { className: 'conf-note' }, 'Non-conformité ouverte le ', formatDate(nc[courante.id]))
          : h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => {
              setNc(n => Object.assign({}, n, { [courante.id]: new Date().toISOString().slice(0, 10) }));
              showToast(`Non-conformité créée depuis la réclamation ${courante.id} — contexte repris automatiquement.`);
            },
          }, 'Créer une non-conformité')
      )
    )
    : null;

  return h(CadreHub, { encadre, titre: 'Cycle de la relation client',
    actions: h('button', { className: 'btn btn-primary', onClick: () => showToast('Ajout d’une réclamation (démonstration).') },
      '+ Ajouter une réclamation') },
    entete || null,
    h(ActionListDetail, {
      titreListe: 'Registre des réclamations', iconeListe: '📣',
      sousTitreListe: String(RECLAMATIONS.length),
      colonnes, lignes: RECLAMATIONS, cle: r => r.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune réclamation enregistrée.',
      selection: choisie, onSelect: r => setChoisie(r.id),
      detail, detailIcone: '📣',
      detailVide: 'Choisissez une réclamation pour voir son traitement',
    })
  );
}
