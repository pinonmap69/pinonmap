// Etap 3 demo seed: thematic boards, a second user, board pins, likes and follows.
// Usage: SUPABASE_URL=... SERVICE_ROLE=... node /app/scripts/seed_social.js
const URL = process.env.SUPABASE_URL;
const SR = process.env.SERVICE_ROLE;
if (!URL || !SR) throw new Error('Missing SUPABASE_URL / SERVICE_ROLE');
const H = { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' };

const PRIMARY_EMAIL = 'tester@pinonmap.dev';
const DEMO2_EMAIL = 'ania@pinonmap.dev';
const DEMO2_PASSWORD = 'Test1234!';
const THEMES = ['Sycylia', 'Zamki', 'Wodospady', 'Plaże', 'Góry'];

async function j(res) { const t = await res.text(); try { return JSON.parse(t); } catch { return t; } }

async function findUser(email) {
  const r = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: H });
  const d = await j(r);
  return (d.users || []).find((u) => u.email === email);
}
async function getOrCreateUser(email, password) {
  const existing = await findUser(email);
  if (existing) return existing.id;
  const r = await fetch(`${URL}/auth/v1/admin/users`, { method: 'POST', headers: H, body: JSON.stringify({ email, password, email_confirm: true }) });
  const u = await j(r);
  if (!u.id) throw new Error('create user failed: ' + JSON.stringify(u).slice(0, 200));
  return u.id;
}
async function ensureProfile(id, name) {
  await fetch(`${URL}/rest/v1/profiles`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ id, display_name: name }) });
}
async function get(path) { return j(await fetch(`${URL}/rest/v1/${path}`, { headers: H })); }
async function post(path, body, prefer = 'return=representation') {
  return j(await fetch(`${URL}/rest/v1/${path}`, { method: 'POST', headers: { ...H, Prefer: prefer }, body: JSON.stringify(body) }));
}

async function ensureBoards(userId, names) {
  const existing = await get(`boards?user_id=eq.${userId}&select=id,name`);
  const have = new Set((existing || []).map((b) => b.name));
  const toCreate = names.filter((n) => !have.has(n)).map((n) => ({ user_id: userId, name: n, visibility: 'public' }));
  let created = [];
  if (toCreate.length) created = await post('boards', toCreate);
  const all = await get(`boards?user_id=eq.${userId}&select=id,name`);
  return all;
}

async function addPins(boards, places, userId) {
  const rows = [];
  boards.forEach((b, bi) => {
    // give each board 6 places (rotating)
    for (let k = 0; k < 6; k++) {
      const p = places[(bi * 6 + k) % places.length];
      if (p) rows.push({ board_id: b.id, place_id: p.id, user_id: userId });
    }
  });
  if (rows.length) await post('board_pins', rows, 'resolution=merge-duplicates');
  return rows.length;
}

(async () => {
  const primary = await findUser(PRIMARY_EMAIL);
  if (!primary) throw new Error('Run seed_places.js first (tester@pinonmap.dev not found).');
  const primaryId = primary.id;
  const demo2Id = await getOrCreateUser(DEMO2_EMAIL, DEMO2_PASSWORD);
  await ensureProfile(demo2Id, 'Ania Podróżniczka');
  await ensureProfile(primaryId, 'Tester POM');

  const places = await get(`places?select=id,cover_url&limit=60`);
  console.log('places available:', places.length);

  // Thematic boards for primary user
  const boards1 = await ensureBoards(primaryId, THEMES);
  const n1 = await addPins(boards1, places, primaryId);
  console.log(`primary boards: ${boards1.length}, board_pins added ~${n1}`);

  // Two public boards for demo2 (repinning primary's places)
  const boards2 = await ensureBoards(demo2Id, ['Włochy 2025', 'Ukryte perły']);
  const n2 = await addPins(boards2, places, demo2Id);
  console.log(`demo2 boards: ${boards2.length}, board_pins added ~${n2}`);

  // Likes: both users like the first ~20 places
  const likeRows = [];
  places.slice(0, 20).forEach((p, i) => {
    likeRows.push({ user_id: demo2Id, place_id: p.id });
    if (i % 2 === 0) likeRows.push({ user_id: primaryId, place_id: p.id });
  });
  await post('likes', likeRows, 'resolution=merge-duplicates');
  console.log('likes added:', likeRows.length);

  // Follows: mutual
  await post('follows', [
    { follower_id: primaryId, following_id: demo2Id },
    { follower_id: demo2Id, following_id: primaryId },
  ], 'resolution=merge-duplicates');
  console.log('follows added: 2 (mutual)');

  console.log('Done. Second user:', DEMO2_EMAIL, '/', DEMO2_PASSWORD);
})().catch((e) => { console.error('Social seed failed:', e.message); process.exit(1); });
