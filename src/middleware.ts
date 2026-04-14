import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isPlatformDomain, resolveMaisonDomain, CEREUS_ROUTES } from '@/lib/cereus/domain-resolver';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && key && url.startsWith('http'));
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // ─── STEP 1: Custom domain detection & URL rewriting ───
  if (hostname && !isPlatformDomain(hostname)) {
    const maison = await resolveMaisonDomain(hostname);

    if (maison) {
      const { maisonId } = maison;

      // Determine the internal rewrite path
      let internalPath: string;

      if (pathname === '/') {
        internalPath = `/maison/${maisonId}`;
      } else if (pathname === '/login' || pathname === '/register') {
        internalPath = `/maison/${maisonId}${pathname}`;
      } else if (pathname.startsWith('/lookbook/')) {
        internalPath = `/maison/${maisonId}${pathname}`;
      } else if (pathname.startsWith('/auth/')) {
        // Auth callback — pass through to shared auth handler
        internalPath = pathname;
      } else if (pathname.startsWith('/api/')) {
        // API routes — pass through unchanged
        internalPath = pathname;
      } else {
        // Check if it's a known CEREUS route
        const routeSegment = pathname.split('/')[1];
        if (CEREUS_ROUTES.includes(routeSegment as any)) {
          internalPath = `/maison/${maisonId}${pathname}`;
        } else {
          // Unknown route — still rewrite under maison for 404 handling
          internalPath = `/maison/${maisonId}${pathname}`;
        }
      }

      // Only rewrite if path changed (skip for /api and /auth)
      if (internalPath !== pathname) {
        const url = request.nextUrl.clone();
        url.pathname = internalPath;

        const response = NextResponse.rewrite(url);
        response.headers.set('x-maison-id', maisonId);
        response.headers.set('x-maison-domain', 'true');

        // Run Supabase auth on the rewritten response
        return handleSupabaseAuth(request, response, internalPath);
      }
    }
    // If domain not found in DB, fall through to normal handling
  }

  // ─── STEP 2: Normal platform flow ───
  const response = NextResponse.next();
  return handleSupabaseAuth(request, response, pathname);
}

/**
 * Handle Supabase auth session refresh and route protection.
 */
async function handleSupabaseAuth(
  request: NextRequest,
  response: NextResponse,
  pathname: string
): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes check
  const protectedRoutes = ['/dashboard', '/marketplace', '/settings', '/apps', '/cereus'];
  const isMaisonRoute = pathname.startsWith('/maison/');
  const isMaisonAuth = isMaisonRoute && (pathname.includes('/login') || pathname.includes('/register'));
  const isMaisonLanding = isMaisonRoute && pathname.split('/').length <= 3; // /maison/[id]
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    || (isMaisonRoute && !isMaisonAuth && !isMaisonLanding && !pathname.includes('/lookbook/'));

  const isAuthRoute = pathname.includes('/login') || pathname.includes('/register');

  if (isProtectedRoute && !user) {
    // On custom domain, redirect to /login (middleware will rewrite it)
    const isMaisonDomain = response.headers.get('x-maison-domain') === 'true';
    const loginPath = isMaisonDomain ? '/login' : '/login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user && !isMaisonRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
