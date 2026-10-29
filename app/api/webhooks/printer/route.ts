import { NextResponse } from 'next/server';
import { syncTrackingToFourthwall } from 'lib/fulfillment';

type PrinterWebhookBody = {
  data?: {
    status?: string;
    trackingNumber?: string;
    carrier?: string;
    merchantReference?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PrinterWebhookBody;
    const { status, trackingNumber, carrier, merchantReference } = body.data || {};

    if (status === 'Dispatched' && merchantReference && trackingNumber && carrier) {
      await syncTrackingToFourthwall({
        fourthwallOrderId: merchantReference,
        trackingNumber,
        carrier
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Printer webhook]', error);
    return NextResponse.json({ error: 'Failed to process printer webhook' }, { status: 500 });
  }
}
