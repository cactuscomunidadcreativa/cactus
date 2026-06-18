# Cactus — Contexto Maestro (punto de entrada de cualquier conversación nueva)

> Si abres una conversación nueva, **empieza aquí**. Te da el panorama completo, qué ya está
> hecho/desplegado, qué falta, y el método de trabajo. Pega el bloque **"CONTEXTO PARA PEGAR"**
> del final en la ventana nueva. Fuentes de verdad: `docs/cactus-master-spec.md` (spec completo,
> Parte 4 = la vista de cada agente), `docs/cactus-os-roadmap.md` (roadmap), y la memoria del proyecto.

Última actualización: 2026-06-18 (tras completar Fase G de apps + lector de documentos + imagen gen/edit + gestor de empresas).

## Qué es Cactus
**Sistema Operativo de IA para negocios.** Cada cliente registra sus **empresas**; cada empresa tiene un
**Cerebro** (memoria/RAG), **Ramona** coordina, los **agentes-cactus (28)** ejecutan tareas leyendo solo
su contexto autorizado, y todo entregable queda versionado, medido en créditos y aprendido.
`Usuario → Organización → Empresa(Tenant) → Proyecto → Agentes → Entregables`.

## Stack y deploy (FIJO)
- **Next.js 14 (App Router) + Supabase (Postgres + pgvector) + router de IA propio (`src/lib/ai`).** NO NestJS, NO Pinecone. (Se evaluó Neon y se descartó: Supabase YA es Postgres y trae auth/storage/RLS.)
- **Vercel auto-despliega al hacer push a `main`.** Producción: `https://www.cactuscomunidadcreativa.com`.
- **Base de datos: la aplica Eduardo.** Dos vías equivalentes e idempotentes:
  - Botón admin **"Desplegar base de datos"** (`/admin` → Base de datos) → corre `src/lib/cactus/schema-sql.ts`.
  - `npm run db:push` (aplica `supabase/migrations/*.sql`).
  - ⚠️ **`schema-sql.ts` es el ESPEJO de las migraciones** y es lo que usa el botón. **Toda migración nueva DEBE espejarse en `schema-sql.ts`, en el orden correcto** (una tabla referenciada debe crearse antes). El divisor de SQL del botón es consciente de bloques `$$`/`$f$` (soporta funciones/plpgsql).

## Método de trabajo (estricto)
- **Una acción a la vez** → construir → **verificar `npm run build` con el EXIT CODE REAL** (NO usar `npm run build | tail`: el pipe devuelve el exit de tail y enmascara fallos. Usar `npm run build > log 2>&1; echo $?` + `rm -rf .next` para build limpio; si hay otro build/preview corriendo, `pkill -9 -f "next build"` antes) → push a `main` → **confirmar deploy con `gh api repos/cactuscomunidadcreativa/cactus/commits/<sha>/status --jq .state`** (debe dar `success`) → confirmar con Eduardo → siguiente.
- **Commitear SOLO archivos propios.** **NO tocar `public/agents/New/` (gitignored) ni `public/vistas/`.**
- **Migraciones NO las aplica el asistente**: se escribe el `.sql` + se espeja en `schema-sql.ts`; Eduardo le da al botón.
- Código **resiliente**: si una tabla no existe aún, degradar a vacío (no romper).
- Depurar prod: hay llaves en `.env.local` (apuntan a la MISMA Supabase de prod); inspeccionar con un script node + `@supabase/supabase-js` (service role), corriendo DESDE el repo (resuelve node_modules) y SIN enumerar PII de usuarios.

## Variables de entorno (en Vercel)
- `OPENAI_API_KEY` (embeddings `text-embedding-3-small` + gpt-4o-mini), `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`.
- **`CACTUS_SECRETS_KEY`** — cifra credenciales de agentes (AES-256-GCM). Sin ella NO se guardan secretos.
- *(opcional)* `TAVILY_API_KEY` o `SERPER_API_KEY` — activan observadores; `CRON_SECRET` — protege su cron.

## ESTADO ACTUAL — LIVE y desplegado (Fases A–E + extras). BD: "184/184 OK" (migraciones 034–043)
- **A · Multiempresa + RBAC** (034, 035): `organizations/companies/memberships/plans`, `company_id` en cactus_*, RLS por `cactus_company_ids()` (helpers SECURITY DEFINER, sin recursión); control de empresa: lectura por membresía, escritura por dueño de org. **Auto-aprovisionamiento**: `getActiveCompanyId` crea la empresa por defecto al vuelo (RPC `cactus_ensure_default_company`). Selector de empresa en el header. on/off de agentes + gate por plan + activación one-shot; consumo/cuotas (`usage_daily/user_usage` + RPC `cactus_register_usage`, 402 si excede); alertas (`alerts`+`raiseAlert`); observadores Radar/Vigía/Scout (`observers.ts` + cron `vercel.json`); dominios/canales. UI: **`/empresa`** (pestañas: Agentes, Consumo+modos, Alertas, Conexiones).
- **B · Cerebro RAG** (036): `knowledge_chunks` (pgvector 1536, `extensions.vector`), RPCs `cactus_insert_chunk`/`cactus_match_chunks` (SECURITY INVOKER), embeddings OpenAI (resiliente→fallback texto), matriz de scoping por agente (`knowledge-scope.ts`), contextualizador inyecta RAG. UI: "Reindexar" en `/brain`.
- **C · Ejecución v2** (037): versionado de entregables (`version/version_of/is_latest`), auditoría `model_usage`, sub-agentes acotados (`subagents.ts`, máx 4), API `/deliverables/regenerate`. UI: 👍 + 🔄 Regenerar versión en el workspace.
- **D · Recursos + caché** (038): `companies.ai_mode`, `response_cache` (costo 0 en repeticiones), `resource-engine.ts`. UI: selector de modo en `/empresa → Consumo`.
- **E · Aprendizaje** (039): `agent_feedback`, `business_preferences`, `user_preferences`, `skills`, `preferences.ts`; el feedback enseña al agente; el contextualizador inyecta preferencias. API `/feedback`.
- **Editor de agentes (GLOBAL por defecto)** (040–043): `/empresa/agentes/[slug]` — foto (Storage), **VIDEO de animación**, nombre, descripción, persona/prompt, modelo/proveedor, tono/valores/industria/cultura, on/off, **credenciales cifradas**. `agent_configs.company_id` nullable = fila global; `getEffectiveAgentConfig`/`getEffectiveAgentMedia` (empresa→global→catálogo).
- **Centro de Operaciones** `/empresa/centro`: grilla de los 28 con estado actual → editar.
- **Foto/video efectivos en TODOS lados**: `/ecosystem`, dashboard, `/agent/[slug]`, y **`/apps` público** (tarjetas de agentes automáticas + "Probar demo"; reproducen video si hay). `next.config` remotePatterns `*.supabase.co`.

## HECHO en sesiones recientes (todo LIVE en Vercel)
- **Modo profundo (sub-agentes)**: toggle cableado en el workspace de Ramona (`use-orchestrator` + `ramona-workspace`).
- **FASE G — apps de agente: COMPLETA** (todos los agentes con vista propia tienen app, sobre `AgentAppShell`, fieles a su `vistaN`). Apps nuevas: **Nopal**(16), **Pitaya**(21), **Cholla**, **Biznaga**(1), **Ferocactus**(12), **Opuntia**(5/17, tienda multipágina+productos), **Yuca**(espacio personal: salud/métricas/dieta/meditar/chat), **Maguey**(15), **Aloe**(8), **Ocotillo**(18), **Huernia**(14), **Echinocereus**(11), **Candelabro**(4), **San Pedro**(23), **Pereskia**(19), **Ariocarpus**(7). Ya tenían superficie: Agave/Tuna/Pita/Cereus/Saguaro/Garambullo(/voice)/Cerebro(/brain)/Ramona(/orchestrator)/Peyote(/campaign). Patrón: KPIs reales + pipeline/estado (CRUD localStorage) + acción IA + estados "Conectar" honestos para lo que necesita Fase F.
- **Lector de documentos (sin IA) para TODOS**: `doc-extract.ts` (PDF con pdf.js, imagen con OCR tesseract.js, **Excel multi-hoja** con xlsx) + `health-markers.ts` (rangos clínicos). En la consola universal `/agent/[slug]` (botón Adjuntar) y dentro de apps clave (Yuca/Ferocactus/Biznaga/Pitaya/Cholla/Maguey/Ocotillo/Huernia) vía `DocAttach`+`withDoc`.
- **Imagen real (gpt-image-1)**: generar (`/api/cactus/design`) + **editar** (`/api/cactus/design/edit`). **Creative Workspace** (preview grande + chat de cambios + ajustes sin IA) para **Cardón/Lente/Astrophytum/Ariocarpus** (generas/subes tu foto → preview → pides cambios → sigues). Ajustes locales (recorte/rotar/filtros) = gratis sin IA.
- **Gestor de empresas en `/brain`**: crear/ver/cambiar empresas + marcas por empresa (`CompaniesManager` + `/api/cactus/companies/create` service-role). Una cuenta = varias empresas.

## LO QUE FALTA (orden acordado con Eduardo)
1. **CABLEO Brand Kit → empresa activa** *(próximo #1, chico)*. Hoy `cactus_brand_kits` se guarda por `user_id`; el form de `/brain` debe setear `company_id = empresa activa` al crear/editar una marca, para que el conteo/chips por empresa del gestor sea exacto. Tocar `brand-kit-form.tsx` + su API.
2. **SUPER-DASHBOARD del grafo de agentes** *(próximo #2)*. Vista mapa: los 28 agentes, su estado (activo/apagado/plan) y las **conexiones "habla con"** (delegación/dependencia/escala a Ramona). Datos: catálogo (`agents-catalog` campo "habla con" del master-spec Parte 4) + `agent_configs`. Es el centro de control del ecosistema. (Va junto al **marketplace** de agentes.)
3. **FASE F · Integraciones reales** *(próximo #3, grande, requiere a Eduardo)*. Conectar servicios: **pagos** (Stripe/MercadoPago → checkout de Opuntia), **dominio** (publicar sitios), **Ads** (Meta/Google/LinkedIn/TikTok → Cholla), **Search Console** (Echinocereus), **render video/audio** (Kling/Runway/Veo/Suno → Candelabro/SanPedro/Pereskia), **WhatsApp/email** (Aloe/Nopal publicar), **3D** (Meshy/Tripo → Astrophytum imprimible). Estructura `connections/channels/domains`+`crypto.ts` lista. **Necesita que Eduardo registre apps OAuth y/o dé API keys por proveedor.** El path "API key cifrada" se puede sin OAuth.

## También en backlog (de la visión de Eduardo, aún NO hechos)
- **Plantillas editables tipo Canva** (Cardón): reconocer/crear plantilla + editar texto/fuentes por capas.
- **Composición por capas** (Lente): avatar + pose + escena/props como elementos separables (hoy es "describe el cambio").
- Persona EQ/permanente de agentes vía editor; inbox de leads del form de contacto de Opuntia.

## Referencia rápida
- **Migraciones**: `supabase/migrations/034`–`043` (+ espejo en `src/lib/cactus/schema-sql.ts`).
- **Libs** (`src/lib/cactus/`): companies, agent-access, agent-images, agent-prompts, knowledge-scope, rag, usage, alerts, audit, rbac, resource-engine, preferences, crypto, secrets, subagents, observers, orchestrator, agents-catalog (28), schema-sql.
- **APIs** (`src/app/api/cactus/`): agents, agents/[slug], agents/[slug]/photo, agents/[slug]/secrets, agents/overview, usage, alerts, connections, company/mode, feedback, deliverables/regenerate, brain/index, observers/run, companies/active, orchestrator/{chat,state,execute}.
- **Páginas** (`src/app/(platform)/`): empresa, empresa/centro, empresa/agentes/[slug], ecosystem, brain, orchestrator, dashboard, agent/[slug]. Pública: `(marketing)/apps`.
- **Admin DB**: `/admin` (`db-setup-panel.tsx`, APIs `/api/admin/db-setup` + `/db-status`).
- **Super-admin/founder**: `eduardo@cactuscomunidadcreativa.com`.

---

## CONTEXTO PARA PEGAR (en la ventana nueva)

```
Trabajo en Cactus (Next.js + Supabase) en ~/Desktop/cactus — un "AI Business OS" multiempresa con
28 agentes-cactus que Ramona coordina. LEE PRIMERO docs/cactus-context.md (estado completo + método)
y docs/cactus-master-spec.md Parte 4 (la vista de cada agente) + la memoria del proyecto.

Estado: Fases A–E COMPLETAS y desplegadas (multiempresa+RBAC, Cerebro RAG/pgvector, ejecución v2/
sub-agentes, recursos+caché, aprendizaje) + editor de agentes global + Modo profundo. **FASE G de
apps de agente: COMPLETA** (16 apps nuevas sobre AgentAppShell, fieles a sus vistas: Nopal, Pitaya,
Cholla, Biznaga, Ferocactus, Opuntia[tienda], Yuca[espacio personal], Maguey, Aloe, Ocotillo,
Huernia, Echinocereus, Candelabro, San Pedro, Pereskia, Ariocarpus). Extras LIVE: lector de
documentos sin IA (PDF/OCR/Excel) en /agent/[slug] y apps clave; imagen real gen+edit (gpt-image-1)
con Creative Workspace en Cardón/Lente/Astrophytum/Ariocarpus; gestor de empresas en /brain. BD
"184/184 OK" (migraciones 034–043; lo nuevo de esta etapa NO necesitó migración).

Stack fijo: Next.js + Supabase (Postgres + pgvector) + router de IA propio. Deploy: push a main =
Vercel auto-deploy; la BD la aplica Eduardo con el botón "Desplegar base de datos" (corre
src/lib/cactus/schema-sql.ts, ESPEJO de supabase/migrations/*). TODA migración nueva se espeja en
schema-sql.ts en orden.

Método: UNA acción a la vez → npm run build (EXIT CODE REAL, NO con | tail; rm -rf .next + a veces
node_modules/.cache porque el build de Next es FLAKY: ENOENT pages-manifest / Cannot find module /
ECANCELED → reintentar limpio da EXIT 0; usar NODE_OPTIONS=--max-old-space-size=6144) → push a main
→ confirmar deploy con gh api repos/cactuscomunidadcreativa/cactus/commits/<sha>/status=success →
confirmo yo. Commitea SOLO tus archivos; NO toques public/agents/New ni public/vistas.

Patrón de app de agente: page server en src/app/(app)/apps/<slug>/page.tsx (auth-gate + foto efectiva
+ créditos) → componente cliente sobre AgentAppShell (KPIs reales + pipeline/estado CRUD localStorage
+ acción IA vía POST /api/cactus/agent {slug,messages,maxTokens?} + DocAttach donde aplique). Lo que
necesita servicios externos va como panel "Conectar" honesto (Fase F).

ARRANCA con, EN ESTE ORDEN (acordado con Eduardo): (1) CABLEO Brand Kit → empresa activa (el form de
/brain debe setear company_id = empresa activa al guardar marca; tocar brand-kit-form.tsx + su API).
(2) SUPER-DASHBOARD del grafo de agentes (mapa: 28 agentes + estado + conexiones "habla con" del
master-spec Parte 4) + marketplace. (3) FASE F integraciones reales (pagos/dominio/Ads/Search Console/
render video-audio/WhatsApp-email/3D) — requiere que Eduardo registre apps OAuth / dé API keys por
proveedor. Confírmame entre acciones.
```
