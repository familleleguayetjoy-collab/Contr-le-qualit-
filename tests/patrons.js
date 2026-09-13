/* Les six patrons d'écran — recette de la phase 1 de la refonte V3.
 *
 * Ouvre patrons.html et vérifie chaque patron à 1440 × 900, 1366 × 768 et sur
 * téléphone. Échoue si :
 *   — un écran de bureau exige un défilement vertical de la page ;
 *   — un élément déborde à droite hors d'un conteneur prévu pour cela ;
 *   — un contenu est coupé par le bas de la fenêtre ou de son cadre ;
 *   — une liste paginée défile en plus de sa pagination — c'est le défaut qui
 *     affichait une demi-ligne en bas de la campagne, six lignes ne tenant pas
 *     sous la barre de progression à 1366 × 768.
 *
 * Préalable : un serveur sur le port 8811 servant la racine du dépôt.
 * Usage : node tests/patrons.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
let echecs = 0;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const vp of [{ w: 1440, h: 900 }, { w: 1366, h: 768 }, { w: 390, h: 844 }]) {
    const p = await b.newPage({ viewport: { width: vp.w, height: vp.h } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errs.push('C: ' + m.text()); });
    await p.goto('http://localhost:8811/patrons.html', { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    for (const code of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']) {
      await p.locator('.page-header-actions button', { hasText: code }).click();
      await p.waitForTimeout(400);
      const m = await p.evaluate((mobile) => {
        const dw = document.documentElement.clientWidth;
        const dh = document.documentElement.clientHeight;
        const over = [], rognes = [];
        // Débordement horizontal, et contenu rogné par le bas de la fenêtre
        // ou par le cadre qui le porte : une ligne coupée en deux est un
        // défaut de forme, pas une commodité.
        document.querySelectorAll('.page *').forEach(el => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.position === 'fixed') return;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          // Un tableau large dans son propre conteneur à défilement latéral
          // est la convention admise : ce n'est pas un débordement de page.
          let dansScrollerX = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const acs = getComputedStyle(a);
            if ((acs.overflowX === 'auto' || acs.overflowX === 'scroll') && a.scrollWidth > a.clientWidth + 1) { dansScrollerX = true; break; }
          }
          if (r.right > dw + 2 && !dansScrollerX) over.push(el.className || el.tagName);
          // Sur téléphone la page défile : passer sous la ligne de flottaison
          // n'y est pas un rognage, c'est simplement le bas de la page.
          if (!mobile && r.top < dh - 4 && r.bottom > dh + 2) rognes.push('fenêtre/' + (el.className || el.tagName));
          let n = el.parentElement;
          while (n && n !== document.body) {
            const ncs = getComputedStyle(n);
            if (ncs.overflow === 'hidden' || ncs.overflowY === 'hidden') {
              const nr = n.getBoundingClientRect();
              if (r.top < nr.bottom - 4 && r.bottom > nr.bottom + 2) rognes.push((n.className || n.tagName) + '/' + (el.className || el.tagName));
              break;
            }
            n = n.parentElement;
          }
        });
        // Une liste paginée qui défile en plus de sa pagination, c'est une
        // demi-ligne affichée en bas du cadre : le défaut exact que la
        // pagination était censée supprimer.
        const listes = [];
        document.querySelectorAll('.table-wrap').forEach(tw => {
          if (tw.scrollHeight > tw.clientHeight + 1) listes.push(`table-wrap +${tw.scrollHeight - tw.clientHeight}px`);
        });
        return {
          scroll: document.documentElement.scrollHeight - window.innerHeight,
          titre: document.querySelector('h1').textContent,
          over: [...new Set(over)].slice(0, 3),
          rognes: [...new Set(rognes)].slice(0, 3),
          listes,
        };
      }, vp.w < 900);
      const mobile = vp.w < 900;
      const ko = (!mobile && m.scroll > 0) || m.over.length || m.rognes.length || m.listes.length;
      if (ko) echecs++;
      console.log(`${vp.w}x${vp.h} ${ko ? 'ÉCHEC ' : '  ok  '} ${String(m.scroll).padStart(4)}px  debord:${JSON.stringify(m.over)} rognes:${JSON.stringify(m.rognes)} listes:${JSON.stringify(m.listes)}  ${m.titre}`);
    }
    if (errs.length) { echecs += errs.length; console.log(`${vp.w}x${vp.h} erreurs :`, errs); }
    await p.close();
  }
  await b.close();
  console.log(echecs === 0
    ? '\nLes six patrons tiennent aux trois largeurs.'
    : `\n${echecs} anomalie(s) sur les patrons.`);
  process.exit(echecs === 0 ? 0 : 1);
})();
