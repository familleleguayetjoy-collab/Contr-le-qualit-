// ComplyEC — Edge Function : actes et statuts au registre national des entreprises
//
// Pourquoi une fonction serveur, et pas un appel depuis le navigateur.
//
// L'API du registre national des entreprises s'ouvre avec un identifiant et un
// mot de passe de compte data.inpi.fr, échangés contre un jeton. Ce couple est
// un secret du cabinet : placé dans la page, il serait lisible par n'importe
// quel utilisateur, et tout compte ouvert avec lui serait imputé au cabinet.
// Il reste donc ici, dans les secrets de la fonction, et le navigateur ne voit
// jamais que le résultat.
//
// La seconde raison est technique : l'API ne publie pas d'en-têtes CORS. Un
// appel direct depuis une page servie ailleurs est refusé par le navigateur,
// quoi qu'on fasse côté client.
//
// Déploiement :
//   supabase functions deploy inpi-actes
//   supabase secrets set INPI_USERNAME=... INPI_PASSWORD=...
//
// Les identifiants sont ceux du compte data.inpi.fr du cabinet, après demande
// d'accès aux API « Actes » et « Comptes annuels » depuis l'espace personnel
// (« Mes accès API / SFTP »). Le quota est de 10 000 appels par jour.
//
// Les routes ci-dessous ont été relevées sur la documentation publique de
// l'INPI et sur des intégrations existantes ; la documentation technique de
// l'INPI n'a pas pu être ouverte depuis l'environnement de développement, dont
// la sortie réseau est filtrée. Le premier appel réel les confirmera — et s'il
// les dément, l'erreur remontée dit ce que l'API a répondu, au lieu d'une
// panne muette.

import { createClient } from 'npm:@supabase/supabase-js@2';

const INPI_BASE = 'https://registre-national-entreprises.inpi.fr/api';

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

/* Le jeton vit environ une heure. On le garde le temps que l'instance reste
   chaude : un aller-retour d'authentification par acte téléchargé userait le
   quota pour rien. */
let jetonEnCache: { valeur: string; expireLe: number } | null = null;

async function jetonInpi(): Promise<string> {
  const maintenant = Date.now();
  if (jetonEnCache && jetonEnCache.expireLe > maintenant + 60_000) {
    return jetonEnCache.valeur;
  }

  const username = Deno.env.get('INPI_USERNAME');
  const password = Deno.env.get('INPI_PASSWORD');
  if (!username || !password) {
    throw new Error(
      'Les identifiants INPI ne sont pas installés sur le serveur. '
      + 'Depuis le projet : supabase secrets set INPI_USERNAME=… INPI_PASSWORD=…',
    );
  }

  const reponse = await fetch(`${INPI_BASE}/sso/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    throw new Error(
      reponse.status === 401
        ? 'L’INPI a refusé les identifiants du cabinet.'
        : `L’INPI a répondu ${reponse.status} à l’authentification. ${detail.slice(0, 200)}`,
    );
  }

  const corps = await reponse.json();
  const valeur = corps?.token || corps?.access_token;
  if (!valeur) throw new Error('L’INPI n’a pas renvoyé de jeton.');

  // Prudence : on considère le jeton valable cinquante minutes, sans se fier à
  // une durée que la réponse ne garantit pas.
  jetonEnCache = { valeur, expireLe: maintenant + 50 * 60_000 };
  return valeur;
}

async function appelInpi(chemin: string, binaire = false) {
  const jeton = await jetonInpi();
  const reponse = await fetch(`${INPI_BASE}${chemin}`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });

  if (reponse.status === 401 || reponse.status === 403) {
    // Le jeton a peut-être expiré plus tôt que prévu : un seul nouvel essai.
    jetonEnCache = null;
    const jeton2 = await jetonInpi();
    const seconde = await fetch(`${INPI_BASE}${chemin}`, {
      headers: { Authorization: `Bearer ${jeton2}` },
    });
    if (!seconde.ok) {
      throw new Error(`L’INPI a répondu ${seconde.status} sur ${chemin}.`);
    }
    return binaire ? await seconde.arrayBuffer() : await seconde.json();
  }

  if (reponse.status === 404) {
    throw new Error('Aucun dossier à ce numéro au registre national des entreprises.');
  }
  if (reponse.status === 429) {
    throw new Error('Le quota d’appels à l’INPI est atteint pour aujourd’hui.');
  }
  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '');
    throw new Error(`L’INPI a répondu ${reponse.status} sur ${chemin}. ${detail.slice(0, 200)}`);
  }

  return binaire ? await reponse.arrayBuffer() : await reponse.json();
}

function base64(octets: ArrayBuffer): string {
  const vue = new Uint8Array(octets);
  let binaire = '';
  // Par tranches : String.fromCharCode sur plusieurs mégaoctets d'un coup
  // dépasse la taille maximale de la pile d'appels.
  const pas = 0x8000;
  for (let i = 0; i < vue.length; i += pas) {
    binaire += String.fromCharCode.apply(null, Array.from(vue.subarray(i, i + pas)));
  }
  return btoa(binaire);
}

/* Neuf chiffres, espaces et points ignorés. Un SIRET est accepté : ses neuf
   premiers chiffres sont le SIREN. */
function sirenPropre(brut: string): string | null {
  const chiffres = String(brut || '').replace(/\D/g, '');
  if (chiffres.length !== 9 && chiffres.length !== 14) return null;
  return chiffres.slice(0, 9);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  // L'appelant doit être connecté : la fonction consomme le quota du cabinet,
  // elle n'est pas ouverte à tout venant.
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Non authentifié.' }, 401);

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !user) return json({ error: 'Session invalide.' }, 401);

  let body: { action?: string; siren?: string; type?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête invalide.' }, 400);
  }

  try {
    if (body.action === 'lister') {
      const siren = sirenPropre(body.siren || '');
      if (!siren) return json({ error: 'Numéro SIREN ou SIRET attendu.' }, 400);

      const pieces = await appelInpi(`/companies/${siren}/attachments`);
      /* On ne renvoie que ce qui sert à l'écran : le reste de la réponse de
         l'INPI n'a pas à traverser le réseau ni à être conservé. */
      const reduire = (liste: any[], genre: string) => (Array.isArray(liste) ? liste : []).map((p) => ({
        id: p.id,
        genre,
        nom: p.nomDocument || p.nom || '',
        dateDepot: p.dateDepot || null,
        dateCloture: p.dateCloture || null,
        typeBilan: p.typeBilan || null,
        confidentiel: p.confidentiality === 'Public' ? false : !!p.confidentiality,
      }));

      return json({
        siren,
        actes: reduire(pieces?.actes, 'actes'),
        bilans: reduire(pieces?.bilans, 'bilans'),
      });
    }

    if (body.action === 'telecharger') {
      const genres = ['actes', 'bilans', 'bilansSaisis'];
      if (!genres.includes(String(body.type))) {
        return json({ error: 'Type de pièce inconnu.' }, 400);
      }
      if (!body.id) return json({ error: 'Identifiant de pièce manquant.' }, 400);

      const octets = await appelInpi(`/${body.type}/${body.id}/download`, true) as ArrayBuffer;
      return json({ contenuBase64: base64(octets), typeMime: 'application/pdf' });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (err) {
    // Le message est celui de l'INPI ou celui du défaut de configuration :
    // l'écran doit pouvoir dire ce qui s'est passé, pas « une erreur ».
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
});
