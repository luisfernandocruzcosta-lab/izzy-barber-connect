import { useEffect, useMemo, useState } from "react";

interface Dot {
  id: number;
  size: number;
  left: number;
  top: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

function buildDots(count: number): Dot[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 25 + 18,
    delay: Math.random() * -25,
    driftX: (Math.random() - 0.5) * 25,
    driftY: (Math.random() - 0.5) * 18,
    opacity: Math.random() * 0.22 + 0.04,
  }));
}

const FloatingDots = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setCount(0);
      return;
    }
    setCount(isMobile ? 20 : 45);
  }, []);

  const dots = useMemo(() => buildDots(count), [count]);

  if (!count) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full bg-white floating-dot"
          style={
            {
              width: dot.size,
              height: dot.size,
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              opacity: dot.opacity,
              animationDuration: `${dot.duration}s`,
              animationDelay: `${dot.delay}s`,
              ["--dx" as string]: `${dot.driftX}px`,
              ["--dy" as string]: `${dot.driftY}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes float-dot {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(var(--dx), var(--dy), 0); }
        }
        .floating-dot {
          animation-name: float-dot;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default FloatingDots;
