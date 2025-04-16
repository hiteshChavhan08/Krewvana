// components/user-nav.tsx
"use client"; // Essential for hooks

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Settings, User } from 'lucide-react';
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession, signOut } from "next-auth/react"; // Import hooks
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

// Helper function to get initials
const getInitials = (name?: string | null, email?: string | null): string => {
    if (name) {
        const names = name.split(' ');
        let initials = names[0].substring(0, 1).toUpperCase();
        if (names.length > 1) {
            initials += names[names.length - 1].substring(0, 1).toUpperCase();
        }
        return initials;
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return 'U'; // Default fallback
};


export function UserNav() {
  // Get session data
  const { data: session, status } = useSession();

  // Handle Loading State
  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
         {/* Keep notification/theme toggles if desired during load */}
         <Skeleton className="h-8 w-8 rounded-full" />
         <Skeleton className="h-8 w-8 rounded-full" />
         <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  // Handle Unauthenticated State (or render nothing, or a Login button)
  // This component is likely only shown when authenticated, so maybe return null
  if (status === "unauthenticated" || !session?.user) {
    // Optionally return a Login button or null
    // return <Button onClick={() => router.push('/login')}>Login</Button>;
    return null; // Don't show user nav if not logged in
  }

  // User is authenticated, extract data
  const user = session.user;
  const userInitials = getInitials(user.name, user.email);

  return (
    <div className="flex items-center gap-4">
      {/* Notification Button (keep functionality separate if needed) */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary"></span>
        <span className="sr-only">Notifications</span>
      </Button>

      {/* Theme Toggle */}
      <ModeToggle className="hidden lg:flex" />

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              {/* Use dynamic image source */}
              <AvatarImage
                src={user.image ?? undefined} // Use user image, pass undefined if null
                alt={user.name ?? user.email ?? 'User avatar'} // Use name or email for alt text
              />
              {/* Use dynamic fallback */}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {/* Use dynamic name and email */}
              <p className="text-sm font-medium leading-none">
                {user.name ?? 'User'} {/* Fallback if name is null */}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email ?? 'No email'} {/* Fallback if email is null */}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* Links remain the same */}
            <DropdownMenuItem asChild>
              <Link href="/profile/me" className="flex w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex w-full cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {/* Logout Functionality */}
          <DropdownMenuItem
            onSelect={(event) => { // Use onSelect for better handling within DropdownMenu
                event.preventDefault(); // Prevent any default behavior if needed
                signOut({ callbackUrl: '/login' }); // Call signOut, redirect to login
            }}
            className="cursor-pointer" // Ensure it looks clickable
            >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}