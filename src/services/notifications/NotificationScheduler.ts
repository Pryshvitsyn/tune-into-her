import type { SupportedLanguage } from '../../config/constants';
import { NOTIFICATION_HORIZON_DAYS } from '../../config/constants';
import type { SelectionStore } from '../../domain/content/types';
import { type CycleSettings } from '../../domain/cycle/cycleEngine';
import { addCalendarDays, dateOnlyToLocalDate, toDateOnly } from '../../domain/cycle/dateOnly';
import { resources } from '../../i18n/resources';

export interface ReminderConfig {
  enabled: boolean;
  hour: number;
  minute: number;
}

export interface ScheduleRequest {
  settings: CycleSettings;
  language: SupportedLanguage;
  reminder: ReminderConfig;
  brandName: string;
}

export interface NotificationBackend {
  list(): Promise<{ identifier: string; content: { data?: Record<string, unknown> } }[]>;
  cancel(identifier: string): Promise<void>;
  schedule(date: Date, title: string, body: string, data: Record<string, string>): Promise<string>;
  requestPermission(): Promise<boolean>;
  permissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>;
}

export class NotificationScheduler {
  constructor(private readonly backend: NotificationBackend, private readonly selections: SelectionStore) {}

  async rebuild(request: ScheduleRequest, now = new Date()): Promise<void> {
    const existing = await this.backend.list();
    for (const item of existing) {
      if (item.content.data?.kind === 'daily-cycle-cue') await this.backend.cancel(item.identifier);
    }
    if (!request.reminder.enabled) return;

    const today = toDateOnly(now);
    for (let offset = 0; offset < NOTIFICATION_HORIZON_DAYS; offset += 1) {
      const dateOnly = addCalendarDays(today, offset);
      const fireDate = dateOnlyToLocalDate(dateOnly);
      fireDate.setHours(request.reminder.hour, request.reminder.minute, 0, 0);
      if (fireDate <= now) continue;
      const notificationStrings = resources[request.language].translation;
      await this.backend.schedule(
        fireDate,
        request.brandName,
        notificationStrings.brand.dailyContext,
        { kind: 'daily-cycle-cue', date: dateOnly, language: request.language },
      );
    }
  }

  async cancelAll(): Promise<void> {
    for (const item of await this.backend.list()) {
      if (item.content.data?.kind === 'daily-cycle-cue') await this.backend.cancel(item.identifier);
    }
  }

  async requestPermission(): Promise<boolean> {
    return this.backend.requestPermission();
  }

  async permissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    return this.backend.permissionStatus();
  }
}

