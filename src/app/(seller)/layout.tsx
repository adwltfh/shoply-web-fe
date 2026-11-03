import { Suspense, type ReactNode } from "react";

import { signOut } from "@/app/login/actions";
import { SellerShell } from "@/components/seller-shell";
import { ModeBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui";
import { getSellerContext } from "@/lib/auth/dal";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <SellerShell
      header={
        <Suspense fallback={<Skeleton className="h-5 w-48" />}>
          <StoreHeader />
        </Suspense>
      }
    >
      <Suspense fallback={null}>
        <DemoBanner />
      </Suspense>
      {children}
    </SellerShell>
  );
}

async function StoreHeader() {
  const ctx = await getSellerContext();
  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold">{ctx.store.name}</span>
        <ModeBadge mode={ctx.store.mode} />
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-ink-2 sm:inline" title={ctx.email ?? undefined}>
          {ctx.email} · <span className="capitalize">{ctx.role}</span>
        </span>
        <form action={signOut}>
          <button type="submit" className="rounded-md px-2 py-1 text-sm text-ink-2 hover:bg-line/60 hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}

async function DemoBanner() {
  const ctx = await getSellerContext();
  if (ctx.store.mode !== "demo") return null;
  return (
    <p className="mb-5 rounded-[var(--radius-card)] border border-warning/30 bg-warning-soft px-4 py-2 text-sm text-ink">
      <strong className="font-semibold">Demo mode.</strong> Orders and payments in this store are simulated. No real money is collected.
    </p>
  );
}
