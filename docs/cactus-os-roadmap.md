# Cactus AI Business OS — Plan maestro

> De "ecosistema de agentes" a **Sistema Operativo de IA para negocios**.
> Principio rector: **construir sobre lo que ya existe, no reescribir.**

---

## 0. Cómo lo abordo (3 reglas)

1. **Incremental y desplegable.** Cada fase se construye encima de lo anterior, compila, se verifica y se sube a Vercel. Nada de un "big bang".
2. **Mismo stack, evolucionado.** Seguimos en **Next.js + Supabase (Postgres + pgvector + Storage) + router de IA multi-proveedor que ya tenemos**. No migramos a NestJS/GraphQL/Pinecone (perderíamos meses y lo que ya funciona). La visión los lista como "sugeridos"; pgvector cubre el vector DB dentro de la misma base.
3. **El cimiento primero.** Todo lo demás depende de un modelo **multiempresa**. Esa es la Fase A y bloquea al resto.

---

## 1. Dónde estamos vs. la visión

| Pilar de la visión | Hoy | Falta |
|---|---|---|
| Cerebro guarda conocimiento | Brand Kit + items (texto plano) | **RAG / vector**, por empresa, con scoping de tokens |
| Ramona coordina | ✅ Plan + ejecución híbrida + gate + créditos | Contexto por empresa, auditoría, sub-agentes |
| Agentes ejecutan | ✅ 1 agente → entregable real | Sub-agentes ("mil agentes"), más oficios, integraciones |
| Usuario aprueba | ✅ Aprobación en pasos sensibles | **Versionado** de entregables (Draft→…→Archived) |
| El sistema aprende | ❌ | Feedback → preferencias → skills |
| Multiempresa | ❌ (todo es por-usuario) | **Org → Empresa → Proyecto + RBAC + dominios + canales** |
| Créditos | ✅ wallet + ledger | Consumo en vivo, por agente/empresa, modos, límites admin |
| Integraciones | ❌ (solo Stripe parcial) | Framework de conexiones compartidas |
| Optimización de recursos | ❌ | Motor de decisión IA vs no-IA, modos ahorro/calidad |
| Agentes observadores | ❌ | Biznaga/Radar/Vigía/Scout en segundo plano |
| Marketplace de agentes | ❌ | Crear/publicar/instalar agentes |
| Lenguaje Cactus (acción + imagen) | Parcial (avatares, animaciones) | Identidad viva de cada agente en toda la app |

**Ya construido (Fase 0):** catálogo de 27 agentes, grilla del ecosistema (tarjetas 3:4, animaciones, i18n ES/EN), sidebar con agente activo, **Ramona orquestadora funcional** (`cactus_projects/tasks/messages/deliverables`, plan con LLM, ejecución híbrida, gate suscripción-o-créditos, cobro de créditos), **AgentAppShell** reutilizable, **Home / Cerebro / Precios**. Infra previa: `cactus_brand_kits`, `cactus_knowledge_items`, `cactus_credit_wallets/ledger`, `cactus_api_keys`, `cactus_agent_activations`, `subscriptions`, router de IA (`src/lib/ai`), Stripe, next-intl.

---

## 2. La decisión clave: multi-tenant (Org → Empresa → Proyecto)

Hoy todo cuelga de `user_id`. La visión necesita que cuelgue de la **empresa**:

```
Usuario → Organización → Empresa → Proyecto → Agentes → Entregables
                          (Brand, dominios, canales, usuarios, RBAC, conocimiento)
```

Estrategia (aditiva, sin romper lo que hay):
- Nuevas tablas: `organizations`, `companies`, `memberships` (RBAC: owner/admin/marketing/ventas/legal/ops/invitado/cliente).
- Agregar `company_id` a `cactus_projects`, `cactus_brand_kits`, `cactus_knowledge_items`, `cactus_deliverables`, `cactus_credit_ledger`.
- Migración de datos: crear una org+empresa por defecto para cada usuario y re-parentar lo existente.
- **Selector de empresa** en el header (cambias de SafePack a Teleperformance sin salir).
- `domains` y `channels` por empresa (tablas de la visión).

---

## 3. El Cerebro como RAG (el verdadero diferenciador)

Cada empresa tiene una **memoria viva**. Los agentes consultan el Cerebro *antes* de trabajar.

- `pgvector` en Supabase. Tabla `cactus_knowledge_chunks` (texto + embedding + metadatos + `company_id`).
- **Ingesta:** documentos/URLs/PDF/brand book → chunking → embeddings → índice.
- **Recuperación:** dado un objetivo, se traen los fragmentos relevantes (búsqueda vectorial) y se inyectan en el prompt del agente.
- **Scoping de tokens (sección 10 de la visión):** cada agente recibe **solo su rebanada autorizada** (Pitaya ve marca+producto+público, NO contratos ni finanzas). Reduce costo, tokens, latencia y riesgo.

Esto convierte a "27 chats" en "27 especialistas que conocen tu negocio".

---

## 4. Multiagente: capas + sub-agentes

- **Capa 1 (Maestros, visibles):** Ramona (coordina) + Cerebro (memoria).
- **Capa 2 (Especialistas):** los 27 del catálogo.
- **Capa 3 (Sub-agentes efímeros):** un agente descompone su tarea y crea agentes temporales (Pitaya → Investigador, Storyteller, Copy Email, Copy Ads, Editor). Existen solo para esa tarea → técnicamente "mil agentes".

Implementación: el motor de ejecución (que ya corre 1 tarea→1 entregable) gana **descomposición**: una tarea puede generar sub-tareas con sus propios prompts/contexto, ejecutarse y consolidarse.

---

## 5. Aprendizaje, recursos y créditos

- **Aprendizaje:** feedback tras cada entregable (👍/más corto/otro tono/…) → `user_preferences`, `business_preferences`, `agent_feedback`, por 4 niveles (usuario/negocio/agente/proyecto) → se inyectan en futuros prompts. Patrones repetidos → **Skills** (recetas reutilizables: "Activa el skill de lanzamiento comercial para SafePack").
- **Motor de recursos:** antes de ejecutar, Cactus decide **sin-IA / IA barata / IA premium / multiagente** (sección 7 de la visión). Calcular métricas, filtrar, programar → sin IA. Redactar, analizar, crear → IA. Modos **ahorro** y **calidad máxima**.
- **Créditos vivos:** consumo en tiempo real por agente y por empresa, `model_usage` (tokens, modelo, latencia, costo), límites por admin, compra de paquetes, **trazabilidad total** de cada acción.

---

## 6. Integraciones

Framework de conexiones por empresa, **compartidas por los agentes autorizados** y administradas por Ramona: comunicación (WhatsApp/Telegram/Slack…), email, redes, ads, web (Shopify/WordPress…), productividad, CRM, ecommerce, pagos. Arrancamos por lo que ya tocamos (WhatsApp, email, social, Stripe) y crece como catálogo.

---

## 7. Lenguaje Cactus — en acción y en imagen (transversal)

No es una fase: es la **capa de marca/UX** que recorre todo. Cada agente *actúa* su oficio.
- **Estados animados** por agente (ya existe el motor de Ramona: idle/pensando/hablando/celebrando) extendido a los 27.
- **Imagen viva:** el cactus de cada agente con expresiones, su color, su voz; tarjetas y workspaces "en personaje".
- **Cactus en acción:** cuando Ramona coordina, ves a los cactus trabajando (avatares con progreso, "Biznaga investigando…", "Candelabro renderizando…").
- **Consistencia:** un sistema de componentes de personaje (avatar + estado + color + microcopy) reutilizable en grilla, sidebar, workspace, entregables y notificaciones.

---

## 8. Roadmap por fases (cada una desplegable)

| Fase | Entrega | Mapea a la visión |
|---|---|---|
| **0 ✅** | Ecosistema, Ramona orquestadora, shell, Home/Cerebro/Precios | — |
| **A** | **Multiempresa + RBAC** (org/empresa/membership, `company_id`, selector, dominios, canales) | §1, §3-6, Estructura |
| **B** | **Cerebro RAG** (pgvector, ingesta, recuperación, scoping de tokens) | §7, §8, §10, memoria |
| **C** | **Ejecución v2** (sub-agentes, versionado de entregables, auditoría `model_usage`) | §2-cap3, §11-13, §15 |
| **D** | **Créditos vivos + motor de recursos** (consumo, modos, router de modelos, límites) | créditos §6-15, §19 |
| **E** | **Aprendizaje** (feedback → preferencias → skills, Ramona auditora) | aprendizaje §1-5,16-18,20 |
| **F** | **Integraciones** (canales, OAuth, compartidas) | doc integraciones |
| **G** | **Apps de agente + observadores + marketplace** (22 dashboards sobre el shell, Biznaga/Radar/Vigía/Scout, crear/publicar agentes) | §9 obs., §15, apps |
| **Transversal** | **Lenguaje Cactus en acción y en imagen** | identidad viva |

---

## 9. Cómo lo hacemos posible (stack)

| Capa | Decisión |
|---|---|
| Frontend | Next.js + React + TS + Tailwind + shadcn (ya está) |
| Backend | **Route handlers / server actions de Next** (no NestJS/GraphQL) — Vercel-native, menos superficie |
| Base de datos | **Supabase Postgres + pgvector** (no Pinecone — una sola base, RLS) + Upstash Redis para colas/caché |
| IA | Router multi-proveedor existente (`src/lib/ai`) — Claude/GPT/Gemini, y se suma OpenRouter/DeepSeek/Mistral fácil |
| Storage | Supabase Storage / Cloudflare R2 |
| Media | Kling/Runway/Veo (video), ElevenLabs (voz), GPT-Image/Flux (imagen) — vía el router |
| Jobs | Vercel Cron + colas para observadores y ejecuciones largas |

**Lo que NO hacemos:** reescribir el backend. Evolucionamos el esquema, sumamos RAG y los motores por encima de lo que ya corre.

---

## 10. Próximo paso recomendado

Arrancar la **Fase A (cimiento multiempresa)** porque todo lo demás (Cerebro por empresa, créditos por empresa, RBAC) depende de ella. Entrega concreta de la Fase A:
1. Migración: `organizations`, `companies`, `memberships` + `company_id` en las tablas clave (idempotente, con re-parenteo de datos).
2. Selector de empresa en el header + contexto de empresa en todas las queries.
3. RBAC básico (roles + permisos por ruta/acción).
4. Pantalla "Mis empresas" (alta/edición) y enganche con el Cerebro por empresa.
