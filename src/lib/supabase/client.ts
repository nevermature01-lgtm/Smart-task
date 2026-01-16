// /src/lib/supabase/client.ts
// 1. CREATES A REUSABLE SUPABASE CLIENT

import { createBrowserClient } from '@supabase/ssr'

// Define a function to create a Supabase client for browser-side operations.
export function createClient() {
  // The createBrowserClient function is used to create a Supabase client instance
  // that is safe to use in a browser environment.
  return createBrowserClient(
    // Pass the Supabase project URL from environment variables.
    // The `!` asserts that this value is non-null.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Pass the Supabase anon key from environment variables.
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
