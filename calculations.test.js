import { describe, it, expect } from "vitest";
import {
  BASE_MATERIALS,
  supportLimits,
  DISTRIBUTION_FACTORS,
  calculateLoad,
  calculateMixedLoad,
} from "./calculations.js";

// ---- Data integrity ----

describe("BASE_MATERIALS", () => {
  it("has at least one material", () => {
    expect(BASE_MATERIALS.length).toBeGreaterThan(0);
  });

  it("every material has required fields", () => {
    for (const m of BASE_MATERIALS) {
      expect(typeof m.name).toBe("string");
      expect(typeof m.unit).toBe("string");
      expect(typeof m.weightPerUnit).toBe("number");
      expect(m.weightPerUnit).toBeGreaterThan(0);
      expect(typeof m.type).toBe("string");
    }
  });
});

describe("supportLimits", () => {
  it("defines scaffold, hoist, and truck", () => {
    expect(supportLimits).toHaveProperty("scaffold");
    expect(supportLimits).toHaveProperty("hoist");
    expect(supportLimits).toHaveProperty("truck");
  });

  it("all limits are positive numbers", () => {
    for (const [key, val] of Object.entries(supportLimits)) {
      expect(val, `${key} limit`).toBeGreaterThan(0);
    }
  });
});

describe("DISTRIBUTION_FACTORS", () => {
  it("defines even, off-center, and top-heavy", () => {
    expect(DISTRIBUTION_FACTORS).toHaveProperty("even");
    expect(DISTRIBUTION_FACTORS).toHaveProperty("off-center");
    expect(DISTRIBUTION_FACTORS).toHaveProperty("top-heavy");
  });

  it("even factor is 1.0", () => {
    expect(DISTRIBUTION_FACTORS.even).toBe(1.0);
  });

  it("non-even factors are less than 1.0 (capacity reductions)", () => {
    expect(DISTRIBUTION_FACTORS["off-center"]).toBeLessThan(1.0);
    expect(DISTRIBUTION_FACTORS["top-heavy"]).toBeLessThan(1.0);
  });

  it("top-heavy has a greater reduction than off-center", () => {
    expect(DISTRIBUTION_FACTORS["top-heavy"]).toBeLessThan(
      DISTRIBUTION_FACTORS["off-center"],
    );
  });
});

// ---- calculateLoad ----

const cinder = BASE_MATERIALS.find((m) => m.name === "Cinder Block"); // 35 lbs/each
const gravel = BASE_MATERIALS.find((m) => m.name === "Gravel"); // 100 lbs/cubic ft

describe("calculateLoad — valid inputs", () => {
  it("calculates baseWeight correctly", () => {
    const { baseWeight } = calculateLoad(cinder, 4, "even", "scaffold");
    expect(baseWeight).toBeCloseTo(140); // 35 * 4
  });

  it("applies even distribution (no reduction)", () => {
    const { limit } = calculateLoad(cinder, 1, "even", "scaffold");
    expect(limit).toBeCloseTo(500); // 500 * 1.0
  });

  it("applies off-center reduction (25%)", () => {
    const { limit } = calculateLoad(cinder, 1, "off-center", "scaffold");
    expect(limit).toBeCloseTo(375); // 500 * 0.75
  });

  it("applies top-heavy reduction (40%)", () => {
    const { limit } = calculateLoad(cinder, 1, "top-heavy", "scaffold");
    expect(limit).toBeCloseTo(300); // 500 * 0.6
  });

  it("returns safe=true when load is under limit", () => {
    // 35 lbs on scaffold (500 lb limit) — clearly passes
    const { safe, ratio } = calculateLoad(cinder, 1, "even", "scaffold");
    expect(safe).toBe(true);
    expect(ratio).toBeLessThan(1);
  });

  it("returns safe=false when load exceeds limit", () => {
    // 100 lbs/ft * 6 = 600 lbs > 500 lb scaffold limit
    const { safe, ratio } = calculateLoad(gravel, 6, "even", "scaffold");
    expect(safe).toBe(false);
    expect(ratio).toBeGreaterThan(1);
  });

  it("returns safe=true when load equals limit exactly (ratio=1.0)", () => {
    // 35 lbs * x = 500 → x ≈ 14.286
    const qty = 500 / cinder.weightPerUnit;
    const { safe, ratio } = calculateLoad(cinder, qty, "even", "scaffold");
    expect(ratio).toBeCloseTo(1.0);
    expect(safe).toBe(true);
  });

  it("ratio reflects percentage of limit", () => {
    // 35 lbs on scaffold = 35/500 = 0.07 = 7%
    const { ratio } = calculateLoad(cinder, 1, "even", "scaffold");
    expect(ratio).toBeCloseTo(0.07);
  });

  it("uses hoist limit correctly", () => {
    const { limit } = calculateLoad(cinder, 1, "even", "hoist");
    expect(limit).toBeCloseTo(1000);
  });

  it("uses truck limit correctly", () => {
    const { limit } = calculateLoad(cinder, 1, "even", "truck");
    expect(limit).toBeCloseTo(5000);
  });
});

describe("calculateLoad — edge cases", () => {
  it("works with quantity of 0.01 (very small)", () => {
    const { baseWeight } = calculateLoad(cinder, 0.01, "even", "scaffold");
    expect(baseWeight).toBeCloseTo(0.35);
  });

  it("works with large quantities", () => {
    const { safe } = calculateLoad(gravel, 1000, "even", "truck");
    // 100 * 1000 = 100,000 lbs > 5000 — fails
    expect(safe).toBe(false);
  });

  it("combined: top-heavy on scaffold with borderline load", () => {
    // Limit = 500 * 0.6 = 300 lbs; load = 35 * 9 = 315 lbs — fails
    const { safe, ratio } = calculateLoad(cinder, 9, "top-heavy", "scaffold");
    expect(safe).toBe(false);
    expect(ratio).toBeGreaterThan(1);
  });
});

describe("calculateLoad — invalid inputs", () => {
  it("throws for null material", () => {
    expect(() => calculateLoad(null, 1, "even", "scaffold")).toThrow();
  });

  it("throws for material missing weightPerUnit", () => {
    expect(() => calculateLoad({ name: "X" }, 1, "even", "scaffold")).toThrow();
  });

  it("throws for quantity = 0", () => {
    expect(() => calculateLoad(cinder, 0, "even", "scaffold")).toThrow();
  });

  it("throws for negative quantity", () => {
    expect(() => calculateLoad(cinder, -5, "even", "scaffold")).toThrow();
  });

  it("throws for NaN quantity", () => {
    expect(() => calculateLoad(cinder, NaN, "even", "scaffold")).toThrow();
  });

  it("throws for unknown distribution type", () => {
    expect(() => calculateLoad(cinder, 1, "sideways", "scaffold")).toThrow();
  });

  it("throws for unknown support type", () => {
    expect(() => calculateLoad(cinder, 1, "even", "crane")).toThrow();
  });
});

// ---- calculateMixedLoad ----

describe("calculateMixedLoad — valid inputs", () => {
  it("sums weights from multiple items", () => {
    const items = [
      { material: cinder, quantity: 2 }, // 70 lbs
      { material: gravel, quantity: 1 }, // 100 lbs
    ];
    const { totalWeight } = calculateMixedLoad(items, "even", "truck");
    expect(totalWeight).toBeCloseTo(170);
  });

  it("single item matches calculateLoad result", () => {
    const items = [{ material: cinder, quantity: 4 }];
    const mixed = calculateMixedLoad(items, "even", "scaffold");
    const single = calculateLoad(cinder, 4, "even", "scaffold");
    expect(mixed.totalWeight).toBeCloseTo(single.baseWeight);
    expect(mixed.limit).toBeCloseTo(single.limit);
    expect(mixed.ratio).toBeCloseTo(single.ratio);
    expect(mixed.safe).toBe(single.safe);
  });

  it("applies distribution factor to combined weight", () => {
    const items = [{ material: cinder, quantity: 1 }]; // 35 lbs
    const { limit } = calculateMixedLoad(items, "top-heavy", "scaffold");
    expect(limit).toBeCloseTo(300); // 500 * 0.6
  });

  it("returns itemResults with per-item weight", () => {
    const items = [
      { material: cinder, quantity: 2 },
      { material: gravel, quantity: 3 },
    ];
    const { itemResults } = calculateMixedLoad(items, "even", "truck");
    expect(itemResults[0].weight).toBeCloseTo(70); // 35 * 2
    expect(itemResults[1].weight).toBeCloseTo(300); // 100 * 3
  });

  it("passes when combined load is under limit", () => {
    const items = [
      { material: cinder, quantity: 1 }, // 35 lbs
      { material: cinder, quantity: 1 }, // 35 lbs — total 70 lbs < 500
    ];
    const { safe } = calculateMixedLoad(items, "even", "scaffold");
    expect(safe).toBe(true);
  });

  it("fails when combined load exceeds limit", () => {
    const items = [
      { material: gravel, quantity: 3 }, // 300 lbs
      { material: gravel, quantity: 3 }, // 300 lbs — total 600 > 500
    ];
    const { safe } = calculateMixedLoad(items, "even", "scaffold");
    expect(safe).toBe(false);
  });

  it("fails when combined load exceeds off-center limit but not base limit", () => {
    // 350 lbs < 500 (base) but > 375 (off-center limit)
    const items = [{ material: gravel, quantity: 3.8 }]; // 380 lbs
    const { safe: evenSafe } = calculateMixedLoad(items, "even", "scaffold");
    const { safe: offCenterSafe } = calculateMixedLoad(
      items,
      "off-center",
      "scaffold",
    );
    expect(evenSafe).toBe(true);
    expect(offCenterSafe).toBe(false);
  });
});

describe("calculateLoad — limitOverride and safetyFactor options", () => {
  it("uses limitOverride when supportType is custom", () => {
    const { limit } = calculateLoad(cinder, 1, "even", "custom", {
      limitOverride: 800,
    });
    expect(limit).toBeCloseTo(800);
  });

  it("applies distribution factor to custom limit", () => {
    const { limit } = calculateLoad(cinder, 1, "off-center", "custom", {
      limitOverride: 1000,
    });
    expect(limit).toBeCloseTo(750); // 1000 * 0.75
  });

  it("applies safetyFactor to reduce effective limit", () => {
    const { limit } = calculateLoad(cinder, 1, "even", "scaffold", {
      safetyFactor: 2.0,
    });
    expect(limit).toBeCloseTo(250); // 500 / 2.0
  });

  it("safetyFactor and distribution factor both apply", () => {
    const { limit } = calculateLoad(cinder, 1, "off-center", "scaffold", {
      safetyFactor: 1.5,
    });
    expect(limit).toBeCloseTo(250); // (500 * 0.75) / 1.5
  });

  it("throws for custom support without limitOverride", () => {
    expect(() => calculateLoad(cinder, 1, "even", "custom")).toThrow();
  });

  it("throws for custom support with zero limitOverride", () => {
    expect(() =>
      calculateLoad(cinder, 1, "even", "custom", { limitOverride: 0 }),
    ).toThrow();
  });

  it("throws for safetyFactor less than 1.0", () => {
    expect(() =>
      calculateLoad(cinder, 1, "even", "scaffold", { safetyFactor: 0.5 }),
    ).toThrow();
  });
});

describe("calculateMixedLoad — limitOverride and safetyFactor options", () => {
  it("uses custom limit with limitOverride", () => {
    const items = [{ material: cinder, quantity: 1 }];
    const { limit } = calculateMixedLoad(items, "even", "custom", {
      limitOverride: 600,
    });
    expect(limit).toBeCloseTo(600);
  });

  it("applies safetyFactor to mixed load", () => {
    const items = [{ material: cinder, quantity: 1 }];
    const { limit } = calculateMixedLoad(items, "even", "scaffold", {
      safetyFactor: 1.5,
    });
    expect(limit).toBeCloseTo(333.33); // 500 / 1.5
  });

  it("throws for custom support without limitOverride", () => {
    const items = [{ material: cinder, quantity: 1 }];
    expect(() => calculateMixedLoad(items, "even", "custom")).toThrow();
  });

  it("throws for safetyFactor less than 1.0", () => {
    const items = [{ material: cinder, quantity: 1 }];
    expect(() =>
      calculateMixedLoad(items, "even", "scaffold", { safetyFactor: 0.8 }),
    ).toThrow();
  });
});

describe("calculateMixedLoad — invalid inputs", () => {
  it("throws for empty items array", () => {
    expect(() => calculateMixedLoad([], "even", "scaffold")).toThrow();
  });

  it("throws for non-array items", () => {
    expect(() => calculateMixedLoad(null, "even", "scaffold")).toThrow();
  });

  it("throws for item with invalid material", () => {
    expect(() =>
      calculateMixedLoad([{ material: null, quantity: 1 }], "even", "scaffold"),
    ).toThrow();
  });

  it("throws for item with zero quantity", () => {
    expect(() =>
      calculateMixedLoad(
        [{ material: cinder, quantity: 0 }],
        "even",
        "scaffold",
      ),
    ).toThrow();
  });

  it("throws for item with negative quantity", () => {
    expect(() =>
      calculateMixedLoad(
        [{ material: cinder, quantity: -1 }],
        "even",
        "scaffold",
      ),
    ).toThrow();
  });

  it("throws for unknown distribution type", () => {
    expect(() =>
      calculateMixedLoad(
        [{ material: cinder, quantity: 1 }],
        "diagonal",
        "scaffold",
      ),
    ).toThrow();
  });

  it("throws for unknown support type", () => {
    expect(() =>
      calculateMixedLoad([{ material: cinder, quantity: 1 }], "even", "crane"),
    ).toThrow();
  });
});
