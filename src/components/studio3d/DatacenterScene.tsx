/**
 * DatacenterScene — 3D 資料中心展示（React Three Fiber）
 * 依 LayoutModel 渲染三個 zone 平台（white 機房 / indoor 機電房 / outdoor 室外場），
 * 所有 BOM 型別以真實尺寸（公尺）instancedMesh 呈現；hover 顯示浮動資訊卡。
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type CSSProperties,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import type { LayoutModel, LayoutType, Zone } from "@contracts/layout";
import { useI18n } from "@/i18n";
import {
  colorForType,
  HOVER_HIGHLIGHT,
  ZONE_LINE,
  ZONE_TINT,
} from "./lib/colors";
import InstancedEquipment, { type HoverInfo } from "./lib/InstancedEquipment";
import ZonePlatform from "./lib/ZonePlatform";

const ZONE_GAP = 6; // 平台間距（公尺）
const SIMPLE_CAP = 60; // 簡化密度下每型別最多顯示台數
const ZONES: Zone[] = ["white", "indoor", "outdoor"];
const CAT_ORDER = [
  "rack",
  "cdu",
  "chiller",
  "dry_cooler",
  "cooling_tower",
  "pdu",
  "ups",
  "msb",
  "generator",
] as const;

type Vec3 = [number, number, number];

interface CamFit {
  target: Vec3;
  pos: Vec3;
  far: number;
}

/** 依整體佈局範圍計算初始視角（等角俯視） */
function computeFit(model: LayoutModel): CamFit {
  const { white, indoor, outdoor } = model.rooms;
  const minX = -white.w / 2;
  const maxX = white.w / 2 + ZONE_GAP + indoor.w + ZONE_GAP + outdoor.w;
  const depth = Math.max(white.d, indoor.d, outdoor.d, 4);
  const width = Math.max(maxX - minX, 4);
  const cx = (minX + maxX) / 2;
  const r = Math.max(width, depth) * 0.62 + 10;
  return {
    target: [cx, 0, 0],
    pos: [cx + r * 0.95, r * 0.8, r * 0.95],
    far: r * 14,
  };
}

/** 相機控制器：阻尼 + 自動旋轉 + 重置視角 */
function Controls({
  fit,
  autoRotate,
  resetSignal,
}: {
  fit: CamFit;
  autoRotate: boolean;
  resetSignal: number;
}) {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);

  // 初始定位與「重置視角」（resetSignal 變動時重設相機與目標）
  useEffect(() => {
    camera.position.set(...fit.pos);
    const c = ref.current;
    if (c) {
      c.target.set(...fit.target);
      c.update();
    }
  }, [resetSignal, fit, camera]);

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      target={fit.target}
      enableDamping
      dampingFactor={0.08}
      autoRotate={autoRotate}
      autoRotateSpeed={0.7}
      minDistance={4}
      maxDistance={fit.far / 2}
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  );
}

const labelStyle: CSSProperties = {
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 11,
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
  background: "rgba(8, 15, 26, 0.78)",
  border: "1px solid rgba(56, 189, 248, 0.35)",
  color: "#bae6fd",
  pointerEvents: "none",
};

const chillerLabelStyle: CSSProperties = {
  ...labelStyle,
  border: "1px solid rgba(56, 189, 248, 0.8)",
  color: "#7dd3fc",
  boxShadow: "0 0 12px rgba(56, 189, 248, 0.45)",
};

interface Group {
  type: LayoutType;
  instances: { x: number; y: number }[];
}

export default function DatacenterScene({ model }: { model: LayoutModel }) {
  const { t } = useI18n();
  const [hiddenZones, setHiddenZones] = useState<Set<Zone>>(new Set());
  const [hiddenCats, setHiddenCats] = useState<Set<string>>(new Set());
  const [autoRotate, setAutoRotate] = useState(false);
  const [density, setDensity] = useState<"full" | "simple">("full");
  const [resetSignal, setResetSignal] = useState(0);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // zone 平台中心（white 於原點，indoor 於側邊，outdoor 再外側）
  const zoneCenters = useMemo<Record<Zone, Vec3>>(() => {
    const { white, indoor, outdoor } = model.rooms;
    const ix = white.w / 2 + ZONE_GAP + indoor.w / 2;
    const ox = white.w / 2 + ZONE_GAP + indoor.w + ZONE_GAP + outdoor.w / 2;
    return { white: [0, 0, 0], indoor: [ix, 0, 0], outdoor: [ox, 0, 0] };
  }, [model]);

  const fit = useMemo(() => computeFit(model), [model]);

  // 每個 BOM 型別的實例（缺實例時補一台，確保每個型別都出現在場景中）
  const groups = useMemo<Group[]>(() => {
    return model.types.map((type) => {
      let inst = (model.instances[type.zone] ?? [])
        .filter((i) => i.typeKey === type.key)
        .map((i) => ({ x: i.x, y: i.y }));
      if (inst.length === 0) inst = [{ x: 0.6, y: 0.6 }];
      if (density === "simple" && inst.length > SIMPLE_CAP) {
        const step = Math.ceil(inst.length / SIMPLE_CAP);
        inst = inst.filter((_, i) => i % step === 0);
      }
      return { type, instances: inst };
    });
  }, [model, density]);

  const presentCats = useMemo(
    () => CAT_ORDER.filter((c) => model.types.some((ty) => ty.category === c)),
    [model],
  );

  const hoverType = hover
    ? model.types.find((ty) => ty.key === hover.typeKey) ?? null
    : null;

  // 事件時即把游標 viewport 座標轉為容器內座標（避免 render 期間讀 ref）
  const handleHover = (info: HoverInfo | null) => {
    if (!info) {
      setHover(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    setHover({
      ...info,
      x: info.x - (rect?.left ?? 0),
      y: info.y - (rect?.top ?? 0),
    });
  };

  const toggleZone = (z: Zone) =>
    setHiddenZones((s) => {
      const n = new Set(s);
      if (n.has(z)) n.delete(z);
      else n.add(z);
      return n;
    });

  const toggleCat = (c: string) =>
    setHiddenCats((s) => {
      const n = new Set(s);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  const pill = (active: boolean): string =>
    `rounded-md border px-2 py-1 text-[11px] leading-none transition-colors ${
      active
        ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-200"
        : "border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200"
    }`;

  const m = model.metrics;
  const infoRows: [string, string][] = [
    [t("studio3d.info.itPower"), `${m.itPowerMw.toFixed(2)} MW`],
    [t("studio3d.info.density"), `${m.powerDensityKwM2.toFixed(1)} kW/m²`],
    [t("studio3d.info.whiteSpace"), `${m.whiteSpaceM2.toFixed(0)} m²`],
    [
      t("studio3d.info.graySpace"),
      `${m.grayIndoorM2.toFixed(0)} / ${m.grayOutdoorM2.toFixed(0)} m²`,
    ],
    [t("studio3d.info.cooling"), `${m.coolingPowerMw.toFixed(2)} MW`],
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0b0f16]"
      style={{ minHeight: 420 }}
    >
      <Canvas
        dpr={[1, 2]}
        frameloop="always"
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: fit.pos, fov: 42, near: 0.5, far: fit.far }}
        onPointerMissed={() => setHover(null)}
      >
        <color attach="background" args={["#0b0f16"]} />
        <fog attach="fog" args={["#0b0f16", fit.far / 3, fit.far]} />

        {/* 燈光：環境光 + 方向光 + 青色點光氛圍 */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[40, 60, 25]} intensity={1.15} />
        <pointLight
          position={[zoneCenters.white[0], 14, 0]}
          intensity={900}
          distance={Math.max(model.rooms.white.w, model.rooms.white.d) * 2.2}
          color="#22d3ee"
        />

        <Controls fit={fit} autoRotate={autoRotate} resetSignal={resetSignal} />

        {/* 三個 zone 平台 + 實例 */}
        {ZONES.map((z) => {
          if (hiddenZones.has(z)) return null;
          const rect = model.rooms[z];
          const center = zoneCenters[z];
          return (
            <group key={z} position={center}>
              <ZonePlatform
                w={rect.w}
                d={rect.d}
                tint={ZONE_TINT[z]}
                lineColor={ZONE_LINE[z]}
              />
              <Html
                position={[-rect.w / 2 + 1, 0.4, -rect.d / 2 - 0.6]}
                center
                zIndexRange={[10, 0]}
              >
                <div style={labelStyle}>
                  {t(`studio3d.zone.${z}`)} · {rect.w.toFixed(0)}×
                  {rect.d.toFixed(0)} m
                </div>
              </Html>
              {groups
                .filter(
                  (g) => g.type.zone === z && !hiddenCats.has(g.type.category),
                )
                .map((g) => {
                  const color = colorForType(g.type);
                  const isChiller = g.type.category === "chiller";
                  return (
                    <group key={g.type.key}>
                      <InstancedEquipment
                        typeKey={g.type.key}
                        w={g.type.w}
                        d={g.type.d}
                        h={g.type.h}
                        color={color}
                        highlight={HOVER_HIGHLIGHT}
                        instances={g.instances}
                        hoveredIndex={
                          hover?.typeKey === g.type.key ? hover.index : null
                        }
                        emissiveIntensity={isChiller ? 0.55 : 0.22}
                        onHover={handleHover}
                      />
                      {/* 冰水機清楚標示（每型別一枚浮動標籤） */}
                      {isChiller && g.instances.length > 0 && (
                        <Html
                          position={[
                            g.instances[0].x + g.type.w / 2,
                            g.type.h + 1.6,
                            g.instances[0].y + g.type.d / 2,
                          ]}
                          center
                          zIndexRange={[10, 0]}
                        >
                          <div style={chillerLabelStyle}>
                            {g.type.name} ×{g.type.count}
                          </div>
                        </Html>
                      )}
                    </group>
                  );
                })}
            </group>
          );
        })}
      </Canvas>

      {/* 控制列（HTML overlay） */}
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-x-3 gap-y-2 bg-gradient-to-b from-[#0b0f16]/90 to-transparent px-3 pb-4 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("studio3d.controls.zones")}
        </span>
        {ZONES.map((z) => (
          <button
            key={z}
            type="button"
            className={pill(!hiddenZones.has(z))}
            onClick={() => toggleZone(z)}
          >
            {t(`studio3d.zone.${z}`)}
          </button>
        ))}
        <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("studio3d.controls.categories")}
        </span>
        {presentCats.map((c) => (
          <button
            key={c}
            type="button"
            className={pill(!hiddenCats.has(c))}
            onClick={() => toggleCat(c)}
          >
            {t(`studio3d.cat.${c}`)}
          </button>
        ))}
        <span className="mx-2 hidden h-4 w-px bg-slate-700 sm:inline-block" />
        <button
          type="button"
          className={pill(autoRotate)}
          onClick={() => setAutoRotate((v) => !v)}
        >
          {t("studio3d.controls.autoRotate")}
        </button>
        <button
          type="button"
          className={pill(false)}
          onClick={() => setResetSignal((n) => n + 1)}
        >
          {t("studio3d.controls.resetView")}
        </button>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t("studio3d.controls.density")}
        </span>
        <button
          type="button"
          className={pill(density === "full")}
          onClick={() => setDensity("full")}
        >
          {t("studio3d.density.full")}
        </button>
        <button
          type="button"
          className={pill(density === "simple")}
          onClick={() => setDensity("simple")}
        >
          {t("studio3d.density.simple")}
        </button>
      </div>

      {/* 資訊角卡 */}
      <div className="absolute bottom-3 left-3 rounded-lg border border-slate-800 bg-[#0b1220]/85 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300/80">
          {t("studio3d.info.title")}
        </div>
        <div className="mb-1 max-w-[220px] truncate text-slate-400">
          {t("studio3d.info.config")}: {model.source.configName}
        </div>
        {infoRows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-slate-500">{k}</span>
            <span className="font-mono text-slate-200">{v}</span>
          </div>
        ))}
      </div>

      {/* Hover 浮動資訊卡 */}
      {hover && hoverType && (
        <div
          className="pointer-events-none absolute z-20 max-w-[230px] rounded-lg border border-cyan-400/40 bg-[#0b1220]/92 px-3 py-2 text-[11px] text-slate-200 shadow-[0_0_18px_rgba(34,211,238,0.25)] backdrop-blur"
          style={{
            left: Math.max(8, hover.x + 14),
            top: Math.max(8, hover.y - 12),
          }}
        >
          <div className="mb-0.5 font-semibold text-cyan-200">
            {hoverType.name}
          </div>
          <div className="text-slate-400">
            {t(`studio3d.cat.${hoverType.category}`)}
            {hoverType.nodeType
              ? ` · ${t("studio3d.hover.nodeType")}: ${hoverType.nodeType}`
              : ""}
          </div>
          {hoverType.vendor && (
            <div>
              {t("studio3d.hover.vendor")}: {hoverType.vendor}
            </div>
          )}
          {hoverType.capacityKw != null && hoverType.count > 0 && (
            <div>
              {t("studio3d.hover.capacity")}:{" "}
              {(hoverType.capacityKw / hoverType.count).toFixed(1)} kW
            </div>
          )}
          <div>
            {t("studio3d.hover.count")}: {hoverType.count} ·{" "}
            {t("studio3d.hover.unit")} #{hover.index + 1}
          </div>
        </div>
      )}
    </motion.div>
  );
}
