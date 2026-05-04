import { Navbar } from "./_components/landing/Navbar";
import { HeroSection } from "./_components/landing/HeroSection";
import { TrustBar } from "./_components/landing/TrustBar";
import { StatsSection } from "./_components/landing/StatsSection";
import { HowItWorksSection } from "./_components/landing/HowItWorksSection";
import { FeaturesSection } from "./_components/landing/FeaturesSection";
import { AudienceSection } from "./_components/landing/AudienceSection";
import { GoalsSection } from "./_components/landing/GoalsSection";
import { TestimonialsSection } from "./_components/landing/TestimonialsSection";
import { FAQSection } from "./_components/landing/FAQSection";
import { CTASection } from "./_components/landing/CTASection";
import { Footer } from "./_components/landing/Footer";

/**
 * ICARE-CVD landing page.
 * Thin server component that composes presentational landing sections.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-primary/20 selection:text-primary scroll-smooth">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TrustBar />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AudienceSection />
        <GoalsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
