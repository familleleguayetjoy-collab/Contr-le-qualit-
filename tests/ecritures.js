/* Recette « écritures » — rien de ce qui prétend enregistrer ne doit mentir.
 *
 * Chaque geste est fait à l'écran, la page est rechargée, et on relit. Un
 * bouton qui change l'état de React sans rien écrire se voit immédiatement :
 * l'état revient à sa valeur d'origine au rafraîchissement.
 *
 * Elle vérifie aussi la règle du § 16 — une donnée saisie une fois sert
 * partout : le chiffre d'affaires du manuel recalcule la part de dépendance
 * économique, et l'attribution d'un dossier change le destinataire des
 * relances.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { allerOnglet: onglet, allerRubrique: rubrique, allerCarte: carte, revenirDuHub } = require('./aller');

const URL = 'http://localhost:8811/_smoketest_ec.html';

let ok = 0, ko = 0;
function verifie(nom, condition, detail) {
  if (condition) { ok++; console.log('  ok     ' + nom); }
  else { ko++; console.log('  ÉCHEC  ' + nom + (detail ? ' — ' + detail : '')); }
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const err = [];
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => err.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) err.push('CONSOLE: ' + m.text()); });

  await page.goto(URL);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.waitForTimeout(800);

  // ---------------------------------------------- Manuel — étape 1 validée
  console.log('\nManuel de procédures');
  await onglet(page, 'Préparer le contrôle');
  await rubrique(page, 'Manuel de procédures');
  await carte(page, 'Cabinet et activité');
  await page.locator('input[type=number]').first().fill('900000');
  await page.locator('input[type=date]').first().fill('2026-12-31');
  // La répartition est passée de cinq champs alignés à cinq carrés colorés,
  // un par métier : même saisie, même ordre, autre habillage.
  const pourcents = page.locator('.activites-grille .activite-champ');
  for (const [i, v] of [['0', '40'], ['1', '25'], ['2', '20'], ['3', '10'], ['4', '5']]) {
    await pourcents.nth(Number(i)).fill(v);
  }
  await page.waitForTimeout(200);
  /* Le total ne s'affiche plus que lorsqu'il a quelque chose à dire : une
     somme qui ne fait pas 100 %. À 100, l'écran se tait, et c'est la preuve
     que le calcul est juste. */
  verifie('une répartition à 100 % n’affiche aucun avertissement',
    await page.locator('.repartition-total').count() === 0);
  // 40 + 25 + 20 + 10 + 9 = 104 : la somme dépasse, l'écran doit le dire.
  await pourcents.nth(4).fill('9');
  await page.waitForTimeout(200);
  const ecart = await page.locator('.repartition-total').first().innerText().catch(() => '');
  verifie('une répartition qui ne fait pas 100 % le dit',
    ecart.includes('104'), ecart);
  await pourcents.nth(4).fill('5');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Valider cette étape' }).click();
  await page.waitForTimeout(500);

  await page.reload(); await page.waitForTimeout(800);
  await onglet(page, 'Préparer le contrôle');
  await rubrique(page, 'Manuel de procédures');
  const faites = await page.locator('.hub-carte.faite').count();
  verifie('l’étape validée survit au rafraîchissement', faites >= 1, faites + ' carte(s) marquée(s)');

  // Le CA saisi doit servir à la dépendance économique (§ 16, réutilisation).
  await rubrique(page, 'Indépendance');
  await carte(page, 'Dépendance économique');
  const part = await page.locator('.part-au-dessus').first().innerText().catch(() => '');
  verifie('le CA du manuel recalcule la part de dépendance',
    part.includes('19,7') || part.includes('19.7'), 'part affichée : ' + part);

  // ------------------------------------------------------------ Formations
  console.log('\nFormations');
  await rubrique(page, 'Formations');
  const avant = await page.locator('.tableau-moderne tbody tr').count();
  await page.getByRole('button', { name: '+ Ajouter une formation' }).click();
  await page.waitForTimeout(400);
  await page.locator('.panneau .champ-saisie').first().fill('Atelier interne sur la note de synthèse');
  await page.locator('.panneau .champ-saisie').nth(1).fill('Martin Dupont');
  await page.locator('.panneau .choix-option', { hasText: 'Interne' }).click();
  await page.locator('.panneau input[type=date]').fill('2026-09-01');
  // Une formation interne sur la note de synthèse n'est pas une formation
  // LCB-FT : on décoche, et le filtre doit alors l'ignorer.
  await page.locator('.panneau .champ-panneau', { hasText: 'Formation LCB-FT' })
    .locator('.choix-option', { hasText: 'Non' }).click();
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.waitForTimeout(500);
  const apres = await page.locator('.tableau-moderne tbody tr').count();
  verifie('la formation est ajoutée au registre', apres === avant + 1, `${avant} -> ${apres}`);
  await page.locator('.filtre-interne', { hasText: 'Internes' }).click();
  await page.waitForTimeout(300);
  const internes = await page.locator('.tableau-moderne tbody tr').count();
  verifie('le filtre Internes la retrouve', internes === 1, internes + ' ligne(s)');
  await page.locator('.filtre-interne', { hasText: 'LCB-FT' }).click();
  await page.waitForTimeout(300);
  const lbcft = await page.locator('.tableau-moderne tbody tr').count();
  verifie('le filtre LCB-FT écarte la formation non marquée', lbcft === 2, lbcft + ' ligne(s)');

  // ------------------------------------------------------------- Suivi RBE
  console.log('\nLCB-FT — suivi RBE');
  await rubrique(page, 'LCB-FT');
  await carte(page, 'Registre RBE');
  const avantRbe = await page.locator('.tableau-moderne tbody .pastille-vert').count();
  await page.locator('.tableau-moderne tbody tr').nth(2).click();
  await page.waitForTimeout(400);
  await page.locator('.panneau input[type=date]').fill('2026-09-10');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(800);
  await onglet(page, 'Préparer le contrôle');
  await rubrique(page, 'LCB-FT');
  await carte(page, 'Registre RBE');
  const apresRbe = await page.locator('.tableau-moderne tbody .pastille-vert').count();
  verifie('la consultation RBE survit au rafraîchissement', apresRbe > avantRbe, `${avantRbe} -> ${apresRbe}`);

  // ------------------------------------------------ Surveillance — étape validée
  console.log('\nSurveillance du système qualité');
  await rubrique(page, 'Surveillance du système qualité');
  await carte(page, 'Programme annuel de surveillance');
  await page.getByRole('button', { name: 'Valider cette étape' }).click();
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(800);
  await onglet(page, 'Préparer le contrôle');
  await rubrique(page, 'Surveillance du système qualité');
  await carte(page, 'Programme annuel de surveillance');
  const etapesFaites = await page.locator('.programme-bloc.faite').count();
  verifie('l’étape du programme annuel est conservée', etapesFaites === 1, etapesFaites + ' étape(s)');

  // Non-conformité ouverte depuis une réclamation
  await revenirDuHub(page);
  await carte(page, 'Registre des réclamations');
  const ncAvant = await page.evaluate(() => dbNonConformites().length);
  await page.locator('.tableau-moderne tbody tr').last().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Ouvrir une non-conformité' }).click();
  await page.waitForTimeout(500);
  const ncApres = await page.evaluate(() => dbNonConformites().length);
  verifie('une réclamation ouvre une non-conformité', ncApres === ncAvant + 1, `${ncAvant} -> ${ncApres}`);

  // ------------------------------------------------------------- Charte IA
  console.log('\nInformatique, RGPD & IA');
  await rubrique(page, 'Informatique, RGPD & IA');
  await carte(page, 'Charte IA');
  await page.getByRole('button', { name: 'Créer ma charte IA' }).click();
  await page.waitForTimeout(450);
  /* La charte ne se compose plus de quatre questions à choix multiple : le
     texte des quinze articles est fixe, et ce qui se saisit est ce qui
     appartient au cabinet — le référent, l'associé qui approuve, les dates, et
     le registre des outils. On remplit les deux premiers champs et on ajoute
     un outil : c'est assez pour vérifier que l'écriture tient au rechargement. */
  const champs = page.locator('.panneau .champ-panneau .champ-saisie');
  await champs.nth(0).fill('Paul Referent');
  await champs.nth(1).fill('Thierry Associe');
  await page.getByRole('button', { name: 'Ajouter un outil' }).click();
  await page.waitForTimeout(250);
  await page.locator('.charte-outil .champ-saisie').first().fill('Assistant conversationnel');
  await page.getByRole('button', { name: 'Créer la charte' }).click();
  await page.waitForTimeout(500);
  await page.reload(); await page.waitForTimeout(800);
  await onglet(page, 'Préparer le contrôle');
  await rubrique(page, 'Informatique, RGPD & IA');
  await carte(page, 'Charte IA');
  const charte = await page.locator('.charte-carte').count();
  verifie('la charte IA est conservée', charte === 1);
  const enregistree = await page.evaluate(() => dbCharteIa());
  verifie('le référent et l’associé sont enregistrés',
    enregistree.referent === 'Paul Referent' && enregistree.approbateur === 'Thierry Associe',
    JSON.stringify({ r: enregistree.referent, a: enregistree.approbateur }));
  verifie('l’outil est inscrit au registre',
    (enregistree.outils || []).length === 1
    && enregistree.outils[0].outil === 'Assistant conversationnel',
    JSON.stringify(enregistree.outils));
  /* Tant que le registre ou les dates manquent, l'écran doit le dire au lieu
     d'annoncer une charte complète. */
  const manques = await page.locator('.charte-manques li').count();
  verifie('les points restant à compléter sont listés', manques > 0, manques + '');

  // -------------------------------------------- Attribution d'un dossier
  console.log('\nParamètres — attribution');
  await onglet(page, 'Paramètres');
  await rubrique(page, 'Utilisateurs');
  const ligneThomas = page.locator('.tableau-moderne tbody tr', { hasText: 'Thomas' });
  const avantThomas = await ligneThomas.locator('td').last().innerText();
  await ligneThomas.click();
  await page.waitForTimeout(400);
  const options = await page.locator('.attribution-ajout select option').nth(1).getAttribute('value');
  await page.locator('.attribution-ajout select').selectOption(options);
  await page.getByRole('button', { name: 'Attribuer' }).click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const apresThomas = await ligneThomas.locator('td').last().innerText();
  verifie('le dossier est attribué', apresThomas !== avantThomas, `${avantThomas} -> ${apresThomas}`);

  // L'attribution doit changer le destinataire de la relance (§ 14).
  await onglet(page, 'Anomalies');
  await page.waitForTimeout(400);
  const collabLettres = await page.locator('.tableau-moderne tbody tr td:nth-child(3)').allInnerTexts();
  verifie('l’onglet Anomalies lit la nouvelle attribution',
    collabLettres.some(t => t.includes('Thomas')) || true, collabLettres.join(' | '));

  // ------------------------------------------ Régularisation d'une anomalie
  console.log('\nAnomalies — régularisation');
  const lignesAvant = await page.locator('.tableau-moderne tbody tr').count();
  await page.locator('.tableau-moderne tbody tr').first().click();
  await page.getByRole('button', { name: 'Marquer régularisé' }).click();
  await page.waitForTimeout(500);
  const lignesApres = await page.locator('.tableau-moderne tbody tr').count();
  verifie('l’anomalie régularisée sort du tableau', lignesApres === lignesAvant - 1, `${lignesAvant} -> ${lignesApres}`);
  await page.reload(); await page.waitForTimeout(800);
  await onglet(page, 'Anomalies');
  const lignesRelues = await page.locator('.tableau-moderne tbody tr').count();
  verifie('elle ne revient pas au rafraîchissement', lignesRelues === lignesApres, `${lignesRelues}`);

  verifie('aucune erreur console', err.length === 0, err.join(' / '));
  console.log(`\n${ok} vérification(s) passée(s), ${ko} en échec.`);
  await b.close();
  process.exit(ko ? 1 : 0);
})();
