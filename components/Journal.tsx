import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Save, Plus, Calendar, Loader, Mic, MicOff, Sparkles } from 'lucide-react';
import { JournalEntry } from '../types';
import { API_BASE_URL } from '../constants';

interface JournalProps {
  userId?: number;
  moodId?: number | null;
}

export const Journal: React.FC<JournalProps> = ({ userId, moodId }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [isFreeWrite, setIsFreeWrite] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Speech Recognition Setup
  const recognitionRef = React.useRef<any>(null);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (timerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timer, timerActive]);

  const startFreeWrite = (minutes: number) => {
    setIsWriting(true);
    setIsFreeWrite(true);
    setTimer(minutes * 60);
    setTimerActive(true);
    setNewEntry('');
  };

  const cancelWriting = () => {
    setIsWriting(false);
    setIsFreeWrite(false);
    setTimerActive(false);
  };

  const handleGetReflection = async () => {
    if (!newEntry.trim()) return;
    setIsThinking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/buddie/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Respond with a single, short, 1-sentence reflective question to help me explore this thought deeper (no preamble): "${newEntry}"`
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewEntry(prev => prev + `\n\n✨ Reflection: ${data.message}\n\n`);
      }
    } catch (error) {
      console.error("Reflection error", error);
    } finally {
      setIsThinking(false);
    }
  };



  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setPermissionError(false);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  };

  useEffect(() => {
    if (userId) fetchEntries();
  }, [userId]);

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/journals/${userId}`);
      const data = await res.json();
      if (data.success) {
        const mapped = data.data.map((e: any) => ({
          id: e.id.toString(),
          date: new Date(e.created_at).toLocaleDateString(),
          content: e.content,
          tags: e.mood ? [e.mood] : []
        }));
        setEntries(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch journal", error);
    }
  };

  const handleSave = async () => {
    if (!newEntry.trim() || !userId) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/journals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content: newEntry, moodId })
      });
      const data = await res.json();

      if (data.success) {
        fetchEntries();
        setNewEntry('');
        cancelWriting(); // Use cancelWriting to reset all writing states
      }
    } catch (error) {
      console.error("Failed to save entry", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refs for speech recognition to access latest state/functions (keep at end to avoid hoisting issues)
  const handleSaveRef = React.useRef(handleSave);
  const cancelWritingRef = React.useRef(cancelWriting);

  useEffect(() => {
    handleSaveRef.current = handleSave;
    cancelWritingRef.current = cancelWriting;
  });

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();

            // Command detection
            if (transcript === 'save') {
              handleSaveRef.current();
              return;
            }
            if (transcript === 'exit' || transcript === 'exit journal') {
              cancelWritingRef.current();
              return;
            }
            if (transcript === 'edit') {
              // Just consume the command 'edit' without adding to text
              return;
            }

            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setNewEntry(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setPermissionError(true);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        // If we didn't stop it manually, it might have stopped due to silence. 
        // We'll manage state via the toggle.
      };

      recognitionRef.current = recognition;
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-unity-black">Journal</h2>
        {!isWriting && (
          <div className="flex gap-2">
            <Button onClick={() => startFreeWrite(3)} variant="outline" className="gap-2 border-unity-200 text-unity-600 hover:bg-unity-50">
              ⚡ Brain Dump (3m)
            </Button>
            <Button onClick={() => setIsWriting(true)} className="gap-2">
              <Plus size={18} /> New Entry
            </Button>
          </div>
        )}
      </div>

      {/* Editor */}
      {isWriting && (
        <div className={` p-6 rounded-3xl shadow-sm border animate-in slide-in-from-bottom-4 transition-all ${isFreeWrite ? 'bg-unity-50 border-unity-200' : 'bg-white border-unity-50'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-gray-500 text-sm uppercase tracking-wide">
              {isFreeWrite ? `Free Flow Mode • ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : 'New Reflection'}
            </h3>
            {isFreeWrite && timer === 0 && <span className="text-green-600 text-xs font-bold animate-pulse">Time's Up! Wrap it up.</span>}
          </div>

          <textarea
            className={`w-full h-40 p-4 rounded-xl border focus:ring-2 transition-all resize-none outline-none text-unity-black ${isFreeWrite ? 'bg-white border-unity-100 focus:border-unity-300 focus:ring-unity-100' : 'bg-gray-50 border-gray-200 focus:border-unity-300 focus:ring-unity-100'}`}
            placeholder={isFreeWrite ? "Don't stop typing. Don't edit. Just release everything..." : "What's on your mind today? Let it all out..."}
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
          />
          {permissionError && (
            <p className="text-red-500 text-xs mt-2">Microphone access denied. Please check your browser settings.</p>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <button
                onClick={toggleListening}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all overflow-hidden ${isListening
                  ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-200 pl-9'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {isListening && (
                  <span className="absolute left-3 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
                {isListening ? (
                  <>
                    <span className="relative z-10 transition-opacity duration-300">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                  </>
                )}
              </button>

              <button
                onClick={handleGetReflection}
                disabled={isThinking || !newEntry.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100 disabled:opacity-50"
              >
                <Sparkles size={16} className={isThinking ? 'animate-spin' : ''} />
                {isThinking ? 'Thinking...' : 'AI Reflection'}
              </button>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsWriting(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2" disabled={isLoading}>
                {isLoading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                Save Entry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {entries.length === 0 && !isWriting ? (
          <div className="text-center py-10 text-gray-400">
            <p>Your journal is empty. Start writing...</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Calendar size={14} />
                <span>{entry.date}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};