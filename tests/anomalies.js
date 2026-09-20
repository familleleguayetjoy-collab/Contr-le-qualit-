/* Recette « anomalies » — les six onglets et la relance consolidée.
 *
 * Ce qu'elle vérifie :
 *   — exactement six onglets, et aucune vue générale ;
 *   — une seule nature d'anomalie par onglet, deux pour les notes ;
 *   — la sélection multiple et la relance groupée ;
 *   — une relance par collaborateur, jamais une par anomalie ;
 *   — la relance enregistrée alimente l'onglet Relances et la colonne
 *     « Dernière relance » ;
 *   — une anomalie régularisée sort des tableaux et n'y revient pas.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { ONGLETS_ANOMALIES, allerOnglet, allerAnomalies, allerFiltre, ouvrirEc } = require('./aller');

let anomalies = 0;
function verifie(nom, condition, detail) {
  if (condition) console.log('  ok     ' + nom);
  else { anomalies++; console.log('  ÉCHEC  ' + nom + (detail ? ' — ' + detail : '')); }
}

(async () => {
  const navigateur = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
  const page = await ouvrirEc(navigateur);
  await allerOnglet(page, 'Anomalies');

  const segments = await page.locator('.segment').allInnerTexts();
  const libelles = segments.map(t => t.split('\n')[0].trim());
  verifie('six onglets, dans l’ordre du cahier',
    JSON.stringify(libelles) === JSON.stringify(ONGLETS_ANOMALIES), libelles.join(' | '));
  verifie('aucune vue « toutes les anomalies »',
    !libelles.some(t => /toutes|tout/i.test(t)), libelles.join(' | '));

  // Chaque onglet de dossiers ne porte qu'une seule nature d'anomalie.
  const attendus = {
    'Lettres de mission': ['Lettre de mission absente'],
    'Documents d’identité': ['Pièce d’identité absente'],
    RBE: ['Justificatif de consultation RBE absent'],
  };
  for (const [onglet, types] of Object.entries(attendus)) {
    await allerAnomalies(page, onglet);
    const naturelles = await page.evaluate(code => {
      const codes = { 'Lettres de mission': 'lettres', 'Documents d’identité': 'identite', RBE: 'rbe' }[code];
      return [...new Set(anomaliesDeLOnglet(codes).map(a => a.libelle))];
    }, onglet);
    verifie(`« ${onglet} » ne porte qu’une nature d’anomalie`,
      JSON.stringify(naturelles) === JSON.stringify(types), naturelles.join(' | '));
    /* Les en-têtes sont mis en capitales par la feuille de style : on compare
       sur le texte normalisé, pas sur son rendu. */
    const colonnes = (await page.locator('.tableau-moderne thead th').allInnerTexts())
      .slice(1).map(t => t.trim().toLowerCase());
    verifie(`« ${onglet} » a les colonnes du cahier`,
      JSON.stringify(colonnes) === JSON.stringify(
        ['dossier', 'collaborateur', 'détectée le', 'dernière relance', 'statut']),
      colonnes.join(' | '));
  }

  // Notes de synthèse : deux natures, pas une de plus, et un filtre à trois entrées.
  await allerAnomalies(page, 'Notes de synthèse');
  const filtres = await page.locator('.filtre-interne').allInnerTexts();
  verifie('le filtre des notes a trois entrées',
    JSON.stringify(filtres) === JSON.stringify(['Toutes', 'Absentes', 'Non supervisées']),
    filtres.join(' | '));
  const naturesNotes = await page.evaluate(() =>
    [...new Set(anomaliesDeLOnglet('notes').map(a => a.libelle))].sort());
  verifie('exactement deux natures pour les notes', naturesNotes.length === 2, naturesNotes.join(' | '));

  // Autres documents : deux catégories, et pas d'autres.
  await allerAnomalies(page, 'Autres documents');
  const filtresAutres = await page.locator('.filtre-interne').allInnerTexts();
  verifie('Autres documents a deux filtres',
    JSON.stringify(filtresAutres) === JSON.stringify(['Indépendance', 'Formations']),
    filtresAutres.join(' | '));

  // ------------------------------------------------- La relance consolidée
  await allerAnomalies(page, 'RBE');
  const lignesRbe = await page.locator('.tableau-moderne tbody tr').count();
  await page.locator('thead input[type=checkbox]').click();
  await page.waitForTimeout(250);
  const choisies = await page.locator('.barre-actions-compte').innerText();
  verifie('« tout sélectionner » coche toutes les lignes',
    choisies.startsWith(String(lignesRbe)), choisies);

  const collaborateurs = await page.evaluate(() =>
    [...new Set(anomaliesDeLOnglet('rbe').map(a => a.collaborateur))].length);
  await page.getByRole('button', { name: 'Relancer', exact: true }).click();
  await page.waitForTimeout(500);
  const blocs = await page.locator('.relance-bloc').count();
  verifie('une relance par collaborateur, pas une par anomalie',
    blocs === collaborateurs, `${blocs} relance(s) pour ${lignesRbe} anomalies et ${collaborateurs} collaborateur(s)`);

  const premier = await page.locator('.relance-message').first().innerText();
  verifie('le message liste les pièces attendues',
    premier.includes('justificatif de consultation'), premier.slice(0, 80));
  verifie('le message ne parle que d’une personne',
    (premier.match(/^Bonjour/m) || []).length === 1);

  await page.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.waitForTimeout(350);

  // La relance doit apparaître dans l'onglet Relances, groupée par personne.
  await allerAnomalies(page, 'Relances');
  const cartes = await page.locator('.relance-carte').count();
  verifie('l’onglet Relances groupe par collaborateur', cartes >= collaborateurs, cartes + ' carte(s)');
  /* Le décompte a été retiré des en-têtes le 20 septembre : ce qui doit
     ressortir est le nom de la personne, puisque c'est par personne qu'on
     relance. Le détail est dans le tableau, ligne par ligne. */
  const noms = await page.locator('.relance-carte-nom').allInnerTexts();
  verifie('chaque carte nomme son collaborateur',
    noms.length === cartes && noms.every(t => t.trim().length > 2), noms.join(' | '));
  const compteurs = await page.locator('.relance-carte-compte').count();
  verifie('aucun décompte dans l’en-tête d’une relance', compteurs === 0, compteurs + '');

  // Et la colonne « Dernière relance » du tableau doit être datée.
  await allerAnomalies(page, 'RBE');
  const dates = await page.locator('.tableau-moderne tbody tr td:nth-child(5)').allInnerTexts();
  verifie('la colonne « Dernière relance » est renseignée',
    dates.every(d => d.trim() !== '—'), dates.join(' | '));

  // ------------------------------------------------------ Régularisation
  const avant = await page.locator('.tableau-moderne tbody tr').count();
  await page.locator('.tableau-moderne tbody tr').first().click();
  await page.getByRole('button', { name: 'Marquer régularisé' }).click();
  await page.waitForTimeout(450);
  const apres = await page.locator('.tableau-moderne tbody tr').count();
  verifie('une anomalie régularisée sort du tableau', apres === avant - 1, `${avant} → ${apres}`);

  await page.reload();
  await page.waitForTimeout(800);
  await allerOnglet(page, 'Anomalies');
  await allerAnomalies(page, 'RBE');
  const relues = await page.locator('.tableau-moderne tbody tr').count();
  verifie('elle ne revient pas après rafraîchissement', relues === apres, String(relues));

  /* Et elle reste visible dans les relances, marquée réglée. Les cartes sont
     repliées sauf la première : on les déplie toutes avant de compter. */
  await allerAnomalies(page, 'Relances');
  const nbCartes = await page.locator('.relance-carte-entete').count();
  for (let i = 0; i < nbCartes; i++) {
    const carte = page.locator('.relance-carte').nth(i);
    if (!(await carte.evaluate(e => e.classList.contains('deplie')))) {
      await carte.locator('.relance-carte-entete').click();
      await page.waitForTimeout(200);
    }
  }
  const reglees = await page.locator('.relance-carte.deplie .pastille-vert').count();
  verifie('elle apparaît réglée dans les relances', reglees >= 1, reglees + ' élément(s) réglé(s)');
  const parLaDonnee = await page.evaluate(() =>
    relancesParCollaborateur().reduce((n, g) => n + g.elements.filter(e => e.reglee).length, 0));
  verifie('la couche de données la compte comme réglée', parLaDonnee >= 1, String(parLaDonnee));

  verifie('aucune erreur console', page.__erreurs.length === 0, page.__erreurs.join(' / '));
  await navigateur.close();
  console.log(anomalies
    ? `\n${anomalies} anomalie(s) sur le module Anomalies.`
    : '\nLes six onglets tiennent, et la relance regroupe bien par personne.');
  process.exit(anomalies ? 1 : 0);
})();
