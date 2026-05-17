"use client";

import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { Star } from "lucide-react";
import { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const originalPrice =
    product.discountPercentage > 0
      ? product.price / (1 - product.discountPercentage / 100)
      : null;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col gap-2"
    >
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100">
        {product.discountPercentage > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{Math.round(product.discountPercentage)}%
          </div>
        )}
        <ProductImage
          src={product.thumbnail}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <span className="text-xs font-semibold text-gray-800 group-hover:text-orange-500 transition-colors line-clamp-2 leading-tight">
          {product.title}
        </span>
        <div className="flex items-center gap-1">
          <Star size={10} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-400">
            {product.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
