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

export async function POST(request) {
  try {
    const supabase = await createSupabaseRouteClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User belum login.',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { items, address, paymentMethod } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item pembelian kosong.',
        },
        { status: 400 }
      );
    }

    if (!address || !address.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Alamat pengantaran wajib diisi.',
        },
        { status: 400 }
      );
    }

    const checkoutItems = items.map((item) => ({
      id: String(item.id),
      quantity: Number(item.quantity || 1),
    }));

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'create_purchase',
      {
        checkout_items: checkoutItems,
        delivery_address: address,
        payment_method_input: paymentMethod || 'Transfer Bank',
      }
    );

    if (rpcError) {
      console.error('RPC checkout error:', rpcError);

      return NextResponse.json(
        {
          success: false,
          error: rpcError.message || 'Gagal memproses pembelian.',
        },
        { status: 400 }
      );
    }

    const purchaseId = rpcData?.[0]?.purchase_id;

    if (!purchaseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID pembelian tidak ditemukan setelah checkout.',
        },
        { status: 400 }
      );
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        id,
        address,
        payment_method,
        payment_status,
        total_price,
        created_at,
        purchase_items (
          id,
          bird_id,
          bird_name,
          bird_species,
          image_url,
          price_at_purchase,
          quantity,
          subtotal
        )
      `)
      .eq('id', purchaseId)
      .eq('user_id', user.id)
      .single();

    if (purchaseError) {
      console.error('Fetch purchase error:', purchaseError);

      return NextResponse.json(
        {
          success: false,
          error: purchaseError.message || 'Gagal mengambil data struk.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase,
    });
  } catch (err) {
    console.error('Checkout API fatal error:', err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Terjadi kesalahan server.',
      },
      { status: 500 }
    );
  }
}