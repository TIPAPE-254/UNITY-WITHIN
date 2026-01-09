import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { generateThoughtReframe, generateValuesAffirmation } from '../services/geminiService';
import { Shield, CloudRain, Music, Eye, Hand, Ear, Zap, ChevronRight, X, BrainCircuit, Waves, Wind, Footprints, Trophy, Compass, ArrowRight, Check, Sparkles, Brain, Heart, BookOpen, Activity, Star } from 'lucide-react';
import { MICRO_STEPS, CORE_VALUES } from '../constants';
import { TinyWin, ViewState } from '../types';

interface WellnessToolkitProps {
    onNavigate?: (view: ViewState, data?: any) => void;
}

export const WellnessToolkit: React.FC<WellnessToolkitProps> = ({ onNavigate }) => {
    const [sosMode, setSosMode] = useState(false);
    const [activeTool, setActiveTool] = useState<'grounding' | 'reframing' | 'sound' | 'microsteps' | 'tinywins' | 'values' | null>(null);

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
                            {Array.from({ length: current.count }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full ${current.bg} ring-1 ring-inset ring-black/5`}></div>
                            ))}
                        </div>
                        <Button fullWidth onClick={() => setStep(s => s + 1)}>
                            I found them <ChevronRight size={18} className="ml-1" />
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
        const [volume, setVolume] = useState(0.5);
        const audioRef = React.useRef<HTMLAudioElement | null>(null);

        const sounds = [
            {
                id: 'rain',
                name: 'Gentle Rain',
                color: 'bg-blue-100 text-blue-600',
                src: 'https://assets.mixkit.co/active_storage/sfx/2492/2492-preview.mp3'
            },
            {
                id: 'brown',
                name: 'Brown Noise',
                color: 'bg-stone-100 text-stone-600',
                src: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Brown_noise.ogg'
            },
            {
                id: 'forest',
                name: 'Forest',
                color: 'bg-green-100 text-green-600',
                src: 'https://assets.mixkit.co/active_storage/sfx/148/148-preview.mp3'
            },
            {
                id: 'waves',
                name: 'Ocean Waves',
                color: 'bg-cyan-100 text-cyan-600',
                src: 'https://assets.mixkit.co/active_storage/sfx/1105/1105-preview.mp3'
            },
        ];

        useEffect(() => {
            return () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
            };
        }, []);

        const toggleSound = (sound: typeof sounds[0]) => {
            if (playing === sound.id) {
                audioRef.current?.pause();
                setPlaying(null);
            } else {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                audioRef.current = new Audio(sound.src);
                audioRef.current.loop = true;
                audioRef.current.volume = volume;
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
                setPlaying(sound.id);
            }
        };

        const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newVol = parseFloat(e.target.value);
            setVolume(newVol);
            if (audioRef.current) {
                audioRef.current.volume = newVol;
            }
        };

        return (
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-unity-100 max-w-lg mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-unity-black">Sound Sanctuary</h3>
                    <button onClick={() => setActiveTool(null)}><X size={20} className="text-gray-400" /></button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {sounds.map(sound => (
                        <button
                            key={sound.id}
                            onClick={() => toggleSound(sound)}
                            className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${playing === sound.id
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

                {playing && (
                    <div className="bg-gray-50 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium uppercase">Volume</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-unity-500"
                            />
                        </div>
                    </div>
                )}
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
            if (!currentStep) getNewStep();
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
            if (!input.trim()) return;
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
            if (selected.includes(val)) {
                setSelected(selected.filter(v => v !== val));
            } else {
                if (selected.length < 3) setSelected([...selected, val]);
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
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${selected.includes(val)
                                        ? 'bg-unity-500 text-white border-unity-500 shadow-md'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-unity-300'
                                        }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                        <Button fullWidth onClick={generate} disabled={selected.length === 0 || loading}>
                            {loading ? "Finding direction..." : "Find my direction"} <ArrowRight size={18} className="ml-2" />
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

    return (
        <div className="space-y-8">
            {sosMode && <SOSOverlay />}

            <header className="space-y-2">
                <h1 className="text-3xl font-bold text-unity-black flex items-center gap-2">
                    <Shield className="text-unity-500 fill-unity-100" /> Wellness Toolkit
                </h1>
                <p className="text-gray-500">Tools to manage anxiety, find hope, and build resilience.</p>
            </header>

            {/* Main Grid */}
            {!activeTool ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                    {/* Panic SOS Button */}
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

                    {/* Section: Anxiety & Grounding */}
                    <div>
                        <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                            <Wind size={20} className="text-blue-400" /> Calm & Grounding
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ToolCard
                                title="5-4-3-2-1"
                                desc="Sensory Grounding"
                                icon={Eye}
                                color="bg-green-100 text-green-600"
                                onClick={() => setActiveTool('grounding')}
                            />
                            <ToolCard
                                title="Breathing"
                                desc="Deep Calm Patterns"
                                icon={Wind}
                                color="bg-blue-100 text-blue-600"
                                onClick={() => onNavigate?.('breathe')}
                            />
                            <ToolCard
                                title="Internal Weather"
                                desc="Body Awareness"
                                icon={Activity}
                                color="bg-emerald-100 text-emerald-600"
                                onClick={() => onNavigate?.('bodyscan')}
                            />
                            <ToolCard
                                title="Sound"
                                desc="Calming Audio"
                                icon={Music}
                                color="bg-purple-100 text-purple-600"
                                onClick={() => setActiveTool('sound')}
                            />
                            <ToolCard
                                title="Safe Space"
                                desc="Mental Sanctuary"
                                icon={Waves}
                                color="bg-sky-100 text-sky-600"
                                onClick={() => onNavigate?.('safespace')}
                            />
                            <div className="bg-unity-50 p-4 rounded-2xl border border-unity-100 flex flex-col justify-center items-center text-center">
                                <CloudRain className="text-unity-300 mb-2" size={24} />
                                <p className="text-xs text-unity-500">Take it one breath at a time.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Emotional Depth */}
                    <div>
                        <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                            <Brain size={20} className="text-indigo-400" /> Emotional Insights
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ToolCard
                                title="Name Feeling"
                                desc="Untangle Emotions"
                                icon={Brain}
                                color="bg-indigo-100 text-indigo-600"
                                onClick={() => onNavigate?.('namethefeeling')}
                            />
                            <ToolCard
                                title="Story Reframer"
                                desc="Rewrite stuck narratives"
                                icon={BookOpen}
                                color="bg-indigo-100 text-indigo-600"
                                onClick={() => onNavigate?.('reframer')}
                            />
                            <ToolCard
                                title="Inner Kindness"
                                desc="Soften self-criticism"
                                icon={Heart}
                                color="bg-rose-100 text-rose-600"
                                onClick={() => onNavigate?.('selfcompassion')}
                            />
                        </div>
                    </div>

                    {/* Section: Hope & Direction */}
                    <div>
                        <h2 className="text-lg font-bold text-unity-black mb-4 flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-400" /> Hope & Direction
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ToolCard
                                title="Unstuck"
                                desc="Micro Steps Generator"
                                icon={Footprints}
                                color="bg-orange-100 text-orange-600"
                                onClick={() => setActiveTool('microsteps')}
                            />
                            <ToolCard
                                title="Values Compass"
                                desc="Find Your Light"
                                icon={Compass}
                                color="bg-teal-100 text-teal-600"
                                onClick={() => onNavigate?.('values')}
                            />
                            <ToolCard
                                title="Gratitude"
                                desc="Record small joys"
                                icon={Star}
                                color="bg-yellow-100 text-yellow-600"
                                onClick={() => onNavigate?.('journal')}
                            />
                            <ToolCard
                                title="Tiny Wins"
                                desc="Celebrate Small Acts"
                                icon={Trophy}
                                color="bg-yellow-100 text-yellow-600"
                                onClick={() => setActiveTool('tinywins')}
                            />
                        </div>
                    </div>

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