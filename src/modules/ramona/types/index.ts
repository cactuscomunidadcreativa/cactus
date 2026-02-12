export interface RMBrand {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  tone: string[];
  audience: RMAudience;
  competitors: string[];
  value_proposition: string | null;
  example_content: string[];
  keywords: string[];
  forbidden_words: string[];
  visual_style: Record<string, string>;
  logo_url: string | null;
  platforms: SocialPlatform[];
  settings: Record<string, any>;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RMAudience {
  age_range?: string;
  gender?: string;
  interests?: string;
  pain_points?: string;
}

export interface RMContent {
  id: string;
  brand_id: string;
  user_id: string;
  title: string | null;
  body: string;
  media_urls: string[];
  hashtags: string[];
  platform: SocialPlatform;
  content_type: ContentType;
  status: ContentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  ai_model: string | null;
  ai_prompt_used: string | null;
  generation_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RMGeneration {
  id: string;
  brand_id: string;
  user_id: string;
  prompt: string;
  system_prompt: string | null;
  model: string;
  provider: AIProviderType;
  input_tokens: number;
  output_tokens: number;
  response: string | null;
  error: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration_ms: number | null;
  created_at: string;
}

export interface RMUsage {
  id: string;
  user_id: string;
  brand_id: string;
  month: string;
  content_count: number;
  generation_count: number;
  updated_at: string;
}

export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'multi';
export type ContentType = 'post' | 'story' | 'reel' | 'carousel' | 'thread' | 'article';
export type ContentStatus = 'idea' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'archived';
export type AIProviderType = 'claude' | 'openai';

export interface BrandOnboardingData {
  name: string;
  industry: string;
  tone: string[];
  keywords: string[];
  forbidden_words: string[];
  audience: RMAudience;
  value_proposition: string;
  competitors: string[];
  platforms: SocialPlatform[];
  example_content: string[];
  visual_style: Record<string, string>;
}
