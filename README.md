# LoadCalc

A fast, lightweight load calculator for construction sites and logistics work. Estimate material weights, check against support limits, and get an instant PASS/OVERLOADED status — no account, no paywall, no dependencies.

---

## Features

**Load building**
- Add multiple materials in a single calculation — mix lumber, gravel, cinder blocks, and more
- Edit or remove individual items without clearing the whole load
- Load Items list grouped inside Step 1, directly below the Add to Load button
- Running weight total and Load vs. Limit gauge displayed in a Live Summary card inside Step 1
- Empty state placeholder shown when no items have been added; Clear all hidden until items exist

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
- Distribution and Support dropdowns displayed side-by-side in a 2-column grid
- Live gauge showing current load vs. adjusted limit (green / yellow / red) — activates after first Calculate
- Near-limit caution when load exceeds 90% of capacity

**Workflow**
- Guided three-step layout: Select Materials → Set Load Conditions → Calculate
- Steps 2 and 3 are dimmed and non-interactive on load; each unlocks as the previous step is completed
- Step badges animate from grey to orange as each step becomes active
- Calculate button disabled until at least one item is added
- Inline validation errors next to the relevant fields
- Distribution type hint text explaining each option

**Presets**
- Save named load configurations (items + distribution + support) to localStorage
- Load or delete saved presets at any time
- Collapsible section with bookmark icon prefix, orange left border accent, and smooth expand/collapse transition

**Results**
- Per-item weight breakdown with totals
- Safety Factor row always shown with a plain-language buffer hint (e.g. "1.5× — 50% safety buffer applied")
- Support Comparison table with PASS ✓ / WARN / FAIL ⚠ badges and row hover states
- Copy Result is the primary action (orange); Save as Image and Export CSV are secondary
- Recent calculation history with increased touch targets, hover states, and wrapping text
- Print-friendly layout via browser print (Ctrl+P)

**Units**
- Toggle between lbs and kg — all displays update instantly
- Preference saved to localStorage
- lbs/kg toggle sits inline next to the Quantity/Volume input in Step 1

---

## Why This Exists

Most load calculation tools are locked behind paywalls or overloaded with features. LoadCalc is a fast, offline-capable alternative for:

- Construction site planning
- Warehouse and logistics work
- Estimating safe scaffold, hoist, or truck loads

---

## How It Works

1. **Select Materials** — search or filter, pick a material, enter a quantity, and tap **+ Add to Load**. Added items appear immediately below with a running total and live summary. Step 2 unlocks once at least one item exists.
2. **Set Load Conditions** — choose how the load is distributed and what it's riding on. Step 3 unlocks once both fields are filled.
3. **Calculate** — get a full weight breakdown, Safety Factor hint, and PASS/OVERLOADED result against the adjusted limit. The Support Comparison table shows how the load fares across all support types.

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

---

## Recent Updates

**UX & Layout (March 2026)**

- **Step progression locking** — Steps 2 and 3 are dimmed on load and unlock progressively as each step is completed. Step badges animate from grey to orange.
- **Load Items grouping** — the item list, Clear all button, and Load Summary card (running total + gauge) are now all contained within Step 1. Clear all is hidden until items exist; an empty state placeholder is shown otherwise.
- **Unit toggle relocated** — the lbs/kg toggle moved from the header to sit inline next to the Quantity/Volume input. The header now shows only the offline badge.
- **Results panel polish** — Safety Factor always shown with a plain-language buffer hint. PASS badges prefixed with ✓, FAIL with ⚠. Copy Result is the primary action button; Save as Image and Export CSV are secondary. Support Comparison rows have hover states.
- **Recent history** — heading made more prominent with a divider above it. Rows have min 44px touch targets, hover states, and text wraps instead of truncating.
- **Presets & Custom Materials** — both sections are collapsible with smooth expand/collapse transitions, icon prefixes, and an orange left border accent.
- **Layout cleanup** — Distribution and Support dropdowns in a side-by-side 2-column grid. Disclaimer and version tag moved to a dedicated site footer.
