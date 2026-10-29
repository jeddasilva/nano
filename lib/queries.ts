import { and, asc, eq, sql } from 'drizzle-orm';
import { db, requireDb } from 'db';
import { attributeDefinitions, productMetadata, type AttributeDefinition } from 'db/schema';

export async function getActiveAttributeDefinitions(): Promise<AttributeDefinition[]> {
  if (!db) return [];

  return db
    .select()
    .from(attributeDefinitions)
    .where(eq(attributeDefinitions.isActive, true))
    .orderBy(asc(attributeDefinitions.displayOrder));
}

export async function getAllAttributeDefinitions(): Promise<AttributeDefinition[]> {
  if (!db) return [];

  return db
    .select()
    .from(attributeDefinitions)
    .orderBy(asc(attributeDefinitions.displayOrder));
}

export async function getFilteredProductIds(
  filters: Record<string, { min?: number; max?: number }>,
  tags: string[]
): Promise<string[]> {
  if (!db) return [];

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

  const results = await db
    .select({ id: productMetadata.fourthwallProductId })
    .from(productMetadata)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return results.map((r) => r.id);
}

export async function getProductMetadata(productId: string) {
  if (!db) return null;

  const [row] = await db
    .select()
    .from(productMetadata)
    .where(eq(productMetadata.fourthwallProductId, productId))
    .limit(1);

  return row ?? null;
}

export async function getAllProductMetadata() {
  if (!db) return [];
  return db.select().from(productMetadata);
}

export async function upsertProductMetadata(
  productId: string,
  metrics: Record<string, number>,
  tags: string[]
) {
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
