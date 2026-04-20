import React, { useState, useEffect, useCallback } from 'react';
import { Users, MessageSquare, Shield, Activity, Flag, Plus, Trash2, Book, Trophy, AlertCircle, Search, ArrowLeft, ExternalLink, Mail, Phone, Send, Stethoscope, Copy, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { Button } from './Button';
import { inviteTherapist } from '../services/therapistService';

type AdminTab = 'overview' | 'users' | 'volunteers' | 'applications' | 'rooms' | 'messages' | 'blocked' | 'moods' | 'journals' | 'wins' | 'reports' | 'therapists';

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ userCount: 0, messageCount: 0, moodCount: 0 });
    const [volunteerStats, setVolunteerStats] = useState({ total: 0, active: 0, pending: 0 });
    const [users, setUsers] = useState<any[]>([]);
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
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
     const [inviteForm, setInviteForm] = useState({ email: '' });
     const [inviteBusy, setInviteBusy] = useState(false);
     const [inviteMessage, setInviteMessage] = useState<string | null>(null);
     const [inviteLink, setInviteLink] = useState<string | null>(null);
      const [inviteTherapistForm, setInviteTherapistForm] = useState({ email: '', phone: '' });
      const [inviteTherapistBusy, setInviteTherapistBusy] = useState(false);
      const [inviteTherapistMessage, setInviteTherapistMessage] = useState<string | null>(null);
      const [inviteTherapistWhatsappUrl, setInviteTherapistWhatsappUrl] = useState<string | null>(null);
     const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
const [isLive, setIsLive] = useState(true);
     const [isSyncing, setIsSyncing] = useState(false);

     const getIdentityHeaders = () => {
        const raw = localStorage.getItem('user');
        let user: any = null;
        try {
            user = raw ? JSON.parse(raw) : null;
        } catch {
            user = null;
        }

        // Debug logging
        if (!user?.email) {
            console.warn('[AdminDashboard] Missing email in user object:', { 
                storedRaw: raw?.substring(0, 100),
                parsed: user,
                email: user?.email
            });
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (user?.email) {
            headers['x-user-email'] = String(user.email);
            console.log('[AdminDashboard] Added x-user-email header:', user.email);
        }
        if (user?.id) headers['x-user-id'] = String(user.id);
        if (user?.role) headers['x-role'] = String(user.role);
        return headers;
    };

    const apiFetch = (url: string, options: RequestInit = {}) => {
        const baseHeaders = getIdentityHeaders();
        const incomingHeaders = (options.headers || {}) as Record<string, string>;
        return fetch(url, {
            ...options,
            cache: 'no-store',
            headers: {
                ...baseHeaders,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                Pragma: 'no-cache',
                ...incomingHeaders,
            },
        });
    };

    const fetchStats = useCallback(async () => {
        try {
            const [statsRes, volunteerStatsRes] = await Promise.all([
                apiFetch(`${API_BASE_URL}/admin/stats`),
                apiFetch(`${API_BASE_URL}/admin/volunteer-stats`),
            ]);

            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.stats);

            const volunteerStatsData = await volunteerStatsRes.json();
            if (volunteerStatsData.success) {
                const incoming = volunteerStatsData.stats || {};
                setVolunteerStats({
                    total: Number(incoming.total || 0),
                    active: Number(incoming.active || 0),
                    pending: Number(incoming.pending || 0),
                });
            }
        } catch (e) { console.error(e); }
    }, []);

    const fetchTabData = useCallback(async (tab: AdminTab, room: any) => {
        if (room) {
            const res = await apiFetch(`${API_BASE_URL}/chat/rooms/${room.id}/messages`);
            const data = await res.json();
            if (data.success) setMessages(data.data);
            return;
        }

        if (tab === 'overview') return;

        const fetchTabMap: Record<string, () => Promise<void>> = {
            users: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/users`);
                const data = await res.json();
                if (data.success) setUsers(data.data);
            },
            volunteers: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/volunteer-invites`);
                const data = await res.json();
                if (data.success) setVolunteers(data.invites || []);
            },
            applications: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/volunteer-applications`);
                const data = await res.json();
                if (data.success) setApplications(data.data || []);
            },
            rooms: async () => {
                const res = await apiFetch(`${API_BASE_URL}/chat/rooms`);
                const data = await res.json();
                if (data.success) setRooms(data.data);
            },
            messages: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/chat/messages`);
                const data = await res.json();
                if (data.success) setMessages(data.data);
            },
            blocked: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/moderation-logs`);
                const data = await res.json();
                if (data.success) setBlockedLogs(data.data);
            },
            moods: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/moods`);
                const data = await res.json();
                if (data.success) setMoods(data.data);
            },
            journals: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/journals`);
                const data = await res.json();
                if (data.success) setJournals(data.data);
            },
            wins: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/tiny-wins`);
                const data = await res.json();
                if (data.success) setWins(data.data);
            },
            reports: async () => {
                const res = await apiFetch(`${API_BASE_URL}/admin/reports`);
                const data = await res.json();
                if (data.success) setReports(data.data);
            }
        };

        if (fetchTabMap[tab]) {
            await fetchTabMap[tab]();
        }
    }, []);

    const fetchAllAdminData = useCallback(async () => {
        const tasks: Array<Promise<void>> = [
            fetchStats(),
            fetchTabData('users', null),
            fetchTabData('volunteers', null),
            fetchTabData('applications', null),
            fetchTabData('rooms', null),
            fetchTabData('messages', null),
            fetchTabData('blocked', null),
            fetchTabData('moods', null),
            fetchTabData('journals', null),
            fetchTabData('wins', null),
            fetchTabData('reports', null),
        ];

        await Promise.allSettled(tasks);
    }, [fetchStats, fetchTabData]);

    const refreshNow = useCallback(async (showLoader = false) => {
        if (showLoader) setIsLoading(true);
        setIsSyncing(true);
        try {
            await fetchAllAdminData();

            if (selectedRoom) {
                await fetchTabData(activeTab, selectedRoom);
            }

            setLastUpdated(new Date());
        } catch (e) {
            console.error(e);
        } finally {
            if (showLoader) setIsLoading(false);
            setIsSyncing(false);
        }
    }, [activeTab, selectedRoom, fetchTabData, fetchAllAdminData]);

    useEffect(() => {
        void refreshNow(true);
    }, [refreshNow]);

    useEffect(() => {
        if (!isLive) return;

        const intervalMs = selectedRoom ? 4000 : 8000;
        const timer = window.setInterval(() => {
            void refreshNow(false);
        }, intervalMs);

        return () => window.clearInterval(timer);
    }, [isLive, selectedRoom, refreshNow]);

    const toggleUserRole = async (userId: number, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const res = await apiFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) {
            const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
            setUsers(updated);
        }
    };

    const deleteUser = async (id: number) => {
        if (window.confirm('Delete user?')) {
            await apiFetch(`${API_BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
            setUsers(users.filter(u => u.id !== id));
            void refreshNow();
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiFetch(`${API_BASE_URL}/admin/chat/rooms`, {
            method: 'POST',
            body: JSON.stringify(newRoom)
        });
        if (res.ok) {
            setNewRoom({ name: '', description: '', type: 'public' });
            const data = await res.json();
            if (data.success) {
                const rRes = await apiFetch(`${API_BASE_URL}/chat/rooms`);
                const rData = await rRes.json();
                if (rData.success) setRooms(rData.data);
            }
        }
    };

    const deleteRoom = async (id: number) => {
        if (window.confirm('Delete room?')) {
            await apiFetch(`${API_BASE_URL}/admin/chat/rooms/${id}`, { method: 'DELETE' });
            setRooms(rooms.filter(r => r.id !== id));
        }
    };

    const deleteMessage = async (id: number) => {
        if (window.confirm('Delete message?')) {
            await apiFetch(`${API_BASE_URL}/admin/chat/messages/${id}`, { method: 'DELETE' });
            setMessages(messages.filter(m => m.id !== id));
            void refreshNow();
        }
    };

    const approveVolunteerInvite = async (inviteId: string) => {
        const res = await apiFetch(`${API_BASE_URL}/admin/approve-volunteer/${inviteId}`, { method: 'POST' });
        if (res.ok) {
            setVolunteers(prev => prev.map(v => v.id === inviteId ? { ...v, status: 'approved' } : v));
            void refreshNow();
        }
    };

    const rejectVolunteerInvite = async (inviteId: string) => {
        const res = await apiFetch(`${API_BASE_URL}/admin/reject-volunteer/${inviteId}`, { method: 'POST' });
        if (res.ok) {
            setVolunteers(prev => prev.map(v => v.id === inviteId ? { ...v, status: 'rejected' } : v));
            void refreshNow();
        }
    };

    const approveApplication = async (applicationId: number) => {
        const res = await apiFetch(`${API_BASE_URL}/admin/volunteer-applications/${applicationId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'approved' })
        });
        if (res.ok) {
            setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'approved' } : a));
            void refreshNow();
        }
    };

    const rejectApplication = async (applicationId: number) => {
        const res = await apiFetch(`${API_BASE_URL}/admin/volunteer-applications/${applicationId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'rejected' })
        });
        if (res.ok) {
            setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'rejected' } : a));
            void refreshNow();
        }
    };

    const revokeApplication = async (applicationId: number, reason: string = '') => {
        if (!window.confirm('Are you sure you want to revoke this volunteer\'s permissions? They will receive a notification email.')) {
            return;
        }

        const res = await apiFetch(`${API_BASE_URL}/admin/volunteer-applications/${applicationId}/revoke`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        if (res.ok) {
            setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, status: 'revoked' } : a));
            void refreshNow();
        }
    };

     const handleSendVolunteerInvite = async (e: React.FormEvent) => {
         e.preventDefault();
         if (!inviteForm.email.trim()) return;

         setInviteBusy(true);
         setInviteMessage(null);
         setInviteLink(null);
         try {
             const res = await apiFetch(`${API_BASE_URL}/admin/invite-volunteer`, {
                 method: 'POST',
                 body: JSON.stringify({
                     email: inviteForm.email.trim(),
                     adminName: 'Admin',
                 }),
             });

             const data = await res.json();
             if (res.ok && data?.success) {
                 const emailStatus = data.emailSent ? 'Email sent successfully' : 'Email not sent (API key not configured)';
                 setInviteMessage(`${emailStatus}. Invitation link created.`);
                 setInviteLink(data.inviteLink);
                 setInviteForm({ email: '' });
                 void refreshNow();
             } else {
                 setInviteMessage(data?.error || 'Failed to create invite');
             }
         } catch {
             setInviteMessage('Failed to create invite');
         } finally {
             setInviteBusy(false);
         }
     };

      const handleSendTherapistInvite = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!inviteTherapistForm.email.trim()) return;

          setInviteTherapistBusy(true);
          setInviteTherapistMessage(null);
          setInviteTherapistWhatsappUrl(null);
          try {
            const result = await inviteTherapist({
              email: inviteTherapistForm.email.trim(),
              phone: inviteTherapistForm.phone.trim() || undefined,
            });

            if (result.success) {
              const msg = result.emailSent
                ? `✅ Invite sent to ${inviteTherapistForm.email.trim()}`
                : `⚠️ Invite created but email failed: ${result.emailError || 'Unknown error'}`;
              setInviteTherapistMessage(msg);
              if (result.whatsappUrl) {
                setInviteTherapistWhatsappUrl(result.whatsappUrl);
              }
              setInviteTherapistForm({ email: '', phone: '' });
            } else {
              setInviteTherapistMessage('❌ Failed to send invite');
            }
          } catch (err: any) {
            setInviteTherapistMessage(err.message || '❌ Error sending invite');
          } finally {
            setInviteTherapistBusy(false);
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
        let result: any[] = [];
        
        if (activeTab === 'users') {
            result = users.filter(u => (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query));
        } else if (activeTab === 'volunteers') {
            result = volunteers.filter(v => (v.email || '').toLowerCase().includes(query) || (v.role || '').toLowerCase().includes(query) || (v.status || '').toLowerCase().includes(query));
        } else if (activeTab === 'applications') {
            result = applications.filter(a => 
                (a.first_name || '').toLowerCase().includes(query) || 
                (a.last_name || '').toLowerCase().includes(query) || 
                (a.email || '').toLowerCase().includes(query) || 
                (a.category || '').toLowerCase().includes(query) || 
                (a.status || '').toLowerCase().includes(query)
            );
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (activeTab === 'messages' || selectedRoom) {
            result = messages.filter(m => (m.content || '').toLowerCase().includes(query) || (m.user_name || '').toLowerCase().includes(query));
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (activeTab === 'rooms') {
            result = rooms.filter(r => (r.name || '').toLowerCase().includes(query) || (r.description || '').toLowerCase().includes(query));
        } else if (activeTab === 'moods') {
            result = moods.filter(m => (m.user_name || '').toLowerCase().includes(query) || (m.mood || '').toLowerCase().includes(query) || (m.note || '').toLowerCase().includes(query));
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (activeTab === 'journals') {
            result = journals.filter(j => (j.user_name || '').toLowerCase().includes(query) || (j.content || '').toLowerCase().includes(query));
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (activeTab === 'wins') {
            result = wins.filter(w => (w.user_name || '').toLowerCase().includes(query) || (w.content || '').toLowerCase().includes(query));
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (activeTab === 'blocked') {
            result = blockedLogs.filter(b => (b.user_name || '').toLowerCase().includes(query) || (b.content || '').toLowerCase().includes(query));
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        } else if (activeTab === 'reports') {
            result = reports.filter(r => (r.reporter_name || '').toLowerCase().includes(query) || (r.message_content || '').toLowerCase().includes(query));
            // Sort by most recent first
            result.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        }
        
        return result;
    };

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen rounded-[2rem]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-unity-100 text-unity-600 rounded-xl"><Shield size={24} /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">System Command</h1>
                        <p className="text-xs text-gray-500">{selectedRoom ? `Auditing #${selectedRoom.name}` : 'Full Database Visibility Active'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                            {isSyncing ? '⟳ Syncing...' : lastUpdated ? `✓ Last sync: ${lastUpdated.toLocaleTimeString()}` : 'Waiting for first sync...'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsLive(prev => !prev)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${isLive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                    >
                        <span className={`inline-block w-2 h-2 rounded-full ${isLive && isSyncing ? 'bg-green-500 animate-pulse' : isLive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {isLive ? 'LIVE ON' : 'LIVE OFF'}
                    </button>
                    <button
                        onClick={() => { void refreshNow(); }}
                        disabled={isSyncing}
                        className="px-3 py-2 rounded-xl text-xs font-bold border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                        {isSyncing && <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>}
                        {isSyncing ? 'Syncing...' : 'Refresh'}
                    </button>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-xs text-gray-400 font-bold uppercase">Pending Volunteers</span>
                    <div className="text-3xl font-bold">{volunteerStats.pending}</div>
                    <p className="text-[11px] text-gray-400 mt-1">{volunteerStats.active} active / {volunteerStats.total} total</p>
                </div>
            </div>

            <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1 no-scrollbar">
                {renderTabBtn('overview', 'Dashboard', Shield)}
                {renderTabBtn('users', 'Users', Users)}
                {renderTabBtn('volunteers', 'Volunteers', Users)}
                {renderTabBtn('applications', 'Applications', Mail)}
                {renderTabBtn('therapists', 'Therapists', Stethoscope)}
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

                                {activeTab === 'volunteers' && (
                                    <div className="space-y-4">
                                        <form onSubmit={handleSendVolunteerInvite} className="p-4 bg-gray-50 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3">
                                            <input
                                                type="email"
                                                value={inviteForm.email}
                                                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="volunteer@email.com"
                                                className="bg-white p-2 border border-gray-100 rounded-lg text-sm md:col-span-3"
                                                required
                                            />
                                            <Button type="submit" size="sm" disabled={inviteBusy}>
                                                <Plus size={16} /> {inviteBusy ? 'Sending...' : 'Send Invite'}
                                            </Button>
                                        </form>

                                        {inviteMessage && (
                                            <div className={`text-xs rounded-lg px-3 py-2 ${inviteMessage.includes('Email sent successfully') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                                                <div>{inviteMessage}</div>
                                                {inviteLink && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={inviteLink}
                                                            readOnly
                                                            className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(inviteLink);
                                                                // Could add a toast notification here
                                                            }}
                                                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs flex items-center gap-1"
                                                            title="Copy invitation link"
                                                        >
                                                            <Copy size={12} />
                                                            Copy
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr>
                                                    <th className="px-4 py-3">Email</th>
                                                    <th className="px-4 py-3">Role</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3">Invited</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().map((v: any) => (
                                                    <tr key={v.id}>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-gray-800">{v.email}</div>
                                                            <div className="text-xs text-gray-400 truncate max-w-[240px]">{v.inviteLink || '-'}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600">{v.role || 'listener'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.status === 'approved' || v.status === 'active' ? 'bg-green-50 text-green-700' : v.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                                                {v.status || 'pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-[11px] text-gray-400">{v.invitedAt ? new Date(v.invitedAt).toLocaleString() : '-'}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            {v.status === 'pending' ? (
                                                                <div className="inline-flex gap-2">
                                                                    <button
                                                                        onClick={() => approveVolunteerInvite(v.id)}
                                                                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-green-50 text-green-700 hover:bg-green-100"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => rejectVolunteerInvite(v.id)}
                                                                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-400">No action</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            </table>
                                        </div>
                                    </div>
                                 )}

                                 {activeTab === 'applications' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                            <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-blue-700">
                                                <div className="font-bold">Pending Applications: {filteredContent().filter(a => a.status === 'pending').length}</div>
                                                <p className="text-xs mt-1">Review applicant details and approve or reject their submission.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
                                            {filteredContent().length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Mail size={32} className="mx-auto text-gray-300 mb-2" />
                                                    <p className="text-gray-500">No applications found</p>
                                                </div>
                                            ) : (
                                                filteredContent().map((app: any) => (
                                                    <div key={app.id} className={`rounded-xl border-2 p-6 transition-all ${
                                                        app.status === 'approved' 
                                                            ? 'bg-green-50 border-green-200' 
                                                            : app.status === 'rejected'
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-yellow-50 border-yellow-200 hover:shadow-md'
                                                    }`}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1">
                                                                <h4 className="text-lg font-bold text-gray-800">{app.first_name} {app.last_name}</h4>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <a href={`mailto:${app.email}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                                        <Mail size={14} />
                                                                        {app.email}
                                                                    </a>
                                                                    {app.phone && (
                                                                        <a href={`tel:${app.phone}`} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                                            <Phone size={14} />
                                                                            {app.phone}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                                app.status === 'approved'
                                                                    ? 'bg-green-200 text-green-800'
                                                                    : app.status === 'rejected'
                                                                    ? 'bg-red-200 text-red-800'
                                                                    : 'bg-yellow-200 text-yellow-800'
                                                            }`}>
                                                                {app.status?.toUpperCase() || 'PENDING'}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                                            <div>
                                                                <p className="text-xs text-gray-600 font-semibold">Location</p>
                                                                <p className="text-gray-800 font-semibold">{app.location}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-600 font-semibold">Category</p>
                                                                <p className="text-gray-800 font-semibold">{app.category}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-600 font-semibold">Hours/Week</p>
                                                                <p className="text-gray-800 font-semibold">{app.availability}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-600 font-semibold">Work Type</p>
                                                                <p className="text-gray-800 font-semibold">{app.work_preference}</p>
                                                            </div>
                                                        </div>

                                                        {app.roles && (
                                                            <div className="mb-4">
                                                                <p className="text-xs text-gray-600 font-semibold mb-2">Selected Roles:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {typeof app.roles === 'string' ? (
                                                                        <span className="px-2 py-1 bg-white bg-opacity-50 text-gray-700 rounded text-xs">{app.roles}</span>
                                                                    ) : Array.isArray(app.roles) ? (
                                                                        app.roles.map((role: string, idx: number) => (
                                                                            <span key={idx} className="px-2 py-1 bg-white bg-opacity-50 text-gray-700 rounded text-xs">{role}</span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500">No roles selected</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {app.why_volunteer && (
                                                            <div className="mb-4 bg-white bg-opacity-50 rounded p-3">
                                                                <p className="text-xs text-gray-600 font-semibold mb-1">Why Volunteer:</p>
                                                                <p className="text-sm text-gray-700 line-clamp-3">{app.why_volunteer}</p>
                                                            </div>
                                                        )}

                                                        {app.mental_health_context && (
                                                            <div className="text-xs text-gray-600 mb-4">
                                                                <p className="font-semibold">Mental Health Context:</p>
                                                                <p className="text-gray-700">{app.mental_health_context}</p>
                                                            </div>
                                                        )}

                                                        {app.status === 'pending' && (
                                                            <div className="flex gap-2 pt-4 border-t">
                                                                <button
                                                                    onClick={() => approveApplication(app.id)}
                                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => rejectApplication(app.id)}
                                                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                                                                >
                                                                    <XCircle size={16} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}

                                                        {app.status === 'approved' && (
                                                            <div className="flex gap-2 pt-4 border-t">
                                                                <div className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg font-bold flex items-center justify-center gap-2 border border-green-200">
                                                                    <CheckCircle size={16} />
                                                                    Approved
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        const reason = window.prompt('Enter reason for revoking permissions (optional):');
                                                                        if (reason !== null) {
                                                                            revokeApplication(app.id, reason);
                                                                        }
                                                                    }}
                                                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 flex items-center justify-center gap-2 transition-colors"
                                                                    title="Revoke this volunteer's access permissions"
                                                                >
                                                                    <Trash2 size={16} />
                                                                    Revoke Permission
                                                                </button>
                                                            </div>
                                                        )}

                                                        {app.status === 'revoked' && (
                                                            <div className="flex gap-2 pt-4 border-t">
                                                                <div className="flex-1 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-bold flex items-center justify-center gap-2 border border-orange-200">
                                                                    <AlertCircle size={16} />
                                                                    Permissions Revoked
                                                                </div>
                                                            </div>
                                                        )}

                                                        {app.status === 'rejected' && (
                                                            <div className="flex gap-2 pt-4 border-t">
                                                                <div className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-bold flex items-center justify-center gap-2 border border-red-200">
                                                                    <XCircle size={16} />
                                                                    Rejected
                                                                </div>
                                                            </div>
                                                        )}

                                                        <p className="text-xs text-gray-500 mt-3">
                                                            Submitted: {new Date(app.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                 )}

                                 {activeTab === 'therapists' && (
                                   <div className="space-y-4">
                                     <form onSubmit={handleSendTherapistInvite} className="p-4 bg-gray-50 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3">
                                       <input
                                         type="email"
                                         value={inviteTherapistForm.email}
                                         onChange={(e) => setInviteTherapistForm(prev => ({ ...prev, email: e.target.value }))}
                                         placeholder="therapist@email.com"
                                         className="bg-white p-2 border border-gray-100 rounded-lg text-sm md:col-span-2"
                                         required
                                       />
                                       <input
                                         type="tel"
                                         value={inviteTherapistForm.phone}
                                         onChange={(e) => setInviteTherapistForm(prev => ({ ...prev, phone: e.target.value }))}
                                         placeholder="WhatsApp number (optional)"
                                         className="bg-white p-2 border border-gray-100 rounded-lg text-sm"
                                       />
                                       <Button type="submit" size="sm" disabled={inviteTherapistBusy}>
                                         <Send size={16} /> {inviteTherapistBusy ? 'Sending...' : 'Send Invite'}
                                       </Button>
                                     </form>

                                      {inviteTherapistMessage && (
                                        <div className={`text-xs rounded-lg px-3 py-2 ${inviteTherapistMessage.startsWith('Invite sent') || inviteTherapistMessage.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                          {inviteTherapistMessage}
                                        </div>
                                      )}

                                      {inviteTherapistWhatsappUrl && (
                                        <div className="text-xs rounded-lg px-3 py-2 bg-green-50 text-green-700 border border-green-100 flex items-center gap-2">
                                          <Phone size={12} />
                                          <a
                                            href={inviteTherapistWhatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-green-800 font-medium"
                                          >
                                            Open WhatsApp invite
                                          </a>
                                        </div>
                                      )}

                                     <div className="bg-white rounded-xl border border-gray-100 p-6">
                                       <h3 className="font-bold text-gray-800 mb-2">How it works</h3>
                                       <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                         <li>An invitation link is sent via email and/or WhatsApp.</li>
                                         <li>The therapist clicks the link to accept the invite and set a password.</li>
                                         <li>They complete their profile (specialty, availability, pricing, T&amp;C).</li>
                                         <li>Once accepted, they can access the Therapist Portal.</li>
                                       </ul>
                                     </div>
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
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Content</th><th className="px-4 py-3 text-xs">Timestamp</th><th className="px-4 py-3 text-right">Action</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().length > 0 ? filteredContent().map((m: any) => <tr key={m.id}>
                                                    <td className="px-4 py-3 font-bold">{m.user_name || 'Anonymous'}</td>
                                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{m.content}</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : '-'}</td>
                                                    <td className="px-4 py-3 text-right"><button onClick={() => deleteMessage(m.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                                                </tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No messages yet</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'moods' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Mood</th><th className="px-4 py-3">Intensity</th><th className="px-4 py-3">Note</th><th className="px-4 py-3 text-xs">Time</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().length > 0 ? filteredContent().map((m: any) => <tr key={m.id}>
                                                    <td className="px-4 py-3 font-bold">{m.user_name}</td>
                                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{m.mood}</span></td>
                                                    <td className="px-4 py-3">
                                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="bg-unity-500 h-full" style={{ width: `${m.intensity * 10}%` }}></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-400 italic max-w-xs truncate">{m.note || '-'}</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{m.created_at ? new Date(m.created_at).toLocaleTimeString() : '-'}</td>
                                                </tr>) : <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No mood logs yet</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'journals' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Entry</th><th className="px-4 py-3 text-xs">Date & Time</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().length > 0 ? filteredContent().map((j: any) => <tr key={j.id}>
                                                    <td className="px-4 py-3 font-bold">{j.user_name}</td>
                                                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{j.content}</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{j.created_at ? new Date(j.created_at).toLocaleString() : '-'}</td>
                                                </tr>) : <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No journal entries yet</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'wins' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Tiny Win</th><th className="px-4 py-3 text-xs">Date & Time</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().length > 0 ? filteredContent().map((w: any) => <tr key={w.id}>
                                                    <td className="px-4 py-3 font-bold">{w.user_name}</td>
                                                    <td className="px-4 py-3 text-gray-600">{w.content}</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{w.created_at ? new Date(w.created_at).toLocaleString() : '-'}</td>
                                                </tr>) : <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No tiny wins yet</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'blocked' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Blocked Chat</th><th className="px-4 py-3">Flag</th><th className="px-4 py-3 text-xs">Time</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().length > 0 ? filteredContent().map((log: any) => <tr key={log.id}>
                                                    <td className="px-4 py-3 font-bold">{log.user_name || 'Unknown'}</td>
                                                    <td className="px-4 py-3 text-xs italic text-gray-500 max-w-xs truncate">"{log.content}"</td>
                                                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.flag_type === 'CRISIS' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-orange-100 text-orange-600'}`}>{log.flag_type}</span></td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{log.created_at ? new Date(log.created_at).toLocaleTimeString() : '-'}</td>
                                                </tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No flagged content</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'reports' && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-400 uppercase font-bold">
                                                <tr><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Flagged Content</th><th className="px-4 py-3 text-xs">Time</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredContent().length > 0 ? filteredContent().map((r: any) => <tr key={r.id}>
                                                    <td className="px-4 py-3 font-bold">{r.reporter_name}</td>
                                                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">{r.reason}</span></td>
                                                    <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate">"{r.message_content}"</td>
                                                    <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleTimeString() : '-'}</td>
                                                </tr>) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No reports yet</td></tr>}
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
