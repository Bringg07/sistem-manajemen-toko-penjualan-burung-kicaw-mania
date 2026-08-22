import "./globals.css";
import Navbar from "@/component/Navbar";
import WhatsAppFloat from "@/component/WhatsAppFloat";
import { STORE } from "@/lib/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kicaw-mania.example.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kicaw Mania — Toko Burung Kicau Berkualitas",
    template: "%s | Kicaw Mania",
  },
  description:
    "Temukan berbagai jenis burung kicau berkualitas: murai batu, kacer, lovebird, dan banyak lagi. Sistem manajemen transparan dan terpercaya.",
  keywords: [
    "toko burung",
    "burung kicau",
    "murai batu",
    "kacer",
    "lovebird",
    "kicau mania",
  ],
  openGraph: {
    title: "Kicaw Mania — Toko Burung Kicau Berkualitas",
    description:
      "Toko burung kicau berkualitas dengan sistem manajemen transparan dan terpercaya.",
    type: "website",
    locale: "id_ID",
    siteName: STORE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Kicaw Mania — Toko Burung Kicau Berkualitas",
    description:
      "Toko burung kicau berkualitas dengan sistem manajemen transparan dan terpercaya.",
  },
  icons: { icon: "/icon.svg" },
  script: [
    {
      src: "/theme-init.js",
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-gray-50" suppressHydrationWarning>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="p-8 bg-gray-900 text-gray-300 text-sm">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-white font-black text-lg tracking-tight mb-2">
                KICAW<span className="text-blue-500">MANIA</span>
              </p>
              <p>{STORE.tagline}. Burung sehat, berkualitas, dan bergengsi.</p>
            </div>
            <div>
              <p className="text-white font-bold mb-2">Kontak</p>
              <p>{STORE.address}</p>
              <p>Jam buka: {STORE.openHours}</p>
            </div>
            <div>
              <p className="text-white font-bold mb-2">Info</p>
              <p>&copy; {new Date().getFullYear()} Kicaw Mania</p>
              <p>Made with &#10084;&#65039; by Kelompok 27 dan 45 Praktikum SBD</p>
            </div>
          </div>
        </footer>
        <WhatsAppFloat />
      </body>
    </html>
  );
}
