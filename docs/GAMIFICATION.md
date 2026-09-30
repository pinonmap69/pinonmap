# Pin on Map — zasady grywalizacji (Etap 5)

Wszystkie punkty są naliczane **po stronie serwera** (Supabase/Postgres) przez triggery i funkcje
`security definer`. Klient nie może sam dopisać XP (brak polityk `insert` na `activities`,
trigger `pom_protect_xp` blokuje zmianę `profiles.xp/level` przez API).

## 1. Punkty doświadczenia (XP)

Źródło prawdy: tabela `xp_rules` (edytowalna bez zmian w kodzie).

| Akcja (`activities.type`) | XP | Kiedy |
|---|---|---|
| `pin_created` | 10 | dodanie Pinu |
| `photo_added` | 5 | dodanie zdjęcia do Pinu |
| `place_visited` | 20 | status Pinu zmieniony na Odwiedzone / Byłem tutaj / Chcę ponownie |
| `board_created` | 15 | utworzenie tablicy |
| `pin_saved` | 3 | zapisanie cudzego Pinu na tablicy |
| `like_given` | 1 | polubienie Pinu |
| `like_received` | 2 | ktoś polubił Twój Pin |
| `follow` | 2 | obserwowanie podróżnika |
| `follower_gained` | 5 | nowy obserwujący |
| `route_saved` | 25 | zapisanie trasy |
| `event_created` | 30 | utworzenie wydarzenia |
| `event_joined` | 10 | dołączenie do wydarzenia |
| `event_checkin` | 40 | check-in GPS na wydarzeniu |
| `achievement` | wg osiągnięcia | odblokowanie osiągnięcia |
| `mission` | wg misji | odebranie nagrody za misję |

**Anty-farming:** unikalny klucz `(user_id, type, ref_id)` — ta sama akcja na tym samym obiekcie
(np. polub → odlub → polub) nalicza XP tylko raz.

## 2. Poziomy

Poziom `L` wymaga `50 × L × (L − 1)` XP (funkcja `pom_level_for_xp`), aktualizowany automatycznie
przy każdym naliczeniu XP.

| Poziom | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| XP | 0 | 100 | 300 | 600 | 1000 | 1500 | 2100 | 2800 | 3600 | 4500 |

## 3. Statystyki podróżnicze (`pom_stats`)

- `pins` – liczba dodanych Pinów
- `visited_places` – Piny ze statusem odwiedzonym (visited / visit_again / been_here)
- `cities` / `countries` – unikalne miasta / kraje wśród odwiedzonych Pinów
- `photos`, `boards`, `saved_pins`, `likes_given`, `likes_received`, `followers`, `following`,
  `routes`, `events_created`, `events_joined`, `checkins`

## 4. Osiągnięcia i odznaki

Tabela `achievements` (18 pozycji). Osiągnięcie = próg na metryce z `pom_stats`.
Odznaka = wizualny poziom osiągnięcia: **brąz / srebro / złoto**. Sprawdzane automatycznie
po każdej akcji (`pom_evaluate_achievements`) i przy otwarciu ekranu postępów.

| Kod | Metryka ≥ próg | Odznaka | XP |
|---|---|---|---|
| first_pin | pins ≥ 1 | brąz | 20 |
| pin_collector | pins ≥ 25 | srebro | 100 |
| pin_master | pins ≥ 100 | złoto | 300 |
| first_steps | visited_places ≥ 1 | brąz | 20 |
| traveler | visited_places ≥ 25 | srebro | 150 |
| globetrotter | visited_places ≥ 100 | złoto | 400 |
| city_hopper | cities ≥ 5 | brąz | 60 |
| urban_explorer | cities ≥ 20 | srebro | 200 |
| border_crosser | countries ≥ 3 | brąz | 80 |
| world_explorer | countries ≥ 10 | srebro | 250 |
| citizen_of_world | countries ≥ 25 | złoto | 600 |
| photographer | photos ≥ 10 | brąz | 50 |
| curator | boards ≥ 3 | brąz | 40 |
| influencer | followers ≥ 5 | brąz | 60 |
| popular | likes_received ≥ 10 | brąz | 60 |
| trip_planner | routes ≥ 1 | brąz | 40 |
| event_goer | events_joined ≥ 1 | brąz | 40 |
| on_the_spot | checkins ≥ 1 | srebro | 80 |

## 5. Misje (14)

Tabela `missions`. Postęp = liczba wpisów danego typu w `activities`
(dla misji tygodniowych — od poniedziałku bieżącego tygodnia ISO). Nagrodę odbiera się
przyciskiem „Odbierz” (`pom_claim_mission`), serwer weryfikuje postęp; misje tygodniowe
odnawiają się co tydzień (`period_key` = `IYYY-WIW`).

m_first_pin (1 Pin, 50) · m_pins_10 (10 Pinów, 150) · m_photos_5 (5 zdjęć, 75) ·
m_visit_3 (3 odwiedzone, 100) · m_boards_3 (3 tablice, 75) · m_save_10 (10 zapisanych, 100) ·
m_follow_3 (3 obserwowanych, 50) · m_likes_10 (10 polubień, 50) · m_route_1 (1 trasa, 75) ·
m_event_join (1 wydarzenie, 60) · m_event_host (utwórz wydarzenie, 80) · m_checkin (check-in, 100) ·
w_pins_3 (tygodniowo 3 Piny, 60) · w_likes_5 (tygodniowo 5 polubień, 30)

## 6. Wydarzenia

Tabela `events` (lokalizacja GPS, `starts_at`, `ends_at`, `checkin_radius_m` = 500 m).
Check-in (`pom_event_checkin`) działa tylko od 30 min przed startem do 30 min po końcu
i w promieniu `checkin_radius_m` od punktu wydarzenia (odległość liczona na serwerze).

## 7. Fundament systemu nagród

- `pom_leaderboard(period)` – ranking twórców: tydzień / miesiąc / cały czas (suma XP z `activities`).
- `creator_rewards` – tabela wypłat/nagród (status `pending → approved → paid`).
- `pom_snapshot_rewards(period, top)` – zapis TOP-N rankingu do `creator_rewards`
  (tylko service_role / administrator; np. cron co tydzień). Rodzaj i wartość nagrody do ustalenia
  w Etapie 6E.
