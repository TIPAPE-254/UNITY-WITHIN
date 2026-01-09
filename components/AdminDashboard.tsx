import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, Shield, Activity, Flag, Plus, Trash2, Book, Trophy, AlertCircle, Search, ArrowLeft, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Button } from './Button';

type AdminTab = 'overview' | 'users' | 'rooms' | 'messages' | 'blocked' | 'moods' | 'journals' | 'wins' | 'reports';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ userCount: 0, messageCount: 0, moodCount: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [blockedLogs, setBlockedLogs] = useState<any[]>([]);
    const [moods, setMoods] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [wins, setWins] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [newRoom, setNewRoom] = useState({ name: '', description: '', type: 'public' });

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/stats`);
            const data = await res.json();
            if (data.success) setStats(data.stats);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'overview' && !selectedRoom) return;

        const fetchTabMap: Record<string, () => Promise<void>> = {
            users: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/users`);
                const data = await res.json();
                if (data.success) setUsers(data.data);
            },
            rooms: async () => {
                const res = await fetch(`${API_BASE_URL}/chat/rooms`);
                const data = await res.json();
                if (data.success) setRooms(data.data);
            },
            messages: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/chat/messages`);
                const data = await res.json();
                if (data.success) setMessages(data.data);
            },
            blocked: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/moderation-logs`);
                const data = await res.json();
                if (data.success) setBlockedLogs(data.data);
            },
            moods: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/moods`);
                const data = await res.json();
                if (data.success) setMoods(data.data);
            },
            journals: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/journals`);
                const data = await res.json();
                if (data.success) setJournals(data.data);
            },
            wins: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/tiny-wins`);
                const data = await res.json();
                if (data.success) setWins(data.data);
            },
            reports: async () => {
                const res = await fetch(`${API_BASE_URL}/admin/reports`);
                const data = await res.json();
                if (data.success) setReports(data.data);
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (selectedRoom) {
                    const res = await fetch(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/messages`);
                    const data = await res.json();
                    if (data.success) setMessages(data.data);
                } else if (fetchTabMap[activeTab]) {
                    await fetchTabMap[activeTab]();
                }
            } catch (e) { console.error(e); }
            setIsLoading(false);
        };
        fetchData();
    }, [activeTab, selectedRoom]);

    const toggleUserRole = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) {
            const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
            setUsers(updated);
        }
    };

    const deleteUser = async (id: number) => {
        if (window.confirm('Delete user?')) {
            await fetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
            setUsers(users.filter(u => u.id !== id));
            fetchStats();
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch(`${API_BASE_URL}/admin/chat/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRoom)
        });
        if (res.ok) {
            setNewRoom({ name: '', description: '', type: 'public' });
            const data = await res.json();
            if (data.success) {
                const rRes = await fetch(`${API_BASE_URL}/chat/rooms`);
                const rData = await rRes.json();
                if (rData.success) setRooms(rData.data);
            }
        }
    };

    const deleteRoom = async (id: number) => {
        if (window.confirm('Delete room?')) {
            await fetch(`${API_BASE_URL}/admin/chat/rooms/${id}`, { method: 'DELETE' });
            setRooms(rooms.filter(r => r.id !== id));
        }
    };

    const deleteMessage = async (id: number) => {
        if (window.confirm('Delete message?')) {
            await fetch(`${API_BASE_URL}/admin/chat/messages/${id}`, { method: 'DELETE' });
            setMessages(messages.filter(m => m.id !== id));
            fetchStats();
        }
    };

    const renderTabBtn = (id: AdminTab, label: string, Icon: any) => (
        <button
            onClick={() => { setActiveTab(id); setSelectedRoom(null); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeTab === id && !selectedRoom ? 'text-unity-600 border-b-2 border-unity-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            <Icon size={16} /> {label}
        </button>
    );

    const filteredContent = () => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'users') return users.filter(u => (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query));
        if (activeTab === 'messages' || selectedRoom) return messages.filter(m => (m.content || '').toLowerCase().includes(query) || (m.user_name || '').toLowerCase().includes(query));
        if (activeTab === 'rooms') return rooms.filter(r => (r.name || '').toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query));
        if (activeTab === 'moods') return moods.filter(m => (m.user_name || '').toLowerCase().includes(query) || (m.mood || '').toLowerCase().includes(query) || (m.note || '').toLowerCase().includes(query));
        if (activeTab === 'journals') return journals.filter(j => (j.user_name || '').toLowerCase().includes(query) || (j.content || '').toLowerCase().includes(query));
        if (activeTab === 'wins') return wins.filter(w => (w.user_name || '').toLowerCase().includes(query) || (w.content || '').toLowerCase().includes(query));
        if (activeTab === 'blocked') return blockedLogs.filter(b => (b.user_name || '').toLowerCase().includes(query) || (b.content || '').toLowerCase().includes(query));
        if (activeTab === 'reports') return reports.filter(r => (r.reporter_name || '').toLowerCase().includes(query) || (r.message_content || '').toLowerCase().includes(query));
        return [];
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen rounded-[2rem]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-unity-100 text-unity-600 rounded-xl"><Shield size={24} /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">System Command</h1>
                        <p className="text-xs text-gray-500">{selectedRoom ? `Auditing #${selectedRoom.name}` : 'Full Database Visibility Active'}</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-unity-200 w-full md:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-xs text-gray-400 font-bold uppercase">Citizens</span>
                    <div className="text-3xl font-bold">{stats.userCount}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-xs text-gray-400 font-bold uppercase">Messages</span>
                    <div className="text-3xl font-bold">{stats.messageCount}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-xs text-gray-400 font-bold uppercase">Mood Logs</span>
                    <div className="text-3xl font-bold">{stats.moodCount}</div>
                </div>
            </div>

            <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {renderTabBtn('overview', 'Dashboard', Shield)}
                {renderTabBtn('users', 'Users', Users)}
                {renderTabBtn('rooms', 'Rooms', Users)}
                {renderTabBtn('messages', 'Messages', MessageSquare)}
                {renderTabBtn('blocked', 'AI Flags', Flag)}
                {renderTabBtn('moods', 'Moods', Activity)}
                {renderTabBtn('journals', 'Journals', Book)}
                {renderTabBtn('wins', 'Wins', Trophy)}
                {renderTabBtn('reports', 'Reports', AlertCircle)}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-unity-200 border-t-unity-600 rounded-full animate-spin"></div></div>
                ) : (
                    <div className="p-6">
                        {selectedRoom ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><ArrowLeft size={20} /></button>
                                        <h3 className="text-xl font-bold text-gray-800">Inside #{selectedRoom.name}</h3>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 uppercase">{selectedRoom.type} mode</span>
                                </div>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {filteredContent().map((m: any) => (
                                        <div key={m.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-start group">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-gray-700">{m.user_name || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed">{m.content}</p>
                                            </div>
                                            <button onClick={() => deleteMessage(m.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="text-center py-20">
                                        <Shield className="mx-auto text-gray-100 mb-4" size={64} />
                                        <h3 className="text-xl font-bold text-gray-800">Welcome to Unity Control</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto">Select a tab above to monitor real-time community data and maintain safety.</p>
                                    </div>
                                )}

                                {activeTab === 'users' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">Identity</th><th className="px-4 py-3">Role</th><th className="px-4 py-3 text-right">Action</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((u: any) => <tr key={u.id}>
                                                    <td className="px-4 py-3"><div className="font-bold text-gray-800">{u.name}</div><div className="text-xs text-gray-400">{u.email}</div></td>
                                                    <td className="px-4 py-3"><button onClick={() => toggleUserRole(u.id, u.role)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{u.role.toUpperCase()}</button></td>
                                                    <td className="px-4 py-3 text-right"><button onClick={() => deleteUser(u.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'rooms' && (
                                    <div className="space-y-6">
                                        <form onSubmit={handleCreateRoom} className="p-4 bg-gray-50 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <input placeholder="Name" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" required />
                                            <input placeholder="Desc" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm">
                                                <option value="public">Public</option>
                                                <option value="support">Support</option>
                                            </select>
                                            <Button type="submit" size="sm"><Plus size={16} /> Create</Button>
                                        </form>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {filteredContent().map((r: any) => (
                                                <div key={r.id} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:border-unity-200 transition-colors">
                                                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedRoom(r)}>
                                                        <div className="flex items-center gap-2"><h4 className="font-bold text-gray-800">#{r.name}</h4><span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded uppercase">{r.type}</span></div>
                                                        <p className="text-xs text-gray-500">{r.description}</p>
                                                        <span className="text-[10px] text-unity-500 font-bold flex items-center gap-1 mt-1">Audit Conversation <ExternalLink size={10} /></span>
                                                    </div>
                                                    <button onClick={() => deleteRoom(r.id)} className="text-gray-300 hover:text-red-500 ml-4"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'messages' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Content</th><th className="px-4 py-3 text-right">Action</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((m: any) => <tr key={m.id}>
                                                    <td className="px-4 py-3 font-bold">{m.user_name || 'Anonymous'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{m.content}</td>
                                                    <td className="px-4 py-3 text-right"><button onClick={() => deleteMessage(m.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'moods' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Mood</th><th className="px-4 py-3">Intensity</th><th className="px-4 py-3">Note</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((m: any) => <tr key={m.id}>
                                                    <td className="px-4 py-3 font-bold">{m.user_name}</td>
                                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{m.mood}</span></td>
                                                    <td className="px-4 py-3">
                                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="bg-unity-500 h-full" style={{ width: `${m.intensity * 10}%` }}></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400 italic">{m.note || '-'}</td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'journals' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Entry</th><th className="px-4 py-3">Date</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((j: any) => <tr key={j.id}>
                                                    <td className="px-4 py-3 font-bold">{j.user_name}</td>
                                                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{j.content}</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400">{new Date(j.created_at).toLocaleDateString()}</td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'wins' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Tiny Win</th><th className="px-4 py-3">Date</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((w: any) => <tr key={w.id}>
                                                    <td className="px-4 py-3 font-bold">{w.user_name}</td>
                                                    <td className="px-4 py-3 text-gray-600">{w.content}</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'blocked' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Blocked Chat</th><th className="px-4 py-3 text-right">Flag</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((log: any) => <tr key={log.id}>
                                                    <td className="px-4 py-3 font-bold">{log.user_name || 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-xs italic text-gray-500">"{log.content}"</td>
                                                    <td className="px-4 py-3 text-right"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.flag_type === 'CRISIS' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>{log.flag_type}</span></td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'reports' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Flagged Content</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((r: any) => <tr key={r.id}>
                                                    <td className="px-4 py-3 font-bold">{r.reporter_name}</td>
                                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">{r.reason}</span></td>
                                                    <td className="px-4 py-3 text-gray-500 italic">"{r.message_content}"</td>
                                                </tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
