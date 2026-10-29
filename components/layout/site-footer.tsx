import Link from 'next/link';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 text-sm text-mute md:flex-row md:items-center md:justify-between">
        <p className="font-display text-base text-ink">Nano Le Face</p>
        <div className="flex flex-wrap gap-6">
          <Link href="/catalog" className="hover:text-ink">
            Catalog
          </Link>
          <Link href="/pages/privacy-policy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/pages/contact" className="hover:text-ink">
            Contact
          </Link>
        </div>
        <p>© {year}</p>
      </div>
    </footer>
  );
}
