"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float, PerspectiveCamera, Sparkles } from "@react-three/drei";
import { Heart3D } from "./Heart3D";

interface Hero3DSceneProps {
  className?: string;
}

/**
 * 3D hero scene composing lights, sparkles and the beating heart.
 * Lazily mounted by the parent so Three.js never blocks first paint.
 *
 * No external HDR / CDN environment dependency — lighting is built from
 * direct lights so the scene works offline and in restricted networks.
 */
export function Hero3DScene({ className }: Hero3DSceneProps) {
  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 82]} fov={32} />

        <Suspense fallback={null}>
          <ambientLight intensity={0.42} />
          <hemisphereLight args={["#ffffff", "#1a5345", 0.5]} />
          <directionalLight
            position={[10, 14, 10]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={90}
          />
          <pointLight position={[-16, 6, -12]} intensity={0.8} color="#3d8b78" />
          <pointLight position={[14, -8, 12]} intensity={1} color="#e15c5c" />
          <spotLight
            position={[0, 16, 18]}
            angle={0.45}
            penumbra={0.7}
            intensity={1.25}
            color="#ffffff"
          />
          {/* Rim light to highlight silhouette */}
          <directionalLight position={[-12, 6, -18]} intensity={1.05} color="#ffd1d1" />

          <Float
            speed={1.4}
            rotationIntensity={0.35}
            floatIntensity={0.7}
            floatingRange={[-0.2, 0.2]}
          >
            <Heart3D scale={0.72} />
          </Float>

          <Sparkles
            count={90}
            scale={[34, 34, 20]}
            size={3}
            speed={0.35}
            color="#3d8b78"
            opacity={0.6}
          />
          <Sparkles
            count={36}
            scale={[30, 30, 16]}
            size={2}
            speed={0.5}
            color="#e15c5c"
            opacity={0.45}
          />

          <ContactShadows
            position={[0, -18, 0]}
            opacity={0.5}
            scale={34}
            blur={3}
            far={28}
            color="#1a5345"
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
