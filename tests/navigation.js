/* Navigation — recette de la phase B du V6.
 *
 * Parcourt les sept entrées de la barre latérale, les sept étapes du parcours
 * guidé, et pour chaque hub ouvre chacune de ses cartes. Échoue si :
 *   — un écran de bureau exige un défilement vertical de la page ;
 *   — un élément déborde à droite hors d'un conteneur prévu pour cela ;
 *   — une page porte un sous-titre sous son H1, que le cahier interdit ;
 *   — un écran ne rend pas de titre — un hub qui mène nulle part ;
 *   — une erreur JavaScript survient.
 *
 * Vérifie aussi que la barre latérale entière tient à 1366 × 768, qu'un seul
 * H1 est rendu par écran — deux titres feraient croire qu'on a changé de page
 * sans avoir bougé — et que les anciennes adresses résolvent toujours vers
 * leur nouvel emplacement (§ 40).
 *
 * Préalable : un serveur sur le port 8811 et le harnais _smoketest_ec.html.
 * Usage : node tests/navigation.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ENTREES = [
  'Accueil', 'Entrée en mission', 'Dossiers & anomalies',
  'Préparer mon contrôle', 'LBC-FT',
  'Documents du cabinet', 'Manuel de procédures',
];

const ETAPES = [
  'Cabinet & documents', 'Gouvernance', 'Ressources', 'Missions',
  'LBC-FT', 'Surveillance & qualité', 'Manuel & contrôle',
];

/* Les anciennes adresses et ce qu'elles doivent ouvrir. Un lien gardé dans un
   écran non repris, ou un signet, ne doit jamais tomber sur un écran blanc. */
const ANCIENNES_ROUTES = [
  { de: ['gouvernance', null], vers: ['parcours', 'gouvernance'] },
  { de: ['ressources', null], vers: ['parcours', 'ressources'] },
  { de: ['cycle-client', null], vers: ['parcours', 'missions'] },
  { de: ['qualite', null], vers: ['parcours', 'qualite'] },
  { de: ['conformite', null], vers: ['parcours', 'gouvernance'] },
  { de: ['vigilance', null], vers: ['vigilance', null] },
  { de: ['gouvernance', 'independance'], vers: ['gouvernance', 'independance'] },
  { de: ['ressources', 'formation'], vers: ['ressources', 'formation'] },
  { de: ['qualite', 'non-conformites'], vers: ['qualite', 'non-conformites'] },
  { de: ['bilan', null], vers: ['cycle-client', 'supervision'] },
  { de: ['equipe', null], vers: ['ressources', 'equipe'] },
  { de: ['vigilance', 'analyses'], vers: ['vigilance', 'portefeuille'] },
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
      nbTitres: document.querySelectorAll('h1').length,
      scroll: estMobile ? 0 : document.documentElement.scrollHeight - window.innerHeight,
      titre: h1 ? h1.textContent.trim() : null,
      sousTitre: !!document.querySelector('.page-header .subtitle'),
      over: [...new Set(over)].slice(0, 2),
      cartes: document.querySelectorAll('.hub-carte').length,
    };
  }, mobile);
}

function verdict(vp, contexte, m) {
  const ko = m.scroll > 0 || m.over.length || m.sousTitre || !m.titre || m.nbTitres !== 1;
  if (ko) echecs++;
  console.log(`${vp} ${ko ? 'ÉCHEC ' : '  ok  '} ${String(m.scroll).padStart(4)}px ${m.sousTitre ? 'SOUS-TITRE' : '          '} ${m.nbTitres !== 1 ? m.nbTitres + ' TITRES' : '        '} ${String(m.cartes || '').padStart(2)}c  ${contexte} → ${m.titre || 'AUCUN TITRE'}`);
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
        chevrons: document.querySelectorAll('.sidebar .nav-chevron, .sidebar .nav-submenu').length,
        dernierVisible: dernier ? dernier.getBoundingClientRect().bottom <= window.innerHeight + 1 : false,
      };
    });
    const barreKo = barre.deborde > 0 || !barre.dernierVisible
      || barre.entrees !== ENTREES.length || barre.groupes !== 2 || barre.chevrons > 0;
    if (barreKo) echecs++;
    console.log(`${etiquette} ${barreKo ? 'ÉCHEC ' : '  ok  '} barre latérale : ${barre.entrees} entrées, ${barre.groupes} groupes, ${barre.chevrons} chevron(s), débordement ${barre.deborde}px, dernière entrée visible ${barre.dernierVisible}`);

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
    /* Les sept étapes du parcours : c'est le même module que le raccourci de
       la barre latérale, encadré. Deux implémentations, ce serait deux
       vérités (§ 11). */
    await page.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
    await page.waitForTimeout(450);
    for (const etape of ETAPES) {
      await page.locator('.parcours-fil-etape', { hasText: etape }).first().click();
      await page.waitForTimeout(500);
      verdict(etiquette, `étape ${etape}`, await mesurer(page, false));
    }

    /* Les paramètres vivent dans le pied, pas dans les sept entrées. */
    await page.locator('.switch-space-btn', { hasText: 'Paramètres' }).first().click();
    await page.waitForTimeout(450);
    verdict(etiquette, 'Paramètres (pied de barre)', await mesurer(page, false));

    /* Anciennes adresses : chacune doit résoudre vers son nouvel emplacement. */
    for (const r of ANCIENNES_ROUTES) {
      const obtenu = await page.evaluate(([s, ss]) => routeEc(s, ss), r.de);
      const ok = obtenu[0] === r.vers[0] && (obtenu[1] || null) === (r.vers[1] || null);
      if (!ok) echecs++;
      console.log(`${etiquette} ${ok ? '  ok  ' : 'ÉCHEC '} route ${r.de.filter(Boolean).join('/')} → ${obtenu.filter(Boolean).join('/')}`);
    }

    if (erreurs.length) { echecs += erreurs.length; console.log(`${etiquette} ERREURS JS :`, erreurs); }
    await page.close();
  }

  await navigateur.close();
  console.log(echecs === 0
    ? '\nNavigation V6 : sept entrées, sept étapes, et aucune ancienne adresse perdue.'
    : `\n${echecs} anomalie(s) de navigation.`);
  process.exit(echecs === 0 ? 0 : 1);
})();
