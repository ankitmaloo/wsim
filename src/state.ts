import { enqueueEvents } from "./events.js";
import { clampGlobalState } from "./simulation.js";
import { GameState, ParsedSimulatorUpdate, QueueEvent } from "./types.js";

export function createInitialState(seed = 123456789): GameState {
  return {
    version: "1.0",
    seed,
    time_years: 0,
    earth_age_years: 1_000_000_000,
    difficulty: { ascension_level: 0, mode: "dynamic" },
    resources: { ob_current: 100, ob_max: 100, entropy_debt: 0 },
    global: {
      mean_temp_c: 18,
      atmos_pressure_atm: 1,
      atmos: { co2_ppm: 2000, ch4_ppm: 1500, o2_percent: 1, n2_percent: 78, other_percent: 20 },
      ocean_ph: 7.8,
      water_fraction: 0.71,
      ice_fraction: 0.05,
      land_fraction: 0.29,
      biodiversity_index: 5,
      extinction_risk: 25,
      habitability: 35,
      complexity_potential: 10,
    },
    hidden: {
      mantle_heat: 75,
      plate_mobility: 40,
      magnetic_field_strength: 60,
      nutrient_flux: 45,
      ocean_circulation_strength: 55,
      impact_flux: 50,
      stellar_brightening_factor: 1.02,
      evolutionary_option_space: 30,
    },
    eras: {
      prebiotic: true,
      microbial: false,
      oxygenation: false,
      eukaryotes: false,
      multicell: false,
      intelligence: false,
      industry: false,
      spacefaring: false,
      offworld_colony: false,
    },
    offworld: { enabled: false, colonies: [] },
    queue: [],
  };
}

export function applySimulatorUpdate(state: GameState, update: ParsedSimulatorUpdate, fallbackCost = 0): void {
  const obCost = update.ob_cost_final ?? fallbackCost;
  const edDelta = update.entropy_debt_delta ?? 0;

  state.resources.ob_current = Math.max(0, state.resources.ob_current - obCost);
  state.resources.entropy_debt = Math.max(0, state.resources.entropy_debt + edDelta);

  if (update.global_deltas) {
    for (const [key, value] of Object.entries(update.global_deltas)) {
      const k = key as keyof GameState["global"];
      const cur = state.global[k];
      if (typeof cur === "number" && typeof value === "number") {
        (state.global[k] as number) = cur + value;
      }
    }
  }

  if (update.hidden_deltas) {
    for (const [key, value] of Object.entries(update.hidden_deltas)) {
      const k = key as keyof GameState["hidden"];
      const cur = state.hidden[k];
      if (typeof cur === "number" && typeof value === "number") {
        (state.hidden[k] as number) = cur + value;
      }
    }
  }

  if (update.queue_add?.length) {
    const queued: QueueEvent[] = update.queue_add.map((ev, i) => ({
      id: `ev_${state.time_years}_${i}`,
      trigger_time_years: state.time_years + ev.trigger_in_years,
      type: ev.type,
      severity: ev.severity,
      summary: ev.summary,
      payload: {},
    }));
    enqueueEvents(state, queued);
  }

  clampGlobalState(state);
}
