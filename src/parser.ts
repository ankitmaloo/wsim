import { ParsedSimulatorUpdate } from "./types.js";

const START = "---UPDATE_JSON---";
const END = "---END_UPDATE_JSON---";

export function extractUpdateBlock(rawText: string): string | null {
  const start = rawText.indexOf(START);
  const end = rawText.indexOf(END);
  if (start < 0 || end < 0 || end <= start) return null;
  return rawText.slice(start + START.length, end).trim();
}

export function parseSimulatorUpdate(rawText: string): { parse_ok: boolean; parsed_update?: ParsedSimulatorUpdate } {
  const block = extractUpdateBlock(rawText);
  if (!block) return { parse_ok: false };

  try {
    const parsed = JSON.parse(block) as ParsedSimulatorUpdate;
    return { parse_ok: true, parsed_update: parsed };
  } catch {
    return { parse_ok: false };
  }
}
