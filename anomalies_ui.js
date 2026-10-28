/* ComplyEC — L'écran Anomalies
   ============================

   L'outil de pilotage quotidien. Six onglets, et jamais de mélange entre eux :
   une lettre de mission absente et une note de synthèse non supervisée ne se
   traitent pas de la même manière, ne concernent pas les mêmes dossiers, et
   n'ont rien à faire dans le même tableau.

   Il n'existe donc aucune vue « toutes les anomalies ». Elle serait la seule
   chose que personne ne saurait quoi faire d'une fois affichée.

   Le geste central est la relance. On coche, on clique une fois, et ComplyEC
   regroupe : chaque collaborateur reçoit un seul message qui liste tout ce qui
   le concerne. */

'use strict';

// ------------------------------------------------------------ Panneau latéral

/* Un panneau qui glisse depuis la droite, plutôt qu'une modale plein écran.
   On garde le tableau sous les yeux, et la fermeture ne coûte rien — clic dans
   le vide, croix, ou touche Échap. */
function PanneauLateral({ ouvert, titre, sousTitre, onFermer, pied, large, children }) {
  useEffect(() => {
    if (!ouvert) return undefined;
    const surTouche = e => { if (e.key === 'Escape') onFermer(); };
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [ouvert, onFermer]);

  if (!ouvert) return null;
  return h('div', { className: 'panneau-fond', onClick: onFermer },
    h('aside', {
      className: cx('panneau', large && 'panneau-large'),
      role: 'dialog', 'aria-modal': 'true', 'aria-label': titre,
      onClick: e => e.stopPropagation(),
    },
      h('header', { className: 'panneau-entete' },
        h('div', { className: 'panneau-titres' },
          h('h2', null, titre),
          sousTitre ? h('p', null, sousTitre) : null
        ),
        h('button', { className: 'panneau-fermer', onClick: onFermer, 'aria-label': 'Fermer le panneau' }, '✕')
      ),
      h('div', { className: 'panneau-corps' }, children),
      pied ? h('footer', { className: 'panneau-pied' }, pied) : null
    )
  );
}

// ------------------------------------------------------------------- Statuts

/* Le statut d'une anomalie est un fait, pas un jugement : soit on n'a rien
   demandé, soit on a demandé et on attend, soit on attend depuis plus longtemps
   que le délai que le cabinet s'est donné. */
function statutAnomalie(a, delaiJours) {
  if (!a.derniereRelance) return { label: 'À régulariser', ton: 'orange' };
  const jours = joursDepuis(a.derniereRelance);
  if (jours !== null && jours > delaiJours) {
    return { label: `Relancée il y a ${jours} jours`, ton: 'rouge' };
  }
  return { label: 'Relancée', ton: 'bleu' };
}

function Pastille({ ton, children }) {
  return h('span', { className: `pastille pastille-${ton}` },
    h('span', { className: 'pastille-point' }), children);
}

// --------------------------------------------------------- Tableau commun
//
// Les cinq onglets qui listent des anomalies partagent exactement le même
// tableau : cohérence visuelle absolue entre les catégories (§ 4.2). Seules
// changent les colonnes affichées.

/* Le registre des bénéficiaires effectifs, ouvert dans un nouvel onglet :
   il se consulte avec le compte professionnel de l'expert-comptable. */
function ouvrirRegistreRbe() {
  const rbe = VIGILANCE_BASES.find(b => b.code === 'rbe');
  if (rbe && rbe.lien) window.open(rbe.lien, '_blank', 'noopener');
}

function TableauAnomalies({ lignes, colonneAnomalie, colonneSujet, selection, onSelection, delaiJours, vide, onSuperviser, modeCollab, onSignaler }) {
  /* Une ligne « pour l'expert-comptable » n'entre pas dans la sélection : elle
     ne se relance pas, elle se traite. Elle est donc exclue du « tout cocher »,
     sans quoi le bouton Relancer s'allumerait sur des lignes qu'il ignore. */
  const relancables = lignes.filter(l => !l.pourLEc);
  const toutesCochees = relancables.length > 0 && relancables.every(l => selection.indexOf(l.cle) >= 0);
  /* Quand le sujet de l'anomalie est une personne, elle est aussi celle qu'on
     relance : une colonne « Collaborateur » répéterait la première mot pour
     mot. */
  const colonneCollaborateur = colonneSujet !== 'Personne' && !modeCollab;

  function basculerTout() {
    onSelection(toutesCochees ? [] : relancables.map(l => l.cle));
  }
  function basculer(cle) {
    onSelection(selection.indexOf(cle) >= 0
      ? selection.filter(c => c !== cle)
      : selection.concat([cle]));
  }

  if (!lignes.length) {
    return h('div', { className: 'anomalies-vide' },
      h('span', { className: 'anomalies-vide-marque' }, '✓'),
      h('p', null, vide)
    );
  }

  return h('div', { className: 'tableau-moderne-enveloppe' },
    h('table', { className: 'tableau-moderne' },
      h('thead', null,
        h('tr', null,
          /* Pas de « tout cocher » quand aucune ligne ne se relance. */
          h('th', { className: 'col-case' },
            relancables.length
              ? h('input', {
                type: 'checkbox', checked: toutesCochees, onChange: basculerTout,
                'aria-label': 'Tout sélectionner',
              })
              : null
          ),
          h('th', null, colonneSujet),
          colonneAnomalie ? h('th', null, 'Anomalie') : null,
          colonneCollaborateur ? h('th', null, 'Collaborateur') : null,
          h('th', null, 'Détectée le'),
          h('th', null, 'Dernière relance'),
          h('th', null, 'Statut')
        )
      ),
      h('tbody', null,
        lignes.map(l => {
          const coche = selection.indexOf(l.cle) >= 0;
          const st = statutAnomalie(l, delaiJours);
          /* Ligne qui revient à l'expert-comptable : pas de case, et le clic
             emmène là où il la traite au lieu de la préparer pour un envoi. */
          if (l.pourLEc && modeCollab) {
            /* Côté collaborateur, la ligne se lit sans se traiter : le RBE se
               signale à l'expert-comptable, la supervision l'attend. */
            const estRbe = l.type === 'rbe_justificatif_absent';
            const signal = estRbe ? dbSignalementRbe(l.dossier) : null;
            return h('tr', { key: l.cle, className: 'ligne-pour-ec' },
              h('td', { className: 'col-case' }, ''),
              h('td', { className: 'col-principale' }, l.dossierInfo ? l.dossierInfo.nom : '—'),
              colonneAnomalie ? h('td', null, l.libelle) : null,
              h('td', { className: 'col-date' }, formatDate(l.detecteLe)),
              h('td', { className: 'col-date' }, '—'),
              h('td', null, estRbe
                ? (signal
                  ? h('span', { className: 'signal-fait' }, (() => {
                    const c = dbConsultationRbe(l.dossier);
                    return c && c.consulteLe && c.consulteLe >= signal.le
                      ? `✓ Consulté par l’expert-comptable le ${formatDate(c.consulteLe)}`
                      : `✓ Signalé le ${formatDate(signal.le)}`;
                  })())
                  : h('button', {
                    className: 'btn btn-secondary btn-ligne',
                    onClick: () => onSignaler && onSignaler(l),
                  }, 'Signaler à l’expert-comptable'))
                : h('span', { className: 'signal-attente' }, 'Chez l’expert-comptable'))
            );
          }
          if (l.pourLEc) {
            const estRbe = l.type === 'rbe_justificatif_absent';
            const signal = estRbe ? dbSignalementRbe(l.dossier) : null;
            return h('tr', {
              key: l.cle,
              className: 'ligne-cliquable ligne-pour-ec',
              onClick: () => onSuperviser && onSuperviser(l),
            },
              h('td', { className: 'col-case' }, ''),
              h('td', { className: 'col-principale' },
                /* Sur une anomalie RBE, le nom du dossier est un lien : il
                   ouvre le registre dans un autre onglet et, ici, le panneau
                   où l'on consigne ce qu'on y a vu. */
                estRbe
                  ? h('button', {
                    type: 'button',
                    className: 'lien-dossier',
                    title: 'Ouvrir le registre des bénéficiaires effectifs dans un nouvel onglet',
                    onClick: e => {
                      e.stopPropagation();
                      ouvrirRegistreRbe();
                      if (onSuperviser) onSuperviser(l);
                    },
                  }, l.dossierInfo ? l.dossierInfo.nom : '—', h('span', { className: 'lien-externe' }, '↗'))
                  : (l.dossierInfo ? l.dossierInfo.nom : '—'),
                /* Le collaborateur a demandé la consultation : l'expert-comptable
                   le voit sur la ligne même. */
                signal
                  ? h('span', { className: 'signal-recu' },
                    `Signalé par ${personneNom(signal.par) || signal.par} le ${formatDate(signal.le)}`)
                  : null),
              colonneAnomalie ? h('td', null, l.libelle) : null,
              colonneCollaborateur ? h('td', null, l.collaborateurInfo ? l.collaborateurInfo.nom : '—') : null,
              h('td', { className: 'col-date' }, formatDate(l.detecteLe)),
              h('td', { className: 'col-date' }, '—'),
              h('td', null, h('button', {
                className: 'btn btn-secondary btn-ligne',
                onClick: e => { e.stopPropagation(); if (onSuperviser) onSuperviser(l); },
              }, estRbe ? 'Consigner' : 'Superviser'))
            );
          }
          return h('tr', {
            key: l.cle,
            className: cx('ligne-cliquable', coche && 'ligne-cochee'),
            onClick: () => basculer(l.cle),
          },
            h('td', { className: 'col-case' },
              h('input', {
                type: 'checkbox', checked: coche,
                onChange: () => basculer(l.cle),
                onClick: e => e.stopPropagation(),
                'aria-label': `Sélectionner ${l.dossierInfo ? l.dossierInfo.nom : (l.personneInfo ? l.personneInfo.nom : '')}`,
              })
            ),
            h('td', { className: 'col-principale' },
              l.dossierInfo ? l.dossierInfo.nom : (l.personneInfo ? l.personneInfo.nom : '—'),
              l.detail && !colonneAnomalie ? h('span', { className: 'col-detail' }, l.detail) : null
            ),
            colonneAnomalie ? h('td', null, l.libelle) : null,
            colonneCollaborateur ? h('td', null, l.collaborateurInfo ? l.collaborateurInfo.nom : '—') : null,
            h('td', { className: 'col-date' }, formatDate(l.detecteLe)),
            h('td', { className: 'col-date' }, l.derniereRelance ? formatDate(l.derniereRelance) : '—'),
            h('td', null, h(Pastille, { ton: st.ton }, st.label))
          );
        })
      )
    )
  );
}

// --------------------------------------------------- Préparation des relances

/* Ce que la relance produit : un message par collaborateur, prêt à partir.

   L'envoi automatique n'est pas raccordé — ComplyEC le dit et ouvre la
   messagerie du cabinet avec le message déjà écrit. La date de génération, elle,
   est enregistrée quoi qu'il arrive : c'est elle qui alimente l'onglet Relances
   et la colonne « Dernière relance ». */
function PanneauRelances({ relances, onFermer, showToast }) {
  if (!relances || !relances.length) return null;

  function ouvrirMessagerie(r) {
    const elements = r.elements.map(e => Object.assign({}, e, { dossierInfo: e.dossier ? client(e.dossier) : null }));
    const sujet = encodeURIComponent(objetRelance(elements));
    const corps = encodeURIComponent(r.message);
    /* Le destinataire est prérempli quand l'adresse du collaborateur est
       connue — c'est le cas de ceux créés dans Paramètres. */
    const qui = collaborateur(r.collaborateur);
    const a = qui && qui.email ? encodeURIComponent(qui.email) : '';
    window.location.href = `mailto:${a}?subject=${sujet}&body=${corps}`;
  }

  function copier(r) {
    const zone = document.createElement('textarea');
    zone.value = r.message;
    document.body.appendChild(zone);
    zone.select();
    try { document.execCommand('copy'); showToast('Message copié.'); }
    catch (e) { showToast('La copie a échoué — sélectionnez le texte à la main.'); }
    document.body.removeChild(zone);
  }

  const total = relances.reduce((n, r) => n + r.elements.length, 0);

  return h(PanneauLateral, {
    ouvert: true,
    titre: relances.length > 1 ? `${relances.length} relances préparées` : 'Relance préparée',
    sousTitre: `${total} ${pluriel(total, 'élément regroupé', 'éléments regroupés')} — enregistrées au ${formatDate(relances[0].genereeLe)}`,
    onFermer, large: true,
    pied: h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
  },
    h(MentionCapacite, { cle: 'sendEmail' }),
    relances.map(r => {
      const p = collaborateur(r.collaborateur);
      return h('section', { className: 'relance-bloc', key: r.id },
        h('header', { className: 'relance-bloc-entete' },
          h('div', { className: 'avatar' }, p ? p.initiales : '?'),
          h('div', null,
            h('h3', null, p ? p.nom : r.collaborateur),
            h('span', null, `${r.elements.length} ${pluriel(r.elements.length, 'élément', 'éléments')}`)
          )
        ),
        h('pre', { className: 'relance-message' }, r.message),
        h('div', { className: 'relance-actions' },
          h('button', { className: 'btn btn-primary btn-sm', onClick: () => ouvrirMessagerie(r) },
            'Ouvrir dans ma messagerie'),
          h('button', { className: 'btn btn-tertiaire btn-sm', onClick: () => copier(r) }, 'Copier le message')
        )
      );
    })
  );
}

// ------------------------------------------------------- Onglet 5 : Relances

/* La question posée ici n'est pas « que reste-t-il à faire ? » mais « qui ai-je
   relancé, quand, pour quoi, et est-ce réglé ? ». D'où la présentation par
   personne, et non par dossier. */
function OngletRelances({ navigateEc }) {
  const groupes = relancesParCollaborateur();
  const [ouvert, setOuvert] = useState(groupes.length ? groupes[0].collaborateur : null);

  if (!groupes.length) {
    return h('div', { className: 'anomalies-vide' },
      h('span', { className: 'anomalies-vide-marque' }, '—'),
      h('p', null, 'Aucune relance n’a encore été adressée.')
    );
  }

  return h('div', { className: 'relances-liste' },
    groupes.map(g => {
      const deplie = ouvert === g.collaborateur;
      return h('section', { className: cx('relance-carte', deplie && 'deplie'), key: g.collaborateur },
        h('button', {
          className: 'relance-carte-entete',
          onClick: () => setOuvert(deplie ? null : g.collaborateur),
          'aria-expanded': deplie ? 'true' : 'false',
        },
          h('div', { className: 'avatar' }, g.collaborateurInfo.initiales),
          /* Le nom du collaborateur est la clé de lecture de cet écran : c'est
             par personne qu'on relance. Il porte donc la couleur, et le
             décompte des éléments a disparu — il est dans le tableau juste
             en dessous, ligne par ligne, là où il sert. */
          h('span', { className: 'relance-carte-nom' }, g.collaborateurInfo.nom),
          h('span', { className: 'relance-carte-date' },
            g.derniereRelance ? `Relancé le ${formatDate(g.derniereRelance)}` : ''),
          h('span', { className: cx('relance-chevron', deplie && 'ouvert') }, '›')
        ),
        deplie ? h('div', { className: 'tableau-moderne-enveloppe' },
          h('table', { className: 'tableau-moderne' },
            h('thead', null, h('tr', null,
              h('th', null, 'Dossier'),
              h('th', null, 'Nature de l’anomalie'),
              h('th', null, 'Date de relance'),
              h('th', null, 'Statut')
            )),
            h('tbody', null, g.elements.map(e => h('tr', { key: e.cle },
              h('td', { className: 'col-principale' }, e.dossierInfo ? e.dossierInfo.nom : 'Cabinet'),
              h('td', null, e.libelle),
              h('td', { className: 'col-date' }, formatDate(e.relanceLe)),
              h('td', null, e.reglee
                ? h(Pastille, { ton: 'vert' }, 'Réglé')
                : h(Pastille, { ton: 'orange' }, 'En attente'))
            )))
          )
        ) : null
      );
    })
  );
}

// ------------------------------------------------ Onglet 6 : Autres documents

const AUTRES_VIDES = {
  independance: 'Toutes les déclarations d’indépendance de la campagne sont signées.',
  formations: 'Toutes les attestations des sessions déjà tenues sont reçues.',
};

// ------------------------------------------- Consigner une consultation du RBE

/* Le panneau où l'expert-comptable consigne sa consultation du registre :
   la date, s'il a constaté des divergences et lesquelles, et le justificatif.
   Enregistré, il règle l'anomalie et alimente le suivi RBE de la LCB-FT.

   Le justificatif est retenu avec sa destination — le dossier permanent du
   client, sous-dossier « RBE ». Tant que le Drive n'est pas raccordé, il n'y
   est pas déposé, et le panneau le dit. */
function PanneauConsultationRbe({ anomalie, onFermer, showToast }) {
  const dossierId = anomalie.dossier;
  const nom = anomalie.dossierInfo ? anomalie.dossierInfo.nom : dossierId;
  const deja = dbConsultationRbe(dossierId) || {};
  const [le, setLe] = useState(deja.consulteLe || new Date().toISOString().slice(0, 10));
  const [divergence, setDivergence] = useState(deja.resultat === 'divergence' ? 'oui' : (deja.resultat ? 'non' : null));
  const [lesquelles, setLesquelles] = useState(deja.divergence || '');
  const [fichier, setFichier] = useState(deja.justificatif ? { name: deja.justificatif } : null);
  const champ = useRef(null);
  const destination = `${nom} / 00_Dossier permanent / RBE`;

  const complet = le && divergence && (divergence === 'non' || lesquelles.trim()) && fichier;

  async function enregistrer() {
    if (!complet) return;
    await dbEnregistrerSuiviRbe(dossierId, {
      consulteLe: le,
      par: 'martin',
      resultat: divergence === 'oui' ? 'divergence' : 'concordant',
      divergence: divergence === 'oui' ? lesquelles.trim() : null,
      justificatif: fichier.name,
      destination,
    });
    showToast(driveConnecte()
      ? `Consultation consignée — justificatif classé dans ${destination}.`
      : `Consultation consignée. Le justificatif est à classer dans ${destination} : le Drive n’est pas raccordé.`);
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true, large: true,
    titre: nom,
    sousTitre: 'Consultation du registre des bénéficiaires effectifs',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary', onClick: enregistrer, disabled: !complet,
        title: complet ? undefined : 'Renseignez la date, la réponse sur les divergences et joignez le justificatif.',
      }, 'Enregistrer la consultation')
    ),
  },
    h('button', { type: 'button', className: 'btn btn-secondary rbe-ouvrir', onClick: ouvrirRegistreRbe },
      'Ouvrir le registre (Comptexpert)', h('span', { className: 'lien-externe' }, '↗')),

    h(ChampPanneau, { label: 'Date de consultation', type: 'date', valeur: le, onChange: setLe }),

    h('div', { className: 'champ-panneau' },
      h('span', { className: 'champ-label' }, 'Avez-vous constaté des divergences ?'),
      h('div', { className: 'toggle-pair rbe-divergence' },
        [['non', 'Non'], ['oui', 'Oui']].map(([code, label]) => h('button', {
          key: code, type: 'button',
          className: cx('toggle-btn', divergence === code && (code === 'oui' ? 'selected no' : 'selected yes')),
          'aria-pressed': divergence === code ? 'true' : 'false',
          onClick: () => setDivergence(code),
        }, label))
      )
    ),
    divergence === 'oui'
      ? h(ChampPanneau, {
        label: 'Lesquelles ?', lignes: 4, valeur: lesquelles, onChange: setLesquelles,
        placeholder: 'Bénéficiaire absent du registre, pourcentage différent des statuts…',
      })
      : null,

    h('div', { className: 'champ-panneau' },
      h('span', { className: 'champ-label' }, 'Justificatif de consultation'),
      h('div', { className: 'rbe-justificatif' },
        h('button', { type: 'button', className: 'btn btn-secondary btn-sm', onClick: () => champ.current && champ.current.click() },
          fichier ? 'Remplacer le fichier' : 'Joindre le justificatif'),
        h('span', { className: cx('rbe-justificatif-nom', !fichier && 'vide') },
          fichier ? fichier.name : 'Aucun fichier joint')
      ),
      h('input', {
        ref: champ, type: 'file', accept: '.pdf,.png,.jpg,.jpeg',
        style: { display: 'none' }, tabIndex: -1, 'aria-hidden': 'true',
        onChange: e => { const f = e.target.files && e.target.files[0]; if (f) setFichier(f); e.target.value = ''; },
      }),
      h('p', { className: 'champ-aide' },
        driveConnecte()
          ? `Il sera rangé dans ${destination}.`
          : `Il ira dans ${destination}. Le Drive n’étant pas encore raccordé, rien n’y est déposé : le nom du fichier et sa destination sont conservés.`)
    )
  );
}

// ------------------------------------------------------------- L'écran entier

function ECAnomalies({ onglet, navigateEc, showToast, cabinetSettings }) {
  useDonnees();
  const actif = ongletAnomalies(onglet).code;
  const [selection, setSelection] = useState([]);
  const [filtreNotes, setFiltreNotes] = useState('toutes');
  const [filtreAutres, setFiltreAutres] = useState('independance');
  const [relancesPretes, setRelancesPretes] = useState(null);
  /* La note à superviser s'ouvre ici même. L'envoyer d'abord sur la rubrique
     Supervision ajouterait deux clics et un écran à retrouver, pour le même
     panneau. */
  const [aSuperviser, setASuperviser] = useState(null);
  const comptes = comptesParOnglet();
  const delai = Number(cabinetSettings.relanceDelaiJours || CABINET_SETTINGS_DEFAUT.relanceDelaiJours);

  // Changer d'onglet vide la sélection : relancer sur des lignes qu'on ne voit
  // plus serait la meilleure façon d'envoyer un message à côté.
  function allerOnglet(code) {
    setSelection([]);
    navigateEc('anomalies', code);
  }

  let lignes = [];
  if (actif !== 'relances') {
    lignes = anomaliesDeLOnglet(actif);
    if (actif === 'notes' && filtreNotes !== 'toutes') lignes = lignes.filter(l => l.type === filtreNotes);
    if (actif === 'autres') lignes = lignes.filter(l => l.groupe === filtreAutres);
  }

  const choisies = lignes.filter(l => selection.indexOf(l.cle) >= 0);

  function relancer() {
    const faites = preparerRelances(choisies.map(l => l.cle), cabinetSettings);
    setSelection([]);
    if (!faites.length) { showToast('Aucun collaborateur n’est rattaché à ces éléments.'); return; }
    setRelancesPretes(faites);
  }

  function marquerRegularise() {
    choisies.forEach(l => dbMarquerRegularise(l.cle, `${l.libelle} — ${l.dossierInfo ? l.dossierInfo.nom : (l.personneInfo ? l.personneInfo.nom : '')}`));
    const n = choisies.length;
    setSelection([]);
    showToast(`${n} ${pluriel(n, 'anomalie pointée régularisée', 'anomalies pointées régularisées')}.`);
  }

  const vides = {
    lettres: 'Toutes les lettres de mission sont au dossier.',
    identite: 'Toutes les pièces d’identité sont au dossier.',
    rbe: 'Tous les justificatifs de consultation du RBE sont au dossier.',
    notes: 'Toutes les notes de synthèse sont au dossier et supervisées.',
    autres: AUTRES_VIDES[filtreAutres],
  };

  /* Deux onglets portent leur propre couleur, dans les filtres comme dans le
     bandeau du tableau : le vert pour les notes de synthèse, le violet pour
     les autres documents. Les autres gardent le doré des anomalies. */
  return h('div', { className: cx('page page-anomalies', 'onglet-' + actif) },
    h('div', { className: 'anomalies-entete' },
      h('h1', null, 'Anomalies'),
      /* La ligne d'origine n'apparaît qu'une fois le connecteur branché, pour
         dire que la détection est automatique. Tant qu'il ne l'est pas, elle a
         été retirée de l'en-tête à la demande du cabinet : la mention reste
         portée par le panneau de relance, au moment où elle change quelque
         chose à ce qu'on s'apprête à faire. */
      driveConnecte()
        ? h('p', { className: 'anomalies-source' },
          'Détection automatique sur l’espace documentaire du cabinet.')
        : null
    ),

    h('div', { className: 'segments', role: 'tablist' },
      ANOMALIES_ONGLETS.map(o => h('button', {
        key: o.code,
        role: 'tab',
        'aria-selected': actif === o.code ? 'true' : 'false',
        className: cx('segment', actif === o.code && 'actif'),
        onClick: () => allerOnglet(o.code),
      },
        o.label,
        comptes[o.code] ? h('span', { className: 'segment-compte' }, comptes[o.code]) : null
      ))
    ),

    actif === 'relances'
      ? h(OngletRelances, { navigateEc })
      : h(React.Fragment, null,
        (actif === 'notes' || actif === 'autres')
          ? h('div', { className: 'filtres-internes' },
            (actif === 'notes' ? NOTES_FILTRES : AUTRES_FILTRES).map(f => h('button', {
              key: f.code,
              className: cx('filtre-interne', (actif === 'notes' ? filtreNotes : filtreAutres) === f.code && 'actif'),
              onClick: () => {
                setSelection([]);
                if (actif === 'notes') setFiltreNotes(f.code); else setFiltreAutres(f.code);
              },
            }, f.label))
          )
          : null,

        /* La phrase qui expliquait l'absence de case sur une note non
           supervisée a été retirée le 26 septembre, à la demande du cabinet :
           le bouton « Superviser » posé sur la ligne dit déjà quoi faire. */

        h(TableauAnomalies, {
          lignes,
          colonneAnomalie: actif === 'notes' || actif === 'autres',
          colonneSujet: actif === 'autres' ? 'Personne' : 'Dossier',
          selection, onSelection: setSelection,
          delaiJours: delai,
          vide: vides[actif],
          onSuperviser: setASuperviser,
        }),

        /* Les actions sont groupées, en bas, et n'apparaissent que lorsqu'elles
           ont un objet. Un bouton répété sur chaque ligne ferait le même travail
           en douze fois plus de clics. */
        /* La barre de relance n'a rien à faire sous un tableau dont aucune
           ligne ne se relance — celui du RBE, que l'expert-comptable règle
           lui-même. */
        lignes.some(l => !l.pourLEc) ? h('div', { className: cx('barre-actions', choisies.length && 'visible') },
          h('span', { className: 'barre-actions-compte' },
            choisies.length
              ? `${choisies.length} ${pluriel(choisies.length, 'élément sélectionné', 'éléments sélectionnés')}`
              : 'Cochez les éléments à traiter'),
          h('button', {
            className: 'btn btn-tertiaire',
            disabled: !choisies.length,
            onClick: marquerRegularise,
          }, 'Marquer régularisé'),
          h('button', {
            className: 'btn btn-primary',
            disabled: !choisies.length,
            onClick: relancer,
          }, 'Relancer')
        ) : null
      ),

    h(PanneauRelances, {
      relances: relancesPretes,
      onFermer: () => setRelancesPretes(null),
      showToast,
    }),

    /* `PanneauSupervision` vient de controle.js, chargé après ce fichier :
       la référence n'est lue qu'au rendu, donc l'ordre des scripts tient. */
    aSuperviser ? h(aSuperviser.type === 'rbe_justificatif_absent' ? PanneauConsultationRbe : PanneauSupervision, {
      anomalie: aSuperviser,
      onFermer: () => setASuperviser(null),
      showToast,
    }) : null
  );
}
