"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function Logo() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/categories") {
    return (
      <button
        onClick={() => router.back()}
        className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-500 transition-colors flex-shrink-0 m-2"
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
      </button>
    );
  }

  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-semibold text-lg flex-shrink-0"
    >
      <Image
        src="/logo-1.png"
        alt="Shoply Logo"
        width={100}
        height={100}
        className="object-contain"
      />
    </Link>
  );
}
