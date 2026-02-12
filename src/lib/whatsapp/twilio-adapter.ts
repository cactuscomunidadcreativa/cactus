import { BaseAdapter } from './adapter';
import crypto from 'crypto';

/**
 * Real Twilio adapter for sending WhatsApp messages.
 * Uses Twilio REST API directly (no SDK) to keep bundle small.
 */
export class TwilioAdapter extends BaseAdapter {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken) {
      console.error('[TwilioAdapter] Missing credentials');
      return false;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

    const toNumber = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;
    const fromNumber = this.fromNumber.startsWith('whatsapp:')
      ? this.fromNumber
      : `whatsapp:${this.fromNumber}`;

    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: message,
    });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[TwilioAdapter] Send failed:', res.status, errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TwilioAdapter] Network error:', error);
      return false;
    }
  }

  verifyWebhook(params: Record<string, string>): boolean {
    const signature = params['x-twilio-signature'];
    const webhookUrl = params['webhook_url'];

    if (!signature || !webhookUrl || !this.authToken) {
      return false;
    }

    // Build validation string: URL + sorted param key-value pairs
    const excludeKeys = new Set(['x-twilio-signature', 'webhook_url']);
    const sortedKeys = Object.keys(params)
      .filter((k) => !excludeKeys.has(k))
      .sort();

    let validationString = webhookUrl;
    for (const key of sortedKeys) {
      validationString += key + params[key];
    }

    const expected = crypto
      .createHmac('sha1', this.authToken)
      .update(validationString)
      .digest('base64');

    return signature === expected;
  }
}
