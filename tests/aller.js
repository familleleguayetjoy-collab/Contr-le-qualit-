/* Aller à un écran — helper commun aux recettes.
 *
 * Depuis la phase B, quatre hubs ne sont plus des entrées de la barre
 * latérale : Gouvernance, Ressources, Cycle de la relation client et
 * Surveillance & qualité s'ouvrent comme étapes du parcours « Préparer mon
 * contrôle ». Chaque recette qui cliquait leur entrée se serait mise à
 * échouer pour une raison qui n'a rien à voir avec ce qu'elle vérifie.
 *
 * Ce helper dit où se trouve chaque hub, et les recettes disent seulement
 * lequel elles veulent. La prochaine refonte de la navigation ne touchera
 * qu'ici.
 */

/* Les hubs atteints par une étape du parcours, et le libellé de cette étape. */
const VIA_PARCOURS = {
  'Gouvernance & règles professionnelles': 'Gouvernance',
  Gouvernance: 'Gouvernance',
  'Ressources & moyens du cabinet': 'Ressources',
  Ressources: 'Ressources',
  'Cycle de la relation client': 'Missions',
  'Surveillance & qualité': 'Qualité',
};

/* Les libellés du fil sont courts, pour qu'il tienne sur une ligne à 1366 px.
   Les recettes les prennent ici plutôt que de les recopier. */
const ETAPES_FIL = ['Cabinet', 'Gouvernance', 'Ressources', 'Missions', 'LBC-FT', 'Qualité', 'Manuel'];

async function allerEtape(page, court, attente = 500) {
  await page.locator('.parcours-fil-etape', { hasText: court }).first().click();
  await page.waitForTimeout(attente);
}

async function allerHub(page, hub, attente = 450) {
  const etape = VIA_PARCOURS[hub];
  if (etape) {
    await page.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
    await page.waitForTimeout(attente);
    await page.locator('.parcours-fil-etape', { hasText: etape }).first().click();
  } else {
    await page.locator('.nav-item', { hasText: hub }).first().click();
  }
  await page.waitForTimeout(attente);
}

async function allerCarteDe(page, hub, carte, attente = 500) {
  await allerHub(page, hub, attente);
  await page.locator('.hub-carte', { hasText: carte }).first().click();
  await page.waitForTimeout(attente);
}

module.exports = { allerHub, allerCarteDe, allerEtape, ETAPES_FIL, VIA_PARCOURS };
