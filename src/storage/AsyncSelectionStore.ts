import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailySelection, SelectionStore } from '../domain/content/types';

import { storageKeys } from './keys';

export class AsyncSelectionStore implements SelectionStore {
  async readAll(): Promise<DailySelection[]> {
    const value = await AsyncStorage.getItem(storageKeys.selections);
    return value ? (JSON.parse(value) as DailySelection[]) : [];
  }

  async writeAll(selections: DailySelection[]): Promise<void> {
    await AsyncStorage.setItem(storageKeys.selections, JSON.stringify(selections));
  }
}
