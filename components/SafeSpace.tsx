import React, { useState } from 'react';
import { Button } from './Button';
import { Palmtree, Sparkles, Loader2, Volume2, Waves, Wind } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const SafeSpace: React.FC = () => {
    const [theme, setTheme] = useState('');
    const [visualization, setVisualization] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleVisualize = async () => {
        if (!theme.trim()) return;
        setIsLoading(true);
        setVisualization(null);

        try {
            const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `The user wants to visualize a safe space themed: "${theme}". 
                    Guide them into this space with a 1-paragraph description that engages all 5 senses (Sight, Sound, Smell, Touch, Temperature). 
                    Keep the tone whisper-soft, presence-focused, and deeply calming. 
                    Start with: "Close your eyes. Visualize... "`
                })
            });

            const data = await res.json();
            if (data.success) {
                setVisualization(data.message);
            }
        } catch (error) {
            console.error("Safe Space error", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-sky-100 text-sky-600 rounded-2xl mb-2">
                    <Waves size={28} />
                </div>
                <h2 className="text-3xl font-bold text-unity-black italic">The Internal Anchor</h2>
                <p className="text-gray-500 text-lg">Your mind can go to a place of peace, even if the world outside is noisy. Let's build your sanctuary.</p>
            </div>

            {!visualization ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-sky-50 space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-all">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Where do you feel most at peace?</label>
                        <textarea
                            className="w-full h-32 p-5 bg-sky-50/20 rounded-2xl border border-sky-100 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 transition-all resize-none outline-none text-unity-black text-lg"
                            placeholder="e.g., A quiet forest clearing, my grandmother's kitchen, the beach at sunrise..."
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        />
                    </div>

                    <Button
                        size="lg"
                        onClick={handleVisualize}
                        disabled={isLoading || !theme.trim()}
                        className="w-full h-14 bg-sky-500 hover:bg-sky-600 rounded-2xl shadow-lg shadow-sky-100 gap-3 text-lg"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        {isLoading ? 'Building Sanctuary...' : 'Guide Me There'}
                    </Button>
                </div>
            ) : (
                <div className="bg-sky-900/90 backdrop-blur-md p-10 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-700 text-white relative overflow-hidden text-center space-y-8">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 scale-150"><Volume2 size={200} /></div>
                        <div className="absolute bottom-1/4 right-1/4 scale-150 rotate-12"><Waves size={240} /></div>
                    </div>

                    <p className="text-2xl md:text-3xl text-sky-50 leading-relaxed font-serif italic relative z-10">
                        {visualization}
                    </p>

                    <div className="flex flex-col gap-4 relative z-10">
                        <Button onClick={() => setVisualization(null)} variant="outline" className="rounded-full border-sky-300 text-sky-100 hover:bg-sky-800">
                            Keep this Feeling
                        </Button>
                        <button onClick={() => setVisualization(null)} className="text-sm text-sky-300 hover:text-white">
                            Change the theme
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
