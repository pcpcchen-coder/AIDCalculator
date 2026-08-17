# DCGen 模型與方程式對照

本平台演算引擎（`api/engine/dcgen.ts`）忠實實作 DCGen 1.1 技術報告（arXiv:2604.09616）§4 之模型。以下為對照表；驗證數據見 docs/VERIFICATION.md。

## 輸入（使用者）

| 輸入 | 說明 |
|---|---|
| 資料中心類型 | AI training / AI inference / Mixed AI training and inference / Cloud |
| 目標規模 | 機架總數（rack_count）或 目標功率字串（power_capacity，如 "100MW"、"1GW"） |
| 模型別 / 年份 | Canonical（2024/2027/2029/All）或 Reference（指定參考系統） |
| 散熱模式 | Dry cooling（乾冷卻器）/ Evaporative cooling（冷卻水塔） |
| 優化目標 | Space（空間效率 kW/m² 優先）/ Power（功率效率優先），可並選 |
| 冗餘 | 七槽位：散熱端、冰水機、CDU、PDU、UPS、MSB、備援發電機；語彙 N、N+r、xN/y（預設 N+1/N+1/N+1/N+1/2N/2N/2N） |
| 安全餘裕 sm | 設備超配比例（預設 0.2） |
| 架構 | rack_per_row（預設 10）、rows_per_pod（預設 2） |

## IT 模型（式 1–15）

| 式 | 名稱 | 引擎實作 |
|---|---|---|
| (1) | 儲存機架估算（容量法）：⌈TB/(51.2×RU)⌉ | 算法註冊表 `storage_from_capacity`（試算面板可求值） |
| (2)(5) | 儲存機架估算（功率占比法，AI 4.2% / Cloud 18%） | `storage_from_power_proportion` |
| (3)(4)(6) | 儲存機架估算（IOPS 法，404 IOPS/TFLOPS） | `storage_from_iops` |
| (7a)(15a) | 機架分佈縮放：N_i = round(N₀_i/ΣN₀ × N_target)，四捨五入誤差於最後型別修正 | `computeItResult` |
| (8) | IT 峰值功率：P = Σ N_i × TDP_i（HPC 機架乘 2/3、統一 42U 正規化）→ MW | `computeItResult` |
| (9)(12) | 功率密度 kW/m² | `computeItResult` |
| (10)(13) | White space = N_rack × A_rack = P/密度 | `computeItResult` |
| (11) | 機架規格正規化（RU_rack/RU₀ × TDP₀；HPC ×2/3） | `computeItResult` |
| (14) | 功率目標反推機架數：N = round(P_kw/(密度₀×A)) | `computeItResult`（power_capacity 模式） |

## 架構：LPT pod 裝箱（§4.6.1）

`arrangeRacksPerPod`：rack_per_pod = rows_per_pod × rack_per_row；各型別機架以單架功率降序，用最長加工時間（LPT）啟發式装入 R = ⌈N/rack_per_pod⌉ 個 pod，回傳 pod 數與最大 pod 功率（列級設備 CDU/PDU 計數之依據）。

## 冷卻與配電設備（式 16–19）

| 式 | 名稱 | 引擎實作 |
|---|---|---|
| (16a)(16b) | N+r 列級設備：perPod = ⌈(1+sm)×P_pod/Cap⌉+r；total = perPod × pods | `designHardwareIt`（row-level：CDU、PDU） |
| (17a) | N+r 中心級：N = ⌈(1+sm)×P_DC/Cap⌉+r | `designHardwareIt`（DC-level） |
| (17b) | N+r 廠務階段：UPS/MSB/Gen 支撐冷卻功耗 | `designHardwareFacility` |
| (17c)(19c) | Gray space = Σ(1+λ_l)(N_l,IT+N_l,Fac)×A_l（室內/室外分攤） | `computeNonIt` summary |
| (18a) | xN/y 有效容量 P_limit = y/x × Cap | `parseRedundancy` + 各設計函式 |
| (18b)(18c)(19a)(19b) | xN/y 計數：N = x×⌈⌈(1+sm)×P/P_limit⌉/x⌉ | `designHardwareIt` / `designHardwareFacility` |

- **選型**：同一類別所有可選設備計算後，依優化目標取最大（Space → (空間效率, 功率效率)；Power → (功率效率, 空間效率)；缺值排末）。
- **冷卻類**（有 PeakPowerConsumption）：功率需求 = 台數×單機功耗（xN/y 再乘 y/x）；功率效率 = P_DC/需求。
- **配電類**（有 Efficiency）：轉換損耗 = (1−η)×台數×可交付容量/(η) → MW。
- **冷卻 Summary**：冷卻功耗合計（MW）；**配電 Summary**：轉換損耗合計（MW）；空間皆分室內（冰水機/CDU/PDU/UPS/MSB）與室外（乾冷卻器/冷卻水塔/發電機）。

## 全域參數（parameters 表，對應論文內部參數）

safety_margin(0.2)、rack_per_row(10)、rows_per_pod(2)、conventional_rack_size(42)、hpc_to_cloud_rack_ratio(2/3)、storage_power_proportion_ai(0.042)、storage_power_proportion_cloud(0.18)、storage_node_tdp_ai_kw(0.708)、storage_node_tdp_cloud_kw(0.438)、storage_node_capacity_tb(51.2)、storage_node_ru(1)、storage_disk_iops(900000)、storage_disks_per_node(8)、iops_per_tflops(404)。

## 輸出（GenerateResult）

每個 IT 配置一份結果：`it`（各 nodeType 機架數與峰值 MW、總機架數、總 MW、功率密度、White space）、`nonIt[]`（每個優化目標：冷卻各類中選設備（台數、容量 MW、功耗 MW、空間、效率）＋配電 IT/廠務階段中選設備＋Summary）、`meta`（pods、最大 pod 功率）、外加 `parameterSnapshot`。
