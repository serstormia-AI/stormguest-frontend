import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno de Supabase")
}

// Anon client — usado para Realtime subscriptions
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
  db: { schema: 'public' },
})

// Admin client — bypasses RLS for admin panel reads/writes
// Uses service role key (internal admin tool only — not exposed to guests)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    })
  : supabase // fallback to anon if not configured
