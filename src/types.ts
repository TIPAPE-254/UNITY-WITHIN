export interface User {
  id: number;
  firstName: string;
  email: string;
}

export type ViewState = 'landing' | 'login' | 'signup' | 'dashboard' | 'chat' | 'journal' | 'breathe' | 'education' | 'wellness';

export interface MoodEntry {
  id: string;
  emoji: string;
  label: string;
  timestamp: Date;
  note?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
  tags: string[];
}

export interface EducationalContent {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
  content?: string; // Generated content
}

export interface UserProgress {
  points: number;
  streak: number;
  lastCheckInDate: string | null; // Date string
  level: number;
}

export interface TinyWin {
  id: string;
  text: string;
  date: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'health' | 'career' | 'relationships';
  targetDate: string;
  progress: number; // 0-100
  isCompleted: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompleted: string | null;
  targetCount: number; // e.g., 7 for weekly
  currentCount: number;
}

export interface SafetyPlan {
  id: string;
  triggers: string[];
  copingStrategies: string[];
  supportContacts: { name: string; phone: string }[];
  emergencyActions: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  requirement: string;
}

export interface WearableData {
  steps: number;
  heartRate: number;
  sleepHours: number;
  lastSync: string;
}