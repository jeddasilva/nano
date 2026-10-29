import { EditionSelector } from 'components/art/edition-selector';
import { StorefrontShell } from 'components/layout/storefront-shell';
import { ProductImage } from 'components/product-image';
import { getProduct, getShop } from 'lib/fourthwall';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, shop] = await Promise.all([getProduct({ handle: slug, currency }), getShop()]);

  if (!product) return {};

  return {
    title: `${product.title} | ${shop.name}`,
    description: product.description,
    openGraph: product.featuredImage?.url
      ? {
          images: [
            {
              url: product.featuredImage.url,
              width: product.featuredImage.width,
              height: product.featuredImage.height,
              alt: product.featuredImage.altText
            }
          ]
        }
      : undefined
  };
}

export default async function ArtworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct({ handle: slug, currency });

  if (!product) notFound();

  return (
    <StorefrontShell>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 lg:grid-cols-2 lg:gap-16">
        <div className="art-fade relative aspect-[4/5] bg-soft">
          {product.featuredImage?.url ? (
            <ProductImage
              src={product.featuredImage.url}
              transformedSrc={product.featuredImage.transformedUrl}
              alt={product.title}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="art-rise flex flex-col justify-center lg:py-8">
          <EditionSelector product={product} />
        </div>
      </div>
    </StorefrontShell>
  );
}
