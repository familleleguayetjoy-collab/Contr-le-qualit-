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
  const [collaborateurCharge, setCollaborateurCharge] = useState('julie');

  function togglePiece(p) { setPieces(prev => ({ ...prev, [p]: !prev[p] })); }

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
      clientTrouve ? h('div', { style: { marginTop: 6, background: '#FAFBFC', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' } },
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
          confrereTrouve ? h('div', { style: { marginTop: 12, background: '#FAFBFC', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' } },
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
        PIECES_REPRISE.map(p => h('label', { className: 'checkbox-row', key: p },
          h('input', { type: 'checkbox', checked: !!pieces[p], onChange: () => togglePiece(p) }), p
        ))
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
  const [salaries, setSalaries] = useState(true);
  const [honoraires, setHonoraires] = useState('350');
  const [remiseFrais, setRemiseFrais] = useState(true);
  const [signataire, setSignataire] = useState('Julien Lesnes');
  const [nbSalaries, setNbSalaries] = useState('3');
  const [montantBulletin, setMontantBulletin] = useState('18');

  const [docsDemandes, setDocsDemandes] = useState(() => Object.fromEntries(DOCUMENTS_A_DEMANDER_CLIENT.map(d => [d, true])));
  const [statuts, setStatuts] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState(false);

  const [vigilance, setVigilance] = useState(() => Object.fromEntries(VIGILANCE_POINTS_A_CONFIRMER.map(p => [p.code, false])));
  const [niveauRetenu, setNiveauRetenu] = useState('Faible');
  const [commentaireVigilance, setCommentaireVigilance] = useState('');

  const niveauPropose = Object.values(vigilance).some(Boolean) ? 'Renforcée' : 'Faible';

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
        societeAnalysee ? h('div', { style: { background: '#FAFBFC', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' } },
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
          h('div', { className: 'folder-list' },
            ['00_Dossier permanent', '01_Comptable', '02_Juridique', '03_Social', '04_Dossier annuel'].map(f => h('div', { className: 'folder-item', key: f }, '✅ ', f))
          ),
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
      h('div', { className: 'grid-2' },
        h('div', null,
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Nature du contractant'),
            h('div', { className: 'radio-card-row' },
              ['Entreprise individuelle', 'Société', 'Association', 'Particulier IRPP'].map(n => h('button', {
                key: n, className: cx('radio-card', nature === n && 'selected'), onClick: () => setNature(n),
              }, n))
            )
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Présence de salariés'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', salaries && 'selected yes'), onClick: () => setSalaries(true) }, 'Oui'),
              h('button', { className: cx('toggle-btn', !salaries && 'selected no'), onClick: () => setSalaries(false) }, 'Non')
            )
          ),
          h('div', { className: 'info-box' }, '📄 ', `Modèle proposé : « Mission de présentation — ${nature.toLowerCase()}${salaries ? ' avec social' : '' } ». Modèle proposé selon la nature du contractant et la présence de salariés.`)
        ),
        h('div', null,
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Honoraires comptables mensuels HT'),
            h('div', { className: 'input-with-btn' }, h('input', { className: 'form-input', value: honoraires, onChange: e => setHonoraires(e.target.value) }), h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€'))
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Remise frais de paramétrage (sociétés uniquement)'),
            h('div', { className: 'toggle-pair' },
              h('button', { className: cx('toggle-btn', remiseFrais && 'selected yes'), onClick: () => setRemiseFrais(true) }, 'Oui'),
              h('button', { className: cx('toggle-btn', !remiseFrais && 'selected no'), onClick: () => setRemiseFrais(false) }, 'Non')
            )
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, "Nom de l'expert-comptable signataire"),
            h('input', { className: 'form-input', value: signataire, onChange: e => setSignataire(e.target.value) })
          ),
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Nombre de salariés'),
            h('input', { className: 'form-input', value: nbSalaries, onChange: e => setNbSalaries(e.target.value) })
          ),
          salaries ? h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Montant du bulletin (par salarié, HT)'),
            h('div', { className: 'input-with-btn' },
              h('input', { className: 'form-input', value: montantBulletin, onChange: e => setMontantBulletin(e.target.value) }),
              h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€')
            )
          ) : null
        )
      ),
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
          h('div', { className: 'form-help', style: { marginBottom: 10 } }, "La matrice de l'Ordre est préremplie à partir des informations déjà collectées."),
          h('div', { style: { marginBottom: 14 } },
            VIGILANCE_INFOS_PREREMPLIES.map(i => h('span', { className: 'tag-chip', key: i.label }, i.icone, ' ', i.label, ' : ', i.valeur))
          ),
          h('div', { className: 'summary-block-title' }, 'Points à confirmer'),
          VIGILANCE_POINTS_A_CONFIRMER.map(p => h('div', { key: p.code, className: 'list-row' },
            h('span', null, '❓ ', p.label),
            h('select', { className: 'form-select', style: { width: 90 }, value: vigilance[p.code] ? 'Oui' : 'Non', onChange: e => setVigilance(prev => ({ ...prev, [p.code]: e.target.value === 'Oui' })) },
              h('option', null, 'Non'), h('option', null, 'Oui')
            )
          )),
          h('div', { className: 'form-group', style: { marginTop: 12 } },
            h('label', { className: 'form-label' }, 'Commentaire'),
            h('textarea', { className: 'form-textarea', placeholder: 'Ajouter une note ou une justification…', value: commentaireVigilance, onChange: e => setCommentaireVigilance(e.target.value) })
          )
        ),
        h('div', { className: 'card', style: { background: '#FAFBFC' } },
          h('div', { className: 'summary-block-title' }, "Résultat de l'analyse"),
          h('div', { className: 'form-help' }, 'Niveau proposé par la matrice'),
          h(Badge, { color: niveauPropose === 'Faible' ? 'vert' : 'rouge' }, '● Vigilance ' + niveauPropose.toLowerCase()),
          h('div', { className: 'form-help', style: { marginTop: 16 } }, 'Niveau retenu'),
          h('div', { className: 'toggle-pair' },
            h('button', { className: cx('toggle-btn', niveauRetenu === 'Faible' && 'selected yes'), onClick: () => setNiveauRetenu('Faible') }, '○ Faible'),
            h('button', { className: cx('toggle-btn', niveauRetenu === 'Renforcée' && 'selected no'), onClick: () => setNiveauRetenu('Renforcée') }, '○ Renforcée')
          ),
          h('div', { className: 'form-help' }, "Le collaborateur peut retenir un niveau renforcé s'il l'estime nécessaire."),
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
            h('div', { className: 'summary-grid' }, h('span', null, SCENARIO_NOUVEAU_CLIENT.societe), h('span', null, 'Nature : ', h('b', null, nature)), h('span', null, 'Gérant : ', h('b', null, SCENARIO_NOUVEAU_CLIENT.dirigeant)))
          ),
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '📁 Dossier Drive'),
            h('div', null, ['Dossier permanent', 'Comptable', 'Juridique', 'Social', 'Dossier annuel'].map(f => h('span', { className: 'tag-chip', key: f }, f)))
          ),
          h('div', { className: 'summary-block' },
            h('div', { className: 'summary-block-title' }, '📝 Mission / LDM'),
            h('div', { className: 'summary-grid' },
              h('span', null, 'Modèle : ', h('b', null, nature + (salaries ? ' avec social' : ''))),
              h('span', null, 'Honoraires : ', h('b', null, honoraires + '€')),
              h('span', null, 'Remise frais : ', h('b', null, remiseFrais ? 'Oui' : 'Non')),
              h('span', null, 'Salariés : ', h('b', null, nbSalaries)),
              salaries ? h('span', null, 'Bulletin : ', h('b', null, montantBulletin + '€/salarié')) : null,
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
