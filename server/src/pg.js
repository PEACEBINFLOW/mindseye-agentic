// server/src/pg.js
// ---------------------------------------------------
// PostgreSQL Connection Pool (Tiger Cloud)
// ---------------------------------------------------
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || '';

export const pool = new Pool({
  connectionString,
  // Tiger Cloud requires TLS. This setting works without a custom CA.
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Optional diagnostics (don’t leak secrets)
pool.on('connect', () => console.log('📡 Connected to Postgres (pool)'));
pool.on('error', (err) => console.error('⚠️ Postgres pool error:', err.message));
