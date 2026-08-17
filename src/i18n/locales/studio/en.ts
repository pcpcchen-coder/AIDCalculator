export default {
  // ---------------- Page ----------------
  "studio.page.breadcrumbHome": "Home",
  "studio.page.title": "Layout Studio",
  "studio.page.description":
    "Derive a visual layout model from a saved scenario: floor plan, 3D view, electrical and cooling diagrams, plus a placement editor to drag, resize and persist custom layouts.",

  // ---------------- Source selector ----------------
  "studio.source.title": "Layout source",
  "studio.source.desc": "Pick a saved scenario, configuration and optimization target to derive the visual layout model.",
  "studio.source.designLabel": "Saved scenario",
  "studio.source.designPlaceholder": "Select a scenario…",
  "studio.source.configLabel": "IT configuration",
  "studio.source.criterionLabel": "Optimization target",
  "studio.source.criterionSpace": "Space",
  "studio.source.criterionPower": "Power",
  "studio.source.loading": "Loading scenario…",
  "studio.source.noDesigns": "No saved scenarios yet",
  "studio.source.noDesignsDesc": "Run the generator and save a scenario first, then come back to build a layout.",
  "studio.source.goGenerator": "Open the generator",
  "studio.source.selectHint": "Select a saved scenario to begin.",
  "studio.source.modelError": "Cannot build the layout model",
  "studio.source.modelErrorDesc":
    "This configuration has no cooling/power design for the selected criterion. Switch the criterion or regenerate.",

  // ---------------- Tabs ----------------
  "studio.tabs.floorplan": "Floor plan",
  "studio.tabs.scene3d": "3D view",
  "studio.tabs.electrical": "Electrical diagram",
  "studio.tabs.cooling": "Cooling diagram",
  "studio.tabs.editor": "Placement editor",

  // ---------------- Info bar ----------------
  "studio.info.config": "Config",
  "studio.info.criterion": "Criterion",
  "studio.info.generation": "Generation",
  "studio.info.itPower": "IT load",
  "studio.info.density": "Power density",
  "studio.info.white": "White space",
  "studio.info.grayIndoor": "Gray (indoor)",
  "studio.info.grayOutdoor": "Gray (outdoor)",
  "studio.info.cooling": "Cooling power",

  // ---------------- Editor toolbar ----------------
  "studio.editor.zoom": "Zoom",
  "studio.editor.zoomUnit": "px/m",
  "studio.editor.expand": "Expand instances",
  "studio.editor.lockRatio": "Lock aspect",
  "studio.editor.save": "Save layout",
  "studio.editor.reset": "Reset to auto layout",
  "studio.editor.capHint": "In expand mode at most {cap} instances per type are rendered; the rest is hinted with a +N dashed block.",
  "studio.editor.aggregateHint": "Drag aggregate blocks to move them; drag the bottom-right corner to resize. Enable “Expand instances” to fine-tune each unit.",

  // ---------------- Zones ----------------
  "studio.zone.white": "White | IT hall",
  "studio.zone.indoor": "Indoor | M&E room",
  "studio.zone.outdoor": "Outdoor | Yard",
  "studio.zone.area": "{n} m²",
  "studio.zone.size": "{w} × {d} m",

  // ---------------- Equipment block ----------------
  "studio.block.count": "×{n}",
  "studio.block.more": "+{n}",
  "studio.block.deltaVendor": "Delta Electronics product",
  "studio.block.vendor": "Vendor",

  // ---------------- Drag tooltips ----------------
  "studio.tip.position": "x {x} m · y {y} m",
  "studio.tip.size": "{w} × {d} m",

  // ---------------- Save dialog ----------------
  "studio.save.title": "Save layout",
  "studio.save.desc": "Persist the current overrides (positions / sizes / instance tweaks / zoom) as a named layout you can reload later.",
  "studio.save.nameLabel": "Layout name",
  "studio.save.namePlaceholder": "Enter a layout name…",
  "studio.save.confirm": "Save",
  "studio.save.saving": "Saving…",

  // ---------------- Saved layouts ----------------
  "studio.layouts.title": "Saved layouts",
  "studio.layouts.desc": "Reload a previously saved placement layout, or delete ones you no longer need.",
  "studio.layouts.empty": "No saved layouts yet.",
  "studio.layouts.load": "Load",
  "studio.layouts.delete": "Delete",
  "studio.layouts.deleteTitle": "Delete layout",
  "studio.layouts.deleteDesc": "Delete layout “{name}”? This cannot be undone.",
  "studio.layouts.meta": "{config} · {criterion}",
  "studio.layouts.updated": "Updated {time}",

  // ---------------- Common ----------------
  "studio.common.cancel": "Cancel",

  // ---------------- Toasts ----------------
  "studio.toast.saved": "Layout saved",
  "studio.toast.saveError": "Save failed: {msg}",
  "studio.toast.loaded": "Loaded layout “{name}”",
  "studio.toast.loadError": "Failed to load layout: {msg}",
  "studio.toast.deleted": "Layout deleted",
  "studio.toast.deleteError": "Delete failed: {msg}",
  "studio.toast.reset": "Reset to auto layout",
  "studio.toast.designLoadError": "Failed to load scenario: {msg}",
  "studio.toast.parseError": "Invalid layout data: {msg}",
} satisfies Record<string, string>;
