"use client"; // If using animated components like Bento Grid

import React from "react";
import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid"; // Adjust path
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"; // Shadcn Card
import {
  GraduationCap,
  HeartPulse,
  Users,
  Sparkles, // Changed from Campfire
  Trophy,
  ThumbsUp,
} from "lucide-react"; // Icons

// --- Feature Data (Adjusted for BentoCard props) ---
const features = [
  {
    Icon: GraduationCap, // Pass the component type
    name: "Learn & Innovate",
    description: "Access learning paths & join innovation challenges.",
    href: "#", // Optional link
    cta: "Explore Learning", // Optional call to action
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
        <GraduationCap className="h-24 w-24 text-primary" />
      </div>
    ), // Example background content
    className: "md:col-span-2", // Grid spanning class
  },
  {
    Icon: HeartPulse,
    name: "Prioritize Well-being",
    description: "Wellness resources, fitness challenges & mindfulness.",
    href: "#",
    cta: "View Resources",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
        <HeartPulse className="h-24 w-24 text-red-500" />
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    Icon: Users,
    name: "Connect Across Teams",
    description: "Find colleagues, join groups & share knowledge.",
    href: "#",
    cta: "Find Groups",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
        <Users className="h-24 w-24 text-blue-500" />
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    Icon: Sparkles,
    name: "Build Our Culture",
    description: "Virtual coffees, team celebrations & social events.",
    href: "#",
    cta: "See Events",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="h-24 w-24 text-yellow-500" />
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    Icon: Trophy,
    name: "Fun Challenges & Rewards",
    description: "Compete, climb leaderboards & earn points.",
    href: "#",
    cta: "Join Challenges",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy className="h-24 w-24 text-green-500" />
      </div>
    ),
    className: "md:col-span-1",
  },
  {
    Icon: ThumbsUp,
    name: "Recognize & Appreciate",
    description: "Give shoutouts, earn badges & foster appreciation.",
    href: "#",
    cta: "Give Recognition",
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
        <ThumbsUp className="h-24 w-24 text-indigo-500" />
      </div>
    ),
    className: "md:col-span-2",
  },
];

// Helper component for the feature card content within BentoGridItem
const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="h-full border-none shadow-none bg-transparent flex flex-col">
    <CardHeader>
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </div>
      <CardDescription className="text-sm">{description}</CardDescription>
    </CardHeader>
    {/* Optional: Add more content or visual representation here */}
  </Card>
);

export default function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          What Kanaka Spark Offers
        </h2>
        <BentoGrid className="max-w-4xl mx-auto">
          {features.map((feature, i) => (
            <BentoCard key={i} {...feature} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

// Helper for Bento Grid Item Title (Optional, you can inline it)
const FeatureTitle = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center space-x-2 font-sans font-bold mb-2 mt-2">
    {icon}
    <span>{title}</span>
  </div>
);

// NOTE: You'll need to copy/adapt the BentoGrid and BentoGridItem components
// from Magic UI documentation into your project (e.g., in components/ui/magicui)
