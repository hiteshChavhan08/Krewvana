import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import WhySection from "@/components/landing/WhySection";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <HeroSection />
        <WhySection />
        <FeaturesSection />
        {/* Optional: Add HowItWorksSection here */}
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}