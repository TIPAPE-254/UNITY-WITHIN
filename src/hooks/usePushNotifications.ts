/**
 * usePushNotifications - Hook for managing push notifications
 * Provides permission request and notification registration functionality
 */

export const usePushNotifications = () => {
  const register = async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    }
  };

  return {
    register,
    sendNotification,
    permission: typeof window !== 'undefined' ? Notification.permission : 'denied'
  };
};
