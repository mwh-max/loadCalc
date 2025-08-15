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

const materialSearch = document.getElementById("materialSearch");
const materialSelect = document.getElementById("material");
const resultsEl = document.getElementById("results");

function getSelectedTypes() {
  return Array.from(document.querySelectorAll(".typeFilter:checked")).map(
    (cb) => cb.value.toLowerCase(),
  );
}

function renderSelectedMaterialNotes() {
  const notesEl = document.getElementById("materialNotes");
  const selectedName = materialSelect.value;
  if (!selectedName) {
    notesEl.style.display = "none";
    notesEl.textContent = "";
    return;
  }
  const m = materials.find((x) => x.name === selectedName);
  notesEl.textContent = m?.notes || "No notes.";
  notesEl.style.display = "block";
}

function updateMaterialOptions(filter = "") {
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
      return tokens.every(
        (t) => name.includes(t) || unit.includes(t) || type.includes(t),
      );
    });
  }

  if (selectedTypes.length) {
    filtered = filtered.filter((m) =>
      selectedTypes.includes((m.type || "").toLowerCase()),
    );
  }

  for (const m of filtered) {
    const opt = document.createElement("option");
    opt.value = m.name;
    opt.textContent = `${m.name} (${m.unit})`;
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

  if (
    !selectedMaterial ||
    !Number.isFinite(quantity) ||
    !distribution ||
    !supportType
  ) {
    resultsEl.textContent = "Please fill in all fields.";
    resultsEl.style.display = "block";
    resultsEl.style.background = "#fff3cd";
    resultsEl.style.borderLeft = "4px solid #ffc107";
    return;
  }

  const m = materials.find((x) => x.name === selectedMaterial);
  const baseWeight = (m.weightPerUnit || 0) * quantity;

  let limit = supportLimits[supportType];
  if (distribution === "off-center") limit *= 0.75;
  if (distribution === "top-heavy") limit *= 0.6;

  const safe = baseWeight <= limit;
  const riskColor =
    baseWeight / limit > 1
      ? "#dc3545"
      : baseWeight / limit > 0.9
        ? "#ffc107"
        : "#28a745";

  resultsEl.innerHTML = `
    <div><strong>Total Weight:</strong> ${baseWeight.toFixed(2)} lbs</div>
    <div><strong>Distribution:</strong> ${distribution}</div>
    <div><strong>Support:</strong> ${supportType}</div>
    <div><strong>Adjusted Limit:</strong> ${limit.toFixed(2)} lbs</div>
    <div><strong>Status:</strong> <span style="color:${safe ? "#28a745" : "#dc3545"}">${safe ? "PASS" : "OVERLOADED"}</span></div>
  `;
  resultsEl.style.display = "block";
  resultsEl.style.background = safe ? "#e9f5e9" : "#fcebea";
  resultsEl.style.borderLeft = `4px solid ${riskColor}`;
});
