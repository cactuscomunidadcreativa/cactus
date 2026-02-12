import { NextRequest, NextResponse } from 'next/server';
import { processInboundMessage } from '@/lib/whatsapp';

/**
 * WhatsApp webhook endpoint.
 * Supports two formats:
 * - Twilio real: application/x-www-form-urlencoded with From, Body, etc.
 * - Mock/admin tester: application/json with { phone, content }
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let phone: string;
    let content: string;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Twilio webhook format
      const formData = await req.formData();
      phone = ((formData.get('From') as string) || '').replace('whatsapp:', '');
      content = (formData.get('Body') as string) || '';

      // Verify Twilio signature if configured
      if (process.env.TWILIO_AUTH_TOKEN) {
        const { TwilioAdapter } = await import('@/lib/whatsapp/twilio-adapter');
        const adapter = new TwilioAdapter();
        const params: Record<string, string> = {
          'x-twilio-signature': req.headers.get('x-twilio-signature') || '',
          'webhook_url': `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/webhook`,
        };
        formData.forEach((v, k) => {
          params[k] = v as string;
        });

        if (!adapter.verifyWebhook(params)) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }
      }
    } else {
      // Mock/admin tester format (JSON)
      const body = await req.json();
      phone = body.phone;
      content = body.content;
    }

    if (!phone || !content) {
      return NextResponse.json({ error: 'phone and content are required' }, { status: 400 });
    }

    const response = await processInboundMessage({ phone, content });

    // Twilio expects TwiML response
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return new NextResponse('<Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET for webhook verification (Twilio/Meta)
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  if (params['hub.verify_token'] === process.env.WA_VERIFY_TOKEN) {
    return new NextResponse(params['hub.challenge']);
  }
  return NextResponse.json({ status: 'ok' });
}
