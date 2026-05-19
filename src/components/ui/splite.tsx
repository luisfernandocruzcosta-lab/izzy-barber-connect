'use client';

import { Suspense, lazy, useEffect, useRef, useState } from 'react';
const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          }
        >
          <Spline scene={scene} className={className} />
        </Suspense>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground opacity-40" />
        </div>
      )}
    </div>
  );
}
