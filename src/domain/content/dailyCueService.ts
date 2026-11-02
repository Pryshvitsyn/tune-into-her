import { CONTENT_VERSION } from '../../config/constants';
import type { CycleSettings } from '../cycle/cycleEngine';
import type { DateOnly } from '../cycle/dateOnly';

import { getCatalog } from './contentRepository';
import type { CueMetadata, SelectionStore } from './types';

export function cycleFingerprint(settings: CycleSettings): string {
  return `${settings.lastKnownPeriodStart}:${settings.typicalCycleLength}:${settings.typicalPeriodLength}`;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export async function selectDailyCue(options: {
  date: DateOnly;
  phase: CueMetadata['phases'][number];
  settings: CycleSettings;
  store: SelectionStore;
  catalog?: CueMetadata[];
}): Promise<string> {
  const fingerprint = cycleFingerprint(options.settings);
  const history = await options.store.readAll();
  const existing = history.find((item) => item.date === options.date);
  if (existing) return existing.cueId;

  const catalog = options.catalog ?? getCatalog();
  const candidates = catalog.filter((item) => item.phases.includes(options.phase));
  if (!candidates.length) throw new Error(`NO_CUES_FOR_PHASE:${options.phase}`);
  const used = new Set(history.map((item) => item.cueId));
  const offset = stableHash(`${options.date}:${fingerprint}`) % candidates.length;
  const rotated = [...candidates.slice(offset), ...candidates.slice(0, offset)];
  const unused = rotated.filter((item) => !used.has(item.id));
  const pool = unused.length ? unused : rotated;
  const byId = new Map(catalog.map(item => [item.id, item]));
  const recent = history.filter(item => item.date < options.date)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
    .map(item => byId.get(item.cueId)).filter((item): item is CueMetadata => !!item);
  // Prefer fresh constituent text, not merely a fresh ID. Stable tie-breaking
  // follows the date/settings hash; locale and appearance never enter selection.
  const repetitionCost = (item: CueMetadata) => recent.reduce((cost, previous, index) => {
    const recency = 7 - index;
    return cost + recency * (
      (item.id === previous.id ? 100 : 0) +
      (item.actionId && item.actionId === previous.actionId ? 4 : 0) +
      (item.supportId && item.supportId === previous.supportId ? 2 : 0) +
      (item.contextId && item.contextId === previous.contextId ? 1 : 0));
  }, 0);
  const selected = pool.reduce<CueMetadata | undefined>((best, item) =>
    !best || repetitionCost(item) < repetitionCost(best) ? item : best, undefined);
  if (!selected) throw new Error(`NO_CUES_FOR_PHASE:${options.phase}`);

  await options.store.writeAll([
    ...history,
    { date: options.date, cueId: selected.id, cycleFingerprint: fingerprint, contentVersion: CONTENT_VERSION },
  ]);
  return selected.id;
}

export async function invalidateFutureSelections(store: SelectionStore, fromDate: DateOnly): Promise<void> {
  const history = await store.readAll();
  await store.writeAll(history.filter((item) => item.date <= fromDate));
}
