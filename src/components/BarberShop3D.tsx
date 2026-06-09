import { Suspense, lazy, useEffect, useRef, useState } from "react";

const Canvas = lazy(() =>
  import("@react-three/fiber").then((m) => ({ default: m.Canvas }))
);

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 768px)").matches || false;
}

function isLowPowerDevice() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const lowCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const saveData = nav.connection?.saveData === true;
  const slowNet = nav.connection?.effectiveType
    ? ["slow-2g", "2g", "3g"].includes(nav.connection.effectiveType)
    : false;
  const isCoarse =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches;
  return saveData || slowNet || (isCoarse && (lowCores || lowMem));
}

interface BarberShop3DProps {
  className?: string;
}

export function BarberShop3D({ className }: BarberShop3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [activated, setActivated] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [SceneComp, setSceneComp] = useState<React.ComponentType | null>(null);

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
      { rootMargin: "200px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView]);

  const shouldLoad = inView && (!lowPower || activated);

  useEffect(() => {
    if (!shouldLoad || SceneComp) return;
    import("./BarberShopScene").then((m) =>
      setSceneComp(() => m.BarberShopScene)
    );
  }, [shouldLoad, SceneComp]);

  return (
    <div ref={ref} className={className}>
      {shouldLoad && SceneComp ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          }
        >
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0.6, 5], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
            className="!h-full !w-full"
          >
            <SceneComp />
          </Canvas>
        </Suspense>
      ) : lowPower && inView ? (
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-3 text-foreground/80 transition-colors hover:text-foreground"
          aria-label="Carregar cena 3D da barbearia"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-border/70 bg-secondary/70">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 size-6">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-xs uppercase tracking-[0.2em]">
            Tocar para ver a barbearia em 3D
          </span>
        </button>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground opacity-40" />
        </div>
      )}
    </div>
  );
}
