// Konfigurasi global toko Kicaw Mania
export const STORE = {
  name: "Kicaw Mania",
  tagline: "Toko Burung Kicau Berkualitas",
  // Ganti dengan nomor WhatsApp asli toko (format internasional tanpa +)
  whatsapp: "6281234567890",
  address: "Jl. Kicau Mania No. 27, Indonesia",
  openHours: "08.00 - 20.00 WIB",
};

// Tarif ongkir flat per zona pengiriman
export const SHIPPING_ZONES = [
  { id: "pickup", label: "Ambil di Toko (Gratis)", fee: 0 },
  { id: "dalam-kota", label: "Dalam Kota (Same Day)", fee: 15000 },
  { id: "luar-kota", label: "Luar Kota (1-3 Hari)", fee: 35000 },
  { id: "luar-pulau", label: "Luar Pulau (3-7 Hari)", fee: 75000 },
];

export const PAYMENT_METHODS = [
  { id: "Transfer Bank", label: "Transfer Bank", hint: "BCA / BRI / Mandiri" },
  { id: "QRIS", label: "QRIS", hint: "Scan semua e-wallet & m-banking" },
  { id: "COD", label: "COD (Bayar di Tempat)", hint: "Khusus dalam kota" },
];

export const formatRupiah = (value) =>
  "Rp " + Number(value || 0).toLocaleString("id-ID");

// ---- Status transaksi & alur perubahan yang diizinkan ----
export const PAYMENT_STATUSES = [
  "pending",
  "diproses",
  "dikirim",
  "selesai",
  "dibatalkan",
];

// Transisi yang boleh dilakukan admin (whitelist)
export const ADMIN_STATUS_TRANSITIONS = {
  pending: ["diproses", "dibatalkan"],
  diproses: ["dikirim", "dibatalkan"],
  dikirim: ["selesai"],
  selesai: [],
  dibatalkan: [],
};

// Transisi yang boleh dilakukan user (konfirmasi pesanan diterima)
export const USER_STATUS_TRANSITIONS = {
  dikirim: ["selesai"],
};

export function canTransition(transitions, from, to) {
  const allowed = transitions[String(from || "").toLowerCase()] || [];
  return allowed.includes(String(to || "").toLowerCase());
}

// Format ringkas ID order (konsisten di seluruh halaman)
export const shortOrderId = (id) => String(id || "").split("-")[0] || "-";
