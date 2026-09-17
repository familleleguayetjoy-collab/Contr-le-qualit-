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

    /* L'accueil porte quatre titres et une phrase d'accueil, et rien d'autre.
       La phrase a été demandée après la première refonte ; le reste de la règle
       tient toujours : pas de badge, pas de compteur, pas de tableau de bord. */
    const accueil = await page.evaluate(() => ({
      carres: [...document.querySelectorAll('.page-accueil .hub-carte')].map(e => e.innerText.trim()),
      titre: (document.querySelector('.page-accueil .scene-titre') || {}).innerText || '',
      sousTitre: (document.querySelector('.page-accueil .scene-sous-titre') || {}).innerText || '',
      autres: document.querySelectorAll(
        '.page-accueil h1:not(.scene-titre), .page-accueil p:not(.scene-sous-titre), .page-accueil .badge'
      ).length,
      /* Les quatre cartes d'une même rangée doivent être alignées au pixel :
         un titre sur deux lignes ne doit pas décaler son icône. */
      icones: [...document.querySelectorAll('.page-accueil .hub-carte-icone')]
        .map(e => Math.round(e.getBoundingClientRect().top)),
    }));
    verifie('quatre carrés sur l’accueil', accueil.carres.length === 4, accueil.carres.join(' | '));
    verifie('l’accueil souhaite la bienvenue',
      accueil.titre.trim() === 'Bienvenue dans ComplyEC', accueil.titre);
    verifie('une seule phrase sous le titre',
      accueil.sousTitre.trim().length > 0, accueil.sousTitre);
    verifie('aucun texte en plus sur l’accueil', accueil.autres === 0, accueil.autres + ' élément(s)');
    verifie('aucun chiffre sur l’accueil',
      !accueil.carres.some(t => /\d/.test(t)), accueil.carres.join(' | '));
    verifie('les cartes d’une rangée sont alignées',
      accueil.icones[0] === accueil.icones[1] && accueil.icones[2] === accueil.icones[3],
      accueil.icones.join(' / '));

    /* Chaque catégorie de la barre porte sa pastille de couleur, et les cinq
       couleurs sont différentes : une pastille qui reprendrait la teinte de sa
       voisine ne servirait à rien. */
    const pastilles = await page.evaluate(() =>
      [...document.querySelectorAll('.sidebar-ec .nav-cat .nav-pastille')]
        .map(e => getComputedStyle(e).color));
    verifie('cinq pastilles de couleur dans la barre', pastilles.length === 5, pastilles.length + '');
    verifie('les cinq teintes sont distinctes',
      new Set(pastilles).size === 5, pastilles.join(' | '));

    for (const o of ONGLETS) {
      await allerOnglet(page, o);
      const actif = await page.locator('.nav-item.active .nav-label').innerText();
      verifie(`l’entrée « ${o} » s’ouvre et reste allumée`, actif === o, 'allumé : ' + actif);
      const coupes = await rognages(page);
      verifie(`« ${o} » ne rogne rien`, coupes.length === 0, coupes.join(', '));
    }

    /* Les écrans à grands carrés ont tous le même cadre : même largeur, même
       hauteur, centré. Mesuré, pas supposé. */
    await allerOnglet(page, 'Accueil');
    const cadreAccueil = await page.evaluate(() => {
      const r = document.querySelector('.page-accueil .scene').getBoundingClientRect();
      return { l: Math.round(r.width), h: Math.round(r.height) };
    });
    await allerOnglet(page, 'Entrée en mission');
    const cadreEntree = await page.evaluate(() => {
      const r = document.querySelector('.page-entree .scene').getBoundingClientRect();
      return { l: Math.round(r.width), h: Math.round(r.height) };
    });
    verifie('l’accueil et l’entrée en mission ont le même cadre',
      cadreAccueil.l === cadreEntree.l && cadreAccueil.h === cadreEntree.h,
      `${cadreAccueil.l}×${cadreAccueil.h} contre ${cadreEntree.l}×${cadreEntree.h}`);

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
