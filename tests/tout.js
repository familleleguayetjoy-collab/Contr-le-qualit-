/* Lance toutes les recettes, l'une après l'autre.
 *
 * Préalable : un serveur sur le port 8811. Le harnais est régénéré ici, et
 * supprimé à la fin — il n'est jamais versionné ni inclus dans le bundle.
 *
 * Usage : python3 -m http.server 8811 &  puis  node tests/tout.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');

/* Dans l'ordre où l'on veut lire les résultats : d'abord ce qui tient l'écran,
   puis ce qui tient les données, puis les espaces qui ne devaient pas bouger. */
const RECETTES = [
  ['patrons', 'les six patrons d’écran, aux trois largeurs'],
  ['navigation', 'cinq onglets, treize rubriques, rien de rogné'],
  ['anomalies', 'six familles, et une relance par personne'],
  ['controle', 'les huit rubriques et leurs règles propres'],
  ['parametres', 'cinq rubriques, et la source unique des données'],
  ['ecritures', 'tout ce qui prétend enregistrer enregistre vraiment'],
  ['vigilance', 'les écrans LCB-FT du cabinet, intacts'],
  ['mobile', 'tout tient à 390 px'],
  ['collaborateur', 'l’espace collaborateur, inchangé'],
  ['parcours_entree_en_mission', 'le parcours gelé, inchangé'],
];

execFileSync('node', [path.join(__dirname, 'harnais.js')], { cwd: RACINE, stdio: 'ignore' });

const echecs = [];
for (const [nom, resume] of RECETTES) {
  process.stdout.write(`\n══ ${nom} — ${resume}\n`);
  try {
    execFileSync('node', [path.join(__dirname, nom + '.js')], { cwd: RACINE, stdio: 'inherit' });
  } catch (e) {
    echecs.push(nom);
  }
}

// Le harnais ne doit jamais survivre à la recette : il contournerait
// l'authentification si on l'oubliait à la racine.
['_smoketest_ec.html', '_smoketest_collab.html'].forEach(f => {
  const p = path.join(RACINE, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

console.log(echecs.length
  ? `\n\n${echecs.length} recette(s) en échec : ${echecs.join(', ')}`
  : `\n\nLes ${RECETTES.length} recettes sont vertes.`);
process.exit(echecs.length ? 1 : 0);
