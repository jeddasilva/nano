import { CatalogBrowser } from 'components/catalog/catalog-browser';
import { StorefrontShell } from 'components/layout/storefront-shell';
import { getCollectionProducts, getProducts } from 'lib/fourthwall';
import { getActiveAttributeDefinitions, getAllProductMetadata } from 'lib/queries';
import { Product } from 'lib/types';

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';

async function loadCatalogProducts(): Promise<Product[]> {
  const collection = process.env.NEXT_PUBLIC_FW_COLLECTION || 'all';

  const [fromCollection, fromAll] = await Promise.all([
    getCollectionProducts({ collection, currency }),
    collection === 'all' ? Promise.resolve([] as Product[]) : getProducts({ currency })
  ]);

  const byId = new Map<string, Product>();
  for (const product of [...fromCollection, ...fromAll]) {
    byId.set(product.id, product);
  }

  return [...byId.values()];
}

export default async function CatalogPage() {
  const [attributes, metadata, products] = await Promise.all([
    getActiveAttributeDefinitions(),
    getAllProductMetadata(),
    loadCatalogProducts()
  ]);

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-10 art-fade">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Catalog</h1>
          <p className="mt-3 max-w-lg text-mute">Search works, then refine by feeling.</p>
        </div>

        <CatalogBrowser products={products} attributes={attributes} metadata={metadata} />
      </div>
    </StorefrontShell>
  );
}
