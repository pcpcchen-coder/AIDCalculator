export default {
  "home.cta.start": "Generate configuration",

  "home.hero.bgAlt": "Data center aisle",
  "home.hero.badgeRepo": "Ported from the open-source repo",
  "home.hero.title": "Generate an entire data center from one platform",
  "home.hero.subtitle": "IT racks × cooling × power distribution — parameters to BOM in one pass",
  "home.hero.desc":
    "DCGen Web brings the DCGen model from UChicago / Argonne to the browser: a built-in catalog of commercial equipment (including the full Delta Electronics UPS / CDU / PDU lineup), tunable global parameters, and an extensible algorithm registry. Enter your requirements and get room space, power, and equipment lists instantly.",
  "home.hero.ctaCatalog": "Browse equipment catalog",
  "home.hero.stats.equipment": "Equipment models",
  "home.hero.stats.dcTypes": "DC types",
  "home.hero.stats.algorithms": "Built-in algorithms",
  "home.hero.stats.infra": "Infrastructure categories",

  "home.capabilities.title": "Platform capabilities",
  "home.capabilities.aside": "A complete workflow from requirements to equipment list",
  "home.capabilities.generator.title": "Configuration generation",
  "home.capabilities.generator.desc":
    "Pick a type, set the scale, choose redundancy — generate space, power, and equipment BOM in one click; results can be saved and compared.",
  "home.capabilities.generator.link": "Go to generator",
  "home.capabilities.catalog.title": "Database management",
  "home.capabilities.catalog.desc":
    "Full CRUD for IT reference configurations and 8 categories of non-IT equipment, with specs sourced from official product catalogs — the complete Delta Electronics lineup included.",
  "home.capabilities.catalog.link": "Browse catalog",
  "home.capabilities.params.title": "Parameter management",
  "home.capabilities.params.desc":
    "Global parameters such as safety margin, storage power ratio, and rack U count apply instantly; custom parameters can also be added.",
  "home.capabilities.params.link": "Tune parameters",
  "home.capabilities.algorithms.title": "Algorithm management",
  "home.capabilities.algorithms.desc":
    "Paper formulas 1–19 are transparent and tunable; custom algorithms can be built and evaluated instantly with a safe formula evaluator.",
  "home.capabilities.algorithms.link": "Manage algorithms",

  "home.stats.title": "Equipment catalog at a glance",
  "home.stats.subtitle":
    "Specs sourced from official vendor catalogs and datasheets, with a source link on every entry",
  "home.stats.total": "Total equipment",
  "home.stats.totalHint": "8 categories of non-IT infrastructure",
  "home.stats.vendors": "Vendors covered",
  "home.stats.vendorsHint": "Including Delta Electronics",
  "home.stats.itConfigs": "IT reference configurations",
  "home.stats.params": "Global parameters",
  "home.stats.paramsHint": "Adjustable; custom entries supported",
  "home.stats.chartTitle": "Distribution across 8 equipment categories",
  "home.stats.deltaLegend": "Includes Delta products",
  "home.stats.deltaDot": "Includes Delta Electronics products",
  "home.stats.tooltip": "{count} models · Representative vendors: {vendor}",
  "home.stats.tooltipName": "Entries",
  "home.stats.cat.cdu": "CDU coolant distribution",
  "home.stats.cat.chiller": "Chillers",
  "home.stats.cat.drycooler": "Dry coolers",
  "home.stats.cat.tower": "Evaporative towers",
  "home.stats.cat.pdu": "PDUs",
  "home.stats.cat.ups": "UPSs",
  "home.stats.cat.msb": "MSBs",
  "home.stats.cat.gen": "Backup generators",

  "home.delta.title": "Featured vendor: Delta Electronics",
  "home.delta.desc":
    "11 Modulon DPH / Ultron UPS models, 11 GoCool liquid-cooling CDUs, and 5 rPDU / PDC power distribution models are included.",
  "home.delta.efficiency": "Efficiency",
  "home.delta.link": "View Delta products in the catalog",

  "home.types.title": "Supported data center types",
  "home.types.subtitle": "Aligned with DCGen Canonical configurations for operating years 2024 / 2027 / 2029",
  "home.types.imgAlt": "{type} data center",
  "home.types.cta": "Generate with this type",
  "home.types.aiTraining.zh": "AI Training",
  "home.types.aiTraining.desc":
    "High-density GPU clusters, primarily liquid-cooled. The Canonical AI Training configuration is built from NVL system racks (RackTDP 120+ kW) for maximum power density.",
  "home.types.aiTraining.badge1": "Liquid cooling",
  "home.types.aiInference.zh": "AI Inference",
  "home.types.aiInference.desc":
    "Inference nodes are less dense and distributed, mixing air and liquid cooling with an emphasis on PUE and elastic scaling.",
  "home.types.aiInference.badge1": "Hybrid cooling",
  "home.types.mixed.zh": "Mixed training & inference",
  "home.types.mixed.desc":
    "Training and inference halls are deployed together on one campus; the model splits the IT load by ratio and computes cooling and power distribution for each.",
  "home.types.mixed.badge1": "Dual workloads",
  "home.types.mixed.badge2": "Flexible ratio",
  "home.types.cloud.zh": "Cloud",
  "home.types.cloud.desc":
    "Traditional cloud halls: general-purpose compute plus storage nodes; the storage power ratio (default 4.2%) and the IOPS/TFLOPS conversion (default 404) are calibrated from this configuration.",
  "home.types.cloud.badge1": "Air cooling",
  "home.types.cloud.badge2": "General-purpose racks",

  "home.recent.title": "Recently generated scenarios",
  "home.recent.viewAll": "View all",
  "home.recent.open": "Open",
  "home.recent.racks": "IT racks",
  "home.recent.power": "Peak power",
  "home.recent.item1.name": "50MW AI training campus 2027",
  "home.recent.item1.time": "2 hours ago",
  "home.recent.item2.name": "Taipei edge inference sites ×6",
  "home.recent.item2.time": "Yesterday",
  "home.recent.item3.name": "Mixed campus, 70 training / 30 inference",
  "home.recent.item3.time": "3 days ago",
  "home.recent.item4.name": "Cloud general-purpose hall, 2024 baseline",
  "home.recent.item4.time": "Last week",
  "home.recent.item5.name": "120kW NVL liquid-cooled hall expansion",
  "home.recent.item5.time": "Last week",

  "home.workflow.title": "Configure in three steps",
  "home.workflow.step1.title": "Enter requirements",
  "home.workflow.step1.desc": "Type, scale (rack count or MW), year, redundancy, and cooling mode",
  "home.workflow.step2.title": "Compute",
  "home.workflow.step2.desc":
    "DCGen formulas 1–19 run in real time against the current global parameters and catalog",
  "home.workflow.step3.title": "Get the BOM",
  "home.workflow.step3.desc":
    "Space and power metric cards plus cooling and power-distribution equipment lists — save, compare, and export",
} satisfies Record<string, string>;
