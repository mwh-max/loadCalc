// ---- Minimal baseline ----

const BASE_MATERIALS = [
  {
    name: "Lumber (2x4)",
    unit: "ft",
    weightPerUnit: 1.2,
    type: "rigid",
    notes: "Stack flat to prevent roll-off.",
  },
  {
    name: "Cinder Block",
    unit: "each",
    weightPerUnit: 35,
    type: "stackable",
    notes: "Avoid stacking above shoulder height.",
  },
  {
    name: "Drywall Sheet",
    unit: "each",
    weightPerUnit: 50,
    type: "rigid",
    notes: "Edges chip easily; support vertically.",
  },
  {
    name: "Gravel",
    unit: "cubic ft",
    weightPerUnit: 100,
    type: "loose",
    notes: "Shifts; secure containers.",
  },
  {
    name: "Plywood Sheet",
    unit: "each",
    weightPerUnit: 60,
    type: "rigid",
    notes: "Store flat to prevent bowing.",
  },
  {
    name: "Steel Pipe",
    unit: "ft",
    weightPerUnit: 2.5,
    type: "rigid",
    notes:
      "Wear gloves; edges can be sharp. Store horizontally to prevent rolling.",
    aliases: ["metal pipe", "tubing"],
    tags: ["metal", "construction", "plumbing"],
  },
];

let materials = [...BASE_MATERIALS];

const supportLimits = { scaffold: 500, hoist: 1000, truck: 5000 };

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

  // If previous calc stored a status on the material, reflect it
  if (m?.status === "pass") {
    notesEl.classList.add("result-pass");
    noteText = "Load passes! " + noteText;
  } else if (m?.status === "fail") {
    notesEl.classList.add("result-fail");
    noteText = "Load fails! " + noteText;
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

// initial
updateMaterialOptions();

// listeners
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

// calc
document.getElementById("loadForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedMaterial = materialSelect.value;
  const quantity = parseFloat(document.getElementById("quantity").value);
  const distribution = document.getElementById("distribution").value;
  const supportType = document.getElementById("support").value;

  // Reset results
  resultsEl.className = "results";
  resultsEl.hidden = false;

  if (
    !selectedMaterial ||
    !Number.isFinite(quantity) ||
    !distribution ||
    !supportType
  ) {
    resultsEl.classList.add("results-warn");
    resultsEl.innerHTML =
      "<div><strong>Status:</strong> Please fill in all fields.</div>";
    return;
  }

  const m = materials.find((x) => x.name === selectedMaterial);
  const baseWeight = (m.weightPerUnit || 0) * quantity;

  let limit = supportLimits[supportType];
  if (distribution === "off-center") limit *= 0.75;
  if (distribution === "top-heavy") limit *= 0.6;

  const ratio = baseWeight / limit;
  const safe = ratio <= 1;

  resultsEl.innerHTML = `
    <div><strong>Total Weight:</strong> ${baseWeight.toFixed(2)} lbs</div>
    <div><strong>Distribution:</strong> ${distribution}</div>
    <div><strong>Support:</strong> ${supportType}</div>
    <div><strong>Adjusted Limit:</strong> ${limit.toFixed(2)} lbs</div>
    <div><strong>Status:</strong> <span>${safe ? "PASS" : "OVERLOADED"}</span> (${(
      ratio * 100
    ).toFixed(0)}% of limit)</div>
  `;

  // Apply visual state via classes only
  if (safe) {
    resultsEl.classList.add(ratio > 0.9 ? "results-warn" : "results-pass");
  } else {
    resultsEl.classList.add("results-fail");
  }

  // Store status back onto material to reflect in notes (optional UX)
  delete m.status;
  m.status = safe ? "pass" : "fail";
  renderSelectedMaterialNotes();
});
