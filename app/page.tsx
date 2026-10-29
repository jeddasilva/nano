import { ArtworkCard } from 'components/art/artwork-card';
import { StorefrontShell } from 'components/layout/storefront-shell';
import { getCollectionProducts, getShop, getShopOgImage } from 'lib/fourthwall';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';

export async function generateMetadata(): Promise<Metadata> {
  const [ogImageUrl, shop] = await Promise.all([
    getShopOgImage().catch(() => null),
    getShop().catch(() => null)
  ]);

  return {
    title: shop?.name || process.env.SITE_NAME || 'nano',
    description: 'Original works and archival prints.',
    openGraph: {
      type: 'website',
      images: [{ url: ogImageUrl || '/cover.jpg' }]
    }
  };
}

export default async function HomePage() {
  const shop = await getShop().catch(() => null);
  const brand = process.env.SITE_NAME || shop?.name || 'nano';
  const products = await getCollectionProducts({
    collection: process.env.NEXT_PUBLIC_FW_COLLECTION || 'all',
    currency
  }).catch(() => []);

  return (
    <StorefrontShell>
      <section className="relative flex min-h-[88vh] flex-col justify-end overflow-hidden">
        <Image
          src="/cover.jpg"
          alt={`${brand} studio`}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/55 to-transparent"
        />

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-16 pt-40 art-fade">
          <p className="font-display text-5xl tracking-tight text-ink md:text-7xl lg:text-8xl">
            {brand}
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-mute">
            Original works and archival fine art prints, selected by mood.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <Link
              href="/catalog"
              className="inline-flex h-11 items-center bg-ink px-6 text-sm text-white transition hover:bg-ink/90"
            >
              View catalog
            </Link>
            <Link
              href="/catalog"
              className="text-sm text-mute underline-offset-4 hover:text-ink hover:underline"
            >
              Browse by feeling
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-2xl tracking-tight">Selected works</h2>
          <Link href="/catalog" className="text-sm text-mute hover:text-ink">
            All works
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product, index) => (
            <ArtworkCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </section>
    </StorefrontShell>
  );
}
