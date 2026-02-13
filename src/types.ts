export type Scope = "local" | "regional" | "planetary";
export type Magnitude = "tiny" | "small" | "medium" | "huge";

export interface Resources {
  ob_current: number;
  ob_max: number;
  entropy_debt: number;
}

export interface GlobalState {
  mean_temp_c: number;
  atmos_pressure_atm: number;
  atmos: {
    co2_ppm: number;
    ch4_ppm: number;
    o2_percent: number;
    n2_percent: number;
    other_percent: number;
  };
  ocean_ph: number;
  water_fraction: number;
  ice_fraction: number;
  land_fraction: number;
  biodiversity_index: number;
  extinction_risk: number;
  habitability: number;
  complexity_potential: number;
}

export interface HiddenState {
  mantle_heat: number;
  plate_mobility: number;
  magnetic_field_strength: number;
  nutrient_flux: number;
  ocean_circulation_strength: number;
  impact_flux: number;
  stellar_brightening_factor: number;
  evolutionary_option_space: number;
}

export interface QueueEvent {
  id: string;
  trigger_time_years: number;
  type: string;
  severity: number;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface Colony {
  species_id: string;
  node: string;
  stability: number;
  self_sustaining: boolean;
  imports_needed: boolean;
  age_years: number;
}

export interface GameState {
  version: string;
  seed: number;
  time_years: number;
  earth_age_years: number;
  difficulty: { ascension_level: number; mode: "dynamic" | "fixed" };
  resources: Resources;
  global: GlobalState;
  hidden: HiddenState;
  eras: Record<string, boolean>;
  offworld: { enabled: boolean; colonies: Colony[] };
  queue: QueueEvent[];
}

export interface InterventionCostInput {
  scope: Scope;
  magnitude: Magnitude;
  duration_myr?: number;
  entropyDebt: number;
  repeatedCount?: number;
}

export interface ParsedSimulatorUpdate {
  ob_cost_final?: number;
  entropy_debt_delta?: number;
  global_deltas?: Partial<Record<keyof GlobalState, number>>;
  hidden_deltas?: Partial<Record<keyof HiddenState, number>>;
  queue_add?: Array<{
    trigger_in_years: number;
    type: string;
    severity: number;
    summary: string;
  }>;
}
