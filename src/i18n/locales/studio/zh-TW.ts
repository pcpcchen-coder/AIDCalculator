export default {
  // ---------------- 頁面 ----------------
  "studio.page.breadcrumbHome": "首頁",
  "studio.page.title": "配置圖工作室",
  "studio.page.description":
    "由已存情境推導版面模型，檢視平面配置圖、3D 展示、電路與冷卻架構圖，並於擺放編輯器拖放調整設備位置、儲存自訂版面。",

  // ---------------- 來源選擇器 ----------------
  "studio.source.title": "版面來源",
  "studio.source.desc": "選擇已存情境、配置與優化目標，系統將自動推導可視化版面模型。",
  "studio.source.designLabel": "已存情境",
  "studio.source.designPlaceholder": "選擇情境…",
  "studio.source.configLabel": "IT 配置",
  "studio.source.criterionLabel": "優化目標",
  "studio.source.criterionSpace": "Space（面積）",
  "studio.source.criterionPower": "Power（能耗）",
  "studio.source.loading": "載入情境中…",
  "studio.source.noDesigns": "尚無已存情境",
  "studio.source.noDesignsDesc": "請先前往配置產生器演算並儲存情境，再回到此頁建立版面。",
  "studio.source.goGenerator": "前往配置產生器",
  "studio.source.selectHint": "請選擇一個已存情境以開始。",
  "studio.source.modelError": "無法建立版面模型",
  "studio.source.modelErrorDesc": "此配置在所選優化目標下沒有可用的冷卻／配電設計，請切換優化目標或重新演算。",

  // ---------------- 分頁 ----------------
  "studio.tabs.floorplan": "平面配置圖",
  "studio.tabs.scene3d": "3D 展示",
  "studio.tabs.electrical": "電路配置圖",
  "studio.tabs.cooling": "冷卻架構圖",
  "studio.tabs.editor": "擺放編輯器",

  // ---------------- 資訊條 ----------------
  "studio.info.config": "配置",
  "studio.info.criterion": "優化目標",
  "studio.info.generation": "年代",
  "studio.info.itPower": "IT 負載",
  "studio.info.density": "功率密度",
  "studio.info.white": "White 空間",
  "studio.info.grayIndoor": "Gray（室內）",
  "studio.info.grayOutdoor": "Gray（室外）",
  "studio.info.cooling": "冷卻功耗",

  // ---------------- 編輯器工具列 ----------------
  "studio.editor.zoom": "縮放",
  "studio.editor.zoomUnit": "px/m",
  "studio.editor.expand": "展開實例",
  "studio.editor.lockRatio": "鎖定比例",
  "studio.editor.save": "儲存版面",
  "studio.editor.reset": "重置為自動版面",
  "studio.editor.capHint": "展開實例時每型別最多渲染 {cap} 台，其餘以 +N 虛線塊提示。",
  "studio.editor.aggregateHint": "拖放移動聚合塊；拖曳右下角調整尺寸。開啟「展開實例」可逐台微調位置。",

  // ---------------- 區域 ----------------
  "studio.zone.white": "White｜IT 機房",
  "studio.zone.indoor": "Indoor｜室內機電房",
  "studio.zone.outdoor": "Outdoor｜室外場",
  "studio.zone.area": "{n} m²",
  "studio.zone.size": "{w} × {d} m",

  // ---------------- 設備塊 ----------------
  "studio.block.count": "×{n}",
  "studio.block.more": "+{n}",
  "studio.block.deltaVendor": "台達電子產品",
  "studio.block.vendor": "廠商",

  // ---------------- 拖曳提示 ----------------
  "studio.tip.position": "x {x} m · y {y} m",
  "studio.tip.size": "{w} × {d} m",

  // ---------------- 儲存對話框 ----------------
  "studio.save.title": "儲存版面",
  "studio.save.desc": "將目前的拖放覆寫（位置／尺寸／實例微調／縮放）儲存為命名版面，之後可隨時載入。",
  "studio.save.nameLabel": "版面名稱",
  "studio.save.namePlaceholder": "輸入版面名稱…",
  "studio.save.confirm": "儲存",
  "studio.save.saving": "儲存中…",

  // ---------------- 已存版面 ----------------
  "studio.layouts.title": "已存版面",
  "studio.layouts.desc": "載入先前儲存的拖放版面，或刪除不再需要的版面。",
  "studio.layouts.empty": "尚無已存版面。",
  "studio.layouts.load": "載入",
  "studio.layouts.delete": "刪除",
  "studio.layouts.deleteTitle": "刪除版面",
  "studio.layouts.deleteDesc": "確定刪除版面「{name}」？此操作無法復原。",
  "studio.layouts.meta": "{config} · {criterion}",
  "studio.layouts.updated": "更新於 {time}",

  // ---------------- 通用 ----------------
  "studio.common.cancel": "取消",

  // ---------------- Toast ----------------
  "studio.toast.saved": "版面已儲存",
  "studio.toast.saveError": "儲存失敗：{msg}",
  "studio.toast.loaded": "已載入版面「{name}」",
  "studio.toast.loadError": "載入版面失敗：{msg}",
  "studio.toast.deleted": "版面已刪除",
  "studio.toast.deleteError": "刪除失敗：{msg}",
  "studio.toast.reset": "已重置為自動版面",
  "studio.toast.designLoadError": "載入情境失敗：{msg}",
  "studio.toast.parseError": "版面資料格式錯誤：{msg}",
} satisfies Record<string, string>;
