import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-white mt-12">
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <Link href="/" className="inline-block mb-3">
            <Image
              src="/logo-1.png"
              alt="Shoply Logo"
              width={140}
              height={140}
              className="object-contain"
            />
          </Link>
          <p className="text-sm text-gray-500">
            Your one-stop shop for the best products at unbeatable prices.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Shop
          </h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <a
                href="/products"
                className="hover:text-gray-800 transition-colors"
              >
                All Products
              </a>
            </li>
            <li>
              <a
                href="/categories"
                className="hover:text-gray-800 transition-colors"
              >
                Categories
              </a>
            </li>
            <li>
              <a href="/cart" className="hover:text-gray-800 transition-colors">
                Cart
              </a>
            </li>
            <li>
              <a
                href="/checkout"
                className="hover:text-gray-800 transition-colors"
              >
                Checkout
              </a>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Support
          </h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Shipping Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Returns
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Follow Us */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Follow Us
          </h3>
          <ul className="space-y-2 text-sm text-gray-500">
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Twitter / X
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                Facebook
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-gray-800 transition-colors">
                TikTok
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Shoply. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
