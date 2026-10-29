'use client';

import { ArtworkCard } from 'components/art/artwork-card';
import { AttributeDefinition, ProductMetadata } from 'db/schema';
import { fuzzyMatch } from 'lib/fuzzy';
import { Product } from 'lib/types';
import { useMemo, useState } from 'react';

type RangeState = Record<string, { min: number; max: number }>;

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ');
}

function matchesMoodFilters(
  productId: string,
  metadataById: Record<string, ProductMetadata>,
  attributes: AttributeDefinition[],
  ranges: RangeState,
  tags: string[]
) {
  const narrowedAttributes = attributes.filter((attribute) => {
    const range = ranges[attribute.id];
    if (!range) return false;
    return range.min > attribute.minValue || range.max < attribute.maxValue;
  });

  const hasTagFilter = tags.length > 0;
  if (narrowedAttributes.length === 0 && !hasTagFilter) {
    return true;
  }

  const row = metadataById[productId];
  if (!row) return false;

  const metrics = (row.metrics || {}) as Record<string, number>;

  for (const attribute of narrowedAttributes) {
    const range = ranges[attribute.id]!;
    const value = metrics[attribute.id];
    if (typeof value !== 'number' || Number.isNaN(value)) return false;
    if (value < range.min || value > range.max) return false;
  }

  if (hasTagFilter) {
    const moodTags = (row.moodTags || []).map((tag) => tag.toLowerCase());
    const wants = tags.map((tag) => tag.toLowerCase());
    if (!wants.some((tag) => moodTags.includes(tag))) return false;
  }

  return true;
}

export function CatalogBrowser({
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

  const [query, setQuery] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [ranges, setRanges] = useState<RangeState>(() => {
    const initial: RangeState = {};
    for (const attribute of attributes) {
      initial[attribute.id] = {
        min: attribute.minValue,
        max: attribute.maxValue
      };
    }
    return initial;
  });

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsInput]
  );

  const catalog = useMemo(() => {
    return products.filter((product) => {
      if (
        !matchesMoodFilters(product.id, metadataById, attributes, ranges, tags)
      ) {
        return false;
      }

      return fuzzyMatch(query, [
        product.title,
        stripHtml(product.description || ''),
        product.handle,
        product.tags.join(' '),
        ...product.variants.map((variant) => `${variant.title} ${variant.sku}`)
      ]);
    });
  }, [attributes, metadataById, products, query, ranges, tags]);

  return (
    <div>
      <div className="mb-12 space-y-8 border-b border-line pb-10">
        <label className="block">
          <span className="sr-only">Search catalog</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search works…"
            className="w-full border-b border-line bg-transparent py-3 text-base outline-none placeholder:text-mute/70 focus:border-ink"
          />
        </label>

        {attributes.length === 0 ? (
          <p className="text-sm text-mute">
            Mood filters appear here once attributes are configured in admin.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {attributes.map((attribute) => {
              const range = ranges[attribute.id] || {
                min: attribute.minValue,
                max: attribute.maxValue
              };

              return (
                <div key={attribute.id}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <label className="text-sm text-ink">{attribute.label}</label>
                    <span className="text-xs tabular-nums text-mute">
                      {range.min} – {range.max}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={attribute.minValue}
                      max={attribute.maxValue}
                      step={attribute.step}
                      value={range.min}
                      aria-label={`${attribute.label} minimum`}
                      onChange={(event) => {
                        const min = Number(event.target.value);
                        setRanges((current) => ({
                          ...current,
                          [attribute.id]: {
                            min: Math.min(min, current[attribute.id]?.max ?? attribute.maxValue),
                            max: current[attribute.id]?.max ?? attribute.maxValue
                          }
                        }));
                      }}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={attribute.minValue}
                      max={attribute.maxValue}
                      step={attribute.step}
                      value={range.max}
                      aria-label={`${attribute.label} maximum`}
                      onChange={(event) => {
                        const max = Number(event.target.value);
                        setRanges((current) => ({
                          ...current,
                          [attribute.id]: {
                            min: current[attribute.id]?.min ?? attribute.minValue,
                            max: Math.max(max, current[attribute.id]?.min ?? attribute.minValue)
                          }
                        }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm text-mute">Mood tags</span>
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="calm, dusk, soft"
            className="w-full border-b border-line bg-transparent py-2 text-sm outline-none placeholder:text-mute/70 focus:border-ink"
          />
        </label>
      </div>

      {catalog.length === 0 ? (
        <p className="py-24 text-center text-sm text-mute">No works match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {catalog.map((product, index) => (
            <ArtworkCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
