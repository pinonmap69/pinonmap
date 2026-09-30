-- ============================================================
-- Pin on Map — Supabase schema (Etap 1: konta/profile, Etap 2: mapa/miejsca)
-- Uruchom w Supabase Dashboard -> SQL Editor -> New query -> Run
-- Skrypt jest idempotentny (można uruchamiać wielokrotnie).
-- ============================================================

-- ---------- PROFILES (Etap 1) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-utworzenie profilu po rejestracji
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- PLACES / LOKALIZACJE (Etap 2) ----------
create table if not exists public.places (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  category     text,
  city         text,
  country      text,
  latitude     double precision not null,
  longitude    double precision not null,
  cover_url    text,
  created_at   timestamptz not null default now()
);

create index if not exists places_user_id_idx on public.places(user_id);
create index if not exists places_created_at_idx on public.places(created_at desc);
create index if not exists places_geo_idx on public.places(latitude, longitude);

alter table public.places enable row level security;

drop policy if exists "places_select_all" on public.places;
create policy "places_select_all" on public.places
  for select using (true);

drop policy if exists "places_insert_own" on public.places;
create policy "places_insert_own" on public.places
  for insert with check (auth.uid() = user_id);

drop policy if exists "places_update_own" on public.places;
create policy "places_update_own" on public.places
  for update using (auth.uid() = user_id);

drop policy if exists "places_delete_own" on public.places;
create policy "places_delete_own" on public.places
  for delete using (auth.uid() = user_id);

-- ---------- PLACE PHOTOS (Etap 2) ----------
create table if not exists public.place_photos (
  id         uuid primary key default gen_random_uuid(),
  place_id   uuid not null references public.places(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  url        text not null,
  created_at timestamptz not null default now()
);

create index if not exists place_photos_place_id_idx on public.place_photos(place_id);

alter table public.place_photos enable row level security;

drop policy if exists "place_photos_select_all" on public.place_photos;
create policy "place_photos_select_all" on public.place_photos
  for select using (true);

drop policy if exists "place_photos_insert_own" on public.place_photos;
create policy "place_photos_insert_own" on public.place_photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "place_photos_delete_own" on public.place_photos;
create policy "place_photos_delete_own" on public.place_photos
  for delete using (auth.uid() = user_id);

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('place-photos', 'place-photos', true)
  on conflict (id) do nothing;

-- Publiczny odczyt
drop policy if exists "public_read_avatars" on storage.objects;
create policy "public_read_avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "public_read_place_photos" on storage.objects;
create policy "public_read_place_photos" on storage.objects
  for select using (bucket_id = 'place-photos');

-- Zapis tylko do własnego folderu ({user_id}/plik)
drop policy if exists "user_write_avatars" on storage.objects;
create policy "user_write_avatars" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user_update_avatars" on storage.objects;
create policy "user_update_avatars" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user_write_place_photos" on storage.objects;
create policy "user_write_place_photos" on storage.objects
  for insert with check (
    bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user_delete_place_photos" on storage.objects;
create policy "user_delete_place_photos" on storage.objects
  for delete using (
    bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- STATUS MIEJSCA (Etap 2) ----------
-- Statusy: want_to_visit | visited | visit_again | been_here
alter table public.places
  add column if not exists status text not null default 'want_to_visit';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'places_status_check') then
    alter table public.places
      add constraint places_status_check
      check (status in ('want_to_visit','visited','visit_again','been_here'));
  end if;
end $$;

create index if not exists places_status_idx on public.places(status);

-- ---------- TABLICE / BOARDS (struktura przygotowana pod Etap 3) ----------
create table if not exists public.boards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  cover_url    text,
  visibility   text not null default 'public' check (visibility in ('public','private','premium')),
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists boards_user_id_idx on public.boards(user_id);
alter table public.boards enable row level security;

drop policy if exists "boards_select_public_or_own" on public.boards;
create policy "boards_select_public_or_own" on public.boards
  for select using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "boards_insert_own" on public.boards;
create policy "boards_insert_own" on public.boards
  for insert with check (auth.uid() = user_id);

drop policy if exists "boards_update_own" on public.boards;
create policy "boards_update_own" on public.boards
  for update using (auth.uid() = user_id);

drop policy if exists "boards_delete_own" on public.boards;
create policy "boards_delete_own" on public.boards
  for delete using (auth.uid() = user_id);

-- Powiązanie Pinów z tablicami (wiele-do-wielu)
create table if not exists public.board_pins (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.boards(id) on delete cascade,
  place_id   uuid not null references public.places(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (board_id, place_id)
);

create index if not exists board_pins_board_id_idx on public.board_pins(board_id);
create index if not exists board_pins_place_id_idx on public.board_pins(place_id);
alter table public.board_pins enable row level security;

drop policy if exists "board_pins_select_all" on public.board_pins;
create policy "board_pins_select_all" on public.board_pins
  for select using (true);

drop policy if exists "board_pins_insert_own" on public.board_pins;
create policy "board_pins_insert_own" on public.board_pins
  for insert with check (auth.uid() = user_id);

drop policy if exists "board_pins_delete_own" on public.board_pins;
create policy "board_pins_delete_own" on public.board_pins
  for delete using (auth.uid() = user_id);
