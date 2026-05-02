"use client";

import { Heart, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";


export default function NavIcons() {
  const cartCount = useCartStore((state) => state.cart.length);

  return (
    <div className="flex items-center gap-4 text-gray-600">
      <Heart className="w-5 h-5 cursor-pointer hover:text-orange-500" />
      <div className="relative">
        <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-orange-500" />
        <span className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white px-1 rounded-full">
          {cartCount}
        </span>
      </div>
      <User className="w-5 h-5 cursor-pointer hover:text-orange-500" />
    </div>
  );
}
