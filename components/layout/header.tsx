// --- File: components/layout/header.tsx ---
// A simple placeholder header
'use client'; // Header now needs client-side hooks for session

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, LogIn, LogOut } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react"; // Import next-auth hooks
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton"

export default function Header() {
  const { data: session, status } = useSession(); // Get session data and status

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="ml-auto flex items-center gap-4">
        {status === "authenticated" && (
          <>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Avatar>
              <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? 'User Avatar'} />
              <AvatarFallback>
                {session.user?.name?.substring(0, 2).toUpperCase() ?? session.user?.email?.substring(0, 2).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </>
        )}
        {status === "unauthenticated" && (
           // Option 1: Use next-auth's default sign-in page
           // <Button variant="outline" size="sm" onClick={() => signIn()}>
           //   <LogIn className="mr-2 h-4 w-4" /> Sign In
           // </Button>
           // Option 2: Link to your custom sign-in page
           <Link href="/auth/signin" passHref legacyBehavior>
             <Button variant="outline" size="sm">
               <LogIn className="mr-2 h-4 w-4" /> Sign In
             </Button>
           </Link>
        )}
         {status === "loading" && (
            <Skeleton className="h-9 w-20" /> // Placeholder while loading session
         )}
      </div>
    </header>
  );
}