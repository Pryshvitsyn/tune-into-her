import type { SupportedLanguage } from '../../config/constants';
import { AcceleratedDemoStore } from '../../storage/AcceleratedDemoStore';

import { AcceleratedDemoScheduler, type DemoNotificationCopy } from './AcceleratedDemoScheduler';
import { ExpoNotificationBackend } from './ExpoNotificationBackend';

const scheduler = new AcceleratedDemoScheduler(new ExpoNotificationBackend(), new AcceleratedDemoStore());

export function loadDemoSession() {
  return scheduler.loadSession();
}

export function startDemoSession(language: SupportedLanguage, copy: DemoNotificationCopy) {
  return scheduler.start(language, copy);
}

export function stopDemoSession() {
  return scheduler.stop();
}

export function completeDemoSession(runId: string) {
  return scheduler.complete(runId);
}

export { DemoNotificationError } from './AcceleratedDemoScheduler';
export type { DemoNotificationCopy } from './AcceleratedDemoScheduler';
export type { AcceleratedDemoSession } from '../../storage/AcceleratedDemoStore';
