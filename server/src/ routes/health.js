import { Router } from 'express';
import { pool } from '../pg.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', service: 'mindseye-agentic', timestamp: result.rows[0].now });
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
