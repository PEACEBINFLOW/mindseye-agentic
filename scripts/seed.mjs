// scripts/seed.mjs
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) { console.error('Missing DATABASE_URL'); process.exit(1); }
const client = new Client({ connectionString: url });

function tag(v){ if(v==null) return 'unknown'; if(v>0.8) return 'spike'; if(v<0.2) return 'flat'; return 'normal'; }

async function run(){
  await client.connect();
  const now = Date.now();
  const rows = 240; // last 4h
  for (let i=0;i<rows;i++){
    const ts = new Date(now - (rows - i)*60*1000).toISOString();
    const value = Math.random();
    const tags = ['demo', tag(value)];
    const type = i%15===0?'anomaly':'signal';
    const source = 'seed';
    const text = i%15===0?'sudden spike observed':'normal activity';
    await client.query(`insert into events (timestamp,type,source,value,tags,text)
      values ($1,$2,$3,$4,$5,$6)`, [ts,type,source,value,tags,text]);
  }
  console.log('Seed complete:', rows);
  await client.end();
}
run().catch(e=>{ console.error(e); process.exit(1); });
