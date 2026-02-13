import { describe, expect, it } from "vitest";
import { parseSimulatorUpdate } from "../src/parser.js";
import { applySimulatorUpdate, createInitialState } from "../src/state.js";

describe("parser and state application", () => {
  it("parses update block and applies deltas with clamping", () => {
    const raw = `Narrative\n---UPDATE_JSON---\n{"ob_cost_final":10,"entropy_debt_delta":5,"global_deltas":{"mean_temp_c":120,"ocean_ph":-20},"queue_add":[{"trigger_in_years":100,"type":"player_consequence","severity":30,"summary":"later"}]}\n---END_UPDATE_JSON---`;
    const parsed = parseSimulatorUpdate(raw);
    expect(parsed.parse_ok).toBe(true);

    const state = createInitialState();
    applySimulatorUpdate(state, parsed.parsed_update!, 22);

    expect(state.resources.ob_current).toBe(90);
    expect(state.resources.entropy_debt).toBe(5);
    expect(state.global.mean_temp_c).toBe(100);
    expect(state.global.ocean_ph).toBe(0);
    expect(state.queue.length).toBe(1);
  });

  it("falls back cleanly when no JSON block", () => {
    const parsed = parseSimulatorUpdate("Just narrative");
    expect(parsed.parse_ok).toBe(false);

    const state = createInitialState();
    applySimulatorUpdate(state, {}, 22);
    expect(state.resources.ob_current).toBe(78);
    expect(state.resources.entropy_debt).toBe(0);
  });
});
