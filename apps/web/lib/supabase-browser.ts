"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Browser-safe Supabase client for use in "use client" components ONLY.
 * 
 * DO NOT use the server client (lib/supabase.ts) in client components —
 * it imports next/headers which is server-only.
 * 
 * For server components, server actions, and middleware: use lib/supabase.ts
 */
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
