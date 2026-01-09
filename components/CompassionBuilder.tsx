import React, { useState } from 'react';
import { Button } from './Button';
import { Heart, Sparkles, Loader2, Undo2 } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const CompassionBuilder: React.FC = () => {
    const [thought, setThought] = useState('');
    const [reframed, setReframed] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleReframe = async () => {
        if (!thought.trim()) return;
        setIsLoading(true);
        setReframed(null);

        try {
            const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `The user has this harsh self-thought: "${thought}". 
                    Reframe it using self-compassion principles. Acknowledge the pain/struggle, remove the judgment, and offer a gentler perspective. 
                    Respond with a warm response starting with "I hear that. Let's try looking at it this way: "`
                })
            });

            const data = await res.json();
            if (data.success) {
                setReframed(data.message);
            }
        } catch (error) {
            console.error("Compassion error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setThought('');
        setReframed(null);
    };

    return (
        <div className="max-w-xl mx-auto p-6 space-y-8 min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-rose-100 text-rose-600 rounded-full mb-2">
                    <Heart size={28} className="fill-current" />
                </div>
                <h2 className="text-3xl font-bold text-unity-black italic">Inner Voice Repair</h2>
                <p className="text-gray-500 text-lg">We are often much harder on ourselves than we ever would be to a friend. Let's soften that voice.</p>
            </div>

            {!reframed ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-50 space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-all">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">A harsh thought you're carrying...</label>
                        <textarea
                            className="w-full h-32 p-5 bg-rose-50/20 rounded-2xl border border-rose-100 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 transition-all resize-none outline-none text-unity-black text-lg"
                            placeholder="e.g., I'm so lazy for not getting anything done today."
                            value={thought}
                            onChange={(e) => setThought(e.target.value)}
                        />
                    </div>

                    <Button
                        size="lg"
                        onClick={handleReframe}
                        disabled={isLoading || !thought.trim()}
                        className="w-full h-14 bg-rose-500 hover:bg-rose-600 rounded-2xl shadow-lg shadow-rose-100 gap-3 text-lg"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        {isLoading ? 'Softening...' : 'Help me be kinder'}
                    </Button>
                </div>
            ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500"></div>

                        <p className="text-xl text-gray-800 leading-relaxed italic mb-8">
                            {reframed}
                        </p>

                        <div className="flex flex-col gap-3">
                            <Button onClick={() => window.location.hash = '#journal'} className="rounded-full bg-rose-500 shadow-rose-100">
                                Keep reflecting in my journal
                            </Button>
                            <button onClick={reset} className="text-sm text-gray-400 hover:text-rose-500 flex items-center justify-center gap-2 transition-colors">
                                <Undo2 size={14} /> Try another thought
                            </button>
                        </div>
                    </div>

                    <div className="text-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                        <p className="text-sm text-rose-800 font-medium italic">
                            "You are deserving of the same kindness you give so freely to others."
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
