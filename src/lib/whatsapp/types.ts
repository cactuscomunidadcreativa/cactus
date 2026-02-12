export interface WAMessage {
  id: string;
  phone: string;
  user_id: string | null;
  direction: 'inbound' | 'outbound';
  content: string;
  module: string | null;
  processed: boolean;
  created_at: string;
}

export interface WASession {
  id: string;
  phone: string;
  user_id: string | null;
  active_module: 'router' | 'weekflow' | 'ramona';
  context: Record<string, any>;
  last_activity: string;
  created_at: string;
}

export interface WAPhoneLink {
  id: string;
  user_id: string;
  phone: string;
  verified: boolean;
  verification_code: string | null;
  linked_at: string | null;
  created_at: string;
}

export interface WAAdapter {
  sendMessage(phone: string, message: string): Promise<boolean>;
  verifyWebhook(params: Record<string, string>): boolean;
}

export interface WAInboundMessage {
  phone: string;
  content: string;
  timestamp?: string;
}
