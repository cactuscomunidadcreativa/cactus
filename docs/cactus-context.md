# Cactus — Contexto Maestro (punto de entrada de cualquier conversación nueva)

> Si abres una conversación nueva, **empieza aquí**. Te da el panorama completo, qué ya está
> hecho/desplegado, qué falta, y el método de trabajo. Pega el bloque **"CONTEXTO PARA PEGAR"**
> del final en la ventana nueva. Fuentes de verdad: `docs/cactus-master-spec.md` (spec completo,
> Parte 4 = la vista de cada agente), `docs/cactus-os-roadmap.md` (roadmap), y la memoria del proyecto.

Última actualización: 2026-06-18.

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

## LO QUE FALTA
1. **MODO PROFUNDO (sub-agentes) — UI** *(próximo #1)*. Motor LISTO: `execute` corre `runWithSubAgents` si `body.deep===true`. Falta el toggle:
   - `src/components/cactus/orchestrator/use-orchestrator.ts`: `step()` hace POST a `/execute` con `{projectId, taskId}`; agregar `deep` al body (estado del hook + setter expuesto).
   - `src/components/cactus/orchestrator/ramona-workspace.tsx`: switch "Modo profundo" que setea ese estado.
   - Opt-in (costo: ~6 llamadas LLM/tarea).
2. **FASE F · Integraciones reales** (agentes que ACTÚAN). Estructura lista (`connections/channels/domains` + `crypto.ts`). **OAuth (Meta/Google/LinkedIn) requiere que Eduardo registre apps OAuth y dé client_id/secret/redirect** — no se puede sin eso. El path **"API key cifrada"** (WhatsApp token, SMTP, Resend) sí. Integración real = por proveedor (grande).
3. **FASE G · 28 apps de agente + super-dashboard + marketplace** *(próximo #2, por lotes)*. Shell **`src/components/cactus/app-shell/AgentAppShell`** ya existe. Construir el cuerpo de cada agente según **`docs/cactus-master-spec.md` Parte 4** (patrón A/B/C + qué muestra). `/agent/[slug]` ya tiene consola básica. Hacer por lotes (4–5 agentes/sesión), reutilizando módulos portados de ROWI/CAARD/EGO/Privat.

## PRÓXIMO (elegido por Eduardo): **(1) Modo profundo** y **(2) Fase G**. Empezar por modo profundo.

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

Estado: Fases A–E del roadmap COMPLETAS y desplegadas (multiempresa+RBAC, Cerebro RAG/pgvector,
ejecución v2/versionado/sub-agentes, recursos+caché+modos, aprendizaje) + editor de agentes global
(foto/video/persona/modelo/credenciales cifradas) + Centro de Operaciones + /apps por tarjetas
automáticas. BD aplicada (migraciones 034–043, "184/184 OK").

Stack fijo: Next.js + Supabase (Postgres + pgvector) + router de IA propio. Deploy: push a main =
Vercel auto-deploy; la BD la aplica Eduardo con el botón "Desplegar base de datos" (corre
src/lib/cactus/schema-sql.ts, ESPEJO de supabase/migrations/*). TODA migración nueva se espeja en
schema-sql.ts en orden.

Método: UNA acción a la vez → npm run build (verificar EXIT CODE REAL, NO con | tail; rm -rf .next
para build limpio) → push a main → confirmar deploy con gh api .../commits/<sha>/status → confirmo yo.
Commitea SOLO tus archivos; NO toques public/agents/New ni public/vistas.

ARRANCA con: (1) MODO PROFUNDO — toggle de sub-agentes en el workspace de Ramona. El motor ya existe
(execute corre runWithSubAgents si body.deep===true); falta cablear el toggle en
use-orchestrator.ts (step → body.deep) + ramona-workspace.tsx (switch "Modo profundo"). Opt-in
(~6 llamadas LLM/tarea). Luego (2) FASE G — construir las apps de cada agente sobre AgentAppShell
por lotes (4–5 por sesión), según docs/cactus-master-spec.md Parte 4. Confírmame entre acciones.
```
