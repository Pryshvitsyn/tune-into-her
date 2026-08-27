import * as Notifications from 'expo-notifications';

import type { NotificationBackend } from './NotificationScheduler';

export class ExpoNotificationBackend implements NotificationBackend {
  async list() { return Notifications.getAllScheduledNotificationsAsync(); }
  async cancel(identifier: string) { await Notifications.cancelScheduledNotificationAsync(identifier); }
  async schedule(date: Date, title: string, body: string, data: Record<string, string>) {
    return Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
  async requestPermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  }
  async permissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    return (await Notifications.getPermissionsAsync()).status;
  }
}
