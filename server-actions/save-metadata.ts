'use server';

import { revalidatePath } from 'next/cache';
import { upsertProductMetadata } from 'lib/queries';

export async function saveProductMetadata(
  productId: string,
  metrics: Record<string, number>,
  tags: string[]
) {
  await upsertProductMetadata(productId, metrics, tags);
  revalidatePath('/admin/products');
  revalidatePath('/catalog');
}
