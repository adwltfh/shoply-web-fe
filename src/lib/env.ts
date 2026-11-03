import "server-only";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new ConfigurationError(
      "Supabase is not configured. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, publishableKey };
}

/**
 * Live mode needs BOTH the deployment (STORE_MODE=live) and the store record
 * (stores.mode = 'live', service-role only) to agree. Anything else is DEMO.
 */
export function resolveStoreMode(storeMode: string): "demo" | "live" {
  return process.env.STORE_MODE === "live" && storeMode === "live" ? "live" : "demo";
}
