import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const blockedWords = ['politics', 'hate', 'harass', 'nazi', 'election', 'real nation'];
const calls = new Map();

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const arr = (calls.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= 30) {
    return res.status(429).json({ message: 'Cosmic cooldown: your oracle is overheating.' });
  }
  arr.push(now);
  calls.set(key, arr);
  next();
}

function moderateText(text = '') {
  const lower = String(text).toLowerCase();
  const matched = blockedWords.find((w) => lower.includes(w));
  return { allowed: !matched, reason: matched ? 'policy_blocked' : 'ok' };
}

function simulatorNarrativeAndUpdate(actionText, obCostEstimate = 22, entropyBefore = 0) {
  const t = actionText.toLowerCase();
  const temp = t.includes('ice') ? -1.1 : t.includes('co2') || t.includes('volcano') ? 1.1 : 0.2;
  const bio = t.includes('asteroid') ? -8 : t.includes('ocean') ? 4 : 1;
  const risk = t.includes('asteroid') ? 15 : 3;
  const obCostFinal = Math.max(1, Math.round(obCostEstimate * (1 + Math.min(0.2, entropyBefore / 500))));

  const parsedUpdate = {
    ob_cost_final: obCostFinal,
    entropy_debt_delta: Math.max(1, Math.round(obCostFinal * (t.includes('asteroid') ? 1.1 : 0.6))),
    global_deltas: {
      mean_temp_c: temp,
      biodiversity_index: bio,
      extinction_risk: risk,
      habitability: bio > 0 ? 2 : -5,
      complexity_potential: bio > 0 ? 1 : -2,
    },
    hidden_deltas: {
      nutrient_flux: t.includes('nutrient') ? 10 : 1,
      plate_mobility: t.includes('tectonic') ? 4 : 0,
      evolutionary_option_space: bio > 0 ? 2 : -3,
    },
    queue_add: [
      {
        trigger_in_years: 800_000,
        type: 'player_consequence',
        severity: 35,
        summary: 'Second-order ecosystem shift arrives with side effects.',
      },
    ],
    notes_for_player: ['Consequences compound with high Entropy Debt.'],
  };

  const raw = `You twist the world and reality grudgingly complies.\n\n---UPDATE_JSON---\n${JSON.stringify(parsedUpdate, null, 2)}\n---END_UPDATE_JSON---`;
  return { raw, parsedUpdate };
}

app.post('/api/moderate', (req, res) => {
  const text = req.body?.text || '';
  return res.json(moderateText(text));
});

app.post('/api/simulate/intervention', rateLimit, (req, res) => {
  const actionText = req.body?.player_action?.text || '';
  const moderation = moderateText(actionText);
  if (!moderation.allowed) {
    return res.status(400).json({
      raw_text: 'The cosmic tribunal denies reality-bending in that direction.',
      parsed_update: null,
      parse_ok: false,
      model_meta: { model: 'mock-sim', latency_ms: 5 },
      moderation,
    });
  }

  const obCostEstimate = req.body?.economy?.ob_cost_estimate ?? 22;
  const entropyBefore = req.body?.economy?.entropy_debt_before ?? 0;
  const started = Date.now();
  const { raw, parsedUpdate } = simulatorNarrativeAndUpdate(actionText, obCostEstimate, entropyBefore);

  return res.json({
    raw_text: raw,
    parsed_update: parsedUpdate,
    parse_ok: true,
    model_meta: { model: 'mock-sim', latency_ms: Date.now() - started },
  });
});

app.post('/api/simulate/event', rateLimit, (req, res) => {
  const summary = req.body?.event?.summary || 'A major world event unfolds.';
  const started = Date.now();
  const parsedUpdate = {
    ob_cost_final: 0,
    entropy_debt_delta: 3,
    global_deltas: {
      extinction_risk: 5,
      biodiversity_index: -4,
    },
    queue_add: [],
  };

  return res.json({
    raw_text: `${summary}\nThe biosphere adapts, badly.`,
    parsed_update: parsedUpdate,
    parse_ok: true,
    model_meta: { model: 'mock-event', latency_ms: Date.now() - started },
  });
});

app.post('/api/advisor', rateLimit, (req, res) => {
  const ed = Number(req.body?.state?.resources?.entropy_debt || 0);
  const chaos = ed > 60;
  return res.json({
    suggestions: [
      { text: 'Stabilize ocean circulation in a key basin.', expected_risk: 'low', ob_cost: 'moderate', mode: 'safe' },
      { text: 'Increase nutrient upwelling along selected coasts.', expected_risk: 'low', ob_cost: 'cheap', mode: 'safe' },
      { text: 'Nudge greenhouse gases downward gradually.', expected_risk: 'medium', ob_cost: 'moderate', mode: 'safe' },
      { text: chaos ? 'Open a controlled mantle plume and gamble on biodiversity reset.' : 'Test a regional tectonic uplift.', expected_risk: 'high', ob_cost: 'expensive', mode: 'chaos' },
      { text: 'Trigger a dramatic methane-haze experiment.', expected_risk: 'high', ob_cost: 'moderate', mode: 'chaos' },
    ],
  });
});

const PORT = Number(process.env.PORT || 8787);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
