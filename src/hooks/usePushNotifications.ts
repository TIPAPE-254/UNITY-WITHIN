export const usePushNotifications = () => {
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const register = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push remains unavailable on this platform.');
      return;
    }

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      // 2. Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Push] Service Worker registered.');

      // 3. Fetch VAPID key
      const response = await fetch('/api/push/key');
      const { publicKey } = await response.json();
      
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      };

      // 4. Subscribe user
      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      console.log('[Push] User subscribed:', subscription);

      // 5. Send to server
      const savedUser = localStorage.getItem('unity_user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subscription.toJSON(),
          preferences: {
            userId: user?.id,
            moodReminder: true,
            journalReminder: true,
            breatheReminder: true
          }
        })
      });

      console.log('[Push] Subscription synced with server.');
    } catch (error) {
      console.error('[Push] Setup failed:', error);
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
