// server/src/routes/events.js
// ---------------------------------------------------
// Events Route — CRUD + analytics for time-series data
// ---------------------------------------------------

import { Router } from 'express';
import { pool } from '../pg.js';

const router = Router();

// ---------------------------------------------------
// POST /events → Insert new event
// ---------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { timestamp, type, source, value, tags, text } = req.body;

    const query = `
      INSERT INTO events (timestamp, type, source, value, tags, text)
      VALUES (COALESCE($1, NOW()), $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [timestamp, type, source, value, tags || [], text || null];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Failed to insert event:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------
// GET /events → Fetch recent events
// ---------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const query = `
      SELECT * FROM events
      ORDER BY timestamp DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Failed to fetch events:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------
// GET /events/stats → Time-bucketed averages (Timescale)
// ---------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const minutes = Math.min(parseInt(req.query.minutes || '60', 10), 1440);
    const bucket = (req.query.bucket || 'minute').toLowerCase();
    const interval =
      bucket === 'day' ? '1 day' :
      bucket === 'hour' ? '1 hour' : '1 minute';

    const query = `
      SELECT time_bucket($1::interval, timestamp) AS bucket,
             COUNT(*) AS count,
             AVG(value) AS avg_value
      FROM events
      WHERE timestamp >= NOW() - ($2::int || ' minutes')::interval
      GROUP BY 1
      ORDER BY 1 ASC;
    `;
    const result = await pool.query(query, [interval, minutes]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Failed to fetch stats:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------
// GET /events/search → Trigram search by text
// ---------------------------------------------------
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    if (!q) return res.json([]);

    const query = `
      SELECT id, timestamp, type, source, value, tags, text,
             similarity(text, $1) AS score
      FROM events
      WHERE text ILIKE '%' || $1 || '%'
         OR similarity(text, $1) > 0.2
      ORDER BY score DESC NULLS LAST, timestamp DESC
      LIMIT $2;
    `;
    const result = await pool.query(query, [q, limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Search failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
