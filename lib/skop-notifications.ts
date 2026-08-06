import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { CheckInCadence, QuitPlan } from '@/lib/skop-firestore';

const CHANNEL_ID = 'skop-check-ins';
const NOTIFICATION_ID = 'skop-spend-check-in';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// local reminders keep working without firebase messaging or an expo push token
export async function applyCheckInReminder(plan: QuitPlan) {
  if (Platform.OS === 'web') return false;

  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
  if (
    plan.status !== 'reducing' ||
    !plan.remindersEnabled ||
    !plan.checkInCadence ||
    !plan.reminderTime
  ) {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'SKOP check-ins',
      description: 'Reminders for spending check-ins',
      importance: Notifications.AndroidImportance.LOW,
      enableVibrate: false,
      showBadge: false,
      sound: null,
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission =
    currentPermission.status === 'granted'
      ? currentPermission
      : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return false;

  const hour = plan.reminderTime === 'morning' ? 8 : 20;
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Your SKOP check-in is ready',
      body: 'Take a moment to update your progress.',
      data: { url: '/check-in' },
      sound: false,
      ...(Platform.OS === 'android'
        ? { priority: Notifications.AndroidNotificationPriority.LOW }
        : {}),
    },
    trigger: buildTrigger(plan.checkInCadence, hour),
  });

  return true;
}

export async function clearCheckInReminder() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
}

function buildTrigger(cadence: CheckInCadence, hour: number): Notifications.NotificationTriggerInput {
  const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

  if (cadence === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId,
    };
  }

  if (cadence === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2,
      hour,
      minute: 0,
      channelId,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
    day: 1,
    hour,
    minute: 0,
    channelId,
  };
}
