// IMPORTANT: These values should be set in your .env file.
// It is recommended to use environment variables for these values.

export const supabaseConfig = {
    // Example: "https://xyz.supabase.co"
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,

    // This is the public-facing anonymous key.
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    
    // This is the secret service role key. It should only be used on the server
    // and must be kept confidential.
    serviceKey: process.env.SUPABASE_SERVICE_KEY!
};
