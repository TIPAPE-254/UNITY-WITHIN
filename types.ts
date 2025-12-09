export type ViewState = 'landing' | 'dashboard' | 'chat' | 'journal' | 'breathe' | 'education' | 'wellness';

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