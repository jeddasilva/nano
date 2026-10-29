'use server';

import { revalidatePath } from 'next/cache';
import { upsertProductMetadata } from 'lib/queries';

export async function saveProductMetadata(
  productId: string,
  metrics: Record<string, number>,
  tags: string[]
) {
  try {
    await upsertProductMetadata(productId, metrics, tags);
    revalidatePath('/admin/products');
    revalidatePath('/catalog');
    return { ok: true as const };
  } catch (error) {
    console.error('[saveProductMetadata]', error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : 'Failed to save metadata'
    };
  }
}

