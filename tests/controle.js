/* Contrôle demain, simulation, pack et journal — phase H (§ 31 à § 34).
 *
 * Ces quatre écrans répondent à la question de la veille d'un contrôle :
 * « suis-je prêt, et qu'est-ce que je montre ? ». Ils n'inventent aucune règle
 * métier : ils agrègent la matrice de preuves que les six autres modules
 * alimentent. C'est ce qui rend le pack opposable — chaque pièce vient d'un
 * travail réellement fait.
 *
 * Trois propriétés à prouver :
 *   1. aucun score de conformité nulle part (§ 38) ;
 *   2. le pack est immuable : une modification postérieure ne le change pas ;
 *   3. le journal trace ce qui a été validé, avec sa date et son auteur.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/controle.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(56)} ${detail === undefined ? '' : detail}`);
}

async function charger(page) {
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
}

async function geometrie(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight, dw = document.documentElement.clientWidth;
    const over = [], rognes = [];
    document.querySelectorAll('.page *').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.position === 'fixed') return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      let sx = false, sy = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if ((acs.overflowX === 'auto' || acs.overflowX === 'scroll') && a.scrollWidth > a.clientWidth + 1) sx = true;
        if ((acs.overflowY === 'auto' || acs.overflowY === 'scroll') && a.scrollHeight > a.clientHeight + 1) sy = true;
      }
      if (r.right > dw + 2 && !sx) over.push(el.className || el.tagName);
      if (r.top < vh - 1 && r.bottom > vh + 1 && !sy) rognes.push(el.className || el.tagName);
    });
    return {
      scroll: document.documentElement.scrollHeight - vh,
      titres: document.querySelectorAll('h1').length,
      over: [...new Set(over)].slice(0, 2),
      rognes: [...new Set(rognes)].slice(0, 2),
      score: /\d+\s?% conforme|score de conformité/i.test(document.body.innerText),
    };
  });
}

function verifierGeometrie(nom, g) {
  const ko = g.scroll > 0 || g.over.length || g.rognes.length || g.titres !== 1 || g.score;
  if (ko) echecs++;
  console.log(`  ${ko ? 'ÉCHEC' : 'OK  '}  ${nom.padEnd(56)} scroll ${g.scroll}px${g.over.length ? ' DÉBORDE ' + g.over : ''}${g.rognes.length ? ' ROGNÉ ' + g.rognes : ''}${g.score ? ' SCORE' : ''}`);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  for (const vp of [{ w: 1440, h: 900 }, { w: 1366, h: 768 }]) {
    console.log(`Contrôle demain (${vp.w} × ${vp.h})`);
    const page = await navigateur.newPage({ viewport: { width: vp.w, height: vp.h } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await charger(page);
    await page.evaluate(() => resetDemoData());
    await charger(page);

    await page.locator('.page-header-actions button', { hasText: 'Contrôle demain' }).click();
    await page.waitForTimeout(700);

    const vue = await page.evaluate(() => ({
      titre: (document.querySelector('h1') || {}).textContent,
      indicateurs: [...document.querySelectorAll('.controle-indicateur-valeur')].map(e => Number(e.textContent)),
      libelles: [...document.querySelectorAll('.controle-indicateur-libelle')].map(e => e.textContent),
      taches: document.querySelectorAll('.controle-tache').length,
      liens: [...document.querySelectorAll('.controle-tache button')].length,
      camembert: document.querySelectorAll('canvas, svg circle').length,
    }));
    verifier('l’écran s’ouvre', vue.titre === 'Contrôle demain', vue.titre);
    verifier('trois indicateurs, pas un score', vue.indicateurs.length === 3, vue.indicateurs.join(' / '));
    verifier('le troisième dit ce qui se traite ailleurs',
      /hors ComplyEC/i.test(vue.libelles[2] || ''), vue.libelles[2]);
    verifier('chaque tâche mène à un écran', vue.taches > 0 && vue.liens === vue.taches,
      `${vue.taches} tâches, ${vue.liens} liens`);
    verifier('aucun graphique', vue.camembert === 0, String(vue.camembert));
    verifierGeometrie('géométrie de Contrôle demain', await geometrie(page));

    // La première tâche doit ouvrir un écran réel.
    await page.locator('.controle-tache button').first().click();
    await page.waitForTimeout(700);
    const ouvert = await page.evaluate(() => ((document.querySelector('h1') || {}).textContent || '').trim());
    verifier('la première tâche ouvre un écran', !!ouvert, ouvert);

    if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs.slice(0, 3)); }
    await page.close();
  }

  // ------------------------------------------------- § 32 — Simulation
  console.log('Simulation de contrôle (§ 32)');
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await charger(page);
  await page.evaluate(() => resetDemoData());
  await charger(page);
  await page.locator('.page-header-actions button', { hasText: 'Contrôle demain' }).click();
  await page.waitForTimeout(700);
  await page.locator('button', { hasText: 'Simulation de contrôle' }).first().click();
  await page.waitForTimeout(700);

  const sim = await page.evaluate(() => ({
    titre: (document.querySelector('h1') || {}).textContent,
    rang: (document.querySelector('.parcours-rang') || {}).textContent,
    question: (document.querySelector('.simulation-question') || {}).textContent || '',
  }));
  verifier('la simulation s’ouvre', sim.titre === 'Simulation de contrôle', sim.titre);
  verifier('elle annonce le rang de la question', /Question \d+ sur \d+/.test(sim.rang), sim.rang);
  verifier('la question est posée comme un contrôleur la pose',
    sim.question.length > 20 && /[?»]/.test(sim.question), sim.question.slice(0, 60));

  // On parcourt toutes les questions : chacune doit porter une preuve ou une action.
  const nb = Number((sim.rang.match(/sur (\d+)/) || [0, 0])[1]);
  verifier('huit à dix questions', nb >= 6 && nb <= 12, `${nb} questions`);
  let sansAction = 0;
  for (let i = 0; i < nb; i++) {
    const q = await page.evaluate(() => ({
      question: (document.querySelector('.simulation-question') || {}).textContent || '',
      boutons: [...document.querySelectorAll('.parcours-contenu button')].map(b => b.textContent.trim()),
    }));
    if (!q.question || !q.boutons.length) sansAction++;
    verifierGeometrie(`question ${i + 1}`, await geometrie(page));
    const suivant = page.locator('.parcours-pied button', { hasText: 'Question suivante' });
    if (await suivant.count()) { await suivant.click(); await page.waitForTimeout(550); }
  }
  verifier('chaque question porte une preuve ou une action', sansAction === 0, `${sansAction} sans action`);

  // ------------------------------------------------- § 33 — Pack immuable
  console.log('Pack de contrôle (§ 33)');
  await charger(page);
  await page.locator('.page-header-actions button', { hasText: 'Contrôle demain' }).click();
  await page.waitForTimeout(700);
  await page.locator('button', { hasText: 'Préparer le pack de contrôle' }).first().click();
  await page.waitForTimeout(700);

  const avant = await page.evaluate(() => dbPacks().length);
  await page.locator('.page-header-actions button', { hasText: 'Préparer un pack' }).click();
  await page.waitForTimeout(800);
  const apres = await page.evaluate(() => {
    const p = dbPacks();
    return { nb: p.length, disponibles: p[0].disponibles, annexes: p[0].annexes.length,
             utilisateur: p[0].utilisateur, heure: p[0].heure, manuel: p[0].manuel };
  });
  verifier('un pack est arrêté', apres.nb === avant + 1, `${avant} → ${apres.nb}`);
  verifier('il porte sa date, son heure et son auteur',
    !!apres.heure && !!apres.utilisateur, `${apres.heure} · ${apres.utilisateur}`);
  verifier('il contient l’index des preuves', apres.annexes > 0, `${apres.annexes} annexes`);
  verifier('aucun faux bouton d’archive ZIP',
    !(await page.evaluate(() => /Télécharger le pack/.test(document.body.innerText))));
  verifierGeometrie('géométrie du pack', await geometrie(page));

  /* Le pack est immuable. On prend son empreinte, on fait bouger le cabinet
     pour de bon — on renseigne toutes les informations manquantes, ce qui
     change l'état de plusieurs pièces — et on vérifie que l'empreinte du pack
     est restée identique au caractère près. C'est ce qui permet à un
     contrôleur de revenir sur un pack de la semaine dernière et d'y retrouver
     ce qu'il a vu. */
  const empreinteAvant = await page.evaluate(() => JSON.stringify(dbPacks()[0]));
  const bougeAvant = await page.evaluate(() => preparationControleQualite(dbReglages()).aTraiter);
  await page.evaluate(async () => {
    await dbConfirmerInformations(infosAConfirmer().map(i => i.cle));
    for (const i of infosManquantes()) await dbMajInformation(i.cle, 'Valeur saisie pour la recette');
    await dbPublierManuel({ numero: 'v9.0', objet: 'Recette du pack.' });
  });
  await page.waitForTimeout(500);
  await charger(page);
  const apresModif = await page.evaluate(() => ({
    empreinte: JSON.stringify(dbPacks()[0]),
    bouge: preparationControleQualite(dbReglages()).aTraiter,
  }));
  verifier('le cabinet a réellement bougé', apresModif.bouge !== bougeAvant,
    `${bougeAvant} → ${apresModif.bouge} pièces à compléter`);
  verifier('le pack ne bouge pas quand le cabinet bouge',
    apresModif.empreinte === empreinteAvant,
    apresModif.empreinte === empreinteAvant ? 'empreinte identique' : 'EMPREINTE MODIFIÉE');

  // ------------------------------------------------- § 34 — Journal
  console.log('Journal des validations (§ 34)');
  await page.locator('.page-header-actions button', { hasText: 'Contrôle demain' }).click();
  await page.waitForTimeout(700);
  await page.locator('button', { hasText: 'Préparer le pack de contrôle' }).first().click();
  await page.waitForTimeout(700);
  await page.locator('button', { hasText: 'Journal des validations' }).first().click();
  await page.waitForTimeout(700);

  const journal = await page.evaluate(() => ({
    titre: (document.querySelector('h1') || {}).textContent,
    colonnes: [...document.querySelectorAll('thead th')].map(e => e.textContent.replace(/[▲▼↕]/g, '').trim()),
    lignes: document.querySelectorAll('tbody tr').length,
    entrees: dbJournal().length,
  }));
  verifier('le journal s’ouvre', journal.titre === 'Journal des validations', journal.titre);
  verifier('date, auteur, action, élément, référence',
    ['Date', 'Par', 'Action', 'Élément', 'Référence'].every(c => journal.colonnes.includes(c)),
    journal.colonnes.join(' · '));
  verifier('les validations y figurent', journal.lignes > 0, `${journal.entrees} entrées`);
  verifier('la préparation du pack est tracée',
    await page.evaluate(() => dbJournal().some(j => /Pack de contrôle préparé/.test(j.action))));
  verifier('le journal n’est pas une entrée de la barre latérale',
    !(await page.evaluate(() => [...document.querySelectorAll('.nav-item')].some(n => /Journal/.test(n.innerText)))));
  verifierGeometrie('géométrie du journal', await geometrie(page));

  await page.evaluate(() => resetDemoData());
  if (erreurs.length) { echecs += erreurs.length; console.log('  ERREURS JS :', erreurs.slice(0, 3)); }
  await page.close();
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLa veille du contrôle, ComplyEC dit ce qui est prêt et fige ce qu’il montre.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
