// src/notifications.js
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';


// Initialize with error handling
export const setupNotificationChannels = () => {
  if (Platform.OS === 'android') {
    try {
      PushNotification.createChannel(
        {
          channelId: "todo_reminders",
          channelName: "Todo Reminders",
          channelDescription: "Channel for task reminders",
          importance: 4, // IMPORTANCE_HIGH
          vibrate: true,
          soundName: "default",
        },
        (created) => {
          if (created) {
            console.log('Channel created successfully');
          } else {
            console.warn('Channel already exists');
          }
          // Verify creation
          PushNotification.getChannels(channels => {
            console.log('Confirmed channels:', channels);
          });
        }
      );
    } catch (error) {
      console.error('Channel creation failed:', error);
    }
  }
};

// Call this immediately when file loads
setupNotificationChannels();

PushNotification.getChannels(channel_ids => {
  console.log('Existing channels:', channel_ids); // Should show ["todo_reminders"]
});

export const scheduleDueDateNotification = (taskTitle, dueDate, todoId) => {
  if (!dueDate || !taskTitle) {
    console.error('Missing required parameters for notification');
    return;
  }

  const notificationDate = new Date(dueDate.getTime() - 15 * 60000); // 15 mins before
  console.log(`Scheduling notification for "${taskTitle}" at ${notificationDate}`);

  const notificationConfig = {
    /* Android */
    channelId: "todo_reminders", // Required for Android 8+
    id: todoId?.toString(), // Required for cancellation
    autoCancel: true,
    largeIcon: "ic_launcher",
    smallIcon: "ic_notification",
    color: "#4CAF50",
    
    /* iOS */
    alertAction: "view",
    
    /* Both */
    title: "📅 Task Due Soon!",
    message: `"${taskTitle}" is due soon!`, 
    date: notificationDate,
    allowWhileIdle: true, // Wake up device
    playSound: true,
    soundName: "default",
    vibrate: true,
  };

  try {
    PushNotification.localNotificationSchedule(notificationConfig);
    console.log('Notification scheduled successfully');
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
};

// Helper to cancel notifications
export const cancelNotification = (todoId) => {
  if (!todoId) return;
  PushNotification.cancelLocalNotification({ id: todoId.toString() });
  console.log(`Cancelled notification for todo ${todoId}`);
};

// Check notification permissions
export const checkPermissions = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    console.log('Notification permission granted:', granted);
    return granted;
  }
  return true; // iOS handles permissions differently
};