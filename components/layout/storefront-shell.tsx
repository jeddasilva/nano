import { CartProvider } from 'components/cart/cart-context';
import { SiteFooter } from 'components/layout/site-footer';
import { SiteHeader } from 'components/layout/site-header';
import { ShopProvider } from 'components/shop/shop-context';
import { getShop } from 'lib/fourthwall';
import { FourthwallShop } from 'lib/fourthwall/types';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'USD';

const FALLBACK_SHOP: FourthwallShop = {
  id: 'local',
  name: process.env.SITE_NAME || 'nano',
  domain: 'localhost',
  publicDomain: ''
};

export async function StorefrontShell({ children }: { children: ReactNode }) {
  const shop = await getShop().catch(() => FALLBACK_SHOP);

  return (
    <ShopProvider shop={shop}>
      <CartProvider currency={DEFAULT_CURRENCY}>
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
        <Toaster closeButton position="bottom-right" toastOptions={{ className: 'font-sans' }} />
      </CartProvider>
    </ShopProvider>
  );
}
