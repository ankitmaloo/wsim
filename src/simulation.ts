import { GameState } from "./types.js";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function computeDtYears(dtRealSeconds: number, yearsPerSecond: number, speedMultiplier: number): number {
  return dtRealSeconds * yearsPerSecond * speedMultiplier;
}

export function stepBaseline(state: GameState, dtYears: number): void {
  const earthAgeGyr = (state.earth_age_years + state.time_years) / 1e9;
  state.hidden.stellar_brightening_factor = 1 + (earthAgeGyr - 1.0) * 0.01 + (state.time_years / 1e9) * 0.01;

  const gh = 4.5 * Math.log(Math.max(1, state.global.atmos.co2_ppm) / 280) +
    0.8 * Math.log(Math.max(1, state.global.atmos.ch4_ppm) / 700);
  const alb = 12 * state.global.ice_fraction;
  const sol = 6 * (state.hidden.stellar_brightening_factor - 1);
  state.global.mean_temp_c = clamp(14 + gh - alb + sol, -100, 100);

  const phDelta = 0.002 * ((state.hidden.nutrient_flux - 50) / 50) -
    0.004 * Math.log(Math.max(1, state.global.atmos.co2_ppm) / 280);
  state.global.ocean_ph = clamp(state.global.ocean_ph + phDelta * (dtYears / 1_000_000), 0, 14);

  const targetIce = clamp((20 - state.global.mean_temp_c) / 70, 0, 1);
  state.global.ice_fraction = clamp(
    state.global.ice_fraction + (targetIce - state.global.ice_fraction) * 0.05 * (dtYears / 1_000_000),
    0,
    1,
  );

  const volatility = clamp(state.resources.entropy_debt / 2 + state.global.extinction_risk / 3, 0, 100);
  state.global.extinction_risk = clamp(
    state.global.extinction_risk + (volatility - state.global.extinction_risk) * 0.02 * (dtYears / 1_000_000),
    0,
    100,
  );

  const growth = (state.global.habitability - state.global.extinction_risk) * 0.01;
  state.global.biodiversity_index = clamp(
    state.global.biodiversity_index + growth * (dtYears / 1_000_000),
    0,
    100,
  );

  state.time_years += dtYears;
}

export function clampGlobalState(state: GameState): void {
  state.global.ocean_ph = clamp(state.global.ocean_ph, 0, 14);
  state.global.atmos.o2_percent = clamp(state.global.atmos.o2_percent, 0, 35);
  state.global.mean_temp_c = clamp(state.global.mean_temp_c, -100, 100);
  state.global.water_fraction = clamp(state.global.water_fraction, 0, 1);
  state.global.ice_fraction = clamp(state.global.ice_fraction, 0, 1);
  state.global.land_fraction = clamp(state.global.land_fraction, 0, 1);
  state.global.biodiversity_index = clamp(state.global.biodiversity_index, 0, 100);
  state.global.extinction_risk = clamp(state.global.extinction_risk, 0, 100);
  state.global.habitability = clamp(state.global.habitability, 0, 100);
  state.global.complexity_potential = clamp(state.global.complexity_potential, 0, 100);
}
