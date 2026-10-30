/* Faux serveur Supabase, pour les recettes du mode « cabinet réel ».
 *
 * Il reproduit, dans le navigateur, ce que font les tables et fonctions de
 * supabase/schema.sql et schema_005_etat_partage.sql : profils, cabinets,
 * état partagé versionné, refus des écritures hors droits, historique, canal
 * temps réel. L'état du « serveur » vit dans localStorage : deux onglets du
 * même navigateur sont deux postes qui partagent la même base.
 *
 * Il n'est chargé que par les harnais de test, jamais par l'application.
 */
(function () {
  const CLE = 'faux.serveur';
  const canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('faux.realtime') : null;
  const ecouteurs = [];

  function lire() {
    try { return JSON.parse(localStorage.getItem(CLE)) || null; } catch (e) { return null; }
  }
  function ecrire(s) { localStorage.setItem(CLE, JSON.stringify(s)); }

  function amorcer() {
    let s = lire();
    if (s) return s;
    s = {
      cabinets: [{ id: 'cab-essai', nom: 'Cabinet d’essai', donnees_reelles: true, donnees_reelles_depuis: '2026-10-30T08:00:00Z' }],
      profiles: [
        { id: 'u-ec', cabinet_id: 'cab-essai', role: 'expert_comptable', prenom: 'Hélène', nom: 'Martel', email: 'h.martel@essai.fr' },
        { id: 'u-lucie', cabinet_id: 'cab-essai', role: 'collaborateur', prenom: 'Lucie', nom: 'Garnier', email: 'l.garnier@essai.fr' },
        { id: 'u-marc', cabinet_id: 'cab-essai', role: 'collaborateur', prenom: 'Marc', nom: 'Olivier', email: 'm.olivier@essai.fr' },
      ],
      etat: {},        // cle -> { valeur, version }
      historique: [],
    };
    ecrire(s);
    return s;
  }

  const CLES_COLLAB = ['journal', 'dossiersAjoutes', 'formations', 'depots', 'lectures',
    'notesSynthese', 'ncModifs', 'nonConformites', 'profilsCollab',
    'regularisations', 'signalementsRbe', 'signatures', 'manuelAccuses', 'detections'];

  function erreurReseau() {
    const e = new Error('Failed to fetch'); e.name = 'TypeError'; return e;
  }

  function utilisateur() { return window.FAUX_UTILISATEUR; }

  // Requête « table » chaînable, résolue au premier then().
  function requete(table) {
    const filtres = [];
    let unique = false;
    const q = {
      select() { return q; },
      eq(col, val) { filtres.push(l => l[col] === val); return q; },
      in(col, vals) { filtres.push(l => vals.indexOf(l[col]) >= 0); return q; },
      order() { return q; },
      limit() { return q; },
      maybeSingle() { unique = true; return q; },
      then(ok, ko) {
        return new Promise(res => setTimeout(res, 5)).then(() => {
          if (window.FAUX_HORS_LIGNE) throw erreurReseau();
          const s = amorcer();
          const moi = s.profiles.find(p => p.id === utilisateur());
          let lignes;
          if (table === 'etat_cabinet') {
            lignes = Object.keys(s.etat).map(cle => ({ cabinet_id: moi.cabinet_id, cle, valeur: s.etat[cle].valeur, version: s.etat[cle].version }));
          } else if (table === 'profiles') {
            lignes = s.profiles.filter(p => p.cabinet_id === moi.cabinet_id);
          } else if (table === 'cabinets') {
            lignes = s.cabinets.filter(c => c.id === moi.cabinet_id);
          } else lignes = [];
          lignes = lignes.filter(l => filtres.every(f => f(l)));
          return { data: unique ? (lignes[0] || null) : JSON.parse(JSON.stringify(lignes)), error: null };
        }).then(ok, ko);
      },
    };
    return q;
  }

  function etatEcrire({ p_cle, p_valeur, p_version_attendue }) {
    const s = amorcer();
    const moi = s.profiles.find(p => p.id === utilisateur());
    if (moi.role !== 'expert_comptable' && CLES_COLLAB.indexOf(p_cle) < 0) {
      return { data: null, error: { message: 'Cette information est réservée à l’expert-comptable.', code: '42501' } };
    }
    const actuel = s.etat[p_cle];
    if (!actuel) {
      if ((p_version_attendue || 0) !== 0) return { data: -1, error: null };
      s.etat[p_cle] = { valeur: p_valeur, version: 1 };
    } else {
      if (actuel.version !== p_version_attendue) return { data: -1, error: null };
      s.etat[p_cle] = { valeur: p_valeur, version: actuel.version + 1 };
    }
    s.historique.push({ cle: p_cle, version: s.etat[p_cle].version, par: moi.id, le: new Date().toISOString() });
    ecrire(s);
    const ligne = { cabinet_id: moi.cabinet_id, cle: p_cle, valeur: p_valeur, version: s.etat[p_cle].version };
    if (canal) canal.postMessage(ligne);
    return { data: s.etat[p_cle].version, error: null };
  }

  window.supabaseClient = {
    from: table => requete(table),
    rpc(nom, args) {
      return new Promise(res => setTimeout(res, 5)).then(() => {
        if (window.FAUX_HORS_LIGNE) throw erreurReseau();
        // Le vrai serveur verrouille la ligne (select … for update) : ici, un
        // verrou entre onglets joue ce rôle, sinon deux postes liraient la
        // même version et le faux serveur perdrait une écriture.
        if (nom === 'etat_ecrire') {
          return navigator.locks
            ? navigator.locks.request('faux.serveur', () => etatEcrire(args))
            : etatEcrire(args);
        }
        if (nom === 'cabinet_passer_en_reel') return { data: new Date().toISOString(), error: null };
        return { data: null, error: { message: 'Fonction inconnue : ' + nom } };
      });
    },
    channel() {
      const c = {
        on(type, filtre, cb) { ecouteurs.push(cb); return c; },
        subscribe() { return c; },
      };
      return c;
    },
    functions: {
      invoke(nom, { body }) {
        return new Promise(res => setTimeout(res, 5)).then(() => {
          if (nom !== 'invite-collaborateur') return { data: null, error: { message: 'Failed to send a request to the Edge Function' } };
          const s = amorcer();
          const moi = s.profiles.find(p => p.id === utilisateur());
          const id = 'u-' + String(body.prenom).toLowerCase();
          s.profiles.push({ id, cabinet_id: moi.cabinet_id, role: 'collaborateur', prenom: body.prenom, nom: body.nom, email: body.email });
          ecrire(s);
          return { data: { ok: true }, error: null };
        });
      },
    },
    auth: {
      signOut: () => Promise.resolve({}),
    },
  };

  if (canal) {
    canal.onmessage = ev => ecouteurs.forEach(cb => cb({ new: ev.data }));
  }

  window.FauxServeur = {
    amorcer,
    lire,
    profil: id => amorcer().profiles.find(p => p.id === id),
    cabinet: () => amorcer().cabinets[0],
    vider: () => localStorage.removeItem(CLE),
  };
})();
