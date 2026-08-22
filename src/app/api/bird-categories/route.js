import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/apiAuth';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const bird_id = url.searchParams.get('bird_id');
    const kategori_id = url.searchParams.get('kategori_id');

    let query = supabase.from('bird_categories').select('bird_id, kategori_id, created_at');
    if (bird_id) query = query.eq('bird_id', bird_id);
    if (kategori_id) query = query.eq('kategori_id', kategori_id);

    const { data, error } = await query;
    if (error) throw error;

    return json(data || []);
  } catch (err) {
    console.error('[GET /api/bird-categories]', err);
    return json([]);
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return json({ error: 'Akses ditolak: khusus admin.' }, 403);

    const body = await req.json();
    const { bird_id, kategori_id } = body;
    if (!bird_id || !kategori_id) {
      return json({ error: 'bird_id and kategori_id required' }, 400);
    }

    const { data, error } = await supabase
      .from('bird_categories')
      .insert([{ bird_id, kategori_id }]);
    if (error) throw error;

    return json(data, 201);
  } catch (err) {
    console.error('[POST /api/bird-categories]', err);
    return json({ error: err.message }, 500);
  }
}

export async function DELETE(req) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return json({ error: 'Akses ditolak: khusus admin.' }, 403);

    const body = await req.json();
    const { bird_id, kategori_id } = body;
    if (!bird_id || !kategori_id) {
      return json({ error: 'bird_id and kategori_id required' }, 400);
    }

    const { error } = await supabase
      .from('bird_categories')
      .delete()
      .match({ bird_id, kategori_id });
    if (error) throw error;

    return json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/bird-categories]', err);
    return json({ error: err.message }, 500);
  }
}
