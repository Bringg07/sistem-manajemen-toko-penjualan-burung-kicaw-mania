import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import PrintButton from '@/component/PrintButton';
import BirdImage from '@/component/BirdImage';
import { shortOrderId, formatRupiah } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Struk #${shortOrderId(id)}` };
}

async function createSupabaseServerClient() {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

export default async function StrukPage({ params }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const isAdmin = String(profile?.role || '').toLowerCase() === 'admin';

  const { data: struk } = await supabase
    .from('purchases')
    .select(
      `
      id, created_at, address, payment_method, payment_status, total_price, user_id,
      profiles (username),
      purchase_items (id, bird_name, bird_species, image_url, price_at_purchase, quantity, subtotal)
    `
    )
    .eq('id', id)
    .maybeSingle();

  // Tidak ada -> 404. Ada tapi bukan milik user (dan bukan admin) -> 404 juga.
  if (!struk || (!isAdmin && struk.user_id !== user.id)) {
    notFound();
  }

  const items = struk.purchase_items || [];

  return (
    <div className="flex justify-center p-10 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 sm:p-8 shadow-lg rounded-2xl border-t-8 border-green-500 w-full max-w-sm font-mono">
        <h2 className="text-center font-bold text-xl">KICAW MANIA</h2>
        <p className="text-center text-xs text-gray-400 mt-1">Struk Pembelian</p>
        <div className="border-b border-dashed my-4"></div>
        <p>No: #{shortOrderId(struk.id)}</p>
        <p>Nama: {struk.profiles?.username || '-'}</p>
        <p>
          Tanggal:{' '}
          {new Date(struk.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <p>Bayar: {(struk.payment_method || '-').toUpperCase()}</p>
        <p>Status: {(struk.payment_status || 'pending').toUpperCase()}</p>
        {struk.address && (
          <p className="break-words">Alamat: {struk.address}</p>
        )}
        <div className="border-b border-dashed my-4"></div>

        {items.length === 0 ? (
          <p className="text-center text-gray-400 italic">
            Item tidak ditemukan.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="w-12 h-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 relative">
                  <BirdImage
                    src={item.image_url}
                    alt={item.bird_name}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{item.bird_name}</p>
                  <p className="text-xs text-gray-400 italic truncate">
                    {item.bird_species}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.quantity} x {formatRupiah(item.price_at_purchase)}
                  </p>
                </div>
                <span className="font-bold whitespace-nowrap">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-b border-dashed my-4"></div>
        <div className="flex justify-between font-bold text-base">
          <span>TOTAL</span>
          <span>{formatRupiah(struk.total_price)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2 items-center">
          <PrintButton />
          <p className="text-center mt-2 text-xs text-gray-400">
            Simpan struk ini sebagai bukti pembelian sah.
          </p>
        </div>
      </div>
    </div>
  );
}
