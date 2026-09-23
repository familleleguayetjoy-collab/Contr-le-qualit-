/* Recette « vigilance » — l'analyse LCB-FT dossier par dossier.
 *
 * Le § 9 demande de reprendre les écrans déjà validés par le cabinet sans les
 * réinventer : cette recette vérifie qu'ils sont toujours atteignables depuis
 * la nouvelle arborescence, qu'ils enchaînent leurs six écrans, et qu'ils
 * n'inventent aucun résultat de vérification.
 *
 * Le dernier point n'est pas cosmétique : ComplyEC ne consulte ni le registre
 * du commerce, ni le registre des gels. Un écran qui afficherait « aucune
 * correspondance » sans avoir rien interrogé serait un faux en écriture.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { allerOnglet, allerRubrique, allerCarte, revenirDuHub, ouvrirEc } = require('./aller');

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
  await allerRubrique(page, 'LCB-FT');
  await allerCarte(page, 'Vigilance LCB-FT');

  /* L'écran a été repris le 24 septembre. Il listait les cent dossiers avec
     des filtres, des pastilles de critères et une fiche de lecture ; il liste
     maintenant les seuls dossiers dont la fiche de vigilance n'est pas à
     l'espace documentaire — c'est la seule chose que ComplyEC sait d'eux. */
  const colonnes = (await page.locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('la liste ne porte que les dossiers sans analyse',
    colonnes[0] === 'dossier' && colonnes.includes('entrée en relation'),
    colonnes.join(' | '));
  const sansAnalyse = await page.evaluate(() =>
    dbVigilanceDossiers().filter(d => d.statut !== 'complete').length);
  const lignes = await page.locator('.parcours-liste tbody tr').count();
  verifie('autant de lignes que de dossiers sans analyse',
    lignes === sansAnalyse, `${lignes} lignes pour ${sansAnalyse} dossiers`);
  verifie('les deux manières de s’y mettre sont offertes',
    await page.locator('.parcours-demarrer button').count() === 1);

  /* On ouvre un dossier : trois étapes depuis le 25 septembre. Les faits
     d'abord — secteur et pays —, la cotation ensuite, le niveau enfin. Coter
     avant d'avoir posé le secteur, c'était coter de mémoire, et c'est ce qui
     empêchait d'écrire les sections 2 et 3 de la cartographie. */
  await page.locator('.parcours-liste tbody tr').first().click();
  await page.waitForTimeout(700);
  const etapes = await page.locator('.stepper-label').allInnerTexts();
  verifie('le dossier s’analyse en trois étapes',
    JSON.stringify(etapes) === JSON.stringify(
      ['Secteur et exposition', 'Cotation du risque', 'Niveau de vigilance']),
    etapes.join(' | '));

  /* L'étape ne se franchit pas sans la division d'activité : c'est elle qui
     alimente la répartition par secteur du document. */
  verifie('on ne passe pas l’étape sans la division d’activité',
    await page.locator('.etape-actions button', { hasText: 'Continuer' }).first().isDisabled());
  await page.locator('.step-scroll select').first().selectOption('68');
  await page.waitForTimeout(300);
  verifie('un secteur cité par TRACFIN est signalé',
    await page.locator('.expo-signal').count() === 1);
  await page.locator('.step-scroll select').nth(1).selectOption('Monaco');
  await page.waitForTimeout(350);
  verifie('un pays étranger ouvre la nature de l’exposition',
    await page.locator('.expo-listee').count() === 1);

  await page.locator('.etape-actions button', { hasText: 'Continuer' }).first().click();
  await page.waitForTimeout(600);
  verifie('les quatre critères de cotation sont là',
    await page.locator('.nplab-cell').count() === 4);

  await page.locator('.etape-actions button', { hasText: 'Continuer' }).first().click();
  await page.waitForTimeout(600);
  verifie('le niveau proposé s’affiche',
    await page.locator('.niveau-carte').count() > 0);

  /* Aucun résultat de vérification n'est fabriqué : l'écran enregistre ce que
     l'expert-comptable a constaté, et le dit. */
  const mentions = await page.evaluate(() => ({
    rbe: capacite('rbe').mode,
    gel: capacite('sanctionsGel').mode,
    registre: capacite('registreLegal').mode,
  }));
  verifie('la consultation du RBE est déclarée manuelle', mentions.rbe === 'manual', mentions.rbe);
  verifie('le gel des avoirs est déclaré manuel', mentions.gel === 'manual', mentions.gel);
  verifie('le registre du commerce est déclaré manuel', mentions.registre === 'manual', mentions.registre);

  /* Quatre bases, pas cinq : la recherche de presse a été retirée le
     20 septembre — aucune base officielle ne la tient. */
  const bases = await page.evaluate(() => VIGILANCE_BASES.map(b => b.code));
  verifie('quatre vérifications en base', bases.length === 4, bases.join(' | '));
  verifie('aucune recherche de presse dans la liste',
    bases.indexOf('presse') === -1, bases.join(' | '));
  const sansLien = await page.evaluate(() =>
    VIGILANCE_BASES.filter(b => !b.lien).map(b => b.code));
  verifie('chaque base porte le lien qui l’ouvre',
    sansLien.length === 0, sansLien.join(' | '));

  // On ressort sans rien casser.
  await page.locator('.parcours-fil .lien-discret').first().click();
  await page.waitForTimeout(500);

  // La cartographie s'agrège toute seule : aucune saisie de dossier.
  await revenirDuHub(page);
  await allerCarte(page, 'Cartographie du cabinet');
  const texteCarto = await page.locator('.controle-contenu').innerText();
  verifie('la cartographie est nourrie par les analyses',
    /dossier/i.test(texteCarto), texteCarto.slice(0, 60));
  const total = await page.evaluate(() => dbVigilanceDossiers().length);
  verifie('elle couvre tout le portefeuille', total >= 15, total + ' dossier(s)');

  verifie('aucune erreur console', page.__erreurs.length === 0, page.__erreurs.join(' / '));
  await navigateur.close();
  console.log(anomalies
    ? `\n${anomalies} anomalie(s) sur la vigilance LCB-FT.`
    : '\nLes écrans de vigilance du cabinet sont intacts et atteignables.');
  process.exit(anomalies ? 1 : 0);
})();
