import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export const db = createDb();

export function requireDb() {
  if (!db) {
    throw new Error('DATABASE_URL is not configured');
  }
  return db;
}
