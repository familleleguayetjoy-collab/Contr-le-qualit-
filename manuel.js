// ComplyEC — Manuel de procédures (S59 à S61A) — phase 7 de la refonte V3
'use strict';

/* =====================================================================
   Le manuel : une publication, pas un traitement de texte
   =====================================================================

   Quatre écrans : voir ce qui est prêt, relire, publier, retrouver.

   Le manuel est l'aboutissement du pipeline documentaire. Tout ce qui a été
   déposé, extrait, confirmé, décidé dans les modules finit ici sous forme de
   phrases. Aucune partie ne possède sa copie privée d'une variable : si le
   déclarant Tracfin change, c'est le référentiel qu'on corrige, et le chapitre
   LBC-FT se régénère.

   D'où deux interdits. Pas d'éditeur libre : corriger le texte laisserait le
   manuel et la donnée en désaccord. Et une version publiée ne se modifie
   jamais — elle se remplace. C'est ce qui permet à un contrôleur de savoir
   quelles règles le cabinet s'appliquait à une date donnée.
   ===================================================================== */

/* Le module du manuel : le parcours en quatre étapes, et les écrans qu'il
   ouvre. Les anciennes adresses restent valides. */
function ManuelDeProcedures({ sub, navigateEc, showToast, cabinetSettings, encadre }) {
  const retour = () => navigateEc('manuel', null);

  if (sub && sub.startsWith('apercu')) {
    const partie = sub.length > 6 ? sub.slice(7) : null;
    return h(ManuelApercu, { key: partie || 'toutes', partieInitiale: partie, onBack: retour, navigateEc, showToast });
  }
  if (sub === 'publication') return h(ManuelPublication, { onBack: retour, showToast });
  if (sub === 'historique' && !etapeManuel(sub)) return h(ManuelHistorique, { onBack: retour, showToast });
  if (sub === 'diffusion') return h('div', { className: 'page' }, h(DiffusionProceduresManager, { onBack: retour, showToast }));
  if (sub === 'redaction') return h('div', { className: 'page' }, h(ManuelProceduresManager, { onBack: retour, showToast, settings: cabinetSettings }));

  return h(ManuelGuidedShell, {
    etape: sub,
    onAller: code => navigateEc('manuel', code),
    navigateEc, showToast, cabinetSettings,
  });
}

// ================================================ S59 — Manuel — Préparation

function ManuelPreparation({ navigateEc, showToast, encadre }) {
  const etats = MANUEL_PARTIES.map(p => ({ partie: p, etat: etatPartieManuel(p) }));
  const bloquees = etats.filter(e => e.etat.bloque);
  const version = manuelVersionEnVigueur();

  const actionsManuel = h(React.Fragment, null,
    h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('manuel', 'historique') }, '🗂️ Historique'),
    /* Le bouton n'existe que si rien ne bloque : proposer de générer un
       manuel troué serait proposer de produire un faux document. */
    bloquees.length === 0
      ? h('button', { className: 'btn btn-primary', onClick: () => navigateEc('manuel', 'apercu') }, 'Générer l’aperçu')
      : null
  );

  return h(CadreHub, { encadre, titre: 'Manuel de procédures', actions: actionsManuel },
    h('div', { className: 'campagne-entete' },
      h('div', { className: 'campagne-ligne' },
        h('span', { className: 'campagne-compte' }, etats.filter(e => e.etat.pret).length, ' sur ', etats.length),
        h('span', { className: 'campagne-libelle' },
          version
            ? `parties prêtes — version ${version.numero} en vigueur depuis le ${formatDate(version.dateEffet)}`
            : 'parties prêtes — aucune version publiée'),
        bloquees.length
          ? h('span', { className: 'campagne-action' },
            h(Badge, { color: 'orange' },
              `${bloquees.length} ${pluriel(bloquees.length, 'partie bloquée', 'parties bloquées')}`))
          : null
      ),
      h('div', { className: 'campagne-jauge' },
        h('div', { className: 'campagne-jauge-remplie',
          style: { width: Math.round((etats.filter(e => e.etat.pret).length / etats.length) * 100) + '%' } }))
    ),
    h(ThemeHub, {
      colonnes: 3,
      cartes: etats.map(({ partie, etat }) => ({
        cle: partie.code, icone: partie.icone, titre: partie.titre,
        compteur: etat.bloque
          ? `${etat.manquantes.length} ${pluriel(etat.manquantes.length, 'information manquante', 'informations manquantes')}`
          : (etat.aConfirmer.length ? `${etat.aConfirmer.length} à confirmer` : null),
        tonCompteur: etat.bloque ? 'rouge' : 'violet',
        libelleAction: etat.pret ? 'Prêt →' : 'Compléter →',
        /* Ouvrir une partie reste dans le manuel : on voit son texte, ce qui
           l'alimente et ce qui manque. Renvoyer d'emblée vers les documents
           sortirait l'utilisateur de son sujet, et le bouton « Retour » le
           laisserait ailleurs qu'où il avait cliqué. */
        onOuvrir: () => navigateEc('manuel', 'apercu-' + partie.code),
      })),
    }),
    h('div', { className: 'docs-pied' },
      h('button', { className: 'docs-pied-lien', onClick: () => navigateEc('manuel', 'redaction') },
        '✍️ Rédiger les clauses', h('span', { className: 'docs-pied-compte' }, 'questions du cabinet')),
      h('button', { className: 'docs-pied-lien', onClick: () => navigateEc('manuel', 'diffusion') },
        '📤 Diffusion', h('span', { className: 'docs-pied-compte' }, 'accusés de lecture')),
      h('button', { className: 'docs-pied-lien', onClick: () => navigateEc('manuel', 'historique') },
        '🗂️ Versions publiées', h('span', { className: 'docs-pied-compte' }, `${dbManuelVersions().length} versions`))
    )
  );
}

// ==================================================== S60 — Manuel — Aperçu

function ManuelApercu({ partieInitiale, onBack, navigateEc, showToast, dansParcours }) {
  const [courante, setCourante] = useState(
    MANUEL_PARTIES.some(p => p.code === partieInitiale) ? partieInitiale : MANUEL_PARTIES[0].code);
  /* Les parties relues vivent dans la couche de données : une relecture faite
     hier ne doit pas être à refaire aujourd'hui. Elles ne tenaient que dans
     l'état de l'écran et disparaissaient au rafraîchissement. */
  const validees = dbManuelPartiesValidees();
  const partie = MANUEL_PARTIES.find(p => p.code === courante);
  const etat = etatPartieManuel(partie);
  const index = MANUEL_PARTIES.findIndex(p => p.code === courante);
  const toutesValidees = MANUEL_PARTIES.every(p => validees[p.code]);

  /* Après validation, on va à la partie suivante qui reste à valider — pas
     forcément la suivante dans l'ordre. Entré par le chapitre Gouvernance, on
     ne doit pas avoir à retrouver soi-même le Préambule oublié. */
  async function valider() {
    await dbValiderPartieManuel(courante);
    const apres = Object.assign({}, validees, { [courante]: true });
    const reste = MANUEL_PARTIES.filter(p => !apres[p.code]);
    if (reste.length) {
      const suivante = MANUEL_PARTIES.slice(index + 1).find(p => !apres[p.code]) || reste[0];
      setCourante(suivante.code);
      showToast(`« ${partie.titre} » validée — reste ${reste.length} ${pluriel(reste.length, 'partie', 'parties')}.`);
    } else {
      showToast('Les six parties sont validées : la publication est ouverte.');
    }
  }

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Manuel — aperçu',
    actions: h(React.Fragment, null,
      onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
      toutesValidees
        ? h('button', { className: 'btn btn-primary', onClick: () => navigateEc('manuel', 'publier') },
          'Publier la version →')
        : null
    ),
  },
    /* Les six parties en onglets fins à gauche du document : le cahier veut
       qu'on circule sans quitter la feuille. */
    h('div', { className: 'tabs', style: { marginBottom: 14 } },
      MANUEL_PARTIES.map(p => h('button', {
        key: p.code, className: cx('tab', courante === p.code && 'active'),
        onClick: () => setCourante(p.code),
      }, p.icone, ' ', p.titre.split(' ')[0], validees[p.code] ? h('span', { className: 'tab-compte' }, '✓') : null))
    ),
    h('div', { className: 'step-body' },
      h(DocumentPreviewShell, {
        titreDocument: partie.titre,
        feuille: texteManuelPartie(partie.code),
        titrePanneau: 'Informations utilisées',
        panneau: h(React.Fragment, null,
          etat.variables.map(i => h(SourceInfoRow, {
            key: i.cle, libelle: i.libelle, valeur: i.valeur, etat: i.statut,
            source: i.sourceId ? (SOURCES_DOCUMENTS.find(s => s.id === i.sourceId) || {}).nom : (i.note || 'Saisie dans ComplyEC'),
            confirmeeLe: i.confirmeLe,
          })),
          etat.manquantes.length
            ? h('div', { className: 'info-box', style: { marginBottom: 12 } }, '⚠️ ',
              `${etat.manquantes.length} ${pluriel(etat.manquantes.length, 'information manque', 'informations manquent')} : `,
              etat.manquantes.map(i => i.libelle).join(', '),
              '. Le texte porte « à renseigner » à leur place — le manuel ne comble pas un trou par une formule creuse.')
            : null,
          h('p', { className: 'conf-detail' }, partie.origine),
          h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            h('button', {
              className: 'btn btn-secondary btn-sm',
              onClick: () => navigateEc('documents-cabinet', 'referentiel'),
            }, 'Modifier une information'),
            etat.manquantes.length
              ? h('button', {
                className: 'btn btn-secondary btn-sm',
                onClick: () => navigateEc('documents-cabinet', 'manquantes'),
              }, 'Compléter les manquantes')
              : null
          )
        ),
        actions: h('p', { className: 'conf-detail', style: { margin: 0 } },
          'Le texte ne se corrige pas ici : il vient des informations ci-dessus. Corriger la feuille laisserait le manuel et la donnée en désaccord.'),
      }),
      h('div', { className: 'wizard-footer' },
        index > 0
          ? h('button', { className: 'btn btn-secondary', onClick: () => setCourante(MANUEL_PARTIES[index - 1].code) }, '← Partie précédente')
          : h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: valider },
          validees[courante]
            ? (index < MANUEL_PARTIES.length - 1 ? 'Partie suivante →' : 'Partie validée')
            : 'Valider cette partie')
      )
    )
  );
}

// ========================================= S61 — Manuel — Publication & diffusion

function ManuelPublication({ onBack, showToast, dansParcours }) {
  const version = manuelVersionEnVigueur();
  const numero = prochainNumeroManuel();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [objet, setObjet] = useState('');
  const [destinataires, setDestinataires] = useState(() =>
    Object.fromEntries(COLLABORATEURS.map(c => [c.id, true])));

  const choisis = COLLABORATEURS.filter(c => destinataires[c.id]);

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Publier une version du manuel',
    actions: onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
  },
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'grid-2 colonnes-egales' },
          h(FormSection, { icon: '🔢', title: 'Version', ton: 'vert' },
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Numéro'),
              h('span', { className: 'conf-note' }, numero)),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Date d’effet'),
              h('span', { className: 'conf-note' }, formatDate(aujourdhui))),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Remplace'),
              h('span', { className: 'conf-note' }, version ? `${version.numero} du ${formatDate(version.dateEffet)}` : 'aucune')),
            h('div', { className: 'form-group', style: { marginTop: 12, marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Objet des modifications'),
              h('input', {
                className: 'form-input', value: objet,
                placeholder: 'Ce qui change par rapport à la version précédente',
                onChange: e => setObjet(e.target.value),
              })
            )
          ),
          h(FormSection, { icon: '✍️', title: 'Approbation', ton: 'vert' },
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Approbateur'),
              h('span', { className: 'conf-note' }, EXPERT_COMPTABLE.nom)),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Qualité'),
              h('span', { className: 'conf-note' }, 'Expert-comptable, gérant')),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Date'),
              h('span', { className: 'conf-note' }, formatDate(aujourdhui))),
            h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
              'L’approbation engage l’expert-comptable sur le contenu du manuel : c’est elle qui en fait la règle du cabinet.')
          )
        ),
        h(FormSection, { icon: '📤', title: 'Diffusion', ton: 'vert',
          subtitle: `${choisis.length} sur ${COLLABORATEURS.length}`, style: { marginTop: 16 } },
          h('div', { className: 'checkbox-grid' },
            COLLABORATEURS.map(c => h('label', { className: 'checkbox-row', key: c.id },
              h('input', {
                type: 'checkbox', checked: !!destinataires[c.id],
                onChange: () => setDestinataires(d => Object.assign({}, d, { [c.id]: !d[c.id] })),
              }), c.nom))
          ),
          h('div', { className: 'form-help' },
            'Chaque destinataire reçoit une demande d’accusé de lecture. Un manuel diffusé sans accusé ne prouve rien.')
        ),
        h(FinalValidation, {
          titre: 'Cette action créera',
          sorties: [
            { icone: '📘', libelle: `Version ${numero} du manuel`, detail: `effet au ${formatDate(aujourdhui)}` },
            { icone: '✍️', libelle: 'Visa d’approbation', detail: EXPERT_COMPTABLE.nom },
            { icone: '📤', libelle: 'Envoi aux destinataires', detail: `${choisis.length} ${pluriel(choisis.length, 'collaborateur')}` },
            { icone: '🔒', libelle: version ? `Passage de ${version.numero} en version remplacée` : 'Première version du cabinet', detail: version ? 'conservée' : '—' },
          ],
          rappel: 'Une version publiée n’est jamais modifiée : elle est remplacée. C’est ce qui permet de savoir quelles règles le cabinet appliquait à une date donnée.',
        })
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', {
          className: 'btn btn-primary', disabled: !objet.trim() || !choisis.length,
          /* La publication écrit : la version entre à l'historique, devient
             celle en vigueur, et les parties relues repartent à zéro pour la
             version suivante. La diffusion, elle, dépend d'un service d'envoi
             qui n'existe pas ici — le message ne prétend donc pas qu'un
             courriel est parti. */
          onClick: async () => {
            await dbPublierManuel({
              numero, objet: objet.trim(),
              /* La diffusion est enregistrée telle qu'elle est : les
                 destinataires retenus, aucun accusé, et une date d'envoi
                 seulement si un service d'envoi existe. Inscrire une date
                 d'envoi sans avoir rien envoyé ferait croire la diffusion
                 faite. */
              diffusion: {
                date: capaciteReelle('sendEmail') ? new Date().toISOString().slice(0, 10) : null,
                destinataires: choisis.map(c => c.id),
                accuses: [],
              },
            });
            showToast(capaciteReelle('sendEmail')
              ? `Manuel ${numero} publié et diffusé à ${choisis.length} collaborateurs.`
              : `Manuel ${numero} publié. La diffusion aux ${choisis.length} destinataires reste à faire depuis votre messagerie.`);
            onBack();
          },
        }, '✅ Publier la version')
      )
    )
  );
}

// ================================================ S61A — Manuel — Historique

function ManuelHistorique({ onBack, showToast, dansParcours }) {
  const [choisie, setChoisie] = useState(null);

  const colonnes = [
    { code: 'numero', titre: 'Version', classe: 'table-name', valeur: v => v.numero, rendu: v => v.numero },
    { code: 'date', titre: 'Date d’effet', valeur: v => v.dateEffet, rendu: v => formatDate(v.dateEffet) },
    { code: 'objet', titre: 'Objet', valeur: v => v.objet, rendu: v => v.objet },
    { code: 'statut', titre: 'Statut', valeur: v => v.statut,
      rendu: v => h(Badge, { color: MANUEL_VERSION_STATUTS[v.statut].couleur }, MANUEL_VERSION_STATUTS[v.statut].label) },
  ];

  const courante = choisie ? dbManuelVersions().find(v => v.numero === choisie) : null;
  const diffusion = (courante && courante.diffusion) || {};
  const destinataires = diffusion.destinataires || (courante && courante.destinataires) || [];
  const accuses = diffusion.accuses || [];

  const detail = courante
    ? h(Card, {
      title: `Manuel ${courante.numero}`,
      subtitle: `En vigueur au ${formatDate(courante.dateEffet)}`,
      icon: '📘', iconBg: '#E6F6EC', iconColor: '#15803D',
      tone: courante.statut === 'en-vigueur' ? 'vert' : 'bleu',
    },
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Objet des modifications'),
        h('div', { className: 'detail-field-value' }, courante.objet)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Approuvée par'),
        h('span', { className: 'conf-note' }, `${personneNom(courante.approbateur)} le ${formatDate(courante.dateApprobation)}`)),
      /* Une version tout juste publiée n'a pas encore été diffusée : aucun
         service d'envoi n'est raccordé. On le dit, plutôt que d'afficher une
         date de diffusion qui n'existe pas — et l'écran plantait en la lisant. */
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Diffusée le'),
        h('span', { className: 'conf-note' },
          diffusion.date ? formatDate(diffusion.date) : 'Pas encore diffusée')),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Accusés de lecture'),
        h(Badge, { color: destinataires.length && accuses.length === destinataires.length ? 'vert' : 'orange' },
          `${accuses.length} sur ${destinataires.length}`)),
      destinataires.length && accuses.length < destinataires.length
        ? h('div', { className: 'detail-field', style: { marginTop: 10 } },
          h('div', { className: 'detail-field-label' }, 'N’ont pas accusé réception'),
          h('div', { className: 'detail-field-value' },
            destinataires
              .filter(d => !accuses.includes(d))
              .map(d => (collaborateur(d) || {}).nom || d).join(', ')))
        : null,
      /* Une version publiée est immuable : on la télécharge, on ne la rouvre
         pas pour la corriger. La génération Word est une capacité réelle. */
      h('div', { style: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' } },
        h(CapabilityGate, {
          cle: 'wordGeneration',
          reel: h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => { telechargerVersionManuel(courante); showToast(`Manuel ${courante.numero} téléchargé au format Word.`); },
          }, '⬇ Télécharger cette version'),
        })
      ),
      h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
        'Une version publiée ne se modifie pas : pour changer une règle, on publie une version suivante.')
    )
    : null;

  return h(CadreHub, {
    encadre: dansParcours,
    titre: 'Versions du manuel',
    actions: onBack && !dansParcours ? h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour') : null,
  },
    h(ActionListDetail, {
      titreListe: 'Versions publiées', iconeListe: '🗂️',
      sousTitreListe: String(dbManuelVersions().length),
      colonnes, lignes: dbManuelVersions(), cle: v => v.numero, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune version publiée pour le moment.',
      selection: choisie, onSelect: v => setChoisie(v.numero),
      detail, detailIcone: '📘',
      detailVide: 'Choisissez une version pour voir son approbation et sa diffusion',
    })
  );
}

/* =====================================================================
   Parcours Manuel en quatre étapes — § 29 du prompt V6
   =====================================================================

   Le manuel se prépare, se relit, se publie, et laisse une trace. Ces quatre
   moments existaient déjà, mais dispersés : la préparation était l'écran
   d'accueil du module, l'aperçu s'ouvrait par un bouton, la publication par un
   autre, l'historique par un troisième. Rien ne disait qu'il fallait relire
   avant de publier, ni pourquoi la publication était fermée.

   Le moteur du manuel ne change pas : ComplyEC n'écrit pas le manuel
   librement, il assemble des clauses validées avec les données confirmées du
   cabinet. Une variable absente se voit dans l'aperçu — elle n'est jamais
   comblée par une invention.
   ===================================================================== */

const MANUEL_ETAPES = [
  { code: 'preparer', titre: 'Préparer le manuel', court: 'Préparer', ton: 'bleu' },
  { code: 'relire', titre: 'Relire les six parties', court: 'Relire', ton: 'bleu' },
  { code: 'publier', titre: 'Publier la version', court: 'Publier', ton: 'vert' },
  { code: 'historique', titre: 'Historique des versions', court: 'Historique', ton: 'gris' },
];

function etapeManuel(code) {
  const i = MANUEL_ETAPES.findIndex(e => e.code === code);
  return i < 0 ? null : Object.assign({ rang: i + 1 }, MANUEL_ETAPES[i]);
}

function computeManuelJourneyState() {
  const parties = MANUEL_PARTIES.map(p => ({ p, e: etatPartieManuel(p) }));
  const bloquees = parties.filter(x => x.e.bloque);
  const aConfirmer = parties.filter(x => !x.e.bloque && !x.e.pret);
  const validees = dbManuelPartiesValidees();
  const nbValidees = MANUEL_PARTIES.filter(p => validees[p.code]).length;
  const version = manuelVersionEnVigueur();
  const versions = dbManuelVersions();

  const etapes = {
    preparer: {
      pret: bloquees.length === 0,
      resume: bloquees.length
        ? `${bloquees.length} ${pluriel(bloquees.length, 'partie bloquée', 'parties bloquées')}`
        : `${parties.length} ${pluriel(parties.length, 'partie prête', 'parties prêtes')}`,
      reste: bloquees.length
        ? `${bloquees.length} ${pluriel(bloquees.length, 'partie attend', 'parties attendent')} une information.`
        : (aConfirmer.length ? `${aConfirmer.length} ${pluriel(aConfirmer.length, 'partie contient', 'parties contiennent')} une valeur à confirmer.` : null),
    },
    relire: {
      pret: nbValidees >= MANUEL_PARTIES.length,
      resume: `${nbValidees} ${pluriel(nbValidees, 'partie relue', 'parties relues')} sur ${MANUEL_PARTIES.length}`,
      reste: nbValidees < MANUEL_PARTIES.length
        ? `${MANUEL_PARTIES.length - nbValidees} ${pluriel(MANUEL_PARTIES.length - nbValidees, 'partie reste', 'parties restent')} à relire.`
        : null,
    },
    publier: {
      // Publier n'est jamais « fait » une fois pour toutes : une version
      // publiée ferme l'étape jusqu'à la prochaine relecture complète.
      pret: !!version && nbValidees === 0,
      resume: version ? `${version.numero} en vigueur depuis le ${formatDate(version.dateEffet)}` : 'Jamais publié',
      reste: version ? null : 'Aucune version n’a encore été publiée.',
    },
    historique: {
      pret: versions.length > 0,
      resume: `${versions.length} ${pluriel(versions.length, 'version publiée', 'versions publiées')}`,
      reste: null,
    },
  };

  MANUEL_ETAPES.forEach((e, i) => {
    Object.assign(etapes[e.code], { code: e.code, titre: e.titre, court: e.court, ton: e.ton, rang: i + 1 });
  });

  const liste = MANUEL_ETAPES.map(e => etapes[e.code]);
  const pretes = liste.filter(s => s.pret).length;
  const courante = liste.find(s => !s.pret) || liste[liste.length - 1];
  return { etapes, liste, pretes, total: liste.length, courante, bloquees, nbValidees, version };
}

function ManuelFil({ courante, onAller, etat }) {
  return h('div', { className: 'parcours-fil', role: 'navigation', 'aria-label': 'Étapes du manuel' },
    MANUEL_ETAPES.map((e, i) => {
      const actif = e.code === courante;
      const pret = etat.etapes[e.code].pret;
      return h('button', {
        key: e.code,
        className: cx('parcours-fil-etape', actif && 'active', pret && 'pret'),
        onClick: () => onAller(e.code),
        'aria-current': actif ? 'step' : undefined,
        title: `Étape ${i + 1} sur ${MANUEL_ETAPES.length} — ${e.titre}`,
      },
        h('span', { className: 'parcours-fil-rang' }, pret && !actif ? '✓' : String(i + 1)),
        h('span', { className: 'parcours-fil-titre' }, e.court)
      );
    })
  );
}

function ManuelGuidedShell({ etape, onAller, navigateEc, showToast, cabinetSettings }) {
  const etat = computeManuelJourneyState();
  const code = etapeManuel(etape) ? etape : etat.courante.code;
  const e = etapeManuel(code);
  const suivante = e.rang < MANUEL_ETAPES.length ? MANUEL_ETAPES[e.rang] : null;
  const precedente = e.rang > 1 ? MANUEL_ETAPES[e.rang - 2] : null;

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'parcours-rang' }, `Étape ${e.rang} sur ${MANUEL_ETAPES.length} — manuel de procédures`),
        h('h1', null, e.titre)
      ),
      h('div', { className: 'page-header-actions' },
        precedente
          ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(precedente.code) }, '← ' + precedente.court)
          : null,
        suivante
          ? h('button', { className: 'btn btn-secondary', onClick: () => onAller(suivante.code) }, suivante.court + ' →')
          : null
      )
    ),
    h(ManuelFil, { courante: code, onAller, etat }),
    h('div', { className: 'parcours-contenu' },
      code === 'preparer' ? h(ManuelPreparer, { etat, onAller, navigateEc })
        : code === 'relire' ? h(ManuelApercu, { dansParcours: true, navigateEc, showToast })
          : code === 'publier' ? h(ManuelPublication, { dansParcours: true, showToast, onBack: () => onAller('historique') })
            : h(ManuelHistorique, { dansParcours: true, showToast })
    )
  );
}

/* Étape 1 — Préparer (§ 29.1).

   Les six parties en six lignes, pas en six grands rectangles : on veut voir
   d'un coup laquelle bloque, et une grille de six cartes oblige à parcourir
   l'écran. À droite, ce qui bloque, cinq lignes au plus. */
function ManuelPreparer({ etat, onAller, navigateEc }) {
  const parties = MANUEL_PARTIES.map(p => ({ p, e: etatPartieManuel(p) }));
  const bloquantes = [];
  parties.forEach(x => x.e.manquantes.forEach(i => bloquantes.push({ partie: x.p, info: i })));

  return h(React.Fragment, null,
    h('div', { className: 'parcours-colonnes' },
      h(FormSection, { icon: '📘', title: 'Les six parties du manuel', ton: 'bleu',
        subtitle: `${parties.filter(x => x.e.pret).length} sur ${parties.length}` },
        h('div', { className: 'parcours-restes' },
          parties.map(x => h('div', { className: cx('parcours-reste', x.e.pret && 'fait'), key: x.p.code },
            x.e.pret
              ? h('span', { className: 'parcours-reste-marque' }, '✓')
              : h('span', { className: cx('accueil-pastille', x.e.bloque ? 'urgence-0' : 'urgence-1') }),
            h('div', { className: 'parcours-reste-texte' },
              h('div', { className: 'parcours-reste-titre' }, x.p.titre),
              h('div', { className: 'parcours-reste-detail' },
                x.e.bloque
                  ? `${x.e.manquantes.length} ${pluriel(x.e.manquantes.length, 'information manquante', 'informations manquantes')}`
                  : (x.e.aConfirmer.length
                    ? `${x.e.aConfirmer.length} ${pluriel(x.e.aConfirmer.length, 'valeur')} à confirmer`
                    : 'Prête'))
            )
          ))
        )
      ),
      h(FormSection, { icon: '⛔', title: 'Ce qui bloque', ton: bloquantes.length ? 'orange' : 'vert' },
        bloquantes.length
          ? h(React.Fragment, null,
            h('div', { className: 'parcours-faits' },
              bloquantes.slice(0, 5).map((b, i) => h('div', { className: 'parcours-fait', key: i },
                h('div', { className: 'parcours-fait-libelle' }, b.info.libelle),
                h('div', { className: 'parcours-reste-detail' }, b.partie.titre)
              ))
            ),
            bloquantes.length > 5
              ? h('p', { className: 'conf-detail' },
                `${bloquantes.length - 5} ${pluriel(bloquantes.length - 5, 'autre information', 'autres informations')} manquent également.`)
              : null,
            h('button', {
              className: 'btn btn-primary', style: { marginTop: 8 },
              onClick: () => navigateEc('documents-cabinet', 'manquantes'),
            }, 'Compléter les informations')
          )
          : h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
            'Aucune information ne manque : les six parties peuvent être relues, puis publiées.')
      )
    ),
    h('div', { className: 'parcours-pied' },
      h('div', { className: 'parcours-pied-etat' },
        `${etat.pretes} ${pluriel(etat.pretes, 'étape prête', 'étapes prêtes')} sur ${etat.total}`),
      /* Le bouton n'existe que si rien ne bloque : proposer de générer un
         manuel troué serait proposer de produire un faux document. */
      bloquantes.length === 0
        ? h('button', { className: 'btn btn-primary', onClick: () => onAller('relire') }, 'Relire le manuel →')
        : null
    )
  );
}

/* Télécharge une version publiée du manuel au format Word.

   Le texte est celui que les six parties composent à partir des données
   confirmées : ce n'est pas une rédaction libre, et une valeur absente s'y
   voit — elle n'est pas comblée par une invention. La génération Word est une
   capacité réelle du navigateur, le bouton peut donc exister. */
function telechargerVersionManuel(version) {
  const corps = MANUEL_PARTIES.map((p, i) => {
    const texte = texteManuelPartie(p.code) || '';
    const paragraphes = texte.split('\n').slice(2)
      .map(l => (l.trim() ? `<p style="text-align:justify; margin:0 0 6pt;">${docxEchapper(l)}</p>` : '<p style="margin:0 0 6pt;">&nbsp;</p>'))
      .join('');
    return `<h2 style="font-size:13pt; margin-top:18pt;">${i + 1}. ${docxEchapper(p.titre)}</h2>${paragraphes}`;
  }).join('');

  downloadWordDoc(
    `Manuel_de_procedures_${version.numero}.doc`,
    `Manuel de procédures ${version.numero}`,
    `<h1 style="font-size:17pt;">Manuel de procédures du cabinet</h1>
     <p style="font-size:9.5pt; color:#666;">Version ${docxEchapper(version.numero)}, en vigueur depuis le ${formatDateLong(version.dateEffet)}.
     Approuvée par ${docxEchapper(personneNom(version.approbateur))} le ${formatDateLong(version.dateApprobation)}.</p>
     <p style="font-size:9.5pt; color:#666;">Établi en application de la norme professionnelle de management de la qualité (arrêtée le 30 mai 2024, applicable depuis le 1<sup>er</sup> janvier 2025), des articles 141 à 169 du décret n° 2012-432 du 30 mars 2012 portant code de déontologie des professionnels de l’expertise comptable, et, pour le volet LBC-FT, des articles L. 561-1 et suivants du code monétaire et financier.</p>
     ${corps}`
  );
}
