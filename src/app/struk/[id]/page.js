import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function StrukPage({ params }) {
  const { id } = await params;
  const { data: struk } = await supabase
    .from('transactions')
    .select(`
      id, created_at,
      profiles:user_id(username),
      birds:bird_id(id, name, species, price)
    `)
    .eq('id', id)
    .single();

  if (!struk) {
    notFound();
  }

  return (
    <div className="flex justify-center p-10 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 shadow-lg border-t-8 border-green-500 w-80 font-mono">
        <h2 className="text-center font-bold text-xl">KICAW MANIA</h2>
        <div className="border-b border-dashed my-4"></div>
        <p>No: TX-{struk.id}</p>
        <p>Nama: {struk.profiles.username}</p>
        <div className="border-b border-dashed my-4"></div>
        <p className="font-bold">{struk.birds.name}</p>
        <div className="flex justify-between">
          <span>1x Harga</span>
          <span>Rp {struk.birds.price.toLocaleString()}</span>
        </div>
        <div className="border-b border-dashed my-4"></div>
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>Rp {struk.birds.price.toLocaleString()}</span>
        </div>
        <p className="text-center mt-8 text-xs">Simpan struk ini sebagai bukti pembelian sah.</p>
      </div>
    </div>
  );
}