// /src/lib/supabase/client.ts
// 1. CREATES A REUSABLE SUPABASE CLIENT

import { createBrowserClient } from '@supabase/ssr'

// Define a function to create a Supabase client for browser-side operations.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and/or Anon Key are not defined. Please check your .env file.');
  }
  
  // The createBrowserClient function is used to create a Supabase client instance
  // that is safe to use in a browser environment.
  return createBrowserClient(
    // Pass the Supabase project URL from environment variables.
    supabaseUrl,
    // Pass the Supabase anon key from environment variables.
    supabaseAnonKey
  )
}
