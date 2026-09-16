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

/* Le parcours guidé en quatre étapes de la version précédente a disparu avec
   l'ancienne arborescence : le manuel se remplit désormais en trois étapes
   dans « Préparer le contrôle ». Sa génération, elle, n'a pas bougé.

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

/* =====================================================================
   REFONTE — Rubrique « Manuel de procédures » (§ 6)
   =====================================================================

   Un formulaire en trois étapes, et rien de plus. L'objectif n'est pas de
   faire écrire le manuel au cabinet : c'est de lui demander les quelques
   informations que ComplyEC ne peut pas deviner, puis de produire le document.

   La rédaction elle-même, le plan en six parties et les textes réglementaires
   ne sont pas touchés : ils sont validés, et le § 17 les met hors de portée. */

function RubriqueManuel({ showToast, cabinetSettings, navigateEc }) {
  const cab = dbManuelCabinet();
  const premiereOuverte = MANUEL_ETAPES.find(e => !(cab[e.code] && cab[e.code].valideeLe));
  const [etape, setEtape] = useState(premiereOuverte ? premiereOuverte.code : 'cabinet');
  const version = manuelVersionEnVigueur();
  const validees = MANUEL_ETAPES.filter(e => cab[e.code] && cab[e.code].valideeLe).length;
  const complet = validees === MANUEL_ETAPES.length;

  async function publier() {
    const precedentes = dbManuelVersions();
    const numero = 'v' + (precedentes.length + 1);
    await dbPublierManuel({ numero, objet: 'Manuel établi à partir du formulaire cabinet.' });
    showToast(`Manuel publié en version ${numero}.`);
  }

  return h(RubriquePage, {
    titre: 'Manuel de procédures',
    actions: complet
      ? h(React.Fragment, null,
        version
          ? h(Pastille, { ton: 'vert' }, `Version ${version.numero} en vigueur depuis le ${formatDate(version.dateEffet)}`)
          : null,
        h('button', { className: 'btn btn-primary', onClick: publier },
          version ? 'Publier une nouvelle version' : 'Publier le manuel')
      )
      : null,
  },
    h('div', { className: 'programme-chemin programme-chemin-large' },
      MANUEL_ETAPES.map((e, i) => h(React.Fragment, { key: e.code },
        i ? h('span', { className: 'programme-lien', 'aria-hidden': 'true' }) : null,
        h('button', {
          className: cx('programme-bloc', etape === e.code && 'actif',
            cab[e.code] && cab[e.code].valideeLe && 'faite'),
          onClick: () => setEtape(e.code),
        },
          h('span', { className: 'programme-rang' },
            cab[e.code] && cab[e.code].valideeLe ? '✓' : i + 1),
          h('span', { className: 'programme-label' }, e.label)
        )
      ))
    ),

    etape === 'cabinet' ? h(EtapeCabinetActivite, { showToast, onSuivant: () => setEtape('equipe') })
      : etape === 'equipe' ? h(EtapeEquipe, { showToast, onSuivant: () => setEtape('informatique') })
        : h(EtapeInformatique, { showToast, onSuivant: () => setEtape('cabinet') })
  );
}

/* Pied d'étape : le bouton qui valide, et rien d'autre. Une étape validée
   garde la trace de sa date — c'est ce qui fait le décompte du chemin. */
function PiedEtapeManuel({ code, valideeLe, onValider, libelle }) {
  return h('div', { className: 'etape-pied' },
    valideeLe
      ? h(Pastille, { ton: 'vert' }, `Validée le ${formatDate(valideeLe)}`)
      : h('span', { className: 'etape-pied-vide' }),
    h('button', { className: 'btn btn-primary', onClick: onValider },
      libelle || (valideeLe ? 'Enregistrer' : 'Valider cette étape'))
  );
}

// ------------------------------------------------ Étape 1 — Cabinet et activité

function EtapeCabinetActivite({ showToast, onSuivant }) {
  const enregistre = dbManuelCabinet().cabinet || {};
  const [form, setForm] = useState(Object.assign(
    { chiffreAffaires: '', dateCloture: '', tenue: '', revision: '', social: '', juridique: '', autres: '' },
    enregistre
  ));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  const total = MANUEL_ACTIVITES.reduce((n, a) => n + (Number(form[a.code]) || 0), 0);
  const clients = dbNombreDeClients();
  const importes = dbClientsImportes();

  async function valider() {
    await dbMajManuelCabinet({
      cabinet: Object.assign({}, form, { valideeLe: new Date().toISOString().slice(0, 10) }),
    });
    showToast('Étape « Cabinet et activité » validée.');
    onSuivant();
  }

  return h('div', { className: 'etape-carte' },
    h('div', { className: 'etape-grille-2' },
      h(ChampPanneau, {
        label: 'Chiffre d’affaires du dernier exercice', type: 'number', suffixe: '€',
        valeur: form.chiffreAffaires, onChange: v => maj('chiffreAffaires', v),
        aide: 'Sert aussi à calculer la part de chaque client dans la dépendance économique.',
      }),
      h(ChampPanneau, {
        label: 'Date de clôture du cabinet', type: 'date',
        valeur: form.dateCloture, onChange: v => maj('dateCloture', v),
      })
    ),

    h('div', { className: 'etape-section' },
      h('h3', null, 'Répartition de l’activité'),
      h('div', { className: 'repartition-grille' },
        MANUEL_ACTIVITES.map(a => h(ChampPanneau, {
          key: a.code, label: a.label, type: 'number', suffixe: '%',
          valeur: form[a.code], onChange: v => maj(a.code, v),
        }))
      ),
      h('p', { className: cx('repartition-total', total !== 100 && total > 0 && 'ecart') },
        `Total : ${total} %`,
        total !== 100 && total > 0 ? ' — la somme ne fait pas 100 %.' : ''
      )
    ),

    h('div', { className: 'etape-section' },
      h('h3', null, 'Liste des clients'),
      importes.length
        ? h('div', { className: 'import-resume' },
          h(Pastille, { ton: 'vert' }, `${importes.length} ${pluriel(importes.length, 'client importé', 'clients importés')}`),
          h(ImportClients, { showToast, libelle: 'Réimporter un fichier Excel' })
        )
        : h(ImportClients, { showToast, libelle: 'Importer un fichier Excel' }),
      h('p', { className: 'champ-aide' },
        `${clients} ${pluriel(clients, 'dossier suivi', 'dossiers suivis')} — le nombre se compte, il ne se saisit pas. `
        + `Clôture retenue pour les dossiers clients : ${CLOTURE_CLIENTS_RETENUE}.`)
    ),

    h(PiedEtapeManuel, { code: 'cabinet', valideeLe: enregistre.valideeLe, onValider: valider })
  );
}

/* L'import de la liste clients : un bouton, un aperçu, une validation.
   Les colonnes sont reconnues quel que soit leur intitulé exact ; celles qui ne
   le sont pas se choisissent à la main, plutôt que de faire échouer l'import. */
function ImportClients({ showToast, libelle }) {
  const [lignes, setLignes] = useState(null);
  const [entetes, setEntetes] = useState([]);
  const [mapping, setMapping] = useState({});
  const [erreur, setErreur] = useState(null);
  const champ = useRef(null);

  async function lire(e) {
    const fichier = e.target.files && e.target.files[0];
    if (!fichier) return;
    setErreur(null);
    try {
      const brut = await parseFeuilleDeCalcul(fichier);
      if (!brut.length) throw new Error('Ce fichier ne contient aucune ligne.');
      const cols = Object.keys(brut[0]);
      // Reconnaissance automatique : on cherche, pour chaque colonne attendue,
      // un intitulé qui contient l'un de ses motifs.
      const auto = {};
      IMPORT_CLIENTS_COLONNES.forEach(c => {
        const trouve = cols.find(k => c.motifs.some(m => normaliseEntete(k).includes(normaliseEntete(m))));
        if (trouve) auto[c.code] = trouve;
      });
      setEntetes(cols);
      setMapping(auto);
      setLignes(brut);
    } catch (err) {
      setErreur(err.message || 'Impossible de lire ce fichier.');
      setLignes(null);
    }
  }

  function annuler() {
    setLignes(null); setErreur(null); setMapping({}); setEntetes([]);
    if (champ.current) champ.current.value = '';
  }

  async function valider() {
    if (!mapping.nom) { showToast('Indiquez quelle colonne porte le nom du client.'); return; }
    const prepare = lignes.map(l => ({
      nom: String(l[mapping.nom] || '').trim(),
      siren: mapping.siren ? String(l[mapping.siren] || '').trim() : '',
      forme: mapping.forme ? String(l[mapping.forme] || '').trim() : '',
      collaborateur: mapping.collaborateur ? String(l[mapping.collaborateur] || '').trim() : '',
    })).filter(l => l.nom);
    if (!prepare.length) { showToast('Aucune ligne ne porte de nom de client.'); return; }
    await dbImporterListeClients(prepare);
    showToast(`${prepare.length} ${pluriel(prepare.length, 'client importé', 'clients importés')}.`);
    annuler();
  }

  if (!lignes) {
    return h('div', null,
      h('label', { className: 'btn btn-primary' },
        libelle,
        h('input', {
          type: 'file', accept: '.xlsx,.xls,.csv', style: { display: 'none' },
          ref: champ, onChange: lire,
        })
      ),
      erreur ? h('p', { className: 'champ-erreur' }, erreur) : null
    );
  }

  const apercu = lignes.slice(0, 5);
  return h('div', { className: 'import-panneau' },
    h('div', { className: 'import-mapping' },
      IMPORT_CLIENTS_COLONNES.map(c => h('label', { className: 'import-mapping-ligne', key: c.code },
        h('span', null, c.label, c.obligatoire ? ' *' : ''),
        h('select', {
          className: 'champ-saisie',
          value: mapping[c.code] || '',
          onChange: e => setMapping(m => Object.assign({}, m, { [c.code]: e.target.value })),
        },
          h('option', { value: '' }, '— aucune —'),
          entetes.map(k => h('option', { key: k, value: k }, k))
        )
      ))
    ),
    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          IMPORT_CLIENTS_COLONNES.map(c => h('th', { key: c.code }, c.label)))),
        h('tbody', null, apercu.map((l, i) => h('tr', { key: i },
          IMPORT_CLIENTS_COLONNES.map(c => h('td', { key: c.code },
            mapping[c.code] ? String(l[mapping[c.code]] || '') : h('span', { className: 'cellule-vide' }, '—')))
        )))
      )
    ),
    h('div', { className: 'import-pied' },
      h('span', null, `${lignes.length} ${pluriel(lignes.length, 'ligne lue', 'lignes lues')} — ${apercu.length} ${pluriel(apercu.length, 'affichée', 'affichées')}.`),
      h('button', { className: 'btn btn-secondary btn-sm', onClick: annuler }, 'Annuler'),
      h('button', { className: 'btn btn-primary btn-sm', onClick: valider }, 'Valider l’import')
    )
  );
}

// ---------------------------------------------------------- Étape 2 — Équipe

function EtapeEquipe({ showToast, onSuivant }) {
  const enregistre = dbManuelCabinet().equipe || {};
  const [form, setForm] = useState(Object.assign(
    { serviceSocialDistinct: false, bureauSecondaire: false, bureauEffectif: 0 },
    enregistre
  ));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));
  const effectif = MANUEL_EQUIPE_CATEGORIES.reduce((n, c) => n + (Number(form[c.code]) || 0), 0);

  async function valider() {
    await dbMajManuelCabinet({
      equipe: Object.assign({}, form, { valideeLe: new Date().toISOString().slice(0, 10) }),
    });
    showToast('Étape « Équipe » validée.');
    onSuivant();
  }

  return h('div', { className: 'etape-carte' },
    h('div', { className: 'compteurs-liste' },
      MANUEL_EQUIPE_CATEGORIES.map(c => h(CompteurPanneau, {
        key: c.code, label: c.label,
        valeur: form[c.code] || 0,
        onChange: v => maj(c.code, v),
      }))
    ),
    h('p', { className: 'repartition-total' }, `Effectif total : ${effectif} ${pluriel(effectif, 'personne', 'personnes')}`),

    h('div', { className: 'etape-section' },
      h(BasculePanneau, {
        label: 'Service social distinct',
        valeur: form.serviceSocialDistinct,
        onChange: v => maj('serviceSocialDistinct', v),
      }),
      h(BasculePanneau, {
        label: 'Bureau secondaire',
        valeur: form.bureauSecondaire,
        onChange: v => maj('bureauSecondaire', v),
      }),
      form.bureauSecondaire
        ? h(CompteurPanneau, {
          label: 'Collaborateurs concernés',
          valeur: form.bureauEffectif || 0,
          onChange: v => maj('bureauEffectif', v),
        })
        : null
    ),

    h(PiedEtapeManuel, { code: 'equipe', valideeLe: enregistre.valideeLe, onValider: valider })
  );
}

// ----------------------------------- Étape 3 — Organisation informatique et moyens

function EtapeInformatique({ showToast, onSuivant }) {
  const enregistre = dbManuelCabinet().informatique || {};
  const [form, setForm] = useState(Object.assign({}, enregistre));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function valider() {
    await dbMajManuelCabinet({
      informatique: Object.assign({}, form, { valideeLe: new Date().toISOString().slice(0, 10) }),
    });
    showToast('Étape « Organisation informatique » validée.');
    onSuivant();
  }

  return h('div', { className: 'etape-carte' },
    h('div', { className: 'questionnaire' },
      MANUEL_INFORMATIQUE.map(q => {
        const reponse = form[q.code];
        const ouvre = q.suite && reponse === q.suite.si;
        return h('div', { className: 'question-ligne', key: q.code },
          h('div', { className: 'question-tete' },
            h('span', { className: 'question-label' }, q.label),
            h('div', { className: 'choix-options question-choix' },
              MANUEL_REPONSES.map(r => h('button', {
                key: r.code, type: 'button',
                className: cx('choix-option', reponse === r.code && 'actif'),
                'aria-pressed': reponse === r.code ? 'true' : 'false',
                onClick: () => maj(q.code, r.code),
              }, r.label))
            )
          ),
          /* Le champ de précision n'apparaît que lorsqu'il a un sens :
             l'interface se réduit d'elle-même. */
          ouvre
            ? h('div', { className: 'question-suite' },
              h(ChampPanneau, {
                label: q.suite.label, type: q.suite.type,
                valeur: form[q.suite.code] || '',
                onChange: v => maj(q.suite.code, v),
              })
            )
            : null
        );
      })
    ),
    h(PiedEtapeManuel, { code: 'informatique', valideeLe: enregistre.valideeLe, onValider: valider })
  );
}
