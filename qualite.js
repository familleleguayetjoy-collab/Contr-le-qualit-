// ComplyEC — Surveillance et qualité (S43 à S50) — phase 6 de la refonte V3
'use strict';

/* =====================================================================
   Le système de management de la qualité, comme processus vivant
   =====================================================================

   Le cahier est net sur ce point : cartographie, non-conformités,
   surveillance et évaluation annuelle sont des processus vivants, et le
   dossier de contrôle est une sortie, pas un silo. On ne prépare donc pas un
   contrôle qualité : on tient un système, et le dossier s'en déduit.

   Deux interdits gouvernent ces écrans. Aucun score automatique de conformité
   — c'est l'expert-comptable qui conclut sur l'efficacité de son système, à
   partir de faits que le logiciel rassemble. Et aucune validation
   automatique : le logiciel propose un risque, une réponse, un échantillon ;
   la décision reste humaine à chaque fois.
   ===================================================================== */

/* =====================================================================
   REFONTE — Rubrique « Surveillance du système qualité »
   =====================================================================

   Trois choses, et le programme annuel les tient toutes : l'échantillon, les
   actions correctives et l'évaluation annuelle ne sont pas des rubriques
   séparées, ce sont des moments du même processus. Les sortir du menu, c'était
   la condition pour que le menu reste lisible (§ 11.1). */

/* Trois briques, donc trois cartes. Le programme annuel les tient toutes :
   l'échantillon, les actions correctives et l'évaluation annuelle ne sont pas
   des rubriques séparées, ce sont des moments du même processus. */
/* Le programme annuel en haut, sur toute la largeur : c'est le travail de
   l'année, et les deux registres qui le suivent ne sont que des journaux. */
const SURVEILLANCE_CARTES = [
  { key: 'programme', label: 'Programme annuel de surveillance', icone: 'calendrier', teinte: 'menthe' },
  { key: 'nc', label: 'Registre des non-conformités', icone: 'alerteCercle', teinte: 'ambre' },
  { key: 'reclamations', label: 'Registre des réclamations', icone: 'bulle', teinte: 'bleu' },
];

function RubriqueSurveillance({ showToast, cabinetSettings, navigateEc }) {
  const [vue, setVue] = useState(null);

  if (!vue) {
    return h(RubriquePage, { titre: 'Surveillance du système qualité' },
      h(CartesHub, { cartes: SURVEILLANCE_CARTES, onOuvrir: setVue, colonnes: 3 })
    );
  }

  const carte = SURVEILLANCE_CARTES.find(c => c.key === vue);
  return h(RubriquePage, {
    titre: carte.label,
    retour: h(RetourHub, { vers: 'Surveillance du système qualité', onRetour: () => setVue(null) }),
  },
    vue === 'programme' ? h(ProgrammeAnnuel, { showToast, cabinetSettings })
      : vue === 'nc' ? h(RegistreNc, { showToast })
        : h(RegistreReclamationsModerne, { showToast })
  );
}

// ------------------------------------------------- Le parcours en six étapes

/* Des blocs arrondis reliés entre eux, dans l'esprit de l'écran d'entrée en
   mission mais plus compacts. Une étape terminée reçoit un état discret : une
   coche, pas une bannière. */
function ProgrammeAnnuel({ showToast, cabinetSettings }) {
  const annee = currentCalendarYear();
  const faites = dbSurveillance();
  /* L'étape courante est la première qui n'est pas validée : c'est là qu'il
     reste du travail, donc là qu'on veut être emmené. */
  const premiereOuverte = SURVEILLANCE_PROGRAMME.find(e => !faites[e.code]);
  const [ouverte, setOuverte] = useState(
    premiereOuverte ? premiereOuverte.code : SURVEILLANCE_PROGRAMME[0].code);

  const etape = etapeSurveillance(ouverte);
  const validee = faites[ouverte];
  const validees = SURVEILLANCE_PROGRAMME.filter(e => faites[e.code]).length;

  async function valider() {
    await dbValiderEtapeSurveillance(ouverte, {});
    showToast(`${etape.label} — étape validée.`);
    const suivante = SURVEILLANCE_PROGRAMME[etape.rang];
    if (suivante) setOuverte(suivante.code);
  }

  async function rouvrir() {
    await dbRouvrirEtapeSurveillance(ouverte);
    showToast('Étape rouverte.');
  }

  return h('div', { className: 'programme-annuel' },
    h('div', { className: 'programme-chemin' },
      SURVEILLANCE_PROGRAMME.map((e, i) => h(React.Fragment, { key: e.code },
        i ? h('span', { className: 'programme-lien', 'aria-hidden': 'true' }) : null,
        h('button', {
          className: cx('programme-bloc', ouverte === e.code && 'actif', faites[e.code] && 'faite'),
          onClick: () => setOuverte(e.code),
        },
          h('span', { className: 'programme-rang' }, faites[e.code] ? '✓' : i + 1),
          h('span', { className: 'programme-label' }, e.label)
        )
      ))
    ),

    h('p', { className: 'programme-avancement' },
      `Programme ${annee} — ${validees} ${pluriel(validees, 'étape validée', 'étapes validées')} sur ${SURVEILLANCE_PROGRAMME.length}.`),

    h('section', { className: 'bloc-carte' },
      h('header', { className: 'bloc-carte-entete' },
        h('h2', null, etape.label),
        h('div', { className: 'bloc-carte-actions' },
          validee
            ? h(React.Fragment, null,
              h(Pastille, { ton: 'vert' }, `Validée le ${formatDate(validee.le)}`),
              h('button', { className: 'btn btn-tertiaire btn-sm', onClick: rouvrir }, 'Rouvrir'))
            : h('button', { className: 'btn btn-primary', onClick: valider }, 'Valider cette étape')
        )
      ),
      h('p', { className: 'bloc-carte-note' }, etape.resume),
      h(ContenuEtapeSurveillance, { code: ouverte, showToast, cabinetSettings })
    )
  );
}

/* Un choix multiple qui se conserve, et qu'on peut allonger.

   Le motif du 24 septembre : « tu demandes de valider l'étape 1 sans aucune
   autre option, ça ne sert à rien ». C'était vrai — l'étape affichait une
   liste morte et un bouton « Valider ». On coche maintenant ce que le cabinet
   retient, on ajoute ce que la liste ne prévoit pas, et c'est cela qui est
   validé. */
function ListeACocher({ code, items, cleCochees, ajoutLabel, showToast }) {
  const brouillon = dbSurveillanceBrouillon(code) || {};
  const [cochees, setCochees] = useState(() => (
    brouillon[cleCochees] || items.filter(i => i.actif !== false).map(i => i.code)));
  const [ajouts, setAjouts] = useState(() => brouillon.ajouts || []);
  const [saisie, setSaisie] = useState('');

  function conserver(c, a) {
    setCochees(c); setAjouts(a);
    dbEnregistrerBrouillonSurveillance(code, { [cleCochees]: c, ajouts: a });
  }
  function basculer(cle) {
    conserver(cochees.indexOf(cle) >= 0 ? cochees.filter(x => x !== cle) : cochees.concat([cle]), ajouts);
  }
  function ajouter() {
    const texte = saisie.trim();
    if (!texte) return;
    const cle = 'libre-' + Date.now();
    conserver(cochees.concat([cle]), ajouts.concat([{ code: cle, label: texte }]));
    setSaisie('');
    showToast('Ajouté au programme.');
  }

  const tous = items.concat(ajouts);
  return h('div', { className: 'surveillance-cocher' },
    h('div', { className: 'cases-panneau' },
      tous.map(i => h('label', {
        key: i.code,
        className: cx('case-ligne', cochees.indexOf(i.code) >= 0 && 'cochee'),
      },
        h('input', {
          type: 'checkbox',
          checked: cochees.indexOf(i.code) >= 0,
          onChange: () => basculer(i.code),
        }),
        h('span', { className: 'case-texte' }, i.label),
        i.source ? h('span', { className: 'case-source' }, i.source) : null
      ))
    ),
    h('div', { className: 'surveillance-ajout' },
      h('input', {
        className: 'champ-saisie', value: saisie,
        placeholder: ajoutLabel || 'Ajouter un autre point…',
        'aria-label': ajoutLabel || 'Ajouter un autre point',
        onChange: e => setSaisie(e.target.value),
        onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); ajouter(); } },
      }),
      h('button', { className: 'btn btn-secondary', onClick: ajouter, disabled: !saisie.trim() }, 'Ajouter')
    ),
    h('p', { className: 'surveillance-compte' },
      `${cochees.length} ${pluriel(cochees.length, 'point retenu', 'points retenus')} sur ${tous.length}.`)
  );
}

/* L'échantillon : à gauche ce que les critères proposent, à droite ce que le
   cabinet retient. On fait passer un dossier d'une colonne à l'autre, et
   chaque dossier retenu garde le motif de son choix — c'est ce motif qu'un
   contrôleur demande, pas la liste elle-même. */
function EchantillonSurveillance({ showToast }) {
  const brouillon = dbSurveillanceBrouillon('echantillon') || {};
  const proposes = ECHANTILLON_SURVEILLANCE;
  const [retenus, setRetenus] = useState(() => (
    brouillon.retenus || proposes.map(e => e.dossier)));

  function conserver(liste) {
    setRetenus(liste);
    dbEnregistrerBrouillonSurveillance('echantillon', { retenus: liste });
  }
  const nomDe = d => (client(d) ? client(d).nom : d);
  const motifDe = d => (proposes.find(e => e.dossier === d) || {}).motif || 'Choix du cabinet';

  const aGauche = proposes.filter(e => retenus.indexOf(e.dossier) < 0);
  const aDroite = retenus;

  return h('div', { className: 'echantillon-deux' },
    h('section', { className: 'echantillon-colonne' },
      h('header', { className: 'echantillon-entete' },
        h('h3', null, 'Dossiers proposés'),
        h('span', { className: 'echantillon-compte' }, aGauche.length)
      ),
      h('p', { className: 'echantillon-note' },
        'Proposés par les critères retenus à l’étape précédente.'),
      aGauche.length
        ? h('ul', { className: 'echantillon-liste' },
          aGauche.map(e => h('li', { key: e.dossier, className: 'echantillon-ligne' },
            h('div', { className: 'echantillon-texte' },
              h('span', { className: 'echantillon-nom' }, nomDe(e.dossier)),
              h('span', { className: 'echantillon-motif' }, e.motif)
            ),
            h('button', {
              className: 'btn btn-secondary btn-ligne',
              onClick: () => conserver(retenus.concat([e.dossier])),
            }, 'Retenir →')
          )))
        : h('p', { className: 'echantillon-vide' }, 'Tous les dossiers proposés sont retenus.')
    ),

    h('section', { className: 'echantillon-colonne echantillon-retenus' },
      h('header', { className: 'echantillon-entete' },
        h('h3', null, 'Dossiers retenus'),
        h('span', { className: 'echantillon-compte' }, aDroite.length)
      ),
      h('p', { className: 'echantillon-note' },
        'Ce sont ceux qui seront contrôlés, avec le motif de leur choix.'),
      aDroite.length
        ? h('ul', { className: 'echantillon-liste' },
          aDroite.map(d => h('li', { key: d, className: 'echantillon-ligne' },
            h('div', { className: 'echantillon-texte' },
              h('span', { className: 'echantillon-nom' }, nomDe(d)),
              h('span', { className: 'echantillon-motif' }, motifDe(d))
            ),
            h('button', {
              className: 'lien-discret',
              onClick: () => conserver(retenus.filter(x => x !== d)),
            }, '← Retirer')
          )))
        : h('p', { className: 'echantillon-vide' },
          'Aucun dossier retenu : le contrôle annuel n’aurait rien à porter.')
    )
  );
}

/* Le contenu propre à chaque étape. Il s'appuie sur ce que ComplyEC sait déjà :
   le contrôleur vérifie, il ne ressaisit pas. */
function ContenuEtapeSurveillance({ code, showToast, cabinetSettings, navigateEc }) {
  if (code === 'programme') {
    return h(ListeACocher, {
      code: 'programme',
      items: CRITERES_ECHANTILLON,
      cleCochees: 'criteres',
      ajoutLabel: 'Ajouter un critère propre au cabinet…',
      showToast,
    });
  }

  if (code === 'echantillon') return h(EchantillonSurveillance, { showToast });

  if (code === 'controle') {
    return h(ListeACocher, {
      code: 'controle',
      items: POINTS_CONTROLE,
      cleCochees: 'points',
      ajoutLabel: 'Ajouter un point à vérifier…',
      showToast,
    });
  }

  if (code === 'constats') return h(ConstatsSurveillance, { showToast, navigateEc });

  if (code === 'actions') return h(ActionsCorrectives, { showToast });

  // Évaluation annuelle : la conclusion que la NPMQ demande de porter.
  return h(EvaluationConclusion, { showToast });
}

/* Les constats, et ce qu'on en fait.

   Le registre des non-conformités existe pour cela : il recense les
   déficiences relevées sur le système de management de la qualité, pour que
   chacune reçoive une action corrective, un responsable, une échéance, puis
   une appréciation de son efficacité. La norme professionnelle de management
   de la qualité, agréée par l'arrêté du 30 mai 2024 et applicable depuis le
   1er janvier 2025, demande cette documentation des déficiences et de leur
   traitement.

   C'est donc bien le même objet : un constat de la revue annuelle qui reste
   dans un coin d'écran n'est pas traité, alors qu'inscrit au registre il est
   suivi jusqu'à sa clôture. Le bouton fait ce passage en un clic. */
function ConstatsSurveillance({ showToast, navigateEc }) {
  useDonnees();
  const nc = dbNonConformites();
  const brouillon = dbSurveillanceBrouillon('constats') || {};
  const retenus = brouillon.retenus || (dbSurveillanceBrouillon('echantillon') || {}).retenus
    || ECHANTILLON_SURVEILLANCE.map(e => e.dossier);
  const [dossier, setDossier] = useState(retenus[0] || '');
  const [constat, setConstat] = useState('');
  const [gravite, setGravite] = useState('Mineure');

  async function inscrire() {
    if (!constat.trim()) { showToast('Décrivez le constat avant de l’inscrire.'); return; }
    await dbCreerNonConformite({
      dossier, constat: constat.trim(), gravite,
      origine: 'Revue annuelle de surveillance',
    });
    setConstat('');
    showToast('Constat inscrit au registre des non-conformités.');
  }

  return h('div', { className: 'constats-bloc' },
    h('div', { className: 'constats-saisie' },
      h('h3', { className: 'constats-titre' }, 'Relever un constat'),
      h('div', { className: 'constats-champs' },
        h(ListePanneau, {
          label: 'Dossier',
          valeur: dossier, onChange: setDossier,
          options: retenus.map(d => ({ code: d, label: client(d) ? client(d).nom : d })),
        }),
        h(ListePanneau, {
          label: 'Gravité',
          valeur: gravite, onChange: setGravite,
          options: [{ code: 'Mineure', label: 'Mineure' }, { code: 'Majeure', label: 'Majeure' }],
        })
      ),
      h(ChampPanneau, {
        label: 'Ce qui a été relevé', lignes: 2,
        valeur: constat, onChange: setConstat,
        aide: 'Inscrit au registre des non-conformités, qui en suit le traitement jusqu’à la clôture.',
      }),
      h('button', {
        className: 'btn btn-primary', onClick: inscrire, disabled: !constat.trim(),
      }, 'Inscrire au registre des non-conformités')
    ),

    h('div', { className: 'constats-liste' },
      h('h3', { className: 'constats-titre' },
        `Constats déjà enregistrés (${nc.length})`),
      nc.length
        ? h('div', { className: 'tableau-moderne-enveloppe' },
          h('table', { className: 'tableau-moderne' },
            h('thead', null, h('tr', null,
              h('th', null, 'Dossier'), h('th', null, 'Constat'),
              h('th', null, 'Gravité'), h('th', null, 'Origine'))),
            h('tbody', null, nc.map(n => h('tr', { key: n.id },
              h('td', { className: 'col-principale' }, client(n.dossier) ? client(n.dossier).nom : n.dossier),
              h('td', null, n.constat),
              h('td', null, h(Pastille, { ton: n.gravite === 'Mineure' ? 'orange' : 'rouge' }, n.gravite)),
              h('td', null, n.origine || h('span', { className: 'cellule-vide' }, 'Hors revue'))
            )))
          )
        )
        : h('p', { className: 'bloc-carte-note' },
          'Aucun constat. Le registre reste vide tant que la revue n’a rien relevé.')
    )
  );
}

/* Les actions correctives : une liste, et une case par action menée.

   Cocher une action la marque comme faite, avec sa date. C'est ce qui permet
   à la conclusion annuelle de dire ce qui a été corrigé et ce qui reste. */
function ActionsCorrectives({ showToast }) {
  useDonnees();
  const nc = dbNonConformites().filter(n => n.etat !== 'cloturee');

  async function basculer(n) {
    await dbMajNonConformite(n.id, {
      efficacite: n.efficacite ? null : 'Action menée et vérifiée',
      dateEfficacite: n.efficacite ? null : new Date().toISOString().slice(0, 10),
    });
    showToast(n.efficacite ? 'Action rouverte.' : 'Action marquée comme menée.');
  }

  if (!nc.length) {
    return h('p', { className: 'bloc-carte-note' },
      'Aucune action corrective en cours : le registre des non-conformités est à jour.');
  }

  return h('div', { className: 'actions-correctives' },
    nc.map(n => h('label', {
      key: n.id,
      className: cx('action-ligne', n.efficacite && 'menee'),
    },
      h('input', { type: 'checkbox', checked: !!n.efficacite, onChange: () => basculer(n) }),
      h('div', { className: 'action-texte' },
        h('span', { className: 'action-dossier' },
          client(n.dossier) ? client(n.dossier).nom : n.dossier),
        h('span', { className: 'action-decidee' },
          n.action || n.constat || 'Action à décider'),
        h('span', { className: 'action-meta' },
          [n.responsable ? personneNom(n.responsable) : null,
            n.echeance ? `échéance ${formatDate(n.echeance)}` : null].filter(Boolean).join(' · ')
          || 'Responsable et échéance à fixer')
      ),
      h(Pastille, { ton: n.efficacite ? 'vert' : (n.gravite === 'Mineure' ? 'orange' : 'rouge') },
        n.efficacite ? 'Menée' : n.gravite)
    ))
  );
}

/* L'évaluation annuelle, en deux temps.

   En haut, la conclusion que la norme demande de porter : un choix motivé sur
   l'état du système de management de la qualité. En bas, ce qu'on en fait —
   la demande de régularisation adressée aux collaborateurs dont un dossier a
   été relevé. Les deux étaient mêlés dans un seul bloc, et la seconde moitié
   n'existait pas : on concluait sans rien demander à personne. */
function EvaluationConclusion({ showToast }) {
  useDonnees();
  const faites = dbSurveillance();
  const enregistree = faites.evaluation || {};
  const [choix, setChoix] = useState(enregistree.conclusion || '');
  const [note, setNote] = useState(enregistree.note || '');

  async function enregistrer() {
    if (!choix) { showToast('Choisissez une conclusion.'); return; }
    await dbValiderEtapeSurveillance('evaluation', { conclusion: choix, note });
    showToast('Évaluation annuelle enregistrée.');
  }

  /* À qui écrire : les collaborateurs dont un dossier porte une non-conformité
     encore ouverte. Un message par personne, avec la liste de ses dossiers —
     jamais un message par constat. */
  const ouvertes = dbNonConformites().filter(n => n.etat !== 'cloturee');
  const parCollab = {};
  ouvertes.forEach(n => {
    const id = dbAttributionDossier(n.dossier);
    if (!id) return;
    (parCollab[id] = parCollab[id] || []).push(n);
  });
  const destinataires = Object.keys(parCollab);

  function messageRegularisation(id) {
    const p = collaborateur(id);
    const lignes = parCollab[id].map(n => {
      const nom = client(n.dossier) ? client(n.dossier).nom : n.dossier;
      return `  • ${nom} — ${n.constat}`;
    });
    return [
      `Bonjour ${p ? p.nom.split(' ')[0] : ''},`.trim(),
      'La revue annuelle de surveillance du système qualité a relevé les points '
      + 'suivants sur vos dossiers :',
      lignes.join('\n'),
      'Merci de les régulariser et de me confirmer quand ce sera fait.',
      'Bien cordialement,',
      `${EXPERT_COMPTABLE.nom}\n${EXPERT_COMPTABLE.role}`,
    ].join('\n\n');
  }

  function envoyer() {
    if (!destinataires.length) return;
    const corps = destinataires.map(id => messageRegularisation(id)).join('\n\n———\n\n');
    const adresses = destinataires
      .map(id => (collaborateur(id) || {}).email).filter(Boolean).join(',');
    window.location.href = `mailto:${encodeURIComponent(adresses)}`
      + `?subject=${encodeURIComponent('Revue annuelle de surveillance — points à régulariser')}`
      + `&body=${encodeURIComponent(corps)}`;
    showToast(adresses
      ? 'Demande préparée dans votre messagerie.'
      : 'Demande préparée dans votre messagerie, destinataires à compléter : aucune adresse enregistrée.');
  }

  return h('div', { className: 'evaluation-deux' },
    h('section', { className: 'evaluation-haut' },
      h('h3', { className: 'evaluation-titre' }, 'La conclusion de l’année'),
      h('div', { className: 'evaluation-grille' },
        h(ChoixPanneau, {
          label: 'Conclusion sur le système de management de la qualité',
          valeur: choix, colonne: true,
          options: EVALUATION_CONCLUSIONS.map(c => ({ code: c.code || c.label, label: c.label })),
          onChange: setChoix,
        }),
        h(ChampPanneau, {
          label: 'Motivation', lignes: 5, valeur: note, onChange: setNote,
          aide: 'Ce qui fonde la conclusion : c’est cette phrase qu’un contrôleur lira.',
        })
      ),
      h('button', {
        className: 'btn btn-primary', onClick: enregistrer, disabled: !choix,
      }, 'Enregistrer l’évaluation')
    ),

    h('section', { className: 'evaluation-bas' },
      h('h3', { className: 'evaluation-titre' }, 'La demande de régularisation'),
      destinataires.length
        ? h(React.Fragment, null,
          h('p', { className: 'evaluation-note' },
            `${ouvertes.length} ${pluriel(ouvertes.length, 'point relevé concerne', 'points relevés concernent')} `
            + `${destinataires.length} ${pluriel(destinataires.length, 'collaborateur', 'collaborateurs')}. `
            + 'Un message par personne, avec la liste de ses dossiers.'),
          h('ul', { className: 'evaluation-destinataires' },
            destinataires.map(id => h('li', { key: id },
              h('span', { className: 'evaluation-nom' }, personneNom(id)),
              h('span', { className: 'evaluation-compte' },
                `${parCollab[id].length} ${pluriel(parCollab[id].length, 'point', 'points')}`)
            ))),
          h(MentionCapacite, { cle: 'sendEmail' }),
          h('button', { className: 'btn btn-accent', onClick: envoyer },
            'Envoyer la demande de régularisation')
        )
        : h('p', { className: 'evaluation-note' },
          'Aucun point ouvert : il n’y a rien à faire régulariser.')
    )
  );
}


// ------------------------------------------- Registre des non-conformités

const NC_CHAMPS = [
  { cle: 'constat', label: 'Constat', lignes: 3 },
  { cle: 'incidence', label: 'Incidence', lignes: 2 },
  { cle: 'cause', label: 'Cause identifiée', lignes: 2 },
  { cle: 'action', label: 'Action corrective décidée', lignes: 2 },
  { cle: 'echeance', label: 'Échéance', type: 'date' },
  { cle: 'efficacite', label: 'Contrôle d’efficacité', lignes: 2,
    aide: 'Renseigné, il clôt la non-conformité.' },
];

function RegistreNc({ showToast }) {
  const lignes = dbNonConformites();
  const [ouverte, setOuverte] = useState(null);
  const [nouvelle, setNouvelle] = useState(false);
  const courante = ouverte ? lignes.find(n => n.id === ouverte) : null;

  const etats = {
    ouverte: { label: 'Ouverte', ton: 'orange' },
    'attente-efficacite': { label: 'Efficacité à vérifier', ton: 'bleu' },
    cloturee: { label: 'Clôturée', ton: 'vert' },
  };

  return h('div', null,
    h('div', { className: 'registre-barre' },
      h('span', null, `${lignes.length} ${pluriel(lignes.length, 'non-conformité', 'non-conformités')}`),
      h('button', { className: 'btn btn-primary btn-sm', onClick: () => setNouvelle(true) },
        'Ajouter une non-conformité')
    ),
    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'), h('th', null, 'Origine'),
            h('th', null, 'Date'), h('th', null, 'Gravité'), h('th', null, 'État'))),
          h('tbody', null, lignes.map(n => h('tr', {
            key: n.id, className: 'ligne-cliquable', onClick: () => setOuverte(n.id),
          },
            h('td', { className: 'col-principale' }, client(n.dossier) ? client(n.dossier).nom : n.dossier),
            h('td', null, n.origine),
            h('td', { className: 'col-date' }, formatDate(n.date)),
            h('td', null, n.gravite),
            h('td', null, h(Pastille, { ton: etats[n.etat].ton }, etats[n.etat].label))
          )))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '—'),
        h('p', null, 'Aucune non-conformité enregistrée.')),

    courante ? h(PanneauNonConformite, {
      nc: courante, onFermer: () => setOuverte(null), showToast,
    }) : null,
    nouvelle ? h(PanneauNouvelleNc, { onFermer: () => setNouvelle(false), showToast }) : null
  );
}

function PanneauNonConformite({ nc, onFermer, showToast }) {
  const [form, setForm] = useState(Object.assign({}, nc));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function enregistrer() {
    const champs = {};
    NC_CHAMPS.forEach(c => { champs[c.cle] = form[c.cle] || null; });
    champs.responsable = form.responsable || null;
    champs.gravite = form.gravite;
    await dbMajNonConformite(nc.id, champs);
    showToast('Non-conformité enregistrée.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true, large: true,
    titre: client(nc.dossier) ? client(nc.dossier).nom : nc.dossier,
    sousTitre: `${nc.origine} — ${formatDate(nc.date)}`,
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Enregistrer')
    ),
  },
    h(ChoixPanneau, {
      label: 'Gravité', valeur: form.gravite,
      options: NC_GRAVITES.map(g => ({ code: g, label: g })),
      onChange: v => maj('gravite', v),
    }),
    h(ChoixPanneau, {
      label: 'Responsable de l’action', valeur: form.responsable || '',
      colonne: true,
      options: COLLABORATEURS.concat([{ id: 'martin', nom: EXPERT_COMPTABLE.nom }])
        .map(c => ({ code: c.id, label: c.nom })),
      onChange: v => maj('responsable', v),
    }),
    NC_CHAMPS.map(c => h(ChampPanneau, {
      key: c.cle, label: c.label, lignes: c.lignes, type: c.type, aide: c.aide,
      valeur: form[c.cle] || '', onChange: v => maj(c.cle, v),
    }))
  );
}

function PanneauNouvelleNc({ onFermer, showToast }) {
  const [form, setForm] = useState({
    dossier: CLIENTS[0].id, origine: 'Supervision', gravite: 'Majeure', constat: '',
  });
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function creer() {
    if (!form.constat.trim()) { showToast('Décrivez le constat.'); return; }
    await dbCreerNonConformite(form);
    showToast('Non-conformité créée.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: 'Nouvelle non-conformité',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: creer }, 'Créer')
    ),
  },
    h(ChoixPanneau, {
      label: 'Dossier', valeur: form.dossier, colonne: true,
      options: CLIENTS.map(c => ({ code: c.id, label: c.nom })),
      onChange: v => maj('dossier', v),
    }),
    h(ChoixPanneau, {
      label: 'Origine', valeur: form.origine,
      options: ['Supervision', 'Réclamation client', 'Contrôle interne', 'Autre']
        .map(o => ({ code: o, label: o })),
      onChange: v => maj('origine', v),
    }),
    h(ChoixPanneau, {
      label: 'Gravité', valeur: form.gravite,
      options: NC_GRAVITES.map(g => ({ code: g, label: g })),
      onChange: v => maj('gravite', v),
    }),
    h(ChampPanneau, { label: 'Constat', lignes: 3, valeur: form.constat, onChange: v => maj('constat', v) })
  );
}

// ----------------------------------------------- Registre des réclamations
//
// Même logique et même design que le registre précédent : la cohérence
// visuelle entre les deux registres est demandée explicitement (§ 11.3).

function RegistreReclamationsModerne({ showToast }) {
  const lignes = dbReclamations();
  const [ouverte, setOuverte] = useState(null);
  const [nouvelle, setNouvelle] = useState(false);
  const courante = ouverte ? lignes.find(r => r.id === ouverte) : null;

  return h('div', null,
    h('div', { className: 'registre-barre' },
      h('span', null, `${lignes.length} ${pluriel(lignes.length, 'réclamation', 'réclamations')}`),
      h('button', { className: 'btn btn-primary btn-sm', onClick: () => setNouvelle(true) },
        'Ajouter une réclamation')
    ),
    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'), h('th', null, 'Objet'),
            h('th', null, 'Reçue le'), h('th', null, 'Canal'), h('th', null, 'État'))),
          h('tbody', null, lignes.map(r => h('tr', {
            key: r.id, className: 'ligne-cliquable', onClick: () => setOuverte(r.id),
          },
            h('td', { className: 'col-principale' }, client(r.dossier) ? client(r.dossier).nom : r.dossier),
            h('td', null, r.objet),
            h('td', { className: 'col-date' }, formatDate(r.date)),
            h('td', null, r.canal),
            h('td', null, h(Pastille, { ton: r.etat === 'cloturee' ? 'vert' : 'orange' },
              RECLAMATION_ETATS[r.etat].label))
          )))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '—'),
        h('p', null, 'Aucune réclamation enregistrée.')),

    courante ? h(PanneauReclamation, {
      reclamation: courante, onFermer: () => setOuverte(null), showToast,
    }) : null,
    nouvelle ? h(PanneauNouvelleReclamation, { onFermer: () => setNouvelle(false), showToast }) : null
  );
}

function PanneauReclamation({ reclamation, onFermer, showToast }) {
  const [reponse, setReponse] = useState(reclamation.reponse || '');
  const ncLiee = dbNonConformites().find(n => n.reference === reclamation.id);

  async function cloturer() {
    if (!reponse.trim()) { showToast('Indiquez la réponse apportée.'); return; }
    await dbCloturerReclamation(reclamation.id, reponse.trim());
    showToast('Réclamation clôturée.');
    onFermer();
  }

  async function ouvrirNc() {
    await dbCreerNonConformite({
      dossier: reclamation.dossier,
      origine: 'Réclamation client',
      reference: reclamation.id,
      constat: reclamation.objet,
    });
    showToast('Non-conformité ouverte depuis la réclamation.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true, large: true,
    titre: client(reclamation.dossier) ? client(reclamation.dossier).nom : reclamation.dossier,
    sousTitre: `Reçue le ${formatDate(reclamation.date)} par ${reclamation.canal.toLowerCase()}`,
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
      reclamation.etat === 'cloturee'
        ? null
        : h('button', { className: 'btn btn-primary', onClick: cloturer }, 'Clôturer')
    ),
  },
    h('div', { className: 'champ-panneau' },
      h('span', { className: 'champ-label' }, 'Objet'),
      h('p', { className: 'panneau-texte' }, reclamation.objet)
    ),
    h('div', { className: 'champ-panneau' },
      h('span', { className: 'champ-label' }, 'Traitée par'),
      h('p', { className: 'panneau-texte' }, personneNom(reclamation.traitePar))
    ),
    reclamation.etat === 'cloturee'
      ? h('div', { className: 'champ-panneau' },
        h('span', { className: 'champ-label' }, `Réponse apportée le ${formatDate(reclamation.dateReponse)}`),
        h('p', { className: 'panneau-texte' }, reclamation.reponse))
      : h(ChampPanneau, {
        label: 'Réponse apportée', lignes: 4, valeur: reponse, onChange: setReponse,
      }),
    reclamation.suites
      ? h('div', { className: 'champ-panneau' },
        h('span', { className: 'champ-label' }, 'Suites'),
        h('p', { className: 'panneau-texte' }, reclamation.suites))
      : null,
    ncLiee
      ? h('p', { className: 'bloc-carte-note' }, 'Une non-conformité a été ouverte à partir de cette réclamation.')
      : h('button', { className: 'btn btn-secondary btn-sm', onClick: ouvrirNc },
        'Ouvrir une non-conformité')
  );
}

function PanneauNouvelleReclamation({ onFermer, showToast }) {
  const [form, setForm] = useState({
    dossier: CLIENTS[0].id, canal: 'E-mail', objet: '', traitePar: 'martin',
  });
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function creer() {
    if (!form.objet.trim()) { showToast('Indiquez l’objet de la réclamation.'); return; }
    await dbAjouterReclamation(form);
    showToast('Réclamation enregistrée.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: 'Nouvelle réclamation',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: creer }, 'Enregistrer')
    ),
  },
    h(ChoixPanneau, {
      label: 'Dossier', valeur: form.dossier, colonne: true,
      options: CLIENTS.map(c => ({ code: c.id, label: c.nom })),
      onChange: v => maj('dossier', v),
    }),
    h(ChoixPanneau, {
      label: 'Canal', valeur: form.canal,
      options: ['Téléphone', 'E-mail', 'Courrier', 'Entretien'].map(o => ({ code: o, label: o })),
      onChange: v => maj('canal', v),
    }),
    h(ChampPanneau, { label: 'Objet', lignes: 3, valeur: form.objet, onChange: v => maj('objet', v) }),
    h(ChoixPanneau, {
      label: 'Traitée par', valeur: form.traitePar, colonne: true,
      options: [{ code: 'martin', label: EXPERT_COMPTABLE.nom }]
        .concat(COLLABORATEURS.map(c => ({ code: c.id, label: c.nom }))),
      onChange: v => maj('traitePar', v),
    })
  );
}

function CartographieQualite({ onBack, showToast, onOuvrirRisque }) {
  const pages = usePagination(dbRisquesQualite(), 4);
  const aValider = risquesQualiteAValider();

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Cartographie des risques qualité',
      onRetour: onBack,
      /* « Lancer la revue » ne lançait rien. La revue de la cartographie,
         c'est valider ses domaines un par un : le bouton ouvre donc le
         premier qui reste, et disparaît quand ils sont tous validés. */
      actions: aValider.length
        ? h('button', { className: 'btn btn-primary', onClick: () => onOuvrirRisque(aValider[0].id) },
          `Reprendre la revue — ${aValider.length} ${pluriel(aValider.length, 'domaine', 'domaines')}`)
        : null,
    }),
    h('div', { className: 'campagne-entete' },
      h('div', { className: 'campagne-ligne' },
        h('span', { className: 'campagne-compte' }, dbRisquesQualite().length - aValider.length, ' sur ', dbRisquesQualite().length),
        h('span', { className: 'campagne-libelle' },
          'domaines revus — dernière revue le ', formatDate(QUALITE_DERNIERE_REVUE))
      ),
      h('div', { className: 'campagne-jauge' },
        h('div', { className: 'campagne-jauge-remplie',
          style: { width: Math.round(((dbRisquesQualite().length - aValider.length) / dbRisquesQualite().length) * 100) + '%' } }))
    ),
    /* Quatre cartes par page plutôt qu'un tableau de huit lignes sur six
       colonnes : le cahier l'exige, et les huit composantes de la NPMQ se
       lisent mieux en cartes qu'en grille. */
    h(ThemeHub, {
      cartes: pages.pageItems.map(r => ({
        cle: r.id, icone: r.icone, titre: r.domaine,
        points: [r.objectif],
        compteur: r.etat === 'a-valider' ? 'à valider' : null,
        tonCompteur: 'orange',
        libelleAction: r.etat === 'valide' ? 'Revu →' : 'Ouvrir →',
        onOuvrir: () => onOuvrirRisque(r.id),
      })),
    }),
    h(Pagination, { pagination: pages })
  );
}

// ================================================= S44 — Fiche risque qualité

function EvaluationAnnuelle({ onBack, showToast }) {
  const faits = faitsEvaluationAnnuelle();
  const [conclusion, setConclusion] = useState(null);
  const [priorites, setPriorites] = useState(['', '', '']);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: `Évaluation annuelle du système qualité — ${currentCalendarYear()}`,
      onRetour: onBack,
      actions: h('button', {
        className: 'btn btn-primary', disabled: !conclusion,
        onClick: async () => {
          await dbMajReglage('evaluationAnnuelle', {
            date: new Date().toISOString().slice(0, 10),
            par: EXPERT_COMPTABLE.nom,
          });
          dbJournaliser('Évaluation annuelle validée', `exercice ${currentCalendarYear()}`, null);
          showToast('Évaluation annuelle validée et datée.');
          onBack();
        },
      }, 'Valider l’évaluation annuelle'),
    }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'grid-2 colonnes-egales' },
          /* Les faits de l'année, rassemblés par le logiciel. Aucun score :
             le cahier l'interdit, et la NPMQ confie la conclusion à
             l'expert-comptable, pas à un calcul. */
          h(FormSection, { icon: '📊', title: 'Les faits de l’année', ton: 'bleu' },
            faits.map(f => h('div', { className: 'fait-ligne', key: f.code },
              h('div', { className: 'fait-valeur' }, f.valeur),
              h('div', { className: 'fait-corps' },
                h('div', { className: 'fait-libelle' }, f.libelle),
                h('div', { className: 'fait-detail' }, f.detail))
            )),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Rassemblés depuis les registres du cabinet.')
          ),
          h(FormSection, { icon: '⚖️', title: 'Votre conclusion', ton: 'dore' },
            h('div', { className: 'conclusion-choix' },
              EVALUATION_CONCLUSIONS.map(c => h('button', {
                key: c.code,
                className: cx('conclusion-carte', conclusion === c.code && 'selected'),
                onClick: () => setConclusion(c.code),
              },
                h('span', { className: 'conclusion-titre' }, c.label),
                h('span', { className: 'conclusion-detail' }, c.detail)
              ))
            ),
            h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
              'ComplyEC ne calcule aucun score de conformité : la norme confie cette conclusion à l’expert-comptable.')
          )
        ),
        h(FormSection, { icon: '🎯', title: 'Trois priorités pour l’année suivante', ton: 'dore', style: { marginTop: 16 } },
          h('div', { className: 'grid-2', style: { gap: 14 } },
            priorites.slice(0, 2).map((p, i) => h('div', { className: 'form-group', key: i, style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, `Priorité ${i + 1}`),
              h('input', {
                className: 'form-input', value: p, placeholder: 'Une ligne',
                onChange: e => setPriorites(ps => ps.map((x, j) => (j === i ? e.target.value : x))),
              })
            ))
          ),
          h('div', { className: 'form-group', style: { marginTop: 14, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Priorité 3'),
            h('input', {
              className: 'form-input', value: priorites[2], placeholder: 'Une ligne',
              onChange: e => setPriorites(ps => ps.map((x, j) => (j === 2 ? e.target.value : x))),
            })
          )
        )
      )
    )
  );
}

function FicheRisqueQualite({ risqueId, onBack, showToast }) {
  const r = dbRisquesQualite().find(x => x.id === risqueId);
  const [importance, setImportance] = useState(r.importance);
  const [occurrence, setOccurrence] = useState(r.occurrence);
  const [action, setAction] = useState(r.action);
  const [ecarte, setEcarte] = useState(false);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: r.domaine,
      onRetour: onBack,
      actions: h(React.Fragment, null,
        /* Écarter un risque est une décision : elle demande un motif, et ce
           motif est ce qu'un contrôleur lira. Sans lui, « écarté » ne veut
           rien dire. */
        h('button', { className: 'btn btn-secondary', onClick: () => setEcarte(true) }, 'Écarter ce risque'),
        h('button', {
          className: 'btn btn-primary',
          onClick: async () => {
            await dbValiderRisqueQualite(r.id, { importance, occurrence, action });
            showToast(`Risque « ${r.domaine} » validé.`);
            onBack();
          },
        }, 'Valider le risque')
      ),
    }),
    ecarte
      ? h(FunctionalEditModal, {
        titre: `Écarter le risque « ${r.domaine} »`,
        libelle: 'Motif de la mise à l’écart',
        valeur: '',
        aide: 'Ce motif figurera au dossier de contrôle : il doit expliquer pourquoi ce domaine ne concerne pas le cabinet.',
        onAnnuler: () => setEcarte(false),
        onEnregistrer: async motif => {
          await dbValiderRisqueQualite(r.id, { importance, occurrence, action, ecarte: true, motifEcart: motif });
          setEcarte(false);
          showToast(`Risque « ${r.domaine} » écarté — motif consigné.`);
          onBack();
        },
      })
      : null,
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        /* Même logique que la contractualisation : à gauche ce que nous
           savons, à droite ce que nous décidons. */
        h('div', { className: 'grid-2 colonnes-egales' },
          h(FormSection, { icon: '📌', title: 'Ce que nous savons', ton: 'violet' },
            h('div', { className: 'detail-field' },
              h('div', { className: 'detail-field-label' }, 'Objectif de la composante'),
              h('div', { className: 'detail-field-value' }, r.objectif)),
            h('div', { className: 'detail-field', style: { marginBottom: 0 } },
              h('div', { className: 'detail-field-label' }, 'Contexte du cabinet'),
              h('div', { className: 'detail-field-value' }, r.contexte)),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Rassemblé depuis les modules de ComplyEC.')
          ),
          h(FormSection, { icon: '⚠️', title: 'Risque proposé', ton: 'dore' },
            h('p', { className: 'carto-texte', style: { marginTop: 0 } }, r.risque),
            h('div', { className: 'form-group' },
              h('label', { className: 'form-label' }, 'Importance'),
              h('div', { className: 'radio-card-row large' },
                ['Faible', 'Moyenne', 'Élevée'].map(v => h('button', {
                  key: v, className: cx('radio-card', importance === v && 'selected'),
                  onClick: () => setImportance(v),
                }, v))
              )
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Occurrence'),
              h('div', { className: 'radio-card-row large' },
                ['Rare', 'Possible', 'Avérée'].map(v => h('button', {
                  key: v, className: cx('radio-card', occurrence === v && 'selected'),
                  onClick: () => setOccurrence(v),
                }, v))
              )
            )
          )
        ),
        h(FormSection, { icon: '🛡️', title: 'Réponse du cabinet', ton: 'dore', style: { marginTop: 16 } },
          h('div', { className: 'detail-field' },
            h('div', { className: 'detail-field-label' }, 'Mesures déjà en place'),
            h('div', { className: 'detail-field-value' }, r.reponse)),
          h('div', { className: 'grid-2', style: { gap: 16 } },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Action complémentaire'),
              h('input', { className: 'form-input', value: action || '', onChange: e => setAction(e.target.value) })
            ),
            h('div', { className: 'grid-2', style: { gap: 12 } },
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Responsable'),
                h('div', { className: 'conf-note', style: { paddingTop: 9 } }, r.responsable ? personneNom(r.responsable) : '—')
              ),
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Échéance'),
                h('div', { className: 'conf-note', style: { paddingTop: 9 } }, r.echeance ? formatDate(r.echeance) : '—')
              )
            )
          )
        )
      )
    )
  );
}

// ==================================================== S45 — Non-conformités

function RegistreNonConformites({ onBack, showToast, onTraiter }) {
  const [filtre, setFiltre] = useState('ouvertes');
  const [choisie, setChoisie] = useState(null);
  const [ajout, setAjout] = useState(false);

  const filtres = [
    { code: 'ouvertes', label: 'Ouvertes', test: n => n.etat === 'ouverte' },
    { code: 'efficacite', label: 'Efficacité à vérifier', test: n => n.etat === 'attente-efficacite' },
    { code: 'cloturees', label: 'Clôturées', test: n => n.etat === 'cloturee' },
  ];
  const actif = filtres.find(f => f.code === filtre);
  const lignes = dbNonConformites().filter(actif.test);

  const colonnes = [
    { code: 'date', titre: 'Date', valeur: n => n.date, rendu: n => formatDate(n.date) },
    { code: 'origine', titre: 'Origine', valeur: n => n.origine, rendu: n => n.origine },
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: n => client(n.dossier).nom, rendu: n => client(n.dossier).nom },
    { code: 'gravite', titre: 'Gravité', valeur: n => NC_GRAVITES.indexOf(n.gravite),
      rendu: n => h(Badge, { color: n.gravite === 'Mineure' ? 'jaune' : n.gravite === 'Majeure' ? 'orange' : 'rouge' }, n.gravite) },
  ];

  const courante = choisie ? dbNonConformites().find(n => n.id === choisie) : null;
  const detail = courante
    ? h(Card, {
      title: client(courante.dossier).nom,
      subtitle: `${courante.origine} — ${formatDate(courante.date)}`,
      icon: '🛠️', iconBg: '#FEF3E1', iconColor: '#B45309',
      tone: courante.etat === 'cloturee' ? 'vert' : 'orange',
    },
      h('div', { className: 'detail-field' },
        h('div', { className: 'detail-field-label' }, 'Constat'),
        h('div', { className: 'detail-field-value' }, courante.constat)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'État'),
        h(Badge, { color: NC_ETATS[courante.etat].couleur }, NC_ETATS[courante.etat].label)),
      h('div', { className: 'list-row' },
        h('span', { className: 'list-row-label' }, 'Portée'),
        h('span', { className: 'conf-note' }, courante.portee === 'systemique' ? 'Systémique' : 'Isolée')),
      courante.reference
        ? h('div', { className: 'list-row' },
          h('span', { className: 'list-row-label' }, 'Origine liée'),
          h('span', { className: 'conf-note' }, 'Réclamation ', courante.reference))
        : null,
      h('button', {
        className: 'btn btn-primary btn-block', style: { marginTop: 14 },
        onClick: () => onTraiter(courante.id),
      }, 'Ouvrir le traitement →')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Non-conformités', onRetour: onBack,
      actions: h('button', { className: 'btn btn-primary', onClick: () => setAjout(true) },
        '+ Ajouter une non-conformité'),
    }),
    h('div', { className: 'tabs', style: { marginBottom: 14 } },
      filtres.map(f => h('button', {
        key: f.code, className: cx('tab', filtre === f.code && 'active'),
        onClick: () => { setFiltre(f.code); setChoisie(null); },
      }, f.label, ' ', h('span', { className: 'tab-compte' }, dbNonConformites().filter(f.test).length)))
    ),
    h(ActionListDetail, {
      titreListe: actif.label, iconeListe: '🛠️',
      sousTitreListe: String(lignes.length),
      colonnes, lignes, cle: n => n.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune non-conformité dans cette vue.',
      selection: choisie, onSelect: n => setChoisie(n.id),
      detail, detailIcone: '🛠️',
      detailVide: 'Choisissez une non-conformité pour voir son constat',
    }),
    ajout
      ? h(AjoutNonConformite, {
        onAnnuler: () => setAjout(false),
        onEnregistrer: async valeurs => {
          const n = await dbCreerNonConformite(valeurs);
          setAjout(false);
          setChoisie(n.id);
          showToast(`Non-conformité ${n.id} enregistrée.`);
        },
      })
      : null
  );
}

/* Saisie d'une non-conformité. Le constat et l'incidence suffisent à
   l'ouvrir : la cause et l'action se décident au traitement, et exiger tout
   d'un coup découragerait de la déclarer — or une non-conformité tue
   s'enregistre, elle ne se cache pas. */

function SurveillanceAnnuelle({ onBack, showToast }) {
  const [etape, setEtape] = useState(1);
  const [echantillon, setEchantillon] = useState(ECHANTILLON_SURVEILLANCE);
  const [dossierCourant, setDossierCourant] = useState(0);
  const [verdicts, setVerdicts] = useState({});
  const [pointChoisi, setPointChoisi] = useState(POINTS_CONTROLE[0].code);

  const cle = (d, p) => `${d}|${p}`;
  const dossier = echantillon[dossierCourant];
  const nonConformes = Object.entries(verdicts).filter(([, v]) => v === 'non-conforme');
  const controles = echantillon.filter(d =>
    POINTS_CONTROLE.every(p => verdicts[cle(d.dossier, p.code)])).length;

  function remplacer(i) {
    const candidats = CLIENTS.filter(c => !echantillon.some(e => e.dossier === c.id));
    if (!candidats.length) { showToast('Aucun autre dossier disponible dans le portefeuille.'); return; }
    const remplacant = candidats[0];
    setEchantillon(e => e.map((d, j) => (j === i ? { dossier: remplacant.id, motif: 'Remplacement décidé par l’expert-comptable' } : d)));
    showToast(`${client(echantillon[i].dossier).nom} remplacé par ${remplacant.nom}.`);
  }

  // ---- S47 : l'échantillon ----
  if (etape === 1) {
    return h('div', { className: 'page' },
      h(EnteteHub, { titre: 'Surveillance annuelle', onRetour: onBack }),
      h(Stepper, { steps: SURVEILLANCE_ETAPES, current: 1 }),
      h('div', { className: 'step-body' },
        h('div', { className: 'step-scroll' },
          h('div', { className: 'grid-2-uneven', style: { alignItems: 'stretch' } },
            h(FormSection, { icon: '🎯', title: 'Critères appliqués', ton: 'bleu' },
              CRITERES_ECHANTILLON.map(c => h('div', { className: 'list-row', key: c.code },
                h('span', { className: 'list-row-label' }, c.label),
                h(Badge, { color: c.actif ? 'vert' : 'gris' }, c.actif ? 'appliqué' : 'écarté'))),
              h('div', { className: 'form-help' },
                'Ces critères sont ceux que le cabinet s’est donnés. La sélection qui en découle reste modifiable : rien n’est irréversible.')
            ),
            h(FormSection, { icon: '📋', title: 'Échantillon proposé', ton: 'bleu',
              subtitle: String(echantillon.length) },
              h('div', { className: 'echantillon-liste' },
                echantillon.map((d, i) => h('div', { className: 'echantillon-carte', key: d.dossier },
                  h('div', { className: 'echantillon-corps' },
                    h('div', { className: 'echantillon-nom' }, client(d.dossier).nom),
                    h('div', { className: 'echantillon-motif' }, d.motif)),
                  h('button', { className: 'btn btn-secondary btn-sm', onClick: () => remplacer(i) }, 'Remplacer')
                ))
              )
            )
          )
        ),
        h('div', { className: 'wizard-footer' },
          h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
          h('button', { className: 'btn btn-primary', onClick: () => setEtape(2) }, 'Valider l’échantillon →')
        )
      )
    );
  }

  // ---- S48 : le contrôle, dossier par dossier ----
  if (etape === 2) {
    const point = POINTS_CONTROLE.find(p => p.code === pointChoisi);
    const verdictCourant = verdicts[cle(dossier.dossier, pointChoisi)];
    const dernierDossier = dossierCourant >= echantillon.length - 1;

    return h('div', { className: 'page' },
      h(EnteteHub, { titre: `Surveillance annuelle — ${client(dossier.dossier).nom}` }),
      h(Stepper, { steps: SURVEILLANCE_ETAPES, current: 2 }),
      h('div', { className: 'step-body' },
        h('div', { className: 'tabs', style: { marginBottom: 14 } },
          echantillon.map((d, i) => h('button', {
            key: d.dossier, className: cx('tab', i === dossierCourant && 'active'),
            onClick: () => { setDossierCourant(i); setPointChoisi(POINTS_CONTROLE[0].code); },
          }, `Dossier ${i + 1}/${echantillon.length}`))
        ),
        h('div', { className: 'split-layout with-detail' },
          h(FormSection, { icon: '☑️', title: 'Points de contrôle', ton: 'bleu',
            subtitle: `${POINTS_CONTROLE.filter(p => verdicts[cle(dossier.dossier, p.code)]).length} sur ${POINTS_CONTROLE.length}` },
            /* Les trois boutons de cotation sont des symboles : ils sont
               nommés une fois ici, plutôt que répétés seize fois dans la
               liste ou laissés à deviner au survol. */
            h('div', { className: 'points-legende' },
              Object.keys(CONTROLE_VERDICTS).map(k => h('span', { className: 'points-legende-item', key: k },
                h('span', { className: cx('point-verdict', 'v-' + k, 'actif') }, CONTROLE_VERDICTS[k].puce),
                CONTROLE_VERDICTS[k].label))
            ),
            h('div', { className: 'points-liste' },
              POINTS_CONTROLE.map(p => {
                const v = verdicts[cle(dossier.dossier, p.code)];
                return h('div', { className: cx('point-ligne', pointChoisi === p.code && 'actif'), key: p.code,
                  onClick: () => setPointChoisi(p.code) },
                  h('span', { className: 'point-label' }, p.label),
                  h('span', { className: 'point-verdicts' },
                    Object.keys(CONTROLE_VERDICTS).map(k => h('button', {
                      key: k,
                      className: cx('point-verdict', 'v-' + k, v === k && 'actif'),
                      title: CONTROLE_VERDICTS[k].label,
                      onClick: e => {
                        e.stopPropagation();
                        setPointChoisi(p.code);
                        setVerdicts(x => Object.assign({}, x, { [cle(dossier.dossier, p.code)]: k }));
                      },
                    }, CONTROLE_VERDICTS[k].puce)))
                );
              })
            )
          ),
          h('div', { className: 'detail-panel' },
            h(Card, {
              title: point.label,
              subtitle: verdictCourant ? CONTROLE_VERDICTS[verdictCourant].label : 'Pas encore coté',
              icon: '📎', iconBg: '#E9F1FE', iconColor: '#2563EB',
              tone: verdictCourant === 'non-conforme' ? 'orange' : verdictCourant === 'conforme' ? 'vert' : 'bleu',
            },
              h('div', { className: 'detail-field' },
                h('div', { className: 'detail-field-label' }, 'Ce que ComplyEC sait déjà'),
                h('div', { className: 'detail-field-value' }, point.source)),
              h('div', { className: 'form-group' },
                h('label', { className: 'form-label' }, 'Observation'),
                h('input', { className: 'form-input', placeholder: 'Facultatif — une ligne suffit' })
              ),
              verdictCourant === 'non-conforme'
                ? h('button', {
                  className: 'btn btn-secondary btn-sm',
                  // Le dossier et le point contrôlé sont repris : c'est le
                  // contexte, on ne le ressaisit pas.
                  onClick: async () => {
                    const n = await dbCreerNonConformite({
                      dossier: dossier.dossier,
                      origine: 'Surveillance annuelle',
                      constat: point.label,
                      incidence: 'Relevée lors du contrôle du dossier.',
                    });
                    showToast(`Non-conformité ${n.id} créée — dossier et constat repris.`);
                  },
                }, 'Créer une non-conformité')
                : null
            )
          )
        ),
        h('div', { className: 'wizard-footer' },
          h('button', { className: 'btn btn-secondary', onClick: () => (dossierCourant > 0 ? setDossierCourant(i => i - 1) : setEtape(1)) }, '← Retour'),
          h('button', {
            className: 'btn btn-primary',
            onClick: () => {
              if (dernierDossier) { setEtape(3); return; }
              setDossierCourant(i => i + 1);
              setPointChoisi(POINTS_CONTROLE[0].code);
            },
          }, dernierDossier ? 'Voir la synthèse →' : 'Enregistrer et continuer →')
        )
      )
    );
  }

  // ---- S49 : la synthèse ----
  const rapport = [
    `RAPPORT DE SURVEILLANCE ANNUELLE — ${currentCalendarYear()}`,
    '',
    (REFERENTIEL_INFOS.find(i => i.cle === 'cabinet.denomination') || {}).valeur || '',
    `Arrêté au ${formatDateLong(new Date().toISOString().slice(0, 10))}`,
    '',
    'ÉTENDUE DES TRAVAUX',
    `${echantillon.length} dossiers ont été retenus selon les critères que le cabinet s'est`,
    `donnés, et ${controles} ont été contrôlés sur ${POINTS_CONTROLE.length} points chacun.`,
    '',
    'DOSSIERS CONTRÔLÉS',
    ...echantillon.map(d => `— ${client(d.dossier).nom} : ${d.motif}`),
    '',
    'CONSTATS',
    nonConformes.length
      ? `${nonConformes.length} point(s) ont été relevés non conformes et ont donné lieu à une`
      : 'Aucun point non conforme n’a été relevé sur les dossiers contrôlés.',
    nonConformes.length ? 'non-conformité inscrite au registre.' : '',
    '',
    'Établi conformément à la composante « Surveillance et actions correctives »',
    'de la norme professionnelle de management de la qualité.',
  ].join('\n');

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'Surveillance annuelle — synthèse' }),
    h(Stepper, { steps: SURVEILLANCE_ETAPES, current: 3 }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        h('div', { className: 'campagne-tuiles', style: { marginBottom: 16 } },
          h('div', { className: 'campagne-tuile ton-vert' },
            h('div', { className: 'campagne-tuile-valeur' }, controles, ' / ', echantillon.length),
            h('div', { className: 'campagne-tuile-libelle' }, 'Dossiers contrôlés')),
          h('div', { className: cx('campagne-tuile', nonConformes.length && 'ton-orange') },
            h('div', { className: 'campagne-tuile-valeur' }, nonConformes.length),
            h('div', { className: 'campagne-tuile-libelle' }, 'Points non conformes')),
          h('div', { className: cx('campagne-tuile', ncOuvertes().length && 'ton-orange') },
            h('div', { className: 'campagne-tuile-valeur' }, ncOuvertes().length),
            h('div', { className: 'campagne-tuile-libelle' }, 'Actions ouvertes'))
        ),
        h(DocumentPreviewShell, {
          titreDocument: `Rapport de surveillance ${currentCalendarYear()}`,
          feuille: rapport,
          titrePanneau: 'Actions correctives',
          iconePanneau: '🛠️',
          panneau: ncOuvertes().length
            ? ncOuvertes().slice(0, 5).map(n => h('div', { className: 'list-row', key: n.id },
              h('span', { className: 'list-row-label' }, client(n.dossier).nom),
              h('span', { className: 'conf-note' },
                n.responsable ? `${personneNom(n.responsable)} — ${n.echeance ? formatDate(n.echeance) : 'échéance à fixer'}` : 'à affecter')))
            : h(EmptyDetail, { icon: '✅', label: 'Aucune action corrective ouverte.' }),
          actions: h('p', { className: 'conf-detail', style: { margin: 0 } },
            'Le rapport se lit avant d’être finalisé : c’est la pièce que le contrôleur qualité demandera.'),
        })
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: () => setEtape(2) }, '← Retour'),
        h('button', {
          className: 'btn btn-primary',
          /* Le rapport de surveillance consigne les contrôles faits. Chaque
           point coté non conforme a déjà pu donner lieu à une non-conformité ;
           ce que l'arrêté ajoute, c'est la date et la personne. */
        onClick: async () => {
          for (const cle of Object.keys(verdicts)) {
            const [dossierId, code] = cle.split('|');
            await dbEnregistrerControle(`surv-${dossierId}-${code}`, {
              dossier: dossierId, type: 'surveillance', point: code, resultat: verdicts[cle],
            });
          }
          showToast('Rapport de surveillance finalisé et daté.');
          onBack();
        },
        }, '✅ Finaliser le rapport')
      )
    )
  );
}

// ============================================ S50 — Évaluation annuelle du SMQ

function TraitementNonConformite({ ncId, onBack, showToast }) {
  const n = dbNonConformites().find(x => x.id === ncId);
  const [gravite, setGravite] = useState(n.gravite);
  const [portee, setPortee] = useState(n.portee);
  const [cause, setCause] = useState(n.cause || '');
  const [action, setAction] = useState(n.action || '');
  const echeanceDepassee = n.echeance && n.echeance <= new Date().toISOString().slice(0, 10);

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: `Non-conformité — ${client(n.dossier).nom}`,
      onRetour: onBack,
      actions: h('button', {
        className: 'btn btn-primary',
        // Toute modification persiste (§ 26.2) : le plan d'action décidé ici
        // est celui que le dossier de contrôle montrera.
        onClick: async () => {
          await dbMajNonConformite(ncId, { gravite, portee, cause: cause.trim() || null, action: action.trim() || null });
          showToast('Traitement enregistré.');
          onBack();
        },
      }, 'Enregistrer le traitement'),
    }),
    h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
        /* Quatre blocs fixes, des champs narratifs courts : documenter une
           non-conformité ne doit pas coûter plus cher que la corriger. */
        h('div', { className: 'grid-2 colonnes-egales' },
          h(FormSection, { icon: '🔍', title: 'Constat', ton: 'bleu' },
            h('p', { className: 'carto-texte', style: { margin: 0 } }, n.constat),
            h('div', { className: 'form-help' },
              n.reference
                ? `Repris automatiquement de la réclamation ${n.reference} — rien à ressaisir.`
                : `Relevé par ${n.origine.toLowerCase()} le ${formatDate(n.date)}.`)
          ),
          h(FormSection, { icon: '⚡', title: 'Incidence', ton: 'bleu' },
            h('p', { className: 'carto-texte', style: { margin: 0 } },
              n.incidence || 'Incidence à apprécier.')
          )
        ),
        h('div', { className: 'grid-2 colonnes-egales', style: { marginTop: 16 } },
          h(FormSection, { icon: '🧩', title: 'Cause première', ton: 'dore' },
            h('textarea', {
              className: 'form-textarea', rows: 3, value: cause,
              placeholder: 'Pourquoi cela s’est-il produit ?',
              onChange: e => setCause(e.target.value),
            })
          ),
          h(FormSection, { icon: '🛠️', title: 'Action corrective', ton: 'dore' },
            h('textarea', {
              className: 'form-textarea', rows: 3, value: action,
              placeholder: 'Que fait le cabinet pour que cela ne se reproduise pas ?',
              onChange: e => setAction(e.target.value),
            })
          )
        ),
        h(FormSection, { icon: '⚖️', title: 'Qualification et suivi', ton: 'dore', style: { marginTop: 16 } },
          h('div', { className: 'grid-2', style: { gap: 18 } },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Gravité'),
              h('div', { className: 'radio-card-row large' },
                NC_GRAVITES.map(g => h('button', {
                  key: g, className: cx('radio-card', gravite === g && 'selected'), onClick: () => setGravite(g),
                }, g))
              )
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Portée'),
              h('div', { className: 'radio-card-row large' },
                [['isole', 'Isolée'], ['systemique', 'Systémique']].map(([code, lbl]) => h('button', {
                  key: code, className: cx('radio-card', portee === code && 'selected'), onClick: () => setPortee(code),
                }, lbl))
              )
            )
          ),
          h('div', { className: 'grid-2', style: { gap: 18, marginTop: 14 } },
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Responsable'),
              h('span', { className: 'conf-note' }, n.responsable ? personneNom(n.responsable) : 'à désigner')),
            h('div', { className: 'list-row' },
              h('span', { className: 'list-row-label' }, 'Échéance'),
              h('span', { className: 'conf-note' }, n.echeance ? formatDate(n.echeance) : 'à fixer'))
          )
        ),
        /* Le contrôle d'efficacité n'apparaît qu'une fois l'échéance passée :
           avant, il n'y a rien à vérifier. C'est lui qui permet de clore. */
        echeanceDepassee
          ? h(FormSection, { icon: '✅', title: 'Contrôle d’efficacité', ton: 'vert', style: { marginTop: 16 } },
            n.efficacite
              ? h(React.Fragment, null,
                h('div', { className: 'list-row' },
                  h('span', { className: 'list-row-label' }, 'Vérifié le'),
                  h('span', { className: 'conf-note' }, formatDate(n.efficacite.date))),
                h('p', { className: 'carto-texte', style: { marginBottom: 0 } }, n.efficacite.constat))
              : h(React.Fragment, null,
                h('p', { className: 'conf-detail', style: { marginTop: 0 } },
                  'L’échéance est passée : une non-conformité ne se clôt qu’une fois son action corrective vérifiée sur le terrain.'),
                h('button', {
          className: 'btn btn-primary btn-sm',
          // Une non-conformité n'est close qu'une fois son efficacité
          // vérifiée : c'est ce qui distingue une action corrective d'une
          // intention, et l'état se déduit ensuite de ce fait.
          onClick: async () => {
            await dbMajNonConformite(courante.id, {
              efficacite: { date: new Date().toISOString().slice(0, 10), par: EXPERT_COMPTABLE.nom, verdict: 'efficace' },
            });
            showToast(`Contrôle d’efficacité enregistré — ${courante.id} close.`);
          },
        },
                  'Vérifier l’efficacité'))
          )
          : null
      )
    )
  );
}

// ======================================= S47 à S49 — Surveillance annuelle

const SURVEILLANCE_ETAPES = ['Échantillon', 'Contrôle', 'Synthèse'];

function AjoutNonConformite({ onAnnuler, onEnregistrer }) {
  const [dossier, setDossier] = useState('');
  const [origine, setOrigine] = useState('Supervision interne');
  const [constat, setConstat] = useState('');
  const [incidence, setIncidence] = useState('');

  return h(Modal, { title: 'Enregistrer une non-conformité', onClose: onAnnuler, width: 600 },
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Dossier concerné'),
      h('select', { className: 'form-input', value: dossier, onChange: e => setDossier(e.target.value) },
        h('option', { value: '' }, '— Choisir —'),
        CLIENTS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
      )
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Comment a-t-elle été relevée ?'),
      h('select', { className: 'form-input', value: origine, onChange: e => setOrigine(e.target.value) },
        ['Supervision interne', 'Réclamation client', 'Surveillance annuelle', 'Contrôle externe', 'Autre']
          .map(o => h('option', { key: o, value: o }, o))
      )
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Constat'),
      h('input', {
        className: 'form-input', value: constat, autoFocus: true,
        placeholder: 'Ce qui n’a pas été fait comme il aurait dû l’être',
        onChange: e => setConstat(e.target.value),
      })
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Incidence'),
      h('input', {
        className: 'form-input', value: incidence,
        placeholder: 'Ce que cela a changé pour le client ou pour la mission',
        onChange: e => setIncidence(e.target.value),
      })
    ),
    h('div', { className: 'modal-actions' },
      h('button', { className: 'btn btn-secondary', onClick: onAnnuler }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary',
        disabled: !dossier || !constat.trim(),
        onClick: () => onEnregistrer({
          dossier, origine, constat: constat.trim(),
          incidence: incidence.trim() || 'À apprécier.',
        }),
      }, 'Enregistrer')
    )
  );
}

// =========================================== S46 — Traitement d'une non-conformité
