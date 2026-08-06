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
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// 1. GET: Ambil riwayat pesanan milik user
export async function GET() {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return NextResponse.json({ success: false, error: 'User belum login.' }, { status: 401 });

    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id, address, payment_method, payment_status, total_price, created_at,
        purchase_items ( id, bird_id, bird_name, bird_species, image_url, price_at_purchase, quantity, subtotal )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, purchases: data || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. PATCH: User mengonfirmasi pesanan diterima
export async function PATCH(request) {
  try {
    const supabase = await createSupabaseRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ success: false, error: 'User belum login.' }, { status: 401 });

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) return NextResponse.json({ success: false, error: 'ID Pesanan tidak valid.' }, { status: 400 });

    // Pastikan pesanan yang diubah benar-benar milik user tersebut
    const { data: orderData, error: orderError } = await supabase
      .from('purchases')
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (orderError || orderData.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Anda tidak berhak mengubah pesanan ini.' }, { status: 403 });
    }

    // Update status menjadi selesai
    const { error: updateError } = await supabase
      .from('purchases')
      .update({ payment_status: 'selesai' })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: 'Pesanan berhasil diselesaikan.' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}