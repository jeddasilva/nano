import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { routeOrderFulfillment } from 'lib/fulfillment';

type CacheWebhookEventType = 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'COLLECTION_UPDATED';

type OrderWebhookEventType = 'ORDER_PLACED';

type WebhookEventType = CacheWebhookEventType | OrderWebhookEventType | string;

interface WebhookPayload {
  type: WebhookEventType;
  data: {
    id?: string;
    slug?: string;
    orderId?: string;
    offers?: Array<{
      quantity?: number;
      variant?: { sku?: string };
    }>;
    shippingAddress?: {
      name?: string;
      line1?: string;
      postalCode?: string;
      country?: string;
      city?: string;
    };
    [key: string]: unknown;
  };
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch {
    return false;
  }
}

function getTagsToInvalidate(payload: WebhookPayload): string[] {
  const { type, data } = payload;

  if (!data.slug) {
    return [];
  }

  switch (type) {
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
      return [`product-${data.slug}`, 'collection-all', 'products'];

    case 'COLLECTION_UPDATED':
      return [`collection-${data.slug}`];

    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.FOURTHWALL_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook] FOURTHWALL_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Missing webhook secret configuration' }, { status: 400 });
  }

  const signature = request.headers.get('X-Fourthwall-Hmac-SHA256');

  if (!signature) {
    console.warn('[Webhook] Missing signature header');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const rawBody = await request.text();

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    console.warn('[Webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Webhook] Failed to parse payload');
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  console.log('[Webhook] Received event:', payload.type);

  if (payload.type === 'ORDER_PLACED') {
    const orderId = payload.data.orderId || payload.data.id;
    const offers = payload.data.offers || [];

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
    }

    try {
      await routeOrderFulfillment({
        orderId,
        offers,
        shippingAddress: payload.data.shippingAddress
      });

      return NextResponse.json({ received: true, routed: true }, { status: 200 });
    } catch (error) {
      console.error('[Webhook] Fulfillment routing failed:', error);
      return NextResponse.json({ error: 'Fulfillment routing failed' }, { status: 500 });
    }
  }

  const tags = getTagsToInvalidate(payload);

  if (tags.length === 0) {
    return NextResponse.json(
      { revalidated: false, reason: 'No tags to invalidate', timestamp: Date.now() },
      { status: 200 }
    );
  }

  try {
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }

    return NextResponse.json({
      revalidated: true,
      tags,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Webhook] Revalidation failed:', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
