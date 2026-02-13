import { describe, expect, it } from "vitest";
import { computeDtYears, stepBaseline } from "../src/simulation.js";
import { createInitialState } from "../src/state.js";

describe("baseline simulation", () => {
  it("converts real dt to game years", () => {
    expect(computeDtYears(0.25, 100_000, 2)).toBe(50_000);
  });

  it("steps state forward without invalid ranges", () => {
    const state = createInitialState();
    stepBaseline(state, 250_000);
    expect(state.time_years).toBe(250_000);
    expect(state.global.ocean_ph).toBeGreaterThanOrEqual(0);
    expect(state.global.ocean_ph).toBeLessThanOrEqual(14);
    expect(state.global.ice_fraction).toBeGreaterThanOrEqual(0);
    expect(state.global.ice_fraction).toBeLessThanOrEqual(1);
  });
});
