import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a fashion sketch using DALL-E or fallback SVG.
 * POST body: { template, fabric, colors, collectionName, style }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { template, fabric, colors, collectionName, style } = body;

  if (!template) {
    return NextResponse.json({ error: 'template required' }, { status: 400 });
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

  const openaiKey = process.env.OPENAI_API_KEY;

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

      // Fall through to SVG fallback if DALL-E fails
    } catch {
      // Fall through to SVG fallback
    }
  }

  // SVG Fallback — generate a procedural fashion sketch
  const svgSketch = generateSVGSketch(template, colors || ['#0A0A0A'], fabricName);

  return NextResponse.json({
    svgData: svgSketch,
    source: 'svg-fallback',
    message: openaiKey ? 'DALL-E generation failed, using SVG fallback' : 'Configure OPENAI_API_KEY for AI-generated sketches',
  });
}

function generateSVGSketch(template: string, colors: string[], fabric: string): string {
  const primaryColor = colors[0] || '#0A0A0A';
  const accentColor = colors[1] || '#B8943A';

  const silhouettes: Record<string, string> = {
    dress: `
      <path d="M200,60 C180,60 160,80 155,110 L150,200 C145,280 130,360 110,440 L290,440 C270,360 255,280 250,200 L245,110 C240,80 220,60 200,60 Z"
        stroke="${primaryColor}" stroke-width="2" fill="none" stroke-dasharray="8,4" opacity="0.6"/>
      <path d="M200,60 C180,60 160,80 155,110 L150,200 C145,280 130,360 110,440 L290,440 C270,360 255,280 250,200 L245,110 C240,80 220,60 200,60 Z"
        stroke="${primaryColor}" stroke-width="1" fill="${primaryColor}08" transform="translate(1,1)"/>
      <ellipse cx="200" cy="55" rx="15" ry="8" stroke="${primaryColor}" stroke-width="1.5" fill="none"/>
      <line x1="200" y1="110" x2="200" y2="250" stroke="${accentColor}" stroke-width="0.5" stroke-dasharray="4,6" opacity="0.4"/>
      <path d="M155,110 Q130,125 120,150" stroke="${primaryColor}" stroke-width="1.5" fill="none"/>
      <path d="M245,110 Q270,125 280,150" stroke="${primaryColor}" stroke-width="1.5" fill="none"/>
    `,
    blouse: `
      <path d="M200,70 C175,70 155,85 150,110 L120,145 L150,155 L145,260 L255,260 L250,155 L280,145 L250,110 C245,85 225,70 200,70 Z"
        stroke="${primaryColor}" stroke-width="2" fill="none" stroke-dasharray="8,4" opacity="0.6"/>
      <path d="M200,70 C175,70 155,85 150,110 L120,145 L150,155 L145,260 L255,260 L250,155 L280,145 L250,110 C245,85 225,70 200,70 Z"
        stroke="${primaryColor}" stroke-width="1" fill="${primaryColor}08" transform="translate(1,1)"/>
      <ellipse cx="200" cy="65" rx="12" ry="6" stroke="${primaryColor}" stroke-width="1.5" fill="none"/>
      <line x1="200" y1="110" x2="200" y2="260" stroke="${accentColor}" stroke-width="0.5" stroke-dasharray="3,5" opacity="0.3"/>
    `,
    skirt: `
      <path d="M160,100 L155,120 C145,220 130,320 110,420 L290,420 C270,320 255,220 245,120 L240,100 Z"
        stroke="${primaryColor}" stroke-width="2" fill="none" stroke-dasharray="8,4" opacity="0.6"/>
      <path d="M160,100 L155,120 C145,220 130,320 110,420 L290,420 C270,320 255,220 245,120 L240,100 Z"
        stroke="${primaryColor}" stroke-width="1" fill="${primaryColor}08" transform="translate(1,1)"/>
      <line x1="160" y1="100" x2="240" y2="100" stroke="${primaryColor}" stroke-width="2"/>
      <path d="M200,100 L200,420" stroke="${accentColor}" stroke-width="0.5" stroke-dasharray="4,8" opacity="0.3"/>
    `,
    pants: `
      <path d="M170,80 L165,200 L140,420 L200,420 L210,220 L220,420 L260,420 L235,200 L230,80 Z"
        stroke="${primaryColor}" stroke-width="2" fill="none" stroke-dasharray="8,4" opacity="0.6"/>
      <path d="M170,80 L165,200 L140,420 L200,420 L210,220 L220,420 L260,420 L235,200 L230,80 Z"
        stroke="${primaryColor}" stroke-width="1" fill="${primaryColor}08" transform="translate(1,1)"/>
      <line x1="170" y1="80" x2="230" y2="80" stroke="${primaryColor}" stroke-width="2"/>
    `,
    jacket: `
      <path d="M200,50 C175,50 150,70 145,100 L110,130 L140,165 L135,310 L185,310 L190,180 L200,170 L210,180 L215,310 L265,310 L260,165 L290,130 L255,100 C250,70 225,50 200,50 Z"
        stroke="${primaryColor}" stroke-width="2" fill="none" stroke-dasharray="8,4" opacity="0.6"/>
      <path d="M200,50 C175,50 150,70 145,100 L110,130 L140,165 L135,310 L185,310 L190,180 L200,170 L210,180 L215,310 L265,310 L260,165 L290,130 L255,100 C250,70 225,50 200,50 Z"
        stroke="${primaryColor}" stroke-width="1" fill="${primaryColor}08" transform="translate(1,1)"/>
      <ellipse cx="200" cy="45" rx="12" ry="6" stroke="${primaryColor}" stroke-width="1.5" fill="none"/>
      <line x1="200" y1="170" x2="200" y2="310" stroke="${accentColor}" stroke-width="1" stroke-dasharray="2,3" opacity="0.4"/>
    `,
    top: `
      <path d="M200,80 C180,80 165,90 160,110 L140,130 L160,140 L155,220 L245,220 L240,140 L260,130 L240,110 C235,90 220,80 200,80 Z"
        stroke="${primaryColor}" stroke-width="2" fill="none" stroke-dasharray="8,4" opacity="0.6"/>
      <path d="M200,80 C180,80 165,90 160,110 L140,130 L160,140 L155,220 L245,220 L240,140 L260,130 L240,110 C235,90 220,80 200,80 Z"
        stroke="${primaryColor}" stroke-width="1" fill="${primaryColor}08" transform="translate(1,1)"/>
    `,
  };

  const silhouette = silhouettes[template] || silhouettes.dress;

  // Add fabric texture hint
  const fabricPatterns: Record<string, string> = {
    silk: `<pattern id="fabric" width="20" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="20" y2="20" stroke="${accentColor}" stroke-width="0.3" opacity="0.15"/></pattern>`,
    velvet: `<pattern id="fabric" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1" fill="${accentColor}" opacity="0.1"/></pattern>`,
    linen: `<pattern id="fabric" width="12" height="12" patternUnits="userSpaceOnUse"><line x1="0" y1="6" x2="12" y2="6" stroke="${accentColor}" stroke-width="0.2" opacity="0.1"/><line x1="6" y1="0" x2="6" y2="12" stroke="${accentColor}" stroke-width="0.2" opacity="0.1"/></pattern>`,
    default: '',
  };

  const fabricPattern = fabricPatterns[fabric] || fabricPatterns.default;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480">
    <rect width="400" height="480" fill="white"/>
    <defs>${fabricPattern}</defs>
    <g>
      ${silhouette}
    </g>
    <text x="200" y="465" text-anchor="middle" font-family="serif" font-size="11" fill="${primaryColor}" opacity="0.4">
      ${fabric ? fabric.charAt(0).toUpperCase() + fabric.slice(1) : 'Design'} Sketch
    </text>
  </svg>`;
}
