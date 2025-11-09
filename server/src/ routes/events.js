import { Router } from 'express';
import { pool } from '../pg.js';

const router = Router();

// POST /events → insert new event
router.post('/', async (req, res) => {
  try {
    const { timestamp, type, source, value, tags, text } = req.body;
    const q = `
      INSERT INTO events (timestamp, type, source, value, tags, text)
      VALUES (COALESCE($1, NOW()), $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const v = [timestamp, type, source, value, tags || [], text || null];
    const r = await pool.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error('❌ insert failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /events → recent events
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const r = await pool.query(
      `SELECT * FROM events ORDER BY timestamp DESC LIMIT $1`,
      [limit]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('❌ fetch failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /events/stats → time-bucketed metrics (Timescale)
router.get('/stats', async (req, res) => {
  try {
    const minutes = Math.min(parseInt(req.query.minutes || '60', 10), 1440);
    const bucket = (req.query.bucket || 'minute').toLowerCase();
    const unit = bucket === 'day' ? '1 day' : bucket === 'hour' ? '1 hour' : '1 minute';
    const r = await pool.query(
      `SELECT time_bucket($1::interval, timestamp) AS bucket,
              COUNT(*) AS count,
              AVG(value) AS avg_value
       FROM events
       WHERE timestamp >= NOW() - ($2::int || ' minutes')::interval
       GROUP BY 1
       ORDER BY 1 ASC`,
      [unit, minutes]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('❌ stats failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /events/search → trigram search on text
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    if (!q) return res.json([]);
    const r = await pool.query(
      `SELECT id, timestamp, type, source, value, tags, text,
              similarity(text, $1) AS score
       FROM events
       WHERE text ILIKE '%' || $1 || '%'
          OR similarity(text, $1) > 0.2
       ORDER BY score DESC NULLS LAST, timestamp DESC
       LIMIT $2`,
      [q, limit]
    );
    res.json(r.rows);
  } catch (e) {
    console.error('❌ search failed:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
