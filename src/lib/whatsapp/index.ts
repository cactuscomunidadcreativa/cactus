import { createServerClient } from '@supabase/ssr';
import type { WAInboundMessage, WASession } from './types';
import { MockAdapter } from './mock-adapter';
import { TwilioAdapter } from './twilio-adapter';
import { detectIntent } from './router';
import { getMenuMessage, getHelpMessage, getUnknownUserMessage } from './handlers/router-handler';
import { handleWeekflowMessage } from './handlers/weekflow-handler';
import { handleRamonaMessage } from './handlers/ramona-handler';

export type { WAMessage, WASession, WAPhoneLink, WAAdapter, WAInboundMessage } from './types';
export { TwilioAdapter } from './twilio-adapter';

const getSupabase = () => createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { cookies: { getAll: () => [], setAll: () => {} } }
);

function getAdapter() {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return new TwilioAdapter();
  }
  return new MockAdapter();
}

/**
 * Process an inbound WhatsApp message and generate a response.
 */
export async function processInboundMessage(msg: WAInboundMessage): Promise<string> {
  const supabase = getSupabase();
  const adapter = getAdapter();

  // Find user by phone
  const { data: phoneLink } = await supabase
    .from('wa_phone_links')
    .select('user_id')
    .eq('phone', msg.phone)
    .eq('verified', true)
    .single();

  if (!phoneLink) {
    const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cactus.app';
    const response = getUnknownUserMessage(platformUrl);
    await adapter.sendMessage(msg.phone, response);
    return response;
  }

  const userId = phoneLink.user_id;

  // Save inbound message
  await supabase.from('wa_messages').insert({
    phone: msg.phone,
    user_id: userId,
    direction: 'inbound',
    content: msg.content,
    module: null,
    processed: false,
  });

  // Get or create session
  let { data: session } = await supabase
    .from('wa_sessions')
    .select('*')
    .eq('phone', msg.phone)
    .single();

  if (!session) {
    const { data: newSession } = await supabase
      .from('wa_sessions')
      .insert({
        phone: msg.phone,
        user_id: userId,
        active_module: 'router',
        context: {},
      })
      .select()
      .single();
    session = newSession;
  }

  // Detect intent
  const intent = detectIntent(msg.content, session as WASession);

  // Route to handler
  let response: string;

  switch (intent.module) {
    case 'router':
      if (intent.action === 'help') {
        response = getHelpMessage();
      } else {
        response = getMenuMessage();
      }
      // Reset session to router
      await supabase
        .from('wa_sessions')
        .update({ active_module: 'router', last_activity: new Date().toISOString() })
        .eq('id', session.id);
      break;

    case 'weekflow':
      response = await handleWeekflowMessage(userId, intent.action || 'activate', intent.data);
      await supabase
        .from('wa_sessions')
        .update({ active_module: 'weekflow', last_activity: new Date().toISOString() })
        .eq('id', session.id);
      break;

    case 'ramona':
      response = await handleRamonaMessage(userId, intent.action || 'activate', intent.data);
      await supabase
        .from('wa_sessions')
        .update({ active_module: 'ramona', last_activity: new Date().toISOString() })
        .eq('id', session.id);
      break;

    default:
      response = getMenuMessage();
  }

  // Save outbound message
  await supabase.from('wa_messages').insert({
    phone: msg.phone,
    user_id: userId,
    direction: 'outbound',
    content: response,
    module: intent.module,
    processed: true,
  });

  // Send via adapter
  await adapter.sendMessage(msg.phone, response);

  return response;
}
