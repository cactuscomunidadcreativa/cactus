import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { EQ_LATAM_INTERPRETER_PROMPT } from '@/modules/eq-latam/lib/eq-chat-prompt';
import {
  calcularPrecioCert,
  calcularPrecioPack,
  analizarEvento,
  compararMercado,
  compararMercadoCompleto,
  calcularCompDirector,
  getBudgetOverview,
  formatPriceUSD,
  formatPercent,
  getViabilityLabel,
} from '@/modules/eq-latam/lib/eq-pricing-engine';
import { MASTER_PRICE_LIST, ANNUAL_BUDGET } from '@/modules/eq-latam/lib/eq-data';
import type { CertificationId, PackId, Modality, TrainerRole, ChatParsedIntent } from '@/modules/eq-latam/types';

// Quick command regex patterns
function parseQuickCommand(message: string): ChatParsedIntent | null {
  const msg = message.trim().toLowerCase();

  // /precio CERT PAX MODALITY
  const precioMatch = msg.match(/^\/precio\s+(ueq|bpc|eqac|eqpc|eqpm)\s+(\d+)\s*(online|on_demand|grupal|presencial|mt|rf)?/i);
  if (precioMatch) {
    const certId = precioMatch[1].toUpperCase() as CertificationId;
    const pax = parseInt(precioMatch[2]);
    let modality: Modality = pax === 1 ? 'on_demand' : 'group_online';
    const mod = precioMatch[3]?.toLowerCase();
    if (mod === 'mt' || mod === 'presencial') modality = 'in_person_mt';
    if (mod === 'rf') modality = 'in_person_rf';
    const trainerRole: TrainerRole | undefined = modality.startsWith('in_person') ? (mod === 'mt' ? 'MT' : 'RF') : undefined;
    return { tipo: 'precio', datos: { certId, pax, modality, trainerRole } };
  }

  // /evento PACK PAX ROLE
  const eventoMatch = msg.match(/^\/evento\s+(full|ueq_bpc|ueq_eqac|bpc_eqpm|ueq_bpc_eqac|ueq_bpc_eqac_eqpc|eqpc_eqpm|full_5)\s+(\d+)\s*(mt|rf)?/i);
  if (eventoMatch) {
    let packId = eventoMatch[1].toUpperCase() as PackId;
    if (packId === 'FULL' as PackId) packId = 'FULL_5';
    const pax = parseInt(eventoMatch[2]);
    const trainerRole = (eventoMatch[3]?.toUpperCase() || 'RF') as TrainerRole;
    return { tipo: 'evento', datos: { packId, pax, trainerRole } };
  }

  // /gap
  if (msg === '/gap') {
    return { tipo: 'gap', datos: {} };
  }

  // /comparar CERT
  const compararMatch = msg.match(/^\/comparar\s+(ueq|bpc|eqac|eqpc|eqpm)?/i);
  if (compararMatch) {
    const certId = compararMatch[1]?.toUpperCase() as CertificationId | undefined;
    return { tipo: 'comparar', datos: { certId } };
  }

  // /comp_director AMOUNT
  const compDirMatch = msg.match(/^\/comp_director\s+(\d+)/i);
  if (compDirMatch) {
    return { tipo: 'comp_director', datos: { ingresosBrutos: parseInt(compDirMatch[1]) } };
  }

  return null;
}

function buildPrecioResponse(certId: CertificationId, modality: Modality, pax: number, trainerRole?: TrainerRole): string {
  const result = calcularPrecioCert(certId, modality, pax, trainerRole);

  return `**${certId}** | ${pax} PAX | ${modality.replace(/_/g, ' ')}${trainerRole ? ` (${trainerRole})` : ''}

**COSTO REAL:** ${formatPriceUSD(result.costoReal)}/PAX
**PVP MINIMO:** ${formatPriceUSD(result.pvpMinimo)}/PAX (${formatPriceUSD(result.pvpMinimo * pax)} total)
**PVP SUGERIDO (+25%):** ${formatPriceUSD(result.pvpSugerido)}/PAX (${formatPriceUSD(result.totalRevenueSugerido)} total)
**PRECIO PARTNER (-30%):** ${formatPriceUSD(result.precioPartner)}/PAX (${formatPriceUSD(result.totalRevenuePartner)} total)
**6S GLOBAL:** ${formatPriceUSD(result.precio6SGlobal)}/PAX — tu estas ${result.descuentoVsGlobal}% debajo
**NETO 6S (x50%):** ${formatPriceUSD(result.neto6S)}/PAX
${result.viable ? '**VIABLE**' : `**NO VIABLE** — Deficit: ${formatPriceUSD(result.deficit ?? 0)}`}`;
}

function buildEventoResponse(packId: PackId, pax: number, trainerRole: TrainerRole): string {
  const modality: Modality = trainerRole === 'MT' ? 'in_person_mt' : 'in_person_rf';
  const analysis = analizarEvento(packId, modality, pax, trainerRole);

  return `**ANALISIS EVENTO — ${packId.replace(/_/g, ' ')} [${trainerRole}] | ${pax} PAX**

**COSTOS DEL EVENTO:**
  Costo fijo facilitacion: ${formatPriceUSD(analysis.costoFijo)}
  Materiales: ${formatPriceUSD(analysis.costoMateriales)}
  Costo variable: ${formatPriceUSD(analysis.costoVariable)}
  **TOTAL COSTO ENTREGA: ${formatPriceUSD(analysis.costoEntrega)}**

**INGRESOS:**
  PVP Sugerido: ${formatPriceUSD(analysis.ingresoSugerido)}
  Al Partner: ${formatPriceUSD(analysis.ingresoPartner)}

**NETO 6S (x50%):** ${formatPriceUSD(analysis.neto6SSugerido)}
**VIABILIDAD:** ${getViabilityLabel(analysis.viability)}
${analysis.viabilityReason}

**Precio minimo autosustentable:** ${formatPriceUSD(analysis.precioMinimoAutosustentable)}/PAX
**PAX minimo para viabilidad:** ${analysis.paxMinimoParaViabilidad} personas`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // STEP 1: Try quick command parsing
    const quickCmd = parseQuickCommand(message);
    if (quickCmd) {
      return handleParsedIntent(quickCmd);
    }

    // STEP 2: Try simple pattern matching
    const simpleIntent = matchSimplePatterns(message);
    if (simpleIntent) {
      return handleParsedIntent(simpleIntent);
    }

    // STEP 3: Use AI to interpret
    let apiKey = process.env.ANTHROPIC_API_KEY;

    // Try to get API key from Supabase config if not in env
    if (!apiKey) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data: configData } = await supabase
            .from('platform_config')
            .select('value')
            .eq('key', 'anthropic_api_key')
            .single();
          apiKey = configData?.value;
        }
      } catch {
        // Supabase not available, continue with env key only
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        message: 'No pude entender tu pregunta. Intenta con comandos como:\n- /precio EQPC 10 online\n- /evento FULL 10 RF\n- /gap\n- /comparar EQPC',
        usedAI: false,
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: EQ_LATAM_INTERPRETER_PROMPT,
      messages: [{ role: 'user', content: message }],
    });

    const aiResponse = response.content[0].type === 'text' ? response.content[0].text : '';

    let parsed: ChatParsedIntent | null = null;
    try {
      const cleanJson = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json({
        message: aiResponse || 'No entendi tu pregunta. Puedes reformularla?',
        usedAI: true,
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      });
    }

    if (parsed) {
      const result = handleParsedIntent(parsed);
      const resultJson = await result.json();
      return NextResponse.json({
        ...resultJson,
        usedAI: true,
        usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      });
    }

    return NextResponse.json({
      message: 'No pude interpretar tu pregunta. Intenta algo como "Cuanto cobro por EQPC a 10 personas online?"',
      usedAI: true,
    });

  } catch (error: any) {
    console.error('EQ LATAM chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el chat' },
      { status: 500 },
    );
  }
}

function matchSimplePatterns(message: string): ChatParsedIntent | null {
  const msg = message.toLowerCase();

  // "gap" or "cuanto falta"
  if (msg.includes('gap') || msg.includes('cuanto falta') || msg.includes('faltar')) {
    return { tipo: 'gap', datos: {} };
  }

  // "servicios" or "biz" or "impact"
  if (msg.includes('servicio') || msg.includes('biz') || msg.includes('impact') || msg.includes('budget')) {
    return { tipo: 'servicios', datos: {} };
  }

  return null;
}

function handleParsedIntent(intent: ChatParsedIntent): NextResponse {
  const { tipo, datos, mensaje } = intent;

  if (tipo === 'conversacion') {
    return NextResponse.json({
      message: mensaje || 'Hola! Soy el asistente de pricing de EQ Latam. Preguntame sobre precios de certificaciones, viabilidad de eventos, o comparaciones de mercado.',
      usedAI: false,
    });
  }

  if (tipo === 'precio' && datos.certId) {
    const modality = datos.modality || (datos.pax === 1 ? 'on_demand' : 'group_online');
    const pax = datos.pax || 1;
    const msg = buildPrecioResponse(datos.certId, modality, pax, datos.trainerRole);
    const result = calcularPrecioCert(datos.certId, modality, pax, datos.trainerRole);
    return NextResponse.json({ message: msg, data: { tipo: 'precio', payload: result }, usedAI: false });
  }

  if (tipo === 'evento' && datos.packId) {
    const pax = datos.pax || 10;
    const trainerRole = datos.trainerRole || 'RF';
    const msg = buildEventoResponse(datos.packId, pax, trainerRole);
    const modality: Modality = trainerRole === 'MT' ? 'in_person_mt' : 'in_person_rf';
    const result = analizarEvento(datos.packId, modality, pax, trainerRole);
    return NextResponse.json({ message: msg, data: { tipo: 'evento', payload: result }, usedAI: false });
  }

  if (tipo === 'comparar') {
    if (datos.certId) {
      const comp = compararMercado(datos.certId);
      const msg = `**${datos.certId} — Comparacion vs 6S Global**

EQ Latam: ${formatPriceUSD(comp.eqLatamSugerido)}
6S Global: ${formatPriceUSD(comp.global6SOnline)}
Diferencia: ${comp.diferenciaPct}% mas barato
Posicion: ${comp.posicion.replace(/_/g, ' ')}`;
      return NextResponse.json({ message: msg, data: { tipo: 'comparar', payload: comp }, usedAI: false });
    } else {
      const comps = compararMercadoCompleto();
      const lines = comps.map(c =>
        `| ${c.certId} | ${formatPriceUSD(c.eqLatamSugerido)} | ${formatPriceUSD(c.global6SOnline)} | ${c.diferenciaPct}% | ${c.posicion.replace(/_/g, ' ')} |`
      );
      const msg = `**COMPARACION EQ LATAM vs 6S GLOBAL**

| Cert | EQ Latam | 6S Global | Diferencia | Posicion |
|------|----------|-----------|------------|----------|
${lines.join('\n')}`;
      return NextResponse.json({ message: msg, data: { tipo: 'comparar', payload: comps }, usedAI: false });
    }
  }

  if (tipo === 'gap') {
    const budget = getBudgetOverview();
    const msg = `**ANALISIS GAP PRESUPUESTAL**

Costos anuales totales: ${formatPriceUSD(budget.totalCosts)}
Ingresos no-cert: ${formatPriceUSD(budget.totalNonCertIncome)}
**Gap que certs deben cubrir: ${formatPriceUSD(budget.certGap)}**

Desglose ingresos no-cert:
${budget.nonCertIncome.map(s => `- ${s.label}: ${formatPriceUSD(s.amount)}`).join('\n')}`;
    return NextResponse.json({ message: msg, data: { tipo: 'gap', payload: budget }, usedAI: false });
  }

  if (tipo === 'comp_director') {
    const ingresos = datos.ingresosBrutos || 0;
    const comp = calcularCompDirector(ingresos);
    const msg = `**COMPENSACION DIRECTOR**

Ingresos brutos: ${formatPriceUSD(ingresos)}
Retainer fijo: ${formatPriceUSD(comp.retainer)}
Comision (10%): ${formatPriceUSD(comp.comision)}
**Total compensacion: ${formatPriceUSD(comp.total)}**`;
    return NextResponse.json({ message: msg, data: { tipo: 'comp_director', payload: comp }, usedAI: false });
  }

  if (tipo === 'servicios') {
    const budget = getBudgetOverview();
    const msg = `**SERVICIOS EQ BIZ & IMPACT**

${budget.nonCertIncome.map(s => `- **${s.label}:** ${formatPriceUSD(s.amount)}\n  ${s.description}`).join('\n')}

**Total ingresos no-cert: ${formatPriceUSD(budget.totalNonCertIncome)}**`;
    return NextResponse.json({ message: msg, data: { tipo: 'servicios', payload: budget }, usedAI: false });
  }

  // Partner
  if (tipo === 'partner' && datos.packId) {
    const pax = datos.pax || 10;
    const trainerRole = datos.trainerRole || 'RF';
    const modality: Modality = trainerRole === 'MT' ? 'in_person_mt' : 'in_person_rf';
    const packPricing = calcularPrecioPack(datos.packId, modality, pax, trainerRole);
    const partnerName = datos.partnerName || 'Partner';

    const msg = `**PROPUESTA PARA ${partnerName.toUpperCase()}**

**${datos.packId.replace(/_/g, ' ')}** | ${pax} PAX | ${trainerRole}

Precio Partner: ${formatPriceUSD(packPricing.precioPartnerPorPax)}/PAX
Total inversion: ${formatPriceUSD(packPricing.totalPartner)}

Precio publico sugerido: ${formatPriceUSD(packPricing.pvpSugeridoPorPax)}/PAX
Ahorro vs publico: ${formatPercent(0.30)}

Costo entrega: ${formatPriceUSD(packPricing.costoEntregaTotal)}
Viabilidad: ${getViabilityLabel(packPricing.viability)}`;

    return NextResponse.json({ message: msg, data: { tipo: 'partner', payload: packPricing }, usedAI: false });
  }

  return NextResponse.json({
    message: mensaje || 'No entendi tu solicitud. Prueba con /precio EQPC 10 online',
    usedAI: false,
  });
}
