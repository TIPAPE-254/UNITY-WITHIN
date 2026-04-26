import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Pause, RotateCcw, ChevronLeft, Info, Sparkles, Heart, Settings2 } from 'lucide-react';
import { Button } from './Button';
import { useUser } from '../contexts/UserContext';

type BreatheMode = 'box' | '478' | 'calm' | 'equal';

const MODES = {
  box: { name: 'Box Breathing', inhale: 4, hold1: 4, exhale: 4, hold2: 4, desc: 'For rapid stress relief and focus.' },
  '478': { name: '4-7-8 Relax', inhale: 4, hold1: 7, exhale: 8, hold2: 0, desc: 'Natural tranquilizer for the nervous system.' },
  calm: { name: 'Deep Calm', inhale: 5, hold1: 0, exhale: 7, hold2: 0, desc: 'Long exhales to activate the vagus nerve.' },
  equal: { name: 'Balanced', inhale: 5, hold1: 0, exhale: 5, hold2: 0, desc: 'Harmonize your heart rate and breath.' },
};

export const Breathe: React.FC = () => {
  const { logToolUse } = useUser();
  const [mode, setMode] = useState<BreatheMode>('box');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [timeLeft, setTimeLeft] = useState(MODES[mode].inhale);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Next Phase logic
            const currentMode = MODES[mode];
            if (phase === 'inhale') {
               if (currentMode.hold1 > 0) { setPhase('hold1'); return currentMode.hold1; }
               else { setPhase('exhale'); return currentMode.exhale; }
            } else if (phase === 'hold1') {
               setPhase('exhale'); return currentMode.exhale;
            } else if (phase === 'exhale') {
               if (currentMode.hold2 > 0) { setPhase('hold2'); return currentMode.hold2; }
               else { 
                  setSessionsCompleted(s => s + 1);
                  logToolUse('breathing');
                  setPhase('inhale'); return currentMode.inhale; 
               }
            } else {
               setSessionsCompleted(s => s + 1);
               logToolUse('breathing');
               setPhase('inhale'); return currentMode.inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, mode]);

  const toggleStart = () => {
    if (!isActive) {
       // Start
       setPhase('inhale');
       setTimeLeft(MODES[mode].inhale);
    }
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setPhase('inhale');
    setTimeLeft(MODES[mode].inhale);
  };

  // Derived UI states
  const getCircleScale = () => {
    if (phase === 'inhale') return 1.5;
    if (phase === 'exhale') return 1.0;
    if (phase === 'hold1' || phase === 'hold2') return phase === 'hold1' ? 1.5 : 1.0;
    return 1.0;
  };

  const getPhaseText = () => {
     if (phase === 'inhale') return 'Inhale';
     if (phase === 'exhale') return 'Exhale';
     return 'Hold';
  };

  const getPhaseColor = () => {
     if (phase === 'inhale') return 'text-blue-500';
     if (phase === 'exhale') return 'text-indigo-500';
     return 'text-teal-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center space-y-2">
         <h1 className="text-4xl font-black text-gray-900 tracking-tight">Mindful <span className="text-blue-500">Breathing</span></h1>
         <p className="text-gray-500 font-medium">Calm your mind and center your spirit in seconds.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings / Modes */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white rounded-[32px] p-6 border border-blue-50 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                 <Settings2 size={18} className="text-blue-500" /> Choose a Technique
              </h3>
              <div className="space-y-3">
                 {(Object.keys(MODES) as BreatheMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); reset(); }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        mode === m 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'border-gray-50 hover:bg-gray-50'
                      }`}
                    >
                       <p className={`font-bold transition-colors ${mode === m ? 'text-blue-600' : 'text-gray-700'}`}>
                         {MODES[m].name}
                       </p>
                       <p className="text-xs text-gray-400 mt-1">{MODES[m].desc}</p>
                    </button>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[32px] p-6 text-white shadow-lg">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-4">Your Progress</p>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-3xl font-black">{sessionsCompleted}</p>
                    <p className="text-[10px] font-bold opacity-70 uppercase">Sessions Done</p>
                 </div>
                 <div>
                    <p className="text-3xl font-black">{Math.floor(sessionsCompleted * 0.5)}</p>
                    <p className="text-[10px] font-bold opacity-70 uppercase">XP Earned</p>
                 </div>
              </div>
           </div>
        </div>

        {/* The Pacer */}
        <div className="lg:col-span-2 bg-white rounded-[40px] p-8 md:p-12 border border-blue-50 shadow-sm flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
           {/* Background decorative circles */}
           <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-4 border-blue-500 rounded-full animate-ping" />
           </div>

           {/* Breathing Circle */}
           <div className="relative mb-12">
              {/* Outer Glow */}
              <div 
                className={`absolute inset-0 rounded-full bg-blue-100 blur-3xl opacity-30 transition-all duration-1000 ${isActive ? 'scale-150' : 'scale-0'}`}
                style={{ transform: `scale(${getCircleScale() * 1.5})` }}
              />
              
              {/* Main Circle */}
              <div 
                className={`w-48 h-48 md:w-64 md:h-64 rounded-full border-8 border-blue-50 flex items-center justify-center transition-all ease-in-out z-10`}
                style={{ 
                  transform: `scale(${getCircleScale()})`,
                  transitionDuration: `${timeLeft * 1000}ms`
                }}
              >
                 <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex flex-col items-center justify-center p-8 text-center text-white shadow-2xl">
                    <Wind size={40} className="mb-2 opacity-50" />
                    <p className="text-4xl md:text-5xl font-black mb-1">{timeLeft}</p>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">{getPhaseText()}</p>
                 </div>
              </div>
           </div>

           {/* Controls */}
           <div className="flex flex-col items-center gap-6 z-20">
              <div className="flex items-center gap-4">
                 <button 
                  onClick={reset}
                  className="p-4 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 transition-colors"
                  title="Reset"
                 >
                   <RotateCcw size={24} />
                 </button>
                 <button 
                  onClick={toggleStart}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 ${
                    isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-500 text-white shadow-blue-200'
                  }`}
                 >
                   {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                 </button>
                 <div className="p-4 opacity-0 pointer-events-none">
                    <RotateCcw size={24} />
                 </div>
              </div>

              <div className="text-center">
                 <h2 className={`text-2xl font-black transition-colors ${getPhaseColor()}`}>
                    {isActive ? getPhaseText() : 'Ready to begin?'}
                 </h2>
                 <p className="text-gray-400 text-sm font-medium mt-1">
                    {isActive ? `Mode: ${MODES[mode].name}` : 'Tap Play to start your session'}
                 </p>
              </div>
           </div>

           {/* Instructions Overlay */}
           {!isActive && (
              <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl flex items-center gap-3 text-blue-600 text-sm font-medium animate-in fade-in duration-1000">
                 <Info size={18} />
                 <span>Find a comfortable seat, close your eyes, and follow the pacer.</span>
              </div>
           )}
        </div>
      </div>

      {/* Benefits Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: <Sparkles />, title: 'Lower Stress', desc: 'Regulate your cortisol levels naturally.' },
           { icon: <Heart />, title: 'Heart Health', desc: 'Improve heart rate variability (HRV).' },
           { icon: <Wind />, title: 'Focus', desc: 'Oxiginate your brain for better clarity.' },
         ].map((b, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-blue-50 flex items-center gap-4 hove:shadow-md transition-shadow">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                  {b.icon}
               </div>
               <div>
                  <h4 className="font-bold text-gray-900">{b.title}</h4>
                  <p className="text-xs text-gray-500">{b.desc}</p>
               </div>
            </div>
         ))}
      </section>
    </div>
  );
};
