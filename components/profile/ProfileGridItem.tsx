// components/profile/ProfileGridItem.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface ProfileGridItemProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  children?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  // Add optional glow props
  glowSpread?: number;
  glowProximity?: number;
  glowInactiveZone?: number;
  glowBorderWidth?: number;
}

export const ProfileGridItem: React.FC<ProfileGridItemProps> = ({
  className,
  icon,
  title,
  description,
  children,
  titleClassName,
  descriptionClassName,
  glowSpread = 40,         // Increase default spread for visibility
  glowProximity = 80,       // Increase proximity slightly
  glowInactiveZone = 0.1, // Decrease inactive zone
  glowBorderWidth = 2,
}) => {
  return (
    // Use the className for grid positioning (col-span, row-span)
    <div className={cn("min-h-[14rem] relative list-none", className)}>
      {/* Outer container for border and effect */}
      {/* Make this div slightly transparent ONLY if needed, better to fix structure */}
      <div className="relative h-full rounded-2xl border border-neutral-200 dark:border-white/[0.2] p-1 md:rounded-3xl md:p-2">

         {/* Glowing Effect - Rendered First */}
         <GlowingEffect
            spread={glowSpread}
            proximity={glowProximity}
            inactiveZone={glowInactiveZone}
            borderWidth={glowBorderWidth}
            // Ensure glow is true if you always want it potentially visible
            glow={true}
            disabled={false}
         />

        {/* Inner content container with background */}
        {/* Ensure this container is RELATIVE and has a BACKGROUND */}
        <div className={cn(
            "relative flex h-full flex-col justify-between gap-1 overflow-hidden rounded-xl p-4 md:p-5", // Use slightly larger padding
            "bg-white dark:bg-black" // This background MUST be applied here
            // "dark:shadow-[0px_0px_27px_0px_#2D2D2D]" // Optional shadow
        )}>
            {/* Render Icon, Title, Description at the top */}
            <div className="flex flex-col flex-shrink-0"> {/* Wrap top elements */}
                {icon && (
                    <div className="w-fit rounded-lg border border-neutral-200 dark:border-gray-600 p-2 mb-2">
                        {icon}
                    </div>
                )}
                {title && (
                    <h3 className={cn(
                        "-tracking-tight pt-0.5 font-sans text-lg font-semibold text-black md:text-xl dark:text-white",
                        titleClassName
                    )}>
                        {title}
                    </h3>
                )}
                {description && (
                    <p className={cn(
                        "font-sans text-xs text-black md:text-sm dark:text-neutral-400 mt-1", // Added margin-top
                        descriptionClassName
                    )}>
                        {description}
                    </p>
                )}
            </div>

            {/* Render the main content (children) */}
            {/* Use flex-grow to allow this section to expand */}
            <div className="flex-grow mt-2 overflow-hidden"> {/* Add overflow hidden */}
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};