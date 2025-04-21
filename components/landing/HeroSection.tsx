"use client"; // Required for Aceternity/Magic UI components with hooks/effects

import React from "react";
import { WavyBackground } from "@/components/ui/wavy-background"; // Adjust path based on your setup
import { Button } from "@/components/ui/button"; // Shadcn Button
import {ShinyButton} from "@/components/magicui/shiny-button"; // Magic UI Button

export default function HeroSection() {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <div className="relative z-10 flex flex-col items-center justify-center h-[70vh] text-center px-4"> {/* Adjust height as needed */}
        <h1 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 py-8">
          Ignite Connection & Growth at Kanaka
        </h1>
        <p className="mt-4 font-normal text-base md:text-lg text-neutral-300 max-w-lg mx-auto">
          Welcome to Kanaka Spark: Our new platform designed to boost learning,
          wellness, collaboration, and fun across the company.
        </p>
        <div className="mt-8">
          {/* Using Magic UI Button */}
          <ShinyButton>Explore Kanaka Spark</ShinyButton>

          {/* OR Using Shadcn Button (style as needed) */}
          {/* <Button size="lg" className="mt-8">
            Explore Kanaka Spark
          </Button> */}
        </div>
      </div>
    </WavyBackground>
  );
}

// NOTE: You'll need to copy/adapt the WavyBackground component code
// from Aceternity UI documentation into your project (e.g., in components/ui/aceternity)
// Same applies to ShinyButton from Magic UI (e.g., in components/ui/magicui)