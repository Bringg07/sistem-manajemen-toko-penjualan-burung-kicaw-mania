-- ============================================================
-- KICAW MANIA - Database Schema
-- Jalankan SQL ini di Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- 1. TABEL PROFIL (terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: otomatis buat profil saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'username', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TABEL KATEGORI BURUNG
CREATE TABLE IF NOT EXISTS public.categories (
  id_categories SERIAL PRIMARY KEY,
  cat_name      TEXT NOT NULL,
  cat_desc      TEXT,
  habitat       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABEL BURUNG
CREATE TABLE IF NOT EXISTS public.birds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  species     TEXT NOT NULL DEFAULT '',
  price       NUMERIC NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  image_url   TEXT DEFAULT '',
  is_hidden   BOOLEAN NOT NULL DEFAULT false,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABEL RELASI BURUNG <-> KATEGORI (many-to-many)
CREATE TABLE IF NOT EXISTS public.bird_categories (
  bird_id      UUID NOT NULL REFERENCES public.birds(id) ON DELETE CASCADE,
  kategori_id  INTEGER NOT NULL REFERENCES public.categories(id_categories) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bird_id, kategori_id)
);

-- 5. TABEL PEMBELIAN (purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  address         TEXT NOT NULL DEFAULT '',
  payment_method  TEXT NOT NULL DEFAULT 'Transfer Bank',
  payment_status  TEXT NOT NULL DEFAULT 'pending',
  total_price     NUMERIC NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABEL ITEM PEMBELIAN (purchase_items)
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id        UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  bird_id            UUID,
  bird_name          TEXT NOT NULL DEFAULT '',
  bird_species       TEXT NOT NULL DEFAULT '',
  image_url          TEXT DEFAULT '',
  price_at_purchase  NUMERIC NOT NULL DEFAULT 0,
  quantity           INTEGER NOT NULL DEFAULT 1,
  subtotal           NUMERIC NOT NULL DEFAULT 0
);

-- ============================================================
-- RPC: create_purchase (dipanggil dari checkout)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_purchase(
  checkout_items JSONB,
  delivery_address TEXT,
  payment_method_input TEXT DEFAULT 'Transfer Bank'
)
RETURNS TABLE(purchase_id UUID, total NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total   NUMERIC := 0;
  v_pid     UUID;
  item      JSONB;
  v_bird    RECORD;
  v_sub     NUMERIC;
BEGIN
  -- Ambil user yang login
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User belum login';
  END IF;

  -- Hitung total dari harga saat ini
  FOR item IN SELECT * FROM jsonb_array_elements(checkout_items)
  LOOP
    SELECT price, stock INTO v_bird
    FROM public.birds
    WHERE id = (item ->> 'id')::UUID AND deleted_at IS NULL;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Burung dengan id % tidak ditemukan', item ->> 'id';
    END IF;

    IF v_bird.stock < (item ->> 'quantity')::INT THEN
      RAISE EXCEPTION 'Stok burung % tidak cukup', v_bird.price;
    END IF;

    v_sub := v_bird.price * (item ->> 'quantity')::INT;
    v_total := v_total + v_sub;
  END LOOP;

  -- Insert purchase
  INSERT INTO public.purchases (user_id, address, payment_method, payment_status, total_price)
  VALUES (v_user_id, delivery_address, payment_method_input, 'pending', v_total)
  RETURNING id INTO v_pid;

  -- Insert item + kurangi stok
  FOR item IN SELECT * FROM jsonb_array_elements(checkout_items)
  LOOP
    SELECT price INTO v_bird FROM public.birds WHERE id = (item ->> 'id')::UUID;
    v_sub := v_bird.price * (item ->> 'quantity')::INT;

    INSERT INTO public.purchase_items
      (purchase_id, bird_id, bird_name, bird_species, image_url, price_at_purchase, quantity, subtotal)
    SELECT
      v_pid, b.id, b.name, b.species, b.image_url, b.price, (item ->> 'quantity')::INT, v_sub
    FROM public.birds b WHERE b.id = (item ->> 'id')::UUID;

    UPDATE public.birds
    SET stock = stock - (item ->> 'quantity')::INT
    WHERE id = (item ->> 'id')::UUID;
  END LOOP;

  RETURN QUERY SELECT v_pid, v_total;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bird_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items  ENABLE ROW LEVEL SECURITY;

-- profiles: semua bisa baca, hanya owner yang bisa update
CREATE POLICY "Profiles: public read"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Profiles: owner update"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles: insert on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- birds: semua bisa baca (yang tidak tersembunyi + tidak terhapus)
CREATE POLICY "Birds: public read"
  ON public.birds FOR SELECT USING (true);

-- categories & bird_categories: semua bisa baca
CREATE POLICY "Categories: public read"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Bird Categories: public read"
  ON public.bird_categories FOR SELECT USING (true);

-- purchases: user hanya bisa lihat miliknya sendiri, admin bisa semua
CREATE POLICY "Purchases: user read own"
  ON public.purchases FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Purchases: user insert own"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Purchases: user update own"
  ON public.purchases FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- purchase_items: follow ownership via purchase
CREATE POLICY "Purchase Items: read via purchase"
  ON public.purchase_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchases
      WHERE purchases.id = purchase_items.purchase_id
        AND (
          purchases.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

-- Admin policies: admin bisa CRUD semua tabel (dilakukan via service_role key)
-- Anon/logged-in user hanya perlu SELECT policies di atas.

-- ============================================================
-- STORAGE: buat bucket 'bird-images' (jalankan via Dashboard atau API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bird-images', 'bird-images', true);
-- Atau buat manual di: https://supabase.com/dashboard/project/_/storage/buckets
