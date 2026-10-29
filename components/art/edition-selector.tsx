'use client';

import clsx from 'clsx';
import { AddEditionToCart } from 'components/art/add-edition-to-cart';
import Price from 'components/price';
import { classifyArtVariant } from 'lib/sku';
import { Product, ProductVariant } from 'lib/types';
import { useMemo, useState } from 'react';

type EditionOption = {
  variant: ProductVariant;
  label: string;
  editionLabel: string;
  soldOut: boolean;
};

function buildEditionOptions(variants: ProductVariant[]): EditionOption[] {
  const options: EditionOption[] = [];

  for (const variant of variants) {
    const classified = classifyArtVariant(variant.sku);
    if (!classified) continue;

    const soldOut = !variant.availableForSale || variant.inventory === 0;
    const editionLabel =
      classified.kind === 'ORIGINAL'
        ? '1 of 1'
        : variant.inventory !== null
          ? `1/${variant.inventory || 30}`
          : classified.editionLabel;

    options.push({
      variant,
      label: classified.label,
      editionLabel,
      soldOut
    });
  }

  return options.sort((a, b) => {
    const order = ['ORIGINAL', 'PRINT', 'FRAMED_PRINT'];
    const aKind = classifyArtVariant(a.variant.sku)?.kind || '';
    const bKind = classifyArtVariant(b.variant.sku)?.kind || '';
    return order.indexOf(aKind) - order.indexOf(bKind);
  });
}

export function EditionSelector({ product }: { product: Product }) {
  const editions = useMemo(() => buildEditionOptions(product.variants), [product.variants]);
  const defaultVariantId =
    editions.find((edition) => !edition.soldOut)?.variant.id || editions[0]?.variant.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultVariantId);

  const selectedVariant =
    editions.find((edition) => edition.variant.id === selectedId)?.variant ||
    product.variants.find((variant) => variant.id === selectedId);

  if (editions.length === 0) {
    const fallback = product.variants.find((variant) => variant.availableForSale) || product.variants[0];

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">{product.title}</h1>
          <div className="mt-4">
            <Price
              className="text-base text-mute"
              amount={fallback?.price.amount || product.priceRange.minVariantPrice.amount}
              currencyCode={
                fallback?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode
              }
            />
          </div>
        </div>
        {product.description ? (
          <p className="text-sm leading-relaxed text-mute">{product.description}</p>
        ) : null}
        <AddEditionToCart product={product} variant={fallback} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">{product.title}</h1>
        {selectedVariant ? (
          <div className="mt-4">
            <Price
              className="text-base text-mute"
              amount={selectedVariant.price.amount}
              currencyCode={selectedVariant.price.currencyCode}
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-mute">Edition</p>
        <div className="divide-y divide-line border-y border-line">
          {editions.map((edition) => {
            const isActive = selectedVariant?.id === edition.variant.id;

            return (
              <button
                key={edition.variant.id}
                type="button"
                disabled={edition.soldOut}
                onClick={() => setSelectedId(edition.variant.id)}
                className={clsx(
                  'flex w-full items-center justify-between py-4 text-left transition',
                  edition.soldOut && 'cursor-not-allowed opacity-40',
                  isActive ? 'text-ink' : 'text-mute hover:text-ink'
                )}
              >
                <span>
                  <span className="block text-sm">{edition.label}</span>
                  <span className="mt-1 block text-xs text-mute">{edition.editionLabel}</span>
                </span>
                <span className="text-sm">
                  {edition.soldOut ? (
                    'Sold out'
                  ) : (
                    <Price
                      amount={edition.variant.price.amount}
                      currencyCode={edition.variant.price.currencyCode}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {product.description ? (
        <p className="text-sm leading-relaxed text-mute">{product.description}</p>
      ) : null}

      <AddEditionToCart product={product} variant={selectedVariant} />
    </div>
  );
}
