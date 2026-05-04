import Link from "next/link";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowingWaves } from "../FlowingWaves";
import { LazyHero3D } from "./3d/LazyHero3D";

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "HIPAA Compliant" },
  { icon: Sparkles, label: "AI-Powered" },
];

const FLOATING_STATS = [
  {
    value: "98.4%",
    label: "Diagnostic accuracy",
    top: "top-[20%]",
    extra: "left-3 sm:left-5",
    delay: "0.2s",
  },
  {
    value: "24/7",
    label: "Continuous monitoring",
    top: "top-[42%]",
    extra: "right-3 sm:right-5",
    delay: "0.5s",
  },
  {
    value: "12k+",
    label: "Active patients",
    top: "bottom-[18%]",
    extra: "left-6 sm:left-10",
    delay: "0.8s",
  },
] as const;

/**
 * Above-the-fold hero with a real 3D heart canvas, layered backgrounds,
 * floating stat cards and CSS-driven entrance animations.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[92vh] flex items-center">
      <FlowingWaves className="absolute inset-0 -z-10 opacity-80 pointer-events-none" />

      <div
        aria-hidden
        className="absolute -top-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-brand-teal/15 blur-3xl"
        style={{ animation: "landingBlobDrift 18s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 right-[-10%] -z-10 h-[460px] w-[460px] rounded-full bg-brand-red/10 blur-3xl"
        style={{ animation: "landingBlobDrift 22s ease-in-out 4s infinite" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(26,83,69,0.08),_transparent_60%)]"
      />

      <div className="mx-auto w-full max-w-7xl px-6 md:px-12 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left — Text */}
          <div className="max-w-xl">
            <div
              className="inline-flex items-center rounded-full border border-brand-teal/20 bg-brand-teal/5 px-4 py-1.5 mb-8 text-sm font-medium text-brand-teal backdrop-blur-sm shadow-sm opacity-0"
              style={{ animation: "landingFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.05s forwards" }}
            >
              <span className="relative flex h-2.5 w-2.5 mr-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red" />
              </span>
              Smart Cardiology Clinic · Live now
            </div>

            <h1
              className="font-sans text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.05] opacity-0"
              style={{ animation: "landingFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s forwards" }}
            >
              PAVING THE WAY TO{" "}
              <span
                className="bg-gradient-to-r from-brand-teal via-[#3d8b78] to-brand-teal bg-clip-text text-transparent bg-[length:200%_auto]"
                style={{ animation: "landingGradientShift 6s ease-in-out infinite" }}
              >
                BETTER CARE
              </span>
            </h1>

            <p
              className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground opacity-0"
              style={{ animation: "landingFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s forwards" }}
            >
              An AI-driven cardiology platform that personalises prevention, diagnosis, and
              treatment of cardiovascular disease — turning everyday clinical data into life-saving
              insights for patients and their care teams.
            </p>

            <div
              className="mt-10 flex flex-col sm:flex-row gap-4 opacity-0"
              style={{ animation: "landingFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s forwards" }}
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="group w-full sm:w-auto rounded-full bg-brand-teal px-8 h-[52px] text-base text-white shadow-lg shadow-brand-teal/25 transition-all hover:translate-y-[-1px] hover:bg-brand-teal/90 hover:shadow-xl hover:shadow-brand-teal/30"
                >
                  Get Started — It&apos;s Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="group w-full sm:w-auto rounded-full border-brand-teal/30 px-8 h-[52px] text-base text-brand-teal transition-all hover:border-brand-teal hover:bg-brand-teal/5"
                >
                  <PlayCircle className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  See How It Works
                </Button>
              </Link>
            </div>

            <div
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 opacity-0"
              style={{ animation: "landingFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s forwards" }}
            >
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <badge.icon className="h-4 w-4 text-brand-teal" />
                  <span>{badge.label}</span>
                </div>
              ))}
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-7 w-7 rounded-full border-2 border-background bg-gradient-to-br from-brand-teal to-[#3d8b78]"
                    />
                  ))}
                </div>
                <span>Trusted by 500+ clinicians</span>
              </div>
            </div>
          </div>

          {/* Right — 3D Heart scene with floating stat cards */}
          <div className="relative flex items-center justify-center lg:pl-4">
            <div
              className="relative h-[390px] w-[310px] overflow-hidden opacity-0 sm:h-[450px] sm:w-[360px] lg:h-[500px] lg:w-[430px]"
              style={{ animation: "landingScaleIn 1.1s cubic-bezier(0.22,1,0.36,1) 0.3s forwards" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 m-auto h-[60%] w-[60%] rounded-full bg-brand-red/20 blur-3xl"
                style={{ animation: "landingFloat 5s ease-in-out infinite" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 m-auto h-[80%] w-[80%] rounded-full bg-brand-teal/15 blur-3xl"
                style={{ animation: "landingFloat 7s ease-in-out 1s infinite" }}
              />

              <LazyHero3D className="h-full w-full" />

              {FLOATING_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className={`absolute ${stat.top} ${stat.extra} z-10 hidden sm:block opacity-0`}
                  style={{
                    animation: `landingFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) ${stat.delay} forwards, landingFloat 6s ease-in-out ${stat.delay} infinite`,
                  }}
                >
                  <div className="rounded-xl border border-border/60 bg-card/95 px-4 py-3 shadow-lg shadow-brand-teal/10 backdrop-blur-md ring-1 ring-white/40">
                    <div className="text-xl font-bold text-brand-teal">{stat.value}</div>
                    <div className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        aria-hidden
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground/70 opacity-0"
        style={{ animation: "landingFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 1s forwards" }}
      >
        <span>Scroll</span>
        <span className="relative h-8 w-5 rounded-full border border-muted-foreground/40">
          <span
            className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-teal"
            style={{ animation: "landingFloat 1.6s ease-in-out infinite" }}
          />
        </span>
      </div>
    </section>
  );
}
