'use client';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { firebase_uid, email, first_name, last_name } = await request.json();

    if (!firebase_uid || !email) {
      return NextResponse.json({ error: 'Firebase UID and email are required.' }, { status: 400 });
    }

    // 1. Check if user already exists
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid')
      .eq('firebase_uid', firebase_uid)
      .single();

    // If selectError exists AND it's not the "no rows found" error (PGRST116), something went wrong
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking for user in Supabase:', selectError);
      if (selectError.message.includes('fetch failed')) {
        const detailedError = 'The server could not connect to Supabase. This is likely because the `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_KEY` environment variables are not set correctly.';
        return NextResponse.json({ error: detailedError }, { status: 500 });
      }
      return NextResponse.json({ error: `Could not verify user existence: ${selectError.message}` }, { status: 500 });
    }

    // 2. If user exists, do nothing and return success
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists.' }, { status: 200 });
    }

    // 3. If user does not exist, insert them
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      firebase_uid: firebase_uid,
      email: email,
      first_name: first_name,
      last_name: last_name,
    });

    if (insertError) {
      console.error('Error inserting new user into Supabase:', insertError);
      return NextResponse.json({ error: `Could not create user profile in database: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'User profile created successfully.' }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in sync-user:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
