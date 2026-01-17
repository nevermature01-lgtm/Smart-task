'use client';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These values should be in your .env.local file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing from environment variables.');
}

// This client is safe to use on the client-side.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
