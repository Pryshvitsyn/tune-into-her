import { afterEach, describe, expect, it, vi } from 'vitest';

import { createNativeSplashGate } from '../src/intro/nativeSplashGate';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

afterEach(() => vi.useRealTimers());

describe('native splash hide queue gate', () => {
  it('deduplicates pending hides and opens only after the actual hide promise resolves', async () => {
    const result = deferred();
    const hide = vi.fn(() => result.promise);
    const gate = createNativeSplashGate(hide);
    const changes = vi.fn();
    gate.subscribe(changes);
    gate.request(); gate.request();
    await settle();
    expect(hide).toHaveBeenCalledTimes(1);
    expect(gate.getState()).toEqual({ queued: false, failed: false, attempts: 1 });
    result.resolve(); await settle();
    expect(gate.getState().queued).toBe(true);
    gate.request();
    expect(hide).toHaveBeenCalledTimes(1);
    expect(changes).toHaveBeenLastCalledWith({ queued: true, failed: false, attempts: 1 });
  });

  it('retains a valid in-flight result across StrictMode subscription cleanup/replay', async () => {
    const result = deferred();
    const hide = vi.fn(() => result.promise);
    const gate = createNativeSplashGate(hide);
    const unsubscribe = gate.subscribe(vi.fn());
    gate.request(); await settle(); unsubscribe();
    result.resolve(); await settle();
    const current = vi.fn();
    gate.subscribe(current);
    expect(hide).toHaveBeenCalledTimes(1);
    expect(current).toHaveBeenLastCalledWith({ queued: true, failed: false, attempts: 1 });
  });

  it('fails closed, bounds retries, and can recover on a new foreground', async () => {
    vi.useFakeTimers();
    const hide = vi.fn((): Promise<void> => Promise.reject(new Error('native hide failed')));
    const gate = createNativeSplashGate(hide);
    gate.subscribe(vi.fn()); gate.request();
    await vi.runAllTimersAsync();
    expect(hide).toHaveBeenCalledTimes(3);
    expect(gate.getState()).toEqual({ queued: false, failed: true, attempts: 3 });
    hide.mockImplementation(() => Promise.resolve());
    gate.setActive(false); gate.setActive(true); await settle();
    expect(hide).toHaveBeenCalledTimes(4);
    expect(gate.getState().queued).toBe(true);
  });

  it('does not hide or retry while backgrounded and retains the prepared request', async () => {
    vi.useFakeTimers();
    const hide = vi.fn((): Promise<void> => Promise.reject(new Error('native hide failed')));
    const gate = createNativeSplashGate(hide);
    gate.subscribe(vi.fn()); gate.setActive(false); gate.request();
    await vi.runAllTimersAsync(); expect(hide).not.toHaveBeenCalled();
    gate.setActive(true); await settle(); gate.setActive(false);
    await vi.runAllTimersAsync(); expect(hide).toHaveBeenCalledTimes(1);
    expect(gate.getState().queued).toBe(false);
    hide.mockImplementation(() => Promise.resolve());
    gate.setActive(true); await settle();
    expect(gate.getState().queued).toBe(true);
  });

  it('cancels retries on unmount but supports an explicit retry after a bounded failure', async () => {
    vi.useFakeTimers();
    const hide = vi.fn((): Promise<void> => Promise.reject(new Error('native hide failed')));
    const gate = createNativeSplashGate(hide);
    const unsubscribe = gate.subscribe(vi.fn()); gate.request(); await settle(); unsubscribe();
    await vi.runAllTimersAsync(); expect(hide).toHaveBeenCalledTimes(1);
    gate.subscribe(vi.fn()); await vi.runAllTimersAsync();
    expect(hide).toHaveBeenCalledTimes(3);
    hide.mockImplementation(() => Promise.resolve());
    gate.retry(); await settle();
    expect(gate.getState().queued).toBe(true);
  });
});
