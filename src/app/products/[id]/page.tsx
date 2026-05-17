"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import ProductImage from "@/components/ProductImage";
import {
  ArrowLeft,
  Heart,
  Star,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";
import { productApi } from "@/services/api";
import { useCartStore } from "@/store/useCartStore";
import ProductCard from "@/components/ProductCard";

type Tab = "description" | "specifications" | "reviews";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const addToCart = useCartStore((state: any) => state.addToCart);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [wishlisted, setWishlisted] = useState(false);
  const [bottomSheet, setBottomSheet] = useState<"cart" | "buy" | null>(null);
  const [modalQty, setModalQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.getById(Number(id)),
    enabled: !!id,
  });

  const { data: relatedData } = useQuery({
    queryKey: ["related-products", product?.category],
    queryFn: () => productApi.getByCategorySlug(product!.category, 0, 5),
    enabled: !!product?.category,
  });

  const relatedProducts = (relatedData?.products ?? [])
    .filter((p) => p.id !== Number(id))
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen py-6 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-100 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="w-full aspect-square rounded-3xl bg-gray-100" />
          <div className="space-y-4">
            <div className="h-6 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
            <div className="h-8 w-1/3 rounded bg-gray-100" />
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Product not found.
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.thumbnail];
  const originalPrice =
    product.discountPercentage > 0
      ? product.price / (1 - product.discountPercentage / 100)
      : null;

  const handleAddToCart = (qty: number) => {
    addToCart({
      id: product!.id,
      title: product!.title,
      price: product!.price,
      thumbnail: product!.thumbnail,
      quantity: qty,
    });
  };

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
        <button
          onClick={() => setWishlisted((w) => !w)}
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
            wishlisted
              ? "border-orange-400 text-orange-500"
              : "border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-400"
          }`}
        >
          <Heart size={16} className={wishlisted ? "fill-orange-500" : ""} />
        </button>
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        {/* Left — image area */}
        <div>
          <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gray-100 mb-3">
            <ProductImage
              src={images[selectedImage]}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mb-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`rounded-full transition-all ${
                  i === selectedImage
                    ? "w-4 h-2 bg-orange-500"
                    : "w-2 h-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === selectedImage
                      ? "border-orange-500"
                      : "border-gray-200"
                  }`}
                >
                  <ProductImage
                    src={img}
                    alt={`${product.title} view ${i + 1}`}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — product info */}
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {product.title}
          </h1>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.round(product.rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200 fill-gray-200"
                  }
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              ({product.reviews?.length ?? 0} reviews)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {originalPrice && (
              <>
                <span className="text-base text-gray-400 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  -{Math.round(product.discountPercentage)}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-gray-500 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity — desktop only */}
          <div className="hidden md:block mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-base font-semibold text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* CTA buttons — desktop only */}
          <div className="hidden md:flex gap-3 mb-6">
            <button
              onClick={() => handleAddToCart(quantity)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button
              onClick={() => handleAddToCart(quantity)}
              className="flex-1 flex items-center justify-center border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold py-3.5 rounded-2xl transition-colors"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Benefits strip */}
      <div className="flex justify-between border rounded-2xl py-4 px-3 mb-8">
        <div className="flex flex-col items-center gap-1 text-center flex-1">
          <Truck size={20} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-700">
            Free Shipping
          </span>
          <span className="text-xs text-gray-400">On orders over $50</span>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex flex-col items-center gap-1 text-center flex-1">
          <ShieldCheck size={20} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-700">
            Secure Payment
          </span>
          <span className="text-xs text-gray-400">100% secure</span>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex flex-col items-center gap-1 text-center flex-1">
          <RotateCcw size={20} className="text-orange-500" />
          <span className="text-xs font-semibold text-gray-700">
            30 Days Return
          </span>
          <span className="text-xs text-gray-400">Easy returns</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex border-b mb-4">
          {(["description", "specifications", "reviews"] as Tab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-orange-500 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "reviews"
                  ? `Reviews (${product.reviews?.length ?? 0})`
                  : tab}
              </button>
            ),
          )}
        </div>

        {activeTab === "description" && (
          <div className="text-sm text-gray-600 leading-relaxed">
            <p className="mb-4">{product.description}</p>
            {product.tags?.length > 0 && (
              <ul className="space-y-1.5">
                {product.tags.map((tag) => (
                  <li key={tag} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="capitalize">{tag}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="text-sm space-y-0">
            {(
              [
                ["Brand", product.brand],
                ["SKU", product.sku],
                ["Weight", `${product.weight} g`],
                [
                  "Dimensions",
                  product.dimensions
                    ? `${product.dimensions.width} × ${product.dimensions.height} × ${product.dimensions.depth} cm`
                    : "-",
                ],
                ["Stock", `${product.stock} units`],
                ["Warranty", product.warrantyInformation],
                ["Shipping", product.shippingInformation],
                ["Availability", product.availabilityStatus],
                ["Return Policy", product.returnPolicy],
                ["Min. Order Qty", String(product.minimumOrderQuantity)],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between py-2.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-800 text-right max-w-[55%]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-3">
            {product.reviews?.length ? (
              product.reviews.map((review, i) => (
                <div key={i} className="border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {review.reviewerName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        size={11}
                        className={
                          j < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                No reviews yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* You May Also Like */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile sticky CTA bar */}
      <div className="fixed bottom-0 inset-x-0 md:hidden bg-white border-t px-4 py-3 z-40 flex gap-3">
        <button
          onClick={() => {
            setModalQty(1);
            setBottomSheet("cart");
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
        <button
          onClick={() => {
            setModalQty(1);
            setBottomSheet("buy");
          }}
          className="flex-1 flex items-center justify-center border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold py-3.5 rounded-2xl transition-colors"
        >
          Buy Now
        </button>
      </div>

      {/* Mobile bottom sheet modal */}
      {bottomSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
            onClick={() => setBottomSheet(null)}
          />
          <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl">
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

            {/* Product summary */}
            <div className="flex gap-3 mb-5 items-center">
              <ProductImage
                src={product.thumbnail}
                alt={product.title}
                width={64}
                height={64}
                className="rounded-2xl object-cover flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">
                  {product.title}
                </p>
                <p className="text-orange-500 font-bold mt-1">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Quantity */}
            <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-base font-semibold text-gray-900">
                {modalQty}
              </span>
              <button
                onClick={() =>
                  setModalQty((q) => Math.min(product.stock, q + 1))
                }
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Confirm */}
            <button
              onClick={() => {
                handleAddToCart(modalQty);
                setBottomSheet(null);
              }}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
            >
              <ShoppingCart size={18} />
              {bottomSheet === "cart" ? "Add to Cart" : "Buy Now"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
