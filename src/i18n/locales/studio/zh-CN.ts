export default {
  // ---------------- 页面 ----------------
  "studio.page.breadcrumbHome": "首页",
  "studio.page.title": "配置图工作室",
  "studio.page.description":
    "由已存情境推导版面模型，查看平面配置图、3D 展示、电路与冷却架构图，并在摆放编辑器拖放调整设备位置、保存自定义版面。",

  // ---------------- 来源选择器 ----------------
  "studio.source.title": "版面来源",
  "studio.source.desc": "选择已存情境、配置与优化目标，系统将自动推导可视化版面模型。",
  "studio.source.designLabel": "已存情境",
  "studio.source.designPlaceholder": "选择情境…",
  "studio.source.configLabel": "IT 配置",
  "studio.source.criterionLabel": "优化目标",
  "studio.source.criterionSpace": "Space（面积）",
  "studio.source.criterionPower": "Power（能耗）",
  "studio.source.loading": "载入情境中…",
  "studio.source.noDesigns": "尚无已存情境",
  "studio.source.noDesignsDesc": "请先前往配置生成器演算并保存情境，再回到此页建立版面。",
  "studio.source.goGenerator": "前往配置生成器",
  "studio.source.selectHint": "请选择一个已存情境以开始。",
  "studio.source.modelError": "无法建立版面模型",
  "studio.source.modelErrorDesc": "此配置在所选优化目标下没有可用的冷却／配电设计，请切换优化目标或重新演算。",

  // ---------------- 分页 ----------------
  "studio.tabs.floorplan": "平面配置图",
  "studio.tabs.scene3d": "3D 展示",
  "studio.tabs.electrical": "电路配置图",
  "studio.tabs.cooling": "冷却架构图",
  "studio.tabs.editor": "摆放编辑器",

  // ---------------- 信息条 ----------------
  "studio.info.config": "配置",
  "studio.info.criterion": "优化目标",
  "studio.info.generation": "年代",
  "studio.info.itPower": "IT 负载",
  "studio.info.density": "功率密度",
  "studio.info.white": "White 空间",
  "studio.info.grayIndoor": "Gray（室内）",
  "studio.info.grayOutdoor": "Gray（室外）",
  "studio.info.cooling": "冷却功耗",

  // ---------------- 编辑器工具栏 ----------------
  "studio.editor.zoom": "缩放",
  "studio.editor.zoomUnit": "px/m",
  "studio.editor.expand": "展开实例",
  "studio.editor.lockRatio": "锁定比例",
  "studio.editor.save": "保存版面",
  "studio.editor.reset": "重置为自动版面",
  "studio.editor.capHint": "展开实例时每型别最多渲染 {cap} 台，其余以 +N 虚线块提示。",
  "studio.editor.aggregateHint": "拖放移动聚合块；拖曳右下角调整尺寸。开启「展开实例」可逐台微调位置。",

  // ---------------- 区域 ----------------
  "studio.zone.white": "White｜IT 机房",
  "studio.zone.indoor": "Indoor｜室内机电房",
  "studio.zone.outdoor": "Outdoor｜室外场",
  "studio.zone.area": "{n} m²",
  "studio.zone.size": "{w} × {d} m",

  // ---------------- 设备块 ----------------
  "studio.block.count": "×{n}",
  "studio.block.more": "+{n}",
  "studio.block.deltaVendor": "台达电子产品",
  "studio.block.vendor": "厂商",

  // ---------------- 拖拽提示 ----------------
  "studio.tip.position": "x {x} m · y {y} m",
  "studio.tip.size": "{w} × {d} m",

  // ---------------- 保存对话框 ----------------
  "studio.save.title": "保存版面",
  "studio.save.desc": "将当前的拖放覆写（位置／尺寸／实例微调／缩放）保存为命名版面，之后可随时载入。",
  "studio.save.nameLabel": "版面名称",
  "studio.save.namePlaceholder": "输入版面名称…",
  "studio.save.confirm": "保存",
  "studio.save.saving": "保存中…",

  // ---------------- 已存版面 ----------------
  "studio.layouts.title": "已存版面",
  "studio.layouts.desc": "载入先前保存的拖放版面，或删除不再需要的版面。",
  "studio.layouts.empty": "尚无已存版面。",
  "studio.layouts.load": "载入",
  "studio.layouts.delete": "删除",
  "studio.layouts.deleteTitle": "删除版面",
  "studio.layouts.deleteDesc": "确定删除版面「{name}」？此操作无法复原。",
  "studio.layouts.meta": "{config} · {criterion}",
  "studio.layouts.updated": "更新于 {time}",

  // ---------------- 通用 ----------------
  "studio.common.cancel": "取消",

  // ---------------- Toast ----------------
  "studio.toast.saved": "版面已保存",
  "studio.toast.saveError": "保存失败：{msg}",
  "studio.toast.loaded": "已载入版面「{name}」",
  "studio.toast.loadError": "载入版面失败：{msg}",
  "studio.toast.deleted": "版面已删除",
  "studio.toast.deleteError": "删除失败：{msg}",
  "studio.toast.reset": "已重置为自动版面",
  "studio.toast.designLoadError": "载入情境失败：{msg}",
  "studio.toast.parseError": "版面数据格式错误：{msg}",
} satisfies Record<string, string>;
