// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // <-- Import your component
import { Toaster } from "@/components/ui/sonner"; // Or sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanaka Employee Engagement",
  description: "Boosting morale and collaboration at Kanaka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* suppressHydrationWarning is recommended by next-themes */}
      <body className={inter.className}>
        <ThemeProvider
          attribute="class" // <--- Crucial for shadcn/ui: applies 'light' or 'dark' class to <html>
          defaultTheme="system" // <--- Sets the default theme (system, light, or dark)
          enableSystem // <--- Allows respecting the user's OS preference
          disableTransitionOnChange // Optional: Disables CSS transitions during theme change to prevent flashes
        >
          {/* Your other layout components (Navbar, Sidebar, etc.) can go here */}
          
          {children} {/* Your page content */}

          <Toaster richColors position="bottom-right" /> {/* Include the Toaster from Sonner/shadcn */}

        </ThemeProvider>
      </body>
    </html>
  );
}