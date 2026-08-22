import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, getAuthedUser } from '@/lib/apiAuth';

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

function forbidden() {
  return new Response(JSON.stringify({ success: false, error: 'Akses ditolak: khusus admin.' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Ambil path object Storage dari URL publik bucket bird-images
function getPathFromPublicUrl(url) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/bird-images/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  } catch {
    return null;
  }
}

// Hapus object lama di Storage (best-effort)
async function deleteStorageImage(sb, url) {
  const path = getPathFromPublicUrl(url);
  if (!path) return;
  try {
    await sb.storage.from('bird-images').remove([path]);
  } catch (err) {
    console.warn('[storage] gagal menghapus gambar lama:', err.message);
  }
}

// Sanitasi term pencarian agar tidak merusak sintaks .or() PostgREST
function sanitizeSearchTerm(term) {
  return String(term || '').replace(/[%(),*]/g, ' ').trim();
}

// ==========================================
// GET: Katalog dengan pagination + filter server-side
// ?page=1&per_page=12&search=...&kategori=3
// Admin otomatis melihat burung tersembunyi.
// ==========================================
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
    const perPage = Math.min(48, Math.max(1, parseInt(url.searchParams.get('per_page')) || 12));
    const search = sanitizeSearchTerm(url.searchParams.get('search'));
    const kategoriId = parseInt(url.searchParams.get('kategori')) || null;

    // Role admin boleh melihat item tersembunyi
    let isAdmin = false;
    try {
      const { profile } = await getAuthedUser();
      isAdmin = String(profile?.role || '').toLowerCase() === 'admin';
    } catch {}

    // Filter kategori: kumpulkan dulu bird_id-nya
    let kategoriBirdIds = null;
    if (kategoriId) {
      const { data: rels, error: relError } = await supabase
        .from('bird_categories')
        .select('bird_id')
        .eq('kategori_id', kategoriId);
      if (relError) throw relError;
      kategoriBirdIds = (rels || []).map((r) => r.bird_id);
      if (kategoriBirdIds.length === 0) {
        return new Response(
          JSON.stringify({ data: [], count: 0, page, per_page: perPage, total_pages: 0 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('birds')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Pengunjung umum tidak melihat burung yang disembunyikan admin
    if (!isAdmin) query = query.eq('is_hidden', false);
    if (kategoriBirdIds) query = query.in('id', kategoriBirdIds);
    if (search) {
      query = query.or(`name.ilike.%${search}%,species.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const birds = data || [];
    const totalItems = count || 0;

    // Kategori untuk halaman ini saja (hindari fetch seluruh tabel relasi)
    let groupedCategories = {};
    if (birds.length > 0) {
      const ids = birds.map((b) => b.id);
      const [relsRes, catsRes] = await Promise.all([
        supabase.from('bird_categories').select('*').in('bird_id', ids),
        supabase.from('categories').select('*'),
      ]);
      const categoriesData = Array.isArray(catsRes.data) ? catsRes.data : [];
      const categoriesById = categoriesData.reduce((acc, cat) => ({ ...acc, [cat.id_categories]: cat }), {});
      groupedCategories = (Array.isArray(relsRes.data) ? relsRes.data : []).reduce((acc, rel) => {
        if (!acc[rel.bird_id]) acc[rel.bird_id] = [];
        const cat = categoriesById[rel.kategori_id];
        if (cat) acc[rel.bird_id].push(cat);
        return acc;
      }, {});
    }

    return new Response(
      JSON.stringify({
        data: birds,
        categories_by_bird: groupedCategories,
        count: totalItems,
        page,
        per_page: perPage,
        total_pages: Math.ceil(totalItems / perPage),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[GET /api/birds]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  let insertedBirdId = null;
  let sb = supabase;
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return forbidden();

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
    sb = serverSupabase || supabase;

    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — server operations may be blocked by RLS');

    const { data, error } = await sb.from('birds').insert([
      { name, species, price, stock, image_url: imageUrl, is_hidden: false }
    ]).select().single();
    if (error) throw error;
    insertedBirdId = data?.id;

    if (data?.id && categoryIds.length > 0) {
      const relationRows = categoryIds.map((kategori_id) => ({ bird_id: data.id, kategori_id }));
      const { error: relationError } = await sb.from('bird_categories').insert(relationRows);
      if (relationError) throw relationError;
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    // Kompensasi multi-step write: jika relasi gagal setelah bird dibuat,
    // hapus bird yang barusan dibuat agar tidak ada data yatim.
    if (insertedBirdId) {
      try {
        await sb.from('bird_categories').delete().eq('bird_id', insertedBirdId);
        await sb.from('birds').delete().eq('id', insertedBirdId);
      } catch (cleanupErr) {
        console.error('[POST /api/birds] cleanup gagal:', cleanupErr.message);
      }
    }
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return forbidden();

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

    let imageUrl = oldImageUrl;
    let uploadedFileName = null;
    if (imageFile && imageFile.size > 0) {
      uploadedFileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
      const arrayBuffer = await imageFile.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('bird-images')
        .upload(uploadedFileName, Buffer.from(arrayBuffer), { contentType: imageFile.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('bird-images').getPublicUrl(uploadedFileName);
      imageUrl = data.publicUrl;
    }

    const serverSupabase = getServerSupabase();
    const sb = serverSupabase || supabase;
    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — update may be blocked by RLS');

    const { data, error } = await sb.from('birds')
      .update({ name, species, price, stock, image_url: imageUrl, is_hidden })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Update sukses dengan gambar baru -> hapus object lama dari Storage
    if (uploadedFileName && oldImageUrl && oldImageUrl !== imageUrl) {
      await deleteStorageImage(sb, oldImageUrl);
    }

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return forbidden();

    const body = await request.json();
    const id = body?.id;
    const mode = body?.mode || 'soft'; // 'soft' or 'hard'
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

    const serverSupabase = getServerSupabase();
    const sb = serverSupabase || supabase;
    if (!serverSupabase) console.warn('No SUPABASE_SERVICE_ROLE_KEY found — delete may be blocked by RLS');

    if (mode === 'hard') {
      // Ambil data dulu untuk cleanup relasi + gambar
      const { data: rows } = await sb.from('birds').select('id, image_url').eq('id', id);

      // Bersihkan relasi kategori agar tidak ada baris yatim
      await sb.from('bird_categories').delete().eq('bird_id', id);

      const { data, error } = await sb.from('birds').delete().eq('id', id).select();
      if (error) throw error;

      // Hapus gambar dari Storage (best-effort)
      for (const row of rows || []) {
        await deleteStorageImage(sb, row.image_url);
      }

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
