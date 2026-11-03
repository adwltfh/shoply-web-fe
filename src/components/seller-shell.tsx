"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

import { cx } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/settings/pickup-addresses", label: "Pickup addresses" },
] as const;

function CurrentNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

/** usePathname() is request data; the fallback renders the same links without the active state. */
function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavList pathname={null} onNavigate={onNavigate} />}>
      <CurrentNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="Seller navigation">
      <ul className="space-y-0.5">
        {NAV.map((item) => {
          const active = pathname !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block rounded-md px-3 py-2 text-sm",
                  active ? "bg-primary-soft font-semibold text-primary-ink" : "text-ink-2 hover:bg-line/60 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 px-3 text-xs leading-relaxed text-ink-2">
        Orders, payments, campaigns, fulfillment and cart insights are built in later phases.
      </p>
    </nav>
  );
}

export function SellerShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:block">
        <div className="sticky top-0 px-3 py-4">
          <Link href="/dashboard" className="mb-5 block px-3 text-base font-semibold tracking-tight">
            Shoply <span className="text-primary">Seller</span>
          </Link>
          <NavLinks />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72 max-w-[85vw] bg-surface px-3 py-4 shadow-lg">
            <div className="mb-5 flex items-center justify-between px-3">
              <span className="text-base font-semibold tracking-tight">
                Shoply <span className="text-primary">Seller</span>
              </span>
              <button type="button" className="rounded-md px-2 py-1 text-sm text-ink-2 hover:bg-line/60" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              className="-ml-1 rounded-md border border-line-strong px-2.5 py-1.5 text-sm lg:hidden"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              Menu
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">{header}</div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
