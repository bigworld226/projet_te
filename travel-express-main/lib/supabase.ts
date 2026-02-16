import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// On essaie de récupérer la clé sous les deux noms possibles
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Env Vars:", { 
    url: !!supabaseUrl, 
    key: !!supabaseAnonKey 
  });
  throw new Error('Les variables d’environnement Supabase sont manquantes.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Clé de rôle service manquante.");
  return createClient(supabaseUrl, serviceRoleKey);
};