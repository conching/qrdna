import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Create a Supabase client with the **service role** key.
 *
 * This bypasses Row-Level Security and should only be used in trusted
 * server-side contexts (e.g. scan logging from anonymous users,
 * background jobs, admin operations).
 *
 * Never expose the service role key to the browser.
 */
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
