/* Persistance et source unique — recette des phases A et suivantes (V6 § 43, § 47.2).
 *
 * Deux propriétés, et rien d'autre, mais ce sont celles dont tout le reste
 * dépend :
 *
 *   1. Une modification survit au rechargement. Le mode démonstration
 *      conservait jusqu'ici ses constantes en mémoire : une valeur changée
 *      disparaissait au refresh, ce qui rendait toute démonstration fausse.
 *
 *   2. Une donnée n'existe qu'une fois. Changer le déclarant Tracfin depuis
 *      un écran doit le changer partout — sinon deux écrans affichent deux
 *      vérités, et le manuel en imprime une troisième.
 *
 * Les six scénarios croisés du § 43 sont exécutés ici, au niveau de la couche
 * de données : c'est là qu'ils se jouent, et les tests d'écran vérifient
 * ensuite que l'affichage suit.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/persistance.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { allerCarteDe } = require('./aller');

let echecs = 0;

function verifier(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'OK  ' : 'ÉCHEC'}  ${libelle.padEnd(58)} ${detail === undefined ? '' : detail}`);
}

async function charger(page) {
  await page.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

(async () => {
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await navigateur.newPage({ viewport: { width: 1366, height: 768 } });
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await charger(page);
  await page.evaluate(() => resetDemoData());

  // ------------------------------------------------ Le calque persiste
  console.log('Persistance du calque');
  await page.evaluate(() => dbMajReglage('seuilDependance', 12));
  await page.waitForTimeout(200);
  await charger(page);
  const seuil = await page.evaluate(() => dbReglages().seuilDependance);
  verifier('un réglage survit au rechargement', seuil === 12, `seuil = ${seuil}`);

  // ------------------------------------------------ § 43.2 — le seuil recalcule
  const dossiers = await page.evaluate(() => ({
    a12: dependanceTousDossiers(dbReglages().seuilDependance).filter(d => d.depasse).length,
    a10: dependanceTousDossiers(10).filter(d => d.depasse).length,
  }));
  verifier('changer le seuil recalcule les dossiers concernés',
    dossiers.a12 !== dossiers.a10, `${dossiers.a10} à 10 % → ${dossiers.a12} à 12 %`);

  // ------------------------------------------------ § 43.1 — source unique
  console.log('Source unique (§ 43.1)');
  await page.evaluate(() => dbMajRole('declarant', 'Julie Bernard'));
  await page.waitForTimeout(200);
  await charger(page);
  const declarant = await page.evaluate(() => ({
    referentiel: dbValeur('lbcft.declarant'),
    role: (dbRoles().find(r => r.code === 'declarant') || {}).titulaireEffectif,
    manuel: texteManuelPartie('lbcft'),
    statut: (dbInfo('lbcft.declarant') || {}).statut,
  }));
  verifier('le référentiel porte la nouvelle valeur', declarant.referentiel === 'Julie Bernard', declarant.referentiel);
  verifier('le rôle porte la même valeur', declarant.role === 'Julie Bernard', declarant.role);
  verifier('l’information passe en « confirmée »', declarant.statut === 'confirmee', declarant.statut);
  verifier('le manuel reprend la nouvelle valeur', /Déclarant Tracfin : Julie Bernard/.test(declarant.manuel));

  // ------------------------------------------------ § 43.3 — vigilance
  console.log('Vigilance (§ 43.3)');
  const avantVig = await page.evaluate(() => ({
    aTraiter: vigilanceATraiter().length,
    analyses: dbVigilanceDossiers().filter(d => d.statut === 'complete').length,
  }));
  await page.evaluate(() => dbEnregistrerAnalyse('sarl-beta', {
    classification: { caracteristiquesClient: 'Faible', activiteClient: 'Faible', localisationClient: 'Faible', missionsProposees: 'Faible' },
    niveauRetenu: 'Normale', justification: 'Dossier sans facteur de risque particulier.',
    operationsParticulieres: [],
  }));
  await page.waitForTimeout(200);
  await charger(page);
  const apresVig = await page.evaluate(() => ({
    aTraiter: vigilanceATraiter().length,
    analyses: dbVigilanceDossiers().filter(d => d.statut === 'complete').length,
    niveau: (dbVigilanceDossiers().find(d => d.dossier === 'sarl-beta') || {}).niveauRetenu,
  }));
  verifier('l’analyse survit au rechargement', apresVig.niveau === 'Normale', apresVig.niveau);
  verifier('le portefeuille couvre un dossier de plus',
    apresVig.analyses === avantVig.analyses + 1, `${avantVig.analyses} → ${apresVig.analyses}`);
  verifier('le dossier sort de la liste à traiter',
    apresVig.aTraiter < avantVig.aTraiter, `${avantVig.aTraiter} → ${apresVig.aTraiter}`);

  // ------------------------------------------------ § 43.6 — réclamation → NC
  console.log('Réclamation et non-conformité (§ 43.6)');
  const avantNc = await page.evaluate(() => ({ rec: dbReclamations().length, nc: dbNonConformites().length }));
  const lien = await page.evaluate(async () => {
    const r = await dbAjouterReclamation({ dossier: 'sas-nova', canal: 'E-mail', objet: 'Test de recette', traitePar: 'martin' });
    const n = await dbCreerNonConformite({
      dossier: r.dossier, origine: 'Réclamation client', reference: r.id,
      constat: r.objet, incidence: 'À apprécier.',
    });
    return { rec: r.id, nc: n.id, reference: n.reference };
  });
  await page.waitForTimeout(200);
  await charger(page);
  const apresNc = await page.evaluate(() => ({ rec: dbReclamations().length, nc: dbNonConformites().length }));
  verifier('la réclamation est créée et persiste', apresNc.rec === avantNc.rec + 1, `${avantNc.rec} → ${apresNc.rec}`);
  verifier('la non-conformité est créée et persiste', apresNc.nc === avantNc.nc + 1, `${avantNc.nc} → ${apresNc.nc}`);
  verifier('la non-conformité pointe la réclamation', lien.reference === lien.rec, `${lien.nc} → ${lien.reference}`);

  // ------------------------------------------------ § 43.4 — risque qualité
  console.log('Risque qualité (§ 43.4)');
  const avantRq = await page.evaluate(() => dbRisquesQualite().filter(r => r.etat === 'valide').length);
  await page.evaluate(() => dbValiderRisqueQualite('rq-gouv', {}));
  await page.waitForTimeout(200);
  await charger(page);
  const apresRq = await page.evaluate(() => dbRisquesQualite().filter(r => r.etat === 'valide').length);
  verifier('valider un risque avance la progression', apresRq === avantRq + 1, `${avantRq} → ${apresRq}`);

  // ------------------------------------------------ § 43.5 — publication du manuel
  console.log('Publication du manuel (§ 43.5)');
  const avantMan = await page.evaluate(() => ({
    versions: dbManuelVersions().length,
    enVigueur: (dbManuelVersions().find(v => v.statut === 'en-vigueur') || {}).numero,
  }));
  await page.evaluate(() => dbPublierManuel({ numero: 'v3.0', objet: 'Recette de persistance.' }));
  await page.waitForTimeout(200);
  await charger(page);
  const apresMan = await page.evaluate(() => ({
    versions: dbManuelVersions().length,
    enVigueur: (dbManuelVersions().find(v => v.statut === 'en-vigueur') || {}).numero,
    combienEnVigueur: dbManuelVersions().filter(v => v.statut === 'en-vigueur').length,
  }));
  verifier('la version est ajoutée à l’historique', apresMan.versions === avantMan.versions + 1, `${avantMan.versions} → ${apresMan.versions}`);
  verifier('la nouvelle version est en vigueur', apresMan.enVigueur === 'v3.0', apresMan.enVigueur);
  verifier('une seule version en vigueur à la fois', apresMan.combienEnVigueur === 1, String(apresMan.combienEnVigueur));

  // ------------------------------------------------ Le journal trace tout
  console.log('Journal des validations (§ 34)');
  const journal = await page.evaluate(() => dbJournal().map(j => j.action));
  verifier('les validations sont tracées', journal.length >= 6, `${journal.length} entrées`);
  verifier('le manuel publié y figure', journal.some(a => /Manuel publié/.test(a)));
  verifier('la vigilance validée y figure', journal.some(a => /Vigilance validée/.test(a)));
  verifier('le rôle modifié y figure', journal.some(a => /Rôle modifié/.test(a)));

  // ------------------------------------------------ À l'écran, pas seulement
  // dans la couche : le seuil s'édite dans Gouvernance, et la valeur doit
  // encore être là après un rafraîchissement (§ 47.2).
  console.log('Persistance vue de l’écran (§ 47.2)');
  await page.evaluate(() => resetDemoData());
  await charger(page);
  await allerCarteDe(page, 'Gouvernance', 'Dépendance économique');
  const champ = page.locator('input.tuile-champ').first();
  await champ.fill('15');
  await champ.blur();
  await page.waitForTimeout(400);
  await charger(page);
  await allerCarteDe(page, 'Gouvernance', 'Dépendance économique');
  const affiche = await page.locator('input.tuile-champ').first().inputValue();
  verifier('le seuil saisi est encore affiché après rechargement', affiche === '15', `${affiche} %`);
  const coucheEcran = await page.evaluate(() => dbReglages().seuilDependance);
  verifier('l’écran a écrit dans la couche de données', coucheEcran === 15, String(coucheEcran));

  // ------------------------------------------------ Remise à zéro
  console.log('Remise à zéro');
  await page.evaluate(() => resetDemoData());
  await page.waitForTimeout(200);
  await charger(page);
  const apresReset = await page.evaluate(() => ({
    seuil: dbReglages().seuilDependance,
    declarant: dbValeur('lbcft.declarant'),
    rec: dbReclamations().length,
    journal: dbJournal().length,
  }));
  verifier('le seuil revient à sa semence', apresReset.seuil === 10, String(apresReset.seuil));
  verifier('le déclarant revient à sa semence', apresReset.declarant === 'Martin Dupont', apresReset.declarant);
  verifier('les ajouts disparaissent', apresReset.rec === 3 && apresReset.journal === 0, `${apresReset.rec} réclamations, ${apresReset.journal} entrées`);

  if (erreurs.length) { echecs += erreurs.length; console.log('ERREURS JS :', erreurs); }
  await navigateur.close();
  console.log(echecs === 0
    ? '\nLes données survivent au rechargement et n’existent qu’une fois.'
    : `\n${echecs} anomalie(s).`);
  process.exit(echecs === 0 ? 0 : 1);
})();
