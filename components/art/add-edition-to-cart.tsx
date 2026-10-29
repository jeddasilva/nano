'use client';

import clsx from 'clsx';
import { addItem } from 'components/cart/actions';
import { useCart } from 'components/cart/cart-context';
import { useShop } from 'components/shop/shop-context';
import { trackAddToCart } from 'lib/analytics';
import { Product, ProductVariant } from 'lib/types';
import { useActionState } from 'react';

export function AddEditionToCart({
  product,
  variant
}: {
  product: Product;
  variant: ProductVariant | undefined;
}) {
  const { addCartItem, refreshCart } = useCart();
  const { shop } = useShop();
  const [message, formAction] = useActionState(addItem, null);
  const available = Boolean(variant?.availableForSale);

  return (
    <form
      action={async () => {
        if (!variant) return;
        addCartItem(variant, product);
        trackAddToCart({
          currency: variant.price.currencyCode,
          value: parseFloat(variant.price.amount),
          items: [
            {
              item_id: product.id,
              item_name: product.title,
              item_variant: variant.title,
              item_brand: shop.name,
              price: parseFloat(variant.price.amount),
              quantity: 1,
              currency: variant.price.currencyCode
            }
          ],
          shopId: shop.id
        });
        await formAction(variant.id);
        refreshCart();
      }}
    >
      <button
        type="submit"
        disabled={!available || !variant}
        aria-label="Add to cart"
        className={clsx(
          'flex h-12 w-full items-center justify-center bg-ink text-sm text-white transition',
          available ? 'hover:bg-ink/90' : 'cursor-not-allowed opacity-40'
        )}
      >
        {!variant ? 'Select an edition' : available ? 'Add to cart' : 'Sold out'}
      </button>
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
