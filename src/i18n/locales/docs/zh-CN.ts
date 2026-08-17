export default {
  // ── 章节导航 ──────────────────────────────────────────────
  "docs.nav.toc": "目录",
  "docs.nav.aria": "章节导航",
  "docs.nav.overview": "模型概览",
  "docs.nav.dcTypes": "四种数据中心类型",
  "docs.nav.cooling": "冷却链",
  "docs.nav.power": "配电链",
  "docs.nav.redundancy": "冗余术语",
  "docs.nav.paramLayers": "参数三层架构",
  "docs.nav.sources": "数据来源",
  "docs.nav.manual": "操作说明书",
  "docs.nav.citation": "引用",

  // ── 共用链接 ──────────────────────────────────────────────
  "docs.common.goParameters": "前往参数管理",
  "docs.common.goAlgorithms": "前往算法管理",
  "docs.common.goGenerator": "前往配置生成器",
  "docs.common.goCatalog": "前往设备目录",
  "docs.common.viewCatalog": "查看产品目录",

  // ── Hero ──────────────────────────────────────────────────
  "docs.hero.title": "模型说明",
  "docs.hero.subtitle":
    "DCGen（Data Center configuration Generator）由 University of Chicago 与 Argonne National Laboratory 提出：给定 IT 需求，自动推导冷却与配电基础设施的空间、功率与设备清单。本平台为其 Web 数据库实现。",
  "docs.hero.stat.algorithms.suffix": "条",
  "docs.hero.stat.algorithms.label": "算法",
  "docs.hero.stat.equipment.suffix": "类",
  "docs.hero.stat.equipment.label": "设备",
  "docs.hero.stat.dcTypes.suffix": "类",
  "docs.hero.stat.dcTypes.label": "数据中心",

  // ── 模型概览 ──────────────────────────────────────────────
  "docs.overview.title": "模型概览",
  "docs.overview.bodyPre": "DCGen 是一套",
  "docs.overview.bodyEm": "模型驱动的数据中心配置生成器",
  "docs.overview.bodyPost":
    "：以 IT 需求为起点，先由 IT 模型（式 7–15）推导机架分布与功率密度，再沿冷却链（式 9–13）完成冷却选型、沿配电链（式 14–19）完成配电与冗余规划，最终以式 17c／19c 推导 Gray space 面积，输出完整的空间、功率与设备清单（BOM）。",
  "docs.overview.inputs.title": "输入",
  "docs.overview.inputs.rackOrPower": "机架数或功率目标",
  "docs.overview.inputs.dcType": "DC 类型（四种）",
  "docs.overview.inputs.year": "年份 2024 / 2027 / 2029",
  "docs.overview.inputs.redundancy": "冗余模式",
  "docs.overview.inputs.margin": "安全裕量",
  "docs.overview.inputs.objective": "优化目标",
  "docs.overview.outputs.title": "输出",
  "docs.overview.outputs.rackDist": "IT 机架分布",
  "docs.overview.outputs.powerDensity": "功率密度",
  "docs.overview.outputs.whiteGray": "White / Gray space",
  "docs.overview.outputs.bom": "设备 BOM",
  "docs.overview.flow.itDemand.label": "IT 需求",
  "docs.overview.flow.itDemand.sub": "机架数 / 功率目标",
  "docs.overview.flow.itPower.label": "IT 功率·空间",
  "docs.overview.flow.itPower.sub": "式 1–8",
  "docs.overview.flow.cooling.label": "冷却系统",
  "docs.overview.flow.cooling.sub": "式 9–13",
  "docs.overview.flow.power.label": "配电系统",
  "docs.overview.flow.power.sub": "式 14–19",
  "docs.overview.flow.bom.label": "配置 BOM",
  "docs.overview.flow.bom.sub": "White / Gray space",
  "docs.overview.tip.body":
    "本平台所有步骤的参数都可于“参数管理”调整，算法可于“算法管理”查看与扩展。",

  // ── 四种数据中心类型 ──────────────────────────────────────
  "docs.dcTypes.title": "四种数据中心类型",
  "docs.dcTypes.nodesLabel": "节点类型组成",
  "docs.dcTypes.refLabel": "Reference：",
  "docs.dcTypes.alt": "{name}数据中心概念图",
  "docs.dcTypes.aiTraining.name": "AI 训练",
  "docs.dcTypes.aiTraining.desc":
    "GPU 训练集群以同步式负载长时间满载运行，功率密度极高，液冷为必然选项。Canonical 配置随世代演进：2024／2027／2029 三个年份的机架 TDP 由约 40 kW 走向 120 kW 以上。",
  "docs.dcTypes.aiTraining.nodeGpu": "全部机架",
  "docs.dcTypes.aiInference.name": "AI 推理",
  "docs.dcTypes.aiInference.desc":
    "推理负载密度较低、请求驱动且分布式部署，机架功率远低于训练集群，风冷与液冷混合即可满足，重视弹性扩展与 PUE。",
  "docs.dcTypes.aiInference.nodeCpuGpu": "主力",
  "docs.dcTypes.aiInference.nodeCpu": "预处理／调度",
  "docs.dcTypes.mixed.name": "混合训练／推理",
  "docs.dcTypes.mixed.desc":
    "同一园区混合部署训练与推理机房。模型按用户设定的训练／推理比例拆分 IT 负载，两侧各自推导冷却与配电后再合并为整体配置。",
  "docs.dcTypes.mixed.nodeGpu": "训练侧",
  "docs.dcTypes.mixed.nodeCpuGpu": "推理侧",
  "docs.dcTypes.mixed.nodeCpu": "通用",
  "docs.dcTypes.cloud.name": "云计算",
  "docs.dcTypes.cloud.desc":
    "通用计算＋存储的传统云机房。存储容量以三式（式 1–3）估算，IOPS 与 TFLOPS 间以 404 换算，存储功率占 IT 功率比例（默认 4.2%）即由此类配置校准而来。",
  "docs.dcTypes.cloud.nodeCpu": "计算",
  "docs.dcTypes.cloud.nodeStorage": "存储",

  // ── 冷却链 ────────────────────────────────────────────────
  "docs.cooling.title": "冷却链",
  "docs.cooling.body":
    "IT 负载的每一分瓦特最终都成为热。DCGen 按热负载沿“机架 → CDU → 干式冷却器／冷却塔 → 冷水机组”的回路逐级选型（式 9–13），并将冷却系统自身的耗电反馈至配电链。",
  "docs.cooling.svgLabel": "冷却回路示意：IT 机架 → CDU → 干式冷却器／冷却塔 → 冷水机组",
  "docs.cooling.dry.title": "Dry cooling",
  "docs.cooling.dry.desc":
    "以干式冷却器将冷却液热量直接排至大气，不耗水、维护简单，适合缺水或水价高的场址；对应产品目录 Dry coolers 类（Kelvion、LU-VE 等）。",
  "docs.cooling.evap.title": "Evaporative cooling",
  "docs.cooling.evap.desc":
    "以冷却塔蒸发散热，效率高、可承担更大热量，但需耗水并处理水质；对应产品目录 Cooling towers 类（Evapco、BAC、SPX Marley）。",
  "docs.cooling.cdu.title": "液冷 CDU",
  "docs.cooling.cdu.desc":
    "行级／机柜级 CDU 将冷却液分配至高密度机架。产品目录收录台达 GoCool 系列 150–3000 kW、CoolIT CHx2000、Motivair MCDU-70 等市售机型。",

  // ── 配电链 ────────────────────────────────────────────────
  "docs.power.title": "配电链",
  "docs.power.body":
    "配电链自市电端逐级向下：MSB → 备用发电机 → UPS → PDU → 机架。DCGen 以每一级的额定容量与冗余模式（式 14–19）选定设备台数，确保任一层级都能承载 IT 与冷却的合计负载。",
  "docs.power.svgLabel": "配电链示意：市电 → MSB → 备用发电机 → UPS → PDU → 机架",
  "docs.power.th.level": "层级",
  "docs.power.th.role": "角色",
  "docs.power.th.examples": "产品目录收录示例",
  "docs.power.examplesSep": "、",
  "docs.power.msb.role": "主配电盘",
  "docs.power.msb.ex1": "Schneider BlokSeT",
  "docs.power.msb.ex2": "ABB MNS",
  "docs.power.ups.role": "不间断电源",
  "docs.power.ups.ex1": "台达 Modulon DPH 500–2000 kVA（效率 96.5–97.5%）",
  "docs.power.ups.ex2": "Schneider Galaxy VL",
  "docs.power.ups.ex3": "Eaton 9395P",
  "docs.power.ups.ex4": "Huawei UPS5000-H",
  "docs.power.pdu.role": "机架配电",
  "docs.power.pdu.ex1": "台达 rPDU ViLink",
  "docs.power.pdu.ex2": "APC NetShelter",
  "docs.power.generator.role": "备用发电机",
  "docs.power.generator.ex1": "Caterpillar",
  "docs.power.generator.ex2": "Cummins",
  "docs.power.generator.ex3": "Kohler",
  "docs.power.generator.ex4": "mtu",
  "docs.power.loss.title": "转换损耗的计算方式（式 18–19）：",
  "docs.power.loss.body":
    "各级设备效率连乘后得到链路总效率，与 IT 功率的差额即为转换损耗；此损耗同样转化为热，会反馈至冷却链的热负载计算，形成 IT → 配电 → 冷却的耦合迭代。",

  // ── 冗余术语 ──────────────────────────────────────────────
  "docs.redundancy.title": "冗余术语",
  "docs.redundancy.imgAlt": "冗余术语图解：N / N+1 / N+2 / 2N / xN-y 机组配置",
  "docs.redundancy.defN": "恰好满足需求的台数，无备份。",
  "docs.redundancy.defNPlus1": "需求台数＋1 台备份。",
  "docs.redundancy.defNPlus2": "需求台数＋2 台备份。",
  "docs.redundancy.def2N": "完整双套系统（A/B 路），任一路可独立承载全部负载。",
  "docs.redundancy.defXnY": "x 台分摊负载，y 台即足够；有效容量 = y/x × 额定容量（式 15）。",
  "docs.redundancy.calc.title": "冗余计算器",
  "docs.redundancy.calc.subtitle": "— 算法试算面板演示版",
  "docs.redundancy.calc.demand": "需求容量（kW）",
  "docs.redundancy.calc.demandAria": "需求容量 kW",
  "docs.redundancy.calc.unit": "单机容量（kW）",
  "docs.redundancy.calc.unitAria": "单机容量 kW",
  "docs.redundancy.calc.ariaX": "xN-y 之 x（分摊台数）",
  "docs.redundancy.calc.ariaY": "xN-y 之 y（足够台数）",
  "docs.redundancy.calc.needN": "需求台数 N",
  "docs.redundancy.calc.needRaw": "需求台数（未取整）",
  "docs.redundancy.calc.installed": "安装台数",
  "docs.redundancy.calc.effective": "有效容量",
  "docs.redundancy.calc.units": "台",
  "docs.redundancy.calc.errorXnY": "请输入有效的需求容量、单机容量，且 xN-y 需满足 x > y ≥ 1。",
  "docs.redundancy.calc.errorGeneric": "请输入有效的需求容量与单机容量（均须大于 0）。",

  // ── 参数三层架构 ──────────────────────────────────────────
  "docs.paramLayers.title": "参数三层架构",
  "docs.paramLayers.input.title": "用户输入",
  "docs.paramLayers.input.desc":
    "生成器表单：DC 类型、规模（机架数／功率目标）、年份、冗余模式、安全裕量、优化目标。",
  "docs.paramLayers.input.b1": "AI 训练 / 推理 / 混合 / 云计算",
  "docs.paramLayers.input.b2": "2024 / 2027 / 2029",
  "docs.paramLayers.input.b3": "N / N+1 / N+2 / 2N / xN-y",
  "docs.paramLayers.internal.title": "内部参数",
  "docs.paramLayers.internal.desc":
    "参数管理中的全局常数：安全裕量、存储功率占比 4.2%、IOPS 换算 404、通道比例 2/3、机柜高度 42U 等。",
  "docs.paramLayers.internal.b1": "安全裕量（safety margin）",
  "docs.paramLayers.internal.b2": "4.2% · 404 · 2/3 · 42U",
  "docs.paramLayers.internal.b3": "全部入库、可调可扩展",
  "docs.paramLayers.output.title": "输出",
  "docs.paramLayers.output.desc":
    "运算结果：空间与功率指标、White / Gray space 面积、分层设备 BOM；每次运算均记录输入与参数快照。",
  "docs.paramLayers.output.b1": "IT 机架分布 / 功率密度",
  "docs.paramLayers.output.b2": "White / Gray space",
  "docs.paramLayers.output.b3": "设备 BOM（对应设备目录）",
  "docs.paramLayers.notePre": "三层全部入库：用户输入、当前生效的内部参数，以及运算输出会一并保存为",
  "docs.paramLayers.noteEm": "场景快照（scenario snapshot）",
  "docs.paramLayers.notePost": "，确保任何一次生成的配置都可回溯、可复现。算法本体则可于“算法管理”查看公式并试算。",

  // ── 数据来源 ──────────────────────────────────────────────
  "docs.sources.title": "数据来源",
  "docs.sources.disclaimerPre":
    "设备规格取自各制造商公开产品目录、官方规格页与新闻稿，每条数据附来源 URL；查无数据的字段标记 ",
  "docs.sources.disclaimerPost":
    "，不做推测填值。规格仅供学术研究与模型演示，实际工程设计请以原厂最新公告为准。",
  "docs.sources.vendorsLabel": "收录厂商",
  "docs.sources.vendorDelta": "台达电子 Delta",
  "docs.sources.deltaBadge": "重点收录",
  "docs.sources.delta.title": "台达电子 InfraSuite 产品专栏",
  "docs.sources.delta.bodyPre":
    "本平台按需求重点收录台达电子 InfraSuite 产品线：Modulon DPH／DPH Gen3／Ultron 系列 UPS 11 款、GoCool 液冷 CDU 11 款（含 L2L／L2A、In-Rack）、rPDU ViLink 与 InfraSuite PDC 配电 5 款。规格摘录自 ",
  "docs.sources.delta.bodyPost": " 官方规格页与产品目录 PDF，仅供研究用途。",
  "docs.sources.delta.p1.spec": "SiC 架构，效率达 97.5%",
  "docs.sources.delta.p2.spec": "三相 UPS 系列",
  "docs.sources.delta.p3.spec": "液-液 660 kW–3 MW",
  "docs.sources.delta.p4.spec": "机柜级液冷分配",
  "docs.sources.delta.p5.spec": "智能型机架 PDU",

  // ── 操作说明书 ────────────────────────────────────────────
  "docs.manual.title": "操作说明书",
  "docs.manual.subtitle": "下载三语版平台操作说明书（docx 格式），内容涵盖各功能页的操作流程与字段说明。",
  "docs.manual.zhTW.badge": "繁體中文",
  "docs.manual.zhTW.desc": "平台完整操作说明（繁体中文版）：配置生成器、数据库管理、参数管理与算法管理。",
  "docs.manual.zhCN.badge": "简体中文",
  "docs.manual.zhCN.desc": "平台完整操作说明（简体中文版）：配置生成器、数据库管理、参数管理与算法管理。",
  "docs.manual.en.badge": "English",
  "docs.manual.en.desc": "平台完整操作说明（英文版）：配置生成器、数据库管理、参数管理与算法管理。",
  "docs.manual.download": "下载",

  // ── 引用 ──────────────────────────────────────────────────
  "docs.citation.title": "引用",
  "docs.citation.copy": "复制 BibTeX",
  "docs.citation.copied": "已复制",
  "docs.citation.linkArxiv": "arXiv:2604.09616 论文",
  "docs.citation.linkGithub": "GitHub REPO（WedanEmmanuel/DCGen）",
  "docs.citation.linkDelta": "台达电子官方网站",
} satisfies Record<string, string>;
