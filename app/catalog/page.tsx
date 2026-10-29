import { ArtworkCard } from 'components/art/artwork-card';
import { FilterBar } from 'components/catalog/filter-bar';
import { StorefrontShell } from 'components/layout/storefront-shell';
import { fuzzyMatch } from 'lib/fuzzy';
import { getCollectionProducts, getProducts } from 'lib/fourthwall';
import { getActiveAttributeDefinitions, getFilteredProductIds } from 'lib/queries';
import { Product } from 'lib/types';
import { Suspense } from 'react';

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
  attributeIds: string[]
) {
  const filters: Record<string, { min?: number; max?: number }> = {};

  for (const id of attributeIds) {
    const minRaw = searchParams[`${id}_min`];
    const maxRaw = searchParams[`${id}_max`];
    const min = typeof minRaw === 'string' ? Number(minRaw) : undefined;
    const max = typeof maxRaw === 'string' ? Number(maxRaw) : undefined;

    if (min !== undefined || max !== undefined) {
      filters[id] = {
        ...(Number.isFinite(min) ? { min } : {}),
        ...(Number.isFinite(max) ? { max } : {})
      };
    }
  }

  const tagsRaw = searchParams.tags;
  const tags =
    typeof tagsRaw === 'string'
      ? tagsRaw
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  const query = typeof searchParams.q === 'string' ? searchParams.q : '';

  return { filters, tags, query };
}

async function loadCatalogProducts(): Promise<Product[]> {
  const products = await getProducts({ currency });
  if (products.length > 0) return products;

  return getCollectionProducts({
    collection: process.env.NEXT_PUBLIC_FW_COLLECTION || 'all',
    currency
  });
}

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const attributes = await getActiveAttributeDefinitions();
  const { filters, tags, query } = parseFilters(
    params,
    attributes.map((attribute) => attribute.id)
  );

  const hasFilters = Object.keys(filters).length > 0 || tags.length > 0;
  const filteredIds = hasFilters ? await getFilteredProductIds(filters, tags) : null;
  const allProducts = await loadCatalogProducts();

  const attributeFiltered =
    filteredIds === null
      ? allProducts
      : filteredIds.length === 0
        ? []
        : allProducts.filter((product) => filteredIds.includes(product.id));

  const catalog = attributeFiltered.filter((product) =>
    fuzzyMatch(query, [
      product.title,
      product.description,
      product.handle,
      product.tags.join(' '),
      ...product.variants.map((variant) => `${variant.title} ${variant.sku}`)
    ])
  );

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10 art-fade">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Catalog</h1>
          <p className="mt-3 max-w-lg text-mute">
            Search works, then refine by feeling.
          </p>
        </div>

        <div className="mb-12 border-b border-line pb-10">
          <Suspense fallback={null}>
            <FilterBar attributes={attributes} />
          </Suspense>
        </div>

        {catalog.length === 0 ? (
          <p className="py-24 text-center text-sm text-mute">No works match these filters.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {catalog.map((product, index) => (
              <ArtworkCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
