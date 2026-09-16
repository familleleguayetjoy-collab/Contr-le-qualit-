/* Recette « mobile » — tout doit tenir dans 390 px de large.
 *
 * Rien ne dépasse le cadre, sauf à l'intérieur d'une bande qui défile — une
 * bande de filtres, un tableau — où c'est le principe même. Et aucune cible
 * tactile ne descend sous 40 px : un bouton de 28 px se rate une fois sur
 * trois avec le pouce, et l'utilisateur croit que le logiciel n'a pas réagi.
 *
 * On mesure dans le navigateur ; on ne déduit rien de la lecture du CSS.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const L = 390;

async function controle(page, nom) {
  const r = await page.evaluate((largeur) => {
    /* Un élément qui sort du cadre à l'intérieur d'une bande qui défile
       latéralement n'est pas un défaut : c'est le principe de la bande. On ne
       retient donc que ceux dont aucun ancêtre ne défile. */
    function dansUneBande(e) {
      let p = e.parentElement;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
        p = p.parentElement;
      }
      return false;
    }
    const deborde = [];
    document.querySelectorAll('body *').forEach(e => {
      const b = e.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) return;
      if (dansUneBande(e)) return;
      if (b.right > largeur + 1 || b.left < -1) {
        deborde.push({
          sel: e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ').slice(0, 2).join('.'),
          gauche: Math.round(b.left), droite: Math.round(b.right),
          texte: (e.textContent || '').trim().slice(0, 40),
        });
      }
    });
    // Une cible tactile trop petite se rate une fois sur trois.
    const petites = [];
    document.querySelectorAll('button, a, select').forEach(e => {
      const b = e.getBoundingClientRect();
      if (b.height > 0 && b.height < 40) {
        petites.push({
          sel: e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0],
          h: Math.round(b.height),
          texte: (e.textContent || '').trim().slice(0, 30),
        });
      }
    });
    return {
      scrollX: document.documentElement.scrollWidth > largeur + 1,
      deborde: deborde.slice(0, 6),
      nbDeborde: deborde.length,
      petites: petites.slice(0, 6),
      nbPetites: petites.length,
    };
  }, L);
  const souci = r.scrollX || r.nbDeborde || r.nbPetites;
  console.log(`\n${nom} ${souci ? '!!' : 'OK'}`);
  if (r.scrollX) console.log('   la page défile horizontalement');
  if (r.nbDeborde) {
    console.log(`   ${r.nbDeborde} élément(s) hors cadre :`);
    r.deborde.forEach(d => console.log(`     ${d.sel}  [${d.gauche} → ${d.droite}]  « ${d.texte} »`));
  }
  if (r.nbPetites) {
    console.log(`   ${r.nbPetites} cible(s) sous 40 px :`);
    r.petites.forEach(d => console.log(`     ${d.sel}  ${d.h}px  « ${d.texte} »`));
  }
  return souci;
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const err = [];
  const page = await b.newPage({ viewport: { width: L, height: 844 }, isMobile: true, hasTouch: true });
  page.on('pageerror', e => err.push('PAGEERROR: ' + e.message));
  await page.goto('http://localhost:8811/_smoketest_ec.html');
  await page.waitForTimeout(900);

  let soucis = 0;
  soucis += await controle(page, 'Accueil');

  await page.getByRole('button', { name: 'Entrée en mission', exact: true }).first().click();
  await page.waitForTimeout(500);
  soucis += await controle(page, 'Entrée en mission');

  await page.getByRole('button', { name: 'Anomalies', exact: true }).first().click();
  await page.waitForTimeout(500);
  soucis += await controle(page, 'Anomalies');

  await page.getByRole('button', { name: 'Préparer le contrôle', exact: true }).first().click();
  await page.waitForTimeout(500);
  soucis += await controle(page, 'Préparer le contrôle — synthèse');

  await page.locator('.controle-menu-item', { hasText: 'Manuel de procédures' }).first().click();
  await page.waitForTimeout(500);
  soucis += await controle(page, 'Manuel');

  await page.getByRole('button', { name: 'Paramètres', exact: true }).first().click();
  await page.waitForTimeout(500);
  soucis += await controle(page, 'Paramètres');

  console.log('\n' + (err.length ? err.join('\n') : 'aucune erreur console'));
  console.log(soucis ? `\n${soucis} écran(s) à corriger.` : '\nTout tient à 390 px.');
  await b.close();
  process.exit(soucis || err.length ? 1 : 0);
})();
