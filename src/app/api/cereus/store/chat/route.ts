import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Public chat endpoint for maison chatbot.
 * Loads knowledge base and generates contextual responses.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { maisonId, message, conversationId } = body;

  if (!maisonId || !message) {
    return NextResponse.json({ error: 'maisonId and message required' }, { status: 400 });
  }

  const service = createServiceClient();
  if (!service) return NextResponse.json({ error: 'DB error' }, { status: 500 });

  // Load maison config
  const { data: maison } = await service
    .from('app_clients')
    .select('nombre, config')
    .eq('id', maisonId)
    .single();

  if (!maison) return NextResponse.json({ error: 'Maison not found' }, { status: 404 });

  // Load knowledge base
  const { data: knowledge } = await service
    .from('cereus_chatbot_knowledge')
    .select('title, content, category')
    .eq('maison_id', maisonId)
    .eq('is_active', true);

  // Load some products for product-related queries
  const { data: products } = await service
    .from('cereus_store_products')
    .select('name, price, description, currency, badge')
    .eq('maison_id', maisonId)
    .eq('is_active', true)
    .limit(20);

  const config = maison.config as any;
  const chatbotName = config?.chatbot?.name || 'Asistente';

  // Build knowledge context
  const knowledgeContext = (knowledge || [])
    .map(k => `[${k.category}] ${k.title}:\n${k.content}`)
    .join('\n\n');

  const productContext = (products || [])
    .map(p => `- ${p.name}: ${p.currency || 'PEN'} ${p.price}${p.description ? ' - ' + p.description : ''}`)
    .join('\n');

  // Try to use OpenAI if available, otherwise use smart fallback
  const openaiKey = process.env.OPENAI_API_KEY;

  let reply: string;

  if (openaiKey) {
    try {
      const systemPrompt = `Eres ${chatbotName}, la asistente virtual de ${maison.nombre}.
Eres amable, profesional, y conoces todo sobre la marca.
Respondes en español de manera concisa y util.
Si no sabes algo, ofrece conectar con el equipo de atención al cliente.

CONOCIMIENTO DE LA MARCA:
${knowledgeContext || 'No hay información adicional cargada aún.'}

PRODUCTOS DISPONIBLES:
${productContext || 'No hay productos cargados aún.'}

INFORMACIÓN DE CONTACTO:
- Teléfono: 960 139 383
- Instagram: @privatoficial
- Email: hola@privat.pe`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      reply = data.choices?.[0]?.message?.content || 'Disculpa, no pude procesar tu mensaje. Intenta de nuevo.';
    } catch {
      reply = getFallbackReply(message, maison.nombre, chatbotName);
    }
  } else {
    reply = getFallbackReply(message, maison.nombre, chatbotName);
  }

  // Save conversation
  if (conversationId) {
    const { data: conv } = await service
      .from('cereus_chatbot_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    const messages = [...((conv?.messages as any[]) || []),
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
    ];

    await service
      .from('cereus_chatbot_conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } else {
    const { data: newConv } = await service
      .from('cereus_chatbot_conversations')
      .insert({
        maison_id: maisonId,
        messages: [
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
        ],
      })
      .select('id')
      .single();

    return NextResponse.json({ reply, conversationId: newConv?.id });
  }

  return NextResponse.json({ reply, conversationId });
}

function getFallbackReply(message: string, brandName: string, botName: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('precio') || lower.includes('cuesta') || lower.includes('cost')) {
    return `Los precios de ${brandName} van desde S/320 para camisas clásicas hasta S/1,990 para vestidos de colección. ¿Te interesa alguna prenda en particular?`;
  }
  if (lower.includes('talla') || lower.includes('size') || lower.includes('medida')) {
    return `Nuestras tallas van de XS (hasta 92cm) a XXL (hasta 120cm). Te recomiendo revisar la guía de tallas en la página. Si necesitas medidas exactas, puedes agendar una cita en nuestro atelier al 960 139 383.`;
  }
  if (lower.includes('envio') || lower.includes('delivery') || lower.includes('envío')) {
    return `¡Envío gratis en compras mayores a S/500! Realizamos envíos a todo el Perú. Lima metropolitana en 24-48 horas, provincias en 3-5 días hábiles.`;
  }
  if (lower.includes('devol') || lower.includes('cambio') || lower.includes('return')) {
    return `Aceptamos cambios y devoluciones dentro de los 15 días posteriores a la compra. La prenda debe estar en perfecto estado con sus etiquetas. Contáctanos al 960 139 383 para coordinar.`;
  }
  if (lower.includes('hola') || lower.includes('hey') || lower.includes('buenas')) {
    return `¡Hola! Bienvenida a ${brandName}. Soy ${botName}, tu asistente personal. ¿En qué puedo ayudarte hoy? Puedo informarte sobre colecciones, tallas, envíos o cualquier consulta.`;
  }
  if (lower.includes('coleccion') || lower.includes('colección') || lower.includes('nueva')) {
    return `Nuestra colección más reciente es POSITANO Summer '25, inspirada en la costa italiana. También tenemos Equilibrium y Orígenes. ¿Te gustaría ver alguna en particular?`;
  }
  if (lower.includes('atelier') || lower.includes('cita') || lower.includes('tienda')) {
    return `Puedes agendar una cita en nuestro atelier llamando al 960 139 383. Ofrecemos una experiencia personalizada con asesoría de estilo incluida.`;
  }

  return `Gracias por escribirnos. Puedo ayudarte con información sobre nuestros productos, tallas, envíos, colecciones y más. Si prefieres atención personalizada, llámanos al 960 139 383 o escríbenos a hola@privat.pe.`;
}
