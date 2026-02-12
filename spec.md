Below is a **full, build-ready spec** (game design + technical design) you can hand to a dev team. It assumes: **browser game**, **LLM called per intervention + major events**, **continuous time**, **planetary-scale actions allowed**, **fictional intelligent species only**, **no real-world politics/hate**.

---

# GODHOOD SIM — Full Product + Technical Spec (v1)

## 0) One-paragraph product definition

A single-player browser god-sim where Earth is already **1.0 billion years old**. Time advances continuously (default **1s = 100k years**, adjustable). The player types free-form “divine interventions” (planetary-scale allowed) and spends a regenerating resource (“god attention”). An LLM acts as **world model + gremlin dungeon master**, narrating outcomes, applying state changes, and queuing delayed consequences. The objective is to shepherd *any* fictional species to a **self-sustaining offworld colony stable for 10,000+ years**, after which the game continues endlessly with escalating weirdness.

---

# 1) Design Goals and Non-Goals

## 1.1 Goals

* **Free-text magic**: player inputs any action in natural language.
* **Fast feedback loop**: narrative + stat deltas + “why” explanation every intervention.
* **Time is the enemy**: skipping time is powerful and often catastrophic/funny.
* **Rule-of-cool physics vibe**: plausible causal chains; never “impossible,” only “possible with consequences.”
* **Breakable system** for nerds: emergent exploits, weird evolutionary paths, odd world states.
* **Dynamic difficulty**: the better you do, the universe throws nastier curveballs.

## 1.2 Non-Goals (v1)

* No multiplayer.
* No accurate earth-system science (we’re “physics-ish,” not a paper).
* No fully simulated genetics. (Player can create *species templates* but not edit existing genomes.)
* No detailed politics/civ simulation of real-world societies.

---

# 2) Core Gameplay Loop

## 2.1 Time

* Simulation runs continuously in “game years.”
* Default real-time mapping: **1 real second = 100,000 game years**.
* Player controls:

  * **Pause / Play**
  * **Speed slider**: 0.1× to 100×
  * **Time Jump**: advance N years (user chooses N; can be large)
* Time jump triggers all queued events that fall within the interval, and can invalidate plans (“you advanced 50M years; your winged fish died out by year 12M”).

### 2.1.1 Tick model (implementation requirement)

* Client runs a render/update loop at ~60fps.
* Simulation updates at fixed cadence (e.g., every 250ms) using accumulated `dt_real`.
* Convert to game time:
  `dt_years = dt_real_seconds * years_per_second * speed_multiplier`

Where:

* `years_per_second` default = 100000, adjustable in settings.
* `speed_multiplier` from slider.

## 2.2 Player action (intervention)

* Player types a natural-language action.
* Action can specify target implicitly or explicitly:

  * Examples: “Create tectonics” (global), “Divert the river here” (selected region), “Drop a small asteroid in the southern ocean.”
* If target unclear, system assumes **currently selected region**; if none selected, assume global.

### 2.2.1 Action frequency

* Player can act any time (even while sim running).
* Each action costs **Omniscience Bandwidth (OB)**.
* Some actions have persistence (“keep this volcano chain active for 2M years”) and create ongoing costs/entropy.

## 2.3 Resources

### 2.3.1 Primary: Omniscience Bandwidth (OB)

**Theme:** You are god, but attention is finite.

* `OB_max`: starts at 100, can increase via “ascension” milestones.
* `OB_current`: regenerates over time (game time).
* Regen formula (simple and tunable):

  * `OB_regen_per_Myr = 2.0 * (1 + 0.05 * ascension_level)`
  * `OB += OB_regen_per_Myr * (dt_years / 1_000_000)`
* Optional: regen reduced when Entropy Debt is high (adds tension):

  * multiply regen by `clamp(1 - ED/200, 0.25, 1)`

### 2.3.2 Secondary: Entropy Debt (ED)

**Theme:** Reality hates being micromanaged.

* `ED_current`: increases with large interventions.
* `ED_decay`: slow decay over time.
* ED influences:

  * Random event frequency/severity multiplier
  * Likelihood of “unintended consequences” in LLM outcomes
  * Advisor suggestions becoming more chaotic

Formulas:

* `ED += ED_gain_from_action`
* `ED_decay_per_Myr = 0.2` (tunable)
* `ED = max(0, ED - ED_decay_per_Myr * (dt_years / 1_000_000))`

### 2.3.3 Cost model (deterministic scaffolding)

Every action is assigned:

* `scope`: local / regional / planetary
* `magnitude`: tiny / small / medium / huge
* `duration`: instant / sustained

Base OB cost table:

| Scope \ Magnitude | Tiny | Small | Medium | Huge |
| ----------------- | ---: | ----: | -----: | ---: |
| Local             |    2 |     5 |     10 |   18 |
| Regional          |    6 |    12 |     22 |   40 |
| Planetary         |   15 |    30 |     55 |   90 |

Multipliers:

* Sustained duration: `* (1 + duration_myr / 5)` capped at 3×
* ED multiplier: `* (1 + ED/150)` capped at 2×
* “Repeated spam” multiplier: if similar action repeated within short window, +20% each time (anti-cheese)

ED gain:

* `ED_gain = base_cost * 0.4` (tiny/small)
* `ED_gain = base_cost * 0.8` (medium)
* `ED_gain = base_cost * 1.2` (huge)

**Important:** In v1, scope/magnitude can be approximated by LLM classification (see §6). If classification fails, default to **regional/medium**.

## 2.4 Win condition

* Trigger when:

  * A fictional intelligent species has established **one offworld colony** that is
  * **self-sustaining** (no imports required) and
  * remains stable **10,000+ years** continuously.

After win:

* “Endless mode” continues with increasing Ascension Level and unlocks.

---

# 3) World State

## 3.1 Global state variables (visible)

Visible always in UI:

* `time_years` (since start of game; Earth age implied)
* `mean_temp_c`
* `atmos_pressure_atm`
* `atmos_composition`: { `co2_ppm`, `ch4_ppm`, `o2_percent`, `n2_percent`, `other_percent` }
* `ocean_ph`
* `water_fraction` (0–1, includes oceans+surface water)
* `ice_fraction` (0–1)
* `land_fraction` (0–1)
* `biodiversity_index` (0–100)
* `extinction_risk` (0–100)
* `habitability` (0–100)
* `complexity_potential` (0–100)

## 3.2 Hidden state variables (discoverable)

* `mantle_heat` (0–100)
* `plate_mobility` (0–100)
* `magnetic_field_strength` (0–100)
* `nutrient_flux` (0–100)
* `ocean_circulation_strength` (0–100)
* `impact_flux` (0–100)
* `stellar_brightening_factor` (~1.0..1.2+)
* `evolutionary_option_space` (0–100)
  *Interpretation:* whether ecosystems have “room” to explore novelty (not genetics editing).

Hidden variables become partially visible via:

* Passive “discoveries” (milestones)
* Active “Divine Scan” action that costs OB but reveals a slice

## 3.3 Regional map model

### 3.3.1 Representation (v1)

Use a **lat/long grid** for simulation, but render as a globe.

* Grid size: **72 x 36 = 2592 cells** (5° resolution). This is a sweet spot: cheap, selectable, “feels like a planet.”
* Each cell has:

  * `elevation_m` (negative = ocean depth)
  * `temp_c`
  * `humidity` (0–1)
  * `biome` enum
  * `volcanism` (0–100)
  * `salinity` (0–1)
  * `soil_nutrients` (0–100)
  * `life_presence` (0–1)
  * `local_biodiversity` (0–100)

**Targeting:**

* A “region” = contiguous cluster of cells under cursor, plus optional brush selection.
* UI displays hovered region summary.

### 3.3.2 Rendering (v1)

* WebGL sphere (Three.js or equivalent).
* Base texture: procedural (simple noise) or static.
* Overlay: cell-based coloring for:

  * elevation (land/sea)
  * biome
  * temperature
* Click picking: raycast to sphere UV → map to grid cell.

---

# 4) Baseline Simulation (Non-LLM)

LLM should not run every tick. Baseline sim provides continuity; LLM handles interventions and major events.

## 4.1 Baseline drift (each sim tick)

Update global variables with simplified rules:

1. **Solar brightening**

* `stellar_brightening_factor` slowly increases with time:

  * `factor = 1 + (earth_age_gyr - 1.0) * 0.01 + (time_years / 1e9) * 0.01`
    (tunable; just ensures “Sun slowly gets meaner.”)

2. **Temperature model (toy but stable)**

* `mean_temp_c = base + greenhouse(co2,ch4) - albedo(ice_fraction) + solar(factor)`
* greenhouse:

  * `gh = a*log(co2_ppm/280) + b*log(ch4_ppm/700)`
* albedo:

  * `alb = c*(ice_fraction)`
* solar:

  * `sol = d*(factor - 1)`
    Constants a,b,c,d tuned to keep plausible ranges.

3. **Ocean pH drift**

* pH decreases with CO₂, increases with alkalinity proxy (nutrient_flux):

  * `ocean_ph += k1*(nutrient_flux-50)/50 - k2*log(co2_ppm/280)`

4. **Ice fraction**

* depends on mean_temp and land distribution:

  * move toward an equilibrium ice fraction based on `mean_temp_c`

5. **Life and biodiversity baseline**

* biodiversity rises slowly if habitability and stability are high, falls with extinction_risk and disasters.
* `extinction_risk` baseline depends on volatility metrics (ED, volcanism, impact_flux, rapid climate change).

## 4.2 Regional climate approximation

* cell temperature = global mean + latitudinal gradient + elevation adjustment.
* humidity determined by proximity to oceans + temperature.

This is “good enough” because **LLM will do the entertaining narrative leaps**.

---

# 5) Events System

## 5.1 Event types

### Natural (stochastic, unavoidable)

* Impacts: small / medium / extinction-level
* Supervolcano / flood basalt
* Snowball episodes
* Runaway greenhouse spikes
* Methane haze epochs
* Magnetic field dip → radiation stress
* Ocean anoxic events

### Player-caused (queued consequences)

* “Your new inland sea becomes anoxic; mass die-off in 2M years.”
* “Tectonics increases volcanism; CO₂ spike in 500k years.”

### Era transitions (milestone events)

* oxygenation crises
* emergence of eukaryotes
* multicell explosion
* intelligence sparks
* industrialization phase change
* space age and colony attempts

## 5.2 Event scheduling

Maintain an event queue:

* Each event has `trigger_time_years`.
* Each tick:

  * Pop and process all events whose trigger time <= current time.

### 5.2.1 Random event generation

Every Myr of simulated time, roll for events based on:

* baseline rates (impact_flux etc.)
* ED multiplier:

  * `rate *= (1 + ED/100)`
* ascension multiplier:

  * `rate *= (1 + ascension_level/10)`

Processing a major event may call the LLM (see §6.5).

---

# 6) LLM Integration (World Model + Narrator + Advisor)

## 6.1 Two LLM roles

1. **SIMULATOR** (authoritative outcomes)

* Called when:

  * Player submits an intervention
  * A major event triggers (extinction-level impact, snowball, intelligence emergence, colony attempt)
* Responsible for:

  * narrative
  * stat deltas (global + optionally regional)
  * queued delayed consequences
  * updated “era/milestone” flags if needed

2. **ADVISOR** (suggestions-only, not authoritative)

* Called when player asks for hints or after SIMULATOR returns.
* Provides 3–5 actionable suggestions tailored to the current state and tone.

(You can implement ADVISOR using the same model with different system prompt.)

## 6.2 “Chaos output is fine” — but we still need a parse contract

We display raw text always. We *attempt* to parse a structured block if present.

**SIMULATOR output should include a block delimited like:**

`---UPDATE_JSON---`
`{ ... }`
`---END_UPDATE_JSON---`

If parsing fails, fallback to:

* no structured update; show narrative only
* apply minimal deterministic effects (e.g., deduct OB cost and add ED)
* log parse failure
* optionally ask a lightweight “repair” call that returns only JSON (recommended but optional)

## 6.3 State schema (authoritative JSON)

This is the canonical game state stored client-side and in saves.

```json
{
  "version": "1.0",
  "seed": 123456789,
  "time_years": 0,
  "earth_age_years": 1000000000,
  "difficulty": {
    "ascension_level": 0,
    "mode": "dynamic"
  },
  "resources": {
    "ob_current": 100,
    "ob_max": 100,
    "entropy_debt": 0
  },
  "global": {
    "mean_temp_c": 18,
    "atmos_pressure_atm": 1.0,
    "atmos": {
      "co2_ppm": 2000,
      "ch4_ppm": 1500,
      "o2_percent": 1.0,
      "n2_percent": 78.0,
      "other_percent": 20.0
    },
    "ocean_ph": 7.8,
    "water_fraction": 0.71,
    "ice_fraction": 0.05,
    "land_fraction": 0.29,
    "biodiversity_index": 5,
    "extinction_risk": 25,
    "habitability": 35,
    "complexity_potential": 10
  },
  "hidden": {
    "mantle_heat": 75,
    "plate_mobility": 40,
    "magnetic_field_strength": 60,
    "nutrient_flux": 45,
    "ocean_circulation_strength": 55,
    "impact_flux": 50,
    "stellar_brightening_factor": 1.02,
    "evolutionary_option_space": 30
  },
  "eras": {
    "prebiotic": true,
    "microbial": false,
    "oxygenation": false,
    "eukaryotes": false,
    "multicell": false,
    "intelligence": false,
    "industry": false,
    "spacefaring": false,
    "offworld_colony": false
  },
  "species": [
    {
      "id": "sp_001",
      "name": "Shallow-Slickers",
      "template": {
        "habitat": ["shallow_ocean"],
        "traits": ["photosynthetic", "biofilm_forming"]
      },
      "status": {
        "population_index": 12,
        "range_cells": 480,
        "tech_level": 0,
        "sentience": 0
      }
    }
  ],
  "offworld": {
    "enabled": false,
    "nodes": []
  },
  "map": {
    "w": 72,
    "h": 36,
    "cells": "BINARY_OR_COMPRESSED_BLOB_REFERENCE"
  },
  "queue": [
    {
      "id": "ev_1001",
      "trigger_time_years": 2500000,
      "type": "player_consequence",
      "severity": 30,
      "summary": "Anoxic inland sea forms; local die-off likely.",
      "payload": {}
    }
  ],
  "log": [
    {
      "t_years": 0,
      "kind": "system",
      "text": "Earth boots up at 1B years old. The cosmos yawns."
    }
  ]
}
```

### 6.3.1 Map cell storage

Store cells as a compressed typed array in client (performance).

* Use `Uint16Array`/`Int16Array` fields packed or multiple arrays.
* Save game stores base64 of compressed buffer (pako/deflate).

## 6.4 Intervention request contract (frontend → backend)

When player submits text:

```json
{
  "state": { "...canonical_state_subset..." },
  "player_action": {
    "text": "Create tectonics and raise a mountain chain here.",
    "target": {
      "type": "region",
      "cells": [1022, 1023, 1094]
    },
    "assumptions": {
      "scope_hint": "regional",
      "magnitude_hint": "medium"
    }
  },
  "economy": {
    "ob_cost_estimate": 22,
    "entropy_debt_before": 15
  },
  "rng": {
    "seed": 123456789,
    "rolls": [0.12, 0.88, 0.42]
  }
}
```

**State subset** sent to LLM must be small:

* global visible vars
* relevant hidden vars (maybe masked)
* local region summary stats
* era flags
* top 3 species summaries
* ED/OB
* next few queued events

## 6.5 SIMULATOR prompt template (server side)

System prompt (conceptual requirements):

* Tone: “gremlin dungeon master with footnotes”
* Never refuse physics-wise; always allow with tradeoffs
* No real-world politics/hate; intelligent species fictionalized
* Output narrative + attempt structured block

User message skeleton:

* Current time
* Key stats
* Hidden state (partial)
* Region summary (if targeted)
* Action text
* Constraints: “planetary scale allowed; no direct genome editing; can create new species template”
* Ask for: narrative, deltas, queued consequences, milestone updates

**Parsing block schema (the update JSON)**

```json
{
  "ob_cost_final": 0,
  "entropy_debt_delta": 0,
  "global_deltas": { "mean_temp_c": 0, "ocean_ph": 0, "...": 0 },
  "hidden_deltas": { "plate_mobility": 0, "...": 0 },
  "regional_deltas": [
    { "cell_ids": [1022,1023], "fields": { "elevation_m": 800, "volcanism": 20 } }
  ],
  "species_updates": [
    { "op": "create", "id": "sp_123", "name": "Wingfin Drifters", "template": { "...": "..." } }
  ],
  "queue_add": [
    { "trigger_in_years": 500000, "type": "player_consequence", "severity": 40, "summary": "..." }
  ],
  "era_updates": { "microbial": true },
  "offworld_updates": { "enabled": false },
  "notes_for_player": ["One-liner hints, optional"]
}
```

## 6.6 Advisor prompt requirements

Advisor never changes state. It reads state and returns:

* 3 “safe” suggestions
* 2 “chaos” suggestions (high ED style)
* Each suggestion includes:

  * expected risk (low/med/high)
  * rough OB cost category (cheap/moderate/expensive)

## 6.7 Moderation and safety (hard requirements)

Before calling LLM:

* Run lightweight text filter (keywords + optional moderation endpoint) to reject:

  * real-world politics/hate
  * real-world targeted harassment
    If rejected:
* Return in-universe message: “The cosmic tribunal denies reality-bending in that direction.”
* No state change except maybe a tiny “cosmic side-eye” log entry.

---

# 7) Era Progression and Unlocks

Eras are state-driven thresholds + LLM confirmations.

## 7.1 Milestone triggers (deterministic gating)

These are “eligibility checks.” If eligible, queue a milestone event that calls LLM to narrate and finalize.

Examples:

* **Microbial life eligibility**

  * habitability > 25
  * ocean_ph between 6.5 and 8.5
  * water_fraction > 0.3
* **Oxygenation eligibility**

  * microbial == true
  * biodiversity_index > 10
  * co2_ppm stable-ish and nutrient_flux > 40
* **Eukaryotes eligibility**

  * o2_percent > 5
  * extinction_risk < 60
* **Multicell eligibility**

  * o2_percent > 10
  * biodiversity_index > 25
  * stability metric high (low volatility)
* **Intelligence eligibility**

  * multicell == true
  * biodiversity_index > 50
  * long stable window (e.g., 20M years without mass extinction)
* **Industry/Spacefaring** similarly.

## 7.2 Weird unlocks (“Anomalies”)

Anomalies are optional branches:

* Trigger when rare conditions occur (high methane + stable climate + low O2, etc.)
* On trigger, add a “Codex card” and maybe a new trait option for species templates.

---

# 8) Offworld Layer (post-intelligence)

## 8.1 When enabled

* offworld activates when `eras.spacefaring = true`.

## 8.2 Representation

Nodes: `Earth`, `Moon`, `Mars`, `Asteroids` (v1)
Each node has:

* habitability surrogate
* resources (water, volatiles, metals)
* colony slots
* hazards

## 8.3 Colony system (v1)

A colony has:

* `species_id`
* `node`
* `stability` (0–100)
* `self_sustaining` boolean
* `age_years`

A colony becomes self-sustaining if:

* stability > 70 continuously for 10k years AND
* imports_needed == false (simple boolean driven by LLM outcomes)

Win triggers when any colony `self_sustaining == true` and `age_years >= 10000`.

---

# 9) UI/UX Requirements

## 9.1 Main screen layout

* **Center:** globe view (drag to rotate, scroll to zoom)
* **Left panel:** stats (tabs: Global / Hidden (discovered) / Species / Offworld)
* **Bottom:** prompt input + “Advisor” button + OB/ED meters
* **Right panel:** timeline log (scrollable)
* **Top bar:** time controls + speed + time-jump + save/load

## 9.2 Globe interactions

* Hover shows region tooltip:

  * elevation, biome, temp, life presence, volcanism
* Click selects region (highlights cells)
* Brush select optional (shift+drag)

## 9.3 Feedback presentation (every intervention)

Show in a single “Outcome card”:

1. Narrative (LLM text)
2. Stat deltas (compact)
3. “Why it happened” (short bullets)
4. “Delayed consequences queued” (with timers)
5. Suggested next actions (from advisor or simulator notes)

## 9.4 Save/Load

* No accounts.
* Local saves in IndexedDB/localStorage:

  * `save_1`, `save_2`, etc.
* Export/import save JSON file (download/upload).

---

# 10) Technical Architecture

## 10.1 High-level

* **Frontend (browser):**

  * UI + rendering + baseline simulation + event queue + save system
* **Backend (thin API):**

  * LLM proxy (keeps API keys secret)
  * optional moderation proxy
  * rate limiting + abuse protection
  * logging (optional)

## 10.2 Suggested stack

* Frontend: React + TypeScript
* Rendering: Three.js
* State: Zustand/Redux Toolkit (dev choice)
* Compression: pako (deflate)
* Backend: Node/Express or Cloudflare Workers
* LLM: your provider of choice (OpenAI/etc.)

## 10.3 Backend endpoints

### POST `/api/simulate/intervention`

Input: intervention request (§6.4)
Output:

```json
{
  "raw_text": "LLM full response…",
  "parsed_update": { "...optional..." },
  "parse_ok": true,
  "model_meta": { "model": "X", "latency_ms": 1234 }
}
```

### POST `/api/simulate/event`

Same shape but event-driven.

### POST `/api/moderate`

Optional if not using provider moderation directly.

## 10.4 Rate limiting

* Per IP/session token:

  * e.g., 30 LLM calls / 10 minutes (tunable)
* If exceeded, return in-universe cooldown message.

---

# 11) Parsing and State Application (Client Rules)

## 11.1 Apply pipeline

When response arrives:

1. Append `raw_text` to timeline log.
2. If `parse_ok`:

   * Apply `ob_cost_final` and `entropy_debt_delta`
   * Apply global/hidden deltas (clamp reasonable ranges)
   * Apply regional updates (patch cell buffers)
   * Apply species ops
   * Add queued events with `trigger_time_years = now + trigger_in_years`
   * Apply era/offworld updates
3. If parse fails:

   * Only apply economy costs (OB and ED from deterministic estimate)
   * Optionally queue a “narrative-only consequence” event (fun, not mechanical)

## 11.2 Clamping rules (stability)

To prevent absurd numbers from breaking UI:

* `ocean_ph` clamp: 0–14
* `o2_percent`: 0–35
* `mean_temp_c`: -100 to 100
* indices: 0–100
* fractions: 0–1

If LLM proposes beyond clamp, clamp but preserve narrative.

---

# 12) Content Rules (Hard)

* No real-world politics, hate, propaganda, targeting real groups.
* Intelligent species must be fictionalized (can be humanlike but not “actual humans/nations/ideologies”).
* “Evil god” actions allowed (extinctions), but keep descriptions non-graphic.

---

# 13) QA / Testing Requirements

## 13.1 Unit tests

* Economy math: OB/ED regen/decay/cost
* Event queue ordering and triggering
* Save/load round-trip
* Parsing of update blocks + fallback behavior
* Clamping + state validation

## 13.2 Integration tests

* Mock LLM responses:

  * well-formed update JSON
  * malformed update JSON
  * narrative-only
* Confirm no crashes, state remains valid.

## 13.3 “Fun tests” (manual checklist)

* Time jump causes plausible extinctions
* High ED increases chaos
* Planetary action causes delayed side effects
* Advisor suggestions track current state

---

# 14) Build Milestones (deliverables, not time estimates)

1. **Core sim loop**: time controls + baseline drift + event queue
2. **Globe MVP**: render + pick cells + show region tooltip
3. **State + saves**: schema + compression + export/import
4. **LLM proxy**: backend endpoint + raw response logging
5. **Intervention flow**: prompt → LLM → apply update → outcome card
6. **Advisor**: hint button + suggestions UI
7. **Era milestones**: microbial → multicell gating + milestone events
8. **Offworld v1**: nodes + colony state + win trigger
9. **Polish**: tutorial + codex + UI smoothing + guardrails

---

# Appendix A — Biome and Species Template Definitions (v1)

## A.1 Biomes (enum)

* `open_ocean`, `shallow_ocean`, `reef_like`, `coastal`, `tundra`, `temperate_forest`, `tropical`, `desert`, `swamp`, `mountain`, `ice_sheet`, `volcanic`, `anoxic_sea`, `alien_weirdness` (unlocked)

## A.2 Species template schema (player-created)

```json
{
  "name": "Wingfin Drifters",
  "habitat": ["shallow_ocean", "coastal"],
  "traits": ["gliding_membranes", "opportunistic_feeder", "salt_tolerant"],
  "notes": "Created by divine intervention; nature decides survival."
}
```

---

# Appendix B — Example SIMULATOR Output (what dev should expect)

Raw text always shown. Attempt parse block.

```
You knit a mountain chain into existence like a zipper across the tropics. The planet immediately pretends it was always there. Reality is polite that way.

Effects:
- Monsoons intensify on the windward side; the leeward side becomes a dry shadow.
- Fresh mineral runoff spikes nutrients in nearby seas.
- Volcanism increases because you bullied the crust.

---UPDATE_JSON---
{
  "ob_cost_final": 24,
  "entropy_debt_delta": 18,
  "global_deltas": {
    "mean_temp_c": -0.4,
    "extinction_risk": 6,
    "biodiversity_index": 3,
    "habitability": 2
  },
  "hidden_deltas": {
    "plate_mobility": 4,
    "nutrient_flux": 10
  },
  "regional_deltas": [
    { "cell_ids": [1022,1023,1094], "fields": { "elevation_m": 2200, "volcanism": 25, "humidity": 0.85 } }
  ],
  "queue_add": [
    { "trigger_in_years": 800000, "type": "player_consequence", "severity": 35, "summary": "Leeward deserts expand; coastal anoxia risk rises." }
  ],
  "era_updates": {},
  "offworld_updates": {}
}
---END_UPDATE_JSON---
```

---

## What your dev needs to start tomorrow

If you hand them this doc, they can immediately:

* implement the **state schema**
* build the **globe picker**
* implement **time + baseline sim**
* wire the **LLM proxy**
* implement **intervention → apply update** logic

If you want, I can also produce (in one shot):

* the **exact SIMULATOR + ADVISOR prompts** (copy/paste ready)
* a **minimal baseline climate formula set** with concrete constants that won’t explode
* a **JSON validation spec** (zod schema) for state + updates
  (all of which makes dev work dramatically smoother).

