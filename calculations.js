// ---- Pure calculation logic (no DOM dependencies) ----

export const BASE_MATERIALS = [
  // ---- Lumber & Sheet Goods ----
  {
    name: "Lumber (2x4)",
    unit: "ft",
    weightPerUnit: 1.2,
    type: "rigid",
    notes: "Stack flat to prevent roll-off.",
    tags: ["wood", "framing"],
  },
  {
    name: "Drywall Sheet",
    unit: "each",
    weightPerUnit: 50,
    type: "rigid",
    notes: "Edges chip easily; support vertically.",
    aliases: ["gypsum board", "sheetrock"],
    tags: ["wall", "finishing"],
  },
  {
    name: "Plywood Sheet",
    unit: "each",
    weightPerUnit: 60,
    type: "rigid",
    notes: "Store flat to prevent bowing.",
    tags: ["wood", "sheathing"],
  },
  {
    name: "OSB Panel",
    unit: "each",
    weightPerUnit: 56,
    type: "rigid",
    notes: "Store flat and keep dry; swells when wet.",
    aliases: ["oriented strand board"],
    tags: ["wood", "sheathing", "subfloor"],
  },
  // ---- Masonry ----
  {
    name: "Cinder Block",
    unit: "each",
    weightPerUnit: 35,
    type: "stackable",
    notes: "Avoid stacking above shoulder height.",
    aliases: ["CMU", "concrete masonry unit"],
    tags: ["masonry", "block"],
  },
  {
    name: "Brick",
    unit: "each",
    weightPerUnit: 4.5,
    type: "stackable",
    notes: "Stack on pallets; use caution with loose stacks.",
    tags: ["masonry", "wall"],
  },
  {
    name: "Paver",
    unit: "each",
    weightPerUnit: 8,
    type: "stackable",
    notes: "Stack no more than 4 ft high.",
    aliases: ["brick paver", "patio stone"],
    tags: ["masonry", "landscaping"],
  },
  {
    name: "Mortar Bag (60 lb)",
    unit: "each",
    weightPerUnit: 60,
    type: "stackable",
    notes: "Keep dry; stack no more than 5 bags high.",
    aliases: ["mortar", "cement bag"],
    tags: ["masonry", "concrete"],
  },
  // ---- Concrete ----
  {
    name: "Concrete Mix Bag (60 lb)",
    unit: "each",
    weightPerUnit: 60,
    type: "stackable",
    notes: "Keep dry; stack no more than 5 bags high.",
    aliases: ["quikrete 60", "concrete bag"],
    tags: ["concrete", "masonry"],
  },
  {
    name: "Concrete Mix Bag (80 lb)",
    unit: "each",
    weightPerUnit: 80,
    type: "stackable",
    notes: "Keep dry; stack no more than 4 bags high.",
    aliases: ["quikrete 80", "concrete bag"],
    tags: ["concrete", "masonry"],
  },
  {
    name: "Wet Concrete",
    unit: "cubic ft",
    weightPerUnit: 150,
    type: "loose",
    notes: "Pours and shifts; use proper forms and chutes.",
    tags: ["concrete"],
  },
  // ---- Aggregate & Fill ----
  {
    name: "Gravel",
    unit: "cubic ft",
    weightPerUnit: 100,
    type: "loose",
    notes: "Shifts; secure containers.",
    tags: ["aggregate", "landscaping"],
  },
  {
    name: "Sand",
    unit: "cubic ft",
    weightPerUnit: 100,
    type: "loose",
    notes: "Shifts when dry; heavier when wet.",
    tags: ["aggregate", "masonry"],
  },
  {
    name: "Topsoil",
    unit: "cubic ft",
    weightPerUnit: 75,
    type: "loose",
    notes: "Weight varies with moisture content.",
    tags: ["landscaping", "fill"],
  },
  {
    name: "Mulch",
    unit: "cubic ft",
    weightPerUnit: 20,
    type: "loose",
    notes: "Light but bulky; secure against wind.",
    tags: ["landscaping"],
  },
  // ---- Roofing ----
  {
    name: "Shingle Bundle",
    unit: "each",
    weightPerUnit: 70,
    type: "stackable",
    notes: "Stack flat on roof deck; do not exceed 4 bundles per stack.",
    aliases: ["asphalt shingles", "roofing shingles"],
    tags: ["roofing"],
  },
  {
    name: "Roofing Felt Roll",
    unit: "each",
    weightPerUnit: 25,
    type: "rigid",
    notes: "Keep dry and rolled until use.",
    aliases: ["tar paper", "underlayment"],
    tags: ["roofing"],
  },
  // ---- MEP ----
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
  {
    name: "Copper Pipe",
    unit: "ft",
    weightPerUnit: 0.65,
    type: "rigid",
    notes: "Soft; avoid kinking. Store horizontally.",
    aliases: ["copper tubing"],
    tags: ["plumbing", "MEP", "metal"],
  },
  {
    name: "Steel Conduit",
    unit: "ft",
    weightPerUnit: 0.85,
    type: "rigid",
    notes: "Bundle and strap securely for transport.",
    aliases: ["EMT", "electrical conduit"],
    tags: ["electrical", "MEP", "metal"],
  },
  {
    name: "Duct Section",
    unit: "each",
    weightPerUnit: 15,
    type: "rigid",
    notes: "Lightweight but awkward; protect edges from crushing.",
    aliases: ["HVAC duct", "sheet metal duct"],
    tags: ["HVAC", "MEP"],
  },
  // ---- Finishing ----
  {
    name: "Ceramic Tile",
    unit: "sq ft",
    weightPerUnit: 4,
    type: "stackable",
    notes: "Fragile; store flat and padded.",
    aliases: ["floor tile", "wall tile"],
    tags: ["finishing", "tile"],
  },
  {
    name: "Hardwood Flooring",
    unit: "sq ft",
    weightPerUnit: 2.5,
    type: "rigid",
    notes: "Keep dry; acclimate to site conditions before install.",
    aliases: ["wood flooring", "hardwood"],
    tags: ["finishing", "flooring"],
  },
];

// Representative typical values — MUST be verified against your specific
// equipment rated capacity before use on a job site.
//
// Scaffold 500 lbs: Light-duty scaffold platform per OSHA 29 CFR 1926.451(a)(1);
//   common single-bay rated maximum for light-duty classification.
// Hoist 1000 lbs: Typical rated capacity for small construction material hoists;
//   confirm on equipment nameplate.
// Truck 5000 lbs: Approximate payload for a 1-ton pickup; check vehicle placard
//   for the actual GVWR-based payload limit.
export const supportLimits = { scaffold: 500, hoist: 1000, truck: 5000 };

// Capacity reduction factors by load distribution type.
// These are conservative rule-of-thumb values. Verify with a qualified engineer
// for your specific application.
//
// off-center 0.75: 25% reduction — uneven lateral stress concentrates load on
//   one side of the support structure.
// top-heavy 0.6: 40% reduction — raised center of gravity increases tipping
//   moment and reduces effective rated capacity.
export const DISTRIBUTION_FACTORS = {
  even: 1.0,
  "off-center": 0.75,
  "top-heavy": 0.6,
};

/**
 * Calculate load safety for a given material, quantity, and support setup.
 *
 * @param {object} material - Material object from BASE_MATERIALS
 * @param {number} quantity - Quantity (must be > 0)
 * @param {string} distribution - One of: "even", "off-center", "top-heavy"
 * @param {string} supportType - One of: "scaffold", "hoist", "truck"
 * @returns {{ baseWeight: number, limit: number, ratio: number, safe: boolean }}
 * @throws {Error} If any argument is invalid
 */
export function calculateLoad(material, quantity, distribution, supportType) {
  if (!material || typeof material.weightPerUnit !== "number") {
    throw new Error("Invalid material.");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive number.");
  }
  if (!(distribution in DISTRIBUTION_FACTORS)) {
    throw new Error(`Unknown distribution type: "${distribution}".`);
  }
  if (!(supportType in supportLimits)) {
    throw new Error(`Unknown support type: "${supportType}".`);
  }

  const baseWeight = material.weightPerUnit * quantity;
  const factor = DISTRIBUTION_FACTORS[distribution];
  const limit = supportLimits[supportType] * factor;
  const ratio = baseWeight / limit;
  const safe = ratio <= 1;

  return { baseWeight, limit, ratio, safe };
}

/**
 * Calculate load safety for a mixed list of materials against a single support.
 *
 * @param {Array<{material: object, quantity: number}>} items
 * @param {string} distribution - One of: "even", "off-center", "top-heavy"
 * @param {string} supportType - One of: "scaffold", "hoist", "truck"
 * @returns {{ itemResults: Array, totalWeight: number, limit: number, ratio: number, safe: boolean }}
 * @throws {Error} If any argument is invalid
 */
export function calculateMixedLoad(items, distribution, supportType) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one item is required.");
  }
  if (!(distribution in DISTRIBUTION_FACTORS)) {
    throw new Error(`Unknown distribution type: "${distribution}".`);
  }
  if (!(supportType in supportLimits)) {
    throw new Error(`Unknown support type: "${supportType}".`);
  }

  const itemResults = items.map(({ material, quantity }) => {
    if (!material || typeof material.weightPerUnit !== "number") {
      throw new Error("Invalid material in load.");
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("All quantities must be positive numbers.");
    }
    return { material, quantity, weight: material.weightPerUnit * quantity };
  });

  const totalWeight = itemResults.reduce((sum, r) => sum + r.weight, 0);
  const factor = DISTRIBUTION_FACTORS[distribution];
  const limit = supportLimits[supportType] * factor;
  const ratio = totalWeight / limit;
  const safe = ratio <= 1;

  return { itemResults, totalWeight, limit, ratio, safe };
}
