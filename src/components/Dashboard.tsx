import React, { useState, useEffect } from 'react';
import { API_BASE_URL, MOODS } from '../constants';
import { Button } from './Button';
import { generateDailyAffirmation } from '../services/geminiService';
import { Sun, Sparkles, TrendingUp, Flame, Trophy, Star, Sprout, Flower, Trees, Wind, BrainCircuit, Heart, Zap, Phone, ExternalLink, Brain, AlertTriangle, Video, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { UserProgress, Goal, Habit, SafetyPlan, Badge, WearableData } from '../types';

interface DashboardProps {
  userName?: string;
  onNavigate: (view: any) => void;
  onLogout?: () => void;
}

const XP_PER_CHECKIN = 50;
const LEVELS = [
  { level: 1, name: "Seedling", minXp: 0, icon: Sprout },
  { level: 2, name: "Sprout", minXp: 100, icon: Flower },
  { level: 3, name: "Sapling", minXp: 300, icon: Trees },
  { level: 4, name: "Flourishing", minXp: 600, icon: Sun },
];

interface MoodLog {
  id: number;
  mood: string;
  intensity: number;
  note: string | null;
  created_at: string;
}

interface MoodChartDatum {
  name: string;
  mood: number;
}

const moodScoreMap: Record<string, number> = {
  happy: 6,
  calm: 5,
  okay: 4,
  sad: 3,
  stressed: 2,
  angry: 1,
};

const getActiveUserId = (): string | null => {
  try {
    const savedUser = localStorage.getItem('unity_user');
    if (!savedUser) return null;
    const parsed = JSON.parse(savedUser);
    return parsed?.id ? String(parsed.id) : null;
  } catch {
    return null;
  }
};

const toMoodScore = (mood: string): number => moodScoreMap[mood.toLowerCase()] || 0;

const buildWeeklyMoodData = (logs: MoodLog[]): MoodChartDatum[] => {
  const today = new Date();
  const labels: MoodChartDatum[] = [];
  const dayBuckets = new Map<string, number[]>();

  logs.forEach((entry) => {
    const dateKey = new Date(entry.created_at).toDateString();
    if (!dayBuckets.has(dateKey)) {
      dayBuckets.set(dateKey, []);
    }
    dayBuckets.get(dateKey)?.push(toMoodScore(entry.mood));
  });

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toDateString();
    const dayValues = dayBuckets.get(key) || [];
    const avgMood = dayValues.length > 0
      ? Number((dayValues.reduce((sum, value) => sum + value, 0) / dayValues.length).toFixed(2))
      : 0;

    labels.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      mood: avgMood,
    });
  }

  return labels;
};

export const Dashboard: React.FC<DashboardProps> = ({ userName = "Friend", onNavigate, onLogout }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodChartData, setMoodChartData] = useState<MoodChartDatum[]>(() => buildWeeklyMoodData([]));
  const [affirmation, setAffirmation] = useState<string>("Loading your daily calm...");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [isStateHydrated, setIsStateHydrated] = useState(false);
  const therapistToolsEnabled = false; // Feature flag for therapist tools
  const [supportLink, setSupportLink] = useState<string | null>(null);

  // Gamification State
  const [progress, setProgress] = useState<UserProgress>({ points: 0, streak: 0, lastCheckInDate: null, level: 1 });

  // Tool Usage and Favorites State
  const [toolUsage, setToolUsage] = useState<Record<string, number>>({});

  const [favorites, setFavorites] = useState<string[]>([]);

  // Goal Setting & Habit Tracking State
  const [goals, setGoals] = useState<Goal[]>([]);

  const [habits, setHabits] = useState<Habit[]>([]);

  // Emergency & Safety Tools State
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan>({
    id: 'default',
    triggers: [],
    copingStrategies: [],
    supportContacts: [],
    emergencyActions: []
  });

  // Gamification Enhancements State
  const [badges, setBadges] = useState<Badge[]>([
    { id: 'first_checkin', name: 'First Steps', description: 'Completed your first mood check-in', icon: '🌱', earnedAt: null, requirement: 'Complete 1 mood check-in' },
    { id: 'week_streak', name: 'Week Warrior', description: 'Maintained a 7-day streak', icon: '🔥', earnedAt: null, requirement: '7-day streak' },
    { id: 'tool_explorer', name: 'Tool Explorer', description: 'Used 5 different tools', icon: '🛠️', earnedAt: null, requirement: 'Use 5 different tools' },
    { id: 'journal_keeper', name: 'Journal Keeper', description: 'Wrote 10 journal entries', icon: '📖', earnedAt: null, requirement: '10 journal entries' },
  ]);

  // Wearable Integration State
  const [wearableData, setWearableData] = useState<WearableData>({
    steps: 0,
    heartRate: 0,
    sleepHours: 0,
    lastSync: null
  });

  useEffect(() => {
    fetchAffirmation("calm");
  }, []);

  const createSupportCallLink = (mode: 'voice' | 'video') => {
    const roomId = `support-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return `${window.location.origin}/support-call/${roomId}?mode=${mode}`;
  };

  const startSupportCall = (mode: 'voice' | 'video') => {
    const link = createSupportCallLink(mode);
    setSupportLink(link);
    window.open(link, '_blank');
  };

  const copySupportLink = async () => {
    if (!supportLink) return;
    try {
      await navigator.clipboard.writeText(supportLink);
    } catch {
      // ignore clipboard errors
    }
  };

  useEffect(() => {
    const loadDashboardState = async () => {
      const userId = getActiveUserId();
      if (!userId) {
        setIsStateHydrated(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/state?userId=${encodeURIComponent(userId)}`);
        if (!response.ok) {
          throw new Error('Failed to load dashboard state');
        }

        const payload = await response.json();
        const state = payload?.data || {};

        if (state.progress) setProgress(state.progress);
        if (state.toolUsage) setToolUsage(state.toolUsage);
        if (state.favorites) setFavorites(state.favorites);
        if (state.goals) setGoals(state.goals);
        if (state.habits) setHabits(state.habits);
        if (state.safetyPlan) setSafetyPlan(state.safetyPlan);
        if (state.badges) setBadges(state.badges);
        if (state.wearableData) setWearableData(state.wearableData);
      } catch (error) {
        console.error('Failed to hydrate dashboard state:', error);
      } finally {
        setIsStateHydrated(true);
      }
    };

    void loadDashboardState();
  }, []);

  useEffect(() => {
    if (!isStateHydrated) return;

    const userId = getActiveUserId();
    if (!userId) return;

    const timeoutId = window.setTimeout(() => {
      void fetch(`${API_BASE_URL}/api/dashboard/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          state: {
            progress,
            toolUsage,
            favorites,
            goals,
            habits,
            safetyPlan,
            badges,
            wearableData,
          },
        }),
      }).catch((error) => {
        console.error('Failed to persist dashboard state:', error);
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [isStateHydrated, progress, toolUsage, favorites, goals, habits, safetyPlan, badges, wearableData]);

  const fetchAffirmation = async (moodLabel: string) => {
    setLoadingAffirmation(true);
    const result = await generateDailyAffirmation(moodLabel);
    setAffirmation(result);
    setLoadingAffirmation(false);
  };

  const fetchMoodHistory = async () => {
    const userId = getActiveUserId();
    if (!userId) {
      setMoodChartData(buildWeeklyMoodData([]));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/moods?userId=${encodeURIComponent(userId)}&range=week`);
      if (!response.ok) {
        throw new Error('Failed to fetch mood history');
      }

      const payload = await response.json();
      const logs = Array.isArray(payload?.data) ? payload.data as MoodLog[] : [];
      setMoodChartData(buildWeeklyMoodData(logs));
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  };

  const logMoodToDatabase = async (moodLabel: string) => {
    const userId = getActiveUserId();
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mood: moodLabel,
          intensity: toMoodScore(moodLabel),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log mood');
      }

      await fetchMoodHistory();
    } catch (error) {
      console.error('Mood logging failed:', error);
    }
  };

  useEffect(() => {
    const userId = getActiveUserId();
    if (!userId) {
      setMoodChartData(buildWeeklyMoodData([]));
      return;
    }

    void fetchMoodHistory();

    const streamUrl = `${API_BASE_URL}/api/moods/stream?userId=${encodeURIComponent(userId)}`;
    const stream = new EventSource(streamUrl);

    const handleMoodUpdate = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { data?: MoodLog[] };
        const logs = Array.isArray(payload?.data) ? payload.data : [];
        setMoodChartData(buildWeeklyMoodData(logs));
      } catch (error) {
        console.error('Failed to parse mood stream event:', error);
      }
    };

    stream.addEventListener('mood_update', handleMoodUpdate as EventListener);
    stream.onerror = (error) => {
      console.error('Mood stream disconnected:', error);
    };

    return () => {
      stream.removeEventListener('mood_update', handleMoodUpdate as EventListener);
      stream.close();
    };
  }, []);

  const handleMoodSelect = async (moodLabel: string) => {
    setSelectedMood(moodLabel);
    fetchAffirmation(moodLabel);
    await logMoodToDatabase(moodLabel);
    handleCheckIn();
  };

  const handleToolUse = (toolId: string) => {
    setToolUsage(prev => ({
      ...prev,
      [toolId]: (prev[toolId] || 0) + 1
    }));
  };

  const toggleFavorite = (toolId: string) => {
    setFavorites(prev =>
      prev.includes(toolId)
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const handleCheckIn = () => {
    const today = new Date().toDateString();

    // Prevent double check-in points for the same day
    if (progress.lastCheckInDate === today) return;

    let newStreak = progress.streak;
    let newPoints = progress.points + XP_PER_CHECKIN;

    // Check if yesterday was the last check-in for streak continuity
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (progress.lastCheckInDate === yesterday.toDateString()) {
      newStreak += 1;
      newPoints += 10; // Bonus for maintaining streak
    } else {
      newStreak = 1; // Reset streak if missed a day (or first time)
    }

    // Calculate Level
    let newLevel = 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (newPoints >= LEVELS[i].minXp) {
        newLevel = LEVELS[i].level;
        break;
      }
    }

    setProgress({
      points: newPoints,
      streak: newStreak,
      lastCheckInDate: today,
      level: newLevel
    });

    // Trigger visual feedback
    setXpGained(progress.lastCheckInDate === yesterday.toDateString() ? XP_PER_CHECKIN + 10 : XP_PER_CHECKIN);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setXpGained(null);
    }, 2000);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentLevel = LEVELS.find(l => l.level === progress.level) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.level === progress.level + 1);
  const progressToNext = nextLevel
    ? ((progress.points - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
    : 100;
  const journalingDays = Math.min(30, habits.find(h => h.name.toLowerCase().includes('journal'))?.currentCount || 0);
  const journalingProgress = Math.min(100, (journalingDays / 30) * 100);
  const breathingSessions = Math.min(50, toolUsage.breathing || 0);
  const breathingProgress = Math.min(100, (breathingSessions / 50) * 100);

  const updateHabitProgress = (habitId: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;

      const today = new Date().toDateString();
      if (habit.lastCompleted === today) return habit; // Already completed today

      const newCount = (habit.currentCount ?? 0) + 1;
      // Simple daily streak logic
      const newStreak = (habit.streak ?? 0) + 1;

      return {
        ...habit,
        currentCount: newCount,
        streak: newStreak,
        lastCompleted: today
      };
    }));
  };

  const getEarnedBadges = () => badges.filter(b => b.earnedAt !== null);
  const getAvailableBadges = () => badges.filter(b => b.earnedAt === null);

  useEffect(() => {
    // Update badge unlocks based on real user activity without injecting sample records.
    setBadges(prev => prev.map(badge => {
      if (badge.earnedAt) return badge;
      if (badge.id === 'first_checkin' && progress.points > 0) {
        return { ...badge, earnedAt: new Date().toISOString() };
      }
      if (badge.id === 'week_streak' && progress.streak >= 7) {
        return { ...badge, earnedAt: new Date().toISOString() };
      }
      if (badge.id === 'tool_explorer' && Object.keys(toolUsage).length >= 5) {
        return { ...badge, earnedAt: new Date().toISOString() };
      }
      return badge;
    }));
  }, [progress.points, progress.streak, toolUsage]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-unity-black">
            {getGreeting()}, <span className="text-unity-500">{userName}</span>
          </h1>
          <p className="text-gray-500">How is your heart feeling today?</p>
        </div>

        {/* Gamification Stats Pill */}
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-unity-100 flex items-center gap-6">
          <div className="flex items-center gap-2" title="Current Streak">
            <div className={`p-1.5 rounded-full ${progress.streak > 0 ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
              <Flame size={18} className={progress.streak > 0 ? "fill-orange-500" : ""} />
            </div>
            <div>
              <span className="block text-xs text-gray-400 font-medium uppercase">Streak</span>
              <span className="font-bold text-unity-black text-sm">{progress.streak} Day{progress.streak !== 1 && 's'}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-gray-100"></div>
          <div className="flex items-center gap-2" title="Total XP">
            <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600">
              <Star size={18} className="fill-yellow-600" />
            </div>
            <div>
              <span className="block text-xs text-gray-400 font-medium uppercase">Total XP</span>
              <span className="font-bold text-unity-black text-sm">{progress.points}</span>
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-2xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            title="Sign out"
          >
            Sign Out
          </button>
        )}
      </header>

      {/* Progress / Level Card */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-unity-50 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-unity-100 flex items-center justify-center text-unity-500">
            <currentLevel.icon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <h3 className="font-bold text-lg text-unity-black">Level {currentLevel.level}: {currentLevel.name}</h3>
              {nextLevel && <span className="text-xs text-gray-400">{Math.floor(nextLevel.minXp - progress.points)} XP to next level</span>}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-unity-400 to-unity-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        {progress.lastCheckInDate !== new Date().toDateString() && (
          <div className="bg-unity-50 rounded-xl p-3 flex items-center gap-3 text-sm text-unity-700">
            <Sparkles size={16} />
            <span>Check in today to earn <strong>+{XP_PER_CHECKIN} XP</strong> and keep your flame burning!</span>
          </div>
        )}
      </section>

      {/* Mood Selector */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 relative">
        <h3 className="font-bold text-gray-700 mb-4">Log your mood</h3>
        <div className="flex flex-wrap gap-4 justify-between sm:justify-start relative">
          {MOODS.map((mood) => (
            <button
              key={mood.label}
              onClick={() => {
                void handleMoodSelect(mood.label);
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 ${selectedMood === mood.label
                ? 'bg-unity-50 ring-2 ring-unity-400 scale-105'
                : 'hover:bg-gray-50'
                }`}
            >
              <span className="text-3xl filter drop-shadow-sm">{mood.emoji}</span>
              <span className={`text-xs font-medium ${selectedMood === mood.label ? 'text-unity-700' : 'text-gray-500'}`}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {/* XP Pop-up Animation */}
        {showConfetti && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="animate-bounce text-yellow-500 font-bold text-2xl drop-shadow-md">
              +{xpGained} XP!
            </div>
          </div>
        )}
      </section>

      {/* Daily Affirmation Card */}
      <section className="relative overflow-hidden bg-gradient-to-br from-unity-400 to-unity-600 rounded-3xl p-8 text-white shadow-lg transition-all hover:shadow-xl">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4 opacity-90">
            <Sun size={20} />
            <span className="uppercase tracking-wider text-xs font-bold">Daily Wisdom</span>
          </div>
          {loadingAffirmation ? (
            <div className="h-16 flex items-center">
              <div className="animate-pulse bg-white/30 h-4 w-3/4 rounded"></div>
            </div>
          ) : (
            <blockquote className="text-2xl sm:text-3xl font-serif italic leading-relaxed mb-6">
              "{affirmation}"
            </blockquote>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm"
            onClick={() => fetchAffirmation(selectedMood || "calm")}
          >
            New affirmation
          </Button>
        </div>
      </section>

      {/* Peer Support */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-bold text-unity-black">Peer Support</h3>
            <p className="text-gray-500 text-sm">Connect with a community listener via voice or video.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => startSupportCall('voice')}>
              <Phone size={16} className="mr-2" />
              Start Voice Call
            </Button>
            <Button onClick={() => startSupportCall('video')}>
              <Video size={16} className="mr-2" />
              Start Video Call
            </Button>
          </div>
        </div>
        {supportLink && (
          <div className="mt-4 bg-unity-50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-unity-600">Share this link with your listener if needed</p>
              <p className="text-xs text-unity-500 break-all">{supportLink}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={copySupportLink}>
              <Copy size={14} className="mr-2" />
              Copy Link
            </Button>
          </div>
        )}
      </section>

      {/* Stats / Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Simple Weekly Mood Chart */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-unity-black flex items-center gap-2">
              <TrendingUp size={20} className="text-unity-500" />
              Mood History
            </h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#fff1f2' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="mood" radius={[4, 4, 4, 4]}>
                  {moodChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.mood >= 4 ? '#86efac' : entry.mood >= 2 ? '#fcd34d' : entry.mood > 0 ? '#fca5a5' : '#f3f4f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Quick Suggestion */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 flex flex-col justify-center items-start space-y-4">
          <h3 className="font-bold text-unity-black">Feeling overwhelmed?</h3>
          <p className="text-gray-500 text-sm">Take a moment to center yourself. A 2-minute breathing exercise can reset your nervous system.</p>
          <Button onClick={() => { handleToolUse('breathing'); onNavigate('breathe'); }}>Start Breathing</Button>
        </section>
      </div>

      {/* Self-Therapy Tools Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-unity-black flex items-center gap-2">
            <Heart size={20} className="text-unity-500" /> Self-Therapy Tools
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Phone size={14} />
            <a href="tel:988" className="hover:text-unity-500 transition-colors flex items-center gap-1">
              Crisis Support <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'breathing',
              title: 'Breathing Exercises',
              desc: 'Box breathing, 4-7-8, and more',
              icon: Wind,
              color: 'bg-blue-100 text-blue-600',
              action: () => { handleToolUse('breathing'); onNavigate('breathe'); }
            },
            {
              id: 'grounding',
              title: 'Grounding Techniques',
              desc: '5-4-3-2-1 sensory exercise',
              icon: Zap,
              color: 'bg-green-100 text-green-600',
              action: () => { handleToolUse('grounding'); onNavigate('wellness'); }
            },
            {
              id: 'mindfulness',
              title: 'Mindfulness & Meditation',
              desc: 'Short guided sessions',
              icon: Heart,
              color: 'bg-purple-100 text-purple-600',
              action: () => { handleToolUse('mindfulness'); onNavigate('wellness'); }
            },
            {
              id: 'reframing',
              title: 'Cognitive Reframing',
              desc: 'Challenge negative thoughts',
              icon: BrainCircuit,
              color: 'bg-orange-100 text-orange-600',
              action: () => { handleToolUse('reframing'); onNavigate('wellness'); }
            },
            {
              id: 'relaxation',
              title: 'Relaxation Techniques',
              desc: 'Progressive muscle relaxation',
              icon: Sparkles,
              color: 'bg-pink-100 text-pink-600',
              action: () => { handleToolUse('relaxation'); onNavigate('wellness'); }
            },
            {
              id: 'gratitude',
              title: 'Gratitude Journaling',
              desc: 'Prompts for reflection',
              icon: Star,
              color: 'bg-yellow-100 text-yellow-600',
              action: () => { handleToolUse('gratitude'); onNavigate('journal'); }
            }
          ].sort((a, b) => {
            const aFav = favorites.includes(a.id);
            const bFav = favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
          }).map(tool => (
            <div key={tool.id} className="relative">
              <button
                onClick={tool.action}
                className="w-full bg-white p-4 rounded-2xl border border-unity-50 shadow-sm hover:border-unity-200 hover:shadow-md transition-all text-left flex items-center gap-4 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${tool.color}`}>
                  <tool.icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-unity-black">{tool.title}</h4>
                  <p className="text-xs text-gray-500">{tool.desc}</p>
                  {toolUsage[tool.id] && (
                    <p className="text-xs text-unity-500 mt-1">Used {toolUsage[tool.id]} times</p>
                  )}
                </div>
              </button>
              <button
                onClick={() => toggleFavorite(tool.id)}
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${favorites.includes(tool.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                title={favorites.includes(tool.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={12} className={favorites.includes(tool.id) ? 'fill-current' : ''} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-unity-100">
          <p className="text-xs text-gray-400 text-center">
            These tools are designed to complement, not replace, professional care. If you're in crisis, please reach out for help.
          </p>
        </div>
      </section>

      {/* Goal Setting & Habit Tracking Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-unity-500" />
          <h3 className="font-bold text-unity-black">Goals & Habits</h3>
        </div>

        <div className="space-y-6">
          {/* Active Goals */}
          <div>
            <h4 className="font-semibold text-unity-black mb-3">Active Goals</h4>
            {goals.filter(g => !g.completed).length === 0 ? (
              <p className="text-gray-500 text-sm">No active goals. Set your first goal to get started!</p>
            ) : (
              <div className="space-y-3">
                {goals.filter(g => !g.completed).map(goal => (
                  <div key={goal.id} className="bg-unity-50 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-unity-black">{goal.title}</h5>
                      <span className="text-xs text-gray-500">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-unity-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">{goal.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Habits */}
          <div>
            <h4 className="font-semibold text-unity-black mb-3">Daily Habits</h4>
            {habits.length === 0 ? (
              <p className="text-gray-500 text-sm">No habits tracked yet. Add habits to build consistency!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {habits.map(habit => (
                  <div key={habit.id} className="bg-green-50 p-4 rounded-2xl border border-green-200">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-green-900">{habit.name}</h5>
                      <div className="flex items-center gap-1">
                        <Flame size={14} className="text-orange-500" />
                        <span className="text-xs text-orange-600">{habit.streak}</span>
                      </div>
                    </div>
                    <p className="text-xs text-green-700 mb-3">{habit.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{habit.currentCount}/{habit.targetCount} this week</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-green-100 text-green-700 hover:bg-green-200"
                        onClick={() => updateHabitProgress(habit.id)}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Emergency & Safety Tools Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="font-bold text-unity-black">Emergency Support</h3>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => window.open('tel:988', '_blank')}
          >
            Get Help Now
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
            <h4 className="font-bold text-red-900 mb-2">Crisis Hotlines</h4>
            <div className="space-y-2 text-sm text-red-700">
              <p><strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988</p>
              <p><strong>Crisis Text Line:</strong> Text HOME to 741741</p>
              <p><strong>National Domestic Violence Hotline:</strong> 1-800-799-7233</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Your Safety Plan</h4>
            {safetyPlan.copingStrategies.length === 0 ? (
              <p className="text-sm text-blue-700">Create a personalized safety plan for when you feel overwhelmed.</p>
            ) : (
              <div className="space-y-2">
                <div>
                  <strong className="text-xs text-blue-800 uppercase">Coping Strategies:</strong>
                  <ul className="text-sm text-blue-700 mt-1">
                    {safetyPlan.copingStrategies.slice(0, 3).map((strategy, idx) => (
                      <li key={idx}>• {strategy}</li>
                    ))}
                  </ul>
                </div>
                {safetyPlan.supportContacts.length > 0 && (
                  <div>
                    <strong className="text-xs text-blue-800 uppercase">Support Contacts:</strong>
                    <ul className="text-sm text-blue-700 mt-1">
                      {Array.isArray(safetyPlan.supportContacts) ? (
                        safetyPlan.supportContacts.slice(0, 2).map((contact, idx) => (
                          <li key={idx}>• {typeof contact === 'string' ? contact : `${contact.name}: ${contact.phone}`}</li>
                        ))
                      ) : null}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-unity-100">
          <p className="text-xs text-gray-400 text-center">
            If you're in immediate danger, call emergency services (911 in the US).
          </p>
        </div>
      </section>

      {/* Gamification Enhancements Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-unity-500" />
          <h3 className="font-bold text-unity-black">Achievements & Badges</h3>
        </div>

        <div className="space-y-4">
          {/* Earned Badges */}
          <div>
            <h4 className="font-semibold text-unity-black mb-3">Earned Badges ({getEarnedBadges().length})</h4>
            {getEarnedBadges().length === 0 ? (
              <p className="text-gray-500 text-sm">No badges earned yet. Keep using the app to unlock achievements!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {getEarnedBadges().map(badge => (
                  <div key={badge.id} className="bg-yellow-50 p-3 rounded-2xl border border-yellow-200 text-center">
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <h5 className="font-medium text-yellow-900 text-sm">{badge.name}</h5>
                    <p className="text-xs text-yellow-700">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Badges */}
          <div>
            <h4 className="font-semibold text-unity-black mb-3">Available Badges</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {getAvailableBadges().map(badge => (
                <div key={badge.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-center opacity-60">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <h5 className="font-medium text-gray-700 text-sm">{badge.name}</h5>
                  <p className="text-xs text-gray-500">{badge.requirement}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-2">Milestone Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">30 Days of Journaling</span>
                <span className="text-xs text-purple-600">{journalingDays}/30 days</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${journalingProgress}%` }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-700">50 Breathing Sessions</span>
                <span className="text-xs text-purple-600">{breathingSessions}/50 sessions</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${breathingProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wearable Integration Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center gap-2 mb-6">
          <Zap size={20} className="text-unity-500" />
          <h3 className="font-bold text-unity-black">Health Integration</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3">Today's Activity</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{wearableData.steps.toLocaleString()}</div>
                <div className="text-xs text-blue-700">Steps</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{wearableData.heartRate || '--'}</div>
                <div className="text-xs text-blue-700">BPM</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{wearableData.sleepHours || '--'}</div>
                <div className="text-xs text-blue-700">Sleep (hrs)</div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              {wearableData.lastSync ? `Last synced: ${new Date(wearableData.lastSync).toLocaleDateString()}` : 'Not connected to wearable device'}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <h4 className="font-bold text-green-900 mb-2">AI Health Insights</h4>
            <p className="text-sm text-green-700">
              Based on your activity data, you might benefit from a short meditation session to help with stress recovery.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-unity-100">
          <Button variant="secondary" size="sm" className="w-full">
            Connect Wearable Device
          </Button>
        </div>
      </section>

      {/* Content Personalization Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-unity-500" />
          <h3 className="font-bold text-unity-black">Personalized Content</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-2">Daily Affirmation</h4>
            <p className="text-sm text-purple-700 italic">
              "You are stronger than you know, and more capable than you imagine."
            </p>
          </div>

          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
            <h4 className="font-bold text-indigo-900 mb-2">Recommended Reading</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-indigo-900 text-sm">The Power of Habit</h5>
                  <p className="text-xs text-indigo-700">Based on your goal-setting activity</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                <div>
                  <h5 className="font-medium text-indigo-900 text-sm">Mindful Breathing Techniques</h5>
                  <p className="text-xs text-indigo-700">Matches your breathing exercise usage</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded-2xl border border-pink-200">
            <h4 className="font-bold text-pink-900 mb-2">Seasonal Tips</h4>
            <p className="text-sm text-pink-700">
              As we move into winter, remember to maintain your light exposure and consider vitamin D supplements if needed.
            </p>
          </div>
        </div>
      </section>

      {/* Therapist/Admin Tools Section (Conditional) */}
      {therapistToolsEnabled && (
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
          <div className="flex items-center gap-2 mb-6">
            <Brain size={20} className="text-purple-500" />
            <h3 className="font-bold text-unity-black">Therapist Tools</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">Client Progress Dashboard</h4>
              <p className="text-sm text-purple-700">
                Monitor client mood trends, tool usage, and goal progress over time.
              </p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-2">Secure Messaging</h4>
              <p className="text-sm text-indigo-700">
                HIPAA-compliant messaging system for therapist-client communication.
              </p>
            </div>

            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200">
              <h4 className="font-bold text-teal-900 mb-2">Shared Resources</h4>
              <p className="text-sm text-teal-700">
                Assign homework, share articles, and create personalized treatment plans.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-unity-100">
            <p className="text-xs text-gray-400 text-center">
              Therapist tools require professional account verification.
            </p>
          </div>
        </section>
      )}

      {/* AI-Driven Insights Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center gap-2 mb-6">
          <Brain size={20} className="text-unity-500" />
          <h3 className="font-bold text-unity-black">AI-Driven Insights</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Pattern Detection</h4>
                <p className="text-sm text-blue-700">Your mood tends to dip on Mondays after late nights. Consider adjusting your weekend routine.</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-green-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-green-900 mb-1">Personalized Suggestion</h4>
                <p className="text-sm text-green-700">Based on your recent breathing exercises, try the "Grounding" technique when you feel overwhelmed.</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-orange-900 mb-1">Early Warning</h4>
                <p className="text-sm text-orange-700">Your stress levels have been elevated for 3 days. Consider reaching out to a friend or using the SOS mode.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-unity-100">
          <p className="text-xs text-gray-400 text-center">
            Insights are generated based on your usage patterns and are meant to support, not diagnose.
          </p>
        </div>
      </section>
    </div>
  );
};
