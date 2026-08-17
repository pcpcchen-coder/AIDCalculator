/**
 * Zone 平台：深色地板塊 + 每公尺網格線（GridHelper 縮放至房間實際寬深）。
 */
interface Props {
  w: number;
  d: number;
  tint: string;
  lineColor: string;
}

export default function ZonePlatform({ w, d, tint, lineColor }: Props) {
  const size = Math.max(w, d, 1);
  const divisions = Math.min(240, Math.max(1, Math.round(size)));
  return (
    <group>
      <mesh position={[0, -0.09, 0]}>
        <boxGeometry args={[w, 0.18, d]} />
        <meshStandardMaterial color={tint} roughness={0.92} metalness={0.08} />
      </mesh>
      <gridHelper
        args={[size, divisions, lineColor, lineColor]}
        position={[0, 0.02, 0]}
        scale={[w / size, 1, d / size]}
      />
    </group>
  );
}
