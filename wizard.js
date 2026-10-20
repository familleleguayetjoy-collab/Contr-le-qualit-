// ComplyEC — Assistants partagés : Reprise déontologique & Contractualisation
'use strict';

// ============================================================ Reprise déontologique

const REPRISE_STEPS = ['Paramétrage', 'Pièces à demander', 'Courrier et e-mail'];


function ReprisePage({ showToast, cabinetSettings, onFinish }) {
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
      onBack: () => setStep(2), onFinish,
      collaborateurCharge, showToast, dateReprise, pieces, piecesSupplementaires, cabinetSettings,
      // Le courrier reprend ce qui a été saisi à l'étape 1, pas le scénario.
      confrere: { ...SCENARIO_CABINET_CONFRERE, nomConfrere, prenomConfrere, emailConfrere },
    });
  }

  return h('div', { className: 'page' },
    h('div', { className: 'page-header' },
      h('div', null, h('h1', null, 'Reprise déontologique')),
      h('div', { className: 'page-header-actions' },
        
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
      h('div', null, h('h1', null, 'Reprise déontologique')),
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
  /* Le corps du courriel est composé en blocs, pas en lignes.

     Les blocs sont séparés par une ligne vide ; à l'intérieur d'un bloc, les
     lignes se suivent. C'est ce qui distingue une énumération de son phrase
     d'introduction, et c'est ce qui manquait : tout arrivait collé, et une
     lettre adressée à un confrère collée en un seul pavé se lit mal et se
     présente mal. */
  const listePieces = (retenues || []).map(p => piecePhrase(p));
  const blocs = [
    'Cher Confrère,',

    `Conformément aux règles instituées par notre Code des devoirs professionnels, je vous informe avoir été sollicité par ${c.dirigeantCivilite === 'Mme' ? 'Madame' : 'Monsieur'} ${c.dirigeantPrenom} ${c.dirigeantNom.toUpperCase()}, ${fonction} de la société ${c.societe.toUpperCase()} (SIRET : ${c.siret}), sise ${c.adresse}, afin d’assurer une mission de présentation des comptes annuels à compter du ${formatDateLong(dateReprise)}.`,

    // L'envoi postal et le fondement de la demande forment un seul bloc : la
    // seconde phrase dit sous quel article la première est adressée.
    'À ce titre, je vous informe vous avoir également adressé par courrier une lettre relative à la reprise de ce dossier.\n'
      + 'En application de l’article 163 du décret du 30 mars 2012, je vous serais reconnaissant de bien vouloir m’indiquer si rien ne s’oppose à notre entrée en fonction et, notamment :',

    '• s’il est survenu entre vous et votre client des difficultés dont il conviendrait de m’informer ;\n'
      + '• si les considérations ayant motivé le changement de professionnel vous paraissent de nature à éluder les effets d’une stricte observation de nos devoirs et responsabilités professionnels ;\n'
      + '• si les honoraires qui vous sont dus au titre des travaux réalisés ont été intégralement réglés, après présentation de votre demande.',

    'Afin de me permettre d’apprécier pleinement la mission qui m’est proposée, je vous remercie de bien vouloir me faire part de vos éventuelles observations dans les meilleurs délais.',

    'À défaut de réponse de votre part dans un délai de 15 jours, je considérerai que rien ne s’oppose à notre entrée en fonction.',
  ];

  if (listePieces.length) {
    // La demande de pièces et sa liste ne se séparent pas : la phrase annonce
    // « les éléments suivants », ils doivent suivre.
    blocs.push('Par ailleurs, afin d’assurer la continuité du dossier dans les meilleures conditions, je vous remercie de bien vouloir nous transmettre les éléments suivants :\n'
      + listePieces.map((p, i) => `• ${p}${i === listePieces.length - 1 ? '.' : ' ;'}`).join('\n'));
    blocs.push('Je vous remercie par avance pour votre retour et pour la transmission de ces éléments.');
  }

  blocs.push('Je vous prie de croire, Cher Confrère, à l’assurance de ma parfaite considération.');
  blocs.push(cabinet.signature);

  return { lieuDate, corpsHtml, corpsTexte: blocs.join('\n\n') };
}

function RepriseEtape2({ onBack, onFinish, collaborateurCharge, showToast, dateReprise, pieces, piecesSupplementaires, confrere, cabinetSettings }) {
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
      h('div', null, h('h1', null, 'Reprise déontologique'))
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
        h('button', {
          className: 'btn btn-primary',
          /* Finaliser ramène au menu de l'entrée en mission : la reprise est
             faite, il n'y a plus rien à faire sur cet écran. Le message ne
             dit pas « téléchargé » — il ne l'est que si l'on a cliqué
             « Ouvrir dans Word ». */
          onClick: () => {
            showToast(capaciteReelle('sendEmail')
              ? 'Reprise finalisée — courrier et e-mail envoyés.'
              : 'Reprise finalisée. Le courrier et l’e-mail partent depuis votre messagerie.');
            if (onFinish) onFinish();
          },
        }, 'Finaliser la reprise →')
      )
    )
  );
}

/* =====================================================================
   Analyse de vigilance LBC-FT — parcours commun

   La même analyse est menée à deux moments : pendant la contractualisation
   d'un nouveau client (étapes 7 à 9 de l'entrée en mission) et lors de la
   reprise d'une analyse existante. C'est le même travail, donc le même
   parcours : l'état et les trois écrans sont définis ici une seule fois et
   rendus à l'identique par les deux appelants. Toute évolution profite aux
   deux, et aucun des deux ne peut dériver de l'autre.
   ===================================================================== */

const VIGILANCE_CLASSIFICATION_DEFAUT = () =>
  Object.fromEntries(NPLAB_CRITERES.map(c => [c.code, 'Faible']));

/* État de l'analyse : les saisies, les résultats d'interrogation et les
   actions qui les produisent. `initial` permet de reprendre une analyse déjà
   arrêtée ; sans lui, l'analyse démarre vierge. */
function useEtatVigilance(initial) {
  const i = initial || {};
  const [beneficiaires, setBeneficiaires] = useState(() =>
    (i.beneficiaires && i.beneficiaires.length
      ? i.beneficiaires.map(b => ({ nom: b.nom || '', part: b.part == null ? '' : b.part, verifie: !!b.verifie }))
      : [{ nom: '', part: '', verifie: false }]));
  const [beInterroge, setBeInterroge] = useState(!!i.beInterroge);
  const [ppeStatut, setPpeStatut] = useState(i.ppeStatut || 'a_verifier');
  const [ppeDetail, setPpeDetail] = useState(i.ppeDetail || '');
  /* La personne concernée, choisie parmi les bénéficiaires effectifs nommés
     à l'étape précédente. Elle est jointe au détail à l'enregistrement : la
     base ne connaît qu'un texte, et un texte qui dit « qui » se relit mieux
     qu'un identifiant. */
  const [ppeQui, setPpeQui] = useState(i.ppeQui || '');
  /* La réponse se donne désormais personne par personne : pour chaque
     bénéficiaire effectif, oui ou non, et la fonction si oui. Le statut du
     dossier s'en déduit — il suffit d'une personne exposée pour qu'il le soit,
     et il n'est « non » que lorsque chacun a répondu non. */
  const [ppeReponses, setPpeReponses] = useState(() => Object.assign({}, i.ppeReponses));
  function setPpeReponse(cle, champ, valeur) {
    setPpeReponses(r => Object.assign({}, r, { [cle]: Object.assign({}, r[cle], { [champ]: valeur }) }));
  }
  const nommesPpe = beneficiaires.map(b => (b.nom || '').trim()).filter(Boolean);
  const clePpe = nommesPpe.map(n => `${n}|${(ppeReponses[n] || {}).statut || ''}|${(ppeReponses[n] || {}).fonction || ''}`).join('§');
  useEffect(() => {
    const repondus = nommesPpe.filter(n => ppeReponses[n] && ppeReponses[n].statut);
    if (!nommesPpe.length || !repondus.length) return;
    const exposes = nommesPpe.filter(n => (ppeReponses[n] || {}).statut === 'oui');
    const statut = exposes.length ? 'oui' : (repondus.length === nommesPpe.length ? 'non' : 'a_verifier');
    setPpeStatut(statut);
    setPpeQui('');
    setPpeDetail(exposes.map(n => [n, String((ppeReponses[n] || {}).fonction || '').trim()].filter(Boolean).join(' — ')).join(' ; '));
  }, [clePpe]);
  const [origineEtat, setOrigineEtat] = useState(i.origineEtat || 'a_faire');
  const [origineDetail, setOrigineDetail] = useState(i.origineDetail || '');
  const [basesVerifiees, setBasesVerifiees] = useState(() => (i.basesVerifiees || []).slice());
  const [resultatsBases, setResultatsBases] = useState(() => Object.assign({}, i.resultatsBases));
  /* Les vérifications consignées, une par code : ce que l'expert-comptable a
     constaté, quand, et sur quelle source. Elles ne sont pas fabriquées par le
     logiciel (§ 22.3). */
  const [verifications, setVerifications] = useState(() => Object.assign({}, i.verifications));
  /* Ce que la cartographie réclame et que la cotation seule ne dit pas : le
     secteur, les pays, la nature de l'exposition, et le classement de plein
     droit au titre de l'article L. 561-10-1. */
  const [secteurNaf, setSecteurNaf] = useState(i.secteurNaf || '');
  const [paysSiege, setPaysSiege] = useState(i.paysSiege || 'France');
  const [paysBeneficiaires, setPaysBeneficiaires] = useState(i.paysBeneficiaires || 'France');
  const [natureExposition, setNatureExposition] = useState(i.natureExposition || '');
  const [paysListe, setPaysListe] = useState(!!i.paysListe);
  const [classification, setClassification] = useState(() =>
    Object.assign(VIGILANCE_CLASSIFICATION_DEFAUT(), i.classification));
  const [synthese, setSynthese] = useState('');
  const [justification, setJustification] = useState(i.justification || '');

  const niveauPropose = niveauCalculeVigilance(classification);
  const [niveauRetenu, setNiveauRetenu] = useState(i.niveauRetenu || niveauPropose);
  /* Le niveau retenu suit le calcul tant que l'analyse n'a pas déjà été
     arrêtée : sur une reprise, la décision du cabinet fait foi et n'est pas
     écrasée par le recalcul. */
  const reprise = !!i.niveauRetenu;
  useEffect(() => { if (!reprise) setNiveauRetenu(niveauPropose); }, [niveauPropose]);

  function interrogerRbe() {
    setBeneficiaires(RBE_REPONSE_DEMO.map(b => ({ nom: b.nom, part: b.part, verifie: !!b.verifie })));
    setBeInterroge(true);
    setBasesVerifiees(l => (l.includes('rbe') ? l : l.concat(['rbe'])));
    setResultatsBases(r => Object.assign({}, r, { rbe: VIGILANCE_RESULTATS_DEMO.rbe }));
  }

  /* Consigner, ce n'est pas vérifier.

     ComplyEC n'interroge aucune de ces bases. Cette fonction enregistre ce que
     l'expert-comptable a constaté sur le site officiel qu'il vient d'ouvrir :
     rien à signaler, ou une correspondance. Écrire un résultat que personne
     n'a lu serait un faux, et un contrôleur le relèverait. */
  function lancerVerification(code, issue, texte) {
    const base = VIGILANCE_BASES.find(b => b.code === code);
    const le = new Date().toISOString().slice(0, 10);
    const ligne = {
      issue: issue || 'ok',
      verdict: issue === 'alerte' ? 'Correspondance' : 'Rien à signaler',
      texte: texte
        || (issue === 'alerte'
          ? `Correspondance relevée le ${formatDate(le)} sur ${base ? base.ou : 'la base consultée'} — à documenter ci-dessous.`
          : `Consulté le ${formatDate(le)} : aucune correspondance relevée.`),
      consigneLe: le,
    };
    setBasesVerifiees(l => (l.includes(code) ? l : l.concat([code])));
    setResultatsBases(r => Object.assign({}, r, { [code]: ligne }));
  }

  function annulerVerification(code) {
    setBasesVerifiees(l => l.filter(x => x !== code));
    setResultatsBases(r => {
      const copie = Object.assign({}, r);
      delete copie[code];
      return copie;
    });
  }

  function consignerVerification(code, resultat) {
    setVerifications(v => Object.assign({}, v, { [code]: resultat }));
  }

  function detailPpe() {
    if (ppeStatut === 'non') return ppeDetail;
    return [ppeQui, ppeDetail.trim()].filter(Boolean).join(' — ');
  }

  function redigerSynthese(contexte) {
    setSynthese(redigerSyntheseVigilance(Object.assign({
      classification,
      beneficiaires,
      ppe: { statut: ppeStatut, detail: detailPpe() },
      origineFonds: { etat: origineEtat, detail: origineDetail },
      operations: [],
      niveauCalcule: niveauPropose,
      justification,
      basesVerifiees,
    }, contexte)));
  }

  return {
    beneficiaires, setBeneficiaires, beInterroge,
    ppeStatut, setPpeStatut, ppeDetail, setPpeDetail, ppeQui, setPpeQui, detailPpe,
    ppeReponses, setPpeReponse,
    origineEtat, setOrigineEtat, origineDetail, setOrigineDetail,
    basesVerifiees, resultatsBases,
    verifications, consignerVerification,
    classification, setClassification,
    synthese, setSynthese,
    justification, setJustification,
    niveauPropose, niveauRetenu, setNiveauRetenu,
    secteurNaf, setSecteurNaf,
    paysSiege, setPaysSiege,
    paysBeneficiaires, setPaysBeneficiaires,
    natureExposition, setNatureExposition,
    paysListe, setPaysListe,
    interrogerRbe, lancerVerification, annulerVerification, redigerSynthese,
    /* Ce qui part dans la couche de données à l'enregistrement. Rassemblé ici
       pour que les deux parcours écrivent exactement la même chose. */
    aEnregistrer: () => ({
      classification,
      niveauRetenu: niveauRetenu || niveauPropose,
      niveauPropose,
      justification,
      beneficiaires: beneficiaires.filter(b => (b.nom || '').trim()),
      ppe: { statut: ppeStatut, detail: detailPpe() },
      origineFonds: { etat: origineEtat, detail: origineDetail },
      verifications,
      /* Les faits qui fondent la cotation, et que la cartographie reprend. */
      secteurNaf, paysSiege, paysBeneficiaires, natureExposition, paysListe,
    }),
  };
}

/* Étape « Qui est derrière le client ».

   À gauche, ce que disent les registres : un rectangle par base, avec le lien
   qui l'ouvre et les deux boutons qui consignent ce qu'on y a vu. À droite,
   les bénéficiaires effectifs, six lignes prêtes — six suffisent dans la quasi
   totalité des structures, et six lignes toujours affichées évitent d'avoir à
   cliquer « ajouter » avant de saisir.

   Deux rectangles, alignés par le bas, et l'écran ne défile pas : c'est la
   règle de mise en page demandée pour cette étape.

   Deux sujets ont quitté cet écran. Le statut de personne politiquement
   exposée a le sien, avec l'attestation que le dirigeant doit signer ;
   l'origine du patrimoine et des fonds l'y a rejoint, puisqu'elle porte, elle
   aussi, sur ce que le client déclare de lui-même. */
function VigilanceEtapePersonnes({ v }) {
  const basesIci = VIGILANCE_BASES.filter(b => b.code !== 'ppe');
  const nbBases = VIGILANCE_BASES.length;

  /* Six lignes, toujours. La liste réelle peut être plus courte ou plus
     longue : on l'affiche telle quelle et on la complète jusqu'à six. */
  const lignes = v.beneficiaires.slice();
  while (lignes.length < 6) lignes.push({ nom: '', part: '', verifie: false });

  function majLigne(i, champ, valeur) {
    v.setBeneficiaires(l => {
      const copie = l.slice();
      while (copie.length <= i) copie.push({ nom: '', part: '', verifie: false });
      copie[i] = Object.assign({}, copie[i], { [champ]: valeur });
      return copie;
    });
  }

  return h('div', { className: 'step-scroll step-remplie' },
  h('div', { className: 'grid-2 colonnes-egales etape-alignee-bas' },
    h(FormSection, { icon: '🔎', title: 'Vérifications en base', ton: 'violet',
      subtitle: `${v.basesVerifiees.length} sur ${nbBases}` },
      /* Les trois registres se partagent toute la hauteur du rectangle :
         posés en tête, ils laissaient un tiers du cadre vide sous eux. */
      h('div', { className: 'verif-pile' },
        basesIci.map(base => h(VerificationLigne, {
          base, v, key: base.code,
          /* Le nom du registre est écrit juste au-dessus : le lien n'a pas à
             le répéter, et c'est ce qui laisse les trois boutons sur une
             seule ligne. */
          lienCourt: 'Consulter',
        })))
    ),

    h(FormSection, { icon: '👤', title: 'Les bénéficiaires effectifs', ton: 'violet',
      subtitle: 'CMF art. L. 561-2-2 et L. 561-5' },
      /* Deux règles rappelées ici, parce que c'est ici qu'on se trompe.

         Un bénéficiaire effectif est toujours une personne physique : c'est
         la personne qui contrôle en dernier ressort (CMF art. L. 561-2-2).
         Quand une société figure au capital, il faut donc remonter la chaîne
         jusqu'aux personnes physiques qui détiennent plus de 25 % du capital
         ou des droits de vote, ou qui exercent le contrôle par un autre moyen ;
         à défaut de pouvoir en identifier une, ce sont les représentants
         légaux (CMF art. R. 561-1). Références vérifiées sur Légifrance le
         23 septembre 2026, jamais citées de mémoire.

         C'est aussi ce qui répond à la question des attestations : il y en a
         une par personne physique nommée ici, préremplie à son nom, et les
         trois questions de l'écran suivant se posent une seule fois pour le
         dossier. */
      h('p', { className: 'form-help', style: { marginTop: 0 } },
        'Saisissez-les tels qu’ils figurent au registre que vous avez consulté. '
        + 'Un bénéficiaire effectif est toujours une personne physique : si une '
        + 'société figure au capital, remontez jusqu’aux personnes physiques qui '
        + 'détiennent plus de 25 % du capital ou des droits de vote, ou qui '
        + 'contrôlent par un autre moyen ; à défaut, ce sont les représentants '
        + 'légaux (CMF art. L. 561-2-2 et R. 561-1).'),
      h('div', { className: 'be-table' },
        h('div', { className: 'be-entete' },
          h('span', null, 'Nom et prénom'), h('span', null, '%'),
          h('span', null, 'Vérifiée')),
        lignes.map((b, i) => h('div', { className: 'be-ligne', key: i },
          h('input', {
            className: 'form-input', placeholder: 'Nom et prénom', value: b.nom,
            onChange: e => majLigne(i, 'nom', e.target.value),
            'aria-label': `Bénéficiaire effectif ${i + 1}`,
          }),
          h('input', {
            className: 'form-input', type: 'number', min: 0, max: 100, placeholder: '%', value: b.part,
            onChange: e => majLigne(i, 'part', e.target.value),
            'aria-label': `Part du bénéficiaire ${i + 1}`,
          }),
          h('label', { className: 'be-case', title: 'Identité vérifiée sur pièce' },
            h('input', {
              type: 'checkbox', checked: !!b.verifie,
              onChange: () => majLigne(i, 'verifie', !b.verifie),
            }),
            h('span', null, 'sur pièce')
          )
        ))
      )
    )
  )
  );
}

/* Un rectangle de vérification : ce que dit la base, où elle se consulte, et
   ce qu'on y a constaté. Sorti du corps de l'étape pour être posé aussi bien
   dans l'écran des bénéficiaires que dans celui de l'attestation PPE. */
function VerificationLigne({ base, v, sansTitre, lienCourt }) {
  const res = v.resultatsBases[base.code];
  return h('div', { className: cx('verif-ligne', sansTitre && 'verif-ligne-nue',
    res && (res.issue === 'ok' ? 'faite-ok' : 'faite-alerte')) },
    sansTitre ? null : h('div', { className: 'verif-tete' },
      h('span', { className: cx('cq-pastille', res ? (res.issue === 'ok' ? 'vert' : 'orange') : 'gris') },
        res ? (res.issue === 'ok' ? '✓' : '!') : '·'),
      h('span', { className: 'verif-nom' }, base.label),
      res
        ? h('span', { className: cx('verif-verdict', res.issue === 'ok' ? 'vert' : 'orange') }, res.verdict || 'Vérifié')
        : null
    ),
    /* Sans titre, l'intitulé de la base est déjà au-dessus : ne reste que ce
       qui a été constaté, et rien tant que rien ne l'a été. */
    (sansTitre && !res) ? null : h('div', { className: 'verif-detail' }, res ? res.texte : base.ou),
    h('div', { className: 'verif-actions' },
      base.lien
        ? h('a', {
          className: 'btn btn-secondary btn-sm',
          href: base.lien, target: '_blank', rel: 'noopener noreferrer',
        }, lienCourt || base.lienLabel || 'Ouvrir le site', h('span', { className: 'lien-externe' }, '↗'))
        : null,
      base.lienSecondaire
        ? h('a', {
          className: 'lien-discret',
          href: base.lienSecondaire, target: '_blank', rel: 'noopener noreferrer',
        }, base.lienSecondaireLabel || 'En savoir plus', ' ↗')
        : null,
      res
        ? h('button', {
          className: 'lien-discret',
          onClick: () => v.annulerVerification(base.code),
        }, 'Revenir sur ce constat')
        /* Les deux constats se tiennent ensemble, à droite : on ouvre le
           registre à gauche, on dit ce qu'on y a vu à droite. */
        : h('span', { className: 'verif-decisions' },
          h('button', {
            className: 'btn btn-primary btn-sm',
            onClick: () => v.lancerVerification(base.code, 'ok'),
          }, 'Rien à signaler'),
          h('button', {
            className: 'btn btn-secondary btn-sm',
            onClick: () => v.lancerVerification(base.code, 'alerte'),
          }, 'Correspondance')
        )
    )
  );
}

/* L'attestation sur l'honneur, au format Word.

   Le texte est celui du modèle du cabinet, repris mot pour mot : il engage la
   personne qui le signe, et une formule réécrite au passage ne l'engagerait
   pas de la même façon. Seuls varient le nom du dirigeant et celui du
   cabinet. */
/* L'attestation sur l'honneur de non-PPE, en PDF.

   Elle n'est plus téléchargée depuis cet écran : elle est préparée, gardée, et
   jointe à l'e-mail de demande de documents, qui réclame au même moment le
   Kbis et la pièce d'identité. Un document que le client reçoit en trois fois
   revient en trois fois — ou pas du tout.

   Ce que ComplyEC remplit : ce que le cabinet sait déjà et a vérifié. Nom,
   prénom, date de naissance et adresse du dirigeant viennent de l'étape
   « Contractant », où l'identité du signataire est établie sur pièce.

   Ce que ComplyEC laisse en blanc, et pourquoi : le lieu, la date et la
   signature. Ce sont les trois mentions qui font d'une attestation sur
   l'honneur un engagement — elles appartiennent au signataire, au moment où il
   signe. Les préremplir reviendrait à dater d'avance un document que personne
   n'a encore lu. */
function blocsAttestationPpe(signataire, cabinet) {
  const ligneOuPointilles = (valeur) => (String(valeur || '').trim()
    || '……………………………………………………………');

  return [
    { texte: 'ATTESTATION SUR L’HONNEUR', style: 'gras', taille: 15, centre: true, apres: 5 },
    { texte: 'Conformément à l’article L. 561-2 et suivants du code monétaire et financier',
      style: 'italique', taille: 9.5, centre: true, apres: 26 },

    { texte: 'Je soussigné(e),', style: 'gras', taille: 11, apres: 6 },
    { texte: 'Nom : ' + ligneOuPointilles(signataire.nom), taille: 11 },
    { texte: 'Prénom : ' + ligneOuPointilles(signataire.prenom), taille: 11 },
    { texte: 'Date de naissance : ' + ligneOuPointilles(signataire.dateNaissance
      ? formatDateLong(signataire.dateNaissance) : ''), taille: 11 },
    { texte: 'Adresse : ' + ligneOuPointilles(signataire.adresse), taille: 11, apres: 22 },

    { texte: 'Déclare sur l’honneur que :', style: 'gras', taille: 11, apres: 8 },
    { texte: '1. Je ne suis pas une personne politiquement exposée au sens des articles '
      + 'L. 561-10 et suivants du code monétaire et financier, à savoir :', taille: 11, retrait: 14, apres: 6 },
    { texte: '• Je n’occupe actuellement aucune fonction publique importante (chef d’État, '
      + 'ministre, parlementaire, haut fonctionnaire, etc.) en France ou dans un autre pays.',
      taille: 11, retrait: 32, apres: 4 },
    { texte: '• Je ne suis pas un membre proche de la famille (conjoint, enfants, parents) '
      + 'ou une personne étroitement associée à une personne politiquement exposée occupant '
      + 'une telle fonction.', taille: 11, retrait: 32, apres: 10 },
    { texte: '2. À ma connaissance, aucune personne détenant directement ou indirectement '
      + 'des parts ou des droits de vote dans ma structure, le cas échéant, ne répond à la '
      + 'définition de personne politiquement exposée.', taille: 11, retrait: 14, apres: 22 },

    { texte: 'Je m’engage à informer immédiatement le cabinet '
      + String((cabinet && cabinet.nom) || '').toUpperCase()
      + ' en cas de changement de ma situation personnelle ou professionnelle qui me ferait '
      + 'entrer dans la catégorie des personnes politiquement exposées.',
      style: 'gras', taille: 11, apres: 40 },

    { texte: 'Fait à : ……………………………………………', taille: 11, apres: 8 },
    { texte: 'Le : ……………………………………………………', taille: 11, apres: 8 },
    { texte: 'Signature :', style: 'gras', taille: 11, apres: 4 },
    { texte: '(signature manuscrite précédée de la mention « lu et approuvé »)',
      style: 'italique', taille: 9 },
  ];
}

function fichierAttestationPpe(signataire, cabinet) {
  const cible = [signataire.prenom, signataire.nom].filter(Boolean).join(' ') || 'dirigeant';
  return {
    nom: 'Attestation_PPE_' + cible.replace(/[^A-Za-zÀ-ÿ0-9]+/g, '-').replace(/^-|-$/g, '') + '.pdf',
    contenu: genererPdf(blocsAttestationPpe(signataire, cabinet), {
      titre: 'Attestation sur l’honneur — personne politiquement exposée',
    }),
  };
}

/* Étape « Attestation PPE ».

   Repris le 23 septembre, sur une question de fond posée par le cabinet : que
   fait-on quand il y a plusieurs bénéficiaires effectifs ?

   La réponse tient en une phrase : une attestation par personne. Le modèle
   précédent faisait signer le seul dirigeant, avec une clause par laquelle il
   déclarait « à sa connaissance » que personne d'autre n'était politiquement
   exposé. Une déclaration faite pour le compte d'un tiers vaut ce qu'elle vaut :
   elle n'engage pas celui qu'elle décrit, et elle ne prouve rien si le tiers se
   révèle exposé. L'article L. 561-2-2 du code monétaire et financier définit le
   bénéficiaire effectif comme la personne physique qui contrôle en dernier
   lieu ; c'est donc chacune de ces personnes que le cabinet doit apprécier, et
   chacune qui signe.

   L'écran produit donc autant d'attestations qu'il y a de bénéficiaires
   effectifs nommés à l'étape précédente. Chacune réclame deux mentions que la
   fiche légale ne donne pas — la date de naissance et l'adresse personnelle —
   qui se saisissent ici, ligne par ligne, dans le rectangle du bas.

   Le lieu, la date et la signature restent en blanc. Ce sont les trois mentions
   qui font d'une attestation sur l'honneur un engagement : elles appartiennent
   au signataire, au moment où il signe.

   L'aperçu, à droite, montre le document en entier sans qu'on ait à le faire
   défiler : c'est une page, elle tient sur un écran. */
function VigilanceEtapePpe({ v, signataires, cabinetSettings }) {
  const basePpe = VIGILANCE_BASES.find(b => b.code === 'ppe');
  const cabinet = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const gens = signataires || [];
  const [choisi, setChoisi] = useState(0);
  const qui = gens[Math.min(choisi, Math.max(0, gens.length - 1))] || {};
  const remplir = valeur => (String(valeur || '').trim() || null);
  const reponse = g => (v.ppeReponses && v.ppeReponses[g.cle]) || {};
  /* Une personne déclarée exposée ne signe pas une attestation qui dit le
     contraire : elle sort de la liste à imprimer, et le dossier passe en
     vigilance renforcée. */
  const aSigner = gens.filter(g => reponse(g).statut !== 'oui');

  /* Imprimer les attestations : une page par personne, dans la fenêtre
     d'impression du navigateur — qui propose aussi « Enregistrer au format
     PDF » pour les joindre à l'e-mail. Le texte est celui du PDF, bloc par
     bloc : une seule rédaction, deux sorties. */
  function imprimerAttestations() {
    if (!aSigner.length) return;
    const w = window.open('', '_blank');
    if (!w) { alert('Autorisez les fenêtres surgissantes pour imprimer les attestations.'); return; }
    const pages = aSigner.map(g => '<section class="page">'
      + blocsAttestationPpe(g, cabinet).map(blocHtmlAttestation).join('') + '</section>').join('');
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
      <title>Attestations PPE — ${echapperHtml(cabinet.nom || '')}</title>
      <style>@page{size:A4;margin:22mm}body{margin:0;font-family:Helvetica,Arial,sans-serif;color:#000}
      .page{page-break-after:always}.page:last-child{page-break-after:auto}p{margin:0}</style>
      </head><body>${pages}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return h('div', { className: 'step-scroll step-sans-defilement' },
  h('div', { className: 'grid-2 colonnes-egales etape-pleine-hauteur ppe-etape' },
    h('div', { className: 'pile-cartes' },
      /* Premier rectangle : la liste officielle des fonctions, à ouvrir, et ce
         qu'on y a constaté. */
      h(FormSection, { icon: '🏛️', title: 'Consulter la liste des fonctions',
        ton: 'violet', subtitle: 'R. 561-18' },
        basePpe ? h(VerificationLigne, { base: basePpe, v, sansTitre: true }) : null
      ),

      /* Second rectangle : une ligne par bénéficiaire effectif, oui ou non,
         et la fonction quand c'est oui. La date de naissance et l'adresse ne
         se saisissent plus ici : c'est le client qui les porte sur
         l'attestation qu'il signe. */
      h(FormSection, { icon: '🪪', title: 'Les signataires sont-ils exposés ?', ton: 'violet',
        subtitle: `${gens.length} ${pluriel(gens.length, 'signataire', 'signataires')}` },
        gens.length
          ? h('div', { className: 'ppe-personnes' },
            gens.map((g, i) => {
              const r = reponse(g);
              const nom = [g.prenom, g.nom].filter(Boolean).join(' ') || 'Sans nom';
              return h('div', {
                key: g.cle || i,
                className: cx('ppe-personne', i === choisi && 'choisi', r.statut === 'oui' && 'exposee'),
                onClick: () => setChoisi(i),
              },
                h('div', { className: 'ppe-personne-ligne' },
                  h('span', { className: 'ppe-personne-nom' }, nom),
                  h('div', { className: 'toggle-pair ppe-personne-choix', role: 'group', 'aria-label': `${nom} est-il une personne politiquement exposée ?` },
                    [['non', 'Non'], ['oui', 'Oui']].map(([code, label]) => h('button', {
                      key: code, type: 'button',
                      className: cx('toggle-btn', r.statut === code && (code === 'oui' ? 'selected no' : 'selected yes')),
                      'aria-pressed': r.statut === code ? 'true' : 'false',
                      onClick: e => { e.stopPropagation(); v.setPpeReponse(g.cle, 'statut', code); },
                    }, label))
                  )
                ),
                /* La ligne de la fonction est toujours là, sous le nom :
                   elle ne fait plus bouger la liste quand on répond « Oui ».
                   Elle ne se remplit que pour une personne exposée. */
                h('input', {
                  className: 'form-input ppe-personne-fonction',
                  placeholder: r.statut === 'non' ? 'Sans objet : pas de fonction exposée' : 'Si oui : fonction, et depuis quand',
                  'aria-label': `Fonction de ${nom}`,
                  disabled: r.statut === 'non',
                  value: r.statut === 'non' ? '' : (r.fonction || ''),
                  onClick: e => e.stopPropagation(),
                  onChange: e => {
                    v.setPpeReponse(g.cle, 'fonction', e.target.value);
                    if (e.target.value.trim() && r.statut !== 'oui') v.setPpeReponse(g.cle, 'statut', 'oui');
                  },
                })
              );
            })
          )
          : h('p', { className: 'form-help', style: { margin: 0 } },
            'Aucun bénéficiaire effectif nommé à l’étape précédente : revenez y '
            + 'porter au moins un nom, c’est lui qui signera.')
      )
    ),

    /* À droite, l'attestation telle qu'elle partira, et le bouton qui les
       imprime toutes. */
    h(FormSection, { icon: '📄', title: 'L’attestation à signer', ton: 'violet',
      subtitle: `${aSigner.length} ${pluriel(aSigner.length, 'attestation', 'attestations')}`,
      style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },

      h('div', { className: 'attestation-apercu attestation-dense' },
        h('div', { className: 'attestation-titre' }, 'ATTESTATION SUR L’HONNEUR'),
        h('div', { className: 'attestation-sous-titre' },
          'Conformément à l’article L. 561-2 et suivants du code monétaire et financier'),
        h('div', { className: 'attestation-bloc' },
          h('div', { className: 'attestation-intitule' }, 'Je soussigné(e),'),
          h('div', { className: 'attestation-paire' },
            h('div', { className: 'attestation-champ' }, 'Nom : ', h('span', null, remplir(qui.nom))),
            h('div', { className: 'attestation-champ' }, 'Prénom : ', h('span', null, remplir(qui.prenom)))
          ),
          h('div', { className: 'attestation-paire' },
            h('div', { className: 'attestation-champ' }, 'Date de naissance : ', h('span', null, null)),
            h('div', { className: 'attestation-champ' }, 'Adresse : ', h('span', null, null))
          )
        ),
        h('div', { className: 'attestation-intitule' }, 'Déclare sur l’honneur :'),
        h('ol', { className: 'attestation-liste' },
          h('li', null, 'ne pas être une personne politiquement exposée au sens des articles L. 561-10 et suivants du code monétaire et financier, c’est-à-dire n’occuper aucune fonction publique importante — chef d’État, ministre, parlementaire, haut fonctionnaire — en France ou dans un autre pays ;'),
          h('li', null, 'ne pas être un membre proche de la famille — conjoint, enfants, parents — ni une personne étroitement associée à une telle personne.')
        ),
        h('p', { className: 'attestation-engagement' },
          'Je m’engage à informer immédiatement le cabinet ', (cabinet.nom || '').toUpperCase(),
          ' de tout changement de ma situation qui me ferait entrer dans cette catégorie.'),
        h('p', { className: 'attestation-mention attestation-pied' },
          'Date de naissance, adresse, « Fait à », « Le » et la signature sont laissés en blanc : '
          + 'le signataire les remplit lui-même.')
      ),
      h('button', {
        type: 'button',
        className: 'btn btn-primary ppe-imprimer',
        disabled: !aSigner.length,
        title: aSigner.length ? undefined : 'Aucune attestation à faire signer.',
        onClick: imprimerAttestations,
      }, '🖨️ Imprimer les attestations'
        + (aSigner.length > 1 ? ` (${aSigner.length})` : ''))
    )
  )
  );
}

/* Une pièce à demander : un bouton qui se coche. */
function BoutonDemande({ libelle, retenu, precision, onClick }) {
  return h('button', {
    type: 'button',
    className: cx('demande-bouton', retenu && 'retenu'),
    'aria-pressed': retenu ? 'true' : 'false',
    onClick,
  },
    h('span', { className: 'demande-bouton-marque' }, retenu ? '✓' : ''),
    h('span', { className: 'demande-bouton-libelle' }, libelle),
    precision ? h('span', { className: 'demande-bouton-precision' }, precision) : null
  );
}

/* Les signataires d'attestation : les bénéficiaires effectifs nommés, le
   prénom séparé du nom au premier espace. */
function signatairesDepuis(beneficiaires) {
  return (beneficiaires || [])
    .filter(b => (b.nom || '').trim())
    .map(b => {
      const cle = b.nom.trim();
      const mots = cle.split(/\s+/).filter(Boolean);
      return {
        cle,
        prenom: mots.length > 1 ? mots[0] : '',
        nom: mots.length > 1 ? mots.slice(1).join(' ') : (mots[0] || ''),
      };
    });
}

/* Un bloc de l'attestation, en HTML d'impression. Les tailles sont celles du
   PDF, en points. */
function blocHtmlAttestation(b) {
  const style = [
    `font-size:${b.taille || 11}pt`,
    b.style === 'gras' ? 'font-weight:bold' : '',
    b.style === 'italique' ? 'font-style:italic' : '',
    b.centre ? 'text-align:center' : '',
    b.retrait ? `margin-left:${b.retrait}pt` : '',
    `margin-bottom:${b.apres || 2}pt`,
    'line-height:1.42',
  ].filter(Boolean).join(';');
  return `<p style="${style}">${echapperHtml(b.texte || '')}</p>`;
}

/* Étape « Cotation du risque » : à gauche ce que l'on sait du client, à droite
   les quatre critères et le niveau qui en découle.

   `identite` et `mission` sont des listes [clé, valeur] : la contractualisation
   y met les honoraires et le volet social, la reprise d'analyse s'en passe. */
function VigilanceEtapeCotation({ v, identite, mission }) {
  const nommes = v.beneficiaires.filter(b => (b.nom || '').trim());
  /* Repris le 18 octobre : l'écran occupe toute la hauteur jusqu'aux
     boutons. À gauche, quatre encadrés qui se lisent séparément — identité,
     mission, bénéficiaires effectifs, registres consultés. À droite, les
     quatre critères, puis les contrôles en deux grandes tuiles. */
  const blocKv = (titre, lignes) => h('div', { className: 'cotation-bloc' },
    h('div', { className: 'cotation-bloc-titre' }, titre),
    lignes.map(([cle, valeur]) => h('div', { className: 'kv-line', key: cle },
      h('span', { className: 'k' }, cle), h('span', { className: 'v' }, valeur))));
  const resultat = code => v.resultatsBases && v.resultatsBases[code];
  const ppe = VIGILANCE_PPE_STATUTS[v.ppeStatut];
  const verifiees = v.basesVerifiees.length;

  return h('div', { className: 'step-scroll step-remplie' },
  h('div', { className: 'grid-2 colonnes-egales cotation-etape' },
    h(FormSection, { icon: '📌', title: 'Ce que nous savons du client', ton: 'violet' },
      h('div', { className: 'cotation-blocs' },
        blocKv('Identité', identite),
        mission && mission.length ? blocKv('Mission', mission) : null,
        h('div', { className: 'cotation-bloc' },
          h('div', { className: 'cotation-bloc-titre' }, 'Bénéficiaires effectifs'),
          nommes.length
            ? h('div', { className: 'recap-personnes' },
              nommes.map((b, i) => h('span', {
                className: cx('recap-personne', b.verifie ? 'verifiee' : 'a-verifier'), key: i,
                title: b.verifie ? 'Identité vérifiée sur pièce' : 'Identité non vérifiée',
              },
                h('span', { className: 'recap-personne-marque' }, b.verifie ? '✓' : '!'),
                h('span', { className: 'recap-personne-nom' }, b.nom.trim()),
                b.part ? h('span', { className: 'recap-personne-part' }, pourcent(b.part)) : null
              )))
            : h('div', { className: 'form-help', style: { marginTop: 0 } }, 'Aucun bénéficiaire effectif saisi.')
        ),
        h('div', { className: 'cotation-bloc cotation-bloc-registres' },
          h('div', { className: 'cotation-bloc-titre' }, 'Registres consultés'),
          h('div', { className: 'cotation-registres' },
            VIGILANCE_BASES.map(base => {
              const r = resultat(base.code);
              return h('div', { className: cx('cotation-registre', r ? (r.issue === 'ok' ? 'ok' : 'alerte') : 'attente'), key: base.code },
                h('span', { className: 'cotation-registre-marque' }, r ? (r.issue === 'ok' ? '✓' : '!') : '·'),
                h('span', { className: 'cotation-registre-nom' }, base.label),
                h('span', { className: 'cotation-registre-etat' },
                  r ? (r.issue === 'ok' ? 'Rien à signaler' : 'Correspondance') : 'Non consulté'));
            })
          )
        )
      )
    ),
    h('div', { className: 'pile-cartes' },
      h(FormSection, { icon: '🎯', title: 'Notez le risque sur quatre critères', ton: 'violet' },
        h('div', { className: 'nplab-grid' },
          NPLAB_CRITERES.map(crit => h('div', { className: cx('nplab-cell', 'niv-' + v.classification[crit.code]), key: crit.code },
            h('div', { className: 'nplab-label' }, crit.label),
            h('div', { className: 'nplab-choices' },
              ['Faible', 'Moyen', 'Élevé'].map(n => h('button', {
                key: n,
                className: cx('nplab-choice', v.classification[crit.code] === n && 'active', 'niv-' + n),
                onClick: () => v.setClassification(prev => Object.assign({}, prev, { [crit.code]: n })),
              }, n))
            )
          ))
        )
      ),

      /* Les contrôles effectués, en deux grandes tuiles. Le niveau qui
         découle de la notation n'est pas ici : il est décidé à l'écran
         suivant, et le donner d'avance ferait croire la décision prise. */
      h(FormSection, { icon: '🔍', title: 'Contrôles effectués', ton: 'violet' },
        h('div', { className: 'cotation-tuiles' },
          h('div', { className: cx('cotation-tuile', ppe.couleur) },
            h('span', { className: 'cotation-tuile-cle' }, 'Personne politiquement exposée'),
            h('span', { className: 'cotation-tuile-valeur' }, ppe.label)),
          h('div', { className: cx('cotation-tuile', verifiees === VIGILANCE_BASES.length ? 'vert' : 'orange') },
            h('span', { className: 'cotation-tuile-cle' }, 'Vérifications en base'),
            h('span', { className: 'cotation-tuile-valeur' }, `${verifiees} sur ${VIGILANCE_BASES.length}`),
            h('span', { className: 'cotation-tuile-aide' },
              verifiees === VIGILANCE_BASES.length ? 'Toutes consignées' : 'Consignez-les à l’étape « Qui est derrière »'))
        )
      )
    )
  )
  );
}

/* Étape « Niveau de vigilance » : à gauche la proposition du logiciel, à droite
   la décision du cabinet. La lecture va de la gauche vers la droite, dans
   l'ordre où l'on décide. */
/* Étape « Secteur et exposition ».

   Ajoutée le 25 septembre, après comparaison avec la cartographie que le
   cabinet a remise. Le logiciel cotait le risque sans conserver le fait qui
   le fonde : « localisation : élevé » sans savoir de quel pays, « activité :
   moyen » sans le secteur. Une cotation sans son fait ne se justifie pas
   devant un contrôleur, et surtout elle ne permet pas d'écrire les sections 2
   et 3 du document — l'exposition géographique et la répartition par secteur.

   Quatre réponses, donc, et elles servent toutes au document :

     — la division NAF alimente le tableau de répartition ;
     — le pays du siège et celui des bénéficiaires effectifs alimentent le
       tableau d'exposition géographique ;
     — la case « pays tiers à haut risque » distingue les dossiers qui
       relèvent de plein droit de l'article L. 561-10-1 de ceux que le cabinet
       classe après appréciation.

   La case ne se coche pas toute seule : la liste des pays tiers à haut risque
   évolue par règlement délégué, et ComplyEC ne l'interroge pas. L'écran donne
   le lien, l'expert-comptable constate, ComplyEC enregistre. */
function VigilanceEtapeExposition({ v }) {
  const sensible = NAF_DIVISIONS_SENSIBLES[v.secteurNaf];
  const etranger = v.paysSiege && v.paysSiege !== 'France';
  const etrangerBe = v.paysBeneficiaires && v.paysBeneficiaires !== 'France';

  return h('div', { className: 'step-scroll' },
  h('div', { className: 'grid-2 colonnes-egales' },
    h(FormSection, { icon: '🏭', title: 'Le secteur d’activité', ton: 'violet',
      subtitle: 'Section 3 de la cartographie' },
      h('p', { className: 'form-help', style: { marginTop: 0 } },
        'La division retenue alimente la répartition par secteur du portefeuille. '
        + 'C’est elle qui fait apparaître les concentrations.'),
      h(ListePanneau, {
        label: 'Division d’activité (NAF)', libre: true,
        options: NAF_DIVISIONS,
        valeur: v.secteurNaf, onChange: v.setSecteurNaf,
        placeholder: 'Code NAF exact, par exemple 47.11D',
      }),
      sensible
        ? h('div', { className: 'expo-signal' },
          h('span', { className: 'expo-signal-marque' }, '!'),
          h('div', null,
            h('strong', null, 'Secteur cité par les typologies TRACFIN.'),
            h('p', null, sensible,
              ' Ce n’est pas un classement automatique : la règle de combinaison '
              + 'du cabinet demande un critère coté élevé, ou deux cotés moyens.')
          ))
        : null
    ),

    h(FormSection, { icon: '🌍', title: 'L’exposition géographique', ton: 'violet',
      subtitle: 'Section 2 de la cartographie' },
      h('div', { className: 'expo-paires' },
        h(ListePanneau, {
          label: 'Pays du siège ou du domicile', libre: true,
          options: PAYS_COURANTS.map(p => ({ code: p, label: p })),
          valeur: v.paysSiege, onChange: v.setPaysSiege,
        }),
        h(ListePanneau, {
          label: 'Pays de résidence des bénéficiaires effectifs', libre: true,
          options: PAYS_COURANTS.map(p => ({ code: p, label: p })),
          valeur: v.paysBeneficiaires, onChange: v.setPaysBeneficiaires,
        })
      ),

      (etranger || etrangerBe)
        ? h(React.Fragment, null,
          h(ChampPanneau, {
            label: 'Nature de l’exposition', lignes: 2,
            valeur: v.natureExposition, onChange: v.setNatureExposition,
            placeholder: 'Siège social, partenaires commerciaux, flux financiers, clientèle non résidente…',
            aide: 'Repris tel quel dans le tableau d’exposition géographique.',
          }),
          h('div', { className: 'expo-listee' },
            h(BasculePanneau, {
              label: 'Ce pays figure sur la liste des pays tiers à haut risque',
              aide: 'Règlement délégué (UE) 2016/1675. La vigilance renforcée est alors '
                + 'de plein droit au titre de l’article L. 561-10-1, sans appréciation du cabinet.',
              valeur: !!v.paysListe, onChange: v.setPaysListe,
            }),
            h('a', {
              className: 'btn btn-secondary btn-sm', target: '_blank', rel: 'noopener noreferrer',
              href: 'https://finance.ec.europa.eu/financial-crime/high-risk-third-countries_fr',
            }, 'Ouvrir la liste en vigueur', h('span', { className: 'lien-externe' }, '↗'))
          )
        )
        : h('p', { className: 'form-help' },
          'Aucune dimension internationale déclarée : le dossier ne figurera pas '
          + 'au tableau d’exposition géographique.')
    )
  )
  );
}

function VigilanceEtapeNiveau({ v, contexteSynthese, showToast }) {
  /* Les deux rectangles descendent jusqu'au bas de l'étape et s'y alignent.
     Ils s'arrêtaient à la hauteur de leur contenu, laissant un tiers d'écran
     vide sous eux, alors que ce sont précisément les deux textes qu'on relit
     le plus longtemps : la synthèse proposée à gauche, la justification
     retenue à droite. La place gagnée leur revient. */
  return h('div', { className: 'step-scroll step-sans-defilement' },
  h('div', { className: 'grid-2 colonnes-egales etape-pleine-hauteur' },
    h('div', { className: 'pile-cartes' },
    h(FormSection, { icon: '🤖', title: 'Ce que le logiciel propose', ton: 'violet' },
      /* Le niveau, et rien autour : ni bandeau dégradé, ni phrase d'explication.
         Le titre de la carte dit déjà d'où il vient. */
      h('div', { className: cx('niveau-carte', 'niveau-carte-nu', 'niv-' + v.niveauPropose) },
        h('div', { className: 'niveau-carte-valeur' }, 'Vigilance ', v.niveauPropose.toLowerCase())
      )
    ),
    /* La synthèse est un second objet : le logiciel propose un niveau, puis il
       propose un texte. Les empiler dans une seule carte faisait lire les deux
       comme une seule chose. */
    h(FormSection, { icon: '📝', title: 'Synthèse de l’analyse', ton: 'violet',
      style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },
      h('div', { className: 'synthese-cadre' },
        v.synthese
          ? h('p', { className: 'synthese-texte' }, v.synthese)
          : h('p', { className: 'synthese-vide' }, 'Cliquez sur « Rédiger la synthèse » : le logiciel reprend en un paragraphe l’activité, les bénéficiaires effectifs, le statut PPE, l’origine des fonds, votre cotation et les vérifications effectuées. Texte rédigé à partir de vos seules saisies, sans appel à un service extérieur.')
      ),
      h('div', { className: 'doc-actions' },
        h('button', {
          className: 'btn btn-accent',
          onClick: () => v.redigerSynthese(contexteSynthese),
        }, v.synthese ? '↻ Refaire la synthèse' : '✨ Rédiger la synthèse'),
        v.synthese ? h('button', {
          className: 'btn btn-primary',
          onClick: () => { v.setNiveauRetenu(v.niveauPropose); v.setJustification(v.synthese); showToast('Synthèse et niveau repris à droite.'); },
        }, '→ Je suis d’accord : reprendre à droite') : null
      )
    )
    ),
    h(FormSection, { icon: '🛡️', title: 'Ce que le cabinet retient', ton: 'violet',
      style: { display: 'flex', flexDirection: 'column', minHeight: 0 } },
      // Les trois niveaux l'un sous l'autre : ils forment une échelle, et
      // chacun garde la même largeur.
      h('div', { className: 'niveau-choix' },
        [['Allégée', 'Sur décision motivée du référent LBC-FT'],
         ['Normale', 'Vigilance de droit commun'],
         ['Renforcée', 'Surveillance accrue et pièces complémentaires']].map(([n, aide]) => h('button', {
          key: n,
          className: cx('niveau-option', 'niv-' + n, v.niveauRetenu === n && 'active'),
          onClick: () => v.setNiveauRetenu(n),
        },
          h('span', { className: 'niveau-puce', 'aria-hidden': 'true' }, v.niveauRetenu === n ? '●' : ''),
          h('span', { className: 'niveau-option-texte' },
            h('span', { className: 'niveau-option-nom' }, n),
            h('span', { className: 'niveau-option-aide' }, aide)
          ),
          n === v.niveauPropose ? h('span', { className: 'niveau-tag' }, 'suggéré') : null
        ))
      ),
      v.niveauRetenu !== v.niveauPropose
        ? h('div', { className: 'info-box info-box-alerte', style: { marginTop: 12 } }, '⚠️ ',
          `Vous retenez « ${v.niveauRetenu} » alors que le calcul propose « ${v.niveauPropose} » : la justification devient obligatoire.`)
        : null,
      /* Le libellé était en gras, collé aux trois niveaux au-dessus, et sa
         phrase d'explication se faisait couper par le bas de la carte. Il a
         maintenant sa respiration, et l'explication passe au-dessus du champ,
         où elle sert avant la saisie plutôt qu'après. */
      h('div', { className: 'justification-bloc' },
        h('label', { className: 'justification-label', htmlFor: 'justification-vigilance' },
          'Justification retenue'),
        h('p', { className: 'justification-aide' },
          'Ce texte sera repris tel quel dans la fiche de vigilance du dossier.'),
        h('textarea', {
          id: 'justification-vigilance',
          className: 'form-textarea', rows: 4,
          placeholder: 'Motivez le niveau retenu.',
          value: v.justification, onChange: e => v.setJustification(e.target.value),
        })
      )
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

/* `actions` place un bouton dans le bandeau du rectangle plutôt qu'à son pied.
   Ce n'est pas une préférence de style : au pied, il prenait quatre-vingts
   pixels de hauteur au contenu, et c'est ce contenu qui était coupé. */
function FormSection({ icon, title, children, style, ton = 'bleu', subtitle, actions }) {
  return h('div', { className: cx('form-section', 'sec-' + ton), style },
    h('div', { className: 'form-section-title' },
      icon ? h('span', { className: 'form-section-icon' }, icon) : null,
      h('span', { className: 'card-title-ink' }, title),
      subtitle ? h('span', { className: 'form-section-compte' }, subtitle) : null,
      actions ? h('span', { className: 'form-section-actions' }, actions) : null
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

/* L'ordre du parcours. « Documents » est passé en avant-dernier : l'e-mail
   qu'il envoie joint l'attestation PPE, qui se prépare deux écrans plus haut.
   Demander une pièce avant de l'avoir produite obligeait à écrire deux fois au
   client. */
/* Deux intitulés raccourcis le 23 septembre : « Mentions de la lettre » et
   « Niveau de vigilance ». Les onze étapes réclamaient 1141 px de large pour
   1013 disponibles à 1366 × 768, mesurés, et « Validation » sortait du cadre.
   Raccourcir deux repères de navigation coûte moins que rogner le onzième. */
const CONTRACT_STEPS = ['Société', 'Dossier Drive', 'Contractant', 'Modèle de LDM', 'Mentions', 'Qui est derrière', 'Attestation PPE', 'Cotation du risque', 'Vigilance', 'Documents', 'Validation'];

/* Dépôt des documents juridiques à l'ouverture du dossier.

   Un seul bouton, qui interroge vraiment le registre national des entreprises
   au SIREN du client, par la fonction serveur `inpi-actes` : les identifiants
   du cabinet ne traversent jamais le navigateur (voir db.js). Ce qui revient
   est rangé d'après le nom du document, catégorie et exercice, et tout reste
   corrigeable ligne par ligne.

   L'écran ne porte plus d'avertissement permanent sur ce qui est branché ou
   non. Ce qui manque se dit au moment où ça manque : si la fonction n'est pas
   déployée, le clic échoue et affiche ce qu'a répondu le serveur. Une phrase
   fixe en bas d'écran n'apprenait rien à celui qui n'avait pas encore cliqué,
   et elle vieillissait mal.

   Le dépôt manuel reste possible : un cabinet peut avoir un acte que le
   registre n'a pas, ou vouloir ajouter une pièce à la main. */
function DocumentsJuridiques({ depots, setDepots, showToast, siret }) {
  const annee = ANNEE_COURANTE;
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  /* La catégorie de repli quand le nom du fichier ne dit rien : le juridique
     de l'exercice, jamais le dossier permanent. Un acte mal rangé au permanent
     est un acte qu'on ne retrouvera pas. */
  const categorie = 'statutaire';
  const champFichier = useRef(null);

  /* Déposer plusieurs actes d'un coup.

     Chaque fichier est rangé d'après son nom : l'INPI nomme ses actes de façon
     lisible, et « PV AG 2024.pdf » se classe tout seul au juridique de 2024.
     Ce qui n'est pas reconnu tombe dans la catégorie de repli, et tout reste
     modifiable ligne par ligne. */
  function deposer(e) {
    const fichiers = Array.from(e.target.files || []);
    if (!fichiers.length) return;
    let reconnus = 0;
    const ajouts = fichiers.map(f => {
      const devinee = devinerCategorieJuridique(f.name);
      const cible = devinee || categorie;
      const c = DOCUMENTS_JURIDIQUES_CATEGORIES.find(x => x.code === cible);
      const anneeLue = (c && c.parAnnee && devinerAnneeJuridique(f.name)) || annee;
      if (devinee) reconnus++;
      return {
        nom: f.name,
        categorie: cible,
        reconnue: !!devinee,
        annee: c && c.parAnnee ? anneeLue : null,
        destination: destinationJuridique(cible, anneeLue),
      };
    });
    setDepots(l => l.concat(ajouts));
    const reste = ajouts.length - reconnus;
    showToast(capaciteReelle('drive')
      ? `${ajouts.length} ${pluriel(ajouts.length, 'document classé', 'documents classés')} dans le Drive`
        + (reste ? ` — ${reste} à vérifier, le nom n’a pas suffi.` : '.')
      : `${ajouts.length} ${pluriel(ajouts.length, 'document retenu', 'documents retenus')}`
        + (reconnus ? `, dont ${reconnus} reconnu${reconnus > 1 ? 's' : ''} au nom du fichier` : '')
        + '. ComplyEC n’est pas raccordé au Drive : rien n’y a encore été déposé.');
    if (champFichier.current) champFichier.current.value = '';
  }

  /* Le bouton unique : interroger le registre au SIREN du client, et ranger
     tout ce qui revient.

     Deux appels par pièce sont évités : la liste suffit à afficher ce qui
     existe, et chaque document n'est téléchargé qu'une fois. Le contenu est
     gardé en mémoire de page — il partira dans le Drive quand le connecteur
     sera posé, et il se télécharge d'ici là d'un clic sur la ligne. */
  /* Le registre publie tous les actes déposés. Seuls les statuts sont
     retenus ici : c'est la pièce que l'entrée en relation exige, et vingt
     procès-verbaux téléchargés d'un coup noieraient la liste. */
  async function recupererStatuts() {
    setErreur(null);
    setEnCours(true);
    try {
      const pieces = await inpiListerPieces(siret);
      const actes = (pieces.actes || []).filter(a => !a.confidentiel)
        .filter(a => /^statuts-/.test(devinerCategorieJuridique(a.nom) || ''));
      if (!actes.length) {
        setErreur('Le registre national des entreprises ne publie pas de statuts pour ce numéro. '
          + 'Ajoutez-les depuis votre poste.');
        return;
      }

      const ajouts = [];
      for (const acte of actes) {
        const devinee = devinerCategorieJuridique(acte.nom);
        const cible = devinee || categorie;
        const c = DOCUMENTS_JURIDIQUES_CATEGORIES.find(x => x.code === cible);
        const anneeLue = (c && c.parAnnee
          && (devinerAnneeJuridique(acte.nom) || (acte.dateDepot || '').slice(0, 4))) || annee;
        let contenu = null;
        try {
          contenu = await inpiTelechargerPiece(acte.genre, acte.id);
        } catch (err) {
          /* Une pièce refusée n'annule pas les autres : on la garde dans la
             liste, sans contenu, et on le dit sur sa ligne. */
          contenu = null;
        }
        ajouts.push({
          nom: acte.nom || `Acte du ${formatDate(acte.dateDepot)}`,
          categorie: cible,
          reconnue: !!devinee,
          annee: c && c.parAnnee ? String(anneeLue) : null,
          destination: destinationJuridique(cible, anneeLue),
          source: 'inpi',
          contenu,
          indisponible: !contenu,
        });
      }

      setDepots(l => l.concat(ajouts));
      const manquants = ajouts.filter(a => a.indisponible).length;
      showToast(`${ajouts.length} ${pluriel(ajouts.length, 'version des statuts récupérée', 'versions des statuts récupérées')} au registre`
        + (manquants ? `, dont ${manquants} que l’INPI n’a pas délivré.` : '.'));
    } catch (err) {
      setErreur(messageRegistre(err));
    } finally {
      setEnCours(false);
    }
  }

  /* « Failed to send a request to the Edge Function » ne dit rien à
     personne. Ce message-là vient du client Supabase quand la fonction
     serveur n'existe pas ou ne répond pas : c'est le cas tant que
     « inpi-actes » n'est pas déployée (docs/RACCORDEMENTS.md). L'écran le dit
     en français, avec ce qu'on peut faire en attendant. */
  function messageRegistre(err) {
    const brut = err && err.message ? err.message : '';
    if (/Edge Function|Failed to fetch|NetworkError|Load failed/i.test(brut)) {
      return 'La récupération automatique au registre n’est pas encore branchée : '
        + 'la fonction serveur qui interroge l’INPI n’est pas installée sur le serveur du cabinet. '
        + 'En attendant, ouvrez le registre avec le bouton de droite et ajoutez les statuts depuis votre poste.';
    }
    return brut || 'La récupération a échoué.';
  }

  /* L'extrait d'immatriculation se télécharge gratuitement sur le site de
     l'INPI. ComplyEC ouvre le site et met le SIREN dans le presse-papiers :
     il reste à le coller dans la recherche, puis à déposer le PDF obtenu. */
  function ouvrirRegistre() {
    const siren = String(siret || '').replace(/\D/g, '').slice(0, 9);
    try { if (navigator.clipboard && siren) navigator.clipboard.writeText(siren); } catch (e) { /* refusé */ }
    window.open('https://data.inpi.fr/', '_blank', 'noopener');
    showToast(siren
      ? `Registre ouvert dans un nouvel onglet — SIREN ${siren} copié, collez-le dans la recherche.`
      : 'Registre ouvert dans un nouvel onglet.');
  }

  /* Changer la catégorie d'un dépôt recalcule sa destination. */
  function reclasser(i, code) {
    setDepots(l => l.map((d, j) => {
      if (j !== i) return d;
      const c = DOCUMENTS_JURIDIQUES_CATEGORIES.find(x => x.code === code);
      const a = c && c.parAnnee ? (d.annee || annee) : null;
      return Object.assign({}, d, { categorie: code, annee: a, destination: destinationJuridique(code, a) });
    }));
  }

  const classe = capaciteReelle('drive');

  return h(FormSection, { icon: '📁', title: 'Documents juridiques', ton: 'bleu',
    subtitle: depots.length
      ? `${depots.length} ${pluriel(depots.length, 'pièce', 'pièces')}`
      : null },

    /* Deux boutons, deux pièces : les statuts à gauche, l'extrait du
       registre à droite. Le dépôt depuis le poste reste en dessous, pour
       ranger le PDF de l'extrait ou un acte que le registre ne publie pas. */
    h('div', { className: 'juri-recuperation juri-deux-boutons' },
      h('button', {
        type: 'button',
        className: 'btn btn-lg juri-bouton juri-bouton-registre',
        disabled: enCours,
        onClick: recupererStatuts,
      }, enCours ? 'Récupération en cours…' : 'Récupérer les statuts'),
      h('button', {
        type: 'button',
        className: 'btn btn-lg juri-bouton juri-bouton-rne',
        title: 'Extrait d’immatriculation au registre national des entreprises, sur le site de l’INPI',
        onClick: ouvrirRegistre,
      }, 'Extrait du RNE ↗')
    ),
    h('button', {
      type: 'button', className: 'juri-depot-poste',
      onClick: () => champFichier.current && champFichier.current.click(),
    }, '+ Ajouter un document depuis mon poste'),
    h('input', {
      ref: champFichier, type: 'file', multiple: true,
      style: { display: 'none' }, onChange: deposer,
      'aria-hidden': 'true', tabIndex: -1,
    }),

    erreur ? h('div', { className: 'info-box info-box-alerte juri-erreur' }, erreur) : null,

    /* Le résultat : une ligne par pièce, sa coche, et où elle est allée.

       La coche est verte quand la pièce est arrivée à destination, et le Drive
       n'étant pas encore raccordé, ce n'est pas le cas : elle reste grise, et
       la ligne dit où la pièce ira. Écrire « classé dans le Drive » avant que
       le connecteur existe serait afficher à jour ce qui ne l'est pas. */
    depots.length
      ? h('div', { className: 'juri-resultat' },
        depots.map((d, i) => h('div', { className: 'juri-piece', key: i },
          h('span', { className: cx('juri-coche', classe && !d.indisponible && 'faite') },
            d.indisponible ? '!' : '✓'),
          h('div', { className: 'juri-piece-texte' },
            h('div', { className: 'juri-piece-nom' },
              d.nom,
              d.reconnue ? null : h('span', { className: 'juri-a-verifier' }, 'à vérifier')
            ),
            h('div', { className: 'juri-piece-chemin' },
              d.indisponible
                ? 'Pièce non délivrée par le registre.'
                : (classe ? 'Classée dans ' : 'À classer dans ') + d.destination)
          ),
          h('select', {
            className: 'juri-categorie',
            value: d.categorie,
            onChange: e => reclasser(i, e.target.value),
            'aria-label': `Catégorie de ${d.nom}`,
          }, DOCUMENTS_JURIDIQUES_CATEGORIES.map(c =>
            h('option', { key: c.code, value: c.code }, c.label))),
          h('button', {
            type: 'button', className: 'lien-discret',
            'aria-label': `Retirer ${d.nom}`,
            onClick: () => setDepots(l => l.filter((_, j) => j !== i)),
          }, '✕')
        )),
        /* Une ligne de conclusion, et elle dit ce qui s'est réellement passé. */
        h('p', { className: 'juri-bilan' },
          classe
            ? `${depots.length} ${pluriel(depots.length, 'pièce classée', 'pièces classées')} dans le Drive du cabinet.`
            : `${depots.length} ${pluriel(depots.length, 'pièce récupérée', 'pièces récupérées')}. `
              + 'Le connecteur Drive n’est pas encore posé : ComplyEC retient leur destination, il ne les y dépose pas.')
      )
      : null
  );
}

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
  /* Les forfaits de paramétrage des données — 150 € HT pour la comptabilité,
     200 € HT pour le social dans les modèles du cabinet — peuvent être
     offerts. La case cochée réécrit la phrase de la lettre. */
  const [remiseCompta, setRemiseCompta] = useState(false);
  const [remiseSocial, setRemiseSocial] = useState(false);
  const [remiseFrais, setRemiseFrais] = useState(true);
  const [situationComptable, setSituationComptable] = useState(true);
  const [situationComptableType, setSituationComptableType] = useState('Offerte');
  const [situationComptableMontant, setSituationComptableMontant] = useState('150');
  const [remiseFraisSociale, setRemiseFraisSociale] = useState(true);
  const [dateCloture, setDateCloture] = useState(SCENARIO_NOUVEAU_CLIENT.dateCloture);
  const [signataire, setSignataire] = useState('Julien Lesnes');
  const [nbSalaries, setNbSalaries] = useState('3');
  /* Le nombre exact de bulletins n'est pas toujours connu à l'ouverture du
     dossier. Le cocher fait du chiffre saisi une estimation : il sert au
     calcul des honoraires, et la lettre dit « environ ». */
  const [bulletinsEstimes, setBulletinsEstimes] = useState(false);
  // Tarif du cabinet par bulletin de paie.
  const [montantBulletin, setMontantBulletin] = useState(String(LDM_MONTANT_BULLETIN_DEFAUT));
  const isParticulierIRPP = nature === 'Particulier IRPP';
  const isSociete = nature === 'Société';
  const isAssociation = nature === 'Association';
  const salariesEffective = isParticulierIRPP ? false : salaries;

  /* Les trois pièces habituelles sont cochées d'emblée ; les quatre
     complémentaires attendent qu'on les choisisse. */
  /* Une pièce de plus, libre : ce que la liste ne prévoit pas. */
  const [autrePiece, setAutrePiece] = useState('');
  const [docsDemandes, setDocsDemandes] = useState(() => Object.fromEntries(
    DOCUMENTS_A_DEMANDER_CLIENT.map(d => [d, true])
      .concat(DOCUMENTS_A_DEMANDER_OPTIONNELS.map(d => [d, false]))));
  const [statuts, setStatuts] = useState(false);
  const [beneficiaires, setBeneficiaires] = useState(false);
  // Documents juridiques déposés à l'ouverture, et où chacun ira dans le Drive.
  const [docsJuridiques, setDocsJuridiques] = useState([]);

  /* L'analyse de vigilance est exactement celle de l'écran « Reprendre une
     analyse » : même état, mêmes écrans, définis une seule fois plus haut. */
  const vig = useEtatVigilance();


  /* Les attestations PPE : une par bénéficiaire effectif qui n'a pas été
     déclaré exposé. La date de naissance et l'adresse sont laissées au
     client, qui les porte lui-même en signant ; plus rien n'empêche donc
     qu'elles partent avec la demande de documents. */
  const signatairesPpe = signatairesDepuis(vig.beneficiaires);
  const ppeJointes = docsDemandes[DOCUMENT_ATTESTATION_PPE]
    ? signatairesPpe.filter(g => ((vig.ppeReponses || {})[g.cle] || {}).statut !== 'oui')
    : [];

  /* Le courrier au client. Il annonce ce qui part avec lui : les pièces que le
     client doit fournir, et les attestations que le cabinet lui adresse
     préremplies. Le paragraphe des attestations n'apparaît que s'il y en a —
     un courrier qui annonce une pièce jointe absente fait perdre un
     aller-retour. */
  const demandes = DOCUMENTS_A_DEMANDER_CLIENT.concat(DOCUMENTS_A_DEMANDER_OPTIONNELS)
    .filter(d => docsDemandes[d] && d !== DOCUMENT_ATTESTATION_PPE)
    .concat(autrePiece.trim() ? [autrePiece.trim()] : []);
  const blocsCourrier = [
    `Bonjour ${SCENARIO_NOUVEAU_CLIENT.dirigeantCivilite} ${SCENARIO_NOUVEAU_CLIENT.dirigeantNom},`,
    'Nous vous confirmons l’ouverture de votre dossier auprès de notre cabinet.',
  ];
  if (demandes.length) {
    blocsCourrier.push(
      'Afin de le finaliser dans les meilleurs délais, pourriez-vous nous transmettre les pièces suivantes :'
      + demandes.map(d => `\n  • ${d}`).join(''));
  }
  if (ppeJointes.length) {
    const seule = ppeJointes.length === 1;
    blocsCourrier.push(
      (seule
        ? 'Vous trouverez également en pièce jointe une attestation sur l’honneur relative aux personnes politiquement exposées, que nous avons préremplie à votre nom.'
        : `Vous trouverez également en pièce jointe ${ppeJointes.length} attestations sur l’honneur relatives aux personnes politiquement exposées, que nous avons préremplies aux noms suivants :`
          + ppeJointes.map(g => `\n  • ${g.cle}`).join(''))
      + (seule
        ? ' Il vous suffit de la dater, d’y porter la mention « lu et approuvé », de la signer et de nous la retourner.'
        : '\n\nChacune doit être datée, revêtue de la mention « lu et approuvé », signée par la personne qu’elle nomme, puis nous être retournée.'));
  }
  blocsCourrier.push(
    'N’hésitez pas à revenir vers nous pour toute question.',
    'Bien cordialement,',
    `${EXPERT_COMPTABLE.nom}\n${EXPERT_COMPTABLE.role}`);
  const courrierDemandeDocuments = blocsCourrier.join('\n\n');
  const DEMANDE_DESTINATAIRE = 'contact@sarl-dupont.fr';
  const DEMANDE_OBJET = 'Documents à nous transmettre pour l’ouverture de votre dossier';

  async function ouvrirDemandeDocuments() {
    const cabinet = cabinetSettings || CABINET_SETTINGS_DEFAUT;
    for (const g of ppeJointes) {
      const f = fichierAttestationPpe(g, cabinet);
      await remettreFichier(f.nom, f.contenu);
    }
    window.location.href = `mailto:${encodeURIComponent(DEMANDE_DESTINATAIRE)}`
      + `?subject=${encodeURIComponent(DEMANDE_OBJET)}`
      + `&body=${encodeURIComponent(courrierDemandeDocuments)}`;
    showToast(ppeJointes.length
      ? `Messagerie ouverte. ${ppeJointes.length} ${pluriel(ppeJointes.length, 'attestation PPE téléchargée', 'attestations PPE téléchargées')} : joignez-${ppeJointes.length > 1 ? 'les' : 'la'} avant d’envoyer.`
      : 'Messagerie ouverte : relisez le message et envoyez-le.');
  }
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
      vig.setClassification(suggestion.classification);
      vig.setJustification(suggestion.justification);
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
    /* Nombre inconnu : la lettre ne l'invente pas, elle dit que des
       embauches sont prévues (la phrase est tournée en conséquence plus
       bas, à la génération). */
    salaries: salariesEffective
      ? (bulletinsEstimes ? 'des salariés' : `${nbSalaries} ${pluriel(nbSalaries, 'salarié')}`)
      : 'aucun salarié',
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
    /* Le fichier autonome porte les modèles en lui-même : ouvert depuis le
       disque, il ne peut pas lire le dossier voisin. */
    const embarque = window.MODELES_EMBARQUES && window.MODELES_EMBARQUES[chemin];
    if (embarque) {
      const octets = Uint8Array.from(atob(embarque), c => c.charCodeAt(0));
      return new File([octets], chemin.split('/').pop(), {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    }
    let reponse;
    try {
      reponse = await fetch('modeles/' + chemin.split('/').map(encodeURIComponent).join('/'));
    } catch (e) {
      throw new Error('Le modèle n’a pas pu être lu depuis cette page.');
    }
    if (!reponse.ok) throw new Error('Modèle introuvable (' + reponse.status + ').');
    const blob = await reponse.blob();
    return new File([blob], chemin.split('/').pop(), { type: blob.type });
  }

  /* Les phrases que la lettre réécrit, selon ce qui a été coché. */
  function reecrituresLettre() {
    const r = { textes: [], paragraphes: [] };
    if (salariesEffective && bulletinsEstimes) r.textes.push(['Vous employez ', 'Vous prévoyez d’embaucher ']);
    const remise = montant => ({
      cherche: new RegExp(`forfait de paramétrage des données pour un montant de ${montant}\\s*€`),
      texte: `Un forfait de paramétrage des données, normalement facturé ${montant} € HT au début de la mission, est entièrement remisé. `,
    });
    if (remiseCompta) r.paragraphes.push(remise(150));
    if (remiseSocial && salariesEffective) r.paragraphes.push(remise(200));
    return r;
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
      const bilan = await docxGenererLettre(fichier, valeurs, nom, reecrituresLettre());
      setGeneration({ ...bilan, fichier: nom });
      showToast(bilan.manquants && bilan.manquants.length
        ? `Lettre téléchargée : ${bilan.remplis} champ(s) remplis, ${bilan.manquants.length} à compléter dans Word.`
        : `Lettre téléchargée : ${nom} — les ${bilan.remplis} champs sont remplis.`);
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
      h('div', null, h('h1', null, "Création d'un nouveau dossier client"))
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
            )
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
            h('input', { className: 'form-input', value: adresseSiege, onChange: e => setAdresseSiege(e.target.value) })
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
            )
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
              h('label', { className: 'form-label' }, bulletinsEstimes ? 'Bulletins par mois (estimation)' : 'Bulletins par mois'),
              h('input', { className: 'form-input', type: 'number', min: 0, value: nbSalaries, onChange: e => setNbSalaries(e.target.value) }),
              h('button', {
                type: 'button',
                className: cx('bouton-estimation', bulletinsEstimes && 'actif'),
                'aria-pressed': bulletinsEstimes ? 'true' : 'false',
                onClick: () => setBulletinsEstimes(e => !e),
              }, bulletinsEstimes ? '✓ Nombre estimé' : 'Je ne connais pas le nombre exact')
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
                )
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
          )
        )
      )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 4 && h('div', { className: 'step-body' },
      /* Comme à l'étape 3 : la zone de saisie défile dans son cadre. Sans cela
         le pied d'étape partait 69 px sous la ligne de flottaison à
         1366 × 768 et le bouton « Continuer » devenait invisible. */
      h('div', { className: 'step-scroll' },
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
          /* Repris le 19 octobre : les montants se resserrent à gauche, et
             à droite, sous « Appliquer une remise », une case par forfait de
             paramétrage. Cochée, elle réécrit la phrase de la lettre : le
             forfait y figure à son prix, entièrement remisé. */
          h(FormSection, { icon: '💶', title: 'Honoraires', ton: 'vert' },
            h('div', { className: 'honoraires-grille' },

              h('div', { className: 'form-group honoraires-montant' },
                h('label', { className: 'form-label' }, montants.annuelSeul ? 'Honoraires annuels HT' : 'Honoraires comptables mensuels HT'),
                h('div', { className: 'input-with-btn' },
                  h('input', { className: 'form-input', value: honoraires, onChange: e => setHonoraires(e.target.value) }),
                  h('span', { style: { alignSelf: 'center', color: 'var(--text-muted)' } }, '€')
                )
              ),
              h('label', { className: cx('honoraires-remise', remiseCompta && 'cochee') },
                h('input', { type: 'checkbox', checked: remiseCompta, onChange: () => setRemiseCompta(v => !v) }),
                h('span', null, 'Forfait de paramétrage comptable', h('small', null, '150 € HT, entièrement remisé'))
              ),

              !montants.annuelSeul && salariesEffective ? h(React.Fragment, null,
                h('div', { className: 'form-group honoraires-montant' },
                  h('label', { className: 'form-label' }, 'Honoraires sociaux mensuels HT'),
                  h('div', { className: 'ldm-calcule' }, euros(montants.socialMensuelHT))
                ),
                h('label', { className: cx('honoraires-remise', remiseSocial && 'cochee') },
                  h('input', { type: 'checkbox', checked: remiseSocial, onChange: () => setRemiseSocial(v => !v) }),
                  h('span', null, 'Forfait de paramétrage social', h('small', null, '200 € HT, entièrement remisé'))
                )
              ) : null
            ),
            !montants.annuelSeul && salariesEffective
              ? h('div', { className: 'form-help' },
                `${bulletinsEstimes ? 'Estimation : ' : ''}${nbSalaries} ${pluriel(nbSalaries, 'bulletin')} × ${montantBulletin} € — modifiable à l’étape Contractant.`)
              : h('div', { className: 'form-help', style: { marginBottom: 0 } },
                'Pas de volet social : le modèle retenu sera une lettre sans paie.')
          ),
          h(FormSection, { icon: '🧮', title: 'Totaux calculés', ton: 'vert' },
            !montants.annuelSeul ? h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Total mensuel HT'), h('span', { className: 'v' }, euros(montants.totalMensuelHT))) : null,
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, 'Total annuel HT'), h('span', { className: 'v' }, euros(montants.totalAnnuelHT))),
            h('div', { className: 'kv-line' }, h('span', { className: 'k' }, `TVA ${Math.round(LDM_TAUX_TVA * 100)} %`), h('span', { className: 'v' }, euros(montants.tvaAnnuelle))),
            h('div', { className: 'ldm-total' }, h('span', null, 'Total annuel TTC'), h('strong', null, euros(montants.totalAnnuelTTC)))
          )
        )
      )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', disabled: !modeleLdm, onClick: next }, 'Continuer →')
      )
    ),

    step === 5 && h('div', { className: 'step-body' },
      /* Repris le 19 octobre. Les deux bandeaux du haut — modèle retenu,
         lettre téléchargée — sont retirés : le modèle se lit à l'étape
         précédente, et la génération se confirme par un message. Seul un
         problème reste affiché ici, là où l'on peut le corriger.

         Les cinq mentions se rangent sur une grille nommée : l'activité et
         l'exercice sur la première ligne, les deux modes de paiement sur la
         seconde. La grille ne dépend plus du rang des champs, ce qui faisait
         apparaître une case de date orpheline sur certains écrans. */
      h('div', { className: 'step-scroll step-mentions' },
        generation && !generation.enCours && (generation.erreur || (generation.manquants || []).length)
          ? h('div', { className: 'info-box info-box-alerte' },
            generation.erreur
              ? h('span', null, '⚠️ ', generation.erreur)
              : h('span', null, '⚠️ ', h('b', null, `${generation.fichier} téléchargé`),
                ` — ${generation.remplis} champ(s) remplis sur ${generation.attendus}. À compléter dans Word : ${generation.manquants.join(', ')}.`))
          : null,
        h(FormSection, { icon: '✍️', title: 'Mentions reprises dans la lettre', ton: 'violet' },
          h('div', { className: 'mentions-grille' },
            champsMentions.map(champ =>
              h('div', { className: cx('form-group', 'mention-' + champ.code), key: champ.code },
                h('label', { className: 'form-label', htmlFor: 'mention-' + champ.code }, champ.label),
                champ.type === 'liste'
                  ? h('select', {
                    id: 'mention-' + champ.code,
                    className: 'form-select', value: ldmChamps[champ.code] || '',
                    onChange: e => majChamp(champ.code, e.target.value),
                  }, h('option', { value: '' }, '— Choisir —'), champ.options.map(o => h('option', { key: o, value: o }, o)))
                  : h('input', {
                    id: 'mention-' + champ.code,
                    className: 'form-input', type: champ.type === 'date' ? 'date' : 'text',
                    placeholder: champ.placeholder || '',
                    value: ldmChamps[champ.code] || '',
                    onChange: e => majChamp(champ.code, e.target.value),
                  }),
                champ.aide ? h('div', { className: 'form-help' }, champ.aide) : null
              ))
          )
        ),
        /* La phrase qui partira dans la lettre, telle quelle et modifiable. */
        h(FormSection, { icon: '📝', title: 'La phrase telle qu’elle sortira dans la lettre', ton: 'violet' },
          h('textarea', {
            className: 'form-textarea mentions-phrase', rows: 2,
            value: ldmChamps.phraseActivite !== undefined
              ? ldmChamps.phraseActivite
              : phraseActivite(ldmChamps.activite, champsLettre.adresse, isSociete ? 'Société' : nature),
            onChange: e => majChamp('phraseActivite', e.target.value),
          }),
          ldmChamps.phraseActivite !== undefined ? h('button', {
            className: 'btn btn-secondary btn-sm', style: { marginTop: 10 },
            onClick: () => majChamp('phraseActivite', undefined),
          }, '↺ Revenir à la phrase proposée') : null
        )
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

    // ---- 6. Qui est derrière le client : les personnes, et rien d'autre ----
    step === 6 && h('div', { className: 'step-body' },
      h(VigilanceEtapePersonnes, { v: vig }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    /* ---- 8. L'attestation PPE : la vérification à gauche, le document à
       faire signer à droite. Elle a son écran parce qu'elle produit une pièce
       et que les bénéficiaires effectifs, eux, n'en produisent aucune. ---- */
    step === 7 && h('div', { className: 'step-body' },
      h(VigilanceEtapePpe, {
        v: vig,
        signataires: signatairesPpe,
        cabinetSettings,
      }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    // ---- 9. Cotation : à gauche ce qu'on sait, à droite ce qu'on note ----
    step === 8 && h('div', { className: 'step-body' },
      h(VigilanceEtapeCotation, {
        v: vig,
        identite: [
          ['Client', SCENARIO_NOUVEAU_CLIENT.societe],
          ['Forme', isSociete ? typeSociete : nature],
          ['Activité', ldmChamps.activite || SCENARIO_NOUVEAU_CLIENT.activite],
          ['Siège', adresseSiege],
          ['Dirigeant', `${prenomDirigeant} ${nomDirigeant} — ${fonctionDirigeant}`],
        ],
        // Seule l'entrée en mission connaît la mission et ses honoraires : la
        // reprise d'une analyse existante n'affiche pas ce bloc.
        mission: [
          ['Régime fiscal', isAssociation ? regimeAsso : (isParticulierIRPP ? lmpLmnp : regimeFiscal)],
          ['Salariés', salariesEffective ? `${bulletinsEstimes ? 'environ ' : ''}${nbSalaries} ${pluriel(nbSalaries, 'bulletin')} par mois` : 'aucun'],
          ['Honoraires annuels HT', euros(montants.totalAnnuelHT)],
        ],
      }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-secondary', onClick: () => showToast('Brouillon conservé dans cet écran.') }, '💾 Enregistrer le brouillon'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    // ---- 9. Niveau suggéré en haut, niveau retenu en bas ----
    /* Deux colonnes, comme le reste de l'assistant : à gauche la proposition
       du logiciel, à droite la décision du cabinet. La lecture va de la
       gauche vers la droite, dans l'ordre où l'on décide. */
    step === 9 && h('div', { className: 'step-body' },
      h(VigilanceEtapeNiveau, {
        v: vig, showToast,
        contexteSynthese: {
          client: SCENARIO_NOUVEAU_CLIENT.societe,
          activite: ldmChamps.activite || SCENARIO_NOUVEAU_CLIENT.activite,
        },
      }),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', {
          className: 'btn btn-primary',
          disabled: vig.niveauRetenu !== vig.niveauPropose && !vig.justification.trim(),
          onClick: next,
        }, 'Continuer →')
      )
    ),

    /* ---- 10. Documents : la demande au client, en une seule fois ----

       Trois rectangles, trois natures de pièces, et rien ne se mélange.

       Les documents juridiques se récupèrent : ils sont au registre national
       des entreprises, ComplyEC va les chercher. Le Kbis et la pièce d'identité
       se demandent : le client seul les a. Les attestations PPE se créent : le
       cabinet les produit préremplies, et le client les signe.

       C'était le défaut de l'écran précédent — l'attestation PPE figurait dans
       la liste des pièces à demander, comme si le client devait la trouver
       quelque part. Elle part maintenant en pièce jointe, une par bénéficiaire
       effectif, et le courrier le dit.

       L'étape a été déplacée le 22 septembre en avant-dernier, après
       l'attestation : on ne demande pas une pièce avant de l'avoir produite. */
    step === 10 && h('div', { className: 'step-body' },
      h('div', { className: 'step-scroll step-sans-defilement' },
      h('div', { className: 'grid-2 colonnes-egales etape-pleine-hauteur' },
        h('div', { className: 'pile-cartes' },
          h(DocumentsJuridiques, { depots: docsJuridiques, setDepots: setDocsJuridiques, showToast, siret }),

          /* Ce que le client doit fournir, à cocher. Les trois habituelles
             en tête — dont l'attestation PPE, qui part préremplie et revient
             signée —, les quatre complémentaires en dessous. */
          h(FormSection, { icon: '📨', title: 'À demander au client', ton: 'bleu',
            subtitle: (n => `${n} ${pluriel(n, 'pièce', 'pièces')}`)(DOCUMENTS_A_DEMANDER_CLIENT.concat(DOCUMENTS_A_DEMANDER_OPTIONNELS).filter(d => docsDemandes[d]).length + (autrePiece.trim() ? 1 : 0)) },
            h('div', { className: 'demande-boutons' },
              DOCUMENTS_A_DEMANDER_CLIENT.map(d => h(BoutonDemande, {
                key: d, libelle: d, retenu: !!docsDemandes[d],
                precision: d === DOCUMENT_ATTESTATION_PPE && signatairesPpe.length
                  ? `${ppeJointes.length || signatairesPpe.length} préremplie${(ppeJointes.length || signatairesPpe.length) > 1 ? 's' : ''}` : null,
                onClick: () => setDocsDemandes(prev => ({ ...prev, [d]: !prev[d] })),
              }))
            ),
            h('div', { className: 'demande-separateur' }, 'Si besoin'),
            /* Quatre cases sur deux colonnes, puis une ligne libre : ce
               qu'on y écrit s'ajoute à la liste de l'e-mail. */
            h('div', { className: 'demande-options' },
              DOCUMENTS_A_DEMANDER_OPTIONNELS.map(d => h(BoutonDemande, {
                key: d, libelle: d, retenu: !!docsDemandes[d],
                onClick: () => setDocsDemandes(prev => ({ ...prev, [d]: !prev[d] })),
              }))
            ),
            h('input', {
              className: 'form-input demande-libre',
              placeholder: 'Autre pièce à demander (facultatif)…',
              'aria-label': 'Autre pièce à demander',
              value: autrePiece,
              onChange: e => setAutrePiece(e.target.value),
            })
          )
        ),

        h(FormSection, { icon: '✉️', title: 'Aperçu de l’e-mail', ton: 'bleu', style: { display: 'flex', flexDirection: 'column' } },
          h('div', { className: 'letter-meta', style: { marginBottom: 10 } },
            h('div', null, h('b', null, 'Destinataire : '), DEMANDE_DESTINATAIRE),
            h('div', null, h('b', null, 'Objet : '), DEMANDE_OBJET)
          ),
          h('div', { className: 'letter-preview', style: { flex: 1, marginBottom: 12 } },
            courrierDemandeDocuments),
          /* Le bouton ouvrait seulement un message à l'écran : rien ne
             partait. Il ouvre désormais la messagerie du cabinet avec le
             destinataire, l'objet et le texte, et télécharge les
             attestations PPE à joindre — une messagerie ne se laisse pas
             remettre de pièce jointe par un lien. */
          h('button', {
            className: 'btn btn-accent btn-block',
            onClick: ouvrirDemandeDocuments,
          }, capaciteReelle('sendEmail') ? "✉️ Envoyer l'e-mail au client" : '✉️ Ouvrir l’e-mail dans ma messagerie')
        )
      )
      ),
      h('div', { className: 'wizard-footer' },
        h('button', { className: 'btn btn-secondary', onClick: prev }, '← Retour'),
        h('button', { className: 'btn btn-primary', onClick: next }, 'Continuer →')
      )
    ),

    step === 11 && h('div', { className: 'step-body' },
      /* Écran de validation : c'est là que le pied compte le plus, puisqu'il
         porte « Terminer ». Il partait 46 px hors champ à 1366 × 768. */
      h('div', { className: 'step-scroll step-remplie' },
      h('div', { className: 'grid-2-uneven validation-etape', style: { alignItems: 'stretch' } },
        /* Repris le 19 octobre : quatre tuiles, et dans chacune une seule
           chose à lire en grand, une ligne qui la précise, et une pastille
           qui dit si c'est prêt ou ce qui manque. Le détail est dans les
           étapes, d'un clic sur la tuile. */
        h('div', { className: 'recap-grid validation-tuiles' },
          [
            {
              icone: '🏢', titre: 'Société', etape: 1,
              grand: SCENARIO_NOUVEAU_CLIENT.societe,
              detail: `${civilite} ${prenomDirigeant} ${nomDirigeant} · clôture ${dateCloture}`,
              pret: true,
            },
            {
              icone: '📝', titre: 'Lettre de mission', etape: 4,
              grand: `${honoraires} € HT / mois`,
              detail: nature + (salariesEffective ? ' · avec social' : '') + (remiseCompta || remiseSocial ? ' · paramétrage remisé' : ''),
              pret: !!(generation && !generation.erreur && !generation.enCours && generation.fichier),
              manque: 'Lettre à générer',
            },
            {
              icone: '🔍', titre: 'Vigilance LCB-FT', etape: 8,
              grand: 'Vigilance ' + vig.niveauRetenu.toLowerCase(),
              detail: `${vig.basesVerifiees.length} sur ${VIGILANCE_BASES.length} vérifications · PPE : ${VIGILANCE_PPE_STATUTS[vig.ppeStatut].label.split(' —')[0].toLowerCase()}`,
              pret: vig.basesVerifiees.length === VIGILANCE_BASES.length && vig.ppeStatut !== 'a_verifier' && !!vig.justification,
              manque: [
                vig.basesVerifiees.length < VIGILANCE_BASES.length ? 'vérifications' : null,
                vig.ppeStatut === 'a_verifier' ? 'PPE' : null,
                !vig.justification ? 'justification' : null,
              ].filter(Boolean).join(', ') + ' à compléter',
            },
            {
              icone: '📨', titre: 'Documents', etape: 10,
              grand: `${DOCUMENTS_A_DEMANDER_CLIENT.concat(DOCUMENTS_A_DEMANDER_OPTIONNELS).filter(d => docsDemandes[d]).length + (autrePiece.trim() ? 1 : 0)} pièces demandées`,
              detail: docsJuridiques.length
                ? `${docsJuridiques.length} ${pluriel(docsJuridiques.length, 'document juridique', 'documents juridiques')} au dossier`
                : 'Aucun document juridique ajouté',
              pret: docsJuridiques.length > 0,
              manque: 'Statuts à ajouter',
            },
          ].map(t => h('button', {
            key: t.titre, type: 'button',
            className: cx('validation-tuile', t.pret ? 'prete' : 'a-completer'),
            onClick: () => setStep(t.etape),
            title: 'Revenir à cette étape',
          },
            h('span', { className: 'validation-tuile-tete' },
              h('span', { className: 'validation-tuile-icone', 'aria-hidden': 'true' }, t.icone), t.titre),
            h('span', { className: 'validation-tuile-grand' }, t.grand),
            h('span', { className: 'validation-tuile-detail' }, t.detail),
            h('span', { className: cx('validation-tuile-etat', t.pret ? 'prete' : 'a-completer') },
              t.pret ? '✓ Prêt' : t.manque)
          ))
        ),
        /* Ce que la finalisation fait vraiment. Deux lignes changent de
           rédaction tant que les connecteurs ne sont pas posés : le Drive n'est
           pas branché, donc rien n'y est classé, et aucun service d'envoi n'est
           raccourci — c'est la messagerie du cabinet qui s'ouvre. Annoncer
           l'inverse serait afficher « à jour » ce qui ne l'est pas. */
        h(FormSection, { icon: '✅', title: 'À la finalisation', ton: 'vert' },
          h('div', { className: 'finalisation-liste' },
            [
              ['📄', 'Génération de la lettre de mission'],
              ['📄', 'Enregistrement de l’analyse LBC-FT'],
              ['✉️', capaciteReelle('sendEmail')
                ? 'Envoi de la demande de documents'
                : 'Demande de documents, prête dans votre messagerie'],
              ['📁', driveConnecte()
                ? 'Classement des éléments dans le Drive'
                : 'Arborescence du dossier, à classer une fois le Drive raccordé'],
              ['🕐', 'Historisation de l’ouverture du dossier'],
            ].map(([icone, texte], i) => h('div', { className: 'finalisation-ligne', key: i },
              h('span', { className: 'finalisation-rang' }, i + 1),
              h('span', { className: 'finalisation-icone', 'aria-hidden': 'true' }, icone),
              h('span', { className: 'finalisation-texte' }, texte)))
          )
        )
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
            /* Aucun connecteur Drive n'est configuré : ComplyEC ne crée
               aucune arborescence. Il donne la liste des dossiers à créer,
               ce qui est utile et vrai. */
            showToast(capaciteReelle('drive')
              ? `Arborescence créée et ${DOCUMENTS_A_COLLECTER.length + DOCUMENTS_A_DEMANDER_CLIENT.length} documents classés dans le Drive.`
              : `Arborescence type retenue : ${DOCUMENTS_A_COLLECTER.length + DOCUMENTS_A_DEMANDER_CLIENT.length} emplacements à créer dans votre Drive. ComplyEC n’y est pas raccordé.`);
          },
        /* L'intitulé du bouton dit ce qu'il fait réellement : tant que le
           connecteur Drive n'est pas posé, il retient l'arborescence, il ne
           classe rien. Le toast le disait déjà ; le bouton le promettait
           quand même. */
        }, driveConnecte()
          ? (driveCree ? '📁 Drive créé — relancer le classement' : '📁 Créer l’arborescence et classer les documents')
          : (driveCree ? '📁 Arborescence retenue — revoir' : '📁 Retenir l’arborescence du dossier')),
        h('button', {
          className: 'btn btn-primary',
          onClick: () => {
            showToast('Dossier créé — lettre, analyse LBC-FT et demandes enregistrées.');
            if (onFinish) onFinish();
          },
        }, '✅ Terminer')
      )
    )
  );
}

/* Étape « Vérifications » du parcours de vigilance — § 22.3 du prompt V6.

   Trois grandes lignes, et pour chacune : ce qu'elle vérifie, le texte qui la
   fonde, où elle se fait, et le résultat constaté.

   La version précédente proposait « Interroger » et affichait aussitôt
   « Aucune correspondance ». Le logiciel n'avait rien consulté. Un
   expert-comptable qui s'en serait prévalu aurait attesté d'un contrôle
   inexistant, et c'est le genre de chose qu'un contrôleur vérifie.

   Le registre des capacités décide de ce qui s'affiche : tant qu'aucun
   connecteur n'est raccordé, la ligne propose « Renseigner le résultat » et
   demande la date, la conclusion et une note. Le jour où un connecteur
   existera, la même ligne proposera « Vérifier » sans que cet écran change. */
function VigilanceEtapeVerifications({ v }) {
  const [ouvert, setOuvert] = useState(null);

  return h('div', { className: 'step-scroll' },
    h(FormSection, { icon: '🔎', title: 'Vérifications à consigner', ton: 'violet',
      subtitle: `${Object.keys(v.verifications).length} sur ${VIGILANCE_VERIFICATIONS.length}` },
      h('div', { className: 'verifs-liste' },
        VIGILANCE_VERIFICATIONS.map(b => {
          const faite = v.verifications[b.code];
          const enCours = ouvert === b.code;
          return h('div', { className: cx('verif-ligne', faite && 'faite'), key: b.code },
            h('div', { className: 'verif-tete' },
              h('span', { className: 'verif-icone' }, b.icone),
              h('div', { className: 'verif-texte' },
                h('div', { className: 'verif-label' }, b.label),
                h('div', { className: 'verif-detail' }, b.detail),
                h('div', { className: 'verif-source' }, b.source, ' · ', b.ou)
              ),
              faite
                ? h(Badge, { color: faite.issue === 'ok' ? 'vert' : 'orange' },
                  (VIGILANCE_ISSUES.find(i => i.code === faite.issue) || {}).libelle)
                : null,
              h(CapabilityGate, {
                cle: b.capacite,
                reel: h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setOuvert(enCours ? null : b.code) }, 'Vérifier'),
                manuel: h('button', {
                  className: cx('btn', 'btn-sm', faite ? 'btn-secondary' : 'btn-primary'),
                  onClick: () => setOuvert(enCours ? null : b.code),
                }, faite ? 'Modifier le résultat' : 'Renseigner le résultat'),
              })
            ),
            faite && !enCours
              ? h('div', { className: 'verif-resultat' },
                h('span', { className: 'verif-resultat-date' }, 'Constaté le ', formatDate(faite.date)),
                faite.note ? h('span', { className: 'verif-resultat-note' }, faite.note) : null
              )
              : null,
            enCours ? h(VerifSaisie, {
              base: b,
              valeur: faite,
              onAnnuler: () => setOuvert(null),
              onEnregistrer: resultat => { v.consignerVerification(b.code, resultat); setOuvert(null); },
            }) : null
          );
        })
      ),
      h(MentionCapacite, { cle: 'rbe' })
    )
  );
}

/* La saisie d'un résultat constaté : la conclusion, la date, une note. Rien de
   plus — ce que l'expert-comptable a vu, et quand. */
function VerifSaisie({ base, valeur, onAnnuler, onEnregistrer }) {
  const [issue, setIssue] = useState((valeur && valeur.issue) || '');
  const [date, setDate] = useState((valeur && valeur.date) || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState((valeur && valeur.note) || '');

  return h('div', { className: 'verif-saisie' },
    h('div', { className: 'verif-saisie-issues' },
      VIGILANCE_ISSUES.map(i => h('button', {
        key: i.code,
        className: cx('radio-card', issue === i.code && 'selected'),
        onClick: () => setIssue(i.code),
      },
        h('span', { className: 'radio-card-titre' }, i.libelle),
        h('span', { className: 'radio-card-detail' },
          i.code === 'ok'
            ? 'La consultation n’a rien fait ressortir.'
            : 'Un point demande un examen ou une mesure complémentaire.')
      ))
    ),
    h('div', { className: 'verif-saisie-champs' },
      h('div', { className: 'form-group', style: { marginBottom: 0 } },
        h('label', { className: 'form-label' }, 'Date de la consultation'),
        h('input', { className: 'form-input', type: 'date', value: date, onChange: e => setDate(e.target.value) })
      ),
      h('div', { className: 'form-group', style: { marginBottom: 0 } },
        h('label', { className: 'form-label' }, 'Ce qui a été constaté'),
        h('input', {
          className: 'form-input', value: note,
          placeholder: issue === 'examen' ? 'Décrivez l’élément relevé' : 'Facultatif',
          onChange: e => setNote(e.target.value),
        })
      )
    ),
    h('p', { className: 'conf-detail', style: { marginBottom: 0 } },
      'Source consignée : ', base.ou, '.'),
    h('div', { className: 'modal-actions' },
      h('button', { className: 'btn btn-secondary btn-sm', onClick: onAnnuler }, 'Annuler'),
      h('button', {
        className: 'btn btn-primary btn-sm',
        // Un « élément à examiner » sans description ne dit rien à un
        // contrôleur : la note devient obligatoire dans ce cas.
        disabled: !issue || !date || (issue === 'examen' && !note.trim()),
        onClick: () => onEnregistrer({ issue, date, note: note.trim(), source: base.ou }),
      }, 'Enregistrer le résultat')
    )
  );
}
