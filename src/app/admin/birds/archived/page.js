"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClientComponent } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  AlertCircle,
  Loader2,
  Archive,
} from "lucide-react";

export default function ArchivedBirdsPage() {
  const [birds, setBirds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [hardDeleting, setHardDeleting] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const router = useRouter();
  const supabase = useMemo(() => createClientComponent(), []);

  useEffect(() => {
    const fetchArchivedBirds = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("birds")
          .select("*")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false });

        if (fetchError) throw fetchError;
        setBirds(data || []);
      } catch (err) {
        console.error("Gagal memuat arsip:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedBirds();
  }, [supabase]);

  async function handleRestore(id) {
    setRestoring(id);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/birds/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setStatus({ type: "success", message: "Burung berhasil dipulihkan!" });
        setBirds((prev) => prev.filter((b) => b.id !== id));
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setStatus({ type: "error", message: json.error || "Gagal memulihkan." });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setRestoring(null);
    }
  }

  async function handleHardDelete(id) {
    const confirmDelete = window.confirm(
      "Hapus permanen? Data tidak dapat dikembalikan."
    );
    if (!confirmDelete) return;

    setHardDeleting(id);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/birds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, mode: "hard" }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setStatus({
          type: "success",
          message: "Burung berhasil dihapus permanen.",
        });
        setBirds((prev) => prev.filter((b) => b.id !== id));
      } else {
        setStatus({
          type: "error",
          message: json.error || "Gagal menghapus permanen.",
        });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setHardDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/user"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium mb-6"
        >
          <ArrowLeft size={20} />
          Kembali ke Katalog
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-700 p-3 rounded-full">
            <Archive size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Burung Diarsipkan</h1>
        </div>
      </div>

      {status.message && (
        <div
          className={`p-4 mb-6 rounded-2xl text-white flex items-center gap-3 shadow-lg ${
            status.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {status.type === "success" ? (
            <RotateCcw size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-semibold">{status.message}</span>
        </div>
      )}

      {/* Daftar Burung Diarsipkan */}
      {birds.length > 0 ? (
        <div className="space-y-4">
          {birds.map((bird) => (
            <div
              key={bird.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Image */}
                <div className="flex-shrink-0">
                  <img
                    src={
                      bird.image_url ||
                      "https://via.placeholder.com/200x150?text=No+Image"
                    }
                    alt={bird.name}
                    className="w-40 h-32 object-cover rounded-xl border border-gray-200"
                  />
                </div>

                {/* Info */}
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">
                    {bird.name}
                  </h3>
                  <p className="text-gray-500 italic text-sm mb-3">
                    {bird.species}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Harga
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        Rp {bird.price?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Stok
                      </p>
                      <p className="text-lg font-bold text-gray-800">
                        {bird.stock} ekor
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Status
                      </p>
                      <p className="text-lg font-bold text-amber-600">
                        Diarsipkan
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold">
                        Tanggal
                      </p>
                      <p className="text-sm text-gray-600">
                        {bird.deleted_at
                          ? new Date(bird.deleted_at).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto flex-col md:flex-col">
                  <button
                    onClick={() => handleRestore(bird.id)}
                    disabled={restoring === bird.id}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-semibold"
                  >
                    {restoring === bird.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                    Pulihkan
                  </button>

                  <button
                    onClick={() => handleHardDelete(bird.id)}
                    disabled={hardDeleting === bird.id}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold"
                  >
                    {hardDeleting === bird.id ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    Hapus Permanen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <Archive size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400 text-lg">
            Tidak ada burung yang diarsipkan.
          </p>
        </div>
      )}
    </div>
  );
}
