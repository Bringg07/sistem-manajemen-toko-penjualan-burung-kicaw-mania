import Link from "next/link";
import { supabase } from "@/lib/supabase";
import BirdImage from "@/component/BirdImage";
import { STORE } from "@/lib/config";
import {
  Bird,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Star,
  Quote,
  ArrowRight,
} from "lucide-react";

// Konten berubah jarang; cukup revalidasi berkala (bukan force-dynamic)
export const revalidate = 300;

async function getFeaturedBirds() {
  try {
    if (!supabase) return [];
    const { data } = await supabase
      .from("birds")
      .select("id, name, species, price, stock, image_url")
      .is("deleted_at", null)
      .eq("is_hidden", false)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(4);
    return data || [];
  } catch {
    return [];
  }
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Kualitas Terjamin",
    desc: "Semua burung melalui kurasi kesehatan dan siap lomba.",
  },
  {
    icon: Truck,
    title: "Pengiriman Aman",
    desc: "Packing khusus burung hidup dengan garansi sampai sehat.",
  },
  {
    icon: HeartHandshake,
    title: "Konsultasi Perawatan",
    desc: "Gratis konsultasi rutin via WhatsApp untuk pembeli.",
  },
];

const TESTIMONIALS = [
  {
    name: "Budi Santoso",
    city: "Jakarta",
    text: "Murai batu yang saya beli langsung gacor dan sehat. Packing rapi banget, sampai rumah aman.",
  },
  {
    name: "Siti Rahma",
    city: "Bandung",
    text: "Adminnya responsif, konsultasi perawatan rutin distartogram. Recommended buat pemula!",
  },
  {
    name: "Andi Wijaya",
    city: "Surabaya",
    text: "Kacer anakan dari sini sekarang sudah rajin ngekek. Harga transparan, proses mudah.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedBirds();

  return (
    <div className="overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-sky-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
              <Bird size={14} /> {STORE.tagline}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
              Burung Kicau <span className="text-amber-300">Gacor</span>,
              Harga Transparan.
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-lg">
              Murai batu, kacer, lovebird, hingga perkutut pilihan — semua
              terkurasi dan siap menemani hobi kicau mania Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/user"
                className="flex items-center justify-center gap-2 bg-amber-400 text-blue-950 px-8 py-3.5 rounded-2xl font-black shadow-xl hover:bg-amber-300 transition active:scale-95"
              >
                Mulai Belanja <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center justify-center bg-white/10 border border-white/30 px-8 py-3.5 rounded-2xl font-bold hover:bg-white/20 transition backdrop-blur"
              >
                Daftar Akun
              </Link>
            </div>
          </div>

          {/* Ilustrasi hero */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 bg-amber-300/20 rounded-full blur-3xl" />
              <div className="relative w-full h-full bg-white/10 backdrop-blur rounded-[48px] border border-white/20 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                <svg viewBox="0 0 200 200" className="w-52 h-52" fill="none" aria-hidden="true">
                  <path d="M60 70 C45 70 35 82 35 96 L35 118 C35 132 45 144 60 144 L72 144 L90 162 L90 144 C102 140 110 130 110 118 L110 96 C110 82 100 70 85 70 Z" fill="#fbbf24"/>
                  <circle cx="55" cy="92" r="5" fill="#1e3a8a"/>
                  <path d="M35 104 L15 110 L35 116 Z" fill="#f97316"/>
                  <path d="M78 70 C81 54 94 48 108 51 C99 57 96 66 96 74 Z" fill="#f59e0b"/>
                  <path d="M120 150 C150 145 170 125 175 95 C160 105 145 108 135 106 C142 122 138 138 120 150 Z" fill="#ffffff" opacity="0.25"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="h-8 bg-gray-50 dark:bg-slate-900 rounded-t-[48px]" />
      </section>

      {/* ===== BURUNG UNGGULAN ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-2">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Burung Terbaru
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Stok baru yang siap dibawa pulang.
            </p>
          </div>
          <Link href="/user" className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1">
            Lihat Semua <ArrowRight size={16} />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-10 text-center text-gray-400 font-bold">
            Belum ada burung tersedia. Silakan kunjungi katalog kami nanti.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((bird) => (
              <Link
                key={bird.id}
                href={`/bird/${bird.id}`}
                className="group bg-white dark:bg-slate-800 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-slate-700">
                  <BirdImage
                    src={bird.image_url}
                    alt={bird.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{bird.name}</h3>
                  <p className="text-xs italic text-gray-400 truncate">{bird.species}</p>
                  <p className="text-blue-600 font-black mt-2">
                    Rp {bird.price?.toLocaleString("id-ID")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== KEUNGGULAN ===== */}
      <section className="bg-white dark:bg-slate-800 border-y border-gray-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid sm:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center">
              <div className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 p-4 rounded-2xl mb-4">
                <f.icon size={28} />
              </div>
              <h3 className="font-black text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONI ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight text-center mb-2">
          Kata Pelanggan Kami
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-10">
          Ribuan kicau mania sudah percaya pada Kicaw Mania.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm relative">
              <Quote size={32} className="text-blue-100 dark:text-slate-600 absolute top-4 right-5" />
              <div className="flex gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gradient-to-r from-blue-700 to-sky-600 rounded-[40px] p-10 md:p-14 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <h2 className="text-2xl sm:text-4xl font-black mb-4 tracking-tight">
            Siap Menangkan Lomba Bersama Burung Pilihan?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8">
            Kunjungi katalog kami atau chat langsung via WhatsApp untuk konsultasi gratis.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/user" className="bg-white text-blue-800 px-8 py-3.5 rounded-2xl font-black hover:bg-blue-50 transition active:scale-95">
              Jelajahi Katalog
            </Link>
            <a
              href={`https://wa.me/${STORE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-green-600 transition active:scale-95"
            >
              Chat WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
