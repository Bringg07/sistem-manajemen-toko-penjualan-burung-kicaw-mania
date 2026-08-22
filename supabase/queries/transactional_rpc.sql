-- =====================================================================
-- OPSIONAL: RPC transaksional untuk operasi multi-step.
-- Jalankan di Supabase SQL Editor bila ingin atomicity penuh di DB
-- (kode aplikasi sudah melakukan cleanup kompensasi di sisi server,
--  tapi versi RPC ini lebih aman karena berjalan dalam satu transaksi).
--
-- CATATAN: sesuaikan nama tabel/kolom bila skema Anda berbeda.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Hapus permanen burung beserta relasinya (mencegah baris yatim).
--    Panggil dari server: supabase.rpc('hard_delete_bird', { bird_id_input: ... })
-- ---------------------------------------------------------------------
create or replace function public.hard_delete_bird(bird_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.bird_categories where bird_id = bird_id_input;
  delete from public.birds where id = bird_id_input;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Referensi pola create_purchase yang aman race-condition:
--    kunci baris stok dengan SELECT ... FOR UPDATE sebelum decrement,
--    sehingga dua checkout bersamaan tidak bisa menjual stok yang sama.
--
-- create or replace function public.create_purchase(
--   checkout_items jsonb,
--   delivery_address text,
--   payment_method_input text
-- )
-- returns table (purchase_id uuid)
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- declare
--   v_user uuid := auth.uid();
--   v_purchase uuid;
--   v_item jsonb;
--   v_bird record;
--   v_qty int;
-- begin
--   if v_user is null then
--     raise exception 'Harus login untuk checkout';
--   end if;
--
--   insert into public.purchases (user_id, address, payment_method, payment_status, total_price)
--   values (v_user, delivery_address, payment_method_input, 'pending', 0)
--   returning id into v_purchase;
--
--   for v_item in select * from jsonb_array_elements(checkout_items) loop
--     v_qty := greatest(1, coalesce((v_item->>'quantity')::int, 1));
--
--     -- KUNCI BARIS: transaksi lain menunggu sampai baris ini dilepas
--     select * into v_bird from public.birds
--     where id = (v_item->>'id')::uuid and deleted_at is null
--     for update;
--
--     if not found then
--       raise exception 'Burung tidak ditemukan';
--     end if;
--     if v_bird.stock < v_qty then
--       raise exception 'Stok % tidak mencukupi', v_bird.name;
--     end if;
--
--     insert into public.purchase_items (
--       purchase_id, bird_id, bird_name, bird_species, image_url,
--       price_at_purchase, quantity, subtotal
--     ) values (
--       v_purchase, v_bird.id, v_bird.name, v_bird.species, v_bird.image_url,
--       v_bird.price, v_qty, v_bird.price * v_qty
--     );
--
--     update public.birds set stock = stock - v_qty where id = v_bird.id;
--   end loop;
--
--   update public.purchases
--   set total_price = (select coalesce(sum(subtotal), 0) from public.purchase_items where purchase_id = v_purchase)
--   where id = v_purchase;
--
--   return query select v_purchase;
-- end;
-- $$;
