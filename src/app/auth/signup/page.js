'use client';

import { handleSignup } from '@/lib/action';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData) {
    setError(null);

    const password = formData.get('password');
    const confirm = formData.get('password_confirm');
    if (String(password).length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    startTransition(async () => {
      const result = await handleSignup(formData);
      if (result?.success) {
        router.push('/auth/login?registered=1');
        return;
      }
      setError(result?.error || 'Pendaftaran gagal. Coba lagi.');
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form action={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-900">Daftar Kicau Mania</h2>

        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <input
          name="username"
          type="text"
          placeholder="Username"
          minLength={3}
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />

        <div className="mb-4 relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password (min. 6 karakter)"
            autoComplete="new-password"
            minLength={6}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-green-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="mb-6">
          <input
            name="password_confirm"
            type={showPassword ? "text" : "password"}
            placeholder="Ulangi password"
            autoComplete="new-password"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? 'Mendaftarkan...' : 'Daftar Sekarang'}
        </button>

        <p className="text-center mt-4 text-sm">
          Sudah punya akun? <Link href="/auth/login" className="text-green-600 hover:underline">Masuk di sini</Link>
        </p>
      </form>
    </div>
  );
}
