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
