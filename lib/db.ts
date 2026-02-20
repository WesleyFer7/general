import { Pool, type QueryResult } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.RAILWAY_POSTGRES_URL ||
  process.env.RAILWAY_DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL (ou RAILWAY_*) é obrigatório para conectar ao Postgres.');
}

// Reutiliza pool em hot-reload / edge runtimes
const globalForPool = global as unknown as { pgPool?: Pool };

export const pool: Pool = globalForPool.pgPool ||
  new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  });

if (!globalForPool.pgPool) {
  globalForPool.pgPool = pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}
