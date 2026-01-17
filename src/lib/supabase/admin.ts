import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'

// This client is for server-side use only, with elevated privileges.
// NEVER expose the service role key to the client.
export const supabaseAdmin = createClient(
  supabaseConfig.url,
  supabaseConfig.serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
