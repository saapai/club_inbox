import { createClient } from '@supabase/supabase-js';

// Browser client for use in client components
export const createBrowserClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Default export for convenience
export const supabase = createBrowserClient();

