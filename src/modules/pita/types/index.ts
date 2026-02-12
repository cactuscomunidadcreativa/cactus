export interface Presentation {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  brand_config: BrandConfig;
}

export interface BrandConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  logo?: string;
  fontFamily?: string;
}

export interface PresentationSection {
  id: string;
  presentation_id: string;
  order_index: number;
  title: string;
  subtitle?: string;
  content: string;
  section_type: 'cover' | 'content' | 'quote' | 'architecture' | 'visual' | 'manifesto' | 'closing';
  metadata?: Record<string, any>;
}

export interface Reviewer {
  id: string;
  presentation_id: string;
  name: string;
  session_token: string;
  created_at: string;
  last_seen_at: string;
}

export interface SectionFeedback {
  id: string;
  section_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reaction?: 'like' | 'dislike' | 'love';
  comment?: string;
  created_at: string;
}

export interface FeedbackSummary {
  section_id: string;
  section_title: string;
  total_reactions: {
    like: number;
    dislike: number;
    love: number;
  };
  comments: {
    reviewer_name: string;
    comment: string;
    created_at: string;
  }[];
}
