/* ComplyEC — Préparer le contrôle
   ===============================

   Huit rubriques derrière un menu latéral léger. Pas huit grandes cartes
   colorées : ce n'est pas un choix qu'on fait une fois, c'est un classeur dans
   lequel on circule. Le menu reste donc visible et compact, et seul l'espace
   central change.

   Chaque rubrique vit dans le fichier qui porte déjà son métier — la
   surveillance dans qualite.js, la LCB-FT dans lbcft.js, le manuel dans
   manuel.js. Ce fichier-ci ne fait que les assembler, plus les deux rubriques
   qui n'ont pas de métier propre : la supervision, qui lit les anomalies, et la
   synthèse, qui compte. */

'use strict';

// -------------------------------------------------------- En-tête de rubrique

/* Un titre, et des actions à droite s'il y en a. Jamais de sous-titre ajouté
   pour remplir : si le titre suffit, il n'y a que le titre. */
function RubriqueEntete({ titre, actions, retour }) {
  return h('header', { className: cx('rubrique-entete', retour && 'avec-retour') },
    retour,
    h('h1', null, titre),
    actions ? h('div', { className: 'rubrique-actions' }, actions) : null
  );
}

/* `retour` n'apparaît que sur un écran ouvert par une carte de hub : il nomme
   le hub d'où l'on vient, pour qu'on n'ait pas à s'en souvenir. */
function RubriquePage({ titre, actions, retour, dense, children }) {
  return h('div', { className: cx('rubrique-page', dense && 'dense') },
    h(RubriqueEntete, { titre, actions, retour }),
    children
  );
}

// ----------------------------------------------- Rubrique 5 : Supervision
//
// Deux situations, pas une de plus (§ 10). Les données viennent du module
// Anomalies : aucune saisie n'est demandée ici, et rien n'y est stocké.

/* Deux situations qui n'appellent pas le même geste, donc deux couleurs.

   « Absentes » est une pièce qui manque : le collaborateur doit la déposer,
   c'est une relance. « Non supervisées » est un travail de l'expert-comptable
   lui-même : la note est là, elle attend sa revue. Les confondre enverrait la
   demande à la mauvaise personne. */
const SUPERVISION_VUES = [
  /* « Absentes » est une relance : la pièce est due par le collaborateur, et
     le bleu est la couleur des écrans où l'on écrit à quelqu'un.
     « Non supervisées » est le travail de l'expert-comptable : il prend le
     doré, qui est dans ce logiciel la couleur de ce qui attend une décision.
     Le violet précédent se lisait comme du bleu et les deux vues se
     confondaient. */
  { code: 'note_synthese_absente', label: 'Absentes', teinte: 'bleu' },
  { code: 'note_synthese_non_supervisee', label: 'Non supervisées', teinte: 'ambre' },
];

/* Le panneau de supervision d'une note de synthèse.

   Trois constats du collaborateur, cotés puis expliqués ; les sujets qu'il
   veut porter au rendez-vous bilan ; et son commentaire. L'expert-comptable
   lit cela, puis il écrit les deux choses que lui seul peut écrire : son
   retour sur le plan comptable, et ce qui est prévu pour l'assemblée générale
   ordinaire.

   Le retour comptable est obligatoire. Une supervision sans une ligne écrite
   n'est pas une supervision, et un contrôleur qui trouverait une case cochée
   sans commentaire le relèverait. */
function PanneauSupervision({ anomalie, onFermer, showToast }) {
  const dossierId = anomalie.dossier;
  const note = noteSyntheseDuDossier(dossierId);
  const deja = dbSupervisionDuDossier(dossierId);
  const [retour, setRetour] = useState(deja ? deja.retourComptable || '' : '');
  const [ago, setAgo] = useState(deja ? deja.ago || '' : '');

  const redacteur = note ? collaborateur(note.redigeePar) : null;

  async function superviser() {
    if (!retour.trim()) {
      showToast('Écrivez votre retour sur le plan comptable avant de superviser.');
      return;
    }
    await dbEnregistrerSupervision(dossierId, { retourComptable: retour.trim(), ago: ago.trim() });
    showToast('Note supervisée — votre retour est enregistré et daté.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: anomalie.dossierInfo ? anomalie.dossierInfo.nom : dossierId,
    sousTitre: note
      ? `Note de l’exercice ${note.exercice}, rédigée par ${redacteur ? redacteur.nom : note.redigeePar} le ${formatDate(note.redigeeLe)}`
      : 'Note au dossier, contenu non repris dans ComplyEC',
    onFermer, large: true,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
      h('button', { className: 'btn btn-primary', onClick: superviser },
        deja ? 'Mettre à jour la supervision' : 'Superviser la note')
    ),
  },
    note
      ? h(React.Fragment, null,
        h('section', { className: 'supervision-note' },
          h('h3', { className: 'supervision-sous-titre' }, 'Les constats du collaborateur'),
          h('div', { className: 'supervision-voyants' },
            NOTE_SYNTHESE_CONSTATS.map(c => {
              const constat = note[c.code];
              return h('div', { className: cx('supervision-voyant', tonConstat(constat)), key: c.code },
                h('span', { className: 'supervision-voyant-cle' }, c.label),
                h('span', { className: 'supervision-voyant-valeur' }, constat ? constat.label : '—')
              );
            })
          ),
          NOTE_SYNTHESE_CONSTATS.map(c => h('div', { className: 'supervision-bloc', key: c.code },
            h('div', { className: 'supervision-bloc-label' }, c.label),
            h('p', { className: 'supervision-bloc-texte' }, note[c.detail] || '—')
          )),
          h('div', { className: 'supervision-bloc', key: 'sujets' },
            h('div', { className: 'supervision-bloc-label' }, 'Sujets à évoquer au rendez-vous bilan'),
            h('p', { className: 'supervision-bloc-texte' }, note.sujets || '—')
          )
        ),
        h('section', { className: 'supervision-note' },
          h('h3', { className: 'supervision-sous-titre' }, 'Son commentaire'),
          h('p', { className: 'supervision-commentaire' }, note.commentaireCollab || '—')
        )
      )
      : h('p', { className: 'conf-detail' },
        'Le contenu de la note n’est pas repris dans ComplyEC pour ce dossier : ouvrez-la dans le dossier avant de la superviser.'),

    h('section', { className: 'supervision-retour' },
      h('h3', { className: 'supervision-sous-titre' }, 'Votre supervision'),
      h(ChampPanneau, {
        label: 'Retour sur le plan comptable',
        aide: 'Ce que vous répondez aux points soulevés, et ce qui reste à corriger avant la liasse.',
        valeur: retour, onChange: setRetour, lignes: 5,
      }),
      h(ChampPanneau, {
        label: 'Ce qui est prévu pour l’assemblée générale ordinaire',
        aide: 'Affectation du résultat, points à porter à l’ordre du jour, date envisagée.',
        valeur: ago, onChange: setAgo, lignes: 4,
      }),
      deja
        ? h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
          `Supervisée le ${formatDate(deja.revuLe)} par ${deja.par}.`)
        : null
    )
  );
}

function RubriqueSupervision({ navigateEc, cabinetSettings, showToast }) {
  const [vue, setVue] = useState('note_synthese_absente');
  const [ouverte, setOuverte] = useState(null);
  useDonnees();
  const toutes = anomaliesDeLOnglet('notes');
  const lignes = toutes.filter(a => a.type === vue);
  const delai = Number(cabinetSettings.relanceDelaiJours || CABINET_SETTINGS_DEFAUT.relanceDelaiJours);
  const vueCourante = SUPERVISION_VUES.find(v => v.code === vue);

  return h(RubriquePage, { titre: 'Supervision des dossiers' },
    h('div', { className: 'selecteurs-sobres' },
      SUPERVISION_VUES.map(v => {
        const n = toutes.filter(a => a.type === v.code).length;
        return h('button', {
          key: v.code,
          className: cx('selecteur-sobre', 'teinte-' + v.teinte, vue === v.code && 'actif'),
          onClick: () => setVue(v.code),
        },
          h('span', { className: 'selecteur-nombre' }, n),
          h('span', { className: 'selecteur-label' }, v.label)
        );
      })
    ),

    /* Une note absente se relance : c'est le collaborateur qui la doit. Une
       note non supervisée ne se relance pas : c'est l'expert-comptable qui la
       doit. Les deux tableaux ne portent donc ni les mêmes colonnes, ni le
       même geste — la pastille « À superviser » le dit, la phrase de rappel
       qui était ici ne faisait que le répéter. */
    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        /* Le bandeau du tableau porte la teinte de la vue ouverte : on voit
           d'un coup d'œil dans laquelle des deux on se trouve, même après
           avoir fait défiler la liste. */
        h('table', { className: cx('tableau-moderne', 'entete-teinte', 'teinte-' + vueCourante.teinte) },
          h('thead', null, h('tr', null,
            h('th', null, 'Dossier'),
            h('th', null, vue === 'note_synthese_non_supervisee' ? 'Rédigée par' : 'Collaborateur'),
            h('th', null, vue === 'note_synthese_non_supervisee' ? 'Rédigée le' : 'Détectée le'),
            vue === 'note_synthese_non_supervisee' ? null : h('th', null, 'Dernière relance'),
            h('th', null, 'Statut')
          )),
          h('tbody', null, lignes.map(l => {
            const st = statutAnomalie(l, delai);
            const note = noteSyntheseDuDossier(l.dossier);
            const superviser = vue === 'note_synthese_non_supervisee';
            return h('tr', {
              key: l.cle,
              className: 'ligne-cliquable',
              /* Une note absente emmène là où elle se relance, dans l'onglet
                 Anomalies. Une note à superviser ouvre le panneau de revue :
                 c'est ici que le travail se fait. */
              onClick: () => (superviser ? setOuverte(l) : navigateEc('anomalies', 'notes')),
            },
              h('td', { className: 'col-principale' }, l.dossierInfo ? l.dossierInfo.nom : l.dossier),
              h('td', null, l.collaborateurInfo ? l.collaborateurInfo.nom : '—'),
              h('td', { className: 'col-date' },
                formatDate(superviser && note ? note.redigeeLe : l.detecteLe)),
              superviser ? null : h('td', { className: 'col-date' },
                l.derniereRelance ? formatDate(l.derniereRelance) : '—'),
              h('td', null, superviser
                ? h(Pastille, { ton: 'orange' }, 'À superviser')
                : h(Pastille, { ton: st.ton }, st.label))
            );
          }))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '✓'),
        h('p', null, vue === 'note_synthese_absente'
          ? 'Toutes les notes de synthèse sont au dossier.'
          : 'Toutes les notes de synthèse ont été supervisées.')
      ),

    ouverte ? h(PanneauSupervision, {
      anomalie: ouverte,
      onFermer: () => setOuverte(null),
      showToast,
    }) : null
  );
}

// ------------------------------------------------- Rubrique 8 : Synthèse
//
// Un pourcentage, et au plus quatre urgences. Rien d'autre (§ 13).

/* L'anneau de progression. Fin, sobre, sans quadrillage ni légende : il donne
   une proportion, pas une analyse. */
function AnneauProgression({ valeur }) {
  const rayon = 66;
  const circonference = 2 * Math.PI * rayon;
  const rempli = circonference * Math.max(0, Math.min(100, valeur)) / 100;
  return h('div', { className: 'anneau' },
    h('svg', { viewBox: '0 0 160 160', 'aria-hidden': 'true', focusable: 'false' },
      h('circle', {
        cx: 80, cy: 80, r: rayon, fill: 'none',
        stroke: 'var(--sec-teal-bord)', strokeWidth: 9,
      }),
      h('circle', {
        cx: 80, cy: 80, r: rayon, fill: 'none',
        stroke: 'var(--sec-teal)', strokeWidth: 9, strokeLinecap: 'round',
        strokeDasharray: `${rempli} ${circonference}`,
        transform: 'rotate(-90 80 80)',
      })
    ),
    h('div', { className: 'anneau-valeur' },
      h('span', { className: 'anneau-nombre' }, valeur),
      h('span', { className: 'anneau-unite' }, '%')
    )
  );
}

/* La synthèse du contrôle, reprise le 22 septembre.

   Elle était juste et elle faisait peur : quatre cartes bordées de rouge sous
   un mot « GRAVE » en capitales, des barres rouges, un compte d'obligations et
   un décompte de problèmes. Un expert-comptable qui ouvre cet écran le lundi
   matin n'a pas besoin qu'on lui dise qu'il est en faute ; il a besoin de
   savoir par quoi commencer.

   Ce qui a changé, et pourquoi.

   Le rouge ne sert plus à dire « il reste à faire ». Une rubrique incomplète
   n'est pas une anomalie : c'est un travail en cours. Les barres vont donc du
   bleu au vert, et la couleur dit l'avancement, pas la faute.

   Les degrés de gravité restent — ils décident de l'ordre — mais ils se lisent
   sur une pastille, à leur taille, et non en bandeau. Les quatre premières
   choses à faire sont présentées comme une liste de travail numérotée, ce
   qu'elles sont.

   Les deux comptes ont été retirés : « 76 sur 128 obligations couvertes » et
   « 16 problèmes ouverts, dont 5 graves ». Le premier n'ajoutait rien à
   l'anneau qui le surplombe ; le second annonçait un chiffre décourageant
   avant de montrer ce qu'on peut faire. Les deux restent vrais et calculés :
   ils vivent dans les barres, rubrique par rubrique, où ils servent.

   L'écran prend toute la hauteur : la vue d'ensemble en haut, la liste de
   travail en dessous, qui s'étire jusqu'au bas. */

function SyntheseVueEnsemble({ etat, navigateEc }) {
  return h('section', { className: 'synthese-ensemble' },
    /* Sous l'anneau, trois chiffres qui répondent aux questions qu'on se pose
       en le regardant : combien de rubriques sont finies, combien
       d'obligations restent, combien de points urgents. La colonne de gauche
       était vide aux deux tiers ; elle porte maintenant l'essentiel. */
    h('div', { className: 'synthese-jauge' },
      h(AnneauProgression, { valeur: etat.completude }),
      h('p', { className: 'synthese-legende' }, 'Préparation au contrôle'),
      h('div', { className: 'synthese-chiffres' },
        /* Zéro rubrique couverte n'est pas une bonne nouvelle : la pastille
           reste neutre tant qu'il n'y a rien à saluer. */
        h('div', { className: cx('synthese-chiffre',
          etat.rubriques.filter(r => r.attendus && r.couverts >= r.attendus).length ? 'ton-fait' : 'ton-neutre') },
          h('span', { className: 'synthese-chiffre-valeur' },
            etat.rubriques.filter(r => r.attendus && r.couverts >= r.attendus).length),
          h('span', { className: 'synthese-chiffre-libelle' },
            'rubriques\ncouvertes')),
        h('div', { className: 'synthese-chiffre ton-engage' },
          h('span', { className: 'synthese-chiffre-valeur' },
            etat.rubriques.reduce((n, r) => n + Math.max(0, (r.attendus || 0) - (r.couverts || 0)), 0)),
          h('span', { className: 'synthese-chiffre-libelle' },
            'obligations\nà couvrir')),
        h('div', { className: cx('synthese-chiffre', etat.urgences.length ? 'ton-urgent' : 'ton-fait') },
          h('span', { className: 'synthese-chiffre-valeur' }, etat.urgences.length),
          h('span', { className: 'synthese-chiffre-libelle' },
            'points\nà traiter'))
      )
    ),
    h('div', { className: 'synthese-barres' },
      etat.rubriques.map(r => {
        const sansObjet = !r.attendus;
        const part = sansObjet ? 0 : Math.round((r.couverts / r.attendus) * 100);
        /* Trois états, et aucun n'est une faute : c'est fait, c'est engagé,
           c'est à commencer. */
        const ton = sansObjet ? 'neutre' : part === 100 ? 'fait' : part >= 50 ? 'engage' : 'debut';
        return h('button', {
          key: r.key,
          className: 'synthese-barre',
          title: sansObjet ? 'Rien à couvrir pour cette rubrique'
            : `${r.couverts} sur ${r.attendus} obligations couvertes`,
          onClick: () => navigateEc(r.key === 'anomalies' ? 'anomalies' : 'controle',
            r.key === 'anomalies' ? null : r.key),
        },
          h('span', { className: 'synthese-barre-nom' }, r.label),
          h('span', { className: 'synthese-barre-piste' },
            h('span', {
              className: cx('synthese-barre-remplie', 'ton-' + ton),
              style: { width: part + '%' },
            })
          ),
          h('span', { className: cx('synthese-barre-compte', sansObjet && 'sans-objet') },
            sansObjet ? 'sans objet' : part + ' %')
        );
      })
    )
  );
}

function RubriqueSynthese({ navigateEc, cabinetSettings }) {
  const etat = etatPreparation(cabinetSettings);

  return h(RubriquePage, { titre: 'Synthèse du contrôle' },
    h('div', { className: 'synthese-corps' },
      h(SyntheseVueEnsemble, { etat, navigateEc }),

      h('section', { className: 'synthese-urgences' },
        h('h2', null, 'Par quoi commencer'),
        etat.urgences.length
          ? h('div', { className: 'urgences-grille' },
            /* Une liste de travail : le rang se lit à gauche, le degré sur une
               pastille, et la carte mène à l'écran où l'on traite le sujet. */
            etat.urgences.map((u, i) => h('button', {
              key: i,
              className: cx('urgence-carte', 'gravite-' + u.gravite.ton),
              onClick: () => navigateEc(u.section, u.sub),
            },
              h('span', { className: 'urgence-rang' }, i + 1),
              h('span', { className: 'urgence-texte' }, u.libelle),
              h('span', { className: cx('urgence-gravite', 'gravite-' + u.gravite.ton) },
                u.gravite.label),
              h('span', { className: 'urgence-fleche' }, '→')
            ))
          )
          /* S'il ne reste rien, on ne complète pas la grille pour faire nombre :
             on le dit. */
          : h('div', { className: 'anomalies-vide' },
            h('span', { className: 'anomalies-vide-marque' }, '✓'),
            h('p', null, 'Aucune urgence : les obligations suivies par ComplyEC sont couvertes.')
          )
      )
    )
  );
}

// ------------------------------------------------------------- La coque

function ECPreparerControle({ rubrique, navigateEc, showToast, cabinetSettings, onChangerReglage, onApercuCollab }) {
  useDonnees();
  const actif = CONTROLE_RUBRIQUES.some(r => r.key === rubrique) ? rubrique : 'synthese';
  const commun = { navigateEc, showToast, cabinetSettings, onChangerReglage, onApercuCollab };

  let contenu;
  if (actif === 'manuel') contenu = h(RubriqueManuel, commun);
  else if (actif === 'independance') contenu = h(RubriqueIndependance, commun);
  else if (actif === 'formations') contenu = h(RubriqueFormations, commun);
  else if (actif === 'lbcft') contenu = h(RubriqueLbcft, commun);
  else if (actif === 'supervision') contenu = h(RubriqueSupervision, commun);
  else if (actif === 'surveillance') contenu = h(RubriqueSurveillance, commun);
  else if (actif === 'rgpd') contenu = h(RubriqueRgpd, commun);
  else contenu = h(RubriqueSynthese, commun);

  /* Plus de second menu latéral : les huit rubriques sont dans la barre de
     gauche, et doubler la colonne revenait à faire lire deux menus. */
  return h('div', { className: 'page page-controle' },
    h('div', { className: 'controle-contenu', key: actif }, contenu)
  );
}
