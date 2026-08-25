// ComplyEC — Edge Function : invitation d'un collaborateur
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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

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

  let body: { prenom?: string; nom?: string; email?: string; telephone?: string | null };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }

  const prenom = (body.prenom || '').trim();
  const nom = (body.nom || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const telephone = body.telephone ? String(body.telephone).trim() : null;

  if (!prenom || !nom) return json({ error: 'Prénom et nom sont requis.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Adresse e-mail invalide.' }, 400);

  const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { prenom, nom },
    redirectTo: Deno.env.get('APP_URL') || undefined,
  });
  if (inviteErr || !invited.user) {
    return json({ error: inviteErr?.message || "Échec de l'envoi de l'invitation." }, 400);
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: invited.user.id,
      cabinet_id: callerProfile.cabinet_id,
      role: 'collaborateur',
      nom, prenom, email, telephone,
    })
    .select()
    .single();

  if (profileErr) {
    // Ne pas laisser un compte Auth orphelin sans fiche profil.
    await supabaseAdmin.auth.admin.deleteUser(invited.user.id);
    return json({ error: profileErr.message }, 500);
  }

  return json({ profile });
});
