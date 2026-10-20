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

/* Repris le 20 octobre, sur les schémas du cabinet.

   Les six étapes restent en tête. En dessous, l'étape occupe toute la hauteur,
   sans ligne d'avancement ni phrase de présentation : son titre suffit. Les
   boutons — étape précédente, valider — sont en bas à droite, à la place où
   ils sont dans tous les parcours du logiciel. */
function ProgrammeAnnuel({ showToast, cabinetSettings }) {
  const faites = dbSurveillance();
  const premiereOuverte = SURVEILLANCE_PROGRAMME.find(e => !faites[e.code]);
  const [ouverte, setOuverte] = useState(
    premiereOuverte ? premiereOuverte.code : SURVEILLANCE_PROGRAMME[0].code);

  const etape = etapeSurveillance(ouverte);
  const validee = faites[ouverte];
  const precedente = SURVEILLANCE_PROGRAMME[etape.rang - 2];
  const suivante = SURVEILLANCE_PROGRAMME[etape.rang];

  async function valider() {
    await dbValiderEtapeSurveillance(ouverte, {});
    showToast(`${etape.label} — étape validée.`);
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

    h('section', { className: 'bloc-carte programme-etape' },
      h('header', { className: 'bloc-carte-entete' },
        h('h2', null, etape.label),
        validee ? h(Pastille, { ton: 'vert' }, `Validée le ${formatDate(validee.le)}`) : null
      ),
      h(ContenuEtapeSurveillance, { code: ouverte, showToast, cabinetSettings })
    ),

    h('div', { className: 'programme-pied' },
      precedente
        ? h('button', { className: 'btn btn-secondary', onClick: () => setOuverte(precedente.code) }, '← Étape précédente')
        : null,
      validee
        ? h(React.Fragment, null,
          h('button', { className: 'btn btn-tertiaire', onClick: rouvrir }, 'Rouvrir l’étape'),
          suivante ? h('button', { className: 'btn btn-primary', onClick: () => setOuverte(suivante.code) }, 'Étape suivante →') : null)
        /* L'évaluation se valide en enregistrant sa conclusion, dans
           l'écran même : un second bouton dirait la même chose. */
        : (ouverte === 'evaluation' ? null
          : h('button', { className: 'btn btn-primary', onClick: valider }, 'Valider cette étape'))
    )
  );
}

/* Les dossiers de l'échantillon, tels qu'ils ont été retenus à l'étape 2. */
function echantillonRetenu() {
  return (dbSurveillanceBrouillon('echantillon') || {}).retenus
    || ECHANTILLON_SURVEILLANCE.map(e => e.dossier);
}

/* Les points de contrôle retenus à l'étape 3, ajouts du cabinet compris. */
function pointsControleRetenus() {
  const b = dbSurveillanceBrouillon('controle') || {};
  const tous = POINTS_CONTROLE.concat(b.ajouts || []);
  const cochees = b.points || POINTS_CONTROLE.map(p => p.code);
  return tous.filter(p => cochees.indexOf(p.code) >= 0);
}

/* Un choix multiple qui se conserve, et qu'on peut allonger. Les cases se
   rangent sur deux colonnes, et la ligne d'ajout les suit. */
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
    h('div', { className: 'surveillance-cases' },
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

/* L'échantillon : à gauche ce que les critères proposent, et en dessous une
   ligne pour ajouter un dossier de son choix ; à droite ce que le cabinet
   retient. Un dossier ajouté à la main doit être un dossier que ComplyEC
   connaît — relié à l'espace documentaire du cabinet — sinon rien ne pourra
   y être vérifié. */
function EchantillonSurveillance({ showToast }) {
  const brouillon = dbSurveillanceBrouillon('echantillon') || {};
  const proposes = ECHANTILLON_SURVEILLANCE;
  const [retenus, setRetenus] = useState(() => (
    brouillon.retenus || proposes.map(e => e.dossier)));
  const [saisie, setSaisie] = useState('');
  const [erreur, setErreur] = useState(null);

  function conserver(liste) {
    setRetenus(liste);
    dbEnregistrerBrouillonSurveillance('echantillon', { retenus: liste });
  }
  const nomDe = d => (client(d) ? client(d).nom : d);
  const motifDe = d => (proposes.find(e => e.dossier === d) || {}).motif || 'Ajouté par le cabinet';

  function ajouterLibre() {
    const texte = saisie.trim().toLowerCase();
    if (!texte) return;
    const trouve = CLIENTS.find(c => c.nom.toLowerCase() === texte || c.id === texte);
    if (!trouve) {
      setErreur('Ce dossier n’est pas relié à l’espace documentaire du cabinet : ComplyEC ne pourrait pas le vérifier. Choisissez un nom dans la liste.');
      return;
    }
    setErreur(null);
    setSaisie('');
    if (retenus.indexOf(trouve.id) >= 0) { showToast(`${trouve.nom} est déjà retenu.`); return; }
    conserver(retenus.concat([trouve.id]));
    showToast(`${trouve.nom} ajouté à l’échantillon.`);
  }

  const aGauche = proposes.filter(e => retenus.indexOf(e.dossier) < 0);
  const aDroite = retenus;

  return h('div', { className: 'echantillon-deux' },
    h('div', { className: 'echantillon-gauche' },
    h('section', { className: 'echantillon-colonne' },
      h('header', { className: 'echantillon-entete' },
        h('h3', null, 'Dossiers proposés'),
        h('span', { className: 'echantillon-compte' }, aGauche.length)
      ),
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
    h('section', { className: 'echantillon-colonne echantillon-libre' },
      h('h3', null, 'Ajouter un autre dossier'),
      h('div', { className: 'surveillance-ajout' },
        h('input', {
          className: 'champ-saisie', list: 'dossiers-connus', value: saisie,
          placeholder: 'Nom du dossier…', 'aria-label': 'Nom du dossier à ajouter',
          onChange: e => { setSaisie(e.target.value); setErreur(null); },
          onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); ajouterLibre(); } },
        }),
        h('datalist', { id: 'dossiers-connus' },
          CLIENTS.map(c => h('option', { key: c.id, value: c.nom }))),
        h('button', { className: 'btn btn-secondary', onClick: ajouterLibre, disabled: !saisie.trim() }, 'Retenir →')
      ),
      erreur ? h('p', { className: 'champ-erreur' }, erreur) : null
    )
    ),

    h('section', { className: 'echantillon-colonne echantillon-retenus' },
      h('header', { className: 'echantillon-entete' },
        h('h3', null, 'Dossiers retenus'),
        h('span', { className: 'echantillon-compte' }, aDroite.length)
      ),
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

/* Le contenu propre à chaque étape. */
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
  return h(EvaluationConclusion, { showToast });
}

/* Ce que ComplyEC constate seul sur un dossier de l'échantillon, point par
   point : une anomalie documentaire ouverte, ou l'absence d'analyse de
   vigilance. Les autres points ne se constatent qu'à la main. */
const POINTS_ANOMALIES = {
  ldm: ['lettre_mission_absente'],
  dp: ['identite_absente', 'rbe_justificatif_absent'],
  supervision: ['note_synthese_absente', 'note_synthese_non_supervisee'],
};

function constatsAutomatiques(dossier) {
  const liste = anomaliesOuvertes()
    .filter(a => a.dossier === dossier)
    .map(a => ({ point: Object.keys(POINTS_ANOMALIES).find(p => POINTS_ANOMALIES[p].indexOf(a.type) >= 0) || null, libelle: a.libelle }));
  const vig = dbVigilanceDossiers().find(v => v.dossier === dossier);
  if (vig && vig.statut !== 'complete') liste.push({ point: 'vigilance', libelle: 'Analyse de vigilance LBC-FT à faire' });
  return liste;
}

/* Les constats. À gauche, le récapitulatif de ce que ComplyEC a détecté seul
   sur les dossiers de l'échantillon. À droite, une fiche par dossier — on
   passe de l'une à l'autre par son numéro, en bas à gauche, comme on tourne
   les pages — où l'on écrit ce que le contrôle a relevé en plus. Une fiche
   s'inscrit au registre des non-conformités, qui en suit le traitement. */
function ConstatsSurveillance({ showToast }) {
  useDonnees();
  const retenus = echantillonRetenu();
  const points = pointsControleRetenus();
  const brouillon = dbSurveillanceBrouillon('constats') || {};
  const [fiches, setFiches] = useState(() => brouillon.fiches || {});
  const [page, setPage] = useState(0);
  const dossier = retenus[Math.min(page, Math.max(0, retenus.length - 1))];
  const fiche = fiches[dossier] || {};
  const nomDe = d => (client(d) ? client(d).nom : d);
  const ncDuDossier = dbNonConformites().filter(n => n.dossier === dossier && n.origine === 'Revue annuelle de surveillance');

  function maj(champ, valeur) {
    const suite = Object.assign({}, fiches, { [dossier]: Object.assign({}, fiche, { [champ]: valeur }) });
    setFiches(suite);
    dbEnregistrerBrouillonSurveillance('constats', { fiches: suite });
  }

  async function inscrire() {
    if (!String(fiche.commentaire || '').trim()) return;
    await dbCreerNonConformite({
      dossier, constat: fiche.commentaire.trim(), gravite: fiche.gravite || 'Mineure',
      point: fiche.point || null,
      origine: 'Revue annuelle de surveillance',
    });
    maj('commentaire', '');
    showToast('Constat inscrit au registre des non-conformités.');
  }

  return h('div', { className: 'constats-deux' },
    h('section', { className: 'constats-auto' },
      h('h3', { className: 'constats-titre' }, 'Constats automatiques'),
      h('p', { className: 'constats-note' }, 'Ce que ComplyEC a détecté seul sur les dossiers de l’échantillon — onglet Anomalies et analyses LCB-FT.'),
      h('div', { className: 'constats-auto-liste' },
        retenus.map(d => {
          const c = constatsAutomatiques(d);
          return h('div', { key: d, className: cx('constats-auto-ligne', !c.length && 'sain') },
            h('span', { className: 'constats-auto-nom' }, nomDe(d)),
            c.length
              ? h('span', { className: 'constats-auto-puces' },
                c.map((x, i) => h('span', { key: i, className: 'constats-auto-puce' }, x.libelle)))
              : h('span', { className: 'constats-auto-rien' }, '✓ Rien de détecté'));
        })
      )
    ),

    h('section', { className: 'constats-fiche' },
      retenus.length ? h(React.Fragment, null,
        h('header', { className: 'constats-fiche-tete' },
          h('span', { className: 'constats-fiche-sur' }, `Fiche ${page + 1} sur ${retenus.length}`),
          h('h3', null, nomDe(dossier))
        ),
        h('div', { className: 'constats-fiche-champs' },
          h(ListePanneau, {
            label: 'Point concerné',
            valeur: fiche.point || '', onChange: v => maj('point', v),
            options: [{ code: '', label: '— Hors des points de contrôle —' }]
              .concat(points.map(p => ({ code: p.code, label: p.label }))),
          }),
          h(ListePanneau, {
            label: 'Gravité',
            valeur: fiche.gravite || 'Mineure', onChange: v => maj('gravite', v),
            options: [{ code: 'Mineure', label: 'Mineure' }, { code: 'Majeure', label: 'Majeure' }],
          })
        ),
        h(ChampPanneau, {
          label: 'Ce que le contrôle a relevé, en plus des constats automatiques', lignes: 4,
          valeur: fiche.commentaire || '', onChange: v => maj('commentaire', v),
          placeholder: 'Par exemple : honoraires facturés au-delà de la lettre de mission…',
        }),
        h('div', { className: 'constats-fiche-actions' },
          h('span', { className: 'constats-fiche-deja' },
            ncDuDossier.length
              ? `${ncDuDossier.length} ${pluriel(ncDuDossier.length, 'constat déjà inscrit', 'constats déjà inscrits')} pour ce dossier`
              : 'Aucun constat inscrit pour ce dossier'),
          h('button', {
            className: 'btn btn-primary', onClick: inscrire,
            disabled: !String(fiche.commentaire || '').trim(),
          }, 'Inscrire au registre des non-conformités')
        ),
        h('nav', { className: 'constats-pages', 'aria-label': 'Fiches de l’échantillon' },
          retenus.map((d, i) => h('button', {
            key: d, type: 'button',
            className: cx('constats-page', i === page && 'actif', (fiches[d] || {}).commentaire && 'remplie'),
            title: nomDe(d),
            'aria-current': i === page ? 'page' : undefined,
            onClick: () => setPage(i),
          }, i + 1)))
      ) : h('p', { className: 'bloc-carte-note' }, 'Aucun dossier dans l’échantillon : retenez-en à l’étape 2.')
    )
  );
}

/* Les actions correctives : une liste, une case par action menée, et la
   relance des collaborateurs concernés — comme dans les anomalies : un
   message par personne, avec la liste de ses dossiers. */
function ActionsCorrectives({ showToast }) {
  useDonnees();
  const nc = dbNonConformites().filter(n => n.etat !== 'cloturee');
  const [relances, setRelances] = useState(null);

  async function basculer(n) {
    await dbMajNonConformite(n.id, {
      efficacite: n.efficacite ? null : 'Action menée et vérifiée',
      dateEfficacite: n.efficacite ? null : new Date().toISOString().slice(0, 10),
    });
    showToast(n.efficacite ? 'Action rouverte.' : 'Action marquée comme menée.');
  }

  const aMener = nc.filter(n => !n.efficacite);
  const parCollab = {};
  aMener.forEach(n => {
    const id = dbAttributionDossier(n.dossier);
    if (!id) return;
    (parCollab[id] = parCollab[id] || []).push(n);
  });
  const destinataires = Object.keys(parCollab);

  async function relancer() {
    const le = new Date().toISOString().slice(0, 10);
    const prets = destinataires.map(id => {
      const p = collaborateur(id);
      const lignes = parCollab[id].map(n => `  • ${client(n.dossier) ? client(n.dossier).nom : n.dossier} — ${n.action || n.constat}`);
      return {
        id: `rel-sq-${Date.now()}-${id}`,
        collaborateur: id,
        genereeLe: le,
        elements: parCollab[id].map(n => ({ dossier: n.dossier, libelle: n.action || n.constat })),
        message: [
          `Bonjour ${p ? p.nom.split(' ')[0] : ''},`.trim(),
          'La revue annuelle de surveillance du système qualité a relevé les points suivants sur vos dossiers. Merci de faire le nécessaire et de me confirmer quand ce sera fait :',
          lignes.join('\n'),
          'Bien cordialement,',
          `${EXPERT_COMPTABLE.nom}\n${EXPERT_COMPTABLE.role}`,
        ].join('\n\n'),
      };
    });
    for (const n of aMener) await dbMajNonConformite(n.id, { relanceLe: le });
    setRelances(prets);
  }

  if (!nc.length) {
    return h('p', { className: 'bloc-carte-note' },
      'Aucune action corrective en cours : le registre des non-conformités est à jour.');
  }

  return h('div', { className: 'actions-correctives' },
    h('div', { className: 'actions-relance' },
      h('span', null, destinataires.length
        ? `${aMener.length} ${pluriel(aMener.length, 'action à mener', 'actions à mener')} · ${destinataires.length} ${pluriel(destinataires.length, 'collaborateur concerné', 'collaborateurs concernés')}`
        : 'Toutes les actions sont menées.'),
      h('button', { className: 'btn btn-primary', onClick: relancer, disabled: !destinataires.length },
        'Relancer les collaborateurs')
    ),
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
          [personneNom(dbAttributionDossier(n.dossier)) || null,
            n.echeance ? `échéance ${formatDate(n.echeance)}` : null,
            n.relanceLe ? `relancé le ${formatDate(n.relanceLe)}` : null].filter(Boolean).join(' · ')
          || 'Responsable et échéance à fixer')
      ),
      h(Pastille, { ton: n.efficacite ? 'vert' : (n.gravite === 'Mineure' ? 'orange' : 'rouge') },
        n.efficacite ? 'Menée' : n.gravite)
    )),
    h(PanneauRelances, { relances, onFermer: () => setRelances(null), showToast })
  );
}

/* Le bilan du contrôle : point par point, combien de dossiers de
   l'échantillon sont conformes. Un point est non conforme sur un dossier si
   ComplyEC y constate seul une anomalie, ou si une fiche de constat de la
   revue l'a relevé. */
function bilanControle() {
  const retenus = echantillonRetenu();
  const nc = dbNonConformites().filter(n => n.origine === 'Revue annuelle de surveillance');
  const lignes = pointsControleRetenus().map(p => {
    const nonConformes = retenus.filter(d =>
      constatsAutomatiques(d).some(c => c.point === p.code)
      || nc.some(n => n.dossier === d && n.point === p.code)).length;
    /* Un point que ComplyEC ne sait pas vérifier seul n'est compté conforme
       que faute de constat inscrit : l'écran le signale. */
    const manuel = !POINTS_ANOMALIES[p.code] && p.code !== 'vigilance';
    return { code: p.code, label: p.label, total: retenus.length, conformes: retenus.length - nonConformes, manuel };
  });
  const total = lignes.reduce((n, l) => n + l.total, 0);
  const conformes = lignes.reduce((n, l) => n + l.conformes, 0);
  return { lignes, total, conformes, horsPoints: nc.filter(n => !n.point).length };
}

/* L'évaluation annuelle : une page de bilan. À gauche l'anneau, qui dit d'un
   coup d'œil la part des points conformes ; à droite le détail par point de
   contrôle. En bas, la conclusion que la norme demande de porter, et qui
   valide l'étape. */
function EvaluationConclusion({ showToast }) {
  useDonnees();
  const faites = dbSurveillance();
  const enregistree = faites.evaluation || {};
  const [choix, setChoix] = useState(enregistree.conclusion || '');
  const [note, setNote] = useState(enregistree.note || '');
  const b = bilanControle();
  const part = b.total ? Math.round((b.conformes / b.total) * 100) : 0;

  async function enregistrer() {
    if (!choix) { showToast('Choisissez une conclusion.'); return; }
    await dbValiderEtapeSurveillance('evaluation', { conclusion: choix, note });
    showToast('Évaluation annuelle enregistrée.');
  }

  const TEINTES = ['bleu', 'violet', 'ambre', 'rouge', 'vert', 'cyan', 'rose', 'acier'];

  return h('div', { className: 'evaluation-bilan' },
    h('div', { className: 'evaluation-haut-deux' },
      h('div', { className: 'evaluation-jauge' },
        h(AnneauProgression, { valeur: part }),
        h('p', { className: 'evaluation-legende' }, 'Points conformes'),
        h('div', { className: 'evaluation-compteurs' },
          h('span', { className: 'evaluation-compteur ok' }, `${b.conformes} conformes`),
          h('span', { className: 'evaluation-compteur ko' }, `${b.total - b.conformes} non conformes`))
      ),
      h('div', { className: 'evaluation-detail' },
        b.lignes.map((l, i) => h('div', { key: l.code, className: 'evaluation-barre' },
          h('span', { className: 'evaluation-barre-nom' }, l.label,
            l.manuel ? h('span', { className: 'evaluation-manuel', title: 'Vérifié à la main : compté conforme faute de constat inscrit' }, ' *') : null),
          h('span', { className: 'evaluation-barre-piste' },
            h('span', {
              className: cx('evaluation-barre-remplie', 'teinte-' + TEINTES[i % TEINTES.length]),
              style: { width: (l.total ? Math.round((l.conformes / l.total) * 100) : 0) + '%' },
            })),
          h('span', { className: 'evaluation-barre-compte' }, `${l.conformes} / ${l.total}`))),
        b.lignes.some(l => l.manuel)
          ? h('p', { className: 'evaluation-note' },
            '* Point que ComplyEC ne vérifie pas seul : il est compté conforme tant qu’aucun constat n’est inscrit à l’étape 4.')
          : null,
        b.horsPoints
          ? h('p', { className: 'evaluation-note' },
            `${b.horsPoints} ${pluriel(b.horsPoints, 'constat de la revue n’est rattaché', 'constats de la revue ne sont rattachés')} à aucun point de contrôle.`)
          : null
      )
    ),
    h('div', { className: 'evaluation-conclusion' },
      h('div', { className: 'evaluation-conclusion-choix' },
        h('span', { className: 'champ-label' }, 'Conclusion sur le système de management de la qualité'),
        h('div', { className: 'toggle-pair' },
          EVALUATION_CONCLUSIONS.map(c => h('button', {
            key: c.code, type: 'button',
            className: cx('toggle-btn', choix === c.code && 'selected yes'),
            onClick: () => setChoix(c.code),
          }, c.label)))
      ),
      h('input', {
        className: 'form-input evaluation-motivation',
        placeholder: 'Motivation : ce qui fonde la conclusion — c’est la phrase qu’un contrôleur lira.',
        'aria-label': 'Motivation de la conclusion',
        value: note, onChange: e => setNote(e.target.value),
      }),
      h('button', { className: 'btn btn-primary', onClick: enregistrer, disabled: !choix },
        enregistree.conclusion ? 'Mettre à jour l’évaluation' : 'Enregistrer l’évaluation')
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
