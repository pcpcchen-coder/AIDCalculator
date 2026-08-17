# 設備型錄資料來源

種子資料共 **96 項設備、23 家廠商**（2026-08-17 蒐集），逐筆於 `equipment.sourceUrl` 附來源。原則：**數值必須來自原廠型錄/官方文件；查不到的欄位留空（NULL）不編造**；推算值於 notes 明確標記。

## 三大來源

### 1. DCGen REPO 原廠型錄（57 項）
[github.com/WedanEmmanuel/DCGen](https://github.com/WedanEmmanuel/DCGen) `Non_IT_hardware_config/`：Vertiv（CDU/UPS/PDU/MSB/冰水機/乾冷卻器）、Evapco 冷卻水塔、Caterpillar/Wärtsilä/Meccagen 發電機。IT 配置 31 筆（Canonical 4 類×2024/2027/2029＋Reference 系統 xAI COLOSSUS、Frontier、Aurora、El Capitan、DGX SuperPOD、NVIDIA NVL576、Fugaku、Microsoft GreenSKU、Azure Stack HCI、Dell R660xs、Google GDC、HPE POD D44、Lenovo SR670、Dell XE7745、IBM Gen AI、Supermicro 推論機架、ChatGPT 等）同樣取自 REPO。

### 2. 台達電子 Delta Electronics（20 項，重點收錄）
來源：deltapowersolutions.com 官方規格頁、deltaww.com 新聞稿（InfraSuite 產品線）。

| 類別 | 產品 |
|---|---|
| UPS（9） | Modulon DPH-500K/600K（96.5%）、DPH Gen3 625K/1250K/2000K（SiC，97.5%）、Ultron DPS-500K/1200K、Ultron DPM G2-1250K（97.3%）、Ultron HPH-120K |
| CDU（8） | GoCool-660/1000/1200/1500/3000（L2L，660kW–3MW；1500 通過 NVIDIA GB200 NVL72 認證）、GoCool-150（L2A 115kW，官方功耗 18kW）、In-Rack L2L 4U-135/6U-200 |
| PDU（3） | rPDU ViLink VM-Y32A42P / VM-Y16A42P（容量為 √3×V×A 推算，已標記）、InfraSuite PDC-125（無官方尺寸） |

台達無對應產品之分類（冰水機、乾冷卻器、冷卻水塔、備援發電機、MSB）已於研究紀錄明確註記「無」，未以他牌冒充实。
另：L2L GoCool 系列官方未公告整機功耗（僅 L2A GoCool-150 有）；此情況功率效率以缺值處理，選型時排於有完整資料者之後，前台以「—」呈現。

### 3. 其他國際大廠（19 項）
CoolIT CHx2000、Motivair MCDU-70、STULZ CyberCool CMU（CDU）；Carrier AquaEdge 19DV、YORK YK（冰水機）；Kelvion、LU-VE（乾冷卻器）；BAC S3000、SPX Marley NC8400（冷卻水塔）；APC NetShelter APDU10450SW/10350ME（rPDU）；Schneider Galaxy VL、Eaton 9395P、Huawei UPS5000-H（UPS）；Schneider BlokSeT、ABB MNS 3.0（開關盤）；Cummins C2500D5A、Kohler KD2500、mtu 20V4000 DS2800（發電機）。

## 規格條件對齊（資料品質決策）

為避免不同測試條件的規格扭曲自動選型，種子時做了以下處理（皆記錄於 notes）：

1. **Kelvion / LU-VE 乾冷卻器**：容量採與型錄同條件之保守額定（乙二醇 40→35°C、進風 25°C：121.3 / 58.6 kW），60→40°C 高溫差值（322.1 / 210.7 kW）保留於 notes。
2. **Schneider Galaxy VL**：效率採雙轉換 0.97（eConversion/ECO 99% 僅記於 notes），與他廠 online 效率同基準。
3. **BlokSeT / ABB MNS**：kW 容量為 400V 三相換算參考值（非原廠標示）；效率原廠未列 → 留空。
4. **機架級 rPDU（台達 ViLink、APC NetShelter）與小型配電櫃**：非 DCGen pod 級設備，`engineEligible=false`（型錄可見、引擎不自動選用，可手動啟用）；效率無官方值 → 留空。
5. **YORK YK / Kohler KD2500 / BAC / SPX 等**：官方未公告尺寸或功耗 → 相應欄位留空；不影響計數類計算但不被空間/功率效率選型採用。

## 更新資料庫

使用者可於「資料庫管理」頁新增/編輯/刪除任何設備或 IT 配置（isCustom 標記），或調整 `engineEligible`。建議新增時同樣附上來源 URL 以維持可追溯性。
