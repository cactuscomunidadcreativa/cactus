import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  calcularPrecioCompleto,
  simularDescuento,
  clasificarPrecio,
  formatearPrecio,
  formatearPorcentaje,
  getEmojiForCategory,
  DEFAULT_MARGIN_RANGES,
  type MarginRange,
} from '@/modules/agave/lib/pricing-engine';

// Minimal AI system prompt - only for interpretation
const AGAVE_INTERPRETER_PROMPT = `Eres AGAVE, un asistente de pricing. Tu UNICO trabajo es interpretar la pregunta del usuario y extraer datos.

IMPORTANTE: NO hagas calculos. Solo extrae los datos de la pregunta.

Responde SIEMPRE en JSON con este formato:
{
  "tipo": "precio" | "simulacion" | "busqueda" | "conversacion",
  "datos": {
    "costo": numero o null,
    "precio": numero o null,
    "descuento": numero o null,
    "producto": string o null,
    "ventasMensuales": numero o null
  },
  "mensaje": "respuesta amigable si es conversacion general"
}

EJEMPLOS:
- "A cuanto vendo si mi costo es 7 dolares?" → {"tipo":"precio","datos":{"costo":7}}
- "Que pasa si doy 15% de descuento a un precio de 10?" → {"tipo":"simulacion","datos":{"precio":10,"descuento":15}}
- "Busca FLORAFIL" → {"tipo":"busqueda","datos":{"producto":"FLORAFIL"}}
- "Hola como estas?" → {"tipo":"conversacion","mensaje":"Hola! Soy AGAVE..."}

Responde SOLO el JSON, nada mas.`;

// Try to parse numbers from text
function extractNumber(text: string): number | null {
  // Remove currency symbols and whitespace
  const cleaned = text.replace(/[$€S\/]/g, '').replace(/,/g, '.').trim();
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

// Check if message is a simple price query
function isSimplePriceQuery(message: string): { isSim: boolean; costo?: number; descuento?: number; precio?: number } {
  const msg = message.toLowerCase();

  // Pattern: "costo es X" or "costo X" or "mi costo es $X"
  const costoMatch = msg.match(/costo\s*(?:es\s*)?(?:de\s*)?\$?(\d+\.?\d*)/);
  if (costoMatch) {
    return { isSim: false, costo: parseFloat(costoMatch[1]) };
  }

  // Pattern: "X% de descuento" or "descuento del X%"
  const descuentoMatch = msg.match(/(\d+\.?\d*)\s*%?\s*(?:de\s*)?descuento|descuento\s*(?:del?\s*)?(\d+\.?\d*)\s*%?/);
  const precioMatch = msg.match(/precio\s*(?:es\s*)?(?:de\s*)?\$?(\d+\.?\d*)/);

  if (descuentoMatch && precioMatch) {
    const descuento = parseFloat(descuentoMatch[1] || descuentoMatch[2]);
    const precio = parseFloat(precioMatch[1]);
    return { isSim: true, descuento, precio };
  }

  return { isSim: false };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Error de conexion' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      clientId,
      demoMode = false,
      idioma = 'es',
    } = body;

    // Get client config if provided
    let rangos: MarginRange[] = DEFAULT_MARGIN_RANGES;
    let margenObjetivo = 0.27;
    let moneda = 'USD';
    let mensajes: any = null;
    let nombreContacto = '';
    let products: any[] = [];

    if (clientId && !demoMode) {
      // Get client config
      const { data: client } = await supabase
        .from('agave_clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (client) {
        if (client.rangos_margen) rangos = client.rangos_margen as MarginRange[];
        if (client.margen_objetivo) margenObjetivo = parseFloat(client.margen_objetivo);
        if (client.moneda) moneda = client.moneda;
        if (client.mensajes) mensajes = client.mensajes;
      }

      // Get user's contact name
      const { data: clientUser } = await supabase
        .from('agave_client_users')
        .select('nombre_contacto')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .single();

      if (clientUser?.nombre_contacto) {
        nombreContacto = clientUser.nombre_contacto;
      }

      // Get products for this client
      const { data: clientProducts } = await supabase
        .from('agave_products')
        .select('id, codigo, nombre, costo_fob, costo_cif, costo_internado, costo_puesto_cliente')
        .eq('client_id', clientId)
        .eq('activo', true)
        .limit(100);

      if (clientProducts) {
        products = clientProducts;
      }
    }

    // STEP 1: Try to handle without AI
    const simpleQuery = isSimplePriceQuery(message);

    // Handle simple price calculation (NO AI)
    if (simpleQuery.costo && !simpleQuery.isSim) {
      const calculation = calcularPrecioCompleto(simpleQuery.costo, margenObjetivo, rangos);
      const emoji = getEmojiForCategory(calculation.categoriaObjetivo);

      const responseMessage = idioma === 'es'
        ? `Para un costo de ${formatearPrecio(simpleQuery.costo, moneda)}, te recomiendo:\n\n${emoji} **Precio recomendado:** ${formatearPrecio(calculation.precioRecomendado, moneda)} (margen ${formatearPorcentaje(margenObjetivo)})\n\n**Otros niveles:**\n- Mínimo: ${formatearPrecio(calculation.precioMinimo, moneda)}\n- Óptimo: ${formatearPrecio(calculation.precioOptimo, moneda)}\n- Premium: ${formatearPrecio(calculation.precioPremium, moneda)}`
        : `For a cost of ${formatearPrecio(simpleQuery.costo, moneda)}, I recommend:\n\n${emoji} **Recommended price:** ${formatearPrecio(calculation.precioRecomendado, moneda)} (margin ${formatearPorcentaje(margenObjetivo)})\n\n**Other levels:**\n- Minimum: ${formatearPrecio(calculation.precioMinimo, moneda)}\n- Optimal: ${formatearPrecio(calculation.precioOptimo, moneda)}\n- Premium: ${formatearPrecio(calculation.precioPremium, moneda)}`;

      return NextResponse.json({
        message: responseMessage,
        data: {
          tipo: 'precio',
          datos: calculation,
        },
        usedAI: false,
      });
    }

    // Handle simple discount simulation (NO AI)
    if (simpleQuery.isSim && simpleQuery.descuento && simpleQuery.precio) {
      // Need cost for simulation - assume cost based on target margin if not provided
      const estimatedCost = simpleQuery.precio * (1 - margenObjetivo);
      const simulation = simularDescuento(
        simpleQuery.precio,
        estimatedCost,
        simpleQuery.descuento,
        0,
        rangos
      );

      const emoji = getEmojiForCategory(simulation.categoriaResultante);
      const responseMessage = idioma === 'es'
        ? `${emoji} Con ${simpleQuery.descuento}% de descuento:\n\n**Precio original:** ${formatearPrecio(simpleQuery.precio, moneda)}\n**Precio con descuento:** ${formatearPrecio(simulation.precioConDescuento, moneda)}\n**Margen resultante:** ${simulation.margenResultante}%\n**Categoría:** ${simulation.categoriaResultante}\n\n**${simulation.recomendacion}**`
        : `${emoji} With ${simpleQuery.descuento}% discount:\n\n**Original price:** ${formatearPrecio(simpleQuery.precio, moneda)}\n**Discounted price:** ${formatearPrecio(simulation.precioConDescuento, moneda)}\n**Resulting margin:** ${simulation.margenResultante}%\n**Category:** ${simulation.categoriaResultante}\n\n**${simulation.recomendacion}**`;

      return NextResponse.json({
        message: responseMessage,
        data: {
          tipo: 'simulacion',
          datos: simulation,
        },
        usedAI: false,
      });
    }

    // STEP 2: For complex queries, use minimal AI just to interpret
    // Get API key from config
    const { data: configData } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'anthropic_api_key')
      .single();

    const apiKey = configData?.value || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // No API key - return a helpful message
      return NextResponse.json({
        message: idioma === 'es'
          ? 'Disculpa, no pude entender tu pregunta. Intenta algo como "A cuánto vendo si mi costo es $7?" o "Qué pasa si doy 10% de descuento?"'
          : 'Sorry, I couldn\'t understand your question. Try something like "What price should I set if my cost is $7?" or "What happens if I give a 10% discount?"',
        usedAI: false,
      });
    }

    const anthropic = new Anthropic({ apiKey });

    // Build product context for AI
    let productContext = '';
    if (products.length > 0) {
      productContext = '\n\nPRODUCTOS DISPONIBLES:\n' +
        products.slice(0, 20).map(p =>
          `- ${p.nombre}${p.codigo ? ` (${p.codigo})` : ''}: CIF ${p.costo_cif || 'N/A'}`
        ).join('\n');
    }

    // Use AI only for interpretation
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: AGAVE_INTERPRETER_PROMPT + productContext,
      messages: [{ role: 'user', content: message }],
    });

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Try to parse AI response as JSON
    let parsed: any = null;
    try {
      // Clean the response - remove markdown if present
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      // AI response wasn't valid JSON - return as conversation
      return NextResponse.json({
        message: aiResponse || (idioma === 'es' ? 'No entendí tu pregunta. ¿Puedes reformularla?' : 'I didn\'t understand your question. Can you rephrase it?'),
        usedAI: true,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      });
    }

    // STEP 3: Use parsed data for calculations (NO AI for math)
    if (parsed.tipo === 'precio' && parsed.datos?.costo) {
      const calculation = calcularPrecioCompleto(parsed.datos.costo, margenObjetivo, rangos);
      const emoji = getEmojiForCategory(calculation.categoriaObjetivo);

      const productName = parsed.datos.producto || '';
      const responseMessage = idioma === 'es'
        ? `${productName ? `Para **${productName}** con ` : 'Para un '}costo de ${formatearPrecio(parsed.datos.costo, moneda)}:\n\n${emoji} **Precio recomendado:** ${formatearPrecio(calculation.precioRecomendado, moneda)} (margen ${formatearPorcentaje(margenObjetivo)})\n\n**Otros niveles:**\n- Mínimo: ${formatearPrecio(calculation.precioMinimo, moneda)}\n- Óptimo: ${formatearPrecio(calculation.precioOptimo, moneda)}\n- Premium: ${formatearPrecio(calculation.precioPremium, moneda)}`
        : `${productName ? `For **${productName}** with ` : 'For a '}cost of ${formatearPrecio(parsed.datos.costo, moneda)}:\n\n${emoji} **Recommended price:** ${formatearPrecio(calculation.precioRecomendado, moneda)} (margin ${formatearPorcentaje(margenObjetivo)})\n\n**Other levels:**\n- Minimum: ${formatearPrecio(calculation.precioMinimo, moneda)}\n- Optimal: ${formatearPrecio(calculation.precioOptimo, moneda)}\n- Premium: ${formatearPrecio(calculation.precioPremium, moneda)}`;

      return NextResponse.json({
        message: responseMessage,
        data: {
          tipo: 'precio',
          datos: calculation,
        },
        usedAI: true,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      });
    }

    if (parsed.tipo === 'simulacion' && parsed.datos?.precio && parsed.datos?.descuento) {
      const costo = parsed.datos.costo || (parsed.datos.precio * (1 - margenObjetivo));
      const simulation = simularDescuento(
        parsed.datos.precio,
        costo,
        parsed.datos.descuento,
        parsed.datos.ventasMensuales || 0,
        rangos
      );

      const emoji = getEmojiForCategory(simulation.categoriaResultante);
      const responseMessage = idioma === 'es'
        ? `${emoji} Con ${parsed.datos.descuento}% de descuento:\n\n**Precio original:** ${formatearPrecio(parsed.datos.precio, moneda)}\n**Precio con descuento:** ${formatearPrecio(simulation.precioConDescuento, moneda)}\n**Margen resultante:** ${simulation.margenResultante}%\n**Categoría:** ${simulation.categoriaResultante}\n\n**${simulation.recomendacion}**`
        : `${emoji} With ${parsed.datos.descuento}% discount:\n\n**Original price:** ${formatearPrecio(parsed.datos.precio, moneda)}\n**Discounted price:** ${formatearPrecio(simulation.precioConDescuento, moneda)}\n**Resulting margin:** ${simulation.margenResultante}%\n**Category:** ${simulation.categoriaResultante}\n\n**${simulation.recomendacion}**`;

      return NextResponse.json({
        message: responseMessage,
        data: {
          tipo: 'simulacion',
          datos: simulation,
        },
        usedAI: true,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      });
    }

    if (parsed.tipo === 'busqueda' && parsed.datos?.producto) {
      // Search for product in client's products
      const searchTerm = parsed.datos.producto.toLowerCase();
      const found = products.find(p =>
        p.nombre.toLowerCase().includes(searchTerm) ||
        (p.codigo && p.codigo.toLowerCase().includes(searchTerm))
      );

      if (found) {
        const costo = found.costo_cif || found.costo_fob || found.costo_internado || found.costo_puesto_cliente;
        if (costo) {
          const calculation = calcularPrecioCompleto(costo, margenObjetivo, rangos);
          const emoji = getEmojiForCategory(calculation.categoriaObjetivo);

          return NextResponse.json({
            message: idioma === 'es'
              ? `Encontré **${found.nombre}**${found.codigo ? ` (${found.codigo})` : ''}:\n\n**Costo:** ${formatearPrecio(costo, moneda)}\n\n${emoji} **Precio recomendado:** ${formatearPrecio(calculation.precioRecomendado, moneda)}\n- Mínimo: ${formatearPrecio(calculation.precioMinimo, moneda)}\n- Óptimo: ${formatearPrecio(calculation.precioOptimo, moneda)}\n- Premium: ${formatearPrecio(calculation.precioPremium, moneda)}`
              : `Found **${found.nombre}**${found.codigo ? ` (${found.codigo})` : ''}:\n\n**Cost:** ${formatearPrecio(costo, moneda)}\n\n${emoji} **Recommended price:** ${formatearPrecio(calculation.precioRecomendado, moneda)}\n- Minimum: ${formatearPrecio(calculation.precioMinimo, moneda)}\n- Optimal: ${formatearPrecio(calculation.precioOptimo, moneda)}\n- Premium: ${formatearPrecio(calculation.precioPremium, moneda)}`,
            data: {
              tipo: 'precio',
              producto: found,
              datos: calculation,
            },
            usedAI: true,
            usage: {
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
            },
          });
        }
      }

      // Product not found
      const notFoundMsg = mensajes?.[idioma]?.sin_productos || mensajes?.es?.sin_productos ||
        (idioma === 'es' ? 'No encontré ese producto. ¿Quieres ver el catálogo completo?' : 'I couldn\'t find that product. Want to see the full catalog?');

      return NextResponse.json({
        message: notFoundMsg,
        usedAI: true,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      });
    }

    // Conversational response
    return NextResponse.json({
      message: parsed.mensaje || (idioma === 'es' ? '¿En qué te puedo ayudar con tus precios?' : 'How can I help you with your pricing?'),
      usedAI: true,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });

  } catch (error: any) {
    console.error('AGAVE chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el chat' },
      { status: 500 }
    );
  }
}
