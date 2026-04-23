export type ViewState = 'dashboard' | 'chat' | 'community' | 'journal' | 'volunteer' | 'breathe' | 'education' | 'wellness' | 'admin' | 'support' | 'therapist-portal' | 'admin-volunteer-portal' | 'namethefeeling' | 'selfcompassion' | 'values' | 'bodyscan' | 'safespace' | 'reframer';

export interface MoodEntry {
  id: string;
  mood: string; // Enum labels like 'Happy', 'Sad'
  intensity: number; // 1-10
  note?: string;
  created_at: string;
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
  moodId?: number;
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