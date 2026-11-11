import { describe, expect, it } from "vitest";

import { SUPPORTED_LANGUAGES } from "../src/config/constants";
import { getCatalog, getLocalizedCue } from "../src/domain/content/contentRepository";
import { selectDailyCue } from "../src/domain/content/dailyCueService";
import type { DailySelection, SelectionStore } from "../src/domain/content/types";
import { estimateCycle, type CycleSettings } from "../src/domain/cycle/cycleEngine";
import { addCalendarDays } from "../src/domain/cycle/dateOnly";
import { resources } from "../src/i18n/resources";

class MemoryStore implements SelectionStore {
  values: DailySelection[] = [];
  async readAll() { return this.values; }
  async writeAll(values: DailySelection[]) { this.values = values; }
}

describe("content catalog", () => {
  it("uses the approved nine language identifiers", () => {
    expect(SUPPORTED_LANGUAGES).toEqual(["en", "it", "ru", "uk", "es", "fr", "ms", "ms-baba", "hi"]);
  });

  it("keeps Baba Malay and Hindi daily cue data genuinely distinct", () => {
    const malay = getLocalizedCue("ms", "menstrual_001");
    const baba = getLocalizedCue("ms-baba", "menstrual_001");
    const hindi = getLocalizedCue("hi", "menstrual_001");
    expect(baba).not.toEqual(malay);
    expect(hindi.howSheMayFeel).toMatch(/[\u0900-\u097F]/u);
  });
  it("has every English UI translation key in every supported language", () => {
    const leaves = (value: object, prefix = ""): string[] => Object.entries(value).flatMap(([key, entry]) => typeof entry === "object" && entry !== null ? leaves(entry, prefix + key + ".") : [prefix + key]);
    const lookup = (value: object, path: string): unknown => path.split(".").reduce<unknown>((current, key) => typeof current === "object" && current !== null ? (current as Record<string, unknown>)[key] : undefined, value);
    const keys = leaves(resources.en.translation as object);
    for (const language of SUPPORTED_LANGUAGES) for (const key of keys) expect(lookup(resources[language].translation as object, key), language + ":" + key).toBeTruthy();
  });

  it("has at least 365 unique, fully localized canonical daily cues", () => {
    const catalog = getCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(365);
    expect(new Set(catalog.map((item) => item.id)).size).toBe(catalog.length);
    const learnIds = new Set(["menstrual", "follicular", "mid_cycle", "luteal"]);
    for (const item of catalog) {
      expect(learnIds.has(item.learnMoreId)).toBe(true);
      for (const language of SUPPORTED_LANGUAGES) {
        const cue = getLocalizedCue(language, item.id);
        expect(cue.howSheMayFeel.trim()).not.toBe("");
        expect(cue.whatYouCanDo.trim()).not.toBe("");
        expect(cue.practicalMoves).toHaveLength(3);
        expect(cue.practicalMoves.every((move) => move.trim().length > 0)).toBe(true);
      }
    }
  });

  it("provides a year of default-cycle IDs without repeats", async () => {
    const store = new MemoryStore();
    const settings: CycleSettings = { lastKnownPeriodStart: "2026-01-01", typicalCycleLength: 28, typicalPeriodLength: 5 };
    const seen = new Set<string>();
    for (let offset = 0; offset < 365; offset += 1) {
      const date = addCalendarDays("2026-01-01", offset);
      const phase = estimateCycle({ ...settings, currentLocalDate: date }).estimatedPhase;
      seen.add(await selectDailyCue({ date, phase, settings, store }));
    }
    expect(seen.size).toBe(365);
  });
});
