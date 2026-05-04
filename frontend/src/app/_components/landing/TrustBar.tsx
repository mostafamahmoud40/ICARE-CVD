import {
  Award,
  BadgeCheck,
  Building2,
  HeartHandshake,
  Hospital,
  Lock,
  Microscope,
  ShieldCheck,
  Stethoscope,
  University,
} from "lucide-react";

const TRUSTED = [
  { icon: Hospital, label: "MedCenter" },
  { icon: University, label: "St. George Univ." },
  { icon: Stethoscope, label: "CardioWell" },
  { icon: Microscope, label: "ResearchLab" },
  { icon: Building2, label: "HealthGroup" },
  { icon: HeartHandshake, label: "CareUnited" },
  { icon: ShieldCheck, label: "HIPAA Certified" },
  { icon: Lock, label: "ISO 27001" },
  { icon: BadgeCheck, label: "GDPR Ready" },
  { icon: Award, label: "FDA Reviewed" },
];

/**
 * Continuously scrolling marquee of trusted institutions / certifications.
 * Pure CSS animation, duplicated content keeps the loop seamless.
 */
export function TrustBar() {
  const items = [...TRUSTED, ...TRUSTED];

  return (
    <section
      aria-label="Trusted by"
      className="relative overflow-hidden border-y border-border/40 bg-card/40 py-8 backdrop-blur-sm"
    >
      <p className="mx-auto mb-6 max-w-7xl px-6 md:px-12 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/80">
        Trusted by leading hospitals, research labs and certified for global standards
      </p>

      <div
        className="relative w-full overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <div
          className="flex gap-12 w-max"
          style={{ animation: "landingMarquee 32s linear infinite" }}
        >
          {items.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="group flex shrink-0 items-center gap-2.5 px-4 py-2 text-muted-foreground transition-colors hover:text-brand-teal"
            >
              <item.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
