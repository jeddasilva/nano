'use client';

import { createAttribute, deleteAttribute, toggleAttribute } from 'server-actions/attributes';
import { AttributeDefinition } from 'db/schema';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function AttributeManager({
  attributes,
  databaseConfigured
}: {
  attributes: AttributeDefinition[];
  databaseConfigured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={`space-y-10 ${isPending ? 'opacity-70' : ''}`}>
      {!databaseConfigured ? (
        <div className="border border-line bg-soft px-4 py-3 text-sm text-ink">
          Database is not configured. Set <code className="text-xs">DATABASE_URL</code> or{' '}
          <code className="text-xs">POSTGRES_URL</code> in Vercel env vars, then redeploy.
        </div>
      ) : null}

      {error ? (
        <div className="border border-line px-4 py-3 text-sm text-ink">
          {error}
        </div>
      ) : null}

      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await createAttribute(formData);
            if (!result.ok) {
              setError(result.error || 'Failed to create attribute');
              return;
            }
            router.refresh();
          });
        }}
        className="grid gap-4 border border-line p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-display text-xl">Create slider</h2>
        <label className="block text-sm">
          <span className="text-mute">Label</span>
          <input
            name="label"
            required
            placeholder="Calmness"
            className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="text-mute">ID (optional)</span>
          <input
            name="id"
            placeholder="calmness_level"
            className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="text-mute">Min</span>
          <input
            name="minValue"
            type="number"
            defaultValue={0}
            className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
        </label>
        <label className="block text-sm">
          <span className="text-mute">Max</span>
          <input
            name="maxValue"
            type="number"
            defaultValue={100}
            className="mt-2 w-full border-b border-line bg-transparent py-2 outline-none focus:border-ink"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!databaseConfigured || isPending}
            className="h-10 bg-ink px-5 text-sm text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add attribute
          </button>
        </div>
      </form>

      <ul className="divide-y divide-line border-y border-line">
        {attributes.length === 0 ? (
          <li className="py-4 text-sm text-mute">No attributes yet.</li>
        ) : (
          attributes.map((attribute) => (
            <li
              key={attribute.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="text-sm text-ink">{attribute.label}</p>
                <p className="mt-1 text-xs text-mute">
                  {attribute.id} · {attribute.minValue}–{attribute.maxValue} ·{' '}
                  {attribute.isActive ? 'active' : 'inactive'}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  className="text-mute hover:text-ink"
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await toggleAttribute(attribute.id, !attribute.isActive);
                      if (!result.ok) {
                        setError(result.error || 'Failed to update attribute');
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  {attribute.isActive ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className="text-mute hover:text-ink"
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await deleteAttribute(attribute.id);
                      if (!result.ok) {
                        setError(result.error || 'Failed to delete attribute');
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
