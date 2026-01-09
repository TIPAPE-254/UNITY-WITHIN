import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Sun, Check, ArrowRight, History, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface MicroGratitudeProps {
    userId: number;
    onSave?: () => void;
}

export const MicroGratitude: React.FC<MicroGratitudeProps> = ({ userId, onSave }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recentWins, setRecentWins] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

    useEffect(() => {
        if (userId) fetchWins();
    }, [userId]);

    const fetchWins = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/tiny-wins/${userId}`);
            const data = await res.json();
            if (data.success) setRecentWins(data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/tiny-wins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content })
            });
            const data = await res.json(); // Fix: data variable was not defined
            if (data.success) {
                setContent('');
                fetchWins();
                if (onSave) onSave();
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 3000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100 shadow-sm relative overflow-hidden">
            <div className="absolute -top-6 -right-6 text-amber-200/50 opacity-30">
                <Sun size={120} />
            </div>

            <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900">Daily Light</h3>
                            <p className="text-xs text-amber-700 italic">"Name one small thing that didn't hurt today."</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="p-2 text-amber-400 hover:text-amber-600 transition-colors"
                    >
                        <History size={18} />
                    </button>
                </div>

                {showHistory ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                        {recentWins.length > 0 ? (
                            recentWins.map((win, i) => (
                                <div key={win.id} className="bg-white/60 p-3 rounded-xl text-sm text-amber-800 border border-amber-100/50">
                                    {win.content}
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-amber-400 text-center py-4">No moments recorded yet.</p>
                        )}
                        <button onClick={() => setShowHistory(false)} className="text-[10px] uppercase font-bold text-amber-600 hover:underline">
                            Back to writing
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="A warm coffee, a bird singing, a kind text..."
                            className="w-full p-4 bg-white/80 border border-amber-200 rounded-2xl text-sm focus:ring-4 focus:ring-amber-100 focus:border-amber-300 outline-none resize-none h-24 text-amber-900 placeholder:text-amber-300"
                        />
                        <Button
                            onClick={handleSave}
                            disabled={isLoading || !content.trim()}
                            className="w-full bg-amber-500 hover:bg-amber-600 border-none shadow-md shadow-amber-100 rounded-xl py-6"
                        >
                            {justSaved ? <Check size={20} className="animate-in zoom-in" /> : <ArrowRight size={20} />}
                            <span className="ml-2 font-bold">{justSaved ? 'Brightened!' : 'Save this light'}</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
