import React, { useState, useEffect } from 'react';
import { Users, Lock, Heart, MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { ChatRoom } from './ChatRoom';

interface LocalChatRoom {
    id: number;
    name: string;
    description: string;
    type: 'public' | 'private' | 'support';
}

interface CommunityProps {
    userId?: number;
    userName?: string;
}

export const Community: React.FC<CommunityProps> = ({ userId, userName }) => {
    const [rooms, setRooms] = useState<LocalChatRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/chat/rooms`);
            const data = await res.json();
            if (data.success) {
                setRooms(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch rooms', error);
        } finally {
            setLoading(false);
        }
    };

    if (activeRoomId) {
        const activeRoom = rooms.find(r => r.id === activeRoomId);
        return (
            <ChatRoom
                roomId={activeRoomId}
                roomName={activeRoom?.name || 'Chat'}
                userId={userId!}
                userName={userName || 'Anonymous'}
                onLeave={() => setActiveRoomId(null)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <header className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold text-unity-black">
                    Community <span className="text-unity-500">Circles</span>
                </h1>
                <p className="text-gray-500 max-w-xl mx-auto">
                    Find a safe space to share, listen, and connect with others who understand what you're going through.
                </p>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rooms.map(room => (
                        <button
                            key={room.id}
                            onClick={() => setActiveRoomId(room.id)}
                            className="text-left bg-white p-6 rounded-2xl border border-unity-50 shadow-sm hover:shadow-md hover:border-unity-200 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MessageCircle size={80} />
                            </div>

                            <div className="flex items-start gap-4 relative z-10">
                                <div className={`p-3 rounded-xl ${room.type === 'support' ? 'bg-orange-100 text-orange-600' :
                                        room.type === 'private' ? 'bg-purple-100 text-purple-600' :
                                            'bg-unity-100 text-unity-600'
                                    }`}>
                                    {room.type === 'support' ? <Heart size={24} /> :
                                        room.type === 'private' ? <Lock size={24} /> :
                                            <Users size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-unity-black mb-1 group-hover:text-unity-600 transition-colors">
                                        {room.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {room.description}
                                    </p>
                                    <div className="mt-3 inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-500">
                                        {room.type === 'support' ? 'Support Group' : 'Public Channel'}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
