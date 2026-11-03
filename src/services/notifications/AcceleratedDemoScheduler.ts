import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../config/constants';
import { DEMO_DAY_COUNT, DEMO_DAY_DURATION_MS } from '../../domain/demo/acceleratedDemo';
import type { AcceleratedDemoSession, DemoSessionStore } from '../../storage/AcceleratedDemoStore';

import type { NotificationBackend } from './NotificationScheduler';

export const DEMO_NOTIFICATION_KIND = 'accelerated-demo';

export interface DemoNotificationCopy {
  title: string;
  body: string;
}

export type DemoNotificationErrorCode =
  | 'DEMO_PERMISSION_DENIED'
  | 'DEMO_PERMISSION_REQUEST_FAILED'
  | 'DEMO_SCHEDULING_FAILED'
  | 'DEMO_CLEANUP_FAILED'
  | 'DEMO_STORAGE_FAILED'
  | 'DEMO_INVALID_REQUEST';

export class DemoNotificationError extends Error {
  constructor(readonly code: DemoNotificationErrorCode, readonly originalError?: unknown) {
    super(code);
    this.name = 'DemoNotificationError';
  }
}

interface DemoSchedulerOptions {
  now?: () => number;
  createRunId?: () => string;
}

let sequence = 0;

/** Schedules native one-off reminders. A JS timer is never responsible for delivery. */
export class AcceleratedDemoScheduler {
  private operation: Promise<unknown> = Promise.resolve();
  private readonly now: () => number;
  private readonly createRunId: () => string;

  constructor(
    private readonly backend: NotificationBackend,
    private readonly store: DemoSessionStore,
    options: DemoSchedulerOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.createRunId = options.createRunId ?? (() => `demo-${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2, 10)}`);
  }

  /** Serializes Start/Stop/Complete so rapid taps cannot leave a second run behind. */
  private serialize<T>(work: () => Promise<T>): Promise<T> {
    const result = this.operation.then(work, work);
    this.operation = result.then(() => undefined, () => undefined);
    return result;
  }

  loadSession(): Promise<AcceleratedDemoSession | null> {
    return this.serialize(async () => {
      try {
        return await this.store.read();
      } catch (error) {
        throw new DemoNotificationError('DEMO_STORAGE_FAILED', error);
      }
    });
  }

  start(language: SupportedLanguage, copy: DemoNotificationCopy): Promise<AcceleratedDemoSession> {
    return this.serialize(async () => {
      if (!SUPPORTED_LANGUAGES.includes(language) || !copy.title.trim() || !copy.body.trim()) {
        throw new DemoNotificationError('DEMO_INVALID_REQUEST');
      }
      let granted: boolean;
      try {
        granted = await this.backend.requestPermission();
      } catch (error) {
        throw new DemoNotificationError('DEMO_PERMISSION_REQUEST_FAILED', error);
      }
      if (!granted) throw new DemoNotificationError('DEMO_PERMISSION_DENIED');

      // Clear earlier demo runs, including an interrupted start without saved state.
      // Filtering native metadata protects daily reminders and unrelated notifications.
      await this.cancelOwned();
      await this.clearStoredSession();

      const session: AcceleratedDemoSession = {
        version: 1,
        runId: this.createRunId(),
        startedAt: this.now(),
        language,
        notificationIds: [],
      };
      if (
        !/^[a-zA-Z0-9_-]{1,120}$/.test(session.runId) ||
        !Number.isSafeInteger(session.startedAt) ||
        session.startedAt < 0 ||
        !Number.isFinite(new Date(session.startedAt + (DEMO_DAY_COUNT - 1) * DEMO_DAY_DURATION_MS).getTime())
      ) {
        throw new DemoNotificationError('DEMO_INVALID_REQUEST');
      }

      let failureCode: DemoNotificationErrorCode = 'DEMO_SCHEDULING_FAILED';
      try {
        for (let demoDay = 2; demoDay <= DEMO_DAY_COUNT; demoDay += 1) {
          const identifier = await this.backend.schedule(
            new Date(session.startedAt + (demoDay - 1) * DEMO_DAY_DURATION_MS),
            copy.title,
            copy.body,
            {
              kind: DEMO_NOTIFICATION_KIND,
              runId: session.runId,
              demoDay: String(demoDay),
              url: `/demo?runId=${encodeURIComponent(session.runId)}&day=${demoDay}`,
            },
          );
          if (!identifier || session.notificationIds.includes(identifier)) throw new Error('DEMO_NOTIFICATION_ID_INVALID');
          session.notificationIds.push(identifier);
        }
        failureCode = 'DEMO_STORAGE_FAILED';
        await this.store.write(session);
        return { ...session, notificationIds: [...session.notificationIds] };
      } catch (error) {
        // Also inspect native metadata: a failed schedule call might have been accepted
        // by the OS before its response failed to reach JavaScript.
        const cleaned = await this.rollback(session);
        throw new DemoNotificationError(cleaned ? failureCode : 'DEMO_CLEANUP_FAILED', error);
      }
    });
  }

  stop(): Promise<void> {
    return this.serialize(async () => {
      await this.cancelOwned();
      await this.clearStoredSession();
    });
  }

  /** Keeps the completed session so the last card remains available after completion. */
  complete(runId: string): Promise<void> {
    return this.serialize(async () => {
      await this.cancelOwned(runId);
      try {
        const session = await this.store.read();
        if (session?.runId === runId && session.notificationIds.length > 0) {
          await this.store.write({ ...session, notificationIds: [] });
        }
      } catch (error) {
        throw new DemoNotificationError('DEMO_STORAGE_FAILED', error);
      }
    });
  }

  private async clearStoredSession(): Promise<void> {
    try {
      await this.store.clear();
    } catch (error) {
      throw new DemoNotificationError('DEMO_STORAGE_FAILED', error);
    }
  }

  private async cancelOwned(runId?: string): Promise<void> {
    try {
      const owned = (await this.backend.list()).filter((item) =>
        item.content.data?.kind === DEMO_NOTIFICATION_KIND &&
        (runId === undefined || item.content.data.runId === runId),
      );
      const results = await Promise.allSettled(owned.map((item) => this.backend.cancel(item.identifier)));
      const rejected = results.find((result) => result.status === 'rejected');
      if (rejected?.status === 'rejected') throw rejected.reason;
    } catch (error) {
      throw new DemoNotificationError('DEMO_CLEANUP_FAILED', error);
    }
  }

  private async rollback(session: AcceleratedDemoSession): Promise<boolean> {
    const ids = new Set(session.notificationIds);
    let failed = false;
    try {
      for (const item of await this.backend.list()) {
        if (item.content.data?.kind === DEMO_NOTIFICATION_KIND && item.content.data.runId === session.runId) {
          ids.add(item.identifier);
        }
      }
    } catch {
      failed = true;
    }
    const results = await Promise.allSettled([...ids].map((id) => this.backend.cancel(id)));
    if (results.some((result) => result.status === 'rejected')) failed = true;
    try {
      await this.store.clear();
    } catch {
      failed = true;
    }
    return !failed;
  }
}
