/**
 * Brand Scraper - Extracts brand information from websites
 *
 * Analyzes HTML content to extract:
 * - Brand name
 * - Industry/sector
 * - Communication tone
 * - Color palette
 * - Value proposition
 * - Keywords
 * - Products/services
 * - Target audience hints
 */

import { generateContent } from '@/lib/ai';

export interface ScrapedBrandData {
  name: string;
  industry: string;
  tone: string[];
  colors: string[];
  value_proposition: string;
  keywords: string[];
  products_services: string[];
  audience: {
    age_range: string;
    interests: string;
    pain_points: string;
  };
  logo_url?: string;
  tagline?: string;
}

export interface ScrapeResult {
  success: boolean;
  data?: ScrapedBrandData;
  error?: string;
  source_url: string;
}

/**
 * Extracts colors from HTML/CSS content
 */
function extractColorsFromHTML(html: string): string[] {
  const colors = new Set<string>();

  // Match hex colors
  const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  const hexMatches = html.match(hexPattern) || [];
  hexMatches.forEach(c => colors.add(c.toUpperCase()));

  // Match rgb/rgba colors
  const rgbPattern = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
  let rgbMatch;
  while ((rgbMatch = rgbPattern.exec(html)) !== null) {
    const hex = `#${parseInt(rgbMatch[1]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[2]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[3]).toString(16).padStart(2, '0')}`.toUpperCase();
    colors.add(hex);
  }

  // Filter out common framework colors (white, black, grays)
  const filtered = Array.from(colors).filter(c => {
    const lower = c.toLowerCase();
    return !['#fff', '#ffffff', '#000', '#000000', '#333', '#333333', '#666', '#666666', '#999', '#999999', '#ccc', '#cccccc', '#eee', '#eeeeee', '#f5f5f5', '#fafafa'].includes(lower);
  });

  return filtered.slice(0, 6);
}

/**
 * Extracts potential logo URL from HTML
 */
function extractLogoUrl(html: string, baseUrl: string): string | undefined {
  // Common logo patterns
  const patterns = [
    /src="([^"]*logo[^"]*\.(png|svg|jpg|jpeg|webp))"/i,
    /src="([^"]*brand[^"]*\.(png|svg|jpg|jpeg|webp))"/i,
    /class="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
    /id="[^"]*logo[^"]*"[^>]*src="([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const logoPath = match[1];
      if (logoPath.startsWith('http')) return logoPath;
      if (logoPath.startsWith('//')) return `https:${logoPath}`;
      if (logoPath.startsWith('/')) {
        const url = new URL(baseUrl);
        return `${url.protocol}//${url.host}${logoPath}`;
      }
      return `${baseUrl}/${logoPath}`;
    }
  }

  return undefined;
}

/**
 * Extracts meta tags content
 */
function extractMetaTags(html: string): { title?: string; description?: string; keywords?: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);

  return {
    title: titleMatch?.[1]?.trim(),
    description: descMatch?.[1]?.trim(),
    keywords: keywordsMatch?.[1]?.trim(),
  };
}

/**
 * Cleans HTML for AI analysis (removes scripts, styles, etc.)
 */
function cleanHTMLForAnalysis(html: string): string {
  return html
    // Remove scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove styles
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove SVG content (often icons)
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    // Limit length for AI context
    .substring(0, 15000);
}

/**
 * Main brand scraping function using AI
 */
export async function scrapeBrandFromUrl(url: string): Promise<ScrapeResult> {
  try {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RamonaBot/1.0; +https://cactus.app)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        source_url: url,
      };
    }

    const html = await response.text();

    // Extract basic info
    const meta = extractMetaTags(html);
    const extractedColors = extractColorsFromHTML(html);
    const logoUrl = extractLogoUrl(html, url);
    const cleanedHtml = cleanHTMLForAnalysis(html);

    // Use AI to analyze the content
    const prompt = `Analiza el siguiente contenido HTML de un sitio web y extrae información de marca.

URL: ${url}
Título: ${meta.title || 'No disponible'}
Meta descripción: ${meta.description || 'No disponible'}
Meta keywords: ${meta.keywords || 'No disponible'}
Colores detectados: ${extractedColors.join(', ') || 'Ninguno'}

<html>
${cleanedHtml}
</html>

Responde SOLO con un JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "name": "nombre de la marca/empresa",
  "industry": "industria o sector (ej: tecnología, retail, salud, educación, servicios)",
  "tone": ["array de 2-3 tonos del siguiente listado: professional, friendly, funny, inspiring, formal, casual, educational, provocative, luxurious, minimalist, bold, playful"],
  "colors": ["#hex1", "#hex2", "#hex3 - usa los colores detectados o infiere de la marca"],
  "value_proposition": "propuesta de valor en 1-2 oraciones en español",
  "keywords": ["5-10 palabras clave relevantes para SEO y contenido"],
  "products_services": ["lista de 3-5 productos o servicios principales"],
  "tagline": "eslogan o frase de la marca si existe",
  "audience": {
    "age_range": "rango de edad estimado (ej: 25-45)",
    "interests": "intereses principales de la audiencia",
    "pain_points": "problemas o necesidades que la marca resuelve"
  }
}`;

    const aiResult = await generateContent({
      prompt,
      systemPrompt: 'Eres un experto en análisis de marcas y marketing. Extraes información precisa de sitios web para crear perfiles de marca.',
    });
    const aiResponse = aiResult.content;

    // Parse AI response
    let parsedData: ScrapedBrandData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return {
        success: false,
        error: 'Failed to parse brand analysis results',
        source_url: url,
      };
    }

    // Merge extracted data with AI analysis
    const finalData: ScrapedBrandData = {
      ...parsedData,
      colors: parsedData.colors?.length > 0 ? parsedData.colors : extractedColors,
      logo_url: logoUrl,
    };

    return {
      success: true,
      data: finalData,
      source_url: url,
    };

  } catch (error) {
    console.error('Brand scraping error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      source_url: url,
    };
  }
}

/**
 * Analyze multiple URLs and merge brand data
 */
export async function scrapeMultipleSources(urls: string[]): Promise<{
  success: boolean;
  merged_data?: ScrapedBrandData;
  individual_results: ScrapeResult[];
  error?: string;
}> {
  const results = await Promise.all(urls.map(url => scrapeBrandFromUrl(url)));
  const successfulResults = results.filter(r => r.success && r.data);

  if (successfulResults.length === 0) {
    return {
      success: false,
      individual_results: results,
      error: 'No sources could be analyzed successfully',
    };
  }

  // Merge data from multiple sources
  const mergedData: ScrapedBrandData = {
    name: successfulResults[0].data!.name,
    industry: successfulResults[0].data!.industry,
    tone: Array.from(new Set(successfulResults.flatMap(r => r.data!.tone))).slice(0, 4),
    colors: Array.from(new Set(successfulResults.flatMap(r => r.data!.colors))).slice(0, 6),
    value_proposition: successfulResults[0].data!.value_proposition,
    keywords: Array.from(new Set(successfulResults.flatMap(r => r.data!.keywords))).slice(0, 15),
    products_services: Array.from(new Set(successfulResults.flatMap(r => r.data!.products_services))).slice(0, 8),
    tagline: successfulResults.find(r => r.data?.tagline)?.data?.tagline,
    logo_url: successfulResults.find(r => r.data?.logo_url)?.data?.logo_url,
    audience: successfulResults[0].data!.audience,
  };

  return {
    success: true,
    merged_data: mergedData,
    individual_results: results,
  };
}
