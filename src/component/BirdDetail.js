"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClientComponent } from "@/lib/supabase";
import BirdImage from "@/component/BirdImage";
import { toggleWishlist, isWishlisted, requestStockAlert } from "@/lib/wishlist";
import { formatRupiah } from "@/lib/config";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Volume2,
  Pause,
  Award,
  Bell,
  Tag,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

export default function BirdDetail({ bird }) {
  const supabase = useMemo(() => createClientComponent(), []);

  const [categories, setCategories] = useState([]);
  const [related, setRelated] = useState([]);

  const [wishlisted, setWishlisted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [alertRequested, setAlertRequested] = useState(false);
  const [toast, setToast] = useState(null);
  const audioRef = useRef(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    setWishlisted(isWishlisted(bird.id));

    // Kategori & burung terkait — hanya relasi milik burung ini
    async function fetchRelations() {
      try {
        const res = await fetch(`/api/bird-categories?bird_id=${bird.id}`);
        const rels = await res.json();
        if (!Array.isArray(rels) || rels.length === 0) return;

        const catRes = await fetch("/api/categories");
        const cats = await catRes.json();
        if (!Array.isArray(cats)) return;

        const myCats = rels
          .map((r) => cats.find((c) => c.id_categories === r.kategori_id))
          .filter(Boolean);
        setCategories(myCats);
        if (myCats.length === 0) return;

        // Burung terkait: kategori sama (query ter-scoped per kategori)
        const relatedRes = await fetch(`/api/bird-categories?kategori_id=${myCats[0].id_categories}`);
        const relatedRels = await relatedRes.json();
        const relatedIds = (Array.isArray(relatedRels) ? relatedRels : [])
          .map((r) => r.bird_id)
          .filter((bid) => bid !== bird.id)
          .slice(0, 4);

        if (relatedIds.length > 0) {
          const { data: relatedData } = await supabase
            .from("birds")
            .select("id, name, species, price, stock, image_url")
            .in("id", relatedIds)
            .is("deleted_at", null)
            .eq("is_hidden", false);
          setRelated(relatedData || []);
        }
      } catch {}
    }
    fetchRelations();
  }, [bird.id, supabase]);

  // Pemutar suara kicau
  useEffect(() => {
    if (!bird.sound_url || typeof Audio === "undefined") return;
    let el;
    try {
      el = new Audio(bird.sound_url);
      el.onended = () => setPlaying(false);
      el.onerror = () => setAudioAvailable(false);
      audioRef.current = el;
      setAudioAvailable(true);
    } catch {}
    return () => {
      if (el) {
        el.pause();
        el.onended = null;
        el.onerror = null;
      }
      audioRef.current = null;
    };
  }, [bird.sound_url]);

  function handleToggleWishlist() {
    const { added } = toggleWishlist(bird);
    setWishlisted(added);
    showToast(added ? "Ditambahkan ke favorit" : "Dihapus dari favorit");
  }

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    } else {
      el.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }

  function handleAddToCart() {
    if (!bird || bird.stock <= 0) return;
    try {
      const savedCart = JSON.parse(localStorage.getItem("activeCartKicaw") || "[]");
      const existing = savedCart.find((item) => item.id === bird.id);
      let next;
      if (existing) {
        if (existing.quantity >= bird.stock) {
          showToast(`Stok hanya tersisa ${bird.stock} ekor`, "error");
          return;
        }
        next = savedCart.map((item) =>
          item.id === bird.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        next = [...savedCart, { ...bird, quantity: 1 }];
      }
      localStorage.setItem("activeCartKicaw", JSON.stringify(next));
      showToast("Masuk ke keranjang!");
    } catch {
      showToast("Gagal menambah ke keranjang", "error");
    }
  }

  function handleNotifyMe() {
    requestStockAlert(bird);
    setAlertRequested(true);
    showToast("Kami akan mengingatkan Anda saat stok tersedia");
  }

  const achievements = bird.achievements
    ? String(bird.achievements)
        .split(/[,\n;]/)
        .map((a) => a.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="bg-gray-50 dark:bg-slate-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          {toast.type === "error" ? (
            <Bell size={20} className="text-red-400" />
          ) : (
            <CheckCircle size={20} className="text-green-400" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <Link href="/user" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 font-bold text-sm mb-6">
          <ArrowLeft size={18} /> Kembali ke Katalog
        </Link>

        <div className="grid md:grid-cols-2 gap-8 bg-white dark:bg-slate-800 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          {/* Foto */}
          <div className="relative h-72 md:h-auto md:min-h-[420px] bg-gray-100 dark:bg-slate-700">
            <BirdImage
              src={bird.image_url}
              alt={bird.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="w-full h-full object-cover"
            />
            {achievements.length > 0 && (
              <div className="absolute top-4 left-4 bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Award size={13} /> Berprestasi
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 sm:p-8 flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {bird.name}
            </h1>
            <p className="text-gray-400 italic mb-4">{bird.species}</p>

            {/* Kategori */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {categories.map((cat) => (
                  <span key={cat.id_categories} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Tag size={10} /> {cat.cat_name}
                  </span>
                ))}
              </div>
            )}

            {/* Prestasi */}
            {achievements.length > 0 && (
              <div className="mb-4 space-y-1.5">
                {achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-bold text-amber-600">
                    <Award size={15} /> {a}
                  </div>
                ))}
              </div>
            )}

            {/* Suara kicau */}
            <div className="mb-5">
              {audioAvailable ? (
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-3 w-full bg-sky-50 dark:bg-sky-900/40 border border-sky-100 dark:border-sky-800 rounded-2xl p-4 hover:border-sky-300 transition group"
                >
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition ${playing ? "bg-red-500" : "bg-sky-500 group-hover:bg-sky-600"}`}>
                    {playing ? <Pause size={20} /> : <Volume2 size={20} />}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-black text-sky-700 dark:text-sky-300">
                      {playing ? "Sedang Berkicau..." : "Putar Suara Kicau"}
                    </span>
                    <span className="block text-xs text-sky-400">Dengarkan dulu sebelum membeli</span>
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 w-full bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 rounded-2xl p-4 opacity-70">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-200 dark:bg-slate-600 text-gray-400">
                    <Volume2 size={20} />
                  </span>
                  <span className="text-sm font-bold text-gray-400">
                    Rekaman suara belum tersedia
                  </span>
                </div>
              )}
            </div>

            {/* Harga & stok */}
            <div className="flex justify-between items-end mb-6 pb-6 border-b border-dashed border-gray-200 dark:border-slate-600">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Harga</p>
                <p className="text-blue-600 font-black text-3xl leading-none">{formatRupiah(bird.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stok</p>
                <p className={`font-bold ${bird.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {bird.stock > 0 ? `${bird.stock} ekor` : "Habis"}
                </p>
              </div>
            </div>

            {/* Aksi */}
            <div className="mt-auto space-y-3">
              {bird.stock > 0 ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95"
                  >
                    <ShoppingCart size={18} /> Tambah ke Keranjang
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    aria-label="Toggle favorit"
                    className={`w-14 rounded-2xl flex justify-center items-center border-2 transition active:scale-95 ${
                      wishlisted
                        ? "bg-red-50 dark:bg-red-900/30 border-red-300 text-red-500"
                        : "border-gray-200 dark:border-slate-600 text-gray-400 hover:text-red-400"
                    }`}
                  >
                    <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNotifyMe}
                  disabled={alertRequested}
                  className="w-full flex justify-center items-center gap-2 bg-amber-400 text-amber-950 py-3.5 rounded-2xl font-black hover:bg-amber-300 transition active:scale-95 disabled:opacity-60"
                >
                  <Bell size={18} /> {alertRequested ? "Notifikasi Aktif" : "Beri Tahu Saya Jika Tersedia"}
                </button>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 font-bold pt-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                Garansi kesehatan 7 hari & konsultasi perawatan gratis
              </div>
            </div>
          </div>
        </div>

        {/* Burung terkait */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-5">Burung Serupa</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/bird/${r.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative h-36 bg-gray-100 dark:bg-slate-700">
                    <BirdImage src={r.image_url} alt={r.name} fill sizes="25vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                    <p className="text-xs text-blue-600 font-black">{formatRupiah(r.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
