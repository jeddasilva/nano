import { ProductImage } from 'components/product-image';
import Price from 'components/price';
import { Product } from 'lib/types';
import Link from 'next/link';

export function ArtworkCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <Link
      href={`/artwork/${product.handle}`}
      className="art-rise group block"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      prefetch={true}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-soft">
        {product.featuredImage?.url ? (
          <ProductImage
            src={product.featuredImage.url}
            transformedSrc={product.featuredImage.transformedUrl}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-base tracking-tight text-ink">{product.title}</h2>
        <Price
          className="shrink-0 text-sm text-mute"
          amount={product.priceRange.minVariantPrice.amount}
          currencyCode={product.priceRange.minVariantPrice.currencyCode}
        />
      </div>
    </Link>
  );
}
