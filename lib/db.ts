import { Pool } from 'pg';

const globalParaPool = globalThis as unknown as { pool?: Pool };

function criarPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida');
  return new Pool({ connectionString: url, max: 5 });
}

export function db() {
  if (!globalParaPool.pool) globalParaPool.pool = criarPool();
  return globalParaPool.pool;
}
