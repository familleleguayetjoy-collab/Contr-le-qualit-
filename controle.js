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
  { code: 'note_synthese_absente', label: 'Absentes', teinte: 'ambre' },
  { code: 'note_synthese_non_supervisee', label: 'Non supervisées', teinte: 'violet' },
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
        h('table', { className: 'tableau-moderne' },
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
                ? h(Pastille, { ton: 'violet' }, 'À superviser')
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

/* La vue d'ensemble : le pourcentage global, et une barre par rubrique.

   Une barre par rubrique, c'est le seul graphique qui dise quelque chose de
   vrai ici : chaque rubrique a un nombre d'obligations attendues et un nombre
   de couvertes, donc une proportion réelle, pas une note inventée. La barre
   montre ce rapport, et le compte exact est écrit à côté — un contrôleur qui
   demande « d'où sort ce chiffre » a la réponse à l'écran.

   Une rubrique sans rien à couvrir n'est pas à 0 % : elle est sans objet, et
   c'est ce qui s'affiche. Chaque barre mène à sa rubrique. */
function SyntheseVueEnsemble({ etat, navigateEc }) {
  return h('section', { className: 'synthese-ensemble' },
    h('div', { className: 'synthese-jauge' },
      h(AnneauProgression, { valeur: etat.completude }),
      h('p', { className: 'synthese-legende' }, 'Préparation'),
      h('p', { className: 'synthese-compte' },
        `${etat.couverts} sur ${etat.attendus} obligations couvertes`)
    ),
    h('div', { className: 'synthese-barres' },
      etat.rubriques.map(r => {
        const sansObjet = !r.attendus;
        const part = sansObjet ? 0 : Math.round((r.couverts / r.attendus) * 100);
        const ton = sansObjet ? 'neutre' : part === 100 ? 'vert' : part >= 50 ? 'ambre' : 'rouge';
        return h('button', {
          key: r.key,
          className: 'synthese-barre',
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
            sansObjet ? 'sans objet' : `${r.couverts}/${r.attendus}`)
        );
      })
    )
  );
}

function RubriqueSynthese({ navigateEc, cabinetSettings }) {
  const etat = etatPreparation(cabinetSettings);
  const graves = etat.toutesUrgences.filter(u => u.rang === 0).length;

  return h(RubriquePage, { titre: 'Synthèse du contrôle' },
    h('div', { className: 'synthese-corps' },
      h(SyntheseVueEnsemble, { etat, navigateEc }),

      h('section', { className: 'synthese-urgences' },
        h('h2', null, 'À traiter en priorité'),
        /* Combien de problèmes au total, et combien de graves : sans ce
           compte, quatre cartes toutes marquées « Grave » laissent croire
           qu'il n'y en a que quatre. */
        etat.toutesUrgences.length > etat.urgences.length
          ? h('p', { className: 'synthese-reste' },
            `${etat.toutesUrgences.length} ${pluriel(etat.toutesUrgences.length, 'problème ouvert', 'problèmes ouverts')}`
            + `, dont ${graves} ${pluriel(graves, 'grave', 'graves')}. Voici les quatre plus sérieux.`)
          : null,
        etat.urgences.length
          ? h('div', { className: 'urgences-grille' },
            /* Les quatre problèmes les plus graves, le plus grave en tête.
               Chacun porte son degré : c'est ce degré qui fait le classement,
               et l'afficher évite d'avoir à le deviner de l'ordre. */
            etat.urgences.map((u, i) => h('button', {
              key: i,
              className: cx('urgence-carte', 'gravite-' + u.gravite.ton),
              onClick: () => navigateEc(u.section, u.sub),
            },
              h('span', { className: 'urgence-gravite' }, u.gravite.label),
              h('span', { className: 'urgence-texte' }, u.libelle),
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
