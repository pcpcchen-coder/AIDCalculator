import type { LayoutModel } from '@contracts/layout';
import { useI18n } from '@/i18n';
import { fmtInt } from '@/components/studio/editorUtils';

interface InfoBarProps {
  model: LayoutModel;
}

/** 頂部資訊條：來源 config、criterion 與關鍵 metrics */
export default function InfoBar({ model }: InfoBarProps) {
  const { t } = useI18n();
  const m = model.metrics;
  const items: { label: string; value: string; accent?: boolean }[] = [
    { label: t('studio.info.config'), value: model.source.configName, accent: true },
    { label: t('studio.info.criterion'), value: model.source.criterion },
    { label: t('studio.info.generation'), value: model.source.generation },
    { label: t('studio.info.itPower'), value: `${fmtInt(m.itPowerMw)} MW` },
    { label: t('studio.info.density'), value: `${fmtInt(m.powerDensityKwM2)} kW/m²` },
    { label: t('studio.info.white'), value: `${fmtInt(m.whiteSpaceM2)} m²` },
    { label: t('studio.info.grayIndoor'), value: `${fmtInt(m.grayIndoorM2)} m²` },
    { label: t('studio.info.grayOutdoor'), value: `${fmtInt(m.grayOutdoorM2)} m²` },
    { label: t('studio.info.cooling'), value: `${fmtInt(m.coolingPowerMw)} MW` },
  ];
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-baseline gap-2 rounded-lg border border-line bg-bg-1 px-3 py-1.5"
        >
          <span className="text-[11px] uppercase tracking-wide text-text-2">{it.label}</span>
          <span
            className={`font-mono text-sm ${it.accent ? 'text-accent' : 'text-text-0'}`}
          >
            {it.value}
          </span>
        </div>
      ))}
    </div>
  );
}
