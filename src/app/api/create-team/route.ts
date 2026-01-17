// Enforce Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';

// Function to generate a unique 6-digit numeric code
async function generateUniqueTeamCode(): Promise<string> {
  const db = admin.firestore();
  let teamCode: string;
  let isUnique = false;

  while (!isUnique) {
    teamCode = Math.floor(100000 + Math.random() * 900000).toString();
    const snapshot = await db.collection('teams').where('code', '==', teamCode).limit(1).get();
    if (snapshot.empty) {
      isUnique = true;
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

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid } = decodedToken;

    if (!uid) {
      return NextResponse.json({ error: 'Invalid token payload.' }, { status: 401 });
    }
    
    const teamCode = await generateUniqueTeamCode();
    
    const db = admin.firestore();
    const teamData = {
        name: teamName.trim(),
        code: teamCode,
        createdBy: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const newTeamRef = await db.collection('teams').add(teamData);

    return NextResponse.json({ teamCode: teamCode, teamId: newTeamRef.id }, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error' || error.code?.startsWith('auth/')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
