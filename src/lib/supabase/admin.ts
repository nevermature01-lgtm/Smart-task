import { createClient } from '@supabase/supabase-js'

// IMPORTANT: These values should be set in your .env file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // This error will be caught during build time or on server startup.
  // It's a critical error if the environment variables are not set.
  throw new Error('Supabase URL or Service Key is missing from environment variables.');
}

// This client is for server-side use only, with elevated privileges.
// NEVER expose the service role key to the client.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
