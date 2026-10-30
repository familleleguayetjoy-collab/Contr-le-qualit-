// ComplyEC — données partagées du cabinet (mode « cabinet réel »)
'use strict';

/* Pourquoi ce fichier.

   Jusqu'au 30 octobre 2026, tout ce qu'on enregistrait dans ComplyEC restait
   dans le navigateur de la personne qui l'avait saisi : ce que signait un
   collaborateur, l'expert-comptable ne le voyait pas sur son poste. Un pilote
   à plusieurs était impossible.

   Le principe retenu ne touche pas aux écrans. Toutes les écritures passaient
   déjà par un point unique, demoMuter (db.js), qui modifie un « calque »
   rangé par familles : signatures, regularisations, rbe, formations… En mode
   cabinet réel, chaque famille modifiée est envoyée en base, dans la table
   etat_cabinet (supabase/schema_005_etat_partage.sql), avec le numéro de
   version qu'on avait lu.

   Deux personnes enregistrent en même temps dans la même famille ? La base
   refuse la seconde écriture (la version a changé). Ce poste relit alors la
   famille, réapplique dessus sa propre modification — la même fonction,
   rejouée — et renvoie. Personne n'écrase le travail d'un autre sans le
   savoir, et personne n'a à s'en occuper.

   Ce qui arrive des autres postes est reçu par le canal temps réel de
   Supabase, et, à défaut, relevé toutes les vingt secondes et au retour sur
   la fenêtre.

   Trois règles tenues ici :
   — aucune donnée de dossier n'est écrite dans le navigateur en mode réel
     (secret professionnel : un poste partagé ne garde rien) ;
   — l'écran dit toujours si ce qui a été saisi est enregistré ou non
     (IndicateurEnregistrement) : rien n'est présenté comme enregistré qui ne
     l'est pas ;
   — un collaborateur n'écrit que dans les familles de son travail ; la base
     le vérifie de son côté (etat_cles_collaborateur). */

/* Les familles qu'un collaborateur peut écrire. Identique, par construction,
   à la fonction etat_cles_collaborateur() de schema_005. */
const ETAT_CLES_COLLABORATEUR = [
  'journal', 'dossiersAjoutes', 'formations', 'depots', 'lectures',
  'notesSynthese', 'ncModifs', 'nonConformites', 'profilsCollab',
  'regularisations', 'signalementsRbe', 'signatures', 'manuelAccuses',
  'detections',
];

/* Le cabinet ouvert en données réelles, ou null en démonstration. */
let CABINET_REEL = null;

function modeCabinetReel() { return !!CABINET_REEL; }
function cabinetReel() { return CABINET_REEL; }

const PARTAGE = {
  versions: {},          // famille → version lue en base
  enAttente: {},         // famille → modifications locales pas encore confirmées
  sales: new Set(),      // familles à envoyer
  conflits: {},          // famille → nombre de reprises successives
  envoiEnCours: false,
  statut: 'ok',          // ok | envoi | hors-ligne | refus
  message: null,
  derniereReussite: null,
  essai: 0,
  minuterie: null,
  abonnes: new Set(),
  canal: null,
};

/* Les écrans se redessinent ; le portefeuille suit la liste importée. */
function partageRafraichir() {
  if (typeof semencesSynchroniserClients === 'function') semencesSynchroniserClients();
  if (typeof reglesPlanifierDetections === 'function') reglesPlanifierDetections();
  demoAbonnes.forEach(f => { try { f(); } catch (e) { /* composant démonté */ } });
}

function partageNotifier() {
  PARTAGE.abonnes.forEach(f => { try { f(); } catch (e) { /* composant démonté */ } });
}

function partageStatut(statut, message) {
  PARTAGE.statut = statut;
  PARTAGE.message = message || null;
  partageNotifier();
}

function cloneProfond(v) {
  return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
}

/* Les familles d'un état, chacune en texte : on compare avant et après une
   modification pour savoir lesquelles envoyer. */
function partageInstantane(etat) {
  const photo = {};
  Object.keys(etat).forEach(k => {
    if (k !== 'version') photo[k] = JSON.stringify(etat[k]);
  });
  return photo;
}

function partageClePermise(cle) {
  if (!CABINET_REEL) return false;
  return CABINET_REEL.role === 'expert_comptable' || ETAT_CLES_COLLABORATEUR.indexOf(cle) >= 0;
}

/* Appelé par demoMuter, après la modification locale. */
function partageApresMutation(fn, avant, etat) {
  const changees = Object.keys(etat).filter(k => k !== 'version'
    && JSON.stringify(etat[k]) !== (avant[k] === undefined ? undefined : avant[k]));
  let refus = false;
  changees.forEach(k => {
    if (!partageClePermise(k)) {
      // Refusé d'avance : on remet la valeur d'avant et on le dit.
      etat[k] = avant[k] === undefined ? demoEtatVide()[k] : JSON.parse(avant[k]);
      refus = true;
      return;
    }
    (PARTAGE.enAttente[k] = PARTAGE.enAttente[k] || []).push(fn);
    PARTAGE.sales.add(k);
  });
  if (refus) partageStatut('refus', 'Cette information est réservée à l’expert-comptable : elle n’a pas été enregistrée.');
  if (PARTAGE.sales.size) partagePlanifier(0);
}

function partagePlanifier(delaiMs) {
  if (PARTAGE.minuterie) clearTimeout(PARTAGE.minuterie);
  PARTAGE.minuterie = setTimeout(() => { PARTAGE.minuterie = null; partageEnvoyer(); }, delaiMs);
}

function partagePanneReseau(err) {
  if (!err) return false;
  if (err.name === 'AuthRetryableFetchError' || err.status === 0) return true;
  return /Failed to fetch|Load failed|NetworkError|Network request failed|fetch failed|timeout/i
    .test(err.message || String(err));
}

/* Relit une famille en base et y réapplique les modifications locales qui
   n'ont pas encore été confirmées, dans l'ordre où elles ont été faites. */
function partageRebaser(cle, valeurServeur, versionServeur) {
  let v = valeurServeur === undefined || valeurServeur === null ? demoEtatVide()[cle] : valeurServeur;
  (PARTAGE.enAttente[cle] || []).forEach(fn => {
    const base = cloneProfond(demoEtat);
    base[cle] = cloneProfond(v);
    try { fn(base); } catch (e) { console.warn('ComplyEC : modification non réapplicable', e); }
    v = base[cle];
  });
  demoEtat[cle] = v;
  PARTAGE.versions[cle] = Number(versionServeur) || 0;
}

async function partageLireFamilles(cles) {
  const { data, error } = await supabaseClient.from('etat_cabinet')
    .select('cle, valeur, version').eq('cabinet_id', CABINET_REEL.id).in('cle', cles);
  if (error) throw error;
  return data || [];
}

async function partageEnvoyer() {
  if (!CABINET_REEL || PARTAGE.envoiEnCours) return;
  if (!PARTAGE.sales.size) { if (PARTAGE.statut === 'envoi') partageStatut('ok'); return; }
  PARTAGE.envoiEnCours = true;
  if (PARTAGE.statut !== 'refus') partageStatut('envoi');
  let cle = null;
  try {
    while (PARTAGE.sales.size) {
      cle = PARTAGE.sales.values().next().value;
      // La valeur envoyée et le nombre de modifications qu'elle contient se
      // lisent au même instant : ce qui arrive pendant l'envoi repartira.
      const n = (PARTAGE.enAttente[cle] || []).length;
      const valeur = demoEtat[cle] === undefined ? null : demoEtat[cle];
      const { data, error } = await supabaseClient.rpc('etat_ecrire', {
        p_cle: cle, p_valeur: valeur, p_version_attendue: PARTAGE.versions[cle] || 0,
      });
      if (error) throw error;
      if (Number(data) === -1) {
        PARTAGE.conflits[cle] = (PARTAGE.conflits[cle] || 0) + 1;
        if (PARTAGE.conflits[cle] > 6) {
          throw Object.assign(new Error('Plusieurs personnes modifient la même information en même temps.'), { definitif: true });
        }
        const lignes = await partageLireFamilles([cle]);
        const l = lignes[0];
        partageRebaser(cle, l ? l.valeur : null, l ? l.version : 0);
        partageRafraichir();
        continue;
      }
      PARTAGE.conflits[cle] = 0;
      PARTAGE.versions[cle] = Number(data);
      PARTAGE.enAttente[cle] = (PARTAGE.enAttente[cle] || []).slice(n);
      if (!PARTAGE.enAttente[cle].length) PARTAGE.sales.delete(cle);
    }
    PARTAGE.essai = 0;
    PARTAGE.derniereReussite = new Date();
    if (PARTAGE.statut !== 'refus') partageStatut('ok');
  } catch (err) {
    if (!err.definitif && partagePanneReseau(err)) {
      PARTAGE.essai += 1;
      const delai = Math.min(60000, 3000 * Math.pow(2, PARTAGE.essai - 1));
      partageStatut('hors-ligne', `Connexion perdue : ${PARTAGE.sales.size} ${PARTAGE.sales.size > 1 ? 'modifications attendent' : 'modification attend'} d’être enregistrée${PARTAGE.sales.size > 1 ? 's' : ''}. Nouvelle tentative automatique.`);
      PARTAGE.envoiEnCours = false;
      partagePlanifier(delai);
      return;
    }
    // Refus définitif : on ne garde pas une saisie que la base n'acceptera
    // jamais. On relit la famille telle qu'elle est en base, et on le dit.
    if (cle) {
      PARTAGE.enAttente[cle] = [];
      PARTAGE.sales.delete(cle);
      PARTAGE.conflits[cle] = 0;
      try {
        const lignes = await partageLireFamilles([cle]);
        const l = lignes[0];
        demoEtat[cle] = l ? l.valeur : demoEtatVide()[cle];
        PARTAGE.versions[cle] = l ? Number(l.version) : 0;
      } catch (e) { /* la relève suivante rattrapera */ }
      partageRafraichir();
    }
    partageStatut('refus', `Non enregistré : ${err.message || 'la base a refusé la modification.'}`);
  } finally {
    PARTAGE.envoiEnCours = false;
  }
  if (PARTAGE.sales.size && PARTAGE.statut !== 'hors-ligne') partagePlanifier(0);
}

/* Ce qui arrive des autres postes. Une famille que ce poste est en train de
   modifier est relue puis complétée de ses propres modifications. */
function partageRecevoirLigne(l) {
  if (!l || !l.cle || l.cle === 'version') return false;
  const v = Number(l.version) || 0;
  if (v <= (PARTAGE.versions[l.cle] || 0)) return false;
  if ((PARTAGE.enAttente[l.cle] || []).length) partageRebaser(l.cle, l.valeur, v);
  else { demoEtat[l.cle] = l.valeur; PARTAGE.versions[l.cle] = v; }
  return true;
}

async function partageReleve() {
  if (!CABINET_REEL) return;
  try {
    const { data, error } = await supabaseClient.from('etat_cabinet')
      .select('cle, version').eq('cabinet_id', CABINET_REEL.id);
    if (error) throw error;
    const nouvelles = (data || []).filter(r => (Number(r.version) || 0) > (PARTAGE.versions[r.cle] || 0)).map(r => r.cle);
    if (!nouvelles.length) {
      if (PARTAGE.statut === 'hors-ligne' && !PARTAGE.sales.size) partageStatut('ok');
      return;
    }
    const lignes = await partageLireFamilles(nouvelles);
    let change = false;
    lignes.forEach(l => { change = partageRecevoirLigne(l) || change; });
    if (change) partageRafraichir();
    if (PARTAGE.statut === 'hors-ligne' && !PARTAGE.sales.size) partageStatut('ok');
  } catch (err) {
    if (partagePanneReseau(err) && PARTAGE.statut !== 'refus') {
      partageStatut('hors-ligne', 'Connexion perdue : ce que font vos collègues n’apparaît plus. Nouvelle tentative automatique.');
    }
  }
}

function partageAbonnerTempsReel() {
  try {
    PARTAGE.canal = supabaseClient.channel('etat-' + CABINET_REEL.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'etat_cabinet', filter: 'cabinet_id=eq.' + CABINET_REEL.id },
        payload => {
          if (partageRecevoirLigne(payload && payload.new)) {
            partageRafraichir();
          }
        })
      .subscribe();
  } catch (e) {
    // Sans temps réel, la relève périodique suffit : ce n'est qu'un délai.
    console.warn('ComplyEC : canal temps réel indisponible, relève périodique seule.', e);
  }
}

/* Ouverture du cabinet en données réelles : lecture de l'état, de l'équipe,
   puis remplacement des données de démonstration par celles du cabinet. */
async function ouvrirCabinetReel(profil, cabinet) {
  if (CABINET_REEL && CABINET_REEL.id === cabinet.id) return CABINET_REEL;
  const { data: lignes, error } = await supabaseClient.from('etat_cabinet')
    .select('cle, valeur, version').eq('cabinet_id', cabinet.id);
  if (error) throw error;
  const brut = {};
  (lignes || []).forEach(l => {
    brut[l.cle] = l.valeur;
    PARTAGE.versions[l.cle] = Number(l.version) || 0;
  });
  const { data: equipe, error: errEquipe } = await supabaseClient.from('profiles')
    .select('id, role, nom, prenom, email, telephone, created_at').eq('cabinet_id', cabinet.id);
  if (errEquipe) throw errEquipe;

  CABINET_REEL = {
    id: cabinet.id,
    nom: cabinet.nom,
    depuis: cabinet.donnees_reelles_depuis || null,
    profil,
    role: profil.role,
    equipe: equipe || [],
  };
  demoEtat = demoMigrer(brut);
  semencesBasculerEnReel();
  reglesPlanifierDetections();

  partageAbonnerTempsReel();
  setInterval(partageReleve, 20000);
  window.addEventListener('focus', partageReleve);
  window.addEventListener('online', () => { partageReleve(); partagePlanifier(0); });
  window.addEventListener('beforeunload', e => {
    if (PARTAGE.sales.size || PARTAGE.envoiEnCours) {
      e.preventDefault();
      e.returnValue = 'Des modifications ne sont pas encore enregistrées.';
      return e.returnValue;
    }
    return undefined;
  });
  return CABINET_REEL;
}

/* Relit l'équipe (après une invitation, par exemple). */
async function partageRelireEquipe() {
  if (!CABINET_REEL) return;
  const { data, error } = await supabaseClient.from('profiles')
    .select('id, role, nom, prenom, email, telephone, created_at').eq('cabinet_id', CABINET_REEL.id);
  if (error) throw error;
  CABINET_REEL.equipe = data || [];
  semencesEquipeReelle();
  partageRafraichir();
}

// ------------------------------------------------- Ce que voit l'utilisateur

function usePartage() {
  const [, redessiner] = useState(0);
  useEffect(() => {
    const f = () => redessiner(n => n + 1);
    PARTAGE.abonnes.add(f);
    return () => PARTAGE.abonnes.delete(f);
  }, []);
  return PARTAGE;
}

/* Dans la barre de gauche, sous le nom : ce qui a été saisi est-il
   enregistré ? Quatre états, dits en français courant. */
function IndicateurEnregistrement() {
  const p = usePartage();
  if (!modeCabinetReel()) return null;
  const libelles = {
    ok: '✓ Tout est enregistré',
    envoi: 'Enregistrement en cours…',
    'hors-ligne': '⚠ Pas encore enregistré',
    refus: '⚠ Non enregistré',
  };
  return h('div', { className: cx('indicateur-enregistrement', 'etat-' + p.statut), role: 'status', title: p.message || undefined },
    h('span', null, libelles[p.statut] || libelles.ok),
    p.statut === 'refus' || p.statut === 'hors-ligne'
      ? h('button', {
        type: 'button', className: 'indicateur-action',
        onClick: () => { if (p.statut === 'refus') partageStatut('ok'); partagePlanifier(0); },
      }, p.statut === 'refus' ? 'Compris' : 'Réessayer')
      : null);
}

/* Le message complet, en bandeau, quand quelque chose n'est pas enregistré :
   un symbole dans la barre ne suffit pas à dire quoi faire. */
function BandeauEnregistrement() {
  const p = usePartage();
  if (!modeCabinetReel() || (p.statut !== 'refus' && p.statut !== 'hors-ligne') || !p.message) return null;
  return h('div', { className: cx('bandeau-enregistrement', 'etat-' + p.statut), role: 'alert' },
    h('span', null, p.message),
    h('button', {
      type: 'button', className: 'btn btn-secondary btn-sm',
      onClick: () => { if (p.statut === 'refus') partageStatut('ok'); partagePlanifier(0); },
    }, p.statut === 'refus' ? 'Compris' : 'Réessayer maintenant'));
}

/* Une fonction serveur qui ne répond pas renvoie un message technique
   (« Failed to send a request to the Edge Function »). On dit ce qu'il se
   passe et ce qu'il faut faire. */
function messageFonctionServeur(err, defaut) {
  const brut = (err && (err.message || String(err))) || '';
  if (/Failed to send a request|FunctionsFetchError|404|not found/i.test(brut)) {
    return 'La fonction serveur n’est pas encore installée sur le projet Supabase du cabinet. '
      + 'Elle s’installe avec la commande indiquée dans le guide de mise en service.';
  }
  if (partagePanneReseau(err)) return 'Impossible de joindre le serveur : vérifiez la connexion internet, puis réessayez.';
  return brut || defaut;
}
