/**
 * 三語字典合併入口。每個頁面組各自維護 en / zh-CN / zh-TW 三個模組（避免協作衝突），
 * 在此統一合併。新增頁面組時：建立 <group>/{en,zh-CN,zh-TW}.ts 並加入下方 import 與合併。
 */
import coreEn from "./core/en";
import coreZhCN from "./core/zh-CN";
import coreZhTW from "./core/zh-TW";
import homeEn from "./home/en";
import homeZhCN from "./home/zh-CN";
import homeZhTW from "./home/zh-TW";
import generatorEn from "./generator/en";
import generatorZhCN from "./generator/zh-CN";
import generatorZhTW from "./generator/zh-TW";
import catalogEn from "./catalog/en";
import catalogZhCN from "./catalog/zh-CN";
import catalogZhTW from "./catalog/zh-TW";
import paramsEn from "./params/en";
import paramsZhCN from "./params/zh-CN";
import paramsZhTW from "./params/zh-TW";
import docsEn from "./docs/en";
import docsZhCN from "./docs/zh-CN";
import docsZhTW from "./docs/zh-TW";
import studioEn from "./studio/en";
import studioZhCN from "./studio/zh-CN";
import studioZhTW from "./studio/zh-TW";
import diagramsEn from "./diagrams/en";
import diagramsZhCN from "./diagrams/zh-CN";
import diagramsZhTW from "./diagrams/zh-TW";
import studio3dEn from "./studio3d/en";
import studio3dZhCN from "./studio3d/zh-CN";
import studio3dZhTW from "./studio3d/zh-TW";

export type Lang = "en" | "zh-CN" | "zh-TW";

export const LANGS: { value: Lang; label: string; short: string }[] = [
  { value: "zh-TW", label: "繁體中文", short: "繁" },
  { value: "zh-CN", label: "简体中文", short: "简" },
  { value: "en", label: "English", short: "EN" },
];

export const dictionaries: Record<Lang, Record<string, string>> = {
  en: {
    ...coreEn,
    ...homeEn,
    ...generatorEn,
    ...catalogEn,
    ...paramsEn,
    ...docsEn,
    ...studioEn,
    ...diagramsEn,
    ...studio3dEn,
  },
  "zh-CN": {
    ...coreZhCN,
    ...homeZhCN,
    ...generatorZhCN,
    ...catalogZhCN,
    ...paramsZhCN,
    ...docsZhCN,
    ...studioZhCN,
    ...diagramsZhCN,
    ...studio3dZhCN,
  },
  "zh-TW": {
    ...coreZhTW,
    ...homeZhTW,
    ...generatorZhTW,
    ...catalogZhTW,
    ...paramsZhTW,
    ...docsZhTW,
    ...studioZhTW,
    ...diagramsZhTW,
    ...studio3dZhTW,
  },
};
