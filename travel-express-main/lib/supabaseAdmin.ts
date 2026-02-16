
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization to avoid errors on import if env vars are missing
let _supabaseAdmin: any = null;

export const getSupabaseAdminClient = () => {
  if (_supabaseAdmin) return _supabaseAdmin;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("⚠️ Supabase env vars not configured. Storage operations will fail.");
    return null;
  }

  _supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  
  return _supabaseAdmin;
};

// For backwards compatibility
export const supabaseAdmin = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabaseAdminClient();
    if (!client) {
      console.warn(`⚠️ Supabase not available for operation: ${String(prop)}`);
      return null;
    }
    return (client as any)[prop];
  },
});