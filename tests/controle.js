/* Recette « contrôle » — les huit rubriques et leurs règles propres.
 *
 * Ce qu'elle vérifie, rubrique par rubrique :
 *   — le manuel tient en trois étapes, et ne demande ni le nombre de dossiers
 *     ni la date de clôture majoritaire des clients (§ 17) ;
 *   — l'indépendance tient en deux blocs, pas trois ;
 *   — le registre des formations est unique, avec un indicateur LCB-FT ;
 *   — la LCB-FT reprend les écrans existants et sépare « RBE consulté » du
 *     justificatif documentaire ;
 *   — la supervision ne connaît que deux situations et ne saisit rien ;
 *   — le programme annuel a six étapes, et l'échantillon comme l'évaluation y
 *     vivent — pas dans le menu ;
 *   — l'informatique a trois blocs, et aucun module « Sécurité informatique » ;
 *   — la synthèse affiche un pourcentage et au plus quatre urgences, jamais
 *     complétées artificiellement.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { RUBRIQUES_CONTROLE, allerOnglet, allerRubrique, allerCarte, revenirDuHub, allerFiltre, ouvrirEc } = require('./aller');

let anomalies = 0;
function verifie(nom, condition, detail) {
  if (condition) console.log('  ok     ' + nom);
  else { anomalies++; console.log('  ÉCHEC  ' + nom + (detail ? ' — ' + detail : '')); }
}

(async () => {
  const navigateur = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await ouvrirEc(navigateur);
  await allerOnglet(page, 'Préparer le contrôle');

  const menu = await page.locator('.nav-sous-item').allInnerTexts();
  verifie('huit rubriques, dans l’ordre du cahier',
    JSON.stringify(menu) === JSON.stringify(RUBRIQUES_CONTROLE), menu.join(' | '));
  verifie('aucune rubrique « Sécurité informatique »',
    !menu.some(t => /sécurité/i.test(t)), menu.join(' | '));
  verifie('ni échantillon, ni actions correctives, ni évaluation dans le menu',
    !menu.some(t => /échantillon|correctiv|évaluation/i.test(t)), menu.join(' | '));

  // ------------------------------------------------------------- Manuel
  await allerRubrique(page, 'Manuel de procédures');
  const etapes = await page.locator('.hub-carte-titre').allInnerTexts();
  verifie('le manuel ouvre un hub de trois cartes',
    JSON.stringify(etapes) === JSON.stringify(
      ['Cabinet et activité', 'Équipe', 'Organisation informatique et moyens']),
    etapes.join(' | '));
  await allerCarte(page, 'Cabinet et activité');
  verifie('une carte ouvre son écran, avec un retour nommé',
    (await page.locator('.retour-hub').innerText()).includes('Manuel de procédures'));
  const texteManuel = await page.locator('.controle-contenu').innerText();
  verifie('le nombre total de dossiers n’est pas demandé',
    !/nombre (total )?de dossiers\s*\*?\s*$/im.test(texteManuel)
    && !/nombre total de dossiers/i.test(texteManuel));
  verifie('la date de clôture majoritaire des clients n’est pas demandée',
    !/clôture majoritaire/i.test(texteManuel));
  const compte = await page.evaluate(() => ({
    total: dbNombreDeClients(),
    importes: dbClientsImportes().length,
    portefeuille: CLIENTS.length,
  }));
  verifie('le nombre de dossiers est compté, pas saisi',
    compte.total === (compte.importes || compte.portefeuille),
    JSON.stringify(compte));
  verifie('aucun champ ne demande ce nombre',
    !/nombre de dossiers/i.test(texteManuel));
  verifie('l’import de la liste clients est proposé',
    await page.getByRole('button', { name: /Importer un fichier Excel/ }).count() === 1);
  await revenirDuHub(page);
  verifie('le retour ramène au hub', await page.locator('.hub-carte').count() === 3);

  // --------------------------------------------------------- Indépendance
  await allerRubrique(page, 'Indépendance');
  const blocs = await page.locator('.hub-carte-titre').allInnerTexts();
  verifie('l’indépendance tient en deux cartes',
    JSON.stringify(blocs) === JSON.stringify(
      ['Attestations d’indépendance', 'Dépendance économique']), blocs.join(' | '));
  await allerCarte(page, 'Attestations d’indépendance');
  const colonnesIndep = (await page.locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('la campagne a les quatre colonnes du cahier',
    JSON.stringify(colonnesIndep) === JSON.stringify(['collaborateur', 'générée', 'relancée', 'reçue']),
    colonnesIndep.join(' | '));

  /* Une attestation revenue se consulte : le panneau reprend le texte signé et
     dit d'où vient l'information. Une attestation qu'on attend encore n'offre
     rien à ouvrir. */
  const aConsulter = await page.locator('.tableau-moderne tbody button', { hasText: 'Consulter' }).count();
  verifie('les attestations reçues s’ouvrent', aConsulter > 0, aConsulter + '');
  await page.locator('.tableau-moderne tbody button', { hasText: 'Consulter' }).first().click();
  await page.waitForTimeout(450);
  const lue = await page.locator('.attestation-lue').innerText();
  verifie('le panneau reprend le texte de la déclaration',
    lue.indexOf('Déclaration d’indépendance') >= 0
    && lue.indexOf('décret n° 2012-432 du 30 mars 2012') >= 0,
    lue.slice(0, 120));
  verifie('il dit où se trouve l’exemplaire signé',
    (await page.locator('.attestation-lue-signature').innerText()).indexOf('Retour enregistré') >= 0);
  await page.locator('.panneau-fermer').first().click();
  await page.waitForTimeout(300);

  await revenirDuHub(page);
  await allerCarte(page, 'Dépendance économique');
  /* La mention « démo » accolée à « % du CA » tant qu'aucun chiffre
     d'affaires n'est saisi n'est pas un intitulé de colonne : on la lit à
     part. */
  const demo = await page.locator('thead .dep-demo').count();
  verifie('la colonne du pourcentage signale la valeur de démonstration', demo === 1, demo + ' mention(s)');
  const colonnesDep = (await page.locator('thead th').evaluateAll(ths => ths.map(th => {
    const c = th.cloneNode(true);
    c.querySelectorAll('.dep-demo').forEach(e => e.remove());
    return c.innerText || c.textContent;
  }))).map(t => t.trim().toLowerCase());
  verifie('la dépendance a les quatre colonnes retenues',
    JSON.stringify(colonnesDep) === JSON.stringify(
      ['client ou groupe', 'honoraires', '% du ca', 'mesure de sauvegarde']),
    colonnesDep.join(' | '));

  // ----------------------------------------------------------- Formations
  await allerRubrique(page, 'Formations');
  const filtresForm = await page.locator('.filtre-interne').allInnerTexts();
  verifie('le registre des formations a quatre filtres',
    JSON.stringify(filtresForm) === JSON.stringify(['Toutes', 'Internes', 'Externes', 'LCB-FT']),
    filtresForm.join(' | '));
  verifie('les formations LCB-FT sont marquées dans le registre unique',
    await page.locator('.etiquette-lbcft').count() > 0);

  // --------------------------------------------------------------- LCB-FT
  await allerRubrique(page, 'LCB-FT');
  const vues = await page.locator('.hub-carte-titre').allInnerTexts();
  /* L'ordre est celui du travail depuis le 24 septembre : on sait d'abord qui
     est derrière le client, puis on regarde s'il est politiquement exposé,
     puis on en tire l'analyse. Les cartes sont numérotées et reliées. */
  verifie('la LCB-FT a cinq cartes, dans l’ordre du travail',
    JSON.stringify(vues) === JSON.stringify(['Registre RBE', 'Attestations PPE manquantes', 'Vigilance LCB-FT', 'Cartographie du cabinet', 'Autres vérifications']),
    vues.join(' | '));
  const rangsLbcft = await page.locator('.hub-carte-rang').allInnerTexts();
  verifie('chaque carte porte son rang',
    JSON.stringify(rangsLbcft) === JSON.stringify(['1', '2', '3', '4', '5']), rangsLbcft.join(' | '));
  verifie('une flèche relie chaque carte à la suivante',
    await page.locator('.hub-carte-fleche').count() === 4);
  await allerCarte(page, 'Registre RBE');
  const colonnesRbe = (await page.locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('le suivi RBE a les quatre colonnes du cahier',
    JSON.stringify(colonnesRbe) === JSON.stringify(['dossier', 'rbe consulté', 'consulté le', 'divergence']),
    colonnesRbe.join(' | '));
  /* La donnée métier et l'anomalie documentaire sont deux choses distinctes :
     un registre consulté sans justificatif classé est précisément ce qu'un
     contrôleur relève. */
  const separation = await page.evaluate(() => {
    const consultes = dbSuiviRbe().filter(l => l.consulteLe).map(l => l.dossier).sort();
    const sansJustif = anomaliesDeLOnglet('rbe').map(a => a.dossier).sort();
    return { consultes, sansJustif, croisement: consultes.filter(d => sansJustif.includes(d)) };
  });
  verifie('« RBE consulté » et « justificatif absent » sont bien deux choses',
    separation.croisement.length > 0,
    `dossiers consultés mais sans justificatif : ${separation.croisement.join(', ') || 'aucun'}`);

  // ---------------------------------------------------------- Supervision
  await allerRubrique(page, 'Supervision des dossiers');
  const selecteurs = await page.locator('.selecteur-sobre .selecteur-label').allInnerTexts();
  verifie('la supervision n’a que deux situations',
    JSON.stringify(selecteurs) === JSON.stringify(['Absentes', 'Non supervisées']),
    selecteurs.join(' | '));
  verifie('la supervision ne demande aucune saisie',
    await page.locator('.controle-contenu input, .controle-contenu textarea').count() === 0);

  // --------------------------------------------------------- Surveillance
  await allerRubrique(page, 'Surveillance du système qualité');
  const vuesQ = await page.locator('.hub-carte-titre').allInnerTexts();
  verifie('la surveillance a trois cartes',
    JSON.stringify(vuesQ) === JSON.stringify(
      ['Programme annuel de surveillance', 'Registre des non-conformités', 'Registre des réclamations']),
    vuesQ.join(' | '));
  await allerCarte(page, 'Programme annuel de surveillance');
  const etapesQ = await page.locator('.programme-bloc .programme-label').allInnerTexts();
  verifie('le programme annuel a six étapes',
    JSON.stringify(etapesQ) === JSON.stringify(
      ['Programme', 'Échantillon', 'Contrôle', 'Constats', 'Actions correctives', 'Évaluation annuelle']),
    etapesQ.join(' | '));

  // Le registre des non-conformités ouvre chaque ligne en panneau latéral.
  await revenirDuHub(page);
  await allerCarte(page, 'Registre des non-conformités');
  await page.locator('.tableau-moderne tbody tr').first().click();
  await page.waitForTimeout(400);
  verifie('une non-conformité s’ouvre en panneau latéral',
    await page.locator('.panneau').count() === 1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  verifie('la touche Échap referme le panneau', await page.locator('.panneau').count() === 0);

  // ------------------------------------------------ Informatique, RGPD & IA
  await allerRubrique(page, 'Informatique, RGPD & IA');
  const blocsRgpd = await page.locator('.hub-carte-titre').allInnerTexts();
  /* Le registre des traitements a été retiré le 22 septembre : il restent les
     deux sujets que ComplyEC suit réellement. */
  verifie('l’informatique tient en deux cartes',
    JSON.stringify(blocsRgpd) === JSON.stringify(
      ['Prestataires et sous-traitants', 'Charte d’utilisation de l’IA']),
    blocsRgpd.join(' | '));
  await allerCarte(page, 'Prestataires');
  /* Les prestataires viennent de la fiche déjà renseignée ailleurs : aucune
     ressaisie (§ 12.2). */
  const reprises = await page.evaluate(() =>
    dbPrestataires().map(p => p.nom).sort());
  const affiches = (await page.locator('.prestataire-carte h3').allInnerTexts()).sort();
  verifie('les prestataires sont repris, pas ressaisis',
    JSON.stringify(affiches) === JSON.stringify(reprises), affiches.join(' | '));

  // -------------------------------------------------------------- Synthèse
  await allerRubrique(page, 'Synthèse du contrôle');
  const pourcent = await page.locator('.anneau-nombre').innerText();
  verifie('la synthèse affiche un pourcentage', /^\d{1,3}$/.test(pourcent), pourcent);
  const urgences = await page.locator('.urgence-carte').count();
  verifie('quatre urgences au maximum', urgences <= 4, urgences + ' urgence(s)');
  const reelles = await page.evaluate(() => etatPreparation(dbReglages()).toutesUrgences.length);
  verifie('aucune urgence inventée pour faire nombre',
    urgences === Math.min(4, reelles), `${urgences} affichée(s) pour ${reelles} réelle(s)`);
  verifie('aucun autre tableau de bord sur la synthèse',
    await page.locator('.controle-contenu table, .controle-contenu canvas').count() === 0);

  /* La vue d'ensemble : une barre par rubrique, et chaque barre dit la vérité.
     La longueur du remplissage doit valoir la proportion écrite à côté — un
     graphique qui ne correspondrait pas à son chiffre serait pire que pas de
     graphique du tout. */
  const barres = await page.evaluate(() => {
    const etat = etatPreparation(dbReglages());
    return [...document.querySelectorAll('.synthese-barre')].map((e, i) => {
      const piste = e.querySelector('.synthese-barre-piste').getBoundingClientRect().width;
      const remplie = e.querySelector('.synthese-barre-remplie').getBoundingClientRect().width;
      const r = etat.rubriques[i];
      return {
        nom: e.querySelector('.synthese-barre-nom').textContent,
        compte: e.querySelector('.synthese-barre-compte').textContent,
        part: piste ? Math.round((remplie / piste) * 100) : 0,
        attendu: r.attendus ? Math.round((r.couverts / r.attendus) * 100) : null,
        /* Depuis le 22 septembre la barre affiche son pourcentage et non son
           compte : le compte reste lisible en infobulle. */
        texteAttendu: r.attendus ? `${Math.round((r.couverts / r.attendus) * 100)} %` : 'sans objet',
      };
    });
  });
  verifie('une barre par rubrique de la synthèse',
    barres.length === 8, barres.length + ' barre(s)');
  verifie('chaque barre porte le compte exact',
    barres.every(b => b.compte === b.texteAttendu),
    barres.map(b => b.compte).join(' | '));
  verifie('la longueur remplie correspond à la proportion',
    barres.every(b => b.attendu === null || Math.abs(b.part - b.attendu) <= 2),
    barres.map(b => `${b.nom} ${b.part}/${b.attendu}`).join(' | '));

  /* Chaque problème porte son degré, et le plus grave vient en premier. */
  const degres = await page.locator('.urgence-gravite').allInnerTexts();
  verifie('chaque problème porte son degré de gravité',
    degres.length === urgences, degres.join(' | '));
  const rangs = await page.evaluate(() =>
    etatPreparation(dbReglages()).urgences.map(u => u.rang));
  verifie('les problèmes sont classés, le plus grave en tête',
    rangs.every((r, i) => i === 0 || rangs[i - 1] <= r), rangs.join(' '));

  // Une urgence emmène à l'endroit où elle se traite.
  if (urgences) {
    await page.locator('.urgence-carte').first().click();
    await page.waitForTimeout(500);
    const ou = await page.locator('.nav-item.active .nav-label').innerText();
    verifie('une urgence emmène à la bonne rubrique',
      ['Anomalies', 'Préparer le contrôle'].includes(ou), 'arrivé sur : ' + ou);
  }

  verifie('aucune erreur console', page.__erreurs.length === 0, page.__erreurs.join(' / '));
  await navigateur.close();
  console.log(anomalies
    ? `\n${anomalies} anomalie(s) sur les rubriques du contrôle.`
    : '\nLes huit rubriques respectent les règles du cahier.');
  process.exit(anomalies ? 1 : 0);
})();
