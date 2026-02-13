import { GameState, QueueEvent } from "./types.js";

export function enqueueEvents(state: GameState, events: QueueEvent[]): void {
  state.queue.push(...events);
  state.queue.sort((a, b) => a.trigger_time_years - b.trigger_time_years);
}

export function drainTriggeredEvents(state: GameState): QueueEvent[] {
  const triggered: QueueEvent[] = [];
  while (state.queue.length > 0 && state.queue[0].trigger_time_years <= state.time_years) {
    const event = state.queue.shift();
    if (event) triggered.push(event);
  }
  return triggered;
}

export function updateColonyAges(state: GameState, dtYears: number): void {
  for (const colony of state.offworld.colonies) {
    colony.age_years += dtYears;
    if (colony.stability > 70 && !colony.imports_needed) {
      colony.self_sustaining = colony.age_years >= 10_000;
    } else {
      colony.self_sustaining = false;
    }
  }
}

export function hasWinCondition(state: GameState): boolean {
  return state.offworld.colonies.some((c) => c.self_sustaining && c.age_years >= 10_000);
}
