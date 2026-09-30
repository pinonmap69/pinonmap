-- Pin on Map — ETAP 6A: udostępnianie (statystyki udostępnień + XP). Idempotentny.
create table if not exists public.shares (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('place','board','route','event','user')),
  ref_id     uuid not null,
  target     text not null,              -- whatsapp, messenger, facebook, instagram, tiktok, telegram, x, sms, email ...
  created_at timestamptz not null default now()
);
create index if not exists shares_ref_idx on public.shares(kind, ref_id);
create index if not exists shares_user_idx on public.shares(user_id, created_at desc);
alter table public.shares enable row level security;
drop policy if exists "shares_insert_own" on public.shares;
create policy "shares_insert_own" on public.shares for insert with check (auth.uid() = user_id);
drop policy if exists "shares_select_own" on public.shares;
create policy "shares_select_own" on public.shares for select using (auth.uid() = user_id);

insert into public.xp_rules (type, xp, label_pl, label_en, sort) values
  ('content_shared', 5, 'Udostępnienie treści', 'Share content', 14)
on conflict (type) do update set xp = excluded.xp, label_pl = excluded.label_pl, label_en = excluded.label_en;

insert into public.missions (code, activity_type, target, xp, period, icon, name_pl, name_en, desc_pl, desc_en, sort) values
  ('m_share_3', 'content_shared', 3, 60, 'once', 'Share2', 'Ambasador', 'Ambassador', 'Udostępnij 3 treści znajomym', 'Share 3 things with friends', 15)
on conflict (code) do update set activity_type = excluded.activity_type, target = excluded.target, xp = excluded.xp;

-- XP raz na daną treść (ref = kind:id), niezależnie od liczby udostępnień
create or replace function public.pom_trg_shares()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.pom_award(new.user_id, 'content_shared', new.kind || ':' || new.ref_id::text, jsonb_build_object('target', new.target));
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists pom_trg_shares on public.shares;
create trigger pom_trg_shares after insert on public.shares for each row execute function public.pom_trg_shares();

-- Liczba udostępnień treści (publicznie, bez danych osobowych) — pod statystyki twórców (6E) i reklam (6D)
create or replace function public.pom_share_count(p_kind text, p_ref uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from shares where kind = p_kind and ref_id = p_ref
$$;
grant execute on function public.pom_share_count(text, uuid) to authenticated, anon;

notify pgrst, 'reload schema';
-- Pin on Map — ETAP 6B (część): import zewnętrznych baz miejsc (UNESCO). Idempotentny.
alter table public.places add column if not exists source      text not null default 'user';
alter table public.places add column if not exists external_id text;
alter table public.places add column if not exists source_url  text;
alter table public.places add column if not exists source_meta jsonb not null default '{}'::jsonb;
alter table public.places add column if not exists imported_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'places_source_external_uniq') then
    alter table public.places add constraint places_source_external_uniq unique (source, external_id);
  end if;
end $$;
create index if not exists places_source_idx on public.places(source, created_at desc);

create table if not exists public.import_runs (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,
  status      text not null default 'running' check (status in ('running','success','error')),
  inserted    integer not null default 0,
  updated     integer not null default 0,
  total       integer not null default 0,
  message     text,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.import_runs enable row level security;
drop policy if exists "import_runs_select_all" on public.import_runs;
create policy "import_runs_select_all" on public.import_runs for select using (true);

-- Importowane miejsca nie naliczają XP kontu systemowemu
create or replace function public.pom_trg_places()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.source, 'user') <> 'user' then return new; end if;
  begin
    if tg_op = 'INSERT' then
      perform public.pom_award(new.user_id, 'pin_created', new.id::text, jsonb_build_object('title', new.title));
    end if;
    if new.status in ('visited','visit_again','been_here')
       and (tg_op = 'INSERT' or coalesce(old.status, '') not in ('visited','visit_again','been_here')) then
      perform public.pom_award(new.user_id, 'place_visited', new.id::text,
        jsonb_build_object('title', new.title, 'city', new.city, 'country', new.country));
    end if;
  exception when others then null;
  end;
  return new;
end $$;

notify pgrst, 'reload schema';
