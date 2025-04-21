"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { MovingBorder } from "@/components/ui/moving-border"; // Adjust path

export default function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/10"> {/* Subtle gradient */}
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Spark Your Engagement?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Log in now to explore features, connect with colleagues, and start
          earning rewards on Kanaka Spark.
        </p>

        {/* Using Aceternity UI Button */}
         <MovingBorder
            borderRadius="1.75rem"
            className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
            // You might need to adjust onClick or make it a link
            onClick={() => console.log("Login clicked")}
          >
           Log In to Kanaka Spark
         </MovingBorder>

        {/* OR Using Shadcn Button */}
        {/* <Button size="lg">Log In to Kanaka Spark</Button> */}
      </div>
    </section>
  );
}

// NOTE: You'll need to copy/adapt the MovingBorderButton component
// from Aceternity UI documentation into your project (e.g., in components/ui/aceternity)