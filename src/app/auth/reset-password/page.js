'use client';

import { useState, useEffect } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [supabase, setSupabase] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [canReset, setCanReset] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const client = createClientComponent();
    setSupabase(client);

    // Listen for PASSWORD_RECOVERY event
    const { data: listener } = client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true);
      }
    });

    // Also try checking session/user — if user already allowed, enable reset
    (async () => {
      try {
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData?.session) setCanReset(true);
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      if (listener && listener.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setMessage('');

    if (!canReset) {
      setError('Link reset tidak valid atau sudah kadaluarsa.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message || 'Gagal mengubah password');
      } else {
        setMessage('Password berhasil diubah. Silakan login dengan password baru.');
        setPassword('');
        setConfirm('');
        setTimeout(() => router.push('/auth/login'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Reset Password</h2>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{message}</div>}

        <div className="mb-4">
          <input
            type="password"
            placeholder="Password baru"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Konfirmasi password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded font-bold transition ${loading ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {loading ? 'Memproses...' : 'Ubah Password'}
        </button>

        <p className="text-center mt-4 text-sm">
          Kembali ke <Link href="/auth/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
