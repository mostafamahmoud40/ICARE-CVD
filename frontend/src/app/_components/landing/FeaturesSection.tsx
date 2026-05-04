import {
  Activity,
  Brain,
  FileText,
  Heart,
  MessageSquareHeart,
  Pill,
  Shield,
  Stethoscope,
  Workflow,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { Tilt3D } from "./3d/Tilt3D";

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Risk Assessment",
    desc: "Predictive models analyze patient history to forecast cardiovascular risks with clinical-grade confidence.",
  },
  {
    icon: Activity,
    title: "Real-Time Vitals Tracking",
    desc: "Continuous integration of vital signs and reported symptoms keeps doctors updated the moment something changes.",
  },
  {
    icon: FileText,
    title: "Smart Prescriptions",
    desc: "Digital prescription management with automated drug-interaction checks and adherence reminders.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    desc: "HIPAA & GDPR-compliant infrastructure with end-to-end encryption for every record and message.",
  },
  {
    icon: Heart,
    title: "Holistic Health Journey",
    desc: "Patient-centric workflows that encourage lifestyle modifications and adherence to long-term care plans.",
  },
  {
    icon: MessageSquareHeart,
    title: "Doctor-Patient Chat",
    desc: "Secure real-time messaging between patients and their care teams for seamless follow-up.",
  },
  {
    icon: Stethoscope,
    title: "AI Imaging & ECG Analysis",
    desc: "Built-in CT, X-ray, ECG and Echo analyzers turn medical images into structured, actionable findings.",
  },
  {
    icon: Pill,
    title: "Medication Intelligence",
    desc: "Personalised dosing suggestions and refill scheduling that reduce errors and improve outcomes.",
  },
  {
    icon: Workflow,
    title: "Unified Clinical Workflow",
    desc: "Appointments, consultations, vitals, labs and documents — one source of truth across every role.",
  },
];

/**
 * Feature grid with shine-on-hover, 3D tilt and staggered scroll reveals.
 */
export function FeaturesSection() {
  return (
    <section id="features" className="relative px-6 py-24 sm:px-12 sm:py-32">
      <div
        aria-hidden
        className="absolute right-0 top-1/3 -z-10 h-96 w-96 rounded-full bg-brand-red/5 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              Platform features
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Advanced tools for{" "}
              <span className="text-brand-teal">smart care</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              A comprehensive toolkit designed for modern cardiology practices —
              built to deliver precise monitoring and a seamless patient
              experience.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <AnimateOnScroll
              key={feature.title}
              variant="up"
              delay={(i % 3) * 120}
            >
              <Tilt3D maxTilt={6} glareOpacity={0.12} className="rounded-xl">
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand-teal/10 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <CardHeader className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-brand-teal group-hover:text-white">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl text-foreground">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Tilt3D>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
