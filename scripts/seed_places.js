// Creates a confirmed test user and seeds N test places (Etap 2 acceptance: 100+ locations).
// Usage: SUPABASE_URL=... SERVICE_ROLE=... [SEED_COUNT=120] node /app/scripts/seed_places.js
const URL = process.env.SUPABASE_URL;
const SR = process.env.SERVICE_ROLE;
const COUNT = parseInt(process.env.SEED_COUNT || '120', 10);
const TEST_EMAIL = process.env.TEST_EMAIL || 'tester@pinonmap.dev';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test1234!';

if (!URL || !SR) throw new Error('Missing SUPABASE_URL / SERVICE_ROLE');

const H = { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' };

const CITIES = [
  { city: 'Warszawa', country: 'Polska', lat: 52.2297, lng: 21.0122 },
  { city: 'Kraków', country: 'Polska', lat: 50.0647, lng: 19.945 },
  { city: 'Gdańsk', country: 'Polska', lat: 54.352, lng: 18.6466 },
  { city: 'Wrocław', country: 'Polska', lat: 51.1079, lng: 17.0385 },
  { city: 'Zakopane', country: 'Polska', lat: 49.2992, lng: 19.9496 },
  { city: 'Barcelona', country: 'Hiszpania', lat: 41.3874, lng: 2.1686 },
  { city: 'Rzym', country: 'Włochy', lat: 41.9028, lng: 12.4964 },
  { city: 'Paryż', country: 'Francja', lat: 48.8566, lng: 2.3522 },
  { city: 'Lizbona', country: 'Portugalia', lat: 38.7223, lng: -9.1393 },
  { city: 'Praga', country: 'Czechy', lat: 50.0755, lng: 14.4378 },
  { city: 'Wiedeń', country: 'Austria', lat: 48.2082, lng: 16.3738 },
  { city: 'Ateny', country: 'Grecja', lat: 37.9838, lng: 23.7275 },
];
const CATS = ['Natura', 'Restauracja', 'Zabytek', 'Plaża', 'Hotel', 'Miasto', 'Inne'];

async function getOrCreateUser() {
  // Try to create the user
  const res = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true }),
  });
  if (res.ok) {
    const u = await res.json();
    console.log('Created test user:', u.id);
    return u.id;
  }
  // Already exists → find it
  const list = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: H });
  const data = await list.json();
  const found = (data.users || []).find((u) => u.email === TEST_EMAIL);
  if (!found) throw new Error('Could not create or find test user: ' + JSON.stringify(data).slice(0, 200));
  console.log('Found existing test user:', found.id);
  return found.id;
}

async function seed(userId) {
  const rows = [];
  for (let i = 0; i < COUNT; i++) {
    const base = CITIES[i % CITIES.length];
    const jitter = () => (Math.random() - 0.5) * 0.2;
    rows.push({
      user_id: userId,
      title: `${base.city} — miejsce ${i + 1}`,
      description: `Testowa lokalizacja #${i + 1} w mieście ${base.city}.`,
      category: CATS[i % CATS.length],
      city: base.city,
      country: base.country,
      latitude: base.lat + jitter(),
      longitude: base.lng + jitter(),
      cover_url: `https://picsum.photos/seed/pinmap${i}/600/400`,
    });
  }
  // Insert in batches of 40
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 40) {
    const batch = rows.slice(i, i + 40);
    const res = await fetch(`${URL}/rest/v1/places`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=representation' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error('Insert failed: ' + (await res.text()).slice(0, 300));
    const data = await res.json();
    inserted += data.length;
    // photos
    const photos = data.map((p) => ({ place_id: p.id, user_id: userId, url: p.cover_url }));
    await fetch(`${URL}/rest/v1/place_photos`, { method: 'POST', headers: H, body: JSON.stringify(photos) });
  }
  console.log(`Seeded ${inserted} places for user ${userId}.`);
}

(async () => {
  const userId = await getOrCreateUser();
  await seed(userId);
  console.log('Done. Test login:', TEST_EMAIL, '/', TEST_PASSWORD);
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
