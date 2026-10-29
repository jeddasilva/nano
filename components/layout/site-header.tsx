import CartModal from 'components/cart/modal';
import { getShop } from 'lib/fourthwall';
import Link from 'next/link';

export async function SiteHeader() {
  const shop = await getShop().catch(() => null);
  const brand = process.env.SITE_NAME || shop?.name || 'nano';

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          {brand}
        </Link>

        <nav className="flex items-center gap-8 text-sm text-mute">
          <Link href="/catalog" className="transition-colors hover:text-ink">
            Catalog
          </Link>
          <CartModal />
        </nav>
      </div>
    </header>
  );
}
