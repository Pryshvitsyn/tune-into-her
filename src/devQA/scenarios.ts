import { MONTHLY_PRODUCT_ID } from '../config/constants';
import type { CycleSettings } from '../domain/cycle/cycleEngine';
import { addCalendarDays, dateOnlyToLocalDate } from '../domain/cycle/dateOnly';
import type { MockPurchaseScenario } from '../services/purchases/MockPurchaseService';
import { APP_TRIAL_MS } from '../services/trial/AppTrialService';

export const QA_DAY_MS = 86_400_000;
export const QA_SCENARIOS = [
  { id: 'fresh', label: 'Fresh user — no cycle data' },
  { id: 'returning', label: 'Returning user — saved cycle' },
  ...([1, 7, 14, 21, 28] as const).map(day => ({ id: `cycle-${day}` as const, label: `Cycle day ${day}` })),
  { id: 'before-0800', label: 'Daily content — 07:59 before 08:00' },
  { id: 'trial-not-started', label: 'App access — explicit start not yet pressed' },
  { id: 'trial-begin', label: '14-day app access — beginning' },
  { id: 'trial-middle', label: '14-day app access — day 7' },
  { id: 'trial-expired', label: '14-day app access — exact expiry' },
  { id: 'paid-active', label: 'Paid access — active' },
  { id: 'paid-cancelled', label: 'Paid access — cancelled, still within paid term' },
  { id: 'paid-expired', label: 'Paid access — expired' },
  { id: 'store-unavailable', label: 'Store unavailable — retry and navigation' },
  { id: 'restore', label: 'Restore — inactive until explicit restore' },
] as const;
export type QAScenarioId = (typeof QA_SCENARIOS)[number]['id'];
export interface QAScenario {
  id: QAScenarioId;
  label: string;
  nowMs: number;
  cycleSettings: CycleSettings | null;
  onboardingComplete: boolean;
  /** null = not started; otherwise an existing server-side grant's elapsed UTC time. */
  trialElapsedMs: number | null;
  purchase: MockPurchaseScenario;
}
export function isQAScenarioId(value: unknown): value is QAScenarioId {
  return typeof value === 'string' && QA_SCENARIOS.some(scenario => scenario.id === value);
}

/** These dates are labelled fixtures, never production defaults or user data. */
export function makeQAScenario(id: QAScenarioId): QAScenario {
  const entry = QA_SCENARIOS.find(scenario => scenario.id === id);
  if (!entry) throw new Error('QA_UNKNOWN_SCENARIO');
  const day = id.startsWith('cycle-') ? Number(id.slice(6)) : 7;
  const settings: CycleSettings = { lastKnownPeriodStart: '2026-11-03', typicalCycleLength: 28, typicalPeriodLength: 5 };
  const now = dateOnlyToLocalDate(addCalendarDays(settings.lastKnownPeriodStart, day - 1));
  if (id === 'before-0800') { now.setDate(now.getDate() + 1); now.setHours(7, 59, 0, 0); }
  const nowMs = now.getTime();
  const inactive = { status: 'inactive', isActive: false, isMock: true } as const;
  const active = { status: 'active_paid', isActive: true, isMock: true, source: 'unknown', verification: 'verified', productIdentifier: MONTHLY_PRODUCT_ID, expirationDate: new Date(nowMs + 30 * QA_DAY_MS).toISOString() } as const;
  let trialElapsedMs: number | null = 7 * QA_DAY_MS;
  if (id === 'fresh' || id === 'trial-not-started') trialElapsedMs = null;
  if (id === 'trial-begin') trialElapsedMs = 0;
  if (['trial-expired', 'paid-active', 'paid-cancelled', 'paid-expired', 'store-unavailable', 'restore'].includes(id)) trialElapsedMs = APP_TRIAL_MS;
  const purchase: MockPurchaseScenario = { entitlement: inactive };
  if (id === 'paid-active') purchase.entitlement = active;
  if (id === 'paid-cancelled') purchase.entitlement = { ...active, status: 'active_ending', expirationDate: new Date(nowMs + 2 * QA_DAY_MS).toISOString() };
  if (id === 'paid-expired') purchase.entitlement = { ...active, status: 'expired', isActive: false, expirationDate: new Date(nowMs).toISOString() };
  if (id === 'store-unavailable') purchase.storeAvailable = false;
  if (id === 'restore') purchase.restoreState = active;
  return { id, label: entry.label, nowMs, cycleSettings: id === 'fresh' ? null : settings, onboardingComplete: id !== 'fresh', trialElapsedMs, purchase };
}
