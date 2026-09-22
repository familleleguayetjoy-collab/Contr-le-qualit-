/* ComplyEC — État de préparation au contrôle
   ==========================================

   Un seul calcul, deux usages : le pourcentage de complétude et les urgences
   de la synthèse (§ 13).

   Le principe est le même que partout ailleurs : rien n'est déclaré, tout est
   déduit. Le pourcentage ne se saisit pas, il se compte — chaque obligation
   couverte vaut un point, et le total ne bouge que quand un fait change.

   Ce qui est compté est donc ce qui est vérifiable. Une rubrique qui ne repose
   sur aucun fait enregistrable n'entre pas dans le calcul : elle gonflerait le
   pourcentage sans rien garantir, et un contrôleur s'en apercevrait avant
   l'expert-comptable. */

'use strict';

function anneeDe(date) {
  return date ? Number(String(date).slice(0, 4)) : 0;
}

/* Une obligation : combien sont couvertes, combien sont attendues. Deux nombres
   suffisent — un pourcentage se calcule, il ne s'estime pas. */
function point(couverts, attendus) {
  return { couverts: Math.max(0, couverts), attendus: Math.max(0, attendus) };
}

/* Trois degrés de gravité, et ce que chacun veut dire.

   Ce classement n'est pas décoratif : il décide de l'ordre dans lequel les
   quatre problèmes s'affichent, donc de ce que l'expert-comptable traite en
   premier. Il fallait donc arrêter une liste, et pouvoir la défendre.

   Est « grave » ce dont l'absence se relève telle quelle en contrôle qualité,
   parce qu'une obligation n'est pas seulement mal documentée : elle n'est pas
   remplie. Six situations le sont :

     — une lettre de mission absente : la mission n'est pas contractualisée ;
     — un dossier sans analyse LBC-FT : l'obligation de vigilance du code
       monétaire et financier n'est pas exécutée ;
     — une divergence au registre des bénéficiaires effectifs non traitée ;
     — une note de synthèse jamais supervisée : la revue n'a pas eu lieu ;
     — le manuel de procédures non publié : le système de maîtrise de la
       qualité n'est pas formalisé ;
     — une non-conformité ouverte sans plan d'action.

   Est « important » ce qui est dû et manque, mais dont l'absence se rattrape
   avant le contrôle. Le reste est « à régulariser ».

   Une urgence telle que la synthèse l'affiche : une phrase, et l'endroit où la
   traiter. Aucune urgence n'est créée quand son compte est nul : le § 13
   interdit de compléter artificiellement. */
const SYNTHESE_GRAVITES = [
  { rang: 0, label: 'Grave', ton: 'rouge' },
  { rang: 1, label: 'Important', ton: 'orange' },
  { rang: 2, label: 'À régulariser', ton: 'ambre' },
];

function graviteDe(rang) {
  return SYNTHESE_GRAVITES[Math.max(0, Math.min(SYNTHESE_GRAVITES.length - 1, rang))];
}

function urgence(rang, libelle, section, sub) {
  return { rang, libelle, section, sub, gravite: graviteDe(rang) };
}

/* ------------------------------------------------------- Les huit rubriques

   Chaque fonction renvoie ses points et ses urgences. Elles sont indépendantes :
   une rubrique qui échouerait n'emporterait pas les sept autres. */

function rubriqueManuel() {
  const cab = dbManuelCabinet();
  const version = manuelVersionEnVigueur();
  const etapes = ['cabinet', 'equipe', 'informatique'];
  const faites = etapes.filter(e => cab[e] && cab[e].valideeLe).length;
  const points = [point(faites, etapes.length), point(version ? 1 : 0, 1)];
  const urgences = [];
  if (faites < etapes.length) {
    const reste = etapes.length - faites;
    urgences.push(urgence(1,
      `${reste} ${pluriel(reste, 'étape', 'étapes')} du manuel à compléter`,
      'controle', 'manuel'));
  } else if (!version) {
    // Le système de maîtrise de la qualité doit être formalisé : les trois
    // étapes remplies mais jamais publiées, il ne l'est pas.
    urgences.push(urgence(0, 'Manuel de procédures non publié', 'controle', 'manuel'));
  }
  return { points, urgences };
}

function rubriqueIndependance(reglages) {
  const annee = currentCalendarYear();
  const declarations = dbDeclarations(annee);
  const signees = declarations.filter(d => d.statut === 'signee').length;
  const manquantes = declarations.length - signees;

  const dependances = dependanceASurveiller(reglages.seuilDependance);
  const sansMesure = dependances.filter(d => !d.mesures || !d.mesures.length).length;

  const points = [
    point(signees, declarations.length),
    point(dependances.length - sansMesure, dependances.length),
  ];
  const urgences = [];
  if (manquantes) {
    urgences.push(urgence(1,
      `${manquantes} ${pluriel(manquantes, 'attestation d’indépendance manquante', 'attestations d’indépendance manquantes')}`,
      'controle', 'independance'));
  }
  if (sansMesure) {
    urgences.push(urgence(1,
      `${sansMesure} ${pluriel(sansMesure, 'dossier sans mesure de sauvegarde', 'dossiers sans mesure de sauvegarde')}`,
      'controle', 'independance'));
  }
  return { points, urgences };
}

function rubriqueFormations() {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  let attendues = 0;
  let recues = 0;
  dbFormationsProgrammes().forEach(prog => prog.sessions.forEach(s => {
    if (s.date > aujourdhui) return;
    (s.participants || []).forEach(pid => {
      attendues += 1;
      const a = s.attestations && s.attestations[pid];
      if (a && a.recue) recues += 1;
    });
  }));
  const manquantes = attendues - recues;
  const urgences = [];
  if (manquantes) {
    urgences.push(urgence(1,
      `${manquantes} ${pluriel(manquantes, 'attestation de formation manquante', 'attestations de formation manquantes')}`,
      'controle', 'formations'));
  }
  return { points: [point(recues, attendues)], urgences };
}

function rubriqueLbcft() {
  const dossiers = dbVigilanceDossiers();
  const couverts = dossiers.filter(d => d.statut === 'complete').length;
  const aTraiter = dossiers.length - couverts;

  const cartos = dbCartographies();
  const derniere = cartos.length ? cartos[0] : null;
  const cartoAJour = !!derniere && anneeDe(derniere.date) >= currentCalendarYear();

  const rbe = dbCampagneRbe();
  const consultes = rbe.filter(r => r.date).length;
  const divergences = rbe.filter(r => r.resultat === 'divergence').length;

  const points = [
    point(couverts, dossiers.length),
    point(cartoAJour ? 1 : 0, 1),
    point(consultes, rbe.length),
  ];
  const urgences = [];
  if (aTraiter) {
    // L'obligation de vigilance n'est pas seulement mal documentée : elle
    // n'est pas exécutée.
    urgences.push(urgence(0,
      `${aTraiter} ${pluriel(aTraiter, 'dossier sans analyse LCB-FT', 'dossiers sans analyse LCB-FT')}`,
      'controle', 'lbcft'));
  }
  if (!cartoAJour) {
    urgences.push(urgence(1,
      derniere ? 'Cartographie LCB-FT à actualiser' : 'Cartographie LCB-FT jamais arrêtée',
      'controle', 'lbcft'));
  }
  if (divergences) {
    urgences.push(urgence(0,
      `${divergences} ${pluriel(divergences, 'divergence au registre des bénéficiaires', 'divergences au registre des bénéficiaires')}`,
      'controle', 'lbcft'));
  }
  return { points, urgences };
}

function rubriqueSupervision() {
  const absentes = anomaliesDeLOnglet('notes').filter(a => a.type === 'note_synthese_absente').length;
  const nonSupervisees = anomaliesDeLOnglet('notes').filter(a => a.type === 'note_synthese_non_supervisee').length;
  const attendues = CLIENTS.length;
  const couvertes = attendues - absentes - nonSupervisees;

  const urgences = [];
  if (absentes) {
    urgences.push(urgence(1,
      `${absentes} ${pluriel(absentes, 'note de synthèse absente', 'notes de synthèse absentes')}`,
      'controle', 'supervision'));
  }
  if (nonSupervisees) {
    // La revue de l'expert-comptable n'a pas eu lieu : c'est le cœur de la
    // norme de maîtrise de la qualité.
    urgences.push(urgence(0,
      `${nonSupervisees} ${pluriel(nonSupervisees, 'note de synthèse non supervisée', 'notes de synthèse non supervisées')}`,
      'controle', 'supervision'));
  }
  return { points: [point(couvertes, attendues)], urgences };
}

function rubriqueSurveillance() {
  const faites = dbSurveillance();
  const validees = SURVEILLANCE_PROGRAMME.filter(e => faites[e.code]).length;
  const ncOuvertesSansPlan = dbNonConformites().filter(n => etatNonConformite(n) === 'ouverte').length;
  const reclamations = reclamationsOuvertes().length;

  const points = [
    point(validees, SURVEILLANCE_PROGRAMME.length),
    point(dbNonConformites().length - ncOuvertesSansPlan, dbNonConformites().length),
    point(dbReclamations().length - reclamations, dbReclamations().length),
  ];
  const urgences = [];
  if (validees < SURVEILLANCE_PROGRAMME.length) {
    urgences.push(urgence(2, 'Programme annuel incomplet', 'controle', 'surveillance'));
  }
  if (ncOuvertesSansPlan) {
    urgences.push(urgence(0,
      `${ncOuvertesSansPlan} ${pluriel(ncOuvertesSansPlan, 'non-conformité sans plan d’action', 'non-conformités sans plan d’action')}`,
      'controle', 'surveillance'));
  }
  if (reclamations) {
    urgences.push(urgence(2,
      `${reclamations} ${pluriel(reclamations, 'réclamation non close', 'réclamations non closes')}`,
      'controle', 'surveillance'));
  }
  return { points, urgences };
}

/* Le registre des traitements a été retiré de l'outil le 22 septembre : il ne
   compte donc plus dans la préparation. Restent les deux sujets que ComplyEC
   suit réellement — les contrats des prestataires, et la charte IA. */
function rubriqueRgpd() {
  const prestataires = dbPrestataires();
  const contrats = dbContratsPrestataires();
  const avecContrat = prestataires.filter(p => contrats[p.id] || p.contrat).length;
  const sansContrat = prestataires.length - avecContrat;

  const charte = dbCharteIa();

  const points = [
    point(avecContrat, prestataires.length),
    point(charte ? 1 : 0, 1),
  ];
  const urgences = [];
  if (sansContrat) {
    urgences.push(urgence(2,
      `${sansContrat} ${pluriel(sansContrat, 'contrat prestataire manquant', 'contrats prestataires manquants')}`,
      'controle', 'rgpd'));
  }
  if (!charte) {
    urgences.push(urgence(2, 'Charte IA non créée', 'controle', 'rgpd'));
  }
  return { points, urgences };
}

/* Les anomalies documentaires ne sont pas une rubrique du contrôle : ce sont
   des pièces qui manquent dans les dossiers, et elles se traitent dans l'onglet
   Anomalies. Elles pèsent en revanche sur l'état de préparation, et la synthèse
   doit pouvoir y renvoyer directement. */
function rubriqueAnomalies() {
  const parOnglet = {};
  anomaliesOuvertes().forEach(a => {
    if (a.onglet === 'autres') return; // déjà comptées par Indépendance et Formations
    parOnglet[a.onglet] = (parOnglet[a.onglet] || 0) + 1;
  });

  // Les pièces attendues : une lettre, une pièce d'identité et un justificatif
  // RBE par dossier. Les notes de synthèse sont comptées par Supervision.
  const attendues = CLIENTS.length * 3;
  const manquantes = (parOnglet.lettres || 0) + (parOnglet.identite || 0) + (parOnglet.rbe || 0);

  const urgences = [];
  if (parOnglet.lettres) {
    urgences.push(urgence(0,
      `${parOnglet.lettres} ${pluriel(parOnglet.lettres, 'lettre de mission absente', 'lettres de mission absentes')}`,
      'anomalies', 'lettres'));
  }
  if (parOnglet.rbe) {
    urgences.push(urgence(1,
      `${parOnglet.rbe} ${pluriel(parOnglet.rbe, 'justificatif RBE absent', 'justificatifs RBE absents')}`,
      'anomalies', 'rbe'));
  }
  if (parOnglet.identite) {
    urgences.push(urgence(1,
      `${parOnglet.identite} ${pluriel(parOnglet.identite, 'pièce d’identité absente', 'pièces d’identité absentes')}`,
      'anomalies', 'identite'));
  }
  return { points: [point(attendues - manquantes, attendues)], urgences };
}

/* ------------------------------------------------------------- L'assemblage */

/* Les rubriques qui entrent dans le calcul, dans l'ordre du menu. Les anomalies
   documentaires viennent en plus : elles ne sont pas une rubrique du menu mais
   pèsent sur la préparation. */
const SYNTHESE_RUBRIQUES = [
  { key: 'manuel', label: 'Manuel de procédures', calcul: rubriqueManuel },
  { key: 'independance', label: 'Indépendance', calcul: rubriqueIndependance },
  { key: 'formations', label: 'Formations', calcul: rubriqueFormations },
  { key: 'lbcft', label: 'LCB-FT', calcul: rubriqueLbcft },
  { key: 'supervision', label: 'Supervision des dossiers', calcul: rubriqueSupervision },
  { key: 'surveillance', label: 'Surveillance du système qualité', calcul: rubriqueSurveillance },
  { key: 'rgpd', label: 'Informatique, RGPD & IA', calcul: rubriqueRgpd },
  { key: 'anomalies', label: 'Anomalies documentaires', calcul: rubriqueAnomalies },
];

/* L'état complet de la préparation. Appelé par la synthèse, et par elle seule :
   l'accueil n'affiche aucun chiffre (§ 2). */
function etatPreparation(reglages) {
  const r = reglages || dbReglages();
  let couverts = 0;
  let attendus = 0;
  const rubriques = [];
  let urgences = [];

  SYNTHESE_RUBRIQUES.forEach(def => {
    const res = def.calcul(r);
    const sousTotalC = res.points.reduce((n, p) => n + p.couverts, 0);
    const sousTotalA = res.points.reduce((n, p) => n + p.attendus, 0);
    couverts += sousTotalC;
    attendus += sousTotalA;
    rubriques.push({
      key: def.key, label: def.label,
      couverts: sousTotalC, attendus: sousTotalA,
      complete: sousTotalA > 0 && sousTotalC >= sousTotalA,
    });
    urgences = urgences.concat(res.urgences);
  });

  /* Quatre au maximum, les plus urgentes d'abord (§ 13.B). S'il n'y en a que
     deux, on n'en affiche que deux — on ne complète jamais pour faire joli. */
  urgences.sort((a, b) => a.rang - b.rang);

  return {
    rubriques,
    couverts,
    attendus,
    completude: attendus ? Math.round((couverts / attendus) * 100) : 0,
    urgences: urgences.slice(0, 4),
    toutesUrgences: urgences,
  };
}
