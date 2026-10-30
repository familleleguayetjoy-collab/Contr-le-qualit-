// ComplyEC — régularisation dossier par dossier, avec le Drive en lecture
'use strict';

/* La régularisation du portefeuille existant (plan, P2 ch. 2 S1).

   Un dossier à la fois : à gauche la liste des dossiers et ce qui reste à
   régulariser, à droite les pièces attendues par le référentiel et, si le
   Drive est raccordé en lecture, les fichiers du dossier client. Pour chaque
   pièce, trois gestes : rattacher le fichier qui la prouve, la pointer
   « présente au dossier », ou la déclarer sans objet (avec un motif).

   Automatisation ciblée, validation humaine : ComplyEC PROPOSE le fichier qui
   ressemble à la pièce attendue (d'après son nom), il ne le rattache jamais
   seul. Qu'on retienne ou non la proposition est enregistré : c'est la mesure
   de la justesse de l'automatisation.

   Rien n'est écrit dans le Drive : la lecture se fait par la fonction serveur
   drive-lecture (portée « lecture seule »). */

/* Ce qui, dans un nom de fichier ou de dossier, fait penser à une pièce. Une
   proposition, jamais une preuve : l'écran le dit. Les motifs sont lus sur le
   chemin sans accents ni ponctuation : un fichier venu d'un Mac écrit
   « synthèse » autrement qu'un fichier venu de Windows.
   Les motifs ont leur propre version, gardée avec chaque rattachement : si on
   les corrige en cours de pilote, on sait quelle version a proposé quoi. */
const SUGGESTIONS_VERSION = '1.0';
const SUGGESTIONS_FICHIERS = {
  lettre_mission_absente: /lettre ?de ?mission|\bldm\b|\blm\b|mission ?sign/,
  identite_absente: /\bcni\b|identite|passeport|titre ?de ?sejour/,
  rbe_justificatif_absent: /\brbe\b|beneficiaires? ?effectifs?|\bdbe\b/,
  note_synthese_absente: /synthese/,
  note_synthese_non_supervisee: /supervis|revue ?ec|\bvisa\b/,
  vigilance_absente: /vigilance|\bkyc\b|connaissance ?client/,
  ppe_attestation_absente: /\bppe\b|politiquement ?expos/,
};

function normaliserTexte(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

/* Le dossier du Drive qui porte le nom du client (ou son SIREN). */
function dossierDriveProbable(client, dossiers) {
  const nom = normaliserTexte(client.nom).replace(/\b(sarl|sas|sasu|sci|eurl|sa|snc|scm|selarl|selas)\b/g, '').trim();
  const siren = String(client.siret || '').replace(/\D/g, '').slice(0, 9);
  return (dossiers || []).find(d => siren.length === 9 && String(d.nom).replace(/\D/g, '').indexOf(siren) >= 0)
    || (dossiers || []).find(d => nom && normaliserTexte(d.nom).indexOf(nom) >= 0)
    || (dossiers || []).find(d => nom && nom.indexOf(normaliserTexte(d.nom)) >= 0 && normaliserTexte(d.nom).length > 3)
    || null;
}

/* Le nom du fichier d'abord ; le dossier qui le contient ensuite, et
   seulement si le nom n'évoque pas une autre pièce : « Lettre de
   mission/CNI.pdf » est une pièce d'identité, pas une lettre de mission. */
function fichierPropose(type, fichiers) {
  const motif = SUGGESTIONS_FICHIERS[type];
  if (!motif) return null;
  const autres = Object.keys(SUGGESTIONS_FICHIERS).filter(t => t !== type).map(t => SUGGESTIONS_FICHIERS[t]);
  const parNom = (fichiers || []).filter(f => motif.test(normaliserTexte(f.nom)));
  const candidats = parNom.length ? parNom : (fichiers || []).filter(f => motif.test(normaliserTexte(f.chemin))
    && !autres.some(m => m.test(normaliserTexte(f.nom))));
  // Le plus récent d'abord : une lettre de mission refaite remplace l'ancienne.
  return candidats.sort((a, b) => String(b.modifie || '').localeCompare(String(a.modifie || '')))[0] || null;
}

// ----------------------------------------------------------- accès au Drive

/* En démonstration, le Drive est fictif et l'écran le dit : une arborescence
   type, bâtie sur les dossiers de démonstration, pour essayer les gestes sans
   rien raccorder. Aucun de ces fichiers n'existe. */
const DRIVE_DEMO_RACINE = 'Drive de démonstration (fichiers fictifs)';
const DRIVE_DEMO_FICHIERS = [
  '01 Juridique/Statuts à jour.pdf',
  '02 Mission/Lettre de mission signée.pdf',
  '03 LCB-FT/CNI du dirigeant.pdf',
  '03 LCB-FT/Extrait RBE.pdf',
  '03 LCB-FT/Fiche vigilance.xlsx',
  '04 Exercice/Note de synthèse.docx',
  '04 Exercice/Bilan.pdf',
  '05 Correspondance/Courrier client.pdf',
];

function driveDemo(action, params) {
  const dossiers = reglesDossiers().map(c => ({
    id: 'demo-' + c.id,
    nom: String(c.nom).toUpperCase() + (String(c.siret || '').replace(/\D/g, '').length >= 9 ? ' - ' + String(c.siret).replace(/\D/g, '').slice(0, 9) : ''),
  })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  if (action === 'tester') return { racine: DRIVE_DEMO_RACINE, dossiers: dossiers.length, compte: 'démonstration', demo: true };
  if (action === 'dossiers') return { dossiers };
  if (action === 'fichiers') {
    const id = String((params || {}).dossierId || '');
    // Une pièce sur trois manque, toujours la même pour un même dossier.
    let graine = 0;
    for (let i = 0; i < id.length; i++) graine = (graine * 31 + id.charCodeAt(i)) % 997;
    const fichiers = DRIVE_DEMO_FICHIERS.filter((c, i) => i >= 6 || (graine + i) % 3 !== 0).map((chemin, i) => ({
      id: id + '-' + i, nom: chemin.split('/').pop(), chemin, type: 'application/octet-stream', modifie: '2026-06-30T09:00:00Z', lien: null,
    }));
    return { fichiers, tronque: false };
  }
  throw new Error('Action inconnue.');
}

async function driveLecture(action, params) {
  if (!modeCabinetReel()) return driveDemo(action, params);
  const { data, error } = await supabaseClient.functions.invoke('drive-lecture', { body: Object.assign({ action }, params || {}) });
  if (error) throw new Error(messageFonctionServeur(error, 'Le Drive n’a pas répondu.'));
  if (data && data.error) throw new Error(data.error);
  return data;
}

function dbDriveDossiers() { return demoLireEtat().driveDossiers || {}; }

async function dbAssocierDossierDrive(clientId, dossier) {
  demoMuter(e => { e.driveDossiers = Object.assign({}, e.driveDossiers, { [clientId]: dossier ? { id: dossier.id, nom: dossier.nom } : null }); });
  return true;
}

/* La table de correspondance documentaire telle que la régularisation l'a
   révélée (plan, P2 ch. 1 S2 §2) : pour chaque pièce rattachée, la règle et
   l'emplacement du fichier dans le dossier client. Le nom du client est
   remplacé par <CLIENT> : la table décrit le classement du cabinet, pas un
   dossier. */
function exporterCorrespondance() {
  const regs = dbRegularisations();
  const lignes = Object.keys(regs).filter(k => regs[k].preuve && regs[k].preuve.source === 'drive').map(k => {
    const [type, dossierId] = k.split('|');
    const r = typeof regleDuType === 'function' ? regleDuType(type) : null;
    const c = client(dossierId) || {};
    const p = regs[k].preuve;
    const masque = s => {
      let t = String(s || '');
      [c.nom, normaliserTexte(c.nom)].filter(Boolean).forEach(n => { t = t.split(n).join('<CLIENT>'); });
      return t;
    };
    return [r ? r.code : '', r ? r.diligence : type, masque(p.chemin), p.suggere ? (p.suggestionRetenue ? 'oui' : 'non') : 'sans proposition',
      regs[k].le, regs[k].version || '', p.suggestionsVersion || ''];
  });
  const entetes = ['regle', 'diligence', 'emplacement dans le dossier client', 'proposition de ComplyEC retenue', 'rattachee_le', 'version_regle', 'version_propositions'];
  const csv = [entetes].concat(lignes).map(l => l.map(csvCellule).join(';')).join('\n');
  return telechargerTexte(`ComplyEC_correspondance_documentaire_${aujourdhuiIso()}.csv`, csv, 'text/csv;charset=utf-8');
}

// ------------------------------------------------------------------- écran

const DRIVE_ETAT = { teste: null, dossiers: null, fichiers: {} }; // mémoire de la session, rien n'est conservé

function LigneRegle({ ligne, regle, client: c, fichiers, showToast }) {
  const regs = dbRegularisations();
  const reg = regs[ligne.cle];
  const propose = fichierPropose(ligne.type, fichiers);
  const [choix, setChoix] = useState(propose ? propose.id : '');
  const [motif, setMotif] = useState(null);
  useEffect(() => { if (propose && !choix) setChoix(propose.id); }, [propose && propose.id]);
  const libelle = `${regle.diligence} — ${c.nom}`;
  const choisi = (fichiers || []).find(x => x.id === choix) || null;

  async function rattacher() {
    const f = (fichiers || []).find(x => x.id === choix);
    if (!f) return;
    await dbMarquerRegularise(ligne.cle, `${libelle} — pièce : ${f.chemin}`, 'piece', null, {
      source: 'drive', id: f.id, nom: f.nom, chemin: f.chemin, modifie: f.modifie || null,
      suggere: !!propose, suggestionRetenue: !!propose && propose.id === f.id, suggestionsVersion: SUGGESTIONS_VERSION,
    });
    showToast('Pièce rattachée.');
  }

  let etat;
  if (ligne.satisfaite) etat = h('span', { className: 'regul-etat ok' }, '✓ Fait dans ComplyEC');
  else if (reg && reg.nature === 'sans_objet') etat = h('span', { className: 'regul-etat neutre' }, `Sans objet — ${reg.motif || ''}`);
  else if (reg) {
    etat = h('span', { className: 'regul-etat ok' }, '✓ ',
      reg.preuve ? `Pièce : ${reg.preuve.chemin}` : (NATURES_REGULARISATION[reg.nature] || 'Régularisée'),
      ` — le ${formatDate(reg.le)}`);
  } else etat = h('span', { className: 'regul-etat a-faire' }, 'À régulariser');

  return h('li', { className: cx('regul-ligne', (ligne.satisfaite || reg) && 'faite') },
    h('div', { className: 'regul-ligne-tete' },
      h('span', { className: 'regul-regle' }, regle.code),
      h('span', { className: 'regul-texte' },
        h('strong', null, regle.diligence),
        h('span', { className: 'regul-preuve' }, regle.preuve)),
      etat),
    ligne.satisfaite ? null : (reg
      ? h('div', { className: 'regul-actions' },
        h('button', { className: 'btn btn-tertiaire btn-sm', onClick: async () => { await dbAnnulerRegularisation(ligne.cle); showToast('Régularisation annulée.'); } }, 'Annuler'))
      : h('div', { className: 'regul-actions' },
        fichiers && fichiers.length
          ? h(React.Fragment, null,
            h('select', {
              className: 'champ-saisie regul-fichier', value: choix, 'aria-label': `Fichier qui prouve : ${regle.diligence}`,
              onChange: e => setChoix(e.target.value),
            },
              h('option', { value: '' }, '— choisir le fichier qui la prouve —'),
              propose ? h('option', { value: propose.id }, `Proposé : ${propose.chemin}`) : null,
              fichiers.filter(f => !propose || f.id !== propose.id).map(f => h('option', { key: f.id, value: f.id }, f.chemin))),
            /* « Vérifiez la pièce » suppose de pouvoir l'ouvrir : le lien mène
               au Drive, avec le compte Google de l'expert-comptable. */
            choisi && choisi.lien
              ? h('a', { className: 'btn btn-secondary btn-sm', href: choisi.lien, target: '_blank', rel: 'noopener noreferrer' }, 'Ouvrir le fichier')
              : null,
            h('button', { className: 'btn btn-primary btn-sm', disabled: !choix, onClick: rattacher }, 'Rattacher'),
            choisi ? h('span', { className: 'regul-choix-chemin' }, choisi.chemin) : null)
          : null,
        h('button', {
          className: 'btn btn-secondary btn-sm',
          onClick: async () => { await dbMarquerRegularise(ligne.cle, `${libelle} — présente au dossier`, 'pointage'); showToast('Pointée présente au dossier.'); },
        }, 'Présente au dossier'),
        motif === null
          ? h('button', { className: 'btn btn-tertiaire btn-sm', onClick: () => setMotif('') }, 'Sans objet…')
          : h(React.Fragment, null,
            h('select', { className: 'champ-saisie', value: motif, onChange: e => setMotif(e.target.value), 'aria-label': 'Motif' },
              h('option', { value: '' }, '— motif —'),
              ((MOTIFS_SANS_OBJET || {})[ligne.type] || []).concat(MOTIFS_COMMUNS || []).filter(m => m !== 'Autre (préciser)')
                .map(m => h('option', { key: m, value: m }, m))),
            h('button', {
              className: 'btn btn-secondary btn-sm', disabled: !motif,
              onClick: async () => { await dbMarquerRegularise(ligne.cle, `${libelle} — sans objet`, 'sans_objet', motif); setMotif(null); showToast('Classée sans objet.'); },
            }, 'Valider')))));
}

/* Avant toute régularisation, l'état de départ : sans lui, le pilote ne
   mesure plus rien. En données réelles, l'écran le demande d'abord, en un
   clic. */
function RegularisationAvantT0({ vers, onRetour, showToast }) {
  const [enCours, setEnCours] = useState(false);
  return h(RubriquePage, { titre: 'Régularisation, dossier par dossier', retour: h(RetourHub, { vers, onRetour }) },
    h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit regul-t0' },
      h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'D’abord : figer l’état de départ')),
      h('p', null, 'L’état de départ est la photographie du portefeuille avant toute régularisation. '
        + 'C’est à lui que le pilote sera comparé : une fois des pièces rattachées, on ne peut plus le reconstituer.'),
      CLIENTS.length
        ? h('button', {
          className: 'btn btn-primary', disabled: enCours,
          onClick: async () => { setEnCours(true); await figerEtatDepart(); showToast('État de départ figé : vous pouvez régulariser.'); },
        }, enCours ? 'Enregistrement…' : 'Figer l’état de départ maintenant')
        : h('p', { className: 'pilote-blocage' }, 'Importez d’abord la liste des clients (Paramètres › Mise en service et pilote).')));
}

function RegularisationDossiers({ onRetour, showToast, vers }) {
  useDonnees();
  vers = vers || 'Mise en service et pilote';
  if (modeCabinetReel() && !(demoLireEtat().pilote || {}).etatDepart) return h(RegularisationAvantT0, { vers, onRetour, showToast });
  return h(RegularisationEcran, { vers, onRetour, showToast });
}

function RegularisationEcran({ onRetour, showToast, vers }) {
  useDonnees();
  const [recherche, setRecherche] = useState('');
  const [seulsAFaire, setSeulsAFaire] = useState(true);
  const [choisi, setChoisi] = useState(null);
  const [drive, setDrive] = useState({ etat: DRIVE_ETAT.teste ? 'ok' : 'inconnu', message: null });
  const [, redessiner] = useState(0);
  const evaluation = reglesEvaluer();
  const regs = dbRegularisations();
  const ouvertes = id => evaluation.filter(l => l.dossier === id && !l.satisfaite && !regs[l.cle]).length;
  const dossiers = reglesDossiers()
    .filter(c => !recherche || normaliserTexte(c.nom).indexOf(normaliserTexte(recherche)) >= 0)
    .filter(c => !seulsAFaire || ouvertes(c.id) > 0 || (choisi && choisi === c.id))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const c = choisi ? client(choisi) : null;
  const assoc = c ? dbDriveDossiers()[c.id] : null;
  const fichiers = assoc ? DRIVE_ETAT.fichiers[assoc.id] : null;

  async function raccorder() {
    setDrive({ etat: 'test', message: null });
    try {
      const t = await driveLecture('tester');
      DRIVE_ETAT.teste = t;
      DRIVE_ETAT.dossiers = (await driveLecture('dossiers')).dossiers;
      setDrive({ etat: 'ok', message: t.demo
        ? `Démonstration : ${t.dossiers} ${pluriel(t.dossiers, 'dossier fictif', 'dossiers fictifs')}, aucun fichier réel n’est lu.`
        : `Drive lu en lecture seule : « ${t.racine} », ${t.dossiers} ${pluriel(t.dossiers, 'dossier client', 'dossiers clients')}. Rien n’y est modifié.` });
    } catch (e) {
      setDrive({ etat: 'erreur', message: e.message });
    }
  }

  async function chargerFichiers(dossier) {
    if (!dossier) return;
    try {
      const r = await driveLecture('fichiers', { dossierId: dossier.id });
      DRIVE_ETAT.fichiers[dossier.id] = r.fichiers || [];
      redessiner(n => n + 1);
    } catch (e) { showToast(e.message); }
  }

  // Le dossier du Drive se propose tout seul la première fois, puis se
  // charge : un clic de moins par dossier, sur trente dossiers.
  useEffect(() => {
    if (!c || !DRIVE_ETAT.dossiers) return;
    const a = dbDriveDossiers()[c.id];
    if (a) { if (!DRIVE_ETAT.fichiers[a.id]) chargerFichiers(a); return; }
    const probable = dossierDriveProbable(c, DRIVE_ETAT.dossiers);
    if (probable) dbAssocierDossierDrive(c.id, probable).then(() => chargerFichiers(probable));
  }, [choisi, drive.etat]);

  const lignes = c ? evaluation.filter(l => l.dossier === c.id) : [];

  const rattachees = Object.keys(regs).filter(k => regs[k].preuve && regs[k].preuve.source === 'drive').length;

  return h(RubriquePage, {
    titre: 'Régularisation, dossier par dossier',
    retour: h(RetourHub, { vers, onRetour }),
    actions: h(React.Fragment, null,
      DRIVE_ETAT.teste
        ? h('span', { className: cx('regul-drive-ok', DRIVE_ETAT.teste.demo && 'demo') },
          DRIVE_ETAT.teste.demo ? '✓ Drive de démonstration : fichiers fictifs' : `✓ Drive lu : ${DRIVE_ETAT.teste.racine}`)
        : h('button', { className: 'btn btn-secondary', onClick: raccorder, disabled: drive.etat === 'test' },
          drive.etat === 'test' ? 'Connexion au Drive…' : (modeCabinetReel() ? 'Lire le Drive du cabinet' : 'Essayer avec un Drive fictif')),
      h('button', {
        className: 'btn btn-secondary', onClick: exporterCorrespondance, disabled: !rattachees,
        title: rattachees ? undefined : 'Aucune pièce rattachée depuis le Drive pour l’instant.',
      }, 'Exporter la correspondance')),
  },
    drive.message ? h('p', { className: cx('regul-message', drive.etat === 'erreur' && 'erreur') }, drive.message) : null,
    h('div', { className: 'regul-grille' },
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-nuit regul-liste' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, 'Dossiers'),
          h('span', { className: 'bloc-carte-compte' }, `${reglesDossiers().filter(x => ouvertes(x.id) > 0).length} à régulariser`)),
        h('div', { className: 'regul-filtres' },
          h('input', { className: 'champ-saisie', placeholder: 'Rechercher un dossier', value: recherche, onChange: e => setRecherche(e.target.value), 'aria-label': 'Rechercher un dossier' }),
          h('label', { className: 'case-ligne' },
            h('input', { type: 'checkbox', checked: seulsAFaire, onChange: () => setSeulsAFaire(!seulsAFaire) }),
            h('span', { className: 'case-texte' }, 'Seulement ceux à régulariser'))),
        dossiers.length
          ? h('ul', { className: 'regul-dossiers' }, dossiers.map(d => {
            const n = ouvertes(d.id);
            return h('li', { key: d.id },
              h('button', { type: 'button', className: cx('regul-dossier', choisi === d.id && 'actif'), onClick: () => setChoisi(d.id) },
                h('span', { className: 'regul-dossier-nom' }, d.nom),
                h('span', { className: 'regul-dossier-detail' }, `${d.forme || 'forme ?'} · ${personneNom(dbAttributionDossier(d.id)) || 'sans collaborateur'}`),
                h('span', { className: cx('regul-compte', !n && 'fait') }, n ? `${n} à faire` : '✓')));
          }))
          : h('p', { className: 'obligations-vide' }, reglesDossiers().length ? 'Aucun dossier ne correspond.' : 'Importez d’abord la liste des clients.')),
      h('section', { className: 'bloc-carte bloc-carte-bandeau teinte-menthe regul-detail' },
        h('header', { className: 'bloc-carte-entete' }, h('h2', null, c ? c.nom : 'Choisissez un dossier')),
        c ? h('div', { className: 'regul-corps' },
          DRIVE_ETAT.dossiers
            ? h('div', { className: 'regul-drive' },
              h('span', { className: 'champ-label' }, 'Dossier du client dans le Drive'),
              h('select', {
                className: 'champ-saisie', value: assoc ? assoc.id : '',
                onChange: e => {
                  const d = DRIVE_ETAT.dossiers.find(x => x.id === e.target.value) || null;
                  dbAssocierDossierDrive(c.id, d).then(() => d && chargerFichiers(d));
                },
              },
                h('option', { value: '' }, '— aucun —'),
                DRIVE_ETAT.dossiers.map(d => h('option', { key: d.id, value: d.id }, d.nom))),
              assoc && fichiers ? h('span', { className: 'regul-drive-compte' }, `${fichiers.length} ${pluriel(fichiers.length, 'fichier lu', 'fichiers lus')}`) : null)
            : h('p', { className: 'regul-message' }, modeCabinetReel()
              ? 'Drive non lu : pointez les pièces présentes au dossier, ou cliquez « Lire le Drive du cabinet » en haut à droite.'
              : 'Pointez les pièces présentes au dossier, ou cliquez « Essayer avec un Drive fictif » en haut à droite.'),
          fichiers ? h('p', { className: 'regul-avertissement' },
            'Les propositions viennent du nom des fichiers : vérifiez la pièce avant de la rattacher.') : null,
          h('ul', { className: 'regul-lignes' }, lignes.map(l => h(LigneRegle, {
            key: l.cle + (fichiers ? fichiers.length : 0), ligne: l, regle: REGLES.find(r => r.code === l.regle), client: c, fichiers, showToast,
          }))))
          : h('p', { className: 'obligations-vide regul-vide' }, 'À gauche, la liste des dossiers et ce qui reste à régulariser dans chacun.'))
    )
  );
}
