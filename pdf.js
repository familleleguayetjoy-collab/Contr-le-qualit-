/* ComplyEC — production de PDF
   ============================

   Pourquoi écrire un générateur plutôt qu'embarquer une bibliothèque.

   Le cabinet a besoin d'un seul type de PDF : un document de texte, en A4, à
   faire signer. Les bibliothèques qui font cela pèsent plusieurs centaines de
   kilo-octets une fois vendorisées, alors que le format PDF, pour du texte sur
   une police standard, tient en deux pages de code. Le fichier autonome
   `ComplyEC.html` embarque tout ce qu'il charge : chaque kilo-octet compte.

   Ce que ce fichier sait faire, et rien de plus : du texte en Helvetica, en
   trois graisses, aligné à gauche ou centré, avec un retour à la ligne calculé
   sur la largeur réelle des caractères, sur autant de pages A4 que nécessaire.

   Ce qu'il ne sait pas faire, et qu'il ne faut pas lui demander : images,
   tableaux, polices embarquées, couleurs de fond. Le jour où l'un de ces
   besoins apparaîtra, c'est une bibliothèque qu'il faudra, pas une rallonge.

   Deux précautions valent d'être dites.

   La première : les quatorze polices dites standard d'un lecteur PDF
   s'encodent en WinAnsi, qui n'est pas de l'UTF-8. L'apostrophe courbe, les
   guillemets français et le tiret cadratin y ont chacun leur octet. La table
   ci-dessous les convertit ; un caractère inconnu devient un point
   d'interrogation plutôt qu'un octet parasite qui casserait le fichier.

   La seconde : la table des références croisées d'un PDF est une liste de
   positions en octets. Le fichier est donc construit comme une chaîne dont
   chaque caractère vaut un octet — d'où la conversion WinAnsi avant tout
   assemblage, et jamais après. */

'use strict';

/* Les caractères que le français impose et que le Latin-1 ne place pas au même
   endroit que WinAnsi. Le reste passe par son code Unicode, qui coïncide avec
   WinAnsi en deçà de 256. */
const PDF_WINANSI = {
  0x20AC: 0x80, // €
  0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, // ‚ ƒ „ …
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, // † ‡ ˆ ‰
  0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, // Š ‹ Œ Ž
  0x2018: 0x91, 0x2019: 0x92, // ‘ ’
  0x201C: 0x93, 0x201D: 0x94, // “ ”
  0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, // • – —
  0x02DC: 0x98, 0x2122: 0x99, // ˜ ™
  0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F, // š › œ ž Ÿ
};

function pdfOctetsDuTexte(texte) {
  let sortie = '';
  for (const caractere of String(texte)) {
    const code = caractere.codePointAt(0);
    let octet;
    if (code < 0x100) octet = code;
    else if (PDF_WINANSI[code] !== undefined) octet = PDF_WINANSI[code];
    else octet = 0x3F; // « ? » : visible, et sans danger pour le fichier
    sortie += String.fromCharCode(octet);
  }
  return sortie;
}

/* Une chaîne littérale PDF est délimitée par des parenthèses : les trois
   caractères qui les concernent s'échappent. */
function pdfChaine(texte) {
  return pdfOctetsDuTexte(texte).replace(/[\\()]/g, m => '\\' + m);
}

const PDF_POLICES = {
  normal: { ressource: 'F1', base: 'Helvetica', css: '' },
  gras: { ressource: 'F2', base: 'Helvetica-Bold', css: 'bold ' },
  italique: { ressource: 'F3', base: 'Helvetica-Oblique', css: 'italic ' },
};

/* Largeur réelle d'un texte, mesurée par le navigateur.

   Helvetica et Arial partagent leurs largeurs : ce que mesure le navigateur
   avec la pile « Helvetica, Arial » correspond à ce que le lecteur PDF fera de
   la police standard du même nom. Une table de largeurs recopiée à la main
   serait plus fragile, et invérifiable.

   Si le navigateur ne donne pas de canevas — cas d'un environnement de test —
   on retombe sur une estimation prudente, qui coupe un peu trop tôt plutôt que
   de laisser un mot déborder de la marge. */
let pdfCanevas = null;
function pdfLargeur(texte, style, taille) {
  const police = PDF_POLICES[style] || PDF_POLICES.normal;
  try {
    if (!pdfCanevas) pdfCanevas = document.createElement('canvas').getContext('2d');
    if (pdfCanevas) {
      pdfCanevas.font = `${police.css}${taille}px Helvetica, Arial, sans-serif`;
      return pdfCanevas.measureText(texte).width;
    }
  } catch (err) { /* pas de canevas : estimation ci-dessous */ }
  return String(texte).length * taille * 0.52;
}

/* Découpe un paragraphe en lignes qui tiennent dans la largeur donnée. Un mot
   plus long que la ligne entière n'est pas coupé : il déborderait plutôt que
   de devenir illisible, et le cas ne se présente pas sur ces documents. */
function pdfDecouper(texte, style, taille, largeur) {
  const mots = String(texte).split(/\s+/).filter(Boolean);
  if (!mots.length) return [''];
  const lignes = [];
  let courante = mots[0];
  for (let i = 1; i < mots.length; i++) {
    const essai = courante + ' ' + mots[i];
    if (pdfLargeur(essai, style, taille) <= largeur) courante = essai;
    else { lignes.push(courante); courante = mots[i]; }
  }
  lignes.push(courante);
  return lignes;
}

/* A4 en points typographiques, et des marges de deux centimètres. */
const PDF_PAGE = { largeur: 595.28, hauteur: 841.89, marge: 56.7 };

/* Construit le document.

   `blocs` est une liste d'objets :
     { texte, style, taille, interligne, avant, apres, centre }
   Un bloc sans texte est un espace vertical — c'est ainsi qu'on aère sans
   inventer une syntaxe de mise en page.

   Renvoie un Blob de type application/pdf. */
function genererPdf(blocs, options) {
  const opt = options || {};
  const largeurUtile = PDF_PAGE.largeur - 2 * PDF_PAGE.marge;

  /* Première passe : transformer les blocs en lignes placées, en changeant de
     page dès que le bas de la marge est atteint. */
  const pages = [];
  let lignes = [];
  let y = PDF_PAGE.hauteur - PDF_PAGE.marge;

  function nouvellePage() {
    pages.push(lignes);
    lignes = [];
    y = PDF_PAGE.hauteur - PDF_PAGE.marge;
  }

  for (const bloc of blocs) {
    const taille = bloc.taille || 10.5;
    const style = bloc.style || 'normal';
    const interligne = bloc.interligne || taille * 1.42;
    y -= bloc.avant || 0;

    const morceaux = bloc.texte
      ? pdfDecouper(bloc.texte, style, taille, largeurUtile - (bloc.retrait || 0))
      : [];

    for (const morceau of morceaux) {
      if (y - interligne < PDF_PAGE.marge) nouvellePage();
      y -= interligne;
      const x = bloc.centre
        ? (PDF_PAGE.largeur - pdfLargeur(morceau, style, taille)) / 2
        : PDF_PAGE.marge + (bloc.retrait || 0);
      lignes.push({ x, y, texte: morceau, style, taille });
    }
    y -= bloc.apres || 0;
  }
  pages.push(lignes);

  /* Deuxième passe : écrire les objets. Les numéros sont attribués dans
     l'ordre d'écriture, et la table des références croisées relève la position
     de chacun. */
  const objets = [];
  function ajouter(corps) {
    objets.push(corps);
    return objets.length; // les numéros d'objet commencent à 1
  }

  const nombrePages = pages.length;
  const numeroCatalogue = 1;
  const numeroPages = 2;
  // Les objets 1 et 2 sont réservés : on les écrira une fois les pages connues.
  objets.push(null, null);

  const numerosPolices = {};
  for (const cle of Object.keys(PDF_POLICES)) {
    numerosPolices[cle] = ajouter(
      `<< /Type /Font /Subtype /Type1 /BaseFont /${PDF_POLICES[cle].base} /Encoding /WinAnsiEncoding >>`,
    );
  }

  const numerosPages = [];
  for (const page of pages) {
    let flux = 'BT\n';
    let dernierStyle = null;
    let derniereTaille = null;
    for (const ligne of page) {
      if (ligne.style !== dernierStyle || ligne.taille !== derniereTaille) {
        flux += `/${PDF_POLICES[ligne.style].ressource} ${ligne.taille} Tf\n`;
        dernierStyle = ligne.style;
        derniereTaille = ligne.taille;
      }
      flux += `1 0 0 1 ${ligne.x.toFixed(2)} ${ligne.y.toFixed(2)} Tm (${pdfChaine(ligne.texte)}) Tj\n`;
    }
    flux += 'ET';

    const numeroFlux = ajouter(`<< /Length ${flux.length} >>\nstream\n${flux}\nendstream`);
    const ressources = '<< /Font << '
      + Object.keys(PDF_POLICES).map(c => `/${PDF_POLICES[c].ressource} ${numerosPolices[c]} 0 R`).join(' ')
      + ' >> >>';
    numerosPages.push(ajouter(
      `<< /Type /Page /Parent ${numeroPages} 0 R /MediaBox [0 0 ${PDF_PAGE.largeur} ${PDF_PAGE.hauteur}]`
      + ` /Resources ${ressources} /Contents ${numeroFlux} 0 R >>`,
    ));
  }

  objets[numeroCatalogue - 1] = `<< /Type /Catalog /Pages ${numeroPages} 0 R >>`;
  objets[numeroPages - 1] = `<< /Type /Pages /Count ${nombrePages} /Kids [`
    + numerosPages.map(n => `${n} 0 R`).join(' ') + '] >>';

  const numeroInfo = ajouter(
    `<< /Title (${pdfChaine(opt.titre || 'Document')}) /Producer (ComplyEC) >>`,
  );

  /* Assemblage. Chaque caractère de `fichier` vaut un octet : c'est ce qui
     rend les positions de la table exactes. */
  let fichier = '%PDF-1.4\n';
  const positions = [];
  objets.forEach((corps, i) => {
    positions.push(fichier.length);
    fichier += `${i + 1} 0 obj\n${corps}\nendobj\n`;
  });

  const positionTable = fichier.length;
  fichier += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
  for (const position of positions) {
    fichier += String(position).padStart(10, '0') + ' 00000 n \n';
  }
  fichier += `trailer\n<< /Size ${objets.length + 1} /Root ${numeroCatalogue} 0 R /Info ${numeroInfo} 0 R >>\n`
    + `startxref\n${positionTable}\n%%EOF\n`;

  const octets = new Uint8Array(fichier.length);
  for (let i = 0; i < fichier.length; i++) octets[i] = fichier.charCodeAt(i) & 0xFF;
  return new Blob([octets], { type: 'application/pdf' });
}
