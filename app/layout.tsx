// --- File: app/layout.tsx ---
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Standard Next.js global CSS
import Sidebar from "@/components/layout/sidebar"; // Custom sidebar component
import Header from "@/components/layout/header"; // Custom header component
import { cn } from "@/lib/utils"; // Utility for conditional classNames (from shadcn/ui setup)
import SessionProvider from "@/components/providers/session-provider"; // Import the provider

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Kanaka Employee Engagement",
  description: "Kanaka Platform - Engaging our employees",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        {/* Wrap the entire content with SessionProvider */}
        <SessionProvider>
          <div className="flex min-h-screen w-full">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex-1 p-6 md:p-8 lg:p-10">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}