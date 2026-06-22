import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateChat, generateImage, type AIChatMessage } from '@/lib/ai';
import { planFromGoal } from '@/lib/cactus/ramona';
import { getAgent } from '@/lib/cactus/agents-catalog';
import { buildBrandContext } from '@/lib/cactus/brain';
import { estimateCostUsd, usdToCredits } from '@/lib/cactus/credits';
import { getAccessStatus, NO_PLAN_REPLY } from '@/lib/cactus/access';
import { loadOrchestratorState, getTasks, getMessages } from '@/lib/cactus/orchestrator';
import { getActiveCompanyId, getActiveBrandKit } from '@/lib/cactus/companies';
import { getCompanyPlan } from '@/lib/cactus/agent-access';
import { checkQuota, registerUsage } from '@/lib/cactus/usage';
import { persistImage } from '@/lib/cactus/image-store';

export const maxDuration = 60;

const RAMONA_CHAT_SYSTEM = `Eres Ramona, la Coordinadora General de Cactus Comunidad Creativa.
Hablas en español, cálida, concreta y ejecutiva. Coordinas a un equipo de agentes-cactus
para lograr los objetivos del usuario. Responde breve (2-4 frases), con foco en próximos pasos.

MUY IMPORTANTE — la plataforma SÍ ejecuta y produce archivos:
- NUNCA digas que "no puedes generar imágenes/archivos" ni sugieras herramientas externas
  (Canva, Midjourney, DALL·E). Eso está prohibido: tu equipo genera las piezas dentro de Cactus.
- Cuando el usuario pide una imagen/diseño/póster, el equipo lo genera automáticamente y el
  resultado aparece en el panel "Entregables" (a la derecha). Tu trabajo es confirmar que el
  equipo está trabajando e indicar que la pieza saldrá en Entregables.
- Si un paso requiere aprobación (por costo o porque publica algo), pídele al usuario que lo
  apruebe en el panel de "Agentes activos".
- No prometas tiempos exactos ni digas "generando ahora, dame un momento" si no se está
  ejecutando; mejor di que el equipo ya está en ello y que verá el resultado en Entregables.

SÉ RESOLUTIVA Y FLUIDA (lo más importante):
- Cuando te piden algo, HAZLO. No interrogues. Asume valores por defecto razonables
  (formato según el canal, estilo y paleta de la marca, tono de marca) y dilos en UNA línea.
- Haz como MÁXIMO una pregunta, y solo si es imprescindible para no equivocarte. Si puedes
  asumir, asume y entrega; el usuario te corrige después.
- Evita listas largas de opciones y confirmaciones tipo "¿con cuál arrancamos?". Avanza tú.
- Si piden una imagen/diseño, ya se generó automáticamente: NO pidas más datos, solo avisa
  que está en Entregables y ofrece ajustarla.`;

export async function POST(req: Request) {
  const supabase = await createClient();

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }); }
  const message: string = (body?.message || '').toString().trim();
  const newProject: boolean = !!body?.newProject;
  if (!message) return NextResponse.json({ error: 'Falta el mensaje.' }, { status: 400 });

  // ── Dev sin Supabase: orquesta en memoria (sin persistir) ──
  if (!supabase) {
    const plan = await planFromGoal({ goal: message, brand: null });
    return NextResponse.json({
      ephemeral: true,
      reply: plan.summary || 'Voy a coordinar a los agentes para esto.',
      plan,
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Gate: plan activo (suscripción O créditos). Si no, Ramona no trabaja. ──
  const access = await getAccessStatus(supabase, user);
  if (!access.allowed) {
    return NextResponse.json({ blocked: true, reason: 'no_plan', reply: NO_PLAN_REPLY, upgradeHref: '/packs' });
  }

  // Empresa activa (multiempresa). null si aún no se despliega → comportamiento previo.
  const companyId = await getActiveCompanyId(supabase, user.id);

  // Cuota del plan (Acción 4): si el mes excede tokens_monthly → 402
  if (companyId && !access.byok) {
    const plan = await getCompanyPlan(supabase, companyId);
    const quota = await checkQuota(supabase, companyId, plan.tokens_monthly);
    if (quota.over) {
      return NextResponse.json({
        blocked: true, reason: 'quota', upgradeHref: '/packs',
        reply: 'Llegaste al tope de tokens de tu plan este mes. Sube de plan o recarga para que el equipo siga. 🌵',
      }, { status: 402 });
    }
  }

  // Marca de la empresa activa para contexto
  const brand = await getActiveBrandKit(supabase, user.id, companyId);

  // ── Resolver proyecto activo (o crear uno) ──
  let projectId: string | null = body?.projectId || null;
  if (!projectId && !newProject) {
    let aq = supabase
      .from('cactus_projects')
      .select('id').eq('user_id', user.id).eq('is_active', true);
    if (companyId) aq = aq.eq('company_id', companyId);
    const { data: active } = await aq
      .order('updated_at', { ascending: false }).limit(1).maybeSingle();
    projectId = active?.id || null;
  }

  if (!projectId) {
    // Desactiva el proyecto activo previo (de esta empresa) y crea uno nuevo
    let dq = supabase.from('cactus_projects').update({ is_active: false }).eq('user_id', user.id).eq('is_active', true);
    if (companyId) dq = dq.eq('company_id', companyId);
    await dq;
    const { data: created, error } = await supabase
      .from('cactus_projects')
      .insert({ user_id: user.id, name: message.slice(0, 60), objective: message, status: 'active', is_active: true, brand_kit_id: brand?.id || null, ...(companyId ? { company_id: companyId } : {}) })
      .select('id').single();
    if (error || !created) return NextResponse.json({ error: 'No se pudo crear el proyecto. ¿Aplicaste la migración 033?' }, { status: 500 });
    projectId = created.id;
  }

  if (!projectId) return NextResponse.json({ error: 'No se pudo resolver el proyecto.' }, { status: 500 });

  // Persiste el mensaje del usuario
  await supabase.from('cactus_project_messages').insert({ user_id: user.id, project_id: projectId, role: 'user', content: message, ...(companyId ? { company_id: companyId } : {}) });

  // ── Pedido directo de imagen: genera AHORA y la pone en Entregables ────────
  const wantsImage =
    /\b(imagen|im[aá]genes|ilustraci[oó]n|p[oó]ster|poster|gr[aá]fic|arte|dise[ñn]o|portada|banner|story|stories|foto|avatar|logo|mascota|personaje|flyer|mockup|dibujo|sticker)\b/i.test(message) &&
    /\b(mu[eé]stra|mu[eé]strame|ver|dame|genera|generar|haz|hazme|crea|crear|cre[aá]me|quiero|necesito|p[oó]n|dibuja|dise[ñn]a|el archivo|la imagen)\b/i.test(message);
  if (wantsImage) {
    try {
      const { data: priors } = await supabase
        .from('cactus_deliverables')
        .select('agent_slug, title, content')
        .eq('project_id', projectId).eq('status', 'ready')
        .order('created_at', { ascending: true }).limit(8);
      const ctx = (priors || [])
        .filter((p: any) => (p.content || '').trim())
        .map((p: any) => `[${getAgent(p.agent_slug)?.name || p.agent_slug}] ${(p.content || '').slice(0, 700)}`)
        .join('\n\n');
      const imgPrompt = `${message}${brand?.name ? ` para la marca ${brand.name}` : ''}. Alta calidad, composición limpia, listo para usar.${ctx ? `\n\nConcepto y copy ya definidos por el equipo (respétalos, incluido el texto literal si va incrustado):\n${ctx}` : ''}`;
      const img = await generateImage({ prompt: imgPrompt, size: '1024x1024', quality: 'standard' });
      // Re-sube a Storage: la URL de OpenAI es temporal (~1h) y se rompería en Entregables.
      const permanentUrl = await persistImage(img.url, { scope: companyId, slug: 'cardon' });
      const credits = usdToCredits(estimateCostUsd({ model: 'gpt-image', images: 1 }));
      await supabase.from('cactus_deliverables').insert({
        user_id: user.id, project_id: projectId, agent_slug: 'cardon',
        title: message.slice(0, 80), kind: 'image', status: 'ready',
        content: img.revisedPrompt || '', url: permanentUrl, ...(companyId ? { company_id: companyId } : {}),
      });
      const reply = '¡Listo! Generé la imagen y ya está en tu panel de Entregables (arriba a la derecha). Si quieres ajustes, dímelos. 🌵';
      await supabase.from('cactus_project_messages')
        .insert({ user_id: user.id, project_id: projectId, role: 'assistant', content: reply, credits, ...(companyId ? { company_id: companyId } : {}) });
      const state = await loadOrchestratorState(supabase, user.id, companyId);
      return NextResponse.json({ state });
    } catch { /* si falla, sigue al flujo normal de chat/plan */ }
  }

  // ¿Ya hay tareas? Si no, Ramona arma el plan y lo persiste.
  const existingTasks = await getTasks(supabase, projectId);

  try {
    if (existingTasks.length === 0) {
      const plan = await planFromGoal({ goal: message, brand: brand || null });

      if (plan.steps.length) {
        await supabase.from('cactus_project_tasks').insert(
          plan.steps.map((s, i) => ({
            user_id: user.id, project_id: projectId, agent_slug: s.agentSlug,
            action: s.action, status: 'pending', progress: 0, order_index: i,
            ...(companyId ? { company_id: companyId } : {}),
          }))
        );
      }
      // Afina nombre/resumen del proyecto con la intención del plan
      await supabase.from('cactus_projects')
        .update({ name: plan.intent || message.slice(0, 60), summary: plan.summary || null })
        .eq('id', projectId);

      const reply = plan.summary
        ? `¡Perfecto! ${plan.summary} Voy a coordinar a ${plan.steps.length} agente${plan.steps.length === 1 ? '' : 's'} para lograrlo.`
        : 'Voy a coordinar a los agentes adecuados para esto.';

      await supabase.from('cactus_project_messages')
        .insert({ user_id: user.id, project_id: projectId, role: 'assistant', content: reply, plan, ...(companyId ? { company_id: companyId } : {}) });
    } else {
      // Seguimiento conversacional con historial
      const history = await getMessages(supabase, projectId);
      // Solo los últimos turnos: evita que respuestas viejas (p. ej. "usa Canva")
      // sesguen a Ramona a repetir el mismo error.
      const messages: AIChatMessage[] = history.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const system = `${RAMONA_CHAT_SYSTEM}\n\n${buildBrandContext(brand || null) || ''}`;

      const res = await generateChat({ messages, systemPrompt: system, maxTokens: 800, temperature: 0.7 });
      const credits = usdToCredits(estimateCostUsd({
        model: res.provider === 'claude' ? 'claude' : res.provider === 'gemini' ? 'gemini' : 'gpt',
        inputTokens: res.inputTokens, outputTokens: res.outputTokens,
      }));

      await registerUsage(supabase, {
        companyId, userId: user.id, agentSlug: 'ramona', model: res.provider,
        tokensIn: res.inputTokens, tokensOut: res.outputTokens, credits,
      });

      await supabase.from('cactus_project_messages')
        .insert({ user_id: user.id, project_id: projectId, role: 'assistant', content: res.content, credits, ...(companyId ? { company_id: companyId } : {}) });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error coordinando' }, { status: 500 });
  }

  // Devuelve el estado completo actualizado
  const state = await loadOrchestratorState(supabase, user.id, companyId);
  return NextResponse.json({ state });
}
