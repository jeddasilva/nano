export type FulfillmentKind = 'ORIGINAL' | 'PRINT' | 'FRAMED_PRINT';

export function getFulfillmentKind(sku: string): FulfillmentKind | null {
  if (sku.startsWith('FRAMED-PRINT-')) return 'FRAMED_PRINT';
  if (sku.startsWith('PRINT-')) return 'PRINT';
  if (sku.startsWith('ORIGINAL-')) return 'ORIGINAL';
  return null;
}

export function classifyArtVariant(sku: string): {
  kind: FulfillmentKind;
  label: string;
  editionLabel: string;
} | null {
  const kind = getFulfillmentKind(sku);
  if (!kind) return null;

  switch (kind) {
    case 'ORIGINAL':
      return { kind, label: 'Original Artwork', editionLabel: '1 of 1' };
    case 'PRINT':
      return { kind, label: 'Archival Fine Art Print', editionLabel: 'Edition' };
    case 'FRAMED_PRINT':
      return { kind, label: 'Framed Fine Art Print', editionLabel: 'Edition' };
  }
}

export function getProdigiSku(kind: Exclude<FulfillmentKind, 'ORIGINAL'>): string {
  return kind === 'FRAMED_PRINT' ? 'GLOBAL-FAP-FRAMED-16x20' : 'GLOBAL-FAP-16x20';
}
