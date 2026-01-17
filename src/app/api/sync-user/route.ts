import { NextResponse } from 'next/server';

// This API route is deprecated and part of the old Firebase implementation.
// It now returns a success message to prevent errors from old clients.
export async function POST(request: Request) {
  return NextResponse.json({ message: 'User sync is now handled by Supabase.' }, { status: 200 });
}
