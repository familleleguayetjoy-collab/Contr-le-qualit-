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
  'Cabinet et implantation', 'Utilisateurs et gouvernance', 'Responsables',
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

/* Ouvre une sous-catégorie de la barre de gauche. La catégorie qui la contient
   doit être ouverte : allerOnglet s'en charge. Sur téléphone, le tiroir reste
   ouvert après un clic sur une catégorie — il faut seulement le rouvrir s'il
   s'est refermé entre-temps. */
async function allerRubrique(page, nom) {
  const replie = await page.locator('.hamburger-btn').isVisible().catch(() => false);
  if (replie && !(await page.locator('.sidebar.mobile-open').count())) {
    await page.locator('.hamburger-btn').first().click();
    await page.waitForTimeout(350);
  }
  await page.locator('.nav-sous-item', { hasText: nom }).first().click();
  await page.waitForTimeout(450);
}

/* Ouvre une carte d'un hub interne, et revient. */
async function allerCarte(page, nom) {
  await page.locator('.hub-carte', { hasText: nom }).first().click();
  await page.waitForTimeout(500);
}
async function revenirDuHub(page) {
  await page.locator('.retour-hub').first().click();
  await page.waitForTimeout(450);
}

/* Ouvre un onglet du segmented control des anomalies. */
async function allerAnomalies(page, nom) {
  await page.locator('.segment', { hasText: nom }).first().click();
  await page.waitForTimeout(400);
}

/* Les six onglets d'anomalies sont aussi des sous-catégories de la barre :
   c'est le chemin que prend un utilisateur qui arrive d'ailleurs. */
async function allerAnomaliesParLaBarre(page, nom) {
  await allerOnglet(page, 'Anomalies');
  await allerRubrique(page, nom);
}

/* Ouvre un filtre interne (LCB-FT, surveillance, formations, autres). */
async function allerFiltre(page, nom) {
  await page.locator('.filtre-interne', { hasText: nom }).first().click();
  await page.waitForTimeout(400);
}

/* Charge le harnais expert-comptable sur un état vierge. */
async function ouvrirEc(navigateur, viewport) {
  /* Locale française, pour que les dates et les nombres formatés par
     l'application soient relus tels que le cabinet les verra.

     À savoir en relisant une capture : le Chromium de ce conteneur affiche
     quand même « mm/dd/yyyy » dans un champ `<input type="date">`, même lancé
     avec --lang=fr-FR — c'est sa base de locales qui est incomplète, pas
     l'application. Vérifié le 23 septembre sur une page vide. */
  const page = await navigateur.newPage({
    viewport: viewport || { width: 1440, height: 900 },
    locale: 'fr-FR',
  });
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
  allerOnglet, allerRubrique, allerCarte, revenirDuHub,
  allerAnomalies, allerFiltre, ouvrirEc,
};
