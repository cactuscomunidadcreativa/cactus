# Cactus — Especificación Maestra (todo, con todo)

> Documento único de cómo funciona Cactus de punta a punta: arquitectura, multi-tenant, el
> sistema de agentes (capas, contextualizador, encendido/apagado, consumo, interacciones),
> **la vista de cada uno de los 27 agentes**, y el plan por fases con qué portamos de
> ROWI / CAARD / EGO / Privat. Complementa [docs/cactus-os-roadmap.md].

---

## PARTE 1 — La idea en una frase

Cactus es un **Sistema Operativo de IA para negocios**: cada cliente registra sus **empresas**,
cada empresa tiene un **Cerebro** (memoria viva), **Ramona** coordina, los **agentes-cactus**
ejecutan tareas leyendo solo el contexto autorizado, y todo entregable queda versionado,
medido en créditos y aprendido para la próxima vez.

```
Usuario → Organización → Empresa(Tenant) → Proyecto → Agentes → Entregables
                          └ Cerebro (RAG) · dominios · canales · usuarios(RBAC) · créditos
```

---

## PARTE 2 — Multi-tenant (patrón de ROWI, el mejor)

ROWI ya resuelve esto a nivel producción; **lo portamos casi tal cual** a Supabase.

### Modelo
- **organizations** — la cuenta raíz (puede agrupar varias empresas).
- **companies** (= "tenant") — la empresa: SafePack, Teleperformance, CAARD… Tiene `slug`, branding, `plan_id`, `license_count`, Stripe IDs.
- **memberships** — puente usuario↔empresa con **rol** (`owner/admin/marketing/ventas/legal/ops/invitado/cliente`) y **cuota de tokens** por miembro. `UNIQUE(user_id, company_id)`.
- **users.primary_company_id** — la empresa "activa" (selector de workspace).
- **plans** — `tokens_monthly`, `max_users`, gates de features y **lista de agentes incluidos**.

### Aislamiento (de ROWI `tenantIdsForScope`)
Toda query pasa por un helper que resuelve **a qué empresas puede acceder el usuario** y filtra
`WHERE company_id IN (...)`. Encima, **RLS de Supabase** lo refuerza a nivel base. Doble candado.

```ts
// src/lib/tenant/scope.ts  (porte de ROWI scopedList.ts)
export async function companyIdsForUser(db, userId): Promise<string[]> {
  const { data } = await db.from('memberships').select('company_id').eq('user_id', userId);
  return (data ?? []).map(m => m.company_id);
}
// y RLS: USING (company_id IN (SELECT company_id FROM memberships WHERE user_id = auth.uid()))
```

### Licencias / asientos (de ROWI `seats.ts`)
`license_count` se sincroniza desde Stripe; `available = purchased - members`. `0 = ilimitado` (B2C).

### Migración (aditiva, sin romper)
Hoy todo cuelga de `user_id`. Migración `034`: crea `organizations/companies/memberships/plans`,
agrega `company_id` a `cactus_projects/brand_kits/knowledge_items/deliverables/credit_ledger`,
y crea una org+empresa por defecto por usuario re-parentando lo existente.

---

## PARTE 3 — El Sistema Operativo de Agentes

### 3.1 Tres capas
- **Capa 1 · Maestros (visibles):** **Ramona** (coordina) + **Cerebro** (memoria/RAG).
- **Capa 2 · Especialistas:** los 27 del catálogo (`src/lib/cactus/agents-catalog.ts`).
- **Capa 3 · Sub-agentes (efímeros):** un agente descompone su tarea en sub-tareas con su propio
  prompt/contexto, las ejecuta y consolida. Por eso "miles de agentes".

### 3.2 Registro + encendido/apagado por empresa (patrón ROWI `AgentConfig` + `UserAIControl`)
Cada empresa tiene su **configuración de agentes**: cuáles están **activos**, su **persona/tono**,
modelo preferido y **conocimiento** asignado.

- **agent_configs** (por empresa): `slug, is_active, provider, model, prompt, culture_prompt, company_values, company_tone, industry_context, custom_instructions` + `UNIQUE(slug, company_id)`.
- **user_ai_controls**: cada usuario puede **apagar** agentes puntuales (`feature, enabled`).
- **Gate por plan** (`PLAN_AGENTS`): el plan define qué agentes vienen incluidos; el resto, apagados.

Resolución (de ROWI `resolveAgent`): **organización → empresa → global**; el primero activo gana.
Resultado: un negocio enciende/apaga sus cactus y los **personaliza** (Pitaya "tono formal legal"
para Teleperformance, "cercano" para SafePack) sin tocar código.

#### Delegación entre agentes + gate por agente (clave)
Cada agente es **especialista**. Cuando topa con algo fuera de su especialidad, **no improvisa: delega**
al agente correcto (handoff). Ramona (o el propio agente) decide el handoff.

- Si el agente destino **está activo en el plan** → se suma a la tarea normalmente.
- Si **NO está contratado** → el sistema **frena y ofrece**:
  > *"Esto necesita a **Candelabro (Video)**, que no está en tu plan. ¿Lo activo **solo para esta tarea**
  > (pago puntual: ~X créditos) o lo **sumo a tu plan**?"*

Mecánica: usa `cactus_agent_activations` (ya existe) + `agent_configs.is_active`. Se agrega un modo
**one-shot** (activación por tarea, cobrada en créditos) además de la activación permanente. Así el
catálogo de agentes es también el **upsell**: pruebas un agente puntual y decides sumarlo.

### 3.3 El Contextualizador (porte directo de ROWI `buildAgentPromptContext`)
Antes de cada ejecución se arma el system prompt del agente en **4 capas**, en orden, con tope de
~4000 chars y *best-effort* (si una capa falla, sigue):

1. **Persona del agente** (de `agent_configs`: misión, valores, tono, industria, instrucciones).
2. **Cultura de la empresa** (`ai_culture_configs` por scope con herencia org→empresa→global:
   misión, visión, valores, tono, **directrices** "sí haz" y **restricciones** "no hagas").
3. **Conocimiento del Cerebro (RAG)** — fragmentos recuperados por embeddings, **filtrados por
   scoping de tokens**: cada agente solo ve sus categorías autorizadas.
4. **Personalización por contexto** (`agent_contexts`: ajustes por proyecto/canal).

```
systemPrompt = personaBase
  + "## Cultura del agente\n" + agentCultura
  + "## Cultura de la empresa\n" + empresaCultura
  + "## Conocimiento relevante\n" + ragChunks(scoped)
  + "## Personalización\n" + contextos
```

**Scoping de tokens** (sección 10 de la visión): por agente declaramos categorías permitidas
del Cerebro. El RAG y el contextualizador filtran por ahí → menos costo, menos tokens, menos riesgo.

**Matriz de scoping** (categorías del Cerebro que ve cada agente). Categorías: `brand` (marca/voz),
`product` (catálogo/precios), `audience` (público), `market` (competencia/tendencias), `content`
(piezas/campañas), `ops` (procesos/SOPs), `sales` (CRM/pipeline), `finance` (KPIs/cashflow),
`legal` (contratos), `people` (talento/RRHH), `support` (tickets/FAQs).

| Agente | Categorías que ve | NO ve |
|---|---|---|
| Ramona | todas (coordina) | — |
| Cerebro | todas (es la fuente) | — |
| Biznaga | brand, market, audience | finance, legal, people |
| Pitaya / Pita | brand, product, audience, content | finance, legal, sales |
| Peyote | brand, audience, market, content | finance, legal, people |
| Nopal / Campañas | brand, product, audience, content | finance, legal |
| Cardón/Lente/Candelabro/San Pedro/Garambullo/Pereskia/Ariocarpus/Astrophytum | brand, product, content | finance, legal, sales, people |
| Opuntia / Echinocereus | brand, product, audience, content | finance, legal, people |
| Tuna / Maguey | brand, product, sales, audience | legal, people |
| Agave | finance, sales, ops, product | legal(detalle), people(detalle) |
| Ferocactus / Huernia | legal, product, sales | — (sí ven finanzas/contratos) |
| Aloe | brand, product, support, sales(básico) | finance, legal |
| Ocotillo / Yuca | people, ops | finance, legal, sales |
| Cereus | brand, product, content, sales | legal, finance(detalle) |
| Saguaro | ops + metadatos de todo (no contenido sensible) | finance/legal en detalle |

> Editable por empresa (un negocio puede ampliar/restringir). Es **seguridad + ahorro** a la vez.

### 3.4 Consumo + créditos (ROWI `UsageDaily`/cuotas + EGO control de costo + nuestro wallet/ledger)
- **usage_daily** (por empresa/día/feature/modelo) y **user_usage** (por usuario/día) — tokens in/out, calls, costo USD. `registerUsage()` idempotente.
- **Cuotas:** `plans.tokens_monthly` (0 = ilimitado). Antes de ejecutar se agrega el uso del mes; si
  excede → **402** "renueva tu plan" (engancha con el gate que ya construimos).
- **Créditos Cactus:** `cactus_credit_wallets/ledger` ya existen; el costo real (tokens×precio modelo)
  se convierte a créditos con margen. **Consumo en vivo** por agente y por empresa (vista de Cerebro/Home).
- **Modo ahorro / motor de recursos** (EGO `api/bot`): antes de gastar IA, decide **sin-IA / caché /
  IA barata / IA premium**. Caché de respuestas (EGO `RespuestaCache`) para repetidos = costo 0.

### 3.5 Cómo interactúan los agentes
Topología **estrella con dependencias** (no caos peer-to-peer):

1. Usuario da objetivo → **Ramona** consulta **Cerebro** (RAG) por el contexto de la empresa.
2. Ramona arma el **plan** (qué agentes, en qué orden) → crea **tareas** (`cactus_project_tasks`),
   con **dependencias** entre ellas (ej. Candelabro depende del guion de Pitaya y fotos de Lente).
3. El motor de ejecución corre cada tarea respetando dependencias; para cada una el **contextualizador**
   arma el prompt del agente; el agente ejecuta (puede crear **sub-agentes**) y produce un **entregable**.
4. Los agentes **comparten estado** vía el **Cerebro** (memoria) y el **proyecto** (entregables = workspace
   común). No se "hablan" libremente; **leen** lo que necesitan y Ramona **consolida**.
5. Pasos **sensibles** (publicar/enviar/gastar mucho) **pausan** y piden tu OK (ya implementado).
6. Cada acción registra **consumo** y **trazabilidad** (quién/qué agente/qué modelo/qué contexto/qué versión).

**Dos modos de interacción** (no solo ejecución):
- **A · Ejecución dirigida** (lo de arriba): Ramona reparte tareas, los agentes ejecutan.
- **B · Escalación / alertas** (proactivo): cualquier agente u **observador** que detecta algo
  **levanta una alerta a Ramona** → Ramona evalúa, consulta el Cerebro y **convoca al agente correcto**.
  Ej.: *Aloe detecta un cliente molesto → avisa a Ramona → Ramona mete a Tuna (CRM) y a Yuca (clima/equipo)
  a revisar la situación y propone una acción.* Igual: *Radar ve una noticia → Ramona → Nopal/Pitaya
  para responder.* Esto vive en una tabla **`alerts`** (origen, tipo, severidad, estado) y un bus simple
  donde Ramona es la central. **Los agentes hablan con Ramona; Ramona decide a quién más meter.**

### 3.6 Entregables: versionado + estados
`cactus_deliverables` gana `version` e historial. Estados: **Draft → Review → Approved → Published → Archived**.
Cada corrección crea una versión nueva; Ramona puede actuar de **auditora** antes de entregar
(claridad, coherencia de marca, riesgo legal/reputacional).

### 3.7 Conexiones / Integraciones (UI de administración) — para que los agentes actúen POR el cliente
Cada empresa tiene un **Hub de Conexiones** (vista de administración) donde el cliente conecta sus
cuentas y deja que los agentes publiquen, agenden, respondan y pauten **por él**.

**Categorías** (patrón del Integration Hub de Privat, 10 categorías):
- **Redes:** Facebook, Instagram, LinkedIn, TikTok, X, YouTube, Pinterest, Threads → **Nopal** publica.
- **Ads:** Meta Ads, Google Ads, LinkedIn Ads, TikTok Ads → **Cholla** lanza/optimiza pauta.
- **Google / Productividad:** Calendar (agenda), Drive (docs), Gmail → **Yuca/Saguaro/Aloe**.
- **Comunicación:** WhatsApp Cloud API, Telegram, Slack → **Aloe/Ramona**.
- **Email marketing:** Mailchimp, Brevo, Resend → **Nopal/Pitaya**.
- **Web/Ecommerce:** WordPress, Shopify, Webflow → **Opuntia/Cereus**.
- **CRM:** HubSpot, Salesforce, Pipedrive → **Tuna/Maguey**.
- **Pagos:** Stripe, Mercado Pago, Culqi, Niubiz → checkout/cobros.

**Cómo se conecta (2 modos):**
1. **OAuth** (preferido, y lo que exigen Meta/Google/LinkedIn para publicar): botón **"Conectar con
   [Meta/Google/LinkedIn]"** → el cliente **autoriza en la ventana oficial** → guardamos el **token de
   refresco cifrado**. El cliente **no pega claves**, solo aprueba. Más seguro y cumple las reglas.
2. **API key / token** (para los que lo usan: WhatsApp Cloud token, SMTP, algunos): el cliente pega su
   credencial en un campo seguro.

**Seguridad (importante):**
- Las credenciales se guardan **cifradas** (`connections.secret_enc`, patrón de `cactus_api_keys.key_enc`
  que ya existe). **Nunca en texto plano**, nunca expuestas al frontend.
- **Por empresa** y **compartidas solo por los agentes autorizados** (Ramona administra; el scoping define
  qué agente usa qué conexión).
- **El propio cliente conecta sus cuentas** (OAuth/clave) — el sistema solo guarda y usa los tokens.
- **Estado** por conexión: conectado / parcial / vacío + **test** de conexión (como Privat).

**Qué habilita:** con las conexiones, los agentes ejecutan **en el mundo real**: Nopal **publica** en
IG/FB/LinkedIn (programado), Cholla **lanza pauta**, Yuca **agenda** en Calendar, Aloe **responde** por
WhatsApp/email. Todo **paso sensible (publicar/enviar/gastar) pausa y pide tu OK** (patrón ya implementado).

**Tablas:** `connections` (company_id, provider, kind=oauth|apikey, secret_enc, status, scopes, meta) +
`channels` (comunicación). **Porte:** Integration Hub de Privat + WhatsApp/email/pagos de los 4 repos.

---

## PARTE 4 — La vista de CADA agente

Patrones (de las 29 vistas): **A** = workspace unificado · **B** = app dedicada (sidebar propio) ·
**C** = vista de proyecto (chat + contenido + preview). Todas se montan sobre `AgentAppShell`
(sidebar + header + KPIs + hero + acciones) o el workspace de Ramona.

| Agente | Vista | Patrón | Qué muestra su vista | Datos / tablas | Integra | Habla con |
|---|---|---|---|---|---|---|
| **Ramona** · Coordinadora | 2 | Workspace | Hero + tabs (Conversación/Tareas/Proyectos/Agenda/Actividad) + entregables + agentes activos | projects, tasks, messages, deliverables | todas | **todos** |
| **Cerebro** · Knowledge Hub | 27 | Plataforma | KPIs conocimiento + Brand Kit + documentos + integraciones | brand_kits, knowledge_items, chunks(RAG) | Drive/Notion/URLs | alimenta a **todos** |
| **Biznaga** · Market Intel | 1 | Workspace | Investigación, fuentes, insights, benchmark, reporte | research, sources | Web/Perplexity | Peyote, Pitaya, Echinocereus |
| **Agave** · BI | 6 | Workspace/App | KPIs, forecast, cashflow, dashboards | finance, kpis | Sheets/ERP/PowerBI | Maguey, Tuna, Ramona |
| **Tuna** · CRM | 24/25 | App | Pipeline, contactos, oportunidades, ingresos, actividad | crm_contacts, deals | HubSpot/Salesforce/WhatsApp | Maguey, Aloe, Agave |
| **Maguey** · Ventas | 15 | App | Pipeline de ventas, propuestas, conversión, ranking | deals, proposals | Tuna, Ferocactus | Tuna, Pita, Ferocactus |
| **Pita** · Presentaciones | 26 | Proyecto | Concepto→estructura→storytelling→visuales→deck (PPTX) | deliverables(deck) | Slides/PPTX/Canva API | Pitaya, Peyote, Maguey |
| **Pitaya** · Copy | 21 | Proyecto | Chat + tarjetas de copy (ads/email/landing) + preview | deliverables(copy) | Brand Kit, Biznaga | Peyote, Nopal, Pita |
| **Peyote** · Estrategia·EQ | 20 | App | Ángulo emocional, conceptos, pipeline creativo, métricas | campaigns, concepts | Motor EQ (ROWI) | dirige a Pitaya/Cardón/Nopal/Lente |
| **Nopal** · Social Media | 16 | App | Grillas, calendario, engagement por red, top posts | social_posts, schedule | Meta/IG/TikTok/LinkedIn/Buffer | Pitaya, Cardón, Echinocereus |
| **Cholla** · Campañas & Performance *(nuevo)* | — | App | Lanzar y **optimizar** pauta (Meta/Google/LinkedIn/TikTok Ads), presupuesto, ROAS, A/B, optimización | campaigns, ad_sets, ad_metrics | Meta/Google/LinkedIn/TikTok Ads | Peyote(estrategia), Pitaya(copy), Cardón(arte), Nopal(orgánico), Agave(ROI) |
| **Cardón** · Diseño | (studio) | App | Branding, layouts, carruseles, banners, export | assets | GPT-Image/Firefly | Nopal, Pita, San Pedro |
| **Lente** · Fotografía | 3 | Workspace | Moodboard, shotlist, producto/e-commerce, sesión | assets(photo) | GPT-Image/Midjourney | Cereus, Candelabro, Ariocarpus |
| **Candelabro** · Video | 4 | Workspace | Storyboard, clips, render, timeline, export | assets(video) | Kling/Runway/Veo | Pitaya(guion), Lente(fotos), Garambullo(voz) |
| **San Pedro** · Animación | 23 | Proyecto | Review de animación, versiones, aprobaciones | assets(motion) | Runway/Kling/Luma | Cardón, Candelabro, Astrophytum |
| **Garambullo** · Voz | 13 | App | Locución, podcast, biblioteca de voces, analítica | assets(audio) | ElevenLabs/OpenAI TTS | Candelabro, Ariocarpus |
| **Pereskia** · Música | 19 | App | Producción musical, pistas, entregas, calendario | assets(audio) | Suno/Udio/Lyria | Candelabro |
| **Ariocarpus** · Avatares | 7 | Workspace | Avatar/influencer, variaciones, voz, expresiones | avatars | GPT-Image/Kling/Veo | Lente, Candelabro, San Pedro, Garambullo |
| **Astrophytum** · Personajes | 9 | App | Mascotas, personajes, universo de marca, story bibles | characters | GPT-Image/Midjourney | San Pedro, Cardón |
| **Opuntia** · Web Builder | 5/17 | App | Landings, sitios, funnels, analítica web, plantillas | sites, pages | Next/CMS/checkout | Echinocereus, Pitaya |
| **Echinocereus** · SEO | 11 | App | Keywords, rankings, tráfico, contenidos, técnico | seo_keywords, rankings | Opuntia, Biznaga | Opuntia, Pitaya, Nopal |
| **Cereus** · Moda/Producto | 10 | App | Ventas, productos, clientes, colecciones, **costeo** | products, orders, costing | Lente, Ariocarpus, Opuntia | Lente, Nopal, Opuntia |
| **Aloe** · Soporte | 8 | Workspace(ticket) | Tickets, conversación, FAQs, postventa | tickets, channels | WhatsApp/Gmail/Helpdesk | Tuna, Ramona |
| **Ocotillo** · Talento | 18 | App | Pipeline de selección, entrevistas, evaluaciones | candidates | LinkedIn/ATS/Calendar | Huernia, Ramona |
| **Yuca** · Productividad | (weekflow) | App | Metas, foco, hábitos, capacitación, rutinas | habits, goals | Calendar/WeekFlow | Saguaro, Ramona |
| **Huernia** · Legal | 14 | App | Expedientes, contratos, riesgos, compliance, alertas | legal_docs, expedientes | Docs/Ferocactus | Ferocactus, Ocotillo |
| **Ferocactus** · Contratos | 12 | App | Cotizaciones, contratos, términos, documentos (docx) | contracts | docxtemplater/Drive | Maguey, Huernia |
| **Saguaro** · Workflow/BPM | 22 | App | Flujos, automatizaciones, aprobaciones, equipo | workflows, runs | Make/n8n/Slack | **coordina** procesos entre agentes |

> Cada app B se compone: `<AgentAppShell agent nav cta credits>` + `<KpiRow>` + cuerpo específico
> + `<QuickActionsBar>`. El cuerpo de cada agente se va construyendo en la Fase G, reutilizando
> los módulos portados (ej. Cereus usa el costing de Privat; Pita el PPTX de ROWI; etc.).

### Observadores (segundo plano, **desde el día 1**)
Corren en background (jobs programados), monitorean y **levantan alertas a Ramona** (modo B de 3.5):

| Observador | Vigila | Dispara |
|---|---|---|
| **Biznaga** | mercado, competidores, keywords | insight / oportunidad |
| **Radar** | noticias, regulaciones, cambios de industria | alerta "te mencionaron / cambió la regla" |
| **Vigía** | redes sociales, reputación | crisis / comentario / tendencia viral |
| **Scout** | licitaciones, RFPs, convocatorias, leads | oportunidad comercial |

Arrancan en **v1 con búsqueda web + jobs (Vercel Cron)** y el bus de alertas; se enriquecen con
integraciones después. No esperan a la Fase G.

### Landing público `/apps` (vitrina de marca)
Además del ecosistema interno, las 28 apps/agentes se muestran en el **landing público**
[`/apps`](https://www.cactuscomunidadcreativa.com/apps) — vitrina de marketing con **sus imágenes/arte
nuevos** (las tarjetas 3:4), descripción, división y CTA para contratarlas/probarlas. Reusa el catálogo
(`agents-catalog.ts`) + las tarjetas del ecosistema, en versión pública (sin login). Tarea de bajo
acoplamiento: se puede hacer en cualquier momento. Pendiente: arte de Cholla (y de los que falten).

### Super dashboard de agentes (cómo se conectan)
Una vista **mapa del ecosistema**: todos los agentes, su **estado** (activo/apagado/en plan), y las
**conexiones** (quién delega a quién, quién depende de quién, quién escala a Ramona). Es el centro de
control: prendes/apagas, ves consumo por agente, y entiendes el flujo de un vistazo. Se construye
sobre la grilla del ecosistema + los datos de `agent_configs` + el grafo de "habla con".

### Saguaro como BPM (el pegamento)
Saguaro modela procesos multiagente como flujos: *"Nueva propuesta → Maguey crea → Pita presenta →
Huernia revisa → cliente aprueba → Ferocactus genera contrato → factura → proyecto"*. Cada paso es
una tarea con su agente; Saguaro orquesta el avance y las aprobaciones.

---

## PARTE 5 — Plan por fases (qué PORTAMOS vs CONSTRUIMOS)

| # | Fase | Portamos (de) | Construimos nuevo |
|---|---|---|---|
| **1** | **A · Multiempresa + RBAC + on/off + consumo + alertas + observadores v1** | tenant/membership/scope, `seats`, AgentConfig+UserAIControl, UsageDaily+cuotas (**ROWI**) · schema multiempresa (**EGO**) | `company_id` · selector de empresa · RLS · panel on/off · **delegación + gate one-shot por agente** · **bus de `alerts` + escalación a Ramona** · **observadores Radar/Vigía/Scout v1 (web + Cron)** · agente **Cholla (Campañas)** |
| **2** | **B · Cerebro RAG + Contextualizador** | embeddings+chunking+OCR (**CAARD**) · `buildAgentPromptContext` + AiCultureConfig (**ROWI**) · KB editable (**Privat/EGO**) | pgvector en Supabase · **scoping de tokens** |
| **3** | **D · Créditos vivos + motor de recursos** | UsageDaily+cuotas (**ROWI**) · control de costo + caché + reglas (**EGO**) · tracking por proveedor (**Privat**) | UI de consumo vivo · modos ahorro/calidad |
| **4** | **C · Ejecución v2 + entregables** | PPTX (**ROWI**→Pita) · docx (**CAARD**→Ferocactus) · imagen/video/media (**Privat**→Candelabro/Lente/San Pedro/Ariocarpus) · costing (**Privat**→Cereus) | sub-agentes · versionado de entregables |
| **5** | **E · Aprendizaje** | motor emocional/EQ (**ROWI** `src/lib/eq/`) · intent emocional (**Privat**) · recomendación (**Privat**) | feedback→preferencias 4 niveles · skills |
| **6** | **F · Integraciones** | Integration Hub (**Privat**) · WhatsApp/email/pagos (**los 4**) · Drive/Workspace (**CAARD**) | **Hub de Conexiones (UI admin)**: OAuth (Meta/Google/LinkedIn) + API keys, cifrado, por empresa, compartidas por agentes |
| **7** | **G · Apps de agente + marketplace** | UI (**CAARD/Privat**) · Ramona Studio/Canvas/Video (**Privat**) · BotWidget (**EGO**) | 28 vistas sobre el shell · **super dashboard de conexiones** · marketplace de agentes |

Cada fase: **portar → adaptar a Supabase/empresa → verificar → desplegar**. Único costo real de
portar: traducir acceso a datos **Prisma/Neon → Supabase** (la lógica TS porta casi tal cual).

---

## PARTE 6 — Lenguaje Cactus "en acción y en imagen" (transversal)

Capa de marca que recorre todo:
- **Estados animados por agente** (extendemos el motor de Ramona: idle/pensando/hablando/celebrando)
  a los 27 — ya tenemos `cactus-float/wiggle` y los avatares.
- **Cactus en acción:** cuando Ramona coordina, ves a los cactus trabajando con progreso real
  ("Biznaga investigando 72%", "Candelabro renderizando…").
- **Imagen viva:** cada agente con su color, expresiones y voz; tarjetas/workspaces "en personaje".
- **Sistema de componentes de personaje** (avatar+estado+color+microcopy) reutilizable en grilla,
  sidebar, workspace, entregables y notificaciones.
- Para producirlo a escala reutilizamos el **Ramona Studio / Canvas / VideoComposer de Privat**.

---

## Resumen de tablas nuevas (Supabase)

`organizations` · `companies` · `memberships` · `plans` · `agent_configs` · `user_ai_controls` ·
`ai_culture_configs` · `agent_knowledge_deployments` · `agent_contexts` · `knowledge_chunks`(pgvector) ·
`usage_daily` · `user_usage` · `domains` · `channels` · `connections`(integraciones) ·
`alerts`(escalación a Ramona) · `agent_activations`(permanente + **one-shot**) ·
`campaigns` · `ad_metrics`(Cholla) · `user_preferences` · `business_preferences` · `agent_feedback` · `skills` ·
(+ `company_id` en `cactus_projects/tasks/messages/deliverables/brand_kits/knowledge_items/credit_ledger`).
