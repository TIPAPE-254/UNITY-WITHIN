import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Play, Pause, RefreshCw, Wind, Heart, Zap, BookOpen } from 'lucide-react';

type BreathingPattern = {
  name: string;
  description: string;
  icon: React.ReactNode;
  inhale: number;
  hold?: number;
  exhale: number;
  holdEmpty?: number;
  prompts: {
    inhale: string;
    hold: string;
    exhale: string;
    holdEmpty: string;
  };
};

const PATTERNS: Record<string, BreathingPattern> = {
  STUCK: {
    name: "Feeling Stuck",
    description: "4-7-8 Relaxing Breath to calm the nervous system.",
    icon: <Zap size={24} className="text-yellow-500" />,
    inhale: 4,
    hold: 7,
    exhale: 8,
    prompts: {
      inhale: "Breathing in possibility...",
      hold: "Holding space for yourself...",
      exhale: "Letting go of the tension...",
      holdEmpty: "Resting..."
    }
  },
  HEAVY: {
    name: "Heavy Heart",
    description: "Coherent Breathing (6-6) to soothe grief and sadness.",
    icon: <Heart size={24} className="text-pink-500" />,
    inhale: 6,
    hold: 0,
    exhale: 6,
    prompts: {
      inhale: "Inhaling comfort...",
      hold: "",
      exhale: "Releasing the weight...",
      holdEmpty: ""
    }
  },
  EXAM: {
    name: "Exam Stress",
    description: "Box Breathing (4-4-4-4) for sharp focus and grounding.",
    icon: <BookOpen size={24} className="text-blue-500" />,
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdEmpty: 4,
    prompts: {
      inhale: "Inhale focus...",
      hold: "Steady mind...",
      exhale: "Exhale doubt...",
      holdEmpty: "Prepare..."
    }
  }
};

export const Breathe: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'HoldEmpty' | 'Rest'>('Rest');
  const [timeLeft, setTimeLeft] = useState(0);

  const currentPattern = selectedMode ? PATTERNS[selectedMode] : null;

  useEffect(() => {
    let interval: any;

    if (isActive && currentPattern) {
      if (timeLeft > 0) {
        interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      } else {
        // Cycle phases
        switch (phase) {
          case 'Rest':
            setPhase('Inhale');
            setTimeLeft(currentPattern.inhale);
            break;
          case 'Inhale':
            if (currentPattern.hold) {
              setPhase('Hold');
              setTimeLeft(currentPattern.hold);
            } else {
              setPhase('Exhale');
              setTimeLeft(currentPattern.exhale);
            }
            break;
          case 'Hold':
            setPhase('Exhale');
            setTimeLeft(currentPattern.exhale);
            break;
          case 'Exhale':
            if (currentPattern.holdEmpty) {
              setPhase('HoldEmpty');
              setTimeLeft(currentPattern.holdEmpty);
            } else {
              setPhase('Inhale');
              setTimeLeft(currentPattern.inhale);
            }
            break;
          case 'HoldEmpty':
            setPhase('Inhale');
            setTimeLeft(currentPattern.inhale);
            break;
        }
      }
    } else if (!isActive) {
      setPhase('Rest');
      setTimeLeft(0);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, phase, selectedMode]);

  const toggleSession = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      if (!currentPattern) return;
      setIsActive(true);
      setPhase('Inhale');
      setTimeLeft(currentPattern.inhale);
    }
  };

  const getPrompt = () => {
    if (!currentPattern) return "Ready?";
    if (!isActive) return "Press Start to Begin";
    switch (phase) {
      case 'Inhale': return currentPattern.prompts.inhale;
      case 'Hold': return currentPattern.prompts.hold;
      case 'Exhale': return currentPattern.prompts.exhale;
      case 'HoldEmpty': return currentPattern.prompts.holdEmpty;
      default: return "Ready?";
    }
  };

  // Dynamic Styles
  const circleSize =
    phase === 'Inhale' ? 'scale-150' :
      phase === 'Hold' ? 'scale-150' :
        phase === 'Exhale' ? 'scale-100' :
          phase === 'HoldEmpty' ? 'scale-100' : 'scale-100';

  const color =
    phase === 'Inhale' ? 'bg-unity-300' :
      phase === 'Hold' ? 'bg-unity-400' :
        phase === 'Exhale' ? 'bg-unity-200' : 'bg-unity-100';

  if (!selectedMode) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-8 min-h-[calc(100vh-140px)]">
        <div className="text-center space-y-4 max-w-lg">
          <h2 className="text-3xl font-bold text-unity-black">Just Breathe.</h2>
          <p className="text-gray-600 text-lg">Pick a tool for how you're feeling right now.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {Object.entries(PATTERNS).map(([key, pattern]) => (
            <button
              key={key}
              onClick={() => setSelectedMode(key)}
              className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-md hover:shadow-xl hover:scale-105 transition-all border border-gray-100 group"
            >
              <div className="p-4 bg-gray-50 rounded-full mb-4 group-hover:bg-unity-50 transition-colors">
                {pattern.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{pattern.name}</h3>
              <p className="text-center text-sm text-gray-500 leading-relaxed">{pattern.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] space-y-12 bg-gradient-to-b from-white to-blue-50/30">

      {/* Header */}
      <div className="text-center space-y-2 animate-fade-in-up">
        <button onClick={() => { setIsActive(false); setSelectedMode(null); }} className="text-sm text-gray-400 hover:text-unity-600 mb-4 flex items-center gap-1 mx-auto">
          ← Choose another
        </button>
        <h2 className="text-3xl font-bold text-unity-black">{currentPattern?.name}</h2>
        <p className="text-gray-500">{currentPattern?.description}</p>
      </div>

      {/* Animation Circle */}
      <div className="relative flex items-center justify-center w-80 h-80">
        {/* Outer Ring */}
        <div className={`absolute w-full h-full rounded-full border-2 border-unity-100/50 transition-all duration-[4000ms] ${isActive && phase === 'Inhale' ? 'scale-110 opacity-100' : 'scale-100 opacity-50'}`}></div>
        <div className={`absolute w-[90%] h-[90%] rounded-full border border-unity-200/30 transition-all duration-[4000ms] ${isActive && phase === 'Inhale' ? 'scale-105' : 'scale-100'}`}></div>

        {/* Core Circle */}
        <div className={`
            w-40 h-40 rounded-full flex items-center justify-center 
            transition-all duration-[1000ms] ease-in-out shadow-2xl backdrop-blur-sm
            ${isActive ? circleSize : 'scale-100'}
            ${isActive ? color : 'bg-unity-500'}
        `}>
          <span className="text-white font-bold text-4xl animate-pulse">
            {isActive ? timeLeft : <Wind size={40} />}
          </span>
        </div>
      </div>

      {/* Instruction Text & Controls */}
      <div className="flex flex-col items-center gap-8 z-10">
        <div className={`text-2xl transition-all duration-700 text-center h-12 flex items-center justify-center px-4 ${!isActive ? 'font-bold text-unity-600 text-3xl' : 'font-light text-unity-800'}`}>
          {getPrompt()}
        </div>

        <Button size="lg" onClick={toggleSession} className="w-56 h-14 text-lg gap-2 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
          {isActive ? <><Pause size={22} /> Pause Exercise</> : <><Play size={22} fill="currentColor" /> Start Breathing</>}
        </Button>
      </div>
    </div>
  );
};
