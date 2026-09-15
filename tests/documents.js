/* Le pipeline documentaire — recette de la phase 3.
 *
 * Parcourt les sept écrans S52 à S58 et vérifie qu'ils font ce que le cahier
 * demande, pas seulement qu'ils s'affichent :
 *   — le hub montre six catégories et ses compteurs sont calculés ;
 *   — une catégorie accepte un dépôt et la liste s'allonge ;
 *   — « Confirmer les valeurs sans alerte » confirme en lot, et ne touche
 *     jamais une contradiction, qui exige une décision humaine ;
 *   — le référentiel cherche, et dit quels documents une modification
 *     marquerait à régénérer ;
 *   — l'assistant des manquantes ne pose que des questions sans réponse ;
 *   — l'aperçu n'offre aucun champ de saisie — ce n'est pas un éditeur ;
 *   — aucun écran n'affiche de score de conformité ou de confiance.
 *
 * Et, partout, la géométrie : pas de défilement de page, rien de rogné.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/documents.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(52)} ${detail === undefined ? '' : detail}`);
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
    return {
      scroll: document.documentElement.scrollHeight - window.innerHeight,
      over: [...new Set(over)].slice(0, 2),
      // Aucun score de conformité ni de confiance nulle part : § 5.2.
      score: /\b\d{1,3}\s?%\s*(de\s+)?(conform|confian|fiabilit)/i.test(document.body.innerText),
    };
  });
}

/* Le parcours s'ouvre à la première étape qui n'est pas prête : les recettes
   disent donc explicitement où elles veulent aller. */
async function ouvrirDocuments(page, etape) {
  await page.locator('.nav-item', { hasText: 'Documents du cabinet' }).first().click();
  await page.waitForTimeout(500);
  if (etape) {
    await page.locator('.parcours-fil-etape', { hasText: etape }).first().click();
    await page.waitForTimeout(550);
  }
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // ---------------------------------------------------------------- S52
  console.log('S52 — Documents du cabinet');
  await ouvrirDocuments(page, 'Déposer');
  let g = await geometrie(page);
  /* Depuis la phase F, le module s'ouvre sur son parcours en quatre étapes :
     déposer, confirmer, compléter, produire. Les sept catégories sont des
     pastilles et non plus sept grandes cartes (§ 28.1) — choisir sa catégorie
     n'est pas le travail, c'est un préalable d'un clic. */
  const hub = await page.evaluate(() => ({
    etapes: document.querySelectorAll('.parcours-fil-etape').length,
    pastilles: document.querySelectorAll('.doc-pill').length,
    dropzone: !!document.querySelector('.dropzone-simple'),
    mention: !!document.querySelector('.mention-simulee'),
    recherchees: /Informations recherchées/.test(document.body.innerText),
    promesse: /vérifi(e|cation) juridique|conforme au regard/i.test(document.body.innerText),
  }));
  verifier('quatre étapes dans le parcours documentaire', hub.etapes === 4, `${hub.etapes} étapes`);
  verifier('les catégories sont des pastilles', hub.pastilles >= 6, `${hub.pastilles} pastilles`);
  verifier('la zone de dépôt est présente', hub.dropzone);
  verifier('la simulation de l’extraction est annoncée', hub.mention);
  verifier('la colonne dit ce qui est recherché', hub.recherchees);
  verifier('aucune promesse de vérification juridique', !hub.promesse);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);
  verifier('aucun score affiché', !g.score);

  // ---------------------------------------------------------------- S53
  /* Le dépôt écrit réellement dans la couche de données, et le fichier déposé
     est encore là après un rafraîchissement. */
  console.log('S53 — Dépôt d’un document');
  const avant = await page.evaluate(() => dbSources().length);
  await page.setInputFiles('.dropzone-simple input[type=file]', {
    name: 'Attestation_test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test'),
  });
  await page.waitForTimeout(600);
  const apres = await page.evaluate(() => dbSources().length);
  verifier('le dépôt enregistre le fichier', apres === avant + 1, `${avant} → ${apres}`);
  const visible = await page.evaluate(() =>
    [...document.querySelectorAll('.depot-nom')].some(e => /Attestation_test/.test(e.textContent)));
  verifier('il apparaît dans la liste de la catégorie', visible);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const apresRefresh = await page.evaluate(() => dbSources().length);
  verifier('il survit au rechargement', apresRefresh === apres, `${apresRefresh} sources`);
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S54
  console.log('S54 — Informations à confirmer');
  await ouvrirDocuments(page, 'Confirmer');
  const avantLot = await page.evaluate(() => ({
    aConfirmer: Number(document.querySelectorAll('.tab')[0].innerText.match(/\d+/)[0]),
    contradictoires: Number(document.querySelectorAll('.tab')[1].innerText.match(/\d+/)[0]),
    /* Encadré dans le parcours, l'écran porte ses actions dans
       `.parcours-actions` plutôt que dans l'en-tête de page. */
    bouton: ([...document.querySelectorAll('.parcours-actions .btn-primary, .page-header-actions .btn-primary')][0] || {}).innerText || '',
  }));
  verifier('des contradictions existent et sont séparées', avantLot.contradictoires > 0, `${avantLot.contradictoires}`);
  verifier('le lot ne couvre pas les contradictions',
    Number((avantLot.bouton.match(/\d+/) || [0])[0]) === avantLot.aConfirmer,
    `lot ${avantLot.bouton.match(/\d+/)} / à confirmer ${avantLot.aConfirmer}`);
  await page.locator('button', { hasText: 'sans alerte' }).first().click();
  await page.waitForTimeout(500);
  const apresLot = await page.evaluate(() => ({
    aConfirmer: Number(document.querySelectorAll('.tab')[0].innerText.match(/\d+/)[0]),
    contradictoires: Number(document.querySelectorAll('.tab')[1].innerText.match(/\d+/)[0]),
  }));
  verifier('la confirmation en lot vide la file', apresLot.aConfirmer === 0, `${avantLot.aConfirmer} → ${apresLot.aConfirmer}`);
  verifier('la contradiction reste à trancher', apresLot.contradictoires === avantLot.contradictoires, `${apresLot.contradictoires}`);
  await page.locator('.tab', { hasText: 'Contradictoires' }).click();
  await page.waitForTimeout(350);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  const contra = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('la contradiction dit que la décision est humaine', /décision vous revient|interdit de trancher/i.test(contra));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);
  verifier('aucun score affiché', !g.score);

  // ---------------------------------------------------------------- S55
  console.log('S55 — Référentiel des informations');
  await ouvrirDocuments(page, 'Confirmer');
  await page.locator('button', { hasText: 'Référentiel des informations' }).first().click();
  await page.waitForTimeout(500);
  const total = await page.evaluate(() => Number(document.querySelector('.form-section-compte').innerText));
  await page.locator('.filter-row input').fill('Tracfin');
  await page.waitForTimeout(400);
  const filtre = await page.evaluate(() => Number(document.querySelector('.form-section-compte').innerText));
  verifier('la recherche filtre la liste', filtre > 0 && filtre < total, `${total} → ${filtre}`);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  const detailRef = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('la fiche montre provenance et usages', /provenance/i.test(detailRef) && /usages/i.test(detailRef));
  await page.locator('.filter-row input').fill('infogérant');
  await page.waitForTimeout(400);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  const dep = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('la modification annonce les documents à régénérer', /à régénérer/.test(dep));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S56
  console.log('S56 — Informations manquantes');
  await ouvrirDocuments(page, 'Compléter');
  const assistant = await page.evaluate(() => ({
    etapes: document.querySelectorAll('.stepper-step').length,
    champs: document.querySelectorAll('.form-section input.form-input').length,
    connues: (document.querySelectorAll('.form-section')[0] || {}).innerText || '',
    pied: !!document.querySelector('.wizard-footer'),
  }));
  verifier('un stepper, pas un formulaire', assistant.etapes >= 2 && assistant.pied, `${assistant.etapes} étapes`);
  verifier('quatre questions au plus par écran', assistant.champs <= 4, `${assistant.champs} champs`);
  verifier('ce qui est déjà su est montré en lecture', /savons déjà/.test(assistant.connues));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S57 / S58
  console.log('S57 et S58 — Documents générés et aperçu');
  await ouvrirDocuments(page, 'Produire');
  const aRegenerer = await page.evaluate(() =>
    [...document.querySelectorAll('tbody tr')].filter(t => /régénérer/.test(t.innerText)).length);
  verifier('les documents périmés sont marqués', aRegenerer > 0, `${aRegenerer} à régénérer`);
  await page.locator('tbody tr', { hasText: 'régénérer' }).first().click();
  await page.waitForTimeout(350);
  const motif = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('le motif de régénération est donné', /info-box|changé|arrêtée/i.test(motif) || /⚠️/.test(motif));
  await page.locator('.detail-panel button', { hasText: 'Aperçu' }).click();
  await page.waitForTimeout(500);
  const apercu = await page.evaluate(() => ({
    feuille: !!document.querySelector('.apercu-feuille'),
    champs: document.querySelectorAll('.apercu-feuille input, .apercu-feuille textarea, .apercu-feuille [contenteditable]').length,
    variables: document.querySelectorAll('.info-source').length,
    renvoi: /se corrige dans le référentiel/.test(document.body.innerText),
  }));
  verifier('la feuille est rendue', apercu.feuille);
  verifier('aucun champ de saisie dans la feuille', apercu.champs === 0, `${apercu.champs} champs`);
  verifier('les variables montrent leur source', apercu.variables > 0, `${apercu.variables} variables`);
  verifier('une correction renvoie à la donnée', apercu.renvoi);
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);
  verifier('aucun score affiché', !g.score);

  if (erreurs.length) { echecs += erreurs.length; console.log('ERREURS JS :', erreurs); }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLe pipeline documentaire fait ce que le cahier demande.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
