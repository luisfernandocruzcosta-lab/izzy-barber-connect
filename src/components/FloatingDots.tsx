import { useMemo } from "react";

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
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * -20,
    driftX: (Math.random() - 0.5) * 30,
    driftY: (Math.random() - 0.5) * 20,
    opacity: Math.random() * 0.35 + 0.05,
  }));
}

const FloatingDots = () => {
  const dots = useMemo(() => buildDots(35), []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            opacity: dot.opacity,
            backgroundColor: "hsl(var(--foreground))",
            animationName: `float-dot-${dot.id}`,
            animationDuration: `${dot.duration}s`,
            animationDelay: `${dot.delay}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
          }}
        />
      ))}
      <style>{`
        ${dots
          .map(
            (dot) => `
          @keyframes float-dot-${dot.id} {
            0% {
              transform: translate(0, 0);
            }
            100% {
              transform: translate(${dot.driftX}px, ${dot.driftY}px);
            }
          }
        `
          )
          .join("\n")}
      `}</style>
    </div>
  );
};

export default FloatingDots;
