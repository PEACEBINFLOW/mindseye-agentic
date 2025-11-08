// server/src/pg.js
// ---------------------------------------------------
// PostgreSQL Connection Pool (Tiger Cloud)
// ---------------------------------------------------

import pg from 'pg';
const { Pool } = pg;

// Grab connection string from .env
const connectionString = process.env.DATABASE_URL || '';

export const pool = new Pool({
  connectionString,
  max: 10, // number of concurrent clients
});

// Optional: verify connection on startup
pool.on('connect', () => console.log('📡 Connected to Tiger Cloud Postgres'));
pool.on('error', (err) => console.error('⚠️ Postgres connection error:', err.message));
