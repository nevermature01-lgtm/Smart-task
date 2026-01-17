import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // If Supabase isn't configured, we can't do anything.
      return response;
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    // this will refresh the session if it's expired
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    const { pathname } = request.nextUrl;

    const loggedIn = !!session;

    // Redirect logged-in users from auth pages to home
    const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/'];
    if (loggedIn && authPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // Redirect non-logged-in users from protected pages to login
    const protectedPages = ['/home'];
    if (!loggedIn && protectedPages.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

  } catch (e) {
    // Failsafe: if any error occurs, just continue without auth logic
    return response;
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};