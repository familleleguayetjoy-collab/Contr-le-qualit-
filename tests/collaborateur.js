/* Espace collaborateur et vue mobile — non-régression exigée par le § 39.
 *
 * La refonte de la navigation ne concerne que l'espace expert-comptable. Mais
 * la barre latérale est le même composant pour les deux espaces : une
 * modification qui casserait NAV_COLLAB ne se verrait nulle part ailleurs, et
 * les collaborateurs sont ceux qui utilisent le logiciel tous les jours.
 *
 * Vérifie aussi le tiroir mobile des deux espaces : à 390 px, la barre
 * latérale disparaît derrière un hamburger, et une entrée qu'on ne peut plus
 * atteindre est une fonction perdue.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/collaborateur.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(54)} ${detail === undefined ? '' : detail}`);
}

async function auditer(page) {
  return page.evaluate(() => {
    const dw = document.documentElement.clientWidth;
    const over = [];
    document.querySelectorAll('.page *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.position === 'fixed') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      let sx = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if ((acs.overflowX === 'auto' || acs.overflowX === 'scroll') && a.scrollWidth > a.clientWidth + 1) { sx = true; break; }
      }
      if (r.right > dw + 2 && !sx) over.push(el.className || el.tagName);
    });
    const h1 = document.querySelector('h1');
    return { titre: h1 ? h1.textContent.trim() : null, over: [...new Set(over)].slice(0, 2) };
  });
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  // ------------------------------------------ Espace collaborateur, bureau
  console.log('Espace collaborateur (1366 × 768)');
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8811/_smoketest_collab.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const barre = await page.evaluate(() => ({
    entrees: [...document.querySelectorAll('.nav-item .nav-label')].map(e => e.textContent.trim()),
    groupes: document.querySelectorAll('.nav-group').length,
    sousMenus: document.querySelectorAll('.nav-submenu, .nav-chevron').length,
    deborde: (n => n.scrollHeight - n.clientHeight)(document.querySelector('.sidebar-nav')),
    parametres: [...document.querySelectorAll('.switch-space-btn')].map(e => e.innerText.trim()),
  }));
  verifier('les sept entrées collaborateur sont là', barre.entrees.length === 7, barre.entrees.join(' · '));
  verifier('ses deux groupes sont conservés', barre.groupes === 2, String(barre.groupes));
  verifier('son sous-menu Dossiers fonctionne encore', barre.sousMenus > 0, `${barre.sousMenus} élément(s)`);
  verifier('la barre tient sans défiler', barre.deborde <= 0, `${barre.deborde}px`);
  verifier('aucun bouton Paramètres dans son pied',
    !barre.parametres.some(t => /Paramètres/.test(t)), barre.parametres.join(' | '));

  for (const entree of barre.entrees) {
    await page.locator('.nav-item', { hasText: entree }).first().click();
    await page.waitForTimeout(500);
    const a = await auditer(page);
    verifier(`« ${entree} » ouvre un écran`, !!a.titre && !a.over.length, a.titre || (a.over.length ? 'DÉBORDE ' + a.over : 'AUCUN TITRE'));
  }
  if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs.slice(0, 3)); }
  await page.close();

  // ------------------------------------------------- Tiroir mobile, 390 px
  for (const [espace, fichier, attendu] of [['expert-comptable', '_smoketest_ec.html', 7], ['collaborateur', '_smoketest_collab.html', 7]]) {
    console.log(`Tiroir mobile — espace ${espace} (390 × 844)`);
    const mob = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
    const errsMob = [];
    mob.on('pageerror', e => errsMob.push(e.message));
    await mob.goto('http://localhost:8811/' + fichier, { waitUntil: 'networkidle' });
    await mob.waitForTimeout(600);

    const avant = await mob.evaluate(() => {
      const s = document.querySelector('.sidebar');
      const b = document.querySelector('.hamburger-btn');
      const r = b ? b.getBoundingClientRect() : null;
      return {
        barreVisible: s.getBoundingClientRect().left >= 0 && getComputedStyle(s).display !== 'none',
        hamburger: !!b, taille: r ? Math.round(Math.min(r.width, r.height)) : 0,
      };
    });
    verifier('la barre latérale est repliée', !avant.barreVisible);
    verifier('le hamburger est présent et cliquable', avant.hamburger && avant.taille >= 38, `${avant.taille}px`);

    await mob.locator('.hamburger-btn').first().click();
    await mob.waitForTimeout(450);
    const ouvert = await mob.evaluate(() => {
      const s = document.querySelector('.sidebar');
      const r = s.getBoundingClientRect();
      return {
        largeur: Math.round(r.width),
        visible: r.left >= -1,
        entrees: document.querySelectorAll('.sidebar.mobile-open .nav-item').length,
        dernierVisible: (i => (i ? i.getBoundingClientRect().bottom <= window.innerHeight + 1 : false))(
          [...document.querySelectorAll('.sidebar .nav-item')].pop()),
      };
    });
    verifier('le tiroir s’ouvre', ouvert.visible && ouvert.largeur <= 300, `${ouvert.largeur}px`);
    verifier('toutes les entrées y sont', ouvert.entrees === attendu, String(ouvert.entrees));
    verifier('la dernière entrée est atteignable', ouvert.dernierVisible);

    const a = await auditer(mob);
    verifier('l’écran ne déborde pas à 390 px', !a.over.length, a.over.length ? String(a.over) : 'aucun débordement');
    if (errsMob.length) { echecs += errsMob.length; console.log('  ERREURS JS :', errsMob.slice(0, 3)); }
    await mob.close();
  }

  await navigateur.close();
  console.log(echecs === 0
    ? '\nL’espace collaborateur est intact et les deux tiroirs mobiles fonctionnent.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
