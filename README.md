# 🐦 Kicaw Mania - Platform E-Commerce Burung

Kicaw Mania adalah sebuah aplikasi web e-commerce komprehensif yang dirancang khusus untuk manajemen katalog dan penjualan berbagai jenis burung (kicau, hias, predator, dll). Platform ini menyediakan antarmuka yang responsif dan intuitif baik untuk pelanggan (User) dalam melakukan transaksi, maupun bagi pengelola (Admin) dalam mengatur inventaris dan pesanan.

Proyek ini dikembangkan untuk memenuhi syarat Tugas Akhir praktikum, dengan mengimplementasikan operasi CRUD penuh (termasuk *Soft* dan *Hard Delete*), relasi antar tabel database yang kompleks, sistem autentikasi, serta fitur pencarian dan filter dinamis.

---

## 👥 Tim Pengembang

Proyek ini dikembangkan oleh **Kelompok 12**, yang merupakan gabungan dari anggota berikut:

| NIM | Nama Lengkap |
| :--- | :--- |
| 21120123130085 | Redista Rakha Izza |
| 21120123120004 | Radhito Pramudya Adrie |
| 21120123130054 | Daris Muhammad Ilham |
| 21120123120006 | Yosua Kevan Unggul Budihardjo |
| 21120124130099 | Galileo Athari Muhammad |
| 21120124130071 | Muhamad Ali Rohman |
| 21120124120018 | Anindya Fairuz Az Zahra |
| 21120124140112 | Dafa Briangga Agdyananta |

*(Catatan: Susunan nama di atas digabungkan dari Kelompok 27 dan Kelompok 45).*

---

## ✨ Fitur Utama

Aplikasi ini dibagi menjadi dua *role* utama (Aktor): **Admin** dan **User**, dengan batasan akses masing-masing.

### 👤 Fitur User (Pelanggan)
* **Autentikasi:** Mendaftar (*Sign Up*) dan Masuk (*Login*) menggunakan Supabase Auth.
* **Katalog Dinamis:** Melihat daftar burung yang tersedia dengan fitur *Search* (berdasarkan nama/spesies) dan *Filter* (berdasarkan kategori).
* **Keranjang Belanja:** Menambah, mengurangi, atau menghapus item dari keranjang dengan validasi ketersediaan stok.
* **Checkout & Pembayaran:** Mengisi detail pengiriman dan memilih metode pembayaran untuk menyelesaikan pesanan.
* **Riwayat Pesanan:** Melihat status transaksi terkini (Pending, Diproses, Dikirim, Selesai) beserta rincian histori pembelian.

### 🛡️ Fitur Admin (Pengelola)
* **Admin Panel Protected:** Rute yang hanya bisa diakses oleh akun dengan *role* Admin.
* **Kelola Burung (CRUD):** Menambah, mengedit, dan menghapus (*Soft Delete* / Arsip & *Hard Delete* permanen) data burung berserta fotonya.
* **Kelola Kategori (CRUD):** Membuat dan mengedit kategori/klasifikasi burung beserta habitatnya.
* **Manajemen Pesanan:** Melihat semua pesanan masuk dari pelanggan dan memperbarui status transaksinya (Proses, Kirim, Selesai).
* **Dashboard Notifikasi:** Mendapatkan *badge* jumlah pesanan baru yang berstatus *pending*.

---

## 🛠️ Teknologi yang Digunakan

* **Framework Frontend:** [Next.js](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Icons:** [Lucide React](https://lucide.dev/)

### Struktur Database (ERD)
Sistem ini menggunakan 6 tabel relasional yang saling terhubung:
1. `profiles` (1:1 dengan `auth.users`)
2. `birds` (Data master produk)
3. `categories` (Data master klasifikasi)
4. `bird_categories` (Tabel *Junction* Many-to-Many antara burung dan kategori)
5. `purchases` (Header transaksi / Invoice)
6. `purchase_items` (Detail transaksi yang dibeli)

---
