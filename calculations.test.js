import { describe, it, expect } from "vitest";
import {
  BASE_MATERIALS,
  supportLimits,
  DISTRIBUTION_FACTORS,
  calculateLoad,
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
