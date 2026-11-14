import { MockPurchaseService } from '../services/purchases/MockPurchaseService';
import { AppTrialService, APP_TRIAL_MS } from '../services/trial/AppTrialService';

import { ScenarioClock } from './clock';
import { MemoryFeedbackStore, MemorySelectionStore, MemoryTrialStorage } from './memoryStores';
import type { QAScenario } from './scenarios';

/** Reuses the actual trial evaluator and existing mock purchase service; zero network/native storage. */
export function createQARuntime(scenario: QAScenario) {
  const clock = new ScenarioClock(scenario.nowMs);
  const purchases = new MockPurchaseService(undefined, false, clock);
  purchases.setScenario(scenario.purchase);
  let startedAt = scenario.trialElapsedMs === null ? null : clock.now() - scenario.trialElapsedMs;
  let startRequests = 0;
  const trialService = new AppTrialService({
    endpoint: 'https://internal-qa.invalid', environment: 'sandbox', clock,
    storage: new MemoryTrialStorage(),
    randomBytes: async length => new Uint8Array(length).fill(length),
    fetch: (async (_url, request) => {
      if (request?.method === 'POST') { startRequests += 1; startedAt ??= clock.now(); }
      const response = { environment: 'sandbox', serverNow: new Date(clock.now()).toISOString(), startedAt: startedAt === null ? null : new Date(startedAt).toISOString(), expiresAt: startedAt === null ? null : new Date(startedAt + APP_TRIAL_MS).toISOString() };
      // AppTrialService consumes exactly these Response fields. No platform fetch is called.
      return { ok: true, status: 200, json: async () => response } as Response;
    }) as typeof fetch,
  });
  return { clock, purchases, trialService, memorySelectionStore: new MemorySelectionStore(), memoryFeedbackStore: new MemoryFeedbackStore(), trialStartRequests: () => startRequests, setStoreAvailable: async (available: boolean) => { purchases.setScenario({ ...scenario.purchase, entitlement: await purchases.getEntitlement(), storeAvailable: available }); } };
}
export type QARuntime = ReturnType<typeof createQARuntime>;
