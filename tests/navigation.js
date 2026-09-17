/* Recette « navigation » — la barre de gauche à cinq entrées.
 *
 * Ce qu'elle vérifie :
 *   — cinq entrées, dans l'ordre, l'accueil en premier ;
 *   — l'accueil ne porte que quatre titres, et rien d'autre ;
 *   — chaque entrée et chaque rubrique ouvre bien son écran ;
 *   — les adresses de l'arborescence précédente arrivent quelque part ;
 *   — rien n'est rogné, à aucune des deux largeurs de travail.
 *
 * Le rognage se mesure, il ne se déduit pas : la page a `overflow: hidden auto`,
 * un contenu qui dépasse de sept pixels est donc coupé sans qu'aucune barre de
 * défilement ne le signale.
 */
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const {
  ONGLETS, RUBRIQUES_CONTROLE, RUBRIQUES_PARAMETRES,
  allerOnglet, allerRubrique, ouvrirEc,
} = require('./aller');

let anomalies = 0;
function verifie(nom, condition, detail) {
  if (condition) console.log('  ok     ' + nom);
  else { anomalies++; console.log('  ÉCHEC  ' + nom + (detail ? ' — ' + detail : '')); }
}

/* Un contenu rogné par un cadre qui ne défile pas. */
async function rognages(page) {
  return page.evaluate(() => {
    const coupes = [];
    document.querySelectorAll('.page, .controle-contenu, .tableau-moderne-enveloppe').forEach(e => {
      const cs = getComputedStyle(e);
      const defile = /auto|scroll/.test(cs.overflowY);
      const depasse = e.scrollHeight - e.clientHeight;
      if (!defile && depasse > 2) {
        coupes.push(String(e.className).split(' ')[0] + ' : ' + depasse + 'px');
      }
    });
    return coupes;
  });
}

(async () => {
  const navigateur = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });

  for (const vp of [{ width: 1440, height: 900 }, { width: 1366, height: 768 }]) {
    console.log(`\n${vp.width} × ${vp.height}`);
    const page = await ouvrirEc(navigateur, vp);

    const onglets = await page.locator('.nav-item .nav-label').allInnerTexts();
    verifie('cinq entrées, dans l’ordre du cahier',
      JSON.stringify(onglets) === JSON.stringify(ONGLETS), onglets.join(' | '));
    verifie('l’accueil est la première entrée', onglets[0] === 'Accueil');
    const fond = await page.evaluate(() => getComputedStyle(document.querySelector('.sidebar')).backgroundImage);
    verifie('la barre garde le bleu de la maison', /gradient/.test(fond), fond.slice(0, 40));

    // L'accueil ne porte que quatre titres (§ 2).
    const accueil = await page.evaluate(() => ({
      carres: [...document.querySelectorAll('.page-accueil .hub-carte')].map(e => e.innerText.trim()),
      autres: document.querySelectorAll('.page-accueil h1, .page-accueil p, .page-accueil .badge').length,
      /* Les quatre cartes d'une même rangée doivent être alignées au pixel :
         un titre sur deux lignes ne doit pas décaler son icône. */
      icones: [...document.querySelectorAll('.page-accueil .hub-carte-icone')]
        .map(e => Math.round(e.getBoundingClientRect().top)),
    }));
    verifie('quatre carrés sur l’accueil', accueil.carres.length === 4, accueil.carres.join(' | '));
    verifie('aucun texte en plus sur l’accueil', accueil.autres === 0, accueil.autres + ' élément(s)');
    verifie('aucun chiffre sur l’accueil',
      !accueil.carres.some(t => /\d/.test(t)), accueil.carres.join(' | '));
    verifie('les cartes d’une rangée sont alignées',
      accueil.icones[0] === accueil.icones[1] && accueil.icones[2] === accueil.icones[3],
      accueil.icones.join(' / '));

    for (const o of ONGLETS) {
      await allerOnglet(page, o);
      const actif = await page.locator('.nav-item.active .nav-label').innerText();
      verifie(`l’entrée « ${o} » s’ouvre et reste allumée`, actif === o, 'allumé : ' + actif);
      const coupes = await rognages(page);
      verifie(`« ${o} » ne rogne rien`, coupes.length === 0, coupes.join(', '));
    }

    /* Les sous-catégories vivent dans la barre : la catégorie ouverte les
       déplie, et il n'y a plus de second menu latéral. */
    await allerOnglet(page, 'Préparer le contrôle');
    const sousControle = await page.locator('.nav-sous-item').allInnerTexts();
    verifie('les huit rubriques sont dans la barre',
      JSON.stringify(sousControle) === JSON.stringify(RUBRIQUES_CONTROLE), sousControle.join(' | '));
    verifie('aucun second menu latéral',
      await page.locator('.controle-menu').count() === 0);
    for (const r of RUBRIQUES_CONTROLE) {
      await allerRubrique(page, r);
      const titre = await page.locator('.rubrique-entete h1').first().innerText().catch(() => '');
      verifie(`rubrique « ${r} »`, titre === r, 'titre affiché : ' + titre);
      const coupes = await rognages(page);
      verifie(`« ${r} » ne rogne rien`, coupes.length === 0, coupes.join(', '));
    }

    await allerOnglet(page, 'Paramètres');
    for (const r of RUBRIQUES_PARAMETRES) {
      await allerRubrique(page, r);
      const titre = await page.locator('.rubrique-entete h1').first().innerText().catch(() => '');
      verifie(`paramètres « ${r} »`, titre === r, 'titre affiché : ' + titre);
    }

    // Les adresses de l'arborescence précédente doivent arriver quelque part.
    const anciennes = [
      ['overview', null], ['parcours', 'gouvernance'], ['vigilance', 'portefeuille'],
      ['qualite', 'surveillance'], ['documents-cabinet', null], ['manuel', 'publier'],
      ['ressources', 'formation'], ['cycle-client', 'supervision'], ['equipe', null],
      ['gouvernance', 'independance'], ['controle', 'pack'], ['bilan', null],
    ];
    const resolues = await page.evaluate(liste => liste.map(([s, ss]) => routeEc(s, ss)), anciennes);
    const perdues = resolues.filter(([s, ss]) => {
      if (!ONGLETS.some(() => true)) return true;
      return !['accueil', 'entree-mission', 'anomalies', 'controle', 'parametres'].includes(s);
    });
    verifie('les douze anciennes adresses arrivent dans la nouvelle arborescence',
      perdues.length === 0, JSON.stringify(perdues));

    verifie('aucune erreur console', page.__erreurs.length === 0, page.__erreurs.join(' / '));
    await page.close();
  }

  await navigateur.close();
  console.log(anomalies
    ? `\n${anomalies} anomalie(s) de navigation.`
    : '\nLa navigation tient : cinq entrées, treize rubriques, rien de rogné.');
  process.exit(anomalies ? 1 : 0);
})();
