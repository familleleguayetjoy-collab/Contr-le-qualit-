/* Valeurs modifiables — recette de la phase D du V6 (§ 11, § 14, § 15.1, § 36).
 *
 * Le cabinet avait des boutons « Modifier » qui affichaient « Modification
 * des responsables (démonstration) » et ne modifiaient rien. L'utilisateur
 * croyait le travail fait, fermait l'écran, et le manuel continuait
 * d'imprimer l'ancien nom.
 *
 * Cette recette suit la chaîne complète d'une modification, du clic au
 * rechargement : la fenêtre s'ouvre avec Annuler et Enregistrer (§ 36), la
 * valeur part dans la couche de données, le rôle la reprend, le manuel
 * l'imprime, les documents qui la portaient repassent en « à régénérer »
 * (§ 11), le journal la trace, et elle est encore là après un F5.
 *
 * Elle vérifie aussi qu'Annuler n'écrit rien : une décision métier ne se
 * prend pas par inadvertance.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/valeurs.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
let ko = 0;
function v(l, c, d) { if (!c) ko++; console.log(`  ${c?'OK  ':'ÉCHEC'}  ${l.padEnd(52)} ${d||''}`); }
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8811/_smoketest_ec.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  await p.evaluate(() => resetDemoData());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  await p.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await p.waitForTimeout(500);
  await p.locator('.parcours-fil-etape', { hasText: 'Gouvernance' }).first().click();
  await p.waitForTimeout(600);

  const lignes = await p.evaluate(() => [...document.querySelectorAll('.valeur-libelle')].map(e => e.textContent));
  v('les valeurs clés sont modifiables', lignes.length >= 3, lignes.join(' · '));

  const avant = await p.evaluate(() => ({
    declarant: dbValeur('lbcft.declarant'),
    aRegenerer: dbDocumentsGeneres().filter(d => d.etat === 'a-regenerer').length,
  }));

  // Ouvrir la modale du déclarant Tracfin.
  const i = lignes.findIndex(l => /Déclarant/.test(l));
  await p.locator('.valeur-ligne button').nth(i).click();
  await p.waitForTimeout(450);
  const modale = await p.evaluate(() => ({
    ouverte: !!document.querySelector('.modal-panel'),
    titre: (document.querySelector('.modal-title')||{}).textContent,
    boutons: [...document.querySelectorAll('.modal-actions button')].map(e => e.textContent.trim()),
    select: !!document.querySelector('.modal-panel select'),
  }));
  v('la fenêtre de saisie s’ouvre', modale.ouverte, modale.titre);
  v('elle propose Annuler et Enregistrer', modale.boutons.join('/') === 'Annuler/Enregistrer', modale.boutons.join('/'));
  v('elle propose la liste des personnes', modale.select);

  await p.selectOption('.modal-panel select', { label: 'Julie Bernard' });
  await p.waitForTimeout(250);
  await p.locator('.modal-actions button', { hasText: 'Enregistrer' }).click();
  await p.waitForTimeout(600);

  const apres = await p.evaluate(() => ({
    declarant: dbValeur('lbcft.declarant'),
    role: (dbRoles().find(r => r.code === 'declarant')||{}).titulaireEffectif,
    manuel: /Julie Bernard/.test(texteManuelPartie('lbcft')),
    aRegenerer: dbDocumentsGeneres().filter(d => d.etat === 'a-regenerer').length,
    modale: !!document.querySelector('.modal-panel'),
    affiche: [...document.querySelectorAll('.valeur-valeur')].map(e => e.textContent).join(' | '),
    journal: dbJournal().length,
  }));
  v('la fenêtre se referme', !apres.modale);
  v('la valeur est écrite dans la couche', apres.declarant === 'Julie Bernard', apres.declarant);
  v('le rôle suit', apres.role === 'Julie Bernard', apres.role);
  v('le manuel imprime la nouvelle valeur', apres.manuel);
  v('l’écran affiche la nouvelle valeur', /Julie Bernard/.test(apres.affiche), apres.affiche.slice(0, 80));
  v('les documents dépendants passent à régénérer',
    apres.aRegenerer > avant.aRegenerer, `${avant.aRegenerer} → ${apres.aRegenerer}`);
  v('la modification est tracée au journal', apres.journal > 0, `${apres.journal} entrée(s)`);

  // Et elle survit au rechargement.
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const apresRefresh = await p.evaluate(() => dbValeur('lbcft.declarant'));
  v('elle survit au rechargement', apresRefresh === 'Julie Bernard', apresRefresh);

  // Annuler ne doit rien écrire.
  await p.locator('.nav-item', { hasText: 'Préparer mon contrôle' }).first().click();
  await p.waitForTimeout(500);
  await p.locator('.parcours-fil-etape', { hasText: 'Gouvernance' }).first().click();
  await p.waitForTimeout(600);
  await p.locator('.valeur-ligne button').nth(i).click();
  await p.waitForTimeout(400);
  await p.selectOption('.modal-panel select', { label: 'Martin Dupont' });
  await p.locator('.modal-actions button', { hasText: 'Annuler' }).click();
  await p.waitForTimeout(450);
  const apresAnnuler = await p.evaluate(() => dbValeur('lbcft.declarant'));
  v('Annuler n’écrit rien', apresAnnuler === 'Julie Bernard', apresAnnuler);

  await p.evaluate(() => resetDemoData());
  if (errs.length) { ko += errs.length; console.log('ERREURS JS :', errs.slice(0,3)); }
  await b.close();
  console.log(ko === 0 ? '\nModifier une valeur la change partout.' : `\n${ko} anomalie(s).`);
  process.exit(ko === 0 ? 0 : 1);
})();
