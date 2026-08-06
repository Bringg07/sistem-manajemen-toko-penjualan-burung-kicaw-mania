import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function createSupabaseRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// ==========================================
// 1. GET: MENGAMBIL SEMUA DATA PESANAN
// ==========================================
export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role?.toLowerCase() !== 'admin') return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id, address, payment_method, payment_status, total_price, created_at, user_id,
        profiles (username),
        purchase_items (id, bird_id, bird_name, bird_species, image_url, price_at_purchase, quantity, subtotal)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, purchases: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// ==========================================
// 2. PATCH: MENGUPDATE STATUS PESANAN
// ==========================================
export async function PATCH(request) {
  try {
    const supabase = await createSupabaseRouteClient();
    
    // Cek Akses Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role?.toLowerCase() !== 'admin') return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });

    // Ambil data yang dikirim dari frontend (ID Pesanan & Status Baru)
    const body = await request.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap.' }, { status: 400 });
    }

    // Update status di tabel purchases
    const { error } = await supabase
      .from('purchases')
      .update({ payment_status: newStatus })
      .eq('id', orderId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}