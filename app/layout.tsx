// --- File: app/layout.tsx ---
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Standard Next.js global CSS

import { cn } from "@/lib/utils"; // Utility for conditional classNames (from shadcn/ui setup)
import SessionProvider from "@/components/providers/session-provider"; // Import the provider
import { ThemeProvider } from "@/components/theme-provider"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Toaster } from "@/components/ui/sonner"
 
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-16 items-center px-4 sm:px-6">
                <MainNav />
                <div className="ml-auto flex items-center space-x-4">
                  <UserNav />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}