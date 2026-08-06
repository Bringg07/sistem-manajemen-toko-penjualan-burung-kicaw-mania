"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClientComponent } from "@/lib/supabase";
import { Bird, History, PackageSearch, Menu, X } from "lucide-react"; // Tambahkan Menu dan X

export default function Navbar() {
  const [profile, setProfile] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State untuk menu HP
  const pathname = usePathname();
  const supabase = createClientComponent();

  // Memperketat pengecekan halaman agar tombol "Masuk" benar-benar hilang di halaman auth
  const isAuthPage = 
    pathname === "/auth/login" || 
    pathname === "/auth/register" || 
    pathname === "/auth/signup" || 
    pathname === "/";

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("id", user.id)
          .single();
        setProfile(data);

        if (data?.role === "admin") {
          fetchPendingCount();
        }
      } else {
        setProfile(null);
      }
    }

    async function fetchPendingCount() {
      const { count, error } = await supabase
        .from("purchases")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "pending");
      
      if (!error) setPendingCount(count || 0);
    }

    getProfile();
  }, [supabase, pathname]);

  // Tutup menu mobile otomatis setiap kali pindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  let navLinks = [];

  // Navigasi hanya muncul jika sudah login dan tidak di halaman auth
  if (profile && !isAuthPage) {
    if (profile.role === "admin") {
      navLinks = [
        { name: "Katalog", href: "/user", icon: Bird },
        { 
          name: "Pesanan Masuk", 
          href: "/admin/orders", 
          icon: PackageSearch, 
          badge: pendingCount 
        },
      ];
    } else {
      navLinks = [
        { name: "Katalog", href: "/user", icon: Bird },
        { name: "Riwayat", href: "/riwayat", icon: History },
      ];
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
              <Bird className="text-white" size={20} />
            </div>
            <div className="text-lg font-black tracking-tighter text-gray-900 hidden sm:block">
              KICAW<span className="text-blue-600">MANIA</span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 text-sm font-bold transition-colors ${
                    isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {link.name}
                  {link.badge > 0 && (
                    <span className="absolute -top-2 -right-4 flex h-5 min-w-[20px] px-1 items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white animate-pulse">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Profile Section & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {profile ? (
              <Link 
                href="/profile" 
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-2 sm:px-3 py-1.5 rounded-full sm:rounded-2xl border border-gray-100 transition shadow-sm"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Profil</p>
                  <p className="text-xs font-bold text-gray-800">{profile.username}</p>
                </div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex justify-center items-center text-white font-black text-sm shadow-md shadow-blue-100">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              !isAuthPage && (
                <Link 
                  href="/auth/login" 
                  className="text-sm font-bold text-white bg-blue-600 px-5 sm:px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
                >
                  Masuk
                </Link>
              )
            )}

            {/* Tombol Hamburger Khusus Mobile */}
            {navLinks.length > 0 && (
              <button 
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DROPDOWN MENU (Khusus Mobile) */}
      {isMobileMenuOpen && navLinks.length > 0 && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0 animate-in slide-in-from-top-2">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-colors ${
                    isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    {link.name}
                  </div>
                  {link.badge > 0 && (
                    <span className="flex h-6 min-w-[24px] px-1.5 items-center justify-center bg-red-500 text-white text-[11px] font-black rounded-full">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
} 