export default {
  // ── 章節導覽 ──────────────────────────────────────────────
  "docs.nav.toc": "目錄",
  "docs.nav.aria": "章節導覽",
  "docs.nav.overview": "模型概覽",
  "docs.nav.dcTypes": "四種資料中心類型",
  "docs.nav.cooling": "冷卻鏈",
  "docs.nav.power": "配電鏈",
  "docs.nav.redundancy": "冗餘語彙",
  "docs.nav.paramLayers": "參數三層架構",
  "docs.nav.sources": "資料來源",
  "docs.nav.manual": "操作說明書",
  "docs.nav.citation": "引用",

  // ── 共用連結 ──────────────────────────────────────────────
  "docs.common.goParameters": "前往參數管理",
  "docs.common.goAlgorithms": "前往算法管理",
  "docs.common.goGenerator": "前往配置產生器",
  "docs.common.goCatalog": "前往設備型錄",
  "docs.common.viewCatalog": "檢視型錄",

  // ── Hero ──────────────────────────────────────────────────
  "docs.hero.title": "模型說明",
  "docs.hero.subtitle":
    "DCGen（Data Center configuration Generator）由 University of Chicago 與 Argonne National Laboratory 提出：給定 IT 需求，自動推導冷卻與配電基礎設施的空間、功率與設備清單。本平台為其 Web 資料庫實作。",
  "docs.hero.stat.algorithms.suffix": "條",
  "docs.hero.stat.algorithms.label": "算法",
  "docs.hero.stat.equipment.suffix": "類",
  "docs.hero.stat.equipment.label": "設備",
  "docs.hero.stat.dcTypes.suffix": "類",
  "docs.hero.stat.dcTypes.label": "資料中心",

  // ── 模型概覽 ──────────────────────────────────────────────
  "docs.overview.title": "模型概覽",
  "docs.overview.bodyPre": "DCGen 是一套",
  "docs.overview.bodyEm": "模型驅動的資料中心配置產生器",
  "docs.overview.bodyPost":
    "：以 IT 需求為起點，先由 IT 模型（式 7–15）推導機架分佈與功率密度，再沿冷卻鏈（式 9–13）完成冷卻選型、沿配電鏈（式 14–19）完成配電與冗餘規劃，最終以式 17c／19c 推導 Gray space 面積，輸出完整的空間、功率與設備清單（BOM）。",
  "docs.overview.inputs.title": "輸入",
  "docs.overview.inputs.rackOrPower": "機架數或功率目標",
  "docs.overview.inputs.dcType": "DC 類型（四種）",
  "docs.overview.inputs.year": "年份 2024 / 2027 / 2029",
  "docs.overview.inputs.redundancy": "冗餘模式",
  "docs.overview.inputs.margin": "安全餘裕",
  "docs.overview.inputs.objective": "優化目標",
  "docs.overview.outputs.title": "輸出",
  "docs.overview.outputs.rackDist": "IT 機架分佈",
  "docs.overview.outputs.powerDensity": "功率密度",
  "docs.overview.outputs.whiteGray": "White / Gray space",
  "docs.overview.outputs.bom": "設備 BOM",
  "docs.overview.flow.itDemand.label": "IT 需求",
  "docs.overview.flow.itDemand.sub": "機架數 / 功率目標",
  "docs.overview.flow.itPower.label": "IT 功率·空間",
  "docs.overview.flow.itPower.sub": "式 1–8",
  "docs.overview.flow.cooling.label": "冷卻系統",
  "docs.overview.flow.cooling.sub": "式 9–13",
  "docs.overview.flow.power.label": "配電系統",
  "docs.overview.flow.power.sub": "式 14–19",
  "docs.overview.flow.bom.label": "配置 BOM",
  "docs.overview.flow.bom.sub": "White / Gray space",
  "docs.overview.tip.body":
    "本平台所有步驟的參數皆可於「參數管理」調整，算法可於「算法管理」檢視與擴充。",

  // ── 四種資料中心類型 ──────────────────────────────────────
  "docs.dcTypes.title": "四種資料中心類型",
  "docs.dcTypes.nodesLabel": "節點型別組成",
  "docs.dcTypes.refLabel": "Reference：",
  "docs.dcTypes.alt": "{name}資料中心概念圖",
  "docs.dcTypes.aiTraining.name": "AI 訓練",
  "docs.dcTypes.aiTraining.desc":
    "GPU 訓練叢集以同步式負載長時間滿載運轉，功率密度極高，液冷為必然選項。Canonical 配置隨世代演進：2024／2027／2029 三個年份的機架 TDP 由約 40 kW 走向 120 kW 以上。",
  "docs.dcTypes.aiTraining.nodeGpu": "全部機架",
  "docs.dcTypes.aiInference.name": "AI 推論",
  "docs.dcTypes.aiInference.desc":
    "推論負載密度較低、請求驅動且分散部署，機架功率遠低於訓練叢集，氣冷與液冷混合即可滿足，重視彈性擴充與 PUE。",
  "docs.dcTypes.aiInference.nodeCpuGpu": "主力",
  "docs.dcTypes.aiInference.nodeCpu": "前處理／調度",
  "docs.dcTypes.mixed.name": "混合訓練／推論",
  "docs.dcTypes.mixed.desc":
    "同一園區混合部署訓練與推論機房。模型依使用者設定的訓練／推論比例拆分 IT 負載，兩側各自推導冷卻與配電後再合併為整體配置。",
  "docs.dcTypes.mixed.nodeGpu": "訓練側",
  "docs.dcTypes.mixed.nodeCpuGpu": "推論側",
  "docs.dcTypes.mixed.nodeCpu": "通用",
  "docs.dcTypes.cloud.name": "雲端",
  "docs.dcTypes.cloud.desc":
    "通用運算＋儲存的傳統雲端機房。儲存容量以三式（式 1–3）估算，IOPS 與 TFLOPS 間以 404 換算，儲存功率占 IT 功率比例（預設 4.2%）即由此類配置校準而來。",
  "docs.dcTypes.cloud.nodeCpu": "運算",
  "docs.dcTypes.cloud.nodeStorage": "儲存",

  // ── 冷卻鏈 ────────────────────────────────────────────────
  "docs.cooling.title": "冷卻鏈",
  "docs.cooling.body":
    "IT 負載的每一分瓦特最終都成為熱。DCGen 依熱負載沿「機架 → CDU → 乾冷卻器／冷卻水塔 → 冰水機」的迴路逐級選型（式 9–13），並將冷卻系統自身的耗電回授至配電鏈。",
  "docs.cooling.svgLabel": "冷卻迴路示意：IT 機架 → CDU → 乾冷卻器／冷卻水塔 → 冰水機",
  "docs.cooling.dry.title": "Dry cooling",
  "docs.cooling.dry.desc":
    "以乾冷卻器將冷卻液熱量直接排至大氣，不耗水、維護簡單，適合缺水或水價高的場址；對應型錄 Dry coolers 類（Kelvion、LU-VE 等）。",
  "docs.cooling.evap.title": "Evaporative cooling",
  "docs.cooling.evap.desc":
    "以冷卻水塔蒸發散熱，效率高、可負荷更大熱量，但需耗水並處理水質；對應型錄 Cooling towers 類（Evapco、BAC、SPX Marley）。",
  "docs.cooling.cdu.title": "液冷 CDU",
  "docs.cooling.cdu.desc":
    "列級／機櫃級 CDU 將冷卻液分配至高密度機架。型錄收錄台達 GoCool 系列 150–3000 kW、CoolIT CHx2000、Motivair MCDU-70 等市售機型。",

  // ── 配電鏈 ────────────────────────────────────────────────
  "docs.power.title": "配電鏈",
  "docs.power.body":
    "配電鏈自市電端逐級向下：MSB → 備援發電機 → UPS → PDU → 機架。DCGen 以每一級的額定容量與冗餘模式（式 14–19）選定設備台數，確保任一層級都能承載 IT 與冷卻的合計負載。",
  "docs.power.svgLabel": "配電鏈示意：市電 → MSB → 備援發電機 → UPS → PDU → 機架",
  "docs.power.th.level": "層級",
  "docs.power.th.role": "角色",
  "docs.power.th.examples": "型錄收錄示例",
  "docs.power.examplesSep": "、",
  "docs.power.msb.role": "主配電盤",
  "docs.power.msb.ex1": "Schneider BlokSeT",
  "docs.power.msb.ex2": "ABB MNS",
  "docs.power.ups.role": "不斷電系統",
  "docs.power.ups.ex1": "台達 Modulon DPH 500–2000 kVA（效率 96.5–97.5%）",
  "docs.power.ups.ex2": "Schneider Galaxy VL",
  "docs.power.ups.ex3": "Eaton 9395P",
  "docs.power.ups.ex4": "Huawei UPS5000-H",
  "docs.power.pdu.role": "機架配電",
  "docs.power.pdu.ex1": "台達 rPDU ViLink",
  "docs.power.pdu.ex2": "APC NetShelter",
  "docs.power.generator.role": "備援發電機",
  "docs.power.generator.ex1": "Caterpillar",
  "docs.power.generator.ex2": "Cummins",
  "docs.power.generator.ex3": "Kohler",
  "docs.power.generator.ex4": "mtu",
  "docs.power.loss.title": "轉換損耗的計入方式（式 18–19）：",
  "docs.power.loss.body":
    "各級設備效率連乘後得到鏈路總效率，與 IT 功率的差額即為轉換損耗；此損耗同樣轉化為熱，會回授至冷卻鏈的熱負載計算，形成 IT → 配電 → 冷卻的耦合迭代。",

  // ── 冗餘語彙 ──────────────────────────────────────────────
  "docs.redundancy.title": "冗餘語彙",
  "docs.redundancy.imgAlt": "冗餘語彙圖解：N / N+1 / N+2 / 2N / xN-y 機組配置",
  "docs.redundancy.defN": "恰好滿足需求的台數，無備援。",
  "docs.redundancy.defNPlus1": "需求台數＋1 台備援。",
  "docs.redundancy.defNPlus2": "需求台數＋2 台備援。",
  "docs.redundancy.def2N": "完整雙套系統（A/B 路），任一路可獨立承載全部負載。",
  "docs.redundancy.defXnY": "x 台分攤負載，y 台即足夠；有效容量 = y/x × 額定容量（式 15）。",
  "docs.redundancy.calc.title": "冗餘計算器",
  "docs.redundancy.calc.subtitle": "— 算法試算面板展示版",
  "docs.redundancy.calc.demand": "需求容量（kW）",
  "docs.redundancy.calc.demandAria": "需求容量 kW",
  "docs.redundancy.calc.unit": "單機容量（kW）",
  "docs.redundancy.calc.unitAria": "單機容量 kW",
  "docs.redundancy.calc.ariaX": "xN-y 之 x（分攤台數）",
  "docs.redundancy.calc.ariaY": "xN-y 之 y（足夠台數）",
  "docs.redundancy.calc.needN": "需求台數 N",
  "docs.redundancy.calc.needRaw": "需求台數（未取整）",
  "docs.redundancy.calc.installed": "安裝台數",
  "docs.redundancy.calc.effective": "有效容量",
  "docs.redundancy.calc.units": "台",
  "docs.redundancy.calc.errorXnY": "請輸入有效的需求容量、單機容量，且 xN-y 需滿足 x > y ≥ 1。",
  "docs.redundancy.calc.errorGeneric": "請輸入有效的需求容量與單機容量（皆須大於 0）。",

  // ── 參數三層架構 ──────────────────────────────────────────
  "docs.paramLayers.title": "參數三層架構",
  "docs.paramLayers.input.title": "使用者輸入",
  "docs.paramLayers.input.desc":
    "產生器表單：DC 類型、規模（機架數／功率目標）、年份、冗餘模式、安全餘裕、優化目標。",
  "docs.paramLayers.input.b1": "AI 訓練 / 推論 / 混合 / 雲端",
  "docs.paramLayers.input.b2": "2024 / 2027 / 2029",
  "docs.paramLayers.input.b3": "N / N+1 / N+2 / 2N / xN-y",
  "docs.paramLayers.internal.title": "內部參數",
  "docs.paramLayers.internal.desc":
    "參數管理中的全域常數：安全餘裕、儲存功率占比 4.2%、IOPS 換算 404、走道比例 2/3、機櫃高度 42U 等。",
  "docs.paramLayers.internal.b1": "安全餘裕（safety margin）",
  "docs.paramLayers.internal.b2": "4.2% · 404 · 2/3 · 42U",
  "docs.paramLayers.internal.b3": "全部入庫、可調可擴充",
  "docs.paramLayers.output.title": "輸出",
  "docs.paramLayers.output.desc":
    "演算結果：空間與功率指標、White / Gray space 面積、分層設備 BOM；每次演算皆記錄輸入與參數快照。",
  "docs.paramLayers.output.b1": "IT 機架分佈 / 功率密度",
  "docs.paramLayers.output.b2": "White / Gray space",
  "docs.paramLayers.output.b3": "設備 BOM（對應設備型錄）",
  "docs.paramLayers.notePre": "三層全部入庫：使用者輸入、當下生效的內部參數，以及演算輸出會一併保存為",
  "docs.paramLayers.noteEm": "情境快照（scenario snapshot）",
  "docs.paramLayers.notePost": "，確保任何一次產生的配置都可回溯、可重現。算法本體則可於「算法管理」檢視公式並試算。",

  // ── 資料來源 ──────────────────────────────────────────────
  "docs.sources.title": "資料來源",
  "docs.sources.disclaimerPre":
    "設備規格取自各製造商公開型錄、官方規格頁與新聞稿，每筆資料附來源 URL；查無資料之欄位標記 ",
  "docs.sources.disclaimerPost":
    "，不做推測填值。規格僅供學術研究與模型演示，實際工程設計請以原廠最新公告為準。",
  "docs.sources.vendorsLabel": "收錄廠商",
  "docs.sources.vendorDelta": "台達電子 Delta",
  "docs.sources.deltaBadge": "重點收錄",
  "docs.sources.delta.title": "台達電子 InfraSuite 產品專段",
  "docs.sources.delta.bodyPre":
    "本平台依需求重點收錄台達電子 InfraSuite 產品線：Modulon DPH／DPH Gen3／Ultron 系列 UPS 11 款、GoCool 液冷 CDU 11 款（含 L2L／L2A、In-Rack）、rPDU ViLink 與 InfraSuite PDC 配電 5 款。規格抄錄自 ",
  "docs.sources.delta.bodyPost": " 官方規格頁與型錄 PDF，僅供研究用途。",
  "docs.sources.delta.p1.spec": "SiC 架構，效率達 97.5%",
  "docs.sources.delta.p2.spec": "三相 UPS 系列",
  "docs.sources.delta.p3.spec": "液對液 660 kW–3 MW",
  "docs.sources.delta.p4.spec": "機櫃級液冷分配",
  "docs.sources.delta.p5.spec": "智慧型機架 PDU",

  // ── 操作說明書 ────────────────────────────────────────────
  "docs.manual.title": "操作說明書",
  "docs.manual.subtitle": "下載三語版平台操作說明書（docx 格式），內容涵蓋各功能頁的操作流程與欄位說明。",
  "docs.manual.zhTW.badge": "繁體中文",
  "docs.manual.zhTW.desc": "平台完整操作說明（繁體中文版）：配置產生器、資料庫管理、參數管理與算法管理。",
  "docs.manual.zhCN.badge": "简体中文",
  "docs.manual.zhCN.desc": "平台完整操作說明（簡體中文版）：配置產生器、資料庫管理、參數管理與算法管理。",
  "docs.manual.en.badge": "English",
  "docs.manual.en.desc": "平台完整操作說明（英文版）：配置產生器、資料庫管理、參數管理與算法管理。",
  "docs.manual.download": "下載",

  // ── 引用 ──────────────────────────────────────────────────
  "docs.citation.title": "引用",
  "docs.citation.copy": "複製 BibTeX",
  "docs.citation.copied": "已複製",
  "docs.citation.linkArxiv": "arXiv:2604.09616 論文",
  "docs.citation.linkGithub": "GitHub REPO（WedanEmmanuel/DCGen）",
  "docs.citation.linkDelta": "台達電子官方網站",
} satisfies Record<string, string>;
