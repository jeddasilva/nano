import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { ensureSchema, requireDb } from 'db';
import { orderFulfillments } from 'db/schema';
import { getFulfillmentKind, getProdigiSku, type FulfillmentKind } from 'lib/sku';

type ShippingAddress = {
  name?: string;
  line1?: string;
  postalCode?: string;
  country?: string;
  city?: string;
};

type OrderOffer = {
  quantity?: number;
  variant?: {
    sku?: string;
  };
};

export async function routeOrderFulfillment({
  orderId,
  offers,
  shippingAddress
}: {
  orderId: string;
  offers: OrderOffer[];
  shippingAddress?: ShippingAddress;
}) {
  for (const item of offers) {
    const sku = item.variant?.sku || '';
    const kind = getFulfillmentKind(sku);
    if (!kind) continue;

    if (kind === 'ORIGINAL') {
      await createOriginalFulfillment(orderId);
      await notifyManualFulfillment({ orderId, sku });
      continue;
    }

    await createProdigiFulfillment({
      orderId,
      sku,
      kind,
      quantity: item.quantity || 1,
      shippingAddress
    });
  }
}

async function createOriginalFulfillment(orderId: string) {
  await ensureSchema();
  const database = requireDb();

  await database.insert(orderFulfillments).values({
    id: crypto.randomUUID(),
    fourthwallOrderId: orderId,
    fulfillmentType: 'ORIGINAL',
    status: 'PENDING_MANUAL'
  });
}

async function notifyManualFulfillment({ orderId, sku }: { orderId: string; sku: string }) {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  const message = `Original artwork order ready to pack & ship.\nOrder: ${orderId}\nSKU: ${sku}`;

  if (slackWebhook) {
    await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    return;
  }

  console.info('[Fulfillment]', message);
}

async function createProdigiFulfillment({
  orderId,
  sku,
  kind,
  quantity,
  shippingAddress
}: {
  orderId: string;
  sku: string;
  kind: Exclude<FulfillmentKind, 'ORIGINAL'>;
  quantity: number;
  shippingAddress?: ShippingAddress;
}) {
  const apiKey = process.env.PRODIGI_API_KEY;
  if (!apiKey) {
    throw new Error('PRODIGI_API_KEY is not configured');
  }

  const artAssetBase = process.env.ART_ASSET_BASE_URL || 'https://your-art-storage.com/masters';
  const isFramed = kind === 'FRAMED_PRINT';

  const prodigiRes = await fetch('https://api.prodigi.com/v4.0/orders', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      merchantReference: orderId,
      shippingMethod: 'Standard',
      recipient: {
        name: shippingAddress?.name || 'Customer',
        address: {
          line1: shippingAddress?.line1 || '',
          postalOrZipCode: shippingAddress?.postalCode || '',
          countryCode: shippingAddress?.country || '',
          townOrCity: shippingAddress?.city || ''
        }
      },
      items: [
        {
          sku: getProdigiSku(kind),
          copies: quantity,
          sizing: 'fillPrintArea',
          attributes: isFramed ? { frameColour: 'black', glaze: 'acrylic' } : {},
          assets: [
            {
              printArea: 'default',
              url: `${artAssetBase}/${sku}.tiff`
            }
          ]
        }
      ]
    })
  });

  const prodigiData = await prodigiRes.json();

  if (!prodigiRes.ok) {
    console.error('[Prodigi] Order create failed', prodigiData);
    throw new Error('Failed to create Prodigi order');
  }

  await ensureSchema();
  const database = requireDb();
  await database.insert(orderFulfillments).values({
    id: crypto.randomUUID(),
    fourthwallOrderId: orderId,
    prodigiOrderId: prodigiData.order?.id,
    fulfillmentType: kind,
    status: 'IN_PRODUCTION'
  });
}

export async function syncTrackingToFourthwall({
  fourthwallOrderId,
  trackingNumber,
  carrier
}: {
  fourthwallOrderId: string;
  trackingNumber: string;
  carrier: string;
}) {
  const user = process.env.FOURTHWALL_OPEN_API_USER;
  const password = process.env.FOURTHWALL_OPEN_API_PASSWORD;

  if (!user || !password) {
    throw new Error('Fourthwall Open API credentials are not configured');
  }

  const credentials = Buffer.from(`${user}:${password}`).toString('base64');

  const fwRes = await fetch(
    `https://api.fourthwall.com/open-api/v1.0/orders/${fourthwallOrderId}/fulfillments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trackingNumber,
        carrier,
        notifyCustomer: true
      })
    }
  );

  if (!fwRes.ok) {
    const body = await fwRes.text();
    console.error('[Fourthwall] Fulfillment sync failed', body);
    throw new Error('Failed to sync tracking to Fourthwall');
  }

  await ensureSchema();
  const database = requireDb();
  await database
    .update(orderFulfillments)
    .set({ trackingNumber, carrier, status: 'SHIPPED' })
    .where(eq(orderFulfillments.fourthwallOrderId, fourthwallOrderId));
}
