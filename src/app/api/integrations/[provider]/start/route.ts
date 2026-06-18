import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getIntegration, redirectUri } from '@/lib/cactus/integrations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/integrations/{provider}/start → redirige al consentimiento OAuth del proveedor.
// Si la app OAuth no está registrada (faltan env client_id/secret), vuelve al hub
// con un error claro en vez de romper.
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const origin = new URL(req.url).origin;
  const hub = (q: string) => NextResponse.redirect(`${origin}/empresa/conexiones?${q}`);

  const p = getIntegration(params.provider);
  if (!p || p.auth !== 'oauth' || !p.oauth) return hub(`error=proveedor&provider=${params.provider}`);

  const clientId = process.env[p.oauth.clientIdEnv];
  if (!clientId) return hub(`error=sin_config&provider=${p.slug}`);

  const supabase = await createClient();
  if (!supabase) return hub(`error=sin_sesion&provider=${p.slug}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?redirect=/empresa/conexiones`);
  const companyId = await getActiveCompanyId(supabase, user.id);
  if (!companyId) return hub(`error=sin_empresa&provider=${p.slug}`);

  // state: amarra el flujo a empresa+proveedor (anti-CSRF básico para el scaffolding).
  const state = Buffer.from(JSON.stringify({ s: p.slug, c: companyId })).toString('base64url');

  const auth = new URL(p.oauth.authUrl);
  auth.searchParams.set('client_id', clientId);
  auth.searchParams.set('redirect_uri', redirectUri(origin, p.slug));
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', p.oauth.scopes.join(' '));
  auth.searchParams.set('state', state);
  auth.searchParams.set('access_type', 'offline'); // Google: pide refresh_token

  return NextResponse.redirect(auth.toString());
}
