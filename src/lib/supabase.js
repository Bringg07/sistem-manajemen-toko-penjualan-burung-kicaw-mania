import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

// Guard: hindari crash saat env belum dikonfigurasi (misal saat build)
function safeCreateClient(...args) {
  if (!args[0] || !args[1]) return null;
  try {
    return createClient(...args);
  } catch {
    return null;
  }
}

export const supabase = (typeof window === 'undefined')
  ? safeCreateClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? safeCreateClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : supabase;

export function createClientComponent() {
  if (typeof window === 'undefined') return supabase;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set di .env.local');
    return null;
  }

  if (!globalThis.__supabase_browser_client) {
    globalThis.__supabase_browser_client = createBrowserClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  return globalThis.__supabase_browser_client;
}