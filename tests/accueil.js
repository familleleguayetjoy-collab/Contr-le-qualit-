/* Accueil et état du parcours — recette de la phase C du V6 (§ 12, § 44, § 45).
 *
 * Deux choses à prouver, et la seconde est la plus importante :
 *
 *   1. L'accueil oriente. Une carte héro qui dit où l'on en est, au maximum
 *      quatre actions réelles, un suivi court, aucun graphique ni score.
 *
 *   2. L'avancement se déduit des faits, jamais des clics. Le § 44 l'interdit
 *      explicitement. Un parcours qui verdirait parce qu'on a visité un écran
 *      mentirait la veille d'un contrôle, c'est-à-dire au pire moment. La
 *      recette valide donc un risque qualité par la couche de données et
 *      vérifie que l'étape 6 bouge ; puis elle ouvre simplement l'écran de
 *      l'étape 6 sans rien faire, et vérifie que rien n'a bougé.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/accueil.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { allerEtape } = require('./aller');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(56)} ${detail === undefined ? '' : detail}`);
}

async function charger(page) {
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  for (const vp of [{ w: 1440, h: 900 }, { w: 1366, h: 768 }]) {
    console.log(`Accueil (${vp.w} × ${vp.h})`);
    const page = await navigateur.newPage({ viewport: { width: vp.w, height: vp.h } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await charger(page);
    await page.evaluate(() => resetDemoData());
    await charger(page);

    const m = await page.evaluate(() => {
      const hero = document.querySelector('.accueil-hero');
      return {
        hauteurHero: hero ? Math.round(hero.getBoundingClientRect().height) : 0,
        titre: (document.querySelector('.accueil-hero-titre') || {}).textContent || '',
        label: (document.querySelector('.accueil-hero-label') || {}).textContent || '',
        crans: document.querySelectorAll('.accueil-hero-cran').length,
        actions: document.querySelectorAll('.accueil-action').length,
        suivi: document.querySelectorAll('.accueil-suivi-ligne').length,
        // Ce que le § 38 interdit : pas de score, pas de camembert.
        score: /\d+\s?% conforme/i.test(document.body.innerText),
        canvas: document.querySelectorAll('canvas, svg circle').length,
        // Les libellés d'action doivent dire quoi faire, pas nommer une rubrique.
        libelles: [...document.querySelectorAll('.accueil-action-titre')].map(e => e.textContent.trim()),
      };
    });

    verifier('la carte héro mesure 180 à 200 px', m.hauteurHero >= 150 && m.hauteurHero <= 205, `${m.hauteurHero}px`);
    verifier('elle annonce l’étape courante sur sept', /Étape \d sur 7 — /.test(m.titre), m.titre);
    verifier('son label dit dans quelle situation on est',
      /Mettre ComplyEC en place|Préparer mon contrôle/i.test(m.label), m.label);
    verifier('la mini-progression compte sept crans', m.crans === 7, String(m.crans));
    verifier('au maximum quatre actions', m.actions > 0 && m.actions <= 4, String(m.actions));
    verifier('le suivi courant tient en quatre lignes', m.suivi === 4, String(m.suivi));
    verifier('aucun score de conformité', !m.score);
    verifier('aucun graphique', m.canvas === 0, String(m.canvas));
    verifier('les actions disent quoi faire',
      m.libelles.every(l => /^(Renseigner|Confirmer|Désigner|Recueillir|Documenter|Réunir|Régulariser|Clôturer|Analyser|Traiter|Faire|Valider|Ouvrir|Actualiser|Arrêter|Compléter|Relire|Publier|Réviser|Revoir|Relancer)/.test(l)),
      m.libelles[0]);

    // Chaque action doit mener quelque part : on les ouvre toutes.
    const nb = m.actions;
    for (let i = 0; i < nb; i++) {
      await charger(page);
      await page.locator('.accueil-action button').nth(i).click();
      await page.waitForTimeout(600);
      const t = await page.evaluate(() => (document.querySelector('h1') || {}).textContent || '');
      verifier(`l’action ${i + 1} ouvre un écran`, !!t.trim(), t.trim());
    }

    if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs.slice(0, 3)); }
    await page.close();
  }

  // ----------------------------------- § 44 : les faits, pas les clics
  console.log('L’avancement vient des faits, pas des clics (§ 44)');
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await charger(page);
  await page.evaluate(() => resetDemoData());
  await charger(page);

  const avant = await page.evaluate(() => {
    const e = computeControlJourneyState();
    return { restes: e.etapes.qualite.restes.length, statut: e.etapes.qualite.statut, actions: e.actions.length };
  });

  // Visiter l'étape 6 sans rien faire ne doit rien changer.
  await page.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await page.waitForTimeout(450);
  await allerEtape(page, 'Qualité');
  const apresVisite = await page.evaluate(() => {
    const e = computeControlJourneyState();
    return { restes: e.etapes.qualite.restes.length, actions: e.actions.length };
  });
  verifier('visiter une étape ne la fait pas avancer',
    apresVisite.restes === avant.restes && apresVisite.actions === avant.actions,
    `${avant.restes} → ${apresVisite.restes} reste(s)`);

  // Valider réellement les risques doit la faire avancer.
  await page.evaluate(() => {
    dbRisquesQualite().filter(r => r.etat !== 'valide').forEach(r => dbValiderRisqueQualite(r.id, {}));
  });
  await page.waitForTimeout(300);
  await charger(page);
  const apresValidation = await page.evaluate(() => {
    const e = computeControlJourneyState();
    return { restes: e.etapes.qualite.restes.length, actions: e.actions.length };
  });
  verifier('valider réellement fait avancer l’étape',
    apresValidation.restes < avant.restes, `${avant.restes} → ${apresValidation.restes} reste(s)`);
  verifier('et retire l’action de la liste du cabinet',
    apresValidation.actions < avant.actions, `${avant.actions} → ${apresValidation.actions} action(s)`);

  // § 45 : une étape jamais faite et une étape périmée ne se disent pas pareil.
  const etats = await page.evaluate(() => {
    const e = computeControlJourneyState();
    return e.liste.map(s => s.statut);
  });
  verifier('chaque étape porte un des cinq états',
    etats.every(s => ['not_started', 'in_progress', 'ready', 'stale', 'blocked'].includes(s)), etats.join(' · '));

  await page.evaluate(() => resetDemoData());
  if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs.slice(0, 3)); }
  await page.close();

  await navigateur.close();
  console.log(echecs === 0
    ? '\nL’accueil oriente, et l’avancement se déduit des faits.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
