import { describe, expect, it } from "vitest";
import { applyResourceDrift, computeEntropyGain, computeInterventionCost } from "../src/economy.js";

describe("economy", () => {
  it("computes intervention costs with multipliers", () => {
    const cost = computeInterventionCost({
      scope: "regional",
      magnitude: "medium",
      duration_myr: 5,
      entropyDebt: 75,
      repeatedCount: 1,
    });
    expect(cost).toBe(79);
  });

  it("computes entropy gain by magnitude", () => {
    expect(computeEntropyGain(22, "small")).toBeCloseTo(8.8);
    expect(computeEntropyGain(22, "medium")).toBeCloseTo(17.6);
    expect(computeEntropyGain(22, "huge")).toBeCloseTo(26.4);
  });

  it("applies OB regen and ED decay", () => {
    const drift = applyResourceDrift(20, 100, 100, 1_000_000, 2);
    expect(drift.ob).toBeCloseTo(21.1);
    expect(drift.ed).toBeCloseTo(99.8);
  });
});
