import { AnimateOnScroll } from "./AnimateOnScroll";

const GOALS = [
  {
    num: "01",
    title: "Early Diagnosis",
    desc: "Surface patients at risk for cardiovascular disease earlier, with AI-driven screening across structured and unstructured data.",
  },
  {
    num: "02",
    title: "Risk Stratification",
    desc: "Assign clear risk levels and define exactly which patients need urgent intervention versus continued monitoring.",
  },
  {
    num: "03",
    title: "Treatment Prediction",
    desc: "Predict how each individual will respond to treatment using AI tools trained on real-world cardiology outcomes.",
  },
  {
    num: "04",
    title: "Patient-Centred Outcomes",
    desc: "Embed patient-reported outcomes and lived experience into every clinical decision and measurement of success.",
  },
];

/**
 * Mission / goals section.
 */
export function GoalsSection() {
  return (
    <section
      id="goals"
      className="border-y border-border/50 bg-background px-6 py-24 sm:px-12 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              Our mission
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From one-size-fits-all to{" "}
              <span className="text-brand-teal">personalised care</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              ICARE-CVD focuses on four high-leverage areas of cardiovascular
              healthcare where AI can dramatically change outcomes.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 sm:grid-cols-2">
          {GOALS.map((goal, i) => (
            <AnimateOnScroll key={goal.num} variant="up" delay={i * 100}>
              <div className="group relative flex h-full gap-5 overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-6 sm:p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-lg hover:shadow-brand-teal/10">
                <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-teal/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <span className="select-none shrink-0 text-5xl font-black leading-none text-brand-teal/15 transition-colors group-hover:text-brand-teal/30">
                  {goal.num}
                </span>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {goal.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {goal.desc}
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
