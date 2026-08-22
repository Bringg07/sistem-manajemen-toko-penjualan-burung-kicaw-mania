import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import {
  ADMIN_STATUS_TRANSITIONS,
  PAYMENT_STATUSES,
  canTransition,
} from '@/lib/config';

export const dynamic = 'force-dynamic';

// ==========================================
// 1. GET: MENGAMBIL SEMUA DATA PESANAN
// ==========================================
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
    const { supabase } = auth;

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
    console.error('[GET /api/admin/orders]', err);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// ==========================================
// 2. PATCH: MENGUPDATE STATUS PESANAN
// ==========================================
export async function PATCH(request) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
    const { supabase } = auth;

    // Ambil data yang dikirim dari frontend (ID Pesanan & Status Baru)
    const body = await request.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap.' }, { status: 400 });
    }

    if (!PAYMENT_STATUSES.includes(String(newStatus).toLowerCase())) {
      return NextResponse.json({ success: false, error: 'Status tidak dikenal.' }, { status: 400 });
    }

    // Ambil status saat ini untuk validasi transisi
    const { data: order, error: orderError } = await supabase
      .from('purchases')
      .select('payment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
    }

    // Whitelist alur status: pending -> diproses -> dikirim -> selesai
    if (!canTransition(ADMIN_STATUS_TRANSITIONS, order.payment_status, newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Perubahan status dari "${order.payment_status}" ke "${newStatus}" tidak diizinkan.`,
        },
        { status: 400 }
      );
    }

    // Update status di tabel purchases
    const { error } = await supabase
      .from('purchases')
      .update({ payment_status: String(newStatus).toLowerCase() })
      .eq('id', orderId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (err) {
    console.error('[PATCH /api/admin/orders]', err);
    return NextResponse.json({ success: false, error: err.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
