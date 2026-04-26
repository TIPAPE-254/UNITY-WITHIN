// pushNotificationApi.ts
// Frontend API utility for intelligent push notifications

export interface UserProfile {
  firstName: string;
  lastGreetedToday?: string;
  hasCheckedInToday?: boolean;
  hasUsedToolkitToday?: boolean;
  streak?: number;
  isActive?: boolean;
}

export async function sendIntelligentNotification(userId: string, userProfile: UserProfile) {
  const res = await fetch('/api/notify/intelligent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userProfile })
  });
  if (!res.ok) {
    throw new Error('Failed to send intelligent notification');
  }
  return res.json();
}
