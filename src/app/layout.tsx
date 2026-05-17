import type { Metadata } from "next";
import { ReactQueryProvider } from "@/lib/react-query";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js Boilerplate",
  description: "Next.js + Tailwind CSS + React Query + Zustand + Axios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <Navbar />
          <div className="max-w-5xl mx-auto px-4">{children}</div>
          <Footer />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
