/* Le manuel de procédures — recette de la phase 7.
 *
 * Vérifie que les écrans S59 à S61A font ce que le cahier demande :
 *   — six parties, et l'aperçu général ne s'offre pas tant qu'une partie est
 *     bloquée : proposer de générer un manuel troué serait proposer un faux ;
 *   — l'aperçu n'est pas un éditeur — aucun champ de saisie dans la feuille ;
 *   — une information manquante se voit dans le texte, elle n'est pas comblée
 *     par une formule creuse ;
 *   — la publication dit ce qu'elle va créer et refuse de partir sans objet ;
 *   — une version publiée est immuable : on la télécharge, on ne la rouvre pas ;
 *   — aucun score de conformité nulle part.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/manuel.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(58)} ${detail === undefined ? '' : detail}`);
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
  verifier('aucun score de conformité', !g.score);
}

async function ouvrirManuel(page) {
  await page.locator('.nav-item', { hasText: 'Manuel de procédures' }).first().click();
  await page.waitForTimeout(450);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // ---------------------------------------------------------------- S59
  console.log('S59 — Préparation');
  await ouvrirManuel(page);
  /* Depuis la phase G, le module s'ouvre sur son parcours en quatre étapes :
     préparer, relire, publier, historique. Les six parties sont six lignes et
     non six grands rectangles (§ 29.1) — on veut voir d'un coup laquelle
     bloque, et une grille oblige à parcourir l'écran. */
  const prep = await page.evaluate(() => ({
    etapes: document.querySelectorAll('.parcours-fil-etape').length,
    lignes: document.querySelectorAll('.parcours-reste').length,
    bloquees: [...document.querySelectorAll('.parcours-reste')].filter(c => /manquante/i.test(c.innerText)).length,
    relireOffert: [...document.querySelectorAll('button')].some(b => /Relire le manuel/.test(b.innerText)),
    bloque: /Ce qui bloque/.test(document.body.innerText),
  }));
  verifier('quatre étapes dans le parcours du manuel', prep.etapes === 4, `${prep.etapes} étapes`);
  verifier('les six parties sont six lignes', prep.lignes === 6, `${prep.lignes} lignes`);
  verifier('des parties sont bloquées dans le jeu de démonstration', prep.bloquees > 0, `${prep.bloquees} bloquées`);
  verifier('la colonne « Ce qui bloque » dit pourquoi', prep.bloque);
  verifier('la relecture n’est pas proposée tant qu’une partie bloque', !prep.relireOffert);
  verifierGeometrie(await geometrie(page));

  // ---------------------------------------------------------------- S60
  console.log('S60 — Aperçu');
  await page.locator('.parcours-fil-etape', { hasText: 'Relire' }).first().click();
  await page.waitForTimeout(600);
  // On se place sur la partie Gouvernance, qui porte une information absente
  // dans le jeu de démonstration.
  await page.locator('.tabs .tab', { hasText: 'Gouvernance' }).first().click();
  await page.waitForTimeout(500);
  const apercu = await page.evaluate(() => ({
    titre: document.querySelector('h1').innerText,
    onglets: document.querySelectorAll('.tabs .tab').length,
    feuille: (document.querySelector('.apercu-feuille') || {}).innerText || '',
    champsFeuille: document.querySelectorAll('.apercu-feuille input, .apercu-feuille textarea, .apercu-feuille [contenteditable]').length,
    variables: document.querySelectorAll('.info-source').length,
    alerte: /informations manquent|information manque/i.test(document.body.innerText),
    modifier: [...document.querySelectorAll('.apercu-actions button, .apercu-panneau button')].map(b => b.innerText.trim()),
  }));
  verifier('la partie demandée s’ouvre, dans le parcours du manuel',
    /Relire les six parties/i.test(apercu.titre), apercu.titre);
  verifier('les six parties sont accessibles en onglets', apercu.onglets === 6, `${apercu.onglets} onglets`);
  verifier('la feuille est rendue', apercu.feuille.length > 200, `${apercu.feuille.length} caractères`);
  verifier('aucun éditeur libre', apercu.champsFeuille === 0, `${apercu.champsFeuille} champs`);
  verifier('les variables employées montrent leur source', apercu.variables > 0, `${apercu.variables} variables`);
  verifier('une information manquante est signalée', apercu.alerte);
  verifier('le texte porte « à renseigner » plutôt qu’une formule creuse', /à renseigner/.test(apercu.feuille));
  verifier('on peut corriger à la source', apercu.modifier.some(b => /Modifier une information/.test(b)));
  verifierGeometrie(await geometrie(page));

  // Valider les six parties ouvre la publication.
  for (let i = 0; i < 6; i++) {
    await page.locator('.wizard-footer .btn-primary').click();
    await page.waitForTimeout(400);
  }
  const publiable = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some(b => /Publier la version/.test(b.innerText)));
  verifier('la publication s’ouvre quand tout est validé', publiable);

  // ---------------------------------------------------------------- S61
  console.log('S61 — Publication & diffusion');
  await page.locator('button', { hasText: 'Publier la version' }).first().click();
  await page.waitForTimeout(700);
  const pub = await page.evaluate(() => ({
    sections: [...document.querySelectorAll('.form-section-title')].map(e => e.innerText.replace(/\s+/g, ' ').trim()),
    sorties: document.querySelectorAll('.validation-sortie').length,
    annonce: /Cette action créera/i.test(document.body.innerText),
    immuable: /n’est jamais modifiée|jamais modifiée/i.test(document.body.innerText),
    destinataires: document.querySelectorAll('.checkbox-row input').length,
  }));
  verifier('version, approbation et diffusion',
    ['Version', 'Approbation', 'Diffusion'].every(m => pub.sections.some(s => new RegExp(m, 'i').test(s))),
    pub.sections.join(' · ').slice(0, 70));
  verifier('l’écran annonce ce qu’il va créer', pub.annonce && pub.sorties >= 3, `${pub.sorties} sorties`);
  verifier('l’immuabilité est dite', pub.immuable);
  verifier('les destinataires se choisissent', pub.destinataires > 0, `${pub.destinataires} destinataires`);
  const bloque = await page.locator('.wizard-footer .btn-primary').isDisabled();
  verifier('rien ne se publie sans objet de modification', bloque);
  await page.locator('.form-input').first().fill('Mise à jour des chapitres Ressources et Qualité.');
  await page.waitForTimeout(350);
  const debloque = await page.locator('.wizard-footer .btn-primary').isDisabled();
  verifier('l’objet renseigné débloque la publication', !debloque);
  verifierGeometrie(await geometrie(page));

  /* La publication écrit réellement : la version entre à l'historique, devient
     celle en vigueur, et il n'y en a jamais deux à la fois. */
  const avantPub = await page.evaluate(() => dbManuelVersions().length);
  await page.locator('.wizard-footer .btn-primary').click();
  await page.waitForTimeout(800);
  const apresPub = await page.evaluate(() => ({
    versions: dbManuelVersions().length,
    enVigueur: dbManuelVersions().filter(v => v.statut === 'en-vigueur').length,
    journal: dbJournal().filter(j => /Manuel publié/.test(j.action)).length,
  }));
  verifier('la version entre à l’historique', apresPub.versions === avantPub + 1, `${avantPub} → ${apresPub.versions}`);
  verifier('une seule version en vigueur', apresPub.enVigueur === 1, String(apresPub.enVigueur));
  verifier('la publication est tracée au journal', apresPub.journal > 0, `${apresPub.journal} entrée(s)`);

  // ---------------------------------------------------------------- S61A
  console.log('S61A — Historique');
  await ouvrirManuel(page);
  await page.locator('.parcours-fil-etape', { hasText: 'Historique' }).first().click();
  await page.waitForTimeout(600);
  const hist = await page.evaluate(() => ({
    lignes: document.querySelectorAll('tbody tr').length,
    enVigueur: [...document.querySelectorAll('tbody tr')].filter(t => /En vigueur/.test(t.innerText)).length,
  }));
  verifier('les versions sont listées', hist.lignes >= 2, `${hist.lignes} versions`);
  verifier('une seule version est en vigueur', hist.enVigueur === 1, `${hist.enVigueur}`);
  await page.locator('tbody tr', { hasText: 'En vigueur' }).first().click();
  await page.waitForTimeout(400);
  const fiche = await page.evaluate(() => {
    const p = document.querySelector('.detail-panel');
    return {
      texte: p ? p.innerText : '',
      actions: p ? [...p.querySelectorAll('button')].map(b => b.innerText.trim()) : [],
    };
  });
  verifier('approbation et diffusion sont tracées',
    /Approuvée par/i.test(fiche.texte) && /Diffusée le/i.test(fiche.texte) && /Accusés de lecture/i.test(fiche.texte));
  verifier('on peut télécharger la version', fiche.actions.some(a => /Télécharger/.test(a)));
  verifier('aucune action ne modifie une version publiée',
    !fiche.actions.some(a => /Modifier|Éditer|Corriger/i.test(a)), fiche.actions.join(' | '));
  verifier('l’immuabilité est rappelée', /ne se modifie pas/i.test(fiche.texte));
  verifierGeometrie(await geometrie(page));

  if (erreurs.length) { echecs += erreurs.length; console.log('ERREURS JS :', erreurs); }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLe manuel de procédures est conforme au cahier.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
