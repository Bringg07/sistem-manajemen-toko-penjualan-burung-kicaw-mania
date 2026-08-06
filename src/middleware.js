import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(req) {
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
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Jika sudah login dan mencoba buka halaman login/signup, arahkan ke /user (Katalog)
  if (session && req.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/user", req.url));
  }

  // 2. Jika BELUM login dan mencoba buka halaman proteksi, arahkan ke login
  const protectedPaths = [
    "/user",
    "/admin",
    "/profile",
    "/pembayaran",
    "/riwayat",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path),
  );

  if (!session && isProtectedPath) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
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
  ],
};
