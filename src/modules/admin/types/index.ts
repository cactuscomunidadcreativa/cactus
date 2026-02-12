export interface PlatformConfig {
  key: string;
  value: string;
  encrypted: boolean;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface TokenBudget {
  id: string;
  user_id: string;
  app_id: string;
  monthly_token_limit: number;
  monthly_tokens_used: number;
  monthly_generation_limit: number;
  monthly_generations_used: number;
  month: string;
  created_at: string;
  updated_at: string;
  // joined
  user_email?: string;
  user_name?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, any>;
  created_at: string;
  admin_name?: string;
}

export interface UsageAnalytics {
  totalUsers: number;
  totalGenerations: number;
  totalTokens: number;
  byApp: { app_id: string; generations: number; tokens: number }[];
  topUsers: { user_id: string; email: string; generations: number; tokens: number }[];
}
