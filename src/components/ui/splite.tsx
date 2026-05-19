'use client';

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

// Heurística: dispositivos com pouca CPU/memória ou em modo "economizar dados"
// recebem um botão para carregar o 3D sob demanda, evitando travar o scroll.
function isLowPowerDevice() {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const lowCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const saveData = nav.connection?.saveData === true;
  const slowNet = nav.connection?.effectiveType
    ? ['slow-2g', '2g', '3g'].includes(nav.connection.effectiveType)
    : false;
  const isCoarse = typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse)').matches;
  return saveData || slowNet || (isCoarse && (lowCores || lowMem));
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [activated, setActivated] = useState(false);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    setLowPower(isLowPowerDevice());
  }, []);

  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView]);

  // Em dispositivos potentes carrega automático; em low-power espera clique
  const shouldLoad = inView && (!lowPower || activated);

  return (
    <div ref={ref} className={className}>
      {shouldLoad ? (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          }
        >
          <Spline scene={scene} className={className} />
        </Suspense>
      ) : lowPower && inView ? (
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="w-full h-full flex flex-col items-center justify-center gap-3 text-foreground/80 hover:text-foreground transition-colors"
          aria-label="Carregar experiência 3D"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-border/70 bg-secondary/70">
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-xs uppercase tracking-[0.2em]">Tocar para ver em 3D</span>
        </button>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground opacity-40" />
        </div>
      )}
    </div>
  );
}
