
import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import { API_BASE_URL } from '../constants';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

interface MoodEntry {
    id: number;
    mood: string;
    intensity: number;
    note: string;
    created_at: string;
}

interface MoodHistoryGraphProps {
    userId: number;
    refreshTrigger?: number;
}

const MOOD_COLORS: Record<string, string> = {
    'Happy': '#FACC15',   // Yellow
    'Calm': '#4ADE80',    // Green
    'Okay': '#60A5FA',    // Blue
    'Sad': '#818CF8',     // Indigo
    'Stressed': '#FB923C', // Orange
    'Angry': '#F87171',    // Red
    'Anxious': '#A78BFA',  // Purple
    'Tired': '#94A3B8'     // Slate
};

export const MoodHistoryGraph: React.FC<MoodHistoryGraphProps> = ({ userId, refreshTrigger }) => {
    const [data, setData] = useState<MoodEntry[]>([]);
    const [range, setRange] = useState<'day' | 'week' | 'month' | 'annual'>('week');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [userId, range, refreshTrigger]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/moods?userId=${userId}&range=${range}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (error) {
            console.error("Failed to fetch mood history", error);
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        datasets: [
            {
                label: 'Mood Intensity',
                data: data.map(d => ({
                    x: new Date(d.created_at),
                    y: d.intensity,
                    mood: d.mood,
                    note: d.note
                })),
                fill: true,
                borderColor: '#e2e8f0', // Neutral light border for the line
                borderWidth: 2,
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(226, 232, 240, 0.2)');
                    gradient.addColorStop(1, 'rgba(226, 232, 240, 0.0)');
                    return gradient;
                },
                tension: 0.4,
                pointRadius: range === 'annual' ? 3 : 5,
                pointHoverRadius: 8,
                pointBackgroundColor: data.map(d => MOOD_COLORS[d.mood] || '#8B5CF6'),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
            },
        ],
    };

    const options: any = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: range === 'day' ? 'hour' : range === 'week' ? 'day' : range === 'month' ? 'week' : 'month',
                    displayFormats: {
                        hour: 'ha',
                        day: 'MMM d',
                        week: 'MMM d',
                        month: 'MMM yyyy'
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    color: '#9CA3AF', // Gray-400
                    font: {
                        size: 11
                    },
                    maxRotation: 0,
                    autoSkip: true
                }
            },
            y: {
                min: 0,
                max: 10,
                grid: {
                    color: '#F3F4F6', // Gray-100
                    borderDash: [5, 5]
                },
                ticks: {
                    display: false // Hide numbers for cleaner look, or keep small
                },
                border: {
                    display: false
                }
            },
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const d = context.raw;
                        return ` ${d.mood} (Level ${d.y}) ${d.note ? '- ' + d.note : ''}`;
                    },
                    title: (tooltipItems: any) => {
                        const date = tooltipItems[0].raw.x;
                        return date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: range === 'annual' ? 'numeric' : undefined
                        });
                    }
                },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1F2937',
                bodyColor: '#4B5563',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 12,
                displayColors: false, // Cleaner tooltip
                titleFont: {
                    size: 13,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 12
                }
            }
        },
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-unity-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="font-bold text-gray-700 text-lg">Your Mood Journey</h3>
                    <p className="text-sm text-gray-400">Tracking your personal waves.</p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    {(['day', 'week', 'month', 'annual'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-1.5 text-sm rounded-lg transition-all whitespace-nowrap ${range === r
                                ? 'bg-white text-unity-700 shadow-sm font-medium'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-64 w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">Loading journey...</div>
                ) : data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">No mood entries yet. Check in above!</div>
                ) : (
                    <Line options={options} data={chartData} />
                )}
            </div>

            {data.length > 0 && (
                <div className="mt-4 p-4 bg-unity-50/50 rounded-xl text-sm text-unity-800 flex items-start gap-2">
                    <span className="text-xl">🌿</span>
                    <p>
                        Everything fluctuates. Notice the waves, but remember you are the ocean.
                    </p>
                </div>
            )}
        </div>
    );
};
