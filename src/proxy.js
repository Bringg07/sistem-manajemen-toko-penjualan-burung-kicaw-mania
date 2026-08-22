import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Next.js 16+: konvensi "proxy" menggantikan "middleware" (API identik)
export async function proxy(req) {
  let res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Jika sudah login dan mencoba buka halaman login/signup, arahkan ke /user (Katalog)
  if (user && req.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  // 2. Jika BELUM login dan mencoba buka halaman proteksi, arahkan ke login
  const protectedPaths = [
    "/user",
    "/admin",
    "/profile",
    "/pembayaran",
    "/riwayat",
    "/bird",
    "/wishlist",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path),
  );

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 3. KEAMANAN: Halaman /admin hanya boleh diakses user dengan role admin
  if (user && req.nextUrl.pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || String(profile.role).toLowerCase() !== "admin") {
      return NextResponse.redirect(new URL("/user", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/user/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/pembayaran/:path*",
    "/riwayat/:path*",
    "/bird/:path*",
    "/wishlist/:path*",
  ],
};
