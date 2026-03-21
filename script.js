// ---- Load Calculator ----

import {
  BASE_MATERIALS,
  supportLimits,
  DISTRIBUTION_FACTORS,
  calculateLoad,
} from "./calculations.js";

let materials = [...BASE_MATERIALS];

// Last calculation result — stored separately to avoid mutating material data
let lastResult = null;

// DOM
const materialSearch = document.getElementById("materialSearch");
const materialSelect = document.getElementById("material");
const resultsEl = document.getElementById("results");
const notesEl = document.getElementById("materialNotes");

function getSelectedTypes() {
  return Array.from(document.querySelectorAll(".typeFilter:checked")).map(
    (cb) => cb.value.toLowerCase(),
  );
}

function renderSelectedMaterialNotes() {
  const selectedName = materialSelect.value;
  // Reset state
  notesEl.className = "note";
  notesEl.hidden = true;
  notesEl.textContent = "";

  if (!selectedName) return;

  const m = materials.find((x) => x.name === selectedName);
  let noteText = m?.notes || "No notes.";

  // Reflect last calculation result if it matches the selected material
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

// Initial render
updateMaterialOptions();

// Listeners
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

// Helpers
function setResultsWarn(message) {
  resultsEl.classList.add("results-warn");
  const div = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = "Status: ";
  div.appendChild(strong);
  div.appendChild(document.createTextNode(message));
  resultsEl.appendChild(div);
}

// Calculation
document.getElementById("loadForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedMaterial = materialSelect.value;
  const quantity = parseFloat(document.getElementById("quantity").value);
  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;

  // Reset results
  resultsEl.className = "results";
  resultsEl.hidden = false;
  resultsEl.innerHTML = "";

  if (
    !selectedMaterial ||
    !Number.isFinite(quantity) ||
    !distribution ||
    !supportType
  ) {
    setResultsWarn("Please fill in all fields.");
    return;
  }

  if (quantity <= 0) {
    setResultsWarn("Quantity must be greater than zero.");
    return;
  }

  const m = materials.find((x) => x.name === selectedMaterial);
  if (!m) {
    setResultsWarn("Selected material not found. Please select a valid material.");
    return;
  }

  const { baseWeight, limit, ratio, safe } = calculateLoad(
    m,
    quantity,
    distribution,
    supportType,
  );

  // Build result rows using textContent to avoid XSS
  const rows = [
    ["Total Weight", `${baseWeight.toFixed(2)} lbs (${quantity} ${m.unit})`],
    ["Distribution", distribution],
    ["Support", supportType],
    ["Adjusted Limit", `${limit.toFixed(2)} lbs`],
    [
      "Status",
      `${safe ? "PASS" : "OVERLOADED"} (${(ratio * 100).toFixed(0)}% of limit)`,
    ],
  ];
  for (const [label, value] of rows) {
    const div = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = label + ": ";
    div.appendChild(strong);
    div.appendChild(document.createTextNode(value));
    resultsEl.appendChild(div);
  }

  if (safe) {
    resultsEl.classList.add(ratio > 0.9 ? "results-warn" : "results-pass");
  } else {
    resultsEl.classList.add("results-fail");
  }

  // Store result status separately — do not mutate material data
  lastResult = { materialName: selectedMaterial, status: safe ? "pass" : "fail" };
  renderSelectedMaterialNotes();
});
