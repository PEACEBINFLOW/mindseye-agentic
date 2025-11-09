// server/src/index.js
// ---------------------------------------------------
// MindsEye Agentic — Single-file Express Server
// Postgres (Tiger Cloud) + Timescale + Trigram
// ---------------------------------------------------

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { pool } from './pg.js'; // uses DATABASE_URL

const app = express();
const PORT = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// root: quick info
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'mindseye-agentic',
    routes: ['/health', '/events', '/events/stats', '/events/search']
  });
});

// ---- inline routes (no separate files) -------------------------------

// health: used by Render health check
app.get('/health', async (_req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', service: 'mindseye-agentic', timestamp: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// insert event
app.post('/events', async (req, res) => {
  try {
    const { timestamp, type, source, value, tags, text } = req.body || {};
    const q = `
      INSERT INTO events (timestamp, type, source, value, tags, text)
      VALUES (COALESCE($1, NOW()), $2, $3, $4, $5, $6)
      RETURNING *`;
    const v = [timestamp, type, source, value, tags || [], text || null];
    const r = await pool.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// list recent
app.get('/events', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const r = await pool.query(
      `SELECT * FROM events ORDER BY timestamp DESC LIMIT $1`,
      [limit]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// timescale bucketing
app.get('/events/stats', async (req, res) => {
  try {
    const minutes = Math.min(parseInt(req.query.minutes || '60', 10), 1440);
    const bucket = (req.query.bucket || 'minute').toLowerCase();
    const unit = bucket === 'day' ? '1 day' : bucket === 'hour' ? '1 hour' : '1 minute';
    const r = await pool.query(
      `SELECT time_bucket($1::interval, timestamp) AS bucket,
              COUNT(*) AS count, AVG(value) AS avg_value
       FROM events
       WHERE timestamp >= NOW() - ($2::int || ' minutes')::interval
       GROUP BY 1 ORDER BY 1 ASC`,
      [unit, minutes]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// trigram search
app.get('/events/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    if (!q) return res.json([]);
    const r = await pool.query(
      `SELECT id, timestamp, type, source, value, tags, text,
              similarity(text, $1) AS score
       FROM events
       WHERE text ILIKE '%' || $1 || '%' OR similarity(text, $1) > 0.2
       ORDER BY score DESC NULLS LAST, timestamp DESC
       LIMIT $2`,
      [q, limit]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- start -----------------------------------------------------------

let server;
(async () => {
  try {
    await pool.query('SELECT 1'); // verify DB
    console.log('✅ Postgres reachable');
    server = app.listen(PORT, () =>
      console.log(`🚀 MindsEye Agentic server running on port ${PORT}`)
    );
  } catch (e) {
    console.error('❌ DB init failed:', e.message);
    process.exit(1);
  }
})();

// graceful shutdown
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, async () => {
    console.log(`\n🛑 ${sig} received, closing HTTP`);
    server?.close(() => process.exit(0));
  });
});

export default app; // <- single export, last line
} catch (e) {
  console.error('❌ DB init failed:', e?.message || e);
  if (!process.env.DATABASE_URL) {
    console.error('ℹ️ Hint: Missing DATABASE_URL env on Render Settings → Environment.');
  }
  process.exit(1);
}


 
