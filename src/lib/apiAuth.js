import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Helper keamanan untuk Route Handlers (app/api/*).
 * Memverifikasi user dari cookie session Supabase lalu memeriksa role-nya.
 * Jangan pernah percaya header x-user-id atau body dari client.
 */
export async function getAuthedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, role')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile, supabase };
}

export async function requireAdmin() {
  const { user, profile, supabase } = await getAuthedUser();
  if (!user || !profile || String(profile.role).toLowerCase() !== 'admin') {
    return { ok: false, response: null };
  }
  return { ok: true, user, profile, supabase };
}
