import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "./AnimateOnScroll";

/**
 * Final call-to-action banner with animated gradient blobs.
 */
export function CTASection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:px-12 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 bg-brand-teal/5 opacity-50 blur-3xl"
      />

      <AnimateOnScroll variant="scale" className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-brand-teal p-8 text-center shadow-2xl sm:p-16">
          {/* Animated decorative blobs */}
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl"
            style={{ animation: "landingBlobDrift 14s ease-in-out infinite" }}
          />
          <div
            aria-hidden
            className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[#3d8b78]/40 blur-2xl"
            style={{ animation: "landingBlobDrift 18s ease-in-out 3s infinite" }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.12),_transparent_55%)]"
          />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white/90 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Free to start · No credit card
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
              Ready to prioritize your heart?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/90">
              Join ICARE-CVD today and experience the future of personalised,
              AI-augmented cardiovascular care — for patients and clinicians
              alike.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button
                  size="lg"
                  className="group h-14 w-full rounded-full bg-white px-8 text-lg font-semibold text-brand-teal shadow-xl outline-none transition-all hover:scale-[1.03] hover:bg-white/90 sm:w-auto"
                >
                  Create an Account
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full rounded-full border-white/40 bg-transparent px-8 text-lg text-white transition-all hover:border-white hover:bg-white/10 sm:w-auto"
                >
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}
