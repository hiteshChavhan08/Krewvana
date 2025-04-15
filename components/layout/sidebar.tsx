// --- File: components/layout/sidebar.tsx ---
import Link from "next/link";
import {
  Home,
  BookOpen,
  Lightbulb,
  HeartPulse,
  Users,
  Building,
  Award,
  Gift,
  Settings,
  Sparkles, // Using Sparkles for Recognition
} from "lucide-react"; // Using lucide-react icons (assuming installed: `npm install lucide-react`)

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui button is available

// Sidebar Navigation Items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/learning", label: "Learning", icon: BookOpen },
  { href: "/innovation", label: "Innovation", icon: Lightbulb },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
  { href: "/collaboration", label: "Collaboration", icon: Users },
  { href: "/culture", label: "Culture", icon: Building },
  { href: "/recognition", label: "Recognition", icon: Sparkles },
  { href: "/rewards", label: "Rewards", icon: Award },
  // { href: "/profile", label: "Profile", icon: User }, // Profile might be in header or settings
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  // In a real app, you'd use `usePathname` from `next/navigation` to highlight the active link
  // const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-muted/40 p-4 md:flex">
      <div className="mb-6 flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {/* Placeholder for Logo */}
          <Gift className="h-6 w-6" />
          <span className="">Kanaka Platform</span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} passHref>
            <Button
              variant="ghost" // Use 'secondary' or conditional logic for active state
              className="w-full justify-start"
              // Add active state based on pathname comparison later
              // disabled={item.href === '/collaboration'} // Example: Disable a link
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      {/* Optional: Add other elements like a footer or quick actions */}
    </aside>
  );
}