import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { localDateKey, pickDailyMessage, type AddictionType } from '@stay-clean/shared';

/**
 * Daily encouragement as local notifications, scheduled two weeks ahead and
 * refreshed on every app open. No push server, so nothing leaves the phone.
 */

const DAYS_AHEAD = 14;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export interface ScheduleOptions {
  hour: number;
  discreet: boolean;
  addiction: AddictionType;
  /** Days clean today; the counter goes up by one for each day ahead. */
  daysCleanToday: number;
  salt: string;
  timeZone: string;
}

export async function rescheduleDailyNotifications(opts: ScheduleOptions): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, opts.hour, 0, 0);
    if (when.getTime() <= now.getTime()) continue;
    const days = opts.daysCleanToday + i;
    const message = pickDailyMessage({
      dateKey: localDateKey(when, opts.timeZone),
      daysClean: days,
      addiction: opts.addiction,
      recentIds: new Set(),
      salt: opts.salt,
    });
    await Notifications.scheduleNotificationAsync({
      content: opts.discreet
        ? { title: 'Daily check-in', body: 'You have a new message.' }
        : { title: `Day ${days}`, body: message.text },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: when },
    });
  }
}

export async function scheduleToughDayFollowUp(discreet: boolean): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: discreet
      ? { title: 'Check-in', body: 'How are you doing now?' }
      : { title: 'Checking in', body: 'You made it through those 15 minutes. How are you doing now?' },
    trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 15 * 60 },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
