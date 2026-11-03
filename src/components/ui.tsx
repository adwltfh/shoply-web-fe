import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:bg-primary-hover border border-transparent font-semibold",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-canvas",
  danger: "bg-surface text-danger border border-danger/40 hover:bg-danger-soft",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-line/60",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md") {
  return cx(
    "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-input)] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variantClass[variant],
    sizeClass[size],
  );
}

export function Button({ variant = "secondary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({ variant = "secondary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cx(buttonClass(variant, size), className)} {...props} />;
}

export const inputClass =
  "block w-full rounded-[var(--radius-input)] border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-2/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-danger disabled:bg-canvas disabled:text-ink-2";

export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger" aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-ink-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria props wiring an input to its Field hint/error. */
export function fieldAria(id: string, error?: string, hasHint = false) {
  const describedBy = error ? `${id}-error` : hasHint ? `${id}-hint` : undefined;
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy } as const;
}

export function Card({ title, description, actions, children, className, id }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cx("rounded-[var(--radius-card)] border border-line bg-surface", className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div>
            {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-ink-2">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions, breadcrumb }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-1 text-sm text-ink-2">{breadcrumb}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Notice({ tone = "info", title, children, id, tabIndex }: { tone?: "info" | "danger" | "warning" | "success"; title?: string; children?: ReactNode; id?: string; tabIndex?: number }) {
  const toneClass = {
    info: "border-line bg-surface text-ink",
    danger: "border-danger/30 bg-danger-soft text-ink",
    warning: "border-warning/30 bg-warning-soft text-ink",
    success: "border-success/30 bg-success-soft text-ink",
  }[tone];
  return (
    <div id={id} tabIndex={tabIndex} role={tone === "danger" ? "alert" : "status"} className={cx("rounded-[var(--radius-card)] border px-4 py-3 text-sm", toneClass)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : undefined}>{children}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-line/70", className)} aria-hidden="true" />;
}

export function PageSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
