// ComplyEC — Assistants partagés : Reprise déontologique & Contractualisation
'use strict';

// ============================================================ Reprise déontologique

const REPRISE_STEPS = ['Paramétrage', 'Pièces à demander', 'Courrier et e-mail'];


function ReprisePage({ showToast, cabinetSettings }) {
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
      collaborateurCharge, showToast, dateReprise, pieces, piecesSupplementaires, cabinetSettings,
      // Le courrier reprend ce qui a été saisi à l'étape 1, pas le scénario.
      confrere: { ...SCENARIO_CABINET_CONFRERE, nomConfrere, prenomConfrere, emailConfrere },
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
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.formeJuridique)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.dirigeant))
            ) : null
          ),
          h(FormSection, { icon: '👤', title: 'Suivi interne', ton: 'bleu' },
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
      h(FormSection, { icon: '📎', title: `Pièces demandées (${retenues.length} sur ${liste.length})`, ton: 'violet' },
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

/* Aplatit une branche de l'arborescence Drive en groupes de cases à cocher.
   Un sous-dossier qui contient lui-même des dossiers devient un intertitre
   (« 2026 ») suivi de ses feuilles ; un sous-dossier simple est une feuille du
   groupe sans titre. Deux niveaux suffisent à couvrir l'arborescence réelle et
   permettent d'afficher chaque rubrique dans un cadre de hauteur fixe. */
function grouperArborescence(enfants) {
  const sansTitre = [];
  const groupes = [];
  (enfants || []).forEach(n => {
    if (typeof n === 'string') { sansTitre.push(n); return; }
    const petits = n.children || [];
    if (petits.length === 0) { sansTitre.push(n.name); return; }
    // Un niveau de plus (Juridique > AGO > 2026) : on remonte les feuilles.
    const feuilles = [];
    petits.forEach(pt => {
      if (typeof pt === 'string') feuilles.push(n.name + '/' + pt);
      else (pt.children || [pt.name]).forEach(f => feuilles.push(n.name + '/' + (typeof f === 'string' ? f : f.name)));
    });
    groupes.push({ titre: n.name, feuilles });
  });
  return (sansTitre.length ? [{ titre: null, feuilles: sansTitre }] : []).concat(groupes);
}

/* Texte de la lettre de reprise déontologique, repris mot pour mot du modèle
   Word du cabinet. Les trois points énumérés sont ceux de l'article 163 du
   décret du 30 mars 2012 ; ils ne sont ni reformulés ni abrégés.

   Le message d'accompagnement, lui, a sa propre rédaction : il annonce l'envoi
   du courrier et ajoute la liste des pièces attendues, qui ne figure pas dans
   la lettre. */
function reprisePhrases({ cabinet, conf, dateReprise, retenues }) {
  const c = SCENARIO_NOUVEAU_CLIENT;
  const ville = villeDepuisAdresse(cabinet.adresse) || '';
  const aujourdhui = formatDateLong(new Date().toISOString().slice(0, 10));
  const lieuDate = (ville ? ville + ', le ' : 'Le ') + aujourdhui + ',';

  // « située au 12 rue de la Liberté à Nice (06000) » : l'adresse du modèle est
  // découpée en voie / commune / code postal pour retrouver la même tournure.
  const m = String(c.adresse || '').match(/^(.*?),\s*(\d{5})\s+(.+)$/);
  const situee = m ? `située au ${m[1]} à ${m[3]} (${m[2]})` : `située ${c.adresse}`;
  const fonction = c.fonctionDirigeant || 'gérant';

  const intro = `Conformément aux règles instituées par notre code des devoirs professionnels, je vous informe que j'ai été sollicité par ${c.dirigeantCivilite === 'Mme' ? 'Madame' : 'Monsieur'} ${c.dirigeantPrenom} ${c.dirigeantNom.toUpperCase()}, ${fonction} de la société ${c.societe.toUpperCase()} (${c.siret.replace(/\s/g, '')}), ${situee}, pour assurer une mission de présentation des comptes annuels à compter du ${formatDateLong(dateReprise)}.`;
  const consequence = `En conséquence, je vous serais très reconnaissant de bien vouloir m'indiquer, conformément à l'article 163 du décret du 30 mars 2012 de notre code professionnel, si rien ne s’oppose à notre entrée en fonction sur ce dossier :`;
  const points = [
    'S’il est survenu entre vous des difficultés,',
    'Si les considérations tirées de désir de votre client sont, à votre avis, de nature à éluder les effets d’une stricte observation de nos devoirs et responsabilités professionnels,',
    'Si le montant des honoraires qui vous sont dus pour les travaux réalisés, vous a été réglé après que vous ayez présenté votre demande.',
  ];
  const suite = [
    "Afin d'être en mesure d'apprécier la mission qui m'est proposée, vous voudrez bien me faire connaître, dans les meilleurs délais, vos observations.",
    'En cas de non-réponse sous 15 jours, j’en déduirai que rien ne s’oppose à notre entrée en fonction.',
    "Dans l'attente de vous lire,",
    "Je vous prie de croire, Cher confrère, à l'assurance de ma parfaite considération.",
  ];

  const corpsHtml = ['<p>Cher confrère,</p>', `<p>${echapperHtml(intro)}</p>`, `<p>${echapperHtml(consequence)}</p>`]
    .concat([`<ul>${points.map(p => `<li>${echapperHtml(p)}</li>`).join('')}</ul>`])
    .concat(suite.map(p => `<p>${echapperHtml(p)}</p>`))
    .join('\n');

  /* Message d'accompagnement. Rédaction propre au courriel : il signale que la
     lettre part aussi par voie postale, et énumère les pièces cochées à
     l'étape précédente — que la lettre, elle, ne mentionne pas. */
  const listePieces = (retenues || []).map(p => piecePhrase(p));
  const mail = [
    'Cher Confrère,',
    `Conformément aux règles instituées par notre Code des devoirs professionnels, je vous informe avoir été sollicité par ${c.dirigeantCivilite === 'Mme' ? 'Madame' : 'Monsieur'} ${c.dirigeantPrenom} ${c.dirigeantNom.toUpperCase()}, ${fonction} de la société ${c.societe.toUpperCase()} (SIRET : ${c.siret}), sise ${c.adresse}, afin d’assurer une mission de présentation des comptes annuels à compter du ${formatDateLong(dateReprise)}.`,
    'À ce titre, je vous informe vous avoir également adressé par courrier une lettre relative à la reprise de ce dossier.',
    'En application de l’article 163 du décret du 30 mars 2012, je vous serais reconnaissant de bien vouloir m’indiquer si rien ne s’oppose à notre entrée en fonction et, notamment :',
    '  • s’il est survenu entre vous et votre client des difficultés dont il conviendrait de m’informer ;',
    '  • si les considérations ayant motivé le changement de professionnel vous paraissent de nature à éluder les effets d’une stricte observation de nos devoirs et responsabilités professionnels ;',
    '  • si les honoraires qui vous sont dus au titre des travaux réalisés ont été intégralement réglés, après présentation de votre demande.',
    'Afin de me permettre d’apprécier pleinement la mission qui m’est proposée, je vous remercie de bien vouloir me faire part de vos éventuelles observations dans les meilleurs délais.',
    'À défaut de réponse de votre part dans un délai de 15 jours, je considérerai que rien ne s’oppose à notre entrée en fonction.',
  ];
  if (listePieces.length) {
    mail.push('Par ailleurs, afin d’assurer la continuité du dossier dans les meilleures conditions, je vous remercie de bien vouloir nous transmettre les éléments suivants :');
    listePieces.forEach((p, i) => mail.push(`  • ${p}${i === listePieces.length - 1 ? '.' : ' ;'}`));
    mail.push('Je vous remercie par avance pour votre retour et pour la transmission de ces éléments.');
  }
  mail.push('Je vous prie de croire, Cher Confrère, à l’assurance de ma parfaite considération.');
  mail.push(cabinet.signature);

  return { lieuDate, corpsHtml, corpsTexte: mail.join('\n') };
}

function RepriseEtape2({ onBack, collaborateurCharge, showToast, dateReprise, pieces, piecesSupplementaires, confrere, cabinetSettings }) {
  const cabinet = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const conf = confrere || SCENARIO_CABINET_CONFRERE;
  const listePieces = [...PIECES_REPRISE, ...piecesSupplementaires];
  const retenues = listePieces.filter(p => pieces[p]);
  const objetLibelle = `Reprise du dossier de la société ${SCENARIO_NOUVEAU_CLIENT.societe}`;

  /* Le texte reprend mot pour mot le modèle de lettre de reprise du cabinet
     (Lettre_de_reprise.doc). Seuls varient les éléments propres au dossier :
     le confrère destinataire, le dirigeant, la société, son SIRET, son
     adresse, la date d'entrée en fonction et la signature. Aucune formule
     n'est réécrite : cette lettre engage le cabinet vis-à-vis d'un confrère,
     sa rédaction est celle que le cabinet a validée. */
  const texteReprise = reprisePhrases({ cabinet, conf, dateReprise, retenues });

  /* Le courrier est construit une seule fois, en HTML, et sert tel quel à
     l'aperçu, au document Word et à l'impression : ce qui est relu à l'écran
     est exactement ce qui part au confrère. */
  const courrierHTML = construireCourrier({
    cabinet,
    destinataire: [conf.cabinet].concat(String(conf.adresse || '').split(/,\s*/)),
    lieuDate: texteReprise.lieuDate,
    corps: texteReprise.corpsHtml,
    // La lettre s'arrête à la signature : les pièces attendues sont demandées
    // dans le message d'accompagnement, pas dans le courrier au confrère.
    signature: cabinet.signature,
  });

  // Le message d'accompagnement reprend le corps de la lettre, sans mise en
  // forme : le confrère lit le même texte, qu'il ouvre la pièce jointe ou non.
  const texteEmail = texteReprise.corpsTexte;

  const objetEmail = objetLibelle;

  function ouvrirDansWord() {
    downloadWordDoc(
      `Courrier_reprise_${SCENARIO_NOUVEAU_CLIENT.societe.replace(/\s+/g, '_')}.doc`,
      'Courrier de reprise déontologique',
      courrierHTML,
      COURRIER_CSS);
    showToast('Courrier téléchargé — il s’ouvre dans Word.');
  }

  /* Impression : on ouvre une fenêtre ne contenant que le courrier et on lance
     la boîte d'impression du navigateur, qui propose « Enregistrer au format
     PDF ». Pas de bibliothèque à embarquer, et la mise en page reste celle du
     poste de l'utilisateur. */
  function imprimerCourrier() {
    const w = window.open('', '_blank');
    if (!w) { showToast('Autorisez les fenêtres surgissantes pour imprimer.'); return; }
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
      <title>Courrier de reprise — ${echapperHtml(SCENARIO_NOUVEAU_CLIENT.societe)}</title>
      <style>@page{margin:22mm}body{margin:0;color:#000}${COURRIER_CSS}</style>
      </head><body>${courrierHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  // mailto: ouvre le client de messagerie par défaut du poste — Outlook chez
  // vous. Le corps est prérempli, il ne reste qu'à envoyer.
  function ouvrirDansOutlook() {
    const lien = `mailto:${encodeURIComponent(conf.emailConfrere)}`
      + `?subject=${encodeURIComponent(objetEmail)}`
      + `&body=${encodeURIComponent(texteEmail)}`;
    window.location.href = lien;
    showToast('Ouverture de votre messagerie…');
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null,
        h('h1', null, 'Reprise déontologique'),
        h('p', { className: 'subtitle' },
          `Relisez, puis envoyez au confrère. ${retenues.length} ${pluriel(retenues.length, 'pièce')} ${pluriel(retenues.length, 'demandée')} ; une copie ira à ${collaborateur(collaborateurCharge).nom.split(' ')[0]} pour le Drive du dossier.`)
      )
    ),
    h(Stepper, { steps: REPRISE_STEPS, current: 3 }),
    h('div', { className: 'step-body' },
    h('div', { className: 'two-col-preview' },
      h(FormSection, { icon: '📄', title: 'Courrier à valider', ton: 'violet' },
        h('div', { className: 'courrier-feuille', dangerouslySetInnerHTML: { __html: courrierHTML } }),
        h('div', { className: 'doc-actions' },
          h('button', { className: 'btn btn-secondary', onClick: ouvrirDansWord }, '📝 Ouvrir dans Word'),
          h('button', { className: 'btn btn-secondary', onClick: imprimerCourrier }, '🖨️ Imprimer en PDF')
        )
      ),
      h(FormSection, { icon: '✉️', title: 'E-mail au confrère', ton: 'violet' },
        h('div', { className: 'mail-entete' },
          h('div', { className: 'mail-champ' }, h('span', { className: 'mail-cle' }, 'À'), h('span', { className: 'mail-valeur' }, conf.emailConfrere)),
          h('div', { className: 'mail-champ' }, h('span', { className: 'mail-cle' }, 'Objet'), h('span', { className: 'mail-valeur' }, objetEmail))
        ),
        h('div', { className: 'letter-preview' }, texteEmail),
        h('div', { className: 'doc-actions' },
          h('button', { className: 'btn btn-secondary', onClick: ouvrirDansOutlook }, '📧 Ouvrir dans Outlook')
        )
      )
    ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: onBack }, '← Retour au paramétrage'),
        h('button', { className: 'btn btn-primary', onClick: () => showToast('Reprise finalisée — courrier et email envoyés (démonstration)') }, 'Finaliser la reprise →')
      )
    )
  );
}

// ============================================================ Contractualisation (6 étapes)
// Composant partagé, utilisé par le module Expert-comptable (Entrée en mission > Contractualisation)
// et par le module Collaborateur (Nouveau dossier).

/* Regroupe un thème du formulaire dans son propre rectangle titré. */
/* Ce que le logiciel est allé chercher tout seul : l'utilisateur contrôle,
   il ne ressaisit pas. Le repère est le même partout pour qu'il se reconnaisse
   d'un coup d'œil. */
function BadgeAuto() {
  return h('span', { className: 'badge-auto', title: 'Récupéré automatiquement — à vérifier' }, '⚡ auto');
}

function FormSection({ icon, title, children, style, ton = 'bleu', subtitle }) {
  return h('div', { className: cx('form-section', 'sec-' + ton), style },
    h('div', { className: 'form-section-title' },
      icon ? h('span', { className: 'form-section-icon' }, icon) : null,
      h('span', { className: 'card-title-ink' }, title),
      subtitle ? h('span', { className: 'form-section-compte' }, subtitle) : null
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

const CONTRACT_STEPS = ['Société', 'Dossier Drive', 'Contractant', 'Modèle de LDM', 'Mentions de la lettre', 'Documents', 'Qui est derrière', 'Cotation du risque', 'Niveau de vigilance', 'Validation'];

function ContractualisationWizard({ showToast, onFinish, collaborateurConnecte, cabinetSettings }) {
  const [step, setStep] = useState(1);
  const [siret, setSiret] = useState(SCENARIO_NOUVEAU_CLIENT.siret);
  const [societeAnalysee, setSocieteAnalysee] = useState(false);
  // Résultat de la dernière recherche par SIRET : la fiche trouvée, ou le
  // motif pour lequel rien n'a été trouvé.
  const [rechercheSiret, setRechercheSiret] = useState(null);
  const [ficheLegale, setFicheLegale] = useState(null);

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
  // Tarif du cabinet par bulletin de paie.
  const [montantBulletin, setMontantBulletin] = useState(String(LDM_MONTANT_BULLETIN_DEFAUT));
  const isParticulierIRPP = nature === 'Particulier IRPP';
  const isSociete = nature === 'Société';
  const isAssociation = nature === 'Association';
  const salariesEffective = isParticulierIRPP ? false : salaries;

  const [docsDemandes, setDocsDemandes] = useState(() => Object.fromEntries(DOCUMENTS_A_DEMANDER_CLIENT.map(d => [d, true])));
  const [statuts, setStatuts] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState(false);

  const [classification, setClassification] = useState(() => Object.fromEntries(NPLAB_CRITERES.map(c => [c.code, 'Faible'])));
  const [commentaireVigilance, setCommentaireVigilance] = useState('');
  // Trois éléments que la cotation à quatre critères ne dit pas : qui est
  // derrière le client, s'il est politiquement exposé, d'où vient l'argent.
  const [ppeStatut, setPpeStatut] = useState('a_verifier');
  const [ppeDetail, setPpeDetail] = useState('');
  const [origineEtat, setOrigineEtat] = useState('a_faire');
  const [origineDetail, setOrigineDetail] = useState('');
  const [beneficiairesListe, setBeneficiairesListe] = useState([{ nom: '', part: '', verifie: false }]);
  // Vérifications en base externe : la case cochée est la trace du contrôle.
  const [basesVerifiees, setBasesVerifiees] = useState([]);
  const [resultatsBases, setResultatsBases] = useState({});
  const [beInterroge, setBeInterroge] = useState(false);

  // Interrogation du registre des bénéficiaires effectifs : même principe que
  // la fiche légale de l'étape 1, l'utilisateur contrôle ce qui revient.
  function interrogerRbe() {
    setBeneficiairesListe(RBE_REPONSE_DEMO.map(b => ({ ...b })));
    setBeInterroge(true);
    setBasesVerifiees(l => l.includes('rbe') ? l : l.concat(['rbe']));
    setResultatsBases(r => ({ ...r, rbe: VIGILANCE_RESULTATS_DEMO.rbe }));
    showToast('Registre des bénéficiaires effectifs interrogé.');
  }

  function lancerVerification(code) {
    setBasesVerifiees(l => l.includes(code) ? l : l.concat([code]));
    setResultatsBases(r => ({ ...r, [code]: VIGILANCE_RESULTATS_DEMO[code] }));
  }

  function toutVerifier() {
    setBasesVerifiees(VIGILANCE_BASES.map(b => b.code));
    setResultatsBases(Object.assign({}, VIGILANCE_RESULTATS_DEMO));
    showToast(`${VIGILANCE_BASES.length} vérifications lancées.`);
  }
  const [synthese, setSynthese] = useState('');
  const [driveCree, setDriveCree] = useState(false);
  const [sousDossiers, setSousDossiers] = useState({});
  const [nouveauSousDossier, setNouveauSousDossier] = useState({});
  /* Tout est coché par défaut : on ne stocke que ce que l'utilisateur a
     décoché, ce qui évite d'avoir à réinitialiser la carte quand un
     sous-dossier est ajouté. */
  const [driveDecoche, setDriveDecoche] = useState({});
  const [ajoutOuvert, setAjoutOuvert] = useState({});

  function ajouterSousDossier(racine, definition) {
    const nom = (nouveauSousDossier[racine] || '').trim();
    if (!nom) return;
    // Une année ajoutée reprend les mêmes documents que les autres exercices.
    const modele = definition && definition.ajoutParAnnee
      ? (definition.children || []).find(x => x && x.children)
      : null;
    const ajout = modele ? { name: nom, children: modele.children.slice() } : nom;
    setSousDossiers(prev => ({ ...prev, [racine]: (prev[racine] || []).concat([ajout]) }));
    setNouveauSousDossier(prev => ({ ...prev, [racine]: '' }));
    setAjoutOuvert(prev => ({ ...prev, [racine]: false }));
    showToast(`Sous-dossier « ${nom} » ajouté.`);
  }
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
  // Récupérable par l'API entreprise : l'utilisateur confirme, il ne ressaisit pas.
  const [typeSociete, setTypeSociete] = useState('SARL');
  // Une association est fiscalisée ou non : ce n'est pas un choix IS/IR.
  const [regimeAsso, setRegimeAsso] = useState('Non fiscalisée');
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

  /* Tout ce que les étapes précédentes ont déjà établi. Ces valeurs partent
     dans la lettre sans repasser devant l'utilisateur : lui redemander la
     dénomination ou l'adresse trois écrans après les avoir confirmées, c'est
     du temps perdu et une occasion de divergence. */
  const champsDejaConnus = {
    denomination: SCENARIO_NOUVEAU_CLIENT.societe,
    formeSociete: typeSociete,
    formeExercice: typeSociete,
    representant: `${prenomDirigeant} ${nomDirigeant}`.trim(),
    fonction: fonctionDirigeant,
    civilite: civilite === 'Mme' ? 'Madame' : 'Monsieur',
    adresse: adresseSiege,
    regimeFiscal: isAssociation ? regimeAsso : (isParticulierIRPP ? lmpLmnp : regimeFiscal),
    salaries: salariesEffective ? `${nbSalaries} ${pluriel(nbSalaries, 'salarié')}` : 'aucun salarié',
    signataire: signataire,
  };

  // Les seuls champs qui restent à saisir ou à confirmer sur cette étape.
  const CHAMPS_ETAPE_MENTIONS = ['activite', 'ouverture', 'cloture', 'modeReglement', 'modePrelevement'];
  const CHAMPS_SECOURS = {
    ouverture: { code: 'ouverture', label: 'Ouverture du premier exercice', type: 'date' },
    cloture: { code: 'cloture', label: 'Fin du premier exercice', type: 'date' },
    modeReglement: { code: 'modeReglement', label: 'Mode de règlement', type: 'liste', options: ['fin de mois', 'le 10 du mois', 'le 15 du mois'] },
    modePrelevement: { code: 'modePrelevement', label: 'Mode de prélèvement', type: 'liste', options: ['Prélèvement automatique', 'Virement', 'Chèque'] },
  };
  const champsMentions = CHAMPS_ETAPE_MENTIONS.map(code =>
    (LDM_CHAMPS_PAR_CATEGORIE[ldmCategorie] || []).concat(LDM_CHAMPS_COMMUNS).find(c => c.code === code)
    || CHAMPS_SECOURS[code]).filter(Boolean);

  // Valeurs par défaut demandées par le cabinet, appliquées une seule fois.
  useEffect(() => {
    setLdmChamps(prev => Object.assign({
      ouverture: exerciceOuverture,
      cloture: exerciceCloture,
      modeReglement: 'fin de mois',
      modePrelevement: 'Prélèvement automatique',
      activite: SCENARIO_NOUVEAU_CLIENT.activite || '',
      /* Sans valeur, le contrôle de contenu « Ville de signature » conservait
         le texte de remplacement de Word (« Cliquez ou appuyez ici pour entrer
         du texte. ») jusque dans la lettre remise au client. */
      villeSignature: villeDepuisAdresse((cabinetSettings || CABINET_SETTINGS_DEFAUT).adresse) || '',
    }, prev));
  }, []);

  const champsLettre = Object.assign({}, champsDejaConnus, ldmChamps);

  const [generation, setGeneration] = useState(null);

  /* Le modèle vit sur le poste du cabinet : on le fait désigner plutôt que de
     l'embarquer dans l'application. Le remplissage et le téléchargement se
     font ensuite entièrement dans le navigateur. */
  /* Génération de la lettre.

     Les quarante modèles du cabinet sont livrés avec le logiciel (dossier
     « modeles/ ») et les étapes précédentes désignent déjà celui qui convient :
     il n'y a donc rien à choisir, le modèle est chargé tout seul.

     Le sélecteur de fichier ne subsiste que pour le cas où le modèle n'est pas
     joignable — fichier unique ouvert depuis le disque, où le navigateur
     interdit la lecture des fichiers voisins. L'écran le dit alors clairement
     au lieu de laisser croire à une panne. */
  async function chargerModele(chemin) {
    const reponse = await fetch('modeles/' + chemin.split('/').map(encodeURIComponent).join('/'));
    if (!reponse.ok) throw new Error('Modèle introuvable (' + reponse.status + ').');
    const blob = await reponse.blob();
    return new File([blob], chemin.split('/').pop(), { type: blob.type });
  }

  async function genererDepuisModele() {
    if (!modeleLdm) return;
    setGeneration({ enCours: true });
    try {
      const fichier = await chargerModele(modeleLdm.fichier);
      await remplirEtTelecharger(fichier);
    } catch (err) {
      setGeneration({ erreur: `${err.message} Désignez le modèle Word ci-dessous pour générer la lettre malgré tout.`, choixManuel: true });
    }
  }

  async function genererLettre(evenement) {
    const fichier = evenement.target.files && evenement.target.files[0];
    evenement.target.value = '';
    if (!fichier) return;
    setGeneration({ enCours: true });
    await remplirEtTelecharger(fichier);
  }

  async function remplirEtTelecharger(fichier) {
    try {
      const valeurs = ldmValeursWord({
        categorie: ldmCategorie,
        champs: { ...champsLettre, denomination: champsLettre.denomination || SCENARIO_NOUVEAU_CLIENT.societe },
        montants,
      });
      const nom = ldmNomFichier({
        cabinet: (LDM_CABINETS.find(c => c.id === ldmCabinet) || {}).nom,
        client: champsLettre.denomination || SCENARIO_NOUVEAU_CLIENT.societe,
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

  /* Recherche réelle sur le numéro saisi, et report de ce qui a été trouvé
     dans les champs de l'étape : dénomination, dirigeant, siège, activité. Un
     numéro inconnu ne remplit rien et le dit. */
  function analyserSiret() {
    const res = rechercherSiret(siret);
    setRechercheSiret(res);
    if (!res.trouve) { setSocieteAnalysee(false); setFicheLegale(null); return; }
    const f = res.fiche;
    setFicheLegale(f);
    setSocieteAnalysee(true);
    setCivilite(f.dirigeantCivilite || 'M.');
    setPrenomDirigeant(f.dirigeantPrenom || '');
    setNomDirigeant(f.dirigeantNom || '');
    if (f.adresse) setAdresseSiege(f.adresse);
    setLdmChamps(prev => Object.assign({}, prev, {
      denomination: f.societe,
      representant: f.dirigeant,
      activite: f.activite || '',
      adresse: f.adresse || prev.adresse,
      formeSociete: f.formeJuridique || prev.formeSociete,
    }));
    showToast(`Fiche légale récupérée : ${f.societe}.`);
  }

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
              h('input', {
                className: 'form-input', value: siret,
                onChange: e => { setSiret(e.target.value); setRechercheSiret(null); setSocieteAnalysee(false); },
                onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); analyserSiret(); } },
              }),
              h('button', { className: 'btn btn-accent', onClick: analyserSiret }, '🔎 Analyser')
            ),
            rechercheSiret && !rechercheSiret.trouve
              ? h('div', { className: 'form-erreur' }, '⚠️ ', rechercheSiret.motif)
              : h('div', { className: 'form-help' }, 'Les informations légales sont récupérées automatiquement : vous n’avez rien à ressaisir.')
          )
        ),
        h(FormSection, { icon: '📋', title: 'Fiche légale', ton: 'bleu' },
          societeAnalysee && ficheLegale
            ? h('div', null,
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Société'), h('span', { className: 'v' }, ficheLegale.societe)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, ficheLegale.dirigeant)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Activité'), h('span', { className: 'v' }, ficheLegale.activite)),
              h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme juridique'), h('span', { className: 'v' }, ficheLegale.formeJuridique))
            )
            : h('div', { className: 'empty-detail', style: { padding: '18px 0' } },
              h('div', { className: 'empty-icon' }, '🔎'),
              h('div', null, 'Cliquez sur Analyser pour récupérer la fiche.'))
        )
      ),
      // Le dirigeant vient de la même interrogation que la fiche légale : sa
      // place est ici, à côté d'elle, et non trois étapes plus loin.
      h('div', { className: 'grid-2', style: { marginTop: 26 } },
        h(FormSection, { icon: '✍️', title: 'Dirigeant signataire', ton: 'bleu' },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Civilité, prénom et nom'),
            h('div', { style: { display: 'flex', gap: 10 } },
              h('select', { className: 'form-select', style: { maxWidth: 100 }, value: civilite, onChange: e => setCivilite(e.target.value) },
                h('option', null, 'M.'), h('option', null, 'Mme')
              ),
              h('input', { className: 'form-input', placeholder: 'Prénom', value: prenomDirigeant, onChange: e => setPrenomDirigeant(e.target.value) }),
              h('input', { className: 'form-input', placeholder: 'Nom', value: nomDirigeant, onChange: e => setNomDirigeant(e.target.value) })
            ),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Repris de la fiche légale — à confirmer ou corriger.')
          ),
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Fonction dans la société'),
            h('select', { className: 'form-select', value: fonctionDirigeant, onChange: e => setFonctionDirigeant(e.target.value) },
              ['Président', 'Directeur général', 'Gérant', 'Chef d’entreprise'].map(f => h('option', { key: f, value: f }, f))
            )
          )
        ),
        h(FormSection, { icon: '📍', title: 'Siège social', ton: 'bleu' },
          h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Adresse complète'),
            h('input', { className: 'form-input', value: adresseSiege, onChange: e => setAdresseSiege(e.target.value) }),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Repris de la fiche légale. Cette adresse figure dans la lettre de mission.')
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-primary', disabled: !societeAnalysee, onClick: next }, 'Confirmer les informations →')
      )
    ),

    step === 2 && h('div', { className: 'step-body' },
      h('div', { className: 'drive-grid' },
        DRIVE_TREE.map(racine => {
          const enfants = (racine.children || []).concat(sousDossiers[racine.name] || []);
          const groupes = grouperArborescence(enfants);
          const total = groupes.reduce((n, g) => n + g.feuilles.length, 0);
          const retenus = groupes.reduce((n, g) => n + g.feuilles.filter(f => !driveDecoche[racine.name + '/' + f]).length, 0);
          return h(FormSection, {
            key: racine.name, icon: '📁', title: racine.name.replace(/^\d+_/, ''),
            ton: 'violet',
            /* Le compte se lit dans le titre : on sait d'un coup d'œil ce qui
               reste coché sans parcourir la liste. */
            subtitle: total ? `${retenus} sur ${total}` : null,
          },
            h('div', { className: 'drive-corps' },
              total === 0
                ? h('div', { className: 'form-help', style: { marginTop: 0 } }, 'Aucun sous-dossier prévu. Ajoutez-en un si besoin.')
                /* Un groupe de deux documents (une année comptable, une AGO)
                   tient sur une seule ligne, son intitulé à gauche : c'est ce
                   qui permet d'afficher quatre exercices sans faire défiler. */
                : groupes.map((g, gi) => h('div', { className: cx('drive-groupe', g.titre && g.feuilles.length <= 3 && 'compact'), key: gi },
                  g.titre ? h('div', { className: 'drive-groupe-titre' }, g.titre) : null,
                  h('div', { className: 'drive-cases' },
                    g.feuilles.map(f => {
                      const cle = racine.name + '/' + f;
                      const libelle = f.split('/').pop();
                      return h('label', { className: 'drive-case', key: cle },
                        h('input', {
                          type: 'checkbox',
                          checked: !driveDecoche[cle],
                          onChange: () => setDriveDecoche(prev => ({ ...prev, [cle]: !prev[cle] })),
                        }),
                        h('span', null, libelle)
                      );
                    })
                  )
                ))
            ),
            // Deux rubriques varient d'un cabinet à l'autre : on peut y ajouter
            // un sous-dossier sans repasser par le paramétrage.
            /* Le champ d'ajout ne s'ouvre qu'à la demande : affiché en
               permanence, il mangeait la place de deux documents dans chaque
               rubrique et poussait les listes hors du cadre. */
            /* Comptable et Juridique s'organisent par exercice : on y ajoute
               une année, pas un sous-dossier. Les autres rubriques reçoivent
               un sous-dossier libre. */
            (racine.ajoutable || racine.ajoutParAnnee) ? (ajoutOuvert[racine.name]
              ? h('div', { className: 'drive-ajout' },
                h('input', {
                  className: 'form-input', autoFocus: true,
                  placeholder: racine.ajoutParAnnee ? 'Année (ex. 2022)' : 'Nouveau sous-dossier',
                  value: nouveauSousDossier[racine.name] || '',
                  onChange: e => setNouveauSousDossier(prev => ({ ...prev, [racine.name]: e.target.value })),
                  onKeyDown: e => {
                    if (e.key === 'Enter') ajouterSousDossier(racine.name, racine);
                    if (e.key === 'Escape') setAjoutOuvert(prev => ({ ...prev, [racine.name]: false }));
                  },
                }),
                h('button', { className: 'btn btn-secondary btn-sm', onClick: () => ajouterSousDossier(racine.name, racine) }, 'Ajouter')
              )
              : h('button', {
                className: 'drive-ajout-lien',
                onClick: () => setAjoutOuvert(prev => ({ ...prev, [racine.name]: true })),
              }, racine.ajoutParAnnee ? '+ Ajouter un exercice' : '+ Ajouter un sous-dossier')
            ) : null
          );
        })
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 3 && h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll' },
      h('div', { className: 'grid-2' },
        h(FormSection, { icon: '🏷️', title: 'Nature du contractant', ton: 'dore' },
          // Quatre natures sur une seule rangée : sur deux rangées, la rubrique
          // dépassait la hauteur de l'écran et poussait la rangée du dessous
          // hors de vue.
          h('div', { className: 'radio-card-row large quatre' },
            ['Entreprise individuelle', 'Société', 'Association', 'Particulier IRPP'].map(n => h('button', {
              key: n, className: cx('radio-card', nature === n && 'selected'), onClick: () => setNature(n),
            }, n))
          ),
          // Le type de société vient de la fiche légale : on le propose, on ne
          // le fait pas saisir.
          isSociete ? h('div', { className: 'form-group', style: { marginTop: 20, marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Type de société'),
            // Huit formes en cartes occupaient trois lignes et déséquilibraient
            // la colonne : une liste déroulante suffit et reste conventionnelle.
            h('select', { className: 'form-select', value: typeSociete, onChange: e => setTypeSociete(e.target.value) },
              ['SARL', 'EURL', 'SAS', 'SASU', 'SA', 'SELARL', 'SELAS', 'SPFPL'].map(t => h('option', { key: t, value: t }, t))
            ),
            h('div', { className: 'form-help' }, h(BadgeAuto), ' Repris de la fiche légale.')
          ) : null
        ),
        /* « Nature du contractant » et « Salariés » ont la même hauteur : ils
           se font face sur la première rangée, les deux rubriques courtes en
           dessous. */
        h(FormSection, { icon: '👥', title: 'Salariés', ton: 'dore' },
          h('div', { className: 'form-group', style: { marginBottom: isParticulierIRPP ? 0 : 18 } },
            h('label', { className: 'form-label' }, 'Le cabinet établit-il la paie ?'),
            h('div', { className: 'radio-card-row large' },
              [['oui', 'Oui'], ['non', 'Non']].map(([v, lib]) => h('button', {
                key: v, className: cx('radio-card', (salaries ? 'oui' : 'non') === v && 'selected'),
                disabled: isParticulierIRPP,
                onClick: () => setSalaries(v === 'oui'),
              }, lib))
            ),
            isParticulierIRPP ? h('div', { className: 'form-help' }, 'Sans objet pour un particulier.') : null
          ),
          // Sans salariés, le modèle retenu sera une lettre sans volet social :
          // les deux champs disparaissent au lieu de rester à zéro.
          salariesEffective ? h('div', { className: 'grid-2' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Bulletins par mois'),
              h('input', { className: 'form-input', type: 'number', min: 0, value: nbSalaries, onChange: e => setNbSalaries(e.target.value) })
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Montant par bulletin (€ HT)'),
              h('input', { className: 'form-input', type: 'number', min: 0, value: montantBulletin, onChange: e => setMontantBulletin(e.target.value) })
            )
          ) : null
        )
      ),
      h('div', { className: 'grid-2', style: { marginTop: 26 } },
        h(FormSection, { icon: '⚖️', title: 'Régime fiscal', ton: 'dore' },
          isParticulierIRPP
            ? h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Catégorie de location meublée'),
              h('div', { className: 'radio-card-row large' },
                ['LMP', 'LMNP'].map(v => h('button', {
                  key: v, className: cx('radio-card', lmpLmnp === v && 'selected'), onClick: () => setLmpLmnp(v),
                }, v))
              )
            )
            : isAssociation
              // Une association n'est pas à l'IS ou à l'IR : elle est fiscalisée
              // ou elle ne l'est pas.
              ? h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Situation de l’association'),
                h('div', { className: 'radio-card-row large' },
                  ['Non fiscalisée', 'Fiscalisée'].map(v => h('button', {
                    key: v, className: cx('radio-card', regimeAsso === v && 'selected'), onClick: () => setRegimeAsso(v),
                  }, v))
                )
              )
              : h('div', { className: 'form-group', style: { marginBottom: 0 } },
                h('label', { className: 'form-label' }, 'Imposition des bénéfices'),
                h('div', { className: 'radio-card-row large' },
                  ['IS', 'IR'].map(v => h('button', {
                    key: v, className: cx('radio-card', regimeFiscal === v && 'selected'), onClick: () => setRegimeFiscal(v),
                  }, v))
                ),
                h('div', { className: 'form-help' },
                  'Le régime retenu figure dans la lettre de mission et détermine les déclarations couvertes par la mission.')
              )
        ),
        h(FormSection, { icon: '📅', title: 'Exercice comptable', ton: 'dore' },
          h('div', { className: 'grid-2' },
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Ouverture'),
              h('input', { type: 'date', className: 'form-input', value: exerciceOuverture, onChange: e => setExerciceOuverture(e.target.value) })
            ),
            h('div', { className: 'form-group', style: { marginBottom: 0 } },
              h('label', { className: 'form-label' }, 'Clôture'),
              h('input', { type: 'date', className: 'form-input', value: exerciceCloture, onChange: e => setExerciceCloture(e.target.value) })
            )
          ),
          h('div', { className: 'form-help' }, h(BadgeAuto), ' Dates reprises de la fiche légale.')
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
        h(FormSection, { icon: '📄', title: 'Modèle de lettre de mission', ton: 'vert' },
          h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Cabinet émetteur'),
            h('div', { className: 'radio-card-row large' },
              LDM_CABINETS.map(c => h('button', {
                key: c.id, className: cx('radio-card', ldmCabinet === c.id && 'selected'),
                onClick: () => setLdmCabinet(c.id),
              }, c.nom))
            )
          ),
          ldmAxes.tenue ? h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Tenue de la comptabilité par le cabinet'),
            h('div', { className: 'toggle-pair toggle-pair-large' },
              h('button', { className: cx('toggle-btn', ldmTenue && 'selected yes'), onClick: () => setLdmTenue(true) }, 'Avec tenue'),
              h('button', { className: cx('toggle-btn', !ldmTenue && 'selected no'), onClick: () => setLdmTenue(false) }, 'Sans tenue')
            )
          ) : null,
          ldmAxes.jp ? h('div', { className: 'form-group' },
            h('label', { className: 'form-label' }, 'Volet juridique et patrimonial'),
            h('div', { className: 'toggle-pair toggle-pair-large' },
              h('button', { className: cx('toggle-btn', ldmJp && 'selected yes'), onClick: () => setLdmJp(true) }, 'Avec JP'),
              h('button', { className: cx('toggle-btn', !ldmJp && 'selected no'), onClick: () => setLdmJp(false) }, 'Sans JP')
            )
          ) : null,
          ldmAxes.ancienForfait ? h('div', { className: 'form-group', style: { marginBottom: 0 } },
            h('label', { className: 'form-label' }, 'Grille tarifaire'),
            h('div', { className: 'toggle-pair toggle-pair-large' },
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
              h('div', { className: 'form-help' },
                `${nbSalaries} ${pluriel(nbSalaries, 'bulletin')} × ${montantBulletin} € — modifiable à l’étape Contractant.`)
            ) : h('div', { className: 'form-help', style: { marginBottom: 0 } },
              'Pas de volet social : le modèle retenu sera une lettre sans paie.')
          ),
          h(FormSection, { icon: '🧮', title: 'Totaux calculés', ton: 'vert' },
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
        h('span', null, 'Modèle retenu : ', h('b', null, modeleLdm.fichier.split('/').pop()))
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
          champsMentions.map(champ =>
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
              champ.aide ? h('div', { className: 'form-help' }, champ.aide) : null
            ))
        )
      ),
      /* La phrase qui partira dans la lettre a sa propre rubrique : c'est le
         seul texte de l'étape qui sera lu tel quel par le client, il ne se
         confond pas avec les champs qui l'alimentent. */
      h(FormSection, { icon: '📝', title: 'La phrase telle qu’elle sortira dans la lettre', ton: 'violet', style: { marginTop: 18 } },
        // La phrase est directement éditable : plus de bouton à adopter, ce
        // qu'on lit est ce qui partira dans la lettre.
        h('textarea', {
          className: 'form-textarea', rows: 2,
          value: ldmChamps.phraseActivite !== undefined
            ? ldmChamps.phraseActivite
            : phraseActivite(ldmChamps.activite, champsLettre.adresse, isSociete ? 'Société' : nature),
          onChange: e => majChamp('phraseActivite', e.target.value),
        }),
        ldmChamps.phraseActivite !== undefined ? h('button', {
          className: 'btn btn-secondary btn-sm', style: { marginTop: 10 },
          onClick: () => majChamp('phraseActivite', undefined),
        }, '↺ Revenir à la phrase proposée') : null
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        /* Un seul geste : le modèle est déjà déterminé par les étapes
           précédentes et livré avec le logiciel. Le sélecteur de fichier
           n'apparaît que si ce modèle n'a pas pu être chargé. */
        (generation && generation.choixManuel)
          ? h('label', { className: cx('btn', 'btn-accent', 'btn-fichier', !modeleLdm && 'btn-inerte') },
            generation.enCours ? 'Génération…' : '📄 Désigner le modèle Word',
            h('input', { type: 'file', accept: '.docx', className: 'input-fichier-couvrant', disabled: !modeleLdm, onChange: genererLettre, 'aria-label': 'Choisir le modèle Word de lettre de mission' })
          )
          : h('button', {
            className: cx('btn', 'btn-accent', !modeleLdm && 'btn-inerte'),
            disabled: !modeleLdm || (generation && generation.enCours),
            onClick: genererDepuisModele,
          }, generation && generation.enCours ? 'Génération…' : '📄 Générer la lettre'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 6 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2' },
        h('div', null,
          /* Les deux lignes affichaient une coche verte sans que rien n'ait été
             récupéré, et le bouton ne faisait que changer son propre libellé.
             Chacune indique désormais son état réel et rend son résultat ;
             l'interrogation du registre alimente pour de bon la liste des
             bénéficiaires effectifs reprise à l'étape « Qui est derrière ». */
          h(FormSection, { icon: '🤖', title: 'Récupérés automatiquement', ton: 'bleu' },
            h('div', { className: 'recup-liste' },
              h('div', { className: 'recup-ligne' },
                h('div', { className: 'recup-tete' },
                  h('span', { className: cx('cq-pastille', statuts ? 'vert' : 'gris') }, statuts ? '✓' : '·'),
                  h('span', { className: 'recup-nom' }, 'Statuts de la société'),
                  statuts
                    ? h('span', { className: 'form-help', style: { margin: 0 } }, 'Classés dans le Drive')
                    : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => { setStatuts(true); showToast('Statuts récupérés et classés dans le Dossier permanent (démonstration).'); } }, 'Récupérer')
                ),
                h('div', { className: 'cq-preuve-detail' }, statuts
                  ? 'Déposés dans 00_Dossier permanent. Résultat de démonstration : aucun document n’est réellement téléchargé.'
                  : 'Récupération depuis le registre du commerce, puis classement automatique.')
              ),
              h('div', { className: 'recup-ligne' },
                h('div', { className: 'recup-tete' },
                  h('span', { className: cx('cq-pastille', beInterroge ? 'vert' : 'gris') }, beInterroge ? '✓' : '·'),
                  h('span', { className: 'recup-nom' }, 'Bénéficiaires effectifs'),
                  beInterroge
                    ? h('button', { className: 'btn btn-secondary btn-sm', onClick: interrogerRbe }, '↻ Réinterroger')
                    : h('button', { className: 'btn btn-secondary btn-sm', onClick: interrogerRbe }, 'Interroger')
                ),
                h('div', { className: 'cq-preuve-detail' }, beInterroge
                  ? beneficiairesListe.filter(b => (b.nom || '').trim()).map(b => `${b.nom}${b.part ? ' — ' + pourcent(b.part) : ''}`).join(', ')
                    + '. Repris à l’étape « Qui est derrière le client ».'
                  : 'Interrogation du registre des bénéficiaires effectifs (data.inpi.fr).')
              )
            )
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

    // ---- 7. Qui est derrière le client : les personnes, et rien d'autre ----
    step === 7 && h('div', { className: 'step-body' },
      /* L'étape répond à deux questions distinctes : qui sont les personnes,
         et que disent les registres. Le troisième sujet — d'où vient l'argent —
         a sa propre rubrique en dessous : mélangé aux deux autres, il rendait
         la colonne de gauche illisible. */
      h('div', { className: 'grid-2 colonnes-egales' },
        h('div', { className: 'pile-cartes' },
        h(FormSection, { icon: '👤', title: 'Les personnes derrière le client', ton: 'violet',
          subtitle: 'CMF art. L. 561-2-2 et L. 561-5' },
          h('div', { className: 'be-barre' },
            h('button', { className: 'btn btn-accent btn-sm', onClick: interrogerRbe },
              beInterroge ? '↻ Réinterroger le registre' : '🔎 Interroger le registre (RBE)')
          ),
          h('div', { className: 'be-table' },
            h('div', { className: 'be-entete' },
              h('span', null, 'Nom et prénom'), h('span', null, '%'),
              h('span', null, 'Vérifiée'), h('span', null, '')),
            beneficiairesListe.map((b_, i) => h('div', { className: 'be-ligne', key: i },
              h('input', {
                className: 'form-input', placeholder: 'Nom et prénom', value: b_.nom,
                onChange: e => setBeneficiairesListe(l => l.map((x, j) => j === i ? { ...x, nom: e.target.value } : x)),
              }),
              h('input', {
                className: 'form-input', type: 'number', min: 0, max: 100, placeholder: '%', value: b_.part,
                onChange: e => setBeneficiairesListe(l => l.map((x, j) => j === i ? { ...x, part: e.target.value } : x)),
              }),
              h('label', { className: 'be-case', title: 'Identité vérifiée sur pièce' },
                h('input', {
                  type: 'checkbox', checked: b_.verifie,
                  onChange: () => setBeneficiairesListe(l => l.map((x, j) => j === i ? { ...x, verifie: !x.verifie } : x)),
                }),
                h('span', null, 'sur pièce')
              ),
              beneficiairesListe.length > 1 ? h('button', {
                className: 'be-retirer', 'aria-label': 'Retirer ce bénéficiaire', title: 'Retirer ce bénéficiaire',
                onClick: () => setBeneficiairesListe(l => l.filter((_, j) => j !== i)),
              }, '✕') : h('span', null)
            ))
          ),
          h('button', {
            className: 'btn btn-secondary btn-sm', style: { marginTop: 8 },
            onClick: () => setBeneficiairesListe(l => l.concat([{ nom: '', part: '', verifie: false }])),
          }, '+ Ajouter une personne'),
          h('div', { className: 'be-ppe' },
            h('span', { className: 'form-label', style: { margin: 0 } }, 'Personne politiquement exposée ?'),
            h('div', { className: 'toggle-pair' },
              [['non', 'Non'], ['a_verifier', 'À vérifier'], ['oui', 'Oui']].map(([code, label]) => h('button', {
                key: code,
                className: cx('toggle-btn', ppeStatut === code && (code === 'oui' ? 'selected no' : code === 'non' ? 'selected yes' : 'selected attente')),
                onClick: () => setPpeStatut(code),
              }, label))
            )
          ),
          ppeStatut !== 'non' ? h('input', {
            className: 'form-input', style: { marginTop: 8 },
            placeholder: 'Fonction concernée, depuis quand…',
            value: ppeDetail, onChange: e => setPpeDetail(e.target.value),
          }) : null
        ),
        h(FormSection, { icon: '💶', title: 'Origine du patrimoine et des fonds', ton: 'violet' },
          h('div', { className: 'toggle-pair' },
            [['documentee', 'Documentée'], ['partielle', 'Partielle'], ['a_faire', 'À documenter']].map(([code, label]) => h('button', {
              key: code,
              className: cx('toggle-btn', origineEtat === code && (code === 'documentee' ? 'selected yes' : code === 'a_faire' ? 'selected no' : 'selected attente')),
              onClick: () => setOrigineEtat(code),
            }, label))
          ),
          h('input', {
            className: 'form-input', style: { marginTop: 10 },
            placeholder: 'D’où proviennent les fonds : chiffre d’affaires, apport, cession…',
            value: origineDetail, onChange: e => setOrigineDetail(e.target.value),
          })
        )
        ),
        h(FormSection, { icon: '🔎', title: 'Vérifications en base', ton: 'violet',
          subtitle: `${basesVerifiees.length} sur ${VIGILANCE_BASES.length}` },
          h('div', { className: 'be-barre' },
            h('button', { className: 'btn btn-accent btn-sm', onClick: toutVerifier }, '🔎 Tout vérifier'),
            h('span', { className: 'form-help', style: { margin: 0 } },
              'Résultats de démonstration : client fictif.')
          ),
          /* Avant la vérification, une ligne par base : intitulé et source
             suffisent. Le détail n'apparaît qu'une fois le résultat connu —
             c'est lui qui compte, pas la description de la base. */
          /* Le verdict court se lit à droite du nom de la base, le détail qui
             le justifie juste en dessous : on saisit l'état des cinq
             vérifications d'un coup d'œil, sans lire cinq paragraphes. */
          VIGILANCE_BASES.map(base => {
            const res = resultatsBases[base.code];
            return h('div', { className: cx('verif-ligne', res && (res.issue === 'ok' ? 'faite-ok' : 'faite-alerte')), key: base.code },
              h('div', { className: 'verif-tete' },
                h('span', { className: cx('cq-pastille', res ? (res.issue === 'ok' ? 'vert' : 'orange') : 'gris') },
                  res ? (res.issue === 'ok' ? '✓' : '!') : '·'),
                h('span', { className: 'verif-nom' }, base.label),
                res
                  ? h('span', { className: cx('verif-verdict', res.issue === 'ok' ? 'vert' : 'orange') }, res.verdict || 'Vérifié')
                  : h('button', { className: 'btn btn-secondary btn-sm', onClick: () => lancerVerification(base.code) }, 'Vérifier')
              ),
              h('div', { className: 'verif-detail' }, res ? res.texte : base.ou)
            );
          })
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    // ---- 8. Cotation : à gauche ce qu'on sait, à droite ce qu'on note ----
    step === 8 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2 colonnes-egales' },
        h(FormSection, { icon: '📌', title: 'Ce que nous savons du client', ton: 'violet' },
          h('div', { className: 'recap-bloc' },
            h('div', { className: 'recap-bloc-titre' }, 'Identité'),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Client'), h('span', { className: 'v' }, SCENARIO_NOUVEAU_CLIENT.societe)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Forme'), h('span', { className: 'v' }, isSociete ? typeSociete : nature)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Activité'), h('span', { className: 'v' }, ldmChamps.activite || SCENARIO_NOUVEAU_CLIENT.activite)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Siège'), h('span', { className: 'v' }, adresseSiege)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Dirigeant'), h('span', { className: 'v' }, `${prenomDirigeant} ${nomDirigeant} — ${fonctionDirigeant}`))
          ),
          h('div', { className: 'recap-bloc' },
            h('div', { className: 'recap-bloc-titre' }, 'Mission'),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Régime fiscal'), h('span', { className: 'v' }, isAssociation ? regimeAsso : (isParticulierIRPP ? lmpLmnp : regimeFiscal))),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Salariés'), h('span', { className: 'v' }, salariesEffective ? `${nbSalaries} ${pluriel(nbSalaries, 'bulletin')} par mois` : 'aucun')),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Honoraires annuels HT'), h('span', { className: 'v' }, euros(montants.totalAnnuelHT)))
          ),
          /* Deux natures d'information étaient mêlées dans une même liste : des
             personnes, et l'état de trois contrôles. Les personnes se lisent
             comme des personnes, les contrôles comme trois voyants. */
          h('div', { className: 'recap-bloc' },
            h('div', { className: 'recap-bloc-titre' }, 'Bénéficiaires effectifs'),
            (beneficiairesListe.filter(b => (b.nom || '').trim()).length
              ? h('div', { className: 'recap-personnes' },
                beneficiairesListe.filter(b => (b.nom || '').trim()).map((b, i) => h('span', {
                  className: cx('recap-personne', b.verifie ? 'verifiee' : 'a-verifier'), key: i,
                  title: b.verifie ? 'Identité vérifiée sur pièce' : 'Identité non vérifiée',
                },
                  h('span', { className: 'recap-personne-marque' }, b.verifie ? '✓' : '!'),
                  h('span', { className: 'recap-personne-nom' }, b.nom.trim()),
                  b.part ? h('span', { className: 'recap-personne-part' }, pourcent(b.part)) : null
                )))
              : h('div', { className: 'form-help', style: { marginTop: 0 } }, 'Aucun bénéficiaire effectif saisi.'))
          ),
          h('div', { className: 'recap-bloc' },
            h('div', { className: 'recap-bloc-titre' }, 'Contrôles effectués'),
            h('div', { className: 'recap-voyants' },
              [['PPE', VIGILANCE_PPE_STATUTS[ppeStatut].label, VIGILANCE_PPE_STATUTS[ppeStatut].couleur],
               ['Origine des fonds', VIGILANCE_ORIGINE_ETATS[origineEtat].label, VIGILANCE_ORIGINE_ETATS[origineEtat].couleur],
               ['Vérifications en base', `${basesVerifiees.length} sur ${VIGILANCE_BASES.length}`,
                 basesVerifiees.length === VIGILANCE_BASES.length ? 'vert' : 'orange'],
              ].map(([cle, valeur, couleur]) => h('div', { className: cx('recap-voyant', couleur), key: cle },
                h('span', { className: 'recap-voyant-cle' }, cle),
                h('span', { className: 'recap-voyant-valeur' }, valeur)
              ))
            )
          )
        ),
        /* La justification a été retirée de cette étape : elle faisait double
           emploi avec celle de l'étape suivante, où le niveau est arrêté. Les
           quatre critères occupent désormais toute la colonne. */
        h('div', { className: 'pile-cartes' },
          h(FormSection, { icon: '🎯', title: 'Notez le risque sur quatre critères', ton: 'violet', style: { flex: '1 1 auto', display: 'flex', flexDirection: 'column' } },
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
            ),
            /* La conséquence de la notation s'affiche ici : sans elle, on note
               quatre critères sans savoir ce qu'ils déclenchent, et il faut
               passer à l'étape suivante pour le découvrir. */
            h('div', { className: cx('nplab-resultat', 'niv-' + niveauPropose) },
              h('span', { className: 'nplab-resultat-cle' }, 'Niveau qui en découle'),
              h('span', { className: 'nplab-resultat-valeur' }, 'Vigilance ', niveauPropose.toLowerCase())
            )
          )
        )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Brouillon enregistré (démonstration)') }, '💾 Enregistrer le brouillon'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    // ---- 9. Niveau suggéré en haut, niveau retenu en bas ----
    /* Deux colonnes, comme le reste de l'assistant : à gauche la proposition
       du logiciel, à droite la décision du cabinet. La lecture va de la
       gauche vers la droite, dans l'ordre où l'on décide. */
    step === 9 && h('div', { className: 'step-body' },
      h('div', { className: 'grid-2 colonnes-egales' },
      /* La colonne de gauche remplit la hauteur au même titre que celle de
         droite : le cadre de synthèse s'étire, et le texte rédigé ne se
         retrouve plus tronqué en bas de la carte. */
      h(FormSection, { icon: '🤖', title: 'Ce que le logiciel propose', ton: 'violet',
        style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },
        h('div', { className: cx('niveau-carte', 'niv-' + niveauPropose) },
          h('div', { className: 'niveau-carte-label' }, 'Niveau suggéré, calculé à partir de vos quatre cotations'),
          h('div', { className: 'niveau-carte-valeur' }, 'Vigilance ', niveauPropose.toLowerCase())
        ),
        h('div', { className: 'synthese-cadre' },
          h('div', { className: 'synthese-titre' }, 'Synthèse de l’analyse'),
          synthese
            ? h('p', { className: 'synthese-texte' }, synthese)
            : h('p', { className: 'synthese-vide' }, 'Cliquez sur « Rédiger la synthèse » : le logiciel reprend en un paragraphe l’activité, les bénéficiaires effectifs, le statut PPE, l’origine des fonds, votre cotation et les vérifications effectuées. Texte rédigé à partir de vos seules saisies, sans appel à un service extérieur.')
        ),
        h('div', { className: 'doc-actions' },
          h('button', {
            className: 'btn btn-accent',
            onClick: () => setSynthese(redigerSyntheseVigilance({
              client: SCENARIO_NOUVEAU_CLIENT.societe,
              activite: ldmChamps.activite || SCENARIO_NOUVEAU_CLIENT.activite,
              classification,
              beneficiaires: beneficiairesListe,
              ppe: { statut: ppeStatut, detail: ppeDetail },
              origineFonds: { etat: origineEtat, detail: origineDetail },
              operations: [],
              niveauCalcule: niveauPropose,
              justification: commentaireVigilance,
              basesVerifiees,
            })),
          }, synthese ? '↻ Refaire la synthèse' : '✨ Rédiger la synthèse'),
          synthese ? h('button', {
            className: 'btn btn-primary',
            onClick: () => { setNiveauRetenu(niveauPropose); setCommentaireVigilance(synthese); showToast('Synthèse et niveau repris à droite.'); },
          }, '→ Je suis d’accord : reprendre à droite') : null
        )
      ),
      h(FormSection, { icon: '🛡️', title: 'Ce que le cabinet retient', ton: 'violet' },
        // Les trois niveaux l'un sous l'autre : ils forment une échelle, et
        // chacun garde la même largeur — trois colonnes les déformaient selon
        // la longueur de leur explication.
        h('div', { className: 'niveau-choix' },
          [['Allégée', 'Sur décision motivée du référent LBC-FT'],
           ['Normale', 'Vigilance de droit commun'],
           ['Renforcée', 'Surveillance accrue et pièces complémentaires']].map(([n, aide]) => h('button', {
            key: n,
            className: cx('niveau-option', 'niv-' + n, niveauRetenu === n && 'active'),
            onClick: () => setNiveauRetenu(n),
          },
            h('span', { className: 'niveau-puce', 'aria-hidden': 'true' }, niveauRetenu === n ? '●' : ''),
            h('span', { className: 'niveau-option-texte' },
              h('span', { className: 'niveau-option-nom' }, n),
              h('span', { className: 'niveau-option-aide' }, aide)
            ),
            n === niveauPropose ? h('span', { className: 'niveau-tag' }, 'suggéré') : null
          ))
        ),
        niveauRetenu !== niveauPropose
          ? h('div', { className: 'info-box info-box-alerte', style: { marginTop: 12 } }, '⚠️ ',
            `Vous retenez « ${niveauRetenu} » alors que le calcul propose « ${niveauPropose} » : la justification devient obligatoire.`)
          : null,
        h('div', { className: 'form-label', style: { marginTop: 14 } }, 'Justification retenue'),
        h('textarea', {
          className: 'form-textarea', rows: 4,
          placeholder: 'Motivez le niveau retenu.',
          value: commentaireVigilance, onChange: e => setCommentaireVigilance(e.target.value),
        }),
        h('div', { className: 'form-help' }, 'Ce texte sera repris tel quel dans la fiche de vigilance du dossier.')
      )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', {
          className: 'btn btn-primary',
          disabled: niveauRetenu !== niveauPropose && !commentaireVigilance.trim(),
          onClick: next,
        }, 'Continuer →')
      )
    ),

    step === 10 && h('div', { className: 'step-body' },
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
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Vérifications en base'), h('span', { className: 'v' }, `${basesVerifiees.length} sur ${VIGILANCE_BASES.length}`)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Bénéf. effectif'), h('span', { className: 'v' },
              beneficiairesListe.some(b_ => b_.nom.trim() && b_.verifie) ? 'Identifié et vérifié' : 'À compléter')),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'PPE'), h('span', { className: 'v' }, VIGILANCE_PPE_STATUTS[ppeStatut].label)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Origine des fonds'), h('span', { className: 'v' }, VIGILANCE_ORIGINE_ETATS[origineEtat].label)),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Justification'), h('span', { className: 'v' }, commentaireVigilance ? 'Renseignée' : 'Manquante'))
          ),
          h('div', { className: 'recap-tile' },
            h('div', { className: 'recap-tile-head' }, h('span', { className: 'recap-tile-icon' }, '📨'), 'Documents'),
            h('div', { className: 'recap-tile-main' }, DOCUMENTS_A_DEMANDER_CLIENT.filter(d => docsDemandes[d]).length + ' demandés au client'),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Statuts'), h('span', { className: 'v' }, statuts ? 'Récupérés' : 'À récupérer')),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Bénéf. effectifs'), h('span', { className: 'v' }, beneficiaires ? 'Interrogés' : 'À interroger')),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Drive'),
              h('span', { className: 'v' }, driveCree ? h(Badge, { color: 'vert' }, 'arborescence créée') : h(Badge, { color: 'orange' }, 'à créer ci-dessous')))
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
        // Deux actions distinctes : ranger les documents dans le Drive, et
        // clore le parcours. La première peut se relancer sans tout refaire.
        h('button', {
          className: cx('btn', driveCree ? 'btn-secondary' : 'btn-accent'),
          onClick: () => {
            setDriveCree(true);
            showToast(`Arborescence créée et ${DOCUMENTS_A_COLLECTER.length + DOCUMENTS_A_DEMANDER_CLIENT.length} documents classés dans le Drive (démonstration)`);
          },
        }, driveCree ? '📁 Drive créé — relancer le classement' : '📁 Créer l’arborescence et classer les documents'),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => {
            showToast('Dossier créé — lettre, analyse LBC-FT et demandes enregistrées (démonstration)');
            if (onFinish) onFinish();
          },
        }, '✅ Terminer')
      )
    )
  );
}
