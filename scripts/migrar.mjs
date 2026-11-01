import fs from 'node:fs';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) { console.error('Defina DATABASE_URL (veja .env.example).'); process.exit(1); }

const sql = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(sql);
await client.end();
console.log('Banco atualizado.');
