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

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const showDeleted = url.searchParams.get('show_deleted') === 'true';

    let query = supabase.from('birds').select('*').order('created_at', { ascending: false });
    if (!showDeleted) query = query.is('deleted_at', null);

    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name');
    const species = formData.get('species');
    const price = parseFloat(formData.get('price')) || 0;
    const stock = parseInt(formData.get('stock')) || 0;
    const imageFile = formData.get('image_file');
    const categoryIdsRaw = formData.get('category_ids') || '[]';
    let categoryIds = [];

    try {
      const parsed = JSON.parse(categoryIdsRaw);
      if (Array.isArray(parsed)) {
        categoryIds = parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id));
      }
    } catch {
      categoryIds = [];
    }

    // request payload logged removed to avoid terminal output

    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const arrayBuffer = await imageFile.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('bird-images')
        .upload(fileName, Buffer.from(arrayBuffer), { contentType: imageFile.type });
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('bird-images').getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const serverSupabase = getServerSupabase();
    const sb = serverSupabase || supabase;

    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — server operations may be blocked by RLS');

    const { data, error } = await sb.from('birds').insert([
      { name, species, price, stock, image_url: imageUrl, is_hidden: false }
    ]).select().single();
    // Supabase INSERT result logging removed
    if (error) throw error;

    if (data?.id && categoryIds.length > 0) {
      const relationRows = categoryIds.map((kategori_id) => ({ bird_id: data.id, kategori_id }));
      const { error: relationError } = await sb.from('bird_categories').insert(relationRows);
      if (relationError) throw relationError;
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const name = formData.get('name');
    const species = formData.get('species');
    const price = parseFloat(formData.get('price')) || 0;
    const stock = parseInt(formData.get('stock')) || 0;
    const is_hidden = formData.get('is_hidden') === 'on' || formData.get('is_hidden') === 'true';
    const imageFile = formData.get('image_file');
    const oldImageUrl = formData.get('old_image_url') || '';

    // request payload logged removed to avoid terminal output

    let imageUrl = oldImageUrl;
    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const arrayBuffer = await imageFile.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('bird-images')
        .upload(fileName, Buffer.from(arrayBuffer), { contentType: imageFile.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('bird-images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const serverSupabase = getServerSupabase();
    const sb = serverSupabase || supabase;
    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — update may be blocked by RLS');

    const { data, error } = await sb.from('birds')
      .update({ name, species, price, stock, image_url: imageUrl, is_hidden })
      .eq('id', id)
      .select();

    // Supabase UPDATE result logging removed

    if (error) throw error;
    // If data is empty array, likely RLS or id mismatch
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const id = body?.id;
    const mode = body?.mode || 'soft'; // 'soft' or 'hard'
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const serverSupabase = getServerSupabase();
    const sb = serverSupabase || supabase;
    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — delete may be blocked by RLS');

    if (mode === 'hard') {
      const { data, error } = await sb.from('birds').delete().eq('id', id).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    // Soft delete: set deleted_at timestamp
    const deletedAt = new Date().toISOString();
    const { data, error } = await sb.from('birds').update({ deleted_at: deletedAt }).eq('id', id).select();
    if (error) throw error;
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
