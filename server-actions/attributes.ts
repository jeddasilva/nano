'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ensureSchema, requireDb } from 'db';
import { attributeDefinitions } from 'db/schema';

export type AttributeActionResult = {
  ok: boolean;
  error?: string;
};

function slugifyAttributeId(label: string) {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return base.endsWith('_level') ? base : `${base}_level`;
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

async function withSchema<T>(fn: () => Promise<T>): Promise<T> {
  await ensureSchema();
  return fn();
}

export async function createAttribute(formData: FormData): Promise<AttributeActionResult> {
  try {
    const label = String(formData.get('label') || '').trim();
    if (!label) {
      return { ok: false, error: 'Label is required' };
    }

    const id = String(formData.get('id') || '').trim() || slugifyAttributeId(label);
    const minValue = Number(formData.get('minValue') || 0);
    const maxValue = Number(formData.get('maxValue') || 100);
    const step = Number(formData.get('step') || 1);
    const displayOrder = Number(formData.get('displayOrder') || 0);

    await withSchema(async () => {
      const database = requireDb();
      await database.insert(attributeDefinitions).values({
        id,
        label,
        type: 'slider',
        minValue,
        maxValue,
        step,
        displayOrder,
        isActive: true
      });
    });

    revalidatePath('/admin/attributes');
    revalidatePath('/catalog');
    return { ok: true };
  } catch (error) {
    console.error('[createAttribute]', error);
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function toggleAttribute(
  id: string,
  isActive: boolean
): Promise<AttributeActionResult> {
  try {
    await withSchema(async () => {
      const database = requireDb();
      await database
        .update(attributeDefinitions)
        .set({ isActive })
        .where(eq(attributeDefinitions.id, id));
    });

    revalidatePath('/admin/attributes');
    revalidatePath('/catalog');
    return { ok: true };
  } catch (error) {
    console.error('[toggleAttribute]', error);
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteAttribute(id: string): Promise<AttributeActionResult> {
  try {
    await withSchema(async () => {
      const database = requireDb();
      await database.delete(attributeDefinitions).where(eq(attributeDefinitions.id, id));
    });

    revalidatePath('/admin/attributes');
    revalidatePath('/catalog');
    return { ok: true };
  } catch (error) {
    console.error('[deleteAttribute]', error);
    return { ok: false, error: toErrorMessage(error) };
  }
}
