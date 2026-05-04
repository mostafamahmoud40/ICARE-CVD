"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees (default 8°) */
  maxTilt?: number;
  /** Glare overlay opacity at the cursor (default 0.18) */
  glareOpacity?: number;
  /** Adds a small scale-up on hover */
  scale?: number;
}

/**
 * Mouse-tracked 3D tilt wrapper.
 *
 * Single responsibility: react to pointer movement and apply a 3D transform
 * + cursor-following glare. Uses direct refs and rAF — no React re-renders
 * fire on mousemove, which keeps the rest of the page idle while hovering.
 *
 * Touch devices don't fire mousemove so the tilt is automatically inactive
 * on real phones/tablets without any extra branching.
 */
export function Tilt3D({
  children,
  className,
  maxTilt = 8,
  glareOpacity = 0.18,
  scale = 1.02,
}: Tilt3DProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const glareRef = useRef<HTMLSpanElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * maxTilt;
    const ry = (px - 0.5) * maxTilt;

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      wrapper.style.transform = `perspective(900px) rotateX(${rx.toFixed(
        2,
      )}deg) rotateY(${ry.toFixed(2)}deg) scale3d(${scale},${scale},${scale})`;
      const glare = glareRef.current;
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${
          px * 100
        }% ${py * 100}%, rgba(255,255,255,${glareOpacity}), transparent 55%)`;
        glare.style.opacity = "1";
      }
    });
  };

  const handleLeave = () => {
    const wrapper = wrapperRef.current;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (wrapper) {
      wrapper.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }
    const glare = glareRef.current;
    if (glare) glare.style.opacity = "0";
  };

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        "relative h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-200 ease-out",
        className,
      )}
    >
      {children}
      <span
        ref={glareRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-overlay transition-opacity duration-200"
      />
    </div>
  );
}
