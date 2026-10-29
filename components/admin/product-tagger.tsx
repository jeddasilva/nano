'use client';

import { AttributeDefinition, ProductMetadata } from 'db/schema';
import { Product } from 'lib/types';
import { saveProductMetadata } from 'server-actions/save-metadata';
import { useMemo, useState, useTransition } from 'react';

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
  const [metrics, setMetrics] = useState<Record<string, number>>(
    (existing?.metrics as Record<string, number>) || {}
  );
  const [tags, setTags] = useState((existing?.moodTags || []).join(', '));
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  function selectProduct(productId: string) {
    setSelectedId(productId);
    const row = metadataById[productId];
    setMetrics((row?.metrics as Record<string, number>) || {});
    setTags((row?.moodTags || []).join(', '));
    setMessage('');
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <ul className="divide-y divide-line border-y border-line">
        {products.map((product) => (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => selectProduct(product.id)}
              className={`w-full py-3 text-left text-sm transition ${
                selectedId === product.id ? 'text-ink' : 'text-mute hover:text-ink'
              }`}
            >
              {product.title}
            </button>
          </li>
        ))}
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
              await saveProductMetadata(selected.id, metrics, parsedTags);
              setMessage('Saved');
            });
          }}
        >
          <div>
            <h2 className="font-display text-2xl tracking-tight">{selected.title}</h2>
            <p className="mt-1 text-xs text-mute">{selected.id}</p>
          </div>

          <div className="space-y-6">
            {attributes.map((attribute) => (
              <label key={attribute.id} className="block">
                <div className="mb-2 flex justify-between text-sm">
                  <span>{attribute.label}</span>
                  <span className="tabular-nums text-mute">
                    {metrics[attribute.id] ?? attribute.minValue}
                  </span>
                </div>
                <input
                  type="range"
                  min={attribute.minValue}
                  max={attribute.maxValue}
                  step={attribute.step}
                  value={metrics[attribute.id] ?? attribute.minValue}
                  onChange={(event) =>
                    setMetrics((current) => ({
                      ...current,
                      [attribute.id]: Number(event.target.value)
                    }))
                  }
                  className="w-full"
                />
              </label>
            ))}
          </div>

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
            <button type="submit" className="h-10 bg-ink px-5 text-sm text-white hover:bg-ink/90">
              Save metadata
            </button>
            {message ? <span className="text-sm text-mute">{message}</span> : null}
          </div>
        </form>
      ) : (
        <p className="text-sm text-mute">No products available.</p>
      )}
    </div>
  );
}
