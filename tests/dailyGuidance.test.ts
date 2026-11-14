import { describe, expect, it } from "vitest";

import { SUPPORTED_LANGUAGES } from "../src/config/constants";
import { dailyReminders } from "../src/domain/content/dailyGuidance";
import { addCalendarDays } from "../src/domain/cycle/dateOnly";
import copy from "../src/i18n/interface.json";
import { colors, darkColors } from "../src/theme";
describe("daily reminder contract", () => {
  it("has exactly one gratitude reminder and two different attention reminders for every day and locale", () => {
    for (let i = 0; i < 366; i++)
      for (const lang of SUPPORTED_LANGUAGES) {
        const lines = dailyReminders(addCalendarDays("2026-01-01", i), lang);
        expect(lines).toHaveLength(3);
        expect(lines.filter((l) => l.id === "gratitude")).toHaveLength(1);
        expect(new Set(lines.map((l) => l.id)).size).toBe(3);
        expect(lines.every((l) => l.text.trim().length > 0)).toBe(true);
      }
  });
  it("is stable on repeated reads, rotates positions, preserves identities across languages", () => {
    const positions = new Set<number>();
    for (let i = 0; i < 12; i++) {
      const date = addCalendarDays("2026-01-01", i);
      const a = dailyReminders(date, "en");
      expect(dailyReminders(date, "en")).toEqual(a);
      expect(dailyReminders(date, "ru").map((l) => l.id)).toEqual(
        a.map((l) => l.id),
      );
      positions.add(a.findIndex((l) => l.id === "gratitude"));
    }
    expect(positions.size).toBe(3);
  });
  it("localizes all new interface keys and keeps neutral light/dark foundations", () => {
    const keys = Object.keys(copy.en);
    for (const lang of SUPPORTED_LANGUAGES)
      expect(Object.keys(copy[lang])).toEqual(keys);
    expect(colors.background).toBe("#F5F8FA");
    expect(darkColors.background).toBe("#10171E");
  });
});
