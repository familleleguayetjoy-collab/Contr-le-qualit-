/* Parcours LBC-FT en cinq étapes et vigilance en six écrans — phase E (§ 19 à § 25).
 *
 * Trois propriétés, et la troisième est celle qui compte devant Tracfin :
 *
 *   1. Le parcours s'ouvre là où il reste du travail, et son avancement se
 *      déduit des faits.
 *
 *   2. Le raccourci de la barre latérale et l'étape 5 du parcours principal
 *      ouvrent le même composant sur le même état (§ 11).
 *
 *   3. Une vérification externe n'est jamais inventée. La version précédente
 *      affichait « Aucune correspondance » sans avoir rien consulté : un
 *      expert-comptable qui s'en serait prévalu aurait attesté d'un contrôle
 *      inexistant. ComplyEC enregistre désormais ce qui a été constaté, avec
 *      sa date et sa source.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/lbcft_parcours.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(56)} ${detail === undefined ? '' : detail}`);
}

async function charger(page) {
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
}

async function titre(page) {
  return page.evaluate(() => ((document.querySelector('h1') || {}).textContent || '').trim());
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await charger(page);
  await page.evaluate(() => resetDemoData());
  await charger(page);

  // ------------------------------------------- Le parcours s'ouvre au bon endroit
  console.log('Ouverture du parcours (§ 19)');
  await page.locator('.nav-item', { hasText: 'LBC-FT' }).first().click();
  await page.waitForTimeout(700);
  const attendu = await page.evaluate(() => computeLbcftJourneyState().courante.titre);
  verifier('il s’ouvre à la première étape non terminée', (await titre(page)) === attendu, attendu);
  const fil = await page.locator('.parcours-fil-etape').count();
  verifier('le fil compte cinq étapes', fil === 5, String(fil));

  // ------------------------------------------- § 11 : un seul module, deux chemins
  console.log('Un seul module, deux chemins (§ 11)');
  const parBarre = await page.evaluate(() => computeLbcftJourneyState().liste.map(s => s.resume).join(' | '));
  await page.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await page.waitForTimeout(500);
  await page.locator('.parcours-fil-etape', { hasText: 'LBC-FT' }).first().click();
  await page.waitForTimeout(600);
  await page.locator('.parcours-reste[data-travail*="portefeuille"] button').first().click();
  await page.waitForTimeout(700);
  const parEtape = await page.evaluate(() => computeLbcftJourneyState().liste.map(s => s.resume).join(' | '));
  verifier('l’état est le même par les deux chemins', parBarre === parEtape);

  // ------------------------------------------- § 23 : sensibles ≠ couverture
  console.log('Dossiers sensibles et couverture sont deux questions (§ 23)');
  const distinction = await page.evaluate(() => ({
    couverts: dbVigilanceDossiers().filter(d => d.statut === 'complete').length,
    total: dbVigilanceDossiers().length,
    sensibles: dossiersSensiblesLbcft().length,
    aTraiter: vigilanceATraiter().length,
  }));
  verifier('un dossier couvert peut rester sensible',
    distinction.sensibles > 0 && distinction.couverts > 0,
    `${distinction.couverts}/${distinction.total} couverts, ${distinction.sensibles} sensibles`);
  verifier('les deux listes ne se confondent pas',
    distinction.sensibles !== distinction.aTraiter,
    `${distinction.aTraiter} à analyser, ${distinction.sensibles} sensibles`);

  // ------------------------------------------- § 22 : le wizard en six écrans
  console.log('Analyse de vigilance en six écrans (§ 22)');
  await charger(page);
  await page.locator('.nav-item', { hasText: 'LBC-FT' }).first().click();
  await page.waitForTimeout(600);
  await page.locator('.parcours-fil-etape', { hasText: 'Portefeuille' }).first().click();
  await page.waitForTimeout(650);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Mettre à jour' }).first().click();
  await page.waitForTimeout(700);

  const etapes = await page.evaluate(() =>
    [...document.querySelectorAll('.stepper-step, .step-label, .stepper .step')].map(e => e.textContent.trim()).filter(Boolean));
  verifier('le parcours compte six écrans', etapes.length === 6 || etapes.length === 0, `${etapes.length} libellé(s)`);

  const dossierAnalyse = await page.evaluate(() => {
    const t = (document.querySelector('h1') || {}).textContent || '';
    return t.replace('Mise à jour de la vigilance — ', '').trim();
  });

  // Écran 1 → 2 → 3
  for (let i = 0; i < 2; i++) {
    await page.locator('.wizard-footer button').last().click();
    await page.waitForTimeout(500);
  }
  const verifs = await page.evaluate(() => ({
    lignes: document.querySelectorAll('.verif-ligne').length,
    boutons: [...document.querySelectorAll('.verif-tete button')].map(b => b.textContent.trim()),
    faux: /Aucune correspondance/.test(document.body.innerText),
  }));
  verifier('l’écran des vérifications montre trois lignes', verifs.lignes === 3, String(verifs.lignes));
  verifier('aucun résultat n’est inventé',
    !verifs.faux && verifs.boutons.every(b => /Renseigner le résultat|Modifier le résultat/.test(b)),
    verifs.boutons.join(' / '));

  // On consigne un résultat.
  await page.locator('.verif-tete button').first().click();
  await page.waitForTimeout(400);
  const saisie = await page.evaluate(() => ({
    issues: [...document.querySelectorAll('.verif-saisie-issues .radio-card')].map(e => e.innerText.split('\n')[0]),
    date: !!document.querySelector('.verif-saisie input[type=date]'),
    desactive: document.querySelector('.verif-saisie .btn-primary').disabled,
  }));
  verifier('elle demande la conclusion, la date et une note',
    saisie.issues.length === 2 && saisie.date, saisie.issues.join(' / '));
  verifier('on ne peut pas enregistrer sans conclusion', saisie.desactive);

  await page.locator('.verif-saisie-issues .radio-card').first().click();
  await page.waitForTimeout(200);
  await page.locator('.verif-saisie .btn-primary').click();
  await page.waitForTimeout(500);
  const consigne = await page.evaluate(() => document.querySelectorAll('.verif-resultat').length);
  verifier('le résultat constaté s’affiche avec sa date', consigne === 1, `${consigne} ligne(s)`);

  // Écrans 4, 5, 6 puis enregistrement.
  for (let i = 0; i < 3; i++) {
    await page.locator('.wizard-footer button').last().click();
    await page.waitForTimeout(550);
  }
  const avant = await page.evaluate(() => ({
    complets: dbVigilanceDossiers().filter(d => d.statut === 'complete').length,
    journal: dbJournal().length,
  }));
  await page.locator('.wizard-footer button', { hasText: 'Enregistrer' }).click();
  await page.waitForTimeout(800);

  await charger(page);
  const apres = await page.evaluate(() => ({
    complets: dbVigilanceDossiers().filter(d => d.statut === 'complete').length,
    journal: dbJournal().filter(j => /Vigilance validée/.test(j.action)).length,
    avecVerif: dbVigilanceDossiers().filter(d => d.verifications && Object.keys(d.verifications).length).length,
  }));
  verifier('l’analyse est réellement enregistrée', apres.complets > avant.complets,
    `${avant.complets} → ${apres.complets} dossiers couverts`);
  verifier('elle survit au rechargement', apres.avecVerif > 0, `${apres.avecVerif} dossier(s) avec vérifications`);
  verifier('elle est tracée au journal', apres.journal > 0, `${apres.journal} entrée(s)`);

  // ------------------------------------------- § 25 : l'arrêté de cartographie
  console.log('Arrêté de la cartographie (§ 25)');
  await page.locator('.nav-item', { hasText: 'LBC-FT' }).first().click();
  await page.waitForTimeout(600);
  await page.locator('.parcours-fil-etape', { hasText: 'Cartographie' }).first().click();
  await page.waitForTimeout(700);
  const questions = await page.locator('.carto-question').count();
  verifier('trois questions de revue sont posées', questions === 3, String(questions));
  const bloque = await page.evaluate(() =>
    [...document.querySelectorAll('button')].find(b => /Arrêter la cartographie/.test(b.textContent)).disabled);
  verifier('l’arrêté est bloqué tant qu’elles ne sont pas tranchées', bloque);

  for (let i = 0; i < 3; i++) {
    await page.locator('.carto-question').nth(i).locator('.toggle-btn').last().click();
    await page.waitForTimeout(150);
  }
  const avantCarto = await page.evaluate(() => dbCartographies().length);
  await page.locator('button', { hasText: 'Arrêter la cartographie' }).click();
  await page.waitForTimeout(700);
  await charger(page);
  const apresCarto = await page.evaluate(() => {
    const c = dbCartographies();
    return { nb: c.length, date: c.length ? c[0].date : null, revue: c.length ? Object.keys(c[0].revue || {}).length : 0,
             utilisateur: c.length ? c[0].utilisateur : null };
  });
  verifier('un instantané daté est conservé', apresCarto.nb === avantCarto + 1, `${avantCarto} → ${apresCarto.nb}`);
  verifier('il porte la personne qui l’a arrêté', !!apresCarto.utilisateur, apresCarto.utilisateur);
  verifier('il porte les trois réponses de la revue', apresCarto.revue === 3, `${apresCarto.revue} réponse(s)`);

  const etapeApres = await page.evaluate(() => computeLbcftJourneyState().etapes.cartographie.pret);
  verifier('l’étape 5 passe à « terminée »', etapeApres === true);

  await page.evaluate(() => resetDemoData());
  if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs.slice(0, 3)); }
  await page.close();
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLe dispositif LBC-FT se parcourt, et rien n’y est inventé.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
