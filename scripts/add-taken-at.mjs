import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE photos ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ`;

const columns = await sql`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'photos' ORDER BY ordinal_position
`;
console.log(columns);
