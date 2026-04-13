import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { generateThoughtReframe, generateValuesAffirmation } from '../services/geminiService';
import { Shield, CloudRain, Music, Eye, Hand, Ear, Zap, ChevronRight, X, BrainCircuit, Waves, Wind, Footprints, Trophy, Compass, ArrowRight, Check, Sparkles, Gamepad2, Target, Heart, Thermometer, Moon, Mic, Palette, Headphones, Users, Share, UserPlus, Lightbulb, Puzzle, Trees, Clock, Monitor, Gauge, AlertTriangle, Phone } from 'lucide-react';
import { MICRO_STEPS, CORE_VALUES } from '../constants';
import { TinyWin } from '../types';

export const WellnessToolkit: React.FC = () => {
  const [sosMode, setSosMode] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'relaxation' | 'expression' | 'connection' | 'lifestyle' | 'safety'>('relaxation');

  // --- SOS Mode Logic ---
  const SOSOverlay = () => {
    return (
      <div className="fixed inset-0 z-50 bg-unity-500/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 animate-in fade-in duration-300">
        <button 
          onClick={() => setSosMode(false)}
          className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
        >
          <X size={32} />
        </button>
        
        <div className="max-w-md w-full text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">You are safe.</h2>
            <p className="text-xl font-medium text-pink-100">This feeling is temporary. It will pass.</p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-64 h-64 bg-white/10 rounded-full animate-ping absolute opacity-20 duration-[3000ms]"></div>
            <div className="w-48 h-48 bg-white/20 rounded-full animate-pulse absolute opacity-30 duration-[4000ms]"></div>
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-unity-600 font-bold text-lg shadow-2xl">
              Breathe
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm uppercase tracking-widest opacity-80">Ground yourself</p>
            <div className="flex gap-2 justify-center">
               <span className="px-4 py-2 bg-white/10 rounded-full border border-white/20">Look at your feet</span>
               <span className="px-4 py-2 bg-white/10 rounded-full border border-white/20">Drop your shoulders</span>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/20">
             <p className="text-xs mb-2 opacity-70">Need professional help?</p>
             <a href="tel:988" className="inline-block bg-white text-unity-600 font-bold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors">
               Call Crisis Line (988)
             </a>
          </div>
        </div>
      </div>
    );
  };

  // --- Grounding Tool Logic ---
  const GroundingTool = () => {
    const [step, setStep] = useState(0);
    const steps = [
      { count: 5, text: "Things you can SEE", icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
      { count: 4, text: "Things you can TOUCH", icon: Hand, color: "text-green-500", bg: "bg-green-50" },
      { count: 3, text: "Things you can HEAR", icon: Ear, color: "text-purple-500", bg: "bg-purple-50" },
      { count: 2, text: "Things you can SMELL", icon: Wind, color: "text-orange-500", bg: "bg-orange-50" },
      { count: 1, text: "Thing you can TASTE", icon: Waves, color: "text-pink-500", bg: "bg-pink-50" },
    ];

    const current = steps[step];

    return (
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-unity-black">5-4-3-2-1 Grounding</h3>
          <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
        </div>
        
        {step < steps.length ? (
            <div className="text-center space-y-8 py-4 animate-in slide-in-from-right duration-300" key={step}>
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${current.bg} ${current.color}`}>
                    <current.icon size={40} />
                </div>
                <div>
                    <h4 className="text-6xl font-bold text-unity-black mb-2">{current.count}</h4>
                    <p className="text-xl text-gray-500 font-medium">Find {current.text}</p>
                </div>
                <div className="flex gap-2 justify-center">
                    {Array.from({length: current.count}).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${current.bg} ring-1 ring-inset ring-black/5`}></div>
                    ))}
                </div>
                <Button fullWidth onClick={() => setStep(s => s + 1)}>
                   I found them <ChevronRight size={18} className="ml-1"/>
                </Button>
            </div>
        ) : (
            <div className="text-center py-8 space-y-4">
                <div className="text-4xl">🌿</div>
                <h3 className="text-xl font-bold text-unity-black">You are grounded.</h3>
                <p className="text-gray-500">Take a deep breath and carry this calmness with you.</p>
                <Button variant="secondary" onClick={() => { setStep(0); setActiveTool(null); }}>Close</Button>
            </div>
        )}
      </div>
    );
  };

  // --- Reframing Tool Logic ---
  const ReframingTool = () => {
    const [thought, setThought] = useState("");
    const [reframe, setReframe] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReframe = async () => {
        if (!thought) return;
        setLoading(true);
        const result = await generateThoughtReframe(thought);
        setReframe(result);
        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-unity-black">Cognitive Reframing</h3>
                <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            
            {!reframe ? (
                <div className="space-y-4">
                    <p className="text-gray-600">What thought is weighing on you right now?</p>
                    <textarea 
                        className="w-full h-32 p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-unity-200 resize-none"
                        placeholder="e.g., I'm going to fail at everything..."
                        value={thought}
                        onChange={(e) => setThought(e.target.value)}
                    />
                    <Button fullWidth onClick={handleReframe} disabled={loading || !thought}>
                        {loading ? "Finding perspective..." : "Help me reframe this"}
                    </Button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div className="bg-unity-50 p-4 rounded-xl border border-unity-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Your thought</p>
                        <p className="text-gray-500 italic">"{thought}"</p>
                     </div>
                     <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <BrainCircuit size={14} /> New Perspective
                        </p>
                        <p className="text-unity-black text-lg leading-relaxed font-medium">"{reframe}"</p>
                     </div>
                     <Button variant="ghost" fullWidth onClick={() => { setReframe(""); setThought(""); }}>Try another</Button>
                </div>
            )}
        </div>
    );
  };

    // --- Sound Tool Logic ---
    const SoundTool = () => {
        const [playing, setPlaying] = useState<string | null>(null);
        const sounds = [
            { id: 'rain', name: 'Gentle Rain', color: 'bg-blue-100 text-blue-600' },
            { id: 'brown', name: 'Brown Noise', color: 'bg-stone-100 text-stone-600' },
            { id: 'forest', name: 'Forest', color: 'bg-green-100 text-green-600' },
            { id: 'waves', name: 'Ocean Waves', color: 'bg-cyan-100 text-cyan-600' },
        ];

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Sound Sanctuary</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {sounds.map(sound => (
                         <button 
                            key={sound.id}
                            onClick={() => setPlaying(playing === sound.id ? null : sound.id)}
                            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                                playing === sound.id 
                                ? 'bg-unity-500 text-white shadow-md scale-105' 
                                : `${sound.color} hover:opacity-80`
                            }`}
                         >
                            {playing === sound.id ? (
                                <div className="flex gap-1 h-6 items-end">
                                    <div className="w-1 bg-white animate-[bounce_1s_infinite] h-3"></div>
                                    <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-6"></div>
                                    <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-4"></div>
                                </div>
                            ) : <Music size={24} />}
                            <span className="font-medium text-sm">{sound.name}</span>
                         </button>
                    ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-4">Audio simulation for demo</p>
            </div>
        );
    };

    // --- Micro Steps Tool (Unstuck) ---
    const MicroStepsTool = () => {
        const [currentStep, setCurrentStep] = useState<string>("");
        const [isAnimating, setIsAnimating] = useState(false);

        const getNewStep = () => {
            setIsAnimating(true);
            setTimeout(() => {
                const random = MICRO_STEPS[Math.floor(Math.random() * MICRO_STEPS.length)];
                setCurrentStep(random);
                setIsAnimating(false);
            }, 300);
        };

        useEffect(() => {
            if(!currentStep) getNewStep();
        }, []);

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto text-center">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Micro Steps</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>
                
                <div className="py-8 space-y-6">
                    <p className="text-gray-500">Feeling stuck? Just try one tiny thing.</p>
                    
                    <div className={`transition-all duration-300 transform ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        <div className="text-2xl font-bold text-unity-700 leading-relaxed px-4">
                            "{currentStep}"
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center pt-4">
                        <Button variant="outline" onClick={getNewStep}>Give me another</Button>
                        <Button onClick={() => setActiveTool(null)}>I'll try this</Button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Tiny Wins Tool ---
    const TinyWinsTool = () => {
        const [wins, setWins] = useState<TinyWin[]>(() => {
             const saved = localStorage.getItem('unity_tiny_wins');
             return saved ? JSON.parse(saved) : [];
        });
        const [input, setInput] = useState("");
        const [showConfetti, setShowConfetti] = useState(false);

        useEffect(() => {
            localStorage.setItem('unity_tiny_wins', JSON.stringify(wins));
        }, [wins]);

        const addWin = () => {
            if(!input.trim()) return;
            const newWin: TinyWin = {
                id: Date.now().toString(),
                text: input,
                date: new Date().toLocaleDateString()
            };
            setWins([newWin, ...wins]);
            setInput("");
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        };

        return (
             <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Tiny Wins</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-4 mb-8">
                     <p className="text-gray-500 text-sm">Did you drink water? Get out of bed? It all counts.</p>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="I brushed my teeth..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-unity-200 focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && addWin()}
                        />
                        <Button onClick={addWin} disabled={!input.trim()}>
                            <Check size={18} />
                        </Button>
                     </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {wins.length === 0 && <p className="text-center text-gray-300 italic py-4">No wins recorded yet.</p>}
                    {wins.map(win => (
                        <div key={win.id} className="bg-green-50 text-green-800 px-4 py-3 rounded-xl flex justify-between items-center animate-in slide-in-from-top-2">
                            <span>{win.text}</span>
                            <span className="text-[10px] text-green-600 opacity-60">{win.date}</span>
                        </div>
                    ))}
                </div>

                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-white/50">
                        <div className="text-4xl animate-bounce">🎉</div>
                    </div>
                )}
             </div>
        );
    };

    // --- Values Compass Tool ---
    const ValuesCompassTool = () => {
        const [selected, setSelected] = useState<string[]>([]);
        const [affirmation, setAffirmation] = useState<string>("");
        const [loading, setLoading] = useState(false);

        const toggleValue = (val: string) => {
            if(selected.includes(val)) {
                setSelected(selected.filter(v => v !== val));
            } else {
                if(selected.length < 3) setSelected([...selected, val]);
            }
        };

        const generate = async () => {
            setLoading(true);
            const result = await generateValuesAffirmation(selected);
            setAffirmation(result);
            setLoading(false);
        };

        return (
             <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Values Compass</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                {!affirmation ? (
                    <div className="space-y-6">
                        <p className="text-gray-500 text-sm">When you feel lost, remember what matters. Select up to 3 values.</p>
                        <div className="flex flex-wrap gap-2">
                            {CORE_VALUES.map(val => (
                                <button
                                    key={val}
                                    onClick={() => toggleValue(val)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                                        selected.includes(val)
                                        ? 'bg-unity-500 text-white border-unity-500 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-unity-300'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <Button fullWidth onClick={generate} disabled={selected.length === 0 || loading}>
                            {loading ? "Finding direction..." : "Find my direction"} <ArrowRight size={18} className="ml-2"/>
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-6 animate-in fade-in">
                        <div className="w-16 h-16 bg-unity-100 text-unity-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Compass size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-unity-black">Your Compass</h4>
                        <p className="text-xl text-unity-700 italic font-serif leading-relaxed">"{affirmation}"</p>
                        <Button variant="ghost" onClick={() => setAffirmation("")}>Start Over</Button>
                    </div>
                )}
             </div>
        );
    };

    // --- Mood Games Tool ---
    const MoodGamesTool = () => {
        const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
        const [currentQuestion, setCurrentQuestion] = useState(0);
        const [score, setScore] = useState(0);
        const [gameComplete, setGameComplete] = useState(false);

        const emotions = ['Happy', 'Sad', 'Anxious', 'Angry', 'Calm', 'Excited'];
        const questions = [
            { emotion: 'Happy', question: 'What makes you smile?', options: ['Friends', 'Nature', 'Music', 'Food'], correct: 0 },
            { emotion: 'Sad', question: 'What helps when you feel down?', options: ['Talk to someone', 'Listen to music', 'Go for a walk', 'Watch a movie'], correct: 0 },
            { emotion: 'Anxious', question: 'What calms your nerves?', options: ['Deep breathing', 'Exercise', 'Meditation', 'Distraction'], correct: 0 },
        ];

        const startGame = (emotion: string) => {
            setSelectedEmotion(emotion);
            setCurrentQuestion(0);
            setScore(0);
            setGameComplete(false);
        };

        const answerQuestion = (answerIndex: number) => {
            if (answerIndex === questions[currentQuestion].correct) {
                setScore(score + 1);
            }
            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                setGameComplete(true);
            }
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Mood Games</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                {!selectedEmotion ? (
                    <div className="space-y-4">
                        <p className="text-gray-500">Select your current emotion to play a matching game:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {emotions.map(emotion => (
                                <button
                                    key={emotion}
                                    onClick={() => startGame(emotion)}
                                    className="p-3 bg-gray-50 rounded-xl hover:bg-unity-50 transition-colors"
                                >
                                    {emotion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : !gameComplete ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <p className="text-lg font-bold text-unity-600">{selectedEmotion}</p>
                            <p className="text-gray-500">{questions[currentQuestion].question}</p>
                        </div>
                        <div className="space-y-3">
                            {questions[currentQuestion].options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => answerQuestion(index)}
                                    className="w-full p-3 bg-gray-50 rounded-xl hover:bg-unity-50 transition-colors text-left"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="text-4xl">🎉</div>
                        <h4 className="text-xl font-bold text-unity-black">Game Complete!</h4>
                        <p className="text-gray-500">You scored {score}/{questions.length}</p>
                        <Button onClick={() => setSelectedEmotion(null)}>Play Again</Button>
                    </div>
                )}
            </div>
        );
    };

    // --- Stress Thermometer Tool ---
    const StressThermometerTool = () => {
        const [stressLevel, setStressLevel] = useState(5);
        const [suggestion, setSuggestion] = useState<string>("");

        const suggestions = {
            1: "You're doing great! Keep up the good work.",
            2: "Take a moment to breathe deeply.",
            3: "Try a short walk or stretch.",
            4: "Consider talking to a friend.",
            5: "Use the grounding technique.",
            6: "Try progressive muscle relaxation.",
            7: "Reach out to your support network.",
            8: "Consider professional help if needed.",
            9: "Use the SOS mode for immediate help.",
            10: "Call emergency services if in crisis."
        };

        useEffect(() => {
            setSuggestion(suggestions[stressLevel as keyof typeof suggestions] || "");
        }, [stressLevel]);

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Stress Thermometer</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="text-center">
                        <Thermometer size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-4xl font-bold text-unity-black mb-2">{stressLevel}</p>
                        <p className="text-gray-500">How stressed are you right now? (1-10)</p>
                    </div>

                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={stressLevel}
                        onChange={(e) => setStressLevel(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />

                    <div className="bg-unity-50 p-4 rounded-xl">
                        <p className="text-unity-700 font-medium">{suggestion}</p>
                    </div>
                </div>
            </div>
        );
    };

    // --- Sleep Diary Tool ---
    const SleepDiaryTool = () => {
        const [entry, setEntry] = useState({
            hours: '',
            quality: 5,
            dreams: '',
            mood: 5
        });

        const saveEntry = () => {
            const entries = JSON.parse(localStorage.getItem('unity_sleep_entries') || '[]');
            entries.push({ ...entry, date: new Date().toISOString() });
            localStorage.setItem('unity_sleep_entries', JSON.stringify(entries));
            setEntry({ hours: '', quality: 5, dreams: '', mood: 5 });
            alert('Sleep entry saved!');
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Sleep Diary</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours slept</label>
                        <input
                            type="number"
                            value={entry.hours}
                            onChange={(e) => setEntry({...entry, hours: e.target.value})}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                            placeholder="8.5"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sleep quality (1-10)</label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={entry.quality}
                            onChange={(e) => setEntry({...entry, quality: parseInt(e.target.value)})}
                            className="w-full"
                        />
                        <p className="text-center text-lg font-bold">{entry.quality}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dreams or notes</label>
                        <textarea
                            value={entry.dreams}
                            onChange={(e) => setEntry({...entry, dreams: e.target.value})}
                            className="w-full h-24 p-3 bg-gray-50 rounded-xl border border-gray-200 resize-none"
                            placeholder="Any dreams or how you feel..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mood after waking (1-10)</label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={entry.mood}
                            onChange={(e) => setEntry({...entry, mood: parseInt(e.target.value)})}
                            className="w-full"
                        />
                        <p className="text-center text-lg font-bold">{entry.mood}</p>
                    </div>

                    <Button fullWidth onClick={saveEntry}>Save Entry</Button>
                </div>
            </div>
        );
    };

    // --- Voice Journaling Tool ---
    const VoiceJournalingTool = () => {
        const [isRecording, setIsRecording] = useState(false);
        const [transcription, setTranscription] = useState('');
        const [reflection, setReflection] = useState('');

        const startRecording = () => {
            setIsRecording(true);
            // Simulate recording for demo
            setTimeout(() => {
                setIsRecording(false);
                setTranscription("Today was challenging. I felt overwhelmed at work but managed to take a walk during lunch.");
                setReflection("It's okay to feel overwhelmed sometimes. Taking that walk was a good choice - remember to prioritize self-care.");
            }, 3000);
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Voice Journaling</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="text-center">
                        <button
                            onClick={startRecording}
                            disabled={isRecording}
                            className={`w-24 h-24 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                                isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                        >
                            {isRecording ? '●' : <Mic size={32} />}
                        </button>
                        <p className="mt-4 text-gray-500">
                            {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
                        </p>
                    </div>

                    {transcription && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <h4 className="font-bold text-blue-900 mb-2">Your Recording</h4>
                                <p className="text-blue-700">{transcription}</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-xl">
                                <h4 className="font-bold text-green-900 mb-2">AI Reflection</h4>
                                <p className="text-green-700">{reflection}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Digital Art Canvas Tool ---
    const DigitalArtCanvasTool = () => {
        const [drawing, setDrawing] = useState('');

        const saveDrawing = () => {
            alert('Drawing saved! (Demo - would save to cloud storage)');
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Digital Art Canvas</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 h-96 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center text-gray-500">
                            <Palette size={48} className="mx-auto mb-4" />
                            <p>Canvas area (HTML5 Canvas would go here)</p>
                            <p className="text-sm">Draw, doodle, or express yourself freely</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setDrawing('')}>Clear Canvas</Button>
                        <Button onClick={saveDrawing}>Save Drawing</Button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Music Therapy Tool ---
    const MusicTherapyTool = () => {
        const [selectedMood, setSelectedMood] = useState<string | null>(null);
        const playlists = {
            calm: ['Ocean Waves', 'Forest Ambience', 'Soft Piano'],
            energize: ['Upbeat Pop', 'Motivational Beats', 'Dance Music'],
            focus: ['Instrumental', 'Classical', 'Lo-fi Beats'],
            sleep: ['Sleep Sounds', 'Ambient Music', 'White Noise']
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Music Therapy</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                {!selectedMood ? (
                    <div className="space-y-4">
                        <p className="text-gray-500">Select your current mood for a personalized playlist:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(playlists).map(mood => (
                                <button
                                    key={mood}
                                    onClick={() => setSelectedMood(mood)}
                                    className="p-3 bg-gray-50 rounded-xl hover:bg-unity-50 transition-colors capitalize"
                                >
                                    {mood}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                            <Headphones size={24} className="text-unity-500" />
                            <span className="font-bold text-unity-black capitalize">{selectedMood} Playlist</span>
                        </div>

                        <div className="space-y-3">
                            {(playlists as any)[selectedMood].map((track: string, index: number) => (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <button className="w-8 h-8 bg-unity-500 text-white rounded-full flex items-center justify-center">
                                        ▶
                                    </button>
                                    <span>{track}</span>
                                </div>
                            ))}
                        </div>

                        <Button variant="outline" onClick={() => setSelectedMood(null)}>Choose Different Mood</Button>
                    </div>
                )}
            </div>
        );
    };

    // --- Peer Support Board Tool ---
    const PeerSupportBoardTool = () => {
        const [messages, setMessages] = useState([
            { id: 1, text: "You're not alone in this. Take it one day at a time.", author: "Anonymous", date: "2 hours ago" },
            { id: 2, text: "Remember to be kind to yourself today.", author: "Anonymous", date: "5 hours ago" }
        ]);
        const [newMessage, setNewMessage] = useState('');

        const addMessage = () => {
            if (!newMessage.trim()) return;
            const message = {
                id: Date.now(),
                text: newMessage,
                author: "Anonymous",
                date: "Just now"
            };
            setMessages([message, ...messages]);
            setNewMessage('');
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Peer Support Board</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-gray-500">Leave an anonymous kind word for others, or read messages from the community.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Share a kind thought..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-unity-200 focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && addMessage()}
                        />
                        <Button onClick={addMessage} disabled={!newMessage.trim()}>
                            <Share size={18} />
                        </Button>
                    </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {messages.map(message => (
                        <div key={message.id} className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                            <p className="text-pink-800 mb-2">{message.text}</p>
                            <div className="flex justify-between text-xs text-pink-600">
                                <span>{message.author}</span>
                                <span>{message.date}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- Nature Therapy Tool ---
    const NatureTherapyTool = () => {
        const [currentPrompt, setCurrentPrompt] = useState(0);
        const prompts = [
            "Take a 5-minute walk outside. What do you notice about the air, sounds, and light?",
            "Find a comfortable spot to sit. Close your eyes and listen to the sounds of nature.",
            "Take a photo of something beautiful in nature. Write down why it makes you feel peaceful.",
            "Practice 'earthing' - take off your shoes and feel the ground beneath your feet."
        ];

        const nextPrompt = () => {
            setCurrentPrompt((currentPrompt + 1) % prompts.length);
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Nature Therapy</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="text-center space-y-6">
                    <Trees size={48} className="text-green-500 mx-auto" />
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                        <p className="text-green-800 text-lg leading-relaxed">{prompts[currentPrompt]}</p>
                    </div>
                    <Button onClick={nextPrompt}>Next Prompt</Button>
                </div>
            </div>
        );
    };

    // --- Emotion Thermometer Tool ---
    const EmotionThermometerTool = () => {
        const [stressLevel, setStressLevel] = useState(5);
        const [notes, setNotes] = useState('');

        const getEmotionLabel = (level: number) => {
            if (level <= 2) return "Calm";
            if (level <= 4) return "Mild";
            if (level <= 6) return "Stressed";
            if (level <= 8) return "Overwhelmed";
            return "Crisis";
        };

        const getColor = (level: number) => {
            if (level <= 2) return "text-green-600 bg-green-50 border-green-200";
            if (level <= 4) return "text-blue-600 bg-blue-50 border-blue-200";
            if (level <= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200";
            if (level <= 8) return "text-orange-600 bg-orange-50 border-orange-200";
            return "text-red-600 bg-red-50 border-red-200";
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Emotion Thermometer</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className={`text-center p-6 rounded-xl border ${getColor(stressLevel)}`}>
                        <Gauge size={48} className="mx-auto mb-4" />
                        <p className="text-4xl font-bold mb-2">{stressLevel}</p>
                        <p className="text-lg font-medium">{getEmotionLabel(stressLevel)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling right now? (1-10)</label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={stressLevel}
                            onChange={(e) => setStressLevel(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full h-24 p-3 bg-gray-50 rounded-xl border border-gray-200 resize-none"
                            placeholder="What's contributing to how you feel?"
                        />
                    </div>

                    <Button fullWidth onClick={() => alert('Emotion logged! Consider using coping tools if needed.')}>
                        Log Emotion
                    </Button>
                </div>
            </div>
        );
    };

    // --- Shared Strategies Tool ---
    const SharedStrategiesTool = () => {
        const [strategies, setStrategies] = useState([
            { id: 1, title: "Deep Breathing", description: "When anxious, take 4 slow breaths in through nose, hold for 4, out through mouth for 4.", category: "Anxiety", votes: 12 },
            { id: 2, title: "Grounding Object", description: "Carry a small object that reminds you of safety and hold it when needed.", category: "Grounding", votes: 8 },
            { id: 3, title: "Gratitude List", description: "Write down 3 things you're grateful for each day, even on bad days.", category: "Perspective", votes: 15 }
        ]);
        const [newStrategy, setNewStrategy] = useState({ title: '', description: '', category: '' });

        const addStrategy = () => {
            if (!newStrategy.title || !newStrategy.description || !newStrategy.category) return;
            const strategy = {
                id: Date.now(),
                title: newStrategy.title,
                description: newStrategy.description,
                category: newStrategy.category,
                votes: 0
            };
            setStrategies([strategy, ...strategies]);
            setNewStrategy({ title: '', description: '', category: '' });
        };

        const voteStrategy = (id: number) => {
            setStrategies(strategies.map(s => s.id === id ? { ...s, votes: s.votes + 1 } : s));
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Shared Strategies</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-2">Share Your Coping Strategy</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Strategy name"
                                value={newStrategy.title}
                                onChange={(e) => setNewStrategy({...newStrategy, title: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-blue-200"
                            />
                            <textarea
                                placeholder="How does this strategy help you?"
                                value={newStrategy.description}
                                onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                                className="w-full h-20 p-2 bg-white rounded border border-blue-200 resize-none"
                            />
                            <select
                                value={newStrategy.category}
                                onChange={(e) => setNewStrategy({...newStrategy, category: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-blue-200"
                            >
                                <option value="">Select category</option>
                                <option value="Anxiety">Anxiety</option>
                                <option value="Grounding">Grounding</option>
                                <option value="Perspective">Perspective</option>
                                <option value="Sleep">Sleep</option>
                                <option value="Other">Other</option>
                            </select>
                            <Button onClick={addStrategy} disabled={!newStrategy.title || !newStrategy.description || !newStrategy.category}>
                                Share Strategy
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-unity-black">Community Strategies</h4>
                        {strategies.map(strategy => (
                            <div key={strategy.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-unity-black">{strategy.title}</h5>
                                    <span className="text-xs bg-unity-100 text-unity-700 px-2 py-1 rounded">{strategy.category}</span>
                                </div>
                                <p className="text-gray-700 mb-3">{strategy.description}</p>
                                <button
                                    onClick={() => voteStrategy(strategy.id)}
                                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-unity-600"
                                >
                                    <Heart size={14} /> {strategy.votes} helpful
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // --- Buddy System Tool ---
    const BuddySystemTool = () => {
        const [buddy, setBuddy] = useState({ name: '', contact: '', checkInFrequency: 'daily' });
        const [checkIns, setCheckIns] = useState([
            { id: 1, message: "How are you feeling today?", time: "2 hours ago", from: "buddy" },
            { id: 2, message: "I'm doing okay, thanks for checking in!", time: "1 hour ago", from: "me" }
        ]);
        const [newMessage, setNewMessage] = useState('');

        const saveBuddy = () => {
            localStorage.setItem('unity_buddy', JSON.stringify(buddy));
            alert('Buddy saved! You can now check in with each other.');
        };

        const sendMessage = () => {
            if (!newMessage.trim()) return;
            const message = {
                id: Date.now(),
                message: newMessage,
                time: "Just now",
                from: "me"
            };
            setCheckIns([message, ...checkIns]);
            setNewMessage('');
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Buddy System</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="bg-green-50 p-4 rounded-xl">
                        <h4 className="font-bold text-green-900 mb-2">Set Up Your Accountability Buddy</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Buddy's name"
                                value={buddy.name}
                                onChange={(e) => setBuddy({...buddy, name: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-green-200"
                            />
                            <input
                                type="text"
                                placeholder="Phone or email"
                                value={buddy.contact}
                                onChange={(e) => setBuddy({...buddy, contact: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-green-200"
                            />
                            <select
                                value={buddy.checkInFrequency}
                                onChange={(e) => setBuddy({...buddy, checkInFrequency: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-green-200"
                            >
                                <option value="daily">Daily check-ins</option>
                                <option value="weekly">Weekly check-ins</option>
                                <option value="as-needed">As needed</option>
                            </select>
                            <Button onClick={saveBuddy} disabled={!buddy.name || !buddy.contact}>
                                Save Buddy
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-unity-black">Check-in Messages</h4>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Send a check-in message..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-unity-200 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                                Send
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {checkIns.map(message => (
                                <div key={message.id} className={`p-3 rounded-xl ${message.from === 'me' ? 'bg-unity-100 ml-8' : 'bg-gray-100 mr-8'}`}>
                                    <p className="text-sm">{message.message}</p>
                                    <span className="text-xs text-gray-500">{message.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Digital Detox Tool ---
    const DigitalDetoxTool = () => {
        const [detoxTime, setDetoxTime] = useState(30);
        const [isActive, setIsActive] = useState(false);
        const [timeLeft, setTimeLeft] = useState(0);

        useEffect(() => {
            let interval: NodeJS.Timeout;
            if (isActive && timeLeft > 0) {
                interval = setInterval(() => {
                    setTimeLeft(time => time - 1);
                }, 1000);
            } else if (timeLeft === 0 && isActive) {
                setIsActive(false);
                alert('Digital detox complete! How do you feel?');
            }
            return () => clearInterval(interval);
        }, [isActive, timeLeft]);

        const startDetox = () => {
            setTimeLeft(detoxTime * 60);
            setIsActive(true);
        };

        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Digital Detox</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="text-center space-y-6">
                    <Monitor size={48} className="text-orange-500 mx-auto" />
                    <p className="text-gray-600">Take a break from screens and reconnect with yourself.</p>

                    {!isActive ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Detox duration (minutes)</label>
                                <input
                                    type="range"
                                    min="5"
                                    max="120"
                                    value={detoxTime}
                                    onChange={(e) => setDetoxTime(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-center text-lg font-bold">{detoxTime} minutes</p>
                            </div>
                            <Button fullWidth onClick={startDetox}>
                                Start Digital Detox
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-4xl font-bold text-unity-black">{formatTime(timeLeft)}</div>
                            <p className="text-gray-500">Time remaining</p>
                            <div className="bg-orange-50 p-4 rounded-xl">
                                <p className="text-orange-800 text-sm">
                                    Put your phone down, step away from screens, and try one of these:
                                </p>
                                <ul className="text-orange-700 text-sm mt-2 space-y-1">
                                    <li>• Take a walk outside</li>
                                    <li>• Read a physical book</li>
                                    <li>• Practice mindfulness</li>
                                    <li>• Journal your thoughts</li>
                                </ul>
                            </div>
                            <Button variant="outline" fullWidth onClick={() => { setIsActive(false); setTimeLeft(0); }}>
                                End Early
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Crisis Rehearsal Tool ---
    const CrisisRehearsalTool = () => {
        const [currentStep, setCurrentStep] = useState(0);
        const steps = [
            {
                title: "Recognize Warning Signs",
                content: "What are your personal warning signs that a crisis might be coming? (e.g., racing thoughts, isolation, sleep changes)",
                prompt: "List 3-5 signs you notice in yourself"
            },
            {
                title: "Safety Plan Steps",
                content: "What are the immediate steps you can take when you notice these signs?",
                prompt: "Write down your safety plan actions"
            },
            {
                title: "Support Network",
                content: "Who can you reach out to when you're struggling?",
                prompt: "List trusted people and their contact info"
            },
            {
                title: "Coping Strategies",
                content: "What strategies have helped you through difficult times before?",
                prompt: "List 5 coping skills that work for you"
            },
            {
                title: "Professional Help",
                content: "When should you contact professional help?",
                prompt: "List situations where you'd call a crisis line or therapist"
            }
        ];

        const [responses, setResponses] = useState<string[]>(new Array(steps.length).fill(''));

        const nextStep = () => {
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            }
        };

        const prevStep = () => {
            if (currentStep > 0) {
                setCurrentStep(currentStep - 1);
            }
        };

        const updateResponse = (response: string) => {
            const newResponses = [...responses];
            newResponses[currentStep] = response;
            setResponses(newResponses);
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Crisis Rehearsal</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
                        <div className="flex gap-1">
                            {steps.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-unity-500' : 'bg-gray-200'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xl font-bold text-unity-black">{steps[currentStep].title}</h4>
                        <p className="text-gray-600">{steps[currentStep].content}</p>
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <p className="text-sm text-gray-500 mb-2">{steps[currentStep].prompt}</p>
                            <textarea
                                value={responses[currentStep]}
                                onChange={(e) => updateResponse(e.target.value)}
                                className="w-full h-32 p-3 bg-white rounded border border-gray-200 resize-none"
                                placeholder="Your response..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                            Previous
                        </Button>
                        <Button onClick={nextStep} disabled={currentStep === steps.length - 1}>
                            Next Step
                        </Button>
                    </div>

                    {currentStep === steps.length - 1 && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                            <h5 className="font-bold text-green-900 mb-2">Safety Plan Complete!</h5>
                            <p className="text-green-700 text-sm">
                                Keep this plan somewhere accessible. Review it regularly and update as needed.
                                Remember: it's okay to ask for help when you need it.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- Emergency Contact Tool ---
    const EmergencyContactTool = () => {
        const [contacts, setContacts] = useState([
            { id: 1, name: 'National Crisis Line', number: '988', type: 'crisis' },
            { id: 2, name: 'Emergency Services', number: '911', type: 'emergency' }
        ]);
        const [newContact, setNewContact] = useState({ name: '', number: '', type: 'support' });

        const addContact = () => {
            if (!newContact.name || !newContact.number) return;
            const contact = {
                id: Date.now(),
                name: newContact.name,
                number: newContact.number,
                type: newContact.type
            };
            setContacts([...contacts, contact]);
            setNewContact({ name: '', number: '', type: 'support' });
        };

        const callContact = (number: string) => {
            window.open(`tel:${number}`);
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Emergency Contacts</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="space-y-6">
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                        <h4 className="font-bold text-red-900 mb-2">Add Emergency Contact</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Contact name"
                                value={newContact.name}
                                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-red-200"
                            />
                            <input
                                type="tel"
                                placeholder="Phone number"
                                value={newContact.number}
                                onChange={(e) => setNewContact({...newContact, number: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-red-200"
                            />
                            <select
                                value={newContact.type}
                                onChange={(e) => setNewContact({...newContact, type: e.target.value})}
                                className="w-full p-2 bg-white rounded border border-red-200"
                            >
                                <option value="support">Support Person</option>
                                <option value="crisis">Crisis Line</option>
                                <option value="emergency">Emergency</option>
                                <option value="therapist">Therapist</option>
                            </select>
                            <Button onClick={addContact} disabled={!newContact.name || !newContact.number}>
                                Add Contact
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-unity-black">Your Contacts</h4>
                        {contacts.map(contact => (
                            <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-unity-black">{contact.name}</p>
                                    <p className="text-sm text-gray-500">{contact.number}</p>
                                </div>
                                <Button onClick={() => callContact(contact.number)}>
                                    <Phone size={16} className="mr-1" /> Call
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                        <p className="text-yellow-800 text-sm">
                            <strong>Remember:</strong> If you're in immediate danger, call emergency services (911) first.
                            Crisis lines are available 24/7 for support.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

  return (
    <div className="space-y-8">
      {sosMode && <SOSOverlay />}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-unity-black flex items-center gap-2">
           <Shield className="text-unity-500 fill-unity-100" /> Wellness Toolkit
        </h1>
        <p className="text-gray-500">Tools to manage anxiety, find hope, and build resilience.</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'relaxation', label: 'Relaxation', icon: Wind },
          { id: 'expression', label: 'Expression', icon: Palette },
          { id: 'connection', label: 'Connection', icon: Users },
          { id: 'lifestyle', label: 'Lifestyle', icon: Trees },
          { id: 'safety', label: 'Safety', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-unity-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {!activeTool ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            {/* Panic SOS Button - Always visible */}
            <button
                onClick={() => setSosMode(true)}
                className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-between group"
            >
                <div className="text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="fill-white" />
                        <span className="font-bold text-lg uppercase tracking-wider">Panic SOS</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-2">I need help right now</h2>
                    <p className="opacity-90">Tap here for immediate grounding and safety.</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ChevronRight size={24} />
                </div>
            </button>

            {/* Dynamic Content Based on Tab */}
            {activeTab === 'relaxation' && (
              <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                        <Wind size={20} className="text-blue-400" /> Calm & Grounding
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ToolCard
                            title="5-4-3-2-1"
                            desc="Sensory Grounding"
                            icon={Eye}
                            color="bg-green-100 text-green-600"
                            onClick={() => setActiveTool('grounding')}
                        />
                        <ToolCard
                            title="Reframe"
                            desc="Challenge Thoughts"
                            icon={BrainCircuit}
                            color="bg-blue-100 text-blue-600"
                            onClick={() => setActiveTool('reframing')}
                        />
                        <ToolCard
                            title="Sound"
                            desc="Calming Audio"
                            icon={Music}
                            color="bg-purple-100 text-purple-600"
                            onClick={() => setActiveTool('sound')}
                        />
                        <ToolCard
                            title="Stress Thermometer"
                            desc="Rate & Get Help"
                            icon={Thermometer}
                            color="bg-red-100 text-red-600"
                            onClick={() => setActiveTool('stress-thermometer')}
                        />
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-yellow-400" /> Hope & Direction
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <ToolCard
                            title="Unstuck"
                            desc="Micro Steps Generator"
                            icon={Footprints}
                            color="bg-orange-100 text-orange-600"
                            onClick={() => setActiveTool('microsteps')}
                        />
                         <ToolCard
                            title="Tiny Wins"
                            desc="Celebrate Small Acts"
                            icon={Trophy}
                            color="bg-yellow-100 text-yellow-600"
                            onClick={() => setActiveTool('tinywins')}
                        />
                         <ToolCard
                            title="Compass"
                            desc="Find Your Values"
                            icon={Compass}
                            color="bg-teal-100 text-teal-600"
                            onClick={() => setActiveTool('values')}
                        />
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'expression' && (
              <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                        <Palette size={20} className="text-purple-400" /> Creative Expression
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ToolCard
                            title="Voice Journaling"
                            desc="Record & Reflect"
                            icon={Mic}
                            color="bg-blue-100 text-blue-600"
                            onClick={() => setActiveTool('voice-journaling')}
                        />
                        <ToolCard
                            title="Digital Art Canvas"
                            desc="Draw Your Feelings"
                            icon={Palette}
                            color="bg-purple-100 text-purple-600"
                            onClick={() => setActiveTool('digital-art')}
                        />
                        <ToolCard
                            title="Music Therapy"
                            desc="Mood-Based Playlists"
                            icon={Headphones}
                            color="bg-green-100 text-green-600"
                            onClick={() => setActiveTool('music-therapy')}
                        />
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'connection' && (
              <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                        <Users size={20} className="text-pink-400" /> Social Connection
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ToolCard
                            title="Peer Support Board"
                            desc="Anonymous Kind Words"
                            icon={Users}
                            color="bg-pink-100 text-pink-600"
                            onClick={() => setActiveTool('peer-support')}
                        />
                        <ToolCard
                            title="Shared Strategies"
                            desc="Community Coping Tips"
                            icon={Share}
                            color="bg-blue-100 text-blue-600"
                            onClick={() => setActiveTool('shared-strategies')}
                        />
                        <ToolCard
                            title="Buddy System"
                            desc="Accountability Partner"
                            icon={UserPlus}
                            color="bg-green-100 text-green-600"
                            onClick={() => setActiveTool('buddy-system')}
                        />
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'lifestyle' && (
              <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                        <Trees size={20} className="text-green-400" /> Lifestyle & Environment
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ToolCard
                            title="Sleep Diary"
                            desc="Track Your Rest"
                            icon={Moon}
                            color="bg-indigo-100 text-indigo-600"
                            onClick={() => setActiveTool('sleep-diary')}
                        />
                        <ToolCard
                            title="Nature Therapy"
                            desc="Outdoor Prompts"
                            icon={Trees}
                            color="bg-green-100 text-green-600"
                            onClick={() => setActiveTool('nature-therapy')}
                        />
                        <ToolCard
                            title="Digital Detox"
                            desc="Screen Time Limits"
                            icon={Clock}
                            color="bg-orange-100 text-orange-600"
                            onClick={() => setActiveTool('digital-detox')}
                        />
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-red-400" /> Safety & Crisis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ToolCard
                            title="Emotion Thermometer"
                            desc="Real-Time Stress Scale"
                            icon={Gauge}
                            color="bg-red-100 text-red-600"
                            onClick={() => setActiveTool('emotion-thermometer')}
                        />
                        <ToolCard
                            title="Crisis Rehearsal"
                            desc="Practice Safety Plans"
                            icon={AlertTriangle}
                            color="bg-orange-100 text-orange-600"
                            onClick={() => setActiveTool('crisis-rehearsal')}
                        />
                        <ToolCard
                            title="Emergency Contact"
                            desc="Quick Dial Support"
                            icon={Phone}
                            color="bg-blue-100 text-blue-600"
                            onClick={() => setActiveTool('emergency-contact')}
                        />
                    </div>
                </div>
              </div>
            )}

        </div>
      ) : (
        // Active Tool View
        <div className="animate-in fade-in zoom-in-95 duration-200 py-4">
            {activeTool === 'grounding' && <GroundingTool />}
            {activeTool === 'reframing' && <ReframingTool />}
            {activeTool === 'sound' && <SoundTool />}
            {activeTool === 'microsteps' && <MicroStepsTool />}
            {activeTool === 'tinywins' && <TinyWinsTool />}
            {activeTool === 'values' && <ValuesCompassTool />}
            {activeTool === 'stress-thermometer' && <StressThermometerTool />}
            {activeTool === 'voice-journaling' && <VoiceJournalingTool />}
            {activeTool === 'digital-art' && <DigitalArtCanvasTool />}
            {activeTool === 'music-therapy' && <MusicTherapyTool />}
            {activeTool === 'sleep-diary' && <SleepDiaryTool />}
            {activeTool === 'peer-support' && <PeerSupportBoardTool />}
            {activeTool === 'shared-strategies' && <SharedStrategiesTool />}
            {activeTool === 'buddy-system' && <BuddySystemTool />}
            {activeTool === 'nature-therapy' && <NatureTherapyTool />}
            {activeTool === 'digital-detox' && <DigitalDetoxTool />}
            {activeTool === 'emotion-thermometer' && <EmotionThermometerTool />}
            {activeTool === 'crisis-rehearsal' && <CrisisRehearsalTool />}
            {activeTool === 'emergency-contact' && <EmergencyContactTool />}
        </div>
      )}
    </div>
  );
};

// Helper Component for Tool Cards
const ToolCard = ({ title, desc, icon: Icon, color, onClick }: any) => (
    <button
        onClick={onClick}
        className="bg-white p-5 rounded-2xl border border-unity-50 shadow-sm hover:border-unity-200 hover:shadow-md transition-all text-left flex items-center gap-4 group"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className="font-bold text-unity-black">{title}</h3>
            <p className="text-xs text-gray-500">{desc}</p>
        </div>
    </button>
);
