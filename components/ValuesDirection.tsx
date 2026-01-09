import React, { useState } from 'react';
import { Button } from './Button';
import { Compass, Sparkles, Loader2, ArrowRight, Heart, Briefcase, Users, Palette, Activity } from 'lucide-react';
import { API_BASE_URL } from '../constants';

const AREAS = [
    { id: 'work', label: 'Purpose / Work', icon: Briefcase, color: 'text-amber-600 bg-amber-50' },
    { id: 'relationships', label: 'Connection', icon: Users, color: 'text-rose-600 bg-rose-50' },
    { id: 'health', label: 'Self-Care', icon: Activity, color: 'text-green-600 bg-green-50' },
    { id: 'creativity', label: 'Creativity', icon: Palette, color: 'text-purple-600 bg-purple-50' },
    { id: 'community', label: 'Belonging', icon: Heart, color: 'text-blue-600 bg-blue-50' },
];

export const ValuesDirection: React.FC = () => {
    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGetDirection = async () => {
        if (!selectedArea) return;
        setIsLoading(true);
        setSuggestion(null);

        const areaLabel = AREAS.find(a => a.id === selectedArea)?.label;

        try {
            const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `The user wants to focus on "${areaLabel}". 
                    Suggest one TINY, zero-pressure, micro-action they can do in under 2 minutes. 
                    The goal is gentle direction, not productivity. 
                    Format: "A small step toward ${areaLabel} could be: [Suggestion]. It doesn't have to be perfect; just a tiny spark."`
                })
            });

            const data = await res.json();
            if (data.success) {
                setSuggestion(data.message);
            }
        } catch (error) {
            console.error("Values error", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-2">
                    <Compass size={28} />
                </div>
                <h2 className="text-3xl font-bold text-unity-black italic">Foundations & Direction</h2>
                <p className="text-gray-500 text-lg">When everything feels like too much, we look for one small point of light to move toward.</p>
            </div>

            {!suggestion ? (
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50 space-y-8 animate-in fade-in slide-in-from-bottom-4 transition-all">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center block">Where does your heart want to lean today?</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {AREAS.map(area => {
                                const Icon = area.icon;
                                return (
                                    <button
                                        key={area.id}
                                        onClick={() => setSelectedArea(area.id)}
                                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${selectedArea === area.id
                                            ? 'border-blue-500 bg-blue-50 scale-105 shadow-md'
                                            : 'border-gray-50 bg-gray-50/50 hover:border-blue-200'}`}
                                    >
                                        <div className={`p-3 rounded-xl mb-2 ${area.color}`}>
                                            <Icon size={24} />
                                        </div>
                                        <span className={`text-xs font-bold ${selectedArea === area.id ? 'text-blue-700' : 'text-gray-500'}`}>
                                            {area.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Button
                        size="lg"
                        onClick={handleGetDirection}
                        disabled={isLoading || !selectedArea}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-100 gap-3 text-lg"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                        {isLoading ? 'Seeking light...' : 'Find a tiny step'}
                    </Button>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-blue-500 animate-in zoom-in-95 duration-500 text-center space-y-8">
                    <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-full animate-pulse">
                        <Compass size={40} />
                    </div>

                    <p className="text-2xl text-gray-800 leading-relaxed font-serif">
                        {suggestion}
                    </p>

                    <div className="flex flex-col gap-4">
                        <Button onClick={() => window.location.hash = '#dashboard'} className="rounded-full bg-blue-600">
                            Done
                        </Button>
                        <button onClick={() => setSuggestion(null)} className="text-sm text-gray-400 hover:text-blue-500">
                            Look for another direction
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
