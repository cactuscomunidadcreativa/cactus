import { BaseAdapter } from './adapter';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock WhatsApp adapter that stores messages in the database
 * instead of sending them through Twilio/WhatsApp Business API.
 * Used for development and testing.
 */
export class MockAdapter extends BaseAdapter {
  private supabase: SupabaseClient;

  constructor() {
    super();
    this.supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
  }

  async sendMessage(phone: string, message: string): Promise<boolean> {
    // Find user by phone
    const { data: link } = await this.supabase
      .from('wa_phone_links')
      .select('user_id')
      .eq('phone', phone)
      .eq('verified', true)
      .single();

    await this.supabase.from('wa_messages').insert({
      phone,
      user_id: link?.user_id || null,
      direction: 'outbound',
      content: message,
      module: 'system',
      processed: true,
    });

    return true;
  }

  verifyWebhook(params: Record<string, string>): boolean {
    // Mock always returns true
    return true;
  }
}
