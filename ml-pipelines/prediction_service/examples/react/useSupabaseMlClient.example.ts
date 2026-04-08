/**
 * Example: wire the ML client to Supabase auth so your .NET API (or FastAPI behind auth) receives Bearer tokens.
 * Copy into your app and adjust import paths.
 *
 * import { createClient } from '@supabase/supabase-js'
 * import { createMlClient, viteMlBaseUrl } from './mlPredictionClient'
 */

import { createMlClient, viteMlBaseUrl } from './mlPredictionClient';
// import type { SupabaseClient } from '@supabase/supabase-js';

/** Pass your Supabase client; forwards access_token on each request when present. */
export function createMlClientWithSupabase(
  supabase: { auth: { getSession: () => Promise<{ data: { session: { access_token: string } | null } }> } },
  /** Usually viteMlBaseUrl() pointing at your .NET BFF, not raw Python, in production. */
  baseUrl?: string,
) {
  return createMlClient({
    baseUrl: baseUrl ?? viteMlBaseUrl(),
    getAccessToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  });
}
