# Pin on Map (POM) — PRD & Progress

## Problem statement
Global, free travel platform ("Pinterest for travel"): discover, save, organize and share places worth visiting. Multi-stage build (Etap 1–7). Mobile app.

## Stack (as delivered)
- Frontend: **Expo (React Native) SDK 54**, served on web via `expo start --web --port 3000` (supervisor `frontend`). Also targets Android/iOS.
- Data/Backend: **Supabase** (Postgres + Auth + Storage), reached directly from the client. Project ref `wkasejzsrmpssjlpwzti`.
- Maps: **Leaflet + OpenStreetMap** in an iframe/WebView (no API key, free). Provider abstraction via `components/map/AppMapView`.
- Auth: email/password (Supabase). Google login deferred.
- i18n: PL/EN via `LanguageProvider`.

## User persona
Travelers who pin places, tag statuses, browse inspiration, and (later) plan trips, gamify, and share.

## Core requirements (static)
Per the 7-stage brief in the original request (Etap 1 accounts; Etap 2 pins/map/GPS/status; Etap 3 boards/feed/social; Etap 4 trip planning; Etap 5 gamification/events; Etap 6A-E integrations/search/monetization; Etap 7 physical ecosystem).

## Implemented
### Etap 1 (pre-existing, polished) — accounts
- Register, email/password login, forgot-password, session persistence (localStorage/AsyncStorage), profile + avatar edit, settings, PL/EN.

### Etap 2 (completed this session — 2026-06) — pins, map, geolocation
- Leaflet map with current location, GPS permission, recenter.
- Create pin: photo upload, title, description, category, manual map pick + auto GPS.
- **Place statuses** (NEW): want_to_visit / visited / visit_again / been_here — DB column + UI selector on Add + change on Detail (persists) + color-coded markers + status filter chips on Map.
- **EXIF GPS from photo** (NEW): `readGpsFromBase64` (exifr) reads geotag on gallery/camera photos and auto-fills the pin location ("Lokalizacja odczytana ze zdjęcia"). Verified with a real geotagged JPEG.
- Place detail (gallery, meta, map, delete), pins persist (Supabase), reverse geocode city/country.
- **Boards DB structure** (NEW): `boards` + `board_pins` tables (public/private/premium visibility) + `lib/boards.ts` — prep for Etap 3.
- Handles 100+ locations: **120 seeded places** across 12 cities; map renders all; filters counts verified.
- Bonus: **Pinterest-style Explore masonry feed** (all public places) with pull-to-refresh, auto load + "Load more".

## Testing
- Automated frontend suite (iteration_2.json): all flows + testids PASS. Backend write paths (create place w/ status, update status, create board with RLS) verified via user JWT. EXIF verified via Node + real geotagged image.
- Test user: tester@pinonmap.dev / Test1234! (see test_credentials.md).

## Backlog / next
- P0 (Etap 3): boards UI (create/add pin/repin), following, likes, public profiles, real infinite scroll (FlatList onEndReached).
- P1: Google login (OAuth), photo-based pin creation surfaced as its own entry point, statistics screen (currently placeholder), achievements/badges.
- P2 (Etap 4+): trip planning A→B, radius/area search, gamification (XP/levels/missions), events, social sharing, image search, premium/monetization, ads, creator program, POM facilities.

## Notes / caveats
- Supabase free tier auto-pauses after inactivity → API returns 521; owner must resume in dashboard.
- Schema changes must be run in Supabase SQL Editor (`/app/supabase/schema.sql`, idempotent) since the client key can't run DDL.
- FastAPI backend in this pod is unused (Supabase-only app).
