"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  ArrowLeft, Loader2, PackageSearch, CheckCircle2, 
  Clock, Truck, MapPin, CreditCard, Package, 
  AlertTriangle, X, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight 
} from "lucide-react";
import Link from "next/link";

export default function RiwayatPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk expand kartu
  const [expandedOrders, setExpandedOrders] = useState({});

  // State untuk Fitur Search, Filter, Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // State untuk Modal Konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [finishingId, setFinishingId] = useState(null);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showConfirmModal]);

  async function fetchMyOrders() {
    try {
      setLoading(true);
      const res = await fetch('/api/purchases'); 
      const data = await res.json();
      if (data.success) {
        setOrders(data.purchases || []);
      } else {
        setError(data.error || "Gagal mengambil riwayat pesanan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // --- LOGIKA FILTERING & SORTING ---
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((order) => {
        const matchId = order.id.toLowerCase().includes(lowerSearch);
        const matchBird = order.purchase_items?.some(item => (item.bird_name || "").toLowerCase().includes(lowerSearch));
        return matchId || matchBird;
      });
    }
    if (statusFilter !== "all") {
      result = result.filter((order) => {
        const status = (order.payment_status || "pending").toLowerCase();
        if (statusFilter === "success") return ["success", "paid", "telah diterima", "selesai"].includes(status);
        if (statusFilter === "pending") return ["pending", "belum dibayar", "diproses"].includes(status);
        if (statusFilter === "dikirim") return status === "dikirim";
        return true;
      });
    }
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "highest") return b.total_price - a.total_price;
      if (sortBy === "lowest") return a.total_price - b.total_price;
      return 0;
    });
    return result;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // --- LOGIKA DATA PAGINATION ---
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  const openConfirmModal = (e, orderId) => {
    e.stopPropagation();
    setSelectedOrderId(orderId);
    setShowConfirmModal(true);
  };

  async function handleSelesaikanPesanan() {
    try {
      setFinishingId(selectedOrderId);
      const res = await fetch('/api/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrderId })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === selectedOrderId ? { ...o, payment_status: 'selesai' } : o));
        setShowConfirmModal(false);
      }
    } catch (err) { alert("Gagal mengonfirmasi pesanan."); } finally {
      setFinishingId(null);
      setSelectedOrderId(null);
    }
  }

  const getStatusStyle = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (["success", "paid", "telah diterima", "selesai"].includes(s)) 
      return { color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: <CheckCircle2 size={16} />, text: "Selesai" };
    if (s === "diproses") 
      return { color: "bg-blue-50 text-blue-600 border-blue-200", icon: <Package size={16} />, text: "Diproses" };
    if (s === "dikirim") 
      return { color: "bg-purple-50 text-purple-600 border-purple-200", icon: <Truck size={16} />, text: "Dikirim" };
    return { color: "bg-amber-50 text-amber-600 border-amber-200", icon: <Clock size={16} />, text: "Pending" };
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen relative overflow-x-hidden">
      
      {/* MODAL KONFIRMASI */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowConfirmModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-6"><AlertTriangle size={40} /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Konfirmasi Selesai?</h3>
              <div className="bg-slate-50 p-4 rounded-2xl mb-8 text-left border border-slate-100">
                <p className="text-xs leading-relaxed text-slate-500 font-medium">Pastikan burung diterima sehat. Transaksi tidak dapat dibatalkan setelah ini.</p>
              </div>
              <button onClick={handleSelesaikanPesanan} disabled={finishingId !== null} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95">
                {finishingId ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                Ya, Pesanan Diterima
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/user" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-4 font-bold text-sm">
            <ArrowLeft size={18} /> Kembali ke Katalog
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Riwayat Pesanan Saya</h1>
        </div>

        {/* CONTROLS: Dirapikan menjadi Grid di Mobile */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-200 mb-8 flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari No. Pesanan atau Nama Burung..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer">
              <option value="all">Semua Status</option>
              <option value="pending">Proses</option>
              <option value="dikirim">Dikirim</option>
              <option value="success">Selesai</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Termahal</option>
              <option value="lowest">Termurah</option>
            </select>
            <div className="col-span-2 sm:col-span-1 flex items-center bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-100">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Baris:</span>
               <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-transparent border-none text-sm font-bold text-gray-700 outline-none cursor-pointer flex-1 w-full">
                 <option value={5}>5</option>
                 <option value={10}>10</option>
                 <option value={20}>20</option>
               </select>
            </div>
          </div>
        </div>

        {/* LIST PESANAN */}
        <div className="space-y-6 mb-10">
          {paginatedOrders.length > 0 ? paginatedOrders.map((order) => {
            const statusStyle = getStatusStyle(order.payment_status);
            const isDikirim = order.payment_status?.toLowerCase() === 'dikirim';
            const items = order.purchase_items || [];
            const isExpanded = expandedOrders[order.id];
            const displayedItems = isExpanded ? items : items.slice(0, 1);
            const moreItemsCount = items.length - 1;

            return (
              <div key={order.id} className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden transition-all hover:border-blue-300 flex flex-col">
                
                {/* AREA YANG BISA DIKLIK UNTUK EXPAND (Header + Body) */}
                <div className="cursor-pointer" onClick={() => toggleExpand(order.id)}>
                  <div className="p-6 pb-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ORDER ID</span>
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{order.id.substring(0, 8)}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-500">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase border shadow-sm ${statusStyle.color}`}>
                      {statusStyle.icon} {statusStyle.text}
                    </div>
                  </div>

                  <div className="px-6 space-y-4">
                    {displayedItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <img src={item.image_url} className="h-16 w-16 object-cover rounded-2xl border border-gray-100 shadow-sm" alt="" />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-sm">{item.bird_name}</h4>
                          <p className="text-xs font-medium text-gray-400 italic mb-1">{item.bird_species}</p>
                          <p className="text-xs font-bold text-blue-600">Rp {item.price_at_purchase?.toLocaleString('id-ID')} <span className="text-gray-300 mx-1">|</span> x{item.quantity}</p>
                        </div>
                        <div className="text-right"><p className="font-black text-gray-800 text-sm">Rp {item.subtotal?.toLocaleString('id-ID')}</p></div>
                      </div>
                    ))}
                    {!isExpanded && moreItemsCount > 0 && (
                      <div className="flex items-center justify-between py-2 border-t border-dashed border-gray-100">
                        <p className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">+ {moreItemsCount} burung lainnya</p>
                        <div className="text-gray-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">Detail <ChevronDown size={14} /></div>
                      </div>
                    )}
                    {isExpanded && items.length > 1 && (
                      <div className="flex justify-center py-2 border-t border-dashed border-gray-100 mt-2">
                         <div className="text-gray-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-gray-50 px-4 py-1.5 rounded-full">Tutup <ChevronUp size={14} /></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AREA FOOTER (Tidak bisa di-klik untuk Expand) */}
                <div className="bg-gray-50/80 p-5 sm:p-6 mt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-5 justify-between">
                  <div className="flex flex-col gap-3 flex-1 w-full">
                    <div className="flex gap-2.5 items-start">
                      <MapPin size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Alamat Pengiriman</p>
                        <p className="text-xs font-bold text-gray-700 leading-snug line-clamp-2">{order.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <CreditCard size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pembayaran</p>
                        <p className="text-xs font-bold text-gray-700 leading-snug">{order.payment_method?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-end items-end sm:items-end border-t sm:border-t-0 border-gray-200 pt-3 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Belanja</p>
                      <p className="text-xl sm:text-2xl font-black text-blue-700 leading-none">Rp {order.total_price?.toLocaleString('id-ID')}</p>
                    </div>
                    {isDikirim && (
                      <button onClick={(e) => openConfirmModal(e, order.id)} className="mt-0 sm:mt-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} /> Diterima
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          }) : (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
              <PackageSearch size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">Pesanan tidak ditemukan.</p>
            </div>
          )}
        </div>

        {/* --- FOOTER PAGINATION --- */}
        {filteredAndSortedOrders.length > 0 && (
          <div className="p-6 bg-white rounded-3xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Halaman <span className="text-gray-700">{currentPage}</span> dari <span className="text-gray-700">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          currentPage === pageNum 
                          ? "bg-blue-600 border-blue-600 text-white shadow-md" 
                          : "bg-white border-gray-100 text-gray-600 hover:border-blue-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="text-gray-300">...</span>;
                  }
                  return null;
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}