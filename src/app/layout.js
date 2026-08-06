import "./globals.css";
import Navbar from "@/component/Navbar";

export const metadata = {
  title: "Kicaw Mania",
  description: "Toko Burung Modern",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-50">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="p-6 bg-gray-800 text-white text-center text-sm">
          &copy; 2026 Kicaw Mania - Made with ❤️ by Kelompok 27 dan 45 Praktikum SBD. All rights reserved.
        </footer>
      </body>
    </html>
  );
}