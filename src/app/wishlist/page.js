"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BirdImage from "@/component/BirdImage";
import { getWishlist, removeFromWishlist, toggleWishlist } from "@/lib/wishlist";
import { formatRupiah } from "@/lib/config";
import {
  Heart,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const router = useRouter();

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    setItems(getWishlist());
    setLoading(false);
  }, []);

  function handleRemove(birdId) {
    const next = removeFromWishlist(birdId);
    setItems(next);
    showToast("Dihapus dari favorit");
  }

  function handleAddToCart(bird) {
    try {
      const savedCart = JSON.parse(localStorage.getItem("activeCartKicaw") || "[]");
      if (savedCart.some((item) => item.id === bird.id)) {
        showToast("Sudah ada di keranjang");
        return;
      }
      savedCart.push({ ...bird, quantity: 1 });
      localStorage.setItem("activeCartKicaw", JSON.stringify(savedCart));
      showToast("Masuk ke keranjang!");
      router.refresh();
    } catch {
      showToast("Gagal menambah ke keranjang");
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle size={20} className="text-green-400" />
          <span className="text-sm font-bold">{toast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <Link
          href="/user"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold text-sm mb-6"
        >
          <ArrowLeft size={18} /> Kembali ke Katalog
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-50 text-red-500 p-3 rounded-2xl">
            <Heart size={26} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Favorit Saya</h1>
            <p className="text-sm text-gray-400 font-medium">
              {items.length > 0 ? `${items.length} burung tersimpan` : "Belum ada burung favorit"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold italic">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Heart size={56} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold text-lg mb-1">Daftar favorit masih kosong.</p>
            <p className="text-gray-400 text-sm mb-6">Tekan ikon hati pada burung yang kamu sukai di halaman detail.</p>
            <Link
              href="/user"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition"
            >
              Jelajahi Katalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((bird) => (
              <div
                key={bird.id}
                className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group"
              >
                <Link href={`/bird/${bird.id}`} className="relative h-48 w-full overflow-hidden bg-gray-100 block">
                  <BirdImage
                    src={bird.image_url}
                    alt={bird.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="p-4 sm:p-5 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5 truncate">
                    <Link href={`/bird/${bird.id}`} className="hover:text-blue-600 transition-colors">
                      {bird.name}
                    </Link>
                  </h3>
                  <p className="text-gray-400 text-xs italic mb-4 truncate">{bird.species}</p>

                  <p className="text-blue-600 font-black text-xl mt-auto mb-4">{formatRupiah(bird.price)}</p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(bird)}
                      className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition active:scale-95 disabled:bg-gray-100 disabled:text-gray-400"
                      disabled={(bird.stock ?? 0) <= 0}
                    >
                      <ShoppingCart size={15} />
                      {(bird.stock ?? 0) > 0 ? "Keranjang" : "Stok Habis"}
                    </button>
                    <button
                      onClick={() => handleRemove(bird.id)}
                      aria-label={`Hapus ${bird.name} dari favorit`}
                      className="bg-red-50 text-red-500 px-3.5 rounded-xl hover:bg-red-100 transition active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
