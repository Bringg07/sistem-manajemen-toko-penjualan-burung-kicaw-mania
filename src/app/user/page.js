"use client";

import { createClientComponent } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  ShoppingCart,
  X,
  Archive,
  Minus,
  Tag,
  CheckCircle,
  Search, 
} from "lucide-react";

export default function KatalogPage() {
  const [birds, setBirds] = useState([]);
  const [birdCategories, setBirdCategories] = useState({});
  const [categories, setCategories] = useState([]); 
  const [deletingId, setDeletingId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk pencarian dan filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // State untuk Pop-up / Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false); 
  const [toast, setToast] = useState({ show: false, message: "", type: "info" }); 
  
  const [selectedBirdId, setSelectedBirdId] = useState(null);
  const [selectedBirdName, setSelectedBirdName] = useState(null);

  // --- STATE KERANJANG ---
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);

  // Fungsi memunculkan Toast Notification
  function showToast(message, type = "error") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  }

  // 1. Ambil data keranjang dari LocalStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("activeCartKicau");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCartItems(parsed);
      } catch (e) {
        console.error("Gagal memuat keranjang:", e);
      }
    }
    setIsInitialLoad(false);
  }, []);

  // 2. Simpan keranjang ke LocalStorage
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem("activeCartKicau", JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialLoad]);

  // 3. Lock Scroll Latar Belakang
  useEffect(() => {
    if (isCartOpen || showDeleteModal || showClearModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => document.body.style.overflow = "unset";
  }, [isCartOpen, showDeleteModal, showClearModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [birdsResponse, categoriesResponse, relationsResponse] = await Promise.all([
          supabase.from("birds").select("*").is('deleted_at', null),
          fetch('/api/categories').then((res) => res.json()),
          fetch('/api/bird-categories').then((res) => res.json()),
        ]);

        if (birdsResponse.error) throw birdsResponse.error;
        setBirds(birdsResponse.data || []);

        const categoriesData = Array.isArray(categoriesResponse) ? categoriesResponse : [];
        setCategories(categoriesData);

        const categoriesById = categoriesData.reduce((acc, cat) => ({ ...acc, [cat.id_categories]: cat }), {});

        const groupedCategories = Array.isArray(relationsResponse)
          ? relationsResponse.reduce((acc, rel) => {
              if (!acc[rel.bird_id]) acc[rel.bird_id] = [];
              const cat = categoriesById[rel.kategori_id];
              if (cat) acc[rel.bird_id].push(cat);
              return acc;
            }, {})
          : {};

        setBirdCategories(groupedCategories);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
          if (profileData) setProfile(profileData);
        }
      } catch (err) { setError(err.message); } finally { setLoading(false); }
    };
    fetchData();
  }, [supabase]);

  const isAdmin = profile?.role?.toLowerCase() === "admin";

  // Filter burung berdasarkan pencarian dan kategori
  const filteredBirds = useMemo(() => {
    return birds.filter((bird) => {
      const matchesSearch =
        bird.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bird.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (birdCategories[bird.id] || []).some((cat) =>
          cat.cat_name.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesCategory = selectedCategory === null || (birdCategories[bird.id] || []).some((cat) => cat.id_categories === selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [birds, searchTerm, selectedCategory, birdCategories]);

  // --- FUNGSI PENGHAPUSAN (Admin) ---
  async function confirmSoftDelete() {
    setDeletingId(selectedBirdId);
    try {
      const res = await fetch("/api/birds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBirdId, mode: "soft" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBirds((prev) => prev.filter((b) => b.id !== selectedBirdId));
        setShowDeleteModal(false);
        showToast("Burung berhasil diarsipkan", "success");
      }
    } catch (err) { showToast(err.message, "error"); } finally { setDeletingId(null); }
  }

  async function confirmHardDelete() {
    setDeletingId(selectedBirdId);
    try {
      const res = await fetch("/api/birds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedBirdId, mode: "hard" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBirds((prev) => prev.filter((b) => b.id !== selectedBirdId));
        setShowDeleteModal(false);
        showToast("Burung berhasil dihapus permanen", "success");
      }
    } catch (err) { showToast(err.message, "error"); } finally { setDeletingId(null); }
  }

  // --- FUNGSI KERANJANG ---
  function updateCartQuantity(bird, delta) {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === bird.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;
        if (newQuantity < 1) return prev.filter((item) => item.id !== bird.id);
        
        if (newQuantity > bird.stock) {
          showToast(`Stok ${bird.name} hanya tersisa ${bird.stock} ekor!`, "error");
          return prev;
        }
        return prev.map((item) => item.id === bird.id ? { ...item, quantity: newQuantity } : item);
      }
      return delta > 0 ? [...prev, { ...bird, quantity: 1 }] : prev;
    });
  }

  function handleClearCartClick() {
    setShowClearModal(true);
  }

  function confirmClearCart() {
    setCartItems([]);
    setShowClearModal(false);
    showToast("Keranjang berhasil dikosongkan", "success");
  }

  function handleContinuePayment() {
    localStorage.setItem("checkoutItems", JSON.stringify(cartItems));
    router.push("/pembayaran");
  }

  const totalHarga = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="bg-gray-50 min-h-screen relative overflow-x-hidden">
      
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          {toast.type === "error" ? <AlertCircle size={20} className="text-red-400" /> : <CheckCircle size={20} className="text-green-400" />}
          <span className="text-sm font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* DRAWER OVERLAY */}
      {isCartOpen && <div className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />}

      {/* MODAL KOSONGKAN KERANJANG */}
      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4"><Trash2 size={32} /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Kosongkan Keranjang?</h3>
              <p className="text-gray-500 mb-8 text-sm">Semua burung yang telah Anda pilih akan dihapus dari pesanan.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowClearModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition">Batal</button>
                <button onClick={confirmClearCart} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg transition">Kosongkan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HAPUS BURUNG */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-4"><AlertCircle size={32} /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arsipkan atau Hapus?</h3>
              <p className="text-gray-500 mb-8 text-sm">Tindakan untuk <strong>{selectedBirdName}</strong>:</p>
              <div className="flex flex-col gap-3 w-full">
                <div className="flex gap-2">
                  <button onClick={confirmSoftDelete} disabled={deletingId !== null} className="flex-1 py-3 bg-yellow-500 text-white font-bold rounded-2xl flex justify-center items-center gap-2">
                    {deletingId === selectedBirdId ? <Loader2 className="animate-spin" size={18} /> : "Arsipkan"}
                  </button>
                  <button onClick={confirmHardDelete} disabled={deletingId !== null} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl flex justify-center items-center gap-2">
                    {deletingId === selectedBirdId ? <Loader2 className="animate-spin" size={18} /> : "Hapus"}
                  </button>
                </div>
                <button onClick={() => setShowDeleteModal(false)} disabled={deletingId !== null} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER & ACTIONS */}
        <div className="flex flex-col mb-8 gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight">Katalog Kicaw</h1>
              <div className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-500 text-white">
                {profile?.role || "user"}
              </div>
            </div>

            <div className="grid grid-cols-2 md:flex items-center gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
              
              {!isAdmin ? (
                // TOMBOL KERANJANG (HANYA UNTUK USER)
                <button onClick={() => setIsCartOpen(true)} className="relative col-span-2 flex justify-center items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md font-bold text-sm w-full md:w-auto">
                  <ShoppingCart size={16} /> Keranjang
                  {cartItems.length > 0 && <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white animate-bounce">{cartItems.length}</span>}
                </button>
              ) : (
                // TOMBOL ADMIN (TIDAK ADA LAGI PESANAN MASUK)
                <>
                  <Link href="/admin/categories" className="flex justify-center items-center bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl transition font-bold text-sm border border-blue-100">Kategori</Link>
                  <Link href="/admin/birds/archived" className="flex justify-center items-center gap-1.5 bg-gray-800 text-white px-4 py-2.5 rounded-xl transition font-bold text-sm"><Archive size={16} /> Arsip</Link>
                  <Link href="/admin/birds" className="col-span-2 md:col-span-1 flex justify-center items-center gap-1.5 bg-green-600 text-white px-5 py-2.5 rounded-xl transition font-bold text-sm shadow-md active:scale-95"><Plus size={18} /> Tambah Burung</Link>
                </>
              )}

            </div>
          </div>

          {/* UI PENCARIAN & FILTER KATEGORI */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            {/* Input Pencarian */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari burung berdasarkan nama atau spesies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            
            {/* Dropdown Filter */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag size={18} className="text-gray-400" />
              </div>
              <select
                value={selectedCategory === null ? "all" : selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : parseInt(e.target.value))}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id_categories} value={cat.id_categories}>
                    {cat.cat_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GRID KATALOG MENGGUNAKAN filteredBirds */}
        {filteredBirds.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-bold text-lg">Tidak ada burung yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBirds.map((bird) => {
              const itemInCart = cartItems.find(item => item.id === bird.id);
              const bCats = birdCategories[bird.id] || [];

              return (
                <div key={bird.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img src={bird.image_url || "https://via.placeholder.com/300x200"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={bird.name} />
                  </div>
                  
                  <div className="p-4 sm:p-5 flex-grow flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-0.5 truncate">{bird.name}</h3>
                    <p className="text-gray-400 text-xs italic mb-3 truncate">{bird.species}</p>
                    
                    {bCats.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {bCats.map((cat, idx) => (
                          <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-bold uppercase tracking-wider border border-indigo-50/50">
                            <Tag size={10} />
                            {cat.cat_name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-end mb-5 mt-auto">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Harga</p>
                        <p className="text-blue-600 font-black text-lg sm:text-xl leading-none">Rp {bird.price?.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Stok</p>
                        <p className={`font-bold text-xs sm:text-sm leading-none ${bird.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>{bird.stock} ekor</p>
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="flex gap-2 mt-auto">
                        <Link href={`/admin/birds/edit/${bird.id}`} className="flex-1 bg-yellow-400 text-white py-2.5 rounded-xl flex justify-center items-center shadow-sm hover:bg-yellow-500 transition active:scale-95">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => {setSelectedBirdId(bird.id); setSelectedBirdName(bird.name); setShowDeleteModal(true);}} className="flex-1 bg-red-100 text-red-600 py-2.5 rounded-xl flex justify-center items-center hover:bg-red-200 transition active:scale-95">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="h-11 mt-auto">
                        {itemInCart ? (
                          <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-600 rounded-xl p-1 h-full">
                            <button onClick={() => updateCartQuantity(bird, -1)} className="w-8 h-8 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 transition"><Minus size={16} /></button>
                            <span className="font-black text-blue-900 text-base">{itemInCart.quantity}</span>
                            <button onClick={() => updateCartQuantity(bird, 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"><Plus size={16} /></button>
                          </div>
                        ) : (
                          <button onClick={() => updateCartQuantity(bird, 1)} disabled={bird.stock <= 0} className={`w-full h-full rounded-xl text-sm font-bold transition-all active:scale-95 ${bird.stock > 0 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200" : "bg-gray-100 text-gray-400"}`}>
                            {bird.stock > 0 ? "Beli Sekarang" : "Stok Habis"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DRAWER KERANJANG */}
      <div className={`fixed right-0 top-0 h-screen w-[90%] sm:w-[380px] bg-white shadow-2xl z-[70] flex flex-col transition-transform duration-500 ease-in-out ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 sm:p-6 border-b flex items-center justify-between bg-blue-900 text-white">
          <div className="flex items-center gap-3"><ShoppingCart size={20} /><h2 className="text-lg sm:text-xl font-black tracking-tight">Keranjang Anda</h2></div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400"><ShoppingCart size={64} className="mb-4 opacity-20" /><p className="font-bold italic">Keranjang kosong</p></div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500">{cartItems.length} Item</span>
                <button onClick={handleClearCartClick} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                  <Trash2 size={14} /> Kosongkan
                </button>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                  <img src={item.image_url} className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-xl shadow-sm" alt="" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                    <p className="text-blue-600 font-black text-xs">Rp {item.price.toLocaleString("id-ID")} x {item.quantity}</p>
                    <p className="text-gray-900 font-bold text-sm mt-1">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</p>
                  </div>
                  <button onClick={() => setCartItems(prev => prev.filter(i => i.id !== item.id))} className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                </div>
              ))}
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-5 sm:p-6 border-t bg-white shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between mb-4 sm:mb-6"><span className="text-gray-400 font-bold uppercase text-xs">Total</span><span className="text-xl sm:text-2xl font-black text-blue-900">Rp {totalHarga.toLocaleString("id-ID")}</span></div>
            <button onClick={handleContinuePayment} className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-2xl font-black shadow-lg transition-all active:scale-95">PROSES PEMBAYARAN</button>
          </div>
        )}
      </div>
    </div>
  );
}   