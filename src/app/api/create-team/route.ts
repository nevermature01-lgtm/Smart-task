import { NextResponse } from 'next/server';

// This API route is deprecated and part of the old Firebase implementation.
// Team creation is now handled client-side with Supabase.
export async function POST(request: Request) {
  return NextResponse.json({ message: 'Team creation is now handled client-side with Supabase.' }, { status: 200 });
}
