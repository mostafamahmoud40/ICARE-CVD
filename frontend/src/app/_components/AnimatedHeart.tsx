"use client";

/**
 * AnimatedHeart — A pulsing, wireframe-style SVG heart inspired by icare4cvd.eu.
 * Uses layered SVG paths with CSS keyframe animations for a breathing/pulse effect.
 */
export function AnimatedHeart({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 400 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_40px_rgba(26,83,69,0.3)]"
      >
        <defs>
          {/* Gradient for the heart outline */}
          <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a5345" />
            <stop offset="50%" stopColor="#3d8b78" />
            <stop offset="100%" stopColor="#1a5345" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Stronger glow */}
          <filter id="glowStrong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background ambient glow */}
        <circle
          cx="200"
          cy="220"
          r="160"
          fill="url(#heartGrad)"
          opacity="0.04"
          className="animate-[heartPulse_2s_ease-in-out_infinite]"
        />

        {/* Outer wireframe heart — main shape */}
        <g
          filter="url(#glow)"
          className="animate-[heartPulse_2s_ease-in-out_infinite]"
          style={{ transformOrigin: "200px 230px" }}
        >
          <path
            d="M200 420
               C200 420 40 300 40 180
               C40 100 100 50 160 50
               C190 50 200 80 200 80
               C200 80 210 50 240 50
               C300 50 360 100 360 180
               C360 300 200 420 200 420Z"
            stroke="url(#heartGrad)"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
        </g>

        {/* Inner wireframe layers — anatomical detail lines */}
        <g
          filter="url(#glow)"
          className="animate-[heartPulse_2s_ease-in-out_0.1s_infinite]"
          style={{ transformOrigin: "200px 230px" }}
        >
          {/* Left ventricle outline */}
          <path
            d="M200 390
               C200 390 70 280 70 185
               C70 120 115 75 160 75
               C185 75 200 100 200 100"
            stroke="#3d8b78"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
          {/* Right ventricle outline */}
          <path
            d="M200 100
               C200 100 215 75 240 75
               C285 75 330 120 330 185
               C330 280 200 390 200 390"
            stroke="#3d8b78"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
        </g>

        {/* Deep inner layer */}
        <g
          filter="url(#glow)"
          className="animate-[heartPulse_2s_ease-in-out_0.2s_infinite]"
          style={{ transformOrigin: "200px 230px" }}
        >
          <path
            d="M200 350
               C200 350 100 270 100 195
               C100 145 130 110 165 110
               C183 110 200 130 200 130
               C200 130 217 110 235 110
               C270 110 300 145 300 195
               C300 270 200 350 200 350Z"
            stroke="#1a5345"
            strokeWidth="1"
            fill="none"
            opacity="0.4"
          />
        </g>

        {/* Wireframe mesh lines — horizontal */}
        <g opacity="0.2" className="animate-[heartPulse_2s_ease-in-out_0.15s_infinite]" style={{ transformOrigin: "200px 230px" }}>
          <path d="M85 150 Q200 130 315 150" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
          <path d="M70 200 Q200 175 330 200" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
          <path d="M80 250 Q200 225 320 250" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
          <path d="M100 300 Q200 275 300 300" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
          <path d="M130 340 Q200 320 270 340" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
        </g>

        {/* Wireframe mesh lines — vertical */}
        <g opacity="0.15" className="animate-[heartPulse_2s_ease-in-out_0.15s_infinite]" style={{ transformOrigin: "200px 230px" }}>
          <path d="M140 70 Q130 230 185 400" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
          <path d="M200 80 Q200 230 200 420" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
          <path d="M260 70 Q270 230 215 400" stroke="#3d8b78" strokeWidth="0.8" fill="none" />
        </g>

        {/* Pulse ring effect */}
        <circle
          cx="200"
          cy="220"
          r="120"
          stroke="#3d8b78"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
          className="animate-[pulseRing_2s_ease-out_infinite]"
          style={{ transformOrigin: "200px 220px" }}
        />
        <circle
          cx="200"
          cy="220"
          r="120"
          stroke="#1a5345"
          strokeWidth="0.5"
          fill="none"
          opacity="0.2"
          className="animate-[pulseRing_2s_ease-out_0.5s_infinite]"
          style={{ transformOrigin: "200px 220px" }}
        />

        {/* ECG-style pulse line across the heart */}
        <g filter="url(#glowStrong)">
          <path
            d="M30 230 L130 230 L150 230 L160 200 L170 260 L180 190 L190 270 L200 180 L210 240 L220 220 L240 230 L370 230"
            stroke="#e15c5c"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[ecgPulse_2s_ease-in-out_infinite]"
            strokeDasharray="600"
            strokeDashoffset="0"
          />
        </g>

        {/* Small glow dots at key anatomical points */}
        <g className="animate-[heartPulse_2s_ease-in-out_infinite]" style={{ transformOrigin: "200px 230px" }}>
          <circle cx="160" cy="50" r="3" fill="#3d8b78" opacity="0.6" filter="url(#glow)" />
          <circle cx="240" cy="50" r="3" fill="#3d8b78" opacity="0.6" filter="url(#glow)" />
          <circle cx="200" cy="420" r="3" fill="#e15c5c" opacity="0.7" filter="url(#glow)" />
          <circle cx="200" cy="80" r="2.5" fill="#3d8b78" opacity="0.5" filter="url(#glow)" />
        </g>
      </svg>

      {/* Keyframe animations */}
      <style>{`
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.04); }
          30% { transform: scale(1); }
          45% { transform: scale(1.02); }
          60% { transform: scale(1); }
        }

        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        @keyframes ecgPulse {
          0% { stroke-dashoffset: 600; opacity: 0; }
          20% { opacity: 0.7; }
          50% { stroke-dashoffset: 0; opacity: 0.7; }
          80% { opacity: 0; }
          100% { stroke-dashoffset: -600; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
