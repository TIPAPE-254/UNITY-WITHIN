import React, { useState, useEffect } from 'react';
import { Clock, Activity, Video } from 'lucide-react';

interface SessionCountdownProps {
  scheduledTime: string; // ISO string or simple time string for today
  onReady?: () => void;
  isTherapist?: boolean;
}

export const SessionCountdown: React.FC<SessionCountdownProps> = ({ 
  scheduledTime, 
  onReady, 
  isTherapist = false 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledTime]);

  const calculateTimeLeft = () => {
    // Basic implementation for demonstration
    // In production, parse scheduledTime properly against the current timezone
    const now = new Date();
    const scheduled = new Date();
    
    if (scheduledTime.includes(':')) {
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      scheduled.setHours(hours, minutes, 0, 0);
    }

    const diff = scheduled.getTime() - now.getTime();

    if (diff <= 0) {
      setIsLive(true);
      setTimeLeft('LIVE');
      if (onReady) onReady();
    } else {
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    }
  };

  return (
    <div className={`p-6 rounded-3xl transition-all duration-500 flex items-center justify-between gap-6 ${
      isLive 
        ? 'bg-green-600 text-white shadow-2xl scale-105' 
        : 'bg-white border-2 border-slate-100 text-slate-900 shadow-lg'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          isLive ? 'bg-white/20' : 'bg-slate-100 text-purple-600'
        }`}>
          {isLive ? <Activity className="animate-pulse" size={24} /> : <Clock size={24} />}
        </div>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'opacity-80' : 'text-slate-400'}`}>
            {isLive ? 'Session Active' : 'Waiting for Session'}
          </p>
          <h3 className="text-2xl font-black">{timeLeft}</h3>
        </div>
      </div>
      
      {isLive && (
        <button className="px-6 py-2 bg-white text-green-600 font-black rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
          <Video size={18} />
          Join Now
        </button>
      )}
    </div>
  );
};
