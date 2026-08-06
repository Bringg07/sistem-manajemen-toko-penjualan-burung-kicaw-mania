'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  MapPin,
  Receipt,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

export default function PembayaranPage() {
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [alamat, setAlamat] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState('Transfer Bank');
  const [verifying, setVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedItems = localStorage.getItem('checkoutItems');

    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (err) {
        console.error('Gagal membaca data checkout:', err.message);
        setItems([]);
      }
    }
  }, []);

  const totalHarga = items.reduce((total, item) => {
    return total + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  async function handleBayar() {
    if (!alamat.trim()) {
      alert('Alamat pengantaran wajib diisi.');
      return;
    }

    if (items.length === 0) {
      alert('Tidak ada item yang dibeli.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          address: alamat,
          paymentMethod: metodePembayaran,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Pembayaran gagal diproses.');
      }

      setReceipt(json.purchase);
      setPaymentSuccess(true);
      localStorage.removeItem('checkoutItems');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setVerifying(false);
    }
  }

  if (items.length === 0 && !paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-md text-center max-w-md w-full border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Tidak Ada Item Pembayaran
          </h1>

          <p className="text-gray-500 mb-6">
            Silakan pilih burung dari halaman katalog terlebih dahulu.
          </p>

          <button
            onClick={() => router.push('/user')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess && receipt) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={46} />
            </div>

            <p className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm uppercase mb-3">
              Status Pembayaran Telah Diterima
            </p>

            <h1 className="text-3xl font-extrabold text-gray-800">
              Struk Pembelian
            </h1>

            <p className="text-gray-500 mt-2">
              Pembayaran berhasil diverifikasi dan data pembelian telah tersimpan.
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-800 font-bold">
              <Receipt size={20} />
              <h2>Barang yang Dibeli</h2>
            </div>

            <div className="space-y-3">
              {receipt.purchase_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"
                >
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {item.bird_name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {item.bird_species} - {item.quantity} ekor
                    </p>
                  </div>

                  <p className="font-bold text-blue-700">
                    Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold">
              <MapPin size={20} />
              <h2>Alamat Pengantaran</h2>
            </div>

            <p className="text-gray-700">{receipt.address}</p>
          </div>

          <div className="mb-6 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-gray-800 font-bold">
              <CreditCard size={20} />
              <h2>Metode Pembayaran</h2>
            </div>

            <p className="text-gray-700">{receipt.payment_method}</p>
          </div>

          <div className="border-t pt-5 flex justify-between items-center">
            <p className="text-gray-500 font-semibold">Total Pembayaran</p>

            <p className="text-2xl font-extrabold text-blue-800">
              Rp {Number(receipt.total_price || 0).toLocaleString('id-ID')}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/riwayat')}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
            >
              Lihat Riwayat Pembelian
            </button>

            <button
              onClick={() => router.push('/user')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Kembali ke Katalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-700 font-semibold mb-6 hover:underline"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        <h1 className="text-3xl font-extrabold text-blue-900 mb-8">
          Halaman Pembayaran
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-xl">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-md border border-gray-100">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">
                  Alamat Pengantaran
                </h2>
              </div>

              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                rows={5}
                placeholder="Masukkan alamat lengkap pengantaran..."
                className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold text-gray-800">
                  Metode Pembayaran
                </h2>
              </div>

              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Virtual Account">Virtual Account</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="COD - Bayar di Tempat">
                  COD - Bayar di Tempat
                </option>
              </select>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-2xl p-4 text-yellow-800 text-sm">
              Pembayaran ini hanya simulasi. Saat tombol bayar diklik, sistem
              akan menyimpan data pembelian ke database dan mengurangi stok
              burung sesuai jumlah pembelian.
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-5">
              Ringkasan Pesanan
            </h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={
                      item.image_url ||
                      'https://via.placeholder.com/100x100?text=No+Image'
                    }
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.name}</h3>

                    <p className="text-sm text-gray-500">
                      {item.quantity} ekor
                    </p>

                    <p className="text-sm font-bold text-blue-700">
                      Rp{' '}
                      {(
                        Number(item.price || 0) * Number(item.quantity || 1)
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-5 flex justify-between items-center mb-6">
              <p className="text-gray-500 font-semibold">Total</p>

              <p className="text-xl font-extrabold text-blue-800">
                Rp {totalHarga.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              onClick={handleBayar}
              disabled={verifying}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-60 flex justify-center items-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Memverifikasi...
                </>
              ) : (
                'Bayar'
              )}
            </button>

            <p className="text-xs text-gray-400 mt-4 text-center">
              Data pembayaran akan diproses melalui backend aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}