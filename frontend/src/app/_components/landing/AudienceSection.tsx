import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  HeartPulse,
  LineChart,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { Tilt3D } from "./3d/Tilt3D";

const PATIENT_BENEFITS = [
  { icon: HeartPulse, label: "Track vitals & symptoms in one place" },
  { icon: CalendarCheck, label: "Book and join consultations remotely" },
  { icon: MessageCircle, label: "Chat with your care team in real time" },
  { icon: ShieldCheck, label: "Bank-grade privacy on every record" },
];

const DOCTOR_BENEFITS = [
  { icon: ClipboardCheck, label: "AI-summarised patient charts" },
  { icon: LineChart, label: "Risk stratification & outcome trends" },
  { icon: Stethoscope, label: "Built-in ECG, X-ray & Echo analyzers" },
  { icon: UserRound, label: "Manage queues, schedules & teams" },
];

/**
 * Side-by-side audience showcase with 3D-tilt cards.
 */
export function AudienceSection() {
  return (
    <section
      id="audience"
      className="relative border-y border-border/50 bg-secondary/30 px-6 py-24 sm:px-12 sm:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(26,83,69,0.06),_transparent_60%)]"
      />

      <div className="mx-auto max-w-7xl">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              Built for everyone in the loop
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              One platform, two{" "}
              <span className="text-brand-teal">tailored experiences</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Every role gets a workspace designed for the work they actually do
              — patients in control, clinicians empowered.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Patients */}
          <AnimateOnScroll variant="left">
            <Tilt3D maxTilt={5} glareOpacity={0.1} scale={1.01} className="rounded-3xl">
              <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 sm:p-10 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-teal/10">
                <span className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-red/10 blur-3xl transition-all duration-700 group-hover:scale-110" />
                <div className="relative">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red ring-1 ring-brand-red/20 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                    <UserRound className="h-7 w-7" />
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-red">
                    For Patients
                  </p>
                  <h3 className="text-2xl font-bold text-foreground sm:text-3xl">
                    Your heart, simplified.
                  </h3>
                  <p className="mt-3 text-muted-foreground">
                    Stay informed, in touch with your care team, and ahead of the
                    next risk. ICARE-CVD turns medical data into something you
                    actually understand.
                  </p>

                  <ul className="mt-8 space-y-3">
                    {PATIENT_BENEFITS.map((b) => (
                      <li
                        key={b.label}
                        className="flex items-center gap-3 text-sm text-foreground"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
                          <b.icon className="h-4 w-4" />
                        </span>
                        {b.label}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="group/btn rounded-full border-brand-red/30 text-brand-red hover:border-brand-red hover:bg-brand-red/5"
                      >
                        Patient Sign Up
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </AnimateOnScroll>

          {/* Doctors */}
          <AnimateOnScroll variant="right">
            <Tilt3D maxTilt={5} glareOpacity={0.18} scale={1.01} className="rounded-3xl">
              <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-brand-teal text-white p-8 sm:p-10 shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-teal/30">
                <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#3d8b78]/40 blur-3xl transition-all duration-700 group-hover:scale-110" />
                <span className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="relative">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                    For Doctors & Clinics
                  </p>
                  <h3 className="text-2xl font-bold sm:text-3xl">
                    Spend less time charting, more time caring.
                  </h3>
                  <p className="mt-3 text-white/85">
                    AI-augmented summaries, structured records and an end-to-end
                    cardiology workflow — designed by clinicians, for clinicians.
                  </p>

                  <ul className="mt-8 space-y-3">
                    {DOCTOR_BENEFITS.map((b) => (
                      <li
                        key={b.label}
                        className="flex items-center gap-3 text-sm text-white"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
                          <b.icon className="h-4 w-4" />
                        </span>
                        {b.label}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Link href="/login">
                      <Button className="group/btn rounded-full bg-white text-brand-teal hover:bg-white/90">
                        Request a Demo
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
