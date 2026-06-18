import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveCompanyId } from '@/lib/cactus/companies';
import { getIntegration, redirectUri } from '@/lib/cactus/integrations';
import { storeOAuthToken } from '@/lib/cactus/integration-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/integrations/{provider}/callback?code=...&state=... → intercambia el code
// por un access_token (OAuth2 estándar) y lo guarda CIFRADO a nivel empresa.
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const url = new URL(req.url);
  const origin = url.origin;
  const hub = (q: string) => NextResponse.redirect(`${origin}/empresa/conexiones?${q}`);

  const p = getIntegration(params.provider);
  if (!p || p.auth !== 'oauth' || !p.oauth) return hub(`error=proveedor&provider=${params.provider}`);

  const error = url.searchParams.get('error');
  if (error) return hub(`error=denegado&provider=${p.slug}`);

  const code = url.searchParams.get('code');
  if (!code) return hub(`error=sin_code&provider=${p.slug}`);

  const clientId = process.env[p.oauth.clientIdEnv];
  const clientSecret = process.env[p.oauth.clientSecretEnv];
  if (!clientId || !clientSecret) return hub(`error=sin_config&provider=${p.slug}`);

  // Empresa: del state (preferido) o de la sesión activa.
  const supabase = await createClient();
  if (!supabase) return hub(`error=sin_sesion&provider=${p.slug}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?redirect=/empresa/conexiones`);
  let companyId = await getActiveCompanyId(supabase, user.id);
  try {
    const raw = url.searchParams.get('state');
    if (raw) {
      const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString());
      if (parsed?.c) companyId = parsed.c;
    }
  } catch { /* state inválido → usa empresa activa */ }
  if (!companyId) return hub(`error=sin_empresa&provider=${p.slug}`);

  // Intercambio code → token (OAuth2 authorization_code estándar).
  try {
    const res = await fetch(p.oauth.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(origin, p.slug),
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    const accessToken = data?.access_token;
    if (!res.ok || !accessToken) return hub(`error=token&provider=${p.slug}`);

    const r = await storeOAuthToken(supabase, companyId, p.slug, {
      access_token: accessToken,
      refresh_token: data?.refresh_token,
    });
    if (!r.ok) return hub(`error=guardar&provider=${p.slug}`);
    return hub(`ok=1&provider=${p.slug}`);
  } catch {
    return hub(`error=token&provider=${p.slug}`);
  }
}
