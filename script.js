const materials = [
  { name: "Lumber (2x4)", unit: "ft", weightPerUnit: 1.2, type: "rigid" },
  { name: "Cinder Block", unit: "each", weightPerUnit: 35, type: "stackable" },
  { name: "Drywall Sheet", unit: "each", weightPerUnit: 50, type: "rigid" },
  { name: "Gravel", unit: "cubic ft", weightPerUnit: 100, type: "loose" },
  { name: "Plywood Sheet", unit: "each", weightPerUnit: 60, type: "rigid" },
];

const supportLimits = {
  scaffold: 500,
  hoist: 1000,
  truck: 5000,
};

const materialSearch = document.getElementById("materialSearch");
const materialSelect = document.getElementById("material");

function updateMaterialOptions(filter = "") {
  materialSelect.innerHTML = '<option value="">-- Select Material --</option>';
  const filtered = materials.filter((material) =>
    material.name.toLowerCase().includes(filter.toLowerCase()),
  );
  filtered.forEach((material) => {
    const option = document.createElement("option");
    option.value = material.name;
    option.textContent = `${material.name} (${material.unit})`;
    materialSelect.appendChild(option);
  });
}

updateMaterialOptions();

materialSearch.addEventListener("input", () => {
  updateMaterialOptions(materialSearch.value);
});

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lastLoadCalc");
  if (saved) {
    const data = JSON.parse(saved);
    const resultBox = document.getElementById("results");

    resultBox.innerHTML = `
      <div style="margin-bottom: 0.5rem;"><em>Last check recovered:</em></div>
      <strong>Material:</strong> ${data.material}<br>
      <strong>Quantity:</strong> ${data.quantity}<br>
      <strong>Support:</strong> ${data.supportType}<br>
      <strong>Distribution:</strong> ${data.distribution}<br>
      <strong>Total Weight:</strong> ${data.baseWeight.toFixed(2)} lbs<br>
      <strong>Adjusted Limit:</strong> ${data.adjustedLimit.toFixed(2)} lbs<br>
      <strong>Status:</strong> <span style="color:${
        data.status === "PASS" ? "green" : "red"
      }">${data.status}</span><br>
      ${data.warning ? `<div class="warning">${data.warning}</div>` : ""}
    `;
    resultBox.style.background = data.status === "PASS" ? "#e9f5e9" : "#fcebea";
    resultBox.style.borderLeftColor =
      data.status === "PASS" ? "#28a745" : "#dc3545";
    resultBox.style.display = "block";
  }
});

document.getElementById("loadForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const selectedMaterial = materialSelect.value;
  const quantity = parseFloat(document.getElementById("quantity").value);
  const supportType = document.getElementById("support").value;
  const distribution = document.getElementById("distribution").value;
  const resultBox = document.getElementById("results");

  if (!selectedMaterial || isNaN(quantity) || !supportType || !distribution) {
    resultBox.textContent = "Please fill in all fields.";
    resultBox.style.display = "block";
    resultBox.style.background = "#fff3cd";
    resultBox.style.borderLeftColor = "#ffc107";
    return;
  }

  const material = materials.find((m) => m.name === selectedMaterial);
  const baseWeight = material.weightPerUnit * quantity;

  let adjustedLimit = supportLimits[supportType];
  if (distribution === "off-center") adjustedLimit *= 0.75;
  if (distribution === "top-heavy") adjustedLimit *= 0.6;

  const percentUsed = baseWeight / adjustedLimit;
  let riskLevel = "green";
  if (percentUsed > 0.9 && percentUsed <= 1) riskLevel = "yellow";
  else if (percentUsed > 1) riskLevel = "red";

  const safe = baseWeight <= adjustedLimit;

  let warning = "";
  if (material.type === "loose" && distribution === "top-heavy") {
    warning = "⚠️ Loose materials with top-heavy loads may shift dangerously.";
  }

  resultBox.innerHTML = `
    <strong>Total Weight:</strong> ${baseWeight.toFixed(2)} lbs<br>
    <strong>Distribution:</strong> ${distribution}<br>
    <strong>Support:</strong> ${
      supportType.charAt(0).toUpperCase() + supportType.slice(1)
    }<br>
    <strong>Adjusted Limit:</strong> ${adjustedLimit.toFixed(2)} lbs<br>
    <strong>Status:</strong> <span style="color:${safe ? "green" : "red"}">${
      safe ? "PASS" : "OVERLOADED"
    }
      </span><br>
    ${warning ? `<div class="warning">${warning}</div>` : ""}
    <div class="scale-bar scale-${riskLevel}"></div>
  `;

  resultBox.style.background = safe ? "#e9f5e9" : "#fcebea";
  resultBox.style.borderLeftColor = safe ? "#28a745" : "#dc3545";
  resultBox.style.display = "block";

  const resultData = {
    material: selectedMaterial,
    quantity,
    supportType,
    distribution,
    baseWeight,
    adjustedLimit,
    status: safe ? "PASS" : "OVERLOADED",
    warning,
  };
  localStorage.setItem("lastLoadCalc", JSON.stringify(resultData));

  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
});
