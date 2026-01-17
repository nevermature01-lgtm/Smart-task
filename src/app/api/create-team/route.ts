import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import admin from '@/lib/firebase/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Function to generate a random 6-digit code
const generateTeamCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }

    const token = authorization.split('Bearer ')[1];
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
        console.error('Token verification error:', error);
        return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }

    const { uid, email } = decodedToken;

    if (!uid || !email) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token payload.' }, { status: 401 });
    }
    
    const { teamName } = await request.json();
    if (!teamName || typeof teamName !== 'string' || teamName.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }

    let teamCode;
    let isCodeUnique = false;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loop in case of bad luck

    // Loop to ensure the generated team code is unique
    while (!isCodeUnique && attempts < maxAttempts) {
      teamCode = generateTeamCode();
      const { data: existingTeam, error } = await supabaseAdmin
        .from('teams')
        .select('team_code')
        .eq('team_code', teamCode)
        .single();
      
      // If there's an error and it's not the "no rows found" error, throw it.
      if (error && error.code !== 'PGRST116') { 
        throw error;
      }

      // If no team with that code exists, we're good.
      if (!existingTeam) {
        isCodeUnique = true;
      }
      attempts++;
    }

    if (!isCodeUnique || !teamCode) {
      return NextResponse.json({ error: 'Failed to generate a unique team code. Please try again later.' }, { status: 500 });
    }

    // Insert the new team into the database
    const { error: insertError } = await supabaseAdmin
      .from('teams')
      .insert({
        team_name: teamName.trim(),
        team_code: teamCode,
        created_by_uid: uid,
        created_by_email: email,
      });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: 'Database error: Could not create the team.' }, { status: 500 });
    }

    return NextResponse.json({ teamCode: teamCode }, { status: 201 });

  } catch (error: any) {
    console.error('Create team API error:', error);
    // Generic error for any other unexpected issues
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
