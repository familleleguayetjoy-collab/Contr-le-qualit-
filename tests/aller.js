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

/* Ouvrir un travail depuis un hub ou depuis une étape du parcours.

   Les quatre hubs devenus étapes n'affichent plus de cartes : ils listent
   leurs travaux avec un bouton Ouvrir par ligne. Le helper essaie donc
   d'abord la ligne du parcours, puis la carte du hub — les recettes
   continuent de nommer le travail qu'elles veulent, sans savoir par où on y
   arrive. */
async function allerCarteDe(page, hub, carte, attente = 500) {
  await allerHub(page, hub, attente);
  /* Le libellé d'une ligne change avec ses compteurs (« Valider 7 domaines de
     risque »), mais son nom de travail ne bouge pas : c'est lui qu'on vise. */
  const index = await page.evaluate(nom => {
    const lignes = [...document.querySelectorAll('.parcours-reste')];
    const clef = nom.toLowerCase();
    return lignes.findIndex(l =>
      (l.getAttribute('data-travail') || '').toLowerCase().includes(clef)
      || l.innerText.toLowerCase().includes(clef));
  }, carte);
  if (index >= 0) {
    await page.locator('.parcours-reste button').nth(index).click();
  } else {
    await page.locator('.hub-carte', { hasText: carte }).first().click();
  }
  await page.waitForTimeout(attente);
}

/* Les travaux d'une étape, ou les cartes d'un hub : les recettes qui balaient
   tout ce qu'un écran propose ont besoin des deux. */
async function ouvrablesDe(page) {
  const lignes = await page.locator('.parcours-reste button').count();
  if (lignes) return { selecteur: '.parcours-reste button', nombre: lignes };
  return { selecteur: '.hub-carte', nombre: await page.locator('.hub-carte').count() };
}

module.exports = { allerHub, allerCarteDe, allerEtape, ouvrablesDe, ETAPES_FIL, VIA_PARCOURS };
