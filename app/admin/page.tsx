import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Control panel</h1>
        <p className="mt-2 text-sm text-mute">
          Manage dynamic mood attributes and tag artworks without schema migrations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/attributes"
          className="border border-line px-5 py-6 transition hover:border-ink"
        >
          <h2 className="font-display text-xl">Attributes</h2>
          <p className="mt-2 text-sm text-mute">Add, toggle, or remove emotion sliders.</p>
        </Link>
        <Link
          href="/admin/products"
          className="border border-line px-5 py-6 transition hover:border-ink"
        >
          <h2 className="font-display text-xl">Products</h2>
          <p className="mt-2 text-sm text-mute">Score each artwork and assign mood tags.</p>
        </Link>
      </div>
    </div>
  );
}
