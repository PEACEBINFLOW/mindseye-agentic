// server/src/index.js
// ---------------------------------------------------
// MindsEye Agentic — Express Server
// Node.js + Tiger Cloud PostgreSQL (Timescale + Trigram)
// ---------------------------------------------------

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { pool } from './pg.js';
import healthRouter from './routes/health.js';
import eventsRouter from './routes/events.js';

// ---------------------------------------------------
// App Initialization
// ---------------------------------------------------
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Root route
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'mindseye-agentic',
    routes: ['/health', '/events']
  });
});

// Sub-routes
app.use('/health', healthRouter);
app.use('/events', eventsRouter);

// ---------------------------------------------------
// Database Connection + Server Start
// ---------------------------------------------------
let server;

(async () => {
  try {
    await pool.query('select 1');
    console.log('✅ Postgres reachable');
    server = app.listen(PORT, () =>
      console.log(`🚀 MindsEye Agentic server running on port ${PORT}`)
    );
  } catch (e) {
    console.error('❌ DB init failed:', e.message);
    process.exit(1);
  }
})();

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(sig => {
  process.on(sig, async () => {
    console.log(`\n🛑 ${sig} received, closing HTTP`);
    server?.close(() => process.exit(0));
  });
});

export default app;
