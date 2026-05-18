"use client";

import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useShallow } from "zustand/react/shallow";

const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5;

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartStore(
    useShallow((s) => ({
      cart: s.cart,
      removeFromCart: s.removeFromCart,
      updateQuantity: s.updateQuantity,
      clearCart: s.clearCart,
    })),
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping =
    subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen py-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          My Cart
          {totalItems > 0 && (
            <span className="ml-2 text-sm font-medium text-gray-400">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          )}
        </h1>
      </div>

      {/* Empty state */}
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <ShoppingBag size={56} className="text-gray-200" />
          <p className="text-gray-400 text-sm">Your cart is empty</p>
          <Link
            href="/products"
            className="mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Item list */}
          <div className="flex-1 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border rounded-2xl bg-white"
              >
                {/* Thumbnail */}
                <Link href={`/products/${item.id}`} className="flex-shrink-0">
                  <ProductImage
                    src={item.thumbnail}
                    alt={item.title}
                    width={80}
                    height={80}
                    className="rounded-xl object-cover w-20 h-20"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.id}`}>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-orange-500 transition-colors">
                      {item.title}
                    </p>
                  </Link>
                  <p className="text-orange-500 font-bold mt-1 text-sm">
                    ${item.price.toFixed(2)}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-400 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Item total + remove */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-800">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
            >
              Remove all items
            </button>
          </div>

          {/* Order summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="border rounded-2xl p-5 bg-white sticky top-20">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-medium text-gray-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span
                    className={
                      shipping === 0
                        ? "font-medium text-green-500"
                        : "font-medium text-gray-900"
                    }
                  >
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {subtotal > 0 && subtotal < SHIPPING_THRESHOLD && (
                  <p className="text-xs text-gray-400">
                    Add ${(SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for
                    free shipping
                  </p>
                )}
              </div>

              <div className="border-t pt-4 flex justify-between mb-5">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full text-center mt-3 text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
