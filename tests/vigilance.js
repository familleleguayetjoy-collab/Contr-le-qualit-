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

  // Le modèle du cabinet est bien là : cotation par critères, niveau retenu.
  verifie('les pastilles de cotation sont conservées',
    await page.locator('.critere-pastille, .pastilles-criteres span').count() > 0);
  const colonnes = (await page.locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('les colonnes du modèle sont conservées',
    colonnes.some(c => c.includes('niveau')) && colonnes.some(c => c.includes('critère')),
    colonnes.join(' | '));

  // La fiche d'un dossier s'ouvre, et propose la mise à jour.
  await page.locator('.tableau-moderne tbody tr, .table-row, tbody tr').first().click();
  await page.waitForTimeout(500);
  const bouton = page.locator('button', { hasText: 'Mettre à jour la vigilance' });
  verifie('la fiche propose de mettre à jour la vigilance', await bouton.count() === 1);

  if (await bouton.count()) {
    await bouton.first().click();
    await page.waitForTimeout(700);
    const etapes = await page.locator('.stepper-label').allInnerTexts();
    /* Sept écrans depuis que l'attestation PPE a le sien : elle produit une
       pièce à faire signer, les bénéficiaires effectifs n'en produisent
       aucune, et les mêler dans un seul écran mélangeait deux gestes. */
    verifie('le parcours de vigilance garde ses sept écrans',
      etapes.length === 7, etapes.join(' | '));

    /* Aucun résultat de vérification n'est fabriqué : l'écran enregistre ce
       que l'expert-comptable a constaté, et le dit. */
    const mentions = await page.evaluate(() => ({
      rbe: capacite('rbe').mode,
      gel: capacite('sanctionsGel').mode,
      registre: capacite('registreLegal').mode,
    }));
    verifie('la consultation du RBE est déclarée manuelle', mentions.rbe === 'manual', mentions.rbe);
    verifie('le gel des avoirs est déclaré manuel', mentions.gel === 'manual', mentions.gel);
    verifie('le registre du commerce est déclaré manuel', mentions.registre === 'manual', mentions.registre);

    // On ressort sans rien casser.
    const retour = page.locator('button', { hasText: /Retour|Annuler|←/ });
    if (await retour.count()) {
      await retour.first().click();
      await page.waitForTimeout(600);
    }
  }

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
