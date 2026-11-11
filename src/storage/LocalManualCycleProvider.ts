import * as SecureStore from 'expo-secure-store';

import type { CycleDataProvider } from '../domain/cycle/CycleDataProvider';
import type { CycleSettings } from '../domain/cycle/cycleEngine';

import { storageKeys } from './keys';

export class LocalManualCycleProvider implements CycleDataProvider {
  async get(): Promise<CycleSettings | null> {
    const value = await SecureStore.getItemAsync(storageKeys.cycleSettings);
    if (!value) return null;
    try { return JSON.parse(value) as CycleSettings; } catch { return null; }
  }

  async save(settings: CycleSettings): Promise<void> {
    await SecureStore.setItemAsync(storageKeys.cycleSettings, JSON.stringify(settings), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async clear(): Promise<void> { await SecureStore.deleteItemAsync(storageKeys.cycleSettings); }
}
