import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type AppDatabase = NeonHttpDatabase<typeof schema>;

let cachedDb: AppDatabase | null | undefined;

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    ''
  ).trim();
}

export function createDb(): AppDatabase | null {
  const connectionString = getConnectionString();

  if (!connectionString) {
    return null;
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export function getDb(): AppDatabase | null {
  if (cachedDb === undefined) {
    cachedDb = createDb();
  }
  return cachedDb;
}

export function requireDb(): AppDatabase {
  const instance = getDb();
  if (!instance) {
    throw new Error(
      'Database is not configured. Set DATABASE_URL (or POSTGRES_URL) in your Vercel project env, then redeploy.'
    );
  }
  return instance;
}

export async function ensureSchema() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error(
      'Database is not configured. Set DATABASE_URL (or POSTGRES_URL) in your Vercel project env, then redeploy.'
    );
  }

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS attribute_definitions (
      id varchar(100) PRIMARY KEY,
      label varchar(150) NOT NULL,
      type varchar(50) NOT NULL DEFAULT 'slider',
      min_value integer NOT NULL DEFAULT 0,
      max_value integer NOT NULL DEFAULT 100,
      step integer NOT NULL DEFAULT 1,
      is_active boolean NOT NULL DEFAULT true,
      display_order integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS product_metadata (
      fourthwall_product_id varchar(255) PRIMARY KEY,
      metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
      mood_tags text[] NOT NULL DEFAULT '{}'::text[],
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_fulfillments (
      id varchar(255) PRIMARY KEY,
      fourthwall_order_id varchar(255) NOT NULL,
      prodigi_order_id varchar(255),
      fulfillment_type varchar(50) NOT NULL,
      tracking_number varchar(255),
      carrier varchar(100),
      status varchar(50) NOT NULL DEFAULT 'PENDING',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;
}
