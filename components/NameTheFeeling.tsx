import React, { useState } from 'react';
import { Button } from './Button';
import { Sparkles, Loader2, ArrowRight, RefreshCcw } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const NameTheFeeling: React.FC = () => {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<{ labels: string; validation: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleIdentify = async () => {
        if (!input.trim()) return;
        setIsLoading(true);
        setResult(null);

        try {
            const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `The user describes their state as: "${input}". 
                    1. Identify 1-3 primary emotional labels from their description (e.g., 'Frustrated Exhaustion', 'Quiet Loneliness', 'Restless Hope'). 
                    2. Provide a single, short, 1-sentence validation.
                    Respond in JSON format like this: {"labels": "Label 1, Label 2", "validation": "Your validation sentence here."}`
                })
            });

            const data = await res.json();
            if (data.success) {
                try {
                    // Try to parse JSON from AI response if it wrapped it in text
                    const jsonMatch = data.message.match(/\{.*\}/s);
                    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : data.message);
                    setResult(parsed);
                } catch (e) {
                    // Fallback if AI didn't follow JSON format strictly
                    setResult({ labels: "Something deep", validation: data.message });
                }
            }
        } catch (error) {
            console.error("Discovery error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setInput('');
        setResult(null);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-purple-100 text-purple-600 rounded-2xl mb-2">
                    <Sparkles size={28} />
                </div>
                <h2 className="text-3xl font-bold text-unity-black italic">"I don't know what I'm feeling..."</h2>
                <p className="text-gray-500 text-lg">Sometimes feelings are just a messy tangle. Let's try to untangle them together.</p>
            </div>

            {!result ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-50 space-y-6 animate-in fade-in slide-in-from-bottom-4 transition-all">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Describe the "mess" inside</label>
                        <textarea
                            className="w-full h-40 p-5 bg-purple-50/30 rounded-2xl border border-purple-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all resize-none outline-none text-unity-black text-lg"
                            placeholder="e.g., I'm tired but my mind won't stop, and I feel like I'm forgetting something important but I don't know what..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                    </div>

                    <Button
                        size="lg"
                        onClick={handleIdentify}
                        disabled={isLoading || !input.trim()}
                        className="w-full h-14 bg-purple-600 hover:bg-purple-700 rounded-2xl shadow-lg shadow-purple-200 gap-3 text-lg"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                        {isLoading ? 'Untangling...' : 'Help me name this'}
                    </Button>
                </div>
            ) : (
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-1 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="bg-white rounded-[22px] p-10 space-y-8 text-center">
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest">It sounds like you're carrying...</h3>
                            <div className="flex flex-wrap justify-center gap-3">
                                {result.labels.split(',').map((label, i) => (
                                    <span key={i} className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                                        {label.trim()}{i < result.labels.split(',').length - 1 ? ' •' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                            <p className="text-xl text-purple-900 font-medium leading-relaxed italic">
                                "{result.validation}"
                            </p>
                        </div>

                        <div className="flex justify-center gap-4 pt-4">
                            <Button variant="outline" onClick={reset} className="rounded-full border-purple-200 text-purple-600 hover:bg-purple-50">
                                <RefreshCcw size={18} className="mr-2" /> Start Over
                            </Button>
                            <Button onClick={() => window.location.hash = '#journal'} className="rounded-full bg-purple-600 shadow-purple-200">
                                Write about it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-center text-xs text-gray-400">
                This tool uses AI to help you articulate your emotions. It is intended for self-reflection, not professional diagnosis.
            </p>
        </div>
    );
};
