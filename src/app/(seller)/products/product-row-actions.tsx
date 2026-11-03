"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { ProductStatus, ProductStatusAction } from "@/contracts/catalog";
import { buttonClass } from "@/components/ui";
import { PUBLISH_PROBLEM_LABELS } from "@/lib/errors";

import { duplicateProduct, setProductStatus } from "./actions";

export function ProductRowActions({ productId, status, title }: { productId: string; status: ProductStatus; title: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = (action: ProductStatusAction) => {
    if (action === "archive" && !window.confirm(`Archive “${title}”? It will be hidden from buyers. Order history is kept and you can restore it later.`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setProductStatus(productId, action);
      if (!result.ok) {
        const problems = result.problems?.map((p) => PUBLISH_PROBLEM_LABELS[p]?.label ?? p).join(" ");
        setMessage(problems ? `${result.message} ${problems}` : result.message);
      }
    });
  };

  const duplicate = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await duplicateProduct(productId);
      if (result && !result.ok) setMessage(result.message);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1.5" aria-busy={pending}>
        <Link href={`/products/${productId}`} className={buttonClass("secondary", "sm")}>
          Edit
        </Link>
        {status === "active" || status === "scheduled" ? (
          <button type="button" className={buttonClass("ghost", "sm")} disabled={pending} onClick={() => run("pause")}>
            Pause
          </button>
        ) : null}
        {status === "paused" ? (
          <button type="button" className={buttonClass("ghost", "sm")} disabled={pending} onClick={() => run("publish")}>
            Unpause
          </button>
        ) : null}
        {status !== "archived" ? (
          <>
            <button type="button" className={buttonClass("ghost", "sm")} disabled={pending} onClick={duplicate}>
              Duplicate
            </button>
            <button type="button" className={buttonClass("ghost", "sm")} disabled={pending} onClick={() => run("archive")}>
              Archive
            </button>
          </>
        ) : (
          <button type="button" className={buttonClass("ghost", "sm")} disabled={pending} onClick={() => run("restore")}>
            Restore
          </button>
        )}
      </div>
      {message ? (
        <p role="alert" className="max-w-xs text-right text-xs text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}
