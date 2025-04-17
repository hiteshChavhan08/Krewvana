// components/layout/AppLayout.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Menu, Sparkles } from 'lucide-react'; // Sparkles for logo/brand
import { SidebarNav } from './SidebarNav';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import UserNav from '@/components/layout/UserNav'; // We'll create this for user avatar/logout

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* --- Desktop Sidebar --- */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/app" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="">Kanaka</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
           <SidebarNav />
        </div>
         <div className="mt-auto p-4 border-t">
            {/* Optional Footer content in sidebar */}
         </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex flex-col sm:pl-60"> {/* Add padding to offset fixed sidebar */}
        {/* --- Mobile Header --- */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:hidden">
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs w-60 p-0 pt-4">
              <div className="flex h-12 items-center px-6 mb-4">
                <Link href="/app" className="flex items-center gap-2 font-semibold mr-auto" onClick={()=> setMobileSheetOpen(false)}>
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="">Kanaka</span>
                </Link>
              </div>
              <SidebarNav onLinkClick={()=> setMobileSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          {/* Maybe Breadcrumbs or Page Title Here */}
          <div className="ml-auto flex items-center gap-2">
             <ThemeToggle />
             <UserNav />
          </div>
        </header>

        {/* --- Desktop Header --- */}
        <header className="sticky top-0 z-30 hidden h-16 items-center gap-4 border-b bg-background px-6 sm:flex">
           <div className="ml-auto flex items-center gap-4">
             {/* Add Search or other header items here */}
             <ThemeToggle />
             <UserNav />
           </div>
        </header>

        {/* --- Page Content with Animation --- */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname} // Important for AnimatePresence to detect page changes
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}