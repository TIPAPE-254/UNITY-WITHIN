import React, { useState } from 'react';
import { Button } from './Button';
import { BookOpen, Sparkles, Loader2, ArrowRight, Book } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const StoryReframer: React.FC = () => {
    const [story, setStory] = useState('');
    const [reframed, setReframed] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleReframe = async () => {
        if (!story.trim()) return;
        setIsLoading(true);
        setReframed(null);

        try {
            const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `The user has this rigid, painful story about themselves: "${story}". 
                    Help them reframe this narrative. Move from a "Fixed" mindset to a "Growth/Process" mindset. 
                    Shift from "I AM [Failure/Bad]" to "I am EXPERIENCING [Struggle/Chapter]". 
                    Start with: "That feels like a heavy chapter. Let's try changing the title..." and then provide the reframe.`
                })
            });

            const data = await res.json();
            if (data.success) {
                setReframed(data.message);
            }
        } catch (error) {
            console.error("Reframer error", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-2">
                    <BookOpen size={28} />
                </div>
                <h2 className="text-3xl font-bold text-unity-black italic">The Narrative Shift</h2>
                <p className="text-gray-500 text-lg">You are the author of your life, not just the character. Let's look at the story you're telling yourself.</p>
            </div>

            {!reframed ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-all">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">What is a story that feels "stuck" right now?</label>
                        <textarea
                            className="w-full h-32 p-5 bg-indigo-50/20 rounded-2xl border border-indigo-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all resize-none outline-none text-unity-black text-lg"
                            placeholder="e.g., I'm a failure because I didn't get that promotion..."
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                        />
                    </div>

                    <Button
                        size="lg"
                        onClick={handleReframe}
                        disabled={isLoading || !story.trim()}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-100 gap-3 text-lg"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        {isLoading ? 'Rewriting...' : 'Help me reframe this'}
                    </Button>
                </div>
            ) : (
                <div className="bg-indigo-50 p-10 rounded-[40px] shadow-xl animate-in zoom-in-95 duration-500 text-indigo-900 border border-indigo-100 space-y-8 text-center">
                    <div className="inline-flex p-4 bg-white rounded-full text-indigo-500 shadow-sm">
                        <Book size={40} />
                    </div>

                    <p className="text-2xl text-indigo-900 leading-relaxed font-serif italic">
                        {reframed}
                    </p>

                    <div className="flex flex-col gap-4">
                        <Button onClick={() => window.location.hash = '#journal'} className="rounded-full bg-indigo-600 text-white">
                            Write the next chapter
                        </Button>
                        <button onClick={() => setReframed(null)} className="text-sm text-indigo-400 hover:text-indigo-600 transition-colors">
                            Try another story
                        </button>
                    </div>
                </div>
            )}

            <p className="text-center text-xs text-gray-400">
                Reframing helps us see new possibilities. It's not about ignoring facts, but about changing our relationship to them.
            </p>
        </div>
    );
};
