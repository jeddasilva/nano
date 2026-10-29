import { notFound } from 'next/navigation';
import { StorefrontShell } from 'components/layout/storefront-shell';
import Prose from 'components/prose';
import { getStaticPage } from 'lib/fourthwall';

export const revalidate = 3600;

const STATIC_PAGES = ['privacy-policy', 'terms-of-service', 'returns-faq', 'contact'];

export function generateStaticParams() {
  return STATIC_PAGES.map((handle) => ({ handle }));
}

export default async function StaticPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const page = await getStaticPage(handle);

  if (!page) {
    return notFound();
  }

  return (
    <StorefrontShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl tracking-tight">{page.title}</h1>
        <div className="mt-10">
          <Prose html={page.bodyHtml} />
        </div>
      </div>
    </StorefrontShell>
  );
}
