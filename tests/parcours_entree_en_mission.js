/* Garde-fou du parcours gelé — phase 0 de la refonte V3.
 *
 * Le cahier V3 fait d'Entrée en mission la référence graphique et
 * comportementale de toute l'application, et impose deux résolutions de
 * recette : 1440 × 900 puis 1366 × 768. Ce test rejoue les deux assistants de
 * bout en bout aux deux résolutions et échoue si :
 *   — une étape exige un défilement vertical de la fenêtre ;
 *   — le pied d'étape repasse sous la ligne de flottaison ;
 *   — une erreur JavaScript apparaît en cours de parcours.
 *
 * Trois étapes de la contractualisation (Modèle de LDM, Documents,
 * Validation) et les trois étapes de vigilance partagées ont perdu leur pied
 * à 1366 × 768 avant d'être corrigées. Le test est là pour que cela ne
 * recommence pas en silence.
 *
 * Préalable : un serveur sur le port 8811 servant la racine du dépôt, et le
 * harnais _smoketest_ec.html. Usage : node tests/parcours_entree_en_mission.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const RESOLUTIONS = [{ w: 1440, h: 900 }, { w: 1366, h: 768 }];
const SUIVANTS = ['Continuer', 'Choisir les pièces', 'Voir le courrier'];

let echecs = 0;

async function ouvrir(page, sousMenu) {
  if (!(await page.locator('.nav-subitem', { hasText: sousMenu }).count())) {
    await page.locator('.nav-item', { hasText: 'Entrée en mission' }).first().click();
    await page.waitForTimeout(350);
  }
  await page.locator('.nav-subitem', { hasText: sousMenu }).first().click();
  await page.waitForTimeout(700);
}

async function mesurer(page) {
  return page.evaluate(() => {
    const pied = document.querySelector('.wizard-footer');
    const r = pied ? pied.getBoundingClientRect() : null;
    return {
      defilementFenetre: document.documentElement.scrollHeight - window.innerHeight,
      piedSousLaLigne: r ? Math.round(r.bottom - window.innerHeight) : null,
      etape: (document.querySelector('.page-header .subtitle') || {}).textContent || '',
    };
  });
}

async function parcourir(page, sousMenu, demarrage, maxEtapes) {
  await ouvrir(page, sousMenu);
  for (const libelle of demarrage) {
    const bouton = page.locator('button', { hasText: libelle });
    if (await bouton.count()) { await bouton.first().click(); await page.waitForTimeout(700); }
  }
  for (let i = 1; i <= maxEtapes; i++) {
    const m = await mesurer(page);
    const ko = m.defilementFenetre > 0 || (m.piedSousLaLigne !== null && m.piedSousLaLigne > 2);
    if (ko) echecs++;
    const detail = `fenêtre:${m.defilementFenetre}px pied:${m.piedSousLaLigne}px`;
    console.log(`  ${ko ? 'ÉCHEC ' : '  ok  '} ${sousMenu.slice(0, 18).padEnd(18)} ${detail.padEnd(28)} ${m.etape.slice(0, 40)}`);

    let suivant = null;
    for (const libelle of SUIVANTS) {
      const c = page.locator('.wizard-footer button', { hasText: libelle });
      if (await c.count()) { suivant = c; break; }
    }
    if (!suivant) break;
    await suivant.first().click();
    await page.waitForTimeout(700);
  }
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const vp of RESOLUTIONS) {
    const page = await navigateur.newPage({ viewport: { width: vp.w, height: vp.h } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    console.log(`--- ${vp.w} × ${vp.h}`);
    await parcourir(page, 'Courrier de reprise', ['Analyser', 'Commencer'], 6);
    await parcourir(page, 'Contractualisation', ['Analyser', 'Commencer', 'Confirmer les informations'], 10);
    if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs); }
    await page.close();
  }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nParcours gelé intact aux deux résolutions.'
    : `\n${echecs} anomalie(s) — le parcours de référence a régressé.`);
  process.exit(echecs === 0 ? 0 : 1);
})();
