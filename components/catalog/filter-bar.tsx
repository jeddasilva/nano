'use client';

import { AttributeDefinition } from 'db/schema';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

type RangeState = Record<string, { min: number; max: number }>;

export function FilterBar({ attributes }: { attributes: AttributeDefinition[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialRanges = useMemo(() => {
    const ranges: RangeState = {};
    for (const attribute of attributes) {
      const minParam = searchParams.get(`${attribute.id}_min`);
      const maxParam = searchParams.get(`${attribute.id}_max`);
      ranges[attribute.id] = {
        min: minParam !== null ? Number(minParam) : attribute.minValue,
        max: maxParam !== null ? Number(maxParam) : attribute.maxValue
      };
    }
    return ranges;
  }, [attributes, searchParams]);

  const [ranges, setRanges] = useState<RangeState>(initialRanges);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const tagsParam = searchParams.get('tags') || '';
  const [tagsInput, setTagsInput] = useState(tagsParam);

  useEffect(() => {
    setRanges(initialRanges);
  }, [initialRanges]);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setTagsInput(tagsParam);
  }, [tagsParam]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      const cleanedQuery = query.trim();
      if (cleanedQuery) {
        params.set('q', cleanedQuery);
      } else {
        params.delete('q');
      }

      for (const attribute of attributes) {
        const range = ranges[attribute.id];
        if (!range) continue;

        if (range.min > attribute.minValue) {
          params.set(`${attribute.id}_min`, String(range.min));
        } else {
          params.delete(`${attribute.id}_min`);
        }

        if (range.max < attribute.maxValue) {
          params.set(`${attribute.id}_max`, String(range.max));
        } else {
          params.delete(`${attribute.id}_max`);
        }
      }

      const cleanedTags = tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(',');

      if (cleanedTags) {
        params.set('tags', cleanedTags);
      } else {
        params.delete('tags');
      }

      const next = params.toString();
      if (next === searchParams.toString()) return;

      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [attributes, pathname, query, ranges, router, searchParams, tagsInput]);

  return (
    <div className={`space-y-8 ${isPending ? 'opacity-70' : 'opacity-100'} transition-opacity`}>
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
          id="mood-tags"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="calm, dusk, soft"
          className="w-full border-b border-line bg-transparent py-2 text-sm outline-none placeholder:text-mute/70 focus:border-ink"
        />
      </label>
    </div>
  );
}
