import { Activity, Clock, Heart, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimateOnScroll } from "./AnimateOnScroll";
import { Tilt3D } from "./3d/Tilt3D";

const STATS = [
  { value: "500M+", label: "People affected by CVD worldwide", icon: Heart },
  { value: "~17M", label: "Annual CVD-related deaths globally", icon: Activity },
  { value: "85M+", label: "Europeans living with CVD", icon: Users },
  { value: "24/7", label: "Continuous AI-powered monitoring", icon: Clock },
];

/**
 * Stats / context section. Each card animates in with a stagger and
 * 3D-tilts on hover.
 */
export function StatsSection() {
  return (
    <section id="stats" className="relative border-y border-border/50">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-background" />

      <div className="relative mx-auto max-w-7xl px-6 md:px-12 py-24 sm:py-32">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              What moves us
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              The Challenge of Cardiovascular Disease
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Cardiovascular disease (CVD) remains the world's leading cause of
              death. Despite decades of medical advancement, treating CVD
              effectively is still hindered by the complex interplay of risk
              factors. ICARE-CVD shifts care from{" "}
              <span className="text-foreground font-medium">
                &quot;one size fits all&quot;
              </span>{" "}
              to truly personalised medicine.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <AnimateOnScroll key={stat.label} variant="up" delay={i * 100}>
              <Tilt3D maxTilt={7} glareOpacity={0.14} className="rounded-xl">
                <Card className="group relative h-full overflow-hidden border-border/50 bg-card/80 text-center backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/10">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand-teal/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-y-0 -left-full h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-[300%]" />
                  <CardHeader className="relative pb-2">
                    <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-teal group-hover:text-white">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-4xl font-bold text-brand-teal">
                      {stat.value}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-sm text-muted-foreground">
                      {stat.label}
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
