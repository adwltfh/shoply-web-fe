import type { Metadata } from "next";

import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui";

export const metadata: Metadata = { title: "No store access" };

export default function NoAccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <h1 className="text-xl font-semibold">Your account has no store access</h1>
        <p className="mt-2 text-sm text-ink-2">
          You are signed in, but no active store membership is linked to this account. Ask the store owner to invite you. Accounts cannot grant
          themselves access.
        </p>
        <form action={signOut} className="mt-5">
          <Button type="submit">Sign out</Button>
        </form>
      </div>
    </main>
  );
}
