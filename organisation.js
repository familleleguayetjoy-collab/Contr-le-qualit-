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

function telechargerAttestationsIndependance(annee, reglages) {
  const pages = COLLABORATEURS.map((c, i) => `
    <div style="${i ? 'page-break-before:always;' : ''}">
      <p style="font-size:10pt; color:#555;">${docxEchapper(reglages.nom || '')}</p>
      <h1 style="font-size:16pt; margin-top:24pt;">Déclaration d’indépendance — exercice ${annee}</h1>
      <p style="margin-top:18pt;">Je soussigné(e) <b>${docxEchapper(c.nom)}</b>, ${docxEchapper(c.role)}, déclare :</p>
      <p style="text-align:justify;">— n’entretenir aucun lien personnel, financier ou professionnel susceptible
      d’altérer mon jugement dans l’exécution des missions qui me sont confiées ;</p>
      <p style="text-align:justify;">— m’engager à signaler sans délai toute situation de nature à compromettre
      cette indépendance.</p>
      <p style="font-size:9.5pt; color:#666; margin-top:14pt;">Articles 145 et suivants du décret n° 2012-432 du 30 mars 2012
      portant code de déontologie des professionnels de l’expertise comptable.</p>
      <p style="margin-top:36pt;">Fait à ………………………, le ……… / ……… / ${annee}</p>
      <p style="margin-top:28pt;">Signature :</p>
    </div>`).join('');

  downloadWordDoc(
    `Attestations_independance_${annee}.doc`,
    `Attestations d’indépendance ${annee}`,
    pages
  );
}

function BlocIndependanceCampagne({ showToast, cabinetSettings , sansTitre }) {
  const annee = currentCalendarYear();
  const campagne = dbCampagneIndependance(annee);
  const declarations = dbDeclarations(annee);
  const signees = declarations.filter(d => d.statut === 'signee').length;

  /* Le cahier veut le bouton disponible à compter du 1er janvier de chaque
     année : c'est toujours vrai pour l'année civile en cours, et le rappeler
     ici évite d'avoir à le vérifier ailleurs. */
  async function generer() {
    telechargerAttestationsIndependance(annee, cabinetSettings);
    await dbGenererAttestations(annee);
    showToast(`Attestations ${annee} générées et téléchargées.`);
  }

  async function diffuser() {
    await dbDiffuserAttestations(annee);
    showToast('Diffusion enregistrée.');
  }

  function etatDe(d) {
    if (d.statut === 'signee') return 'recue';
    if (campagne.diffuseeLe) return 'diffusee';
    if (campagne.genereeLe) return 'generee';
    return 'rien';
  }

  const marque = (vrai, ton) => h('span', { className: `marque marque-${vrai ? ton : 'gris'}` }, vrai ? '✓' : '—');

  return h('section', { className: 'bloc-carte' },
    h('header', { className: 'bloc-carte-entete' },
      h('h2', null, sansTitre ? `Campagne ${annee}` : `Campagne d’indépendance ${annee}`),
      h('div', { className: 'bloc-carte-actions' },
        h('button', {
          className: campagne.genereeLe ? 'btn btn-secondary btn-sm' : 'btn btn-primary',
          onClick: generer,
        }, campagne.genereeLe ? 'Régénérer les attestations' : 'Générer les attestations'),
        campagne.genereeLe && !campagne.diffuseeLe
          ? h('button', { className: 'btn btn-primary', onClick: diffuser }, 'Diffuser à tous les collaborateurs')
          : null
      )
    ),

    campagne.genereeLe
      ? h('p', { className: 'bloc-carte-note' },
        `Générées le ${formatDate(campagne.genereeLe)}`,
        campagne.diffuseeLe ? ` — diffusées le ${formatDate(campagne.diffuseeLe)}` : '',
        ` — ${signees} ${pluriel(signees, 'reçue', 'reçues')} sur ${declarations.length}.`)
      : null,
    campagne.genereeLe && !campagne.diffuseeLe ? h(MentionCapacite, { cle: 'sendEmail' }) : null,

    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          h('th', null, 'Collaborateur'),
          h('th', null, 'Générée'),
          h('th', null, 'Diffusée'),
          h('th', null, 'Reçue')
        )),
        h('tbody', null, declarations.map(d => {
          const c = collaborateur(d.collaborateur);
          const e = etatDe(d);
          return h('tr', { key: d.collaborateur },
            h('td', { className: 'col-principale' }, c ? c.nom : d.collaborateur),
            h('td', null, marque(!!campagne.genereeLe, 'vert')),
            h('td', null, marque(!!campagne.diffuseeLe, 'vert')),
            h('td', null, e === 'recue'
              ? h('span', { className: 'marque marque-vert', title: `Signée le ${formatDate(d.dateSignature)}` }, '✓')
              : h('span', { className: 'marque marque-orange' }, '●'))
          );
        }))
      )
    )
  );
}

function BlocDependanceEconomique({ showToast, cabinetSettings , sansTitre }) {
  const seuil = Number(cabinetSettings.seuilDependance || SEUIL_DEPENDANCE_DEFAUT);
  const lignes = dbDependanceLignes();
  const [edite, setEdite] = useState(null);

  return h('section', { className: 'bloc-carte' },
    h('header', { className: 'bloc-carte-entete' },
      sansTitre ? h('span', { className: 'bloc-carte-note' }, `Seuil retenu : ${pourcent(seuil)} du chiffre d’affaires.`) : h('h2', null, 'Dépendance économique'),
      h('div', { className: 'bloc-carte-actions' },
        h('button', {
          className: 'btn btn-primary',
          onClick: () => setEdite({ id: null, client: '', honoraires: '', analyse: '', mesure: '' }),
        }, 'Ajouter une ligne')
      )
    ),
    sansTitre ? null : h('p', { className: 'bloc-carte-note' },
      `Seuil retenu par le cabinet : ${pourcent(seuil)} du chiffre d’affaires.`),

    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Client / groupe'),
            h('th', null, 'Honoraires'),
            h('th', null, '% du CA'),
            h('th', null, 'Analyse'),
            h('th', null, 'Mesure de sauvegarde')
          )),
          h('tbody', null, lignes.map(l => h('tr', {
            key: l.id, className: 'ligne-cliquable', onClick: () => setEdite(l),
          },
            h('td', { className: 'col-principale' }, l.client),
            h('td', { className: 'col-date' }, euros(l.honoraires)),
            h('td', { className: 'col-date' },
              h('span', { className: l.part >= seuil ? 'part-au-dessus' : '' }, pourcent(l.part, 1))),
            h('td', null, l.analyse || h('span', { className: 'cellule-vide' }, 'À documenter')),
            h('td', null, l.mesure || h('span', { className: 'cellule-vide' }, 'À documenter'))
          )))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '—'),
        h('p', null, 'Aucun client ne dépasse le seuil de dépendance.')
      ),

    edite ? h(PanneauDependance, {
      ligne: edite, seuil,
      onFermer: () => setEdite(null),
      showToast,
    }) : null
  );
}

/* Édition d'une ligne de dépendance, en panneau latéral. */
function PanneauDependance({ ligne, seuil, onFermer, showToast }) {
  const [form, setForm] = useState({
    client: ligne.client || '',
    honoraires: ligne.honoraires || '',
    analyse: ligne.analyse || '',
    mesure: ligne.mesure || '',
  });
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function enregistrer() {
    if (!form.client.trim()) { showToast('Le nom du client est obligatoire.'); return; }
    await dbEnregistrerDependance(Object.assign({ id: ligne.id }, form));
    showToast('Ligne enregistrée.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: ligne.id ? form.client : 'Nouvelle ligne',
    sousTitre: 'Dépendance économique',
    onFermer,
    pied: h(React.Fragment, null,
      ligne.id ? h('button', {
        className: 'btn btn-tertiaire',
        onClick: async () => { await dbSupprimerDependance(ligne.id); showToast('Ligne supprimée.'); onFermer(); },
      }, 'Supprimer') : null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Enregistrer')
    ),
  },
    h(ChampPanneau, { label: 'Client ou groupe', valeur: form.client, onChange: v => maj('client', v) }),
    h(ChampPanneau, { label: 'Honoraires de l’exercice (€)', valeur: form.honoraires, onChange: v => maj('honoraires', v), type: 'number' }),
    h(ChampPanneau, { label: 'Analyse', valeur: form.analyse, onChange: v => maj('analyse', v), lignes: 3,
      aide: 'Ce qui explique la part, et ce qu’elle emporte pour l’indépendance du cabinet.' }),
    h(ChampPanneau, { label: 'Mesure de sauvegarde', valeur: form.mesure, onChange: v => maj('mesure', v), lignes: 3,
      aide: `Attendue au-delà de ${pourcent(seuil)}.` })
  );
}

/* Deux briques, donc deux cartes. Empilées sur une même page, elles
   obligeaient à faire défiler pour atteindre la seconde. */
const INDEPENDANCE_CARTES = [
  { key: 'attestations', label: 'Attestations d’indépendance', icone: 'signature', teinte: 'bleu' },
  { key: 'dependance', label: 'Dépendance économique', icone: 'balance', teinte: 'ambre' },
];

function RubriqueIndependance({ showToast, cabinetSettings }) {
  const [vue, setVue] = useState(null);

  if (!vue) {
    return h(RubriquePage, { titre: 'Indépendance' },
      h(CartesHub, { cartes: INDEPENDANCE_CARTES, onOuvrir: setVue, colonnes: 2 })
    );
  }

  const carte = INDEPENDANCE_CARTES.find(c => c.key === vue);
  return h(RubriquePage, {
    titre: carte.label,
    retour: h(RetourHub, { vers: 'Indépendance', onRetour: () => setVue(null) }),
  },
    vue === 'attestations'
      ? h(BlocIndependanceCampagne, { showToast, cabinetSettings, sansTitre: true })
      : h(BlocDependanceEconomique, { showToast, cabinetSettings, sansTitre: true })
  );
}

// -------------------------------------------------- Rubrique 3 : Formations
//
// Un registre, un bouton, quatre champs. Les formations LCB-FT ne sont pas un
// second registre : elles portent un indicateur et se retrouvent par un filtre.

const FORMATIONS_FILTRES = [
  { code: 'toutes', label: 'Toutes' },
  { code: 'internes', label: 'Internes' },
  { code: 'externes', label: 'Externes' },
  { code: 'lbcft', label: 'LCB-FT' },
];

function PanneauNouvelleFormation({ onFermer, showToast }) {
  const [form, setForm] = useState({
    nom: '', organisme: '', interne: false, lbcft: true,
    date: new Date().toISOString().slice(0, 10),
  });
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function enregistrer() {
    if (!form.nom.trim()) { showToast('Le nom de la formation est obligatoire.'); return; }
    if (!form.date) { showToast('La date est obligatoire.'); return; }
    await dbAjouterFormation(form);
    showToast('Formation ajoutée au registre.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: 'Nouvelle formation',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Ajouter')
    ),
  },
    h(ChampPanneau, { label: 'Nom', valeur: form.nom, onChange: v => maj('nom', v) }),
    h(ChampPanneau, { label: 'Organisme ou intervenant', valeur: form.organisme, onChange: v => maj('organisme', v) }),
    h(ChoixPanneau, {
      label: 'Nature',
      valeur: form.interne ? 'interne' : 'externe',
      options: [{ code: 'interne', label: 'Interne' }, { code: 'externe', label: 'Externe' }],
      onChange: v => maj('interne', v === 'interne'),
    }),
    h(ChampPanneau, { label: 'Date', valeur: form.date, onChange: v => maj('date', v), type: 'date' }),
    h(BasculePanneau, {
      label: 'Formation LCB-FT',
      aide: 'Permet de la retrouver dans la vue LCB-FT du registre.',
      valeur: form.lbcft,
      onChange: v => maj('lbcft', v),
    })
  );
}

function RubriqueFormations({ showToast }) {
  const [filtre, setFiltre] = useState('toutes');
  const [nouvelle, setNouvelle] = useState(false);
  const [ouverte, setOuverte] = useState(null);
  const toutes = dbRegistreFormations();

  const lignes = toutes.filter(f => {
    if (filtre === 'internes') return f.interne;
    if (filtre === 'externes') return !f.interne;
    if (filtre === 'lbcft') return f.lbcft;
    return true;
  });

  const detail = ouverte ? toutes.find(f => f.id === ouverte) : null;

  return h(RubriquePage, {
    titre: 'Formations',
    actions: h('button', { className: 'btn btn-primary', onClick: () => setNouvelle(true) }, '+ Ajouter une formation'),
  },
    h('div', { className: 'filtres-internes' },
      FORMATIONS_FILTRES.map(f => h('button', {
        key: f.code,
        className: cx('filtre-interne', filtre === f.code && 'actif'),
        onClick: () => setFiltre(f.code),
      }, f.label))
    ),

    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: 'tableau-moderne' },
          h('thead', null, h('tr', null,
            h('th', null, 'Formation'),
            h('th', null, 'Organisme'),
            h('th', null, 'Nature'),
            h('th', null, 'Date'),
            h('th', null, 'Attestations')
          )),
          h('tbody', null, lignes.map(f => {
            const recues = f.participants.filter(p => f.attestations[p] && f.attestations[p].recue).length;
            const passee = f.date <= new Date().toISOString().slice(0, 10);
            return h('tr', { key: f.id, className: 'ligne-cliquable', onClick: () => setOuverte(f.id) },
              h('td', { className: 'col-principale' },
                f.nom,
                f.lbcft ? h('span', { className: 'etiquette-lbcft' }, 'LCB-FT') : null),
              h('td', null, f.organisme || h('span', { className: 'cellule-vide' }, '—')),
              h('td', null, f.interne ? 'Interne' : 'Externe'),
              h('td', { className: 'col-date' }, formatDate(f.date)),
              h('td', null, passee
                ? h(Pastille, { ton: recues === f.participants.length ? 'vert' : 'orange' },
                  `${recues} / ${f.participants.length}`)
                : h(Pastille, { ton: 'gris' }, 'À venir'))
            );
          }))
        )
      )
      : h('div', { className: 'anomalies-vide' },
        h('span', { className: 'anomalies-vide-marque' }, '—'),
        h('p', null, 'Aucune formation ne correspond à ce filtre.')
      ),

    nouvelle ? h(PanneauNouvelleFormation, { onFermer: () => setNouvelle(false), showToast }) : null,
    detail ? h(PanneauFormation, { formation: detail, onFermer: () => setOuverte(null), showToast }) : null
  );
}

/* Détail d'une formation : qui y était, et de qui l'attestation manque. C'est
   cette absence qui alimente Anomalies > Autres documents — une seule source. */
function PanneauFormation({ formation, onFermer, showToast }) {
  async function recevoir(collabId) {
    await dbEnregistrerAttestation(formation.id, collabId);
    showToast('Attestation enregistrée.');
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: formation.nom,
    sousTitre: `${formation.interne ? 'Interne' : 'Externe'}${formation.organisme ? ' — ' + formation.organisme : ''} — ${formatDate(formation.date)}`,
    onFermer,
    pied: h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
  },
    h('div', { className: 'panneau-liste' },
      formation.participants.map(pid => {
        const c = collaborateur(pid);
        const a = formation.attestations[pid];
        return h('div', { className: 'panneau-ligne', key: pid },
          h('span', { className: 'panneau-ligne-nom' }, c ? c.nom : pid),
          a && a.recue
            ? h(Pastille, { ton: 'vert' }, `Reçue le ${formatDate(a.dateUpload)}`)
            : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => recevoir(pid) },
              'Marquer reçue')
        );
      })
    )
  );
}

// ------------------------------------- Rubrique 7 : Informatique, RGPD & IA
//
// Trois blocs, et aucun module « Sécurité informatique » (§ 12).

const RGPD_CARTES = [
  { key: 'traitements', label: 'Registre des traitements', icone: 'liste', teinte: 'bleu' },
  { key: 'prestataires', label: 'Prestataires', icone: 'prise', teinte: 'acier' },
  { key: 'charte', label: 'Charte IA', icone: 'etincelle', teinte: 'violet' },
];

function RubriqueRgpd({ showToast, cabinetSettings }) {
  const [vue, setVue] = useState(null);

  if (!vue) {
    return h(RubriquePage, { titre: 'Informatique, RGPD & IA' },
      h(CartesHub, { cartes: RGPD_CARTES, onOuvrir: setVue })
    );
  }

  const carte = RGPD_CARTES.find(c => c.key === vue);
  return h(RubriquePage, {
    titre: carte.label,
    retour: h(RetourHub, { vers: 'Informatique, RGPD & IA', onRetour: () => setVue(null) }),
  },
    vue === 'traitements' ? h(BlocRegistreTraitements, { showToast, sansTitre: true })
      : vue === 'prestataires' ? h(BlocPrestataires, { showToast, sansTitre: true })
        : h(BlocCharteIa, { showToast, cabinetSettings, sansTitre: true })
  );
}

/* Le registre des traitements — RGPD, article 30. Une liste à gauche, un
   panneau d'édition à droite : l'inverse d'un grand tableur à remplir. */
function BlocRegistreTraitements({ showToast , sansTitre }) {
  const traitements = dbTraitements();
  const [ouvert, setOuvert] = useState(null);
  const courant = ouvert === 'nouveau'
    ? { id: 't-' + Date.now(), finalite: '', role: '', base: '', personnes: '', donnees: '', support: '', duree: '', destinataires: '', transferts: '', derniereRevue: null }
    : traitements.find(t => t.id === ouvert);

  function genererRegistre() {
    const corps = traitements.map(t => `
      <h2 style="font-size:12pt; margin-top:16pt;">${docxEchapper(t.finalite)}</h2>
      <p style="margin:0 0 4pt;"><b>Rôle</b> : ${docxEchapper(t.role || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Base légale</b> : ${docxEchapper(t.base || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Personnes concernées</b> : ${docxEchapper(t.personnes || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Données</b> : ${docxEchapper(t.donnees || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Support</b> : ${docxEchapper(t.support || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Durée de conservation</b> : ${docxEchapper(t.duree || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Destinataires</b> : ${docxEchapper(t.destinataires || '—')}</p>
      <p style="margin:0 0 4pt;"><b>Transferts hors UE</b> : ${docxEchapper(t.transferts || '—')}</p>
      <p style="margin:0 0 4pt; font-size:9.5pt; color:#666;">Dernière revue : ${t.derniereRevue ? formatDateLong(t.derniereRevue) : 'jamais'}</p>`).join('');
    downloadWordDoc('Registre_des_traitements.doc', 'Registre des traitements',
      `<h1 style="font-size:16pt;">Registre des activités de traitement</h1>
       <p style="font-size:9.5pt; color:#666;">Établi en application de l’article 30 du règlement (UE) 2016/679.
       ${traitements.length} ${pluriel(traitements.length, 'traitement inscrit', 'traitements inscrits')}.</p>${corps}`);
    showToast('Registre généré.');
  }

  return h('section', { className: 'bloc-carte' },
    h('header', { className: 'bloc-carte-entete' },
      sansTitre ? h('span') : h('h2', null, 'Registre des traitements'),
      h('div', { className: 'bloc-carte-actions' },
        h('button', { className: 'btn btn-secondary btn-sm', onClick: genererRegistre }, 'Générer le registre'),
        h('button', { className: 'btn btn-primary btn-sm', onClick: () => setOuvert('nouveau') }, 'Ajouter un traitement')
      )
    ),
    h('div', { className: 'cartes-liste' },
      traitements.map(t => h('button', {
        key: t.id, className: 'carte-liste-item', onClick: () => setOuvert(t.id),
      },
        h('span', { className: 'carte-liste-titre' }, t.finalite),
        h('span', { className: 'carte-liste-sous' }, t.role || '—'),
        t.derniereRevue
          ? h(Pastille, { ton: 'vert' }, `Revu le ${formatDate(t.derniereRevue)}`)
          : h(Pastille, { ton: 'orange' }, 'Jamais revu')
      ))
    ),
    courant ? h(PanneauTraitement, {
      traitement: courant,
      nouveau: ouvert === 'nouveau',
      onFermer: () => setOuvert(null),
      showToast,
    }) : null
  );
}

const TRAITEMENT_CHAMPS = [
  { cle: 'finalite', label: 'Finalité' },
  { cle: 'role', label: 'Rôle du cabinet', aide: 'Responsable de traitement ou sous-traitant.' },
  { cle: 'base', label: 'Base légale' },
  { cle: 'personnes', label: 'Personnes concernées' },
  { cle: 'donnees', label: 'Données traitées', lignes: 2 },
  { cle: 'support', label: 'Support' },
  { cle: 'duree', label: 'Durée de conservation' },
  { cle: 'destinataires', label: 'Destinataires' },
  { cle: 'transferts', label: 'Transferts hors UE' },
];

function PanneauTraitement({ traitement, nouveau, onFermer, showToast }) {
  const [form, setForm] = useState(Object.assign({}, traitement));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  async function enregistrer(marquerRevu) {
    if (!String(form.finalite || '').trim()) { showToast('La finalité est obligatoire.'); return; }
    const aEcrire = Object.assign({}, form);
    if (marquerRevu) aEcrire.derniereRevue = new Date().toISOString().slice(0, 10);
    await dbEnregistrerTraitement(aEcrire);
    showToast(marquerRevu ? 'Traitement revu et enregistré.' : 'Traitement enregistré.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: nouveau ? 'Nouveau traitement' : form.finalite,
    sousTitre: 'Registre des traitements — article 30 du RGPD',
    onFermer, large: true,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-secondary', onClick: () => enregistrer(true) }, 'Enregistrer et marquer revu'),
      h('button', { className: 'btn btn-primary', onClick: () => enregistrer(false) }, 'Enregistrer')
    ),
  },
    TRAITEMENT_CHAMPS.map(c => h(ChampPanneau, {
      key: c.cle, label: c.label, aide: c.aide, lignes: c.lignes,
      valeur: form[c.cle] || '', onChange: v => maj(c.cle, v),
    }))
  );
}

/* Les prestataires sont déjà renseignés ailleurs : ils sont repris tels quels,
   jamais ressaisis (§ 12.2). Le dépôt d'un contrat est une action unique. */
function BlocPrestataires({ showToast , sansTitre }) {
  const prestataires = dbPrestataires();
  const contrats = dbContratsPrestataires();
  const champs = useRef({});

  async function deposer(id, fichier) {
    if (!fichier) return;
    await dbDeposerContratPrestataire(id, { nom: fichier.name, taille: fichier.size });
    showToast('Contrat rattaché au prestataire.');
  }

  return h('section', { className: 'bloc-carte' },
    sansTitre ? null : h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Prestataires')),
    h(CapabilityGate, {
      cle: 'drive',
      indisponible: h('p', { className: 'bloc-carte-note' },
        'Le contrat est rattaché au prestataire dans ComplyEC ; son dépôt dans le Drive suivra le paramétrage du connecteur.'),
    }),
    h('div', { className: 'prestataires-grille' },
      prestataires.map(p => {
        const contrat = contrats[p.id];
        return h('article', { className: 'prestataire-carte', key: p.id },
          h('h3', null, p.nom),
          h('p', { className: 'prestataire-type' }, p.type),
          contrat
            ? h('div', { className: 'prestataire-pied' },
              h(Pastille, { ton: 'vert' }, 'Contrat disponible'),
              h('span', { className: 'prestataire-fichier' }, contrat.nom))
            : h('div', { className: 'prestataire-pied' },
              h(Pastille, { ton: 'orange' }, 'Contrat manquant'),
              // Un vrai bouton : une étiquette autour d'un champ masqué ne
              // reçoit pas le focus au clavier.
              h('button', {
                className: 'btn btn-secondary btn-sm',
                onClick: () => champs.current[p.id] && champs.current[p.id].click(),
              }, 'Ajouter le contrat'),
              h('input', {
                type: 'file', style: { display: 'none' }, tabIndex: -1, 'aria-hidden': 'true',
                ref: el => { champs.current[p.id] = el; },
                onChange: e => deposer(p.id, e.target.files && e.target.files[0]),
              }))
        );
      })
    )
  );
}

/* La charte d'utilisation de l'IA. Rien tant qu'elle n'existe pas : un grand
   bouton, et c'est tout. Une fois créée, une carte qui dit son état. */
function BlocCharteIa({ showToast, cabinetSettings , sansTitre }) {
  const charte = dbCharteIa();
  const [edition, setEdition] = useState(false);

  return h('section', { className: 'bloc-carte' },
    sansTitre ? null : h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Charte IA')),
    charte
      ? h('div', { className: 'charte-carte' },
        h('div', { className: 'charte-etat' },
          h(Pastille, { ton: 'vert' }, 'Charte disponible'),
          h('span', { className: 'charte-date' }, `Dernière mise à jour le ${formatDate(charte.majLe)}`)
        ),
        h('div', { className: 'charte-actions' },
          h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => telechargerCharteIa(charte, cabinetSettings),
          }, 'Consulter'),
          h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setEdition(true) }, 'Modifier')
        )
      )
      : h('div', { className: 'charte-vide' },
        h('button', { className: 'btn btn-primary btn-lg', onClick: () => setEdition(true) }, 'Créer ma charte IA')
      ),
    edition ? h(PanneauCharteIa, {
      charte, cabinetSettings,
      onFermer: () => setEdition(false),
      showToast,
    }) : null
  );
}

/* Les quatre décisions qu'une charte d'utilisation de l'IA doit trancher dans
   un cabinet d'expertise comptable. Le cabinet choisit ; ComplyEC rédige. */
const CHARTE_IA_QUESTIONS = [
  { cle: 'usagesAutorises', label: 'Usages autorisés',
    options: ['Rédaction et reformulation uniquement', 'Rédaction, recherche et analyse', 'Aucun usage autorisé pour le moment'] },
  { cle: 'donneesClients', label: 'Données clients dans un outil d’IA',
    options: ['Interdit sans exception', 'Autorisé après anonymisation', 'Autorisé sur les outils validés par le cabinet'] },
  { cle: 'validation', label: 'Relecture des productions',
    options: ['Relecture systématique par un expert-comptable', 'Relecture par le chef de mission', 'Relecture selon la nature du livrable'] },
  { cle: 'outils', label: 'Outils admis',
    options: ['Uniquement les outils fournis par le cabinet', 'Outils fournis, plus outils déclarés', 'Libre, sous responsabilité du collaborateur'] },
];

function PanneauCharteIa({ charte, cabinetSettings, onFermer, showToast }) {
  const [form, setForm] = useState(Object.assign(
    { usagesAutorises: '', donneesClients: '', validation: '', outils: '', complements: '' },
    charte || {}
  ));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));
  const complet = CHARTE_IA_QUESTIONS.every(q => form[q.cle]);

  async function enregistrer() {
    if (!complet) { showToast('Répondez aux quatre questions avant d’enregistrer.'); return; }
    await dbEnregistrerCharteIa(form);
    showToast('Charte IA enregistrée.');
    onFermer();
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: charte ? 'Modifier la charte IA' : 'Créer ma charte IA',
    sousTitre: 'Quatre décisions, et le texte se rédige tout seul.',
    onFermer, large: true,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', { className: 'btn btn-primary', onClick: enregistrer, disabled: !complet },
        charte ? 'Enregistrer' : 'Créer la charte')
    ),
  },
    CHARTE_IA_QUESTIONS.map(q => h(ChoixPanneau, {
      key: q.cle, label: q.label,
      valeur: form[q.cle],
      options: q.options.map(o => ({ code: o, label: o })),
      colonne: true,
      onChange: v => maj(q.cle, v),
    })),
    h(ChampPanneau, {
      label: 'Précisions propres au cabinet', lignes: 3,
      valeur: form.complements || '', onChange: v => maj('complements', v),
    })
  );
}

function telechargerCharteIa(charte, cabinetSettings) {
  const sections = CHARTE_IA_QUESTIONS.map((q, i) => `
    <h2 style="font-size:12pt; margin-top:16pt;">${i + 1}. ${docxEchapper(q.label)}</h2>
    <p style="text-align:justify;">${docxEchapper(charte[q.cle] || '—')}</p>`).join('');
  downloadWordDoc('Charte_utilisation_IA.doc', 'Charte d’utilisation de l’IA',
    `<h1 style="font-size:16pt;">Charte d’utilisation de l’intelligence artificielle</h1>
     <p style="font-size:9.5pt; color:#666;">${docxEchapper((cabinetSettings || {}).nom || '')} — version du ${formatDateLong(charte.majLe)}.</p>
     ${sections}
     ${charte.complements ? `<h2 style="font-size:12pt; margin-top:16pt;">Précisions propres au cabinet</h2><p style="text-align:justify;">${docxEchapper(charte.complements)}</p>` : ''}`);
}

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

  if (fiche) return h(FicheFormation, { collabId: fiche, onBack: () => setFiche(null), showToast, navigateEc });

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
      actions: navigateEc
        ? h('button', { className: 'btn btn-primary', onClick: () => navigateEc('ressources', 'sessions') },
          '+ Ajouter une formation')
        : null,
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

function OrganisationResponsabilites({ onBack, showToast }) {
  const roles = dbRoles();
  const direction = roles.filter(r => r.famille === 'direction');
  const transverses = roles.filter(r => r.famille === 'transverse');
  const nonCouverts = rolesNonCouverts();
  const [edite, setEdite] = useState(null);
  const noms = [EXPERT_COMPTABLE.nom].concat(COLLABORATEURS.map(c => c.nom))
    .filter((n, i, t) => t.indexOf(n) === i);

  /* Chaque rôle porte son bouton Modifier. Un bouton unique « Modifier les
     responsables » en haut de page n'aurait pas dit lequel, et il affichait
     « (démonstration) » sans rien changer : l'expert-comptable croyait avoir
     désigné son déclarant Tracfin, et le manuel continuait d'imprimer
     l'ancien nom. */
  function ligneRole(role) {
    return h('div', { className: 'role-ligne', key: role.code },
      h('div', { className: 'role-corps' },
        h('div', { className: 'role-label' }, role.label),
        h('div', { className: 'role-fondement' }, role.fondement)
      ),
      role.titulaireEffectif
        ? h('span', { className: 'role-titulaire' }, role.titulaireEffectif)
        : h(Badge, { color: 'orange' }, 'non couvert'),
      h('button', {
        className: 'btn btn-secondary btn-sm',
        onClick: () => setEdite(role),
      }, '✏️ Modifier')
    );
  }

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Organisation & responsabilités',
      onRetour: onBack,
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
      : null,

    /* La désignation écrit dans la couche de données : le rôle change partout
       à la fois — gouvernance, LBC-FT, manuel, dossier de contrôle — et la
       modification est tracée au journal des validations. */
    edite
      ? h(FunctionalEditModal, {
        titre: `Désigner le titulaire — ${edite.label}`,
        libelle: edite.label,
        valeur: edite.titulaireEffectif,
        options: noms,
        aide: edite.fondement,
        onAnnuler: () => setEdite(null),
        onEnregistrer: async valeur => {
          await dbMajRole(edite.code, valeur);
          setEdite(null);
          showToast(`${edite.label} : ${valeur}.`);
        },
      })
      : null
  );
}

// ======================================================= S20 — Indépendance

/* Le patron campagne : une opération répétée sur plusieurs personnes, traitée
   ligne par ligne sans changer de page. Ce que faisaient déjà les deux listes
   de l'écran précédent, mais sur la forme commune à toutes les campagnes du
   produit — RBE, PPE, formation ciblée. */

function RegistreReclamations({ showToast, entete, encadre }) {
  const [choisie, setChoisie] = useState(null);
  const [ajout, setAjout] = useState(false);
  const reclamations = dbReclamations();
  const nonConformites = dbNonConformites();

  const colonnes = [
    { code: 'date', titre: 'Date', valeur: r => r.date, rendu: r => formatDate(r.date) },
    { code: 'dossier', titre: 'Dossier', classe: 'table-name', valeur: r => client(r.dossier).nom, rendu: r => client(r.dossier).nom },
    { code: 'objet', titre: 'Objet', valeur: r => r.objet, rendu: r => r.objet },
    { code: 'etat', titre: 'État', valeur: r => r.etat,
      rendu: r => h(Badge, { color: RECLAMATION_ETATS[r.etat].couleur }, RECLAMATION_ETATS[r.etat].label) },
  ];

  const courante = choisie ? reclamations.find(r => r.id === choisie) : null;
  // La non-conformité née d'une réclamation porte sa référence : c'est ce lien
  // qui évite de ressaisir le contexte, et qui permet de remonter d'une NC à
  // la plainte du client qui l'a provoquée.
  const ncLiee = courante ? nonConformites.find(n => n.reference === courante.id) : null;
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
          : h('button', {
            className: 'btn btn-primary btn-sm',
            onClick: async () => {
              await dbCloturerReclamation(courante.id, courante.reponse || 'Réponse apportée au client.');
              showToast(`Réclamation ${courante.id} clôturée.`);
            },
          }, 'Clôturer'),
        ncLiee
          /* On montre la date, pas l'identifiant : « nc-1789455360945 » ne
             dit rien à personne et débordait de la fiche. */
          ? h('span', { className: 'conf-note' }, 'Non-conformité ouverte le ', formatDate(ncLiee.date))
          : h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: async () => {
              const n = await dbCreerNonConformite({
                dossier: courante.dossier,
                origine: 'Réclamation client',
                reference: courante.id,
                constat: courante.objet,
                incidence: 'À apprécier au regard de la mission concernée.',
              });
              showToast(`Non-conformité ${n.id} créée depuis la réclamation ${courante.id} — contexte repris.`);
            },
          }, 'Créer une non-conformité')
      )
    )
    : null;

  return h(CadreHub, { encadre, titre: 'Cycle de la relation client',
    actions: h('button', { className: 'btn btn-primary', onClick: () => setAjout(true) },
      '+ Ajouter une réclamation') },
    entete || null,
    h(ActionListDetail, {
      titreListe: 'Registre des réclamations', iconeListe: '📣',
      sousTitreListe: String(reclamations.length),
      colonnes, lignes: reclamations, cle: r => r.id, parPage: 5,
      triDefaut: { col: 'date', sens: 'desc' },
      vide: 'Aucune réclamation enregistrée.',
      selection: choisie, onSelect: r => setChoisie(r.id),
      detail, detailIcone: '📣',
      detailVide: 'Choisissez une réclamation pour voir son traitement',
    }),
    ajout
      ? h(AjoutReclamation, {
        onAnnuler: () => setAjout(false),
        onEnregistrer: async valeurs => {
          const r = await dbAjouterReclamation(valeurs);
          setAjout(false);
          setChoisie(r.id);
          showToast(`Réclamation ${r.id} enregistrée.`);
        },
      })
      : null
  );
}

/* Saisie d'une réclamation. Quatre champs, pas quinze : la date est celle du
   jour, l'état est « en cours » par construction, et la réponse se saisit plus
   tard — au moment où elle est réellement apportée. */

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

function AjoutReclamation({ onAnnuler, onEnregistrer }) {
  const [dossier, setDossier] = useState('');
  const [canal, setCanal] = useState('E-mail');
  const [objet, setObjet] = useState('');
  const [traitePar, setTraitePar] = useState(COLLABORATEURS[0] ? COLLABORATEURS[0].id : '');

  return h(Modal, { title: 'Enregistrer une réclamation', onClose: onAnnuler, width: 600 },
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Dossier concerné'),
      h('select', { className: 'form-input', value: dossier, onChange: e => setDossier(e.target.value) },
        h('option', { value: '' }, '— Choisir —'),
        CLIENTS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
      )
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Reçue par'),
      h('select', { className: 'form-input', value: canal, onChange: e => setCanal(e.target.value) },
        ['E-mail', 'Téléphone', 'Courrier', 'Entretien'].map(c => h('option', { key: c, value: c }, c))
      )
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Objet de la réclamation'),
      h('input', {
        className: 'form-input', value: objet, autoFocus: true,
        placeholder: 'Ce que le client reproche, en une phrase',
        onChange: e => setObjet(e.target.value),
      })
    ),
    h('div', { className: 'form-group' },
      h('label', { className: 'form-label' }, 'Traitée par'),
      h('select', { className: 'form-input', value: traitePar, onChange: e => setTraitePar(e.target.value) },
        COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
      )
    ),
    h('div', { className: 'modal-actions' },
      h('button', { className: 'btn btn-secondary', onClick: onAnnuler }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary',
        disabled: !dossier || !objet.trim(),
        onClick: () => onEnregistrer({ dossier, canal, objet: objet.trim(), traitePar }),
      }, 'Enregistrer')
    )
  );
}

function FicheFormation({ collabId, onBack, showToast, navigateEc }) {
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
        : h('button', {
          className: 'btn btn-primary btn-sm',
          /* Aucun stockage de fichier n'existe : ComplyEC enregistre que
             l'attestation a été reçue, avec sa date. C'est cette trace que le
             contrôleur demande, pas le PDF lui-même — qui reste dans les
             archives du cabinet. */
          onClick: async () => {
            await dbEnregistrerAttestation(courant.session.id, courant.c.id, { recue: true });
            showToast(`Attestation de ${courant.c.nom} enregistrée comme reçue. Le fichier reste dans vos archives.`);
          },
        },
          '📎 Joindre une attestation')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: `Formation — ${c.nom}`, onRetour: onBack,
      actions: navigateEc
        ? h('button', { className: 'btn btn-primary', onClick: () => navigateEc('ressources', 'sessions') },
          '+ Ajouter une formation')
        : null,
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

function RgpdPrestataires({ onBack, showToast, navigateEc, vue }) {
  return h(OutilsPrestataires, { onBack, showToast, navigateEc });
}

// ========================================= S30 — Cycle client — Réclamations

function RgpdTraitements({ onBack, showToast }) {
  const [revue, setRevue] = useState(null);
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
      h('button', { className: 'btn btn-secondary btn-sm', style: { marginTop: 12 }, onClick: () => setRevue(courant) },
        'Modifier le traitement')
    )
    : null;

  return h('div', { className: 'page' },
    h(EnteteHub, {
      titre: 'Registre des traitements', onRetour: onBack,
      /* Le registre RGPD alimente le manuel et les preuves ; ComplyEC n'est
         pas un logiciel RGPD complet (§ 16.4). Ce qu'on enregistre ici, c'est
         la revue d'un traitement : sa date et qui l'a faite. */
      actions: null,
    }),
    h(ActionListDetail, {
      titreListe: 'Traitements du cabinet', iconeListe: '📋', tonListe: 'violet',
      sousTitreListe: String(TRAITEMENTS_RGPD.length),
      colonnes, lignes: TRAITEMENTS_RGPD, cle: t => t.id, parPage: 5,
      vide: 'Aucun traitement enregistré.',
      selection: choisi, onSelect: t => setChoisi(t.id),
      detail, detailIcone: '📋',
      detailVide: 'Choisissez un traitement pour voir sa fiche',
    }),
    /* Ce qu'on enregistre d'un traitement, c'est sa revue : la date et la
       personne. Le registre de l'article 30 du RGPD vit dans les documents du
       cabinet ; ComplyEC en trace le suivi, il ne le remplace pas. */
    revue
      ? h(FunctionalEditModal, {
        titre: `Revue du traitement « ${revue.nom} »`,
        libelle: 'Ce que la revue a constaté',
        valeur: '',
        aide: 'La date du jour et votre nom seront consignés. Le registre lui-même reste le document du cabinet.',
        onAnnuler: () => setRevue(null),
        onEnregistrer: async note => {
          await dbMajReglage('rgpdRevue:' + revue.id, {
            date: new Date().toISOString().slice(0, 10), par: EXPERT_COMPTABLE.nom, note,
          });
          dbJournaliser('Traitement RGPD revu', revue.nom, note);
          setRevue(null);
          showToast(`Revue du traitement « ${revue.nom} » consignée.`);
        },
      })
      : null
  );
}

function OutilsPrestataires({ onBack, showToast, navigateEc }) {
  const [choisi, setChoisi] = useState(null);
  const lignes = dbPrestataires();

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
            onClick: async () => {
              await dbConfirmerPrestataire(courant.id);
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
      /* Le registre des prestataires vient du contrat d'infogérance et des
         conventions signées : on le confirme, on ne l'invente pas depuis un
         formulaire. Le dépôt du contrat est le vrai point d'entrée. */
      actions: navigateEc
        ? h('button', { className: 'btn btn-secondary', onClick: () => navigateEc('documents-cabinet', 'cat-informatique') },
          '📥 Déposer un contrat')
        : null,
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
