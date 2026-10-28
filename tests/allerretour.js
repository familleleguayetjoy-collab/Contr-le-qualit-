/* Recette « aller-retour » — ce que fait le collaborateur remonte chez
 * l'expert-comptable, et inversement.
 *
 * Retour du 28 octobre : « vérifie que chacune de ces informations remonte
 * bien sur l'interface de l'EC, et vice versa ». Les deux harnais partagent
 * le même navigateur, donc le même état : on agit d'un côté, on relit de
 * l'autre.
 *   — signature de l'attestation d'indépendance, du manuel et de la charte IA ;
 *   — signalement d'un RBE, et demande pour un nouveau client ;
 *   — formation ajoutée par le collaborateur, avec son attestation.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 * Usage : node tests/allerretour.js
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { allerOnglet, allerRubrique, allerCarte } = require('./aller');

let echecs = 0;
function verifie(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'ok   ' : 'ÉCHEC'}  ${libelle.padEnd(58)} ${detail === undefined ? '' : detail}`);
}

const pause = (page, ms) => page.waitForTimeout(ms || 450);

async function ouvrir(contexte, harnais, erreurs) {
  const page = await contexte.newPage();
  page.on('pageerror', e => erreurs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.location().url || '')) erreurs.push('CONSOLE: ' + m.text()); });
  await page.goto('http://localhost:8811/' + harnais);
  await pause(page, 800);
  return page;
}

async function collabVers(page, nom) {
  await page.locator('.nav-item', { hasText: nom }).first().click();
  await pause(page);
}

const ligne = (page, titre) => page.locator('.obligation-ligne', { hasText: titre }).first();

(async () => {
  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR', acceptDownloads: true });
  const erreurs = [];

  // État vierge pour les deux espaces.
  let collab = await ouvrir(contexte, '_smoketest_collab.html', erreurs);
  await collab.evaluate(() => { try { localStorage.clear(); } catch (e) { /* mode privé */ } });
  await collab.reload(); await pause(collab, 800);
  const annee = await collab.evaluate(() => anneeEnCours());

  // ----------------------------------------------------- Mes obligations
  console.log('\n— Signatures, côté collaborateur');
  await collabVers(collab, 'Mes obligations');
  const titres = await collab.locator('.bloc-carte-entete h2').allInnerTexts();
  verifie('deux rectangles : à lire et à signer, formations',
    JSON.stringify(titres) === JSON.stringify(['À lire et à signer', 'Mes formations']), titres.join(' | '));

  const indep = ligne(collab, `Attestation d’indépendance ${annee}`);
  verifie('l’attestation d’indépendance attend sa signature',
    await indep.locator('button', { hasText: 'Signer' }).count() === 1
    && await indep.locator('button', { hasText: 'Lire' }).count() === 1);
  await indep.locator('button', { hasText: 'Signer' }).click(); await pause(collab);
  const signerInactif = await collab.locator('.panneau button', { hasText: 'Signer électroniquement' }).isDisabled();
  verifie('« Signer électroniquement » attend la case cochée', signerInactif);
  await collab.locator('.panneau .case-ligne').click();
  await collab.locator('.panneau button', { hasText: 'Signer électroniquement' }).click(); await pause(collab, 700);
  const etatIndep = await indep.innerText();
  verifie('signée : la date et l’heure remplacent « Signer »',
    /Signé le \d\d\/\d\d\/\d{4} à \d\d h \d\d/.test(etatIndep)
    && await indep.locator('button', { hasText: 'Signer' }).count() === 0, etatIndep.replace(/\n/g, ' · '));
  verifie('« Lire » demeure après la signature', await indep.locator('button', { hasText: 'Lire' }).count() === 1);
  await indep.locator('button', { hasText: 'Lire' }).click(); await pause(collab);
  verifie('la lecture propose l’exemplaire signé',
    await collab.locator('.panneau button', { hasText: 'Télécharger l’exemplaire signé' }).count() === 1);
  await collab.locator('.panneau button', { hasText: 'Fermer' }).first().click(); await pause(collab);

  const numero = await collab.evaluate(() => manuelVersionEnVigueur().numero);
  const manuel = ligne(collab, `Manuel de procédures ${numero}`);
  verifie('le manuel a ses deux boutons, Lire et Signer',
    await manuel.locator('button', { hasText: 'Lire' }).count() === 1
    && await manuel.locator('button', { hasText: 'Signer' }).count() === 1);
  await manuel.locator('button', { hasText: 'Signer' }).click(); await pause(collab);
  await collab.locator('.panneau .case-ligne').click();
  await collab.locator('.panneau button', { hasText: 'Signer électroniquement' }).click(); await pause(collab, 700);
  verifie('manuel signé, avec la date et l’heure', /Signé le .* à \d\d h \d\d/.test(await manuel.innerText()));

  const charte = await ligne(collab, 'Charte d’utilisation de l’IA').innerText();
  verifie('la charte IA figure, même non encore établie', /Pas encore établie/.test(charte), charte.replace(/\n/g, ' · '));

  // ----------------------------------------------------- Côté EC
  console.log('\n— Les mêmes signatures, côté expert-comptable');
  const ec = await ouvrir(contexte, '_smoketest_ec.html', erreurs);
  await allerOnglet(ec, 'Préparer le contrôle');
  await allerRubrique(ec, 'Indépendance');
  await allerCarte(ec, 'Attestations d’indépendance');
  const rangJulie = ec.locator('.tableau-moderne tbody tr', { hasText: 'Julie Bernard' }).first();
  verifie('la ligne de Julie se consulte', await rangJulie.locator('button', { hasText: 'Consulter' }).count() === 1);
  await rangJulie.locator('button', { hasText: 'Consulter' }).click(); await pause(ec);
  const sig = await ec.locator('.attestation-lue-signature').innerText();
  verifie('l’EC lit « signée électroniquement », avec l’heure', /Signée électroniquement le .* à \d\d h \d\d/.test(sig), sig.split('\n')[0]);
  await ec.locator('.panneau-fermer').first().click(); await pause(ec);

  await allerRubrique(ec, 'Manuel de procédures');
  const boutonManuel = ec.locator('button', { hasText: 'Signatures :' }).first();
  const texteManuel = await boutonManuel.innerText();
  verifie('le manuel compte les signatures de l’équipe', /2 \/ 5/.test(texteManuel), texteManuel);
  await boutonManuel.click(); await pause(ec);
  const julieManuel = await ec.locator('.panneau .obligation-ligne', { hasText: 'Julie Bernard' }).innerText();
  verifie('Julie y figure avec la date et l’heure', /Signé le .* à \d\d h \d\d/.test(julieManuel), julieManuel.replace(/\n/g, ' · '));
  await ec.locator('.panneau-fermer').first().click(); await pause(ec);

  const manquants = await ec.evaluate(() => diffusionAccusesManquants().map(a => a.collaborateur));
  verifie('la préparation du contrôle ne compte plus Julie parmi les manquants', manquants.indexOf('julie') < 0, manquants.join(', '));
  const declKo = await ec.evaluate(() => declarationsManquantes().map(a => a.collaborateur));
  verifie('ni parmi les attestations d’indépendance manquantes', declKo.indexOf('julie') < 0, declKo.join(', '));

  // ----------------------------------------------------- EC → collaborateur
  console.log('\n— Ce que l’EC publie arrive chez le collaborateur');
  await ec.evaluate(() => dbEnregistrerCharteIa({ referent: 'Julie Bernard', outils: [] }));
  await collab.reload(); await pause(collab, 800);
  await collabVers(collab, 'Mes obligations');
  const charteLigne = ligne(collab, 'Charte d’utilisation de l’IA');
  verifie('la charte publiée arrive avec Lire et Signer',
    await charteLigne.locator('button', { hasText: 'Lire' }).count() === 1
    && await charteLigne.locator('button', { hasText: 'Signer' }).count() === 1);
  await charteLigne.locator('button', { hasText: 'Signer' }).click(); await pause(collab);
  await collab.locator('.panneau .case-ligne').click();
  await collab.locator('.panneau button', { hasText: 'Signer électroniquement' }).click(); await pause(collab, 700);
  await ec.reload(); await pause(ec, 800);
  await allerOnglet(ec, 'Préparer le contrôle');
  await allerRubrique(ec, 'Informatique, RGPD & IA');
  const cartes = await ec.locator('.hub-carte').allInnerTexts();
  const charteCarte = cartes.find(t => /Charte/i.test(t));
  if (charteCarte) await allerCarte(ec, charteCarte.split('\n')[0]);
  const boutonCharte = await ec.locator('button', { hasText: 'Signatures :' }).first().innerText().catch(() => '');
  verifie('la charte compte la signature de Julie côté EC', /1 \/ 5/.test(boutonCharte), boutonCharte);

  // ----------------------------------------------------- RBE
  console.log('\n— Signalement du RBE');
  await collabVers(collab, 'Anomalies');
  await collab.locator('.segment', { hasText: 'RBE' }).first().click(); await pause(collab);
  const aSignaler = collab.locator('tbody tr', { has: collab.locator('button', { hasText: 'Signaler à l’expert-comptable' }) }).first();
  const dossierRbe = (await aSignaler.locator('td').nth(1).innerText()).trim();
  await aSignaler.locator('button', { hasText: 'Signaler' }).click(); await pause(collab);
  verifie('la ligne du collaborateur dit « signalé »',
    /Signalé le/.test(await collab.locator('tbody tr', { hasText: dossierRbe }).first().innerText()), dossierRbe);

  await collab.evaluate(() => dbSignalerRbe('nouveau:client-de-recette', 'julie', 'Client de recette'));
  await ec.reload(); await pause(ec, 800);
  await allerOnglet(ec, 'Préparer le contrôle');
  await allerRubrique(ec, 'LCB-FT');
  await allerCarte(ec, 'Registre RBE');
  const ligneEc = await ec.locator('.tableau-moderne tbody tr', { hasText: dossierRbe }).first().innerText();
  verifie('le suivi RBE de l’EC montre qui a signalé', /Signalé par Julie Bernard/.test(ligneEc), ligneEc.replace(/\n/g, ' · '));
  const nouveau = ec.locator('.rbe-demandes li', { hasText: 'Client de recette' }).first();
  verifie('la demande pour un nouveau client est visible', await nouveau.count() === 1);
  await nouveau.locator('button', { hasText: 'Noter consulté' }).click(); await pause(ec);
  await collab.reload(); await pause(collab, 800);
  const traite = await collab.evaluate(() => (dbSignalementRbe('nouveau:client-de-recette') || {}).traiteLe || null);
  verifie('le collaborateur reçoit la réponse', !!traite, traite || '');

  // ----------------------------------------------------- Formation ajoutée
  console.log('\n— Formation ajoutée par le collaborateur');
  await collabVers(collab, 'Mes obligations');
  await collab.locator('button', { hasText: 'Ajouter une formation' }).click(); await pause(collab);
  const panneau = collab.locator('.panneau');
  await panneau.locator('input').nth(0).fill('Loi de finances — formation de recette');
  await panneau.locator('input').nth(1).fill('Organisme de recette');
  await panneau.locator('input[type="date"]').fill('2026-10-02');
  await panneau.locator('input[type="number"]').fill('7');
  await panneau.locator('select').selectOption('fiscal');
  const fichier = path.join(os.tmpdir(), 'attestation-recette.pdf');
  fs.writeFileSync(fichier, '%PDF-1.4 recette');
  await panneau.locator('input[type="file"]').setInputFiles(fichier);
  const telechargement = collab.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await panneau.locator('button', { hasText: 'Ajouter' }).last().click();
  await telechargement; await pause(collab, 600);
  fs.unlinkSync(fichier);
  const nouvelle = await ligne(collab, 'Loi de finances — formation de recette').innerText().catch(() => '');
  verifie('la formation apparaît, attestation reçue', /attestation reçue/.test(nouvelle) && /7 h/.test(nouvelle), nouvelle.replace(/\n/g, ' · '));

  await ec.reload(); await pause(ec, 800);
  await allerOnglet(ec, 'Préparer le contrôle');
  await allerRubrique(ec, 'Formations');
  const registre = await ec.locator('.tableau-moderne tbody tr', { hasText: 'Loi de finances — formation de recette' }).first().innerText().catch(() => '');
  verifie('l’EC la voit au registre, ajoutée par Julie', /Ajoutée par Julie Bernard/.test(registre) && /1 \/ 1/.test(registre), registre.replace(/\n/g, ' · '));
  const ko = await ec.evaluate(() => formationsNonAJour().map(f => f.collaborateur));
  verifie('elle ne fausse pas le suivi des sessions du cabinet', ko.length > 1, ko.join(', '));

  verifie('aucune erreur console', erreurs.length === 0, erreurs.join(' / '));
  await navigateur.close();
  console.log(echecs ? `\n${echecs} échec(s) sur l’aller-retour.` : '\nTout ce que fait l’un arrive chez l’autre.');
  process.exit(echecs ? 1 : 0);
})();
