import { ClipboardList, LineChart, Sparkles, Stethoscope } from "lucide-react";
import { AnimateOnScroll } from "./AnimateOnScroll";

const STEPS = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Patient Onboarding",
    desc: "Patients securely register, sync past records, and complete a guided cardiovascular profile in minutes.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "AI Risk Analysis",
    desc: "Our models analyse vitals, history, lab results and imaging to surface personalised risk and red flags.",
  },
  {
    icon: Stethoscope,
    step: "03",
    title: "Doctor Consultation",
    desc: "Cardiologists receive AI-augmented summaries and decide on diagnosis, treatment and follow-ups.",
  },
  {
    icon: LineChart,
    step: "04",
    title: "Continuous Care",
    desc: "Vitals, medications, and outcomes are tracked in real time so patients stay on track between visits.",
  },
];

/**
 * Four-step product flow with animated dotted connector.
 */
export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 py-24 sm:px-12 sm:py-32"
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-20 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-teal/5 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-20">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              How it works
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              From signup to{" "}
              <span className="text-brand-teal">smarter care</span> in four steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              A unified workflow built around the way modern cardiology
              practices actually work.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Decorative connector line on lg */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-9 hidden lg:block"
          >
            <div className="mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-brand-teal/30 to-transparent" />
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <AnimateOnScroll key={step.step} variant="up" delay={i * 120}>
                <div className="group relative flex flex-col items-center text-center">
                  <div className="relative mb-6 inline-flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-card shadow-md ring-1 ring-border/60 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-brand-teal/10 group-hover:ring-brand-teal/30">
                    <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-teal/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <step.icon className="relative h-7 w-7 text-brand-teal transition-transform duration-300 group-hover:scale-110" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-teal text-[11px] font-bold text-white shadow-md ring-4 ring-background">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
