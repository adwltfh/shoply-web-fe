"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") ?? "/";

  const setAuth = useAuthStore((s) => s.setAuth);
  const loadForUser = useWishlistStore((s) => s.loadForUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(username.trim(), password);
      setAuth(
        {
          id: res.id,
          username: res.username,
          email: res.email,
          firstName: res.firstName,
          lastName: res.lastName,
          image: res.image,
        },
        res.accessToken,
      );
      loadForUser(res.id);
      router.push(callback);
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername("emilys");
    setPassword("emilyspass");
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo-1.png" alt="Shoply" width={80} height={80} />
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-gray-400 text-center mb-8">
          Sign in to your account to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500 mb-2 font-medium">
            Demo credentials
          </p>
          <p className="text-xs text-gray-400 font-mono mb-2.5">
            emilys / emilyspass
          </p>
          <button
            onClick={fillDemo}
            className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
          >
            Fill automatically →
          </button>
        </div>
      </div>
    </div>
  );
}
