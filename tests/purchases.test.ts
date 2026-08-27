import { describe, expect, it } from 'vitest';

import { MockPurchaseService } from '../src/services/purchases/MockPurchaseService';

describe('purchase service states', () => {
  it.each([
    ['active_trial', true], ['active_paid', true], ['active_ending', true], ['inactive', false], ['expired', false], ['billing_issue', true], ['loading', false], ['error', false],
  ] as const)('exposes %s access correctly', async (status, isActive) => {
    const service = new MockPurchaseService({ status, isActive, isMock: true });
    expect(await service.getEntitlement()).toMatchObject({ status, isActive });
  });

  it('models user cancellation without granting access', async () => {
    const service = new MockPurchaseService(undefined, true);
    expect(await service.purchase(await service.getOffer())).toBe('cancelled');
    expect((await service.getEntitlement()).isActive).toBe(false);
  });

  it('restores the current store entitlement', async () => {
    const service = new MockPurchaseService({ status: 'active_paid', isActive: true, isMock: true });
    expect((await service.restore()).isActive).toBe(true);
  });
});
