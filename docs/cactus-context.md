# Cactus — Contexto Maestro (punto de entrada de cualquier conversación nueva)

> Si abres una conversación nueva, **empieza aquí**. Este doc te da todo el panorama y te manda a
> las fuentes de verdad. Pega el bloque "CONTEXTO PARA PEGAR" del final en la ventana nueva.

---

## 1. Qué es Cactus
**Sistema Operativo de IA para negocios** (no un set de chats). Cada cliente registra sus **empresas**;
cada empresa tiene un **Cerebro** (memoria/RAG), **Ramona** coordina, y **28 agentes-cactus** ejecutan
tareas leyendo solo su contexto autorizado. Todo entregable queda **versionado**, medido en **créditos**
y **aprendido** para la próxima vez.

```
Usuario → Organización → Empresa(Tenant) → Proyecto → Agentes → Entregables
                          └ Cerebro(RAG) · dominios · canales · usuarios(RBAC) · créditos · conexiones
```
Producción: https://www.cactuscomunidadcreativa.com · repo `github.com/cactuscomunidadcreativa/cactus` ·
push a `main` = deploy en Vercel.

## 2. Qué YA está construido y desplegado
- **Ecosistema** (`/ecosystem`): catálogo de **28 agentes** (incl. el nuevo **Cholla** · Campañas),
  grilla 3:4 con animaciones (`cactus-float/wiggle`, entrada en cascada), **i18n ES/EN**, sidebar con
  **agente activo** destacado.
- **Ramona orquestadora FUNCIONAL** (`/orchestrator`): plan real con LLM, **ejecución híbrida**
  (auto + aprobación en pasos sensibles), **gate** (suscripción O créditos), cobro de créditos.
  Tablas `cactus_projects/tasks/messages/deliverables` (migración **033 aplicada**).
- **Shell reutilizable** (`src/components/cactus/app-shell/`): `AgentAppShell` + `KpiRow` + `QuickActionsBar`.
- **Páginas plataforma:** Home `/dashboard` · Cerebro `/brain` · Precios `/precios`.
- **Infra previa:** `cactus_brand_kits`, `cactus_knowledge_items`, `cactus_credit_wallets/ledger`,
  `cactus_api_keys`, `cactus_agent_activations`, `subscriptions`, router de IA (`src/lib/ai`), Stripe, next-intl.

## 3. Documentos fuente (leer en este orden)
1. **`docs/cactus-master-spec.md`** — EL spec completo: multi-tenant, sistema de agentes (contextualizador,
   on/off, consumo, interacciones, conexiones), **vista de cada agente**, fases, vitrina `/apps`.
2. `docs/cactus-os-roadmap.md` — roadmap + qué se porta de ROWI/CAARD/EGO/Privat.
3. `docs/cactus-fase-a-kickoff.md` — método + las 8 acciones de la Fase A.
4. Memoria del proyecto: `MEMORY.md` y sus links (`cactus-os-roadmap`, `agent-views-spec`,
   `ramona-orchestrator`, `ecosystem-ui-i18n`).
5. `public/vistas/*.png` — las **29 vistas** (spec visual), analizadas en el master spec Parte 4.

## 4. Decisiones firmes (no re-discutir)
- **Stack:** Next.js + Supabase (Postgres + **pgvector**) + el router de IA existente. **NO** NestJS/GraphQL/Pinecone.
- **Multiempresa:** Organización → Empresa → Proyecto + RBAC. (Confirmado.)
- **Reutilizar** lo probado de ROWI/CAARD/EGO/Privat (portar lógica TS, adaptar datos a Supabase). ~60-70% del backend ya existe entre esos 4 repos hermanos (en ~/Desktop).

## 5. Roadmap por fases
| # | Fase | Resumen |
|---|---|---|
| 0 ✅ | Hecho | ecosistema · Ramona orquestadora · shell · Home/Cerebro/Precios |
| **A** | Multiempresa + RBAC + on/off + consumo + alertas + observadores + dominios | **siguiente** |
| B | Cerebro RAG + Contextualizador (pgvector + scoping de tokens) | |
| C | Ejecución v2 (sub-agentes + versionado de entregables) | |
| D | Créditos vivos + motor de recursos (ahorro/calidad) | |
| E | Aprendizaje (feedback→preferencias→skills) | |
| F | Integraciones — **Hub de Conexiones** (OAuth Meta/Google/LinkedIn + API keys) | |
| G | Apps de agente (28 vistas) + super dashboard + marketplace | |
| Transversal | Lenguaje Cactus "en acción y en imagen" · landing público `/apps` | |

## 6. Mapa de reutilización (qué portar)
- **ROWI:** multi-tenant (mejor), encendido/apagado de agentes, **contextualizador** `buildAgentPromptContext`,
  consumo `UsageDaily`+cuotas, Stripe seats, PPTX (→Pita), motor emocional EQ (→`src/lib/eq/`).
- **CAARD:** RAG embeddings+chunking+OCR (→Cerebro), 80-permisos RBAC, docx (→Ferocactus), pagos Culqi.
- **EGO:** schema multiempresa, caché de respuestas + control de costo (→motor de recursos), bot orchestration.
- **Privat:** Integration Hub (→Conexiones), pipeline avatares/video/imagen (→Candelabro/Lente/etc.),
  costing (→Cereus). **Privat es el primo más cercano** (ya tiene "Ramona", dominios, storefront).
- **Cereus ya está construido**: dominios personalizados + storefront/páginas → prueba de que multi-dominio
  y multi-página YA funciona; en el plan se **generaliza** a todas las empresas.

## 7. Método de trabajo (estricto)
**Una acción a la vez:** construir → **`npm run build`** + preview → **push a `main`** (deploy Vercel)
→ **confirma Eduardo** → siguiente.
- Migraciones Supabase: el asistente **escribe el `.sql`**, **Eduardo corre `npm run db:push`**.
- Commitear **solo archivos propios**. **NO** tocar `public/agents/New/*.png` ni `public/vistas/`.
- Código resiliente: si una tabla nueva aún no existe en prod, degradar a vacío (no romper).
- Verificar previewables en el navegador (rutas con auth → ruta temporal pública que se borra después).

## 8. Pendientes / requisitos abiertos
- **Landing `/apps`**: vitrina pública con las 28 apps/agentes y sus **imágenes nuevas** (tarjetas 3:4).
- **Arte de Cholla** (hoy usa avatar provisional) y de los agentes sin tarjeta.
- Traducir copy de agentes/divisiones ya está en i18n; el resto del chrome se traduce por fase.

---

## CONTEXTO PARA PEGAR (en la conversación nueva)

```
Trabajo en Cactus (Next.js + Supabase) en ~/Desktop/cactus: un "AI Business OS" multiempresa con
28 agentes-cactus que Ramona coordina. ANTES DE NADA lee, en orden: docs/cactus-context.md (este
panorama), docs/cactus-master-spec.md (spec completo), docs/cactus-fase-a-kickoff.md (método +
acciones), la memoria del proyecto, y public/vistas/*.png (29 mockups, analizados en el master
spec Parte 4).

Decisiones firmes: Stack Next.js + Supabase (Postgres + pgvector) + el router de IA existente, NO
NestJS. Multiempresa Organización → Empresa → Proyecto + RBAC. Reutilizamos lo probado de los repos
hermanos ROWI/CAARD/EGO/Privat (en ~/Desktop): portar lógica, no reconstruir.

Estado: ya están desplegados el ecosistema (28 agentes), Ramona orquestadora funcional, el shell de
apps, y Home/Cerebro/Precios. Sigue la FASE A (multiempresa + RBAC + on/off de agentes + consumo +
alertas + observadores + dominios).

Método: UNA acción a la vez → construir → npm run build + preview → push a main (deploy Vercel) →
confirmo yo → siguiente. Las migraciones NO las apliques tú: escribe el .sql y yo corro npm run
db:push. Commitea solo tus archivos; no toques public/agents/New ni public/vistas. Push a main
despliega en Vercel.

Arranca por la FASE A, ACCIÓN 1: la migración base multiempresa (034_multitenant.sql) según
docs/cactus-fase-a-kickoff.md. Termínala, verifícala con build, déjala lista para db:push y
confírmame antes de seguir. Recuérdame también que el landing público /apps debe mostrar las 28
apps con sus imágenes.
```
