import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Play, Pause, RefreshCw } from 'lucide-react';

export const Breathe: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Rest');
  const [timeLeft, setTimeLeft] = useState(0);

  // Box Breathing: 4-4-4-4
  useEffect(() => {
    let interval: any;
    
    if (isActive) {
      if (timeLeft > 0) {
        interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      } else {
        // Cycle phases
        switch (phase) {
          case 'Rest':
          case 'Exhale': // End of cycle, start inhale
             setPhase('Inhale');
             setTimeLeft(4);
             break;
          case 'Inhale':
            setPhase('Hold');
            setTimeLeft(4);
            break;
          case 'Hold':
            setPhase('Exhale');
            setTimeLeft(4);
            break;
        }
      }
    } else {
      setPhase('Rest');
      setTimeLeft(0);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, phase]);

  const toggleSession = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      setPhase('Inhale');
      setTimeLeft(4);
    }
  };

  // Dynamic Styles
  const circleSize = phase === 'Inhale' ? 'scale-150' : phase === 'Exhale' ? 'scale-100' : 'scale-150'; // Hold stays expanded
  const color = phase === 'Inhale' ? 'bg-unity-300' : phase === 'Hold' ? 'bg-unity-400' : 'bg-unity-200';
  const text = isActive ? phase : 'Ready?';

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-unity-black">Box Breathing</h2>
        <p className="text-gray-500">Inhale (4s), Hold (4s), Exhale (4s)</p>
      </div>

      {/* Animation Circle */}
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Outer Ring */}
        <div className={`absolute w-full h-full rounded-full border-4 border-unity-100 transition-all duration-[4000ms] ${isActive && phase === 'Inhale' ? 'scale-110' : 'scale-100'}`}></div>
        
        {/* Core Circle */}
        <div className={`
            w-32 h-32 rounded-full flex items-center justify-center 
            transition-all duration-[4000ms] ease-in-out shadow-2xl
            ${isActive ? circleSize : 'scale-100'}
            ${isActive ? color : 'bg-unity-500'}
        `}>
          <span className="text-white font-bold text-xl animate-pulse">
            {isActive ? timeLeft : <WindIcon />}
          </span>
        </div>
        
        {/* Instruction Text */}
        <div className="absolute -bottom-16 text-2xl font-light text-unity-700 tracking-widest uppercase">
          {text}
        </div>
      </div>

      <Button size="lg" onClick={toggleSession} className="w-48 gap-2">
        {isActive ? <><Pause size={20}/> Pause</> : <><Play size={20}/> Start</>}
      </Button>
    </div>
  );
};

const WindIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
);
