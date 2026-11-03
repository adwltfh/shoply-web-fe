"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { Button, Card, Field, inputClass, Notice } from "@/components/ui";
import type { ProductEditData } from "@/lib/catalog/queries";

import { deleteProductImage, setMainProductImage, uploadProductImage } from "./actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

export function ProductImages({ productId, images, readOnly }: { productId: string; images: ProductEditData["images"]; readOnly: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = (formData: FormData) => {
    setError(null);
    const file = formData.get("file");
    // Client checks are a courtesy; the server sniffs the bytes again.
    if (!(file instanceof File) || file.size === 0) return setError("Choose an image to upload.");
    if (file.size > MAX_BYTES) return setError("Images must be 5 MB or smaller.");
    if (!ACCEPT.includes(file.type)) return setError("Only JPEG, PNG or WebP images are accepted.");
    formData.set("productId", productId);
    startTransition(async () => {
      const result = await uploadProductImage(formData);
      if (!result.ok) setError(result.message);
      else formRef.current?.reset();
    });
  };

  const remove = (imageId: string) => {
    if (!window.confirm("Remove this photo?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProductImage(productId, imageId);
      if (!result.ok) setError(result.code === "PUBLISH_REQUIREMENTS" ? "A live product needs at least one photo. Upload another photo first." : result.message);
    });
  };

  const makeMain = (imageId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await setMainProductImage(productId, imageId);
      if (!result.ok) setError(result.message);
    });
  };

  return (
    <Card title="Photos" description="The first photo is the main image. JPEG, PNG or WebP, up to 5 MB, max 10.">
      <div className="space-y-4" aria-busy={pending}>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {images.length === 0 ? (
          <p className="text-sm text-ink-2">No photos yet. A main photo is required before publishing.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {images.map((img, i) => (
              <li key={img.id} className="overflow-hidden rounded-md border border-line">
                <div className="relative aspect-square bg-canvas">
                  <Image src={img.url} alt={img.alt_text || `Product photo ${i + 1}`} fill sizes="160px" className="object-cover" />
                  {i === 0 ? <span className="absolute left-1.5 top-1.5 rounded bg-surface/95 px-1.5 py-0.5 text-[0.65rem] font-semibold">Main</span> : null}
                </div>
                {!readOnly ? (
                  <div className="flex flex-wrap gap-1 p-1.5">
                    {i > 0 ? (
                      <Button size="sm" variant="ghost" disabled={pending} onClick={() => makeMain(img.id)}>
                        Make main
                      </Button>
                    ) : null}
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove(img.id)} aria-label={`Remove photo ${i + 1}`}>
                      Remove
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {!readOnly && images.length < 10 ? (
          <form ref={formRef} action={upload} className="space-y-3 border-t border-line pt-4">
            <Field id="image-file" label="Add photo">
              <input ref={fileRef} id="image-file" name="file" type="file" accept={ACCEPT.join(",")} className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm" />
            </Field>
            <Field id="image-alt" label="Alt text" hint="Describe the photo for screen-reader users.">
              <input id="image-alt" name="altText" maxLength={200} className={inputClass} aria-describedby="image-alt-hint" />
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Upload photo"}
            </Button>
          </form>
        ) : null}
      </div>
    </Card>
  );
}
