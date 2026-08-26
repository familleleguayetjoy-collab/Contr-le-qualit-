// ComplyEC — Assistants partagés : Reprise déontologique & Contractualisation
'use strict';

// ============================================================ Reprise déontologique

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
      collaborateurCharge, setCollaborateurCharge, showToast, dateReprise,
    });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Reprise déontologique'), h('p', { className: 'subtitle' }, 'Étape 1 — Paramétrage de la reprise')),
      h('div', { className: 'page-header-actions' },
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Aperçu généré (démonstration)') }, '👁 Aperçu du courrier'),
        h('button', { className: 'btn btn-accent', onClick: () => setStep(2) }, 'Étape suivante →')
      )
    ),

    h(Card, { title: '① Client repris', style: { marginBottom: 18 } },
      h('div', { className: 'grid-2' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'SIRET du client'),
          h('div', { className: 'input-with-btn' },
            h('input', { className: 'form-input', value: siret, onChange: e => setSiret(e.target.value) }),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setClientTrouve(true) }, '🔍 Interroger')
          )
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Date de reprise'),
          h('input', { type: 'date', className: 'form-input', value: dateReprise, onChange: e => setDateReprise(e.target.value) })
        )
      ),
      clientTrouve ? h('div', { style: { marginTop: 6, background: '#FAFBFC', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' } },
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Société'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.societe)),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Adresse'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.adresse)),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.formeJuridique)),
        h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.dirigeant))
      ) : null
    ),

    h(Card, { title: '② Cabinet confrère', style: { marginBottom: 18 } },
      h('div', { className: 'grid-2' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'SIRET du cabinet confrère'),
          h('div', { className: 'input-with-btn' },
            h('input', { className: 'form-input', value: siretConfrere, onChange: e => setSiretConfrere(e.target.value) }),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setConfrereTrouve(true) }, '🔍 Interroger')
          ),
          confrereTrouve ? h('div', { style: { marginTop: 12, background: '#FAFBFC', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' } },
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Cabinet'), h('span', { className: 'v' }, SCENARIO_CABINET_CONFRERE.cabinet)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Adresse'), h('span', { className: 'v' }, SCENARIO_CABINET_CONFRERE.adresse)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, SCENARIO_CABINET_CONFRERE.formeJuridique))
          ) : null
        ),
        h('div', null,
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Nom du confrère'),
            h('input', { className: 'form-input', value: nomConfrere, onChange: e => setNomConfrere(e.target.value) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Prénom du confrère'),
            h('input', { className: 'form-input', value: prenomConfrere, onChange: e => setPrenomConfrere(e.target.value) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Email du confrère'),
            h('input', { className: 'form-input', value: emailConfrere, onChange: e => setEmailConfrere(e.target.value) })
          )
        )
      )
    ),

    h(Card, { title: '③ Pièces demandées et suivi interne' },
      h('div', { className: 'checkbox-grid' },
        [...PIECES_REPRISE, ...piecesSupplementaires].map(p => h('label', { className: 'checkbox-row', key: p },
          h('input', { type: 'checkbox', checked: !!pieces[p], onChange: () => togglePiece(p) }), p
        ))
      ),
      h('div', { className: 'input-with-btn', style: { marginTop: 12, maxWidth: 420 } },
        h('input', { className: 'form-input', placeholder: 'Ajouter un document supplémentaire…', value: nouvellePiece, onChange: e => setNouvellePiece(e.target.value), onKeyDown: e => { if (e.key === 'Enter') ajouterPiece(); } }),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: ajouterPiece }, '+ Ajouter')
      ),
      h('div', { className: 'form-group', style: { marginTop: 14, maxWidth: 320 } },
        h('label', { className: 'form-label' }, 'Collaborateur chargé du dossier'),
        h('select', { className: 'form-select', value: collaborateurCharge, onChange: e => setCollaborateurCharge(e.target.value) },
          COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
        )
      ),
      h('div', { className: 'info-box', style: { marginTop: 14 } }, 'ℹ️ ', "Les informations légales disponibles sont préremplies automatiquement via API ; les éléments personnels du confrère restent à confirmer."),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 16 } },
        h('button', { className: 'btn btn-primary', onClick: () => setStep(2) }, 'Prévisualiser le courrier →')
      )
    )
  );
}

function RepriseEtape2({ onBack, collaborateurCharge, setCollaborateurCharge, showToast, dateReprise }) {
  const dateStr = formatDateLong(dateReprise);
  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Reprise déontologique'), h('p', { className: 'subtitle' }, 'Étape 2 — Validation du courrier et de l’email')),
      h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour au paramétrage')
    ),
    h('div', { className: 'two-col-preview' },
      h(Card, { title: '📄 Courrier à valider' },
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

  • 3 derniers FEC (Fichiers des Écritures Comptables)
  • Les journaux de paie
  • Le tableau des charges
  • La fiche de paramétrage paie
  • Les contrats de travail et avenants

Dans l'attente de votre retour, nous vous prions d'agréer, Monsieur, l'expression de nos salutations distinguées.

Martin Dupont
Expert-comptable`
        )
      ),
      h(Card, { title: '✉️ Email au confrère' },
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
    h('div', { className: 'card', style: { marginTop: 18, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' } },
      h('div', { style: { minWidth: 260 } },
        h('label', { className: 'form-label' }, 'Collaborateur en charge de la mission'),
        h('select', { className: 'form-select', value: collaborateurCharge, onChange: e => setCollaborateurCharge(e.target.value) },
          COLLABORATEURS.map(c => h('option', { key: c.id, value: c.id }, c.nom))
        )
      ),
      h('div', { className: 'form-help', style: { flex: 1 } }, `ℹ️ Une copie sera transmise à ${collaborateur(collaborateurCharge).nom.split(' ')[0]} pour archivage dans le Drive du dossier.`),
      h('button', { className: 'btn btn-primary', onClick: () => showToast('Reprise finalisée — courrier et email envoyés (démonstration)') }, 'Finaliser la reprise →')
    )
  );
}

// ============================================================ Contractualisation (6 étapes)
// Composant partagé, utilisé par le module Expert-comptable (Entrée en mission > Contractualisation)
// et par le module Collaborateur (Nouveau dossier).

const CONTRACT_STEPS = ['Société', 'Dossier Drive', 'Mission / LDM', 'Documents', 'Vigilance LBC-FT', 'Validation'];

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

  function next() { setStep(s => Math.min(6, s + 1)); }
  function prev() { setStep(s => Math.max(1, s - 1)); }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, "Création d'un nouveau dossier client"), h('p', { className: 'subtitle' }, `Étape ${step} — ${CONTRACT_STEPS[step - 1]}`))
    ),
    h(Stepper, { steps: CONTRACT_STEPS, current: step }),

    step === 1 && h(Card, { title: '① Identifier la société' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h('label', { className: 'form-label' }, 'SIRET'),
          h('div', { className: 'input-with-btn' },
            h('input', { className: 'form-input', value: siret, onChange: e => setSiret(e.target.value) }),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setSocieteAnalysee(true) }, '🔎 Analyser')
          )
        ),
        societeAnalysee ? h('div', { style: { background: '#FAFBFC', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' } },
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

    step === 2 && h(Card, { title: '② Dossier Drive' },
      h('div', { className: 'grid-2-uneven' },
        h('div', null,
          h('div', { className: 'form-help', style: { marginBottom: 10 } }, `Espace collaborateur : ${collaborateurConnecte.nom}  ·  Client : ${SCENARIO_NOUVEAU_CLIENT.societe}`),
          h(FolderTree, { nodes: DRIVE_TREE }),
          h('div', { className: 'progress-banner' }, '📁 ', 'Le dossier client a été créé dans votre espace Drive.')
        ),
        h('div', { className: 'card', style: { background: '#FAFBFC' } },
          h('div', { className: 'summary-block-title' }, 'Résumé du dossier'),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Société'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.societe)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.formeJuridique)),
          h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.dirigeant))
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 3 && h(Card, { title: '③ Mission / Lettre de mission' },

      // ---- Groupe 1 : identification du contractant ----
      h('div', { className: 'summary-block-title' }, '👤 Identification du contractant'),
      h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, 'Nature du contractant'),
        h('div', { className: 'radio-card-row' },
          ['Entreprise individuelle', 'Société', 'Association', 'Particulier IRPP'].map(n => h('button', {
            key: n, className: cx('radio-card', nature === n && 'selected'), onClick: () => setNature(n),
          }, n))
        )
      ),
      isParticulierIRPP ? h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, 'Catégorie de location meublée'),
        h('div', { className: 'toggle-pair' },
          h('button', { className: cx('toggle-btn', lmpLmnp === 'LMP' && 'selected yes'), onClick: () => setLmpLmnp('LMP') }, 'LMP'),
          h('button', { className: cx('toggle-btn', lmpLmnp === 'LMNP' && 'selected yes'), onClick: () => setLmpLmnp('LMNP') }, 'LMNP')
        ),
        h('div', { className: 'form-help' }, 'Loueur Meublé Professionnel ou Non Professionnel.')
      ) : null,
      h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, 'Civilité, prénom et nom du dirigeant'),
        h('div', { style: { display: 'flex', gap: 8 } },
          h('select', { className: 'form-select', style: { maxWidth: 90 }, value: civilite, onChange: e => setCivilite(e.target.value) },
            h('option', null, 'M.'), h('option', null, 'Mme')
          ),
          h('input', { className: 'form-input', placeholder: 'Prénom', value: prenomDirigeant, onChange: e => setPrenomDirigeant(e.target.value) }),
          h('input', { className: 'form-input', placeholder: 'Nom', value: nomDirigeant, onChange: e => setNomDirigeant(e.target.value) })
        ),
        h('div', { className: 'form-help' }, 'Repris depuis les informations légales — à confirmer ou modifier.')
      ),

      h('div', { className: 'section-divider' }),

      // ---- Groupe 2 : mission comptable ----
      h('div', { className: 'summary-block-title' }, '📘 Mission comptable'),
      h('div', { className: 'grid-2' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Honoraires comptables mensuels HT'),
          h('div', { className: 'input-with-btn' }, h('input', { className: 'form-input', value: honoraires, onChange: e => setHonoraires(e.target.value) }), h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€'))
        ),
        isSociete ? h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Remise frais de paramétrage comptable'),
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
      h('div', { className: 'grid-2', style: isSociete ? { marginTop: 14 } : {} },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, "Nom de l'expert-comptable signataire"),
          h('input', { className: 'form-input', value: signataire, onChange: e => setSignataire(e.target.value) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Date de clôture'),
          h('input', { className: 'form-input', value: dateCloture, onChange: e => setDateCloture(e.target.value) }),
          h('div', { className: 'form-help' }, 'Reprise depuis le dossier — à confirmer ou modifier.')
        )
      ),

      !isParticulierIRPP ? h('div', { className: 'section-divider' }) : null,

      // ---- Groupe 3 : volet social ----
      !isParticulierIRPP ? h('div', { className: 'summary-block-title' }, '👥 Volet social') : null,
      !isParticulierIRPP ? h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, 'Présence de salariés'),
        h('div', { className: 'toggle-pair' },
          h('button', { className: cx('toggle-btn', salaries && 'selected yes'), onClick: () => setSalaries(true) }, 'Oui'),
          h('button', { className: cx('toggle-btn', !salaries && 'selected no'), onClick: () => setSalaries(false) }, 'Non')
        )
      ) : null,
      salariesEffective ? h('div', { className: 'grid-2' },
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Nombre de salariés'),
          h('input', { className: 'form-input', value: nbSalaries, onChange: e => setNbSalaries(e.target.value) })
        ),
        h('div', { className: 'form-group' },
          h('label', { className: 'form-label' }, 'Montant du bulletin (par salarié, HT)'),
          h('div', { className: 'input-with-btn' },
            h('input', { className: 'form-input', value: montantBulletin, onChange: e => setMontantBulletin(e.target.value) }),
            h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€')
          )
        )
      ) : null,
      salariesEffective ? h('div', { className: 'form-group' },
        h('label', { className: 'form-label' }, 'Remise frais de paramétrage sociale — entièrement remise ?'),
        h('div', { className: 'toggle-pair' },
          h('button', { className: cx('toggle-btn', remiseFraisSociale && 'selected yes'), onClick: () => setRemiseFraisSociale(true) }, 'Oui'),
          h('button', { className: cx('toggle-btn', !remiseFraisSociale && 'selected no'), onClick: () => setRemiseFraisSociale(false) }, 'Non')
        )
      ) : null,

      h('div', { className: 'info-box', style: { marginTop: 16 } }, '📄 ', isParticulierIRPP
        ? `Modèle proposé : « Déclaration ${lmpLmnp} — Particulier IRPP ». Modèle proposé selon la nature du contractant.`
        : `Modèle proposé : « Mission de présentation — ${nature.toLowerCase()}${salariesEffective ? ' avec social' : '' } ». Modèle proposé selon la nature du contractant et la présence de salariés.`),

      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('div', { style: { display: 'flex', gap: 10 } },
          h('button', { className: 'btn btn-secondary', onClick: () => showToast('Lettre de mission générée (démonstration)') }, '📄 Générer la lettre de mission'),
          h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
        )
      ),
      h('div', { className: 'form-help', style: { marginTop: 6 } }, 'La lettre de mission sera générée au format PDF et enregistrée dans le Drive du dossier client.')
    ),

    step === 4 && h(Card, { title: '④ Documents à collecter' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h('div', { className: 'summary-block-title' }, 'Documents récupérables automatiquement'),
          h('div', { className: 'folder-list' },
            h('div', { className: 'folder-item' },
              h('span', null, statuts ? '✅' : '●'), h('span', { style: { flex: 1 } }, 'Statuts de la société'),
              h('span', { className: 'form-help', style: { margin: 0 } }, 'Récupérable via API'),
              h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setStatuts(true) }, statuts ? 'Récupéré' : 'Récupérer')
            ),
            h('div', { className: 'folder-item' },
              h('span', null, beneficiaires ? '✅' : '●'), h('span', { style: { flex: 1 } }, 'Bénéficiaires effectifs'),
              h('span', { className: 'form-help', style: { margin: 0 } }, 'Interrogeable via API'),
              h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setBeneficiaires(true) }, beneficiaires ? 'Interrogé' : 'Interroger')
            )
          ),
          h('div', { className: 'form-help', style: { marginTop: 10 } }, 'Les documents récupérés sont classés automatiquement dans le Drive du client.')
        ),
        h('div', null,
          h('div', { className: 'summary-block-title' }, 'Email de demande client'),
          h('div', { className: 'letter-meta' },
            h('div', null, h('b', null, 'Destinataire : '), 'contact@sarl-dupont.fr'),
            h('div', null, h('b', null, 'Objet : '), 'Documents à nous transmettre pour l’ouverture de votre dossier')
          ),
          h('div', { className: 'checkbox-grid', style: { marginBottom: 10 } },
            DOCUMENTS_A_DEMANDER_CLIENT.map(d => h('label', { className: 'checkbox-row', key: d },
              h('input', { type: 'checkbox', checked: !!docsDemandes[d], onChange: () => setDocsDemandes(prev => ({ ...prev, [d]: !prev[d] })) }), d
            ))
          ),
          h('div', { className: 'letter-preview', style: { marginBottom: 10 } },
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
          h('div', { style: { display: 'flex', gap: 10 } },
            h('button', { className: 'btn btn-secondary', onClick: () => showToast('Email de demande envoyé au client (démonstration)') }, "✉️ Générer l'email")
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 5 && h(Card, { title: '⑤ Vigilance LBC-FT' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Retranscription du premier entretien (PDF ou Word, facultatif)'),
            h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' } },
              h('label', { className: 'btn btn-secondary btn-sm', style: { cursor: 'pointer', display: 'inline-flex' } },
                transcriptFile ? `📄 ${transcriptFile.name}` : '📎 Déposer la retranscription',
                h('input', { type: 'file', accept: '.pdf,.doc,.docx', style: { display: 'none' }, onChange: handleTranscriptFile })
              ),
              transcriptFile ? h('button', { type: 'button', className: 'btn btn-primary btn-sm', disabled: analyzingTranscript, onClick: analyserTranscriptAvecIA }, analyzingTranscript ? 'Analyse en cours…' : '🤖 Analyser avec l’IA') : null
            ),
            transcriptSuggested ? h('div', { className: 'info-box', style: { marginTop: 10 } }, 'ℹ️ ', 'Classification et justification pré-remplies à partir de la retranscription (démonstration) — vérifiez et ajustez avant de continuer.') : null
          ),
          h('div', { className: 'form-help', style: { marginBottom: 10 } }, 'Classification NPLAB — 4 critères obligatoires.'),
          h('div', { className: 'grid-2', style: { marginBottom: 16, rowGap: 14 } },
            NPLAB_CRITERES.map(crit => h('div', { className: 'form-group', key: crit.code },
              h('label', { className: 'form-label' }, crit.label),
              h('select', {
                className: 'form-select',
                value: classification[crit.code],
                onChange: e => setClassification(prev => ({ ...prev, [crit.code]: e.target.value })),
              }, ['Faible', 'Moyen', 'Élevé'].map(n => h('option', { key: n, value: n }, n)))
            ))
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Justification'),
            h('textarea', { className: 'form-textarea', placeholder: 'Motivez le niveau retenu au regard de l’activité, de la localisation et des opérations du client…', value: commentaireVigilance, onChange: e => setCommentaireVigilance(e.target.value) })
          )
        ),
        h('div', { className: 'card', style: { background: '#FAFBFC' } },
          h('div', { className: 'summary-block-title' }, "Résultat de l'analyse"),
          h('div', { className: 'form-help' }, 'Niveau calculé automatiquement'),
          h(Badge, { color: niveauVigilanceCouleur(niveauPropose) }, '● Vigilance ' + niveauPropose.toLowerCase()),
          h('div', { className: 'form-help', style: { marginTop: 16 } }, 'Niveau retenu'),
          h('div', { className: 'toggle-pair' },
            ['Allégée', 'Normale', 'Renforcée'].map(n => h('button', {
              key: n,
              className: cx('toggle-btn', niveauRetenu === n && (n === 'Renforcée' ? 'selected no' : 'selected yes')),
              onClick: () => setNiveauRetenu(n),
            }, n))
          ),
          h('div', { className: 'form-help' }, "Le collaborateur peut retenir un niveau différent du calcul s'il l'estime justifié."),
          h('div', { className: 'form-help', style: { marginTop: 14 } }, 'Statut du document : ', h('b', null, 'Brouillon')),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 } },
            h('button', { className: 'btn btn-secondary btn-block', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
            h('button', { className: 'btn btn-primary btn-block', onClick: next }, 'Continuer →')
          ),
          h('div', { className: 'form-help', style: { marginTop: 10 } }, "L'analyse sera enregistrée dans le Drive du client lors de la validation finale.")
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('span')
      )
    ),

    step === 6 && h(Card, { title: '⑥ Validation finale' },
      h('div', { className: 'grid-2' },
        h('div', null,
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '🏢 Société'),
            h('div', { className: 'summary-grid' },
              h('span', null, SCENARIO_NOUVEAU_CLIENT.societe),
              h('span', null, 'Nature : ', h('b', null, nature + (isParticulierIRPP ? ` (${lmpLmnp})` : ''))),
              h('span', null, 'Dirigeant : ', h('b', null, `${civilite} ${prenomDirigeant} ${nomDirigeant}`)),
              h('span', null, 'Clôture : ', h('b', null, dateCloture))
            )
          ),
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '📁 Dossier Drive'),
            h('div', null, ['Dossier permanent', 'Comptable', 'Juridique', 'Social', 'Dossier annuel'].map(f => h('span', { className: 'tag-chip', key: f }, f)))
          ),
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '📝 Mission / LDM'),
            h('div', { className: 'summary-grid' },
              h('span', null, 'Modèle : ', h('b', null, nature + (salariesEffective ? ' avec social' : ''))),
              h('span', null, 'Honoraires : ', h('b', null, honoraires + '€')),
              isSociete ? h('span', null, 'Remise frais compta : ', h('b', null, remiseFrais ? 'Oui' : 'Non')) : null,
              isSociete ? h('span', null, 'Situation comptable : ', h('b', null, situationComptable ? (situationComptableType === 'Offerte' ? 'Offerte' : `Facturée ${situationComptableMontant}€`) : 'Non')) : null,
              salariesEffective ? h('span', null, 'Salariés : ', h('b', null, nbSalaries)) : null,
              salariesEffective ? h('span', null, 'Bulletin : ', h('b', null, montantBulletin + '€/salarié')) : null,
              salariesEffective ? h('span', null, 'Remise frais sociale : ', h('b', null, remiseFraisSociale ? 'Oui' : 'Non')) : null,
              h('span', null, 'Signataire : ', h('b', null, signataire))
            )
          ),
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '📨 Documents à collecter'),
            h('div', null, DOCUMENTS_A_DEMANDER_CLIENT.filter(d => docsDemandes[d]).map(d => h('span', { className: 'tag-chip', key: d }, d))),
            h('div', { className: 'summary-grid', style: { marginTop: 6 } },
              h('span', null, statuts ? '✅' : '○', ' Statuts récupérés'),
              h('span', null, beneficiaires ? '✅' : '○', ' Bénéficiaires effectifs interrogés')
            )
          ),
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '🔎 Vigilance LBC-FT'),
            h('div', { className: 'summary-grid' },
              h('span', null, 'Niveau proposé : ', h('b', null, niveauPropose)),
              h('span', null, 'Niveau retenu : ', h('b', null, niveauRetenu)),
              h('span', null, commentaireVigilance ? '✅ Commentaire enregistré' : '— Aucun commentaire')
            )
          )
        ),
        h('div', { className: 'card', style: { background: '#FAFBFC' } },
          h('div', { className: 'summary-block-title' }, 'Vérifications finales'),
          h('div', { className: 'check-row' }, h('span', { className: 'ok-icon' }, '✅'), 'Informations société confirmées'),
          h('div', { className: 'check-row' }, h('span', { className: 'ok-icon' }, '✅'), 'Dossier Drive créé'),
          h('div', { className: 'check-row' }, h('span', { className: 'ok-icon' }, '✅'), 'Lettre de mission prête'),
          h('div', { className: 'check-row' }, h('span', { className: 'ok-icon' }, '✅'), 'Demande client préparée'),
          h('div', { className: 'check-row' }, h('span', { className: 'ok-icon' }, '✅'), 'Analyse LBC-FT complétée'),
          h('div', { className: 'section-divider' }),
          h('div', { className: 'summary-block-title' }, 'Actions réalisées à la finalisation'),
          h('div', { className: 'action-row' }, '📄 Génération de la lettre de mission'),
          h('div', { className: 'action-row' }, '📄 Enregistrement de l’analyse LBC-FT'),
          h('div', { className: 'action-row' }, '📁 Classement des éléments dans le Drive'),
          h('div', { className: 'action-row' }, '🕐 Historisation de l’ouverture du dossier'),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 } },
            h('button', { className: 'btn btn-secondary btn-block', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
            h('button', { className: 'btn btn-primary btn-block', onClick: () => { showToast('Dossier client finalisé et classé dans le Drive (démonstration)'); if (onFinish) onFinish(); } }, "Finaliser l'ouverture du dossier →")
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
