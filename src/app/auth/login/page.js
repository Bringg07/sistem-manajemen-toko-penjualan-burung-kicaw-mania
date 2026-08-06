'use client';

import { createClientComponent } from '@/lib/supabase';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [supabase, setSupabase] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setSupabase(createClientComponent());
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || 'Login gagal');
        setLoading(false);
        return;
      }

      setSuccess('Login berhasil! Mengalihkan...');
      setEmail('');
      setPassword('');
      
      // LENGKAPI DI SINI: Tambahkan router.refresh() agar Navbar ikut berubah
      setTimeout(() => {
        router.push('/user');
        router.refresh(); 
      }, 600);
      
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Login Kicau Mania</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="mb-4">
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
            disabled={loading}
          />
        </div>

        <div className="mb-6 relative">
          <input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            required 
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600"
            disabled={loading}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded font-bold transition ${
            loading 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Sedang login...' : 'Masuk'}
        </button>
        
        <div className="mb-4 text-right mt-2">
          <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">Lupa password?</Link>
        </div>

        <p className="text-center mt-4 text-sm">
          Belum punya akun? <Link href="/auth/signup" className="text-blue-600 hover:underline">Daftar di sini</Link>
        </p>
      </form>
    </div>
  );
}