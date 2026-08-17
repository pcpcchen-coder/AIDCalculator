export default {
  // ── Section navigation ────────────────────────────────────
  "docs.nav.toc": "Contents",
  "docs.nav.aria": "Section navigation",
  "docs.nav.overview": "Model overview",
  "docs.nav.dcTypes": "Four data center types",
  "docs.nav.cooling": "Cooling chain",
  "docs.nav.power": "Power chain",
  "docs.nav.redundancy": "Redundancy vocabulary",
  "docs.nav.paramLayers": "Three parameter layers",
  "docs.nav.sources": "Data sources",
  "docs.nav.manual": "User Manual",
  "docs.nav.citation": "Citation",

  // ── Shared links ──────────────────────────────────────────
  "docs.common.goParameters": "Go to Parameter Management",
  "docs.common.goAlgorithms": "Go to Algorithm Management",
  "docs.common.goGenerator": "Go to the Configuration Generator",
  "docs.common.goCatalog": "Go to the Equipment Catalog",
  "docs.common.viewCatalog": "View catalog",

  // ── Hero ──────────────────────────────────────────────────
  "docs.hero.title": "Model Documentation",
  "docs.hero.subtitle":
    "DCGen (Data Center configuration Generator), developed by the University of Chicago and Argonne National Laboratory: given IT requirements, it automatically derives the space, power, and equipment list for the cooling and power-distribution infrastructure. This platform is its web-based database implementation.",
  "docs.hero.stat.algorithms.suffix": "",
  "docs.hero.stat.algorithms.label": "algorithms",
  "docs.hero.stat.equipment.suffix": "",
  "docs.hero.stat.equipment.label": "equipment classes",
  "docs.hero.stat.dcTypes.suffix": "",
  "docs.hero.stat.dcTypes.label": "DC types",

  // ── Model overview ────────────────────────────────────────
  "docs.overview.title": "Model overview",
  "docs.overview.bodyPre": "DCGen is a ",
  "docs.overview.bodyEm": "model-driven data center configuration generator",
  "docs.overview.bodyPost":
    ": starting from IT requirements, the IT model (Eq. (7)–(15)) derives rack distribution and power density; the cooling chain (Eq. (9)–(13)) then completes cooling selection, and the power chain (Eq. (14)–(19)) completes power distribution and redundancy planning. Finally, Eq. (17c)/(19c) derive the gray-space area, producing a complete space, power, and equipment bill of materials (BOM).",
  "docs.overview.inputs.title": "Inputs",
  "docs.overview.inputs.rackOrPower": "Rack count or power target",
  "docs.overview.inputs.dcType": "DC type (four types)",
  "docs.overview.inputs.year": "Year 2024 / 2027 / 2029",
  "docs.overview.inputs.redundancy": "Redundancy mode",
  "docs.overview.inputs.margin": "Safety margin",
  "docs.overview.inputs.objective": "Optimization objective",
  "docs.overview.outputs.title": "Outputs",
  "docs.overview.outputs.rackDist": "IT rack distribution",
  "docs.overview.outputs.powerDensity": "Power density",
  "docs.overview.outputs.whiteGray": "White / Gray space",
  "docs.overview.outputs.bom": "Equipment BOM",
  "docs.overview.flow.itDemand.label": "IT demand",
  "docs.overview.flow.itDemand.sub": "Racks / power target",
  "docs.overview.flow.itPower.label": "IT power & space",
  "docs.overview.flow.itPower.sub": "Eq. (1)–(8)",
  "docs.overview.flow.cooling.label": "Cooling system",
  "docs.overview.flow.cooling.sub": "Eq. (9)–(13)",
  "docs.overview.flow.power.label": "Power system",
  "docs.overview.flow.power.sub": "Eq. (14)–(19)",
  "docs.overview.flow.bom.label": "Configuration BOM",
  "docs.overview.flow.bom.sub": "White / Gray space",
  "docs.overview.tip.body":
    "Every parameter used on this platform can be adjusted under “Parameter Management”, and algorithms can be inspected and extended under “Algorithm Management”.",

  // ── Four data center types ────────────────────────────────
  "docs.dcTypes.title": "Four data center types",
  "docs.dcTypes.nodesLabel": "Node type mix",
  "docs.dcTypes.refLabel": "Reference:",
  "docs.dcTypes.alt": "Concept illustration of a {name} data center",
  "docs.dcTypes.aiTraining.name": "AI Training",
  "docs.dcTypes.aiTraining.desc":
    "GPU training clusters run synchronous loads at full utilization for long periods, with extremely high power density — liquid cooling is a must. The canonical configuration evolves by generation: rack TDP grows from about 40 kW in 2024 to 120+ kW by 2029.",
  "docs.dcTypes.aiTraining.nodeGpu": "All racks",
  "docs.dcTypes.aiInference.name": "AI Inference",
  "docs.dcTypes.aiInference.desc":
    "Inference workloads are less dense, request-driven, and distributed; rack power is far below that of training clusters, so a mix of air and liquid cooling suffices, with an emphasis on elastic scaling and PUE.",
  "docs.dcTypes.aiInference.nodeCpuGpu": "Primary",
  "docs.dcTypes.aiInference.nodeCpu": "Preprocessing / scheduling",
  "docs.dcTypes.mixed.name": "Mixed training / inference",
  "docs.dcTypes.mixed.desc":
    "Training and inference halls deployed together on one campus. The model splits the IT load by the user-defined training/inference ratio, derives cooling and power for each side, then merges them into a single overall configuration.",
  "docs.dcTypes.mixed.nodeGpu": "Training side",
  "docs.dcTypes.mixed.nodeCpuGpu": "Inference side",
  "docs.dcTypes.mixed.nodeCpu": "General purpose",
  "docs.dcTypes.cloud.name": "Cloud",
  "docs.dcTypes.cloud.desc":
    "A traditional cloud facility for general-purpose compute plus storage. Storage capacity is estimated with three equations (Eq. (1)–(3)); IOPS and TFLOPS are converted at a factor of 404, and the storage share of IT power (4.2% by default) is calibrated from this configuration class.",
  "docs.dcTypes.cloud.nodeCpu": "Compute",
  "docs.dcTypes.cloud.nodeStorage": "Storage",

  // ── Cooling chain ─────────────────────────────────────────
  "docs.cooling.title": "Cooling chain",
  "docs.cooling.body":
    "Every watt of IT load ultimately becomes heat. Following the heat load, DCGen selects equipment stage by stage along the loop “rack → CDU → dry cooler / cooling tower → chiller” (Eq. (9)–(13)), and feeds the cooling system's own power draw back into the power chain.",
  "docs.cooling.svgLabel": "Cooling loop schematic: IT racks → CDU → dry cooler / cooling tower → chiller",
  "docs.cooling.dry.title": "Dry cooling",
  "docs.cooling.dry.desc":
    "Dry coolers reject coolant heat directly to the atmosphere — no water consumption and simple maintenance, ideal for water-scarce sites or sites with expensive water; corresponds to the Dry coolers catalog class (Kelvion, LU-VE, etc.).",
  "docs.cooling.evap.title": "Evaporative cooling",
  "docs.cooling.evap.desc":
    "Cooling towers reject heat by evaporation — highly efficient and able to handle larger heat loads, but they consume water and require water treatment; corresponds to the Cooling towers catalog class (Evapco, BAC, SPX Marley).",
  "docs.cooling.cdu.title": "Liquid-cooling CDU",
  "docs.cooling.cdu.desc":
    "Row-level and in-rack CDUs distribute coolant to high-density racks. The catalog includes commercial units such as Delta's GoCool series (150–3000 kW), CoolIT CHx2000, and Motivair MCDU-70.",

  // ── Power chain ───────────────────────────────────────────
  "docs.power.title": "Power chain",
  "docs.power.body":
    "The power chain descends from the utility feed: MSB → backup generator → UPS → PDU → rack. DCGen sizes the unit count at each level from its rated capacity and redundancy mode (Eq. (14)–(19)), ensuring every level can carry the combined IT and cooling load.",
  "docs.power.svgLabel": "Power chain schematic: utility → MSB → backup generator → UPS → PDU → rack",
  "docs.power.th.level": "Level",
  "docs.power.th.role": "Role",
  "docs.power.th.examples": "Catalog examples",
  "docs.power.examplesSep": ", ",
  "docs.power.msb.role": "Main switchboard",
  "docs.power.msb.ex1": "Schneider BlokSeT",
  "docs.power.msb.ex2": "ABB MNS",
  "docs.power.ups.role": "Uninterruptible power supply",
  "docs.power.ups.ex1": "Delta Modulon DPH 500–2000 kVA (96.5–97.5% efficiency)",
  "docs.power.ups.ex2": "Schneider Galaxy VL",
  "docs.power.ups.ex3": "Eaton 9395P",
  "docs.power.ups.ex4": "Huawei UPS5000-H",
  "docs.power.pdu.role": "Rack power distribution",
  "docs.power.pdu.ex1": "Delta rPDU ViLink",
  "docs.power.pdu.ex2": "APC NetShelter",
  "docs.power.generator.role": "Backup generator",
  "docs.power.generator.ex1": "Caterpillar",
  "docs.power.generator.ex2": "Cummins",
  "docs.power.generator.ex3": "Kohler",
  "docs.power.generator.ex4": "mtu",
  "docs.power.loss.title": "How conversion losses are counted (Eq. (18)–(19)):",
  "docs.power.loss.body":
    "Multiplying the efficiency of every stage yields the end-to-end chain efficiency; the difference against IT power is the conversion loss. That loss also becomes heat and is fed back into the cooling chain's heat-load calculation, forming an IT → power → cooling coupled iteration.",

  // ── Redundancy vocabulary ─────────────────────────────────
  "docs.redundancy.title": "Redundancy vocabulary",
  "docs.redundancy.imgAlt": "Redundancy vocabulary diagram: N / N+1 / N+2 / 2N / xN-y unit layouts",
  "docs.redundancy.defN": "Exactly the number of units required, with no backup.",
  "docs.redundancy.defNPlus1": "Required units plus 1 backup unit.",
  "docs.redundancy.defNPlus2": "Required units plus 2 backup units.",
  "docs.redundancy.def2N": "A fully duplicated system (A/B feeds); either feed can independently carry the entire load.",
  "docs.redundancy.defXnY": "x units share the load while y units suffice; effective capacity = y/x × rated capacity (Eq. (15)).",
  "docs.redundancy.calc.title": "Redundancy calculator",
  "docs.redundancy.calc.subtitle": "— demo of the algorithm sandbox panel",
  "docs.redundancy.calc.demand": "Demand capacity (kW)",
  "docs.redundancy.calc.demandAria": "Demand capacity in kW",
  "docs.redundancy.calc.unit": "Unit capacity (kW)",
  "docs.redundancy.calc.unitAria": "Unit capacity in kW",
  "docs.redundancy.calc.ariaX": "x of xN-y (number of load-sharing units)",
  "docs.redundancy.calc.ariaY": "y of xN-y (number of sufficient units)",
  "docs.redundancy.calc.needN": "Required units N",
  "docs.redundancy.calc.needRaw": "Required units (unrounded)",
  "docs.redundancy.calc.installed": "Installed units",
  "docs.redundancy.calc.effective": "Effective capacity",
  "docs.redundancy.calc.units": "units",
  "docs.redundancy.calc.errorXnY": "Enter a valid demand capacity and unit capacity; xN-y requires x > y ≥ 1.",
  "docs.redundancy.calc.errorGeneric": "Enter a valid demand capacity and unit capacity (both must be greater than 0).",

  // ── Three parameter layers ────────────────────────────────
  "docs.paramLayers.title": "Three parameter layers",
  "docs.paramLayers.input.title": "User input",
  "docs.paramLayers.input.desc":
    "The generator form: DC type, scale (rack count / power target), year, redundancy mode, safety margin, and optimization objective.",
  "docs.paramLayers.input.b1": "AI training / inference / mixed / cloud",
  "docs.paramLayers.input.b2": "2024 / 2027 / 2029",
  "docs.paramLayers.input.b3": "N / N+1 / N+2 / 2N / xN-y",
  "docs.paramLayers.internal.title": "Internal parameters",
  "docs.paramLayers.internal.desc":
    "Global constants in Parameter Management: safety margin, 4.2% storage power share, 404 IOPS conversion, 2/3 aisle ratio, 42U rack height, and more.",
  "docs.paramLayers.internal.b1": "Safety margin",
  "docs.paramLayers.internal.b2": "4.2% · 404 · 2/3 · 42U",
  "docs.paramLayers.internal.b3": "All stored in the database — tunable and extensible",
  "docs.paramLayers.output.title": "Output",
  "docs.paramLayers.output.desc":
    "Computed results: space and power metrics, white/gray space areas, and a layered equipment BOM; every run records its inputs and a parameter snapshot.",
  "docs.paramLayers.output.b1": "IT rack distribution / power density",
  "docs.paramLayers.output.b2": "White / Gray space",
  "docs.paramLayers.output.b3": "Equipment BOM (mapped to the equipment catalog)",
  "docs.paramLayers.notePre": "All three layers are persisted: user input, the internal parameters currently in effect, and the computed output are saved together as a ",
  "docs.paramLayers.noteEm": "scenario snapshot",
  "docs.paramLayers.notePost": ", ensuring every generated configuration is traceable and reproducible. The algorithms themselves can be inspected and evaluated under “Algorithm Management”.",

  // ── Data sources ──────────────────────────────────────────
  "docs.sources.title": "Data sources",
  "docs.sources.disclaimerPre":
    "Equipment specifications are taken from manufacturers' public catalogs, official specification pages, and press releases; every record includes a source URL. Fields with no available data are marked ",
  "docs.sources.disclaimerPost":
    " and are never filled by guesswork. Specifications are for academic research and model demonstration only; refer to the manufacturers' latest publications for actual engineering design.",
  "docs.sources.vendorsLabel": "Covered vendors",
  "docs.sources.vendorDelta": "Delta Electronics",
  "docs.sources.deltaBadge": "Featured",
  "docs.sources.delta.title": "Delta Electronics InfraSuite spotlight",
  "docs.sources.delta.bodyPre":
    "This platform features Delta Electronics' InfraSuite product line as required: 11 Modulon DPH / DPH Gen3 / Ultron series UPS models, 11 GoCool liquid-cooling CDUs (including L2L/L2A and In-Rack), and 5 rPDU ViLink and InfraSuite PDC power-distribution models. Specifications are transcribed from the official specification pages and catalog PDFs at ",
  "docs.sources.delta.bodyPost": ", for research use only.",
  "docs.sources.delta.p1.spec": "SiC architecture, up to 97.5% efficiency",
  "docs.sources.delta.p2.spec": "Three-phase UPS series",
  "docs.sources.delta.p3.spec": "Liquid-to-liquid, 660 kW–3 MW",
  "docs.sources.delta.p4.spec": "In-rack liquid-cooling distribution",
  "docs.sources.delta.p5.spec": "Intelligent rack PDU",

  // ── User Manual ───────────────────────────────────────────
  "docs.manual.title": "User Manual",
  "docs.manual.subtitle": "Download the DCGen Web user manual (docx) in your preferred language.",
  "docs.manual.zhTW.badge": "繁體中文",
  "docs.manual.zhTW.desc": "Complete platform guide in Traditional Chinese: configuration generator, catalog, parameters, and algorithm management.",
  "docs.manual.zhCN.badge": "简体中文",
  "docs.manual.zhCN.desc": "Complete platform guide in Simplified Chinese: configuration generator, catalog, parameters, and algorithm management.",
  "docs.manual.en.badge": "English",
  "docs.manual.en.desc": "Complete platform guide in English: configuration generator, catalog, parameters, and algorithm management.",
  "docs.manual.download": "Download",

  // ── Citation ──────────────────────────────────────────────
  "docs.citation.title": "Citation",
  "docs.citation.copy": "Copy BibTeX",
  "docs.citation.copied": "Copied",
  "docs.citation.linkArxiv": "arXiv:2604.09616 paper",
  "docs.citation.linkGithub": "GitHub repo (WedanEmmanuel/DCGen)",
  "docs.citation.linkDelta": "Delta Electronics official website",
} satisfies Record<string, string>;
