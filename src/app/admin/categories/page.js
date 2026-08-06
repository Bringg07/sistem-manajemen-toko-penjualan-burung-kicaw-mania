"use client"

import { useEffect, useMemo, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Plus, PencilLine, Trash2, X, Save, ArrowLeft, Loader2, Tag } from 'lucide-react';
import Link from 'next/link';

const emptyForm = { cat_name: '', cat_desc: '', habitat: '' };

export default function AdminCategoriesPage() {
  const supabase = useMemo(() => createClientComponent(), []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // State bantuan untuk loading spesifik saat menghapus
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          setProfile(profileData || null);
        }
        await fetchCategories();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [supabase]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
      setCategories([]);
    }
  }

  function openCreateForm() {
    setEditingCategory(null);
    setForm(emptyForm);
    setError('');
    setMessage('');
    setShowForm(true);
  }

  function openEditForm(category) {
    setEditingCategory(category);
    setForm({
      cat_name: category.cat_name || '',
      cat_desc: category.cat_desc || '',
      habitat: category.habitat || '',
    });
    setError('');
    setMessage('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCategory(null);
    setForm(emptyForm);
    setError('');
    setTimeout(() => setMessage(''), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!profile || profile.role !== 'admin') {
      setError('Hanya admin yang dapat mengelola kategori.');
      return;
    }

    if (!form.cat_name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }

    if (editingCategory && (!editingCategory.id_categories || isNaN(editingCategory.id_categories))) {
        setError('Error: ID Kategori tidak valid untuk diupdate.');
        return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const payload = {
        cat_name: form.cat_name.trim(),
        cat_desc: form.cat_desc.trim(),
        habitat: form.habitat.trim(),
      };

      const targetId = editingCategory?.id_categories || editingCategory?.id;
      const url = editingCategory 
        ? `/api/categories/${targetId}` 
        : '/api/categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan kategori');
      }

      setMessage(editingCategory ? 'Kategori berhasil diperbarui.' : 'Kategori berhasil ditambahkan.');
      
      await fetchCategories();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const targetId = category?.id_categories || category?.id;

    if (!targetId || isNaN(targetId)) {
      setError("Error: ID Kategori tidak valid untuk dihapus.");
      console.log("Data Kategori yang diklik:", category); 
      return;
    }

    if (!confirm(`Hapus kategori "${category.cat_name}"? Tindakan ini akan menghapus semua relasi kategori pada burung.`)) return;

    try {
      setDeletingId(targetId);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch(`/api/categories/${targetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus kategori');
      }

      setMessage('Kategori berhasil dihapus.');
      await fetchCategories();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 4000); 
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8 pb-24">
      <div className="mx-auto max-w-4xl">
        
        {/* Header Section */}
        <div className="mb-8">
          <Link 
            href="/user" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-4 font-bold text-sm"
          >
            <ArrowLeft size={18} /> Kembali ke Katalog
          </Link>
          
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Admin Panel</p>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Kelola Kategori</h1>
              <p className="mt-2 text-sm text-slate-600 font-medium">Atur klasifikasi burung untuk mempermudah pencarian user.</p>
            </div>

            {profile?.role === 'admin' && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
              >
                <Plus size={20} /> Tambah Kategori
              </button>
            )}
          </div>
        </div>

        {/* Notifikasi Global */}
        {(message || error) && (
          <div className={`mb-6 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm flex items-center gap-3 ${error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {error || message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        ) : profile?.role !== 'admin' ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm flex items-center gap-3">
            <Tag className="text-amber-600" />
            <p className="font-bold">Hanya admin yang dapat mengelola kategori.</p>
          </div>
        ) : (
          /* MENGGANTIKAN TABEL DENGAN RESPONSIVE CARDS */
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
                <Tag size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">Belum ada kategori ditambahkan.</p>
              </div>
            ) : (
              categories.map((category, index) => {
                const isDeleting = deletingId === (category.id_categories || category.id);
                return (
                  <div key={category.id_categories} className="bg-white rounded-[24px] shadow-sm border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-blue-300 transition-colors">
                    
                    {/* NOMOR & NAMA */}
                    <div className="flex items-start gap-4 sm:w-1/3 shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                            <Tag size={14} />
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">{category.cat_name}</h3>
                        </div>
                        {category.habitat && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 sm:hidden">
                            Habitat: <span className="text-slate-600">{category.habitat}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* DESKRIPSI & HABITAT (Desktop) */}
                    <div className="flex-1 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <p className="text-sm text-slate-600 leading-relaxed mb-2 sm:mb-1">{category.cat_desc || "Tidak ada deskripsi."}</p>
                      {category.habitat && (
                        <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                          Habitat: <span className="text-slate-600">{category.habitat}</span>
                        </p>
                      )}
                    </div>

                    {/* TOMBOL AKSI */}
                    <div className="flex sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0 mt-2 sm:mt-0">
                      <button 
                        type="button"
                        onClick={() => openEditForm(category)}
                        disabled={isDeleting}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-yellow-50 text-slate-600 hover:text-yellow-600 rounded-xl font-bold text-xs transition border border-slate-100 disabled:opacity-50"
                      >
                        <PencilLine size={14} /> Edit
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={isDeleting}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-red-50 text-red-600 rounded-xl font-bold text-xs transition border border-slate-100 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} 
                        Hapus
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal Form Tambah/Edit */}
        {showForm && profile?.role === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Kelola identitas kategori untuk inventaris burung.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Kategori</label>
                  <input
                    value={form.cat_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, cat_name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Contoh: Burung Hias"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi</label>
                  <textarea
                    value={form.cat_desc}
                    onChange={(e) => setForm((prev) => ({ ...prev, cat_desc: e.target.value }))}
                    className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none custom-scrollbar"
                    placeholder="Penjelasan singkat mengenai kategori ini..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">Habitat Utama</label>
                  <input
                    value={form.habitat}
                    onChange={(e) => setForm((prev) => ({ ...prev, habitat: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    placeholder="Contoh: Hutan Hujan Tropis"
                  />
                </div>

                {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 border border-red-100">{error}</div>}

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="w-full sm:w-auto rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-500 transition hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-50 active:scale-95"
                  >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}