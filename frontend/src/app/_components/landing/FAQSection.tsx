"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "./AnimateOnScroll";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Is ICARE-CVD a replacement for my cardiologist?",
    answer:
      "No. ICARE-CVD augments — never replaces — your medical team. Our AI surfaces signals and risks, but every diagnosis and treatment decision is made by a licensed cardiologist using the platform.",
  },
  {
    question: "How is my health data protected?",
    answer:
      "All data is encrypted in transit and at rest. The platform is HIPAA-aligned and GDPR-ready, with role-based access control and full audit logging. You stay the owner of your records and can revoke access at any time.",
  },
  {
    question: "Which file formats and tests are supported?",
    answer:
      "ICARE-CVD ingests structured vitals, lab results, prescriptions and free-text notes, plus image-based tests including ECG, Echo, X-ray, CT and MRI. Reports can be uploaded as PDFs and OCR'd automatically.",
  },
  {
    question: "Can patients use the platform on mobile?",
    answer:
      "Yes. The patient portal is fully responsive and works on phones, tablets and desktops, including in-clinic kiosks. Doctors get an optimized desktop workflow plus a mobile-friendly view for the floor.",
  },
  {
    question: "How quickly can a clinic onboard?",
    answer:
      "Most clinics are live within a single day. Our onboarding includes admin setup, role assignment for doctors and assistants, optional records import and a guided walkthrough of the AI tools.",
  },
  {
    question: "Does ICARE-CVD work with our existing EHR?",
    answer:
      "We provide structured exports and an API designed to integrate with most modern EHRs. Reach out to our team to scope an integration with your specific system.",
  },
];

function FaqRow({ item, defaultOpen = false }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group rounded-2xl border bg-card transition-all duration-300",
          open
            ? "border-brand-teal/40 shadow-lg shadow-brand-teal/10"
            : "border-border/60 hover:border-brand-teal/30",
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left">
          <span className="text-base font-semibold text-foreground sm:text-lg">
            {item.question}
          </span>
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal transition-all duration-300",
              open && "bg-brand-teal text-white",
            )}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                open && "rotate-180",
              )}
            />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
            {item.answer}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * FAQ section. Each row is a controlled Collapsible with an animated chevron.
 */
export function FAQSection() {
  return (
    <section
      id="faq"
      className="relative border-y border-border/50 bg-secondary/30 px-6 py-24 sm:px-12 sm:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <AnimateOnScroll variant="up">
          <div className="text-center mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-teal">
              FAQ
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Questions, answered.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Everything you need to know about ICARE-CVD before getting
              started.
            </p>
          </div>
        </AnimateOnScroll>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <AnimateOnScroll key={faq.question} variant="up" delay={i * 60}>
              <FaqRow item={faq} defaultOpen={i === 0} />
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
