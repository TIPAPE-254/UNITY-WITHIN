import React, { useState } from 'react';
import { ViewState } from '../types';
import { useUser } from '../contexts/UserContext';
import { Sparkles, Target, BarChart3, Map, BookOpen, Bot, Gamepad2, Flame, Award, Users, Crosshair, X, CheckCircle2, Stethoscope } from 'lucide-react';
import { TherapySessionRequest } from './TherapySessionRequest';

interface WellnessToolkitProps {
  onNavigate?: (view: ViewState) => void;
}

type ToolModal = 'xp' | 'challenge' | 'quest' | 'streak' | 'badges' | 'community' | 'goals' | 'checkin' | 'games' | 'thought-cloud' | 'therapy' | null;
type MoodTier = 'restore' | 'grow' | 'breakthrough' | null;

export const WellnessToolkit: React.FC<WellnessToolkitProps> = ({ onNavigate }) => {
  const [activeModal, setActiveModal] = useState<ToolModal>('checkin');
  const [moodTier, setMoodTier] = useState<MoodTier>(null);
  const { progress, logToolUse } = useUser();

  const handleToolClick = (toolId: string, action: () => void) => {
    logToolUse(toolId);
    action();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-pink-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles size={160} />
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Wellness <span className="text-pink-500">Toolkit</span></h1>
          <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
            Explore evidence-based, gamified tools designed for your healing and growth. 
            All tools are trauma-informed and clinically grounded.
          </p>
        </div>
      </div>

      {/* Layer 1: Self-Awareness */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
            <Target size={22} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Self-Awareness</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ToolCard
            icon={<Target className="text-pink-500" />}
            title="Mood XP & Emotion Leveling"
            desc="Earn Emotional XP for healthy actions. Watch your Inner Self avatar evolve as you grow."
            button="View Progress"
            onClick={() => setActiveModal('xp')}
            color="pink"
          />
          <ToolCard
            icon={<Crosshair className="text-blue-500" />}
            title="Adaptive Challenge Engine"
            desc="Mood-adjusted daily challenges. Gentle support on hard days, deeper growth when you're ready."
            button="Start Challenge"
            onClick={() => setActiveModal('challenge')}
            color="blue"
          />
          <ToolCard
            icon={<BarChart3 className="text-indigo-500" />}
            title="Mood Pattern Insights"
            desc="Visualize your emotional patterns and triggers. private and empowering insights."
            button="View Insights"
            onClick={() => onNavigate?.('dashboard')}
            color="indigo"
          />
        </div>
      </section>

      {/* Layer 2: Active Healing */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Crosshair size={22} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Active Healing</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard
            icon={<Map className="text-orange-500" />}
            title="Inner Quest Board"
            desc="Navigate CBT-based quests on a visual healing map."
            button="Open Quests"
            onClick={() => setActiveModal('quest')}
            color="orange"
          />
          <ToolCard
            icon={<BookOpen className="text-pink-500" />}
            title="Gamified Journaling"
            desc="Reflect with AI-prompts and unlock themed chapters."
            button="Start Journaling"
            onClick={() => onNavigate?.('journal')}
            color="pink"
          />
          <ToolCard
            icon={<Bot className="text-indigo-600" />}
            title="AI Coping Companion"
            desc="Empathetic chat for CBT/ACT support and grounding."
            button="Chat Now"
            onClick={() => onNavigate?.('chat')}
            color="indigo"
          />
          <ToolCard
            icon={<Gamepad2 className="text-blue-500" />}
            title="Mindfulness Games"
            desc="Playful games for breathing and self-compassion."
            button="Play Games"
            onClick={() => setActiveModal('games')}
            color="blue"
          />
        </div>
      </section>

      {/* Layer 3: Growth & Connection */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Award size={22} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Growth & Connection</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard
            icon={<Flame className="text-orange-600" />}
            title="Streak Tracker"
            desc="Build compassionate daily habits with Grace Days."
            button="Track Streak"
            onClick={() => setActiveModal('streak')}
            color="orange"
          />
          <ToolCard
            icon={<Award className="text-yellow-600" />}
            title="Badge System"
            desc="Earn beautiful badges for personal milestones."
            button="View Badges"
            onClick={() => setActiveModal('badges')}
            color="yellow"
          />
          <ToolCard
            icon={<Users className="text-blue-600" />}
            title="Community Quests"
            desc="Join monthly group healing challenges anonymously."
            button="See Quests"
            onClick={() => setActiveModal('community')}
            color="blue"
          />
          <ToolCard
            icon={<Target className="text-green-600" />}
            title="SDT Goals"
            desc="Set goals for autonomy, competence, and connection."
            button="Set Goals"
            onClick={() => setActiveModal('goals')}
            color="green"
          />
        </div>
      </section>
      
      {/* Layer 4: Clinical Support */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Stethoscope size={22} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Clinical Support</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ToolCard
            icon={<Stethoscope className="text-indigo-600" />}
            title="Book a Session"
            desc="Connect with licensed mental health professionals for 1-on-1 support."
            button="Find a Therapist"
            onClick={() => setActiveModal('therapy')}
            color="indigo"
          />
          <ToolCard
            icon={<Users className="text-purple-600" />}
            title="Professional Referral"
            desc="Access specialized networks for trauma, clinical depression, and more."
            button="Get Referral"
            onClick={() => {}}
            color="purple"
          />
        </div>
      </section>

      {/* Modals */}
      {activeModal && (
        <Modal onClose={() => setActiveModal(null)}>
          {activeModal === 'checkin' && (
            <MoodCheckin 
              onComplete={(tier) => {
                setMoodTier(tier);
                setActiveModal(null);
              }} 
            />
          )}
          {activeModal === 'xp' && <XPModal progress={progress} />}
          {activeModal === 'challenge' && <ChallengeModal />}
          {activeModal === 'quest' && <QuestModal />}
          {activeModal === 'streak' && <StreakModal progress={progress} />}
          {activeModal === 'badges' && <BadgeModal />}
          {activeModal === 'community' && <CommunityModal />}
          {activeModal === 'goals' && <GoalModal />}
          {activeModal === 'games' && (
            <div className="space-y-6">
               <h2 className="text-3xl font-black text-gray-900">Mindfulness Games</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveModal('thought-cloud')}
                    className="p-6 bg-blue-50 border border-blue-100 rounded-3xl text-left hover:shadow-md transition-all group"
                  >
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Wind size={24} />
                     </div>
                     <p className="font-bold text-gray-900">Thought Cloud</p>
                     <p className="text-xs text-gray-500 mt-1">Gently release negative thoughts into the sky.</p>
                  </button>
                  <button 
                    onClick={() => onNavigate?.('grounding')}
                    className="p-6 bg-teal-50 border border-teal-100 rounded-3xl text-left hover:shadow-md transition-all group"
                  >
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                     </div>
                     <p className="font-bold text-gray-900">5-4-3-2-1 Grounding</p>
                     <p className="text-xs text-gray-500 mt-1">Interactive sensory exercise for anxiety.</p>
                  </button>
               </div>
            </div>
          )}
          {activeModal === 'thought-cloud' && <ThoughtCloud onComplete={() => { setActiveModal(null); logToolUse('thought-cloud'); }} />}
          {activeModal === 'therapy' && (
            <div className="w-full max-w-4xl max-h-[80vh] overflow-y-auto custom-scrollbar rounded-3xl">
              <TherapySessionRequest onNavigate={onNavigate} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  button: string;
  onClick: () => void;
  color: 'pink' | 'blue' | 'indigo' | 'orange' | 'yellow' | 'green' | 'purple';
}

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, desc, button, onClick, color }) => {
  const colorMap = {
    pink: 'bg-pink-50 border-pink-100 hover:border-pink-200 text-pink-600',
    blue: 'bg-blue-50 border-blue-100 hover:border-blue-200 text-blue-600',
    indigo: 'bg-indigo-50 border-indigo-100 hover:border-indigo-200 text-indigo-600',
    orange: 'bg-orange-50 border-orange-100 hover:border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-100 hover:border-yellow-200 text-yellow-600',
    green: 'bg-green-50 border-green-100 hover:border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-100 hover:border-purple-200 text-purple-600',
  };

  const btnColorMap = {
    pink: 'bg-pink-500 hover:bg-pink-600 shadow-pink-200',
    blue: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200',
    orange: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200',
    green: 'bg-green-500 hover:bg-green-600 shadow-green-200',
    purple: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200',
  };

  return (
    <div className={`rounded-3xl border p-6 flex flex-col items-start transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${colorMap[color]}`}>
      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-bold text-xl mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 mb-6 flex-1 line-clamp-3">{desc}</p>
      <button 
        onClick={onClick}
        className={`w-full py-3 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-95 ${btnColorMap[color]}`}
      >
        {button}
      </button>
    </div>
  );
};

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
      >
        <X size={20} />
      </button>
      {children}
    </div>
  </div>
);

// --- Individual Tool Components ---

const MoodCheckin = ({ onComplete }: { onComplete: (tier: MoodTier) => void }) => {
  const [step, setStep] = useState(1);
  const [scores, setScores] = useState({ energy: 5, focus: 5, feeling: 5 });

  const handleFinish = () => {
    const avg = (scores.energy + scores.focus + scores.feeling) / 3;
    if (avg <= 3) onComplete('restore');
    else if (avg <= 7) onComplete('grow');
    else onComplete('breakthrough');
  };

  return (
    <div className="space-y-8 py-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500 mx-auto mb-4">
          <BrainCircuit size={32} />
        </div>
        <h2 className="text-3xl font-black text-gray-900">Daily Alignment</h2>
        <p className="text-gray-500">Let's match the toolkit to your energy today.</p>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <label className="block text-lg font-bold text-gray-700 text-center">How is your energy level?</label>
            <input 
              type="range" min="1" max="10" step="1" 
              value={scores.energy} 
              onChange={(e) => setScores({...scores, energy: parseInt(e.target.value)})}
              className="w-full h-3 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <label className="block text-lg font-bold text-gray-700 text-center">How focused do you feel?</label>
            <input 
              type="range" min="1" max="10" step="1" 
              value={scores.focus} 
              onChange={(e) => setScores({...scores, focus: parseInt(e.target.value)})}
              className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
              <span>Cloudy</span>
              <span>Clear</span>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <label className="block text-lg font-bold text-gray-700 text-center">How are you feeling overall?</label>
            <input 
              type="range" min="1" max="10" step="1" 
              value={scores.feeling} 
              onChange={(e) => setScores({...scores, feeling: parseInt(e.target.value)})}
              className="w-full h-3 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
              <span>Heavy</span>
              <span>Light</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4">
        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all"
          >
            Next
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="bg-pink-500 text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-pink-600 transition-all"
          >
            Enter Toolkit
          </button>
        )}
      </div>
    </div>
  );
};

const XPModal = ({ progress }: { progress: any }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-black text-gray-900">Mood XP Progress</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="p-6 bg-pink-50 rounded-3xl border border-pink-100">
        <p className="text-pink-600 font-bold uppercase text-xs tracking-wider mb-1">Total XP</p>
        <p className="text-4xl font-black text-gray-900">{progress.points}</p>
      </div>
      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
        <p className="text-blue-600 font-bold uppercase text-xs tracking-wider mb-1">Current Level</p>
        <p className="text-4xl font-black text-gray-900">{progress.level} <span className="text-lg font-bold text-gray-400">
          {progress.level === 1 ? 'Seedling' : progress.level === 2 ? 'Sprout' : progress.level === 3 ? 'Sapling' : 'Flourishing'}
        </span></p>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span>Next Level Progress</span>
        <span className="text-gray-400">{progress.points % 500} / 500 XP</span>
      </div>
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-pink-500 to-blue-500 rounded-full shadow-lg transition-all duration-1000" 
          style={{ width: `${(progress.points % 500) / 5}%` }}
        />
      </div>
    </div>
    <div className="space-y-4 pt-4">
      <h3 className="font-bold text-gray-800">Recent Milestones</h3>
      <div className="space-y-2">
        {[
          { text: 'Completed 7-day streak', xp: '+100 XP' },
          { text: 'Guided breathing session', xp: '+50 XP' },
          { text: 'Morning mood check-in', xp: '+20 XP' },
        ].map((m, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
            <span className="font-medium text-gray-700">{m.text}</span>
            <span className="font-bold text-pink-600">{m.xp}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CHALLENGES = [
  {
    title: "The Compassionate Observer",
    desc: "When a negative thought arises, try adding 'I notice I am having the thought that...' before it. Notice how it changes your relationship with the thought.",
    focus: "Cognitive Defusion"
  },
  {
    title: "The 3-Minute Breathing Space",
    desc: "Pause whatever you are doing. Focus entirely on the physical sensation of breathing for 180 seconds. Acknowledge your thoughts, then come back to the breath.",
    focus: "Mindfulness"
  },
  {
    title: "Values-Aligned Action",
    desc: "Identify one small thing you can do today that aligns with your value of 'Kindness' or 'Growth'. Do it, no matter how small.",
    focus: "Behavioral Activation"
  }
];

const ChallengeModal = () => {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const challenge = CHALLENGES[challengeIdx];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">Daily Challenge</h2>
      <div className="p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[32px] text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={24} />
          <span className="font-bold uppercase tracking-widest text-sm opacity-80">{challenge.focus}</span>
        </div>
        <h3 className="text-2xl font-bold mb-4">{challenge.title}</h3>
        <p className="text-blue-50 opacity-90 leading-relaxed mb-6">
          {challenge.desc}
        </p>
        <div className="flex gap-4">
           <button 
            onClick={() => setChallengeIdx((challengeIdx + 1) % CHALLENGES.length)}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-4 rounded-2xl font-bold transition-all"
           >
             Next Challenge
           </button>
           <button className="flex-1 bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform">
             I accept this challenge
           </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d === 'Wed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-gray-500">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const QUESTS = [
  { t: 'The Anchor Exercise', d: 'Ground yourself in 5 senses during a moment of high stress.', xp: '80 XP', status: 'In Progress' },
  { t: 'The Worry Time', d: 'Schedule 15 mins of "worry time". Outside this, postpone worries.', xp: '120 XP', status: 'Locked' },
  { t: 'Self-Love Letter', d: 'Write a compassionate letter to your younger self.', xp: '150 XP', status: 'Locked' },
];

const QuestModal = () => {
  const [activeQuest, setActiveQuest] = useState<number | null>(null);
  const [insight, setInsight] = useState('');
  const [step, setStep] = useState<'list' | 'active' | 'success'>('list');
  const { addXP } = useUser();

  const startQuest = (i: number) => {
    setActiveQuest(i);
    setStep('active');
  };

  const finishQuest = () => {
    addXP(100);
    setStep('success');
  };

  if (step === 'active' && activeQuest !== null) {
    const q = QUESTS[activeQuest];
    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-4">
             <Target size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900">{q.t}</h2>
          <p className="text-gray-500 mt-2">{q.d}</p>
        </div>
        
        <div className="bg-orange-50 p-6 rounded-3xl space-y-4">
           <label className="block text-sm font-bold text-orange-800 uppercase tracking-wider">Quest Journaling Aspect</label>
           <textarea 
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="Record one insight from this exercise..."
            className="w-full h-32 bg-white border border-orange-100 rounded-2xl p-4 focus:ring-2 focus:ring-orange-200 outline-none transition-all font-medium"
           />
        </div>

        <button 
          onClick={finishQuest}
          className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
        >
          Complete Quest <CheckCircle2 size={20} />
        </button>
      </div>
    );
  }

  if (step === 'success') {
     return (
       <div className="text-center space-y-6 py-8 animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6 shadow-inner">
             <Star size={48} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black text-gray-900">Quest Accomplished!</h2>
          <p className="text-gray-500 font-medium">Your insight has been recorded in your healing soul. Adventure onwards!</p>
          <div className="bg-green-50 p-6 rounded-[32px] inline-flex items-center gap-4 text-green-600">
             <Sparkles />
             <span className="font-bold">+100 XP Earned</span>
             <Sparkles />
          </div>
          <div className="pt-4">
             <button onClick={() => setStep('list')} className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl">Return to Board</button>
          </div>
       </div>
     );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">Inner Quest Board</h2>
      <div className="relative aspect-video bg-gray-100 rounded-[32px] overflow-hidden border border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full p-8 opacity-20"><Map className="w-full h-full" /></div>
          <div className="absolute flex gap-8">
             <QuestNode active title="Starting Valley" icon={<Map size={16}/>} />
             <QuestNode active title="Forest of Thoughts" icon={<Target size={16}/>} />
             <QuestNode locked title="Mountain of Grace" icon={<Award size={16}/>} />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800">Available Quests</h3>
        {QUESTS.map((q, i) => (
          <div 
            key={i} 
            onClick={() => q.status !== 'Locked' && startQuest(i)}
            className={`p-4 border border-gray-100 rounded-2xl flex justify-between items-center transition-all ${q.status === 'Locked' ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-gray-50 hover:border-orange-100 cursor-pointer shadow-sm active:scale-[0.98]'}`}
          >
            <div>
              <div className="flex items-center gap-2">
                 <p className="font-bold text-gray-900">{q.t}</p>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.status === 'In Progress' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                    {q.status}
                 </span>
              </div>
              <p className="text-sm text-gray-500">{q.d}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
               <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">{q.xp}</span>
               {q.status !== 'Locked' && <ChevronRight size={16} className="text-orange-300" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuestNode = ({ active, locked, title, icon }: { active?: boolean; locked?: boolean; title: string, icon: any }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
      active ? 'bg-orange-500 text-white' : locked ? 'bg-gray-300 text-gray-500' : 'bg-white text-orange-500 border border-orange-100'
    }`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold ${locked ? 'text-gray-400' : 'text-gray-900'}`}>{title}</span>
  </div>
);

const StreakModal = ({ progress }: { progress: any }) => (
  <div className="space-y-6">
     <div className="text-center">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-4 animate-pulse">
           <Flame size={48} className="fill-current" />
        </div>
        <h2 className="text-3xl font-black text-gray-900">{progress.streak} Day Streak</h2>
        <p className="text-gray-500 font-medium">{progress.streak > 0 ? "You're doing amazing! Keep going." : "Start your journey today!"}</p>
     </div>
     <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
        <h3 className="font-bold mb-4 flex items-center gap-2">
           <Target size={18} className="text-orange-500" /> Grace Days Available: 2
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Life happens. Use a Grace Day to preserve your streak if you miss a check-in. Self-acceptance means being kind to yourself on hard days too.
        </p>
     </div>
     <div className="grid grid-cols-7 gap-2">
        {Array.from({length: 14}).map((_, i) => (
           <div key={i} className={`h-2 rounded-full ${i < 12 ? 'bg-orange-500' : 'bg-gray-200'}`} />
        ))}
     </div>
  </div>
);

const BadgeModal = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-black text-gray-900">Your Inner Garden</h2>
    <p className="text-gray-500">A non-competitive gallery of your growth milestones.</p>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
      {[
        { i: '🌱', n: 'Seedling', d: 'First check-in', cat: 'Growth' },
        { i: '🔥', n: 'Fire Starter', d: '3-day streak', cat: 'Consistency' },
        { i: '🌊', n: 'Serene', d: '5 deep breaths', cat: 'Mind' },
        { i: '💎', n: 'Resilient', d: 'Reframining', cat: 'CBT' },
        { i: '🧡', n: 'Kind Heart', d: 'Self-love', cat: 'Kindness' },
        { i: '🦋', n: 'Evolved', d: 'Level 5 reached', cat: 'Depth' },
        { i: '🛡️', n: 'Shield', d: 'Boundaries', cat: 'Courage', locked: true },
        { i: '⚓', n: 'Anchor', d: 'Grounding', cat: 'Anchoring', locked: true },
      ].map((b, i) => (
        <div key={i} className={`flex flex-col items-center gap-2 text-center group ${b.locked ? 'opacity-30 grayscale' : ''}`}>
          <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 transition-all hover:bg-white hover:shadow-md cursor-help">
            {b.i}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">{b.n}</p>
            <p className="text-[10px] text-gray-400">{b.locked ? 'Locked' : b.d}</p>
          </div>
        </div>
      ))}
      <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
        ?
      </div>
    </div>
  </div>
);

const CommunityModal = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-black text-gray-900">Community Quests</h2>
    <div className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden">
       <div className="absolute -right-8 -bottom-8 opacity-10">
          <Users size={180} />
       </div>
       <h3 className="text-xl font-bold mb-2">April Healing Circle</h3>
       <p className="text-blue-100 mb-6">Collective Goal: 10,000 mindful moments</p>
       <div className="mb-6">
          <div className="flex justify-between text-sm font-bold mb-2">
             <span>Progress</span>
             <span>6,432 / 10,000</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
             <div className="h-full bg-white w-[64%] rounded-full shadow-lg shadow-white/20" />
          </div>
       </div>
       <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform">
         Contribute 1 Moment
       </button>
    </div>
    <div className="space-y-4">
       <h4 className="font-bold text-gray-800">Top Contributors</h4>
       <div className="flex -space-x-4">
          {[1,2,3,4,5].map(i => (
             <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                {String.fromCharCode(64 + i)}
             </div>
          ))}
          <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
             +42
          </div>
       </div>
    </div>
  </div>
);

const GoalModal = () => (
   <div className="space-y-6">
      <h2 className="text-3xl font-black text-gray-900">SDT Goal Framework</h2>
      <div className="space-y-4">
         <GoalItem 
            title="Autonomy" 
            desc="Making choices that align with my values"
            progress={60}
            color="bg-green-500"
         />
         <GoalItem 
            title="Competence" 
            desc="Building skills and mastery in small steps"
            progress={45}
            color="bg-blue-500"
         />
         <GoalItem 
            title="Relatedness" 
            desc="Connecting with others meaningfully"
            progress={80}
            color="bg-pink-500"
         />
      </div>
      <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-colors">
         + Add Weekly Reflection
      </button>
   </div>
);

const ThoughtCloud = ({ onComplete }: { onComplete: () => void }) => {
  const [thought, setThought] = useState('');
  const [isFloating, setIsFloating] = useState(false);

  const handleRelease = () => {
    if (!thought.trim()) return;
    setIsFloating(true);
    setTimeout(() => {
      onComplete();
    }, 4000);
  };

  return (
    <div className="space-y-8 py-8 text-center relative overflow-hidden min-h-[400px]">
      {!isFloating ? (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
             <Wind size={40} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">Thought Cloud</h2>
          <p className="text-gray-500 max-w-sm mx-auto">Write down a thought that's weighing on you, and we'll gently watch it float away together.</p>
          
          <input 
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Type your thought here..."
            className="w-full max-w-md bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-6 text-xl text-center focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-medium"
            autoFocus
          />

          <div className="pt-4">
            <button 
              onClick={handleRelease}
              disabled={!thought.trim()}
              className="bg-blue-500 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-600 disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
            >
              Release into the Sky
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center absolute inset-0 space-y-8 translate-y-[-200px] transition-all duration-[4000ms] ease-in-out opacity-0 scale-50">
          <div className="p-8 bg-blue-50/50 backdrop-blur-sm border-2 border-white rounded-[40px] shadow-2xl relative">
             <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full shadow-sm" />
             <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-sm" />
             <p className="text-2xl font-black text-blue-600 italic px-4">{thought}</p>
          </div>
          <p className="text-blue-400 font-bold uppercase tracking-widest animate-pulse">Floating away...</p>
        </div>
      )}
      
      {isFloating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-1000 delay-1000">
             <h3 className="text-2xl font-black text-gray-300">Notice the space it left behind.</h3>
          </div>
      )}
    </div>
  );
};

const GoalItem = ({ title, desc, progress, color }: { title: string; desc: string; progress: number, color: string }) => (
   <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
      <div className="flex justify-between items-start mb-2">
         <div>
            <h4 className="font-bold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{desc}</p>
         </div>
         <span className="font-black text-gray-300">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
         <div className={`h-full ${color} w-[${progress}%] rounded-full`} style={{ width: `${progress}%` }} />
      </div>
   </div>
);
