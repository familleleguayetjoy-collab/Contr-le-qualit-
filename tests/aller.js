/* Aller à un écran — helper commun aux recettes.
 *
 * L'espace expert-comptable se parcourt en deux gestes : une entrée de la barre
 * de gauche, puis, dans « Préparer le contrôle » et « Paramètres », une
 * rubrique dans le menu latéral de la page. Les recettes disent où elles
 * veulent aller ; ce fichier sait comment y aller.
 *
 * La prochaine refonte de la navigation ne touchera qu'ici.
 */

const ONGLETS = ['Accueil', 'Entrée en mission', 'Anomalies', 'Préparer le contrôle', 'Paramètres'];

const ONGLETS_ANOMALIES = [
  'Lettres de mission', 'Documents d’identité', 'RBE',
  'Notes de synthèse', 'Relances', 'Autres documents',
];

const RUBRIQUES_CONTROLE = [
  'Manuel de procédures', 'Indépendance', 'Formations', 'LCB-FT',
  'Supervision des dossiers', 'Surveillance du système qualité',
  'Informatique, RGPD & IA', 'Synthèse du contrôle',
];

const RUBRIQUES_PARAMETRES = [
  'Informations cabinet', 'Utilisateurs', 'Gouvernance', 'Responsables', 'Implantation',
];

/* Ouvre une entrée de la barre de gauche. Sur téléphone, elle est repliée
   derrière un hamburger : on l'ouvre d'abord si besoin. */
async function allerOnglet(page, nom) {
  const replie = await page.locator('.hamburger-btn').isVisible().catch(() => false);
  if (replie && !(await page.locator('.sidebar.mobile-open').count())) {
    await page.locator('.hamburger-btn').first().click();
    await page.waitForTimeout(350);
  }
  await page.locator('.nav-item', { hasText: nom }).first().click();
  await page.waitForTimeout(420);
}

/* Ouvre une rubrique du menu latéral (contrôle ou paramètres). */
async function allerRubrique(page, nom) {
  await page.locator('.controle-menu-item', { hasText: nom }).first().click();
  await page.waitForTimeout(450);
}

/* Ouvre un onglet du segmented control des anomalies. */
async function allerAnomalies(page, nom) {
  await page.locator('.segment', { hasText: nom }).first().click();
  await page.waitForTimeout(400);
}

/* Ouvre un filtre interne (LCB-FT, surveillance, formations, autres). */
async function allerFiltre(page, nom) {
  await page.locator('.filtre-interne', { hasText: nom }).first().click();
  await page.waitForTimeout(400);
}

/* Charge le harnais expert-comptable sur un état vierge. */
async function ouvrirEc(navigateur, viewport) {
  const page = await navigateur.newPage({ viewport: viewport || { width: 1440, height: 900 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push('PAGEERROR: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) {
      erreurs.push('CONSOLE: ' + m.text());
    }
  });
  await page.goto('http://localhost:8811/_smoketest_ec.html');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* mode privé */ } });
  await page.reload();
  await page.waitForTimeout(800);
  page.__erreurs = erreurs;
  return page;
}

module.exports = {
  ONGLETS, ONGLETS_ANOMALIES, RUBRIQUES_CONTROLE, RUBRIQUES_PARAMETRES,
  allerOnglet, allerRubrique, allerAnomalies, allerFiltre, ouvrirEc,
};
