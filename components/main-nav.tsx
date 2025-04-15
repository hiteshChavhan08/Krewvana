"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, Lightbulb, Heart, Users, Award, Gift, Home, Menu, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { motion } from "framer-motion"

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home
  },
  {
    name: "Learning",
    href: "/learning",
    icon: BookOpen
  },
  {
    name: "Innovation",
    href: "/innovation",
    icon: Lightbulb
  },
  {
    name: "Wellness",
    href: "/wellness",
    icon: Heart
  },
  {
    name: "Collaboration",
    href: "/collaboration",
    icon: Users
  },
  {
    name: "Recognition",
    href: "/recognition",
    icon: Award
  },
  {
    name: "Rewards",
    href: "/rewards",
    icon: Gift
  }
]

export function MainNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="flex items-center">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <div className="flex h-16 items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold">Krewvana</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
          <nav className="flex flex-col gap-4 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            <div className="mt-auto px-3">
              <ModeToggle />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      <Link href="/" className="hidden items-center space-x-2 lg:flex">
        <span className="text-xl font-bold">Krewvana</span>
      </Link>
      <nav className="hidden lg:ml-6 lg:flex lg:gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"
                  layoutId="navbar-indicator"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
