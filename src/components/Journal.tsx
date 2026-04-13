import React, { useState } from 'react';
import { Button } from './Button';
import { Save, Plus, Calendar } from 'lucide-react';
import { JournalEntry } from '../types';

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    { id: '1', date: new Date().toLocaleDateString(), content: 'Today I felt a bit better about myself after the morning walk.', tags: ['Gratitude', 'Nature'] }
  ]);
  const [newEntry, setNewEntry] = useState('');
  const [isWriting, setIsWriting] = useState(false);

  const handleSave = () => {
    if (!newEntry.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      content: newEntry,
      tags: []
    };
    setEntries([entry, ...entries]);
    setNewEntry('');
    setIsWriting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-unity-black">Journal</h2>
        {!isWriting && (
            <Button onClick={() => setIsWriting(true)} className="gap-2">
                <Plus size={18} /> New Entry
            </Button>
        )}
      </div>

      {/* Editor */}
      {isWriting && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 animate-in slide-in-from-bottom-4">
            <h3 className="text-gray-500 text-sm mb-2 uppercase tracking-wide">New Reflection</h3>
            <textarea 
                className="w-full h-40 p-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-unity-300 focus:ring-2 focus:ring-unity-100 transition-all resize-none outline-none text-unity-black"
                placeholder="What's on your mind today? Let it all out..."
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsWriting(false)}>Cancel</Button>
                <Button onClick={handleSave} className="gap-2">
                    <Save size={18} /> Save Entry
                </Button>
            </div>
        </div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {entries.map((entry) => (
            <div key={entry.id} className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Calendar size={14} />
                    <span>{entry.date}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            </div>
        ))}
      </div>
    </div>
  );
};