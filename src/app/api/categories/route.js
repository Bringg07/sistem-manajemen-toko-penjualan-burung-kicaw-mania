import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      // Mengurutkan berdasarkan ID agar urutan di tabel konsisten
      .order('id_categories', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    // Mengembalikan array kosong jika error agar frontend tidak crash saat .map()
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req) {
  try {
    // 1. Proteksi Admin
    const authCheck = await requireAdmin(req);
    if (!authCheck?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Parsing Body
    const body = await req.json();
    const { cat_name, cat_desc, habitat } = body;

    // 3. Validasi Input Minimal
    if (!cat_name || cat_name.trim() === "") {
      return new Response(JSON.stringify({ error: 'Nama kategori wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Insert ke Database
    const { data, error } = await supabase
      .from('categories')
      .insert([
        { 
          cat_name: cat_name.trim(), 
          cat_desc: cat_desc?.trim() || null, 
          habitat: habitat?.trim() || null 
        }
      ])
      .select()
      .single();

    if (error) {
      // Menangani error jika nama kategori duplikat (jika ada constraint UNIQUE)
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Nama kategori sudah ada' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw error;
    }

    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // Penanganan error forbidden dari requireAdmin
    if (err.status === 403) {
      return new Response(JSON.stringify({ error: 'Akses ditolak: Hanya admin yang diizinkan' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[POST /api/categories]', err);
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan internal server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}