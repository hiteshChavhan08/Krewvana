// components/ama/ama-tabs.tsx
"use client";

import React, { Suspense } from "react";
import { Tabs } from "@/components/aceternity/tabs";
import { AMASessionStatus } from "@prisma/client";
import { AMASessionList } from "./ama-session-list";
import { AMAListSkeleton } from "./ama-list-skeleton";

export function AmaTabs() {
  const tabs = [
    {
      title: "Upcoming",
      value: "upcoming",
      // --- MODIFICATION START ---
      // Render Suspense directly. The Tabs component provides the container.
      content: (
        <Suspense fallback={<AMAListSkeleton />}>
          <AMASessionList status={AMASessionStatus.UPCOMING} />
        </Suspense>
      ),
      // --- MODIFICATION END ---
    },
    {
      title: "Live",
      value: "live",
      // --- MODIFICATION START ---
      content: (
        <Suspense fallback={<AMAListSkeleton />}>
          <AMASessionList status={AMASessionStatus.LIVE} />
        </Suspense>
      ),
      // --- MODIFICATION END ---
    },
    {
      title: "Past",
      value: "past",
      // --- MODIFICATION START ---
      content: (
        <Suspense fallback={<AMAListSkeleton />}>
          <AMASessionList status={AMASessionStatus.ENDED} />
        </Suspense>
      ),
      // --- MODIFICATION END ---
    },
  ];

  return (
    // Removed perspective and fixed height, allowing content to define height.
    // Added mb-8 for spacing below the tabs component.
    <div className="relative flex flex-col w-full items-start justify-start my-8 mb-8">
      <Tabs
        tabs={tabs}
        // Ensure containerClassName allows content flow
        containerClassName="relative flex flex-col w-full"
        // Style the tabs themselves
        tabClassName="relative rounded-full px-4 py-2 text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors duration-150"
        // Style the *active* tab
        activeTabClassName="bg-primary text-primary-foreground hover:text-primary-foreground"
        // Add margin-top to the content area to space it from the tabs
        contentClassName="mt-6 w-full" // Ensure content area takes full width
      />
    </div>
  );
}
