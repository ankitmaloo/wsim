# Project Genesis (WorldSim) - Game Design and Technical Spec

## 1. Overview
### 1.1 Working Title
- Primary: `Genesis Protocol`
- Alt/internal: `Primordial Soup Kitchen`, `TerraPrompt`

### 1.2 High Concept
You are a chaotic god on a 1-billion-year-old Earth. You issue interventions in natural language. An LLM acts as simulator + referee and determines ecological, geological, and civilizational consequences with a science-forward but absurd tone.

### 1.3 Game Goal
- Main milestone: any lineage reaches a stable multi-planetary civilization.
- End state: endless sandbox continues after milestone with escalating chaos and optional side goals.
- Core fantasy: "what happens if I do this?" at planetary timescale.

## 2. Design Pillars
1. Agency first: player actions are never blocked, only redirected into consequences.
2. Rule-of-cool + physics vibe: plausible enough to feel grounded, wild enough to be memorable.
3. Narrative plus telemetry: every turn returns story + numbers + causal explanation.
4. Breakable by design: players should discover edge cases, emergent loops, and absurd outcomes.
5. Replayability: stochastic events and hidden state prevent repeated runs from feeling identical.

## 3. Target Experience
- Platform: browser-based, desktop-first, mobile-responsive.
- Mode: single-player.
- Session shape: 15-30 minute casual bursts, plus long-form endless runs.
- Saves: local save/resume required for MVP, cloud sync optional later.

## 4. Core Loop
1. Observe current era, world metrics, species trends, and event pressure.
2. Decide intervention (free text by default, optional guided structure).
3. Execute intervention and spend action resource.
4. LLM resolves immediate effects and delayed consequences.
5. Display outcome: narrative, stat deltas, and why it happened.
6. Advance time continuously and/or by jump amount.
7. Trigger stochastic/adversarial events and difficulty updates.

## 5. Time Model
- Default simulation: continuous time flow.
- Controls: `Pause`, `1x`, `5x`, `20x`, plus manual jump.
- Base simulation tick: `100,000 years`.
- Manual jump presets: `1M`, `10M`, `50M`, `100M` years.
- Era pacing rule: late eras reduce effective jump size to increase decision density.

### 5.1 Era-Based Epoch Guidance
| Era | Years Ago | Typical Epoch |
|---|---:|---:|
| Proterozoic | 1B - 541M | 50M years |
| Cambrian | 541M - 485M | 10M years |
| Paleozoic | 485M - 252M | 10M years |
| Mesozoic | 252M - 66M | 5M years |
| Cenozoic | 66M - 10K | 1M-5M years |
| Anthropocene | 10K - future | 1K-10K years |
| Post-Human | future+ | dynamic |

## 6. Action System
### 6.1 Input Modes
- `Chaos Mode` (default): pure free text.
- `Guided Mode`: structured builder (target/action/magnitude).
- `Hybrid Mode` (recommended): free text with AI interpretation cards player can confirm/edit.

### 6.2 Player Power Boundaries
- Allowed:
  - Environmental and geological interventions.
  - Targeted regional changes and global interventions.
  - Creation of new organisms/species concepts.
- Not allowed:
  - Direct deterministic genetic editing.
- Reinterpretation rule:
  - If player asks for direct trait control, system reframes it as environmental pressure with tradeoffs.

### 6.3 Action Economy
- Resource: `Divine Energy (DE)`.
- Recommended default cap: `200 DE`.
- Regen: based on simulated time + difficulty modifier.
- Cost bands:
  - Small mutation/environment nudge: `10 DE`
  - Major intervention: `50 DE`
  - Catastrophic action: `100 DE`
  - Reality-bending action: `200 DE`
- Optional debt mechanic:
  - If action exceeds available DE, allow execution by adding Chaos Debt and instability risk.

## 7. World State Model
### 7.1 Visible Global Metrics
- Temperature (C)
- Atmosphere composition (`O2`, `CO2`, `CH4`, trace gases)
- Ocean pH
- Surface water content
- Ice cap coverage
- Landmass exposure
- Biodiversity index
- Extinction risk
- Chaos level
- Civilization complexity tier

### 7.2 Regional Metrics
- Biome type
- Local temperature anomaly
- Moisture/aridity
- Ecological pressure
- Dominant lineages

### 7.3 Hidden Simulation State
- Mantle heat and tectonic stress
- Nutrient cycling efficiency
- Mutation opportunity pressure
- Radiation stress
- Orbital instability
- Civilization fragility
- Event probability multipliers

## 8. AI World Model and Judgment
### 8.1 LLM Role
- World simulator, referee, narrator, and hint assistant.
- Never says "impossible." It always resolves to "possible with tradeoff."

### 8.2 Judgment Factors
| Factor | Weight |
|---|---:|
| Scientific plausibility | 30% |
| Current world conditions | 25% |
| Ecosystem balance | 20% |
| Creativity/novelty | 15% |
| Chaos/random variance | 10% |

### 8.3 Verdict Set
- `SUCCESS`
- `PARTIAL`
- `FAILURE`
- `BACKFIRE`
- `CATASTROPHE`

### 8.4 Turn Response Contract
Every AI turn must return structured JSON plus narrative rendering fields:
1. Interpreted action
2. Verdict and scores
3. Immediate state deltas
4. Delayed consequence queue entries
5. Species changes
6. Environmental changes
7. Narrative summary (2-3 sentences)
8. Causal explanation
9. Suggested next actions (2-4)
10. Unlock/easter-egg flags (optional)

## 9. Event and Difficulty Systems
### 9.1 Stochastic Event Engine
- Always-on independent events, outside player control.
- Example pool:
  - Asteroid impact
  - Supervolcano
  - Ice age pulse
  - Methane burst
  - Ocean circulation collapse
  - Magnetic reversal
  - Solar flare

### 9.2 Dynamic Difficulty Formula
`Difficulty Pressure = Base + Era Modifier + Chaos Debt + Success Streak Penalty`

Effects of higher pressure:
- More frequent adversarial events
- Higher cascade risk
- Lower forgiveness in borderline interventions
- Slower DE recovery at harder settings

### 9.3 Chaos Debt Bands
- `0-20`: stable
- `21-50`: minor instability
- `51-80`: frequent disruptions
- `81-100`: severe volatility
- `100+`: chaos cascade mode

Decay rule: `-5` per peaceful epoch with no major intervention.

## 10. Progression
### 10.1 Era Progression
Ordered path exists, but branching speed and order can drift based on interventions and world state.

### 10.2 Unlock Tracks
- Silicon-leaning biochemistry
- Floating atmospheric ecosystems
- Tidally locked strategies
- Deep-ocean intelligence
- Aquatic-first civilization
- Non-human dominant spacefaring outcomes

### 10.3 Milestones
- First multicellular life
- First mass extinction survived
- Intelligence emergence
- Civilization launch event
- Multi-planetary settlement achieved

## 11. Win/Loss Philosophy
- Canonical "win": stable multi-planetary civilization.
- No permanent game-over in default mode.
- Crisis states replace hard loss:
  - Total extinction event
  - Snowball or hothouse runaway
  - Chaos cascade
- Recovery is always possible through future interventions.

## 12. Content and Safety
- Allowed: evil-god playstyles, extinction experiments, chaotic scenarios.
- Disallowed: hateful content, extremist politics, targeted real-world abuse content.
- Tone guardrail: PG-13 mischievous science satire.
- Safety filter required before prompt reaches simulation model.

## 13. UX and Presentation
### 13.1 Main Screen Zones
- World view (2D map in MVP, optional 3D globe later)
- Global metrics panel
- Life tree summary
- Event/narrative feed
- Action console
- Time controls

### 13.2 Turn Feedback Requirements
Each turn must show:
- What changed now
- What might happen later
- Why outcome happened
- Suggested next experiments

## 14. Technical Architecture
### 14.1 Frontend
- React + TypeScript
- State: Zustand or Redux Toolkit
- Visualization: Canvas/SVG in MVP, optional Three.js globe later
- Storage: LocalStorage + IndexedDB for saves

### 14.2 Backend
- Node.js (Fastify/Express) or edge functions
- Responsibilities:
  - Prompt construction
  - LLM call
  - JSON schema validation/repair
  - Save/load API
  - Moderation and rate limiting

### 14.3 LLM Turn Pipeline
1. Validate and sanitize player action.
2. Build turn context from visible + hidden state + recent events.
3. Call model and require strict JSON contract.
4. Validate/repair response.
5. Apply clamped deltas and schedule delayed consequences.
6. Persist updated snapshot and turn log.
7. Return payload for UI rendering.

### 14.4 Reliability and Cost Controls
- Per-user rate limits.
- Model tiering by plan.
- Cached fallback responses for API outage.
- Rule-based lightweight fallback if LLM unavailable.

## 15. Save Model
Save payload includes:
- Current era and Earth age
- Global/regional metrics
- Hidden state
- Species graph summary
- Event queue and RNG seeds
- Difficulty pressure and Chaos Debt
- Action history
- Unlocks and milestones

## 16. MVP Scope
### 16.1 Must Have (v1)
1. Free-text action input.
2. Continuous time + pause/speed/jump controls.
3. At least 3 eras (Proterozoic, Paleozoic, Cenozoic).
4. AI world-model turn resolution with strict JSON schema.
5. Global metrics panel with at least 8 metrics.
6. Stochastic event system.
7. Dynamic difficulty pressure.
8. Local save/load resume.
9. Multi-planetary milestone path.

### 16.2 Should Have (v1.1)
1. Hybrid input confirmation flow.
2. Visual life tree.
3. Animated world-state transitions.
4. More eras and unlock tracks.
5. Achievement system.

### 16.3 Non-Goals (MVP)
- Multiplayer.
- Daily/weekly challenge modes.
- Full hard-science fidelity.
- Direct genome editor.

## 17. Acceptance Criteria
1. Player can submit arbitrary interventions and always receive resolved outcomes.
2. Every turn returns narrative, stat delta, and causal explanation.
3. Regional interventions produce localized effects.
4. Difficulty pressure rises with progress and risky play.
5. Catastrophic random events occur independently of player input.
6. Runs can continue indefinitely after milestone completion.
7. Save/resume restores deterministic state from snapshot.
