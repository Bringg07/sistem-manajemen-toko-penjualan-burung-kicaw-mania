-- Auto-archive birds when stock reaches zero.
-- Run this SQL in Supabase after deploying the app.

create or replace function public.auto_archive_bird_on_zero_stock()
returns trigger
language plpgsql
as $$
begin
	if coalesce(new.stock, 0) <= 0 then
		new.deleted_at := coalesce(new.deleted_at, now());
		new.is_hidden := true;
	end if;

	return new;
end;
$$;

drop trigger if exists trg_auto_archive_bird_on_zero_stock on public.birds;

create trigger trg_auto_archive_bird_on_zero_stock
before insert or update of stock on public.birds
for each row
execute function public.auto_archive_bird_on_zero_stock();
