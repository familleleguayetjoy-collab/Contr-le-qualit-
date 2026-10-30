// ComplyEC — Edge Function : création du compte d'un collaborateur
//
// Trois usages, tous réservés à l'expert-comptable du cabinet :
//   — mode « mot_de_passe » (par défaut depuis le 30 octobre 2026) : le compte
//     est créé avec un mot de passe provisoire, renvoyé à l'expert-comptable
//     qui le remet en main propre ; le collaborateur le change à sa première
//     connexion. Aucun courriel : le service d'envoi par défaut de Supabase
//     refuse les adresses extérieures à l'équipe du projet tant qu'un serveur
//     SMTP n'est pas configuré ;
//   — mode « invitation » : courriel d'invitation (suppose un SMTP configuré) ;
//   — mode « reinitialiser » : nouveau mot de passe provisoire pour un
//     collaborateur du même cabinet qui a perdu le sien.
//
// Cette fonction tourne côté serveur avec la clé "service role" (jamais
// exposée au navigateur). Elle vérifie que l'appelant est bien
// l'expert-comptable du cabinet, crée le compte Supabase Auth du
// collaborateur (ce qui envoie automatiquement l'e-mail d'invitation avec
// le lien de connexion), puis sa fiche "profiles".
//
// Déploiement : supabase functions deploy invite-collaborateur
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement
// par l'environnement des Edge Functions — rien à configurer pour ceux-là.
// Pour que le lien de l'e-mail pointe vers l'appli une fois déployée :
// supabase secrets set APP_URL=https://votre-domaine)

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);

  // La clé serveur : celle que Supabase fournit d'office aux fonctions, ou,
  // si le projet n'utilise plus l'ancienne clé « service_role », la clé
  // secrète du projet enregistrée à la main sous COMPLYEC_CLE_SERVEUR
  // (Edge Functions › Secrets). Jamais dans le navigateur.
  const cleServeur = Deno.env.get('COMPLYEC_CLE_SERVEUR') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!cleServeur) {
    return json({ error: 'Clé serveur absente : enregistrez la clé secrète du projet dans le secret COMPLYEC_CLE_SERVEUR (voir le guide de mise en service).' }, 500);
  }
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, cleServeur);

  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !user) return json({ error: 'Session invalide.' }, 401);

  const { data: callerProfile, error: callerErr } = await supabaseAdmin
    .from('profiles')
    .select('role, cabinet_id')
    .eq('id', user.id)
    .maybeSingle();
  if (callerErr || !callerProfile) return json({ error: 'Profil introuvable.' }, 403);
  if (callerProfile.role !== 'expert_comptable') {
    return json({ error: "Seul l'expert-comptable du cabinet peut inviter un collaborateur." }, 403);
  }

  let body: { mode?: string; collaborateurId?: string; prenom?: string; nom?: string; email?: string; telephone?: string | null };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }

  const mode = body.mode || 'invitation';

  // Mot de passe provisoire lisible : trois groupes de quatre caractères,
  // sans les caractères qui se confondent à l'oral (0/O, 1/l/I).
  function motDePasseProvisoire(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const octets = new Uint8Array(12);
    crypto.getRandomValues(octets);
    const c = Array.from(octets, o => alphabet[o % alphabet.length]).join('');
    return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
  }

  if (mode === 'reinitialiser') {
    const id = String(body.collaborateurId || '');
    const { data: cible } = await supabaseAdmin.from('profiles').select('id, cabinet_id, role').eq('id', id).maybeSingle();
    if (!cible || cible.cabinet_id !== callerProfile.cabinet_id) return json({ error: 'Collaborateur introuvable dans ce cabinet.' }, 404);
    if (cible.role !== 'collaborateur') return json({ error: 'Seul le mot de passe d’un collaborateur se réinitialise ici.' }, 403);
    const provisoire = motDePasseProvisoire();
    const { error: majErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: provisoire,
      user_metadata: { mot_de_passe_provisoire: true },
    });
    if (majErr) return json({ error: majErr.message }, 400);
    return json({ motDePasseProvisoire: provisoire });
  }

  const prenom = (body.prenom || '').trim();
  const nom = (body.nom || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const telephone = body.telephone ? String(body.telephone).trim() : null;

  if (!prenom || !nom) return json({ error: 'Prénom et nom sont requis.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Adresse e-mail invalide.' }, 400);

  let utilisateurId: string;
  let provisoire: string | null = null;
  if (mode === 'mot_de_passe') {
    provisoire = motDePasseProvisoire();
    const { data: cree, error: creeErr } = await supabaseAdmin.auth.admin.createUser({
      email, password: provisoire, email_confirm: true,
      user_metadata: { prenom, nom, mot_de_passe_provisoire: true },
    });
    if (creeErr || !cree.user) {
      return json({ error: creeErr?.message || 'Le compte n’a pas pu être créé.' }, 400);
    }
    utilisateurId = cree.user.id;
  } else {
    const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { prenom, nom },
      redirectTo: Deno.env.get('APP_URL') || undefined,
    });
    if (inviteErr || !invited.user) {
      return json({ error: inviteErr?.message || "Échec de l'envoi de l'invitation." }, 400);
    }
    utilisateurId = invited.user.id;
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: utilisateurId,
      cabinet_id: callerProfile.cabinet_id,
      role: 'collaborateur',
      nom, prenom, email, telephone,
    })
    .select()
    .single();

  if (profileErr) {
    // Ne pas laisser un compte Auth orphelin sans fiche profil.
    await supabaseAdmin.auth.admin.deleteUser(utilisateurId);
    return json({ error: profileErr.message }, 500);
  }

  return json({ profile, motDePasseProvisoire: provisoire });
});
