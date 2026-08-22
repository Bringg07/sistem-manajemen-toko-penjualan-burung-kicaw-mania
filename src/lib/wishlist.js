"use client";

// Utilitas wishlist & notifikasi stok berbasis localStorage
// (tanpa perubahan skema database — aman langsung dipakai)

const WISHLIST_KEY = "kicawWishlist";
const STOCK_ALERT_KEY = "kicawStockAlerts";

function read(key) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getWishlist() {
  return read(WISHLIST_KEY);
}

export function isWishlisted(birdId) {
  return getWishlist().some((b) => b.id === birdId);
}

export function toggleWishlist(bird) {
  const list = getWishlist();
  const exists = list.some((b) => b.id === bird.id);
  const next = exists
    ? list.filter((b) => b.id !== bird.id)
    : [
        ...list,
        {
          id: bird.id,
          name: bird.name,
          species: bird.species,
          price: bird.price,
          stock: bird.stock,
          image_url: bird.image_url,
        },
      ];
  write(WISHLIST_KEY, next);
  return { added: !exists, list: next };
}

export function removeFromWishlist(birdId) {
  const next = getWishlist().filter((b) => b.id !== birdId);
  write(WISHLIST_KEY, next);
  return next;
}

// ---- Notifikasi stok ("Beri tahu saya jika tersedia") ----
export function getStockAlerts() {
  return read(STOCK_ALERT_KEY);
}

export function requestStockAlert(bird) {
  const list = getStockAlerts();
  if (!list.some((a) => a.id === bird.id)) {
    list.push({ id: bird.id, name: bird.name });
    write(STOCK_ALERT_KEY, list);
  }
  return list;
}

export function removeStockAlert(birdId) {
  write(STOCK_ALERT_KEY, getStockAlerts().filter((a) => a.id !== birdId));
}

/**
 * Dipanggil saat katalog dimuat / stok berubah.
 * Mengembalikan daftar burung yang dulu diminta notifikasi dan sekarang tersedia.
 */
export function consumeAvailableAlerts(birds) {
  const alerts = getStockAlerts();
  if (alerts.length === 0) return [];
  const available = birds.filter(
    (b) => Number(b.stock) > 0 && alerts.some((a) => a.id === b.id)
  );
  available.forEach((b) => removeStockAlert(b.id));
  return available;
}
