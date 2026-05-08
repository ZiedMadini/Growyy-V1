const PARTICLES: { x: number; size: number; dur: number; delay: number }[] = [
  { x: 8,  size: 4, dur: 10, delay: 0   },
  { x: 15, size: 5, dur: 13, delay: -3  },
  { x: 25, size: 4, dur: 9,  delay: -6  },
  { x: 35, size: 5, dur: 11, delay: -1  },
  { x: 42, size: 4, dur: 14, delay: -8  },
  { x: 50, size: 5, dur: 10, delay: -4  },
  { x: 58, size: 4, dur: 12, delay: -2  },
  { x: 65, size: 5, dur: 9,  delay: -7  },
  { x: 72, size: 4, dur: 11, delay: -5  },
  { x: 80, size: 5, dur: 13, delay: -3  },
  { x: 88, size: 4, dur: 10, delay: -9  },
  { x: 20, size: 4, dur: 14, delay: -1  },
  { x: 30, size: 5, dur: 12, delay: -6  },
  { x: 45, size: 4, dur: 10, delay: -4  },
  { x: 55, size: 5, dur: 13, delay: -8  },
  { x: 70, size: 4, dur: 9,  delay: -2  },
  { x: 82, size: 5, dur: 11, delay: -5  },
  { x: 92, size: 4, dur: 14, delay: -7  },
];

export function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: -6,
            width: p.size,
            height: p.size,
            background: "#5fd47e",
            opacity: 0.38,
            boxShadow: `0 0 ${p.size + 4}px rgba(95,212,126,0.6)`,
            animation: `float-up ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
