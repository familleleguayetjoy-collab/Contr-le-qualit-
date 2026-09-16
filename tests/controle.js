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
const { RUBRIQUES_CONTROLE, allerOnglet, allerRubrique, allerFiltre, ouvrirEc } = require('./aller');

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

  const menu = await page.locator('.controle-menu-item').allInnerTexts();
  verifie('huit rubriques, dans l’ordre du cahier',
    JSON.stringify(menu) === JSON.stringify(RUBRIQUES_CONTROLE), menu.join(' | '));
  verifie('aucune rubrique « Sécurité informatique »',
    !menu.some(t => /sécurité/i.test(t)), menu.join(' | '));
  verifie('ni échantillon, ni actions correctives, ni évaluation dans le menu',
    !menu.some(t => /échantillon|correctiv|évaluation/i.test(t)), menu.join(' | '));

  // ------------------------------------------------------------- Manuel
  await allerRubrique(page, 'Manuel de procédures');
  const etapes = await page.locator('.programme-bloc .programme-label').allInnerTexts();
  verifie('le manuel tient en trois étapes',
    JSON.stringify(etapes) === JSON.stringify(
      ['Cabinet et activité', 'Équipe', 'Organisation informatique et moyens']),
    etapes.join(' | '));
  const texteManuel = await page.locator('.controle-contenu').innerText();
  verifie('le nombre total de dossiers n’est pas demandé',
    !/nombre (total )?de dossiers\s*\*?\s*$/im.test(texteManuel)
    && !/nombre total de dossiers/i.test(texteManuel));
  verifie('la date de clôture majoritaire des clients n’est pas demandée',
    !/clôture majoritaire/i.test(texteManuel));
  verifie('le nombre de dossiers est compté, pas saisi',
    /dossiers? suivis?/.test(texteManuel) && /ne se saisit pas/.test(texteManuel));
  verifie('l’import de la liste clients est proposé',
    await page.getByRole('button', { name: /Importer un fichier Excel/ }).count() === 1);

  // --------------------------------------------------------- Indépendance
  await allerRubrique(page, 'Indépendance');
  const blocs = await page.locator('.controle-contenu .bloc-carte h2').allInnerTexts();
  verifie('l’indépendance tient en deux blocs', blocs.length === 2, blocs.join(' | '));
  const colonnesIndep = (await page.locator('.bloc-carte').first()
    .locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('la campagne a les quatre colonnes du cahier',
    JSON.stringify(colonnesIndep) === JSON.stringify(['collaborateur', 'générée', 'diffusée', 'reçue']),
    colonnesIndep.join(' | '));
  const colonnesDep = (await page.locator('.bloc-carte').nth(1)
    .locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('la dépendance a les cinq colonnes du cahier',
    JSON.stringify(colonnesDep) === JSON.stringify(
      ['client / groupe', 'honoraires', '% du ca', 'analyse', 'mesure de sauvegarde']),
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
  const vues = await page.locator('.filtre-interne').allInnerTexts();
  verifie('la LCB-FT a trois vues',
    JSON.stringify(vues) === JSON.stringify(['Analyse dossier par dossier', 'Cartographie', 'Suivi RBE']),
    vues.join(' | '));
  await allerFiltre(page, 'Suivi RBE');
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
  const vuesQ = await page.locator('.filtre-interne').allInnerTexts();
  verifie('la surveillance a trois vues',
    JSON.stringify(vuesQ) === JSON.stringify(['Programme annuel', 'Non-conformités', 'Réclamations']),
    vuesQ.join(' | '));
  const etapesQ = await page.locator('.programme-bloc .programme-label').allInnerTexts();
  verifie('le programme annuel a six étapes',
    JSON.stringify(etapesQ) === JSON.stringify(
      ['Programme', 'Échantillon', 'Contrôle', 'Constats', 'Actions correctives', 'Évaluation annuelle']),
    etapesQ.join(' | '));

  // Le registre des non-conformités ouvre chaque ligne en panneau latéral.
  await allerFiltre(page, 'Non-conformités');
  await page.locator('.tableau-moderne tbody tr').first().click();
  await page.waitForTimeout(400);
  verifie('une non-conformité s’ouvre en panneau latéral',
    await page.locator('.panneau').count() === 1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  verifie('la touche Échap referme le panneau', await page.locator('.panneau').count() === 0);

  // ------------------------------------------------ Informatique, RGPD & IA
  await allerRubrique(page, 'Informatique, RGPD & IA');
  const blocsRgpd = await page.locator('.controle-contenu .bloc-carte h2').allInnerTexts();
  verifie('l’informatique tient en trois blocs',
    JSON.stringify(blocsRgpd) === JSON.stringify(
      ['Registre des traitements', 'Prestataires', 'Charte IA']),
    blocsRgpd.join(' | '));
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
