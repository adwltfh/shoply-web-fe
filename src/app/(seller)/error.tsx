"use client";

import { Button } from "@/components/ui";

export default function SellerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isConfig = error.name === "ConfigurationError" || error.message.includes("Supabase is not configured");
  return (
    <div role="alert" className="max-w-xl rounded-[var(--radius-card)] border border-danger/30 bg-danger-soft p-5">
      <h1 className="text-lg font-semibold">{isConfig ? "Backend not configured" : "This page could not load"}</h1>
      <p className="mt-1 text-sm text-ink">
        {isConfig
          ? "Set the Supabase URL and publishable key in .env.local, then restart the dev server."
          : "The data could not be loaded. Check your connection and try again."}
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-ink-2">Reference: {error.digest}</p> : null}
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
