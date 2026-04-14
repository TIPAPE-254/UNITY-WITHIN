import React, { useState, useEffect } from 'react';
import { Users, Shield, Activity, Flag, Plus, Trash2, Book, Trophy, AlertCircle, Search, ArrowLeft, ExternalLink, Stethoscope, Calendar, Mail, X, BarChart3, Eye } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Button } from './Button';
import { AdminTable } from './AdminTable';
import { AdminEventManager } from './AdminEventManager';

type AdminTab = 'overview' | 'analytics' | 'users' | 'rooms' | 'blocked' | 'moods' | 'journals' | 'wins' | 'reports' | 'therapists' | 'events' | 'volunteers';

interface AdminDashboardProps {
    onNavigate?: (view: any, data?: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState({ userCount: 0, messageCount: 0, moodCount: 0 });
    const [statsHistory, setStatsHistory] = useState<Array<{ time: string; userCount: number; messageCount: number; moodCount: number }>>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [blockedLogs, setBlockedLogs] = useState<any[]>([]);
    const [moods, setMoods] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [wins, setWins] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [therapists, setTherapists] = useState<any[]>([]);
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [volunteerStats, setVolunteerStats] = useState({ total: 0, active: 0, pending: 0 });
    const [aiConfigStatus, setAiConfigStatus] = useState<any>(null);
    const [aiConfigLoading, setAiConfigLoading] = useState(false);
    const [aiConfigLastChecked, setAiConfigLastChecked] = useState<string>('');

    // Persist activeTab and selectedRoom in localStorage
    const getInitialTab = (): AdminTab => {
        const tab = localStorage.getItem('admin_activeTab');
        return (tab && [
            'overview','analytics','users','rooms','blocked','moods','journals','wins','reports','therapists','events','volunteers'
        ].includes(tab)) ? (tab as AdminTab) : 'overview';
    };
    const getInitialRoom = () => {
        const room = localStorage.getItem('admin_selectedRoom');
        return room ? JSON.parse(room) : null;
    };

    const [activeTab, setActiveTab] = useState<AdminTab>(getInitialTab());
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<any>(getInitialRoom());
    const [newRoom, setNewRoom] = useState({ name: '', description: '', type: 'public' });
    const [therapistForm, setTherapistForm] = useState<any>({
        id: null,
        name: '',
        photo: '',
        email: '',
        password: '',
        phone: '',
        specialization: '',
        bio: '',
        qualifications: '',
        experience: '1+ years',
        languages: 'English, Swahili',
        availability: 'online',
        availability_schedule: '',
        session_price: '$5 chat / $10 video',
        rating: 4.5,
        status: 'pending'
    });
    const [inviteForm, setInviteForm] = useState({ email: '' });
    const [inviteLink, setInviteLink] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [volInviteForm, setVolInviteForm] = useState({ email: '' });
    const [volInviteLink, setVolInviteLink] = useState('');
    const [volInviteSuccess, setVolInviteSuccess] = useState('');
    const [volInviteError, setVolInviteError] = useState('');
    const [emailModal, setEmailModal] = useState({ open: false, to: '', subject: '', message: '' });
    const [sendingEmail, setSendingEmail] = useState(false);

    // Debug logging for authentication and data loading
    useEffect(() => {
        const userJson = localStorage.getItem('user');
        const parsedUser = userJson ? JSON.parse(userJson) : null;
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔍 AdminDashboard init:', {
                userFound: !!parsedUser,
                userEmail: parsedUser?.email || 'NOT SET',
                userRole: parsedUser?.role || 'NOT SET'
            });
        }
    }, []);

    const getAdminHeaders = (includeJson = false): HeadersInit => {
        let role = '';
        let email = '';
        try {
            const rawUser = localStorage.getItem('user');
            const parsedUser = rawUser ? JSON.parse(rawUser) : null;
            role = parsedUser?.role || '';
            email = parsedUser?.email || '';
        } catch {
            role = '';
            email = '';
        }

        return {
            ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
            'x-role': role,
            'x-user-email': email
        };
    };

    const adminFetch = (url: string, options: RequestInit = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                ...getAdminHeaders(),
                ...(options.headers || {})
            }
        });
    };

    // Save tab/room to localStorage on change
    useEffect(() => {
        localStorage.setItem('admin_activeTab', activeTab);
    }, [activeTab]);
    useEffect(() => {
        if (selectedRoom) {
            localStorage.setItem('admin_selectedRoom', JSON.stringify(selectedRoom));
        } else {
            localStorage.removeItem('admin_selectedRoom');
        }
    }, [selectedRoom]);

    const fetchStats = async () => {
        try {
            const res = await adminFetch(`${API_BASE_URL}/admin/stats`);
            const data = await res.json();
            if (!res.ok) {
                console.error('❌ Admin stats request failed:', res.status, data);
                return;
            }
            if (data.success) {
                setStats(data.stats);
                setStatsHistory(prev => {
                    const next = [
                        ...prev,
                        {
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            userCount: data.stats.userCount,
                            messageCount: data.stats.messageCount,
                            moodCount: data.stats.moodCount,
                        }
                    ];
                    return next.slice(-30);
                });
            }
        } catch (e) { 
            console.error('❌ Admin stats fetch error:', e); 
        }
    };

    const fetchAiConfigStatus = async () => {
        setAiConfigLoading(true);
        try {
            const res = await adminFetch(`${API_BASE_URL}/ai/config-status`);
            const data = await res.json();
            if (!res.ok) {
                console.error('❌ AI config status request failed:', res.status, data);
                return;
            }
            if (data?.success) {
                setAiConfigStatus(data);
                setAiConfigLastChecked(new Date().toLocaleString());
            }
        } catch (e) {
            console.error('❌ AI config status fetch error:', e);
        } finally {
            setAiConfigLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchAiConfigStatus();
    }, []);

    // Polling for real-time updates
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        const safeAdminFetch = async (url: string, onSuccess: (data: any) => void) => {
            try {
                const res = await adminFetch(url);
                const data = await res.json();
                if (!res.ok) {
                    console.error(`❌ Admin API error (${res.status}):`, url, data);
                    return;
                }
                if (data.success) onSuccess(data.data);
            } catch (e) { 
                console.error(`❌ Fetch error for ${url}:`, e); 
            }
        };

        const fetchTabMap: Record<string, () => Promise<void>> = {
            users: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/users`, setUsers);
            },
            rooms: async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/chat/rooms`);
                    const data = await res.json();
                    if (!res.ok) {
                        console.error(`❌ Rooms fetch failed (${res.status})`, data);
                        return;
                    }
                    if (data.success) setRooms(data.data);
                } catch (e) { 
                    console.error('❌ Rooms fetch error:', e); 
                }
            },
            messages: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/chat/messages`, setMessages);
            },
            blocked: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/moderation-logs`, setBlockedLogs);
            },
            moods: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/moods`, setMoods);
            },
            journals: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/journals`, setJournals);
            },
            wins: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/tiny-wins`, setWins);
            },
            reports: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/reports`, setReports);
            },
            therapists: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/therapists`, setTherapists);
            },
            volunteers: async () => {
                await safeAdminFetch(`${API_BASE_URL}/admin/volunteers`, setVolunteers);
                const res = await adminFetch(`${API_BASE_URL}/admin/volunteer-stats`);
                const data = await res.json();
                if (data.success) setVolunteerStats(data.stats);
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            try {
                await fetchStats();
                if (selectedRoom) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/chat/rooms/${selectedRoom.id}/messages`);
                        const data = await res.json();
                        if (!res.ok) {
                            console.error(`❌ Room messages fetch failed (${res.status})`, data);
                        } else if (data.success) {
                            setMessages(data.data);
                        }
                    } catch (e) { 
                        console.error('❌ Room messages fetch error:', e); 
                    }
                }
                if (activeTab in fetchTabMap) {
                    await (fetchTabMap as any)[activeTab]();
                }
            } catch (e) { 
                console.error('❌ Polling error:', e); 
            }
            setIsLoading(false);
        };
        fetchData();
        interval = setInterval(fetchData, 10000); // 10 seconds
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab, selectedRoom]);

    const toggleUserRole = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const res = await adminFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: getAdminHeaders(true),
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) {
            const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
            setUsers(updated);
        }
    };

    const deleteUser = async (id: number) => {
        if (window.confirm('Delete user?')) {
            await adminFetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
            setUsers(users.filter(u => u.id !== id));
            fetchStats();
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await adminFetch(`${API_BASE_URL}/admin/chat/rooms`, {
            method: 'POST',
            headers: getAdminHeaders(true),
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
            await adminFetch(`${API_BASE_URL}/admin/chat/rooms/${id}`, { method: 'DELETE' });
            setRooms(rooms.filter(r => r.id !== id));
        }
    };

    const deleteMessage = async (id: number) => {
        if (window.confirm('Delete message?')) {
            await adminFetch(`${API_BASE_URL}/admin/chat/messages/${id}`, { method: 'DELETE' });
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
        if (selectedRoom) return messages.filter(m => (m.content || '').toLowerCase().includes(query) || (m.user_name || '').toLowerCase().includes(query));
        if (activeTab === 'rooms') return rooms.filter(r => (r.name || '').toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query));
        if (activeTab === 'moods') return moods.filter(m => (m.user_name || '').toLowerCase().includes(query) || (m.mood || '').toLowerCase().includes(query) || (m.note || '').toLowerCase().includes(query));
        if (activeTab === 'journals') return journals.filter(j => (j.user_name || '').toLowerCase().includes(query) || (j.content || '').toLowerCase().includes(query));
        if (activeTab === 'wins') return wins.filter(w => (w.user_name || '').toLowerCase().includes(query) || (w.content || '').toLowerCase().includes(query));
        if (activeTab === 'blocked') return blockedLogs.filter(b => (b.user_name || '').toLowerCase().includes(query) || (b.content || '').toLowerCase().includes(query));
        if (activeTab === 'reports') return reports.filter(r => (r.reporter_name || '').toLowerCase().includes(query) || (r.message_content || '').toLowerCase().includes(query));
        if (activeTab === 'therapists') return therapists.filter(t => (t.name || '').toLowerCase().includes(query) || (t.specialization || '').toLowerCase().includes(query) || (t.email || '').toLowerCase().includes(query));
        if (activeTab === 'volunteers') return volunteers.filter(v => (v.name || '').toLowerCase().includes(query) || (v.email || '').toLowerCase().includes(query) || (v.role_title || '').toLowerCase().includes(query));
        return [];
    };

    const latestSample = statsHistory[statsHistory.length - 1] || null;
    const previousSample = statsHistory.length > 1 ? statsHistory[statsHistory.length - 2] : null;
    const trend = {
        users: latestSample && previousSample ? latestSample.userCount - previousSample.userCount : 0,
        messages: latestSample && previousSample ? latestSample.messageCount - previousSample.messageCount : 0,
        moods: latestSample && previousSample ? latestSample.moodCount - previousSample.moodCount : 0,
    };

    const gaMeasurementId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;

    const resetTherapistForm = () => {
        setTherapistForm({
            id: null,
            name: '',
            photo: '',
            email: '',
            password: '',
            phone: '',
            specialization: '',
            bio: '',
            qualifications: '',
            experience: '1+ years',
            languages: 'English, Swahili',
            availability: 'online',
            availability_schedule: '',
            session_price: '$5 chat / $10 video',
            rating: 4.5,
            status: 'pending'
        });
    };

    const sendTherapistInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError('');
        setInviteSuccess('');
        setInviteLink('');

        const res = await adminFetch(`${API_BASE_URL}/admin/invite-therapist`, {
            method: 'POST',
            headers: getAdminHeaders(true),
            body: JSON.stringify(inviteForm)
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
            setInviteError(data?.error || 'Failed to send invite');
            return;
        }

        setInviteLink(data.inviteLink || '');
        setInviteForm({ email: '' });
        setInviteSuccess(data?.emailSent === false
            ? 'Invite created. Email could not be delivered automatically, copy the link below and share manually.'
            : 'Invite sent. The therapist should receive the email automatically.');
    };

    const saveTherapist = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = therapistForm.id ? 'PATCH' : 'POST';
        const endpoint = therapistForm.id
            ? `${API_BASE_URL}/admin/therapists/${therapistForm.id}`
            : `${API_BASE_URL}/admin/therapists`;

        const res = await adminFetch(endpoint, {
            method,
            headers: getAdminHeaders(true),
            body: JSON.stringify(therapistForm)
        });

        if (res.ok) {
            resetTherapistForm();
            const tRes = await adminFetch(`${API_BASE_URL}/admin/therapists`);
            const tData = await tRes.json();
            if (tData.success) setTherapists(tData.data);
        }
    };

    const editTherapist = (therapist: any) => setTherapistForm({ ...therapist, password: '' });

    const toggleTherapistStatus = async (id: number, status: string) => {
        const normalized = (status || '').toLowerCase();
        const nextStatus = normalized === 'approved' || normalized === 'active' ? 'pending' : 'approved';
        const res = await adminFetch(`${API_BASE_URL}/admin/therapists/${id}/approve`, {
            method: 'PATCH',
            headers: getAdminHeaders(true),
            body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
            setTherapists(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
        }
    };

    const deleteTherapist = async (id: number) => {
        if (!window.confirm('Remove therapist?')) return;
        const res = await adminFetch(`${API_BASE_URL}/admin/therapists/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setTherapists(prev => prev.filter(item => item.id !== id));
        }
    };
    
    const sendVolunteerInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setVolInviteError('');
        setVolInviteSuccess('');
        setVolInviteLink('');

        const res = await adminFetch(`${API_BASE_URL}/admin/invite-volunteer`, {
            method: 'POST',
            headers: getAdminHeaders(true),
            body: JSON.stringify(volInviteForm)
        });

        const data = await res.json();
        if (!res.ok || !data?.success) {
            setVolInviteError(data?.error || 'Failed to send invite');
            return;
        }

        setVolInviteLink(data.inviteLink || '');
        setVolInviteForm({ email: '' });
        setVolInviteSuccess('Volunteer invite link generated successfully!');
    };

    const sendCustomEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingEmail(true);
        try {
            const res = await adminFetch(`${API_BASE_URL}/admin/send-email`, {
                method: 'POST',
                headers: getAdminHeaders(true),
                body: JSON.stringify(emailModal)
            });
            const data = await res.json();
            if (data.success) {
                alert('Email sent successfully!');
                setEmailModal({ ...emailModal, open: false });
            } else {
                alert('Failed: ' + data.error);
            }
        } catch (e) {
            alert('Connection error');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleCreateEvent = () => {
        if (onNavigate) {
            onNavigate('events', { path: '/?create=1' });
            return;
        }

        const target = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `${window.location.origin}/?create=1`
            : 'https://unitywithin.app/events?create=1';
        window.location.assign(target);
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

                <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
                    <Button onClick={handleCreateEvent} className="bg-unity-700 hover:bg-unity-800">
                        <Plus size={14} />
                        Create Event
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-unity-200 w-full"
                        />
                    </div>
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
                {renderTabBtn('analytics', 'Analytics', BarChart3)}
                {renderTabBtn('users', 'Users', Users)}
                {renderTabBtn('rooms', 'Rooms', Users)}
                {renderTabBtn('blocked', 'AI Flags', Flag)}
                {renderTabBtn('moods', 'Moods', Activity)}
                {renderTabBtn('journals', 'Journals', Book)}
                {renderTabBtn('wins', 'Wins', Trophy)}
                {renderTabBtn('reports', 'Reports', AlertCircle)}
                {renderTabBtn('therapists', 'Therapists', Stethoscope)}
                {renderTabBtn('volunteers', 'Volunteers', Shield)}
                {renderTabBtn('events', 'Events', Calendar)}
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
                                                    <span className="font-bold text-sm text-gray-700">{m.user_name}</span>
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
                                    <div className="space-y-6 py-8">
                                        <div className="text-center">
                                            <Shield className="mx-auto text-gray-100 mb-4" size={64} />
                                            <h3 className="text-xl font-bold text-gray-800">Welcome to Unity Control</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto">Select a tab above to monitor real-time community data and maintain safety.</p>
                                        </div>

                                        <section className="bg-gray-50 border border-gray-100 rounded-2xl p-4 max-w-4xl mx-auto">
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide font-bold text-gray-500">AI Runtime Status</p>
                                                    <p className="text-sm text-gray-600">BUDDIE + Learn provider readiness from backend runtime environment.</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={fetchAiConfigStatus} disabled={aiConfigLoading}>
                                                    {aiConfigLoading ? 'Refreshing...' : 'Refresh'}
                                                </Button>
                                            </div>

                                            {aiConfigStatus?.providers && !aiConfigStatus.providers.anyConfigured && (
                                                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                                                    <p className="text-xs font-bold uppercase text-red-700">No AI provider configured</p>
                                                    <p className="text-xs text-red-600">Set at least one provider key in Azure App Settings and restart App Service.</p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                {[
                                                    { key: 'openai', label: 'OpenAI' },
                                                    { key: 'groq', label: 'Groq' },
                                                    { key: 'huggingFaceEmotion', label: 'HF Emotion (optional)' },
                                                ].map((provider) => {
                                                    const enabled = Boolean(aiConfigStatus?.providers?.[provider.key]);
                                                    return (
                                                        <div key={provider.key} className={`rounded-xl border px-3 py-2 ${enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                                            <p className="font-semibold text-gray-700">{provider.label}</p>
                                                            <p className={`text-xs font-bold uppercase ${enabled ? 'text-green-700' : 'text-gray-400'}`}>
                                                                {enabled ? 'Configured' : 'Not Set'}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <p className="text-xs text-gray-500 mt-3">
                                                Source: runtime App Settings. If you change Azure keys, restart App Service to reload provider clients.
                                            </p>
                                            {aiConfigLastChecked && (
                                                <p className="text-[11px] text-gray-400 mt-1">Last checked: {aiConfigLastChecked}</p>
                                            )}
                                        </section>
                                    </div>
                                )}

                                {activeTab === 'analytics' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">Real-time Site Analytics</h3>
                                                <p className="text-sm text-gray-500">Live system activity snapshot updates every 10 seconds.</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Live
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                                <p className="text-[10px] font-bold uppercase text-blue-600">Registered Users</p>
                                                <div className="mt-2 flex items-end justify-between">
                                                    <p className="text-3xl font-bold text-blue-900">{stats.userCount}</p>
                                                    <p className={`text-xs font-semibold ${trend.users >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                        {trend.users >= 0 ? '+' : ''}{trend.users} / refresh
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                                                <p className="text-[10px] font-bold uppercase text-violet-600">Messages</p>
                                                <div className="mt-2 flex items-end justify-between">
                                                    <p className="text-3xl font-bold text-violet-900">{stats.messageCount}</p>
                                                    <p className={`text-xs font-semibold ${trend.messages >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                        {trend.messages >= 0 ? '+' : ''}{trend.messages} / refresh
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                                <p className="text-[10px] font-bold uppercase text-amber-700">Mood Logs</p>
                                                <div className="mt-2 flex items-end justify-between">
                                                    <p className="text-3xl font-bold text-amber-900">{stats.moodCount}</p>
                                                    <p className={`text-xs font-semibold ${trend.moods >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                        {trend.moods >= 0 ? '+' : ''}{trend.moods} / refresh
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-gray-100 p-4 bg-white">
                                            <h4 className="font-bold text-gray-800 mb-3">Recent Trend (last 30 samples)</h4>
                                            <div className="space-y-3">
                                                {[{ key: 'userCount', label: 'Users', color: 'bg-blue-500' }, { key: 'messageCount', label: 'Messages', color: 'bg-violet-500' }, { key: 'moodCount', label: 'Mood Logs', color: 'bg-amber-500' }].map((series) => {
                                                    const current = latestSample ? (latestSample as any)[series.key] : 0;
                                                    const max = Math.max(1, ...statsHistory.map(s => (s as any)[series.key]));
                                                    const widthPct = Math.max(4, Math.round((current / max) * 100));
                                                    return (
                                                        <div key={series.key}>
                                                            <div className="flex items-center justify-between text-sm mb-1">
                                                                <span className="text-gray-600">{series.label}</span>
                                                                <span className="font-semibold text-gray-800">{current}</span>
                                                            </div>
                                                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                                <div className={`h-2 rounded-full ${series.color} transition-all duration-500`} style={{ width: `${widthPct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-gray-100 p-4 bg-white">
                                            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Eye size={16} /> Google Analytics</h4>
                                            {gaMeasurementId ? (
                                                <div className="space-y-2 text-sm text-gray-600">
                                                    <p>GA4 is configured with Measurement ID <span className="font-semibold text-gray-800">{gaMeasurementId}</span>.</p>
                                                    <a
                                                        href="https://analytics.google.com/analytics/web/#/realtime/"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-unity-600 font-semibold hover:underline"
                                                    >
                                                        Open GA Realtime Dashboard <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                                    GA4 measurement ID is not configured. Set VITE_GA_MEASUREMENT_ID in your environment to connect site analytics.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'users' && (
                                    <AdminTable
                                        columns={[
                                            { key: 'name', label: 'Identity', render: (_, row) => <div><div className="font-bold text-gray-800">{row.name}</div><div className="text-xs text-gray-400">{row.email}</div></div> },
                                            { key: 'role', label: 'Role', render: (role, row) => <button onClick={() => toggleUserRole(row.id, role)} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${role === 'admin' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{role.toUpperCase()}</button> },
                                            { key: 'actions', label: '', render: (_, row) => (
                                                <button 
                                                    onClick={() => setEmailModal({ open: true, to: row.email, subject: 'Message from Unity Within', message: '' })}
                                                    className="p-2 text-unity-500 hover:bg-unity-50 rounded-lg"
                                                    title="Send Message"
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            )},
                                        ]}
                                        data={filteredContent()}
                                        onDelete={deleteUser}
                                        showDeleteButton
                                    />
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

                                {activeTab === 'moods' && (
                                    <AdminTable
                                        columns={[
                                            { key: 'user_name', label: 'User' },
                                            { key: 'mood', label: 'Mood', render: (mood) => <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{mood}</span> },
                                            { key: 'intensity', label: 'Intensity', render: (intensity) => <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="bg-unity-500 h-full" style={{ width: `${intensity * 10}%` }}></div></div> },
                                            { key: 'note', label: 'Note', render: (note) => <span className="text-xs text-gray-400 italic">{note || '-'}</span> },
                                        ]}
                                        data={filteredContent()}
                                    />
                                )}

                                {activeTab === 'journals' && (
                                    <AdminTable
                                        columns={[
                                            { key: 'user_name', label: 'User' },
                                            { key: 'content', label: 'Entry', render: (content) => <span className="text-gray-600 truncate max-w-xs">{content}</span> },
                                            { key: 'created_at', label: 'Date', render: (created_at) => <span className="text-[10px] text-gray-400">{new Date(created_at).toLocaleDateString()}</span> },
                                        ]}
                                        data={filteredContent()}
                                    />
                                )}

                                {activeTab === 'wins' && (
                                    <AdminTable
                                        columns={[
                                            { key: 'user_name', label: 'User' },
                                            { key: 'content', label: 'Tiny Win' },
                                            { key: 'created_at', label: 'Date', render: (created_at) => <span className="text-[10px] text-gray-400">{new Date(created_at).toLocaleDateString()}</span> },
                                        ]}
                                        data={filteredContent()}
                                    />
                                )}

                                {activeTab === 'blocked' && (
                                    <AdminTable
                                        columns={[
                                            { key: 'user_name', label: 'User' },
                                            { key: 'content', label: 'Blocked Chat', render: (content) => <span className="text-xs italic text-gray-500">"{content}"</span> },
                                            { key: 'flag_type', label: 'Flag', render: (flag_type) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${flag_type === 'CRISIS' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>{flag_type}</span> },
                                        ]}
                                        data={filteredContent()}
                                    />
                                )}

                                {activeTab === 'reports' && (
                                    <AdminTable
                                        columns={[
                                            { key: 'reporter_name', label: 'Reporter' },
                                            { key: 'reason', label: 'Reason', render: (reason) => <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">{reason}</span> },
                                            { key: 'message_content', label: 'Flagged Content', render: (message_content) => <span className="text-gray-500 italic">"{message_content}"</span> },
                                        ]}
                                        data={filteredContent()}
                                    />
                                )}

                                {activeTab === 'therapists' && (
                                    <div className="space-y-6">
                                        <form onSubmit={sendTherapistInvite} className="p-4 bg-unity-50 rounded-xl border border-unity-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                required
                                                type="email"
                                                placeholder="Invite email"
                                                value={inviteForm.email}
                                                onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                                className="bg-white p-2 border border-gray-100 rounded-lg text-sm"
                                            />
                                            <Button type="submit" size="sm"><Plus size={16} /> Invite now</Button>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                Enter email, send invite, then copy the link if you want to share manually.
                                            </div>

                                            {inviteError && (
                                                <p className="md:col-span-3 text-xs text-red-600">{inviteError}</p>
                                            )}

                                            {inviteSuccess && (
                                                <p className="md:col-span-3 text-xs text-green-700">{inviteSuccess}</p>
                                            )}

                                            {inviteLink && (
                                                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigator.clipboard.writeText(inviteLink)}
                                                    >
                                                        Copy Invite Link
                                                    </Button>
                                                    <span className="text-xs text-gray-500 break-all">{inviteLink}</span>
                                                </div>
                                            )}
                                        </form>

                                        <form onSubmit={saveTherapist} className="p-4 bg-gray-50 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <input required placeholder="Name" value={therapistForm.name} onChange={e => setTherapistForm({ ...therapistForm, name: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input placeholder="Photo URL" value={therapistForm.photo} onChange={e => setTherapistForm({ ...therapistForm, photo: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input placeholder="Email" value={therapistForm.email} onChange={e => setTherapistForm({ ...therapistForm, email: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input type="password" placeholder={therapistForm.id ? 'Set new password (optional)' : 'Password'} value={therapistForm.password} onChange={e => setTherapistForm({ ...therapistForm, password: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input placeholder="Phone" value={therapistForm.phone} onChange={e => setTherapistForm({ ...therapistForm, phone: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input required placeholder="Specialization" value={therapistForm.specialization} onChange={e => setTherapistForm({ ...therapistForm, specialization: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input placeholder="Experience (e.g. 5+ years)" value={therapistForm.experience} onChange={e => setTherapistForm({ ...therapistForm, experience: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input placeholder="Languages (comma-separated)" value={therapistForm.languages} onChange={e => setTherapistForm({ ...therapistForm, languages: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <select value={therapistForm.availability} onChange={e => setTherapistForm({ ...therapistForm, availability: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm">
                                                <option value="online">Online</option>
                                                <option value="offline">Offline</option>
                                                <option value="hybrid">Hybrid</option>
                                            </select>
                                            <input placeholder="Availability schedule" value={therapistForm.availability_schedule} onChange={e => setTherapistForm({ ...therapistForm, availability_schedule: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <input placeholder="Session price" value={therapistForm.session_price} onChange={e => setTherapistForm({ ...therapistForm, session_price: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm" />
                                            <textarea placeholder="Bio" value={therapistForm.bio} onChange={e => setTherapistForm({ ...therapistForm, bio: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm md:col-span-2" rows={2} />
                                            <textarea placeholder="Qualifications" value={therapistForm.qualifications} onChange={e => setTherapistForm({ ...therapistForm, qualifications: e.target.value })} className="bg-white p-2 border border-gray-100 rounded-lg text-sm md:col-span-2" rows={2} />
                                            <div className="flex gap-2 md:col-span-2">
                                                <Button type="submit" size="sm"><Plus size={16} /> {therapistForm.id ? 'Update Therapist' : 'Add Therapist'}</Button>
                                                {therapistForm.id && <Button type="button" size="sm" variant="ghost" onClick={resetTherapistForm}>Cancel Edit</Button>}
                                            </div>
                                        </form>

                                        <div>
                                            <AdminTable
                                                columns={[
                                                    { key: 'name', label: 'Therapist', render: (_, row) => <div><div className="font-bold text-gray-800">{row.name}</div><div className="text-xs text-gray-400">{row.email || '-'}</div></div> },
                                                    { key: 'specialization', label: 'Specialization' },
                                                    { key: 'availability', label: 'Availability', render: (availability) => <span className="capitalize">{availability}</span> },
                                                    { key: 'status', label: 'Status', render: (status, row) => <button onClick={() => toggleTherapistStatus(row.id, status)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${(status === 'approved' || status === 'active') ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-700'}`}>{(status === 'active' ? 'approved' : (status || 'pending'))}</button> },
                                                ]}
                                                data={filteredContent()}
                                                customActions={[
                                                    { label: 'Edit', onClick: (row) => editTherapist(row), className: 'text-unity-500 hover:text-unity-700 text-xs font-bold' }
                                                ]}
                                                onDelete={deleteTherapist}
                                                showDeleteButton
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'volunteers' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="bg-unity-50 p-4 rounded-xl border border-unity-100">
                                                <p className="text-[10px] font-bold text-unity-600 uppercase">Active</p>
                                                <p className="text-2xl font-bold">{volunteerStats.active}</p>
                                            </div>
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                <p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p>
                                                <p className="text-2xl font-bold">{volunteerStats.pending}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase">Total</p>
                                                <p className="text-2xl font-bold">{volunteerStats.total}</p>
                                            </div>
                                        </div>

                                        <form onSubmit={sendVolunteerInvite} className="p-4 bg-white rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input
                                                required
                                                type="email"
                                                placeholder="Volunteer invite email"
                                                value={volInviteForm.email}
                                                onChange={e => setVolInviteForm({ ...volInviteForm, email: e.target.value })}
                                                className="bg-gray-50 p-2 border border-gray-100 rounded-lg text-sm"
                                            />
                                            <Button type="submit" size="sm" fullWidth>Generate Invite Link</Button>
                                            
                                            {volInviteError && <p className="md:col-span-3 text-xs text-red-600">{volInviteError}</p>}
                                            {volInviteSuccess && <p className="md:col-span-3 text-xs text-green-700">{volInviteSuccess}</p>}
                                            {volInviteLink && (
                                                <div className="md:col-span-3 p-3 bg-unity-50 rounded-lg border border-unity-100 flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-mono break-all flex-1">{volInviteLink}</span>
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        navigator.clipboard.writeText(volInviteLink);
                                                        setVolInviteSuccess('Link copied!');
                                                    }}>Copy</Button>
                                                </div>
                                            )}
                                        </form>

                                        <AdminTable
                                            columns={[
                                                { key: 'name', label: 'Volunteer', render: (_, row: any) => <div><div className="font-bold text-gray-800">{row.name || 'Invited'}</div><div className="text-xs text-gray-400">{row.email}</div></div> },
                                                { key: 'role_title', label: 'Tier/Role', render: (_, row: any) => <div><div className="text-sm font-medium">{row.role_title || 'Unassigned'}</div><div className="text-[10px] text-gray-400">{row.tier || '-'}</div></div> },
                                                { key: 'status', label: 'Status', render: (status: string) => (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        status === 'active' ? 'bg-green-100 text-green-600' :
                                                        status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                                                        status === 'suspended' ? 'bg-red-100 text-red-600' :
                                                        'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {status.replace('_', ' ')}
                                                    </span>
                                                )},
                                                { key: 'actions', label: '', render: (_, row: any) => (
                                                    <button 
                                                        onClick={() => setEmailModal({ open: true, to: row.email, subject: `Message for ${row.role_title || 'Volunteer'}`, message: '' })}
                                                        className="p-2 text-unity-500 hover:bg-unity-50 rounded-lg"
                                                        title="Send Message"
                                                    >
                                                        <Mail size={16} />
                                                    </button>
                                                )},
                                            ]}
                                            data={filteredContent()}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
                            </div>
                            <AdminEventManager />
                        </div>
                    </div>
                )}
            </div>

            {emailModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 bg-unity-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Mail size={24} />
                                <h3 className="text-xl font-bold">Compose Message</h3>
                            </div>
                            <button onClick={() => setEmailModal({ ...emailModal, open: false })} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={sendCustomEmail} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">To</label>
                                <input readOnly value={emailModal.to} className="w-full bg-gray-50 p-3 border border-gray-100 rounded-xl text-sm text-gray-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subject</label>
                                <input 
                                    required 
                                    value={emailModal.subject} 
                                    onChange={e => setEmailModal({ ...emailModal, subject: e.target.value })} 
                                    className="w-full bg-gray-50 p-3 border border-gray-100 rounded-xl text-sm focus:border-unity-300 outline-none" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message</label>
                                <textarea 
                                    required 
                                    rows={6}
                                    value={emailModal.message} 
                                    onChange={e => setEmailModal({ ...emailModal, message: e.target.value })} 
                                    className="w-full bg-gray-50 p-3 border border-gray-100 rounded-xl text-sm focus:border-unity-300 outline-none resize-none" 
                                    placeholder="Type your message here..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="ghost" fullWidth onClick={() => setEmailModal({ ...emailModal, open: false })}>Cancel</Button>
                                <Button type="submit" fullWidth disabled={sendingEmail}>
                                    {sendingEmail ? 'Sending...' : 'Send Message'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
