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

function ManuelDeProcedures({ sub, navigateEc, showToast, cabinetSettings, encadre }) {
  const retour = () => navigateEc('manuel', null);

  if (sub && sub.startsWith('apercu')) {
    const partie = sub.length > 6 ? sub.slice(7) : null;
    return h(ManuelApercu, { key: partie || 'toutes', partieInitiale: partie, onBack: retour, navigateEc, showToast });
  }
  if (sub === 'publication') return h(ManuelPublication, { onBack: retour, showToast });
  if (sub === 'historique') return h(ManuelHistorique, { onBack: retour, showToast });
  if (sub === 'diffusion') return h('div', { className: 'page' }, h(DiffusionProceduresManager, { onBack: retour, showToast }));
  if (sub === 'redaction') return h('div', { className: 'page' }, h(ManuelProceduresManager, { onBack: retour, showToast, settings: cabinetSettings }));

  return h(ManuelPreparation, { navigateEc, showToast, encadre });
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
        '🗂️ Versions publiées', h('span', { className: 'docs-pied-compte' }, `${MANUEL_VERSIONS.length} versions`))
    )
  );
}

// ==================================================== S60 — Manuel — Aperçu

function ManuelApercu({ partieInitiale, onBack, navigateEc, showToast }) {
  const [courante, setCourante] = useState(
    MANUEL_PARTIES.some(p => p.code === partieInitiale) ? partieInitiale : MANUEL_PARTIES[0].code);
  const [validees, setValidees] = useState({});
  const partie = MANUEL_PARTIES.find(p => p.code === courante);
  const etat = etatPartieManuel(partie);
  const index = MANUEL_PARTIES.findIndex(p => p.code === courante);
  const toutesValidees = MANUEL_PARTIES.every(p => validees[p.code]);

  /* Après validation, on va à la partie suivante qui reste à valider — pas
     forcément la suivante dans l'ordre. Entré par le chapitre Gouvernance, on
     ne doit pas avoir à retrouver soi-même le Préambule oublié. */
  function valider() {
    const apres = Object.assign({}, validees, { [courante]: true });
    setValidees(apres);
    const reste = MANUEL_PARTIES.filter(p => !apres[p.code]);
    if (reste.length) {
      const suivante = MANUEL_PARTIES.slice(index + 1).find(p => !apres[p.code]) || reste[0];
      setCourante(suivante.code);
      showToast(`« ${partie.titre} » validée — reste ${reste.length} ${pluriel(reste.length, 'partie', 'parties')}.`);
    } else {
      showToast('Les six parties sont validées : la publication est ouverte.');
    }
  }

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Manuel — aperçu',
      onRetour: onBack,
      actions: toutesValidees
        ? h('button', { className: 'btn btn-primary', onClick: () => navigateEc('manuel', 'publication') },
          'Publier la version →')
        : null,
    }),
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

function ManuelPublication({ onBack, showToast }) {
  const version = manuelVersionEnVigueur();
  const numero = prochainNumeroManuel();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [objet, setObjet] = useState('');
  const [destinataires, setDestinataires] = useState(() =>
    Object.fromEntries(COLLABORATEURS.map(c => [c.id, true])));

  const choisis = COLLABORATEURS.filter(c => destinataires[c.id]);

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Publier une version du manuel', onRetour: onBack }),
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
          onClick: () => { showToast(`Manuel ${numero} publié et diffusé à ${choisis.length} collaborateurs (démonstration).`); onBack(); },
        }, '✅ Publier la version')
      )
    )
  );
}

// ================================================ S61A — Manuel — Historique

function ManuelHistorique({ onBack, showToast }) {
  const [choisie, setChoisie] = useState(null);

  const colonnes = [
    { code: 'numero', titre: 'Version', classe: 'table-name', valeur: v => v.numero, rendu: v => v.numero },
    { code: 'date', titre: 'Date d’effet', valeur: v => v.dateEffet, rendu: v => formatDate(v.dateEffet) },
    { code: 'objet', titre: 'Objet', valeur: v => v.objet, rendu: v => v.objet },
    { code: 'statut', titre: 'Statut', valeur: v => v.statut,
      rendu: v => h(Badge, { color: MANUEL_VERSION_STATUTS[v.statut].couleur }, MANUEL_VERSION_STATUTS[v.statut].label) },
  ];

  const courante = choisie ? MANUEL_VERSIONS.find(v => v.numero === choisie) : null;
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
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Diffusée le'),
        h('span', { className: 'conf-note' }, formatDate(courante.diffusion.date))),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Accusés de lecture'),
        h(Badge, { color: courante.diffusion.accuses.length === courante.diffusion.destinataires.length ? 'vert' : 'orange' },
          `${courante.diffusion.accuses.length} sur ${courante.diffusion.destinataires.length}`)),
      courante.diffusion.accuses.length < courante.diffusion.destinataires.length
        ? h('div', { className: 'detail-field', style: { marginTop: 10 } },
          h('div', { className: 'detail-field-label' }, 'N’ont pas accusé réception'),
          h('div', { className: 'detail-field-value' },
            courante.diffusion.destinataires
              .filter(d => !courante.diffusion.accuses.includes(d))
              .map(d => collaborateur(d).nom).join(', ')))
        : null,
      /* Une version publiée est immuable : on la télécharge, on ne la rouvre
         pas pour la corriger. */
      h('div', { style: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' } },
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => showToast(`Manuel ${courante.numero} téléchargé (démonstration).`) },
          '⬇ Télécharger cette version')
      ),
      h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
        'Une version publiée ne se modifie pas : pour changer une règle, on publie une version suivante.')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Versions du manuel', onRetour: onBack }),
    h(ActionListDetail, {
      titreListe: 'Versions publiées', iconeListe: '🗂️',
      sousTitreListe: String(MANUEL_VERSIONS.length),
      colonnes, lignes: MANUEL_VERSIONS, cle: v => v.numero, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune version publiée pour le moment.',
      selection: choisie, onSelect: v => setChoisie(v.numero),
      detail, detailIcone: '📘',
      detailVide: 'Choisissez une version pour voir son approbation et sa diffusion',
    })
  );
}
