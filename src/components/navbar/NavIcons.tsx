"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Heart, ShoppingCart, User, LogOut } from "lucide-react";
import Image from "next/image";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/useWishlistStore";

export default function NavIcons() {
  const router = useRouter();

  const totalItems = useCartStore((s) =>
    s.cart.reduce((sum, item) => sum + item.quantity, 0),
  );

  const { user, isAuthenticated, logout } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      isAuthenticated: s.isAuthenticated,
      logout: s.logout,
    })),
  );

  const {
    items: wishlistItems,
    clearWishlist,
    userId: wishlistUserId,
    setUser,
  } = useWishlistStore(
    useShallow((s) => ({
      items: s.items,
      clearWishlist: s.clearWishlist,
      userId: s.userId,
      setUser: s.setUser,
    })),
  );

  const wishlistCount = wishlistItems.length;

  // Re-hydrate wishlist after page reload when auth is already persisted
  useEffect(() => {
    if (user?.id && user.id !== wishlistUserId) {
      setUser(user.id);
    }
  }, [user?.id, wishlistUserId, setUser]);

  const handleLogout = () => {
    logout();
    clearWishlist();
    router.push("/");
  };

  return (
    <div className="flex items-center gap-4 text-gray-600">
      {/* Wishlist */}
      <Link href="/wishlist" className="relative">
        <Heart className="w-5 h-5 cursor-pointer hover:text-orange-500 transition-colors" />
        {wishlistCount > 0 && (
          <span className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-0.5">
            {wishlistCount > 99 ? "99+" : wishlistCount}
          </span>
        )}
      </Link>

      {/* Cart */}
      <Link href="/cart" className="relative">
        <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-orange-500 transition-colors" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 text-xs bg-orange-500 text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-0.5">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </Link>

      {/* User */}
      {isAuthenticated && user ? (
        <div className="flex items-center gap-2">
          <Link href="/wishlist" title={`${user.firstName} ${user.lastName}`}>
            {user.image ? (
              <Image
                src={user.image}
                alt={user.username}
                width={28}
                height={28}
                className="rounded-full object-cover ring-2 ring-orange-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                {user.firstName[0]}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-gray-400 hover:text-orange-500 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <Link href="/login">
          <User className="w-5 h-5 cursor-pointer hover:text-orange-500 transition-colors" />
        </Link>
      )}
    </div>
  );
}
