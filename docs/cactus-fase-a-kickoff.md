# Cactus — Kickoff Fase A (contexto para ventana nueva)

> Pega el bloque de "CONTEXTO PARA PEGAR" (abajo) en una ventana nueva de Claude Code para arrancar.

## Qué es Cactus
**Sistema Operativo de IA para negocios.** Cada cliente registra sus **empresas**; cada empresa tiene un
**Cerebro** (memoria/RAG), **Ramona** coordina, los **agentes-cactus** (28) ejecutan tareas leyendo solo
su contexto autorizado, y todo entregable queda versionado, medido en créditos y aprendido.

## Fuentes de verdad (leer primero)
- **`docs/cactus-master-spec.md`** — spec completo: multi-tenant, sistema de agentes (contextualizador,
  on/off, consumo, interacciones), **vista de cada agente**, fases. (El doc principal.)
- `docs/cactus-os-roadmap.md` — roadmap + qué se porta de ROWI/CAARD/EGO/Privat.
- Memoria del proyecto (`MEMORY.md` y sus links): `cactus-os-roadmap`, `agent-views-spec`,
  `ramona-orchestrator`, `ecosystem-ui-i18n`.
- `public/vistas/*.png` — las 29 vistas (spec visual). Analizadas en el master spec, Parte 4.

## Decisiones firmes
- **Stack:** Next.js + Supabase (Postgres + **pgvector**) + el router de IA existente (`src/lib/ai`).
  **NO** migrar a NestJS/GraphQL/Pinecone.
- **Multiempresa:** Organización → Empresa → Proyecto + RBAC. (Confirmado por Eduardo.)
- **Reutilizar** lo probado de ROWI/CAARD/EGO/Privat (portar lógica TS, adaptar acceso a datos a Supabase).

## Método de trabajo (estricto)
**Una acción a la vez:** construir → **verificar** (`npm run build` + preview) → **deploy** (push a `main`)
→ **confirmar con Eduardo** → siguiente acción.
- Las migraciones Supabase **NO las aplica el asistente**: se escribe el `.sql` y **Eduardo corre `npm run db:push`**.
- Push a `main` = **deploy automático en Vercel**.
- Commitear **solo archivos propios**; **NO** tocar `public/agents/New/*.png` ni `public/vistas/`.
- Código resiliente: si una tabla nueva aún no existe en prod, la UI degrada a vacío (no rompe).

## Fase A — acciones, en orden
1. **Migración base multiempresa** `034_multitenant.sql` (idempotente): `organizations`, `companies`
   (=tenant), `memberships` (RBAC: owner/admin/marketing/ventas/legal/ops/invitado/cliente), `plans`
   (tokens_monthly, max_users, agentes incluidos) + **`company_id` (nullable)** en
   `cactus_projects/tasks/messages/deliverables/brand_kits/knowledge_items/credit_ledger` + **RLS**
   (USING company_id IN memberships de auth.uid()) + helper de **re-parenteo** (crea org+empresa default
   por usuario y migra lo existente). **Sin UI.** → build, dejar listo para `db:push`, confirmar.
2. **Selector de empresa** en el header + **empresa activa** (contexto) + scoping del orquestador por `company_id`.
3. **agent_configs + user_ai_controls + panel on/off** de agentes por empresa + gate por plan +
   **delegación + gate one-shot** (activar agente "solo para esta tarea o sumarlo al plan").
4. **Consumo:** `usage_daily` + `user_usage` + registro idempotente + cuotas (402 si excede) + vista de consumo vivo.
5. **Alertas:** tabla `alerts` + **escalación a Ramona** (agente/observador → alerta → Ramona convoca).
6. **Observadores v1:** Radar/Vigía/Scout con búsqueda web + Vercel Cron → `alerts`.
7. **Dominios/canales:** `domains` + `channels` por empresa (estructura + UI básica).
8. **RBAC enforcement:** roles + chequeo por ruta/acción.

**Empezar por la Acción 1.**

## Convenciones del repo (para portar bien)
- Migraciones: `supabase/migrations/NNN_*.sql`, tablas `cactus_*` o nuevas, RLS con `auth.uid()`,
  triggers `updated_at` (ver `031`/`033` como molde).
- Supabase: `src/lib/supabase/{server,client}.ts` (`createClient()` → `null` si no hay env → dev-safe).
- LLM: `generateContent`/`generateChat` de `@/lib/ai` (modelo `claude-sonnet-4-20250514`).
  Créditos: `src/lib/cactus/credits.ts`. Acceso/gate: `src/lib/cactus/access.ts`.
- i18n: next-intl, `src/i18n/messages/{es,en}/`. Catálogo de agentes: `src/lib/cactus/agents-catalog.ts` (28).
- Orquestador ya hecho: `src/lib/cactus/orchestrator.ts` + `src/app/api/cactus/orchestrator/*` + `src/components/cactus/orchestrator/*`.

---

## CONTEXTO PARA PEGAR (en la ventana nueva)

```
Trabajo en el proyecto Cactus (Next.js + Supabase) en ~/Desktop/cactus. Es un "AI Business OS"
multiempresa con agentes-cactus que Ramona coordina. Lee primero docs/cactus-master-spec.md
(spec completo) y docs/cactus-fase-a-kickoff.md (método + acciones de la Fase A). También la
memoria del proyecto y public/vistas/*.png (29 mockups, analizados en el master spec Parte 4).

Stack fijo: Next.js + Supabase (Postgres + pgvector) + el router de IA existente. NO NestJS.
Multiempresa confirmado: Organización → Empresa → Proyecto + RBAC.

Método: UNA acción a la vez → construir → npm run build + preview → push a main (deploy Vercel)
→ confirmo yo → siguiente. Las migraciones NO las apliques tú: escribe el .sql y yo corro
npm run db:push. Commitea solo tus archivos; no toques public/agents/New ni public/vistas.

Arranca la FASE A, ACCIÓN 1: la migración base multiempresa (034_multitenant.sql) según el
kickoff. Termínala, verifícala con build, déjala lista para db:push, y confírmame antes de seguir.
```
