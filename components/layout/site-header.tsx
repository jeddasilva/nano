import CartModal from 'components/cart/modal';
import Image from 'next/image';
import Link from 'next/link';

export async function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="NANO Le FACE home" className="flex items-center">
          <Image
            src="/nano-logo.png"
            alt="NANO Le FACE"
            width={696}
            height={210}
            priority
            className="h-8 w-auto md:h-9"
          />
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
