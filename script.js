// ---- Load Calculator ----

import { BASE_MATERIALS, calculateMixedLoad } from "./calculations.js";

// ---- Custom materials (localStorage) ----

const STORAGE_KEY = "loadCalc_customMaterials";

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

// ---- State ----

let materials = [...BASE_MATERIALS, ...getCustomMaterials()];
let loadItems = []; // Array of { material, quantity }
let lastResult = null; // Last calculation status for notes display

// ---- DOM ----

const materialSearch = document.getElementById("materialSearch");
const materialSelect = document.getElementById("material");
const resultsEl = document.getElementById("results");
const notesEl = document.getElementById("materialNotes");
const loadItemsEl = document.getElementById("loadItems");
const loadItemsListEl = document.getElementById("loadItemsList");
const loadTotalWeightEl = document.getElementById("loadTotalWeight");

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

  if (lastResult?.materialName === selectedName) {
    if (lastResult.status === "pass") {
      notesEl.classList.add("result-pass");
      noteText = "Load passes! " + noteText;
    } else if (lastResult.status === "fail") {
      notesEl.classList.add("result-fail");
      noteText = "Load fails! " + noteText;
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

function renderLoadItems() {
  loadItemsListEl.innerHTML = "";

  let total = 0;
  loadItems.forEach(({ material, quantity }, i) => {
    const weight = material.weightPerUnit * quantity;
    total += weight;

    const li = document.createElement("li");
    li.className = "load-item";

    const span = document.createElement("span");
    span.textContent = `${material.name} × ${quantity} ${material.unit} = ${weight.toFixed(1)} lbs`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-remove";
    btn.textContent = "✕";
    btn.setAttribute("aria-label", `Remove ${material.name}`);
    btn.addEventListener("click", () => removeFromLoad(i));

    li.appendChild(span);
    li.appendChild(btn);
    loadItemsListEl.appendChild(li);
  });

  loadTotalWeightEl.textContent = total.toFixed(1);
  loadItemsEl.hidden = loadItems.length === 0;
}

function addToLoad() {
  const selectedName = materialSelect.value;
  const quantity = parseFloat(document.getElementById("quantity").value);

  if (!selectedName) {
    alert("Please select a material.");
    return;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    alert("Please enter a quantity greater than zero.");
    return;
  }

  const m = materials.find((x) => x.name === selectedName);
  if (!m) return;

  loadItems.push({ material: m, quantity });
  renderLoadItems();

  // Clear quantity field for the next item
  document.getElementById("quantity").value = "";
}

function removeFromLoad(index) {
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

// ---- Helpers ----

function setResultsWarn(message) {
  resultsEl.classList.add("results-warn");
  const div = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = "Status: ";
  div.appendChild(strong);
  div.appendChild(document.createTextNode(message));
  resultsEl.appendChild(div);
}

function appendResultRow(label, value) {
  const div = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = label + ": ";
  div.appendChild(strong);
  div.appendChild(document.createTextNode(value));
  resultsEl.appendChild(div);
}

// ---- Init ----

updateMaterialOptions();
renderCustomMaterials();

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
  renderLoadItems();
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

  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;

  resultsEl.className = "results";
  resultsEl.hidden = false;
  resultsEl.innerHTML = "";

  if (loadItems.length === 0) {
    setResultsWarn("Add at least one item to the load before calculating.");
    return;
  }

  if (!distribution || !supportType) {
    setResultsWarn("Please select a distribution type and support.");
    return;
  }

  const { itemResults, totalWeight, limit, ratio, safe } = calculateMixedLoad(
    loadItems,
    distribution,
    supportType,
  );

  // Item breakdown
  for (const { material, quantity, weight } of itemResults) {
    appendResultRow(
      `${material.name} × ${quantity} ${material.unit}`,
      `${weight.toFixed(2)} lbs`,
    );
  }

  // Summary
  const divider = document.createElement("hr");
  divider.className = "hr";
  resultsEl.appendChild(divider);

  appendResultRow("Total Weight", `${totalWeight.toFixed(2)} lbs`);
  appendResultRow("Distribution", distribution);
  appendResultRow("Support", supportType);
  appendResultRow("Adjusted Limit", `${limit.toFixed(2)} lbs`);
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

  // Store status for the last material added (for notes display)
  const lastItem = loadItems[loadItems.length - 1];
  lastResult = {
    materialName: lastItem.material.name,
    status: safe ? "pass" : "fail",
  };
  renderSelectedMaterialNotes();
});
