"use client";

import { useCounterStore } from "@/store/counterStore";
import { useAuthStore } from "@/store/authStore";
import Hero from "@/components/home/Hero";
import Categories from "@/components/home/Categories";

export default function Home() {
  const { count, increment, decrement, reset } = useCounterStore();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  const handleMockLogin = () => {
    setUser({ id: "1", name: "Jane Doe", email: "jane@example.com" });
  };

  return (
    <main className="min-h-screen mx-auto">
      <Hero />
      <Categories />
      
      {/* <h1 className="text-3xl font-bold mb-2">Next.js Boilerplate</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Next.js · Tailwind CSS · React Query · Zustand · Axios 
      </p> */}

      {/* Zustand Counter */}
      {/* <section className="mb-8 p-6 border rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Zustand Counter Store</h2>
        <p className="text-4xl font-mono mb-4">{count}</p>
        <div className="flex gap-2">
          <button
            onClick={decrement}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono"
          >
            −
          </button>
          <button
            onClick={increment}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono"
          >
            +
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            Reset
          </button>
        </div>
      </section> */}

      {/* Zustand Auth Store */}
      {/* <section className="mb-8 p-6 border rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Zustand Auth Store</h2>
        {isAuthenticated && user ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleMockLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Mock Login
          </button>
        )}
      </section> */}

      {/* Stack summary */}
      {/* <section className="p-6 bg-gray-50 rounded-xl text-sm text-gray-600">
        <h2 className="font-semibold text-gray-900 mb-3">Stack</h2>
        <ul className="space-y-1">
          <li>✅ <strong>Next.js 15</strong> — App Router, TypeScript</li>
          <li>✅ <strong>Tailwind CSS v4</strong> — utility-first styling</li>
          <li>✅ <strong>React Query v5</strong> — server state, caching, devtools</li>
          <li>✅ <strong>Zustand v5</strong> — client state (with devtools + persist)</li>
          <li>✅ <strong>Axios</strong> — HTTP client with request/response interceptors</li>
        </ul>
      </section> */}
    </main>
  );
}
