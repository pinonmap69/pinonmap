// Runs /app/supabase/schema.sql against the Supabase Postgres database.
// Usage: DATABASE_URL="postgresql://..." node /app/scripts/migrate.js
const fs = require('fs');
const path = require('path');
const { Client } = require('/tmp/pgtool/node_modules/pg');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Missing DATABASE_URL env');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected. Applying schema...');
  await client.query(sql);
  console.log('Schema applied successfully.');
  await client.end();
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
