import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Heart, Shield, Clock, ArrowRight, HeartPulse, Brain, FileText, Stethoscope, Users } from "lucide-react";
import { AnimatedHeart } from "./_components/AnimatedHeart";
import { FlowingWaves } from "./_components/FlowingWaves";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-primary/20 selection:text-primary">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 flex h-16 md:h-20 items-center justify-between border-b border-border/40 bg-background/80 px-6 md:px-12 backdrop-blur-lg">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-105 duration-300">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10">
            <HeartPulse className="h-6 w-6 text-brand-red" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            ICARE<span className="text-brand-teal">-CVD</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#features" className="text-muted-foreground hover:text-brand-teal transition-colors">Features</Link>
          <Link href="#stats" className="text-muted-foreground hover:text-brand-teal transition-colors">Impact</Link>
          <Link href="#goals" className="text-muted-foreground hover:text-brand-teal transition-colors">Our Goals</Link>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-brand-teal transition-colors">
            Sign In
          </Link>
          <Link href="/login">
            <Button className="bg-brand-teal text-white hover:bg-brand-teal/90 shadow-md hover:shadow-xl hover:shadow-brand-teal/20 transition-all rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero Section ─── */}
        <section className="relative overflow-hidden min-h-[85vh] flex items-center">
          {/* Flowing wave background */}
          <FlowingWaves className="absolute inset-0 -z-10 opacity-80 pointer-events-none" />

          {/* Subtle radial glow */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(26,83,69,0.06),_transparent_60%)]" />

          <div className="mx-auto w-full max-w-7xl px-6 md:px-12 py-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              {/* Left — Text */}
              <div className="max-w-xl">
                <div className="inline-flex items-center rounded-full border border-brand-teal/20 bg-brand-teal/5 px-4 py-1.5 mb-8 text-sm font-medium text-brand-teal backdrop-blur-sm shadow-sm">
                  <span className="relative flex h-2.5 w-2.5 mr-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-red opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red" />
                  </span>
                  Smart Cardiology Clinic
                </div>

                <h1 className="font-sans text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.1]">
                  PAVING THE WAY TO{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-teal via-[#3d8b78] to-brand-teal">
                    BETTER CARE
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  A smart clinic platform leveraging AI to personalise prevention
                  and treatment of cardiovascular disease — giving patients and
                  doctors actionable insights for healthier hearts.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-brand-teal hover:bg-brand-teal/90 text-white rounded-full px-8 h-13 shadow-lg shadow-brand-teal/25 transition-all group text-base"
                    >
                      About ICARE-CVD
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right — Animated Heart */}
              <div className="relative flex items-center justify-center lg:pl-8">
                <AnimatedHeart className="w-72 h-[420px] sm:w-80 sm:h-[480px] lg:w-[380px] lg:h-[520px]" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── What Moves Us — Stats Section ─── */}
        <section id="stats" className="relative border-y border-border/50">
          {/* Two-tone background */}
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />

          <div className="relative mx-auto max-w-7xl px-6 md:px-12 py-24 sm:py-32">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-teal mb-3">What moves us</p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                The Challenge of Cardiovascular Disease
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground leading-relaxed">
                Cardiovascular disease (CVD) is a highly prevalent disease that poses
                challenges to healthcare systems worldwide. Despite medical advancements,
                treating CVD effectively remains challenging due to the complex interplay
                of risk factors. ICARE-CVD aims to shift from &quot;one size fits all&quot; to
                personalised care.
              </p>
            </div>

            {/* Stats cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: "500M+", label: "People affected by CVD worldwide", icon: Heart },
                { value: "~17M", label: "Annual CVD-related deaths globally", icon: Activity },
                { value: "85M+", label: "Europeans living with CVD", icon: Users },
                { value: "24/7", label: "Continuous AI-powered monitoring", icon: Clock },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 text-center hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/5 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all duration-300">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-4xl font-bold text-brand-teal">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm text-muted-foreground">{stat.label}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features Section ─── */}
        <section id="features" className="px-6 py-24 sm:px-12 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-teal mb-3">Platform Features</p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Advanced Tools for <span className="text-brand-teal">Smart Care</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Comprehensive solutions designed for modern cardiology practices,
                ensuring precise monitoring and seamless patient experiences.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: "AI-Powered Risk Assessment",
                  desc: "Predictive models that analyze patient history to forecast cardiovascular risks with high confidence.",
                },
                {
                  icon: Activity,
                  title: "Real-Time Tracking",
                  desc: "Continuous integration of vital signs and symptoms to keep doctors updated instantly.",
                },
                {
                  icon: FileText,
                  title: "Smart Prescriptions",
                  desc: "Digital prescription management with automated interaction checks and refill reminders.",
                },
                {
                  icon: Shield,
                  title: "Enterprise Security",
                  desc: "HIPAA-compliant infrastructure ensuring your sensitive medical data is encrypted and secure.",
                },
                {
                  icon: Heart,
                  title: "Holistic Health Journey",
                  desc: "Patient-centric workflows that encourage lifestyle modifications and adherence to care plans.",
                },
                {
                  icon: Stethoscope,
                  title: "Doctor-Patient Chat",
                  desc: "Secure real-time messaging between patients and their care teams for continuous follow-up.",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden bg-card border-border/50 hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/5 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal group-hover:scale-110 group-hover:bg-brand-teal group-hover:text-white transition-all duration-300">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base text-muted-foreground">{feature.desc}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Goals Section ─── */}
        <section id="goals" className="border-y border-border/50 bg-secondary/30 px-6 py-24 sm:px-12 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-teal mb-3">Our Mission</p>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                From One-Size-Fits-All to <span className="text-brand-teal">Personalised Care</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Using AI and a comprehensive patient database, ICARE-CVD focuses
                on improving four key areas of cardiovascular healthcare.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  num: "01",
                  title: "Early Diagnosis",
                  desc: "Enhancing early detection of patients at risk with cardiovascular disease through AI-driven screening.",
                },
                {
                  num: "02",
                  title: "Risk Stratification",
                  desc: "Developing and assigning risk levels to patients, defining those who need urgent intervention.",
                },
                {
                  num: "03",
                  title: "Treatment Prediction",
                  desc: "Predicting how individuals will respond to treatment through the application of AI-based tools.",
                },
                {
                  num: "04",
                  title: "Patient-Centred Outcomes",
                  desc: "Incorporating patients' unique perspectives and reported outcomes into every area of care.",
                },
              ].map((goal, i) => (
                <div
                  key={i}
                  className="group flex gap-5 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-8 hover:border-brand-teal/30 hover:shadow-lg transition-all duration-300"
                >
                  <span className="text-5xl font-black text-brand-teal/15 group-hover:text-brand-teal/30 transition-colors shrink-0 select-none leading-none">
                    {goal.num}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{goal.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{goal.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Call to Action ─── */}
        <section className="relative py-24 sm:py-32 overflow-hidden px-6 sm:px-12">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-teal/5 opacity-50 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-4xl text-center bg-brand-teal overflow-hidden rounded-3xl p-8 sm:p-16 shadow-2xl">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#3d8b78]/40 rounded-full blur-2xl" />

            <h2 className="relative z-10 text-3xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
              Ready to prioritize your heart?
            </h2>
            <p className="relative z-10 mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/90">
              Join ICARE-CVD today and experience the future of autonomous,
              personalised cardiovascular care.
            </p>
            <div className="relative z-10 mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-brand-teal hover:bg-white/90 rounded-full px-8 h-14 font-semibold text-lg shadow-xl outline-none transition-transform hover:scale-105"
                >
                  Create an Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 bg-background/50 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <HeartPulse className="h-6 w-6 text-brand-red" />
            <span className="text-xl font-bold tracking-tight">
              ICARE<span className="text-brand-teal">-CVD</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} ICARE-CVD Smart Clinic. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-brand-teal transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand-teal transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
