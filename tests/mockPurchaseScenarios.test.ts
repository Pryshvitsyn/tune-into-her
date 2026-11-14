import { describe, expect, it, vi } from 'vitest';

import { MockPurchaseService } from '../src/services/purchases/MockPurchaseService';

const initial = Date.parse('2026-11-14T08:00:00.000Z');
const inactive = { status: 'inactive', isActive: false, isMock: true } as const;

describe('existing mock purchase service QA scenarios', () => {
  it('keeps cancelled auto-renewal active until its paid date, then expires on the injected clock', async () => {
    let now = initial;
    const service = new MockPurchaseService(undefined, false, { now: () => now });
    service.setScenario({ entitlement: { status: 'active_ending', isActive: true, isMock: false, expirationDate: new Date(initial + 1000).toISOString() } });
    expect(await service.getEntitlement()).toMatchObject({ status: 'active_ending', isActive: true, isMock: true, validForMs: 1000 });
    now += 1000;
    expect(await service.getCachedEntitlement()).toMatchObject({ status: 'expired', isActive: false, isMock: true });
    // Expiry cannot be undone by rewinding the injected fixture clock.
    now = initial;
    expect((await service.getEntitlement()).isActive).toBe(false);
  });
  it('makes an unavailable store retryable without granting or removing access', async () => {
    const service = new MockPurchaseService();
    service.setScenario({ entitlement: inactive, storeAvailable: false });
    await expect(service.getOffer()).rejects.toThrow('MOCK_STORE_UNAVAILABLE');
    expect((await service.getEntitlement()).isActive).toBe(false);
    service.setScenario({ entitlement: inactive });
    const offers = await service.getOffer();
    expect(offers.map(offer => offer.plan)).toEqual(['monthly', 'annual']);
    expect((await service.getEntitlement()).isActive).toBe(false);
  });
  it.each(['cancelled', 'pending', 'error'] as const)('models %s without unlocking or starting a trial', async purchaseResult => {
    const service = new MockPurchaseService();
    service.setScenario({ entitlement: inactive, purchaseResult });
    const offer = (await service.getOffer())[0]!;
    if (purchaseResult === 'error') await expect(service.purchase(offer)).rejects.toThrow('MOCK_PURCHASE_UNAVAILABLE');
    else expect(await service.purchase(offer)).toBe(purchaseResult);
    expect((await service.getEntitlement()).isActive).toBe(false);
  });
  it('restores only the configured simulated purchase, with a visible mock state and listener update', async () => {
    const service = new MockPurchaseService(undefined, false, { now: () => initial });
    const listener = vi.fn();
    const dispose = service.addEntitlementListener(listener);
    const purchase = vi.spyOn(service, 'purchase');
    service.setScenario({ entitlement: inactive, restoreState: { status: 'active_paid', isActive: true, isMock: false, expirationDate: new Date(initial + 3600000).toISOString() } });
    expect((await service.getEntitlement()).isActive).toBe(false);
    expect(await service.restore()).toMatchObject({ status: 'active_paid', isActive: true, isMock: true, validForMs: 3600000 });
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isActive: true, isMock: true }));
    expect(purchase).not.toHaveBeenCalled();
    dispose(); listener.mockClear(); service.setScenario({ entitlement: inactive });
    expect(listener).not.toHaveBeenCalled();
  });
});
