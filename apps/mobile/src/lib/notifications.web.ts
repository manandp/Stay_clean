import type { AddictionType } from '@stay-clean/shared';

/** Browser demo: reminders exist only in the phone apps, so these do nothing. */

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export interface ScheduleOptions {
  hour: number;
  discreet: boolean;
  addiction: AddictionType;
  daysCleanToday: number;
  salt: string;
  timeZone: string;
}

export async function rescheduleDailyNotifications(_opts: ScheduleOptions): Promise<void> {}

export async function scheduleToughDayFollowUp(_discreet: boolean): Promise<void> {}

export async function cancelAllNotifications(): Promise<void> {}
