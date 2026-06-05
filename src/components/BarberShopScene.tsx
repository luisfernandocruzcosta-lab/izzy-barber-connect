import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * Cena 3D temática de barbearia:
 *  - Poste de barbeiro (barber pole) com listras girando
 *  - Tesoura flutuando
 *  - Navalha flutuando
 *  - Iluminação cinematográfica
 */
function BarberPole() {
  const stripesRef = useRef<THREE.Mesh>(null!);

  // Textura procedural de listras vermelho/branco/azul em diagonal
  const stripeTexture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    // fundo cinza claro
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(0, 0, 128, 128);
    // listras diagonais em tons de cinza
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-Math.PI / 4);
    ctx.translate(-64, -64);
    const stripeH = 22;
    for (let y = -128; y < 256; y += stripeH * 3) {
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(-64, y, 256, stripeH);
      ctx.fillStyle = "#6b6b6b";
      ctx.fillRect(-64, y + stripeH, 256, stripeH);
    }
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (stripesRef.current) {
      // animar as listras descendo (offset da textura)
      const mat = stripesRef.current.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.y -= delta * 0.35;
      }
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Topo prata */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.28, 0.2, 32]} />
        <meshStandardMaterial
          color="#a0a0a0"
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#a0a0a0"
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* Cilindro das listras */}
      <mesh ref={stripesRef} position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.8, 64]} />
        <meshStandardMaterial
          map={stripeTexture}
          metalness={0.1}
          roughness={0.35}
        />
      </mesh>

      {/* Vidro externo (transparente) */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 1.85, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#e0e0e0"
          transmission={0.9}
          thickness={0.2}
          roughness={0.05}
          metalness={0}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base */}
      <mesh position={[0, -0.45, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.25, 32]} />
        <meshStandardMaterial
          color="#a0a0a0"
          metalness={0.9}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, -0.65, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.18, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}


export function BarberShopScene() {
  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 6, 14]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 6, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 2, 2]} intensity={0.6} color="#cccccc" />
      <pointLight position={[3, 2, 2]} intensity={0.6} color="#aaaaaa" />
      <spotLight
        position={[0, 5, 3]}
        angle={0.4}
        penumbra={0.8}
        intensity={1.2}
        color="#e0e0e0"
      />

      <Float speed={1} rotationIntensity={0.15} floatIntensity={0.3}>
        <BarberPole />
      </Float>


      <ContactShadows
        position={[0, -1.25, 0]}
        opacity={0.55}
        scale={8}
        blur={2.4}
        far={3}
      />

      <Environment preset="city" />
    </>
  );
}
