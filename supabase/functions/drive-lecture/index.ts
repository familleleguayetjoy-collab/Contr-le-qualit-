// ComplyEC — Edge Function : lecture du Drive du cabinet (Google Drive)
//
// LECTURE SEULE. Elle liste les dossiers clients et leurs fichiers, pour que
// l'expert-comptable rattache une pièce trouvée à l'anomalie qu'elle règle.
// Elle ne crée, ne renomme, ne déplace et ne supprime rien : la portée
// demandée à Google est « drive.readonly ».
//
// Le compte qui lit est un « compte de service » Google du cabinet. Il ne voit
// que ce qu'on a partagé avec lui (le dossier racine des clients, en lecture).
// Sa clé ne quitte jamais le serveur (secret GOOGLE_COMPTE_SERVICE).
//
// Secrets à définir (Edge Functions › Secrets) :
//   GOOGLE_COMPTE_SERVICE  — le fichier JSON de la clé du compte de service,
//                            tel quel, ou encodé en base64 ;
//   DRIVE_RACINE_ID        — l'identifiant du dossier qui contient un dossier
//                            par client (la fin de son adresse dans le Drive).
// La clé serveur Supabase est lue comme dans invite-collaborateur.
//
// Actions (corps JSON { action, ... }) :
//   tester    → { racine, dossiers, compte }
//   dossiers  → { dossiers: [{ id, nom }] }
//   fichiers  → { fichiers: [{ id, nom, chemin, type, modifie, lien }] } pour { dossierId }

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function b64url(octets: Uint8Array): string {
  let s = '';
  octets.forEach(o => { s += String.fromCharCode(o); });
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function compteDeService(): { client_email: string; private_key: string } {
  const brut = (Deno.env.get('GOOGLE_COMPTE_SERVICE') || '').trim();
  if (!brut) throw new Error('Secret GOOGLE_COMPTE_SERVICE absent : voir le guide du Drive.');
  const texte = brut.startsWith('{') ? brut : new TextDecoder().decode(Uint8Array.from(atob(brut), c => c.charCodeAt(0)));
  const sa = JSON.parse(texte);
  if (!sa.client_email || !sa.private_key) throw new Error('Le secret GOOGLE_COMPTE_SERVICE n’est pas une clé de compte de service.');
  return sa;
}

async function jetonGoogle(): Promise<{ jeton: string; compte: string }> {
  const sa = compteDeService();
  const t = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const entree = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))) + '.'
    + b64url(enc.encode(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: t, exp: t + 3600,
    })));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const cle = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cle, enc.encode(entree)));
  const rep = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: entree + '.' + b64url(signature) }),
  });
  const j = await rep.json();
  if (!rep.ok) throw new Error('Google refuse la connexion du compte de service : ' + (j.error_description || j.error || rep.status));
  return { jeton: j.access_token, compte: sa.client_email };
}

type Fichier = { id: string; name: string; mimeType: string; modifiedTime?: string; webViewLink?: string };
const DOSSIER = 'application/vnd.google-apps.folder';

async function enfants(jeton: string, parent: string): Promise<Fichier[]> {
  const tous: Fichier[] = [];
  let page = '';
  do {
    const q = encodeURIComponent(`'${parent.replace(/'/g, '')}' in parents and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}`
      + '&fields=nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink)'
      + '&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives'
      + (page ? '&pageToken=' + encodeURIComponent(page) : '');
    const rep = await fetch(url, { headers: { Authorization: 'Bearer ' + jeton } });
    const j = await rep.json();
    if (!rep.ok) throw new Error('Lecture du Drive refusée : ' + ((j.error && j.error.message) || rep.status));
    (j.files || []).forEach((f: Fichier) => tous.push(f));
    page = j.nextPageToken || '';
  } while (page);
  return tous;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);
  const cleServeur = Deno.env.get('COMPLYEC_CLE_SERVEUR') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!cleServeur) return json({ error: 'Clé serveur absente : enregistrez la clé secrète du projet dans le secret COMPLYEC_CLE_SERVEUR.' }, 500);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, cleServeur);
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return json({ error: 'Session invalide.' }, 401);
  const { data: profil } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profil) return json({ error: 'Profil introuvable.' }, 403);
  // Pour le pilote, seule l'expert-comptable lit le Drive depuis ComplyEC.
  if (profil.role !== 'expert_comptable') return json({ error: 'La lecture du Drive est réservée à l’expert-comptable.' }, 403);

  let body: { action?: string; dossierId?: string };
  try { body = await req.json(); } catch { return json({ error: 'Corps de requête invalide.' }, 400); }
  const racine = (Deno.env.get('DRIVE_RACINE_ID') || '').trim();
  if (!racine) return json({ error: 'Secret DRIVE_RACINE_ID absent : voir le guide du Drive.' }, 500);

  try {
    const { jeton, compte } = await jetonGoogle();

    if (body.action === 'tester' || body.action === 'dossiers') {
      const liste = (await enfants(jeton, racine)).filter(f => f.mimeType === DOSSIER)
        .map(f => ({ id: f.id, nom: f.name }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      if (body.action === 'dossiers') return json({ dossiers: liste });
      const rep = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(racine)}?fields=name&supportsAllDrives=true`,
        { headers: { Authorization: 'Bearer ' + jeton } });
      const r = await rep.json();
      return json({ racine: r.name || racine, dossiers: liste.length, compte });
    }

    if (body.action === 'fichiers') {
      const depart = String(body.dossierId || '');
      if (!depart) return json({ error: 'Dossier non précisé.' }, 400);
      // Parcours en largeur, cinq niveaux et deux mille fichiers au plus :
      // un dossier client n'en contient pas davantage, et la limite protège
      // d'une racine choisie par erreur.
      const fichiers: { id: string; nom: string; chemin: string; type: string; modifie: string | null; lien: string | null }[] = [];
      const file: { id: string; chemin: string; niveau: number }[] = [{ id: depart, chemin: '', niveau: 0 }];
      while (file.length && fichiers.length < 2000) {
        const courant = file.shift()!;
        for (const f of await enfants(jeton, courant.id)) {
          const chemin = courant.chemin ? courant.chemin + '/' + f.name : f.name;
          if (f.mimeType === DOSSIER) {
            if (courant.niveau < 5) file.push({ id: f.id, chemin, niveau: courant.niveau + 1 });
          } else {
            fichiers.push({ id: f.id, nom: f.name, chemin, type: f.mimeType, modifie: f.modifiedTime || null, lien: f.webViewLink || null });
          }
        }
      }
      return json({ fichiers, tronque: fichiers.length >= 2000 });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
