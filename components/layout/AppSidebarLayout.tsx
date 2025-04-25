// components/layout/AppSidebarLayout.tsx
"use client";

import React, { useState } from "react";
// Ensure Sidebar and SidebarBody are imported, but SidebarLink might not be needed for Logout
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Award,
  Users,
  HeartPulseIcon,
  Lightbulb,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

// --- (Keep UserSidebarProps, NavItem, navItems, mapNavItemsToLinks as before) ---
// Type for the user prop received from the server layout
type UserSidebarProps = {
  name: string | null;
  image: string | null;
} | null;

// Define the NavItem type
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// Define navigation items
const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/kudos", label: "Kudos Feed", icon: Award },
  { href: "/app/leaderboard", label: "Leaderboard", icon: Users },
  { href: "/app/wellness", label: "Wellness", icon: HeartPulseIcon },
  { href: "/app/learning", label: "Learning", icon: Lightbulb },
];

// Map NavItem[] to the format expected by SidebarLink
const mapNavItemsToLinks = (items: NavItem[]) => {
  return items.map((item) => ({
    label: item.label,
    href: item.href,
    icon: React.createElement(item.icon, {
      className: "h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200",
    }),
  }));
};

// ActionLink now only needed for Settings, etc. (non-logout actions using SidebarLink)
interface ActionLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  onClick?: () => void; // Keep if Settings needs onClick, otherwise can remove
}

// Define the props for AppSidebarLayout
interface AppSidebarLayoutProps {
  children: React.ReactNode;
  user: UserSidebarProps;
}

export function AppSidebarLayout({ children, user }: AppSidebarLayoutProps) {
  const [open, setOpen] = useState(false);
  const links = mapNavItemsToLinks(navItems);

  // Define bottom links - *REMOVE LOGOUT FROM HERE*
  const bottomLinks: ActionLink[] = [
    {
      label: "Settings",
      href: "/app/settings",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    // Logout object removed from this array
  ];

  // --- Helper function to get common link styles (adapt based on inspecting SidebarLink) ---
  // You might need to adjust these classes by inspecting a rendered SidebarLink
  const getLinkStyles = (isOpen: boolean) =>
    cn(
      "flex items-center justify-start gap-2 group/sidebar py-2 px-3 rounded-md text-sm", // Base styles
      "text-neutral-700 dark:text-neutral-200", // Text color
      "hover:bg-neutral-200 dark:hover:bg-neutral-700", // Hover background
      "cursor-pointer", // Ensure pointer cursor
      !isOpen && "justify-center w-10" // Styles when closed (adjust if needed)
    );

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col md:flex-row", // <-- mobile-first column, desktop row
        "overflow-hidden border border-neutral-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900"
      )}
    >
      {/* Ensure animate prop is boolean if required by Sidebar */}
      <Sidebar open={open} setOpen={setOpen} animate={true}>
        <SidebarBody className="justify-between gap-10">
          {/* Top Section */}
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="px-3 py-2">{open ? <Logo /> : <LogoIcon />}</div>
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2">
            {/* Render Settings link */}
            {bottomLinks.map((link, idx) => (
              <SidebarLink key={`bottom-${idx}`} link={link} />
            ))}

            {/* Custom Logout Button */}
            <button
              type="button" // Explicitly set type="button"
              onClick={() => {
                console.log("Logout button clicked..."); // Add for debugging
                signOut({ callbackUrl: "/auth/signin" });
              }}
              // Apply styles mimicking SidebarLink - ADJUST THESE CLASSES AS NEEDED
              className={getLinkStyles(open)}
            >
              {/* Icon */}
              <LogOut className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
              {/* Label - conditionally render based on 'open' state */}
              {open && (
                <span className="text-neutral-700 dark:text-neutral-200">
                  Logout
                </span>
              )}
              {/* Tooltip or aria-label when closed might be needed for accessibility */}
            </button>

            {/* Dynamic User Profile Link */}
            {user && (
              <SidebarLink
                link={{
                  label: user.name || "My Profile",
                  href: "/app/profile/me",
                  icon: (
                    <img
                      src={user.image || "/images/default-avatar.png"} // Ensure path is correct
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                      width={28}
                      height={28}
                      alt={user.name ? `${user.name}'s Avatar` : "User Avatar"}
                    />
                  ),
                }}
              />
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <main
        className={cn(
          "flex flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 rounded-tl-2xl",
          "min-w-0", // <-- ADD THIS CLASS,
          "pt-16 md:pt-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}

// --- (Keep Logo and LogoIcon components as before) ---
export const Logo = () => {
  return (
    <a
      href="/app"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre font-medium text-black dark:text-white"
      >
        Krewvana
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/app"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};
