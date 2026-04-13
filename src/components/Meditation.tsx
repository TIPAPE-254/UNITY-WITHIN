import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from './Button';

// Using a calm nature sound (Forest/Birds) from a reliable source.
// This is a Pixabay audio file.
const MEDITATION_AUDIO_URL = "https://cdn.pixabay.com/download/audio/2022/02/07/audio_6e5f187315.mp3";

export const Meditation: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes default
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio object
        audioRef.current = new Audio(MEDITATION_AUDIO_URL);
        audioRef.current.loop = true;

        return () => {
            // Cleanup
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    useEffect(() => {
        let interval: any;

        if (isActive && timeLeft > 0) {
            // Play audio if not already playing
            audioRef.current?.play().catch(e => console.log("Audio play failed (user interaction needed likely):", e));

            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            audioRef.current?.pause();
        } else {
            // Paused
            audioRef.current?.pause();
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(10 * 60);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-6 animate-in fade-in duration-700">

            {/* Background Ambience Visual */}
            <div className="absolute inset-0 -z-10 overflow-hidden opacity-10 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-300 rounded-full blur-3xl transition-transform duration-[10000ms] ease-in-out ${isActive ? 'scale-125' : 'scale-100'}`}></div>
            </div>

            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold text-unity-800">Morning Meditation</h2>
                <p className="text-unity-600 max-w-md mx-auto">
                    Find a comfortable seated position. Close your eyes, and let the sounds of nature ground you.
                </p>
            </div>

            {/* Timer Display */}
            <div className="relative mb-12">
                <div className="w-64 h-64 rounded-full border-8 border-unity-100 flex items-center justify-center bg-white shadow-xl relative">
                    {/* Progress Ring (Simple approach) */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle
                            cx="128"
                            cy="128"
                            r="124"
                            fill="none"
                            stroke="#E0E7FF" /* unity-100 */
                            strokeWidth="8"
                        />
                        <circle
                            cx="128"
                            cy="128"
                            r="124"
                            fill="none"
                            stroke="#10B981" /* green-500 */
                            strokeWidth="8"
                            strokeDasharray={2 * Math.PI * 124}
                            strokeDashoffset={((10 * 60 - timeLeft) / (10 * 60)) * (2 * Math.PI * 124)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>

                    <div className="text-6xl font-mono font-light text-unity-700 z-10">
                        {formatTime(timeLeft)}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-full bg-unity-50 text-unity-600 hover:bg-unity-100 transition-colors"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                <Button
                    size="lg"
                    onClick={toggleTimer}
                    className={`w-40 gap-2 text-lg shadow-lg transition-transform hover:scale-105 ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {isActive ? <><Pause size={24} /> Pause</> : <><Play size={24} /> Start</>}
                </Button>

                <button
                    onClick={resetTimer}
                    className="p-3 rounded-full bg-unity-50 text-unity-600 hover:bg-unity-100 transition-colors"
                    title="Reset Timer"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
    );
};
