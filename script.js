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

// ---- Custom materials (localStorage) ----

const STORAGE_KEY = "loadCalc_customMaterials";
const PRESETS_KEY = "loadCalc_presets";

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
  if (!name.trim()) {
    alert("Please enter a preset name.");
    return;
  }
  if (loadItems.length === 0) {
    alert("Add at least one item to the load before saving a preset.");
    return;
  }
  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;
  const presets = getPresets();
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

  const resolved = preset.items
    .map(({ materialName, quantity }) => {
      const material = materials.find((m) => m.name === materialName);
      return material ? { material, quantity } : null;
    })
    .filter(Boolean);

  if (resolved.length === 0) {
    alert("None of the materials in this preset could be found.");
    return;
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

  const totalWeight = loadItems.reduce(
    (sum, { material, quantity }) => sum + material.weightPerUnit * quantity,
    0,
  );
  const factor = DISTRIBUTION_FACTORS[distribution] ?? 1.0;
  const limit = supportLimits[supportType] * factor;
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

  if (!selectedName) return;

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
}

// ---- Material select filter ----

function updateMaterialOptions(filter = "") {
  const current = materialSelect.value;
  const selectedTypes = getSelectedTypes();

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

  if (current && !filtered.some((m) => m.name === current)) {
    const keep = materials.find((m) => m.name === current);
    if (keep) filtered = [keep, ...filtered];
  }

  for (const m of filtered) {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = `${m.name} (${m.unit})`;
    if (m.name === current) opt.selected = true;
    materialSelect.appendChild(opt);
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

function renderCustomMaterials() {
  const list = document.getElementById("customMaterialsList");
  list.innerHTML = "";
  const customs = getCustomMaterials();
  if (customs.length === 0) return;

  customs.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "custom-material-item";

    const span = document.createElement("span");
    span.textContent = `${m.name} — ${m.weightPerUnit} lbs/${m.unit} (${m.type})`;

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
  appendResultRow("Support", supportType);
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
}

// ---- Init ----

updateMaterialOptions();
updateSupportLabels();
updateCalculateBtn();
renderCustomMaterials();
renderPresets();

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

materialSelect.addEventListener("change", renderSelectedMaterialNotes);

document.getElementById("addToLoadBtn").addEventListener("click", addToLoad);

document.getElementById("clearLoadBtn").addEventListener("click", () => {
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
  updateGauge();
});

document.getElementById("unitLbs").addEventListener("click", () => {
  currentUnit = "lbs";
  localStorage.setItem("loadCalc_unit", "lbs");
  document.getElementById("unitLbs").classList.add("active");
  document.getElementById("unitKg").classList.remove("active");
  updateSupportLabels();
  renderLoadItems();
  if (lastResultData) renderResults(lastResultData);
});

document.getElementById("unitKg").addEventListener("click", () => {
  currentUnit = "kg";
  localStorage.setItem("loadCalc_unit", "kg");
  document.getElementById("unitKg").classList.add("active");
  document.getElementById("unitLbs").classList.remove("active");
  updateSupportLabels();
  renderLoadItems();
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

document
  .getElementById("customMaterialForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("cmName").value.trim();
    const unit = document.getElementById("cmUnit").value.trim();
    const weightPerUnit = parseFloat(document.getElementById("cmWeight").value);
    const type = document.getElementById("cmType").value;
    const notes = document.getElementById("cmNotes").value.trim();

    if (
      !name ||
      !unit ||
      !Number.isFinite(weightPerUnit) ||
      weightPerUnit <= 0
    ) {
      alert("Please fill in Name, Unit, and a positive Weight per Unit.");
      return;
    }

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

  if (!distribution || !supportType) {
    showInlineError(
      "calcError",
      "Please select a distribution type and support.",
    );
    return;
  }

  const { itemResults, totalWeight, limit, ratio, safe } = calculateMixedLoad(
    loadItems,
    distribution,
    supportType,
  );

  lastResultData = {
    itemResults,
    totalWeight,
    limit,
    ratio,
    safe,
    distribution,
    supportType,
    status: safe ? "pass" : "fail",
  };

  renderResults(lastResultData);
  renderSelectedMaterialNotes();
});
