-- ============================================================
-- Pin on Map — ETAP 5: Grywalizacja (XP, poziomy, osiągnięcia, odznaki,
-- statystyki, historia aktywności, misje, wydarzenia, fundament nagród)
-- Wklej w Supabase Dashboard -> SQL Editor -> New query -> Run. Idempotentny.
-- Zasady naliczania: docs/GAMIFICATION.md
-- ============================================================

-- ---------- PROFIL: XP + POZIOM ----------
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;

-- Poziom L wymaga 50 * L * (L-1) XP  (L2=100, L3=300, L4=600, L5=1000, L10=4500 ...)
create or replace function public.pom_level_for_xp(p_xp integer)
returns integer language sql immutable as $$
  select greatest(1, floor((1 + sqrt(1 + greatest(p_xp, 0) / 12.5)) / 2)::int)
$$;

-- Użytkownik nie może sam zmienić sobie XP/poziomu przez API
create or replace function public.pom_protect_xp()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.xp := old.xp;
    new.level := old.level;
  end if;
  return new;
end $$;
drop trigger if exists pom_protect_xp on public.profiles;
create trigger pom_protect_xp before update on public.profiles
  for each row execute function public.pom_protect_xp();

-- ---------- ZASADY XP (dane, nie kod) ----------
create table if not exists public.xp_rules (
  type        text primary key,
  xp          integer not null,
  label_pl    text not null,
  label_en    text not null,
  sort        integer not null default 0
);
alter table public.xp_rules enable row level security;
drop policy if exists "xp_rules_select_all" on public.xp_rules;
create policy "xp_rules_select_all" on public.xp_rules for select using (true);

insert into public.xp_rules (type, xp, label_pl, label_en, sort) values
  ('pin_created',     10, 'Dodanie Pinu',                          'Add a pin',                      1),
  ('photo_added',      5, 'Dodanie zdjęcia do Pinu',               'Add a photo to a pin',           2),
  ('place_visited',   20, 'Oznaczenie miejsca jako odwiedzone',    'Mark a place as visited',        3),
  ('board_created',   15, 'Utworzenie tablicy',                    'Create a board',                 4),
  ('pin_saved',        3, 'Zapisanie cudzego Pinu na tablicy',     'Save someone else''s pin',       5),
  ('like_given',       1, 'Polubienie Pinu',                       'Like a pin',                     6),
  ('like_received',    2, 'Otrzymanie polubienia',                 'Receive a like',                 7),
  ('follow',           2, 'Obserwowanie podróżnika',               'Follow a traveler',              8),
  ('follower_gained',  5, 'Nowy obserwujący',                      'Gain a follower',                9),
  ('route_saved',     25, 'Zapisanie trasy',                       'Save a route',                  10),
  ('event_created',   30, 'Utworzenie wydarzenia',                 'Create an event',               11),
  ('event_joined',    10, 'Dołączenie do wydarzenia',              'Join an event',                 12),
  ('event_checkin',   40, 'Check-in na wydarzeniu (GPS)',          'Check in at an event (GPS)',    13)
on conflict (type) do update set xp = excluded.xp, label_pl = excluded.label_pl, label_en = excluded.label_en, sort = excluded.sort;

-- ---------- HISTORIA AKTYWNOŚCI (dziennik XP) ----------
create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  xp         integer not null default 0,
  ref_id     text not null,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, type, ref_id)           -- ta sama akcja nie nalicza XP dwa razy
);
create index if not exists activities_user_created_idx on public.activities(user_id, created_at desc);
create index if not exists activities_created_idx on public.activities(created_at desc);
alter table public.activities enable row level security;
drop policy if exists "activities_select_all" on public.activities;
create policy "activities_select_all" on public.activities for select using (true);
-- brak polityk insert/update/delete: wpisy tworzą wyłącznie funkcje serwerowe

-- ---------- OSIĄGNIĘCIA + ODZNAKI ----------
create table if not exists public.achievements (
  code      text primary key,
  metric    text not null,           -- klucz z pom_stats()
  threshold integer not null,
  tier      text not null check (tier in ('bronze','silver','gold')),  -- odznaka
  icon      text not null,
  xp        integer not null,
  name_pl   text not null,
  name_en   text not null,
  desc_pl   text not null,
  desc_en   text not null,
  sort      integer not null default 0
);
alter table public.achievements enable row level security;
drop policy if exists "achievements_select_all" on public.achievements;
create policy "achievements_select_all" on public.achievements for select using (true);

create table if not exists public.user_achievements (
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text not null references public.achievements(code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, code)
);
alter table public.user_achievements enable row level security;
drop policy if exists "user_achievements_select_all" on public.user_achievements;
create policy "user_achievements_select_all" on public.user_achievements for select using (true);

insert into public.achievements (code, metric, threshold, tier, icon, xp, name_pl, name_en, desc_pl, desc_en, sort) values
  ('first_pin',        'pins',            1,   'bronze', 'MapPin',        20,  'Pierwszy Pin',          'First Pin',          'Dodaj swoje pierwsze miejsce',        'Add your first place',             1),
  ('pin_collector',    'pins',            25,  'silver', 'MapPinned',     100, 'Kolekcjoner Pinów',     'Pin Collector',      'Dodaj 25 miejsc',                     'Add 25 places',                    2),
  ('pin_master',       'pins',            100, 'gold',   'Trophy',        300, 'Mistrz Pinów',          'Pin Master',         'Dodaj 100 miejsc',                    'Add 100 places',                   3),
  ('first_steps',      'visited_places',  1,   'bronze', 'Footprints',    20,  'Pierwsze kroki',        'First Steps',        'Odwiedź pierwsze miejsce',            'Visit your first place',           4),
  ('traveler',         'visited_places',  25,  'silver', 'Backpack',      150, 'Podróżnik',             'Traveler',           'Odwiedź 25 miejsc',                   'Visit 25 places',                  5),
  ('globetrotter',     'visited_places',  100, 'gold',   'Globe',         400, 'Globtroter',            'Globetrotter',       'Odwiedź 100 miejsc',                  'Visit 100 places',                 6),
  ('city_hopper',      'cities',          5,   'bronze', 'Building2',     60,  'Miejski wędrowiec',     'City Hopper',        'Odwiedź 5 miast',                     'Visit 5 cities',                   7),
  ('urban_explorer',   'cities',          20,  'silver', 'Landmark',      200, 'Odkrywca miast',        'Urban Explorer',     'Odwiedź 20 miast',                    'Visit 20 cities',                  8),
  ('border_crosser',   'countries',       3,   'bronze', 'Flag',          80,  'Przekraczający granice','Border Crosser',     'Odwiedź 3 kraje',                     'Visit 3 countries',                9),
  ('world_explorer',   'countries',       10,  'silver', 'Earth',         250, 'Odkrywca świata',       'World Explorer',     'Odwiedź 10 krajów',                   'Visit 10 countries',              10),
  ('citizen_of_world', 'countries',       25,  'gold',   'Crown',         600, 'Obywatel świata',       'Citizen of the World','Odwiedź 25 krajów',                  'Visit 25 countries',              11),
  ('photographer',     'photos',          10,  'bronze', 'Camera',        50,  'Fotograf',              'Photographer',       'Dodaj 10 zdjęć',                      'Add 10 photos',                   12),
  ('curator',          'boards',          3,   'bronze', 'LayoutGrid',    40,  'Kurator',               'Curator',            'Utwórz 3 tablice',                    'Create 3 boards',                 13),
  ('influencer',       'followers',       5,   'bronze', 'Users',         60,  'Influencer',            'Influencer',         'Zdobądź 5 obserwujących',             'Get 5 followers',                 14),
  ('popular',          'likes_received',  10,  'bronze', 'Heart',         60,  'Popularny',             'Popular',            'Zbierz 10 polubień',                  'Receive 10 likes',                15),
  ('trip_planner',     'routes',          1,   'bronze', 'Route',         40,  'Planer podróży',        'Trip Planner',       'Zapisz pierwszą trasę',               'Save your first route',           16),
  ('event_goer',       'events_joined',   1,   'bronze', 'CalendarCheck', 40,  'Uczestnik',             'Event Goer',         'Dołącz do wydarzenia',                'Join an event',                   17),
  ('on_the_spot',      'checkins',        1,   'silver', 'BadgeCheck',    80,  'Na miejscu',            'On the Spot',        'Zrób check-in GPS na wydarzeniu',     'GPS check-in at an event',        18)
on conflict (code) do update set metric = excluded.metric, threshold = excluded.threshold, tier = excluded.tier, icon = excluded.icon, xp = excluded.xp,
  name_pl = excluded.name_pl, name_en = excluded.name_en, desc_pl = excluded.desc_pl, desc_en = excluded.desc_en, sort = excluded.sort;

-- ---------- MISJE ----------
create table if not exists public.missions (
  code          text primary key,
  activity_type text not null,          -- typ z public.activities
  target        integer not null,
  xp            integer not null,
  period        text not null default 'once' check (period in ('once','weekly')),
  icon          text not null,
  name_pl       text not null,
  name_en       text not null,
  desc_pl       text not null,
  desc_en       text not null,
  sort          integer not null default 0,
  active        boolean not null default true
);
alter table public.missions enable row level security;
drop policy if exists "missions_select_all" on public.missions;
create policy "missions_select_all" on public.missions for select using (true);

create table if not exists public.user_missions (
  user_id    uuid not null references auth.users(id) on delete cascade,
  code       text not null references public.missions(code) on delete cascade,
  period_key text not null,             -- 'once' albo np. '2026-W27'
  claimed_at timestamptz not null default now(),
  primary key (user_id, code, period_key)
);
alter table public.user_missions enable row level security;
drop policy if exists "user_missions_select_own" on public.user_missions;
create policy "user_missions_select_own" on public.user_missions for select using (auth.uid() = user_id);

insert into public.missions (code, activity_type, target, xp, period, icon, name_pl, name_en, desc_pl, desc_en, sort) values
  ('m_first_pin',     'pin_created',    1,  50,  'once',   'MapPin',        'Pierwszy krok',        'First step',          'Dodaj 1 Pin',                         'Add 1 pin',                          1),
  ('m_pins_10',       'pin_created',    10, 150, 'once',   'MapPinned',     'Kartograf',            'Cartographer',        'Dodaj 10 Pinów',                      'Add 10 pins',                        2),
  ('m_photos_5',      'photo_added',    5,  75,  'once',   'Camera',        'Oko podróżnika',       'Traveler''s eye',     'Dodaj 5 zdjęć',                       'Add 5 photos',                       3),
  ('m_visit_3',       'place_visited',  3,  100, 'once',   'Footprints',    'W drogę!',             'Hit the road',        'Oznacz 3 miejsca jako odwiedzone',    'Mark 3 places as visited',           4),
  ('m_boards_3',      'board_created',  3,  75,  'once',   'LayoutGrid',    'Porządek musi być',    'Get organized',       'Utwórz 3 tablice',                    'Create 3 boards',                    5),
  ('m_save_10',       'pin_saved',      10, 100, 'once',   'Bookmark',      'Łowca inspiracji',     'Inspiration hunter',  'Zapisz 10 cudzych Pinów',             'Save 10 pins from others',           6),
  ('m_follow_3',      'follow',         3,  50,  'once',   'UserPlus',      'Towarzyski',           'Social butterfly',    'Obserwuj 3 podróżników',              'Follow 3 travelers',                 7),
  ('m_likes_10',      'like_given',     10, 50,  'once',   'Heart',         'Dobre słowo',          'Spread the love',     'Polub 10 Pinów',                      'Like 10 pins',                       8),
  ('m_route_1',       'route_saved',    1,  75,  'once',   'Route',         'Plan podróży',         'Trip plan',           'Zapisz 1 trasę',                      'Save 1 route',                       9),
  ('m_event_join',    'event_joined',   1,  60,  'once',   'CalendarCheck', 'Dołącz do ekipy',      'Join the crew',       'Dołącz do 1 wydarzenia',              'Join 1 event',                      10),
  ('m_event_host',    'event_created',  1,  80,  'once',   'CalendarPlus',  'Gospodarz',            'Host',                'Utwórz 1 wydarzenie',                 'Create 1 event',                    11),
  ('m_checkin',       'event_checkin',  1,  100, 'once',   'BadgeCheck',    'Jestem tu!',           'I''m here!',          'Zrób check-in GPS na wydarzeniu',     'GPS check-in at an event',          12),
  ('w_pins_3',        'pin_created',    3,  60,  'weekly', 'CalendarDays',  'Tygodniowy odkrywca',  'Weekly explorer',     'Dodaj 3 Piny w tym tygodniu',         'Add 3 pins this week',              13),
  ('w_likes_5',       'like_given',     5,  30,  'weekly', 'Sparkles',      'Tygodniowa inspiracja','Weekly inspiration',  'Polub 5 Pinów w tym tygodniu',        'Like 5 pins this week',             14)
on conflict (code) do update set activity_type = excluded.activity_type, target = excluded.target, xp = excluded.xp, period = excluded.period, icon = excluded.icon,
  name_pl = excluded.name_pl, name_en = excluded.name_en, desc_pl = excluded.desc_pl, desc_en = excluded.desc_en, sort = excluded.sort;

-- ---------- WYDARZENIA (lokalizacja GPS + termin) ----------
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  description      text,
  category         text,
  latitude         double precision not null,
  longitude        double precision not null,
  address          text,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  checkin_radius_m integer not null default 500,
  cover_url        text,
  created_at       timestamptz not null default now(),
  check (ends_at >= starts_at)
);
create index if not exists events_starts_idx on public.events(starts_at);
create index if not exists events_geo_idx on public.events(latitude, longitude);
alter table public.events enable row level security;
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own" on public.events for insert with check (auth.uid() = user_id);
drop policy if exists "events_update_own" on public.events;
create policy "events_update_own" on public.events for update using (auth.uid() = user_id);
drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own" on public.events for delete using (auth.uid() = user_id);

create table if not exists public.event_attendees (
  event_id      uuid not null references public.events(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  checked_in_at timestamptz,
  primary key (event_id, user_id)
);
create index if not exists event_attendees_user_idx on public.event_attendees(user_id);
alter table public.event_attendees enable row level security;
drop policy if exists "event_attendees_select_all" on public.event_attendees;
create policy "event_attendees_select_all" on public.event_attendees for select using (true);
drop policy if exists "event_attendees_insert_own" on public.event_attendees;
create policy "event_attendees_insert_own" on public.event_attendees for insert with check (auth.uid() = user_id and checked_in_at is null);
drop policy if exists "event_attendees_delete_own" on public.event_attendees;
create policy "event_attendees_delete_own" on public.event_attendees for delete using (auth.uid() = user_id);

-- ---------- NAGRODY DLA TWÓRCÓW (fundament pod przyszły program) ----------
create table if not exists public.creator_rewards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  period_key  text not null,               -- np. '2026-W27' lub '2026-07'
  rank        integer not null,
  xp          integer not null,
  reward_type text not null default 'pending_definition',
  amount      numeric(12,2),
  currency    text,
  status      text not null default 'pending' check (status in ('pending','approved','paid','rejected')),
  created_at  timestamptz not null default now(),
  unique (user_id, period_key)
);
alter table public.creator_rewards enable row level security;
drop policy if exists "creator_rewards_select_own" on public.creator_rewards;
create policy "creator_rewards_select_own" on public.creator_rewards for select using (auth.uid() = user_id);

-- ============================================================
-- FUNKCJE
-- ============================================================
create or replace function public.pom_stats(p_user uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pins',           (select count(*) from places where user_id = p_user),
    'visited_places', (select count(*) from places where user_id = p_user and status in ('visited','visit_again','been_here')),
    'cities',         (select count(distinct lower(trim(city))) from places where user_id = p_user and status in ('visited','visit_again','been_here') and coalesce(trim(city),'') <> ''),
    'countries',      (select count(distinct lower(trim(country))) from places where user_id = p_user and status in ('visited','visit_again','been_here') and coalesce(trim(country),'') <> ''),
    'photos',         (select count(*) from place_photos where user_id = p_user),
    'boards',         (select count(*) from boards where user_id = p_user),
    'saved_pins',     (select count(*) from board_pins bp join places p on p.id = bp.place_id where bp.user_id = p_user and p.user_id <> p_user),
    'likes_given',    (select count(*) from likes where user_id = p_user),
    'likes_received', (select count(*) from likes l join places p on p.id = l.place_id where p.user_id = p_user and l.user_id <> p_user),
    'followers',      (select count(*) from follows where following_id = p_user),
    'following',      (select count(*) from follows where follower_id = p_user),
    'routes',         (select count(*) from routes where user_id = p_user),
    'events_created', (select count(*) from events where user_id = p_user),
    'events_joined',  (select count(*) from event_attendees where user_id = p_user),
    'checkins',       (select count(*) from event_attendees where user_id = p_user and checked_in_at is not null)
  )
$$;

create or replace function public.pom_evaluate_achievements(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s jsonb := public.pom_stats(p_user); a record;
begin
  for a in select * from achievements order by sort loop
    if coalesce((s->>a.metric)::int, 0) >= a.threshold then
      insert into user_achievements (user_id, code) values (p_user, a.code) on conflict do nothing;
      if found then
        perform public.pom_award(p_user, 'achievement', a.code,
          jsonb_build_object('name_pl', a.name_pl, 'name_en', a.name_en, 'tier', a.tier), a.xp, now(), false);
      end if;
    end if;
  end loop;
end $$;

-- Jedyny punkt naliczania XP. Zwraca true, jeśli XP przyznano (akcja jeszcze nie była liczona).
create or replace function public.pom_award(
  p_user uuid, p_type text, p_ref text, p_meta jsonb default '{}'::jsonb,
  p_xp integer default null, p_at timestamptz default now(), p_evaluate boolean default true)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_xp integer; v_rows integer;
begin
  if p_user is null then return false; end if;
  v_xp := coalesce(p_xp, (select xp from xp_rules where type = p_type), 0);
  insert into activities (user_id, type, xp, ref_id, meta, created_at)
  values (p_user, p_type, v_xp, p_ref, coalesce(p_meta, '{}'::jsonb), coalesce(p_at, now()))
  on conflict (user_id, type, ref_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return false; end if;
  update profiles set xp = xp + v_xp, level = public.pom_level_for_xp(xp + v_xp) where id = p_user;
  if p_evaluate then perform public.pom_evaluate_achievements(p_user); end if;
  return true;
end $$;
revoke execute on function public.pom_award(uuid, text, text, jsonb, integer, timestamptz, boolean) from public, anon, authenticated;
revoke execute on function public.pom_evaluate_achievements(uuid) from public, anon, authenticated;

-- Pełny stan grywalizacji zalogowanego użytkownika
create or replace function public.pom_progress()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_week text := to_char(now() at time zone 'utc', 'IYYY-"W"IW');
  p record;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  perform public.pom_evaluate_achievements(uid);
  select xp, level into p from profiles where id = uid;
  return jsonb_build_object(
    'xp', coalesce(p.xp, 0),
    'level', coalesce(p.level, 1),
    'level_xp', 50 * coalesce(p.level, 1) * (coalesce(p.level, 1) - 1),
    'next_level_xp', 50 * (coalesce(p.level, 1) + 1) * coalesce(p.level, 1),
    'stats', public.pom_stats(uid),
    'achievements', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', a.code, 'metric', a.metric, 'threshold', a.threshold, 'tier', a.tier, 'icon', a.icon, 'xp', a.xp,
        'name_pl', a.name_pl, 'name_en', a.name_en, 'desc_pl', a.desc_pl, 'desc_en', a.desc_en,
        'unlocked_at', ua.unlocked_at) order by a.sort), '[]'::jsonb)
      from achievements a left join user_achievements ua on ua.code = a.code and ua.user_id = uid),
    'missions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', m.code, 'type', m.activity_type, 'target', m.target, 'xp', m.xp, 'period', m.period, 'icon', m.icon,
        'name_pl', m.name_pl, 'name_en', m.name_en, 'desc_pl', m.desc_pl, 'desc_en', m.desc_en,
        'progress', (select count(*) from activities ac where ac.user_id = uid and ac.type = m.activity_type
                      and (m.period = 'once' or ac.created_at >= date_trunc('week', now()))),
        'claimed', exists (select 1 from user_missions um where um.user_id = uid and um.code = m.code
                      and um.period_key = case when m.period = 'once' then 'once' else v_week end)
      ) order by m.sort), '[]'::jsonb)
      from missions m where m.active)
  );
end $$;
grant execute on function public.pom_progress() to authenticated;

create or replace function public.pom_claim_mission(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  m record;
  v_key text;
  v_progress integer;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into m from missions where code = p_code and active;
  if not found then raise exception 'mission not found'; end if;
  v_key := case when m.period = 'once' then 'once' else to_char(now() at time zone 'utc', 'IYYY-"W"IW') end;
  select count(*) into v_progress from activities
    where user_id = uid and type = m.activity_type and (m.period = 'once' or created_at >= date_trunc('week', now()));
  if v_progress < m.target then raise exception 'mission not completed'; end if;
  insert into user_missions (user_id, code, period_key) values (uid, m.code, v_key) on conflict do nothing;
  if found then
    perform public.pom_award(uid, 'mission', m.code || ':' || v_key,
      jsonb_build_object('name_pl', m.name_pl, 'name_en', m.name_en), m.xp, now(), true);
  end if;
  return public.pom_progress();
end $$;
grant execute on function public.pom_claim_mission(text) to authenticated;

-- Ranking twórców: 'week' | 'month' | 'all'
create or replace function public.pom_leaderboard(p_period text default 'all', p_limit integer default 50)
returns table (user_id uuid, display_name text, username text, avatar_url text, xp bigint, level integer, rank bigint)
language sql stable security definer set search_path = public as $$
  with scores as (
    select pr.id as user_id,
      case when p_period = 'all' then pr.xp::bigint
           else coalesce((select sum(a.xp) from activities a where a.user_id = pr.id and a.created_at >=
                 case when p_period = 'week' then date_trunc('week', now()) else date_trunc('month', now()) end), 0)::bigint
      end as xp
    from profiles pr
  )
  select s.user_id, pr.display_name, pr.username, pr.avatar_url, s.xp, pr.level,
         rank() over (order by s.xp desc) as rank
  from scores s join profiles pr on pr.id = s.user_id
  where s.xp > 0
  order by s.xp desc
  limit least(greatest(p_limit, 1), 200)
$$;
grant execute on function public.pom_leaderboard(text, integer) to authenticated, anon;

-- Snapshot najlepszych twórców do przyszłego systemu nagród (tylko service_role / admin)
create or replace function public.pom_snapshot_rewards(p_period text default 'week', p_top integer default 10)
returns integer language plpgsql security definer set search_path = public as $$
declare v_key text; v_rows integer;
begin
  v_key := case when p_period = 'week' then to_char(now() at time zone 'utc', 'IYYY-"W"IW') else to_char(now() at time zone 'utc', 'YYYY-MM') end;
  insert into creator_rewards (user_id, period_key, rank, xp)
  select l.user_id, v_key, l.rank, l.xp from public.pom_leaderboard(p_period, p_top) l
  on conflict (user_id, period_key) do update set rank = excluded.rank, xp = excluded.xp;
  get diagnostics v_rows = row_count;
  return v_rows;
end $$;
revoke execute on function public.pom_snapshot_rewards(text, integer) from public, anon, authenticated;

-- Check-in GPS na wydarzeniu: w czasie trwania (±30 min) i w promieniu checkin_radius_m
create or replace function public.pom_event_checkin(p_event uuid, p_lat double precision, p_lng double precision)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); e record; d double precision;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into e from events where id = p_event;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if now() < e.starts_at - interval '30 minutes' or now() > e.ends_at + interval '30 minutes' then
    return jsonb_build_object('ok', false, 'reason', 'not_active');
  end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(e.latitude - p_lat) / 2), 2)
        + cos(radians(p_lat)) * cos(radians(e.latitude)) * power(sin(radians(e.longitude - p_lng) / 2), 2)));
  if d > e.checkin_radius_m then
    return jsonb_build_object('ok', false, 'reason', 'too_far', 'distance_m', round(d));
  end if;
  insert into event_attendees (event_id, user_id, checked_in_at) values (p_event, uid, now())
    on conflict (event_id, user_id) do update set checked_in_at = coalesce(event_attendees.checked_in_at, now());
  perform public.pom_award(uid, 'event_checkin', p_event::text, jsonb_build_object('title', e.title), null, now(), true);
  return jsonb_build_object('ok', true, 'distance_m', round(d));
end $$;
grant execute on function public.pom_event_checkin(uuid, double precision, double precision) to authenticated;

-- ============================================================
-- TRIGGERY: automatyczne naliczanie XP (błąd grywalizacji nigdy nie blokuje akcji)
-- ============================================================
create or replace function public.pom_trg_places()
returns trigger language plpgsql security definer set search_path = public as $$
begin
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
drop trigger if exists pom_trg_places on public.places;
create trigger pom_trg_places after insert or update of status on public.places
  for each row execute function public.pom_trg_places();

create or replace function public.pom_trg_simple()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  begin
    if tg_table_name = 'place_photos' then
      perform public.pom_award(new.user_id, 'photo_added', new.id::text);
    elsif tg_table_name = 'boards' then
      perform public.pom_award(new.user_id, 'board_created', new.id::text, jsonb_build_object('title', new.name));
    elsif tg_table_name = 'board_pins' then
      select user_id into v_owner from places where id = new.place_id;
      if v_owner is distinct from new.user_id then
        perform public.pom_award(new.user_id, 'pin_saved', new.place_id::text);
      end if;
    elsif tg_table_name = 'likes' then
      perform public.pom_award(new.user_id, 'like_given', new.place_id::text);
      select user_id into v_owner from places where id = new.place_id;
      if v_owner is distinct from new.user_id then
        perform public.pom_award(v_owner, 'like_received', new.user_id::text || ':' || new.place_id::text);
      end if;
    elsif tg_table_name = 'follows' then
      perform public.pom_award(new.follower_id, 'follow', new.following_id::text);
      perform public.pom_award(new.following_id, 'follower_gained', new.follower_id::text);
    elsif tg_table_name = 'routes' then
      perform public.pom_award(new.user_id, 'route_saved', new.id::text, jsonb_build_object('title', new.name));
    elsif tg_table_name = 'events' then
      perform public.pom_award(new.user_id, 'event_created', new.id::text, jsonb_build_object('title', new.title));
    elsif tg_table_name = 'event_attendees' then
      perform public.pom_award(new.user_id, 'event_joined', new.event_id::text);
    end if;
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists pom_trg_photos on public.place_photos;
create trigger pom_trg_photos after insert on public.place_photos for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_boards on public.boards;
create trigger pom_trg_boards after insert on public.boards for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_board_pins on public.board_pins;
create trigger pom_trg_board_pins after insert on public.board_pins for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_likes on public.likes;
create trigger pom_trg_likes after insert on public.likes for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_follows on public.follows;
create trigger pom_trg_follows after insert on public.follows for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_routes on public.routes;
create trigger pom_trg_routes after insert on public.routes for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_events on public.events;
create trigger pom_trg_events after insert on public.events for each row execute function public.pom_trg_simple();
drop trigger if exists pom_trg_event_attendees on public.event_attendees;
create trigger pom_trg_event_attendees after insert on public.event_attendees for each row execute function public.pom_trg_simple();

-- ============================================================
-- BACKFILL: nalicz XP za dotychczasową aktywność (bez duplikatów)
-- ============================================================
do $$
declare r record;
begin
  for r in select id, user_id, title, created_at from places loop
    perform public.pom_award(r.user_id, 'pin_created', r.id::text, jsonb_build_object('title', r.title), null, r.created_at, false);
  end loop;
  for r in select id, user_id, title, city, country, created_at as at from places where status in ('visited','visit_again','been_here') loop
    perform public.pom_award(r.user_id, 'place_visited', r.id::text, jsonb_build_object('title', r.title, 'city', r.city, 'country', r.country), null, r.at, false);
  end loop;
  for r in select id, user_id, created_at from place_photos loop
    perform public.pom_award(r.user_id, 'photo_added', r.id::text, '{}'::jsonb, null, r.created_at, false);
  end loop;
  for r in select id, user_id, name, created_at from boards loop
    perform public.pom_award(r.user_id, 'board_created', r.id::text, jsonb_build_object('title', r.name), null, r.created_at, false);
  end loop;
  for r in select bp.user_id, bp.place_id, bp.created_at from board_pins bp join places p on p.id = bp.place_id where p.user_id <> bp.user_id loop
    perform public.pom_award(r.user_id, 'pin_saved', r.place_id::text, '{}'::jsonb, null, r.created_at, false);
  end loop;
  for r in select l.user_id, l.place_id, l.created_at, p.user_id as owner from likes l join places p on p.id = l.place_id loop
    perform public.pom_award(r.user_id, 'like_given', r.place_id::text, '{}'::jsonb, null, r.created_at, false);
    if r.owner <> r.user_id then
      perform public.pom_award(r.owner, 'like_received', r.user_id::text || ':' || r.place_id::text, '{}'::jsonb, null, r.created_at, false);
    end if;
  end loop;
  for r in select follower_id, following_id, created_at from follows loop
    perform public.pom_award(r.follower_id, 'follow', r.following_id::text, '{}'::jsonb, null, r.created_at, false);
    perform public.pom_award(r.following_id, 'follower_gained', r.follower_id::text, '{}'::jsonb, null, r.created_at, false);
  end loop;
  for r in select id, user_id, name, created_at from routes loop
    perform public.pom_award(r.user_id, 'route_saved', r.id::text, jsonb_build_object('title', r.name), null, r.created_at, false);
  end loop;
  for r in select id from profiles loop
    perform public.pom_evaluate_achievements(r.id);
  end loop;
  -- spójność: XP = suma dziennika
  update profiles pr set xp = coalesce((select sum(a.xp) from activities a where a.user_id = pr.id), 0);
  update profiles set level = public.pom_level_for_xp(xp);
end $$;

notify pgrst, 'reload schema';
