import { describe, expect, it } from "vitest";

import { MockPurchaseService } from "../src/services/purchases/MockPurchaseService";

describe("purchase service states", () => {
  it.each([["active", true], ["inactive", false], ["expired", false], ["loading", false], ["error", false]] as const)("exposes %s access correctly", async (status, isActive) => {
    const service = new MockPurchaseService({ status, isActive, isMock: true });
    expect(await service.getEntitlement()).toMatchObject({ status, isActive });
  });

  it("models a cancelled purchase without granting access", async () => {
    const service = new MockPurchaseService(undefined, true);
    expect(await service.purchase(await service.getOffer())).toBe("cancelled");
    expect((await service.getEntitlement()).isActive).toBe(false);
  });

  it("models the 14-day trial on the annual auto-renewing offer", async () => {
    const service = new MockPurchaseService();
    const offer = await service.getOffer();
    expect(offer).toMatchObject({ billingPeriod: "P1Y", trialDuration: "P14D", trialEligible: true, isAutoRenewing: true });
    await service.purchase(offer);
    expect(await service.getEntitlement()).toMatchObject({ isActive: true, isTrial: true, willRenew: true });
  });
});
