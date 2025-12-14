import React, { useState, useEffect } from 'react';
import { MOODS } from '../constants';
import { Button } from './Button';
import { generateDailyAffirmation } from '../services/geminiService';
import { Sun, Sparkles, TrendingUp, Flame, Trophy, Star, Sprout, Flower, Trees, Wind, BrainCircuit, Heart, Zap, Phone, ExternalLink, Brain, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { UserProgress } from '../types';

interface DashboardProps {
  userName?: string;
  onNavigate: (view: any) => void;
}

const XP_PER_CHECKIN = 50;
const LEVELS = [
  { level: 1, name: "Seedling", minXp: 0, icon: Sprout },
  { level: 2, name: "Sprout", minXp: 100, icon: Flower },
  { level: 3, name: "Sapling", minXp: 300, icon: Trees },
  { level: 4, name: "Flourishing", minXp: 600, icon: Sun },
];

export const Dashboard: React.FC<DashboardProps> = ({ userName = "Friend", onNavigate }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [affirmation, setAffirmation] = useState<string>("Loading your daily calm...");
  const [loadingAffirmation, setLoadingAffirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);

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

  // Dummy data for the chart (could be made dynamic in a full backend app)
  const data = [
    { name: 'Mon', mood: 3 },
    { name: 'Tue', mood: 4 },
    { name: 'Wed', mood: 2 },
    { name: 'Thu', mood: 5 },
    { name: 'Fri', mood: 4 },
    { name: 'Sat', mood: 5 },
    { name: 'Sun', mood: selectedMood ? MOODS.findIndex(m => m.label === selectedMood) + 1 : 0 },
  ];

  useEffect(() => {
    fetchAffirmation("calm");
  }, []);

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

  const handleMoodSelect = (moodLabel: string) => {
    setSelectedMood(moodLabel);
    fetchAffirmation(moodLabel);
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
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 relative">
        <h3 className="font-bold text-gray-700 mb-4">Log your mood</h3>
        <div className="flex flex-wrap gap-4 justify-between sm:justify-start relative">
          {MOODS.map((mood) => (
            <button
              key={mood.label}
              onClick={() => handleMoodSelect(mood.label)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 transform hover:scale-105 ${
                selectedMood === mood.label 
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

      {/* Stats / Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Simple Weekly Mood Chart */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
           <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-unity-black flex items-center gap-2">
                    <TrendingUp size={20} className="text-unity-500"/> 
                    Mood History
                </h3>
           </div>
           <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip 
                        cursor={{fill: '#fff1f2'}} 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="mood" radius={[4, 4, 4, 4]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 6 ? '#f43f5e' : '#fbcfe8'} />
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
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  favorites.includes(tool.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
