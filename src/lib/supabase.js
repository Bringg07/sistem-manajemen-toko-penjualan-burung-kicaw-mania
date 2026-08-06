import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = (typeof window === 'undefined')
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : supabase;

export function createClientComponent() {
  if (typeof window === 'undefined') return supabase;

  if (!globalThis.__supabase_browser_client) {
    globalThis.__supabase_browser_client = createBrowserClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  return globalThis.__supabase_browser_client;
}