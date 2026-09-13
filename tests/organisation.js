/* Gouvernance, ressources et registres — recette de la phase 4.
 *
 * Vérifie que les écrans S19 à S30 font ce que le cahier demande :
 *   — les rôles non couverts sont signalés, avec le texte qui les fonde ;
 *   — l'indépendance et la formation sont des campagnes : progression, tuiles,
 *     et traitement ligne par ligne sans changer de page ;
 *   — l'équipe ne porte rien qui relève d'un SIRH ;
 *   — un prestataire dont une information manque affiche « à confirmer avec le
 *     prestataire », jamais « non conforme » — le cahier l'interdit ;
 *   — une ligne du registre RGPD tient dans l'écran ;
 *   — une non-conformité créée depuis une réclamation en reprend la référence.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/organisation.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(54)} ${detail === undefined ? '' : detail}`);
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
    return { scroll: document.documentElement.scrollHeight - window.innerHeight, over: [...new Set(over)].slice(0, 2) };
  });
}

async function allerCarte(page, entree, carte) {
  await page.locator('.nav-item', { hasText: entree }).first().click();
  await page.waitForTimeout(400);
  await page.locator('.hub-carte', { hasText: carte }).first().click();
  await page.waitForTimeout(500);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  let g;

  // ---------------------------------------------------------------- S19
  console.log('S19 — Organisation & responsabilités');
  await allerCarte(page, 'Gouvernance', 'Organisation');
  const orga = await page.evaluate(() => ({
    roles: document.querySelectorAll('.role-ligne').length,
    nonCouverts: [...document.querySelectorAll('.role-ligne')].filter(l => /non couvert/.test(l.innerText)).length,
    alerte: /ne sont pas couverts|n’est pas couvert/.test(document.body.innerText),
    fondements: [...document.querySelectorAll('.role-fondement')].filter(f => f.innerText.trim()).length,
    colonnes: document.querySelectorAll('.grid-2 > .form-section').length,
  }));
  verifier('les rôles sont listés en deux colonnes', orga.colonnes === 2, `${orga.roles} rôles`);
  verifier('chaque rôle cite le texte qui le fonde', orga.fondements === orga.roles, `${orga.fondements}/${orga.roles}`);
  verifier('les rôles non couverts sont signalés', orga.nonCouverts > 0 && orga.alerte, `${orga.nonCouverts} non couverts`);
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S20
  console.log('S20 — Indépendance (campagne)');
  await allerCarte(page, 'Gouvernance', 'Indépendance');
  const campagne = await page.evaluate(() => ({
    jauge: !!document.querySelector('.campagne-jauge-remplie'),
    tuiles: document.querySelectorAll('.campagne-tuile').length,
    action: (document.querySelector('.campagne-action') || {}).innerText || '',
    lignes: document.querySelectorAll('tbody tr').length,
  }));
  verifier('progression et tuiles', campagne.jauge && campagne.tuiles === 3, `${campagne.tuiles} tuiles`);
  verifier('l’action porte le nombre en attente', /\d+ en attente/.test(campagne.action), campagne.action.trim());
  verifier('cinq lignes au plus', campagne.lignes <= 5, `${campagne.lignes} lignes`);
  await page.locator('tbody tr', { hasText: 'En attente' }).first().click();
  await page.waitForTimeout(350);
  const avantRelance = await page.locator('.detail-panel button', { hasText: 'Relancer' }).count();
  if (avantRelance) {
    await page.locator('.detail-panel button', { hasText: 'Relancer' }).first().click();
    await page.waitForTimeout(400);
  }
  const trace = await page.evaluate(() => /Relancé le/.test(document.body.innerText));
  verifier('la relance laisse une trace datée', trace);
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S23
  console.log('S23 — Équipe');
  await allerCarte(page, 'Ressources', 'Équipe');
  const equipe = await page.evaluate(() => ({
    texte: document.body.innerText,
    lignes: document.querySelectorAll('tbody tr').length,
  }));
  verifier('la liste montre 5 lignes au plus', equipe.lignes <= 5, `${equipe.lignes} lignes`);
  verifier('aucun champ de SIRH', !/salaire|rémunération|congés|paie|bulletin/i.test(equipe.texte));
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  const ficheEquipe = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('la fiche porte entrée, responsabilités et suppléance',
    /Entré le/i.test(ficheEquipe) && /responsabilités/i.test(ficheEquipe) && /suppléance/i.test(ficheEquipe));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S24/S25
  console.log('S24 et S25 — Formation');
  await allerCarte(page, 'Ressources', 'Formation');
  const form = await page.evaluate(() => ({
    tuiles: document.querySelectorAll('.campagne-tuile').length,
    jauge: !!document.querySelector('.campagne-jauge-remplie'),
  }));
  verifier('trois tuiles de pilotage', form.tuiles === 3 && form.jauge, `${form.tuiles} tuiles`);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  await page.locator('.detail-panel button', { hasText: 'fiche formation' }).click();
  await page.waitForTimeout(500);
  const fiche = await page.evaluate(() => ({
    titre: document.querySelector('h1').innerText,
    lignes: document.querySelectorAll('tbody tr').length,
  }));
  verifier('la fiche porte le nom sans le faire ressaisir', /—/.test(fiche.titre), fiche.titre);
  verifier('la chronologie est renseignée', fiche.lignes > 0, `${fiche.lignes} formations`);
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S26
  console.log('S26 — Outils & prestataires');
  await allerCarte(page, 'Ressources', 'Outils');
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(400);
  const outil = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('une information absente dit « à confirmer »', /à confirmer avec le prestataire/i.test(outil));
  verifier('aucune conclusion de conformité', !/non conforme|conforme à l’article|conforme article/i.test(outil));
  verifier('les cinq mesures sont listées',
    /double authentification/i.test(outil) && /sauvegarde/i.test(outil) && /restauration/i.test(outil));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S27
  console.log('S27 — RGPD');
  await allerCarte(page, 'Ressources', 'RGPD');
  const rgpd = await page.evaluate(() => document.querySelectorAll('.hub-carte').length);
  verifier('trois cartes, pas un registre géant', rgpd === 3, `${rgpd} cartes`);
  await page.locator('.hub-carte', { hasText: 'Traitements' }).click();
  await page.waitForTimeout(500);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(400);
  const traitement = await page.evaluate(() => {
    const p = document.querySelector('.detail-panel');
    return {
      texte: p ? p.innerText : '',
      deborde: p ? Math.max(0, p.scrollHeight - p.clientHeight) : 0,
      dansEcran: p ? p.getBoundingClientRect().bottom <= window.innerHeight + 2 : false,
    };
  });
  verifier('la fiche du traitement tient dans l’écran', traitement.dansEcran && traitement.deborde === 0, `débordement ${traitement.deborde}px`);
  verifier('la fiche porte base, durée et transferts',
    /base légale/i.test(traitement.texte) && /durée/i.test(traitement.texte) && /transferts/i.test(traitement.texte));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  // ---------------------------------------------------------------- S30
  console.log('S30 — Réclamations');
  await page.locator('.nav-item', { hasText: 'Cycle de la relation client' }).first().click();
  await page.waitForTimeout(400);
  await page.locator('.tab', { hasText: 'Réclamations' }).click();
  await page.waitForTimeout(500);
  const nbRec = await page.locator('tbody tr').count();
  verifier('le registre est renseigné', nbRec > 0, `${nbRec} réclamations`);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  await page.locator('.detail-panel button', { hasText: 'non-conformité' }).click();
  await page.waitForTimeout(500);
  const nc = await page.evaluate(() => document.body.innerText);
  verifier('la non-conformité reprend la référence de la réclamation', /contexte repris automatiquement|rec-\d/i.test(nc));
  /* Le cahier interdit de CONSTRUIRE ici la lettre de mission, le maintien ou
     la sortie — pas d'en parler : « honoraires facturés au-delà de la lettre
     de mission » est un objet de réclamation parfaitement légitime. On regarde
     donc les actions offertes, pas le texte de la page. */
  const actions = await page.evaluate(() =>
    [...document.querySelectorAll('.page button')].map(b => b.innerText.trim()).join(' | '));
  verifier('aucune action hors périmètre (LDM, maintien, sortie)',
    !/(générer|rédiger|éditer).{0,20}(lettre|mission)|maintien de mission|sortie du client/i.test(actions));
  g = await geometrie(page);
  verifier('géométrie', g.scroll === 0 && !g.over.length, `scroll ${g.scroll}px`);

  if (erreurs.length) { echecs += erreurs.length; console.log('ERREURS JS :', erreurs); }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nGouvernance, ressources et registres conformes au cahier.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
