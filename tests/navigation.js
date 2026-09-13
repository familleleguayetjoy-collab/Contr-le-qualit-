/* Navigation V3 — recette de la phase 2.
 *
 * Parcourt les onze entrées de la barre latérale et, pour chaque hub, ouvre
 * chacune de ses cartes. Échoue si :
 *   — un écran de bureau exige un défilement vertical de la page ;
 *   — un élément déborde à droite hors d'un conteneur prévu pour cela ;
 *   — une page porte un sous-titre sous son H1, que le cahier interdit ;
 *   — un écran ne rend pas de titre — un hub qui mène nulle part ;
 *   — une erreur JavaScript survient.
 *
 * Vérifie aussi que la barre latérale entière tient à 1366 × 768 : onze
 * entrées en quatre groupes, c'est le format le plus serré du cahier.
 *
 * Préalable : un serveur sur le port 8811 et le harnais _smoketest_ec.html.
 * Usage : node tests/navigation.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ENTREES = [
  'Accueil', 'Entrée en mission', 'Dossiers & anomalies',
  'Gouvernance', 'Ressources', 'Cycle de la relation client',
  'LBC-FT', 'Surveillance & qualité',
  'Documents du cabinet', 'Manuel de procédures', 'Paramètres',
];

let echecs = 0;

async function mesurer(page, mobile) {
  return page.evaluate((estMobile) => {
    const dw = document.documentElement.clientWidth;
    const over = [];
    document.querySelectorAll('.page *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.position === 'fixed') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      let dansScrollerX = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if ((acs.overflowX === 'auto' || acs.overflowX === 'scroll') && a.scrollWidth > a.clientWidth + 1) { dansScrollerX = true; break; }
      }
      if (r.right > dw + 2 && !dansScrollerX) over.push(el.className || el.tagName);
    });
    const h1 = document.querySelector('h1');
    return {
      scroll: estMobile ? 0 : document.documentElement.scrollHeight - window.innerHeight,
      titre: h1 ? h1.textContent.trim() : null,
      sousTitre: !!document.querySelector('.page-header .subtitle'),
      over: [...new Set(over)].slice(0, 2),
      cartes: document.querySelectorAll('.hub-carte').length,
    };
  }, mobile);
}

function verdict(vp, contexte, m) {
  const ko = m.scroll > 0 || m.over.length || m.sousTitre || !m.titre;
  if (ko) echecs++;
  console.log(`${vp} ${ko ? 'ÉCHEC ' : '  ok  '} ${String(m.scroll).padStart(4)}px ${m.sousTitre ? 'SOUS-TITRE' : '          '} ${String(m.cartes || '').padStart(2)}c  ${contexte} → ${m.titre || 'AUCUN TITRE'}`);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  for (const vp of [{ w: 1440, h: 900 }, { w: 1366, h: 768 }]) {
    const page = await navigateur.newPage({ viewport: { width: vp.w, height: vp.h } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const etiquette = `${vp.w}x${vp.h}`;

    // La barre latérale doit tenir en entier : une entrée de menu hors champ
    // est une fonction que personne ne trouvera.
    const barre = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const items = [...document.querySelectorAll('.nav-item')];
      const dernier = items[items.length - 1];
      return {
        entrees: items.length,
        groupes: document.querySelectorAll('.nav-group').length,
        deborde: nav.scrollHeight - nav.clientHeight,
        dernierVisible: dernier ? dernier.getBoundingClientRect().bottom <= window.innerHeight + 1 : false,
      };
    });
    const barreKo = barre.deborde > 0 || !barre.dernierVisible || barre.entrees !== ENTREES.length;
    if (barreKo) echecs++;
    console.log(`${etiquette} ${barreKo ? 'ÉCHEC ' : '  ok  '} barre latérale : ${barre.entrees} entrées, ${barre.groupes} groupes, débordement ${barre.deborde}px, dernière entrée visible ${barre.dernierVisible}`);

    for (const entree of ENTREES) {
      await page.locator('.nav-item', { hasText: entree }).first().click();
      await page.waitForTimeout(450);
      verdict(etiquette, entree, await mesurer(page, false));

      // Chaque carte d'un hub doit mener quelque part.
      const nbCartes = await page.locator('.hub-carte').count();
      for (let i = 0; i < nbCartes; i++) {
        await page.locator('.hub-carte').nth(i).click();
        await page.waitForTimeout(450);
        verdict(etiquette, `${entree} · carte ${i + 1}`, await mesurer(page, false));
        const retour = page.locator('.page-header-actions button', { hasText: 'Retour' });
        if (await retour.count()) { await retour.first().click(); await page.waitForTimeout(400); }
        else { await page.locator('.nav-item', { hasText: entree }).first().click(); await page.waitForTimeout(400); }
      }
    }
    if (erreurs.length) { echecs += erreurs.length; console.log(`${etiquette} ERREURS JS :`, erreurs); }
    await page.close();
  }

  await navigateur.close();
  console.log(echecs === 0
    ? '\nNavigation V3 complète : chaque entrée et chaque carte mène à un écran.'
    : `\n${echecs} anomalie(s) de navigation.`);
  process.exit(echecs === 0 ? 0 : 1);
})();
