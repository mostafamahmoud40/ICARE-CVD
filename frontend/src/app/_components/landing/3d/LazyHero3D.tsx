"use client";

import dynamic from "next/dynamic";
import { AnimatedHeart } from "../../AnimatedHeart";

/**
 * Code-splits the heavy Three.js bundle out of the initial page load.
 * Until the 3D canvas is ready (or in environments without WebGL), the
 * existing SVG heart is shown as a graceful fallback.
 */
const Hero3DScene = dynamic(
  () => import("./Hero3DScene").then((m) => m.Hero3DScene),
  {
    ssr: false,
    loading: () => (
      <AnimatedHeart className="w-72 h-[420px] sm:w-80 sm:h-[480px] lg:w-[380px] lg:h-[520px]" />
    ),
  },
);

export function LazyHero3D({ className }: { className?: string }) {
  return <Hero3DScene className={className} />;
}
