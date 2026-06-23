import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Solo rutas internas: debe empezar con '/' y NO con '//' (evita open redirect /
  // protocol-relative tipo '//evil.com'). Cualquier otra cosa → '/dashboard'.
  const raw = searchParams.get('redirect');
  const redirect = raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${redirect}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
