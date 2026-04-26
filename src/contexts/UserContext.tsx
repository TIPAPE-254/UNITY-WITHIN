import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserProgress, Goal, Habit, Badge } from '../types';
import { API_BASE_URL } from '../constants';

interface UserContextType {
  progress: UserProgress;
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  toolUsage: Record<string, number>;
  setToolUsage: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  badges: Badge[];
  addXP: (amount: number) => void;
  logToolUse: (toolId: string) => void;
  updateStreak: () => void;
  isHydrated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState<UserProgress>({ points: 0, streak: 0, lastCheckInDate: null, level: 1 });
  const [toolUsage, setToolUsage] = useState<Record<string, number>>({});
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const LEVELS = [
    { level: 1, name: "Seedling", minXp: 0 },
    { level: 2, name: "Sprout", minXp: 200 },
    { level: 3, name: "Sapling", minXp: 500 },
    { level: 4, name: "Growing", minXp: 1000 },
    { level: 5, name: "Resilient", minXp: 1700 },
    { level: 6, name: "Flourishing", minXp: 2500 },
    { level: 7, name: "Anchored", minXp: 3500 },
    { level: 8, name: "Vibrant", minXp: 4700 },
    { level: 9, name: "Radiant", minXp: 6000 },
    { level: 10, name: "Harmonized", minXp: 7500 },
  ];

  const getActiveUserId = (): string | null => {
    const savedUser = localStorage.getItem('unity_user');
    if (!savedUser) return null;
    try {
      const parsed = JSON.parse(savedUser);
      return parsed?.id ? String(parsed.id) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadState = async () => {
      const userId = getActiveUserId();
      if (!userId) {
        setIsHydrated(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/state?userId=${encodeURIComponent(userId)}`);
        if (response.ok) {
          const payload = await response.json();
          const state = payload?.data || {};
          if (state.progress) setProgress(state.progress);
          if (state.toolUsage) setToolUsage(state.toolUsage);
          if (state.badges) setBadges(state.badges);
        }
      } catch (error) {
        console.error('Failed to load user state:', error);
      } finally {
        setIsHydrated(true);
      }
    };

    void loadState();
  }, []);

  // Save to backend whenever state changes
  useEffect(() => {
    if (!isHydrated) return;
    const userId = getActiveUserId();
    if (!userId) return;

    const timeoutId = setTimeout(() => {
      void fetch(`${API_BASE_URL}/api/dashboard/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          state: { progress, toolUsage, badges },
        }),
      }).catch(err => console.error('Failed to persist state:', err));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [progress, toolUsage, badges, isHydrated]);

  const addXP = (amount: number) => {
    setProgress((prev: UserProgress) => {
      const newPoints = prev.points + amount;
      // Level calculation logic
      let newLevel = 1;
      for (const l of LEVELS.sort((a, b) => b.level - a.level)) {
        if (newPoints >= l.minXp) {
          newLevel = l.level;
          break;
        }
      }
      return { ...prev, points: newPoints, level: newLevel };
    });
  };

  const logToolUse = (toolId: string) => {
    setToolUsage(prev => ({
      ...prev,
      [toolId]: (prev[toolId] || 0) + 1
    }));
    addXP(10); // Small XP for using any tool
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    if (progress.lastCheckInDate === today) return;

    setProgress((prev: UserProgress) => {
      let newStreak = prev.streak;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (prev.lastCheckInDate === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      return { ...prev, streak: newStreak, lastCheckInDate: today };
    });
  };

  return (
    <UserContext.Provider value={{ progress, setProgress, toolUsage, setToolUsage, badges, addXP, logToolUse, updateStreak, isHydrated }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
