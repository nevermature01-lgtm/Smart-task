import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Update both request and response cookies
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // Update both request and response cookies
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Refresh session - yeh cookies ko update karega
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    const { pathname } = request.nextUrl;

    const publicOnlyRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

    // If the user is logged in and trying to access a public-only route, redirect to home.
    if (session && publicOnlyRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    // If the user is not logged in and is trying to access a protected route, redirect to login.
    if (!session && pathname.startsWith('/home')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

  } catch (e) {
    // If an error occurs, continue without authentication logic.
    return response;
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
