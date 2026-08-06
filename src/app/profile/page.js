"use client";

import { useEffect, useState, useMemo } from "react";
import { createClientComponent } from "@/lib/supabase";
import { updateProfile } from "@/lib/action"; 
import { Mail, History, Loader2, CheckCircle, Package, LogOut, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);

  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        
        // 1. Ambil data profil
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // 2. Ambil Histori Transaksi (Tabel purchases, bukan transactions)
        const { data: historyData } = await supabase
          .from("purchases")
          .select(`id, created_at, total_price, payment_status, purchase_items ( bird_name, quantity )`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setHistory(historyData || []);
      }
      setLoading(false);
    }
    fetchProfileData();
  }, [supabase]);

  // Fungsi untuk update profil (termasuk Edit)
  async function handleUpdateProfile(formData) {
    setUpdating(true);
    setMessage({ type: "", text: "" });
    const res = await updateProfile(formData);
    
    if (res.success) {
      setMessage({ type: "success", text: "Profil berhasil diperbarui!" });
      setProfile((prev) => ({ ...prev, username: formData.get("username") }));
      router.refresh(); // Segarkan halaman agar Navbar ikut terupdate
    } else {
      setMessage({ type: "error", text: "Gagal memperbarui: " + res.error });
    }
    setUpdating(false);
  }

  // Fungsi Logout dipisah agar aman
  async function handleUserLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
  if (!user) return <div className="text-center p-20"><Link href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded-xl">Login Dulu</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Tombol Kembali */}
        <div>
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-bold"
          >
            <ArrowLeft size={20} />
            Kembali ke Katalog
          </Link>
        </div>

        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profil Pengguna</h1>
          <p className="text-gray-500 mt-2">Kelola akun dan lihat histori transaksi.</p>
        </div>

        {/* Pesan Sukses / Error Edit Profil */}
        {message.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <CheckCircle size={20} /> {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Kolom Kiri: Tampilan Profil & Form Edit */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full shadow-inner mb-4 flex items-center justify-center text-3xl font-black">
                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {profile?.role || "User"}
                </span>
              </div>

              {/* Form Edit Profil */}
              <form action={handleUpdateProfile} className="space-y-4 mb-6">
                <input type="hidden" name="userId" value={user.id} />
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-500 text-sm italic">
                    <Mail size={14} /> {user.email}
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Username</label>
                  <input
                    type="text"
                    name="username"
                    defaultValue={profile?.username}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                
                <button type="submit" disabled={updating} className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition active:scale-95 disabled:bg-gray-300 flex justify-center">
                  {updating ? <Loader2 className="animate-spin" size={18} /> : "Simpan Perubahan"}
                </button>
              </form>

              {/* Tombol Logout */}
              <button
                onClick={handleUserLogout}
                className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition"
              >
                <LogOut size={18} />
                Keluar dari Akun
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Histori Transaksi Pembelian */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-gray-800">
                  <History size={24} className="text-blue-600" />
                  <h2 className="text-xl font-bold">Histori Terakhir</h2>
                </div>
                <Link href="/riwayat" className="text-xs font-black text-blue-600 uppercase hover:underline">Lihat Semua</Link>
              </div>

              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((order) => (
                    <div key={order.id} className="border border-gray-50 rounded-2xl p-4 flex justify-between items-center bg-gray-50/30 hover:border-blue-100 transition cursor-pointer" onClick={() => router.push(`/struk/${order.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{order.purchase_items?.[0]?.bird_name || "Produk Kicaw"}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-blue-600">Rp {order.total_price?.toLocaleString('id-ID')}</p>
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{order.payment_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center">
                  <Package size={48} className="text-gray-200 mb-4" />
                  <p className="text-gray-400 font-medium italic">Belum ada transaksi di akun ini.</p>
                  <Link href="/user" className="mt-4 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">Mulai Belanja</Link>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}