import React, { useState } from 'react';
import { EDUCATIONAL_TOPICS } from '../constants';
import { generateEducationalContent } from '../services/geminiService';
import { Button } from './Button';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Education: React.FC = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [contentCache, setContentCache] = useState<Record<string, string>>({});
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleExpand = async (id: string, title: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(id);

        if (!contentCache[id]) {
            setLoadingId(id);
            const content = await generateEducationalContent(title);
            setContentCache(prev => ({ ...prev, [id]: content }));
            setLoadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-unity-black">Learn & Grow</h2>
                <p className="text-gray-500">Short lessons to understand your mind better.</p>
            </div>

            <div className="grid gap-4">
                {EDUCATIONAL_TOPICS.map((topic) => (
                    <div 
                        key={topic.id} 
                        className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-unity-50 transition-all duration-300 ${expandedId === topic.id ? 'ring-2 ring-unity-200' : ''}`}
                    >
                        <button 
                            onClick={() => handleExpand(topic.id, topic.title)}
                            className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${expandedId === topic.id ? 'bg-unity-500 text-white' : 'bg-unity-50 text-unity-500'}`}>
                                    <BookOpen size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-unity-black">{topic.title}</h3>
                                    <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded-md">{topic.category}</span>
                                        <span>• {topic.duration}</span>
                                    </div>
                                </div>
                            </div>
                            {expandedId === topic.id ? <ChevronDown className="text-gray-400"/> : <ChevronRight className="text-gray-400"/>}
                        </button>

                        {expandedId === topic.id && (
                            <div className="px-6 pb-8 pt-2 animate-in fade-in duration-300">
                                {loadingId === topic.id ? (
                                    <div className="space-y-3 p-4">
                                        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <div className="prose prose-pink prose-sm sm:prose-base max-w-none text-gray-700 bg-gray-50 p-6 rounded-2xl">
                                        <ReactMarkdown>{contentCache[topic.id]}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};