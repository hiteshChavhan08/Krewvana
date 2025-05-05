import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import WhySection from "@/components/landing/WhySection";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <main className="flex-grow">
        <Link href={"/app"}>Use APP</Link>
      </main>
      <Footer />
    </div>
  );
}