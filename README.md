# LoadCalc

A fast, lightweight load calculator for construction sites and logistics work. Estimate material weights, check against support limits, and get an instant PASS/OVERLOADED status — no account, no paywall, no dependencies.

---

## Features

**Load building**
- Add multiple materials in a single calculation — mix lumber, gravel, cinder blocks, and more
- Edit or remove individual items without clearing the whole load
- Running weight total updates live as you add items

**Materials**
- Built-in library of common construction materials (lumber, drywall, gravel, steel pipe, and more)
- Multi-token search across name, unit, type, aliases, and tags
- Filter by material type: rigid, loose, or stackable
- Add and save custom materials with your own name, unit, weight, and handling notes

**Safety calculation**
- Three support types: Scaffold (500 lbs), Hoist (1,000 lbs), Truck (5,000 lbs)
- Three distribution types with capacity reduction factors:
  - Even — no reduction
  - Off-Center — 25% reduction
  - Top-Heavy — 40% reduction
- Live gauge showing current load vs. adjusted limit (green / yellow / red)
- Near-limit caution when load exceeds 90% of capacity

**Workflow**
- Guided three-step layout: Select Materials → Set Load Conditions → Calculate
- Calculate button disabled until at least one item is added
- Inline validation errors next to the relevant fields
- Distribution type hint text explaining each option

**Presets**
- Save named load configurations (items + distribution + support) to localStorage
- Load or delete saved presets at any time

**Results**
- Per-item weight breakdown with totals
- Copy result to clipboard with one tap
- Print-friendly layout via browser print (Ctrl+P)

**Units**
- Toggle between lbs and kg — all displays update instantly
- Preference saved to localStorage

---

## Why This Exists

Most load calculation tools are locked behind paywalls or overloaded with features. LoadCalc is a fast, offline-capable alternative for:

- Construction site planning
- Warehouse and logistics work
- Estimating safe scaffold, hoist, or truck loads

---

## How It Works

1. **Select Materials** — search or filter, pick a material, enter a quantity, and tap **+ Add to Load**. Repeat for each material in your load.
2. **Set Load Conditions** — choose how the load is distributed and what it's riding on.
3. **Calculate** — get a full weight breakdown and PASS/OVERLOADED result against the adjusted limit.

---

## Safety Note

Support limits and distribution reduction factors are representative typical values based on common industry references. Always verify against your specific equipment's rated capacity and consult a qualified engineer or supervisor before making load decisions on a job site.

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules, no frameworks)
- [Vitest](https://vitest.dev) for unit tests

---

## Development

```bash
npm install
npm test          # run unit tests
npm run lint      # check for lint errors
npm run lint:fix  # auto-fix lint and formatting
```
