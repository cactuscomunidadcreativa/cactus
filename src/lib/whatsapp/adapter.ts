import type { WAAdapter } from './types';

export abstract class BaseAdapter implements WAAdapter {
  abstract sendMessage(phone: string, message: string): Promise<boolean>;
  abstract verifyWebhook(params: Record<string, string>): boolean;
}
