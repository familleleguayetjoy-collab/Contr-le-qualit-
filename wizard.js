// ComplyEC — Assistants partagés : Reprise déontologique & Contractualisation
'use strict';

// ============================================================ Reprise déontologique

const REPRISE_STEPS = ['Paramétrage de la reprise', 'Courrier et e-mail'];


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
    return h(RepriseEtape2, {
      onBack: () => setStep(1),
      collaborateurCharge, showToast, dateReprise,
      pieces, togglePiece, piecesSupplementaires, nouvellePiece, setNouvellePiece, ajouterPiece,
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

    h(Card, { title: 'Paramétrage de la reprise', subtitle: 'Le client repris, le confrère à prévenir et le collaborateur en charge.', icon: '🤝', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h(FormSection, { icon: '🏢', title: 'Client repris' },
            h('div', { className: 'grid-2' },
              h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'SIRET du client'),
                h('div', { className: 'input-with-btn' },
                  h('input', { className: 'form-input', value: siret, onChange: e => setSiret(e.target.value) }),
                  h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setClientTrouve(true) }, '🔍')
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
          h(FormSection, { icon: '👤', title: 'Suivi interne' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Collaborateur chargé du dossier'),
              h('select', { className: 'form-select', value: collaborateurCharge, onChange: e => setCollaborateurCharge(e.target.value) },
                COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
              )
            )
          )
        ),
        h(FormSection, { icon: '🤝', title: 'Cabinet confrère' },
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
        h('span'),
        h('button', { className: 'btn btn-primary', onClick: () => setStep(2) }, 'Choisir les pièces →')
      )
    )
  );
}

function RepriseEtape2({ onBack, collaborateurCharge, showToast, dateReprise, pieces, togglePiece, piecesSupplementaires, nouvellePiece, setNouvellePiece, ajouterPiece }) {
  const listePieces = [...PIECES_REPRISE, ...piecesSupplementaires];
  const retenues = listePieces.filter(p => pieces[p]);
  const dateStr = formatDateLong(dateReprise);
  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Reprise déontologique'), h('p', { className: 'subtitle' }, 'Relisez, puis envoyez au confrère et au client.')),
      h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour au paramétrage')
    ),
    h(Stepper, { steps: REPRISE_STEPS, current: 2 }),
    h(Card, { title: 'Pièces demandées au confrère', subtitle: 'Le courrier et l’e-mail se mettent à jour à chaque case cochée.', icon: '📎', iconBg: '#E7F7ED', iconColor: '#16A34A', tone: 'bleu', style: { marginBottom: 18 } },
      h('div', { className: 'checkbox-grid cols-3' },
        listePieces.map(p => h('label', { className: 'checkbox-row', key: p },
          h('input', { type: 'checkbox', checked: !!pieces[p], onChange: () => togglePiece(p) }), p
        ))
      ),
      h('div', { className: 'input-with-btn', style: { marginTop: 12, maxWidth: 420 } },
        h('input', { className: 'form-input', placeholder: 'Ajouter un document supplémentaire…', value: nouvellePiece, onChange: e => setNouvellePiece(e.target.value), onKeyDown: e => { if (e.key === 'Enter') ajouterPiece(); } }),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: ajouterPiece }, '+ Ajouter')
      )
    ),
    h('div', { className: 'two-col-preview' },
      h(Card, { title: 'Courrier à valider', subtitle: 'Généré à partir de vos réponses à l’étape précédente.', icon: '📄', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu' },
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
      h(Card, { title: 'E-mail au confrère', subtitle: 'Le courrier part en pièce jointe.', icon: '✉️', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'bleu' },
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
  );
}

// ============================================================ Contractualisation (6 étapes)
// Composant partagé, utilisé par le module Expert-comptable (Entrée en mission > Contractualisation)
// et par le module Collaborateur (Nouveau dossier).

/* Regroupe un thème du formulaire dans son propre rectangle titré. */
function FormSection({ icon, title, children, style }) {
  return h('div', { className: 'form-section', style },
    h('div', { className: 'form-section-title' },
      icon ? h('span', { className: 'form-section-icon' }, icon) : null,
      h('span', { className: 'card-title-ink' }, title)
    ),
    children
  );
}

const CONTRACT_STEPS = ['Société', 'Dossier Drive', 'Contractant', 'Mission / LDM', 'Documents', 'Vigilance LBC-FT', 'Validation'];

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

  function next() { setStep(s => Math.min(CONTRACT_STEPS.length, s + 1)); }
  function prev() { setStep(s => Math.max(1, s - 1)); }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, "Création d'un nouveau dossier client"), h('p', { className: 'subtitle' }, `Étape ${step} — ${CONTRACT_STEPS[step - 1]}`))
    ),
    h(Stepper, { steps: CONTRACT_STEPS, current: step }),

    step === 1 && h(Card, { title: 'Identifier la société', subtitle: 'Le SIRET suffit : la fiche légale est récupérée automatiquement.', icon: '🏢', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h('label', { className: 'form-label' }, 'SIRET'),
          h('div', { className: 'input-with-btn' },
            h('input', { className: 'form-input', value: siret, onChange: e => setSiret(e.target.value) }),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setSocieteAnalysee(true) }, '🔎 Analyser')
          )
        ),
        societeAnalysee ? h('div', { className: 'identity-panel' },
          h('div', { className: 'identity-panel-title' }, 'Fiche légale récupérée'),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Société'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.societe)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Gérant'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.dirigeant)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Activité'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.activite)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Adresse'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.adresse)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.formeJuridique))
        ) : h('div', { className: 'empty-detail', style: { padding: '10px 0' } }, "Renseignez le SIRET puis cliquez sur Analyser pour récupérer les informations légales.")
      ),
      h('div', { className: 'wizard-footer' },
        h('span'),
        h('button', { className: 'btn btn-primary', disabled: !societeAnalysee, onClick: next }, 'Confirmer les informations →')
      )
    ),

    step === 2 && h(Card, { title: 'Dossier Drive', subtitle: 'L’arborescence type du cabinet, créée d’un coup.', icon: '📁', iconBg: '#FEF3E1', iconColor: '#B45309', tone: 'bleu' },
      h('div', { className: 'progress-banner', style: { marginTop: 0, marginBottom: 14 } }, '📁 ',
        `Dossier créé dans l’espace Drive de ${collaborateurConnecte.nom} pour ${SCENARIO_NOUVEAU_CLIENT.societe}.`),
      h('div', { className: 'drive-tree-cols' }, h(FolderTree, { nodes: DRIVE_TREE })),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 3 && h(Card, { title: 'Identification du contractant', subtitle: 'Qui signe la lettre de mission, et à quel titre.', icon: '👤', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu' },
      h('div', { className: 'grid-2' },
        h(FormSection, { icon: '🏷️', title: 'Nature du contractant' },
          h('div', { className: 'radio-card-row' },
            ['Entreprise individuelle', 'Société', 'Association', 'Particulier IRPP'].map(n => h('button', {
              key: n, className: cx('radio-card', nature === n && 'selected'), onClick: () => setNature(n),
            }, n))
          ),
          isParticulierIRPP ? h('div', { className: 'form-group', style: { marginTop: 14, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Catégorie de location meublée'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', lmpLmnp === 'LMP' && 'selected yes'), onClick: () => setLmpLmnp('LMP') }, 'LMP'),
              h('button', { className: cx('toggle-btn', lmpLmnp === 'LMNP' && 'selected yes'), onClick: () => setLmpLmnp('LMNP') }, 'LMNP')
            ),
            h('div', { className: 'form-help' }, 'Loueur Meublé Professionnel ou Non Professionnel.')
          ) : null
        ),
        h(FormSection, { icon: '✍️', title: 'Dirigeant signataire' },
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Civilité, prénom et nom'),
            h('div', { style: { display: 'flex', gap: 8 } },
              h('select', { className: 'form-select', style: { maxWidth: 90 }, value: civilite, onChange: e => setCivilite(e.target.value) },
                h('option', null, 'M.'), h('option', null, 'Mme')
              ),
              h('input', { className: 'form-input', placeholder: 'Prénom', value: prenomDirigeant, onChange: e => setPrenomDirigeant(e.target.value) }),
              h('input', { className: 'form-input', placeholder: 'Nom', value: nomDirigeant, onChange: e => setNomDirigeant(e.target.value) })
            ),
            h('div', { className: 'form-help' }, 'Repris des informations légales — à confirmer ou modifier.')
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 4 && h(Card, { title: 'Mission et lettre de mission', subtitle: 'Honoraires, volet social : la LDM se rédige à partir de votre modèle.', icon: '📝', iconBg: '#E7F7ED', iconColor: '#16A34A', tone: 'bleu' },
      h('div', { className: 'grid-2' },
        h(FormSection, { icon: '📘', title: 'Mission comptable' },
          h('div', { className: 'grid-2' },
            h('div', { className: 'form-group' },
              h('label', { className: 'form-label' }, 'Honoraires mensuels HT'),
              h('div', { className: 'input-with-btn' }, h('input', { className: 'form-input', value: honoraires, onChange: e => setHonoraires(e.target.value) }), h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€'))
            ),
            isSociete ? h('div', { className: 'form-group' },
              h('label', { className: 'form-label' }, 'Remise frais de paramétrage'),
              h('div', { className: 'toggle-pair' },
                h('button', { className: cx('toggle-btn', remiseFrais && 'selected yes'), onClick: () => setRemiseFrais(true) }, 'Oui'),
                h('button', { className: cx('toggle-btn', !remiseFrais && 'selected no'), onClick: () => setRemiseFrais(false) }, 'Non')
              )
            ) : null
          ),
          isSociete ? h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Situation comptable'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', situationComptable && 'selected yes'), onClick: () => setSituationComptable(true) }, 'Oui'),
              h('button', { className: cx('toggle-btn', !situationComptable && 'selected no'), onClick: () => setSituationComptable(false) }, 'Non')
            ),
            situationComptable ? h('div', { style: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
              h('div', { className: 'toggle-pair' },
                h('button', { className: cx('toggle-btn', situationComptableType === 'Offerte' && 'selected yes'), onClick: () => setSituationComptableType('Offerte') }, 'Offerte'),
                h('button', { className: cx('toggle-btn', situationComptableType === 'Facturée' && 'selected yes'), onClick: () => setSituationComptableType('Facturée') }, 'Facturée')
              ),
              situationComptableType === 'Facturée' ? h('div', { className: 'input-with-btn', style: { maxWidth: 160 } },
                h('input', { className: 'form-input', value: situationComptableMontant, onChange: e => setSituationComptableMontant(e.target.value) }),
                h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€')
              ) : null
            ) : null
          ) : null,
          h('div', { className: 'grid-2' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Expert-comptable signataire'),
              h('input', { className: 'form-input', value: signataire, onChange: e => setSignataire(e.target.value) })
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Date de clôture'),
              h('input', { className: 'form-input', value: dateCloture, onChange: e => setDateCloture(e.target.value) })
            )
          )
        ),
        h('div', null,
          !isParticulierIRPP ? h(FormSection, { icon: '👥', title: 'Volet social' },
            h('div', { className: 'form-group', style: salariesEffective ? {} : { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Présence de salariés'),
              h('div', { className: 'toggle-pair' },
                h('button', { className: cx('toggle-btn', salaries && 'selected yes'), onClick: () => setSalaries(true) }, 'Oui'),
                h('button', { className: cx('toggle-btn', !salaries && 'selected no'), onClick: () => setSalaries(false) }, 'Non')
              )
            ),
            salariesEffective ? h('div', { className: 'grid-2' },
              h('div', { className: 'form-group' },
                h('label', { className: 'form-label' }, 'Nombre de salariés'),
                h('input', { className: 'form-input', value: nbSalaries, onChange: e => setNbSalaries(e.target.value) })
              ),
              h('div', { className: 'form-group' },
                h('label', { className: 'form-label' }, 'Montant du bulletin (HT)'),
                h('div', { className: 'input-with-btn' },
                  h('input', { className: 'form-input', value: montantBulletin, onChange: e => setMontantBulletin(e.target.value) }),
                  h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€')
                )
              )
            ) : null,
            salariesEffective ? h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Frais de paramétrage social entièrement remis ?'),
              h('div', { className: 'toggle-pair' },
                h('button', { className: cx('toggle-btn', remiseFraisSociale && 'selected yes'), onClick: () => setRemiseFraisSociale(true) }, 'Oui'),
                h('button', { className: cx('toggle-btn', !remiseFraisSociale && 'selected no'), onClick: () => setRemiseFraisSociale(false) }, 'Non')
              )
            ) : null
          ) : null,
          h('div', { className: 'info-box', style: { marginTop: 14 } }, '📄 ', isParticulierIRPP
            ? `Modèle proposé : « Déclaration ${lmpLmnp} — Particulier IRPP ».`
            : `Modèle proposé : « Mission de présentation — ${nature.toLowerCase()}${salariesEffective ? ' avec social' : '' } », d’après la nature du contractant et la présence de salariés.`)
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('div', { style: { display: 'flex', gap: 10 } },
          h('button', { className: 'btn btn-secondary', onClick: () => showToast('Lettre de mission générée (démonstration)') }, '📄 Générer la lettre de mission'),
          h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
        )
      )
    ),

    step === 5 && h(Card, { title: 'Documents à collecter', subtitle: 'Ce que le cabinet récupère seul, et ce que vous demandez au client.', icon: '📎', iconBg: '#E9F1FE', iconColor: '#2563EB', tone: 'bleu' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h(FormSection, { icon: '🤖', title: 'Récupérés automatiquement' },
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
          h(FormSection, { icon: '📨', title: 'À demander au client' },
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
        h(FormSection, { icon: '✉️', title: 'Aperçu de l’e-mail', style: { display: 'flex', flexDirection: 'column' } },
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

    step === 6 && h(Card, { title: 'Vigilance LBC-FT', subtitle: 'Notez le risque sur quatre critères : le niveau se calcule tout seul.', icon: '🔍', iconBg: '#F1EAFE', iconColor: '#7C3AED', tone: 'orange' },
      h('div', { className: 'grid-2-uneven' },
        h('div', null,
          h(FormSection, { icon: '🎯', title: 'Classification NPLAB' },
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
          h(FormSection, { icon: '📝', title: 'Justification du niveau retenu' },
            h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 } },
              h('label', { className: 'btn btn-secondary btn-sm', style: { cursor: 'pointer', display: 'inline-flex' } },
                transcriptFile ? `📄 ${transcriptFile.name}` : '📎 Déposer la retranscription d’entretien',
                h('input', { type: 'file', accept: '.pdf,.doc,.docx', style: { display: 'none' }, onChange: handleTranscriptFile })
              ),
              transcriptFile ? h('button', { type: 'button', className: 'btn btn-accent btn-sm', disabled: analyzingTranscript, onClick: analyserTranscriptAvecIA }, analyzingTranscript ? 'Analyse en cours…' : '🤖 Analyser avec l’IA') : null
            ),
            h('textarea', { className: 'form-textarea', rows: 4, placeholder: 'Motivez le niveau retenu au regard de l’activité, de la localisation et des opérations du client…', value: commentaireVigilance, onChange: e => setCommentaireVigilance(e.target.value) }),
            transcriptSuggested ? h('div', { className: 'info-box', style: { marginTop: 10 } }, 'ℹ️ ', 'Classification et justification pré-remplies à partir de la retranscription (démonstration) — vérifiez avant de continuer.') : null
          )
        ),
        h('div', { className: 'result-panel' },
          h('div', { className: 'result-panel-eyebrow' }, 'Niveau calculé'),
          h('div', { className: cx('result-panel-value', 'niv-' + niveauPropose) }, niveauPropose),
          h('div', { className: 'result-panel-note' }, 'Déduit automatiquement des quatre critères notés à gauche.'),
          h('div', { className: 'section-divider' }),
          h('div', { className: 'result-panel-eyebrow' }, 'Niveau retenu'),
          h('div', { className: 'toggle-pair', style: { flexDirection: 'column' } },
            ['Allégée', 'Normale', 'Renforcée'].map(n => h('button', {
              key: n,
              className: cx('toggle-btn', niveauRetenu === n && (n === 'Renforcée' ? 'selected no' : 'selected yes')),
              onClick: () => setNiveauRetenu(n),
            }, n))
          ),
          niveauRetenu !== niveauPropose
            ? h('div', { className: 'info-box', style: { marginTop: 12 } }, '⚠️ ', 'Vous retenez un niveau différent du calcul : la justification ci-contre devient obligatoire.')
            : h('div', { className: 'result-panel-note', style: { marginTop: 12 } }, 'Vous pouvez retenir un niveau différent du calcul, à condition de le motiver.'),
          h('div', { style: { marginTop: 'auto', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 } },
            h('button', { className: 'btn btn-secondary btn-block', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
            h('button', { className: 'btn btn-primary btn-block', onClick: next }, 'Continuer →')
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('span')
      )
    ),

    step === 7 && h(Card, { title: 'Validation finale', subtitle: 'Tout est prêt : voici ce qui sera créé au moment de finaliser.', icon: '✅', iconBg: '#E7F7ED', iconColor: '#16A34A', tone: 'vert' },
      h('div', { className: 'grid-2-uneven' },
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
        h('div', { className: 'result-panel' },
          h('div', { className: 'result-panel-eyebrow' }, 'À la finalisation'),
          h('div', { className: 'action-row' }, '📄 Génération de la lettre de mission'),
          h('div', { className: 'action-row' }, '📄 Enregistrement de l’analyse LBC-FT'),
          h('div', { className: 'action-row' }, '✉️ Envoi de la demande de documents'),
          h('div', { className: 'action-row' }, '📁 Classement des éléments dans le Drive'),
          h('div', { className: 'action-row' }, '🕐 Historisation de l’ouverture du dossier'),
          h('div', { style: { marginTop: 'auto', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 8 } },
            h('button', { className: 'btn btn-secondary btn-block', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
            h('button', { className: 'btn btn-primary btn-block', onClick: () => { showToast('Dossier client finalisé et classé dans le Drive (démonstration)'); if (onFinish) onFinish(); } }, "Finaliser l'ouverture →")
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('span')
      )
    )
  );
}
