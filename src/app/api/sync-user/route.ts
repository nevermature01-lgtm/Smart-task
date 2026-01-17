// No 'use client' here. This is a server-only file.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { firebase_uid, email, first_name, last_name } = await request.json();

    if (!firebase_uid || !email) {
      return NextResponse.json({ error: 'Firebase UID and email are required.' }, { status: 400 });
    }

    // Step 1: Check if user already exists to prevent duplicates.
    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from('users')
      .select('firebase_uid')
      .eq('firebase_uid', firebase_uid)
      .single();

    // A selectError can occur for two main reasons:
    // 1. Connection issue (e.g., wrong URL/keys) -> `fetch failed`.
    // 2. The row doesn't exist (`code: 'PGRST116'`), which is expected for new users.
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('[SYNC_USER_ERROR] - Could not check for user:', selectError);
      
      // Provide a more helpful error if the database connection failed.
      if (selectError.message.includes('fetch failed')) {
        return NextResponse.json({ 
          error: 'The server could not connect to the database. Please ensure the Supabase URL and Service Role Key environment variables are set correctly.' 
        }, { status: 500 });
      }

      // For other database errors.
      return NextResponse.json({ error: `Database error: ${selectError.message}` }, { status: 500 });
    }

    // If existingUser is not null, the user is already in our DB.
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists in Supabase.' }, { status: 200 });
    }

    // Step 2: If the user does not exist, insert them into the database.
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      firebase_uid: firebase_uid,
      email: email,
      first_name: first_name,
      last_name: last_name,
    });

    // Handle potential errors during insertion.
    if (insertError) {
      console.error('[SYNC_USER_ERROR] - Could not insert user:', insertError);
      return NextResponse.json({ error: `Could not create user in database: ${insertError.message}` }, { status: 500 });
    }

    // If successful, return a 201 Created status.
    return NextResponse.json({ message: 'User profile created successfully.' }, { status: 201 });

  } catch (error) {
    // This catches unexpected errors, like a malformed request body.
    console.error('[SYNC_USER_ERROR] - Unexpected failure:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
