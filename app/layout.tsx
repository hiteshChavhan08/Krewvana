import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"; // Or sonner
import Providers from "./providers";
import NotificationPopup from "@/components/notification/NotificationPopup";
import WebSocketInitializer from "@/components/notification/WebSocketInitializer";

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <WebSocketInitializer />
          <NotificationPopup />
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
