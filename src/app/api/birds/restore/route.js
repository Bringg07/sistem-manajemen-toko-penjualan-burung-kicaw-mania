import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

function getServerSupabase() {
  if (SERVICE_ROLE_KEY) {
    return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const serverSupabase = getServerSupabase();
    const sb = serverSupabase || supabase;
    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — restore may be blocked by RLS');

    const { data: birdData, error: birdError } = await sb
      .from('birds')
      .select('stock, deleted_at')
      .eq('id', id)
      .single();

    if (birdError) throw birdError;

    if (Number(birdData?.stock || 0) <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Burung dengan stok 0 tidak bisa dipulihkan. Tambahkan stok terlebih dahulu.',
        }),
        { status: 400 }
      );
    }

    const { data, error } = await sb.from('birds').update({ deleted_at: null }).eq('id', id).select();
    if (error) throw error;
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
