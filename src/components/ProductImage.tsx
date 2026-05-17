"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

// 1×1 grey pixel — blurred by Next.js while the real image loads
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

// Inline SVG shown when the remote image fails to load
const ERROR_SRC =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Cg fill='%23d1d5db'%3E%3Crect x='155' y='148' width='90' height='72' rx='10'/%3E%3Ccircle cx='200' cy='168' r='16' fill='%23e5e7eb'/%3E%3Ccircle cx='200' cy='168' r='8' fill='%23d1d5db'/%3E%3Crect x='165' y='205' width='70' height='5' rx='2.5' fill='%23e5e7eb'/%3E%3C/g%3E%3C/svg%3E";

type ProductImageProps = Omit<
  ImageProps,
  "src" | "placeholder" | "blurDataURL"
> & { src: string };

export default function ProductImage({
  src,
  alt,
  onLoad,
  ...props
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      onLoad={onLoad}
      onError={() => setImgSrc(ERROR_SRC)}
      {...props}
    />
  );
}
