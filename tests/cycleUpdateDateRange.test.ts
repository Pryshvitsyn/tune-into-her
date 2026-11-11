import { describe, expect, it } from "vitest";

import { cycleUpdateDateRange, isValidCycleUpdateDate } from "../src/domain/cycle/cycleUpdateDateRange";

describe("cycle update date range", () => {
  const today = new Date(2026, 8, 12, 10);

  it("limits Choose another date to the current calendar year through today", () => {
    const range = cycleUpdateDateRange(today);
    expect(range.minimumDate).toEqual(new Date(2026, 0, 1, 12));
    expect(range.maximumDate).toEqual(new Date(2026, 8, 12, 12));
  });

  it("rejects previous calendar years and future dates", () => {
    expect(isValidCycleUpdateDate(new Date(2025, 11, 31, 12), today)).toBe(false);
    expect(isValidCycleUpdateDate(new Date(2026, 8, 13, 12), today)).toBe(false);
    expect(isValidCycleUpdateDate(new Date(2026, 0, 1, 12), today)).toBe(true);
    expect(isValidCycleUpdateDate(today, today)).toBe(true);
  });
});
