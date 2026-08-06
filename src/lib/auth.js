import { supabaseAdmin } from './supabase';

export async function getUserAndProfileFromRequest(req) {
  try {
    const authHeader = req.headers.get?.('authorization') || req.headers.get?.('Authorization');
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) user = data.user;
    }

    if (!user) {
      const idHeader = req.headers.get?.('x-user-id');
      if (idHeader) user = { id: idHeader };
    }

    if (!user) return { user: null, profile: null };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    return { user, profile };
  } catch (err) {
    return { user: null, profile: null };
  }
}

export async function requireAdmin(req) {
  const { user, profile } = await getUserAndProfileFromRequest(req);
  if (!user || !profile || profile.role !== 'admin') {
    const err = new Error('Forbidden: admin only');
    err.status = 403;
    throw err;
  }

  return { user, profile };
}