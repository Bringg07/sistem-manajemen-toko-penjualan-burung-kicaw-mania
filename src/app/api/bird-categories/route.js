import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

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

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[GET /api/bird-categories]', err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    const authCheck = await requireAdmin(req);
    if (!authCheck?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { bird_id, kategori_id } = body;
    if (!bird_id || !kategori_id) {
      return new Response(JSON.stringify({ error: 'bird_id and kategori_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('bird_categories')
      .insert([{ bird_id, kategori_id }]);
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err.status === 403) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[POST /api/bird-categories]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(req) {
  try {
    const authCheck = await requireAdmin(req);
    if (!authCheck?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { bird_id, kategori_id } = body;
    if (!bird_id || !kategori_id) {
      return new Response(JSON.stringify({ error: 'bird_id and kategori_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('bird_categories')
      .delete()
      .match({ bird_id, kategori_id });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    if (err.status === 403) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[DELETE /api/bird-categories]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}