interface NativeSplashState {
  queued: boolean;
  failed: boolean;
  attempts: number;
}

/** A successful Expo promise means hide was queued, not that UIKit painted it. */
export function createNativeSplashGate(hide: () => Promise<void>) {
  let state: NativeSplashState = { queued: false, failed: false, attempts: 0 };
  let requested = false;
  let active = true;
  let pending: Promise<void> | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<(value: NativeSplashState) => void>();
  const publish = () => { for (const listener of listeners) listener(state); };
  const cancelRetry = () => {
    if (retryTimer !== undefined) clearTimeout(retryTimer);
    retryTimer = undefined;
  };
  const attempt = () => {
    cancelRetry();
    if (!requested || !active || !listeners.size || state.queued || pending || state.attempts >= 3) return;
    state = { queued: false, failed: false, attempts: state.attempts + 1 };
    // Assign before invoking hide, including synchronous throws and effect replay.
    const operation = Promise.resolve().then(hide);
    pending = operation;
    publish();
    void operation.then(() => {
      pending = null;
      state = { ...state, queued: true, failed: false };
      publish();
    }, () => {
      pending = null;
      state = { ...state, failed: true };
      publish();
      if (active && listeners.size && state.attempts < 3) retryTimer = setTimeout(attempt, 250);
    });
  };
  return {
    getState: () => state,
    subscribe(listener: (value: NativeSplashState) => void) {
      listeners.add(listener);
      listener(state);
      attempt();
      return () => { listeners.delete(listener); if (!listeners.size) cancelRetry(); };
    },
    request() { requested = true; attempt(); },
    setActive(value: boolean) {
      if (active === value) return;
      active = value;
      cancelRetry();
      if (active) { state = { ...state, attempts: 0 }; attempt(); }
    },
    retry() { state = { ...state, attempts: 0 }; attempt(); },
  };
}
