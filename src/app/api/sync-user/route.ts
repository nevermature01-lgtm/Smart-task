// Enforce Node.js runtime for Firebase Admin SDK
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { firebase_uid, email, first_name, last_name } = await request.json();

    if (!firebase_uid || !email) {
      return NextResponse.json({ error: 'Firebase UID and email are required.' }, { status: 400 });
    }
    
    const db = admin.firestore();
    const userRef = db.collection('users').doc(firebase_uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        return NextResponse.json({ message: 'User already exists in Firestore.' }, { status: 200 });
    }

    const userProfile = {
        email: email,
        firstName: first_name || '',
        lastName: last_name || '',
    };

    await userRef.set(userProfile);

    return NextResponse.json({ message: 'User profile created successfully in Firestore.' }, { status: 201 });

  } catch (error) {
    console.error('[SYNC_USER_ERROR] - Unexpected failure:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `An unexpected server error occurred: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected server error occurred.' }, { status: 500 });
  }
}
