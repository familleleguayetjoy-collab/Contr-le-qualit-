/* Surveillance et qualité — recette de la phase 6.
 *
 * Vérifie que les écrans S43 à S50 font ce que le cahier demande :
 *   — la cartographie qualité se feuillette en cartes, pas en tableau dense ;
 *   — une fiche risque sépare ce que nous savons de ce que nous décidons, et
 *     rien ne s'auto-valide ;
 *   — le registre des non-conformités réutilise la mise en page des anomalies,
 *     et une non-conformité ne se clôt qu'après contrôle d'efficacité ;
 *   — l'échantillon de surveillance est motivé dossier par dossier et reste
 *     modifiable — aucune sélection automatique irréversible ;
 *   — un point de contrôle se cote d'un clic ;
 *   — le rapport se lit avant d'être finalisé ;
 *   — l'évaluation annuelle prépare les faits mais ne conclut pas, et
 *     n'affiche aucun score.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/qualite.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { allerCarteDe } = require('./aller');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(56)} ${detail === undefined ? '' : detail}`);
}

async function geometrie(page) {
  return page.evaluate(() => {
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
    const pied = document.querySelector('.wizard-footer');
    return {
      scroll: document.documentElement.scrollHeight - window.innerHeight,
      over: [...new Set(over)].slice(0, 2),
      pied: pied ? Math.round(pied.getBoundingClientRect().bottom - window.innerHeight) : null,
      score: /\b\d{1,3}\s?%\s*(de\s+)?(conform|confian|fiabilit|maturit)/i.test(document.body.innerText),
    };
  });
}

function verifierGeometrie(g) {
  const ko = g.scroll > 0 || g.over.length || (g.pied !== null && g.pied > 2);
  verifier('géométrie', !ko, `scroll ${g.scroll}px, pied ${g.pied}px`);
}

async function allerCarte(page, carte) {
  await allerCarteDe(page, 'Surveillance & qualité', carte);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  let g;

  // ---------------------------------------------------------------- S43
  console.log('S43 — Cartographie des risques qualité');
  await allerCarte(page, 'Cartographie');
  const carto = await page.evaluate(() => ({
    cartes: document.querySelectorAll('.hub-carte').length,
    pages: document.querySelectorAll('.page-btn').length,
    tableau: document.querySelectorAll('table').length,
    jauge: !!document.querySelector('.campagne-jauge-remplie'),
  }));
  verifier('quatre cartes par page', carto.cartes === 4, `${carto.cartes} cartes`);
  verifier('pagination 1/2 pour huit domaines', carto.pages === 2, `${carto.pages} pages`);
  verifier('aucun tableau dense', carto.tableau === 0);
  verifier('la progression de la revue est visible', carto.jauge);
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S44
  console.log('S44 — Fiche risque qualité');
  await page.locator('.hub-carte').first().click();
  await page.waitForTimeout(500);
  const fiche = await page.evaluate(() => ({
    texte: document.body.innerText,
    sections: [...document.querySelectorAll('.form-section-title')].map(e => e.innerText.trim()),
    choix: document.querySelectorAll('.radio-card').length,
    actions: [...document.querySelectorAll('.page-header-actions button')].map(b => b.innerText.trim()),
  }));
  verifier('« ce que nous savons » / « ce que nous décidons »',
    fiche.sections.some(s => /savons/i.test(s)) && fiche.sections.some(s => /risque proposé/i.test(s)),
    fiche.sections.join(' · ').slice(0, 70));
  verifier('importance et occurrence en radio-card', fiche.choix === 6, `${fiche.choix} choix`);
  verifier('valider ou écarter — rien ne s’auto-valide',
    fiche.actions.some(a => /Valider le risque/.test(a)) && fiche.actions.some(a => /Écarter/.test(a)));
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S45/S46
  console.log('S45 et S46 — Non-conformités');
  await allerCarte(page, 'Non-conformités');
  const nc = await page.evaluate(() => ({
    filtres: [...document.querySelectorAll('.tabs .tab')].map(t => t.innerText.replace(/\s+/g, ' ').trim()),
    colonnes: document.querySelectorAll('thead th').length,
    triables: document.querySelectorAll('th.th-sortable').length,
  }));
  verifier('les trois filtres du cahier', nc.filtres.length === 3, nc.filtres.join(' · '));
  verifier('mise en page des anomalies', nc.triables >= 3, `${nc.triables}/${nc.colonnes} triables`);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  await page.locator('.detail-panel button', { hasText: 'traitement' }).click();
  await page.waitForTimeout(500);
  const traitement = await page.evaluate(() => ({
    sections: [...document.querySelectorAll('.form-section-title')].map(e => e.innerText.trim()),
    texte: document.body.innerText,
  }));
  verifier('les quatre blocs du cahier',
    ['Constat', 'Incidence', 'Cause', 'Action'].every(m => traitement.sections.some(s => new RegExp(m, 'i').test(s))),
    traitement.sections.join(' · ').slice(0, 80));
  verifierGeometrie(await geometrie(page));

  // La non-conformité créée depuis une réclamation reprend son contexte.
  await allerCarte(page, 'Non-conformités');
  await page.locator('.tab', { hasText: 'Efficacité' }).click();
  await page.waitForTimeout(400);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  const liee = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('l’origine liée est reprise, pas ressaisie', /Origine liée|rec-\d/i.test(liee));
  await page.locator('.detail-panel button', { hasText: 'traitement' }).click();
  await page.waitForTimeout(500);
  const efficacite = await page.evaluate(() => ({
    bloc: [...document.querySelectorAll('.form-section-title')].some(e => /efficacité/i.test(e.innerText)),
    texte: document.body.innerText,
  }));
  verifier('le contrôle d’efficacité apparaît après l’échéance', efficacite.bloc);
  verifier('une non-conformité ne se clôt qu’après vérification',
    /ne se clôt qu’une fois son action corrective vérifiée/i.test(efficacite.texte));
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S47
  console.log('S47 — Surveillance annuelle, échantillon');
  await allerCarte(page, 'Surveillance annuelle');
  const ech = await page.evaluate(() => ({
    criteres: document.querySelectorAll('.form-section .list-row').length,
    cartes: document.querySelectorAll('.echantillon-carte').length,
    motifs: [...document.querySelectorAll('.echantillon-motif')].filter(m => m.innerText.trim()).length,
    remplacer: document.querySelectorAll('.echantillon-carte button').length,
    etapes: document.querySelectorAll('.stepper-step').length,
  }));
  verifier('trois étapes', ech.etapes === 3, `${ech.etapes} étapes`);
  verifier('cinq à huit dossiers proposés', ech.cartes >= 5 && ech.cartes <= 8, `${ech.cartes} dossiers`);
  verifier('chaque dossier dit pourquoi il est retenu', ech.motifs === ech.cartes, `${ech.motifs}/${ech.cartes}`);
  verifier('aucune sélection irréversible', ech.remplacer === ech.cartes, `${ech.remplacer} boutons Remplacer`);
  const avantRempl = await page.evaluate(() => document.querySelector('.echantillon-nom').innerText);
  await page.locator('.echantillon-carte button').first().click();
  await page.waitForTimeout(450);
  const apresRempl = await page.evaluate(() => document.querySelector('.echantillon-nom').innerText);
  verifier('le remplacement fonctionne', avantRempl !== apresRempl, `${avantRempl} → ${apresRempl}`);
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S48
  console.log('S48 — Surveillance annuelle, contrôle');
  await page.locator('.wizard-footer .btn-primary').click();
  await page.waitForTimeout(600);
  const ctl = await page.evaluate(() => ({
    onglets: document.querySelectorAll('.tabs .tab').length,
    points: document.querySelectorAll('.point-ligne').length,
    // Les trois symboles de cotation sont nommés une fois en légende.
    legende: document.querySelectorAll('.points-legende-item').length,
    boutons: document.querySelectorAll('.point-ligne .point-verdict').length,
    grandTexte: document.querySelectorAll('.step-body textarea').length,
  }));
  verifier('un onglet par dossier de l’échantillon', ctl.onglets >= 5, `${ctl.onglets} onglets`);
  verifier('les points se cotent d’un clic', ctl.boutons === ctl.points * 3, `${ctl.points} points × 3`);
  verifier('aucun grand texte à saisir', ctl.grandTexte === 0);
  verifier('les trois symboles sont nommés', ctl.legende === 3, `${ctl.legende} entrées de légende`);
  await page.locator('.point-ligne .point-verdict.v-non-conforme').first().click();
  await page.waitForTimeout(400);
  const nonConforme = await page.evaluate(() => ({
    cote: !!document.querySelector('.point-ligne .point-verdict.v-non-conforme.actif'),
    creerNc: [...document.querySelectorAll('.detail-panel button')].some(b => /non-conformité/i.test(b.innerText)),
  }));
  verifier('la cotation se voit', nonConforme.cote);
  verifier('un point non conforme peut ouvrir une non-conformité', nonConforme.creerNc);
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S49
  console.log('S49 — Surveillance annuelle, synthèse');
  for (let i = 0; i < 6; i++) {
    await page.locator('.wizard-footer .btn-primary').click();
    await page.waitForTimeout(450);
    if (await page.locator('.apercu-feuille').count()) break;
  }
  const synthese = await page.evaluate(() => ({
    tuiles: document.querySelectorAll('.campagne-tuile').length,
    feuille: !!document.querySelector('.apercu-feuille'),
    rapport: (document.querySelector('.apercu-feuille') || {}).innerText || '',
    bouton: (document.querySelector('.wizard-footer .btn-primary') || {}).innerText || '',
  }));
  verifier('trois cartes de synthèse', synthese.tuiles === 3, `${synthese.tuiles} tuiles`);
  verifier('le rapport se lit avant d’être finalisé', synthese.feuille && synthese.rapport.length > 200, `${synthese.rapport.length} caractères`);
  verifier('le rapport cite les dossiers contrôlés', /DOSSIERS CONTRÔLÉS/.test(synthese.rapport));
  verifier('l’action finalise le rapport', /Finaliser le rapport/.test(synthese.bouton), synthese.bouton.trim());
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S50
  console.log('S50 — Évaluation annuelle du SMQ');
  await allerCarte(page, 'Évaluation annuelle');
  const eval0 = await page.evaluate(() => ({
    faits: document.querySelectorAll('.fait-ligne').length,
    conclusions: document.querySelectorAll('.conclusion-carte').length,
    priorites: document.querySelectorAll('.form-section input.form-input').length,
    valider: (document.querySelector('.page-header-actions .btn-primary') || {}),
  }));
  const desactive = await page.locator('.page-header-actions .btn-primary').isDisabled();
  verifier('quatre faits rassemblés', eval0.faits === 4, `${eval0.faits} faits`);
  verifier('trois conclusions possibles', eval0.conclusions === 3, `${eval0.conclusions} conclusions`);
  verifier('trois priorités au plus', eval0.priorites === 3, `${eval0.priorites} champs`);
  verifier('rien ne se valide sans conclusion humaine', desactive);
  await page.locator('.conclusion-carte').nth(1).click();
  await page.waitForTimeout(400);
  const apresChoix = await page.locator('.page-header-actions .btn-primary').isDisabled();
  verifier('la conclusion choisie débloque la validation', !apresChoix);
  g = await geometrie(page);
  verifier('aucun score automatique', !g.score);
  verifierGeometrie(g);

  if (erreurs.length) { echecs += erreurs.length; console.log('ERREURS JS :', erreurs); }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLe système de management de la qualité est conforme au cahier.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
