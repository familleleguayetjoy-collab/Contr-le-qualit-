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

/* Le texte de la déclaration, écrit une fois.

   Il part dans le document Word, et il se relit à l'écran quand on consulte
   une attestation reçue. Deux rédactions séparées auraient fini par diverger,
   et l'écran aurait montré autre chose que ce qui a été signé. */
const ATTESTATION_INDEPENDANCE_ENGAGEMENTS = [
  'n’entretenir aucun lien personnel, financier ou professionnel susceptible d’altérer mon jugement dans l’exécution des missions qui me sont confiées ;',
  'm’engager à signaler sans délai toute situation de nature à compromettre cette indépendance.',
];

/* Référence vérifiée : le décret n° 2012-432 du 30 mars 2012 a remplacé le
   décret n° 2007-1387. Ne pas la citer de mémoire — c'est écrit ici une fois
   pour toutes. */
const ATTESTATION_INDEPENDANCE_FONDEMENT =
  'Articles 145 et suivants du décret n° 2012-432 du 30 mars 2012 portant code '
  + 'de déontologie des professionnels de l’expertise comptable.';

function telechargerAttestationsIndependance(annee, reglages) {
  const engagements = ATTESTATION_INDEPENDANCE_ENGAGEMENTS
    .map(e => `<p style="text-align:justify;">— ${docxEchapper(e)}</p>`).join('');
  const pages = COLLABORATEURS.map((c, i) => `
    <div style="${i ? 'page-break-before:always;' : ''}">
      <p style="font-size:10pt; color:#555;">${docxEchapper(reglages.nom || '')}</p>
      <h1 style="font-size:16pt; margin-top:24pt;">Déclaration d’indépendance — exercice ${annee}</h1>
      <p style="margin-top:18pt;">Je soussigné(e) <b>${docxEchapper(c.nom)}</b>, ${docxEchapper(c.role)}, déclare :</p>
      ${engagements}
      <p style="font-size:9.5pt; color:#666; margin-top:14pt;">${docxEchapper(ATTESTATION_INDEPENDANCE_FONDEMENT)}</p>
      <p style="margin-top:36pt;">Fait à ………………………, le ……… / ……… / ${annee}</p>
      <p style="margin-top:28pt;">Signature :</p>
    </div>`).join('');

  downloadWordDoc(
    `Attestations_independance_${annee}.doc`,
    `Attestations d’indépendance ${annee}`,
    pages
  );
}

/* Les années proposées : l'année en cours et les trois précédentes. Une
   campagne d'indépendance se relit après coup, à l'occasion d'un contrôle. */
function anneesCampagne() {
  const a = currentCalendarYear();
  return [0, 1, 2, 3].map(n => String(Number(a) - n));
}

/* Consulter une attestation revenue.

   Ce que ComplyEC sait, il le montre : qui a signé, quand, et le texte exact
   de ce qui a été signé. Ce qu'il ne sait pas, il le dit — l'exemplaire signé
   est un papier scanné dans l'espace documentaire du cabinet, et tant que le
   connecteur n'est pas posé, aucune ligne ne prétend l'avoir sous la main. */
function PanneauAttestationRecue({ declaration, annee, personne, cabinetSettings, onFermer }) {
  const nom = personne ? personne.nom : declaration.collaborateur;
  const cab = cabinetSettings || CABINET_SETTINGS_DEFAUT;

  return h(PanneauLateral, {
    ouvert: true,
    titre: `Attestation d’indépendance ${annee}`,
    sousTitre: `${nom} — signée le ${formatDate(declaration.dateSignature)}`,
    onFermer,
    pied: h('button', { className: 'btn btn-secondary', onClick: onFermer }, 'Fermer'),
  },
    h('section', { className: 'attestation-lue' },
      h('p', { className: 'attestation-lue-cabinet' }, cab.nom || ''),
      h('h3', null, `Déclaration d’indépendance — exercice ${annee}`),
      h('p', null,
        'Je soussigné(e) ', h('strong', null, nom),
        personne && personne.role ? `, ${personne.role}` : '', ', déclare :'),
      h('ul', { className: 'attestation-lue-engagements' },
        ATTESTATION_INDEPENDANCE_ENGAGEMENTS.map((e, i) => h('li', { key: i }, e))),
      h('p', { className: 'attestation-lue-fondement' }, ATTESTATION_INDEPENDANCE_FONDEMENT)
    ),

    h('div', { className: 'attestation-lue-signature' },
      h('span', { className: 'marque marque-vert' }, '✓'),
      h('div', null,
        h('strong', null, 'Retour enregistré le ', formatDate(declaration.dateSignature), '.'),
        h('p', null, driveConnecte()
          ? 'L’exemplaire signé est classé dans l’espace documentaire du cabinet.'
          : 'L’exemplaire signé et scanné est conservé par le cabinet. '
            + 'ComplyEC n’y accède pas encore : le connecteur de l’espace '
            + 'documentaire n’est pas posé, et le retour ci-dessus est un pointage '
            + 'fait à la main.')
      )
    )
  );
}

function BlocIndependanceCampagne({ showToast, cabinetSettings , sansTitre }) {
  const [annee, setAnnee] = useState(currentCalendarYear());
  const [consultee, setConsultee] = useState(null);
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

  /* Comment part une attestation, concrètement.

     ComplyEC n'envoie pas d'e-mail lui-même : aucun serveur d'envoi n'est
     raccordé, et prétendre le contraire ferait croire qu'un message est parti
     alors qu'il ne l'est pas. Il écrit le message et ouvre la messagerie du
     cabinet — Outlook, Thunderbird, ce qui est installé — avec l'objet, le
     corps et les destinataires déjà remplis. Le cabinet relit et envoie.

     La date, elle, est enregistrée quoi qu'il arrive : c'est elle qui remplit
     la colonne « Relancée » du tableau. */
  function messageCampagne(destinataires) {
    const corps = [
      'Bonjour,',
      `Vous trouverez ci-joint votre déclaration d’indépendance pour l’exercice ${annee}.`,
      'Merci de la dater, de la signer et de nous la retourner. Elle est conservée '
      + 'au dossier du système de management de la qualité du cabinet.',
      'Bien cordialement,',
      `${EXPERT_COMPTABLE.nom}\n${EXPERT_COMPTABLE.role}`,
    ].join('\n\n');
    return {
      a: destinataires.join(','),
      sujet: `Déclaration d’indépendance ${annee} — à signer et à retourner`,
      corps,
    };
  }

  async function diffuser() {
    const attendus = declarations
      .filter(d => d.statut !== 'signee')
      .map(d => collaborateur(d.collaborateur))
      .filter(c => c && c.email)
      .map(c => c.email);
    await dbDiffuserAttestations(annee);
    const m = messageCampagne(attendus);
    window.location.href = `mailto:${encodeURIComponent(m.a)}`
      + `?subject=${encodeURIComponent(m.sujet)}&body=${encodeURIComponent(m.corps)}`;
    /* Une adresse n'est connue que des collaborateurs créés dans ComplyEC :
       le dire, plutôt que de laisser croire que le message est adressé. */
    showToast(attendus.length
      ? 'Message préparé dans votre messagerie. Date de relance enregistrée.'
      : 'Message préparé dans votre messagerie, destinataires à compléter : '
        + 'aucune adresse n’est renseignée pour ces collaborateurs.');
  }

  function etatDe(d) {
    if (d.statut === 'signee') return 'recue';
    if (campagne.diffuseeLe) return 'diffusee';
    if (campagne.genereeLe) return 'generee';
    return 'rien';
  }

  const marque = (vrai, ton) => h('span', { className: `marque marque-${vrai ? ton : 'gris'}` }, vrai ? '✓' : '—');

  /* Deux rectangles. Au-dessus, ce qu'on décide : l'année, puis les deux
     actions. En dessous, ce qu'on constate : la liste, et rien d'autre. Les
     mêler obligeait à chercher le bouton au milieu du tableau. */
  const manquantes = declarations.length - signees;

  return h(React.Fragment, null,
    /* Les deux rectangles portent leur titre en bandeau plein, chacun dans sa
       teinte : le pilotage en bleu, la liste en menthe. */
    h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-bleu campagne-pilotage' },
      h('header', { className: 'bloc-carte-entete' },
        h('h2', null, sansTitre ? 'La campagne' : 'Campagne d’indépendance')
      ),
      h('div', { className: 'campagne-barre' },
        h('div', { className: 'campagne-annee' },
          h('label', { className: 'champ-label', htmlFor: 'campagne-annee' }, 'Année'),
          h('select', {
            id: 'campagne-annee', className: 'form-input', value: annee,
            onChange: e => setAnnee(e.target.value),
          }, anneesCampagne().map(a => h('option', { key: a, value: a }, a)))
        ),
        h('div', { className: 'campagne-actions' },
          h('button', {
            className: 'btn btn-primary',
            onClick: generer,
          }, campagne.genereeLe ? 'Actualiser les attestations' : 'Générer les attestations'),
          h('button', {
            className: 'btn btn-secondary',
            disabled: !campagne.genereeLe || !manquantes,
            title: !campagne.genereeLe
              ? 'Générez d’abord les attestations.'
              : (!manquantes ? 'Toutes les attestations sont revenues.' : undefined),
            onClick: diffuser,
          }, 'Relancer')
        )
      ),
      /* Les dates de génération et de relance se lisent déjà dans le tableau,
         colonne par colonne et ligne par ligne : les répéter en prose au-dessus
         n'ajoutait rien et alourdissait le bloc de pilotage.

         Une seule phrase reste : elle dit ce que ComplyEC fait tout seul au
         changement d'année, et ce qu'il ne fait pas. L'année en cours apparaît
         d'elle-même dans la liste et la campagne remonte dans la synthèse du
         contrôle ; les documents, eux, se génèrent d'un clic. Écrire que la
         campagne se lance seule au 1er janvier serait faux : rien ne tourne
         côté serveur. */
      String(annee) === String(currentCalendarYear()) && !campagne.genereeLe
        ? h('p', { className: 'campagne-etat' },
          `La campagne ${annee} n’est pas lancée. Elle est apparue d’elle-même avec `
          + 'la nouvelle année et la synthèse du contrôle la compte comme à faire ; '
          + 'les attestations, elles, se génèrent en cliquant ci-dessus.')
        : null
    ),

    h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe' },
    h('header', { className: 'bloc-carte-entete' },
      h('h2', null, `Les attestations ${annee}`)
    ),
    h('div', { className: 'tableau-moderne-enveloppe' },
      h('table', { className: 'tableau-moderne' },
        h('thead', null, h('tr', null,
          h('th', null, 'Collaborateur'),
          h('th', null, 'Générée'),
          h('th', null, 'Relancée'),
          h('th', null, 'Reçue')
        )),
        h('tbody', null, declarations.map(d => {
          const c = collaborateur(d.collaborateur);
          const e = etatDe(d);
          return h('tr', { key: d.collaborateur },
            h('td', { className: 'col-principale' }, c ? c.nom : d.collaborateur),
            h('td', null, marque(!!campagne.genereeLe, 'vert')),
            h('td', null, marque(!!campagne.diffuseeLe, 'vert')),
            /* Une attestation revenue se consulte : un bouton nommé, pas une
               coche qu'il faudrait deviner cliquable. Celle qu'on attend
               encore n'a rien à ouvrir, et garde sa pastille. */
            h('td', null, e === 'recue'
              ? h('button', {
                className: 'btn btn-secondary btn-ligne',
                onClick: () => setConsultee(d),
              }, 'Consulter')
              : h('span', { className: 'marque marque-orange', title: 'Pas encore revenue' }, '●'))
          );
        }))
      )
    )
    ),

    consultee ? h(PanneauAttestationRecue, {
      declaration: consultee,
      annee,
      personne: collaborateur(consultee.collaborateur),
      cabinetSettings,
      onFermer: () => setConsultee(null),
    }) : null
  );
}

/* Analyse et mesure de sauvegarde proposées à partir du seul chiffre connu :
   la part du client dans le chiffre d'affaires du cabinet.

   Sous le seuil, il n'y a rien à analyser et rien à mettre en place : la
   réponse est « Non significatif », et la faire saisir à la main n'apporte
   rien. Au-dessus, ComplyEC propose la rédaction attendue, que
   l'expert-comptable corrige s'il le veut : c'est sa décision, pas celle du
   logiciel, mais il ne part pas d'une page blanche.

   Le seuil vient des réglages du cabinet (10 % par défaut), il n'est pas
   écrit en dur ici. */
function propositionDependance(part, seuil) {
  if (!part) return { analyse: '', mesure: '' };
  if (part < seuil) {
    return { analyse: 'Non significatif', mesure: 'Non significatif' };
  }
  return {
    analyse: `Le client représente ${pourcent(part, 1)} du chiffre d’affaires du cabinet, au-dessus du seuil de ${pourcent(seuil)} retenu. La perte de ce client aurait un effet sensible sur l’activité.`,
    mesure: 'Revue de la mission par un second expert-comptable, et suivi de la part de ce client dans le chiffre d’affaires à chaque clôture.',
  };
}

/* Cinq lignes, toujours affichées.

   Un bouton « Ajouter une ligne » obligeait à deviner combien de lignes
   remplir. Cinq lignes prêtes disent ce qu'on attend, et une ligne laissée
   vide n'est simplement pas enregistrée. */
const DEPENDANCE_LIGNES_AFFICHEES = 5;

function BlocDependanceEconomique({ showToast, cabinetSettings , sansTitre }) {
  const seuil = Number(cabinetSettings.seuilDependance || SEUIL_DEPENDANCE_DEFAUT);
  const enregistrees = dbDependanceLignes();
  const [dateArrete, setDateArrete] = useState(() => new Date().toISOString().slice(0, 10));

  /* Le chiffre d'affaires du cabinet se saisit ici comme dans « Cabinet et
     activité » : c'est la même donnée, au même endroit en base, et elle circule
     dans les deux sens. Sans lui, la colonne « % du CA » ne veut rien dire —
     et jusqu'ici il fallait quitter cet écran pour le renseigner. */
  const caEnregistre = dbChiffreAffairesCabinet();
  const [caSaisi, setCaSaisi] = useState(() => String(caEnregistre || ''));
  useEffect(() => { setCaSaisi(String(caEnregistre || '')); }, [caEnregistre]);
  const ca = Number(caSaisi) > 0 ? Number(caSaisi) : CABINET_CA_DEFAUT;
  const caEstime = !(Number(caSaisi) > 0);

  /* L'état de saisie part des lignes enregistrées, complétées jusqu'à cinq. */
  const [lignes, setLignes] = useState(() => {
    const base = enregistrees.slice(0, DEPENDANCE_LIGNES_AFFICHEES).map(l => ({
      id: l.id, client: l.client || '', honoraires: String(l.honoraires || ''),
      mesure: l.mesure || '', manuelle: !!l.mesure,
    }));
    while (base.length < DEPENDANCE_LIGNES_AFFICHEES) {
      base.push({ id: null, client: '', honoraires: '', mesure: '', manuelle: false });
    }
    return base;
  });

  function partDe(honoraires) {
    const n = Number(honoraires) || 0;
    return ca > 0 ? (n / ca) * 100 : 0;
  }

  /* Modifier les honoraires réécrit la mesure de sauvegarde tant que
     l'expert-comptable ne l'a pas touchée lui-même. */
  function majLigne(i, champ, valeur) {
    setLignes(l => l.map((ligne, j) => {
      if (j !== i) return ligne;
      const suivante = Object.assign({}, ligne, { [champ]: valeur });
      if (champ === 'mesure') suivante.manuelle = true;
      if (champ === 'honoraires' && !ligne.manuelle) {
        suivante.mesure = propositionDependance(partDe(valeur), seuil).mesure;
      }
      return suivante;
    }));
  }

  async function enregistrer() {
    const aGarder = lignes.filter(l => l.client.trim() && Number(l.honoraires) > 0);
    if (!aGarder.length) { showToast('Renseignez au moins un client et ses honoraires.'); return; }
    /* Le chiffre d'affaires va là où il vit déjà : dans le formulaire du
       manuel. Saisi ici ou là-bas, c'est la même valeur. */
    if (Number(caSaisi) > 0 && Number(caSaisi) !== caEnregistre) {
      const cab = dbManuelCabinet().cabinet || {};
      await dbMajManuelCabinet({
        cabinet: Object.assign({}, cab, { chiffreAffaires: String(Number(caSaisi)) }),
      });
    }
    for (const l of aGarder) {
      await dbEnregistrerDependance({
        id: l.id || undefined,
        client: l.client.trim(),
        honoraires: Number(l.honoraires),
        mesure: l.mesure,
      });
    }
    /* Enregistrer produit la pièce : un document daté, horodaté dans son nom,
       classé au Drive. C'est ce document qu'un contrôleur demande, pas l'écran
       de saisie. */
    telechargerEtatDependance(lignes, { seuil, ca, dateArrete, cabinet: cabinetSettings });
    showToast(capaciteReelle('drive')
      ? `${aGarder.length} ${pluriel(aGarder.length, 'ligne enregistrée', 'lignes enregistrées')} — document classé dans le Drive.`
      : `${aGarder.length} ${pluriel(aGarder.length, 'ligne enregistrée', 'lignes enregistrées')} — document généré. ComplyEC n’est pas raccordé au Drive : classez-le dans 00_Dossier permanent.`);
  }

  return h('section', { className: 'bloc-carte bloc-carte-pleine' },
    sansTitre ? null : h('header', { className: 'bloc-carte-entete' },
      h('h2', null, 'Dépendance économique')),

    /* La barre de réglage : ce dont dépendent tous les pourcentages du tableau,
       et la date à laquelle l'état est arrêté. Les intitulés sont à gauche de
       leur champ, pas au-dessus : posés au-dessus, ils venaient toucher le
       bandeau du tableau. */
    h('div', { className: 'dep-barre' },
      h('div', { className: 'dep-reglage' },
        h('label', { className: 'dep-label', htmlFor: 'dep-ca' }, 'Chiffre d’affaires annuel'),
        h('input', {
          id: 'dep-ca', className: 'form-input', type: 'number', min: 0, step: 1000,
          placeholder: 'Montant hors taxes',
          value: caSaisi, onChange: e => setCaSaisi(e.target.value),
        }),
        h('span', { className: 'dep-unite' }, '€')
      ),
      h('div', { className: 'dep-reglage' },
        h('label', { className: 'dep-label', htmlFor: 'dep-date' }, 'Arrêtée au'),
        h('input', {
          id: 'dep-date', className: 'form-input', type: 'date',
          value: dateArrete, onChange: e => setDateArrete(e.target.value),
        })
      ),
      h('button', { className: 'btn btn-primary', onClick: enregistrer }, 'Enregistrer')
    ),
    /* Dire quand le pourcentage repose sur une valeur qui n'a pas été saisie :
       un taux calculé sur un chiffre d'affaires supposé n'est pas un taux. */
    caEstime
      ? h('p', { className: 'dep-avertissement' },
        'Aucun chiffre d’affaires n’est enregistré : les pourcentages sont '
        + `calculés sur ${euros(CABINET_CA_DEFAUT)}, valeur de démonstration.`)
      : null,

    h('div', { className: 'tableau-moderne-enveloppe sans-defilement' },
      h('table', { className: 'tableau-moderne tableau-saisie tableau-dependance' },
        h('thead', null, h('tr', null,
          h('th', null, 'Client ou groupe'),
          h('th', { className: 'col-honoraires' }, 'Honoraires'),
          h('th', { className: 'col-part' }, '% du CA'),
          h('th', null, 'Mesure de sauvegarde')
        )),
        h('tbody', null, lignes.map((l, i) => {
          const part = partDe(l.honoraires);
          const auDessus = part >= seuil;
          return h('tr', { key: i },
            h('td', null, h('input', {
              className: 'saisie-champ', type: 'text', placeholder: 'Nom du client',
              value: l.client, onChange: e => majLigne(i, 'client', e.target.value),
              'aria-label': `Client, ligne ${i + 1}`,
            })),
            h('td', { className: 'col-honoraires' }, h('input', {
              className: 'saisie-champ saisie-nombre', type: 'number', min: 0, placeholder: '0',
              value: l.honoraires, onChange: e => majLigne(i, 'honoraires', e.target.value),
              'aria-label': `Honoraires, ligne ${i + 1}`,
            })),
            h('td', { className: 'col-part' },
              l.honoraires
                ? h('span', { className: auDessus ? 'part-au-dessus' : '' }, pourcent(part, 1))
                : h('span', { className: 'cellule-vide' }, '—')),
            h('td', null, h('textarea', {
              className: cx('saisie-champ', 'saisie-texte', !auDessus && l.honoraires && 'saisie-automatique'),
              rows: 3, placeholder: l.honoraires ? '' : 'Renseignez les honoraires',
              value: l.mesure, onChange: e => majLigne(i, 'mesure', e.target.value),
              'aria-label': `Mesure de sauvegarde, ligne ${i + 1}`,
            }))
          );
        }))
      )
    )
  );
}

/* L'état de la dépendance économique, au format Word.

   Le nom du fichier porte la date d'arrêté choisie et l'horodatage de la
   sauvegarde : deux enregistrements du même jour ne s'écrasent pas, et on sait
   lequel est le dernier sans l'ouvrir. */
function telechargerEtatDependance(lignes, { seuil, ca, dateArrete, cabinet }) {
  const retenues = lignes.filter(l => l.client.trim() && Number(l.honoraires) > 0);
  const corps = `
    <p style="font-size:10pt; color:#555;">${docxEchapper((cabinet && cabinet.nom) || '')}</p>
    <h1 style="font-size:16pt; margin-top:20pt;">Dépendance économique — état arrêté au ${formatDateLong(dateArrete)}</h1>
    <p>Seuil retenu par le cabinet : ${pourcent(seuil)} du chiffre d’affaires, soit ${euros(ca * seuil / 100)}
    sur un chiffre d’affaires de ${euros(ca)}.</p>
    <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse; width:100%; font-size:10pt;">
      <tr style="background:#EEF2F8;">
        <th align="left">Client ou groupe</th><th align="right">Honoraires</th>
        <th align="right">% du CA</th><th align="left">Mesure de sauvegarde</th>
      </tr>
      ${retenues.map(l => {
        const part = ca > 0 ? (Number(l.honoraires) / ca) * 100 : 0;
        return `<tr>
          <td>${docxEchapper(l.client)}</td>
          <td align="right">${euros(Number(l.honoraires))}</td>
          <td align="right">${pourcent(part, 1)}</td>
          <td>${docxEchapper(l.mesure || '')}</td>
        </tr>`;
      }).join('')}
    </table>
    <p style="font-size:9.5pt; color:#666; margin-top:16pt;">Article 145 et suivants du décret n° 2012-432 du 30 mars 2012
    portant code de déontologie des professionnels de l’expertise comptable.</p>`;

  const horodatage = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', 'h');
  downloadWordDoc(
    `Dependance_economique_${dateArrete}_${horodatage}.doc`,
    `Dépendance économique — ${formatDateLong(dateArrete)}`,
    corps
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
  // Les attestations concernent les personnes du cabinet, la dépendance
  // concerne la répartition des honoraires : deux dessins qui disent cela.
  { key: 'attestations', label: 'Attestations d’indépendance', icone: 'equipe', teinte: 'bleu', large: true },
  { key: 'dependance', label: 'Dépendance économique', icone: 'graphe', teinte: 'ambre', large: true },
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
  { code: 'toutes', label: 'Toutes', teinte: 'acier' },
  { code: 'internes', label: 'Internes', teinte: 'bleu' },
  { code: 'externes', label: 'Externes', teinte: 'violet' },
  { code: 'lbcft', label: 'LCB-FT', teinte: 'menthe' },
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
  /* Le bandeau du tableau reprend la couleur du filtre ouvert : la liste
     affichée et le bouton qui l'a produite se répondent. */
  const filtreCourant = FORMATIONS_FILTRES.find(f => f.code === filtre) || FORMATIONS_FILTRES[0];

  return h(RubriquePage, {
    titre: 'Formations',
    actions: h('button', { className: 'btn btn-primary', onClick: () => setNouvelle(true) }, '+ Ajouter une formation'),
  },
    h('div', { className: 'filtres-internes' },
      FORMATIONS_FILTRES.map(f => h('button', {
        key: f.code,
        className: cx('filtre-interne', 'teinte-' + f.teinte, filtre === f.code && 'actif'),
        onClick: () => setFiltre(f.code),
      }, f.label))
    ),

    lignes.length
      ? h('div', { className: 'tableau-moderne-enveloppe' },
        h('table', { className: cx('tableau-moderne', 'entete-teinte', 'teinte-' + filtreCourant.teinte) },
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

/* Le registre des traitements a été retiré le 22 septembre.

   Il était incompréhensible à l'écran, et sa valeur ajoutée ne tenait pas : un
   cabinet qui doit tenir un registre au titre de l'article 30 du RGPD le fait
   sur le modèle de la CNIL, une fois, et ne le rouvre qu'une fois par an. Un
   formulaire à neuf champs répétés autant de fois qu'il y a de traitements
   n'apportait rien qu'un tableur ne fasse mieux, et il occupait un tiers d'une
   rubrique qui a deux sujets réels : qui traite les données du cabinet, et
   sous quelles règles l'intelligence artificielle y est employée.

   Ces deux sujets prennent maintenant toute la largeur. */
const RGPD_CARTES = [
  /* Deux carrés côte à côte, et non deux bandes pleine largeur : empilées,
     elles ne laissaient que vingt pixels entre le titre de la rubrique et la
     première, mesurés. */
  { key: 'prestataires', label: 'Prestataires et sous-traitants', icone: 'prise', teinte: 'acier' },
  { key: 'charte', label: 'Charte d’utilisation de l’IA', icone: 'etincelle', teinte: 'violet' },
];

function RubriqueRgpd({ showToast, cabinetSettings }) {
  const [vue, setVue] = useState(null);

  if (!vue) {
    return h(RubriquePage, { titre: 'Informatique, RGPD & IA' },
      h(CartesHub, { cartes: RGPD_CARTES, onOuvrir: setVue, colonnes: 2 })
    );
  }

  const carte = RGPD_CARTES.find(c => c.key === vue);
  return h(RubriquePage, {
    titre: carte.label,
    retour: h(RetourHub, { vers: 'Informatique, RGPD & IA', onRetour: () => setVue(null) }),
  },
    vue === 'prestataires'
      ? h(BlocPrestataires, { showToast, sansTitre: true })
      : h(BlocCharteIa, { showToast, cabinetSettings, sansTitre: true })
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

  /* Un carré par prestataire, et sa couleur dit tout : rouge s'il manque son
     contrat, bleu clair sinon. Le nom et la catégorie portent la lecture ;
     l'action d'ajout est au bas, au milieu, toujours au même endroit. */
  return h('section', { className: 'bloc-carte' },
    sansTitre ? null : h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Prestataires')),
    /* D'où vient cette liste : la question a été posée, l'écran doit y
       répondre sans qu'on ait à la poser. */
    h('p', { className: 'bloc-carte-note' },
      'Cette liste est celle des outils et prestataires du cabinet retenue à '
      + 'l’installation. Elle se modifie dans « Outils & prestataires », où '
      + 'chaque ligne porte son usage, son accès aux données et ses mesures de '
      + 'sécurité. Le contrat se dépose ici.'),
    h('div', { className: 'prestataires-grille' },
      prestataires.map(p => {
        const contrat = contrats[p.id] || p.contrat;
        return h('article', {
          className: cx('prestataire-carte', contrat ? 'a-contrat' : 'sans-contrat'), key: p.id,
        },
          h('h3', null, p.nom),
          h('p', { className: 'prestataire-type' }, p.type),
          contrat
            ? h('div', { className: 'prestataire-pied' },
              h('span', { className: 'prestataire-etat' }, 'Contrat au dossier'),
              h('span', { className: 'prestataire-fichier' }, contrat.nom))
            : h('div', { className: 'prestataire-pied' },
              h('span', { className: 'prestataire-etat manquant' }, 'Contrat manquant'),
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

/* La charte d'utilisation de l'IA.

   Rien tant qu'elle n'existe pas : un grand bouton, et c'est tout. Une fois
   créée, l'écran montre ce qu'elle contient — les quinze articles, le registre
   des outils, ce qui reste à renseigner — et ce qu'on peut en faire.

   Ce qui manque est dit. Une charte dont le registre des outils est vide n'est
   pas une charte complète : l'article 5 y renvoie, et un contrôleur ira le
   lire. L'écran le signale au lieu d'afficher une pastille verte. */
function BlocCharteIa({ showToast, cabinetSettings , sansTitre }) {
  const charte = dbCharteIa();
  const [edition, setEdition] = useState(false);
  const outils = (charte && charte.outils) || [];
  const tousManques = charte ? charteIaManques(charte) : [];
  /* La formation a son bandeau et son bouton juste au-dessus : la répéter dans
     la liste ferait lire deux fois la même chose. */
  /* Déclarée sans objet, la formation n'est plus un manque : un cabinet sans
     personnel n'a personne à former, et l'article 12 ne vise que le personnel. */
  const formationManque = !!charte
    && !charte.formationSansObjet
    && !String(charte.dateFormation || '').trim();
  const manques = formationManque
    ? tousManques.filter(m => m.indexOf('Dernière formation du personnel') !== 0)
    : tousManques;

  if (edition) {
    return h(ParcoursCharteIa, {
      charte, cabinetSettings, showToast,
      onFermer: () => setEdition(false),
    });
  }

  return h('section', { className: 'bloc-carte bloc-carte-pleine' },
    sansTitre ? null : h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Charte IA')),
    charte
      ? h(React.Fragment, null,
        h('div', { className: 'charte-carte' },
          h('div', { className: 'charte-etat' },
            tousManques.length
              ? h(Pastille, { ton: 'orange' }, `${tousManques.length} ${pluriel(tousManques.length, 'point à compléter', 'points à compléter')}`)
              : h(Pastille, { ton: 'vert' }, 'Charte complète'),
            h('span', { className: 'charte-date' }, `Dernière mise à jour le ${formatDate(charte.majLe)}`)
          ),
          h('div', { className: 'charte-actions' },
            h('button', {
              className: 'btn btn-secondary btn-sm',
              onClick: () => telechargerCharteIa(charte, cabinetSettings),
            }, 'Générer le document'),
            h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setEdition(true) }, 'Modifier')
          )
        ),
        /* L'article 12 subordonne l'accès à un outil de catégorie 1 à une
           formation préalable. Tant que sa date n'est pas au dossier, la
           charte ne prouve rien sur ce point — et le dire sans donner le
           moyen d'y remédier ferait perdre du temps. D'où le bouton, ici,
           au lieu d'une ligne de plus dans la liste des manques. */
        formationManque
          ? h('div', { className: 'charte-alerte' },
            h('div', { className: 'charte-alerte-texte' },
              h('strong', null, 'Formation du personnel non datée.'),
              ' L’article 12 de la charte interdit l’accès à un outil de catégorie 1 '
              + 'sans formation préalable. Renseignez la date de la dernière session : '
              + 'elle est conservée au titre des ressources humaines du système qualité.'),
            h('button', {
              className: 'btn btn-primary btn-sm',
              onClick: () => setEdition(true),
            }, 'Renseigner la formation')
          )
          : null,
        manques.length
          ? h('ul', { className: 'charte-manques' },
            manques.map((m, i) => h('li', { key: i }, m)))
          : null,
        /* Le sommaire : l'expert-comptable voit ce qu'il signe sans avoir à
           générer le document d'abord. */
        h('div', { className: 'charte-sommaire' },
          h('h3', null, 'Ce que contient la charte'),
          h('ol', { className: 'charte-articles' },
            CHARTE_IA_ARTICLES.map(a => h('li', { key: a.numero }, a.titre))
          ),
          h('p', { className: 'charte-annexes' },
            `Annexe 1 — registre des outils d’IA : ${outils.length} `
            + `${pluriel(outils.length, 'outil inscrit', 'outils inscrits')}. `
            + 'Annexe 2 — fiche de validation, une par fournisseur inscrit au registre.')
        )
      )
      : h('div', { className: 'charte-vide' },
        h('p', { className: 'charte-vide-texte' },
          'Quinze articles, la matrice données / outils, le tableau de revue par '
          + 'domaine et deux annexes. Le texte est fixe : vous renseignez le '
          + 'référent, l’associé qui approuve, les dates et le registre des outils.'),
        h('button', { className: 'btn btn-primary btn-lg', onClick: () => setEdition(true) }, 'Créer ma charte IA')
      )
  );
}

/* La charte se remplit sur l'écran, en trois temps, comme la lettre de mission.

   Le panneau latéral a été abandonné le 22 septembre. Un volet de quatre cents
   pixels pour un formulaire qui porte sept dates, un registre d'outils et un
   texte libre obligeait à faire défiler sans jamais voir où l'on en était. Le
   parcours prend l'écran, montre ses trois étapes en tête, et l'on avance.

   Deuxième règle appliquée ici : ne rien redemander. Le nom du cabinet, sa
   ville et l'expert-comptable inscrit sont déjà connus — ils sont proposés,
   pas ressaisis, et restent corrigeables. */
const CHARTE_IA_ETAPES = ['Qui répond de la charte', 'Le registre des outils', 'Relecture'];

function ParcoursCharteIa({ charte, cabinetSettings, onFermer, showToast }) {
  const cab = cabinetSettings || CABINET_SETTINGS_DEFAUT;
  const [etape, setEtape] = useState(1);

  const depart = {};
  CHARTE_IA_VARIABLES.forEach(v => { depart[v.cle] = ''; });
  const [form, setForm] = useState(Object.assign(
    {}, depart, { complements: '', outils: [] }, charte || {},
    /* Ce que ComplyEC sait déjà : l'associé inscrit au tableau, la ville du
       siège, et la date du jour pour l'adoption. Proposés, jamais imposés. */
    charte ? {} : {
      approbateur: EXPERT_COMPTABLE.nom,
      ville: villeDeLAdresse(cab.adresse),
      dateAdoption: new Date().toISOString().slice(0, 10),
    }
  ));
  const maj = (cle, v) => setForm(f => Object.assign({}, f, { [cle]: v }));

  const outils = form.outils || [];
  function majOutil(i, cle, v) {
    setForm(f => Object.assign({}, f, {
      outils: (f.outils || []).map((o, j) => {
        if (j !== i) return o;
        const suite = Object.assign({}, o, { [cle]: v });
        /* Choisir un outil de la liste renseigne son éditeur : il est connu,
           le redemander serait une saisie de plus. Il reste modifiable, et un
           éditeur déjà saisi à la main n'est jamais écrasé. */
        if (cle === 'outil') {
          const connu = CHARTE_IA_OUTILS_CONNUS.find(x => x.nom === v);
          if (connu && !String(o.fournisseur || '').trim()) suite.fournisseur = connu.fournisseur;
        }
        return suite;
      }),
    }));
  }

  async function enregistrer() {
    await dbEnregistrerCharteIa(form);
    showToast('Charte IA enregistrée.');
    onFermer();
  }

  const manquesEnCours = charteIaManques(form);

  return h('div', { className: 'charte-parcours' },
    h(Stepper, { steps: CHARTE_IA_ETAPES, current: etape }),

    /* Étape 1 — qui répond de la charte, et à quelles dates.

       L'écran était « trop neutre et trop compact » : sept champs empilés dans
       deux colonnes grises, sans rien qui dise à quoi chacun sert ni lequel
       compte. Chaque réponse a maintenant sa fiche, avec son repère coloré et
       sa phrase d'explication à côté du champ plutôt qu'en dessous en petit.
       Et la première ligne dit ce qu'on est en train de faire. */
    etape === 1 && h('div', { className: 'charte-etape' },
      h('p', { className: 'charte-intro' },
        'Le texte des quinze articles est fixe : ce qui se renseigne ici est ce '
        + 'qui appartient au cabinet.'),

      h('div', { className: 'charte-deux' },
        h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit' },
          h('header', { className: 'bloc-carte-entete' },
            h('h2', null, 'Qui répond de la charte'),
            h('span', { className: 'bloc-carte-compte' }, 'Articles 13 et 5')
          ),
          h('div', { className: 'charte-fiches' },
            CHARTE_IA_VARIABLES.filter(v => !v.type).map((v, i) => h('div', {
              key: v.cle, className: cx('charte-fiche', 'charte-fiche-' + ['bleu', 'violet', 'menthe'][i % 3]),
            },
              h(ChampPanneau, {
                label: v.label, aide: v.aide,
                valeur: form[v.cle] || '', onChange: val => maj(v.cle, val),
              })
            ))
          )
        ),

        h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-violet' },
          h('header', { className: 'bloc-carte-entete' },
            h('h2', null, 'Les dates'),
            h('span', { className: 'bloc-carte-compte' }, 'Articles 12 et 15')
          ),
          h('div', { className: 'charte-fiches charte-fiches-dates' },
            CHARTE_IA_VARIABLES.filter(v => v.type === 'date').map((v, i) => h('div', {
              key: v.cle,
              className: cx('charte-fiche', 'charte-fiche-' + ['bleu', 'violet', 'menthe', 'ambre'][i % 4]),
            },
              /* La formation du personnel peut n'avoir pas d'objet : la case
                 le dit, et la charte cesse de réclamer une date. */
              v.sansObjet
                ? h(ChampOuSansObjet, {
                  label: v.label, aide: v.aide, type: 'date',
                  valeur: form[v.cle] || '', onChange: val => maj(v.cle, val),
                  sansObjet: !!form[v.sansObjet],
                  sansObjetLabel: v.sansObjetLabel,
                  onSansObjet: coche => setForm(f => Object.assign({}, f, {
                    [v.sansObjet]: coche,
                    [v.cle]: coche ? '' : f[v.cle],
                  })),
                })
                : h(ChampPanneau, {
                  label: v.label, aide: v.aide, type: 'date',
                  valeur: form[v.cle] || '', onChange: val => maj(v.cle, val),
                })
            ))
          )
        )
      )
    ),

    /* Étape 2 — le registre des outils, annexe 1.

       Repris le 24 septembre : « trop compact, et pas assez attractif ». Huit
       champs de même taille alignés sur deux rangées ne disent pas ce qui est
       important. Chaque outil est maintenant une fiche à trois temps, dans
       l'ordre où l'on y répond : ce qu'est l'outil, ce qu'on lui confie, qui
       l'a validé. Le liseré de la fiche prend la couleur de son statut, et la
       catégorie 3 — interdite — se voit d'un coup d'œil. */
    etape === 2 && h('div', { className: 'charte-etape' },
      h('p', { className: 'charte-intro' },
        'Tout outil non inscrit ici est réputé interdit par l’article 5.3. '
        + 'Chaque fournisseur inscrit reçoit sa fiche de validation en annexe 2.'),

      outils.length
        ? h('div', { className: 'charte-outils' },
          outils.map((o, i) => h(CharteOutilFiche, {
            key: i,
            rang: i + 1,
            outil: o,
            onChamp: (cle, v) => majOutil(i, cle, v),
            onRetirer: () => setForm(f => Object.assign({}, f, {
              outils: (f.outils || []).filter((_, j) => j !== i),
            })),
          }))
        )
        : h('div', { className: 'charte-registre-vide' },
          h('span', { className: 'charte-registre-vide-marque' }, '🚫'),
          h('h3', null, 'Aucun outil inscrit'),
          h('p', null,
            'Tant que ce registre est vide, l’article 5.3 interdit tout usage '
            + 'professionnel d’un système d’IA au sein du cabinet.')
        ),

      h('button', {
        className: 'btn btn-accent btn-lg charte-ajouter', type: 'button',
        onClick: () => setForm(f => Object.assign({}, f, {
          outils: (f.outils || []).concat([charteIaOutilVide()]),
        })),
      }, '+ Inscrire un outil au registre')
    ),

    etape === 3 && h('div', { className: 'charte-etape' },
      h('div', { className: 'param-colonnes' },
        h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe' },
          h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Ce que vous ajoutez')),
          h('div', { className: 'param-champs' },
            h(ChampPanneau, {
              label: 'Précisions propres au cabinet', lignes: 5,
              aide: 'Facultatif. Ce texte figure après l’article 15, sous son propre titre.',
              valeur: form.complements || '', onChange: v => maj('complements', v),
            })
          )
        ),
        h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit' },
          h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Avant de signer')),
          manquesEnCours.length
            ? h('ul', { className: 'charte-manques', style: { marginTop: 0 } },
              manquesEnCours.map((m, i) => h('li', { key: i }, m)))
            : h('p', { className: 'bloc-carte-note' },
              'Tout est renseigné : les quinze articles, les deux annexes et les '
              + 'mentions du cabinet.'),
          h('p', { className: 'charte-annexes' },
            `Le document comptera ${CHARTE_IA_ARTICLES.length} articles, la matrice `
            + 'données / outils, le tableau de revue par domaine et deux annexes.')
        )
      )
    ),

    h('div', { className: 'wizard-footer' },
      h('button', {
        className: 'btn btn-secondary',
        onClick: () => (etape === 1 ? onFermer() : setEtape(etape - 1)),
      }, etape === 1 ? 'Annuler' : '← Retour'),
      etape < CHARTE_IA_ETAPES.length
        ? h('button', { className: 'btn btn-primary', onClick: () => setEtape(etape + 1) },
          'Continuer →')
        : h('button', { className: 'btn btn-primary', onClick: enregistrer },
          charte ? 'Enregistrer' : 'Créer la charte')
    )
  );
}

/* La fiche d'un outil inscrit au registre.

   Trois temps, dans l'ordre où l'on y répond : ce qu'est l'outil, ce qu'on lui
   confie, qui l'a validé et quand. Le liseré gauche prend la couleur du
   statut, et la catégorie 3 — interdite par l'article 5.3 — teinte la fiche :
   un outil interdit inscrit au registre doit se voir sans être relu. */
function CharteOutilFiche({ rang, outil, onChamp, onRetirer }) {
  const par = c => CHARTE_IA_REGISTRE_COLONNES.find(x => x.cle === c);
  const listeDe = c => (c.listeCabinet
    ? dbCollaborateursTous().map(p => ({ code: p.nom, label: p.nom }))
    : c.liste);

  const champ = (cle, extra) => {
    const c = par(cle);
    const liste = listeDe(c);
    if (c.multiple) {
      /* Le panneau porte déjà l'intitulé « À quoi il sert » : le répéter
         au-dessus des cases ferait lire deux fois la même chose. */
      return h(CasesPanneau, {
        label: (extra && extra.label !== undefined) ? extra.label : c.label,
        aide: c.aide, libre: !!c.libre, options: liste,
        valeurs: outil[c.cle], onChange: v => onChamp(c.cle, v),
      });
    }
    if (!liste) {
      return h(ChampPanneau, Object.assign({
        label: c.label, type: c.type, aide: c.aide,
        valeur: outil[c.cle] || '', onChange: v => onChamp(c.cle, v),
      }, extra || {}));
    }
    return h(ListePanneau, {
      label: c.label, aide: c.aide, libre: !!c.libre, options: liste,
      valeur: outil[c.cle] || '', onChange: v => onChamp(c.cle, v),
    });
  };

  const statut = String(outil.statut || '').trim();
  const tonStatut = statut === 'En production' ? 'vert'
    : statut === 'En test' ? 'ambre'
      : statut === 'Retiré' ? 'gris' : 'neutre';
  const nom = String(outil.outil || '').trim();
  const fournisseur = String(outil.fournisseur || '').trim();
  const interdit = String(outil.categorie || '') === '3';

  return h('article', {
    className: cx('charte-outil', 'statut-' + tonStatut, interdit && 'outil-interdit'),
  },
    h('header', { className: 'charte-outil-tete' },
      h('span', { className: 'charte-outil-rang' }, rang),
      h('div', { className: 'charte-outil-identite' },
        h('span', { className: 'charte-outil-nom' }, nom || 'Outil à nommer'),
        fournisseur ? h('span', { className: 'charte-outil-fournisseur' }, fournisseur) : null
      ),
      statut ? h('span', { className: cx('charte-outil-statut', 'ton-' + tonStatut) }, statut) : null,
      interdit ? h('span', { className: 'charte-outil-interdit' }, 'Usage interdit — art. 5.3') : null,
      h('button', {
        className: 'lien-discret charte-outil-retirer', type: 'button', onClick: onRetirer,
      }, 'Retirer')
    ),

    /* Quatre panneaux, dans l'ordre des questions : ce qu'est l'outil, à quoi
       il sert, ce qu'on a le droit de lui confier, qui l'a validé. À trois
       panneaux, celui du milieu en portait cinq réponses et la fiche dépassait
       de cent trente pixels — la catégorie, qui décide de tout le reste,
       passait sous le bord de la fenêtre. Mesuré à 1366 × 768. */
    h('div', { className: 'charte-outil-corps' },
      h('div', { className: 'charte-outil-pan' },
        h('h4', { className: 'charte-outil-pan-titre' }, 'L’outil'),
        champ('outil'),
        champ('fournisseur')
      ),
      h('div', { className: 'charte-outil-pan' },
        h('h4', { className: 'charte-outil-pan-titre' }, 'À quoi il sert'),
        champ('usage', { label: null })
      ),
      h('div', { className: 'charte-outil-pan' },
        h('h4', { className: 'charte-outil-pan-titre' }, 'Ce qu’on lui confie'),
        champ('categorie'),
        champ('niveau')
      ),
      h('div', { className: 'charte-outil-pan' },
        h('h4', { className: 'charte-outil-pan-titre' }, 'La validation'),
        champ('validePar'),
        champ('valideLe'),
        champ('statut')
      )
    )
  );
}

/* Ce qui manque pour que la charte soit opposable. Dire « charte disponible »
   sur un document dont le référent n'est pas nommé serait afficher « à jour »
   ce qui ne l'est pas. */
function charteIaManques(charte) {
  const manques = [];
  CHARTE_IA_VARIABLES.forEach(v => {
    /* Un champ déclaré sans objet n'est pas un manque : c'est une réponse. */
    if (v.sansObjet && charte[v.sansObjet]) return;
    if (!String(charte[v.cle] || '').trim()) manques.push(`${v.label} : non renseigné.`);
  });
  if (!((charte.outils || []).length)) {
    manques.push('Registre des outils (annexe 1) : aucun outil inscrit. L’article 5 y renvoie.');
  } else {
    /* Une ligne du registre sans nom, sans catégorie ou sans niveau n'oppose
       rien à un contrôleur : elle est signalée, ligne par ligne. */
    const vide = v => !String(v || '').trim();
    (charte.outils || []).forEach((o, i) => {
      const a = [];
      if (vide(o.outil)) a.push('l’outil');
      if (!((o.usage || []).filter(u => String(u || '').trim()).length)) a.push('l’usage');
      if (vide(o.categorie)) a.push('la catégorie');
      if (vide(o.niveau)) a.push('le niveau de données');
      if (vide(o.statut)) a.push('le statut');
      if (a.length) manques.push(`Registre, outil ${i + 1} : ${a.join(', ')} à renseigner.`);
    });
  }
  return manques;
}

/* La valeur d'une colonne du registre, telle qu'elle se lit : une date en
   toutes lettres, une liste d'usages séparée par des virgules, un tiret quand
   la case est vide. Le document Word et l'écran passent par ici, pour qu'ils
   ne disent jamais deux choses différentes de la même case. */
function charteIaValeurLisible(valeur, colonne) {
  if (Array.isArray(valeur)) {
    const propres = valeur.map(v => String(v || '').trim()).filter(Boolean);
    return propres.length ? propres.join(', ') : '—';
  }
  const texte = String(valeur === null || valeur === undefined ? '' : valeur).trim();
  if (!texte) return '—';
  return colonne && colonne.type === 'date' ? formatDateLong(texte) : texte;
}

/* Une ligne vierge du registre des outils. */
function charteIaOutilVide() {
  const l = {};
  /* Rien de pré-coché, pas même le statut : une ligne du registre qui
     s'ouvrirait sur « catégorie 1, en production » affirmerait une validation
     que personne n'a faite. */
  CHARTE_IA_REGISTRE_COLONNES.forEach(c => { l[c.cle] = c.multiple ? [] : ''; });
  return l;
}

/* La ville lue dans l'adresse du cabinet : le dernier segment qui porte un
   code postal. Rien de deviné au-delà — si l'adresse n'en contient pas, le
   champ reste vide et se saisit. */
function villeDeLAdresse(adresse) {
  const m = String(adresse || '').match(/\b\d{5}\s+([^,\n]+)/);
  return m ? m[1].trim() : '';
}

/* -------------------------------------------- Génération du document Word */

function charteIaRemplacer(texte, charte) {
  return String(texte).replace(/\{\{(\w+)\}\}/g, (tout, cle) => {
    const v = charte[cle];
    if (!v) return '…';
    const champ = CHARTE_IA_VARIABLES.find(x => x.cle === cle);
    return champ && champ.type === 'date' ? formatDateLong(v) : String(v);
  });
}

function charteIaTableau(entetes, lignes) {
  const th = entetes.map(e =>
    `<th style="border:1px solid #BBB; padding:5pt; background:#EEF2F8; text-align:left; font-size:9.5pt;">${docxEchapper(e)}</th>`).join('');
  const tr = lignes.map(l => '<tr>' + l.map(c =>
    `<td style="border:1px solid #BBB; padding:5pt; font-size:9.5pt; vertical-align:top;">${docxEchapper(c)}</td>`).join('') + '</tr>').join('');
  return `<table style="border-collapse:collapse; width:100%; margin:8pt 0;"><tr>${th}</tr>${tr}</table>`;
}

function charteIaBloc(bloc, charte) {
  if (bloc.type === 'sous') {
    return `<h3 style="font-size:11pt; margin:12pt 0 4pt;">${docxEchapper(bloc.texte)}</h3>`;
  }
  if (bloc.type === 'p') {
    return `<p style="text-align:justify; margin:0 0 6pt;">${docxEchapper(charteIaRemplacer(bloc.texte, charte))}</p>`;
  }
  if (bloc.type === 'liste') {
    return '<ul>' + bloc.items.map(i =>
      `<li style="text-align:justify; margin:0 0 4pt;">${docxEchapper(charteIaRemplacer(i, charte))}</li>`).join('') + '</ul>';
  }
  if (bloc.type === 'references') {
    return charteIaTableau(['Texte', 'Apport pour la présente charte'],
      CHARTE_IA_REFERENCES.map(r => [r.texte, r.apport]));
  }
  if (bloc.type === 'matrice') {
    return charteIaTableau(['Niveau', 'Exemples', 'Cat. 1', 'Cat. 2', 'Cat. 3'],
      CHARTE_IA_NIVEAUX.map(n => [`${n.code} — ${n.label}`, n.exemples, n.cat1, n.cat2, n.cat3]));
  }
  if (bloc.type === 'revues') {
    return charteIaTableau(['Domaine', 'Exemples d’usage', 'Revue minimale requise'],
      CHARTE_IA_REVUES.map(r => [r.domaine, r.usage, r.revue]));
  }
  return '';
}

function telechargerCharteIa(charte, cabinetSettings) {
  const cab = cabinetSettings || {};
  const nomCabinet = cab.nom || '';

  const enTete = charteIaTableau(['Référence', 'Valeur'], [
    ['Version', 'établie le ' + formatDateLong(charte.majLe)],
    ['Date d’adoption', charte.dateAdoption ? formatDateLong(charte.dateAdoption) : '…'],
    ['Entrée en vigueur', charte.dateEntreeVigueur ? formatDateLong(charte.dateEntreeVigueur) : '…'],
    ['Approbation', charte.approbateur || '…'],
    ['Référent IA', charte.referent || '…'],
    ['Diffusion', 'Ensemble du personnel du cabinet, par courriel'],
    ['Prochaine revue', charte.dateProchaineRevue ? formatDateLong(charte.dateProchaineRevue) : '…'],
  ]);

  const preambule = `<h2 style="font-size:12pt; margin-top:16pt;">Préambule</h2>
    <p style="text-align:justify; margin:0 0 6pt;">${docxEchapper(CHARTE_IA_PREAMBULE.ouverture)}</p>
    <p style="text-align:justify; margin:0 0 6pt;">Quatre constats s’imposent :</p>
    <ul>${CHARTE_IA_PREAMBULE.constats.map(c =>
      `<li style="text-align:justify; margin:0 0 4pt;">${docxEchapper(c)}</li>`).join('')}</ul>
    <p style="text-align:justify; margin:0 0 6pt;">${docxEchapper(CHARTE_IA_PREAMBULE.cloture)}</p>`;

  const articles = CHARTE_IA_ARTICLES.map(a =>
    `<h2 style="font-size:12pt; margin-top:16pt;">Article ${a.numero} — ${docxEchapper(a.titre)}</h2>`
    + a.blocs.map(b => charteIaBloc(b, charte)).join('')).join('');

  const outils = charte.outils || [];
  const annexe1 = `<h2 style="font-size:12pt; margin-top:20pt;">Annexe 1 — Registre des outils d’IA</h2>
    <p style="text-align:justify; margin:0 0 6pt;">Le registre est tenu à jour par le référent IA. Les outils ci-après ont été validés par l’associé aux dates indiquées.</p>`
    + (outils.length
      ? charteIaTableau(CHARTE_IA_REGISTRE_COLONNES.map(c => c.label),
        outils.map(o => CHARTE_IA_REGISTRE_COLONNES.map(c =>
          charteIaValeurLisible(o[c.cle], c))))
      : '<p style="margin:0 0 6pt;"><b>Aucun outil n’est inscrit au registre à ce jour.</b> Tant qu’il en est ainsi, l’article 5.3 interdit tout usage professionnel d’un système d’IA au sein du cabinet.</p>');

  /* Une fiche par fournisseur réellement inscrit au registre. La grille est
     fournie ; le constat et la source consultée sont l'affaire du référent,
     qui les vérifie sur les documents contractuels et les date. */
  const fournisseurs = [];
  outils.forEach(o => {
    const f = String(o.fournisseur || '').trim();
    if (f && fournisseurs.indexOf(f) === -1) fournisseurs.push(f);
  });
  const annexe2 = `<h2 style="font-size:12pt; margin-top:20pt;">Annexe 2 — Fiches de validation des fournisseurs</h2>`
    + (fournisseurs.length
      ? fournisseurs.map(f =>
        `<h3 style="font-size:11pt; margin:12pt 0 4pt;">${docxEchapper(f)}</h3>`
        + charteIaTableau(['Critère (art. 5.1)', 'Constat', 'Source consultée et date'],
          CHARTE_IA_FICHE_CRITERES.map(c => [c, '', '']))).join('')
      : '<p style="margin:0 0 6pt;">Aucun fournisseur inscrit au registre : aucune fiche à établir.</p>');

  downloadWordDoc('Charte_utilisation_IA.doc', 'Charte d’utilisation de l’IA',
    `<h1 style="font-size:17pt;">Charte d’utilisation de l’intelligence artificielle</h1>
     <p style="font-size:10pt; color:#666; margin:0 0 4pt;">${docxEchapper(nomCabinet)}</p>
     <p style="font-size:9.5pt; color:#666; margin:0 0 12pt;">Document relevant du système de maîtrise de la qualité du cabinet.</p>
     ${enTete}
     ${preambule}
     ${articles}
     ${charte.complements
      ? `<h2 style="font-size:12pt; margin-top:16pt;">Précisions propres au cabinet</h2><p style="text-align:justify;">${docxEchapper(charte.complements)}</p>`
      : ''}
     <p style="margin-top:16pt;">Adoptée${charte.ville ? ' à ' + docxEchapper(charte.ville) : ''}${charte.dateAdoption ? ', le ' + formatDateLong(charte.dateAdoption) : ''}${charte.approbateur ? ', par ' + docxEchapper(charte.approbateur) : ''}.</p>
     <p style="margin:0 0 6pt;">Signature :</p>
     ${annexe1}
     ${annexe2}`);
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

  /* Le registre des traitements a été retiré : l'adresse existe encore dans
     d'anciens liens, elle mène désormais à ce qui l'a remplacé. */
  if (sub === 'traitements') return h(RgpdPrestataires, { onBack: retour, showToast, navigateEc });
  if (sub === 'prestataires') return h(RgpdPrestataires, { onBack: retour, showToast, navigateEc });
  if (sub === 'mesures') return h(RgpdPrestataires, { onBack: retour, showToast, navigateEc, vue: 'mesures' });

  const aConfirmer = prestatairesAConfirmer().length;

  return h('div', { className: 'page' },
    h(EnteteHub, { titre: 'RGPD & données', onRetour: () => navigateEc('ressources', null) }),
    h(ThemeHub, { cartes: [
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
