import React, { useState } from 'react';
import { MOODS, API_BASE_URL } from '../constants';
import { Button } from './Button';
import { Check, X, Loader } from 'lucide-react';

interface MoodLoggerProps {
    userId: number;
    onMoodLogged: () => void;
    onNegativeMood: (mood: string) => void;
    onNavigate?: (view: any) => void;
}

const TAGS = ['Work', 'Family', 'School', 'Health', 'Sleep', 'Social', 'Weather', 'Future'];

const MOOD_PROMPTS: Record<string, string> = {
    'Happy': "What's bringing you joy?",
    'Calm': "What's helping you feel peaceful?",
    'Okay': "What's occupying your mind?",
    'Sad': "What's weighing on your heart?",
    'Stressed': "What's pressing on you?",
    'Angry': "What's frustrating you?",
    'Anxious': "What's making you worry?",
    'Tired': "What's draining your energy?",
};

export const MoodLogger: React.FC<MoodLoggerProps> = ({ userId, onMoodLogged, onNegativeMood, onNavigate }) => {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [intensity, setIntensity] = useState(5);
    const [note, setNote] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [showPostCheckIn, setShowPostCheckIn] = useState(false);

    const handleMoodSelect = (moodLabel: string) => {
        if (selectedMood === moodLabel) {
            // keep selection
        } else {
            setSelectedMood(moodLabel);
            setIsExpanded(true);
            setShowPostCheckIn(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const resetForm = () => {
        setSelectedMood(null);
        setIntensity(5);
        setNote('');
        setSelectedTags([]);
        setIsExpanded(false);
        setShowPostCheckIn(false);
    };

    const handleSubmit = async () => {
        if (!userId || !selectedMood) return;
        setIsLoading(true);

        try {
            const finalNote = selectedTags.length > 0
                ? `[${selectedTags.join(', ')}] ${note}`.trim()
                : note;

            const res = await fetch(`${API_BASE_URL}/moods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    mood: selectedMood,
                    intensity,
                    note: finalNote
                })
            });

            if (res.ok) {
                onMoodLogged();
                // Show post-check-in suggestions instead of immediate reset
                setShowPostCheckIn(true);
                setIsExpanded(false); // Collapse form
            }
        } catch (error) {
            console.error("Failed to log mood", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (showPostCheckIn) {
        return (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 text-center space-y-6 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <Check size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-800">You've named it.</h3>
                    <p className="text-gray-500 mt-2">Acknowledging your feelings is the first step to healing.</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">What would help you right now?</p>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => onNavigate?.('breathe')} className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-blue-50 transition-all text-xs font-medium text-gray-600 flex flex-col items-center gap-1">
                            <span className="text-xl">🌬️</span> Breathe
                        </button>
                        <button onClick={() => onNavigate?.('journal')} className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-yellow-50 transition-all text-xs font-medium text-gray-600 flex flex-col items-center gap-1">
                            <span className="text-xl">📝</span> Write
                        </button>
                        <button onClick={resetForm} className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md hover:bg-gray-100 transition-all text-xs font-medium text-gray-600 flex flex-col items-center gap-1">
                            <span className="text-xl">🍵</span> Rest
                        </button>
                    </div>
                </div>

                <button onClick={resetForm} className="text-gray-400 text-sm hover:text-gray-600">
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 transition-all duration-300">
            <div className="mb-4">
                <h3 className="font-bold text-gray-700">How are you feeling right now?</h3>
                <p className="text-xs text-gray-400 mt-1">You can check in anytime. Even small feelings matter.</p>
            </div>

            {/* Mood Icons */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-between mb-6">
                {MOODS.map((mood) => (
                    <button
                        key={mood.label}
                        onClick={() => handleMoodSelect(mood.label)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${selectedMood === mood.label
                            ? 'bg-unity-50 ring-2 ring-unity-400 scale-110 shadow-sm'
                            : 'hover:bg-gray-50 opacity-70 hover:opacity-100'
                            }`}
                    >
                        <span className="text-3xl filter drop-shadow-sm">{mood.emoji}</span>
                        <span className={`text-[10px] font-medium ${selectedMood === mood.label ? 'text-unity-700' : 'text-gray-400'}`}>
                            {mood.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Expanded Details Form */}
            {isExpanded && selectedMood && (
                <div className="animate-in slide-in-from-top-4 space-y-6 pt-4 border-t border-gray-100">

                    {/* Intensity Slider */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-2xl">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">How strong is this feeling?</span>
                            <span className="text-unity-600 bg-white px-3 py-1 rounded-full shadow-sm text-xs font-bold border border-unity-100">
                                {intensity} / 10
                            </span>
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-unity-500 hover:accent-unity-600 transition-all"
                        />

                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Just a little</span>
                            <span>Very strong</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                            {MOOD_PROMPTS[selectedMood] || "What's affecting you?"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {TAGS.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1 rounded-full text-xs transition-colors border ${selectedTags.includes(tag)
                                        ? 'bg-unity-100 text-unity-700 border-unity-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Add a note (optional)</p>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Describe what's happening..."
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-unity-100 focus:outline-none resize-none h-20"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsExpanded(false)} className="text-gray-400">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading} className="px-8">
                            {isLoading ? <Loader className="animate-spin" size={18} /> : 'Check In'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
