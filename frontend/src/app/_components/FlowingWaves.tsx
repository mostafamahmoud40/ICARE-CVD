"use client";

/**
 * FlowingWaves — Animated SVG flowing wave lines for the hero background,
 * inspired by the icare4cvd.eu flowing-line aesthetic.
 */
export function FlowingWaves({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 1200 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a5345" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3d8b78" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e15c5c" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#e89042" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Teal wave set */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={`teal-${i}`}
            d={`M${-100 + i * 15} ${100 + i * 30} 
                Q${300 + i * 10} ${50 + i * 20}, ${600 + i * 5} ${200 + i * 25} 
                T${1300 + i * 10} ${150 + i * 35}`}
            stroke="url(#waveGrad1)"
            strokeWidth={0.8 + i * 0.1}
            fill="none"
            style={{
              animation: `waveFlow ${12 + i * 2}s ease-in-out ${i * 0.4}s infinite alternate`,
            }}
          />
        ))}

        {/* Red/Pink wave set — subtle accent */}
        {[0, 1, 2, 3].map((i) => (
          <path
            key={`red-${i}`}
            d={`M${-50 + i * 20} ${400 + i * 40}
                Q${400 + i * 15} ${350 + i * 30}, ${800 + i * 10} ${500 + i * 20}
                T${1400 + i * 5} ${450 + i * 35}`}
            stroke="url(#waveGrad2)"
            strokeWidth={0.6 + i * 0.1}
            fill="none"
            style={{
              animation: `waveFlow ${14 + i * 2}s ease-in-out ${i * 0.6}s infinite alternate`,
            }}
          />
        ))}
      </svg>

      <style>{`
        @keyframes waveFlow {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(10px); }
          100% { transform: translateY(5px) translateX(-5px); }
        }
      `}</style>
    </div>
  );
}
