// components/layout/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Optional for icons only mode
import {
  LayoutDashboard,
  Award, // Icon for Kudos
  Users, // Icon for Leaderboard
  UserCircle, // Icon for Profile
  Settings, // Example for future settings
  HeartPulseIcon,
  Lightbulb
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/kudos", label: "Kudos Feed", icon: Award },
  { href: "/app/leaderboard", label: "Leaderboard", icon: Users },
  { href: "/app/profile/me", label: "My Profile", icon: UserCircle },
  { href: "/app/wellness", label: "Wellness", icon: HeartPulseIcon },
  { href: "/app/learning", label: "Learning", icon: Lightbulb },
  { href: "/app/shoutouts", label: "Shoutouts", icon: Lightbulb },
  // Add more links like Settings later
  // { href: '/app/settings', label: 'Settings', icon: Settings },
];

interface SidebarNavProps {
  isCollapsed?: boolean; // For potential collapsed state later
  onLinkClick?: () => void; // Function to call on mobile link click (e.g., close sheet)
}

export function SidebarNav({
  isCollapsed = false,
  onLinkClick,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        className={cn(
          "flex flex-col gap-1 px-2",
          isCollapsed ? "items-center" : "items-stretch"
        )}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href) && item.href !== "/app") ||
            (pathname === "/app" && item.href === "/app"); // Handle root path specifically
          const Icon = item.icon;

          const linkContent = (
            <>
              <Icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </>
          );

          const linkElement = (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick} // Close mobile sheet on click
              className={cn(
                buttonVariants({
                  variant: isActive ? "secondary" : "ghost",
                  size: isCollapsed ? "icon" : "default",
                }),
                "w-full justify-start h-10", // Ensure consistent height
                isActive && "font-semibold",
                isCollapsed ? "rounded-lg" : ""
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label} // Good for accessibility when collapsed
            >
              {linkContent}
            </Link>
          );

          return isCollapsed ? (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            linkElement
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
