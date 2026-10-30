/* Écrit les deux harnais de test à la racine du dépôt.
 *
 * Les tests ne peuvent pas passer par l'écran de connexion : il faudrait un
 * Supabase joignable. Ces deux pages chargent donc l'application avec un
 * mandataire à la place du client Supabase, et rendent directement l'espace
 * voulu. Elles ne servent qu'aux tests, ne sont jamais versionnées (.gitignore)
 * et n'entrent pas dans le fichier autonome.
 *
 * Usage : node tests/harnais.js   puis   python3 -m http.server 8811
 */
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');

function harnais(profil, reel) {
  /* En mode réel, le client Supabase est le faux serveur partagé
     (tests/faux_supabase.js) et l'application s'ouvre comme après une
     connexion : chargement du cabinet, puis rendu. */
  const client = reel
    ? `<script>window.FAUX_UTILISATEUR = ${JSON.stringify(reel)};</script>\n<script src="tests/faux_supabase.js"></script>`
    : `<script>
// Mandataire enchaînable : toute méthode du client Supabase renvoie un objet
// du même genre, pour que db.js s'exécute sans réseau ni compte.
function mkProxy(){const f=function(){return mkProxy();};return new Proxy(f,{get(t,p){if(p==='then')return undefined;if(p===Symbol.toPrimitive)return()=>'';return mkProxy();},apply(){return mkProxy();}});}
window.supabaseClient=mkProxy();window.SUPABASE_URL='';window.SUPABASE_ANON_KEY='';
</script>`;
  const rendu = reel
    ? `const profil = FauxServeur.profil(${JSON.stringify(reel)});
ouvrirCabinetReel(profil, FauxServeur.cabinet()).then(() => {
  window.CABINET_PRET = true;
  ReactDOM.createRoot(document.getElementById('root')).render(h(App, { authProfile: profil, onSignOut: () => {} }));
});`
    : `ReactDOM.createRoot(document.getElementById('root')).render(
  h(App, { authProfile: ${JSON.stringify(profil)}, onSignOut: () => {} })
);`;
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ComplyEC — harnais de test</title><link rel="stylesheet" href="styles.css"></head><body>
<div id="root"></div>
<script src="vendor/js/react.production.min.js"></script>
<script src="vendor/js/react-dom.production.min.js"></script>
<script src="vendor/js/xlsx.mini.min.js"></script>
${client}
<script src="docx.js"></script>
<script src="pdf.js"></script>
<script src="data.js"></script>
<script src="db.js"></script>
<script src="partage.js"></script>
<script src="anomalies.js"></script>
<script src="semences.js"></script>
<script src="regles.js"></script>
<script src="synthese.js"></script>
<script src="utils.js"></script>
<script src="patrons.js"></script>
<script src="wizard.js"></script>
<script src="documents.js"></script>
<script src="organisation.js"></script>
<script src="lbcft.js"></script>
<script src="qualite.js"></script>
<script src="manuel.js"></script>
<script src="accueil.js"></script>
<script src="anomalies_ui.js"></script>
<script src="controle.js"></script>
<script src="parametres.js"></script>
<script src="pilote.js"></script>
<script src="ec.js"></script>
<script src="collab.js"></script>
<script src="app.js"></script>
<script>
${rendu}
</script>
</body></html>
`;
}

const pages = {
  '_smoketest_ec.html': [{ prenom: 'Marc', nom: 'Dubois', role: 'expert_comptable' }],
  '_smoketest_collab.html': [{ prenom: 'Julie', nom: 'Bernard', role: 'collaborateur' }],
  // Mode cabinet réel : deux postes sur le même faux serveur.
  '_smoketest_reel_ec.html': [null, 'u-ec'],
  '_smoketest_reel_collab.html': [null, 'u-lucie'],
};

for (const [nom, [profil, reel]] of Object.entries(pages)) {
  fs.writeFileSync(path.join(RACINE, nom), harnais(profil, reel), 'utf8');
  console.log('écrit :', nom);
}
