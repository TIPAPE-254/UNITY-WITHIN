import React, { useState, useEffect } from 'react';
import { MOODS, API_BASE_URL } from '../constants';
import { Button } from './Button';
import { generateDailyAffirmation } from '../services/geminiService';
import { Sun, Sparkles, TrendingUp, Flame, Trophy, Star, Sprout, Flower, Trees, Wind, BrainCircuit, Heart, Zap, Phone, ExternalLink, Brain, AlertTriangle, Compass, Activity, Waves, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { UserProgress } from '../types';
import { MoodLogger } from './MoodLogger';
import { MoodHistoryGraph } from './MoodHistoryGraph';
import { MicroGratitude } from './MicroGratitude';

interface DashboardProps {
  userName?: string;
  userId?: number;
  onNavigate: (view: any, data?: any) => void;
}

const XP_PER_CHECKIN = 50;
const LEVELS = [
  { level: 1, name: "Seedling", minXp: 0, icon: Sprout },
  { level: 2, name: "Sprout", minXp: 100, icon: Flower },
  { level: 3, name: "Sapling", minXp: 300, icon: Trees },
  { level: 4, name: "Flourishing", minXp: 600, icon: Sun },
];

const MOOD_SCORES: Record<string, number> = {
  'Happy': 5,
  'Calm': 4,
  'Okay': 3,
  'Sad': 2,
  'Stressed': 1,
  'Angry': 1
};

export const Dashboard: React.FC<DashboardProps> = ({ userName = "Friend", userId, onNavigate }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [affirmation, setAffirmation] = useState<string>("Loading your daily calm...");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [showJournalPrompt, setShowJournalPrompt] = useState<{ show: boolean, mood: string | null }>({ show: false, mood: null });
  const [buddieMessage, setBuddieMessage] = useState<string | null>(null);
  const [refreshGraph, setRefreshGraph] = useState(0);
  const [insights, setInsights] = useState<{ type: string, title: string, text: string }[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Gamification State
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('unity_progress');
    return saved ? JSON.parse(saved) : { points: 0, streak: 0, lastCheckInDate: null, level: 1 };
  });

  // Tool Usage and Favorites State
  const [toolUsage, setToolUsage] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('unity_tool_usage');
    return saved ? JSON.parse(saved) : {};
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('unity_tool_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchAffirmation("calm");
    if (userId) fetchInsights();
  }, [userId]);

  const fetchInsights = async () => {
    try {
      setLoadingInsights(true);
      const res = await fetch(`${API_BASE_URL}/ai/insights?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (e) {
      console.error("Failed to fetch insights", e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleMoodLogged = () => {
    handleCheckIn();
    setRefreshGraph(prev => prev + 1);
    fetchInsights();
  };

  const handleNegativeMood = async (mood: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood })
      });
      const data = await res.json();
      if (data.success) {
        setBuddieMessage(data.message);
      }
    } catch (e) {
      console.error("Buddie failed", e);
      setBuddieMessage("I'm here with you. Would you like to write about it?");
    }
    setShowJournalPrompt({ show: true, mood });
  };



  useEffect(() => {
    localStorage.setItem('unity_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('unity_tool_usage', JSON.stringify(toolUsage));
  }, [toolUsage]);

  useEffect(() => {
    localStorage.setItem('unity_tool_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const fetchAffirmation = async (moodLabel: string) => {
    setLoadingAffirmation(true);
    const result = await generateDailyAffirmation(moodLabel);
    setAffirmation(result);
    setLoadingAffirmation(false);
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

    // NOTE: Allowed multiple logs, but only one XP check-in per day for gamification balance
    // OR we could allow small XP for subsequent logs? For now keeping XP daily limited.
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
      {/* Journal Prompt Banner */}
      {showJournalPrompt.show && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full text-indigo-500 shadow-sm">
              <Heart size={24} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900">BUDDIE Check-in</h4>
              <p className="text-indigo-700 text-sm">{buddieMessage || "That sounded heavy. Would you like to write or talk about it?"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowJournalPrompt({ show: false, mood: null })}>
              Not now
            </Button>
            <Button onClick={() => { setShowJournalPrompt({ show: false, mood: null }); onNavigate('journal', { moodId: null }); }}>
              Yes, let's write
            </Button>
          </div>
        </div>
      )}

      {/* Mood Logger */}
      <section>
        {userId && (
          <MoodLogger
            userId={userId}
            onMoodLogged={() => setRefreshGraph(Date.now())}
            onNegativeMood={handleNegativeMood}
            onNavigate={onNavigate}
          />
        )}

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

      {/* Stats / Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Simple Weekly Mood Chart */}
        {/* Mood History Graph */}
        <section>
          {userId && <MoodHistoryGraph userId={userId} refreshTrigger={refreshGraph} />}
        </section>

        {/* Quick Suggestion */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 flex flex-col justify-center items-start space-y-4">
          <h3 className="font-bold text-unity-black">Feeling overwhelmed?</h3>
          <p className="text-gray-500 text-sm">Take a moment to center yourself. A 2-minute breathing exercise can reset your nervous system.</p>
          <Button onClick={() => { handleToolUse('breathing'); onNavigate('breathe'); }}>Start Breathing</Button>
        </section>

        {/* Micro-Gratitude (Tool #8) */}
        {userId && <MicroGratitude userId={userId} onSave={fetchInsights} />}
      </div>

      {/* AI-Driven Insights Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
        <div className="flex items-center gap-2 mb-6">
          <Brain size={20} className="text-unity-500" />
          <h3 className="font-bold text-unity-black">AI-Driven Insights</h3>
        </div>

        <div className="space-y-4">
          {loadingInsights ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${insight.type === 'PATTERN' ? 'bg-blue-50 border-blue-200' :
                  insight.type === 'SUGGESTION' ? 'bg-green-50 border-green-200' :
                    'bg-orange-50 border-orange-200'
                  }`}
              >
                <div className="flex items-start gap-3">
                  {insight.type === 'PATTERN' ? (
                    <TrendingUp size={20} className="text-blue-600 mt-0.5" />
                  ) : insight.type === 'SUGGESTION' ? (
                    <Sparkles size={20} className="text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle size={20} className="text-orange-600 mt-0.5" />
                  )}
                  <div>
                    <h4 className={`font-bold mb-1 ${insight.type === 'PATTERN' ? 'text-blue-900' :
                      insight.type === 'SUGGESTION' ? 'text-green-900' :
                        'text-orange-900'
                      }`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm ${insight.type === 'PATTERN' ? 'text-blue-700' :
                      insight.type === 'SUGGESTION' ? 'text-green-700' :
                        'text-orange-700'
                      }`}>
                      {insight.text}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Compass className="mx-auto mb-2 opacity-50" size={32} />
              <p>No insights yet. Check in above to start your journey.</p>
            </div>
          )}
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
