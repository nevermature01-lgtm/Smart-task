'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

type SyncUserPayload = {
  firebase_uid: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
};

export async function syncUser(payload: SyncUserPayload) {
  if (!payload.firebase_uid || !payload.email) {
    return { error: 'Firebase UID and email are required.' };
  }

  // 1. Check if user already exists
  const { data: existingUser, error: selectError } = await supabaseAdmin
    .from('users')
    .select('firebase_uid')
    .eq('firebase_uid', payload.firebase_uid)
    .single();

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "exact one row not found"
    console.error('Error checking for user in Supabase:', selectError);
    return { error: 'Could not verify user existence.' };
  }

  // 2. If user does not exist, insert them
  if (!existingUser) {
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      firebase_uid: payload.firebase_uid,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
    });

    if (insertError) {
      console.error('Error inserting new user into Supabase:', insertError);
      return { error: 'Could not create user profile in database.' };
    }
  }

  return { success: true };
}
