import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="font-display text-lg tracking-tight">
              Admin
            </Link>
            <nav className="flex gap-5 text-sm text-mute">
              <Link href="/admin/attributes" className="hover:text-ink">
                Attributes
              </Link>
              <Link href="/admin/products" className="hover:text-ink">
                Products
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-sm text-mute hover:text-ink">
            Storefront
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
