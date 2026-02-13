import { InterventionCostInput, Magnitude, Scope } from "./types.js";

const COST_TABLE: Record<Scope, Record<Magnitude, number>> = {
  local: { tiny: 2, small: 5, medium: 10, huge: 18 },
  regional: { tiny: 6, small: 12, medium: 22, huge: 40 },
  planetary: { tiny: 15, small: 30, medium: 55, huge: 90 },
};

export function computeInterventionCost(input: InterventionCostInput): number {
  const base = COST_TABLE[input.scope][input.magnitude];
  const duration = Math.min(3, 1 + (input.duration_myr ?? 0) / 5);
  const edMultiplier = Math.min(2, 1 + input.entropyDebt / 150);
  const repeated = Math.max(0, input.repeatedCount ?? 0);
  const spamMultiplier = 1 + repeated * 0.2;
  return Math.round(base * duration * edMultiplier * spamMultiplier);
}

export function computeEntropyGain(baseCost: number, magnitude: Magnitude): number {
  const factor = magnitude === "medium" ? 0.8 : magnitude === "huge" ? 1.2 : 0.4;
  return baseCost * factor;
}

export function applyResourceDrift(
  obCurrent: number,
  obMax: number,
  entropyDebt: number,
  dtYears: number,
  ascensionLevel: number,
): { ob: number; ed: number } {
  const regenPerMyr = 2.0 * (1 + 0.05 * ascensionLevel);
  const regenPenalty = Math.max(0.25, Math.min(1, 1 - entropyDebt / 200));
  const regen = regenPerMyr * (dtYears / 1_000_000) * regenPenalty;
  const decay = 0.2 * (dtYears / 1_000_000);

  return {
    ob: Math.max(0, Math.min(obMax, obCurrent + regen)),
    ed: Math.max(0, entropyDebt - decay),
  };
}
