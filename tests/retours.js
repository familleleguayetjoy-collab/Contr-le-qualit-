/* Retours contextuels — recette de la phase B du V6 (§ 40).
 *
 * LBC-FT, Documents du cabinet et Manuel s'ouvrent de deux endroits : la
 * barre latérale, et l'étape du parcours qui les contient. Le bouton Retour
 * d'un de leurs sous-écrans doit ramener d'où l'on vient — au parcours si
 * l'on y est entré par une étape, au hub si l'on a cliqué la barre.
 *
 * Sans cela, un expert-comptable entré à l'étape 5 se retrouverait dans le
 * hub LBC-FT sans savoir comment regagner sa préparation — et le cahier
 * exige qu'un retour en arrière soit toujours possible.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/retours.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
let ko = 0;
function v(l, c, d) { if (!c) ko++; console.log(`  ${c ? 'OK  ' : 'ÉCHEC'}  ${l.padEnd(56)} ${d || ''}`); }
async function titre(p) { return p.evaluate(() => (document.querySelector('h1') || {}).textContent || ''); }
async function retour(p) {
  const b = p.locator('.page-header-actions button', { hasText: 'Retour' });
  if (await b.count()) { await b.first().click(); await p.waitForTimeout(450); return true; }
  return false;
}
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await br.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);

  // A. Entré par l'étape 5 du parcours → le retour doit ramener à l'étape.
  await p.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await p.waitForTimeout(450);
  await p.locator('.parcours-fil-etape', { hasText: 'LBC-FT' }).first().click();
  await p.waitForTimeout(500);
  v('l’étape 5 s’ouvre', (await titre(p)) === 'LBC-FT', await titre(p));
  // L'étape liste ses travaux : on ouvre celui de la couverture du portefeuille.
  await p.locator('.parcours-reste[data-travail*="portefeuille"] button').first().click();
  await p.waitForTimeout(500);
  const dansSousEcran = await titre(p);
  await retour(p);
  const apresA = await titre(p);
  const filA = await p.locator('.parcours-fil-etape').count();
  v('depuis l’étape, le retour ramène au parcours principal',
    filA === 7 && apresA === 'LBC-FT', `${dansSousEcran} → ${apresA} (fil ${filA})`);

  // B. Entré par la barre latérale → le retour doit ramener au hub, pas au parcours.
  await p.locator('.nav-item', { hasText: 'LBC-FT' }).first().click();
  await p.waitForTimeout(450);
  // Depuis l'étape « Portefeuille » du parcours LBC-FT, on ouvre un dossier.
  await p.locator('.parcours-fil-etape', { hasText: 'Portefeuille' }).first().click();
  await p.waitForTimeout(600);
  await p.locator('tbody tr').first().click();
  await p.waitForTimeout(400);
  await retour(p);
  const apresB = await titre(p);
  const filB = await p.locator('.parcours-fil-etape').count();
  /* Depuis la barre latérale, on revient au parcours LBC-FT — cinq étapes —
     et non au parcours principal, qui en compte sept. C'est la distinction
     que le § 40 demande : le retour dépend de l'entrée. */
  v('depuis la barre, le retour ramène au parcours LBC-FT', filB === 5, `${apresB} (fil ${filB})`);

  // C. Même chose pour Documents, ouvert depuis l'étape 1.
  await p.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await p.waitForTimeout(450);
  await p.locator('.parcours-fil-etape', { hasText: 'Cabinet' }).first().click();
  await p.waitForTimeout(500);
  await p.locator('.parcours-reste button').first().click();
  await p.waitForTimeout(600);
  // On descend d'un cran de plus, dans un écran qui porte un vrai Retour.
  const ref = p.locator('button', { hasText: 'Référentiel des informations' });
  if (await ref.count()) { await ref.first().click(); await p.waitForTimeout(550); }
  await retour(p);
  const apresC = await titre(p);
  const filC = await p.locator('.parcours-fil-etape').count();
  v('Documents : retour vers l’étape 1 du parcours principal',
    filC === 7 && apresC === 'Cabinet & documents', `${apresC} (fil ${filC})`);

  // D. Documents depuis la barre latérale.
  await p.locator('.nav-item', { hasText: 'Documents du cabinet' }).first().click();
  await p.waitForTimeout(500);
  // Le référentiel s'ouvre depuis l'étape « Confirmer » du parcours documentaire.
  await p.locator('.parcours-fil-etape', { hasText: 'Confirmer' }).first().click();
  await p.waitForTimeout(550);
  await p.locator('button', { hasText: 'Référentiel des informations' }).first().click();
  await p.waitForTimeout(550);
  await retour(p);
  const apresD = await titre(p);
  const filD = await p.locator('.parcours-fil-etape').count();
  /* Depuis la barre latérale, on revient au parcours documentaire — quatre
     étapes — et non au parcours principal, qui en compte sept. */
  v('Documents : retour vers le parcours documentaire', filD === 4, `${apresD} (fil ${filD})`);

  // E. Gouvernance : ses sous-écrans reviennent toujours à l'étape 2, le hub
  //    n'existant plus dans la barre latérale.
  await p.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await p.waitForTimeout(450);
  await p.locator('.parcours-fil-etape', { hasText: 'Gouvernance' }).first().click();
  await p.waitForTimeout(500);
  await p.locator('.parcours-reste[data-travail*="Dépendance"] button').first().click();
  await p.waitForTimeout(500);
  await retour(p);
  const apresE = await titre(p);
  const filE = await p.locator('.parcours-fil-etape').count();
  v('Gouvernance : retour vers l’étape 2', filE === 7 && apresE === 'Gouvernance', `${apresE} (fil ${filE})`);

  if (errs.length) { ko += errs.length; console.log('ERREURS JS :', errs); }
  await br.close();
  console.log(ko === 0 ? '\nLes retours ramènent d’où l’on vient.' : `\n${ko} anomalie(s).`);
  process.exit(ko === 0 ? 0 : 1);
})();
