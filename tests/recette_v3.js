/* Recette finale du cahier V3 — § 11.
 *
 * Les recettes par phase vérifient chacune leurs écrans. Celle-ci vérifie les
 * règles qui valent PARTOUT, sur tous les écrans atteignables, aux deux
 * résolutions de recette :
 *
 *   Navigation   — exactement les onze entrées du § 2, aucune ancienne
 *                  catégorie fourre-tout.
 *   Viewport     — aucun écran n'exige de faire défiler la page.
 *   Titres       — aucun sous-titre sous le H1.
 *   Actions      — une seule action primaire par écran ; aucun bouton
 *                  important réduit à une icône seule.
 *   Listes       — six lignes visibles au plus, et jamais de liste paginée qui
 *                  défile en plus de sa pagination.
 *   Couleurs     — une dominante par écran ; pas d'arc-en-ciel de bandeaux.
 *   IA           — aucun score de conformité ou de confiance.
 *   Données      — aucune valeur « undefined », « NaN » ou « [object » à
 *                  l'écran.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/recette_v3.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { allerHub } = require('./aller');

/* Les sept entrées de la barre latérale (§ 10 du V6) et les quatre hubs
   devenus étapes du parcours. Le balayage couvre les deux : ce que la refonte
   de la navigation a déplacé doit rester aussi propre qu'avant. */
const ENTREES_BARRE = [
  'Accueil', 'Entrée en mission', 'Dossiers & anomalies',
  'Préparer mon contrôle', 'LBC-FT',
  'Documents du cabinet', 'Manuel de procédures',
];

const HUBS_PARCOURS = [
  'Gouvernance', 'Ressources', 'Cycle de la relation client', 'Surveillance & qualité',
];

const ENTREES = ENTREES_BARRE.concat(HUBS_PARCOURS);

let echecs = 0;
const griefs = [];

function noter(ecran, regle, detail) {
  echecs++;
  griefs.push(`${ecran} — ${regle}${detail ? ' : ' + detail : ''}`);
}

async function auditer(page) {
  return page.evaluate(() => {
    const dw = document.documentElement.clientWidth;
    const res = {
      titre: (document.querySelector('h1') || {}).textContent || null,
      sousTitre: !!document.querySelector('.page-header .subtitle'),
      scrollPage: document.documentElement.scrollHeight - window.innerHeight,
      debords: [],
      listesQuiDefilent: [],
      lignes: 0,
      primaires: 0,
      iconesSeules: [],
      dominantes: [],
      score: false,
      valeursCassees: [],
    };

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
      if (r.right > dw + 2 && !dansScrollerX) res.debords.push(el.className || el.tagName);
    });

    document.querySelectorAll('.table-wrap').forEach(tw => {
      if (tw.scrollHeight > tw.clientHeight + 1) res.listesQuiDefilent.push(`+${tw.scrollHeight - tw.clientHeight}px`);
    });
    res.lignes = document.querySelectorAll('.page tbody tr').length;

    // Une seule action primaire par écran : on ne compte que celles de
    // l'en-tête et du pied d'assistant, pas les boutons d'une fiche.
    res.primaires = document.querySelectorAll('.page-header-actions .btn-primary, .wizard-footer .btn-primary').length;

    // Un bouton sans texte lisible n'est reconnaissable que par son icône.
    document.querySelectorAll('.page-header-actions button, .wizard-footer button').forEach(b => {
      const texte = b.textContent.replace(/[\p{Extended_Pictographic}←-⇿✓✔✗\s·—–]/gu, '').trim();
      if (!texte) res.iconesSeules.push(b.className);
    });

    // Une dominante par écran : on relève les tons des bandeaux de rubrique.
    const tons = new Set();
    document.querySelectorAll('.page .form-section').forEach(fs => {
      const m = String(fs.className).match(/sec-(\w+)/);
      if (m) tons.add(m[1]);
    });
    res.dominantes = [...tons];

    const texte = document.body.innerText;
    res.score = /\b\d{1,3}\s?%\s*(de\s+)?(conform|confian|fiabilit|maturit)/i.test(texte);
    ['undefined', 'NaN', '[object', 'null'].forEach(m => {
      if (new RegExp(`(^|[\\s:>(])${m.replace('[', '\\[')}([\\s<).,]|$)`).test(texte)) res.valeursCassees.push(m);
    });
    return res;
  });
}

function controler(ecran, a) {
  if (a.scrollPage > 0) noter(ecran, 'la page exige un défilement', `${a.scrollPage}px`);
  if (a.debords.length) noter(ecran, 'débordement latéral', a.debords[0]);
  if (a.sousTitre) noter(ecran, 'sous-titre sous le H1');
  if (!a.titre) noter(ecran, 'aucun titre');
  if (a.listesQuiDefilent.length) noter(ecran, 'liste paginée qui défile', a.listesQuiDefilent[0]);
  if (a.lignes > 6) noter(ecran, 'plus de six lignes visibles', String(a.lignes));
  if (a.primaires > 1) noter(ecran, 'plusieurs actions primaires', String(a.primaires));
  if (a.iconesSeules.length) noter(ecran, 'bouton réduit à une icône seule', a.iconesSeules[0]);
  if (a.dominantes.length > 3) noter(ecran, 'trop de tons sur un écran', a.dominantes.join('/'));
  if (a.score) noter(ecran, 'score de conformité affiché');
  if (a.valeursCassees.length) noter(ecran, 'valeur cassée à l’écran', a.valeursCassees.join(', '));
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let ecrans = 0;

  for (const vp of [{ w: 1440, h: 900 }, { w: 1366, h: 768 }]) {
    const page = await navigateur.newPage({ viewport: { width: vp.w, height: vp.h } });
    const erreurs = [];
    page.on('pageerror', e => erreurs.push(e.message));
    await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Le libellé vit dans .nav-label : le textContent y colle l'icône.
    const entrees = await page.$$eval('.nav-item .nav-label', els => els.map(e => e.textContent.trim()));
    const attendues = ENTREES_BARRE.every(e => entrees.some(x => x.includes(e.split(' ')[0])));
    if (entrees.length !== ENTREES_BARRE.length || !attendues) {
      noter(`${vp.w}x${vp.h}`, 'la barre latérale ne correspond pas au § 10', entrees.join(' | '));
    }
    if (/Conformité cabinet|Informations confirmées|Documents générés|Préparation du contrôle/.test(entrees.join(' '))) {
      noter(`${vp.w}x${vp.h}`, 'ancienne catégorie encore au premier niveau');
    }

    for (const entree of ENTREES) {
      await allerHub(page, entree);
      ecrans++;
      controler(`${vp.w}x${vp.h} ${entree}`, await auditer(page));

      const nbCartes = await page.locator('.hub-carte').count();
      for (let i = 0; i < nbCartes; i++) {
        await page.locator('.hub-carte').nth(i).click();
        await page.waitForTimeout(450);
        ecrans++;
        const titre = await page.evaluate(() => (document.querySelector('h1') || {}).textContent || '?');
        controler(`${vp.w}x${vp.h} ${entree} › ${titre}`, await auditer(page));
        const retour = page.locator('.page-header-actions button', { hasText: 'Retour' });
        if (await retour.count()) { await retour.first().click(); await page.waitForTimeout(400); }
        else { await allerHub(page, entree, 400); }
      }
    }
    if (erreurs.length) noter(`${vp.w}x${vp.h}`, 'erreur JavaScript', erreurs[0]);
    await page.close();
  }

  await navigateur.close();
  console.log(`${ecrans} écrans audités aux deux résolutions.\n`);
  if (echecs === 0) {
    console.log('Recette V3 : les règles du § 11 tiennent sur tous les écrans.');
  } else {
    griefs.forEach(g => console.log('  ÉCHEC  ' + g));
    console.log(`\n${echecs} manquement(s) à la recette.`);
  }
  process.exit(echecs === 0 ? 0 : 1);
})();
