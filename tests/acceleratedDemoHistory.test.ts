import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DailySelection } from '../src/domain/content/types';
import { buildDemoDays } from '../src/domain/demo/acceleratedDemo';
import { AsyncSelectionStore } from '../src/storage/AsyncSelectionStore';
import { LocalManualCycleProvider } from '../src/storage/LocalManualCycleProvider';

const persistence = vi.hoisted(() => {
  const plain = new Map<string, string>();
  const secure = new Map<string, string>();
  return {
    plain,
    secure,
    asyncStorage: {
      getItem: vi.fn(async (key: string) => plain.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => { plain.set(key, value); }),
    },
    secureStore: {
      getItemAsync: vi.fn(async (key: string) => secure.get(key) ?? null),
      setItemAsync: vi.fn(async (key: string, value: string) => { secure.set(key, value); }),
      WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
    },
  };
});
vi.mock('@react-native-async-storage/async-storage', () => ({ default: persistence.asyncStorage }));
vi.mock('expo-secure-store', () => persistence.secureStore);

beforeEach(() => {
  persistence.plain.clear();
  persistence.secure.clear();
  vi.clearAllMocks();
});

describe('accelerated demonstration history isolation', () => {
  it('does not read or change real cycle settings or consume real daily selections', async () => {
    const baseline = await buildDemoDays('en');
    const realHistory: DailySelection[] = [{
      date: '2024-03-08',
      cueId: baseline[0]!.cueId,
      cycleFingerprint: 'real-history-must-stay-private',
      contentVersion: 3,
    }];
    await new AsyncSelectionStore().writeAll(realHistory);
    await new LocalManualCycleProvider().save({
      lastKnownPeriodStart: '2024-03-08',
      typicalCycleLength: 43,
      typicalPeriodLength: 8,
    });
    const plainBefore = new Map(persistence.plain);
    const secureBefore = new Map(persistence.secure);
    vi.clearAllMocks();

    const [english, russian] = await Promise.all([buildDemoDays('en'), buildDemoDays('ru')]);

    expect(english.map(day => day.cueId)).toEqual(baseline.map(day => day.cueId));
    expect(russian.map(day => day.cueId)).toEqual(baseline.map(day => day.cueId));
    expect(english[0]!.cueId).toBe(realHistory[0]!.cueId);
    expect(persistence.asyncStorage.getItem).not.toHaveBeenCalled();
    expect(persistence.asyncStorage.setItem).not.toHaveBeenCalled();
    expect(persistence.secureStore.getItemAsync).not.toHaveBeenCalled();
    expect(persistence.secureStore.setItemAsync).not.toHaveBeenCalled();
    expect(persistence.plain).toEqual(plainBefore);
    expect(persistence.secure).toEqual(secureBefore);
  });
});
