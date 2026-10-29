import { and, asc, eq, sql } from 'drizzle-orm';
import { ensureSchema, getDb, requireDb } from 'db';
import { attributeDefinitions, productMetadata, type AttributeDefinition } from 'db/schema';

async function withOptionalDb<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  if (!getDb()) return fallback;

  try {
    await ensureSchema();
    return await fn();
  } catch (error) {
    console.error('[db query]', error);
    return fallback;
  }
}

export async function getActiveAttributeDefinitions(): Promise<AttributeDefinition[]> {
  return withOptionalDb([], async () => {
    const database = requireDb();
    return database
      .select()
      .from(attributeDefinitions)
      .where(eq(attributeDefinitions.isActive, true))
      .orderBy(asc(attributeDefinitions.displayOrder));
  });
}

export async function getAllAttributeDefinitions(): Promise<AttributeDefinition[]> {
  return withOptionalDb([], async () => {
    const database = requireDb();
    return database
      .select()
      .from(attributeDefinitions)
      .orderBy(asc(attributeDefinitions.displayOrder));
  });
}

export async function getFilteredProductIds(
  filters: Record<string, { min?: number; max?: number }>,
  tags: string[]
): Promise<string[]> {
  return withOptionalDb([], async () => {
    const database = requireDb();
    const conditions = [];

    for (const [attributeId, range] of Object.entries(filters)) {
      if (range.min !== undefined) {
        conditions.push(sql`(${productMetadata.metrics}->>${attributeId})::int >= ${range.min}`);
      }
      if (range.max !== undefined) {
        conditions.push(sql`(${productMetadata.metrics}->>${attributeId})::int <= ${range.max}`);
      }
    }

    if (tags.length > 0) {
      conditions.push(sql`${productMetadata.moodTags} && ${tags}`);
    }

    const results = await database
      .select({ id: productMetadata.fourthwallProductId })
      .from(productMetadata)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return results.map((r) => r.id);
  });
}

export async function getProductMetadata(productId: string) {
  return withOptionalDb(null, async () => {
    const database = requireDb();
    const [row] = await database
      .select()
      .from(productMetadata)
      .where(eq(productMetadata.fourthwallProductId, productId))
      .limit(1);

    return row ?? null;
  });
}

export async function getAllProductMetadata() {
  return withOptionalDb([], async () => {
    const database = requireDb();
    return database.select().from(productMetadata);
  });
}

export async function upsertProductMetadata(
  productId: string,
  metrics: Record<string, number>,
  tags: string[]
) {
  await ensureSchema();
  const database = requireDb();

  await database
    .insert(productMetadata)
    .values({
      fourthwallProductId: productId,
      metrics,
      moodTags: tags,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: productMetadata.fourthwallProductId,
      set: { metrics, moodTags: tags, updatedAt: new Date() }
    });
}

export function getDatabaseStatus() {
  const configured = Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.STORAGE_POSTGRES_URL
  );

  return {
    configured,
    hint: configured
      ? null
      : 'Add DATABASE_URL or POSTGRES_URL in Vercel → Project → Settings → Environment Variables, then redeploy.'
  };
}
