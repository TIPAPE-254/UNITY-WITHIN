import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushButton() {
  const { permission, register } = usePushNotifications();

  return (
    <button onClick={() => register()} disabled={permission === 'granted'}>
      {permission === 'granted' ? 'Push Enabled' : 'Enable Push Notifications'}
    </button>
  );
}
