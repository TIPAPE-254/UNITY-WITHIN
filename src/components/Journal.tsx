import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Calendar, ChevronRight, PenTool, Trash2, Heart, Sparkles, X, Save, Star } from 'lucide-react';
import { Button } from './Button';
import { MOODS, API_BASE_URL } from '../constants';
import { useUser } from '../contexts/UserContext';
import { queueRequest } from '../services/offlineSyncService';

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  category: string;
}

const CATEGORIES = ['Healing', 'Gratitude', 'Growth', 'Reflection', 'Daily'];

const getActiveUserId = (): string | null => {
  try {
    const savedUser = localStorage.getItem('unity_user');
    if (!savedUser) return null;
    const parsed = JSON.parse(savedUser);
    return parsed?.id ? String(parsed.id) : null;
  } catch {
    return null;
  }
};

export const Journal: React.FC = () => {
  const { logToolUse } = useUser();
  const userId = getActiveUserId();
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('unity_journal_entries');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Sync with cloud on load
  useEffect(() => {
    const fetchJournals = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/journals/${userId}`);
        if (res.ok) {
           const { data } = await res.json();
           if (Array.isArray(data)) {
              setEntries(data);
           }
        }
      } catch (e) {
        console.warn('Could not fetch journals, staying in offline mode.');
      }
    };
    fetchJournals();
  }, [userId]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('');
  const [newCategory, setNewCategory] = useState('Daily');

  useEffect(() => {
    localStorage.setItem('unity_journal_entries', JSON.stringify(entries));
  }, [entries]);

  const handleSave = () => {
    if (!newContent.trim()) return;

    const entryData = {
        title: newTitle || 'Untitled Reflection',
        content: newContent,
        mood: newMood,
        category: newCategory,
        userId: userId
    };

    if (editingEntry) {
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? {
        ...e,
        ...entryData
      } : e));
      // TODO: Add PUT support to queueRequest if needed, 
      // but for now we focus on creating new entries offline
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        title: entryData.title,
        content: entryData.content,
        mood: entryData.mood,
        category: entryData.category,
      };
      setEntries(prev => [newEntry, ...prev]);
      logToolUse('journal');
      
      // PERSIST TO CLOUD (Offline Ready)
      if (userId) {
        queueRequest(`${API_BASE_URL}/api/journals`, 'POST', entryData);
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewMood('');
    setNewCategory('Daily');
    setIsAdding(false);
    setEditingEntry(null);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewTitle(entry.title);
    setNewContent(entry.content);
    setNewMood(entry.mood || '');
    setNewCategory(entry.category);
    setIsAdding(true);
  };

  const deleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reflection?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Healing <span className="text-pink-500">Journal</span></h1>
          <p className="text-gray-500 font-medium">Chapter {Math.floor(entries.length / 10) + 1}</p>
        </div>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="rounded-2xl h-14 px-8 shadow-lg shadow-pink-100 flex items-center gap-2 text-lg"
          >
            <Plus size={24} /> New Entry
          </Button>
        )}
      </header>

      {entries.length >= 7 && (
         <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[40px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Sparkles size={120} />
            </div>
            <div className="relative z-10 space-y-4">
               <h3 className="text-2xl font-black flex items-center gap-2">
                  <Star className="text-yellow-300" fill="currentColor" /> Milestone: 7 Reflections
               </h3>
               <p className="text-indigo-100 font-medium max-w-2xl leading-relaxed">
                  "Dear Future Me, you have shown up for yourself 7 times now. Each word you write is a brick in the foundation of your healing. Keep going, the garden is growing."
               </p>
               <div className="pt-2">
                  <span className="text-xs font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Letter from your past self</span>
               </div>
            </div>
         </div>
      )}

      {isAdding ? (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-pink-100 animate-in slide-in-from-bottom-4 duration-300">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{editingEntry ? 'Edit Reflection' : 'New Reflection'}</h2>
              <button onClick={resetForm} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
           </div>
           
           <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Title</label>
                <input 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Give your thought a name..."
                  className="w-full bg-gray-50 border border-pink-50 rounded-2xl p-4 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewCategory(c)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          newCategory === c ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mood</label>
                  <div className="flex gap-2">
                    {MOODS.map(m => (
                      <button
                        key={m.label}
                        onClick={() => setNewMood(m.label)}
                        className={`w-12 h-12 rounded-xl text-2xl transition-all ${
                          newMood === m.label ? 'bg-pink-50 ring-2 ring-pink-500 scale-110' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reflect</label>
                <textarea 
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="What's on your heart? Be honest, Buddie is listening..."
                  className="w-full bg-gray-50 border border-pink-50 rounded-3xl p-6 min-h-[300px] text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSave} className="flex-1 h-14 rounded-2xl text-lg font-bold shadow-pink-200 shadow-xl">
                  <Save size={20} className="mr-2" /> {editingEntry ? 'Update Reflection' : 'Save Reflection'}
                </Button>
                <button onClick={resetForm} className="px-8 font-bold text-gray-500 hover:text-gray-900 transition-colors">
                  Discard
                </button>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search & Stats */}
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search your reflections..."
                  className="w-full bg-white border border-pink-100 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all font-medium"
                />
             </div>
             <div className="bg-white border border-pink-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                   <BookOpen size={20} />
                </div>
                <div>
                   <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Entries</p>
                   <p className="text-lg font-black text-gray-900">{entries.length}</p>
                </div>
             </div>
          </div>

          {/* Entry List */}
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className="bg-white rounded-[32px] p-6 border border-pink-50 shadow-sm hover:shadow-xl hover:border-pink-200 transition-all group flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-pink-50 text-pink-500 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg">
                      {entry.category}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEdit(entry)}
                        className="p-2 text-gray-400 hover:text-pink-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <PenTool size={16} />
                      </button>
                      <button 
                        onClick={() => deleteEntry(entry.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    {entry.mood && (
                      <span className="text-2xl" title={entry.mood}>
                        {MOODS.find(m => m.label === entry.mood)?.emoji || '✨'}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{entry.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1 italic">
                    "{entry.content}"
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-pink-50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                       <Calendar size={14} />
                       {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <button 
                      onClick={() => startEdit(entry)}
                      className="text-pink-500 hover:text-pink-600 font-bold text-sm flex items-center gap-1 group/btn"
                    >
                      Read full <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-pink-100">
               <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-pink-300 mx-auto mb-6">
                  <PenTool size={40} />
               </div>
               <h3 className="text-2xl font-bold text-gray-900 mb-2">No reflections yet</h3>
               <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
                  Your thoughts deserve a home. Start your first journal entry to begin your healing journey.
               </p>
               <Button onClick={() => setIsAdding(true)} className="rounded-2xl px-10 h-14 font-black">
                  Write your first entry
               </Button>
            </div>
          )}
        </div>
      )}

      {/* Daily Quote/Spark */}
      {!isAdding && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
             <Sparkles size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
             <div className="w-20 h-20 bg-white/20 rounded-3xl backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Heart size={40} />
             </div>
             <div>
                <h3 className="text-xl font-bold mb-2">Daily Journaling Spark</h3>
                <p className="text-indigo-50 opacity-90 leading-relaxed font-medium italic">
                  "What is one thing you did today, no matter how small, that you are proud of? Maybe it was just choosing to breathe."
                </p>
             </div>
             <Button 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 border-0 text-white rounded-2xl h-12 flex-shrink-0"
                onClick={() => {
                  setIsAdding(true);
                  setNewTitle('Daily Pride');
                  setNewCategory('Reflection');
                  setNewContent('Today I am proud of...');
                }}
             >
                Use Prompt
             </Button>
          </div>
        </div>
      )}
    </div>
  );
};
