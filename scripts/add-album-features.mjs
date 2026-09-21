import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS description TEXT`;
await sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS event_date DATE`;
await sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS cover_photo_id INTEGER REFERENCES photos(id) ON DELETE SET NULL`;
await sql`ALTER TABLE albums ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE`;
await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS caption TEXT`;
await sql`
  CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS login_attempts_ip_time ON login_attempts (ip, attempted_at)`;

console.log(await sql`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_name IN ('albums', 'photos', 'login_attempts') ORDER BY table_name, ordinal_position
`);
