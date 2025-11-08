# MindsEye Agentic â€” Tiger Cloud Connected

This is a Tiger Cloudâ€“ready build of MindsEye Agentic for the Agentic Postgres Challenge.

## Quick Start
1) Schema
```bash
psql "$DATABASE_URL" -f db/schema.sql
```
2) Seed
```bash
export DATABASE_URL="postgres://tsdbadmin:cuugb1bm3427cw0j@un10g6z6ac.xuyc6ez6af.tsdb.cloud.timescale.com:30396/tsdb?sslmode=require"
cd scripts && node seed.mjs
```
3) Run
```bash
cd server && cp .env.example .env && npm install && npm run dev
cd ../client && npm install && npm run dev
```
