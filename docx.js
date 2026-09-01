// ComplyEC — Lecture et écriture de fichiers .docx, sans dépendance
'use strict';

/* Un .docx est une archive ZIP contenant du XML. Pour remplir une lettre de
   mission, il faut donc : ouvrir l'archive, remplacer le texte des contrôles de
   contenu Word (<w:sdt>) par les réponses du cabinet, puis réécrire l'archive.

   Le navigateur sait déjà décompresser et recompresser en « deflate brut »
   (DecompressionStream / CompressionStream). On s'en sert plutôt que
   d'embarquer une bibliothèque ZIP : le fichier autonome reste léger et il n'y
   a pas de dépendance à tenir à jour. */

// ------------------------------------------------------------------ Lecture

function docxLireEntier(vue, pos) { return vue.getUint32(pos, true); }
function docxLireCourt(vue, pos) { return vue.getUint16(pos, true); }

/* Parcourt le catalogue de fin d'archive plutôt que les en-têtes locaux : c'est
   la seule table dont les tailles sont fiables quand le fichier a été produit
   en flux, ce que fait Word. */
async function docxOuvrir(buffer) {
  const octets = new Uint8Array(buffer);
  const vue = new DataView(buffer);

  let finCatalogue = -1;
  for (let i = octets.length - 22; i >= 0 && i > octets.length - 65558; i--) {
    if (vue.getUint32(i, true) === 0x06054b50) { finCatalogue = i; break; }
  }
  if (finCatalogue === -1) throw new Error("Ce fichier n'est pas une archive lisible.");

  const nbEntrees = docxLireCourt(vue, finCatalogue + 10);
  let pos = docxLireEntier(vue, finCatalogue + 16);

  const entrees = [];
  for (let i = 0; i < nbEntrees; i++) {
    if (vue.getUint32(pos, true) !== 0x02014b50) break;
    const methode = docxLireCourt(vue, pos + 10);
    const tailleCompressee = docxLireEntier(vue, pos + 20);
    const tailleReelle = docxLireEntier(vue, pos + 24);
    const lgNom = docxLireCourt(vue, pos + 28);
    const lgExtra = docxLireCourt(vue, pos + 30);
    const lgCommentaire = docxLireCourt(vue, pos + 32);
    const decalageLocal = docxLireEntier(vue, pos + 42);
    const nom = new TextDecoder().decode(octets.subarray(pos + 46, pos + 46 + lgNom));
    entrees.push({ nom, methode, tailleCompressee, tailleReelle, decalageLocal });
    pos += 46 + lgNom + lgExtra + lgCommentaire;
  }

  const fichiers = new Map();
  for (const e of entrees) {
    const lgNomL = docxLireCourt(vue, e.decalageLocal + 26);
    const lgExtraL = docxLireCourt(vue, e.decalageLocal + 28);
    const debut = e.decalageLocal + 30 + lgNomL + lgExtraL;
    const brut = octets.subarray(debut, debut + e.tailleCompressee);
    let contenu;
    if (e.methode === 0) {
      contenu = brut.slice();
    } else if (e.methode === 8) {
      contenu = new Uint8Array(await new Response(
        new Blob([brut]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      ).arrayBuffer());
    } else {
      throw new Error(`Compression non gérée dans « ${e.nom} ».`);
    }
    fichiers.set(e.nom, contenu);
  }
  return fichiers;
}

// ----------------------------------------------------------------- Écriture

/* CRC-32, exigé par le format ZIP. Table calculée une fois. */
const DOCX_TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function docxCrc32(octets) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < octets.length; i++) c = DOCX_TABLE_CRC[(c ^ octets[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

async function docxEcrire(fichiers) {
  const encodeur = new TextEncoder();
  const morceaux = [];
  const catalogue = [];
  let decalage = 0;

  for (const [nom, contenu] of fichiers) {
    const nomOctets = encodeur.encode(nom);
    const compresse = new Uint8Array(await new Response(
      new Blob([contenu]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    ).arrayBuffer());
    const crc = docxCrc32(contenu);

    const entete = new Uint8Array(30 + nomOctets.length);
    const ve = new DataView(entete.buffer);
    ve.setUint32(0, 0x04034b50, true);
    ve.setUint16(4, 20, true);      // version minimale
    ve.setUint16(6, 0, true);       // indicateurs
    ve.setUint16(8, 8, true);       // deflate
    ve.setUint16(10, 0, true);      // heure
    ve.setUint16(12, 0x0021, true); // date (1er janvier 1980)
    ve.setUint32(14, crc, true);
    ve.setUint32(18, compresse.length, true);
    ve.setUint32(22, contenu.length, true);
    ve.setUint16(26, nomOctets.length, true);
    ve.setUint16(28, 0, true);
    entete.set(nomOctets, 30);

    morceaux.push(entete, compresse);
    catalogue.push({ nom: nomOctets, crc, tailleCompressee: compresse.length, tailleReelle: contenu.length, decalage });
    decalage += entete.length + compresse.length;
  }

  const debutCatalogue = decalage;
  let tailleCatalogue = 0;
  for (const c of catalogue) {
    const bloc = new Uint8Array(46 + c.nom.length);
    const vb = new DataView(bloc.buffer);
    vb.setUint32(0, 0x02014b50, true);
    vb.setUint16(4, 20, true);
    vb.setUint16(6, 20, true);
    vb.setUint16(8, 0, true);
    vb.setUint16(10, 8, true);
    vb.setUint16(12, 0, true);
    vb.setUint16(14, 0x0021, true);
    vb.setUint32(16, c.crc, true);
    vb.setUint32(20, c.tailleCompressee, true);
    vb.setUint32(24, c.tailleReelle, true);
    vb.setUint16(28, c.nom.length, true);
    vb.setUint32(42, c.decalage, true);
    bloc.set(c.nom, 46);
    morceaux.push(bloc);
    tailleCatalogue += bloc.length;
  }

  const fin = new Uint8Array(22);
  const vf = new DataView(fin.buffer);
  vf.setUint32(0, 0x06054b50, true);
  vf.setUint16(8, catalogue.length, true);
  vf.setUint16(10, catalogue.length, true);
  vf.setUint32(12, tailleCatalogue, true);
  vf.setUint32(16, debutCatalogue, true);
  morceaux.push(fin);

  return new Blob(morceaux, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

// -------------------------------------------------- Extraction du texte

/* Texte brut d'un document Word, un paragraphe par ligne. Sert à analyser une
   lettre existante dont on ne maîtrise pas la structure. */
function docxTexte(fichiers) {
  const doc = fichiers.get('word/document.xml');
  if (!doc) return '';
  const xml = new TextDecoder().decode(doc);
  return xml
    .replace(/<w:tab\s*\/>/g, ' ')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/\n{2,}/g, '\n');
}

async function docxLireTexte(fichier) {
  const fichiers = await docxOuvrir(await fichier.arrayBuffer());
  return docxTexte(fichiers);
}

// ------------------------------------------------ Remplissage de la lettre

function docxEchapper(texte) {
  return String(texte)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Remplace le contenu d'un contrôle Word par la valeur fournie.

   Un contrôle se présente ainsi :
     <w:sdt><w:sdtPr>…<w:alias w:val="Dénomination sociale"/>…</w:sdtPr>
            <w:sdtContent>…runs de texte…</w:sdtContent></w:sdt>

   On réécrit le premier run de `sdtContent` avec la valeur et on vide les
   suivants, ce qui préserve la mise en forme d'origine (police, taille, gras)
   portée par les propriétés du run. On retire aussi l'indicateur « texte
   d'invite » pour que Word n'affiche plus le libellé grisé. */
function docxRemplirControles(xml, valeurs) {
  let remplis = 0, vus = [];
  // Certains alias reviennent plusieurs fois dans la lettre avec des valeurs
  // différentes — « Montant mensuel HT » désigne l'honoraire comptable la
  // première fois et l'honoraire social la seconde. Une valeur donnée sous
  // forme de tableau alimente les occurrences dans l'ordre ; une valeur simple
  // alimente toutes les occurrences.
  const compteurs = Object.create(null);

  const sortie = xml.replace(/<w:sdt>[\s\S]*?<\/w:sdt>/g, bloc => {
    const alias = /<w:alias w:val="([^"]*)"/.exec(bloc);
    if (!alias) return bloc;
    const nom = alias[1];
    vus.push(nom);
    const rang = compteurs[nom] = (compteurs[nom] || 0) + 1;
    if (!Object.prototype.hasOwnProperty.call(valeurs, nom)) return bloc;
    const brut = valeurs[nom];
    const valeur = Array.isArray(brut)
      ? (brut[rang - 1] !== undefined ? brut[rang - 1] : brut[brut.length - 1])
      : brut;
    if (valeur === undefined || valeur === null || valeur === '') return bloc;

    const contenu = /<w:sdtContent>([\s\S]*?)<\/w:sdtContent>/.exec(bloc);
    if (!contenu) return bloc;

    let premier = true;
    const nouveauContenu = contenu[1].replace(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g, () => {
      if (premier) { premier = false; return `<w:t xml:space="preserve">${docxEchapper(valeur)}</w:t>`; }
      return '<w:t xml:space="preserve"></w:t>';
    });
    if (premier) return bloc; // aucun run de texte : on ne touche à rien

    remplis += 1;
    return bloc
      .replace(/<w:sdtContent>[\s\S]*?<\/w:sdtContent>/, `<w:sdtContent>${nouveauContenu}</w:sdtContent>`)
      .replace(/<w:showingPlcHdr\s*\/>/g, '');
  });

  return { xml: sortie, remplis, controles: vus };
}

/* Chaîne complète : ouvrir le modèle, remplir, télécharger. Renvoie le nombre
   de champs effectivement remplis et ceux restés vides, pour pouvoir le dire à
   l'utilisateur plutôt que de laisser croire que tout est complet. */
async function docxGenererLettre(fichierModele, valeurs, nomSortie) {
  const buffer = await fichierModele.arrayBuffer();
  const fichiers = await docxOuvrir(buffer);
  const doc = fichiers.get('word/document.xml');
  if (!doc) throw new Error("Ce fichier ne contient pas de document Word lisible.");

  const xml = new TextDecoder().decode(doc);
  const { xml: rempli, remplis, controles } = docxRemplirControles(xml, valeurs);
  fichiers.set('word/document.xml', new TextEncoder().encode(rempli));

  const blob = await docxEcrire(fichiers);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomSortie;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  const attendus = [...new Set(controles)];
  const manquants = attendus.filter(n => !valeurs[n]);
  return { remplis, attendus: attendus.length, manquants };
}
