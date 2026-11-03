"use client";

import { useActionState } from "react";

import { Button, Field, inputClass, Notice } from "@/components/ui";

import { signIn, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      <Field id="email" label="Email">
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state.email} className={inputClass} />
      </Field>
      <Field id="password" label="Password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
