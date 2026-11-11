import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncFeedbackStore } from '../src/storage/AsyncFeedbackStore';

const storage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));

describe('guidance feedback storage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists a response, replaces the same date/cue response, and retains history', async () => {
    const store = new AsyncFeedbackStore();
    storage.getItem.mockResolvedValue(JSON.stringify([
      { date: '2026-01-01', cueId: 'menstrual_001', status: 'helpful' },
      { date: '2026-01-02', cueId: 'menstrual_002', status: 'not_tried' },
    ]));

    await store.set('2026-01-01', 'menstrual_001', 'not_helpful');

    const saved = JSON.parse(storage.setItem.mock.calls[0]![1]);
    expect(saved).toEqual([
      { date: '2026-01-02', cueId: 'menstrual_002', status: 'not_tried' },
      { date: '2026-01-01', cueId: 'menstrual_001', status: 'not_helpful' },
    ]);
  });

  it('treats malformed or invalid persisted data as empty', async () => {
    const store = new AsyncFeedbackStore();
    storage.getItem.mockResolvedValue('{bad');
    await expect(store.readAll()).resolves.toEqual([]);
    storage.getItem.mockResolvedValue(JSON.stringify([{ date: '2026-01-01', cueId: 'menstrual_001', status: 'unknown' }]));
    await expect(store.readAll()).resolves.toEqual([]);
  });
});
