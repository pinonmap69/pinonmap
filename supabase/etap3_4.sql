-- ============================================================
-- Pin on Map — Etap 3 (dokończenie) + Etap 4 (trasy, wyszukiwanie)
-- Wklej w Supabase Dashboard -> SQL Editor -> New query -> Run. Idempotentny.
-- ============================================================

-- Przypinanie całych tablic: skąd skopiowano tablicę
alter table public.boards add column if not exists source_board_id uuid references public.boards(id) on delete set null;
create index if not exists boards_visibility_idx on public.boards(visibility, created_at desc);

-- Optymalizacja wyszukiwania / dużej liczby publikacji
create index if not exists places_category_idx on public.places(category);
create index if not exists places_user_created_idx on public.places(user_id, created_at desc);
create index if not exists board_pins_user_idx on public.board_pins(user_id);

-- ---------- ROUTES / TRASY (Etap 4) ----------
create table if not exists public.routes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  start_point  jsonb not null,             -- {title, lat, lng, place_id?}
  end_point    jsonb not null,
  stops        jsonb not null default '[]'::jsonb,  -- bez limitu liczby punktów
  geometry     jsonb,                      -- uproszczona linia [{lat,lng}]
  distance_m   double precision,
  duration_s   double precision,
  radius_km    double precision not null default 20,
  mode         text not null default 'car' check (mode in ('car','bike','foot')),
  visibility   text not null default 'private' check (visibility in ('public','private','premium')),
  board_id     uuid references public.boards(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists routes_user_idx on public.routes(user_id, created_at desc);
alter table public.routes enable row level security;

drop policy if exists "routes_select_public_or_own" on public.routes;
create policy "routes_select_public_or_own" on public.routes
  for select using (visibility = 'public' or auth.uid() = user_id);
drop policy if exists "routes_insert_own" on public.routes;
create policy "routes_insert_own" on public.routes for insert with check (auth.uid() = user_id);
drop policy if exists "routes_update_own" on public.routes;
create policy "routes_update_own" on public.routes for update using (auth.uid() = user_id);
drop policy if exists "routes_delete_own" on public.routes;
create policy "routes_delete_own" on public.routes for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
