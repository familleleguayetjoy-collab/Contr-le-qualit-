/* Recette « reel » — le cabinet en données réelles, à plusieurs postes.
 *
 * Deux onglets, deux postes : l'expert-comptable (u-ec) et une
 * collaboratrice (u-lucie), sur le même faux serveur (tests/faux_supabase.js),
 * qui applique les mêmes règles que supabase/schema_005_etat_partage.sql.
 *
 * Ce qu'elle vérifie :
 *   — aucun nom de la démonstration n'apparaît, sur aucun écran ;
 *   — rien du cabinet n'est écrit dans le navigateur ;
 *   — l'import des clients produit les anomalies, datées et versionnées ;
 *   — ce que fait l'un arrive chez l'autre (campagne, signature) ;
 *   — deux écritures simultanées dans la même famille se cumulent ;
 *   — une écriture hors droits est refusée et dite ;
 *   — une coupure réseau est dite, et rattrapée au retour ;
 *   — « sans objet » est compté comme faux positif ; l'état de départ se fige.
 *
 * Préalable : un serveur sur le port 8811 et node tests/harnais.js.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

let echecs = 0;
function verifie(libelle, condition, detail) {
  if (!condition) echecs++;
  console.log(`  ${condition ? 'ok   ' : 'ÉCHEC'}  ${libelle.padEnd(62)} ${detail === undefined ? '' : detail}`);
}

const DEMO = ['Martin Dupont', 'Julie Bernard', 'Nathalie Petit', 'Heddy', 'Thomas Durand', 'Lucas Morel',
  'NOVA', 'SCI DURAND', 'Dupont', 'ACME', 'OVHcloud', 'Atlantique', 'Nordic', 'Riviera', 'LUMIÈRE',
  'Sophie Renard', '14-0001234', 'MMA IARD', 'Cabinet Martin'];

async function ouvrir(contexte, harnais, erreurs) {
  const page = await contexte.newPage();
  page.on('pageerror', e => erreurs.push(harnais + ' PAGEERROR: ' + e.message.split('\n')[0]));
  page.on('console', m => { if (m.type() === 'error') erreurs.push(harnais + ' CONSOLE: ' + m.text().slice(0, 160)); });
  // L'annuaire public n'est pas joignable en recette : la réponse est simulée.
  await page.route('https://recherche-entreprises.api.gouv.fr/**', r => r.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }),
  }));
  await page.goto('http://localhost:8811/' + harnais);
  await page.waitForFunction(() => window.CABINET_PRET, null, { timeout: 15000 });
  await page.waitForTimeout(500);
  return page;
}

const attendre = (page, ms) => page.waitForTimeout(ms || 600);
async function synchroniser(...pages) {
  for (const p of pages) await p.evaluate(() => partageReleve());
  for (const p of pages) await attendre(p, 400);
}

async function balayer(page) {
  const trouves = new Set();
  const items = await page.locator('.nav-item').allInnerTexts();
  for (const it of items) {
    const nom = it.split('\n')[0].trim();
    await page.locator('.nav-item', { hasText: nom }).first().click(); await attendre(page, 300);
    const sous = await page.locator('.nav-sous-item').allInnerTexts();
    for (const s of [''].concat(sous)) {
      if (s) { await page.locator('.nav-sous-item', { hasText: s }).first().click().catch(() => {}); await attendre(page, 300); }
      const texte = await page.evaluate(() => document.body.innerText);
      DEMO.forEach(d => { if (texte.indexOf(d) >= 0) trouves.add(`${d} (${nom}${s ? ' › ' + s : ''})`); });
      const cartes = await page.locator('.hub-carte').count();
      for (let i = 0; i < cartes; i++) {
        await page.locator('.hub-carte').nth(i).click().catch(() => {}); await attendre(page, 300);
        const t2 = await page.evaluate(() => document.body.innerText);
        DEMO.forEach(d => { if (t2.indexOf(d) >= 0) trouves.add(`${d} (${nom} › ${s} › carte ${i + 1})`); });
        if (await page.locator('.retour-hub').count()) { await page.locator('.retour-hub').first().click().catch(() => {}); await attendre(page, 250); }
        else if (s) { await page.locator('.nav-sous-item', { hasText: s }).first().click().catch(() => {}); await attendre(page, 250); }
      }
    }
  }
  return [...trouves];
}

(async () => {
  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR', acceptDownloads: true });
  const erreurs = [];

  // Base vierge.
  const amorce = await contexte.newPage();
  await amorce.goto('http://localhost:8811/_smoketest_reel_ec.html');
  await amorce.evaluate(() => { localStorage.clear(); });
  await amorce.close();

  const ec = await ouvrir(contexte, '_smoketest_reel_ec.html', erreurs);

  console.log('\n— Ouverture d’un cabinet vide');
  verifie('mode réel ouvert', await ec.evaluate(() => modeCabinetReel()));
  verifie('l’équipe vient des comptes', await ec.evaluate(() => COLLABORATEURS.map(c => c.nom).join(',')) === 'Lucie Garnier,Marc Olivier',
    await ec.evaluate(() => COLLABORATEURS.map(c => c.nom).join(',')));
  verifie('aucun dossier fictif', await ec.evaluate(() => CLIENTS.length) === 0);
  verifie('l’indicateur d’enregistrement est affiché', /enregistré/.test(await ec.locator('.indicateur-enregistrement').innerText()));

  console.log('\n— Import de la liste des clients');
  await ec.evaluate(() => dbImporterListeClients([
    { nom: 'SARL Les Oliviers', siren: '123456789', forme: '', collaborateur: 'Lucie Garnier' },
    { nom: 'SCI Belvédère', siren: '987654321', forme: 'SCI', collaborateur: 'Marc' },
    { nom: 'Jean Martin (IRPP)', siren: '', forme: 'Particulier', collaborateur: 'LG' },
    { nom: 'SAS Azur Conseil', siren: '552100554', forme: 'SAS', collaborateur: '' },
  ]));
  await attendre(ec, 2200);
  const clients = await ec.evaluate(() => CLIENTS.map(c => `${c.nom}|${c.forme}|${c.collaborateur}`));
  verifie('quatre dossiers importés', clients.length === 4, clients.join(' ; '));
  verifie('« Marc » et « LG » rapprochés des comptes',
    clients[1].endsWith('u-marc') && clients[2].endsWith('u-lucie'), clients.slice(1, 3).join(' ; '));
  verifie('la forme se lit dans la raison sociale', clients[0].indexOf('|SARL|') > 0, clients[0]);
  const anomalies = await ec.evaluate(() => anomaliesOuvertes().filter(a => a.dossier).length);
  verifie('les règles produisent des anomalies (4 LDM + 4 ID + 3 RBE + 4 notes)', anomalies === 15, anomalies + '');
  const detections = await ec.evaluate(() => Object.values(demoLireEtat().detections));
  verifie('chaque anomalie est datée et versionnée', detections.length >= 15 && detections.every(d => d.premiere && d.version === '1.0'),
    detections.length + ' détections');
  verifie('le particulier n’a pas d’anomalie RBE', !(await ec.evaluate(() => anomaliesOuvertes().some(a => a.type === 'rbe_justificatif_absent' && /Jean Martin/.test(a.dossierInfo.nom)))));
  verifie('rien du cabinet n’est écrit dans le navigateur', await ec.evaluate(() => localStorage.getItem('complyec.demo')) === null);
  const serveur = await ec.evaluate(() => Object.keys(FauxServeur.lire().etat).sort().join(','));
  verifie('le serveur a reçu clients, journal et détections', /clients/.test(serveur) && /detections/.test(serveur) && /journal/.test(serveur), serveur);

  console.log('\n— Aucun nom de la démonstration, sur aucun écran');
  const restes = await balayer(ec);
  verifie('aucun nom fictif affiché', restes.length === 0, restes.slice(0, 8).join(' | '));

  console.log('\n— Deux postes');
  const collab = await ouvrir(contexte, '_smoketest_reel_collab.html', erreurs);
  verifie('la collaboratrice voit le portefeuille importé', await collab.evaluate(() => CLIENTS.length) === 4);
  const sesLettres = await collab.evaluate(() => anomaliesDuCollab('lettres', 'u-lucie').map(a => a.dossierInfo.nom));
  verifie('elle voit ses deux dossiers à régulariser', sesLettres.length === 2, sesLettres.join(', '));

  await ec.evaluate(() => dbGenererAttestations(anneeEnCours()));
  await attendre(ec, 1200); await synchroniser(collab);
  const aSigner = await collab.evaluate(() => (dbDeclarations(anneeEnCours()).find(d => d.collaborateur === 'u-lucie') || {}).statut);
  verifie('la campagne de l’EC arrive chez elle', aSigner === 'en_attente', String(aSigner));
  await collab.evaluate(() => dbSignerDeclaration(anneeEnCours(), 'u-lucie', { empreinte: 'abc' }));
  await attendre(collab, 1200); await synchroniser(ec);
  const signee = await ec.evaluate(() => (dbDeclarations(anneeEnCours()).find(d => d.collaborateur === 'u-lucie') || {}).statut);
  verifie('sa signature arrive chez l’EC', signee === 'signee', String(signee));

  console.log('\n— Écritures simultanées');
  await Promise.all([
    ec.evaluate(() => dbJournaliser('Essai simultané', 'poste EC', null)),
    collab.evaluate(() => dbJournaliser('Essai simultané', 'poste collaboratrice', null)),
  ]);
  await attendre(ec, 2500); await synchroniser(ec, collab); await attendre(ec, 1500);
  const journal = await ec.evaluate(() => (FauxServeur.lire().etat.journal.valeur || []).filter(j => j.action === 'Essai simultané').map(j => j.element).sort().join(','));
  verifie('les deux écritures sont en base, aucune n’écrase l’autre', journal === 'poste EC,poste collaboratrice', journal);
  const idem = await ec.evaluate(() => JSON.stringify(demoLireEtat().journal) === JSON.stringify(FauxServeur.lire().etat.journal.valeur));
  verifie('le poste EC voit exactement ce qui est en base', idem);

  console.log('\n— Droits');
  const avant = await collab.evaluate(() => JSON.stringify((FauxServeur.lire().etat.reglages || {}).valeur || null));
  await collab.evaluate(() => dbMajReglage('seuilDependance', 99));
  await attendre(collab, 800);
  const apres = await collab.evaluate(() => JSON.stringify((FauxServeur.lire().etat.reglages || {}).valeur || null));
  verifie('un réglage modifié par un collaborateur n’est pas enregistré', avant === apres, apres);
  verifie('et l’écran le dit', /Non enregistré/.test(await collab.locator('.indicateur-enregistrement').innerText()),
    await collab.locator('.indicateur-enregistrement').innerText());
  verifie('la valeur locale est revenue', await collab.evaluate(() => dbReglages().seuilDependance) !== 99);

  console.log('\n— Coupure réseau');
  await ec.evaluate(() => { window.FAUX_HORS_LIGNE = true; });
  await ec.evaluate(() => dbMarquerRegularise('identite_absente|c-123456789', 'essai hors ligne', 'pointage'));
  await attendre(ec, 1200);
  const etatCoupure = await ec.locator('.indicateur-enregistrement').innerText();
  verifie('la coupure est dite : « pas encore enregistré »', /Pas encore enregistré/.test(etatCoupure), etatCoupure.replace(/\n/g, ' '));
  verifie('un bandeau dit quoi faire', await ec.locator('.bandeau-enregistrement').count() === 1);
  await ec.evaluate(() => { window.FAUX_HORS_LIGNE = false; partagePlanifier(0); });
  await attendre(ec, 1500);
  verifie('au retour, la régularisation est en base',
    await ec.evaluate(() => !!((FauxServeur.lire().etat.regularisations || {}).valeur || {})['identite_absente|c-123456789']));
  verifie('et l’indicateur revient à « tout est enregistré »', /Tout est enregistré/.test(await ec.locator('.indicateur-enregistrement').innerText()));

  console.log('\n— Pilote');
  await ec.evaluate(() => dbMarquerRegularise('lettre_mission_absente|c-552100554', 'essai', 'sans_objet', 'Aucune mission en cours pour ce client'));
  await attendre(ec, 1200);
  const m = await ec.evaluate(() => mesuresPilote().regles.find(r => r.regle === 'R1'));
  verifie('un « sans objet » compte comme faux positif', m.fauxPositifs === 1 && m.regularisees === 1, JSON.stringify(m.parNature));
  await ec.evaluate(() => figerEtatDepart());
  await attendre(ec, 1200);
  const t0 = await ec.evaluate(() => (FauxServeur.lire().etat.pilote || {}).valeur || {});
  verifie('l’état de départ est figé en base', !!(t0.etatDepart && t0.etatDepart.version === '1.0'), t0.etatDepart ? t0.etatDepart.le : 'absent');

  verifie('aucune erreur console', erreurs.length === 0, erreurs.slice(0, 4).join(' / '));
  await navigateur.close();
  console.log(echecs ? `\n${echecs} échec(s) sur le mode réel.` : '\nLe cabinet réel tient à plusieurs postes.');
  process.exit(echecs ? 1 : 0);
})();
