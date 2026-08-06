"use client"

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { X } from 'lucide-react';

export default function CategorySelect({ birdId, initialCategories = [] }) {
  const supabase = createClientComponent();
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setAllCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setAllCategories([]);
        setError('Gagal memuat kategori');
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!Array.isArray(initialCategories) || initialCategories.length === 0) return;
    if (!Array.isArray(allCategories) || allCategories.length === 0) return;

    const selected = allCategories.filter((cat) => initialCategories.includes(cat.id_categories));
    if (selected.length > 0) {
      setSelectedCategories(selected);
    }
  }, [allCategories, initialCategories]);

  async function handleAddCategory(categoryId) {
    if (selectedCategories.find((c) => c.id_categories === categoryId)) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/bird-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bird_id: birdId, kategori_id: categoryId }),
      });

      if (res.ok) {
        const category = allCategories.find((c) => c.id_categories === categoryId);
        if (category) {
          setSelectedCategories((prev) => [...prev, category]);
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to add category');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveCategory(categoryId) {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/bird-categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bird_id: birdId, kategori_id: categoryId }),
      });

      if (res.ok) {
        setSelectedCategories(selectedCategories.filter((c) => c.id_categories !== categoryId));
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to remove category');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const availableCategories = Array.isArray(allCategories)
    ? allCategories.filter((c) => !selectedCategories.find((sc) => sc.id_categories === c.id_categories))
    : [];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Kategori</h3>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="mb-3">
        <label className="block text-sm mb-2">Pilih kategori untuk ditambahkan:</label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddCategory(parseInt(e.target.value));
              e.target.value = '';
            }
          }}
          disabled={loading}
          className="border p-2 w-full cursor-pointer"
        >
          <option value="">{availableCategories.length === 0 ? '-- Tidak ada kategori tersedia --' : '-- Pilih kategori --'}</option>
          {availableCategories.map((cat) => (
            <option key={cat.id_categories} value={cat.id_categories}>
              {cat.cat_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-2">Kategori terpilih:</label>
        <div className="flex flex-wrap gap-2">
          {selectedCategories.length === 0 ? (
            <div className="text-gray-500 text-sm">Belum ada kategori</div>
          ) : (
            selectedCategories.map((cat) => (
              <div key={cat.id_categories} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded">
                <span>{cat.cat_name}</span>
                <button
                  onClick={() => handleRemoveCategory(cat.id_categories)}
                  disabled={loading}
                  className="ml-2 text-blue-600 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}