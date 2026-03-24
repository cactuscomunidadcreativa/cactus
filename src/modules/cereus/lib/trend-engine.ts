/**
 * CEREUS Trend Engine
 * Datos de tendencias de moda organizados por temporada, ano y categoria.
 * Alimenta la generacion de diseno asistida por IA con contexto de tendencias reales.
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

// ─── Datos de Tendencias 2026 ───────────────────────────────

const TRENDS_2026: Record<string, TrendData> = {
  spring_summer: {
    season: 'Primavera/Verano',
    year: 2026,
    silhouettes: [
      {
        name: 'Drapeado Liquido',
        description: 'Siluetas fluidas que acarician el cuerpo y se mueven con el. Dobladillos asimetricos, escotes drapeados, cortes al bies.',
        garmentTypes: ['dress', 'blouse', 'skirt'],
        keywords: ['fluido', 'asimetrico', 'al bies', 'drapeado', 'cowl'],
      },
      {
        name: 'Estructura Suave',
        description: 'Sastreria afilada con telas suaves. Blazers oversize, pantalones anchos, trajes deconstruidos.',
        garmentTypes: ['jacket', 'pants', 'suit'],
        keywords: ['oversize', 'deconstruido', 'pierna ancha', 'sastreria relajada'],
      },
      {
        name: 'Micro Arquitectura',
        description: 'Detalles esculturales a pequena escala. Pliegues origami, inserciones plisadas, volantes estructurados.',
        garmentTypes: ['top', 'dress', 'skirt'],
        keywords: ['origami', 'escultural', 'plisado', 'estructurado', 'geometrico'],
      },
      {
        name: 'Segunda Piel',
        description: 'Silueta ceñida al cuerpo, minimalista. Lineas limpias, costuras minimas, construccion invisible.',
        garmentTypes: ['dress', 'top', 'pants'],
        keywords: ['minimal', 'ceñido', 'elegante', 'limpio', 'sin costuras'],
      },
    ],
    colorStories: [
      {
        name: 'Atardecer Digital',
        description: 'Tonos calidos en degradado inspirados en atardeceres filtrados',
        colors: ['#FF6B35', '#F7C59F', '#FFE0B2', '#E8A87C', '#D4956A', '#CC5803'],
        mood: 'calido, optimista, hora dorada',
      },
      {
        name: 'Protocolo Oceano',
        description: 'Azules oceanicos profundos encontrandose con plata tecnologica',
        colors: ['#0B3D91', '#1565C0', '#42A5F5', '#B0BEC5', '#CFD8DC', '#ECEFF1'],
        mood: 'futurista, sereno, profundidad',
      },
      {
        name: 'Terra Nova',
        description: 'Neutros terrosos con acentos botanicos inesperados',
        colors: ['#3E2723', '#6D4C41', '#A1887F', '#C5CAE9', '#81C784', '#F5F5DC'],
        mood: 'arraigado, natural, sofisticado',
      },
      {
        name: 'Neo Rubor',
        description: 'Pasteles evolucionados con profundidad y complejidad',
        colors: ['#F8BBD0', '#CE93D8', '#B39DDB', '#F5F5F5', '#FFCCBC', '#FFE0B2'],
        mood: 'romantico, moderno, etereo',
      },
    ],
    fabricTrends: [
      {
        name: 'Satin Liquido',
        description: 'Satenes de alto brillo y telas con efecto liquido que capturan y reflejan la luz',
        fabrics: ['satin duquesa', 'charmeuse', 'seda martillada'],
        finish: 'alto brillo, reflectante',
      },
      {
        name: 'Texturas Organicas',
        description: 'Telas naturales y tactiles con tejido visible y sensacion artesanal',
        fabrics: ['seda cruda', 'lino tejido a mano', 'boucle', 'algodon slub'],
        finish: 'mate, texturado, artesanal',
      },
      {
        name: 'Tech Luxe',
        description: 'Telas tecnicas elevadas a estatus de lujo',
        fabrics: ['neopreno scuba', 'jersey laminado', 'mesh cortado laser'],
        finish: 'estructurado, bordes limpios',
      },
      {
        name: 'Capas Transparentes',
        description: 'Telas transparentes y semitransparentes para profundidad en capas',
        fabrics: ['organza', 'tul', 'chiffon', 'punto transparente'],
        finish: 'etereo, en capas, ligero',
      },
    ],
    details: [
      {
        name: 'Bordado Artesanal',
        description: 'Detalles hechos a mano que muestran el toque del artesano',
        elements: ['bordado a mano', 'clusters de pedreria', 'aplique de borde crudo', 'pintura con hilo'],
        placement: ['hombros', 'punos', 'dobladillo', 'cuello'],
      },
      {
        name: 'Costuras Visibles',
        description: 'La construccion como parte del diseno, costuras decorativas que revelan el oficio',
        elements: ['costuras contrastantes', 'pespuntes decorativos', 'vivos de color', 'ribetes hechos a mano'],
        placement: ['cierre frontal', 'mangas', 'bolsillos', 'cintura'],
      },
      {
        name: 'Corte y Revelacion',
        description: 'Recortes estrategicos y espacio negativo',
        elements: ['recortes en hombros', 'espalda descubierta', 'aberturas laterales', 'detalles keyhole'],
        placement: ['espalda', 'hombros', 'costados', 'cintura'],
      },
      {
        name: 'Juego de Volumenes',
        description: 'Proporciones exageradas en zonas especificas',
        elements: ['mangas abullonadas', 'dobladillos globo', 'hombros fruncidos', 'formas infladas'],
        placement: ['mangas', 'dobladillo', 'hombros', 'falda'],
      },
    ],
    moodKeywords: ['glamour sin esfuerzo', 'banado por el sol', 'movimiento fluido', 'romance moderno', 'sofisticacion costera', 'arte y moda'],
  },
  fall_winter: {
    season: 'Otono/Invierno',
    year: 2026,
    silhouettes: [
      {
        name: 'Silueta Envolvente',
        description: 'Formas que abrazan y protegen. Abrigos amplios, siluetas cruzadas, volumenes generosos que invitan a moverse.',
        garmentTypes: ['jacket', 'dress', 'coat'],
        keywords: ['envolvente', 'oversize', 'cruzado', 'abrazo', 'volumen'],
      },
      {
        name: 'Filo Cortante',
        description: 'Sastreria de precision con angulos extremos. Hombros angulares, cortes geometricos, lineas definidas.',
        garmentTypes: ['suit', 'blazer', 'pants'],
        keywords: ['angular', 'afilado', 'geometrico', 'precision', 'estructurado'],
      },
      {
        name: 'Narrativa en Capas',
        description: 'Multiples capas visibles creando profundidad y narrativa. Transparente sobre opaco, ligero sobre pesado.',
        garmentTypes: ['dress', 'blouse', 'skirt'],
        keywords: ['en capas', 'transparente', 'profundidad', 'contraste textural'],
      },
      {
        name: 'Columna',
        description: 'Lineas verticales elongadas, largo hasta el piso, siluetas estrechas que crean drama.',
        garmentTypes: ['dress', 'skirt', 'coat'],
        keywords: ['elongado', 'estrecho', 'columna', 'hasta el piso', 'dramatico'],
      },
    ],
    colorStories: [
      {
        name: 'Biblioteca de Medianoche',
        description: 'Tonos profundos e intelectuales evocando salas de lectura nocturnas',
        colors: ['#1A1A2E', '#16213E', '#0F3460', '#533A71', '#C8B6A6', '#F1DCA7'],
        mood: 'misterioso, intelectual, ambar calido',
      },
      {
        name: 'Volcanico',
        description: 'Tonos tierra profundos puntuados por rojos ardientes',
        colors: ['#1B0000', '#3D0000', '#8B0000', '#D4A373', '#6B705C', '#A5A58D'],
        mood: 'intenso, dramatico, fuego terrestre',
      },
      {
        name: 'Bosque Nocturno',
        description: 'Verdes profundos del bosque con acentos de tierra humeda',
        colors: ['#1B3A2D', '#2D5A3D', '#4A7A5C', '#8B6914', '#D4A373', '#E8DCC8'],
        mood: 'naturaleza profunda, raices, tierra viva',
      },
      {
        name: 'Torre de Marfil',
        description: 'Paleta monocromatica de crema a hueso con variedad de texturas',
        colors: ['#FFFDF7', '#FFF8E1', '#F5F0E8', '#E8DCC8', '#D4C5AA', '#B8A88A'],
        mood: 'puro, arquitectonico, textural',
      },
    ],
    fabricTrends: [
      {
        name: 'Lujo Pesado',
        description: 'Telas sustanciales y con peso que caen con gravedad',
        fabrics: ['lana doble faz', 'mezcla de cashmere', 'crepe pesado', 'lana fieltrada'],
        finish: 'sustancial, con peso, mano lujosa',
      },
      {
        name: 'Arrugado y Vivido',
        description: 'Texturas deliberadamente envejecidas y arrugadas',
        fabrics: ['terciopelo aplastado', 'taffeta arrugado', 'seda crinkle', 'cuero lavado'],
        finish: 'vivido, texturado, decadencia romantica',
      },
      {
        name: 'Dimension Acolchada',
        description: 'Superficies acolchadas y rellenas que agregan profundidad y calidez',
        fabrics: ['seda acolchada', 'jersey acolchado', 'cuero con costuras canal'],
        finish: 'dimensional, calido, tactil',
      },
    ],
    details: [
      {
        name: 'Texturas Artesanales',
        description: 'Acabados hechos a mano que revelan la dedicacion del artesano',
        elements: ['bordado a mano', 'tejido crochet', 'apliques de tela', 'patchwork artesanal'],
        placement: ['hombros', 'cintura', 'dobladillo', 'escote'],
      },
      {
        name: 'Cuello Dramatico',
        description: 'Cuellos statement y tratamientos de escote impactantes',
        elements: ['cuello oversize', 'cuello alto', 'cuello desmontable', 'cuello embudo'],
        placement: ['escote'],
      },
      {
        name: 'Bordado Tonal',
        description: 'Bordado del mismo color creando patrones de textura sutil',
        elements: ['pedreria tonal', 'bordado monocolor', 'acolchado tono sobre tono'],
        placement: ['corpino', 'mangas', 'canesú', 'dobladillo'],
      },
    ],
    moodKeywords: ['elegancia nocturna', 'sastreria con alma', 'glamour intimo', 'belleza intelectual', 'refugio urbano', 'historias en capas'],
  },
  resort: {
    season: 'Resort/Crucero',
    year: 2026,
    silhouettes: [
      {
        name: 'Soltura Resort',
        description: 'Formas relajadas y sin esfuerzo. Kaftanes, pantalones amplios, maxis fluidos.',
        garmentTypes: ['dress', 'pants', 'blouse'],
        keywords: ['relajado', 'kaftan', 'fluido', 'facil', 'maxi'],
      },
      {
        name: 'Vacacion Arquitectonica',
        description: 'Resort wear estructurado con precision geometrica.',
        garmentTypes: ['jacket', 'top', 'skirt'],
        keywords: ['geometrico', 'estructurado', 'nitido', 'resort-formal'],
      },
    ],
    colorStories: [
      {
        name: 'Azul Mediterraneo',
        description: 'Mares azur, arquitectura blanca, acentos terracota',
        colors: ['#0277BD', '#03A9F4', '#FFFFFF', '#D4A373', '#E76F51', '#F4ECD8'],
        mood: 'costero, luminoso, despreocupado',
      },
      {
        name: 'Noche Tropical',
        description: 'Verdes jungla profundos con toques florales exoticos',
        colors: ['#1B5E20', '#2E7D32', '#004D40', '#FF6F00', '#FF8F00', '#FFF8E1'],
        mood: 'exuberante, exotico, paraiso nocturno',
      },
    ],
    fabricTrends: [
      {
        name: 'Texturas de Isla',
        description: 'Fibras naturales con facilidad lista para resort',
        fabrics: ['lino', 'gasa de algodon', 'tejido de rafia', 'mezcla de canamo'],
        finish: 'natural, respirable, relajado',
      },
    ],
    details: [
      {
        name: 'Artesania Resort',
        description: 'Detalles artesanales inspirados en la artesania del destino',
        elements: ['macrame', 'inserciones de crochet', 'botones de concha', 'flecos'],
        placement: ['dobladillo', 'escote', 'mangas', 'cintura'],
      },
    ],
    moodKeywords: ['soltura jet-set', 'vida costera', 'hora dorada', 'lujo descalzo', 'vestir de destino'],
  },
  capsule: {
    season: 'Capsula',
    year: 2026,
    silhouettes: [
      {
        name: 'Esencial Elevado',
        description: 'Piezas basicas reimaginadas con detalles de lujo. Versatilidad y elegancia atemporal.',
        garmentTypes: ['dress', 'blouse', 'pants', 'jacket', 'top', 'skirt'],
        keywords: ['esencial', 'versatil', 'atemporal', 'elegante', 'refinado'],
      },
    ],
    colorStories: [
      {
        name: 'Paleta Esencial',
        description: 'Neutros refinados con un toque de color signature',
        colors: ['#1A1A1A', '#4A4A4A', '#8B8B8B', '#F5F0E8', '#B8943A', '#FFFFFF'],
        mood: 'refinado, versatil, atemporal',
      },
    ],
    fabricTrends: [
      {
        name: 'Materiales Nobles',
        description: 'Telas de calidad superior que envejecen con gracia',
        fabrics: ['cashmere', 'seda cruda', 'lino italiano', 'lana merino'],
        finish: 'premium, duradero, mejora con el tiempo',
      },
    ],
    details: [
      {
        name: 'Detalle Invisible',
        description: 'Construccion impecable donde la calidad habla por si sola',
        elements: ['costuras francesas', 'forros de seda', 'botones de nacar', 'acabados a mano'],
        placement: ['interior', 'cierres', 'costuras', 'dobladillo'],
      },
    ],
    moodKeywords: ['menos es mas', 'lujo silencioso', 'elegancia esencial', 'inversion inteligente', 'guardarropa consciente'],
  },
  bridal: {
    season: 'Nupcial',
    year: 2026,
    silhouettes: [
      {
        name: 'Novia Moderna',
        description: 'Siluetas nupciales que rompen con lo tradicional. Trajes, monos, vestidos minimalistas.',
        garmentTypes: ['dress', 'suit', 'jumpsuit'],
        keywords: ['moderno', 'minimalista', 'no convencional', 'elegante', 'limpio'],
      },
      {
        name: 'Romance Eterno',
        description: 'Siluetas clasicas reinterpretadas con sensibilidad contemporanea. Colas dramaticas, velos esculturales.',
        garmentTypes: ['dress', 'gown'],
        keywords: ['romantico', 'clasico', 'dramatico', 'cola', 'velo'],
      },
    ],
    colorStories: [
      {
        name: 'Blanco Infinito',
        description: 'Variaciones de blanco desde nieve hasta marfil calido',
        colors: ['#FFFFFF', '#FFFEF7', '#FFF8F0', '#F5EEE6', '#EBE3D5', '#E0D5C1'],
        mood: 'puro, soñador, luminoso',
      },
    ],
    fabricTrends: [
      {
        name: 'Telas de Ensueno',
        description: 'Materiales que crean magia y movimiento nupcial',
        fabrics: ['mikado', 'organza de seda', 'encaje Chantilly', 'crepe de seda', 'tul bordado'],
        finish: 'lujoso, romantico, fotografico',
      },
    ],
    details: [
      {
        name: 'Detalles Nupciales',
        description: 'Ornamentacion que transforma tela en sueno',
        elements: ['bordado de perlas', 'apliques de encaje', 'cristales Swarovski', 'lazos de satin'],
        placement: ['corpino', 'espalda', 'cola', 'velo'],
      },
    ],
    moodKeywords: ['romance eterno', 'elegancia nupcial', 'sueno hecho realidad', 'amor moderno', 'ceremonia de luz'],
  },
};

// ─── Tendencias por Defecto ─────────────────────────────────

const DEFAULT_TREND: TrendData = TRENDS_2026.spring_summer;

// ─── API Publica ────────────────────────────────────────────

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

  const silhouette = trends.silhouettes.find(s =>
    s.garmentTypes.includes(template)
  ) || trends.silhouettes[0];

  const fabricTrend = trends.fabricTrends.find(f =>
    f.fabrics.some(fb => fb.toLowerCase().includes(fabric.toLowerCase()))
  ) || trends.fabricTrends[0];

  const details = trends.details.filter(d =>
    d.placement.some(p => {
      if (['dress', 'blouse', 'top'].includes(template)) return ['hombros', 'escote', 'corpino', 'mangas', 'punos', 'shoulders', 'neckline', 'bodice', 'sleeves', 'cuffs'].includes(p);
      if (['skirt', 'pants'].includes(template)) return ['cintura', 'dobladillo', 'costados', 'waist', 'hem', 'sides'].includes(p);
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
    pants: 'pantalon',
    jacket: 'chaqueta',
    top: 'top',
  };

  const parts: string[] = [
    `Disena un ${garmentNames[template] || template} de alta costura`,
    fabric ? `en ${fabric}` : '',
    colors.length > 0 ? `con paleta de colores: ${colors.join(', ')}` : '',
    `\n\nTendencias ${trends.season} ${trends.year}:`,
    suggestions.silhouette ? `- Silueta: ${suggestions.silhouette.name} - ${suggestions.silhouette.description}` : '',
    suggestions.fabricTrend ? `- Tela en tendencia: ${suggestions.fabricTrend.name} - ${suggestions.fabricTrend.description}` : '',
    suggestions.details.length > 0 ? `- Detalles: ${suggestions.details.map(d => `${d.name} (${d.elements.join(', ')})`).join('; ')}` : '',
    `- Mood: ${trends.moodKeywords.join(', ')}`,
    collectionName ? `\n\nColeccion: "${collectionName}"` : '',
    `\n\nEstilo de ilustracion: Boceto de moda a lapiz sobre papel blanco, proporciones de 9 cabezas, lineas de construccion visibles, detalles de costura, anotaciones tecnicas.`,
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
