"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  CreditCard,
  Banknote,
  Wallet,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/authStore";
import ProductImage from "@/components/ProductImage";

const SHIPPING_THRESHOLD = 50;
const SHIPPING_COST = 5;

type PaymentMethod = "card" | "wallet" | "cod";

interface ShippingForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  notes: string;
}

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, etc.",
    icon: <CreditCard size={18} />,
  },
  {
    id: "wallet",
    label: "Digital Wallet",
    description: "GoPay, OVO, DANA",
    icon: <Wallet size={18} />,
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: <Banknote size={18} />,
  },
];

export default function CheckoutPage() {
  const router = useRouter();

  const { cart, clearCart } = useCartStore(
    useShallow((s) => ({ cart: s.cart, clearCart: s.clearCart })),
  );
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [form, setForm] = useState<ShippingForm>({
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    notes: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping =
    subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const validate = () => {
    const next: Partial<ShippingForm> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.zipCode.trim()) next.zipCode = "ZIP code is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ShippingForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    clearCart();
    setPlaced(true);
    setPlacing(false);
  };

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 py-12">
        <ShoppingBag size={52} className="text-gray-200" />
        <p className="text-gray-700 font-semibold">
          Sign in to continue checkout
        </p>
        <Link
          href="/login?callback=/checkout"
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-2xl transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cart.length === 0 && !placed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 py-12">
        <ShoppingBag size={52} className="text-gray-200" />
        <p className="text-gray-700 font-semibold">Your cart is empty</p>
        <Link
          href="/products"
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-2xl transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  // ── Order placed ───────────────────────────────────────────────────────────
  if (placed) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 py-12">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Order Placed!
          </h2>
          <p className="text-sm text-gray-400 max-w-xs">
            Thanks for your purchase. We&apos;ll notify you once your order is
            on its way.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border rounded-xl px-4 py-2.5">
          <Package size={14} className="text-orange-400" />
          Estimated delivery: 3 – 5 business days
        </div>
        <div className="flex gap-3 mt-2">
          <Link
            href="/products"
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 border border-gray-200 text-sm text-gray-600 hover:border-orange-400 hover:text-orange-500 rounded-2xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-5">
          {/* Delivery address */}
          <div className="border rounded-2xl p-5 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-orange-500" />
              <h2 className="text-base font-bold text-gray-900">
                Delivery Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                error={errors.fullName}
                placeholder="John Doe"
              />
              <Field
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={errors.phone}
                placeholder="+1 234 567 8900"
                type="tel"
              />
              <div className="sm:col-span-2">
                <Field
                  label="Street Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="123 Main St, Apt 4B"
                />
              </div>
              <Field
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                error={errors.city}
                placeholder="New York"
              />
              <Field
                label="ZIP / Postal Code"
                name="zipCode"
                value={form.zipCode}
                onChange={handleChange}
                error={errors.zipCode}
                placeholder="10001"
              />
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Order Notes{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Leave at door, ring bell, etc."
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none transition"
                />
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="border rounded-2xl p-5 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-orange-500" />
              <h2 className="text-base font-bold text-gray-900">
                Payment Method
              </h2>
            </div>

            <div className="space-y-2.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPayment(opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors ${
                    payment === opt.id
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 ${payment === opt.id ? "text-orange-500" : "text-gray-400"}`}
                  >
                    {opt.icon}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-sm font-semibold ${payment === opt.id ? "text-orange-600" : "text-gray-800"}`}
                    >
                      {opt.label}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {opt.description}
                    </span>
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      payment === opt.id
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300"
                    }`}
                  >
                    {payment === opt.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column — Order summary ─────────────────────────────────── */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="border rounded-2xl p-5 bg-white lg:sticky lg:top-20 space-y-4">
            <h2 className="text-base font-bold text-gray-900">Order Summary</h2>

            {/* Item list */}
            <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {cart.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border">
                    <ProductImage
                      src={item.thumbnail}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-800 flex-shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-medium text-gray-800">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span
                  className={
                    shipping === 0
                      ? "font-medium text-green-500"
                      : "font-medium text-gray-800"
                  }
                >
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-lg text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {placing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Placing order…
                </>
              ) : (
                "Place Order"
              )}
            </button>

            <Link
              href="/cart"
              className="block w-full text-center text-sm text-gray-400 hover:text-orange-500 transition-colors"
            >
              ← Back to cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field helper ───────────────────────────────────────────────────────────
function Field({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition ${
          error ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
