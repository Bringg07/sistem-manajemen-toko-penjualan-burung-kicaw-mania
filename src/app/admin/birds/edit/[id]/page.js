"use client"

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponent } from '@/lib/supabase';
import { ArrowLeft, Loader2, CheckCircle, Trash2, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import CategorySelect from '@/component/CategorySelect';

export default function EditBirdPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [birdData, setBirdData] = useState(null);
  const [initialCategories, setInitialCategories] = useState([]);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const supabase = useMemo(() => createClientComponent(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !id) return;
    async function getBird() {
      const [birdResult, categoriesResult] = await Promise.all([
        supabase.from('birds').select('*').eq('id', id).single(),
        fetch(`/api/bird-categories?bird_id=${id}`).then((res) => res.json()),
      ]);

      const categoriesData = await fetch('/api/categories').then((res) => res.json());

      const { data } = birdResult;
      if (data) setBirdData(data);
      if (Array.isArray(categoriesResult)) {
        const categoryIds = categoriesResult.map((item) => item.kategori_id);
        setInitialCategories(categoryIds);
        if (Array.isArray(categoriesData)) {
          setSelectedCategoryDetails(
            categoriesData.filter((category) => categoryIds.includes(category.id_categories))
          );
        }
      }
      setFetching(false);
    }
    getBird();
  }, [id, mounted]);

  async function handleUpdate(event) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.set('id', id);

    try {
      const res = await fetch('/api/birds', { method: 'PUT', body: formData });
      const json = await res.json();
      if (res.ok && json.success) {
        setStatus({ type: 'success', message: 'Data berhasil diperbarui!' });
        setTimeout(() => router.push('/user'), 1500);
      } else {
        setStatus({ type: 'error', message: json.error || 'Gagal memperbarui data.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
    setLoading(false);
  }

  async function confirmSoftDelete() {
    setLoading(true);
    try {
      const res = await fetch('/api/birds', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, mode: 'soft' }) });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowDeleteModal(false);
        setStatus({ type: 'success', message: 'Produk berhasil diarsipkan (soft delete).' });
        router.refresh();
        setTimeout(() => router.push('/user'), 1500);
      } else {
        setStatus({ type: 'error', message: json.error || 'Gagal mengarsipkan.' });
        setShowDeleteModal(false);
        setLoading(false);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setShowDeleteModal(false);
      setLoading(false);
    }
  }

  async function confirmHardDelete() {
    setLoading(true);
    try {
      const res = await fetch('/api/birds', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, mode: 'hard' }) });
      const json = await res.json();
      if (res.ok && json.success) {
        setShowDeleteModal(false);
        setStatus({ type: 'success', message: 'Produk berhasil dihapus permanen.' });
        router.refresh();
        setTimeout(() => router.push('/user'), 1500);
      } else {
        setStatus({ type: 'error', message: json.error || 'Gagal menghapus permanen.' });
        setShowDeleteModal(false);
        setLoading(false);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setShowDeleteModal(false);
      setLoading(false);
    }
  }

  if (!mounted || fetching || !birdData) return <div className="p-20 text-center font-bold">Memuat data...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen relative">
      
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full text-red-600 mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arsipkan atau Hapus Burung?</h3>
              <p className="text-gray-500 mb-4 text-sm">Pilih tindakan untuk <strong>{birdData.name}</strong>:</p>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                <li>• <strong>Arsipkan</strong>: menyembunyikan produk dari daftar.</li>
                <li>• <strong>Hapus Permanen</strong>: menghapus data dari basis data (tidak dapat dikembalikan).</li>
              </ul>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-2xl">Batal</button>
                <button onClick={confirmSoftDelete} disabled={loading} className="flex-1 py-3 px-4 bg-yellow-500 text-white font-bold rounded-2xl flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Arsipkan"}
                </button>
                <button onClick={confirmHardDelete} disabled={loading} className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-2xl flex justify-center items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Hapus Permanen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Link href="/user" className="inline-flex items-center gap-2 text-gray-500 mb-6 hover:text-blue-600 transition">
        <ArrowLeft size={20} /> Kembali
      </Link>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Edit Burung</h1>
        <button onClick={() => setShowDeleteModal(true)} className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-red-600 hover:text-white transition font-semibold">
          <Trash2 size={18} /> Hapus Produk
        </button>
      </div>

      {status.message && (
        <div className={`p-4 mb-6 rounded-2xl text-white flex items-center gap-2 shadow-lg ${status.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
          <span className="font-bold">{status.message}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-3xl shadow-xl border grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="hidden" name="old_image_url" defaultValue={birdData.image_url || ''} />
        
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-600 text-sm">Nama Burung</label>
          <input name="name" defaultValue={birdData.name || ''} className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none transition" required />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-600 text-sm">Spesies</label>
          <input name="species" defaultValue={birdData.species || ''} className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none transition" />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-600 text-sm">Harga (Rp)</label>
          <input name="price" type="number" defaultValue={birdData.price || 0} className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none transition" required />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-bold text-gray-600 text-sm">Stok</label>
          <input name="stock" type="number" defaultValue={birdData.stock || 0} className="border-2 p-3 rounded-xl focus:border-blue-500 outline-none transition" required />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-bold text-gray-600 text-sm">Pratinjau Foto</label>
          {birdData.image_url && <img src={birdData.image_url} alt="old" className="w-28 h-28 object-cover rounded-2xl border mb-2" />}
          <input name="image_file" type="file" accept="image/*" className="border-2 border-dashed p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition" />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
          <p className="text-sm font-bold text-blue-900 mb-3">Kategori saat ini</p>
          {selectedCategoryDetails.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedCategoryDetails.map((category) => (
                <span
                  key={category.id_categories}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-wide text-blue-700 shadow-sm"
                >
                  {category.cat_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-blue-700/80">Belum ada kategori dipilih.</p>
          )}
        </div>

        <div className="md:col-span-2">
          <CategorySelect birdId={id} initialCategories={initialCategories} />
        </div>

        <button type="submit" disabled={loading} className="md:col-span-2 bg-blue-600 text-white font-extrabold py-4 rounded-2xl hover:bg-blue-700 disabled:bg-gray-400 transition-all shadow-lg flex justify-center items-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}