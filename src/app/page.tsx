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
      <hr/>
    </main>
  );
}
