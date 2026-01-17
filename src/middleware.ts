import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // This is now a pass-through middleware.
  // Authentication state is handled on the client-side using Firebase hooks.
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * This is a broad matcher, but since the middleware is a pass-through,
     * it doesn't add significant overhead.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
