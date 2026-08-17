/**
 * 單一設備型別的 instancedMesh 渲染器。
 * 無論台數多少（1 ~ 數千）都只用一次 draw call；hover 以 instanceId 定位，
 * 並以 instanceColor 做單台高亮。
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

export interface HoverInfo {
  typeKey: string;
  index: number;
  /** 游標的 client 座標（供 HTML 浮動卡定位） */
  x: number;
  y: number;
}

interface Props {
  typeKey: string;
  w: number;
  d: number;
  h: number;
  color: string;
  highlight: string;
  instances: { x: number; y: number }[];
  hoveredIndex: number | null;
  emissiveIntensity?: number;
  onHover: (info: HoverInfo | null) => void;
}

export default function InstancedEquipment({
  typeKey,
  w,
  d,
  h,
  color,
  highlight,
  instances,
  hoveredIndex,
  emissiveIntensity = 0.22,
  onHover,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = instances.length;

  // 實例矩陣：zone 局部座標（x,y 為底面角落）→ 幾何中心
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(instances[i].x + w / 2, h / 2, instances[i].y + d / 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere(); // frustum 友善：正確的包圍球
  }, [instances, count, w, d, h]);

  // 顏色：基底色 × instanceColor；hover 台以高亮色覆寫
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || count === 0) return;
    const base = new THREE.Color(color);
    const hl = new THREE.Color(highlight);
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, i === hoveredIndex ? hl : base);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [color, highlight, hoveredIndex, count]);

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const ne =
      (e as unknown as { nativeEvent?: PointerEvent }).nativeEvent ??
      (e as unknown as PointerEvent);
    onHover({ typeKey, index: e.instanceId ?? 0, x: ne.clientX, y: ne.clientY });
  };

  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
  };

  return (
    <instancedMesh
      key={`${typeKey}:${Math.max(1, count)}`}
      ref={meshRef}
      args={[undefined, undefined, Math.max(1, count)]}
      onPointerMove={handleMove}
      onClick={handleMove}
      onPointerOut={handleOut}
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.55}
        metalness={0.25}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
      />
    </instancedMesh>
  );
}
