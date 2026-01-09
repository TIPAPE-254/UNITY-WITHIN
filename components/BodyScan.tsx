import React, { useState } from 'react';
import { Button } from './Button';
import { Activity, Wind, Loader2, Sparkles, ArrowRight } from 'lucide-react';

const BODY_PARTS = [
    { id: 'head', label: 'Head / Mind', desc: 'Is it heavy? Buzzing? Tight?', help: 'Try closing your eyes and letting your jaw drop slightly.' },
    { id: 'neck', label: 'Neck & Shoulders', desc: 'Is there tension or weight?', help: 'Gently roll your shoulders back and down.' },
    { id: 'chest', label: 'Chest / Heart', desc: 'Is it tight? Flipping? Heavy?', help: 'Take a very slow breath in, and let it out with a sigh.' },
    { id: 'gut', label: 'Stomach / Gut', desc: 'Is it churning? Empty? Hard?', help: 'Place a hand on your belly and feel it rise/fall.' },
    { id: 'hands', label: 'Hands & Arms', desc: 'Are they clenched? Weak?', help: 'Stretch your fingers wide, then let them curl naturally.' },
    { id: 'feet', label: 'Feet & Legs', desc: 'Are they restless? Heavy?', help: 'Wiggle your toes and imagine roots going into the earth.' },
];

export const BodyScan: React.FC = () => {
    const [selectedPart, setSelectedPart] = useState<string | null>(null);

    const part = BODY_PARTS.find(p => p.id === selectedPart);

    return (
        <div className="max-w-xl mx-auto p-6 space-y-8 min-h-[calc(100vh-140px)] flex flex-col justify-center">
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                    <Activity size={28} />
                </div>
                <h2 className="text-3xl font-bold text-unity-black italic">Internal Weather Check</h2>
                <p className="text-gray-500 text-lg">Your body often knows how you're feeling before your mind does. Let's listen to it.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {BODY_PARTS.map(p => (
                    <button
                        key={p.id}
                        onClick={() => setSelectedPart(p.id === selectedPart ? null : p.id)}
                        className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${selectedPart === p.id
                            ? 'border-emerald-500 bg-emerald-50 shadow-md translate-x-2'
                            : 'border-gray-50 bg-white hover:border-emerald-100'}`}
                    >
                        <div className={`p-2 rounded-lg ${selectedPart === p.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                            {p.id === 'chest' ? <Wind size={20} /> : <Activity size={20} />}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold ${selectedPart === p.id ? 'text-emerald-900' : 'text-gray-700'}`}>{p.label}</h4>
                            <p className="text-xs text-gray-500">{p.desc}</p>

                            {selectedPart === p.id && (
                                <div className="mt-4 p-4 bg-white/80 rounded-xl border border-emerald-200 animate-in slide-in-from-top-2">
                                    <p className="text-sm text-emerald-800 font-medium">
                                        💡 {p.help}
                                    </p>
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <div className="text-center pt-8">
                <Button variant="ghost" className="text-gray-400" onClick={() => window.location.hash = '#dashboard'}>
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
};
