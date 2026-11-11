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
  phase: CueMetadata['phases'][number] | 'unconfirmed';
  settings: CycleSettings;
  store: SelectionStore;
  catalog?: CueMetadata[];
}): Promise<string> {
  const fingerprint = cycleFingerprint(options.settings);
  const history = await options.store.readAll();
  const existing = history.find((item) => item.date === options.date);
  if (existing) return existing.cueId;

  const catalog = options.catalog ?? getCatalog();
  // Never attach a phase-specific cue to an overdue, unconfirmed calendar
  // projection. Only the authored all-phase entries remain eligible.
  let candidates: CueMetadata[];
  if (options.phase === 'unconfirmed') {
    candidates = catalog.filter((item) => item.phases.length === 4);
  } else {
    const phase = options.phase;
    candidates = catalog.filter((item) => item.phases.includes(phase));
  }
  if (!candidates.length) throw new Error(`NO_CUES_FOR_PHASE:${options.phase}`);
  const used = new Set(history.map((item) => item.cueId));
  const offset = stableHash(`${options.date}:${fingerprint}`) % candidates.length;
  const rotated = [...candidates.slice(offset), ...candidates.slice(0, offset)];
  const unused = rotated.filter((item) => !used.has(item.id));
  const reserve = unused.filter(item => item.tags.includes('reserve-v4'));
  const pool = reserve.length ? reserve : unused.length ? unused : rotated;
  const byId = new Map(catalog.map(item => [item.id, item]));
  const recent = history.filter(item => item.date < options.date)
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 89)
    .map(item => byId.get(item.cueId)).filter((item): item is CueMetadata => !!item);
  // v4 slots share one-to-one support/context identities across every phase.
  // Prefer a candidate whose THREE components are absent from the previous 89
  // selections. Legacy histories/custom catalogs can lack such a candidate;
  // use a deterministic least-recent fallback rather than deleting history.
  const usedActions = new Set(recent.map(item => item.actionId).filter(Boolean));
  const usedSupport = new Set(recent.map(item => item.supportId).filter(Boolean));
  const usedContext = new Set(recent.map(item => item.contextId).filter(Boolean));
  const fresh = pool.find(item => item.actionId && item.supportId && item.contextId &&
    !usedActions.has(item.actionId) && !usedSupport.has(item.supportId) && !usedContext.has(item.contextId));
  const repetitionCost = (item: CueMetadata) => recent.reduce((cost, previous, index) => {
    const recency = 89 - index;
    return cost + recency * (
      (item.id === previous.id ? 100 : 0) +
      (item.actionId && item.actionId === previous.actionId ? 4 : 0) +
      (item.supportId && item.supportId === previous.supportId ? 2 : 0) +
      (item.contextId && item.contextId === previous.contextId ? 1 : 0));
  }, 0);
  const selected = fresh ?? pool.reduce<CueMetadata | undefined>((best, item) =>
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
