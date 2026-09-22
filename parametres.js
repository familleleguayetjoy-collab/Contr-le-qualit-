/* ComplyEC — Paramètres
   =====================

   Cinq rubriques, le même menu latéral léger que « Préparer le contrôle ».

   Ce qui est saisi ici ne l'est nulle part ailleurs : la dénomination du
   cabinet, les personnes, les rôles. Le manuel l'imprime, les courriers le
   reprennent, les relances s'en servent pour savoir à qui écrire. C'est la
   règle du § 16 appliquée à sa source : une donnée, un endroit. */

'use strict';

// -------------------------------------------- Rubrique 1 — Informations cabinet

/* L'écran a été repris le 22 septembre : cinq champs dans une grille, un
   effectif en bas, et un bouton. Tout était vrai et rien ne se lisait.

   Les cinq informations ne sont pas de même nature : trois disent qui est le
   cabinet, deux disent de quoi il tient son droit d'exercer. Elles se lisent
   donc dans deux rectangles distincts, chacun sous son bandeau. L'effectif
   rejoint le second, parce qu'il relève du même registre — ce que le cabinet
   déclare à l'Ordre. */
const CABINET_IDENTITE = [
  { cle: 'nom', label: 'Dénomination', aide: 'Telle qu’elle figure sur le papier à en-tête et dans les lettres de mission.' },
  { cle: 'formeJuridique', label: 'Forme juridique' },
  { cle: 'adresse', label: 'Adresse du siège', lignes: 2 },
];

const CABINET_INSCRIPTION = [
  { cle: 'conseilRegional', label: 'Conseil régional' },
  { cle: 'numeroInscription', label: 'Numéro d’inscription au tableau' },
];

const CABINET_CHAMPS = CABINET_IDENTITE.concat(CABINET_INSCRIPTION);

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
  const effectif = dbCollaborateursTous().length + 1;

  function enregistrer() {
    onSave(form);
    showToast('Informations du cabinet enregistrées.');
  }

  return h(RubriquePage, {
    titre: 'Informations cabinet',
    actions: h('button', {
      className: 'btn btn-primary', onClick: enregistrer, disabled: !modifie,
    }, 'Enregistrer'),
  },
    h('div', { className: 'param-colonnes' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Identité du cabinet')),
        h('div', { className: 'param-champs' },
          CABINET_IDENTITE.map(c => h(ChampPanneau, {
            key: c.cle, label: c.label, aide: c.aide, lignes: c.lignes,
            valeur: form[c.cle], onChange: v => maj(c.cle, v),
          }))
        )
      ),

      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-bleu' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Inscription à l’Ordre')),
        h('div', { className: 'param-champs' },
          CABINET_INSCRIPTION.map(c => h(ChampPanneau, {
            key: c.cle, label: c.label,
            valeur: form[c.cle], onChange: v => maj(c.cle, v),
          })),
          /* Une valeur qui se compte, posée comme les autres mais sans champ :
             la différence entre ce qu'on saisit et ce qu'on constate doit se
             voir. */
          h('div', { className: 'valeur-deduite' },
            h('span', { className: 'champ-label' }, 'Effectif du cabinet'),
            h('span', { className: 'valeur-deduite-valeur' },
              `${effectif} ${pluriel(effectif, 'personne', 'personnes')}`),
            h('span', { className: 'champ-aide' },
              'Compté sur les utilisateurs enregistrés : il suit les arrivées et les départs.')
          )
        )
      )
    )
  );
}

// ----------------------------------------------------- Rubrique 2 — Utilisateurs

/* C'est cette rubrique qui rend les relances possibles : sans elle, ComplyEC
   saurait qu'une pièce manque sans savoir à qui le dire.

   Depuis le 22 septembre, l'expert-comptable y crée les espaces de ses
   collaborateurs. Il saisit trois informations — prénom, nom, adresse — et
   rien d'autre : le mot de passe ne lui appartient pas. Le collaborateur
   reçoit un courriel de connexion et le choisit lui-même. Un mot de passe créé
   par un tiers est un mot de passe partagé, et un accès partagé ne trace
   plus rien. */
function ParamUtilisateurs({ showToast, onApercuCollab }) {
  useDonnees();
  const [ouvert, setOuvert] = useState(null);
  const [nouveau, setNouveau] = useState(false);
  const tous = dbCollaborateursTous();
  const courant = ouvert ? collaborateur(ouvert) : null;

  return h(RubriquePage, {
    titre: 'Utilisateurs',
    actions: h('button', {
      className: 'btn btn-primary', onClick: () => setNouveau(true),
    }, '+ Ajouter un collaborateur'),
  },
    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne entete-teinte teinte-nuit' },
        h('thead', null, h('tr', null,
          h('th', null, 'Nom'),
          h('th', null, 'Prénom'),
          h('th', null, 'Fonction'),
          h('th', null, 'Accès'),
          h('th', null, 'Dossiers attribués')
        )),
        h('tbody', null,
          h('tr', { className: 'ligne-figee' },
            h('td', { className: 'col-principale' }, EXPERT_COMPTABLE.nom.split(' ').slice(1).join(' ')),
            h('td', null, EXPERT_COMPTABLE.nom.split(' ')[0]),
            h('td', null, EXPERT_COMPTABLE.role),
            h('td', null, h('span', { className: 'cellule-vide' }, 'Titulaire du compte')),
            h('td', null, h('span', { className: 'cellule-vide' }, 'Tous les dossiers'))
          ),
          tous.map(c => {
            const dossiers = dbDossiersDuCollaborateur(c.id);
            const [prenom, ...reste] = c.nom.split(' ');
            return h('tr', {
              key: c.id, className: 'ligne-cliquable', onClick: () => setOuvert(c.id),
            },
              h('td', { className: 'col-principale' }, reste.join(' ')),
              h('td', null, prenom),
              h('td', null, c.role),
              h('td', null, c.email
                ? (c.invitationEnvoyee
                  ? h(Pastille, { ton: 'vert' }, 'Invité')
                  : h(Pastille, { ton: 'orange' }, 'À inviter'))
                : h('span', { className: 'cellule-vide' }, '—')),
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
    }) : null,
    nouveau ? h(PanneauNouveauCollaborateur, {
      onFermer: () => setNouveau(false), showToast,
    }) : null
  );
}

/* Création d'un espace collaborateur. Trois champs, et une phrase qui dit ce
   qui se passe ensuite — c'est ce qu'on veut savoir avant de cliquer. */
function PanneauNouveauCollaborateur({ onFermer, showToast }) {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', role: 'Collaborateur comptable' });
  const [erreur, setErreur] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  const complet = form.prenom.trim() && form.nom.trim()
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  async function creer() {
    setErreur(null);
    setEnCours(true);
    try {
      await dbCreerCollaborateur(form);
      showToast(capaciteReelle('supabasePersistence')
        ? `Espace créé — un courriel de connexion part vers ${form.email.trim()}.`
        : `Espace créé pour ${form.prenom.trim()} ${form.nom.trim()}.`);
      onFermer();
    } catch (err) {
      setErreur(err && err.message ? err.message : 'La création a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  return h(PanneauLateral, {
    ouvert: true,
    titre: 'Nouveau collaborateur',
    sousTitre: 'Trois informations suffisent.',
    onFermer,
    pied: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary', onClick: creer, disabled: !complet || enCours,
      }, enCours ? 'Création…' : 'Créer l’espace')
    ),
  },
    h(ChampPanneau, { label: 'Prénom', valeur: form.prenom, onChange: v => maj('prenom', v) }),
    h(ChampPanneau, { label: 'Nom', valeur: form.nom, onChange: v => maj('nom', v) }),
    h(ChampPanneau, {
      label: 'Adresse électronique', type: 'email',
      aide: 'C’est à cette adresse que part le courriel de connexion.',
      valeur: form.email, onChange: v => maj('email', v),
    }),
    h(ChoixPanneau, {
      label: 'Fonction', colonne: true,
      valeur: form.role,
      options: ['Collaborateur comptable', 'Chef de mission', 'Aide-saisie', 'Apprenti']
        .map(r => ({ code: r, label: r })),
      onChange: v => maj('role', v),
    }),

    h('p', { className: 'bloc-carte-note' },
      'Le collaborateur reçoit un courriel et choisit lui-même son mot de passe : '
      + 'ComplyEC ne le connaît à aucun moment.'),
    h(MentionCapacite, { cle: 'supabasePersistence' }),
    erreur ? h('div', { className: 'info-box info-box-alerte' }, erreur) : null
  );
}

/* Le détail d'un collaborateur : ce qu'il a en charge, et l'accès à son
   espace. L'attribution décide à qui part la relance quand une pièce manque. */
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
    collab.email
      ? h('p', { className: 'bloc-carte-note' },
        'Adresse de connexion : ', h('b', null, collab.email),
        collab.invitationEnvoyee ? '' : ' — invitation non envoyée.')
      : null,
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

/* Tout tient sur un écran, et le gérant ne se choisit plus dans une liste.

   Il ne pouvait y avoir qu'une réponse : le gérant est celui qui a créé le
   compte du cabinet, c'est-à-dire l'expert-comptable connecté. Lui faire
   désigner son propre nom parmi ses collaborateurs était une question sans
   objet — et une occasion de se tromper.

   Le cas où le cabinet change de gérant existe, mais il ne se règle pas dans
   un menu déroulant : il suppose un nouveau titulaire du compte. Le bouton le
   dit, plutôt que de laisser croire qu'un clic suffit. */
function ParamGouvernance({ showToast }) {
  useDonnees();
  const roles = dbRoles();
  const gerant = roles.find(r => r.code === 'gerant');
  const g = dbGouvernance();
  const titulaire = (gerant && gerant.titulaireEffectif) || EXPERT_COMPTABLE.nom;

  return h(RubriquePage, { titre: 'Gouvernance' },
    h('div', { className: 'gouvernance-grille' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit gouvernance-gerant' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Gérant')),
        h('div', { className: 'gerant-fiche' },
          h('div', { className: 'avatar avatar-grand' }, EXPERT_COMPTABLE.initiales),
          h('div', null,
            h('div', { className: 'gerant-nom' }, titulaire),
            h('div', { className: 'gerant-role' }, EXPERT_COMPTABLE.role)
          )
        ),
        h('p', { className: 'bloc-carte-note', style: { marginBottom: 0 } },
          'Le gérant est le titulaire du compte du cabinet. Un changement de '
          + 'gérant suppose un changement de titulaire, pas un simple réglage.')
      ),

      h(ListeEditable, {
        titre: 'Experts-comptables inscrits',
        teinte: 'bleu',
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
        teinte: 'violet',
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
    )
  );
}

/* Toutes les personnes que le cabinet peut désigner : l'expert-comptable et
   ses collaborateurs, y compris ceux créés depuis Paramètres. On ne ressaisit
   jamais un nom (§ 14). */
function nomsDesPersonnes() {
  return [EXPERT_COMPTABLE.nom].concat(dbCollaborateursTous().map(c => c.nom));
}

/* Un petit tableau qu'on peut allonger. Trois gestes : modifier une case,
   ajouter une ligne, retirer une ligne. */
function ListeEditable({ titre, lignes, colonnes, onChange, total, showToast, teinte }) {
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

  return h('section', {
    className: cx('bloc-carte', teinte && 'bloc-carte-bandeau', teinte && 'teinte-' + teinte),
  },
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
   tapé à la main finit toujours par diverger de celui qui figure ailleurs.

   Repris le 22 septembre. Chaque ligne portait sous son intitulé le texte qui
   fonde la désignation, en petit et en gris ; sept lignes serrées en haut d'un
   écran à moitié vide. Les intitulés sont maintenant à leur taille de lecture,
   espacés, et l'écran est rempli.

   Le fondement n'est pas perdu : il reste sur la ligne, en infobulle. Un
   contrôleur qui demande d'où sort une désignation l'obtient d'un survol, et
   il figure de toute façon dans le manuel de procédures, qui l'imprime. */
function ParamResponsables({ showToast }) {
  useDonnees();
  const roles = dbRoles();
  const aDesigner = RESPONSABLES_A_DESIGNER
    .map(code => roles.find(r => r.code === code))
    .filter(Boolean);
  const manquants = aDesigner.filter(r => !r.titulaireEffectif).length;

  async function designer(code, nom) {
    await dbMajRole(code, nom || null);
    showToast('Désignation enregistrée.');
  }

  return h(RubriquePage, {
    titre: 'Responsables',
    actions: manquants
      ? h(Pastille, { ton: 'orange' },
        `${manquants} ${pluriel(manquants, 'rôle non désigné', 'rôles non désignés')}`)
      : h(Pastille, { ton: 'vert' }, 'Tous les rôles sont désignés'),
  },
    h('section', { className: 'bloc-carte bloc-carte-pleine' },
      h('div', { className: 'responsables-liste' },
        aDesigner.map(r => h('div', {
          className: cx('responsable-ligne', !r.titulaireEffectif && 'a-designer'),
          key: r.code, title: r.fondement || undefined,
        },
          h('span', { className: 'responsable-label' }, r.label),
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

/* Repris le 22 septembre : trois champs empilés en haut d'un grand vide.

   L'implantation, c'est une question par lieu : où est le siège, et y a-t-il
   un second établissement. Deux rectangles, côte à côte, chacun avec sa
   question et son adresse. Le second reste visible quand il n'y a pas
   d'établissement secondaire : savoir qu'on a répondu « non » vaut mieux que
   de voir un rectangle disparaître. */
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

  return h(RubriquePage, {
    titre: 'Implantation',
    actions: h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Enregistrer'),
  },
    h('div', { className: 'param-colonnes' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Siège du cabinet')),
        h('div', { className: 'param-champs' },
          h(ChampPanneau, {
            label: 'Adresse complète', lignes: 3,
            aide: 'Elle figure sur le papier à en-tête, les lettres de mission et le manuel.',
            valeur: form.adresse, onChange: v => maj('adresse', v),
          })
        )
      ),

      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Établissement secondaire')),
        h('div', { className: 'param-champs' },
          h(BasculePanneau, {
            label: 'Le cabinet a un second lieu d’exercice',
            aide: 'Bureau, antenne ou agence où des dossiers sont tenus.',
            valeur: form.etablissementSecondaire,
            onChange: v => maj('etablissementSecondaire', v),
          }),
          form.etablissementSecondaire
            ? h(ChampPanneau, {
              label: 'Adresse complète', lignes: 3,
              valeur: form.adresseSecondaire, onChange: v => maj('adresseSecondaire', v),
            })
            : h('p', { className: 'champ-aide', style: { marginTop: 4 } },
              'Aucun second lieu d’exercice déclaré.')
        )
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
