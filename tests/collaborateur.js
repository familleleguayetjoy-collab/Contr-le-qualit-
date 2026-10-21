/* Recette « collaborateur » — l'espace du collaborateur.

 * Depuis le 21 octobre, il a cinq entrées, dans la même barre et les mêmes
 * teintes que celle de l'expert-comptable. La recette vérifie :
 *   — les cinq entrées, et qu'aucune de l'expert-comptable n'y a fui ;
 *   — que chaque écran tient, au bureau comme sur téléphone ;
 *   — que le registre des bénéficiaires effectifs ne s'ouvre pas : le
 *     collaborateur prévient l'expert-comptable, qui le voit sur sa ligne ;
 *   — que la pièce déposée reçoit son nom et règle l'anomalie.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/collaborateur.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;
function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'ok   ' : 'ÉCHEC'}  ${libelle.padEnd(52)} ${detail === undefined ? '' : detail}`);
}

/* Ce qui dépasse réellement du cadre — hors bandes qui défilent, où c'est le
   principe même. */
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

const ENTREES = ['Accueil', 'Entrée en mission', 'Anomalies', 'Mes obligations', 'Paramètres'];

(async () => {
  const navigateur = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });

  // ------------------------------------------ Espace collaborateur, bureau
  console.log('Espace collaborateur (1366 × 768)');
  /* Un contexte partagé : la page de l'expert-comptable, ouverte plus bas,
     lit le même stockage que celle du collaborateur. */
  const contexte = await navigateur.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) erreurs.push(m.text());
  });
  await page.goto('http://localhost:8811/_smoketest_collab.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const barre = await page.evaluate(() => ({
    entrees: [...document.querySelectorAll('.nav-item .nav-label')].map(e => e.textContent.trim()),
    deborde: (n => (n ? n.scrollHeight - n.clientHeight : 0))(document.querySelector('.sidebar-nav')),
  }));
  verifier('les cinq entrées du collaborateur', JSON.stringify(barre.entrees) === JSON.stringify(ENTREES), barre.entrees.join(' | '));
  verifier('aucune entrée de l’expert-comptable n’a fui ici',
    !barre.entrees.some(t => /Préparer le contrôle/.test(t)), barre.entrees.join(' | '));
  verifier('la barre latérale ne déborde pas', barre.deborde <= 0, `${barre.deborde}px`);

  for (const entree of ENTREES) {
    await page.locator('.nav-item', { hasText: entree }).first().click();
    await page.waitForTimeout(600);
    const a = await auditer(page);
    verifier(`« ${entree} »`, !!a.titre && !a.over.length,
      (a.titre || 'aucun titre') + (a.over.length ? ' DÉBORDE ' + a.over : ''));
  }

  // ----------------------------- Le RBE se signale, il ne se consulte pas
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* */ } });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.locator('.nav-item', { hasText: 'Anomalies' }).first().click();
  await page.waitForTimeout(400);
  await page.locator('.nav-sous-item', { hasText: 'RBE' }).first().click();
  await page.waitForTimeout(400);
  verifier('aucun lien vers le registre côté collaborateur',
    await page.locator('.page .lien-dossier').count() === 0);
  await page.getByRole('button', { name: 'Signaler à l’expert-comptable' }).first().click();
  await page.waitForTimeout(350);
  const signale = await page.locator('.signal-fait').count();
  verifier('le signalement est enregistré', signale === 1, String(signale));
  const ec = await contexte.newPage();
  await ec.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await ec.waitForTimeout(600);
  await ec.locator('.nav-item', { hasText: 'Anomalies' }).first().click();
  await ec.waitForTimeout(350);
  await ec.locator('.nav-sous-item', { hasText: 'RBE' }).first().click();
  await ec.waitForTimeout(400);
  const recu = await ec.locator('.signal-recu').allInnerTexts();
  verifier('l’expert-comptable voit le signalement', recu.length === 1 && /Julie Bernard/.test(recu[0]), recu.join(' | '));
  await ec.close();

  // ------------------------------- La pièce déposée reçoit son nom
  await page.locator('.nav-sous-item', { hasText: 'Lettres de mission' }).first().click();
  await page.waitForTimeout(400);
  const avantDepot = await page.locator('tbody tr').count();
  await page.locator('tbody tr').first().click();
  await page.getByRole('button', { name: 'Déposer la pièce' }).click();
  await page.waitForTimeout(400);
  await page.locator('.depot-fichier input').setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.waitForTimeout(200);
  const nomDonne = await page.locator('.depot-nom code').innerText();
  verifier('le nom de la pièce suit la règle', /^\d{4}-\d{2}_LDM_[A-Za-z0-9-]+\.pdf$/.test(nomDonne), nomDonne);
  await page.getByRole('button', { name: 'Valider le dépôt' }).click();
  await page.waitForTimeout(500);
  const apresDepot = await page.locator('tbody tr').count();
  verifier('le dépôt règle l’anomalie', apresDepot === avantDepot - 1, `${avantDepot} → ${apresDepot}`);

  verifier('aucune erreur console', erreurs.length === 0, erreurs.slice(0, 2).join(' / '));
  await page.close();

  // ------------------------------------------------- Tiroir mobile, 390 px
  console.log('Tiroir mobile du collaborateur (390 × 844)');
  const mob = await navigateur.newPage({ viewport: { width: 390, height: 844 } });
  const errsMob = [];
  mob.on('pageerror', e => errsMob.push(e.message));
  await mob.goto('http://localhost:8811/_smoketest_collab.html', { waitUntil: 'networkidle' });
  await mob.waitForTimeout(700);

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
  await mob.waitForTimeout(500);
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
  verifier('les cinq entrées y sont', ouvert.entrees === 5, String(ouvert.entrees));
  verifier('la dernière entrée est atteignable', ouvert.dernierVisible);

  await mob.keyboard.press('Escape').catch(() => {});
  await mob.locator('.sidebar-backdrop').click({ force: true }).catch(() => {});
  await mob.waitForTimeout(400);

  for (const entree of ENTREES) {
    /* Une entrée à sous-menu laisse volontairement le tiroir ouvert, pour
       qu'on puisse enchaîner sur une autre de ses lignes : on ne rappuie donc
       sur le hamburger que si le tiroir s'est bien refermé. */
    const ouvertDeja = await mob.locator('.sidebar.mobile-open').count();
    if (!ouvertDeja) {
      await mob.locator('.hamburger-btn').first().click();
      await mob.waitForTimeout(400);
    }
    await mob.locator('.nav-item', { hasText: entree }).first().click();
    await mob.waitForTimeout(650);
    const a = await auditer(mob);
    const scrollX = await mob.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    verifier(`« ${entree} » tient à 390 px`, !!a.titre && !a.over.length && scrollX <= 0,
      (a.titre || 'aucun titre') + (a.over.length ? ' DÉBORDE ' + a.over : '')
      + (scrollX > 0 ? ' scrollX ' + scrollX : ''));
  }
  verifier('aucune erreur console sur téléphone', errsMob.length === 0, errsMob.slice(0, 2).join(' / '));
  await mob.close();

  await navigateur.close();
  console.log(echecs
    ? `\n${echecs} anomalie(s) dans l’espace collaborateur.`
    : '\nL’espace collaborateur tient, au bureau comme sur téléphone.');
  process.exit(echecs ? 1 : 0);
})();
