/* LBC-FT — recette de la phase 5.
 *
 * Vérifie que les écrans S32 à S40B font ce que le cahier demande :
 *   — « À traiter » réutilise la mise en page des anomalies, et chaque motif
 *     se déduit d'une date ou d'un événement, jamais d'une opinion ;
 *   — le portefeuille montre quatre pastilles compactes, pas dix colonnes ;
 *   — la mise à jour compte cinq étapes, et ses étapes Connaissance et
 *     Cotation sont les composants de la contractualisation, pas des copies ;
 *   — la cartographie est une photographie agrégée, sans aucune saisie, et
 *     non plus un questionnaire indépendant ;
 *   — les campagnes RBE et contrôles ciblés partagent le patron campagne, et
 *     tracent date, personne et résultat.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/lbcft.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

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
      piedSousLaLigne: pied ? Math.round(pied.getBoundingClientRect().bottom - window.innerHeight) : null,
    };
  });
}

function verifierGeometrie(g) {
  const ko = g.scroll > 0 || g.over.length || (g.piedSousLaLigne !== null && g.piedSousLaLigne > 2);
  verifier('géométrie', !ko, `scroll ${g.scroll}px, pied ${g.piedSousLaLigne}px`);
}

/* Ouvre la première ligne portant un libellé, en feuilletant la pagination
   si elle n'est pas sur la page courante. */
async function ouvrirLigne(page, libelle) {
  /* On parcourt les pages par leur rang. Prendre « le premier bouton non
     actif » faisait osciller entre les pages 1 et 2 : depuis que la pagination
     s'adapte à la place disponible, il y a plus de pages, et la ligne
     cherchée pouvait se trouver au-delà sans jamais être atteinte. */
  const pages = Math.max(1, await page.locator('.page-btn').count());
  // On repart toujours de la première page : un appel précédent a pu laisser
  // la liste sur une autre, et la ligne cherchée serait déclarée introuvable
  // alors qu'elle est simplement en arrière.
  if (pages > 1) { await page.locator('.page-btn').first().click(); await page.waitForTimeout(350); }
  for (let rang = 0; rang < pages; rang++) {
    if (rang > 0) {
      await page.locator('.page-btn').nth(rang).click();
      await page.waitForTimeout(400);
    }
    const ligne = page.locator('tbody tr', { hasText: libelle });
    if (await ligne.count()) { await ligne.first().click(); await page.waitForTimeout(400); return true; }
  }
  throw new Error(`Ligne « ${libelle} » introuvable sur les ${pages} page(s).`);
}

/* Le module LBC-FT n'affiche plus quatre cartes mais un parcours en cinq
   étapes. Les écrans qu'il ouvre n'ont pas changé : seul le chemin a changé. */
const ETAPE_DE = {
  'À traiter': 'Portefeuille',
  Portefeuille: 'Portefeuille',
  Cartographie: 'Cartographie',
  Campagnes: 'Contrôles',
};

async function allerCarte(page, carte) {
  await page.locator('.nav-item', { hasText: 'LBC-FT' }).first().click();
  await page.waitForTimeout(450);
  await page.locator('.parcours-fil-etape', { hasText: ETAPE_DE[carte] || carte }).first().click();
  await page.waitForTimeout(550);
  // Le portefeuille complet s'atteint depuis l'étape par « Voir tous les
  // dossiers » : c'est la même vue, filtrée autrement (§ 21).
  if (carte === 'Portefeuille') {
    await page.locator('button', { hasText: 'Voir tous les dossiers' }).first().click();
    await page.waitForTimeout(550);
  }
}

/* Structure rendue d'une étape, normalisée : on retire les valeurs et les
   compteurs pour comparer la forme et rien d'autre. */
async function structure(page) {
  return page.evaluate(() => {
    function noeud(el, profondeur) {
      if (profondeur > 5) return '';
      // On compare la forme, pas les données : « selected » et les classes
      // de niveau (niv-Élevé, niv-Faible…) reflètent la cotation du dossier,
      // qui diffère légitimement d'un dossier à l'autre.
      const cls = String(el.className || '')
        .replace(/\bselected\b/g, '')
        .replace(/\bniv-[^\s]+/g, 'niv')
        .replace(/\s+/g, ' ').trim();
      const enfants = [...el.children].map(e => noeud(e, profondeur + 1)).filter(Boolean);
      return `${el.tagName}.${cls}(${enfants.join(',')})`;
    }
    const racine = document.querySelector('.step-body > .step-scroll, .step-body > div');
    return racine ? noeud(racine, 0) : '';
  });
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // ---------------------------------------------------------------- S32
  console.log('S32 — À traiter');
  await allerCarte(page, 'À traiter');
  const aTraiter = await page.evaluate(() => ({
    lignes: document.querySelectorAll('tbody tr').length,
    colonnes: document.querySelectorAll('thead th').length,
    triable: document.querySelectorAll('th.th-sortable').length,
  }));
  verifier('liste paginée à cinq lignes', aTraiter.lignes <= 5, `${aTraiter.lignes} lignes`);
  verifier('mise en page des anomalies (colonnes triables)', aTraiter.triable >= 3, `${aTraiter.triable}/${aTraiter.colonnes} triables`);
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  const motif = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('le motif est expliqué par un fait',
    /fiche de vigilance|registre|périodicité|politiquement exposée|plus fréquent/i.test(motif));
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S33
  console.log('S33 — Portefeuille');
  await allerCarte(page, 'Portefeuille');
  const portefeuille = await page.evaluate(() => ({
    colonnes: document.querySelectorAll('thead th').length,
    pastilles: document.querySelectorAll('tbody .pastille-critere').length,
    filtres: document.querySelectorAll('.tabs .tab').length,
  }));
  verifier('pas de tableau à dix colonnes', portefeuille.colonnes <= 5, `${portefeuille.colonnes} colonnes`);
  verifier('les quatre critères sont des pastilles', portefeuille.pastilles > 0 && portefeuille.pastilles % 4 === 0, `${portefeuille.pastilles} pastilles`);
  verifier('les cinq filtres du cahier', portefeuille.filtres === 5, `${portefeuille.filtres} filtres`);
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S34 à S38
  console.log('S34 à S38 — Mise à jour de la vigilance');
  await page.locator('tbody tr').first().click();
  await page.waitForTimeout(350);
  await page.locator('.detail-panel button', { hasText: 'Mettre à jour' }).click();
  await page.waitForTimeout(600);
  const etapes = await page.evaluate(() =>
    [...document.querySelectorAll('.stepper-label')].map(e => e.innerText.trim()));
  /* Six écrans depuis la phase E (§ 22) : l'écran « Vérifications » s'est
     intercalé entre la connaissance du client et la cotation. Il n'existait
     pas, et les vérifications externes se faisaient dans l'écran précédent
     avec des résultats fabriqués. */
  verifier('six écrans, dans l’ordre du prompt',
    etapes.length === 6 && /Ce qui a changé/.test(etapes[0]) && /Vérifications/.test(etapes[2])
      && /Niveau & mesures/.test(etapes[4]) && /Validation/.test(etapes[5]),
    etapes.join(' · '));

  const structuresMaj = [];
  for (let i = 1; i <= 6; i++) {
    const g = await geometrie(page);
    const ko = g.scroll > 0 || g.over.length || (g.piedSousLaLigne !== null && g.piedSousLaLigne > 2);
    if (ko) echecs++;
    console.log(`  ${ko ? 'ÉCHEC' : 'OK  '}  étape ${i} — scroll ${g.scroll}px, pied ${g.piedSousLaLigne}px`);
    // Les écrans 2 et 4 sont ceux de la contractualisation, pris tels quels.
    if (i === 2 || i === 4) structuresMaj.push(await structure(page));
    if (i === 3) {
      const verifs = await page.evaluate(() => ({
        lignes: document.querySelectorAll('.verif-ligne').length,
        invente: /Aucune correspondance|2 bénéficiaires confirmés/.test(document.body.innerText),
      }));
      verifier('trois vérifications, aucune inventée',
        verifs.lignes === 3 && !verifs.invente, `${verifs.lignes} lignes`);
    }
    if (i === 5) {
      const mesures = await page.locator('.mesure-carte').count();
      verifier('quatre cartes de mesures au plus', mesures > 0 && mesures <= 4, `${mesures} cartes`);
      const dissertation = await page.evaluate(() => {
        const p = [...document.querySelectorAll('.conf-detail')].map(e => e.innerText.trim());
        return Math.max(0, ...p.map(t => t.length));
      });
      verifier('une raison courte, pas une dissertation', dissertation < 220, `${dissertation} caractères`);
    }
    if (i === 6) {
      const validation = await page.evaluate(() => ({
        champs: document.querySelectorAll('.step-body input:not([type=checkbox]), .step-body textarea').length,
        historise: /historisée|conservée et datée/i.test(document.body.innerText),
        bouton: (document.querySelector('.wizard-footer .btn-primary') || {}).innerText || '',
      }));
      verifier('aucun nouveau champ à la validation', validation.champs === 0, `${validation.champs} champs`);
      verifier('l’ancienne version est historisée', validation.historise);
      verifier('l’action dit ce qu’elle fait', /Enregistrer la vigilance/.test(validation.bouton), validation.bouton.trim());
      break;
    }
    const suivant = page.locator('.wizard-footer .btn-primary');
    await suivant.click();
    await page.waitForTimeout(600);
  }

  /* Les étapes Connaissance et Cotation doivent être celles de la
     contractualisation. On compare les structures rendues des deux parcours. */
  await page.locator('.nav-item', { hasText: 'Entrée en mission' }).first().click();
  await page.waitForTimeout(400);
  await page.locator('.hub-carte', { hasText: 'Contractualisation' }).first().click();
  await page.waitForTimeout(600);
  for (const libelle of ['Analyser', 'Confirmer les informations']) {
    const b = page.locator('button', { hasText: libelle });
    if (await b.count()) { await b.first().click(); await page.waitForTimeout(600); }
  }
  const structuresContrat = [];
  for (let i = 2; i <= 8; i++) {
    if (i === 7 || i === 8) structuresContrat.push(await structure(page));
    if (i === 8) break;
    await page.locator('.wizard-footer .btn-primary').click();
    await page.waitForTimeout(600);
  }
  verifier('« Qui est derrière » est le composant de la contractualisation',
    structuresMaj[0] === structuresContrat[0], structuresMaj[0] === structuresContrat[0] ? 'identique' : 'divergent');
  verifier('« Cotation » est le composant de la contractualisation',
    structuresMaj[1] === structuresContrat[1], structuresMaj[1] === structuresContrat[1] ? 'identique' : 'divergent');

  // ---------------------------------------------------------------- S39
  console.log('S39 — Cartographie');
  await allerCarte(page, 'Cartographie');
  const carto = await page.evaluate(() => ({
    stepper: document.querySelectorAll('.stepper-step').length,
    saisies: document.querySelectorAll('.page input, .page textarea, .page select').length,
    barres: document.querySelectorAll('.carto-barre').length,
    tuiles: document.querySelectorAll('.campagne-tuile').length,
    questions: document.querySelectorAll('.carto-question').length,
    arreter: [...document.querySelectorAll('button')].some(b => /Arrêter la cartographie/.test(b.innerText)),
    texte: document.body.innerText,
  }));
  /* Ce n'est toujours pas un questionnaire : aucun chiffre ne s'y saisit.
     Les seules entrées sont les trois questions de revue et sa note, que le
     § 25 impose — ce sont des appréciations, pas des données. */
  verifier('ce n’est pas un questionnaire de saisie',
    carto.stepper === 0 && carto.saisies <= 1 && carto.questions === 3,
    `${carto.stepper} étapes, ${carto.saisies} champ(s), ${carto.questions} questions`);
  verifier('répartition en barres, pas en camembert', carto.barres === 3, `${carto.barres} barres`);
  verifier('les chiffres sont agrégés, pas saisis', /agrégé depuis les analyses/i.test(carto.texte));
  verifier('l’action primaire arrête la cartographie', carto.arreter);
  verifier('le fondement est cité', /L\. 561-4-1/.test(carto.texte));
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S40A
  console.log('S40A — Campagne RBE');
  await allerCarte(page, 'Campagnes');
  // L'étape 4 présente ses deux campagnes : on ouvre celle du registre.
  await page.locator('.form-section', { hasText: 'bénéficiaires effectifs' }).locator('button').first().click();
  await page.waitForTimeout(500);
  const rbe = await page.evaluate(() => ({
    tuiles: document.querySelectorAll('.campagne-tuile').length,
    jauge: !!document.querySelector('.campagne-jauge-remplie'),
  }));
  verifier('patron campagne', rbe.tuiles === 3 && rbe.jauge, `${rbe.tuiles} tuiles`);
  await ouvrirLigne(page, 'Divergence');
  const divergence = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('une divergence rappelle l’obligation de signalement', /L\. 561-45-1|signalée à l’INPI/i.test(divergence));
  verifier('les bénéficiaires connus ne sont pas à ressaisir',
    /Bénéficiaires connus du cabinet/i.test(divergence) && !/Saisir|Ajouter un bénéficiaire/i.test(divergence));
  await ouvrirLigne(page, 'à consulter');
  await page.locator('.detail-panel button', { hasText: 'Consulter' }).click();
  await page.waitForTimeout(500);
  const trace = await page.evaluate(() => /Consulté le[\s\S]{0,20}par /.test(document.body.innerText));
  verifier('la consultation trace date et personne', trace);
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S40B
  console.log('S40B — Contrôles PPE, gel et pays');
  await allerCarte(page, 'Campagnes');
  await page.locator('.form-section', { hasText: 'Gel des avoirs' }).locator('button').first().click();
  await page.waitForTimeout(500);
  const ctl = await page.evaluate(() => ({
    tuiles: document.querySelectorAll('.campagne-tuile').length,
    filtres: document.querySelectorAll('.tabs .tab').length,
  }));
  verifier('même patron que la campagne RBE', ctl.tuiles === 3, `${ctl.tuiles} tuiles`);
  verifier('filtres PPE, gel et pays', ctl.filtres === 4, `${ctl.filtres} filtres`);
  await ouvrirLigne(page, 'à faire');
  const fond = await page.evaluate(() => (document.querySelector('.detail-panel') || {}).innerText || '');
  verifier('le contrôle cite le texte qui le fonde', /R\. 561-18|L\. 562-4|arrêté du 27 juillet 2023/i.test(fond));
  await page.locator('.detail-panel button', { hasText: 'Enregistrer le contrôle' }).click();
  await page.waitForTimeout(500);
  const traceCtl = await page.evaluate(() => /Contrôlé le[\s\S]{0,20}par /.test(document.body.innerText));
  verifier('le contrôle enregistré trace date et personne', traceCtl);
  verifierGeometrie(await geometrie(page));

  if (erreurs.length) { echecs += erreurs.length; console.log('ERREURS JS :', erreurs); }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLa vigilance LBC-FT est conforme au cahier.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
