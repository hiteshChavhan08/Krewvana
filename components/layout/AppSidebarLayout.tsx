// components/layout/AppSidebarLayout.tsx
"use client";

import React, { useMemo, useState } from "react";
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
  MessageCircleQuestion,
  ShieldQuestion,
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
  { href: "/app/ama", label: "AMA", icon: MessageCircleQuestion },
  { href: "/app/qna", label: "QNA", icon: ShieldQuestion },
  { href: "/app/ideas", label: "Ideas", icon: Lightbulb },
];

// Map NavItem[] to the format expected by SidebarLink
const mapNavItemsToLinks = (items: NavItem[], open: boolean) => {
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
interface ActionLinkData { // Renamed for clarity, as it's data for SidebarLink
  label: string;
  href: string;
  icon: React.ReactNode; // icon is a ReactNode
  target?: string; // For external links if any
  rel?: string;    // For external links
}


// Define the props for AppSidebarLayout
interface AppSidebarLayoutProps {
  children: React.ReactNode;
  user: UserSidebarProps;
}

export function AppSidebarLayout({ children, user }: AppSidebarLayoutProps) {
  const [open, setOpen] = useState(false);

  // Use useMemo to prevent re-mapping on every render unless `open` changes
  const mappedNavLinks = useMemo(() => mapNavItemsToLinks(navItems, open), [open]);

  const settingsLinkData: ActionLinkData = {
    label: "Settings",
    href: "/app/settings",
    icon: (
      <Settings className={cn("h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-primary transition-colors duration-200", !open && "mx-auto")} />
    ),
  };

  const userProfileLinkData: ActionLinkData | null = user
  ? {
      label: user.name || "My Profile",
      href: "/app/profile/me",
      icon: (
        <img
          src={user.image || "/images/default-avatar.png"}
          className={cn("h-7 w-7 shrink-0 rounded-full object-cover", !open && "mx-auto my-0.5")} // my-0.5 to better center if height is slightly different
          width={28}
          height={28}
          alt={user.name ? `${user.name}'s Avatar` : "User Avatar"}
        />
      ),
    }
  : null;


  // Helper function to get common link styles for the custom logout button
  const getCustomButtonStyles = (isOpen: boolean) =>
    cn(
      "flex items-center gap-2 group/sidebar py-2 px-3 rounded-md text-sm w-full", // w-full for consistency
      "text-neutral-700 dark:text-neutral-200",
      "hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-primary dark:hover:text-primary",
      "cursor-pointer transition-colors duration-200",
      isOpen ? "justify-start" : "justify-center h-10" // When closed, specific height and centered content
    );

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col md:flex-row",
        "min-w-0",
        // Removed overflow-hidden from the main container, let Sidebar handle its own
        "border border-neutral-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-900"
      )}
    >
      <Sidebar open={open} setOpen={setOpen} animate={true}> {/* Removed fixed width, let content define it */}
        <SidebarBody className="justify-between gap-10"> {/* SidebarBody handles its own padding and scrolling */}
          {/* Top Section: Logo and Main Nav Links */}
          <div className={cn(
            "flex flex-col",
            // If `open` is false, we want to prevent this section from taking too much space
            // and causing an internal scrollbar that affects the outer component's scrollbar visibility.
            // The `overflow-hidden` here is key for the collapsed state.
            open ? "flex-1 overflow-y-auto" : "overflow-hidden" 
          )}>
            <div className={cn("px-3 py-2 transition-all duration-300", !open && "px-1.5")}> {/* Reduced padding when closed */}
                {open ? <Logo /> : <LogoIcon />}
            </div>
            <div className="mt-8 flex flex-col gap-1.5"> {/* Reduced gap slightly */}
              {mappedNavLinks.map((linkObj, idx) => (
                // Assuming SidebarLink is from Aceternity UI and takes a `link` object
                // It should handle the collapsed state (icon only) internally based on `open` prop of Sidebar
                <SidebarLink key={`nav-${idx}`} link={linkObj} />
              ))}
            </div>
          </div>

          {/* Bottom Section: Settings, Logout, Profile */}
          <div className={cn("flex flex-col gap-1.5", !open && "items-center")}> {/* Reduced gap, center items when closed */}
            <SidebarLink link={settingsLinkData} />

            {/* Custom Logout Button */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className={getCustomButtonStyles(open)}
              aria-label={open ? "Logout" : "Logout"} // Ensure aria-label is always present
              title="Logout" // Tooltip
            >
              <LogOut className={cn("h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-primary transition-colors duration-200", !open && "mx-auto")} />
              {open && <span className="ml-0">Logout</span>} {/* Removed margin when text is visible */}
            </button>

            {userProfileLinkData && (
                <SidebarLink link={userProfileLinkData} />
            )}
          </div>
        </SidebarBody>
      </Sidebar>

      <main
        className={cn(
          "flex flex-1 overflow-y-auto rounded-tl-2xl bg-white dark:bg-neutral-800", // Added bg color
          "min-w-0",
          "p-4 md:p-6", // Added some padding to main content
          "pt-16 md:pt-4" // Adjust top padding for mobile (header) vs desktop
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
