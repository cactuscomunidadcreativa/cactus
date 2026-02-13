# CEREUS x PRIVAT — PRD v2 Complete
## Digital Atelier Operating System
### Integrated Whitepaper + Technical PRD + Database Architecture + Roadmap

---

## 1. Product Vision

**CEREUS x PRIVAT** is the first Emotional Algorithmic Atelier in Latin America. It integrates
AI-powered design, emotional intelligence, biometric archives, augmented reality fitting, automated
costing, workshop tracking, and digital wardrobe history into a single high-fashion operating system.

Built as a sub-app (`cereus`) within **Cactus Comunidad Creativa**, deployed on Vercel with Supabase
backend infrastructure.

### Core Pillars
1. **Emotional Style Intelligence** — AI-driven questionnaire + archetype mapping
2. **Digital Body Archive** — Versioned measurements with body shape analysis
3. **AI Photo Intelligence** — Silhouette, color, and style analysis from photos
4. **AR Mirror Protocol** — Virtual try-on for garment variants
5. **Costing Engine** — BOM-based cost calculation with Agave margin integration
6. **Production Tracking (Saguaro)** — Workshop-level stage tracking with evidence
7. **Digital Closet & Fashion Advisor** — Wardrobe management + AI outfit recommendations
8. **Financial Sync** — Margin analysis with Tuna/Agave data flow
9. **Quality Control** — Checklist-based QC with evidence photography
10. **Notification System** — Multi-channel alerts (in-app, WhatsApp, email)

---

## 2. Architecture Overview

### 2.1 Stack
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime)
- **AI**: Claude (Anthropic) for photo analysis + style generation
- **Hosting**: Vercel (auto-deploy on push to `main`)
- **File Storage**: Supabase Storage (client photos, tech sheets, production evidence, AR models)

### 2.2 Cactus Integration
```
src/
├── app/(platform)/apps/cereus/     # CEREUS routes
├── modules/cereus/                  # CEREUS module
│   ├── components/                  # React components
│   ├── hooks/                       # Custom hooks
│   ├── lib/                         # Business logic
│   │   ├── costing-engine.ts        # BOM + pricing calculations
│   │   ├── emotional-questionnaire.ts # Questionnaire + scoring
│   │   └── ai-prompts.ts           # AI prompt templates
│   ├── types/                       # TypeScript types
│   │   └── index.ts                 # All type definitions
│   └── index.ts                     # Public API
└── supabase/migrations/
    └── 017_cereus.sql               # Complete database schema
```

### 2.3 Multi-tenancy
CEREUS reuses the existing `app_clients` system (migration `013`).
Each fashion house (Maison) is an `app_client` with `app_id = 'cereus'`.
Users access via `app_client_users` with roles: `admin`, `advisor`, `workshop`, `client`.

### 2.4 Integration Points

| Integration | Direction | Data Flow |
|---|---|---|
| **Agave** (Pricing) | CEREUS → Agave | Garment costs → margin classification using Agave's engine |
| **Tuna** (Financial) | CEREUS ↔ Tuna | Material costs → budget tracking, margin deviation analysis |
| **WeekFlow/Saguaro** | Pattern reuse | Production tracking pattern adapted for workshop stages |
| **Ramona** (Social) | CEREUS → Ramona | Collection launches → social media campaign generation |
| **Supabase Auth** | Shared | Single auth system, roles per app via `app_client_users` |

---

## 3. Database Architecture

### 3.1 Complete Table Map (22 tables)

| # | Table | Purpose | Key FKs |
|---|---|---|---|
| 1 | `cereus_clients` | Fashion clients of the Maison | → app_clients, → auth.users |
| 2 | `cereus_body_measurements` | Versioned body measurements | → cereus_clients |
| 3 | `cereus_emotional_profiles` | Questionnaire responses + AI analysis | → cereus_clients |
| 4 | `cereus_color_palettes` | Curated/AI-generated color palettes | → cereus_clients, → app_clients |
| 5 | `cereus_ai_analyses` | AI photo analysis results | → cereus_clients |
| 6 | `cereus_collections` | Fashion collections (seasonal) | → app_clients |
| 7 | `cereus_garments` | Base garment designs | → app_clients, → cereus_collections |
| 8 | `cereus_materials` | Material vault/catalog | → app_clients |
| 9 | `cereus_garment_materials` | Bill of Materials (BOM) | → cereus_garments, → cereus_materials |
| 10 | `cereus_variants` | Customized garment versions | → cereus_garments, → cereus_clients |
| 11 | `cereus_ar_sessions` | AR try-on session data | → cereus_clients, → cereus_variants |
| 12 | `cereus_workshops` | Production partners | → app_clients |
| 13 | `cereus_orders` | Client orders | → app_clients, → cereus_clients, → cereus_variants |
| 14 | `cereus_production_log` | Stage-by-stage production tracking | → cereus_orders |
| 15 | `cereus_production_evidence` | Photos/docs from production | → cereus_orders |
| 16 | `cereus_quality_checks` | QC checklists and results | → cereus_orders |
| 17 | `cereus_closet_items` | Digital wardrobe | → cereus_clients, → cereus_orders |
| 18 | `cereus_recommendations` | AI/advisor outfit recommendations | → cereus_clients |
| 19 | `cereus_financial_records` | Revenue, costs, budget tracking | → app_clients, → cereus_orders |
| 20 | `cereus_margin_analysis` | Post-delivery margin analysis | → cereus_orders |
| 21 | `cereus_notifications` | Multi-channel notifications | → app_clients, → auth.users |
| 22 | `cereus_audit_log` | Complete audit trail | → app_clients, → auth.users |

### 3.2 Enum Types (14)
`cereus_client_role`, `cereus_garment_status`, `cereus_order_status`, `cereus_payment_status`,
`cereus_body_zone`, `cereus_garment_category`, `cereus_material_type`, `cereus_material_unit`,
`cereus_season`, `cereus_style_archetype`, `cereus_warmth`, `cereus_closet_source`,
`cereus_production_stage`, `cereus_audit_action`

### 3.3 Helper Functions (4)
- `user_belongs_to_cereus_maison(maison_id)` — RLS helper
- `get_user_cereus_maison()` — Get user's maison ID
- `get_user_cereus_role()` — Get user's role
- `calculate_cereus_garment_cost(garment_id)` — BOM cost calculation
- `generate_cereus_order_number(maison_id)` — Auto-increment order numbers

### 3.4 Storage Buckets (6)
- `cereus-client-photos` — Client photos (private, 10MB max)
- `cereus-garment-images` — Garment design images (private, 15MB max)
- `cereus-tech-sheets` — Technical drawings/PDFs (private, 20MB max)
- `cereus-production-evidence` — Workshop photos/videos (private, 20MB max)
- `cereus-ar-models` — 3D models for AR (private, 50MB max)
- `cereus-material-swatches` — Fabric/material samples (private, 5MB max)

---

## 4. System Flows (Complete)

### 4.1 Client Onboarding Flow
```
1. Advisor creates client in CEREUS dashboard
2. Client record created with basic info (cereus_clients)
3. Body measurement session scheduled
4. Measurements taken and recorded (cereus_body_measurements, is_current=true)
5. Emotional questionnaire sent (link or in-person)
6. Client completes questionnaire
7. Archetype scores calculated automatically
8. AI generates style narrative
9. Advisor reviews and adds notes
10. Color palette generated (AI or manual)
11. Optional: Client uploads photo for AI analysis
12. Digital closet initialized (empty or with existing pieces)
13. Client profile marked as complete → ready for recommendations
```

### 4.2 Garment Creation Flow
```
1. Designer creates Collection (season, year, concept)
2. Garment base record created (category, complexity, description)
3. Tech sheet and pattern uploaded to storage
4. BOM defined: materials selected with quantities + waste factors
5. Cost automatically calculated from BOM
6. Labor hours estimated based on complexity
7. Total cost = materials + labor + overhead (12%)
8. Pricing calculated using Agave-style margin ranges
9. Garment status → 'approved' when ready
10. Variant Generator creates color/fabric variations
11. Each variant gets independent pricing
12. AR model uploaded (optional, Phase 3)
```

### 4.3 Order Flow
```
1. Advisor selects garment variant for client
2. Client reviews (optionally via AR)
3. Price confirmed, extras added (embroidery, adjustments)
4. Order created with auto-generated number (PV-2025-001)
5. Deposit recorded in payments JSONB
6. Workshop assigned based on specialties + capacity
7. Status: pending → confirmed → [production stages]
8. Production tracking begins (see 4.4)
9. Fittings scheduled and recorded
10. Final fitting approved
11. Quality check performed (see 4.5)
12. Order marked 'ready' → 'delivered'
13. Closet item auto-created for client
14. Margin analysis generated (planned vs actual)
15. Notifications sent at each major status change
```

### 4.4 Production Flow (Saguaro-style)
```
For each stage (pattern → cutting → sewing → embroidery → finishing → pressing → QC → packaging):
1. Workshop starts stage → production_log entry created
2. Progress updated (0-100%)
3. Photos uploaded as production_evidence
4. Issues logged in JSONB if problems arise
5. Stage completed → next stage begins
6. Actual hours tracked vs estimated
7. Workshop uploads completion evidence
8. Advisor can monitor in real-time dashboard
```

### 4.5 Quality Control Flow
```
1. Order reaches 'quality_check' stage
2. Inspector creates QC record
3. Checklist items evaluated (10-point default template):
   - Seam integrity
   - Color consistency
   - Button/closure alignment
   - Hem evenness
   - Lining attachment
   - Zipper operation
   - Thread trimming
   - Label placement
   - Silhouette accuracy
   - Pressing quality
4. Photos taken of each check point
5. Overall score calculated (0-10)
6. Result: passed / passed_with_notes / failed / rework_required
7. If rework: instructions sent back to workshop
8. Rework completed → re-inspection
```

### 4.6 AI + AR Flow
```
1. Client uploads full-body photo
2. AI analyzes (Claude Vision):
   - Silhouette: proportions, shape, shoulder line, waist
   - Color: skin undertone, hair family, dominant colors
   - Style: current aesthetic, fit assessment
3. Recommendations generated with confidence scores
4. Advisor reviews and adjusts recommendations
5. Client selects garment for AR try-on
6. AR module loads variant 3D model / layered composites
7. Client views on device (tablet/phone)
8. Adjustments requested (hem, neckline, etc.)
9. Approved configuration saved as final variant
10. Proceeds to order creation
```

### 4.7 Financial Sync Flow
```
1. Material costs captured from BOM at order creation (planned)
2. Actual costs tracked during production
3. Margin range classification via Agave engine formulas:
   - Critical (<15%) → Very Low → Low → Acceptable → Good → Very Good → Excellent → Luxury (>75%)
4. Post-delivery margin analysis:
   - Planned vs actual material cost
   - Planned vs actual labor
   - Cost deviation amount and percentage
   - Margin deviation
5. Deviation reasons identified and categorized
6. Recommendations auto-generated
7. Financial records synced with period (month/year) for reporting
8. Optional: sync with Tuna for broader campaign-level analysis
```

### 4.8 Digital Closet Flow
```
1. Order delivered → closet item auto-created (source: 'order')
2. Client can add external items (source: 'external', 'gift', 'sample')
3. Each item tracks: category, color, materials, condition
4. Wear tracking: times_worn, last_worn (manual or future NFC)
5. Outfit compatibility mapped (which items pair well)
6. AI Fashion Advisor analyzes closet:
   - Identifies gaps (e.g., "no evening coat")
   - Suggests outfit combinations
   - Recommends acquisitions from current collection
7. Seasonal recommendations based on upcoming occasions
8. Alteration history tracked per item
```

---

## 5. Roles & Permissions

| Action | Client | Advisor | Workshop | Admin |
|---|---|---|---|---|
| View own profile | ✅ | — | — | ✅ |
| View client profiles | — | ✅ (assigned) | — | ✅ (all) |
| Create/edit clients | — | ✅ | — | ✅ |
| Take measurements | — | ✅ | — | ✅ |
| Run emotional questionnaire | ✅ (own) | ✅ | — | ✅ |
| Upload photos for AI | ✅ (own) | ✅ | — | ✅ |
| View collections/garments | ✅ (published) | ✅ | ✅ (assigned) | ✅ |
| Create/edit garments | — | ✅ | — | ✅ |
| Manage materials | — | — | — | ✅ |
| Create orders | — | ✅ | — | ✅ |
| Update production status | — | ✅ | ✅ (assigned) | ✅ |
| Upload production evidence | — | — | ✅ | ✅ |
| Run quality checks | — | ✅ | — | ✅ |
| View own closet | ✅ | ✅ (client's) | — | ✅ |
| View financials | — | — | — | ✅ |
| View audit log | — | — | — | ✅ |
| Manage workshops | — | — | — | ✅ |
| Manage notifications | — | ✅ (send) | — | ✅ |

---

## 6. Emotional Questionnaire Specification

### 6.1 Questions (10)

1. **Color World** (multi-select 3-5): 12 color options with archetype weights
2. **Texture Realm** (multi-select 2-3): 10 texture options with archetype weights
3. **Fashion Icons** (free text): Style inspiration references
4. **Occasion Priority** (ranking): 6 occasions ranked by importance
5. **Comfort vs Impact** (slider 1-10)
6. **Minimalism vs Maximalism** (slider 1-10)
7. **Classic vs Avant-garde** (slider 1-10)
8. **Structured vs Flowing** (slider 1-10)
9. **Mood Dressing** (single select): 8 emotional states
10. **Personal Manifesto** (free text): "When I get dressed, I want the world to see..."

### 6.2 Scoring Algorithm
- Each option carries archetype weights (0.1 - 0.5)
- Multi-select: sum weights of selected options
- Single-select: 1.5x weight multiplier
- Ranking: decreasing weight by position (1.0, 0.85, 0.70, 0.55, 0.40, 0.25)
- Sliders: threshold-based scoring (>7 or <4 triggers archetype boosts)
- Final scores normalized to 0-1 range
- Top 3 archetypes selected

### 6.3 Eight Style Archetypes
1. **Classic Elegance** — Timeless sophistication, refined details
2. **Modern Minimalist** — Clean lines, monochrome, architectural simplicity
3. **Romantic Dreamer** — Soft fabrics, flowing shapes, feminine details
4. **Bold Avant-Garde** — Experimental, statement pieces, boundary-pushing
5. **Bohemian Free Spirit** — Relaxed luxury, natural textures, effortless
6. **Power Executive** — Authority dressing, sharp tailoring, commanding
7. **Ethereal Goddess** — Draped fabrics, celestial palettes, otherworldly
8. **Structured Architectural** — Geometric shapes, sculptural forms

---

## 7. Costing Engine Specification

### 7.1 Cost Calculation
```
Material Cost = Σ (quantity × unit_cost × waste_factor) for all BOM items
Labor Cost = base_labor_hours × complexity_multiplier × hourly_rate
Overhead = (Material + Labor + Extras) × 12%
Total Cost = Material + Labor + Extras + Overhead
```

### 7.2 Complexity Multipliers
| Level | Description | Multiplier |
|---|---|---|
| 1 | Simple (basic shift dress) | 1.0x |
| 2 | Moderate (lined dress, zipper) | 1.25x |
| 3 | Complex (tailored suit) | 1.50x |
| 4 | Very Complex (gown with beading) | 2.0x |
| 5 | Extreme (haute couture handwork) | 3.0x |

### 7.3 Margin Ranges (Haute Couture)
| Category | Min Margin | Max Margin | Color |
|---|---|---|---|
| Critical | 0% | 15% | Red |
| Very Low | 15% | 25% | Orange |
| Low | 25% | 35% | Yellow |
| Acceptable | 35% | 45% | Light Green |
| Good | 45% | 55% | Green |
| Very Good | 55% | 65% | Teal |
| Excellent | 65% | 75% | Blue |
| Luxury | 75%+ | 100% | Purple |

### 7.4 Price Formula
```
Price = Cost / (1 - Margin)
Margin = (Price - Cost) / Price
```
Same formulas as Agave, but with haute couture margin ranges (higher than commercial).

---

## 8. Brand Identity

### 8.1 Color Palette
| Token | HSL | Hex | Usage |
|---|---|---|---|
| cereus-noir | 0 0% 4% | #0A0A0A | Primary background |
| cereus-noir-light | 0 0% 12% | #1F1F1F | Card backgrounds |
| cereus-gold | 42 60% 45% | #B8943A | Primary accent |
| cereus-gold-light | 42 65% 58% | #D4B04E | Hover states |
| cereus-ivory | 40 30% 92% | #F0EBE0 | Light mode bg |
| cereus-bordeaux | 345 60% 25% | #6B1D34 | Statement/warning |
| cereus-charcoal | 0 0% 22% | #383838 | Secondary text |
| cereus-cream | 40 25% 96% | #F7F5F0 | Light surfaces |

### 8.2 Typography
- **Body**: Inter (shared with Cactus platform)
- **Display/Headings**: Space Grotesk (shared)
- **Editorial/Luxury**: Playfair Display (shared with PITA)

### 8.3 Design Principles
- Dark-mode dominant aesthetic
- Minimal UI chrome — content takes center stage
- Gold accents for interactive elements and CTAs
- Photography-first layouts for garments and clients
- Elegant reveal animations (no bouncy/playful)
- Editorial grid system for collections

---

## 9. Development Roadmap

### Phase 0 — Pre-Foundation (2 weeks) ✅ DONE
- [x] Complete database schema (017_cereus.sql — 22 tables, 14 enums, RLS)
- [x] TypeScript type system (all models, enums, view models)
- [x] Costing engine (BOM calculation, pricing, margin analysis)
- [x] Emotional questionnaire engine (scoring, archetypes, seasons)
- [x] AI prompt templates (photo analysis, style profiles, advisor)
- [x] Brand identity (colors in globals.css, Tailwind config)
- [x] Module structure (following PITA/Agave/Tuna patterns)

### Phase 1 — Foundation (Months 1-2)
- [ ] Supabase migration deployment
- [ ] Client CRUD (create, list, detail, edit)
- [ ] Body measurement form with versioning
- [ ] Basic garment catalog (CRUD + images)
- [ ] Material vault (CRUD + stock tracking)
- [ ] BOM builder (garment ↔ material assignment)
- [ ] Manual costing with auto-calculation
- [ ] Order creation flow (basic)
- [ ] Workshop management
- [ ] Dashboard shell (dark-mode editorial layout)

### Phase 2 — Intelligence Layer (Months 3-4)
- [ ] Emotional questionnaire UI (all 10 questions)
- [ ] Archetype scoring + visualization
- [ ] AI photo analysis integration (Claude Vision)
- [ ] Color palette generation (AI + manual)
- [ ] Style profile narrative generation
- [ ] Automated pricing via costing engine
- [ ] Variant generator (color/fabric selection)
- [ ] Fashion advisor recommendations
- [ ] Notification system (in-app)

### Phase 3 — Production & AR (Months 5-6)
- [ ] Production tracking board (Kanban-style)
- [ ] Workshop mobile-optimized views
- [ ] Evidence upload pipeline
- [ ] Quality control checklist system
- [ ] AR try-on module (WebXR or Three.js)
- [ ] Real-time order status updates
- [ ] Client self-service portal (order status, closet)
- [ ] WhatsApp notifications (via Twilio, shared with Ramona)

### Phase 4 — Financial & Analytics (Month 7-8)
- [ ] Post-delivery margin analysis dashboard
- [ ] Planned vs actual cost comparison
- [ ] Revenue reporting by collection/season/client
- [ ] Digital closet management UI
- [ ] Closet analysis AI
- [ ] Client VIP tier automation
- [ ] Financial sync with Tuna (optional)

### Phase 5 — Optimization & Scale (Month 9+)
- [ ] Multi-brand/multi-maison SaaS preparation
- [ ] Campaign sync with Ramona (collection launches → social posts)
- [ ] Advanced analytics (client lifetime value, production efficiency)
- [ ] PDF export (tech sheets, order confirmations, invoices)
- [ ] Audit log viewer
- [ ] Backup & disaster recovery
- [ ] Performance optimization & caching

---

## 10. Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/017_cereus.sql` | Complete DB schema (22 tables, 14 enums, 5 functions, full RLS) |
| `src/modules/cereus/types/index.ts` | All TypeScript interfaces, types, enums, constants |
| `src/modules/cereus/lib/costing-engine.ts` | BOM calculation, pricing, margin analysis |
| `src/modules/cereus/lib/emotional-questionnaire.ts` | Questionnaire structure, scoring, archetype mapping |
| `src/modules/cereus/lib/ai-prompts.ts` | AI prompt templates for photo, style, advisor, closet |
| `src/modules/cereus/index.ts` | Module public API |
| `src/app/globals.css` | CEREUS brand colors + animations added |
| `tailwind.config.ts` | CEREUS color tokens added |
| `docs/CEREUS_PRD_V2.md` | This document |

---

## 11. Key Decisions & Rationale

1. **Reuse `app_clients` instead of custom auth**: Consistent with Cactus multi-tenant pattern. No duplicate auth logic.

2. **JSONB for flexible fields** (questionnaire_responses, payments, fittings, extras): Fashion is inherently flexible — every garment is unique. Rigid schemas would require constant migrations.

3. **Versioned measurements** (is_current + superseded_by): Bodies change. We need history without losing the "active" measurement set.

4. **Agave-compatible margin formulas**: Same Price = Cost / (1 - Margin) formula, but with higher margin ranges for haute couture (35-75% vs Agave's 10-45%).

5. **Production log as separate table** (not JSONB on orders): Each stage needs its own timestamps, evidence, issues. A JSONB field would make querying and reporting impossible.

6. **Separate financial_records table**: Decoupled from orders for aggregation and period-based reporting. Enables Tuna-style budget vs actual analysis.

7. **Dark-mode dominant**: CEREUS is a luxury fashion brand. The UI should feel like a fashion editorial, not a SaaS dashboard.

8. **AI provider abstraction**: Using prompt templates that work with both Claude and OpenAI. The AI provider can be swapped without changing business logic.
