"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import ProductImage from "@/components/ProductImage";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addToCart);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 py-12">
        <Heart size={52} className="text-gray-200" />
        <p className="text-gray-700 font-semibold">
          Sign in to view your wishlist
        </p>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Save items you love and access them anytime after logging in.
        </p>
        <Link
          href="/login?callback=/wishlist"
          className="mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-2xl transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex-shrink-0"
        >
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Wishlist</h1>
          {items.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Heart size={56} className="text-gray-200" />
          <p className="text-gray-400 text-sm">No saved items yet</p>
          <Link
            href="/products"
            className="mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="group flex flex-col gap-2 relative">
              {/* Remove button */}
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove from wishlist"
              >
                <Trash2 size={13} />
              </button>

              {/* Card */}
              <Link
                href={`/products/${item.id}`}
                className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100"
              >
                <ProductImage
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </Link>

              <div className="flex flex-col gap-1 px-0.5">
                <Link
                  href={`/products/${item.id}`}
                  className="text-xs font-semibold text-gray-800 hover:text-orange-500 transition-colors line-clamp-2 leading-tight"
                >
                  {item.title}
                </Link>
                <span className="text-sm font-bold text-gray-900">
                  ${item.price.toFixed(2)}
                </span>
                <button
                  onClick={() =>
                    addToCart({
                      id: item.id,
                      title: item.title,
                      price: item.price,
                      thumbnail: item.thumbnail,
                      quantity: 1,
                    })
                  }
                  className="mt-1 flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <ShoppingCart size={12} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
