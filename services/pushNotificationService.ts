// Intelligent Push Notification Service for UNITY WITHIN
// This module generates context-aware, personalized push notifications.

export interface UserProfile {
  firstName: string;
  lastGreetedToday?: string; // ISO date string
  hasCheckedInToday?: boolean;
  hasUsedToolkitToday?: boolean;
  streak?: number;
  isActive?: boolean;
}

const HOLIDAYS: { [isoDate: string]: string } = {
  // Example: '2026-12-25': 'Christmas',
  // Add more holidays as needed
};

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getUpcomingHolidays(): string[] {
  return Object.keys(HOLIDAYS);
}

function getHolidayName(date: string): string {
  return HOLIDAYS[date] || '';
}

export function generateNotification(user: UserProfile): string {
  const now = new Date();
  const hour = now.getHours();
  const today = getTodayISO();
  const holidays = getUpcomingHolidays();

  // Holiday greeting
  if (holidays.includes(today)) {
    return `Happy ${getHolidayName(today)}, ${user.firstName}! Wishing you peace and joy.`;
  }

  // Morning greeting
  if (hour >= 6 && hour < 10 && user.lastGreetedToday !== today) {
    return `Good morning, ${user.firstName}! Remember, you are enough.`;
  }

  // Mood check-in reminder
  if (!user.hasCheckedInToday) {
    return `How are you feeling today? Log your mood and reflect in your journal.`;
  }

  // Wellness nudge (afternoon)
  if (hour >= 14 && hour < 17 && !user.hasUsedToolkitToday) {
    return `Take a deep breath. Try a 2-minute breathing exercise in your Toolkit.`;
  }

  // Community engagement
  if (user.isActive && Math.random() < 0.2) {
    return `Someone just shared a gratitude moment. Join the conversation in Community Circles!`;
  }

  // Streak encouragement
  if (user.streak && user.streak % 3 === 0) {
    return `Congrats! You’ve checked in ${user.streak} days in a row. Keep up the great work!`;
  }

  // Default gentle nudge
  return `It’s okay to take a break. Your safe space is always here for you.`;
}
