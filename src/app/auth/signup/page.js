'use client';

import { handleSignup } from '@/lib/action';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form action={handleSignup} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-900">Daftar Kicau Mania</h2>
        
        <input 
          name="username" 
          type="text" 
          placeholder="Username" 
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500" 
          required 
        />
        
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500" 
          required 
        />

        <div className="mb-6 relative">
          <input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Password" 
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500" 
            required 
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-green-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button className="w-full bg-green-600 text-white p-2 rounded font-bold hover:bg-green-700 transition">
          Daftar Sekarang
        </button>
        
        <p className="text-center mt-4 text-sm">
          Sudah punya akun? <Link href="/auth/login" className="text-green-600 hover:underline">Masuk di sini</Link>
        </p>
      </form>
    </div>
  );
}