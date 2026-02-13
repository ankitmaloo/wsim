import { applyResourceDrift, computeEntropyGain, computeInterventionCost } from "../src/economy.js";
import { drainTriggeredEvents, enqueueEvents, hasWinCondition, updateColonyAges } from "../src/events.js";
import { clampGlobalState, computeDtYears, stepBaseline } from "../src/simulation.js";
import { applySimulatorUpdate, createInitialState } from "../src/state.js";
import type { Magnitude, Scope } from "../src/types.js";

const app = document.getElementById("app")!;
const state = createInitialState();
const logs: string[] = ["Earth boots at 1B years old. The cosmos yawns."];
let speed = 1;
let playing = true;
let selectedCell = 0;
const W = 72;
const H = 36;

function classify(text: string): { scope: Scope; magnitude: Magnitude } {
  const t = text.toLowerCase();
  return {
    scope: t.includes("planet") || t.includes("global") ? "planetary" : t.includes("region") ? "regional" : "local",
    magnitude: t.includes("huge") || t.includes("asteroid") ? "huge" : t.includes("tiny") || t.includes("small") ? "small" : "medium",
  };
}

async function postJson(url: string, body: unknown): Promise<any> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

function milestoneChecks() {
  if (!state.eras.microbial && state.global.habitability > 25 && state.global.ocean_ph > 6.5 && state.global.water_fraction > 0.3) {
    state.eras.microbial = true;
    logs.unshift("Milestone: Microbial life emerges.");
  }
  if (!state.eras.eukaryotes && state.eras.microbial && state.global.atmos.o2_percent > 5 && state.global.extinction_risk < 60) {
    state.eras.eukaryotes = true;
    logs.unshift("Milestone: Eukaryote-like cells emerge.");
  }
  if (!state.eras.multicell && state.eras.eukaryotes && state.global.atmos.o2_percent > 10 && state.global.biodiversity_index > 25) {
    state.eras.multicell = true;
    logs.unshift("Milestone: Multicellular life proliferates.");
  }
  if (!state.eras.intelligence && state.eras.multicell && state.global.biodiversity_index > 50) {
    state.eras.intelligence = true;
    logs.unshift("Milestone: Intelligence sparks.");
  }
  if (!state.eras.spacefaring && state.eras.intelligence && state.global.complexity_potential > 35) {
    state.eras.spacefaring = true;
    state.offworld.enabled = true;
    logs.unshift("Milestone: Spacefaring era unlocked.");
  }
}

function maybeSpawnRandomEvent(dtYears: number) {
  const rate = 0.08 * (1 + state.resources.entropy_debt / 100);
  if (Math.random() < rate * (dtYears / 1_000_000)) {
    enqueueEvents(state, [{
      id: `rnd_${Date.now()}`,
      trigger_time_years: state.time_years,
      type: "natural",
      severity: 35,
      summary: "A random cosmic disruption rocks the biosphere.",
      payload: {},
    }]);
  }
}

function renderMap(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const cellW = canvas.width / W;
  const cellH = canvas.height / H;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const id = y * W + x;
      const lat = Math.abs((y / H) * 2 - 1);
      const temp = state.global.mean_temp_c - 20 * lat + ((id % 5) - 2);
      const ocean = (x * 17 + y * 13 + id) % 9 < 4;
      const hue = ocean ? 210 : 110;
      const light = Math.max(20, Math.min(70, 45 + temp * 0.4));
      ctx.fillStyle = `hsl(${hue} 65% ${light}%)`;
      ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
    }
  }
  const sx = selectedCell % W;
  const sy = Math.floor(selectedCell / W);
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2;
  ctx.strokeRect(sx * cellW, sy * cellH, cellW, cellH);
}

function saveSlot(slot = "save_1") {
  localStorage.setItem(slot, JSON.stringify(state));
  logs.unshift(`Saved ${slot}.`);
}

function loadSlot(slot = "save_1") {
  const raw = localStorage.getItem(slot);
  if (!raw) return;
  Object.assign(state, JSON.parse(raw));
  logs.unshift(`Loaded ${slot}.`);
}

async function launchAdvisor() {
  const result = await postJson("/api/advisor", { state });
  const lines = (result.suggestions || []).map((s: any) => `- [${s.mode}] ${s.text} (${s.expected_risk}, ${s.ob_cost})`);
  logs.unshift(`Advisor\n${lines.join("\n")}`);
}

async function intervene(text: string) {
  const moderation = await postJson("/api/moderate", { text });
  if (!moderation.allowed) {
    logs.unshift("The cosmic tribunal denies reality-bending in that direction.");
    return;
  }

  const { scope, magnitude } = classify(text);
  const cost = computeInterventionCost({ scope, magnitude, entropyDebt: state.resources.entropy_debt });
  const entropyGain = computeEntropyGain(cost, magnitude);

  if (state.resources.ob_current < cost) {
    logs.unshift(`Insufficient OB: need ${cost}.`);
    return;
  }

  const response = await postJson("/api/simulate/intervention", {
    state,
    player_action: { text, target: { type: "region", cells: [selectedCell] }, assumptions: { scope_hint: scope, magnitude_hint: magnitude } },
    economy: { ob_cost_estimate: cost, entropy_debt_before: state.resources.entropy_debt },
  });

  if (response.parse_ok && response.parsed_update) {
    applySimulatorUpdate(state, response.parsed_update, cost);
  } else {
    applySimulatorUpdate(state, { entropy_debt_delta: entropyGain }, cost);
  }

  logs.unshift(`Intervention: ${text}`);
  logs.unshift((response.raw_text || "Reality wobbles.").split("---UPDATE_JSON---")[0].trim());
}

function tryLaunchColony() {
  if (!state.offworld.enabled) return;
  if (state.resources.ob_current < 30) {
    logs.unshift("Not enough OB to seed an offworld colony.");
    return;
  }
  state.resources.ob_current -= 30;
  state.offworld.colonies.push({
    species_id: `sp_${state.offworld.colonies.length + 1}`,
    node: ["Moon", "Mars", "Asteroids"][state.offworld.colonies.length % 3],
    stability: 72,
    self_sustaining: false,
    imports_needed: false,
    age_years: 0,
  });
  logs.unshift("An offworld colony mission launches.");
}

function render() {
  app.innerHTML = `
  <div class="top">
    <button id="play">${playing ? "Pause" : "Play"}</button>
    <label>Speed</label>
    <select id="speed">
      <option value="0.1" ${speed === 0.1 ? "selected" : ""}>0.1x</option>
      <option value="1" ${speed === 1 ? "selected" : ""}>1x</option>
      <option value="5" ${speed === 5 ? "selected" : ""}>5x</option>
      <option value="20" ${speed === 20 ? "selected" : ""}>20x</option>
      <option value="100" ${speed === 100 ? "selected" : ""}>100x</option>
    </select>
    <button id="jump">+1M years</button>
    <button id="save">Save</button>
    <button id="load">Load</button>
    <span class="tags">Year ${Math.floor(state.time_years).toLocaleString()}</span>
  </div>
  <div class="main">
    <div class="panel">
      <h3>Global</h3>
      <div class="stat"><span>Temp</span><span>${state.global.mean_temp_c.toFixed(2)}°C</span></div>
      <div class="stat"><span>Biodiversity</span><span>${state.global.biodiversity_index.toFixed(1)}</span></div>
      <div class="stat"><span>Extinction risk</span><span>${state.global.extinction_risk.toFixed(1)}</span></div>
      <div class="stat"><span>Complexity</span><span>${state.global.complexity_potential.toFixed(1)}</span></div>
      <h3>Resources</h3>
      <div>OB ${state.resources.ob_current.toFixed(1)}/${state.resources.ob_max}</div>
      <div class="meter"><div class="fill-ob" style="width:${(state.resources.ob_current / state.resources.ob_max) * 100}%"></div></div>
      <div>ED ${state.resources.entropy_debt.toFixed(1)}</div>
      <div class="meter"><div class="fill-ed" style="width:${Math.min(100, state.resources.entropy_debt)}%"></div></div>
      <h3>Eras</h3>
      <div class="tags">${Object.entries(state.eras).filter(([, v]) => v).map(([k]) => k).join(", ")}</div>
      <h3>Offworld</h3>
      <div class="tags">Enabled: ${state.offworld.enabled ? "yes" : "no"}</div>
      <div class="tags">Colonies: ${state.offworld.colonies.length}</div>
      <button id="colony">Launch Colony</button>
      <div class="tags">Win: ${hasWinCondition(state) ? "achieved" : "in progress"}</div>
    </div>
    <div class="center">
      <canvas id="map" width="960" height="480"></canvas>
      <div class="tags">Selected cell: ${selectedCell}</div>
    </div>
    <div class="panel right">
      <h3>Timeline</h3>
      ${logs.slice(0, 60).map((entry) => `<div class="log-entry"><small>${new Date().toLocaleTimeString()}</small><div>${entry}</div></div>`).join("")}
    </div>
  </div>
  <div class="bottom">
    <input id="action" placeholder="Type divine intervention..." />
    <button id="intervene">Intervene</button>
    <button id="advisor">Advisor</button>
  </div>`;

  const canvas = document.getElementById("map") as HTMLCanvasElement;
  renderMap(canvas);
  canvas.onclick = (ev) => {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - r.left) / r.width) * W);
    const y = Math.floor(((ev.clientY - r.top) / r.height) * H);
    selectedCell = Math.max(0, Math.min(W * H - 1, y * W + x));
    render();
  };

  (document.getElementById("play") as HTMLButtonElement).onclick = () => { playing = !playing; render(); };
  (document.getElementById("speed") as HTMLSelectElement).onchange = (ev) => { speed = Number((ev.target as HTMLSelectElement).value); };
  (document.getElementById("jump") as HTMLButtonElement).onclick = () => tick(10);
  (document.getElementById("save") as HTMLButtonElement).onclick = () => { saveSlot(); render(); };
  (document.getElementById("load") as HTMLButtonElement).onclick = () => { loadSlot(); render(); };
  (document.getElementById("advisor") as HTMLButtonElement).onclick = async () => { await launchAdvisor(); render(); };
  (document.getElementById("colony") as HTMLButtonElement).onclick = () => { tryLaunchColony(); render(); };

  (document.getElementById("intervene") as HTMLButtonElement).onclick = async () => {
    const input = document.getElementById("action") as HTMLInputElement;
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await intervene(text);
    render();
  };
}

function tick(mult = 1) {
  const dtYears = computeDtYears(0.25 * mult, 100_000, speed);
  if (!playing && mult === 1) return;

  stepBaseline(state, dtYears);
  const drift = applyResourceDrift(state.resources.ob_current, state.resources.ob_max, state.resources.entropy_debt, dtYears, state.difficulty.ascension_level);
  state.resources.ob_current = drift.ob;
  state.resources.entropy_debt = drift.ed;

  updateColonyAges(state, dtYears);
  maybeSpawnRandomEvent(dtYears);

  const triggered = drainTriggeredEvents(state);
  for (const event of triggered) {
    logs.unshift(`Event: ${event.summary}`);
    state.global.extinction_risk = Math.min(100, state.global.extinction_risk + event.severity * 0.1);
    state.global.biodiversity_index = Math.max(0, state.global.biodiversity_index - event.severity * 0.08);
  }

  milestoneChecks();
  clampGlobalState(state);
}

setInterval(() => {
  tick();
  render();
}, 250);

render();
