/* Recette « paramètres » — cinq rubriques, et la source unique des données.
 *
 * Ce qu'elle vérifie :
 *   — cinq rubriques, dans l'ordre du cahier ;
 *   — l'effectif est compté, jamais saisi ;
 *   — les responsables se désignent par liste déroulante d'utilisateurs, et
 *     jamais en retapant un nom ;
 *   — l'attribution d'un dossier décide à qui part la relance ;
 *   — l'établissement secondaire ne demande son adresse que s'il existe.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { RUBRIQUES_PARAMETRES, allerOnglet, allerRubrique, ouvrirEc } = require('./aller');

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
  await allerOnglet(page, 'Paramètres');

  const menu = await page.locator('.controle-menu-item').allInnerTexts();
  verifie('cinq rubriques, dans l’ordre du cahier',
    JSON.stringify(menu) === JSON.stringify(RUBRIQUES_PARAMETRES), menu.join(' | '));

  // ------------------------------------------------- Informations cabinet
  const labels = await page.locator('.champ-panneau .champ-label').allInnerTexts();
  verifie('les cinq champs d’identité sont là',
    ['Dénomination', 'Forme juridique', 'Adresse du siège', 'Conseil régional', 'Numéro d’inscription']
      .every(l => labels.includes(l)), labels.join(' | '));
  verifie('l’effectif n’est pas un champ de saisie',
    !labels.includes('Effectif') && await page.locator('.valeur-deduite').count() === 1);
  const effectif = await page.locator('.valeur-deduite-valeur').innerText();
  const attendu = await page.evaluate(() => COLLABORATEURS.length + 1);
  verifie('l’effectif est compté sur les utilisateurs',
    effectif.startsWith(String(attendu)), effectif);

  // ------------------------------------------------------------ Utilisateurs
  await allerRubrique(page, 'Utilisateurs');
  const colonnes = (await page.locator('thead th').allInnerTexts()).map(t => t.trim().toLowerCase());
  verifie('les quatre colonnes du cahier',
    JSON.stringify(colonnes) === JSON.stringify(['nom', 'prénom', 'fonction', 'dossiers attribués']),
    colonnes.join(' | '));

  /* L'attribution décide du destinataire de la relance : on déplace un dossier
     et on regarde qui ComplyEC relancerait. */
  const avant = await page.evaluate(() => {
    const a = anomaliesDeLOnglet('lettres')[0];
    return { cle: a.cle, dossier: a.dossier, collab: a.collaborateur };
  });
  await page.locator('.tableau-moderne tbody tr', { hasText: 'Thomas' }).click();
  await page.waitForTimeout(400);
  await page.locator('.attribution-ajout select').selectOption(avant.dossier);
  await page.getByRole('button', { name: 'Attribuer' }).click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const apres = await page.evaluate(cle => {
    const a = anomaliesDeLOnglet('lettres').find(x => x.cle === cle);
    return a ? a.collaborateur : null;
  }, avant.cle);
  verifie('l’attribution change le destinataire de la relance',
    apres === 'thomas' && apres !== avant.collab, `${avant.collab} → ${apres}`);

  // ------------------------------------------------------------ Gouvernance
  await allerRubrique(page, 'Gouvernance');
  const titres = await page.locator('.bloc-carte h2').allInnerTexts();
  verifie('la gouvernance a trois blocs',
    JSON.stringify(titres) === JSON.stringify(['Gérant', 'Experts-comptables inscrits', 'Actionnariat']),
    titres.join(' | '));

  // ----------------------------------------------------------- Responsables
  await allerRubrique(page, 'Responsables');
  const lignes = await page.locator('.responsable-ligne').count();
  verifie('les huit désignations attendues', lignes === 8, lignes + ' ligne(s)');
  verifie('aucun nom ne se retape : ce sont des listes déroulantes',
    await page.locator('.responsable-ligne select').count() === lignes
    && await page.locator('.responsable-ligne input').count() === 0);
  const choix = await page.locator('.responsable-ligne select').first()
    .locator('option').allInnerTexts();
  const personnes = await page.evaluate(() => nomsDesPersonnes());
  verifie('les listes proposent les utilisateurs enregistrés',
    personnes.every(n => choix.includes(n)), choix.join(' | '));

  // Une désignation doit survivre au rafraîchissement.
  await page.locator('.responsable-ligne', { hasText: 'Responsable IA' })
    .locator('select').selectOption('Julie Bernard');
  await page.waitForTimeout(450);
  await page.reload();
  await page.waitForTimeout(800);
  await allerOnglet(page, 'Paramètres');
  await allerRubrique(page, 'Responsables');
  const ia = await page.locator('.responsable-ligne', { hasText: 'Responsable IA' })
    .locator('select').inputValue();
  verifie('la désignation survit au rafraîchissement', ia === 'Julie Bernard', ia);

  // ----------------------------------------------------------- Implantation
  await allerRubrique(page, 'Implantation');
  const avantBascule = await page.locator('.champ-panneau').count();
  await page.locator('.champ-panneau', { hasText: 'Établissement secondaire' })
    .locator('.choix-option', { hasText: 'Oui' }).click();
  await page.waitForTimeout(350);
  const apresBascule = await page.locator('.champ-panneau').count();
  verifie('l’adresse n’est demandée que s’il y a un établissement secondaire',
    apresBascule === avantBascule + 1, `${avantBascule} → ${apresBascule}`);

  verifie('aucune erreur console', page.__erreurs.length === 0, page.__erreurs.join(' / '));
  await navigateur.close();
  console.log(anomalies
    ? `\n${anomalies} anomalie(s) sur les paramètres.`
    : '\nLes cinq rubriques tiennent, et l’attribution commande bien les relances.');
  process.exit(anomalies ? 1 : 0);
})();
