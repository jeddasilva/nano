import { ProductTagger } from 'components/admin/product-tagger';
import { getCollectionProducts, getProducts } from 'lib/fourthwall';
import { getAllAttributeDefinitions, getAllProductMetadata } from 'lib/queries';

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';

export default async function AdminProductsPage() {
  const [attributes, metadata, productsFromApi, collectionProducts] = await Promise.all([
    getAllAttributeDefinitions(),
    getAllProductMetadata(),
    getProducts({ currency }),
    getCollectionProducts({
      collection: process.env.NEXT_PUBLIC_FW_COLLECTION || 'all',
      currency
    })
  ]);

  const products = productsFromApi.length > 0 ? productsFromApi : collectionProducts;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Products</h1>
        <p className="mt-2 text-sm text-mute">
          Preview each work and assign mood attribute levels for catalog filtering.
        </p>
      </div>
      <ProductTagger products={products} attributes={attributes} metadata={metadata} />
    </div>
  );
}
