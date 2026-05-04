import { Quote, Star } from "lucide-react";
import { AnimateOnScroll } from "./AnimateOnScroll";

const TESTIMONIALS = [
  {
    quote:
      "ICARE-CVD cut my pre-consultation prep from 25 minutes to 5. The AI summary is the first thing I look at every morning.",
    name: "Dr. Layla Mansour",
    role: "Senior Cardiologist · Cairo Heart Institute",
    initial: "LM",
  },
  {
    quote:
      "I finally feel in control of my heart health. My doctor sees my vitals in real time, and I always know what to do next.",
    name: "Khaled R.",
    role: "Patient · Living with hypertension",
    initial: "KR",
  },
  {
    quote:
      "The risk stratification and ECG analyzer have caught early signals on patients I would have re-booked for next month. Genuinely impressive.",
    name: "Dr. Yusuf El-Sayed",
    role: "Interventional Cardiologist",
    initial: "YE",
  },
  {
    quote:
      "Onboarding the whole clinic took less than a day. Our front desk, assistants and doctors all use it daily — no friction.",
    name: "Mona Adel",
    role: "Clinic Manager · Alexandria",
    initial: "MA",
  },
];

/**
 * Testimonial cards. Hover lifts the card and animates the quote mark.
 */
export function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative px-6 py-24 sm:px-12 sm:py-32"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-gradient-to-b from-secondary/20 to-transparent"
      />

      <div className="mx-auto max-w-7xl">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-16">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              Loved by clinicians and patients
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Real teams. <span className="text-brand-teal">Real outcomes.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Hear from the doctors and patients who use ICARE-CVD every day.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <AnimateOnScroll key={t.name} variant="up" delay={(i % 2) * 120}>
              <figure className="group relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/10">
                <Quote className="absolute right-6 top-6 h-12 w-12 text-brand-teal/10 transition-all duration-500 group-hover:scale-110 group-hover:text-brand-teal/20" />

                <div className="mb-3 flex gap-0.5 text-brand-orange">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>

                <blockquote className="relative text-base leading-relaxed text-foreground sm:text-lg">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-border/40 pt-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-[#3d8b78] text-sm font-semibold text-white shadow-md">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {t.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.role}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
