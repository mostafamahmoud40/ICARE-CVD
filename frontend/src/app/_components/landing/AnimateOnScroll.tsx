"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "up" | "left" | "right" | "scale";

interface AnimateOnScrollProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
  /** Once true, animation only runs the first time the element enters viewport */
  once?: boolean;
}

const variantClass: Record<Variant, string> = {
  up: "reveal",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
};

/**
 * Reveals its children with a CSS transition the first time they scroll into view.
 * Single responsibility: orchestrate IntersectionObserver + class toggling.
 */
export function AnimateOnScroll({
  children,
  variant = "up",
  delay = 0,
  className,
  once = true,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(variantClass[variant], inView && "in-view", className)}
    >
      {children}
    </div>
  );
}
