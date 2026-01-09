import React, { useState } from 'react';
import { EDUCATIONAL_TOPICS } from '../constants';
import { generateEducationalContent } from '../services/geminiService';
import { Button } from './Button';
import { ChevronRight, ChevronDown, BookOpen, ExternalLink, Search, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Education: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [contentCache, setContentCache] = useState<Record<string, { synthesis: string, sources: { name: string, url: string }[] }>>({});
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleExpand = async (id: string, title: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(id);

        if (!contentCache[id]) {
            setLoadingId(id);
            const data = await generateEducationalContent(title);
            setContentCache(prev => ({
                ...prev,
                [id]: {
                    synthesis: data.synthesis || "Content currently unavailable.",
                    sources: data.sources || []
                }
            }));
            setLoadingId(null);
        }
    };

    const filteredTopics = EDUCATIONAL_TOPICS.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // If searching and no results, allow dynamic AI generation for that topic
    const displayTopics = searchQuery && filteredTopics.length === 0
        ? [{ id: 'dynamic', title: searchQuery, category: 'AI Research', duration: 'New' }]
        : filteredTopics;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-unity-500 to-unity-700 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BookOpen size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                    <h2 className="text-3xl font-bold">What would you like to explore?</h2>
                    <p className="text-unity-100 text-lg max-w-md">Discover expert-backed insights tailored for your mental wellbeing.</p>

                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-unity-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search topics (e.g. Anxiety, Focus, Peace)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-6 px-1">
                {displayTopics.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Search size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No results for "{searchQuery}"</p>
                    </div>
                )}
                {displayTopics.map((topic) => (
                    <div
                        key={topic.id}
                        className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-unity-50 transition-all duration-300 ${expandedId === topic.id ? 'ring-2 ring-unity-200 shadow-md' : ''}`}
                    >
                        <button
                            onClick={() => handleExpand(topic.id, topic.title)}
                            className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl ${expandedId === topic.id ? 'bg-unity-500 text-white' : 'bg-unity-50 text-unity-500'}`}>
                                    {topic.id === 'dynamic' ? <Sparkles size={24} /> : <BookOpen size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-unity-black capitalize">{topic.title}</h3>
                                    <div className="flex gap-3 text-sm text-gray-400 mt-1">
                                        <span className="bg-gray-100 px-3 py-1 rounded-full text-unity-600 font-bold uppercase text-[10px] tracking-wider">{topic.category}</span>
                                        <span className="flex items-center opacity-60">• {topic.duration}</span>
                                    </div>
                                </div>
                            </div>
                            {expandedId === topic.id ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                        </button>

                        {expandedId === topic.id && (
                            <div className="px-6 pb-8 pt-2 animate-in fade-in duration-300 space-y-6">
                                {loadingId === topic.id ? (
                                    <div className="space-y-4 p-4">
                                        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
                                        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="prose prose-pink prose-sm sm:prose-base max-w-none text-gray-700 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                            <ReactMarkdown>{contentCache[topic.id].synthesis}</ReactMarkdown>
                                        </div>

                                        {contentCache[topic.id].sources.length > 0 && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-widest px-1">Sources Analyzed</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {contentCache[topic.id].sources.map((source, i) => (
                                                        <a
                                                            key={i}
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-200 hover:bg-unity-50 hover:text-unity-600 hover:border-unity-200 transition-all opacity-80 hover:opacity-100"
                                                        >
                                                            <span className="truncate max-w-[120px]">{source.name}</span>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};