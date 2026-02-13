// ============================================================
// CEREUS x PRIVAT - Complete Type System
// Emotional Algorithmic Atelier
// ============================================================

// ============================================================
// 1. ENUMS & CONSTANTS
// ============================================================

export type CereusClientRole = 'client' | 'advisor' | 'workshop' | 'admin';

export type GarmentStatus =
  | 'draft'
  | 'design'
  | 'approved'
  | 'costing'
  | 'in_production'
  | 'quality_check'
  | 'delivered'
  | 'archived';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'cutting'
  | 'sewing'
  | 'finishing'
  | 'quality_check'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

export type BodyZone = 'upper' | 'lower' | 'full';

export type GarmentCategory =
  | 'dress'
  | 'gown'
  | 'suit'
  | 'blazer'
  | 'coat'
  | 'skirt'
  | 'pants'
  | 'blouse'
  | 'shirt'
  | 'jumpsuit'
  | 'cape'
  | 'corset'
  | 'accessory'
  | 'other';

export type MaterialType =
  | 'fabric'
  | 'lining'
  | 'trim'
  | 'hardware'
  | 'thread'
  | 'interfacing'
  | 'elastic'
  | 'zipper'
  | 'button'
  | 'embellishment'
  | 'other';

export type MaterialUnit = 'metro' | 'yard' | 'pieza' | 'kg' | 'rollo' | 'par' | 'set';

export type Season =
  | 'spring_summer'
  | 'fall_winter'
  | 'resort'
  | 'cruise'
  | 'capsule'
  | 'bridal'
  | 'custom';

export type StyleArchetype =
  | 'classic_elegance'
  | 'modern_minimalist'
  | 'romantic_dreamer'
  | 'bold_avant_garde'
  | 'bohemian_free'
  | 'power_executive'
  | 'ethereal_goddess'
  | 'structured_architectural';

export type Warmth = 'warm' | 'cool' | 'neutral';

export type ClosetSource = 'order' | 'external' | 'gift' | 'sample';

export type ProductionStage =
  | 'pattern'
  | 'cutting'
  | 'sewing'
  | 'embroidery'
  | 'finishing'
  | 'pressing'
  | 'quality_check'
  | 'packaging';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'assign'
  | 'upload'
  | 'approve'
  | 'reject'
  | 'deliver';

export type VipTier = 'standard' | 'silver' | 'gold' | 'platinum' | 'privat';

export type PreferredContact = 'whatsapp' | 'email' | 'phone' | 'in_person';

export type BodyShape =
  | 'hourglass'
  | 'pear'
  | 'apple'
  | 'rectangle'
  | 'inverted_triangle'
  | 'athletic';

export type CollectionStatus = 'concept' | 'design' | 'production' | 'launched' | 'archived';

export type VariantStatus = 'draft' | 'proposed' | 'approved' | 'ordered' | 'archived';

export type QualityResult = 'pending' | 'passed' | 'passed_with_notes' | 'failed' | 'rework_required';

export type ItemCondition = 'new' | 'excellent' | 'good' | 'fair' | 'needs_repair';

export type RecommendationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'expired';

export type NotificationType =
  | 'order_status'
  | 'fitting_reminder'
  | 'delivery_ready'
  | 'quality_issue'
  | 'new_recommendation'
  | 'payment_due'
  | 'new_collection'
  | 'measurement_reminder'
  | 'ar_session_ready'
  | 'production_update'
  | 'system';

export type NotificationChannel = 'in_app' | 'email' | 'whatsapp' | 'push';

export type AIProvider = 'claude' | 'openai' | 'manual';

export type ImageType = 'full_body' | 'upper_body' | 'detail' | 'outfit' | 'fabric' | 'inspiration';

export type OrderPriority = 'normal' | 'high' | 'rush' | 'vip';

export type DeliveryMethod = 'pickup' | 'delivery' | 'shipping';

// Production stage display config
export const PRODUCTION_STAGES: { stage: ProductionStage; label: string; labelEs: string; icon: string }[] = [
  { stage: 'pattern', label: 'Pattern', labelEs: 'Patronaje', icon: '📐' },
  { stage: 'cutting', label: 'Cutting', labelEs: 'Corte', icon: '✂️' },
  { stage: 'sewing', label: 'Sewing', labelEs: 'Confección', icon: '🪡' },
  { stage: 'embroidery', label: 'Embroidery', labelEs: 'Bordado', icon: '🧵' },
  { stage: 'finishing', label: 'Finishing', labelEs: 'Acabado', icon: '✨' },
  { stage: 'pressing', label: 'Pressing', labelEs: 'Planchado', icon: '♨️' },
  { stage: 'quality_check', label: 'Quality Check', labelEs: 'Control de Calidad', icon: '🔍' },
  { stage: 'packaging', label: 'Packaging', labelEs: 'Empaque', icon: '📦' },
];

export const STYLE_ARCHETYPES: { value: StyleArchetype; label: string; labelEs: string; description: string }[] = [
  { value: 'classic_elegance', label: 'Classic Elegance', labelEs: 'Elegancia Clásica', description: 'Timeless sophistication, refined details, structured silhouettes' },
  { value: 'modern_minimalist', label: 'Modern Minimalist', labelEs: 'Minimalismo Moderno', description: 'Clean lines, monochrome, architectural simplicity' },
  { value: 'romantic_dreamer', label: 'Romantic Dreamer', labelEs: 'Romántica Soñadora', description: 'Soft fabrics, flowing shapes, feminine details' },
  { value: 'bold_avant_garde', label: 'Bold Avant-Garde', labelEs: 'Avant-Garde Audaz', description: 'Experimental, statement pieces, boundary-pushing' },
  { value: 'bohemian_free', label: 'Bohemian Free Spirit', labelEs: 'Espíritu Bohemio', description: 'Relaxed luxury, natural textures, effortless chic' },
  { value: 'power_executive', label: 'Power Executive', labelEs: 'Ejecutiva Poderosa', description: 'Authority dressing, sharp tailoring, commanding presence' },
  { value: 'ethereal_goddess', label: 'Ethereal Goddess', labelEs: 'Diosa Etérea', description: 'Draped fabrics, celestial palettes, otherworldly beauty' },
  { value: 'structured_architectural', label: 'Structured Architectural', labelEs: 'Arquitectónica Estructural', description: 'Geometric shapes, sculptural forms, construction as art' },
];

export const VIP_TIERS: { value: VipTier; label: string; labelEs: string; color: string }[] = [
  { value: 'standard', label: 'Standard', labelEs: 'Estándar', color: '#6B7280' },
  { value: 'silver', label: 'Silver', labelEs: 'Plata', color: '#9CA3AF' },
  { value: 'gold', label: 'Gold', labelEs: 'Oro', color: '#C9A84C' },
  { value: 'platinum', label: 'Platinum', labelEs: 'Platino', color: '#E5E7EB' },
  { value: 'privat', label: 'PRIVAT', labelEs: 'PRIVAT', color: '#0A0A0A' },
];

// ============================================================
// 2. CORE MODELS
// ============================================================

export interface CereusClient {
  id: string;
  maison_id: string;
  user_id?: string | null;

  // Identity
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  date_of_birth?: string;
  avatar_url?: string;

  // Classification
  role: CereusClientRole;
  vip_tier: VipTier;
  preferred_language: string;
  preferred_contact: PreferredContact;

  // Advisor
  assigned_advisor_id?: string | null;

  // Notes
  internal_notes?: string;
  style_notes?: string;

  // Privacy
  consent_photos: boolean;
  consent_data: boolean;
  consent_marketing: boolean;

  // State
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurement {
  id: string;
  client_id: string;
  measured_by?: string | null;

  // Core measurements (cm)
  bust?: number;
  underbust?: number;
  waist?: number;
  high_hip?: number;
  hip?: number;
  shoulder_width?: number;
  arm_length?: number;
  wrist?: number;
  neck?: number;
  torso_length?: number;
  inseam?: number;
  outseam?: number;
  thigh?: number;
  knee?: number;
  calf?: number;
  ankle?: number;

  // Derived
  height?: number;
  weight?: number;
  shoe_size?: string;
  bra_size?: string;

  // Analysis
  body_shape?: BodyShape | null;
  posture_notes?: string;

  // Preferences
  notes?: string;
  fit_preferences: FitPreferences;

  // Versioning
  is_current: boolean;
  superseded_by?: string | null;
  created_at: string;
}

export interface FitPreferences {
  ease?: 'fitted' | 'relaxed' | 'oversized';
  length_preference?: 'short' | 'midi' | 'long';
  shoulder_fit?: 'natural' | 'dropped' | 'structured';
  waist_emphasis?: 'defined' | 'natural' | 'relaxed';
  [key: string]: string | undefined;
}

// ============================================================
// 3. EMOTIONAL INTELLIGENCE
// ============================================================

export interface EmotionalProfile {
  id: string;
  client_id: string;

  // Questionnaire
  questionnaire_responses: QuestionnaireResponses;

  // AI-Derived
  style_archetypes: StyleArchetype[];
  primary_archetype?: StyleArchetype;
  archetype_scores: Record<StyleArchetype, number>;

  // Mood
  emotional_season?: 'spring' | 'summer' | 'autumn' | 'winter' | null;
  mood_tags: string[];
  energy_level?: 'serene' | 'balanced' | 'vibrant' | 'intense' | null;

  // AI Summary
  style_summary?: string;
  advisor_notes?: string;

  // Versioning
  is_current: boolean;
  version: number;

  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponses {
  color_preferences?: string[];
  texture_preferences?: string[];
  mood_dressing?: string;
  fashion_icons?: string[];
  occasions_priority?: string[];
  comfort_vs_impact?: number; // 1-10
  minimalism_vs_maximalism?: number; // 1-10
  classic_vs_trendy?: number; // 1-10
  structured_vs_flowing?: number; // 1-10
  personal_manifesto?: string;
  [key: string]: unknown;
}

export interface PaletteColor {
  hex: string;
  name: string;
  role: 'primary' | 'accent' | 'neutral' | 'statement' | 'complement';
}

export interface ColorPalette {
  id: string;
  client_id?: string | null;
  maison_id: string;

  name: string;
  description?: string;
  colors: PaletteColor[];

  warmth: Warmth;
  season?: Season;
  is_seasonal: boolean;
  is_system: boolean;

  source: 'manual' | 'ai_generated' | 'photo_analysis' | 'questionnaire';
  source_reference?: string;

  activo: boolean;
  created_at: string;
}

// ============================================================
// 4. AI PHOTO INTELLIGENCE
// ============================================================

export interface AIAnalysis {
  id: string;
  client_id: string;
  analyzed_by?: string | null;

  image_url: string;
  image_type: ImageType;

  silhouette_data: SilhouetteData;
  color_analysis: ColorAnalysisData;
  style_analysis: StyleAnalysisData;
  recommendations: AIRecommendation[];

  ai_provider: AIProvider;
  ai_model?: string;
  confidence_score?: number;

  created_at: string;
}

export interface SilhouetteData {
  body_proportions?: { torso_ratio: number; leg_ratio: number };
  detected_shape?: BodyShape;
  shoulder_line?: 'straight' | 'sloped' | 'broad' | 'narrow';
  waist_definition?: 'defined' | 'moderate' | 'undefined';
  posture?: 'upright' | 'slightly_forward' | 'slouched';
  [key: string]: unknown;
}

export interface ColorAnalysisData {
  skin_undertone?: Warmth;
  hair_color_family?: string;
  dominant_colors?: string[];
  recommended_palette?: string;
  avoid_colors?: string[];
  [key: string]: unknown;
}

export interface StyleAnalysisData {
  current_style?: string;
  detected_brands?: string[];
  fit_assessment?: string;
  proportion_suggestions?: string[];
  [key: string]: unknown;
}

export interface AIRecommendation {
  type: 'silhouette' | 'color' | 'fabric' | 'style' | 'garment';
  suggestion: string;
  confidence: number;
  garment_ids?: string[];
}

// ============================================================
// 5. COLLECTIONS & GARMENTS
// ============================================================

export interface Collection {
  id: string;
  maison_id: string;
  designer_id?: string | null;

  name: string;
  code?: string;
  description?: string;
  season: Season;
  year: number;

  cover_image_url?: string;
  mood_board_urls: string[];
  inspiration_notes?: string;

  status: CollectionStatus;

  target_pieces?: number;
  target_revenue?: number;
  avg_price_point?: number;

  created_at: string;
  updated_at: string;
}

export interface Garment {
  id: string;
  maison_id: string;
  collection_id?: string | null;
  designer_id?: string | null;

  // Identity
  name: string;
  code?: string;
  description?: string;
  category: GarmentCategory;
  body_zone: BodyZone;

  // Design
  tech_sheet_url?: string;
  pattern_url?: string;
  images: GarmentImage[];

  // Costing
  base_cost: number;
  base_labor_hours: number;
  base_labor_cost: number;
  complexity_level: number; // 1-5

  // Pricing
  base_price?: number;
  margin_target: number;

  // Status & classification
  status: GarmentStatus;
  tags: string[];
  season?: Season;
  year?: number;

  created_at: string;
  updated_at: string;
}

export interface GarmentImage {
  url: string;
  type: 'front' | 'back' | 'side' | 'detail' | 'flat' | 'mood';
  alt?: string;
}

// ============================================================
// 6. MATERIALS
// ============================================================

export interface Material {
  id: string;
  maison_id: string;

  name: string;
  code?: string;
  description?: string;
  type: MaterialType;
  subtype?: string;

  // Sourcing
  supplier?: string;
  supplier_code?: string;
  origin_country?: string;
  lead_time_days?: number;

  // Cost
  unit_cost: number;
  unit: MaterialUnit;
  currency: string;
  min_order_qty?: number;

  // Physical
  width_cm?: number;
  weight_gsm?: number;
  composition?: string;
  care_instructions?: string;

  // Visual
  image_url?: string;
  swatch_url?: string;
  color_hex?: string;

  // Stock
  current_stock: number;
  stock_unit?: MaterialUnit;
  reorder_point?: number;

  // Classification
  season_appropriate: Season[];
  tags: string[];

  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface GarmentMaterial {
  id: string;
  garment_id: string;
  material_id: string;

  quantity: number;
  unit: MaterialUnit;
  waste_factor: number;

  unit_cost?: number;
  total_cost?: number;

  notes?: string;
  is_optional: boolean;

  created_at: string;

  // Joined
  material?: Material;
}

// ============================================================
// 7. VARIANTS
// ============================================================

export interface VariantLayerImage {
  layer: 'base' | 'color' | 'fabric' | 'detail' | 'embellishment';
  url: string;
  z_index: number;
}

export interface MaterialOverride {
  original_material_id: string;
  replacement_material_id: string;
  reason?: string;
}

export interface Variant {
  id: string;
  garment_id: string;
  client_id?: string | null;

  variant_name?: string;
  color?: string;
  color_hex?: string;
  primary_material_id?: string | null;

  material_overrides: MaterialOverride[];
  extras: Record<string, unknown>;
  // Example extras:
  // embroidery: boolean
  // embroidery_detail: string
  // length_adjustment_cm: number
  // custom_lining: boolean
  // special_buttons: string

  preview_image_url?: string;
  layer_images: VariantLayerImage[];

  // Pricing
  material_cost: number;
  labor_cost: number;
  extras_cost: number;
  total_cost: number;
  final_price: number;
  margin_actual?: number;

  // AR
  ar_model_url?: string;
  ar_enabled: boolean;

  // Status
  status: VariantStatus;
  approved_at?: string;
  approved_by?: string | null;

  created_at: string;
  updated_at: string;

  // Joined
  garment?: Garment;
  client?: CereusClient;
}

// ============================================================
// 8. AR SESSIONS
// ============================================================

export interface ARSession {
  id: string;
  client_id: string;
  variant_id: string;

  screenshot_url?: string;
  device_info: Record<string, unknown>;
  duration_seconds?: number;

  client_approved?: boolean;
  client_notes?: string;
  adjustments_requested: AdjustmentRequest[];

  created_at: string;
}

export interface AdjustmentRequest {
  area: string;
  request: string;
}

// ============================================================
// 9. WORKSHOPS
// ============================================================

export interface Workshop {
  id: string;
  maison_id: string;

  name: string;
  code?: string;
  location?: string;
  city?: string;
  country: string;

  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;

  specialties: string[];
  capacity_monthly?: number;
  avg_lead_time_days?: number;
  quality_rating?: number;

  labor_rate_hourly?: number;
  currency: string;

  activo: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 10. ORDERS
// ============================================================

export interface Payment {
  date: string;
  amount: number;
  method: 'transfer' | 'card' | 'cash' | 'other';
  reference?: string;
  notes?: string;
}

export interface Fitting {
  date: string;
  type: 'first_fitting' | 'second_fitting' | 'final_fitting' | 'adjustment';
  notes?: string;
  photos: string[];
}

export interface Order {
  id: string;
  maison_id: string;
  client_id: string;
  variant_id: string;
  workshop_id?: string | null;

  order_number: string;
  order_date: string;

  // Pricing
  total_price: number;
  deposit_amount: number;
  discount_amount: number;
  discount_reason?: string;
  final_amount: number;

  // Payment
  payment_status: PaymentStatus;
  payments: Payment[];

  // Delivery
  estimated_delivery?: string;
  actual_delivery?: string;
  delivery_address?: string;
  delivery_method: DeliveryMethod;

  // Fittings
  fittings: Fitting[];

  // Production
  status: OrderStatus;
  current_stage?: ProductionStage;
  stage_started_at?: string;

  // Notes
  client_notes?: string;
  internal_notes?: string;
  priority: OrderPriority;

  // Timestamps
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  created_at: string;
  updated_at: string;

  // Joined
  client?: CereusClient;
  variant?: Variant;
  workshop?: Workshop;
}

// ============================================================
// 11. PRODUCTION TRACKING
// ============================================================

export interface ProductionIssue {
  type: 'material_defect' | 'measurement_error' | 'machine_issue' | 'skill_gap' | 'other';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  resolved: boolean;
  resolved_at?: string;
}

export interface ProductionLog {
  id: string;
  order_id: string;
  workshop_id?: string | null;

  stage: ProductionStage;
  status: 'started' | 'in_progress' | 'completed' | 'issue' | 'skipped';

  progress_percent: number;
  estimated_hours?: number;
  actual_hours?: number;

  started_by?: string | null;
  completed_by?: string | null;
  assigned_artisan?: string;

  notes?: string;
  issues: ProductionIssue[];

  started_at: string;
  completed_at?: string;
}

export interface ProductionEvidence {
  id: string;
  order_id: string;
  production_log_id?: string | null;

  file_url: string;
  file_type: 'image' | 'video' | 'document' | 'pdf';
  file_name?: string;
  file_size?: number;

  stage?: ProductionStage;
  description?: string;
  is_quality_check: boolean;

  uploaded_by?: string | null;
  uploaded_at: string;
}

// ============================================================
// 12. QUALITY CONTROL
// ============================================================

export interface QualityCheckItem {
  item: string;
  passed: boolean;
  notes?: string;
}

export interface QualityCheck {
  id: string;
  order_id: string;
  inspector_id?: string | null;

  checklist: QualityCheckItem[];
  overall_result: QualityResult;
  score?: number;

  photos: string[];
  notes?: string;

  rework_required: boolean;
  rework_instructions?: string;
  rework_completed_at?: string;

  created_at: string;
}

// Default QC checklist template
export const DEFAULT_QC_CHECKLIST: string[] = [
  'Seam integrity and consistency',
  'Color consistency across panels',
  'Button/closure alignment',
  'Hem evenness',
  'Lining attachment and finish',
  'Zipper operation',
  'Thread trimming complete',
  'Label placement',
  'Overall silhouette accuracy',
  'Pressing and finishing quality',
];

// ============================================================
// 13. DIGITAL CLOSET
// ============================================================

export interface AlterationRecord {
  date: string;
  type: string;
  notes?: string;
  cost?: number;
}

export interface ClosetItem {
  id: string;
  client_id: string;
  order_id?: string | null;

  garment_name: string;
  category?: GarmentCategory;
  description?: string;
  source: ClosetSource;
  brand?: string;

  image_url?: string;
  images: string[];

  primary_color?: string;
  color_hex?: string;
  materials: string[];

  times_worn: number;
  last_worn?: string;
  acquired_date: string;
  condition: ItemCondition;

  occasions: string[];
  season_appropriate: Season[];
  outfit_compatible_ids: string[];

  care_instructions?: string;
  last_cleaned?: string;
  alteration_history: AlterationRecord[];

  activo: boolean;
  archived_reason?: string;

  created_at: string;
  updated_at: string;
}

// ============================================================
// 14. RECOMMENDATIONS
// ============================================================

export interface GarmentRecommendation {
  garment_id: string;
  variant_id?: string | null;
  reason: string;
  priority: number;
}

export interface OutfitRecommendation {
  name: string;
  items: string[];
  notes?: string;
}

export interface Recommendation {
  id: string;
  client_id: string;
  advisor_id?: string | null;

  occasion?: string;
  season?: Season;
  budget_range?: { min: number; max: number; currency: string };

  recommended_garments: GarmentRecommendation[];
  recommended_outfits: OutfitRecommendation[];

  ai_generated: boolean;
  ai_reasoning?: string;

  client_viewed: boolean;
  client_feedback?: string;
  client_rating?: number;

  status: RecommendationStatus;
  expires_at?: string;

  created_at: string;
}

// ============================================================
// 15. FINANCIAL
// ============================================================

export type FinancialRecordType = 'material_cost' | 'labor_cost' | 'overhead' | 'revenue' | 'adjustment';

export interface FinancialRecord {
  id: string;
  maison_id: string;
  order_id?: string | null;

  record_type: FinancialRecordType;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_usd?: number;

  category?: string;
  subcategory?: string;

  period_month?: number;
  period_year?: number;

  agave_product_id?: string | null;
  tuna_campaign_id?: string | null;

  budget_amount?: number;
  variance?: number;
  variance_percent?: number;

  notes?: string;
  created_at: string;
}

export interface MarginDeviation {
  category: string;
  reason: string;
  amount: number;
}

export interface MarginAnalysis {
  id: string;
  order_id: string;

  // Planned
  planned_material_cost?: number;
  planned_labor_cost?: number;
  planned_overhead?: number;
  planned_total_cost?: number;
  planned_price?: number;
  planned_margin?: number;

  // Actual
  actual_material_cost?: number;
  actual_labor_cost?: number;
  actual_overhead?: number;
  actual_total_cost?: number;
  actual_price?: number;
  actual_margin?: number;

  // Deviation
  cost_deviation?: number;
  cost_deviation_percent?: number;
  margin_deviation?: number;

  deviation_reasons: MarginDeviation[];
  recommendations?: string;

  analyzed_at: string;
}

// ============================================================
// 16. NOTIFICATIONS
// ============================================================

export interface CereusNotification {
  id: string;
  maison_id: string;
  recipient_id: string;

  title: string;
  message: string;
  type: NotificationType;

  entity_type?: string;
  entity_id?: string;
  action_url?: string;

  channel: NotificationChannel;
  sent_at?: string;
  delivered_at?: string;

  read: boolean;
  read_at?: string;
  archived: boolean;

  created_at: string;
}

// ============================================================
// 17. AUDIT LOG
// ============================================================

export interface AuditLogEntry {
  id: string;
  maison_id: string;
  user_id?: string | null;

  action: AuditAction;
  entity_type: string;
  entity_id: string;

  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  description?: string;

  ip_address?: string;
  user_agent?: string;

  created_at: string;
}

// ============================================================
// 18. MAISON CONFIG (stored in app_clients.config)
// ============================================================

export interface MaisonConfig {
  maison_name: string;
  maison_tagline?: string;
  default_currency: string;
  default_language: string;
  margin_config: {
    min: number;
    target: number;
    premium: number;
  };
  ar_enabled: boolean;
  ai_photo_enabled: boolean;
  production_tracking: boolean;
  branding: {
    logo_url?: string;
    primary_color: string;
    accent_color: string;
  };
}

// ============================================================
// 19. DASHBOARD / VIEW MODELS
// ============================================================

export interface CereusDashboardKPIs {
  // Clients
  total_clients: number;
  active_clients: number;
  vip_clients: number;
  new_clients_this_month: number;

  // Orders
  total_orders: number;
  active_orders: number;
  orders_in_production: number;
  orders_delivered_this_month: number;
  avg_order_value: number;

  // Production
  avg_production_days: number;
  quality_pass_rate: number;
  on_time_delivery_rate: number;

  // Financial
  revenue_this_month: number;
  revenue_this_year: number;
  avg_margin: number;
  total_materials_value: number;
}

export interface ClientFullProfile {
  client: CereusClient;
  current_measurements?: BodyMeasurement;
  emotional_profile?: EmotionalProfile;
  color_palette?: ColorPalette;
  closet_items: ClosetItem[];
  active_orders: Order[];
  recommendations: Recommendation[];
  ai_analyses: AIAnalysis[];
}

export interface OrderFullView {
  order: Order;
  client: CereusClient;
  variant: Variant;
  garment: Garment;
  workshop?: Workshop;
  production_log: ProductionLog[];
  evidence: ProductionEvidence[];
  quality_checks: QualityCheck[];
  margin_analysis?: MarginAnalysis;
}

// ============================================================
// 20. CEREUS APP STATE
// ============================================================

export interface CereusState {
  // Current user context
  maison_id: string | null;
  user_role: CereusClientRole | null;

  // Active views
  active_client?: ClientFullProfile;
  active_order?: OrderFullView;

  // Lists
  clients: CereusClient[];
  orders: Order[];
  garments: Garment[];
  collections: Collection[];
  materials: Material[];
  workshops: Workshop[];

  // Dashboard
  kpis: CereusDashboardKPIs | null;
  notifications: CereusNotification[];

  // UI
  is_loading: boolean;
  last_sync: string | null;
}
