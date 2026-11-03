import type { DisplayStatus } from "@/contracts/catalog";
import { cx } from "@/components/ui";

const STYLES: Record<DisplayStatus, { label: string; className: string; mark: string }> = {
  draft: { label: "Draft", className: "border-line-strong bg-canvas text-ink-2", mark: "○" },
  scheduled: { label: "Scheduled", className: "border-warning/30 bg-warning-soft text-warning", mark: "◷" },
  active: { label: "Active", className: "border-success/30 bg-success-soft text-success", mark: "●" },
  paused: { label: "Paused", className: "border-line-strong bg-surface text-ink", mark: "❚❚" },
  expired: { label: "Expired", className: "border-line-strong bg-canvas text-ink-2", mark: "◌" },
  archived: { label: "Archived", className: "border-line bg-canvas text-ink-2 line-through decoration-ink-2/40", mark: "▣" },
};

/** Status is conveyed by text + symbol, not colour alone. */
export function StatusBadge({ status }: { status: DisplayStatus }) {
  const style = STYLES[status] ?? STYLES.draft;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", style.className)}>
      <span aria-hidden="true" className="text-[0.65rem]">
        {style.mark}
      </span>
      {style.label}
    </span>
  );
}

export function ModeBadge({ mode }: { mode: "demo" | "live" }) {
  return mode === "live" ? (
    <span className="rounded-md border border-danger/40 bg-danger-soft px-2 py-0.5 text-xs font-bold tracking-wide text-danger">LIVE</span>
  ) : (
    <span className="rounded-md border border-warning/40 bg-warning-soft px-2 py-0.5 text-xs font-bold tracking-wide text-warning" title="Demo mode: no real orders or payments">
      DEMO
    </span>
  );
}
