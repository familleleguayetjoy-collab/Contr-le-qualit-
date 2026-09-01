// ComplyEC — Assistants partagés : Reprise déontologique & Contractualisation
'use strict';

// ============================================================ Reprise déontologique

const REPRISE_STEPS = ['Paramétrage', 'Pièces à demander', 'Courrier et e-mail'];


function ReprisePage({ showToast }) {
  const [step, setStep] = useState(1);
  const [siret, setSiret] = useState(SCENARIO_NOUVEAU_CLIENT.siret);
  const [clientTrouve, setClientTrouve] = useState(false);
  const [dateReprise, setDateReprise] = useState('2026-07-01');
  const [siretConfrere, setSiretConfrere] = useState(SCENARIO_CABINET_CONFRERE.siret);
  const [confrereTrouve, setConfrereTrouve] = useState(false);
  const [nomConfrere, setNomConfrere] = useState(SCENARIO_CABINET_CONFRERE.nomConfrere);
  const [prenomConfrere, setPrenomConfrere] = useState(SCENARIO_CABINET_CONFRERE.prenomConfrere);
  const [emailConfrere, setEmailConfrere] = useState(SCENARIO_CABINET_CONFRERE.emailConfrere);
  const [pieces, setPieces] = useState(() => Object.fromEntries(PIECES_REPRISE.map(p => [p, true])));
  const [piecesSupplementaires, setPiecesSupplementaires] = useState([]);
  const [nouvellePiece, setNouvellePiece] = useState('');
  const [collaborateurCharge, setCollaborateurCharge] = useState('julie');

  function togglePiece(p) { setPieces(prev => ({ ...prev, [p]: !prev[p] })); }
  function ajouterPiece() {
    const label = nouvellePiece.trim();
    if (!label) return;
    setPiecesSupplementaires(prev => [...prev, label]);
    setPieces(prev => ({ ...prev, [label]: true }));
    setNouvellePiece('');
  }

  if (step === 2) {
    return h(ReprisePieces, {
      onBack: () => setStep(1), onNext: () => setStep(3),
      pieces, togglePiece, piecesSupplementaires, nouvellePiece, setNouvellePiece, ajouterPiece,
    });
  }
  if (step === 3) {
    return h(RepriseEtape2, {
      onBack: () => setStep(2),
      collaborateurCharge, showToast, dateReprise, pieces, piecesSupplementaires,
    });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Reprise déontologique'), h('p', { className: 'subtitle' }, 'Reprendre un dossier confié par un confrère, dans les règles.')),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Aperçu généré (démonstration)') }, '👁 Aperçu du courrier'),
        h('button', { className: 'btn btn-accent', onClick: () => setStep(2) }, 'Étape suivante →')
      )
    ),
    h(Stepper, { steps: REPRISE_STEPS, current: 1 }),

    h('div', { className: 'step-body' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h(FormSection, { icon: '🏢', title: 'Client repris', ton: 'bleu' },
            h('div', { className: 'grid-2' },
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'SIRET du client'),
                h('div', { className: 'input-with-btn' },
                  h('input', { className: 'form-input', value: siret, onChange: e => setSiret(e.target.value) }),
                  h('button', { className: 'btn btn-secondary btn-sm', title: 'Interroger le SIRET', 'aria-label': 'Interroger le SIRET du client', onClick: () => setClientTrouve(true) }, '🔍')
                )
              ),
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Date de reprise'),
                h('input', { type: 'date', className: 'form-input', value: dateReprise, onChange: e => setDateReprise(e.target.value) })
              )
            ),
            clientTrouve ? h('div', { className: 'identity-panel', style: { marginTop: 12 } },
              h('div', { className: 'identity-panel-title' }, 'Fiche légale récupérée'),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Société'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.societe)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Adresse'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.adresse)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.formeJuridique)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.dirigeant))
            ) : null
          ),
          h(FormSection, { icon: '👤', title: 'Suivi interne', ton: 'gris' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Collaborateur chargé du dossier'),
              h('select', { className: 'form-select', value: collaborateurCharge, onChange: e => setCollaborateurCharge(e.target.value) },
                COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
              )
            )
          )
        ),
        h(FormSection, { icon: '🤝', title: 'Cabinet confrère', ton: 'violet' },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'SIRET du cabinet confrère'),
            h('div', { className: 'input-with-btn' },
              h('input', { className: 'form-input', value: siretConfrere, onChange: e => setSiretConfrere(e.target.value) }),
              h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setConfrereTrouve(true) }, '🔍 Interroger')
            )
          ),
          confrereTrouve ? h('div', { className: 'identity-panel', style: { marginBottom: 14 } },
            h('div', { className: 'identity-panel-title' }, 'Fiche légale récupérée'),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Cabinet'), h('span', { className: 'v' }, SCENARIO_CABINET_CONFRERE.cabinet)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Adresse'), h('span', { className: 'v' }, SCENARIO_CABINET_CONFRERE.adresse))
          ) : null,
          h('div', { className: 'grid-2' },
            h('div', { className: 'form-group' },
              h('label', { className: 'form-label' }, 'Nom du confrère'),
              h('input', { className: 'form-input', value: nomConfrere, onChange: e => setNomConfrere(e.target.value) })
            ),
            h('div', { className: 'form-group' },
              h('label', { className: 'form-label' }, 'Prénom du confrère'),
              h('input', { className: 'form-input', value: prenomConfrere, onChange: e => setPrenomConfrere(e.target.value) })
            )
          ),
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'E-mail du confrère'),
            h('input', { className: 'form-input', value: emailConfrere, onChange: e => setEmailConfrere(e.target.value) })
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-primary', onClick: () => setStep(2) }, 'Choisir les pièces →')
      )
    )
  );
}

/* Étape 2 : rien d'autre que le choix des pièces, en grand. */
function ReprisePieces({ onBack, onNext, pieces, togglePiece, piecesSupplementaires, nouvellePiece, setNouvellePiece, ajouterPiece }) {
  const liste = [...PIECES_REPRISE, ...piecesSupplementaires];
  const retenues = liste.filter(p => pieces[p]);

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Reprise déontologique'),
        h('p', { className: 'subtitle' }, 'Cochez ce que vous réclamez au confrère. Le courrier se met à jour tout seul.')
      ),
      h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour au paramétrage')
    ),
    h(Stepper, { steps: REPRISE_STEPS, current: 2 }),
    h('div', { className: 'step-body' },
      h(FormSection, { icon: '📎', title: `Pièces demandées (${retenues.length} sur ${liste.length})`, ton: 'vert' },
        h('div', { className: 'checkbox-grid cols-3' },
          liste.map(p => h('label', { className: 'checkbox-row', key: p },
            h('input', { type: 'checkbox', checked: !!pieces[p], onChange: () => togglePiece(p) }), p
          ))
        ),
        h('div', { className: 'input-with-btn', style: { marginTop: 16, maxWidth: 460 } },
          h('input', {
            className: 'form-input', placeholder: 'Ajouter un document supplémentaire…',
            value: nouvellePiece, onChange: e => setNouvellePiece(e.target.value),
            onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); ajouterPiece(); } },
          }),
          h('button', { className: 'btn btn-secondary', onClick: ajouterPiece }, '+ Ajouter')
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour'),
        h('button', { className: 'btn btn-primary', disabled: retenues.length === 0, onClick: onNext }, 'Voir le courrier →')
      )
    )
  );
}

function RepriseEtape2({ onBack, collaborateurCharge, showToast, dateReprise, pieces, piecesSupplementaires }) {
  const listePieces = [...PIECES_REPRISE, ...piecesSupplementaires];
  const retenues = listePieces.filter(p => pieces[p]);
  const dateStr = formatDateLong(dateReprise);
  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Reprise déontologique'), h('p', { className: 'subtitle' }, 'Relisez, puis envoyez au confrère et au client.')),
      h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour au paramétrage')
    ),
    h(Stepper, { steps: REPRISE_STEPS, current: 3 }),
    h('div', { className: 'step-body' },
    h('div', { className: 'two-col-preview' },
      h(FormSection, { icon: '📄', title: 'Courrier à valider', ton: 'bleu' },
        h('div', { className: 'letter-preview' },
`${dateStr}

À l'attention de Monsieur ${SCENARIO_CABINET_CONFRERE.prenomConfrere} ${SCENARIO_CABINET_CONFRERE.nomConfrere}
${SCENARIO_CABINET_CONFRERE.cabinet}
${SCENARIO_CABINET_CONFRERE.adresse}

Objet : Reprise du dossier de la société ${SCENARIO_NOUVEAU_CLIENT.societe}

Monsieur,

Nous vous informons reprendre, à compter du ${formatDate(dateReprise)}, la mission comptable de la société suivante :

${SCENARIO_NOUVEAU_CLIENT.societe}
${SCENARIO_NOUVEAU_CLIENT.adresse}
SIRET : ${SCENARIO_NOUVEAU_CLIENT.siret}

Afin d'assurer une continuité de service optimale, nous vous remercions de bien vouloir nous transmettre les documents suivants :

${retenues.map(p => '  • ' + p).join('\n')}

Dans l'attente de votre retour, nous vous prions d'agréer, Monsieur, l'expression de nos salutations distinguées.

Martin Dupont
Expert-comptable`
        )
      ),
      h(FormSection, { icon: '✉️', title: 'E-mail au confrère', ton: 'violet' },
        h('div', { className: 'letter-meta' },
          h('div', null, h('b', null, 'À : '), SCENARIO_CABINET_CONFRERE.emailConfrere),
          h('div', null, h('b', null, 'Objet : '), `Reprise du dossier ${SCENARIO_NOUVEAU_CLIENT.societe}`)
        ),
        h('div', { className: 'letter-preview' },
`Monsieur ${SCENARIO_CABINET_CONFRERE.nomConfrere},

Nous vous informons reprendre, à compter du ${formatDate(dateReprise)}, la mission de la société :

${SCENARIO_NOUVEAU_CLIENT.societe}
${SCENARIO_NOUVEAU_CLIENT.adresse}
SIRET : ${SCENARIO_NOUVEAU_CLIENT.siret}

Vous trouverez en pièce jointe le courrier de reprise déontologique précisant la liste des documents nécessaires à la continuité du dossier.

Nous vous remercions par avance de votre collaboration.

Bien cordialement,

Martin Dupont
Expert-comptable`
        )
      )
    ),
    h('div', { className: 'card', style: { marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' } },
      h('div', { className: 'form-help', style: { flex: 1, minWidth: 240 } }, `ℹ️ ${retenues.length} pièce${retenues.length > 1 ? 's' : ''} demandée${retenues.length > 1 ? 's' : ''}. Une copie sera transmise à ${collaborateur(collaborateurCharge).nom.split(' ')[0]} pour archivage dans le Drive du dossier.`),
      h('button', { className: 'btn btn-primary', onClick: () => showToast('Reprise finalisée — courrier et email envoyés (démonstration)') }, 'Finaliser la reprise →')
    )
    )
  );
}

// ============================================================ Contractualisation (6 étapes)
// Composant partagé, utilisé par le module Expert-comptable (Entrée en mission > Contractualisation)
// et par le module Collaborateur (Nouveau dossier).

/* Regroupe un thème du formulaire dans son propre rectangle titré. */
function FormSection({ icon, title, children, style, ton = 'bleu' }) {
  return h('div', { className: cx('form-section', 'sec-' + ton), style },
    h('div', { className: 'form-section-title' },
      icon ? h('span', { className: 'form-section-icon' }, icon) : null,
      h('span', { className: 'card-title-ink' }, title)
    ),
    children
  );
}

const CONTRACT_AIDE = [
  'Le SIRET suffit : la fiche légale est récupérée automatiquement.',
  'L’arborescence type du cabinet, créée d’un coup.',
  'Qui signe la lettre de mission, et à quel titre.',
  'Honoraires, volet social : la LDM se rédige à partir de votre modèle.',
  'Ce que le cabinet récupère seul, et ce que vous demandez au client.',
  'Notez le risque sur quatre critères : le niveau se calcule tout seul.',
  'Tout est prêt : voici ce qui sera créé au moment de finaliser.',
];

const CONTRACT_STEPS = ['Société', 'Dossier Drive', 'Contractant', 'Modèle de LDM', 'Mentions de la lettre', 'Documents', 'Vigilance LBC-FT', 'Validation'];

function ContractualisationWizard({ showToast, onFinish, collaborateurConnecte }) {
  const [step, setStep] = useState(1);
  const [siret, setSiret] = useState(SCENARIO_NOUVEAU_CLIENT.siret);
  const [societeAnalysee, setSocieteAnalysee] = useState(false);

  const [nature, setNature] = useState('Société');
  const [lmpLmnp, setLmpLmnp] = useState('LMNP');
  const [civilite, setCivilite] = useState(SCENARIO_NOUVEAU_CLIENT.dirigeantCivilite);
  const [prenomDirigeant, setPrenomDirigeant] = useState(SCENARIO_NOUVEAU_CLIENT.dirigeantPrenom);
  const [nomDirigeant, setNomDirigeant] = useState(SCENARIO_NOUVEAU_CLIENT.dirigeantNom);
  const [salaries, setSalaries] = useState(true);
  const [honoraires, setHonoraires] = useState('350');
  const [remiseFrais, setRemiseFrais] = useState(true);
  const [situationComptable, setSituationComptable] = useState(true);
  const [situationComptableType, setSituationComptableType] = useState('Offerte');
  const [situationComptableMontant, setSituationComptableMontant] = useState('150');
  const [remiseFraisSociale, setRemiseFraisSociale] = useState(true);
  const [dateCloture, setDateCloture] = useState(SCENARIO_NOUVEAU_CLIENT.dateCloture);
  const [signataire, setSignataire] = useState('Julien Lesnes');
  const [nbSalaries, setNbSalaries] = useState('3');
  const [montantBulletin, setMontantBulletin] = useState('18');
  const isParticulierIRPP = nature === 'Particulier IRPP';
  const isSociete = nature === 'Société';
  const salariesEffective = isParticulierIRPP ? false : salaries;

  const [docsDemandes, setDocsDemandes] = useState(() => Object.fromEntries(DOCUMENTS_A_DEMANDER_CLIENT.map(d => [d, true])));
  const [statuts, setStatuts] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState(false);

  const [classification, setClassification] = useState(() => Object.fromEntries(NPLAB_CRITERES.map(c => [c.code, 'Faible'])));
  const [commentaireVigilance, setCommentaireVigilance] = useState('');
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [analyzingTranscript, setAnalyzingTranscript] = useState(false);
  const [transcriptSuggested, setTranscriptSuggested] = useState(false);

  const niveauPropose = niveauCalculeVigilance(classification);
  const [niveauRetenu, setNiveauRetenu] = useState(niveauPropose);
  useEffect(() => { setNiveauRetenu(niveauPropose); }, [niveauPropose]);

  function handleTranscriptFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setTranscriptFile(file);
    setTranscriptSuggested(false);
  }

  function analyserTranscriptAvecIA() {
    setAnalyzingTranscript(true);
    setTimeout(() => {
      const suggestion = IA_SUGGESTIONS_VIGILANCE_DEMO[Math.floor(Math.random() * IA_SUGGESTIONS_VIGILANCE_DEMO.length)];
      setClassification(suggestion.classification);
      setCommentaireVigilance(suggestion.justification);
      setTranscriptSuggested(true);
      setAnalyzingTranscript(false);
    }, 1400);
  }

  const [regimeFiscal, setRegimeFiscal] = useState('IS');
  const [fonctionDirigeant, setFonctionDirigeant] = useState('Gérant');
  const [exerciceOuverture, setExerciceOuverture] = useState('2026-01-01');
  const [exerciceCloture, setExerciceCloture] = useState('2026-12-31');
  const [adresseSiege, setAdresseSiege] = useState(SCENARIO_NOUVEAU_CLIENT.adresse);

  // ---- Choix du modèle de lettre de mission et honoraires ----
  const [ldmCabinet, setLdmCabinet] = useState('aec');
  const [ldmTenue, setLdmTenue] = useState(true);
  const [ldmJp, setLdmJp] = useState(false);
  const [ldmAncienForfait, setLdmAncienForfait] = useState(false);
  const [ldmChamps, setLdmChamps] = useState({});

  const ldmCategorie = ({
    'Société': 'societe', 'Entreprise individuelle': 'ei', 'Association': 'ei', 'Particulier IRPP': 'irpp',
  })[nature] || 'societe';
  const ldmChoix = { cabinet: ldmCabinet, categorie: ldmCategorie, tenue: ldmTenue, social: salariesEffective, jp: ldmJp, ancienForfait: ldmAncienForfait };
  const ldmAxes = ldmAxesUtiles(ldmCabinet, ldmCategorie);
  const modeleLdm = ldmModele(ldmChoix);
  const montants = ldmMontants({
    categorie: ldmCategorie,
    mensuelCompta: honoraires,
    mensuelSocial: salariesEffective ? (Number(nbSalaries) || 0) * (Number(montantBulletin) || 0) : 0,
    annuelDirect: honoraires,
  });

  function majChamp(code, valeur) { setLdmChamps(prev => ({ ...prev, [code]: valeur })); }

  const [generation, setGeneration] = useState(null);

  /* Le modèle vit sur le poste du cabinet : on le fait désigner plutôt que de
     l'embarquer dans l'application. Le remplissage et le téléchargement se
     font ensuite entièrement dans le navigateur. */
  async function genererLettre(evenement) {
    const fichier = evenement.target.files && evenement.target.files[0];
    evenement.target.value = '';
    if (!fichier) return;
    setGeneration({ enCours: true });
    try {
      const valeurs = ldmValeursWord({
        categorie: ldmCategorie,
        champs: { ...ldmChamps, denomination: ldmChamps.denomination || SCENARIO_NOUVEAU_CLIENT.societe },
        montants,
      });
      const nom = ldmNomFichier({
        cabinet: (LDM_CABINETS.find(c => c.id === ldmCabinet) || {}).nom,
        client: ldmChamps.denomination || SCENARIO_NOUVEAU_CLIENT.societe,
        categorie: (LDM_CATEGORIES.find(c => c.id === ldmCategorie) || {}).nom,
      });
      const bilan = await docxGenererLettre(fichier, valeurs, nom);
      setGeneration({ ...bilan, fichier: nom });
      showToast(`Lettre générée : ${bilan.remplis} champ(s) remplis.`);
    } catch (err) {
      setGeneration({ erreur: err.message });
    }
  }

  function next() { setStep(s => Math.min(CONTRACT_STEPS.length, s + 1)); }
  function prev() { setStep(s => Math.max(1, s - 1)); }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, "Création d'un nouveau dossier client"), h('p', { className: 'subtitle' }, `Étape ${step} sur ${CONTRACT_STEPS.length} — ${CONTRACT_STEPS[step - 1]}`))
    ),
    h(Stepper, { steps: CONTRACT_STEPS, current: step }),

    step === 1 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2' },
        h(FormSection, { icon: '🏢', title: 'Société à reprendre', ton: 'bleu' },
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Numéro SIRET du client'),
            h('div', { className: 'input-with-btn' },
              h('input', { className: 'form-input', value: siret, onChange: e => setSiret(e.target.value) }),
              h('button', { className: 'btn btn-accent', onClick: () => setSocieteAnalysee(true) }, '🔎 Analyser')
            ),
            h('div', { className: 'form-help' }, 'Les informations légales sont récupérées automatiquement : vous n’avez rien à ressaisir.')
          )
        ),
        h(FormSection, { icon: '📋', title: 'Fiche légale', ton: societeAnalysee ? 'vert' : 'gris' },
          societeAnalysee
            ? h('div', null,
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Société'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.societe)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Gérant'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.dirigeant)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Activité'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.activite)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Adresse'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.adresse)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.formeJuridique))
            )
            : h('div', { className: 'empty-detail', style: { padding: '18px 0' } },
              h('div', { className: 'empty-icon' }, '🔎'),
              h('div', null, 'Cliquez sur Analyser pour récupérer la fiche.'))
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-primary', disabled: !societeAnalysee, onClick: next }, 'Confirmer les informations →')
      )
    ),

    step === 2 && h('div', { className: 'step-body' },
      h('div', { className: 'progress-banner', style: { marginTop: 0, marginBottom: 18 } }, '📁 ',
        `Dossier créé dans l’espace Drive de ${collaborateurConnecte.nom} pour ${SCENARIO_NOUVEAU_CLIENT.societe}.`),
      h('div', { className: 'drive-grid' },
        DRIVE_TREE.map((racine, i) => h(FormSection, {
          key: racine.name, icon: '📁', title: racine.name.replace(/^\d+_/, ''),
          ton: ['bleu', 'vert', 'orange', 'violet', 'gris'][i % 5],
        },
          racine.children && racine.children.length
            ? h(FolderTree, { nodes: racine.children })
            : h('div', { className: 'form-help', style: { marginTop: 0 } }, 'Dossier créé, vide pour l’instant.')
        ))
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 3 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2' },
        h(FormSection, { icon: '🏷️', title: 'Nature du contractant', ton: 'bleu' },
          h('div', { className: 'radio-card-row' },
            ['Entreprise individuelle', 'Société', 'Association', 'Particulier IRPP'].map(n => h('button', {
              key: n, className: cx('radio-card', nature === n && 'selected'), onClick: () => setNature(n),
            }, n))
          ),
          isParticulierIRPP ? h('div', { className: 'form-group', style: { marginTop: 20, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Catégorie de location meublée'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', lmpLmnp === 'LMP' && 'selected yes'), onClick: () => setLmpLmnp('LMP') }, 'LMP'),
              h('button', { className: cx('toggle-btn', lmpLmnp === 'LMNP' && 'selected yes'), onClick: () => setLmpLmnp('LMNP') }, 'LMNP')
            )
          ) : h('div', { className: 'form-group', style: { marginTop: 20, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Régime fiscal'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', regimeFiscal === 'IS' && 'selected yes'), onClick: () => setRegimeFiscal('IS') }, 'IS'),
              h('button', { className: cx('toggle-btn', regimeFiscal === 'IR' && 'selected yes'), onClick: () => setRegimeFiscal('IR') }, 'IR')
            )
          )
        ),
        h(FormSection, { icon: '✍️', title: 'Dirigeant signataire', ton: 'violet' },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Civilité, prénom et nom'),
            h('div', { style: { display: 'flex', gap: 10 } },
              h('select', { className: 'form-select', style: { maxWidth: 100 }, value: civilite, onChange: e => setCivilite(e.target.value) },
                h('option', null, 'M.'), h('option', null, 'Mme')
              ),
              h('input', { className: 'form-input', placeholder: 'Prénom', value: prenomDirigeant, onChange: e => setPrenomDirigeant(e.target.value) }),
              h('input', { className: 'form-input', placeholder: 'Nom', value: nomDirigeant, onChange: e => setNomDirigeant(e.target.value) })
            ),
            h('div', { className: 'form-help' }, 'Repris des informations légales — à confirmer ou modifier.')
          ),
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Fonction dans la société'),
            h('select', { className: 'form-select', value: fonctionDirigeant, onChange: e => setFonctionDirigeant(e.target.value) },
              ['Président', 'Directeur général', 'Gérant', 'Chef d’entreprise'].map(f => h('option', { key: f, value: f }, f))
            )
          )
        )
      ),
      h('div', { className: 'grid-2', style: { marginTop: 26 } },
        h(FormSection, { icon: '📅', title: 'Exercice comptable', ton: 'vert' },
          h('div', { className: 'grid-2' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Ouverture'),
              h('input', { type: 'date', className: 'form-input', value: exerciceOuverture, onChange: e => setExerciceOuverture(e.target.value) })
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Clôture'),
              h('input', { type: 'date', className: 'form-input', value: exerciceCloture, onChange: e => setExerciceCloture(e.target.value) })
            )
          )
        ),
        h(FormSection, { icon: '📍', title: 'Siège social', ton: 'orange' },
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Adresse complète'),
            h('input', { className: 'form-input', value: adresseSiege, onChange: e => setAdresseSiege(e.target.value) }),
            h('div', { className: 'form-help' }, 'Reprise dans la lettre de mission.')
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 4 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2' },
        h(FormSection, { icon: '📄', title: 'Modèle de lettre de mission', ton: 'bleu' },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Cabinet émetteur'),
            h('div', { className: 'radio-card-row' },
              LDM_CABINETS.map(c => h('button', {
                key: c.id, className: cx('radio-card', ldmCabinet === c.id && 'selected'),
                onClick: () => setLdmCabinet(c.id),
              }, c.nom))
            )
          ),
          ldmAxes.tenue ? h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Tenue de la comptabilité par le cabinet'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', ldmTenue && 'selected yes'), onClick: () => setLdmTenue(true) }, 'Avec tenue'),
              h('button', { className: cx('toggle-btn', !ldmTenue && 'selected no'), onClick: () => setLdmTenue(false) }, 'Sans tenue')
            )
          ) : null,
          ldmAxes.jp ? h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Volet juridique et patrimonial'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', ldmJp && 'selected yes'), onClick: () => setLdmJp(true) }, 'Avec JP'),
              h('button', { className: cx('toggle-btn', !ldmJp && 'selected no'), onClick: () => setLdmJp(false) }, 'Sans JP')
            )
          ) : null,
          ldmAxes.ancienForfait ? h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Grille tarifaire'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', !ldmAncienForfait && 'selected yes'), onClick: () => setLdmAncienForfait(false) }, 'Forfait actuel'),
              h('button', { className: cx('toggle-btn', ldmAncienForfait && 'selected yes'), onClick: () => setLdmAncienForfait(true) }, 'Ancien forfait')
            )
          ) : null,
          h('div', { className: cx('info-box', !modeleLdm && 'info-box-alerte'), style: { marginTop: 18 } },
            modeleLdm ? '📄 ' : '⚠️ ',
            modeleLdm
              ? h('span', null, 'Modèle retenu : ', h('b', null, modeleLdm.libelle))
              : 'Aucun modèle ne correspond à cette combinaison.'
          )
        ),
        h('div', null,
          h(FormSection, { icon: '💶', title: 'Honoraires', ton: 'vert' },
            h('div', { className: 'form-group', style: { marginBottom: salariesEffective ? 18 : 0 } },
              h('label', { className: 'form-label' }, montants.annuelSeul ? 'Honoraires annuels HT' : 'Honoraires comptables mensuels HT'),
              h('div', { className: 'input-with-btn' },
                h('input', { className: 'form-input', value: honoraires, onChange: e => setHonoraires(e.target.value) }),
                h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€')
              )
            ),
            !montants.annuelSeul && salariesEffective ? h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Honoraires sociaux mensuels HT'),
              h('div', { className: 'ldm-calcule' }, euros(montants.socialMensuelHT)),
              h('div', { className: 'form-help' }, `${nbSalaries} bulletin(s) × ${montantBulletin} €`)
            ) : null
          ),
          h(FormSection, { icon: '🧮', title: 'Totaux calculés', ton: 'gris' },
            !montants.annuelSeul ? h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Total mensuel HT'), h('span', { className: 'v' }, euros(montants.totalMensuelHT))) : null,
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Total annuel HT'), h('span', { className: 'v' }, euros(montants.totalAnnuelHT))),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, `TVA ${Math.round(LDM_TAUX_TVA * 100)} %`), h('span', { className: 'v' }, euros(montants.tvaAnnuelle))),
            h('div', { className: 'ldm-total' }, h('span', null, 'Total annuel TTC'), h('strong', null, euros(montants.totalAnnuelTTC)))
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', disabled: !modeleLdm, onClick: next }, 'Continuer →')
      )
    ),

    step === 5 && h('div', { className: 'step-body' },
      modeleLdm ? h('div', { className: 'info-box', style: { marginBottom: 20 } }, '📄 ',
        h('span', null, 'Modèle à désigner : ', h('b', null, modeleLdm.fichier.split('/').pop()))
      ) : null,
      generation && !generation.enCours ? h('div', {
        className: cx('info-box', (generation.erreur || (generation.manquants || []).length) && 'info-box-alerte'),
        style: { marginBottom: 20 },
      },
        generation.erreur
          ? h('span', null, '⚠️ ', generation.erreur)
          : (generation.manquants || []).length
            ? h('span', null, '⚠️ ', h('b', null, `${generation.fichier} téléchargé`), ` — ${generation.remplis} champ(s) remplis sur ${generation.attendus}. À compléter dans Word : ${generation.manquants.join(', ')}.`)
            : h('span', null, '✅ ', h('b', null, `${generation.fichier} téléchargé`), ` — les ${generation.remplis} champs de la lettre sont remplis.`)
      ) : null,
      h(FormSection, { icon: '✍️', title: 'Mentions reprises dans la lettre', ton: 'violet' },
        h('div', { className: 'champs-grid' },
          (LDM_CHAMPS_PAR_CATEGORIE[ldmCategorie] || []).concat(LDM_CHAMPS_COMMUNS).map(champ =>
            h('div', { className: 'form-group', key: champ.code, style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, champ.label),
              champ.type === 'liste'
                ? h('select', {
                  className: 'form-select', value: ldmChamps[champ.code] || '',
                  onChange: e => majChamp(champ.code, e.target.value),
                }, h('option', { value: '' }, '— Choisir —'), champ.options.map(o => h('option', { key: o, value: o }, o)))
                : h('input', {
                  className: 'form-input', type: champ.type === 'date' ? 'date' : 'text',
                  placeholder: champ.placeholder || '',
                  value: ldmChamps[champ.code] || '',
                  onChange: e => majChamp(champ.code, e.target.value),
                }),
              champ.aide ? h('div', { className: 'form-help' }, champ.aide) : null,
              champ.code === 'activite' ? h('div', { className: 'phrase-apercu' },
                h('span', { className: 'phrase-apercu-titre' }, 'Dans la lettre'),
                h('span', null, phraseActivite(ldmChamps.activite, ldmChamps.adresse)),
                ldmChamps.activite && reformulerActivite(ldmChamps.activite) !== ldmChamps.activite
                  ? h('button', {
                    className: 'btn btn-secondary btn-sm', style: { marginTop: 10 },
                    onClick: () => majChamp('activite', reformulerActivite(ldmChamps.activite)),
                  }, '✨ Adopter cette formulation')
                  : null
              ) : null
            ))
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('label', { className: cx('btn', 'btn-accent', 'btn-fichier', !modeleLdm && 'btn-inerte') },
          generation && generation.enCours ? 'Génération…' : '📄 Générer la lettre',
          h('input', { type: 'file', accept: '.docx', className: 'input-fichier-couvrant', disabled: !modeleLdm, onChange: genererLettre, 'aria-label': 'Choisir le modèle Word de lettre de mission' })
        ),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 6 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h(FormSection, { icon: '🤖', title: 'Récupérés automatiquement', ton: 'bleu' },
            h('div', { className: 'folder-list' },
              h('div', { className: 'folder-item' },
                h('span', null, statuts ? '✅' : '●'), h('span', { style: { flex: 1 } }, 'Statuts de la société'),
                h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setStatuts(true) }, statuts ? 'Récupéré' : 'Récupérer')
              ),
              h('div', { className: 'folder-item' },
                h('span', null, beneficiaires ? '✅' : '●'), h('span', { style: { flex: 1 } }, 'Bénéficiaires effectifs'),
                h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setBeneficiaires(true) }, beneficiaires ? 'Interrogé' : 'Interroger')
              )
            ),
            h('div', { className: 'form-help', style: { marginTop: 10, marginBottom: 0 } }, 'Interrogation via API, classement automatique dans le Drive du client.')
          ),
          h(FormSection, { icon: '📨', title: 'À demander au client', ton: 'bleu' },
            h('div', { className: 'letter-meta', style: { marginBottom: 12 } },
              h('div', null, h('b', null, 'Destinataire : '), 'contact@sarl-dupont.fr'),
              h('div', null, h('b', null, 'Objet : '), 'Documents à nous transmettre pour l’ouverture de votre dossier')
            ),
            h('div', { className: 'checkbox-grid' },
              DOCUMENTS_A_DEMANDER_CLIENT.map(d => h('label', { className: 'checkbox-row', key: d },
                h('input', { type: 'checkbox', checked: !!docsDemandes[d], onChange: () => setDocsDemandes(prev => ({ ...prev, [d]: !prev[d] })) }), d
              ))
            )
          )
        ),
        h(FormSection, { icon: '✉️', title: 'Aperçu de l’e-mail', ton: 'bleu', style: { display: 'flex', flexDirection: 'column' } },
          h('div', { className: 'letter-preview', style: { flex: 1, marginBottom: 12 } },
`Bonjour ${SCENARIO_NOUVEAU_CLIENT.dirigeantCivilite} ${SCENARIO_NOUVEAU_CLIENT.dirigeantNom},

Nous vous confirmons l'ouverture de votre dossier auprès de notre cabinet.

Afin de le finaliser dans les meilleurs délais, pourriez-vous nous transmettre les documents suivants :
${DOCUMENTS_A_DEMANDER_CLIENT.filter(d => docsDemandes[d]).map(d => `\n  • ${d}`).join('') || '\n  • (aucun document sélectionné)'}

Vous pouvez nous les faire parvenir par retour de mail ou les déposer directement sur votre espace Drive dédié.

N'hésitez pas à revenir vers nous pour toute question.

Bien cordialement,

Martin Dupont
Expert-comptable`
          ),
          h('button', { className: 'btn btn-accent btn-block', onClick: () => showToast('Email de demande envoyé au client (démonstration)') }, "✉️ Envoyer l'e-mail au client")
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 7 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2-uneven' },
        h('div', null,
          h(FormSection, { icon: '🎯', title: 'Notez le risque sur quatre critères', ton: 'violet' },
            h('div', { className: 'nplab-grid' },
              NPLAB_CRITERES.map(crit => h('div', { className: cx('nplab-cell', 'niv-' + classification[crit.code]), key: crit.code },
                h('div', { className: 'nplab-label' }, crit.label),
                h('div', { className: 'nplab-choices' },
                  ['Faible', 'Moyen', 'Élevé'].map(n => h('button', {
                    key: n,
                    className: cx('nplab-choice', classification[crit.code] === n && 'active', 'niv-' + n),
                    onClick: () => setClassification(prev => ({ ...prev, [crit.code]: n })),
                  }, n))
                )
              ))
            )
          ),
          h(FormSection, { icon: '📝', title: 'Justification', ton: 'orange' },
            h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 } },
              h('label', { className: 'btn btn-secondary btn-sm', style: { cursor: 'pointer', display: 'inline-flex' } },
                transcriptFile ? `📄 ${transcriptFile.name}` : '📎 Déposer la retranscription d’entretien',
                h('input', { type: 'file', accept: '.pdf,.doc,.docx', style: { display: 'none' }, onChange: handleTranscriptFile })
              ),
              transcriptFile ? h('button', { type: 'button', className: 'btn btn-accent btn-sm', disabled: analyzingTranscript, onClick: analyserTranscriptAvecIA }, analyzingTranscript ? 'Analyse en cours…' : '🤖 Analyser avec l’IA') : null
            ),
            h('textarea', { className: 'form-textarea', rows: 3, placeholder: 'Motivez le niveau retenu au regard de l’activité, de la localisation et des opérations du client…', value: commentaireVigilance, onChange: e => setCommentaireVigilance(e.target.value) })
          )
        ),
        h(FormSection, {
          icon: '🛡️', title: 'Niveau de vigilance',
          ton: niveauRetenu === 'Renforcée' ? 'orange' : 'vert',
        },
          h('div', { className: 'vig-calcule' },
            h('span', { className: 'vig-calcule-label' }, 'Calculé automatiquement'),
            h('span', { className: cx('vig-calcule-valeur', 'niv-' + niveauPropose) }, niveauPropose)
          ),
          h('div', { className: 'form-label', style: { marginTop: 20 } }, 'Niveau retenu par le cabinet'),
          h('div', { className: 'toggle-pair', style: { flexDirection: 'column' } },
            ['Allégée', 'Normale', 'Renforcée'].map(n => h('button', {
              key: n,
              className: cx('toggle-btn', niveauRetenu === n && (n === 'Renforcée' ? 'selected no' : 'selected yes')),
              onClick: () => setNiveauRetenu(n),
            }, n))
          ),
          niveauRetenu !== niveauPropose
            ? h('div', { className: 'info-box info-box-alerte', style: { marginTop: 14 } }, '⚠️ ', 'Niveau différent du calcul : la justification devient obligatoire.')
            : h('div', { className: 'form-help' }, 'Vous pouvez retenir un niveau différent du calcul, à condition de le motiver.')
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 8 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2-uneven', style: { alignItems: 'stretch' } },
        h('div', { className: 'recap-grid' },
          h('div', { className: 'recap-tile' },
            h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '🏢'), 'Société'),
            h('div', { className: 'recap-tile-main' }, SCENARIO_NOUVEAU_CLIENT.societe),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Nature'), h('span', { className: 'v' }, nature + (isParticulierIRPP ? ` (${lmpLmnp})` : ''))),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, `${civilite} ${prenomDirigeant} ${nomDirigeant}`)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Clôture'), h('span', { className: 'v' }, dateCloture))
          ),
          h('div', { className: 'recap-tile' },
            h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '📝'), 'Mission et honoraires'),
            h('div', { className: 'recap-tile-main' }, honoraires + ' € HT / mois'),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Modèle'), h('span', { className: 'v' }, nature + (salariesEffective ? ' avec social' : ''))),
            isSociete ? h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Situation compta.'), h('span', { className: 'v' }, situationComptable ? (situationComptableType === 'Offerte' ? 'Offerte' : `Facturée ${situationComptableMontant} €`) : 'Non')) : null,
            salariesEffective ? h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Salariés'), h('span', { className: 'v' }, `${nbSalaries} · ${montantBulletin} €/bulletin`)) : null,
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Signataire'), h('span', { className: 'v' }, signataire))
          ),
          h('div', { className: 'recap-tile' },
            h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '🔍'), 'Vigilance LBC-FT'),
            h('div', { className: 'recap-tile-main' },
              h(Badge, { color: niveauVigilanceCouleur(niveauRetenu) }, 'Vigilance ' + niveauRetenu.toLowerCase())
            ),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Niveau calculé'), h('span', { className: 'v' }, niveauPropose)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Justification'), h('span', { className: 'v' }, commentaireVigilance ? 'Renseignée' : 'Manquante'))
          ),
          h('div', { className: 'recap-tile' },
            h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '📨'), 'Documents'),
            h('div', { className: 'recap-tile-main' }, DOCUMENTS_A_DEMANDER_CLIENT.filter(d => docsDemandes[d]).length + ' demandés au client'),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Statuts'), h('span', { className: 'v' }, statuts ? 'Récupérés' : 'À récupérer')),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Bénéf. effectifs'), h('span', { className: 'v' }, beneficiaires ? 'Interrogés' : 'À interroger')),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Drive'), h('span', { className: 'v' }, '5 dossiers créés'))
          )
        ),
        h(FormSection, { icon: '✅', title: 'À la finalisation', ton: 'vert' },
          h('div', { className: 'action-row' }, '📄 Génération de la lettre de mission'),
          h('div', { className: 'action-row' }, '📄 Enregistrement de l’analyse LBC-FT'),
          h('div', { className: 'action-row' }, '✉️ Envoi de la demande de documents'),
          h('div', { className: 'action-row' }, '📁 Classement des éléments dans le Drive'),
          h('div', { className: 'action-row' }, '🕐 Historisation de l’ouverture du dossier')
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('span')
      )
    )
  );
}
