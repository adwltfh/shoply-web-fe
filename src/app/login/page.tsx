import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-lg font-semibold tracking-tight">
          Shoply <span className="text-primary">Seller</span>
        </p>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Sign in to your store</h1>
        <p className="mt-1 text-sm text-ink-2">Access is limited to invited store staff.</p>
        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
          <Suspense fallback={<LoginForm next="/dashboard" />}>
            <LoginFormWithNext searchParams={props.searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : "/dashboard"} />;
}
