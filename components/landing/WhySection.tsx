import React from "react";

export default function WhySection() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30"> {/* Use a subtle background */}
      <div className="container mx-auto px-4 text-center max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Re-energizing Our Workplace
        </h2>
        <p className="text-lg text-muted-foreground">
          The way we work has evolved. Kanaka Spark is our commitment to
          fostering a vibrant, connected, and supportive environment where
          every employee can thrive. It’s more than a platform; it's our shared
          space for growth, well-being, and celebrating success.
        </p>
      </div>
    </section>
  );
}