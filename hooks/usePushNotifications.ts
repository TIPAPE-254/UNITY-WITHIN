import { useCallback, useEffect, useState } from 'react';

type PushPermission = NotificationPermission | 'unsupported';

const getCurrentPermission = (): PushPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
};

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>(getCurrentPermission());

  useEffect(() => {
    setPermission(getCurrentPermission());
  }, []);

  const register = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    if (Notification.permission !== 'default') {
      setPermission(Notification.permission);
      return Notification.permission;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }, []);

  return {
    permission,
    register,
  };
}
