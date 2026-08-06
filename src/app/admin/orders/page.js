"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, ArrowUpDown, MapPin, CreditCard, 
  RefreshCw, Eye, X, Package, Calendar, ChevronLeft, ChevronRight, User, Truck
} from "lucide-react";
import Link from "next/link";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State untuk Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State untuk loading saat mengubah status
  const [updatingId, setUpdatingId] = useState(null);

  // State untuk Fitur Search, Filter, Sort
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Mencegah scroll pada body saat modal terbuka
  useEffect(() => {
    if (showDetailModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showDetailModal]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders'); 
      const data = await res.json();
      if (data.success) {
        setOrders(data.purchases || []);
      } else {
        setError(data.error || "Gagal mengambil data pesanan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    try {
      setUpdatingId(orderId); 
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, payment_status: newStatus }));
        }
      }
    } catch (err) {
      alert("Gagal memperbarui status.");
    } finally {
      setUpdatingId(null);
    }
  }

  // --- LOGIKA FILTERING & SORTING ---
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((o) => 
        o.id.toLowerCase().includes(lowerSearch) || 
        (o.profiles?.username || "").toLowerCase().includes(lowerSearch) ||
        o.purchase_items?.some(item => (item.bird_name || "").toLowerCase().includes(lowerSearch))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => {
        const status = (o.payment_status || "pending").toLowerCase();
        if (statusFilter === "success") return ["success", "paid", "telah diterima", "selesai"].includes(status);
        if (statusFilter === "pending") return ["pending", "belum dibayar"].includes(status);
        if (statusFilter === "diproses") return ["diproses", "dikirim"].includes(status);
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

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);

  const openDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'success' || s === 'selesai' || s === 'paid') return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-600', icon: <CheckCircle2 size={14} /> };
    if (s === 'dikirim') return { bg: 'bg-purple-50 border-purple-100', text: 'text-purple-600', icon: <Truck size={14} /> };
    if (s === 'diproses') return { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600', icon: <Package size={14} /> };
    return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-600', icon: <Clock size={14} /> }; 
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen relative overflow-x-hidden">
      
      {/* --- MODAL DETAIL PESANAN --- */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col border border-slate-100">
            <div className="p-6 md:p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-900">Rincian Transaksi</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">ID: #{selectedOrder.id.substring(0, 12)}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase"><Calendar size={12}/> {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 md:p-3 bg-white hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 md:space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 md:p-5 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nama Pembeli</p>
                  <p className="font-extrabold text-slate-800 text-base md:text-lg">{selectedOrder.profiles?.username || "N/A"}</p>
                </div>
                <div className="bg-slate-50 p-4 md:p-5 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Metode Pembayaran</p>
                  <p className="font-extrabold text-slate-800 text-base md:text-lg uppercase tracking-tight">{selectedOrder.payment_method?.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="bg-blue-50/50 p-5 md:p-6 rounded-3xl border border-blue-100 flex gap-4 md:gap-5">
                <div className="bg-blue-500 p-2.5 md:p-3 rounded-2xl h-fit text-white shadow-lg shadow-blue-200 shrink-0">
                  <MapPin size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1 tracking-widest">Alamat Pengiriman Lengkap</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedOrder.address || "Alamat belum diatur."}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 px-1 flex items-center gap-2 tracking-widest">
                  <Package size={14} /> Daftar Produk ({selectedOrder.purchase_items?.length})
                </p>
                <div className="space-y-4">
                  {selectedOrder.purchase_items?.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 md:p-5 border border-slate-100 rounded-3xl bg-white shadow-sm">
                      <div className="flex items-center gap-4 flex-1">
                        <img src={item.image_url} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl shadow-sm border border-slate-50" alt={item.bird_name} />
                        <div>
                          <p className="font-black text-slate-800 text-sm md:text-base">{item.bird_name}</p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-2">{item.bird_species}</p>
                          <p className="text-[10px] md:text-xs font-black text-blue-600 bg-blue-50 inline-block px-2 md:px-3 py-1 rounded-lg">Rp {item.price_at_purchase?.toLocaleString('id-ID')} x {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right sm:text-right font-black text-slate-900 text-base md:text-lg border-t sm:border-t-0 border-dashed border-slate-100 pt-3 sm:pt-0">
                        Rp {item.subtotal?.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                <p className="text-2xl md:text-3xl font-black text-blue-700">Rp {selectedOrder.total_price?.toLocaleString('id-ID')}</p>
              </div>
              <div className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 shadow-sm rounded-2xl text-xs font-black uppercase text-slate-700 tracking-widest text-center">
                {selectedOrder.payment_status}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/user" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 font-bold text-sm">
            <ArrowLeft size={18} /> Kembali ke Katalog
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Pesanan Masuk</h1>
          <p className="mt-2 text-slate-600 font-medium text-sm md:text-base">Kelola dan ubah status transaksi penjualan burung.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* CONTROLS (Search, Filter, Sort, Row Count) */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-6 flex flex-col xl:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Username, ID, atau Burung..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 md:flex flex-wrap gap-3">
            {/* Filter Status */}
            <select 
              value={statusFilter} 
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="col-span-1 px-4 md:px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none cursor-pointer shadow-sm"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="diproses">Diproses/Dikirim</option>
              <option value="success">Selesai</option>
            </select>
            
            {/* Sort Dropdown */}
            <select 
              value={sortBy} 
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="col-span-1 px-4 md:px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none cursor-pointer shadow-sm"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Termahal</option>
              <option value="lowest">Termurah</option>
            </select>

            {/* Row Count */}
            <div className="col-span-2 md:col-span-1 flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
               <span className="text-xs font-bold text-slate-400 uppercase">Baris:</span>
               <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
               >
                 <option value={10}>10</option>
                 <option value={20}>20</option>
                 <option value={50}>50</option>
               </select>
            </div>
          </div>
        </div>

        {/* LIST KARTU PESANAN (MENGGANTIKAN TABEL AGAR RESPONSIF) */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <Package size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Tidak ada pesanan ditemukan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map((order) => {
              const badge = getStatusBadge(order.payment_status);
              const items = order.purchase_items || [];
              const firstItem = items[0];
              const extraItemsCount = items.length > 1 ? items.length - 1 : 0;
              
              const isSelesai = ["success", "paid", "telah diterima", "selesai"].includes(order.payment_status?.toLowerCase());
              const isProcessing = ["diproses", "dikirim"].includes(order.payment_status?.toLowerCase());

              return (
                <div key={order.id} className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:border-blue-300">
                  
                  {/* CARD HEADER */}
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                       <button 
                          onClick={() => openDetail(order)}
                          className="p-2 bg-white hover:bg-slate-100 text-blue-600 rounded-xl border border-slate-200 shadow-sm transition-all"
                          title="Cek Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <div>
                          <p className="text-xs font-mono font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-md inline-block">
                            #{order.id.split('-')[0]}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1">
                            {new Date(order.created_at).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider border ${badge.bg} ${badge.text}`}>
                        {badge.icon} {order.payment_status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* CARD BODY (INFO + ITEM) */}
                  <div className="p-5 flex flex-col lg:flex-row gap-6">
                    
                    {/* INFO PEMBELI & ALAMAT */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-full text-blue-600 shrink-0"><User size={16} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pembeli</p>
                          <p className="text-sm font-bold text-slate-900">{order.profiles?.username || "Guest"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-red-50 p-2 rounded-full text-red-500 shrink-0"><MapPin size={16} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Alamat Pengiriman</p>
                          <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">{order.address || "No Address"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-50 p-2 rounded-full text-emerald-600 shrink-0"><CreditCard size={16} /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Metode Bayar</p>
                          <p className="text-xs font-bold text-slate-700 uppercase">{order.payment_method?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    </div>

                    {/* PREVIEW ITEM */}
                    <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Item Dibeli</p>
                      {firstItem ? (
                        <div className="flex items-center gap-3 mb-3">
                          {firstItem.image_url && (
                             <img src={firstItem.image_url} alt={firstItem.bird_name} className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-white" />
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-1">{firstItem.bird_name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-slate-500">x{firstItem.quantity}</span>
                            </div>
                          </div>
                          {extraItemsCount > 0 && (
                            <div className="text-[10px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md shrink-0">
                              + {extraItemsCount} lainnya
                            </div>
                          )}
                        </div>
                      ) : (
                         <p className="text-xs text-slate-400 italic">Data item tidak tersedia.</p>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-auto">
                        <p className="text-xs font-bold text-slate-500">Total Harga:</p>
                        <p className="text-lg font-black text-blue-700">Rp {order.total_price?.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  </div>

                  {/* AKSI ADMIN (UBAH STATUS) */}
                  <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                    <span className="text-xs font-bold text-slate-500 w-full sm:w-auto text-center sm:text-left">Ubah Status:</span>
                    
                    {isSelesai ? (
                       <div className="inline-flex items-center justify-center gap-2 w-full sm:w-48 py-2.5 bg-[#f0fff4] text-[#22c55e] border border-[#dcfce7] rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">
                         <CheckCircle2 size={16} /> SELESAI
                       </div>
                    ) : (
                      <div className="relative w-full sm:w-48">
                        {updatingId === order.id ? (
                          <div className="flex items-center justify-center py-2.5 border rounded-xl bg-slate-50"><RefreshCw size={18} className="animate-spin text-blue-600" /></div>
                        ) : (
                          <select
                            value={order.payment_status || "pending"}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`w-full appearance-none cursor-pointer outline-none pl-4 pr-10 py-2.5 rounded-xl text-xs font-black shadow-sm border transition-all text-center uppercase tracking-widest ${
                              isProcessing ? "bg-[#eff6ff] text-[#2563eb] border-[#dbeafe]" : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="diproses">Diproses</option>
                            <option value="dikirim">Dikirim</option>
                            <option value="dibatalkan">Batal</option>
                          </select>
                        )}
                        {updatingId !== order.id && <ArrowUpDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 opacity-60" />}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* --- FOOTER PAGINATION --- */}
        {filteredAndSortedOrders.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Halaman <span className="text-slate-700">{currentPage}</span> dari <span className="text-slate-700">{totalPages}</span>
            </p>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
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
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${
                          currentPage === pageNum 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
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