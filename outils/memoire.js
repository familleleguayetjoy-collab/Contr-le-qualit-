/* Régénère les fichiers « automatiques » du dossier docs/memoire/.
 *
 * Ce qui se tire du logiciel ne se recopie pas à la main : une copie finit
 * toujours par diverger de l'original. Ce script lit le code et l'historique
 * du dépôt, et écrit :
 *
 *   referentiel.json   — les règles de contrôle telles qu'elles sont
 *                        appliquées (OUTIL 1), avec leur version ;
 *   fonctionnalites.json — les écrans des deux espaces, tels que la barre de
 *                        navigation les déclare (matière de l'OUTIL 2) ;
 *   recettes.json      — les recettes automatiques et ce que chacune vérifie
 *                        (critères de fonctionnement, OUTIL 3) ;
 *   historique.json    — chaque version du logiciel : date, objet, ampleur.
 *
 * Usage : node outils/memoire.js   (depuis la racine du dépôt)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const RACINE = path.join(__dirname, '..');
const SORTIE = path.join(RACINE, 'docs', 'memoire');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const ecrire = (f, objet) => {
  fs.writeFileSync(path.join(SORTIE, f), JSON.stringify(objet, null, 2) + '\n', 'utf8');
  console.log('écrit : docs/memoire/' + f);
};

/* Un contexte où les scripts de l'application se chargent sans navigateur :
   seules leurs déclarations nous intéressent, pas leur rendu. */
function contexte(fichiers) {
  const bac = {
    console, Date, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Promise,
    setTimeout: () => 0, clearTimeout: () => {},
    React: { createElement: () => null, Component: class {}, useState: () => [null, () => {}], useEffect: () => {}, useMemo: f => f(), useRef: () => ({}) },
    window: { addEventListener() {}, removeEventListener() {}, innerWidth: 1440, innerHeight: 900 },
    document: { addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [], body: {}, documentElement: { style: {} } },
    requestAnimationFrame: () => 0, matchMedia: () => ({ matches: false, addEventListener() {} }), localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: {}, location: { href: '' },
  };
  bac.globalThis = bac;
  vm.createContext(bac);
  // Les déclarations « const » d'un script ne deviennent pas des propriétés
  // du contexte : on les expose à la fin de chaque fichier.
  fichiers.forEach(f => {
    const src = lire(f);
    const noms = [...src.matchAll(/^(?:const|let|function|async function)\s+([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
    const exposition = noms.map(n => `try { globalThis.${n} = ${n}; } catch (e) {}`).join('\n');
    vm.runInContext(src + '\n' + exposition, bac, { filename: f });
  });
  return bac;
}

// ---------------------------------------------------------------- référentiel
const r = contexte(['regles.js']);
ecrire('referentiel.json', {
  _role: 'OUTIL 1 — référentiel opérationnel, extrait du logiciel. Ne pas modifier à la main : régénérer avec node outils/memoire.js.',
  _avertissement: 'Les fondements sont ceux que ComplyEC cite ; ils restent à relire dans le texte en vigueur avant toute citation dans le mémoire.',
  version: r.REGLES_VERSION,
  historique: r.REGLES_HISTORIQUE,
  regles: r.REGLES.map(x => {
    const o = {};
    Object.keys(x).forEach(k => { if (typeof x[k] !== 'function') o[k] = x[k]; });
    o.applicabilite = x.portee === 'personne' ? 'Chaque membre de l’équipe concerné'
      : (x.code === 'R3' ? 'Personnes morales ; forme inconnue : applicable par prudence'
        : (x.code === 'R5' ? 'Dossiers dont la note de synthèse est présente' : 'Tous les dossiers du portefeuille'));
    o.affichage = x.onglet ? `Anomalies › onglet « ${x.onglet} »` : (x.suivi || '—');
    return o;
  }),
});

// ----------------------------------------------------------- fonctionnalités
const u = contexte(['data.js', 'anomalies.js', 'utils.js']);
const deplier = liste => liste.map(e => ({ entree: e.label, sous: (e.sous || []).map(s => s.label) }));
ecrire('fonctionnalites.json', {
  _role: 'Matière de l’OUTIL 2 (cahier des charges fonctionnel) : la navigation telle que le logiciel la déclare.',
  genereLe: new Date().toISOString().slice(0, 10),
  espaceExpertComptable: deplier(u.NAV_EC || []),
  espaceCollaborateur: deplier(u.NAV_COLLAB || []),
  famillesAnomalies: (u.ANOMALIES_ONGLETS || []).map(o => o.label),
  typesAnomalies: Object.entries(u.ANOMALIES_TYPES || {}).map(([code, t]) => ({ code, libelle: t.libelle, piece: t.piece, pourLExpertComptable: !!t.pourLEc })),
});

// ----------------------------------------------------------------- recettes
const recettes = fs.readdirSync(path.join(RACINE, 'tests'))
  .filter(f => f.endsWith('.js') && !['aller.js', 'harnais.js', 'tout.js', 'faux_supabase.js'].includes(f))
  .map(f => {
    const src = lire('tests/' + f);
    const m = src.match(/^\/\*([\s\S]*?)\*\//);
    const entete = m ? m[1].split('\n').map(l => l.replace(/^\s*\*\s?/, '').trimEnd()).filter(Boolean) : [];
    return { fichier: 'tests/' + f, description: entete.slice(0, 14), verifications: (src.match(/verifi(e|er)\(/g) || []).length };
  });
const tout = lire('tests/tout.js');
const ordre = [...tout.matchAll(/\['([\w_]+)', '([^']+)'\]/g)].map(m => ({ recette: m[1], objet: m[2] }));
ecrire('recettes.json', {
  _role: 'Critères de fonctionnement vérifiés à chaque modification (P3 ch. 1 S2 §2, OUTIL 3).',
  suite: ordre,
  detail: recettes,
});

// ---------------------------------------------------------------- historique
const brut = execFileSync('git', ['log', '--reverse', '--date=short', '--numstat', '--format=@@%h|%ad|%s'], { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const versions = [];
brut.split('\n').forEach(l => {
  if (l.startsWith('@@')) {
    const [commit, date, ...titre] = l.slice(2).split('|');
    versions.push({ commit, date, objet: titre.join('|'), fichiers: 0, lignesAjoutees: 0, lignesRetirees: 0 });
  } else if (l.trim() && versions.length) {
    const [a, d, f] = l.split('\t');
    if (/ComplyEC\.html|publication\//.test(f || '')) return; // le fichier assemblé gonflerait les chiffres
    const v = versions[versions.length - 1];
    v.fichiers += 1;
    v.lignesAjoutees += Number(a) || 0;
    v.lignesRetirees += Number(d) || 0;
  }
});
ecrire('historique.json', {
  _role: 'Chaque version du logiciel, tirée de l’historique du dépôt. Les « Retour du … » sont les itérations demandées par le cabinet.',
  versions: versions.filter(v => !/^Régénère le bundle/.test(v.objet)),
  synthese: {
    premiereVersion: versions.length ? versions[0].date : null,
    derniereVersion: versions.length ? versions[versions.length - 1].date : null,
    nombreDeVersions: versions.length,
    iterationsDemandeesParLeCabinet: versions.filter(v => /^Retours? du/.test(v.objet)).length,
  },
});

// ------------------------------------------------------------------- sources
/* Chaque référence réglementaire citée par le logiciel, et où elle apparaît.
   C'est la liste de ce qu'il faut relire dans le texte en vigueur avant de le
   citer dans le mémoire — et de ce qu'une veille doit surveiller. */
const motifs = [
  /\b(?:CMF|code monétaire et financier)[^'"`\n]{0,12}?art(?:icle|\.)?\s*[LRD]\.?\s*\d{3}-\d+(?:-\d+)?/gi,
  /\bart(?:icles?|\.)\s*[LRD]\.\s*\d{3}-\d+(?:-\d+)?(?:\s*(?:et|à)\s*[LRD]\.\s*\d{3}-\d+(?:-\d+)?)?/gi,
  /\bdécret\s+n°\s*\d{4}-\d+(?:\s+du\s+\d{1,2}\s+\w+\s+\d{4})?/gi,
  /\bdécret\s+2012-432,?\s*art\.?\s*\d+(?:\s*(?:à|et)\s*\d+)?/gi,
  /\barrêté\s+du\s+\d{1,2}(?:er)?\s+\w+\s+\d{4}/gi,
  /\bNP\s?2300\b/g, /\bNPMQ\b/g, /\bNPLAB\b/g,
  /\brèglement\s+(?:délégué\s+)?\(UE\)\s*\d{4}\/\d+/gi,
  /\bRGPD,?\s*art(?:icle|\.)?\s*\d+/gi,
  /\barticle\s+\d+\s+de\s+l['’]ordonnance\s+du\s+19\s+septembre\s+1945/gi,
  /\bart(?:icle|\.)\s*226-13\s+du\s+code\s+pénal/gi,
];
const fichiersCode = fs.readdirSync(RACINE).filter(f => f.endsWith('.js') && f !== 'ComplyEC.html');
const references = {};
fichiersCode.forEach(f => {
  lire(f).split('\n').forEach((ligne, i) => {
    motifs.forEach(m => {
      (ligne.match(m) || []).forEach(t => {
        const cle = t.replace(/\s+/g, ' ').trim();
        (references[cle] = references[cle] || new Set()).add(`${f}:${i + 1}`);
      });
    });
  });
});
ecrire('sources.json', {
  _role: 'Références réglementaires citées par le logiciel (relevé automatique). Statut : toutes « à relire dans le texte en vigueur » tant que le candidat ne les a pas vérifiées une à une. Règle du projet : ne jamais citer de mémoire.',
  _verifiees: 'Reporter ici, à la main, dans verifications.json, la date et le texte consulté pour chaque référence vérifiée.',
  references: Object.keys(references).sort().map(r => ({ reference: r, occurrences: references[r].size, ou: [...references[r]].slice(0, 12) })),
});
