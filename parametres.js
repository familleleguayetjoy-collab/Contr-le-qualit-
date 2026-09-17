/* ComplyEC — Paramètres
   =====================

   Cinq rubriques, le même menu latéral léger que « Préparer le contrôle ».

   Ce qui est saisi ici ne l'est nulle part ailleurs : la dénomination du
   cabinet, les personnes, les rôles. Le manuel l'imprime, les courriers le
   reprennent, les relances s'en servent pour savoir à qui écrire. C'est la
   règle du § 16 appliquée à sa source : une donnée, un endroit. */

'use strict';

// -------------------------------------------- Rubrique 1 — Informations cabinet

const CABINET_CHAMPS = [
  { cle: 'nom', label: 'Dénomination' },
  { cle: 'formeJuridique', label: 'Forme juridique' },
  { cle: 'adresse', label: 'Adresse du siège', lignes: 2 },
  { cle: 'conseilRegional', label: 'Conseil régional' },
  { cle: 'numeroInscription', label: 'Numéro d’inscription' },
];

function ParamInformationsCabinet({ settings, onSave, showToast }) {
  const [form, setForm] = useState(() => {
    const f = {};
    CABINET_CHAMPS.forEach(c => { f[c.cle] = settings[c.cle] || ''; });
    return f;
  });
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));
  const modifie = CABINET_CHAMPS.some(c => form[c.cle] !== (settings[c.cle] || ''));

  /* L'effectif n'est pas un champ : il se compte à partir des utilisateurs
     enregistrés. Le saisir à la main, c'est se garantir qu'il sera faux
     l'année prochaine. */
  const effectif = COLLABORATEURS.length + 1;

  function enregistrer() {
    onSave(form);
    showToast('Informations du cabinet enregistrées.');
  }

  return h(RubriquePage, { titre: 'Informations cabinet' },
    h('section', { className: 'bloc-carte' },
      h('div', { className: 'etape-grille-2' },
        CABINET_CHAMPS.map(c => h(ChampPanneau, {
          key: c.cle, label: c.label, lignes: c.lignes,
          valeur: form[c.cle], onChange: v => maj(c.cle, v),
        }))
      ),
      h('div', { className: 'valeur-deduite' },
        h('span', { className: 'champ-label' }, 'Effectif'),
        h('span', { className: 'valeur-deduite-valeur' },
          `${effectif} ${pluriel(effectif, 'personne', 'personnes')}`),
        h('span', { className: 'champ-aide' }, 'Compté à partir des utilisateurs enregistrés.')
      ),
      h('div', { className: 'etape-pied' },
        h('span', { className: 'etape-pied-vide' }),
        h('button', { className: 'btn btn-primary', onClick: enregistrer, disabled: !modifie },
          'Enregistrer')
      )
    )
  );
}

// ----------------------------------------------------- Rubrique 2 — Utilisateurs

/* C'est cette rubrique qui rend les relances possibles : sans elle, ComplyEC
   saurait qu'une pièce manque sans savoir à qui le dire. */
function ParamUtilisateurs({ showToast, onApercuCollab }) {
  const [ouvert, setOuvert] = useState(null);
  const courant = ouvert ? collaborateur(ouvert) : null;

  return h(RubriquePage, { titre: 'Utilisateurs' },
    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          h('th', null, 'Nom'),
          h('th', null, 'Prénom'),
          h('th', null, 'Fonction'),
          h('th', null, 'Dossiers attribués')
        )),
        h('tbody', null,
          h('tr', { className: 'ligne-figee' },
            h('td', { className: 'col-principale' }, EXPERT_COMPTABLE.nom.split(' ').slice(1).join(' ')),
            h('td', null, EXPERT_COMPTABLE.nom.split(' ')[0]),
            h('td', null, EXPERT_COMPTABLE.role),
            h('td', null, h('span', { className: 'cellule-vide' }, 'Tous les dossiers'))
          ),
          COLLABORATEURS.map(c => {
            const dossiers = dbDossiersDuCollaborateur(c.id);
            const [prenom, ...reste] = c.nom.split(' ');
            return h('tr', {
              key: c.id, className: 'ligne-cliquable', onClick: () => setOuvert(c.id),
            },
              h('td', { className: 'col-principale' }, reste.join(' ')),
              h('td', null, prenom),
              h('td', null, c.role),
              h('td', { className: 'col-date' },
                dossiers.length
                  ? `${dossiers.length} ${pluriel(dossiers.length, 'dossier', 'dossiers')}`
                  : h('span', { className: 'cellule-vide' }, 'Aucun'))
            );
          })
        )
      )
    ),
    courant ? h(PanneauUtilisateur, {
      collab: courant,
      onFermer: () => setOuvert(null),
      showToast, onApercuCollab,
    }) : null
  );
}

function PanneauUtilisateur({ collab, onFermer, showToast, onApercuCollab }) {
  useDonnees();
  const attribues = dbDossiersDuCollaborateur(collab.id);
  const [ajout, setAjout] = useState('');

  async function retirer(dossierId) {
    // Un dossier ne reste jamais sans personne : le retirer, c'est le confier
    // à l'expert-comptable, qui est toujours là.
    await dbMajAttribution(dossierId, 'martin');
    showToast('Dossier retiré de son portefeuille.');
  }

  async function attribuer() {
    if (!ajout) return;
    await dbMajAttribution(ajout, collab.id);
    setAjout('');
    showToast('Dossier attribué.');
  }

  const disponibles = CLIENTS.filter(c => dbAttributionDossier(c.id) !== collab.id);

  return h(PanneauLateral, {
    ouvert: true, large: true,
    titre: collab.nom,
    sousTitre: collab.role,
    onFermer,
    pied: h(React.Fragment, null,
      onApercuCollab
        ? h('button', { className: 'btn btn-tertiaire', onClick: () => onApercuCollab(collab.id) },
          'Voir son espace')
        : null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer')
    ),
  },
    h('p', { className: 'bloc-carte-note' },
      'L’attribution décide à qui part la relance lorsqu’une pièce manque dans un dossier.'),

    h('div', { className: 'attribution-ajout' },
      h('select', {
        className: 'champ-saisie',
        value: ajout,
        'aria-label': 'Dossier à attribuer',
        onChange: e => setAjout(e.target.value),
      },
        h('option', { value: '' }, '— choisir un dossier —'),
        disponibles.map(c => h('option', { key: c.id, value: c.id }, c.nom))
      ),
      h('button', { className: 'btn btn-primary btn-sm', onClick: attribuer, disabled: !ajout },
        'Attribuer')
    ),

    attribues.length
      ? h('div', { className: 'panneau-liste' },
        attribues.map(d => h('div', { className: 'panneau-ligne', key: d.id },
          h('span', { className: 'panneau-ligne-nom' }, d.nom),
          h('button', { className: 'btn btn-tertiaire btn-sm', onClick: () => retirer(d.id) },
            'Retirer')
        ))
      )
      : h('p', { className: 'bloc-carte-note' }, 'Aucun dossier ne lui est attribué.')
  );
}

// ------------------------------------------------------ Rubrique 3 — Gouvernance

function ParamGouvernance({ showToast }) {
  useDonnees();
  const roles = dbRoles();
  const gerant = roles.find(r => r.code === 'gerant');
  const g = dbGouvernance();

  async function majGerant(nom) {
    await dbMajRole('gerant', nom);
    showToast('Gérant enregistré.');
  }

  return h(RubriquePage, { titre: 'Gouvernance' },
    h('section', { className: 'bloc-carte' },
      h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Gérant')),
      h(ChoixPanneau, {
        label: 'Titulaire', colonne: true,
        valeur: gerant ? gerant.titulaireEffectif : null,
        options: nomsDesPersonnes().map(n => ({ code: n, label: n })),
        onChange: majGerant,
      })
    ),

    h(ListeEditable, {
      titre: 'Experts-comptables inscrits',
      lignes: g.expertsInscrits,
      colonnes: [
        { cle: 'nom', label: 'Nom' },
        { cle: 'numero', label: 'Numéro d’inscription' },
      ],
      onChange: liste => dbMajGouvernance({ expertsInscrits: liste }),
      showToast,
    }),

    h(ListeEditable, {
      titre: 'Actionnariat',
      lignes: g.actionnariat,
      colonnes: [
        { cle: 'nom', label: 'Associé' },
        { cle: 'part', label: 'Part (%)', type: 'number' },
      ],
      total: liste => {
        const somme = liste.reduce((n, l) => n + (Number(l.part) || 0), 0);
        return `Total : ${somme} %${somme !== 100 ? ' — la répartition ne fait pas 100 %.' : ''}`;
      },
      onChange: liste => dbMajGouvernance({ actionnariat: liste }),
      showToast,
    })
  );
}

/* Toutes les personnes que le cabinet peut désigner : l'expert-comptable et
   ses collaborateurs. On ne ressaisit jamais un nom (§ 14). */
function nomsDesPersonnes() {
  return [EXPERT_COMPTABLE.nom].concat(COLLABORATEURS.map(c => c.nom));
}

/* Un petit tableau qu'on peut allonger. Trois gestes : modifier une case,
   ajouter une ligne, retirer une ligne. */
function ListeEditable({ titre, lignes, colonnes, onChange, total, showToast }) {
  const [brouillon, setBrouillon] = useState(lignes);
  useEffect(() => { setBrouillon(lignes); }, [JSON.stringify(lignes)]);

  function majCase(i, cle, v) {
    setBrouillon(b => b.map((l, j) => (j === i ? Object.assign({}, l, { [cle]: v }) : l)));
  }
  function ajouter() {
    const vide = {};
    colonnes.forEach(c => { vide[c.cle] = ''; });
    setBrouillon(b => b.concat([vide]));
  }
  function retirer(i) { setBrouillon(b => b.filter((l, j) => j !== i)); }

  async function enregistrer() {
    await onChange(brouillon.filter(l => String(l[colonnes[0].cle] || '').trim()));
    showToast(`${titre} enregistré.`);
  }

  return h('section', { className: 'bloc-carte' },
    h('header', { className: 'bloc-carte-entete' },
      h('h2', null, titre),
      h('div', { className: 'bloc-carte-actions' },
        h('button', { className: 'btn btn-secondary btn-sm', onClick: ajouter }, 'Ajouter une ligne'),
        h('button', { className: 'btn btn-primary btn-sm', onClick: enregistrer }, 'Enregistrer')
      )
    ),
    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          colonnes.map(c => h('th', { key: c.cle }, c.label)),
          h('th', { className: 'col-case' }, '')
        )),
        h('tbody', null, brouillon.map((l, i) => h('tr', { key: i },
          colonnes.map(c => h('td', { key: c.cle },
            h('input', {
              className: 'champ-saisie champ-cellule',
              type: c.type || 'text',
              value: l[c.cle] === undefined || l[c.cle] === null ? '' : l[c.cle],
              'aria-label': c.label,
              onChange: e => majCase(i, c.cle, e.target.value),
            })
          )),
          h('td', { className: 'col-case' },
            h('button', {
              className: 'btn btn-tertiaire btn-sm',
              onClick: () => retirer(i),
              'aria-label': 'Retirer cette ligne',
            }, '✕'))
        )))
      )
    ),
    total ? h('p', { className: 'repartition-total' }, total(brouillon)) : null
  );
}

// ----------------------------------------------------- Rubrique 4 — Responsables

/* Des listes déroulantes d'utilisateurs, et jamais un champ libre : un nom
   tapé à la main finit toujours par diverger de celui qui figure ailleurs. */
function ParamResponsables({ showToast }) {
  useDonnees();
  const roles = dbRoles();
  const aDesigner = RESPONSABLES_A_DESIGNER
    .map(code => roles.find(r => r.code === code))
    .filter(Boolean);

  async function designer(code, nom) {
    await dbMajRole(code, nom || null);
    showToast('Désignation enregistrée.');
  }

  return h(RubriquePage, { titre: 'Responsables' },
    h('section', { className: 'bloc-carte' },
      h('div', { className: 'responsables-liste' },
        aDesigner.map(r => h('div', { className: 'responsable-ligne', key: r.code },
          h('div', { className: 'responsable-intitule' },
            h('span', { className: 'responsable-label' }, r.label),
            h('span', { className: 'responsable-fondement' }, r.fondement)
          ),
          h('select', {
            className: 'champ-saisie',
            value: r.titulaireEffectif || '',
            'aria-label': r.label,
            onChange: e => designer(r.code, e.target.value),
          },
            h('option', { value: '' }, '— non désigné —'),
            nomsDesPersonnes().map(n => h('option', { key: n, value: n }, n))
          )
        ))
      )
    )
  );
}

// ----------------------------------------------------- Rubrique 5 — Implantation

function ParamImplantation({ settings, onSave, showToast }) {
  const [form, setForm] = useState({
    adresse: settings.adresse || '',
    etablissementSecondaire: !!settings.etablissementSecondaire,
    adresseSecondaire: settings.adresseSecondaire || '',
  });
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  function enregistrer() {
    if (form.etablissementSecondaire && !form.adresseSecondaire.trim()) {
      showToast('Indiquez l’adresse de l’établissement secondaire.');
      return;
    }
    onSave({
      adresse: form.adresse,
      etablissementSecondaire: form.etablissementSecondaire,
      adresseSecondaire: form.etablissementSecondaire ? form.adresseSecondaire : '',
    });
    showToast('Implantation enregistrée.');
  }

  return h(RubriquePage, { titre: 'Implantation' },
    h('section', { className: 'bloc-carte' },
      h(ChampPanneau, {
        label: 'Siège', lignes: 2,
        valeur: form.adresse, onChange: v => maj('adresse', v),
      }),
      h(BasculePanneau, {
        label: 'Établissement secondaire',
        valeur: form.etablissementSecondaire,
        onChange: v => maj('etablissementSecondaire', v),
      }),
      form.etablissementSecondaire
        ? h(ChampPanneau, {
          label: 'Adresse de l’établissement secondaire', lignes: 2,
          valeur: form.adresseSecondaire, onChange: v => maj('adresseSecondaire', v),
        })
        : null,
      h('div', { className: 'etape-pied' },
        h('span', { className: 'etape-pied-vide' }),
        h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Enregistrer')
      )
    )
  );
}

// -------------------------------------------------------------- La coque

function ECParametres({ rubrique, navigateEc, showToast, settings, onSave, onApercuCollab }) {
  useDonnees();
  const actif = PARAMETRES_RUBRIQUES.some(r => r.key === rubrique) ? rubrique : 'cabinet';

  let contenu;
  if (actif === 'utilisateurs') contenu = h(ParamUtilisateurs, { showToast, onApercuCollab });
  else if (actif === 'gouvernance') contenu = h(ParamGouvernance, { showToast });
  else if (actif === 'responsables') contenu = h(ParamResponsables, { showToast });
  else if (actif === 'implantation') contenu = h(ParamImplantation, { settings, onSave, showToast });
  else contenu = h(ParamInformationsCabinet, { settings, onSave, showToast });

  // Les cinq rubriques vivent dans la barre de gauche, pas dans un second menu.
  return h('div', { className: 'page page-controle' },
    h('div', { className: 'controle-contenu', key: actif }, contenu)
  );
}
