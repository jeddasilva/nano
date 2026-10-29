'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireDb } from 'db';
import { attributeDefinitions } from 'db/schema';

function slugifyAttributeId(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .concat('_level');
}

export async function createAttribute(formData: FormData) {
  const label = String(formData.get('label') || '').trim();
  if (!label) throw new Error('Label is required');

  const id = String(formData.get('id') || '').trim() || slugifyAttributeId(label);
  const minValue = Number(formData.get('minValue') || 0);
  const maxValue = Number(formData.get('maxValue') || 100);
  const step = Number(formData.get('step') || 1);
  const displayOrder = Number(formData.get('displayOrder') || 0);

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

  revalidatePath('/admin/attributes');
  revalidatePath('/catalog');
}

export async function toggleAttribute(id: string, isActive: boolean) {
  const database = requireDb();
  await database
    .update(attributeDefinitions)
    .set({ isActive })
    .where(eq(attributeDefinitions.id, id));

  revalidatePath('/admin/attributes');
  revalidatePath('/catalog');
}

export async function deleteAttribute(id: string) {
  const database = requireDb();
  await database.delete(attributeDefinitions).where(eq(attributeDefinitions.id, id));

  revalidatePath('/admin/attributes');
  revalidatePath('/catalog');
}
