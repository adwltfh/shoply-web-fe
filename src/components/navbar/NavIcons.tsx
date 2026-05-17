"use client";

import Link from "next/link";
import { Heart, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export default function NavIcons() {
  const totalItems = useCartStore((state) =>
    state.cart.reduce((sum, item) => sum + item.quantity, 0),
  );

  return (
    <div className="flex items-center gap-4 text-gray-600">
      <Heart className="w-5 h-5 cursor-pointer hover:text-orange-500" />
      <Link href="/cart" className="relative">
        <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-orange-500" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-0.5">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>
      <User className="w-5 h-5 cursor-pointer hover:text-orange-500" />
    </div>
  );
}
