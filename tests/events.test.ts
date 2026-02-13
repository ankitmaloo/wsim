import { describe, expect, it } from "vitest";
import { drainTriggeredEvents, enqueueEvents, hasWinCondition, updateColonyAges } from "../src/events.js";
import { createInitialState } from "../src/state.js";

describe("event queue", () => {
  it("orders and drains events by trigger time", () => {
    const state = createInitialState();
    enqueueEvents(state, [
      { id: "b", trigger_time_years: 10, type: "x", severity: 1, summary: "second" },
      { id: "a", trigger_time_years: 5, type: "x", severity: 1, summary: "first" },
    ]);

    state.time_years = 6;
    const triggered = drainTriggeredEvents(state);
    expect(triggered.map((e) => e.id)).toEqual(["a"]);
    expect(state.queue.map((e) => e.id)).toEqual(["b"]);
  });

  it("tracks colony stability win condition", () => {
    const state = createInitialState();
    state.offworld.colonies.push({
      species_id: "sp_1",
      node: "Mars",
      stability: 80,
      self_sustaining: false,
      imports_needed: false,
      age_years: 9_900,
    });

    updateColonyAges(state, 200);
    expect(hasWinCondition(state)).toBe(true);
  });
});
