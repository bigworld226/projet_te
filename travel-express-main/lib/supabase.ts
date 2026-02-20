import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// On essaie de récupérer la clé sous les deux noms possibles
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

let _supabase: any = null;

function getSupabaseClient() {
  if (_supabase) return _supabase;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Env Vars:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    });
    return null;
  }
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export const supabase = new Proxy({}, {
  get: (_target, prop) => {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Les variables d’environnement Supabase sont manquantes.');
    }
    return client[prop as keyof typeof client];
  },
}) as any;

export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Clé de rôle service ou URL Supabase manquante.");
  }
  return createClient(supabaseUrl, serviceRoleKey);
};
