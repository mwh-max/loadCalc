// ---- Load Calculator ----

import {
  BASE_MATERIALS,
  supportLimits,
  DISTRIBUTION_FACTORS,
  calculateMixedLoad,
} from "./calculations.js";

// ---- Unit conversion ----

let currentUnit = localStorage.getItem("loadCalc_unit") || "lbs";
const KG_PER_LB = 0.453592;

function toDisplay(lbs, decimals = 1) {
  if (currentUnit === "kg") {
    return `${(lbs * KG_PER_LB).toFixed(decimals)} kg`;
  }
  return `${lbs.toFixed(decimals)} lbs`;
}

function updateSupportLabels() {
  document.getElementById("optScaffold").textContent =
    `Scaffold (${toDisplay(500, 0)})`;
  document.getElementById("optHoist").textContent =
    `Hoist (${toDisplay(1000, 0)})`;
  document.getElementById("optTruck").textContent =
    `Truck (${toDisplay(5000, 0)})`;
}

// ---- Inline errors ----

function showInlineError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.hidden = false;
}

function clearInlineError(id) {
  const el = document.getElementById(id);
  el.textContent = "";
  el.hidden = true;
}

// ---- Storage keys ----

const STORAGE_KEY = "loadCalc_customMaterials";
const PRESETS_KEY = "loadCalc_presets";
const FAVORITES_KEY = "loadCalc_favorites";

// ---- Custom materials (localStorage) ----

function getCustomMaterials() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustomMaterials(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function refreshMaterials() {
  materials = [...BASE_MATERIALS, ...getCustomMaterials()];
  updateMaterialOptions(materialSearch.value);
}

// ---- Favorites ----

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

function isFavorite(name) {
  return getFavorites().includes(name);
}

function toggleFavorite(name) {
  const favs = getFavorites();
  const idx = favs.indexOf(name);
  if (idx === -1) favs.push(name);
  else favs.splice(idx, 1);
  saveFavorites(favs);
  renderFavoriteBtn();
  updateMaterialOptions(materialSearch.value);
}

function renderFavoriteBtn() {
  const btn = document.getElementById("toggleFavoriteBtn");
  const name = materialSelect.value;
  if (!name) {
    btn.hidden = true;
    return;
  }
  btn.hidden = false;
  const fav = isFavorite(name);
  btn.textContent = fav ? "★" : "☆";
  btn.setAttribute(
    "aria-label",
    fav ? "Remove from favorites" : "Add to favorites",
  );
  btn.classList.toggle("is-favorite", fav);
}

// ---- Presets (localStorage) ----

function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderPresets() {
  const list = document.getElementById("presetsList");
  list.innerHTML = "";
  const presets = getPresets();
  if (presets.length === 0) return;

  presets.forEach((preset, i) => {
    const li = document.createElement("li");
    li.className = "preset-item";

    const info = document.createElement("span");
    info.textContent = `${preset.name} (${preset.items.length} item${preset.items.length !== 1 ? "s" : ""})`;

    const actions = document.createElement("div");
    actions.className = "preset-actions";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn-ghost";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => loadPreset(i));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-remove";
    delBtn.textContent = "✕";
    delBtn.setAttribute("aria-label", `Delete preset ${preset.name}`);
    delBtn.addEventListener("click", () => deletePreset(i));

    actions.appendChild(loadBtn);
    actions.appendChild(delBtn);
    li.appendChild(info);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

function savePreset(name) {
  clearInlineError("presetError");

  if (!name.trim()) {
    showInlineError("presetError", "Please enter a preset name.");
    return;
  }
  if (loadItems.length === 0) {
    showInlineError(
      "presetError",
      "Add at least one item before saving a preset.",
    );
    return;
  }

  const presets = getPresets();
  if (presets.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) {
    showInlineError(
      "presetError",
      `A preset named "${name.trim()}" already exists.`,
    );
    return;
  }

  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;
  presets.push({
    name: name.trim(),
    items: loadItems.map(({ material, quantity }) => ({
      materialName: material.name,
      quantity,
    })),
    distribution,
    supportType,
  });
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  renderPresets();
  document.getElementById("presetNameInput").value = "";
}

function loadPreset(index) {
  const preset = getPresets()[index];
  if (!preset) return;

  const skipped = [];
  const resolved = preset.items
    .map(({ materialName, quantity }) => {
      const material = materials.find((m) => m.name === materialName);
      if (!material) skipped.push(materialName);
      return material ? { material, quantity } : null;
    })
    .filter(Boolean);

  if (resolved.length === 0) {
    showInlineError(
      "presetError",
      "None of the materials in this preset could be found.",
    );
    return;
  }

  if (skipped.length > 0) {
    showInlineError(
      "presetError",
      `${skipped.length} item(s) could not be found and were skipped: ${skipped.join(", ")}.`,
    );
  } else {
    clearInlineError("presetError");
  }

  loadItems = resolved;
  editingIndex = null;
  if (preset.distribution)
    document.getElementById("distribution").value = preset.distribution;
  if (preset.supportType)
    document.getElementById("support").value = preset.supportType;

  renderLoadItems();
  updateGauge();
  updateDistributionHint();
}

function deletePreset(index) {
  const presets = getPresets();
  presets.splice(index, 1);
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  renderPresets();
}

// ---- State ----

let materials = [...BASE_MATERIALS, ...getCustomMaterials()];
let loadItems = [];
let editingIndex = null;
let lastResultData = null;
let calculationHistory = []; // max 3 entries

// ---- DOM ----

const materialSearch = document.getElementById("materialSearch");
const materialSelect = document.getElementById("material");
const resultsEl = document.getElementById("results");
const notesEl = document.getElementById("materialNotes");
const loadItemsEl = document.getElementById("loadItems");
const loadItemsListEl = document.getElementById("loadItemsList");
const loadTotalWeightEl = document.getElementById("loadTotalWeight");
const calculateBtn = document.getElementById("calculateBtn");

// ---- Distribution hints ----

const DISTRIBUTION_HINTS = {
  even: "Load is spread uniformly across the support.",
  "off-center":
    "Load is shifted to one side, concentrating stress. Capacity reduced 25%.",
  "top-heavy":
    "Center of gravity is high, increasing tipping risk. Capacity reduced 40%.",
};

function updateDistributionHint() {
  const val = document.getElementById("distribution").value;
  document.getElementById("distributionHint").textContent =
    DISTRIBUTION_HINTS[val] || "";
}

// ---- Gauge ----

function getEffectiveLimit(supportType, factor) {
  const customLimitVal = parseFloat(
    document.getElementById("customLimit").value,
  );
  const safetyFactorVal = parseFloat(
    document.getElementById("safetyFactor").value,
  );
  const baseLimit =
    supportType === "custom" ? customLimitVal : supportLimits[supportType];
  const sf =
    Number.isFinite(safetyFactorVal) && safetyFactorVal >= 1.0
      ? safetyFactorVal
      : 1.0;
  return (baseLimit * factor) / sf;
}

function updateGauge() {
  const gaugeEl = document.getElementById("gauge");
  const gaugeBar = document.getElementById("gaugeBar");
  const gaugeLabel = document.getElementById("gaugeLabel");
  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;

  if (loadItems.length === 0 || !distribution || !supportType) {
    gaugeEl.hidden = true;
    return;
  }

  if (supportType === "custom") {
    const cl = parseFloat(document.getElementById("customLimit").value);
    if (!Number.isFinite(cl) || cl <= 0) {
      gaugeEl.hidden = true;
      return;
    }
  }

  const totalWeight = loadItems.reduce(
    (sum, { material, quantity }) => sum + material.weightPerUnit * quantity,
    0,
  );
  const factor = DISTRIBUTION_FACTORS[distribution] ?? 1.0;
  const limit = getEffectiveLimit(supportType, factor);

  if (!Number.isFinite(limit) || limit <= 0) {
    gaugeEl.hidden = true;
    return;
  }

  const ratio = totalWeight / limit;
  const pct = Math.min(ratio * 100, 100);

  gaugeBar.style.width = `${pct}%`;
  gaugeBar.className =
    "gauge-bar " +
    (ratio >= 1 ? "gauge-fail" : ratio >= 0.9 ? "gauge-warn" : "gauge-ok");
  gaugeLabel.textContent = `${toDisplay(totalWeight)} / ${toDisplay(limit)}`;
  gaugeEl.hidden = false;
}

// ---- Material notes ----

function getSelectedTypes() {
  return Array.from(document.querySelectorAll(".typeFilter:checked")).map(
    (cb) => cb.value.toLowerCase(),
  );
}

function renderSelectedMaterialNotes() {
  const selectedName = materialSelect.value;
  notesEl.className = "note";
  notesEl.hidden = true;
  notesEl.textContent = "";

  if (!selectedName) {
    renderFavoriteBtn();
    document.getElementById("materialDetailBtn").hidden = true;
    return;
  }

  const m = materials.find((x) => x.name === selectedName);
  let noteText = m?.notes || "No notes.";

  if (lastResultData?.status) {
    const lastName = loadItems[loadItems.length - 1]?.material.name;
    if (lastName === selectedName) {
      if (lastResultData.status === "pass") {
        notesEl.classList.add("result-pass");
        noteText = "Load passes! " + noteText;
      } else {
        notesEl.classList.add("result-fail");
        noteText = "Load fails! " + noteText;
      }
    }
  }

  notesEl.textContent = noteText;
  notesEl.hidden = false;
  renderFavoriteBtn();
  document.getElementById("materialDetailBtn").hidden = false;
}

// ---- Material detail modal ----

function showMaterialModal(material) {
  if (!material) return;
  document.getElementById("modalTitle").textContent = material.name;

  const body = document.getElementById("modalBody");
  body.innerHTML = "";

  const rows = [
    ["Unit", material.unit],
    ["Weight per unit", `${material.weightPerUnit} lbs`],
    ["Type", material.type],
  ];
  if (material.aliases?.length)
    rows.push(["Also known as", material.aliases.join(", ")]);
  if (material.tags?.length) rows.push(["Tags", material.tags.join(", ")]);
  if (material.notes) rows.push(["Notes", material.notes]);

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "modal-row";
    const lbl = document.createElement("span");
    lbl.className = "modal-label";
    lbl.textContent = label;
    const val = document.createElement("span");
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    body.appendChild(row);
  });

  document.getElementById("materialModal").hidden = false;
  document.body.style.overflow = "hidden";
}

function closeMaterialModal() {
  document.getElementById("materialModal").hidden = true;
  document.body.style.overflow = "";
}

// ---- Material select filter ----

function updateMaterialOptions(filter = "") {
  const current = materialSelect.value;
  const selectedTypes = getSelectedTypes();
  const favOnly = document.getElementById("favoritesFilter")?.checked;
  const favs = getFavorites();

  materialSelect.innerHTML = '<option value="">-- Select Material --</option>';

  const qRaw = (filter || "").trim().toLowerCase();
  let filtered = materials;

  if (qRaw) {
    const tokens = qRaw.split(/\s+/).filter(Boolean);
    filtered = materials.filter((m) => {
      const name = (m.name || "").toLowerCase();
      const unit = (m.unit || "").toLowerCase();
      const type = (m.type || "").toLowerCase();
      const aliases = (m.aliases || []).map((a) => a.toLowerCase());
      const tags = (m.tags || []).map((t) => t.toLowerCase());
      return tokens.every(
        (t) =>
          name.includes(t) ||
          unit.includes(t) ||
          type.includes(t) ||
          aliases.some((a) => a.includes(t)) ||
          tags.some((tag) => tag.includes(t)),
      );
    });
  }

  if (selectedTypes.length) {
    filtered = filtered.filter((m) =>
      selectedTypes.includes((m.type || "").toLowerCase()),
    );
  }

  if (favOnly) {
    filtered = filtered.filter((m) => favs.includes(m.name));
  }

  if (current && !filtered.some((m) => m.name === current)) {
    const keep = materials.find((m) => m.name === current);
    if (keep) filtered = [keep, ...filtered];
  }

  // Pin favorites to top when not in favorites-only mode
  if (!favOnly && favs.length > 0) {
    const favItems = filtered.filter((m) => favs.includes(m.name));
    const nonFavItems = filtered.filter((m) => !favs.includes(m.name));

    if (favItems.length > 0) {
      const favGroup = document.createElement("optgroup");
      favGroup.label = "★ Favorites";
      for (const m of favItems) {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.unit})`;
        if (m.name === current) opt.selected = true;
        favGroup.appendChild(opt);
      }
      materialSelect.appendChild(favGroup);

      if (nonFavItems.length > 0) {
        const restGroup = document.createElement("optgroup");
        restGroup.label = "All Materials";
        for (const m of nonFavItems) {
          const opt = document.createElement("option");
          opt.value = m.name;
          opt.textContent = `${m.name} (${m.unit})`;
          if (m.name === current) opt.selected = true;
          restGroup.appendChild(opt);
        }
        materialSelect.appendChild(restGroup);
      }
    } else {
      for (const m of filtered) {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.unit})`;
        if (m.name === current) opt.selected = true;
        materialSelect.appendChild(opt);
      }
    }
  } else {
    for (const m of filtered) {
      const opt = document.createElement("option");
      opt.value = m.name;
      opt.textContent = `${m.name} (${m.unit})`;
      if (m.name === current) opt.selected = true;
      materialSelect.appendChild(opt);
    }
  }

  renderSelectedMaterialNotes();
}

// ---- Load items ----

function updateCalculateBtn() {
  calculateBtn.disabled = loadItems.length === 0;
}

function confirmEdit(index, newQty) {
  if (!Number.isFinite(newQty) || newQty <= 0) {
    showInlineError("addError", "Quantity must be greater than zero.");
    return;
  }
  clearInlineError("addError");
  loadItems[index].quantity = newQty;
  editingIndex = null;
  renderLoadItems();
}

function renderLoadItems() {
  loadItemsListEl.innerHTML = "";
  let total = 0;

  loadItems.forEach(({ material, quantity }, i) => {
    const weight = material.weightPerUnit * quantity;
    total += weight;

    const li = document.createElement("li");
    li.className = "load-item";

    if (editingIndex === i) {
      // Edit mode
      const wrap = document.createElement("div");
      wrap.className = "load-item-edit";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = material.name;

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "0.01";
      input.inputMode = "decimal";
      input.value = quantity;
      input.className = "load-item-qty-input";

      wrap.appendChild(nameSpan);
      wrap.appendChild(input);

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "btn-confirm";
      confirmBtn.textContent = "✓";
      confirmBtn.setAttribute("aria-label", "Confirm edit");
      confirmBtn.addEventListener("click", () =>
        confirmEdit(i, parseFloat(input.value)),
      );

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirmEdit(i, parseFloat(input.value));
        if (e.key === "Escape") {
          editingIndex = null;
          renderLoadItems();
        }
      });

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn-remove";
      cancelBtn.textContent = "✕";
      cancelBtn.setAttribute("aria-label", "Cancel edit");
      cancelBtn.addEventListener("click", () => {
        editingIndex = null;
        renderLoadItems();
      });

      li.appendChild(wrap);
      li.appendChild(confirmBtn);
      li.appendChild(cancelBtn);
      setTimeout(() => input.focus(), 0);
    } else {
      // Display mode
      const span = document.createElement("span");
      span.textContent = `${material.name} × ${quantity} ${material.unit} = ${toDisplay(weight)}`;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn-edit";
      editBtn.textContent = "edit";
      editBtn.setAttribute("aria-label", `Edit ${material.name} quantity`);
      editBtn.addEventListener("click", () => {
        editingIndex = i;
        renderLoadItems();
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-remove";
      removeBtn.textContent = "✕";
      removeBtn.setAttribute("aria-label", `Remove ${material.name}`);
      removeBtn.addEventListener("click", () => removeFromLoad(i));

      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(removeBtn);
    }

    loadItemsListEl.appendChild(li);
  });

  loadTotalWeightEl.textContent = toDisplay(total);
  loadItemsEl.hidden = loadItems.length === 0;
  updateCalculateBtn();
  updateGauge();
}

function addToLoad() {
  clearInlineError("addError");
  const selectedName = materialSelect.value;
  const quantity = parseFloat(document.getElementById("quantity").value);

  if (!selectedName) {
    showInlineError("addError", "Please select a material.");
    return;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    showInlineError("addError", "Please enter a quantity greater than zero.");
    return;
  }

  const m = materials.find((x) => x.name === selectedName);
  if (!m) return;

  loadItems.push({ material: m, quantity });
  renderLoadItems();
  document.getElementById("quantity").value = "";
}

function removeFromLoad(index) {
  if (editingIndex === index) editingIndex = null;
  loadItems.splice(index, 1);
  renderLoadItems();
}

// ---- Custom materials ----

function updateCmWeightLabel() {
  const label = document.querySelector("label[for='cmWeight']");
  if (label) label.textContent = `Weight per Unit (${currentUnit})`;
}

function renderCustomMaterials() {
  const list = document.getElementById("customMaterialsList");
  list.innerHTML = "";
  const customs = getCustomMaterials();
  if (customs.length === 0) return;

  customs.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "custom-material-item";

    const span = document.createElement("span");
    span.textContent = `${m.name} — ${toDisplay(m.weightPerUnit, 2)}/${m.unit} (${m.type})`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-remove";
    btn.textContent = "✕";
    btn.setAttribute("aria-label", `Delete ${m.name}`);
    btn.addEventListener("click", () => deleteCustomMaterial(i));

    li.appendChild(span);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function deleteCustomMaterial(index) {
  const list = getCustomMaterials();
  list.splice(index, 1);
  saveCustomMaterials(list);
  refreshMaterials();
  renderCustomMaterials();
}

// ---- History ----

function addToHistory(data) {
  calculationHistory.unshift({ ...data, timestamp: Date.now() });
  if (calculationHistory.length > 3) calculationHistory.pop();
  renderHistory();
}

function formatTimeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  return `${mins} min ago`;
}

function renderHistory() {
  const section = document.getElementById("historySection");
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  if (calculationHistory.length === 0) {
    section.hidden = true;
    return;
  }

  calculationHistory.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "history-item";

    const statusEl = document.createElement("span");
    statusEl.className = "history-status";
    const nearLimit = entry.safe && entry.ratio > 0.9;
    if (!entry.safe) {
      statusEl.textContent = "FAIL";
      statusEl.classList.add("fail");
    } else if (nearLimit) {
      statusEl.textContent = "WARN";
      statusEl.classList.add("warn");
    } else {
      statusEl.textContent = "PASS";
      statusEl.classList.add("pass");
    }

    const detail = document.createElement("span");
    detail.className = "history-detail";
    detail.textContent = `${toDisplay(entry.totalWeight, 1)} / ${toDisplay(entry.limit, 1)} — ${entry.supportType}`;

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = formatTimeAgo(entry.timestamp);

    li.appendChild(statusEl);
    li.appendChild(detail);
    li.appendChild(time);
    list.appendChild(li);
  });

  section.hidden = false;
}

// Refresh history timestamps every 30 seconds
setInterval(renderHistory, 30000);

// ---- Share load ----

function shareLoad() {
  clearInlineError("calcError");
  if (loadItems.length === 0) {
    showInlineError("calcError", "Add items to the load before sharing.");
    return;
  }

  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;
  const customLimit = document.getElementById("customLimit").value;
  const safetyFactor = document.getElementById("safetyFactor").value;

  const params = new URLSearchParams();
  if (distribution) params.set("d", distribution);
  if (supportType) params.set("s", supportType);
  if (supportType === "custom" && customLimit) params.set("cl", customLimit);
  const sfVal = parseFloat(safetyFactor);
  if (Number.isFinite(sfVal) && sfVal !== 1.0) params.set("sf", safetyFactor);

  loadItems.forEach(({ material, quantity }, i) => {
    params.set(`m${i}`, material.name);
    params.set(`q${i}`, String(quantity));
  });

  const url = `${location.origin}${location.pathname}?${params.toString()}`;
  document.getElementById("shareUrl").textContent = url;
  document.getElementById("qrImage").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
  document.getElementById("qrSection").hidden = false;
}

// ---- CSV export ----

function exportCSV() {
  if (!lastResultData) return;
  const {
    itemResults,
    totalWeight,
    limit,
    ratio,
    safe,
    distribution,
    supportType,
  } = lastResultData;

  const rows = [
    ["Material", "Quantity", "Unit", "Weight (lbs)"],
    ...itemResults.map(({ material, quantity, weight }) => [
      material.name,
      quantity,
      material.unit,
      weight.toFixed(2),
    ]),
    [],
    ["Total Weight (lbs)", totalWeight.toFixed(2)],
    ["Distribution", distribution],
    ["Support", supportType],
    ["Adjusted Limit (lbs)", limit.toFixed(2)],
    ["Load %", `${(ratio * 100).toFixed(0)}%`],
    ["Status", safe ? "PASS" : "OVERLOADED"],
  ];

  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "load-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Load from shared URL ----

function loadFromUrl() {
  const params = new URLSearchParams(location.search);
  if (!params.has("m0")) return;

  const items = [];
  let i = 0;
  while (params.has(`m${i}`)) {
    const name = params.get(`m${i}`);
    const qty = parseFloat(params.get(`q${i}`));
    const mat = materials.find((m) => m.name === name);
    if (mat && Number.isFinite(qty) && qty > 0) {
      items.push({ material: mat, quantity: qty });
    }
    i++;
  }

  if (items.length === 0) return;

  loadItems = items;
  const dist = params.get("d");
  const sup = params.get("s");
  const cl = params.get("cl");
  const sf = params.get("sf");

  if (dist) document.getElementById("distribution").value = dist;
  if (sup) {
    document.getElementById("support").value = sup;
    if (sup === "custom") {
      document.getElementById("customLimitRow").hidden = false;
    }
  }
  if (cl) document.getElementById("customLimit").value = cl;
  if (sf) document.getElementById("safetyFactor").value = sf;

  renderLoadItems();
  if (dist) updateDistributionHint();
  updateGauge();
}

// ---- Results ----

function appendResultRow(label, value) {
  const div = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = label + ": ";
  div.appendChild(strong);
  div.appendChild(document.createTextNode(value));
  resultsEl.appendChild(div);
}

function renderResults(data) {
  const {
    itemResults,
    totalWeight,
    limit,
    ratio,
    safe,
    distribution,
    supportType,
    safetyFactor: sf,
    limitOverride,
  } = data;

  resultsEl.className = "results";
  resultsEl.innerHTML = "";
  resultsEl.hidden = false;
  document.getElementById("resultsEmpty").hidden = true;

  for (const { material, quantity, weight } of itemResults) {
    appendResultRow(
      `${material.name} × ${quantity} ${material.unit}`,
      toDisplay(weight, 2),
    );
  }

  const divider = document.createElement("hr");
  divider.className = "hr";
  resultsEl.appendChild(divider);

  appendResultRow("Total Weight", toDisplay(totalWeight, 2));
  appendResultRow("Distribution", distribution);
  appendResultRow(
    "Support",
    supportType === "custom"
      ? `Custom (${toDisplay(limitOverride, 0)} base)`
      : supportType,
  );
  if (sf && sf > 1.0) appendResultRow("Safety Factor", `${sf}×`);
  appendResultRow("Adjusted Limit", toDisplay(limit, 2));
  appendResultRow(
    "Status",
    `${safe ? "PASS" : "OVERLOADED"} (${(ratio * 100).toFixed(0)}% of limit)`,
  );

  if (safe && ratio > 0.9) {
    const caution = document.createElement("div");
    caution.textContent = "Caution: load is above 90% of the adjusted limit.";
    resultsEl.appendChild(caution);
  }

  if (safe) {
    resultsEl.classList.add(ratio > 0.9 ? "results-warn" : "results-pass");
  } else {
    resultsEl.classList.add("results-fail");
  }

  document.getElementById("copyResultBtn").hidden = false;
  document.getElementById("exportCsvBtn").hidden = false;
}

// ---- Init ----

updateMaterialOptions();
updateSupportLabels();
updateCalculateBtn();
updateCmWeightLabel();
renderCustomMaterials();
renderPresets();
loadFromUrl();

document
  .getElementById("unitLbs")
  .classList.toggle("active", currentUnit === "lbs");
document
  .getElementById("unitKg")
  .classList.toggle("active", currentUnit === "kg");

// ---- Listeners ----

materialSearch.addEventListener("input", () =>
  updateMaterialOptions(materialSearch.value),
);

document
  .querySelectorAll(".typeFilter")
  .forEach((cb) =>
    cb.addEventListener("change", () =>
      updateMaterialOptions(materialSearch.value),
    ),
  );

document
  .getElementById("favoritesFilter")
  .addEventListener("change", () =>
    updateMaterialOptions(materialSearch.value),
  );

materialSelect.addEventListener("change", renderSelectedMaterialNotes);

document.getElementById("addToLoadBtn").addEventListener("click", addToLoad);

document.getElementById("clearLoadBtn").addEventListener("click", () => {
  if (loadItems.length === 0) return;
  if (!confirm("Clear all items from the load?")) return;
  loadItems = [];
  editingIndex = null;
  renderLoadItems();
});

document.getElementById("distribution").addEventListener("change", () => {
  clearInlineError("calcError");
  updateDistributionHint();
  updateGauge();
});

document.getElementById("support").addEventListener("change", () => {
  clearInlineError("calcError");
  const isCustom = document.getElementById("support").value === "custom";
  document.getElementById("customLimitRow").hidden = !isCustom;
  updateGauge();
});

document.getElementById("customLimit").addEventListener("input", updateGauge);
document.getElementById("safetyFactor").addEventListener("input", updateGauge);

document.getElementById("unitLbs").addEventListener("click", () => {
  currentUnit = "lbs";
  localStorage.setItem("loadCalc_unit", "lbs");
  document.getElementById("unitLbs").classList.add("active");
  document.getElementById("unitKg").classList.remove("active");
  updateSupportLabels();
  updateCmWeightLabel();
  renderLoadItems();
  renderCustomMaterials();
  if (lastResultData) renderResults(lastResultData);
});

document.getElementById("unitKg").addEventListener("click", () => {
  currentUnit = "kg";
  localStorage.setItem("loadCalc_unit", "kg");
  document.getElementById("unitKg").classList.add("active");
  document.getElementById("unitLbs").classList.remove("active");
  updateSupportLabels();
  updateCmWeightLabel();
  renderLoadItems();
  renderCustomMaterials();
  if (lastResultData) renderResults(lastResultData);
});

document.getElementById("savePresetBtn").addEventListener("click", () => {
  savePreset(document.getElementById("presetNameInput").value);
});

document.getElementById("copyResultBtn").addEventListener("click", () => {
  const lines = [];
  resultsEl
    .querySelectorAll("div")
    .forEach((div) => lines.push(div.textContent));
  navigator.clipboard.writeText(lines.join("\n")).then(() => {
    const btn = document.getElementById("copyResultBtn");
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = orig;
    }, 2000);
  });
});

document.getElementById("exportCsvBtn").addEventListener("click", exportCSV);

document.getElementById("shareLoadBtn").addEventListener("click", shareLoad);

document.getElementById("copyShareUrlBtn").addEventListener("click", () => {
  const url = document.getElementById("shareUrl").textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("copyShareUrlBtn");
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = orig;
    }, 2000);
  });
});

document.getElementById("toggleFavoriteBtn").addEventListener("click", () => {
  const name = materialSelect.value;
  if (name) toggleFavorite(name);
});

document.getElementById("materialDetailBtn").addEventListener("click", () => {
  const name = materialSelect.value;
  const m = materials.find((x) => x.name === name);
  if (m) showMaterialModal(m);
});

document
  .getElementById("modalClose")
  .addEventListener("click", closeMaterialModal);

document.getElementById("materialModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("materialModal"))
    closeMaterialModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMaterialModal();
});

document
  .getElementById("customMaterialForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    clearInlineError("cmError");

    const name = document.getElementById("cmName").value.trim();
    const unit = document.getElementById("cmUnit").value.trim();
    const rawWeight = parseFloat(document.getElementById("cmWeight").value);
    const type = document.getElementById("cmType").value;
    const notes = document.getElementById("cmNotes").value.trim();

    if (!name || !unit || !Number.isFinite(rawWeight) || rawWeight <= 0) {
      showInlineError(
        "cmError",
        "Please fill in Name, Unit, and a positive Weight per Unit.",
      );
      return;
    }

    if (materials.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      showInlineError("cmError", `A material named "${name}" already exists.`);
      return;
    }

    // Convert kg input to lbs for storage when in kg mode
    const weightPerUnit =
      currentUnit === "kg" ? rawWeight / KG_PER_LB : rawWeight;

    const list = getCustomMaterials();
    list.push({ name, unit, weightPerUnit, type, notes: notes || undefined });
    saveCustomMaterials(list);
    refreshMaterials();
    renderCustomMaterials();
    e.target.reset();
  });

// ---- Calculation ----

document.getElementById("loadForm").addEventListener("submit", (e) => {
  e.preventDefault();

  clearInlineError("calcError");
  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;
  const customLimitVal = parseFloat(
    document.getElementById("customLimit").value,
  );
  const safetyFactorVal = parseFloat(
    document.getElementById("safetyFactor").value,
  );

  if (!distribution || !supportType) {
    showInlineError(
      "calcError",
      "Please select a distribution type and support.",
    );
    return;
  }

  if (
    supportType === "custom" &&
    (!Number.isFinite(customLimitVal) || customLimitVal <= 0)
  ) {
    showInlineError("calcError", "Please enter a positive custom limit.");
    return;
  }

  const options = {};
  if (supportType === "custom") options.limitOverride = customLimitVal;
  if (Number.isFinite(safetyFactorVal) && safetyFactorVal >= 1.0) {
    options.safetyFactor = safetyFactorVal;
  }

  const { itemResults, totalWeight, limit, ratio, safe } = calculateMixedLoad(
    loadItems,
    distribution,
    supportType,
    options,
  );

  lastResultData = {
    itemResults,
    totalWeight,
    limit,
    ratio,
    safe,
    distribution,
    supportType,
    limitOverride: options.limitOverride || null,
    safetyFactor: options.safetyFactor || 1.0,
    status: safe ? "pass" : "fail",
  };

  renderResults(lastResultData);
  addToHistory(lastResultData);
  renderSelectedMaterialNotes();
});
