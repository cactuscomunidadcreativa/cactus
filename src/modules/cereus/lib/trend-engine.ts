/**
 * CEREUS Trend Engine
 * Fashion trend data organized by season, year, and category.
 * Powers the AI-assisted design generation with real trend context.
 */

export interface TrendData {
  season: string;
  year: number;
  silhouettes: TrendSilhouette[];
  colorStories: ColorStory[];
  fabricTrends: FabricTrend[];
  details: DetailTrend[];
  moodKeywords: string[];
}

export interface TrendSilhouette {
  name: string;
  description: string;
  garmentTypes: string[];
  keywords: string[];
}

export interface ColorStory {
  name: string;
  description: string;
  colors: string[];
  mood: string;
}

export interface FabricTrend {
  name: string;
  description: string;
  fabrics: string[];
  finish: string;
}

export interface DetailTrend {
  name: string;
  description: string;
  elements: string[];
  placement: string[];
}

// ─── 2026 Trend Data ────────────────────────────────────────

const TRENDS_2026: Record<string, TrendData> = {
  spring_summer: {
    season: 'Spring/Summer',
    year: 2026,
    silhouettes: [
      {
        name: 'Liquid Drape',
        description: 'Flowing, body-skimming silhouettes that move with the body. Asymmetric hemlines, cowl necklines, bias cuts.',
        garmentTypes: ['dress', 'blouse', 'skirt'],
        keywords: ['fluid', 'asymmetric', 'bias-cut', 'cowl', 'draped'],
      },
      {
        name: 'Structured Soft',
        description: 'Sharp tailoring meets soft fabrics. Oversized blazers, wide-leg trousers, deconstructed suits.',
        garmentTypes: ['jacket', 'pants', 'suit'],
        keywords: ['oversized', 'deconstructed', 'wide-leg', 'relaxed tailoring'],
      },
      {
        name: 'Micro Architecture',
        description: 'Sculptural details at small scale. Origami folds, pleated inserts, structured ruffles.',
        garmentTypes: ['top', 'dress', 'skirt'],
        keywords: ['origami', 'sculptural', 'pleated', 'structured', 'geometric'],
      },
      {
        name: 'Second Skin',
        description: 'Body-conscious, minimalist. Clean lines, minimal seams, invisible construction.',
        garmentTypes: ['dress', 'top', 'pants'],
        keywords: ['minimal', 'body-con', 'sleek', 'clean', 'seamless'],
      },
    ],
    colorStories: [
      {
        name: 'Digital Sunset',
        description: 'Warm gradient tones inspired by filtered sunsets',
        colors: ['#FF6B35', '#F7C59F', '#FFE0B2', '#E8A87C', '#D4956A', '#CC5803'],
        mood: 'warm, optimistic, golden hour',
      },
      {
        name: 'Ocean Protocol',
        description: 'Deep oceanic blues meeting technological silver',
        colors: ['#0B3D91', '#1565C0', '#42A5F5', '#B0BEC5', '#CFD8DC', '#ECEFF1'],
        mood: 'futuristic, calm, depth',
      },
      {
        name: 'Terra Nova',
        description: 'Earthy neutrals with unexpected botanical accents',
        colors: ['#3E2723', '#6D4C41', '#A1887F', '#C5CAE9', '#81C784', '#F5F5DC'],
        mood: 'grounded, natural, sophisticated',
      },
      {
        name: 'Neo Blush',
        description: 'Evolved pastels with depth and complexity',
        colors: ['#F8BBD0', '#CE93D8', '#B39DDB', '#F5F5F5', '#FFCCBC', '#FFE0B2'],
        mood: 'romantic, modern, ethereal',
      },
    ],
    fabricTrends: [
      {
        name: 'Liquid Satin',
        description: 'High-shine satins and liquid-effect fabrics that catch and reflect light',
        fabrics: ['duchess satin', 'charmeuse', 'hammered silk'],
        finish: 'high gloss, reflective',
      },
      {
        name: 'Organic Textures',
        description: 'Natural, tactile fabrics with visible weave and handcraft feel',
        fabrics: ['raw silk', 'handwoven linen', 'bouclé', 'slub cotton'],
        finish: 'matte, textured, artisanal',
      },
      {
        name: 'Tech Luxe',
        description: 'Performance fabrics elevated to luxury status',
        fabrics: ['scuba neoprene', 'bonded jersey', 'laser-cut mesh'],
        finish: 'structured, clean edges',
      },
      {
        name: 'Sheer Layers',
        description: 'Transparent and semi-transparent fabrics for layered depth',
        fabrics: ['organza', 'tulle', 'chiffon', 'sheer knit'],
        finish: 'ethereal, layered, light',
      },
    ],
    details: [
      {
        name: 'Artisan Embellishment',
        description: 'Hand-crafted details that show the maker\'s touch',
        elements: ['hand embroidery', 'beading clusters', 'raw edge appliqué', 'thread painting'],
        placement: ['shoulders', 'cuffs', 'hemline', 'collar'],
      },
      {
        name: 'Functional Hardware',
        description: 'Visible closures and hardware as design elements',
        elements: ['oversized zippers', 'ring pulls', 'metal grommets', 'exposed snaps'],
        placement: ['front closure', 'sleeves', 'pockets', 'waist'],
      },
      {
        name: 'Cut & Reveal',
        description: 'Strategic cutouts and negative space',
        elements: ['shoulder cutouts', 'back reveals', 'side slits', 'keyhole details'],
        placement: ['back', 'shoulders', 'sides', 'waist'],
      },
      {
        name: 'Volume Play',
        description: 'Exaggerated proportions in specific zones',
        elements: ['puff sleeves', 'bubble hems', 'gathered shoulders', 'ballooned shapes'],
        placement: ['sleeves', 'hem', 'shoulders', 'skirt'],
      },
    ],
    moodKeywords: ['effortless glamour', 'sun-drenched', 'fluid movement', 'modern romance', 'coastal sophistication', 'art-meets-fashion'],
  },
  fall_winter: {
    season: 'Fall/Winter',
    year: 2026,
    silhouettes: [
      {
        name: 'Power Cocoon',
        description: 'Enveloping, cocoon-like shapes. Oversized coats, wrap silhouettes, generous volumes.',
        garmentTypes: ['jacket', 'dress', 'coat'],
        keywords: ['cocoon', 'oversized', 'wrap', 'enveloping', 'volume'],
      },
      {
        name: 'Sharp Edge',
        description: 'Precision tailoring with extreme angles. Angular shoulders, geometric cuts, crisp lines.',
        garmentTypes: ['suit', 'blazer', 'pants'],
        keywords: ['angular', 'sharp', 'geometric', 'precision', 'structured'],
      },
      {
        name: 'Layered Narrative',
        description: 'Multiple visible layers creating depth and story. Sheer over opaque, light over heavy.',
        garmentTypes: ['dress', 'blouse', 'skirt'],
        keywords: ['layered', 'transparent', 'depth', 'textural contrast'],
      },
      {
        name: 'Column',
        description: 'Elongated vertical lines, floor-length, narrow silhouettes creating drama.',
        garmentTypes: ['dress', 'skirt', 'coat'],
        keywords: ['elongated', 'narrow', 'column', 'floor-length', 'dramatic'],
      },
    ],
    colorStories: [
      {
        name: 'Midnight Library',
        description: 'Deep, intellectual tones evoking late-night reading rooms',
        colors: ['#1A1A2E', '#16213E', '#0F3460', '#533A71', '#C8B6A6', '#F1DCA7'],
        mood: 'mysterious, intellectual, warm amber',
      },
      {
        name: 'Volcanic',
        description: 'Deep earth tones punctuated by fiery reds',
        colors: ['#1B0000', '#3D0000', '#8B0000', '#D4A373', '#6B705C', '#A5A58D'],
        mood: 'intense, dramatic, earthen fire',
      },
      {
        name: 'Steel Garden',
        description: 'Industrial metallics softened by botanical greens',
        colors: ['#424242', '#757575', '#9E9E9E', '#2E7D32', '#4CAF50', '#C8E6C9'],
        mood: 'urban nature, contrast, resilience',
      },
      {
        name: 'Ivory Tower',
        description: 'Monochromatic cream-to-bone palette with texture variety',
        colors: ['#FFFDF7', '#FFF8E1', '#F5F0E8', '#E8DCC8', '#D4C5AA', '#B8A88A'],
        mood: 'pure, architectural, textural',
      },
    ],
    fabricTrends: [
      {
        name: 'Heavy Luxe',
        description: 'Substantial, weighty fabrics that drape with gravity',
        fabrics: ['double-face wool', 'cashmere blend', 'heavy crepe', 'felted wool'],
        finish: 'substantial, weighty, luxurious hand',
      },
      {
        name: 'Crushed & Lived-in',
        description: 'Deliberately distressed and crinkled textures',
        fabrics: ['crushed velvet', 'wrinkled taffeta', 'crinkle silk', 'washed leather'],
        finish: 'lived-in, textured, romantic decay',
      },
      {
        name: 'Quilted Dimension',
        description: 'Quilted and padded surfaces adding depth and warmth',
        fabrics: ['quilted silk', 'padded jersey', 'channel-stitched leather'],
        finish: 'dimensional, warm, tactile',
      },
    ],
    details: [
      {
        name: 'Chain & Link',
        description: 'Metal chain details as both functional and decorative elements',
        elements: ['chain straps', 'chain belts', 'chain fringe', 'link closures'],
        placement: ['straps', 'waist', 'hem', 'neckline'],
      },
      {
        name: 'Dramatic Collar',
        description: 'Statement collars and neckline treatments',
        elements: ['oversized collar', 'turtleneck', 'detachable collar', 'funnel neck'],
        placement: ['neckline'],
      },
      {
        name: 'Tonal Embroidery',
        description: 'Same-color embroidery creating subtle texture patterns',
        elements: ['tonal beading', 'self-color embroidery', 'tone-on-tone quilting'],
        placement: ['bodice', 'sleeves', 'yoke', 'hem'],
      },
    ],
    moodKeywords: ['dark academia', 'power dressing', 'nocturnal glamour', 'intellectual beauty', 'urban fortress', 'layered stories'],
  },
  resort: {
    season: 'Resort',
    year: 2026,
    silhouettes: [
      {
        name: 'Resort Ease',
        description: 'Relaxed, effortless shapes. Kaftans, wide pants, flowing maxi.',
        garmentTypes: ['dress', 'pants', 'blouse'],
        keywords: ['relaxed', 'kaftan', 'flowing', 'easy', 'maxi'],
      },
      {
        name: 'Architectural Vacation',
        description: 'Structured resort wear with geometric precision.',
        garmentTypes: ['jacket', 'top', 'skirt'],
        keywords: ['geometric', 'structured', 'crisp', 'resort-formal'],
      },
    ],
    colorStories: [
      {
        name: 'Mediterranean Blue',
        description: 'Azure seas, white architecture, terracotta accents',
        colors: ['#0277BD', '#03A9F4', '#FFFFFF', '#D4A373', '#E76F51', '#F4ECD8'],
        mood: 'coastal, luminous, carefree',
      },
      {
        name: 'Tropical Night',
        description: 'Deep jungle greens with exotic floral pops',
        colors: ['#1B5E20', '#2E7D32', '#004D40', '#FF6F00', '#FF8F00', '#FFF8E1'],
        mood: 'lush, exotic, nocturnal paradise',
      },
    ],
    fabricTrends: [
      {
        name: 'Island Textures',
        description: 'Natural fibers with resort-ready ease',
        fabrics: ['linen', 'cotton gauze', 'raffia weave', 'hemp blend'],
        finish: 'natural, breathable, relaxed',
      },
    ],
    details: [
      {
        name: 'Resort Craft',
        description: 'Artisanal details inspired by destination craftsmanship',
        elements: ['macramé', 'crochet inserts', 'shell buttons', 'fringe'],
        placement: ['hem', 'neckline', 'sleeves', 'waist'],
      },
    ],
    moodKeywords: ['jet-set ease', 'coastal living', 'golden hour', 'barefoot luxury', 'destination dressing'],
  },
};

// ─── Default/Capsule Trends ──────────────────────────────────

const DEFAULT_TREND: TrendData = TRENDS_2026.spring_summer;

// ─── Public API ──────────────────────────────────────────────

export function getTrendData(season?: string, year?: number): TrendData {
  if (season && TRENDS_2026[season]) {
    return TRENDS_2026[season];
  }
  return DEFAULT_TREND;
}

export function getTrendSuggestions(
  template: string,
  fabric: string,
  season?: string,
): {
  silhouette: TrendSilhouette | null;
  colorStory: ColorStory | null;
  fabricTrend: FabricTrend | null;
  details: DetailTrend[];
  moodKeywords: string[];
} {
  const trends = getTrendData(season);

  // Find matching silhouette for garment type
  const silhouette = trends.silhouettes.find(s =>
    s.garmentTypes.includes(template)
  ) || trends.silhouettes[0];

  // Find matching fabric trend
  const fabricTrend = trends.fabricTrends.find(f =>
    f.fabrics.some(fb => fb.toLowerCase().includes(fabric.toLowerCase()))
  ) || trends.fabricTrends[0];

  // Get relevant details for this garment type
  const details = trends.details.filter(d =>
    d.placement.some(p => {
      if (['dress', 'blouse', 'top'].includes(template)) return ['shoulders', 'neckline', 'bodice', 'sleeves', 'cuffs'].includes(p);
      if (['skirt', 'pants'].includes(template)) return ['waist', 'hem', 'sides'].includes(p);
      return true;
    })
  );

  return {
    silhouette,
    colorStory: trends.colorStories[0],
    fabricTrend,
    details: details.slice(0, 2),
    moodKeywords: trends.moodKeywords,
  };
}

export function buildDesignPrompt(
  template: string,
  fabric: string,
  colors: string[],
  season?: string,
  collectionName?: string,
): string {
  const trends = getTrendData(season);
  const suggestions = getTrendSuggestions(template, fabric, season);

  const garmentNames: Record<string, string> = {
    dress: 'vestido',
    blouse: 'blusa',
    skirt: 'falda',
    pants: 'pantalón',
    jacket: 'chaqueta',
    top: 'top',
  };

  const parts: string[] = [
    `Diseña un ${garmentNames[template] || template} de alta costura`,
    fabric ? `en ${fabric}` : '',
    colors.length > 0 ? `con paleta de colores: ${colors.join(', ')}` : '',
    `\n\nTendencias ${trends.season} ${trends.year}:`,
    suggestions.silhouette ? `- Silueta: ${suggestions.silhouette.name} — ${suggestions.silhouette.description}` : '',
    suggestions.fabricTrend ? `- Tela en tendencia: ${suggestions.fabricTrend.name} — ${suggestions.fabricTrend.description}` : '',
    suggestions.details.length > 0 ? `- Detalles: ${suggestions.details.map(d => `${d.name} (${d.elements.join(', ')})`).join('; ')}` : '',
    `- Mood: ${trends.moodKeywords.join(', ')}`,
    collectionName ? `\n\nColección: "${collectionName}"` : '',
    `\n\nEstilo de ilustración: Boceto de moda a lápiz sobre papel blanco, proporciones de 9 cabezas, líneas de construcción visibles, detalles de costura, anotaciones técnicas.`,
  ];

  return parts.filter(Boolean).join(' ');
}

export function getAllTrendSeasons(): { value: string; label: string; year: number }[] {
  return Object.entries(TRENDS_2026).map(([key, data]) => ({
    value: key,
    label: `${data.season} ${data.year}`,
    year: data.year,
  }));
}
