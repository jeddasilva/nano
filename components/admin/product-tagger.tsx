'use client';

import { ProductImage } from 'components/product-image';
import { AttributeDefinition, ProductMetadata } from 'db/schema';
import { Product } from 'lib/types';
import Link from 'next/link';
import { saveProductMetadata } from 'server-actions/save-metadata';
import { useMemo, useState, useTransition } from 'react';

function buildInitialMetrics(
  attributes: AttributeDefinition[],
  existing?: Record<string, number>
) {
  const metrics: Record<string, number> = {};

  for (const attribute of attributes) {
    const existingValue = existing?.[attribute.id];
    metrics[attribute.id] =
      typeof existingValue === 'number' && Number.isFinite(existingValue)
        ? existingValue
        : Math.round((attribute.minValue + attribute.maxValue) / 2);
  }

  return metrics;
}

export function ProductTagger({
  products,
  attributes,
  metadata
}: {
  products: Product[];
  attributes: AttributeDefinition[];
  metadata: ProductMetadata[];
}) {
  const metadataById = useMemo(
    () => Object.fromEntries(metadata.map((row) => [row.fourthwallProductId, row])),
    [metadata]
  );

  const [selectedId, setSelectedId] = useState(products[0]?.id || '');
  const selected = products.find((product) => product.id === selectedId);
  const existing = selected ? metadataById[selected.id] : undefined;

  const [metrics, setMetrics] = useState<Record<string, number>>(() =>
    buildInitialMetrics(attributes, existing?.metrics as Record<string, number> | undefined)
  );
  const [tags, setTags] = useState((existing?.moodTags || []).join(', '));
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function selectProduct(productId: string) {
    setSelectedId(productId);
    const row = metadataById[productId];
    setMetrics(buildInitialMetrics(attributes, row?.metrics as Record<string, number> | undefined));
    setTags((row?.moodTags || []).join(', '));
    setMessage('');
  }

  function updateMetric(attributeId: string, value: number, min: number, max: number) {
    const clamped = Math.min(max, Math.max(min, value));
    setMetrics((current) => ({
      ...current,
      [attributeId]: clamped
    }));
  }

  if (products.length === 0) {
    return <p className="text-sm text-mute">No products available from Fourthwall.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <ul className="max-h-[70vh] divide-y divide-line overflow-y-auto border-y border-line">
        {products.map((product) => {
          const isSelected = selectedId === product.id;
          const image = product.featuredImage;

          return (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => selectProduct(product.id)}
                className={`flex w-full items-center gap-3 py-3 text-left transition ${
                  isSelected ? 'text-ink' : 'text-mute hover:text-ink'
                }`}
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-soft">
                  {image?.url ? (
                    <ProductImage
                      src={image.url}
                      transformedSrc={image.transformedUrl || image.url}
                      alt={product.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <span className="line-clamp-2 text-sm leading-snug">{product.title}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <form
          className={`space-y-8 ${isPending ? 'opacity-70' : ''}`}
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const parsedTags = tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);
              const result = await saveProductMetadata(selected.id, metrics, parsedTags);
              setMessage(result.ok ? 'Saved' : result.error || 'Failed to save');
            });
          }}
        >
          <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-start">
            <div className="relative aspect-[4/5] overflow-hidden bg-soft">
              {selected.featuredImage?.url ? (
                <ProductImage
                  src={selected.featuredImage.url}
                  transformedSrc={
                    selected.featuredImage.transformedUrl || selected.featuredImage.url
                  }
                  alt={selected.title}
                  fill
                  sizes="180px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-mute">
                  No image
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-tight">{selected.title}</h2>
              <p className="mt-1 text-xs text-mute">{selected.id}</p>
              <p className="mt-3 text-sm text-mute">
                Set each attribute level, then save. These drive catalog filters.
              </p>
            </div>
          </div>

          {attributes.length === 0 ? (
            <div className="border border-line px-4 py-5 text-sm text-mute">
              No attributes yet.{' '}
              <Link href="/admin/attributes" className="text-ink underline-offset-2 hover:underline">
                Create sliders in Attributes
              </Link>{' '}
              first, then assign levels here.
            </div>
          ) : (
            <div className="space-y-7">
              <h3 className="text-xs uppercase tracking-[0.18em] text-mute">Attribute levels</h3>
              {attributes.map((attribute) => {
                const value = metrics[attribute.id] ?? attribute.minValue;

                return (
                  <div key={attribute.id} className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor={`metric-${attribute.id}`} className="text-sm text-ink">
                        {attribute.label}
                      </label>
                      <input
                        id={`metric-${attribute.id}-number`}
                        type="number"
                        min={attribute.minValue}
                        max={attribute.maxValue}
                        step={attribute.step}
                        value={value}
                        onChange={(event) =>
                          updateMetric(
                            attribute.id,
                            Number(event.target.value),
                            attribute.minValue,
                            attribute.maxValue
                          )
                        }
                        className="w-16 border-b border-line bg-transparent py-1 text-right text-sm tabular-nums outline-none focus:border-ink"
                      />
                    </div>
                    <input
                      id={`metric-${attribute.id}`}
                      type="range"
                      min={attribute.minValue}
                      max={attribute.maxValue}
                      step={attribute.step}
                      value={value}
                      onChange={(event) =>
                        updateMetric(
                          attribute.id,
                          Number(event.target.value),
                          attribute.minValue,
                          attribute.maxValue
                        )
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-mute">
                      <span>{attribute.minValue}</span>
                      <span>{attribute.maxValue}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <label className="block text-sm">
            <span className="text-mute">Mood tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="calm, dusk, soft"
              className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
            />
          </label>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={attributes.length === 0 || isPending}
              className="h-10 bg-ink px-5 text-sm text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save metadata
            </button>
            {message ? <span className="text-sm text-mute">{message}</span> : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
