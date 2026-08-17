import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 600;

/** 約 600 個青色微光粒子沿透視軸緩慢向觀者流動（模擬冷通道氣流/資料流） */
function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30; // z
      speeds[i] = 0.8 + Math.random() * 1.6;
    }
    return { positions, speeds };
  }, []);

  useFrame((state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const d = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 2] += speeds[i] * d * 2.2;
      if (arr[i * 3 + 2] > 8) {
        arr[i * 3 + 2] = -22;
        arr[i * 3] = (Math.random() - 0.5) * 24;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      }
    }
    pos.needsUpdate = true;

    // 滑鼠視差 ±20px 等效（場景單位換算約 ±0.8）
    const nx = (state.pointer.x * 0.8 - mouse.current.x) * 0.06;
    const ny = (state.pointer.y * 0.5 - mouse.current.y) * 0.06;
    mouse.current.x += nx;
    mouse.current.y += ny;
    pts.position.x = mouse.current.x;
    pts.position.y = mouse.current.y;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#22D3EE"
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroParticles() {
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      camera={{ position: [0, 0, 8], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
    >
      <ParticleField />
    </Canvas>
  );
}
