import Link from "next/link";

export default function HomePage() {
  return (
    // Tambahkan px-4 agar konten tidak menempel ke tepi layar di HP
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 py-10">
      
      {/* Ukuran font dinamis: text-3xl di HP, text-5xl di Laptop. leading-snug mencegah teks bertumpukan */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 leading-snug">
        Selamat Datang di Kicaw Mania
      </h1>
      
      {/* Ukuran font deskripsi disesuaikan: text-base di HP, text-lg di Laptop */}
      <p className="text-gray-600 text-base md:text-lg mb-8 max-w-2xl">
        Temukan berbagai jenis burung kicau berkualitas dengan sistem manajemen transparan dan terpercaya.
      </p>
      
      {/* Perbaikan Tombol: 
        1. flex-col membuat tombol berbaris ke bawah di HP.
        2. sm:flex-row membuat tombol berbaris menyamping di layar yang lebih besar.
        3. gap-4 memberikan jarak aman antar tombol.
        4. w-full membuat tombol selebar layar HP, sm:w-auto mengembalikannya ke ukuran normal di Laptop.
      */}
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
        <Link 
          href="/user" 
          className="w-full sm:w-auto flex items-center justify-center bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-800 transition"
        >
          Mulai Belanja
        </Link>
        <Link 
          href="/auth/signup" 
          className="w-full sm:w-auto flex items-center justify-center bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
        >
          Daftar Akun
        </Link>
      </div>

    </div>
  );
}