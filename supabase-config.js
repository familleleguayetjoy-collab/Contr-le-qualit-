// ComplyEC — configuration Supabase
//
// La clé "publishable" (clé publique, anciennement "anon key") est conçue
// pour être exposée côté client : elle ne permet que ce que les règles de
// sécurité en base (Row Level Security, voir supabase/schema.sql) autorisent
// pour l'utilisateur connecté. Ce n'est pas un secret.
'use strict';

const SUPABASE_URL = 'https://tnzdopummupchhupzcso.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YcUb5znCEdQJNsY8HofyAg_Mdm84ASm';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
