import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Generate a fashion sketch using DALL-E or enhanced SVG fallback.
 * POST body: { template, fabric, colors, collectionName, style, maisonId }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { template, fabric, colors, collectionName, style, maisonId } = body;

  if (!template) {
    return NextResponse.json({ error: 'template required' }, { status: 400 });
  }

  // Try to get OpenAI key from maison config in Supabase
  let openaiKey = process.env.OPENAI_API_KEY || '';

  if (!openaiKey && maisonId) {
    try {
      const db = createServiceClient();
      if (db) {
        const { data } = await db
          .from('app_clients')
          .select('config')
          .eq('id', maisonId)
          .single();
        openaiKey = (data?.config as any)?.api_keys?.openai || '';
      }
    } catch {
      // continue without key
    }
  }

  // Also try from auth user's maison
  if (!openaiKey) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const db = createServiceClient();
          if (db) {
            // Check super_admin
            const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
            if (profile?.role === 'super_admin') {
              const { data: maisons } = await db.from('app_clients').select('config').eq('app_id', 'cereus').eq('activo', true).limit(1);
              openaiKey = (maisons?.[0]?.config as any)?.api_keys?.openai || '';
            } else {
              const { data: assignments } = await db.from('app_client_users').select('client:app_clients(config)').eq('user_id', user.id).eq('activo', true);
              const cereusAssignment = assignments?.find((a: any) => a.client?.app_id === 'cereus');
              openaiKey = (cereusAssignment?.client as any)?.config?.api_keys?.openai || '';
            }
          }
        }
      }
    } catch {
      // continue
    }
  }

  const garmentNames: Record<string, string> = {
    dress: 'elegant dress',
    blouse: 'blouse',
    skirt: 'A-line skirt',
    pants: 'tailored pants',
    jacket: 'structured jacket',
    top: 'crop top',
  };

  const garmentName = garmentNames[template] || 'garment';
  const fabricName = fabric || 'silk';
  const colorDesc = (colors || []).length > 0
    ? `in ${colors.join(' and ')} tones`
    : 'in neutral tones';

  if (openaiKey) {
    try {
      const prompt = `Fashion design sketch of a ${garmentName} made of ${fabricName} ${colorDesc}. ${
        collectionName ? `Part of the "${collectionName}" collection.` : ''
      } Style: haute couture pencil sketch on white paper, minimal lines, fashion illustration, elegant proportions, no background, technical fashion drawing with light watercolor accents.`;

      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        }),
      });

      const data = await res.json();

      if (data.data?.[0]?.url) {
        return NextResponse.json({
          imageUrl: data.data[0].url,
          prompt,
          source: 'dall-e',
        });
      }
    } catch {
      // Fall through to SVG
    }
  }

  // Enhanced SVG Fallback
  const svgSketch = generateEnhancedSVGSketch(template, colors || ['#0A0A0A', '#B8943A'], fabricName);

  return NextResponse.json({
    svgData: svgSketch,
    source: 'svg-fallback',
    message: openaiKey
      ? 'DALL-E fallo, se uso boceto SVG'
      : 'Boceto SVG generado. Configura OpenAI API Key en el dashboard para bocetos con IA.',
  });
}

// ─── Enhanced SVG Fashion Sketch Generator ──────────────────

function generateEnhancedSVGSketch(template: string, colors: string[], fabric: string): string {
  const primary = colors[0] || '#1a1a1a';
  const accent = colors[1] || '#B8943A';
  const tertiary = colors[2] || '#666666';

  // Fabric-specific pattern definitions
  const fabricPatterns: Record<string, string> = {
    silk: `
      <pattern id="tex" width="30" height="30" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="30" y2="30" stroke="${accent}" stroke-width="0.3" opacity="0.12"/>
        <line x1="15" y1="0" x2="30" y2="15" stroke="${accent}" stroke-width="0.2" opacity="0.08"/>
        <line x1="0" y1="15" x2="15" y2="30" stroke="${accent}" stroke-width="0.2" opacity="0.08"/>
      </pattern>`,
    seda: `
      <pattern id="tex" width="30" height="30" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="30" y2="30" stroke="${accent}" stroke-width="0.3" opacity="0.12"/>
        <line x1="15" y1="0" x2="30" y2="15" stroke="${accent}" stroke-width="0.2" opacity="0.08"/>
      </pattern>`,
    velvet: `
      <pattern id="tex" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.5" fill="${accent}" opacity="0.06"/>
        <circle cx="0" cy="0" r="1" fill="${accent}" opacity="0.04"/>
        <circle cx="6" cy="6" r="1" fill="${accent}" opacity="0.04"/>
      </pattern>`,
    terciopelo: `
      <pattern id="tex" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1.5" fill="${accent}" opacity="0.06"/>
      </pattern>`,
    linen: `
      <pattern id="tex" width="10" height="10" patternUnits="userSpaceOnUse">
        <line x1="0" y1="5" x2="10" y2="5" stroke="${accent}" stroke-width="0.3" opacity="0.08"/>
        <line x1="5" y1="0" x2="5" y2="10" stroke="${accent}" stroke-width="0.3" opacity="0.08"/>
      </pattern>`,
    lino: `
      <pattern id="tex" width="10" height="10" patternUnits="userSpaceOnUse">
        <line x1="0" y1="5" x2="10" y2="5" stroke="${accent}" stroke-width="0.3" opacity="0.08"/>
        <line x1="5" y1="0" x2="5" y2="10" stroke="${accent}" stroke-width="0.3" opacity="0.08"/>
      </pattern>`,
    chiffon: `
      <pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,10 Q5,5 10,10 Q15,15 20,10" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.06"/>
      </pattern>`,
    lace: `
      <pattern id="tex" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="6" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.1"/>
        <circle cx="0" cy="0" r="3" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.08"/>
        <circle cx="16" cy="16" r="3" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.08"/>
      </pattern>`,
    encaje: `
      <pattern id="tex" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="6" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.1"/>
        <circle cx="0" cy="0" r="3" stroke="${accent}" stroke-width="0.2" fill="none" opacity="0.08"/>
      </pattern>`,
    denim: `
      <pattern id="tex" width="4" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="4" y2="4" stroke="${accent}" stroke-width="0.4" opacity="0.1"/>
        <line x1="2" y1="0" x2="4" y2="2" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
      </pattern>`,
    leather: `
      <pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,10 C5,8 8,12 10,10 C12,8 15,12 20,10" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.06"/>
      </pattern>`,
    cuero: `
      <pattern id="tex" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,10 C5,8 8,12 10,10 C12,8 15,12 20,10" stroke="${accent}" stroke-width="0.3" fill="none" opacity="0.06"/>
      </pattern>`,
    taffeta: `
      <pattern id="tex" width="15" height="15" patternUnits="userSpaceOnUse">
        <line x1="0" y1="7.5" x2="15" y2="7.5" stroke="${accent}" stroke-width="0.15" opacity="0.08"/>
      </pattern>`,
    organza: `
      <pattern id="tex" width="25" height="25" patternUnits="userSpaceOnUse">
        <path d="M0,12.5 Q12.5,8 25,12.5" stroke="${accent}" stroke-width="0.15" fill="none" opacity="0.05"/>
      </pattern>`,
    cotton: `
      <pattern id="tex" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
        <line x1="4" y1="0" x2="4" y2="8" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
      </pattern>`,
    algodon: `
      <pattern id="tex" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
        <line x1="4" y1="0" x2="4" y2="8" stroke="${accent}" stroke-width="0.2" opacity="0.06"/>
      </pattern>`,
  };

  const fabricKey = fabric.toLowerCase().replace(/\s+/g, '');
  const patternDef = fabricPatterns[fabricKey] || fabricPatterns.silk || '';

  // Enhanced garment silhouettes with fashion figure
  const figureHead = `
    <!-- Fashion figure head -->
    <ellipse cx="200" cy="42" rx="11" ry="14" stroke="${primary}" stroke-width="0.8" fill="none" opacity="0.3"/>
    <path d="M195,28 Q200,22 205,28" stroke="${primary}" stroke-width="0.6" fill="none" opacity="0.2"/>
    <!-- Neck -->
    <line x1="200" y1="56" x2="200" y2="68" stroke="${primary}" stroke-width="0.6" opacity="0.3"/>
  `;

  const figureLeg = (yStart: number) => `
    <!-- Legs -->
    <line x1="185" y1="${yStart}" x2="178" y2="${yStart + 130}" stroke="${primary}" stroke-width="0.8" opacity="0.25"/>
    <line x1="215" y1="${yStart}" x2="222" y2="${yStart + 130}" stroke="${primary}" stroke-width="0.8" opacity="0.25"/>
    <!-- Feet -->
    <path d="M178,${yStart + 130} L168,${yStart + 135}" stroke="${primary}" stroke-width="0.8" opacity="0.2"/>
    <path d="M222,${yStart + 130} L232,${yStart + 135}" stroke="${primary}" stroke-width="0.8" opacity="0.2"/>
  `;

  const figureArm = (side: 'left' | 'right', yStart: number) => {
    const x = side === 'left' ? -1 : 1;
    return `
    <path d="M${200 + x * 38},${yStart} Q${200 + x * 55},${yStart + 40} ${200 + x * 50},${yStart + 80}"
      stroke="${primary}" stroke-width="0.7" fill="none" opacity="0.25"/>
    <path d="M${200 + x * 50},${yStart + 80} L${200 + x * 48},${yStart + 95}"
      stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.2"/>
    `;
  };

  const silhouettes: Record<string, { garment: string; legStart: number; hasArms: boolean; armStart: number }> = {
    dress: {
      garment: `
        <!-- Dress body -->
        <path d="M200,68 C175,68 158,82 155,105 L152,140 C148,200 138,280 122,380 Q120,395 125,400 L275,400 Q280,395 278,380 C262,280 252,200 248,140 L245,105 C242,82 225,68 200,68 Z"
          stroke="${primary}" stroke-width="1.5" fill="url(#tex)" opacity="0.9"/>
        <!-- Second stroke for sketch feel -->
        <path d="M200,68 C175,68 158,82 155,105 L152,140 C148,200 138,280 122,380 Q120,395 125,400 L275,400 Q280,395 278,380 C262,280 252,200 248,140 L245,105 C242,82 225,68 200,68 Z"
          stroke="${primary}" stroke-width="0.5" fill="none" stroke-dasharray="6,3" opacity="0.3" transform="translate(1,0.5)"/>
        <!-- Neckline -->
        <path d="M170,78 Q200,95 230,78" stroke="${primary}" stroke-width="1.2" fill="none"/>
        <!-- Waist seam -->
        <path d="M162,180 Q200,190 238,180" stroke="${accent}" stroke-width="0.8" fill="none" stroke-dasharray="4,3" opacity="0.5"/>
        <!-- Drape lines -->
        <path d="M175,200 Q180,280 160,380" stroke="${primary}" stroke-width="0.4" fill="none" opacity="0.2"/>
        <path d="M225,200 Q220,280 240,380" stroke="${primary}" stroke-width="0.4" fill="none" opacity="0.2"/>
        <path d="M200,190 L200,390" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.15"/>
        <!-- Hem detail -->
        <path d="M125,398 Q200,408 275,398" stroke="${accent}" stroke-width="0.6" fill="none" opacity="0.4"/>
      `,
      legStart: 400,
      hasArms: true,
      armStart: 90,
    },
    blouse: {
      garment: `
        <!-- Blouse body -->
        <path d="M200,68 C175,68 158,80 152,100 L138,130 Q132,142 140,148 L155,155 L150,255 Q150,265 160,265 L240,265 Q250,265 250,255 L245,155 L260,148 Q268,142 262,130 L248,100 C242,80 225,68 200,68 Z"
          stroke="${primary}" stroke-width="1.5" fill="url(#tex)" opacity="0.9"/>
        <path d="M200,68 C175,68 158,80 152,100 L138,130 Q132,142 140,148 L155,155 L150,255 Q150,265 160,265 L240,265 Q250,265 250,255 L245,155 L260,148 Q268,142 262,130 L248,100 C242,80 225,68 200,68 Z"
          stroke="${primary}" stroke-width="0.5" fill="none" stroke-dasharray="5,3" opacity="0.3" transform="translate(0.8,0.5)"/>
        <!-- Collar -->
        <path d="M175,74 Q200,88 225,74" stroke="${primary}" stroke-width="1.2" fill="none"/>
        <path d="M170,76 L185,95 L200,80 L215,95 L230,76" stroke="${accent}" stroke-width="0.8" fill="none" opacity="0.5"/>
        <!-- Sleeves puff detail -->
        <path d="M152,100 Q140,108 138,130" stroke="${primary}" stroke-width="0.6" fill="none" opacity="0.4"/>
        <path d="M248,100 Q260,108 262,130" stroke="${primary}" stroke-width="0.6" fill="none" opacity="0.4"/>
        <!-- Button line -->
        ${[110, 140, 170, 200, 230].map(y => `<circle cx="200" cy="${y}" r="2" stroke="${accent}" stroke-width="0.6" fill="none" opacity="0.4"/>`).join('')}
        <!-- Hem -->
        <path d="M160,262 Q200,270 240,262" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.4"/>
      `,
      legStart: 265,
      hasArms: true,
      armStart: 90,
    },
    skirt: {
      garment: `
        ${figureHead}
        <!-- Torso hint -->
        <path d="M185,68 L185,140 M215,68 L215,140" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.2"/>
        <!-- Skirt -->
        <path d="M170,140 L165,160 C155,240 140,320 120,410 Q118,420 125,422 L275,422 Q282,420 280,410 C260,320 245,240 235,160 L230,140 Z"
          stroke="${primary}" stroke-width="1.5" fill="url(#tex)" opacity="0.9"/>
        <path d="M170,140 L165,160 C155,240 140,320 120,410 Q118,420 125,422 L275,422 Q282,420 280,410 C260,320 245,240 235,160 L230,140 Z"
          stroke="${primary}" stroke-width="0.5" fill="none" stroke-dasharray="6,3" opacity="0.3" transform="translate(0.8,0.5)"/>
        <!-- Waistband -->
        <rect x="168" y="138" width="64" height="8" rx="2" stroke="${primary}" stroke-width="1" fill="${accent}15"/>
        <!-- Flow lines -->
        <path d="M180,160 Q175,280 145,410" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.2"/>
        <path d="M220,160 Q225,280 255,410" stroke="${primary}" stroke-width="0.3" fill="none" opacity="0.2"/>
        <path d="M200,148 Q200,300 200,420" stroke="${primary}" stroke-width="0.25" fill="none" opacity="0.15"/>
        <!-- Hem -->
        <path d="M125,420 Q200,430 275,420" stroke="${accent}" stroke-width="0.6" fill="none" opacity="0.4"/>
      `,
      legStart: 422,
      hasArms: false,
      armStart: 0,
    },
    pants: {
      garment: `
        ${figureHead}
        <!-- Torso hint -->
        <path d="M185,68 L183,140 M215,68 L217,140" stroke="${primary}" stroke-width="0.5" fill="none" opacity="0.2"/>
        <!-- Pants -->
        <path d="M168,140 L164,220 L148,420 Q146,428 155,428 L195,428 Q200,428 200,420 L202,260 L204,420 Q204,428 210,428 L250,428 Q258,428 256,420 L240,220 L236,140 Z"
          stroke="${primary}" stroke-width="1.5" fill="url(#tex)" opacity="0.9"/>
        <path d="M168,140 L164,220 L148,420 Q146,428 155,428 L195,428 Q200,428 200,420 L202,260 L204,420 Q204,428 210,428 L250,428 Q258,428 256,420 L240,220 L236,140 Z"
          stroke="${primary}" stroke-width="0.5" fill="none" stroke-dasharray="5,3" opacity="0.3" transform="translate(0.8,0.5)"/>
        <!-- Waistband -->
        <rect x="166" y="138" width="72" height="10" rx="2" stroke="${primary}" stroke-width="1" fill="${accent}15"/>
        <!-- Crease lines -->
        <line x1="178" y1="160" x2="172" y2="420" stroke="${primary}" stroke-width="0.3" opacity="0.2"/>
        <line x1="226" y1="160" x2="232" y2="420" stroke="${primary}" stroke-width="0.3" opacity="0.2"/>
        <!-- Pocket hint -->
        <path d="M172,155 Q180,162 174,170" stroke="${accent}" stroke-width="0.6" fill="none" opacity="0.35"/>
        <path d="M232,155 Q224,162 230,170" stroke="${accent}" stroke-width="0.6" fill="none" opacity="0.35"/>
      `,
      legStart: 430,
      hasArms: false,
      armStart: 0,
    },
    jacket: {
      garment: `
        <!-- Jacket body -->
        <path d="M200,62 C172,62 148,80 142,108 L118,140 Q110,152 120,160 L145,172 L140,310 Q140,320 150,320 L192,320 L192,190 L200,182 L208,190 L208,320 L250,320 Q260,320 260,310 L255,172 L280,160 Q290,152 282,140 L258,108 C252,80 228,62 200,62 Z"
          stroke="${primary}" stroke-width="1.5" fill="url(#tex)" opacity="0.9"/>
        <path d="M200,62 C172,62 148,80 142,108 L118,140 Q110,152 120,160 L145,172 L140,310 Q140,320 150,320 L192,320 L192,190 L200,182 L208,190 L208,320 L250,320 Q260,320 260,310 L255,172 L280,160 Q290,152 282,140 L258,108 C252,80 228,62 200,62 Z"
          stroke="${primary}" stroke-width="0.5" fill="none" stroke-dasharray="5,3" opacity="0.3" transform="translate(0.8,0.5)"/>
        <!-- Lapels -->
        <path d="M182,75 L172,110 L192,140 L200,130" stroke="${primary}" stroke-width="1" fill="${accent}10"/>
        <path d="M218,75 L228,110 L208,140 L200,130" stroke="${primary}" stroke-width="1" fill="${accent}10"/>
        <!-- Buttons -->
        <circle cx="198" cy="200" r="3" stroke="${accent}" stroke-width="0.8" fill="${accent}20"/>
        <circle cx="198" cy="240" r="3" stroke="${accent}" stroke-width="0.8" fill="${accent}20"/>
        <circle cx="198" cy="280" r="3" stroke="${accent}" stroke-width="0.8" fill="${accent}20"/>
        <!-- Pocket flaps -->
        <path d="M155,220 L185,220 L185,225 L155,225 Z" stroke="${primary}" stroke-width="0.6" fill="none" opacity="0.3"/>
        <path d="M215,220 L245,220 L245,225 L215,225 Z" stroke="${primary}" stroke-width="0.6" fill="none" opacity="0.3"/>
      `,
      legStart: 320,
      hasArms: true,
      armStart: 95,
    },
    top: {
      garment: `
        <!-- Top body -->
        <path d="M200,68 C178,68 162,78 158,95 L142,115 Q136,124 144,130 L158,136 L155,210 Q155,218 163,218 L237,218 Q245,218 245,210 L242,136 L256,130 Q264,124 258,115 L242,95 C238,78 222,68 200,68 Z"
          stroke="${primary}" stroke-width="1.5" fill="url(#tex)" opacity="0.9"/>
        <path d="M200,68 C178,68 162,78 158,95 L142,115 Q136,124 144,130 L158,136 L155,210 Q155,218 163,218 L237,218 Q245,218 245,210 L242,136 L256,130 Q264,124 258,115 L242,95 C238,78 222,68 200,68 Z"
          stroke="${primary}" stroke-width="0.5" fill="none" stroke-dasharray="5,3" opacity="0.3" transform="translate(0.8,0.5)"/>
        <!-- Neckline -->
        <path d="M172,76 Q200,92 228,76" stroke="${primary}" stroke-width="1.2" fill="none"/>
        <!-- Seam lines -->
        <path d="M162,136 Q200,145 238,136" stroke="${accent}" stroke-width="0.5" fill="none" opacity="0.3" stroke-dasharray="3,3"/>
        <!-- Hem -->
        <path d="M163,216 Q200,222 237,216" stroke="${accent}" stroke-width="0.6" fill="none" opacity="0.4"/>
      `,
      legStart: 218,
      hasArms: true,
      armStart: 82,
    },
  };

  const tmpl = silhouettes[template] || silhouettes.dress;

  // Build color swatches at the bottom
  const swatches = colors.slice(0, 6).map((c, i) =>
    `<rect x="${145 + i * 22}" y="455" width="18" height="18" rx="3" fill="${c}" stroke="${primary}" stroke-width="0.5" opacity="0.7"/>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="600" height="750">
    <rect width="400" height="500" fill="#FAFAF8"/>

    <defs>
      ${patternDef}
      <!-- Pencil texture filter -->
      <filter id="pencil" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="2" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>

    <g filter="url(#pencil)">
      ${!tmpl.garment.includes('Fashion figure head') ? figureHead : ''}
      ${tmpl.garment}
      ${tmpl.hasArms ? figureArm('left', tmpl.armStart) + figureArm('right', tmpl.armStart) : ''}
    </g>

    <!-- Color swatches -->
    ${swatches}

    <!-- Fabric label -->
    <text x="200" y="490" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="10" fill="${primary}" opacity="0.35" letter-spacing="2">
      ${(fabric || 'Design').toUpperCase()} SKETCH
    </text>

    <!-- Corner marks -->
    <line x1="20" y1="20" x2="40" y2="20" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="20" y1="20" x2="20" y2="40" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="380" y1="20" x2="360" y2="20" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
    <line x1="380" y1="20" x2="380" y2="40" stroke="${primary}" stroke-width="0.3" opacity="0.15"/>
  </svg>`;
}
