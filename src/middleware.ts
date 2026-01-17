import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is intentionally minimal.
// It exists to prevent a Next.js build error caused by an empty or invalid middleware file.
// All authentication and routing logic is handled on the client-side in this application,
// so this function simply passes all requests through without modification.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}
