// Enforce Node.js runtime
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Function to generate a unique 6-digit numeric code
async function generateUniqueTeamCode(): Promise<string> {
  let teamCode: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate a 6-digit random number
    teamCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if it already exists in the database
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('team_code')
      .eq('team_code', teamCode)
      .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' means no rows found, which is good
      throw error; // Rethrow other errors
    }

    if (!data) {
      isUnique = true; // The code is unique
    }
  }
  return teamCode!;
}


export async function POST(request: Request) {
  try {
    const { teamName, token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email } = decodedToken;

    if (!uid || !email) {
      // This should theoretically not happen if verifyIdToken succeeds
      return NextResponse.json({ error: 'Invalid token payload.' }, { status: 401 });
    }
    
    // Generate a unique team code
    const teamCode = await generateUniqueTeamCode();

    // Insert new team into Supabase
    const { data: newTeam, error: insertError } = await supabaseAdmin
      .from('teams')
      .insert({
        team_name: teamName.trim(),
        team_code: teamCode,
        created_by_uid: uid,
        created_by_email: email,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 });
    }

    // Return the new team code
    return NextResponse.json({ teamCode: newTeam.team_code }, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
     // Catch token verification errors
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code?.startsWith('auth/')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
