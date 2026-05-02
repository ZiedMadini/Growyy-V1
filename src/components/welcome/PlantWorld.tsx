// src/components/welcome/PlantWorld.tsx
// One tall SVG world the camera pans over.
// viewBox is 400 wide × 2400 tall. Scene anchors:
//   Scene 1 (Roots):     y ≈ 2100
//   Scene 2 (Buds):      y ≈ 1500
//   Scene 3 (Foliage):   y ≈ 900
//   Scene 4 (Crown):     y ≈ 300
export const PLANT_WORLD_HEIGHT = 2400;
export const PLANT_WORLD_WIDTH = 400;
export const SCENE_ANCHORS = [2100, 1500, 900, 300] as const;

type Props = {
  /** Reveals progressively as scene index increases (0-3). */
  sceneIndex: number;
  /** When set, plays the entrance animation for this specific scene's accents */
  activeScene: number;
};

export function PlantWorld({ sceneIndex, activeScene }: Props) {
  const showRoots = true;
  const showStem = sceneIndex >= 0;
  const showBuds = sceneIndex >= 1;
  const showLeaves = sceneIndex >= 2;
  const showCrown = sceneIndex >= 3;
  const ripe = sceneIndex >= 3;

  return (
    <svg
      viewBox={`0 0 ${PLANT_WORLD_WIDTH} ${PLANT_WORLD_HEIGHT}`}
      width={PLANT_WORLD_WIDTH}
      height={PLANT_WORLD_HEIGHT}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="reservoir" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2EA84A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0d2114" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="leafGlow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#5fd47e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5fd47e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fd47e" />
          <stop offset="100%" stopColor="#2EA84A" />
        </linearGradient>
      </defs>

      {/* RESERVOIR (always visible — bottom) */}
      <g>
        <rect x="60" y="2150" width="280" height="220" rx="32" fill="url(#reservoir)" stroke="rgba(255,255,255,0.08)" />
        <path d="M70 2200 Q 200 2185 330 2200" stroke="rgba(95,212,126,0.5)" strokeWidth="1.5" fill="none" />
        <path d="M70 2210 Q 200 2225 330 2210" stroke="rgba(95,212,126,0.3)" strokeWidth="1" fill="none" />
      </g>

      {/* ROOTS */}
      {showRoots && (
        <g opacity="0.85">
          <path d="M200 2150 Q 180 2200 160 2260" stroke="#5fd47e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M200 2150 Q 220 2210 250 2280" stroke="#5fd47e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M200 2150 Q 200 2210 200 2300" stroke="#5fd47e" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M200 2150 Q 175 2230 145 2330" stroke="#5fd47e" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M200 2150 Q 230 2240 270 2340" stroke="#5fd47e" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      )}

      {/* STEM */}
      {showStem && (
        <g>
          <path d="M200 2150 Q 195 1700 198 1500 Q 202 1200 196 900 Q 190 600 200 300" stroke="url(#stem)" strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="180" cy="2080" rx="22" ry="8" fill="#2EA84A" transform="rotate(-25 180 2080)" />
          <ellipse cx="220" cy="2070" rx="22" ry="8" fill="#5fd47e" transform="rotate(25 220 2070)" />
        </g>
      )}

      {/* MID BRANCHES + BUDS (scene 2) */}
      {showBuds && (
        <g>
          <path d="M198 1620 Q 140 1580 90 1530" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M198 1620 Q 260 1580 320 1530" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M198 1480 Q 150 1430 110 1380" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M198 1480 Q 250 1430 300 1380" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="100" cy="1525" rx="22" ry="9" fill="#2EA84A" transform="rotate(-30 100 1525)" />
          <ellipse cx="305" cy="1525" rx="22" ry="9" fill="#5fd47e" transform="rotate(30 305 1525)" />
          <ellipse cx="120" cy="1380" rx="20" ry="8" fill="#5fd47e" transform="rotate(-25 120 1380)" />
          <ellipse cx="290" cy="1380" rx="20" ry="8" fill="#2EA84A" transform="rotate(25 290 1380)" />
          <circle cx="105" cy="1540" r="7" fill="#5fd47e" />
          <circle cx="300" cy="1540" r="7" fill="#5fd47e" />
          <circle cx="125" cy="1395" r="6" fill="#5fd47e" />
          <circle cx="285" cy="1395" r="6" fill="#5fd47e" />
        </g>
      )}

      {/* MID-UPPER FOLIAGE (scene 3) */}
      {showLeaves && (
        <g>
          <path d="M200 980 Q 130 940 75 880" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M200 980 Q 270 940 325 880" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="80" cy="870" rx="38" ry="14" fill="#2EA84A" transform="rotate(-30 80 870)" />
          <ellipse cx="320" cy="870" rx="38" ry="14" fill="#5fd47e" transform="rotate(30 320 870)" />
          <ellipse cx="60" cy="900" rx="30" ry="11" fill="#5fd47e" transform="rotate(-45 60 900)" opacity="0.85" />
          <ellipse cx="340" cy="900" rx="30" ry="11" fill="#2EA84A" transform="rotate(45 340 900)" opacity="0.85" />
          <ellipse cx="80" cy="870" rx="38" ry="14" fill="url(#leafGlow)" transform="rotate(-30 80 870)" />
          <ellipse cx="320" cy="870" rx="38" ry="14" fill="url(#leafGlow)" transform="rotate(30 320 870)" />
        </g>
      )}

      {/* CROWN (scene 4) */}
      {showCrown && (
        <g>
          <path d="M200 380 Q 140 330 90 280" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M200 380 Q 260 330 310 280" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M200 280 Q 170 220 200 180" stroke="#2EA84A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="95" cy="270" rx="34" ry="13" fill="#2EA84A" transform="rotate(-25 95 270)" />
          <ellipse cx="305" cy="270" rx="34" ry="13" fill="#5fd47e" transform="rotate(25 305 270)" />
          <ellipse cx="200" cy="170" rx="40" ry="14" fill="#5fd47e" />
          <g id="crownVegLeft">
            <circle cx="100" cy="295" r="14" fill={ripe ? "#FF6B6B" : "#5fd47e"} />
            <circle cx="100" cy="293" r="4" fill="rgba(255,255,255,0.3)" />
          </g>
          <g id="crownVegRight">
            <circle cx="300" cy="295" r="14" fill={ripe ? "#FF6B6B" : "#5fd47e"} />
            <circle cx="300" cy="293" r="4" fill="rgba(255,255,255,0.3)" />
          </g>
          <g id="crownVegTop">
            <circle cx="205" cy="205" r="16" fill={ripe ? "#FF6B6B" : "#5fd47e"} />
            <circle cx="205" cy="203" r="5" fill="rgba(255,255,255,0.35)" />
          </g>
        </g>
      )}

      {/* SCENE 1 ACCENTS — floating sensor labels around the seedling */}
      {activeScene === 0 && (
        <g>
          <SensorBadge x={90} y={2050} label="24°C" delay={0.2} />
          <SensorBadge x={300} y={2050} label="65%" delay={0.5} />
          <SensorBadge x={70} y={2150} label="pH 5.9" delay={0.8} />
          <SensorBadge x={310} y={2150} label="EC 1.6" delay={1.1} />
        </g>
      )}

      {/* SCENE 2 ACCENT — dosing droplet falling into reservoir */}
      {activeScene === 1 && <DosingDroplet />}

      {/* SCENE 3 ACCENT — chart line drawing across foliage */}
      {activeScene === 2 && <ChartAcrossLeaves />}

      {/* SCENE 4 ACCENT — shimmer ghost of larger predicted vegetables */}
      {activeScene === 3 && <PredictionGhost />}
    </svg>
  );
}

function SensorBadge({ x, y, label, delay }: { x: number; y: number; label: string; delay: number }) {
  return (
    <g style={{ animation: `fade-in-up 0.6s ${delay}s both` }}>
      <rect x={x - 28} y={y - 12} width="56" height="22" rx="11" fill="rgba(255,255,255,0.06)" stroke="rgba(95,212,126,0.4)" />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="#5fd47e" fontFamily="ui-monospace, monospace">
        {label}
      </text>
    </g>
  );
}

function DosingDroplet() {
  return (
    <g>
      <circle cx="200" cy="1900" r="6" fill="#5fd47e">
        <animate attributeName="cy" from="1900" to="2160" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <ellipse cx="200" cy="2200" rx="30" ry="3" fill="#5fd47e" opacity="0.4">
        <animate attributeName="rx" values="0;40;0" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.5;0" dur="1.6s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

function ChartAcrossLeaves() {
  return (
    <g>
      <path
        d="M 60 920 Q 130 870 200 900 T 340 880"
        fill="none"
        stroke="#5fd47e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="600"
        strokeDashoffset="600"
        style={{ animation: "draw-line 1.4s 0.3s forwards" }}
      />
      {[80, 140, 200, 260, 320].map((cx, i) => (
        <circle key={cx} cx={cx} cy={920 - Math.sin(i) * 12} r="3" fill="#5fd47e" style={{ animation: `fade-in-up 0.4s ${0.5 + i * 0.15}s both` }} />
      ))}
    </g>
  );
}

function PredictionGhost() {
  return (
    <g style={{ animation: "fade-in-up 0.8s 0.4s both" }}>
      <circle cx="100" cy="240" r="22" fill="#FF6B6B" opacity="0.18">
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="300" cy="240" r="22" fill="#FF6B6B" opacity="0.18">
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="205" cy="155" r="26" fill="#FF6B6B" opacity="0.18">
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
      </circle>
      <rect x="155" y="100" width="90" height="22" rx="11" fill="rgba(255,107,107,0.1)" stroke="rgba(255,107,107,0.5)" strokeDasharray="3,3" />
      <text x="200" y="116" textAnchor="middle" fontSize="10" fill="#FF6B6B" fontFamily="ui-monospace, monospace">
        +24% YIELD
      </text>
    </g>
  );
}
