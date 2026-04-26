import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, XCircle, Bell, Settings, 
  MessageCircle, Video, Phone, User, TrendingUp, Award,
  ChevronRight, Filter, Search, MoreHorizontal, Activity,
  Stethoscope, ShieldAlert, Zap, Loader
} from 'lucide-react';
import { User as UserType, ViewState } from '../types';
import { SessionCountdown } from './SessionCountdown';

interface TherapistPortalProps {
  user?: UserType;
  onNavigate?: (view: ViewState) => void;
}

interface SessionRequest {
  id: number;
  user_id: number;
  client_name: string;
  client_email: string;
  type: string;
  call_mode: 'audio' | 'video' | 'chat';
  status: 'pending' | 'approved' | 'live' | 'completed' | 'canceled';
  scheduled_date: string;
  scheduled_time: string;
  issue_description?: string;
  created_at: string;
}

export const TherapistPortal: React.FC<TherapistPortalProps> = ({ user, onNavigate }) => {
  const [sessions, setSessions] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'upcoming' | 'completed'>('queue');
  const [stats, setStats] = useState({
    sessionsCompleted: 12,
    activePatients: 5,
    avgRating: 4.9,
    hoursContributed: 24
  });

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await fetch('/api/therapist/sessions', {
        headers: {
          'x-user-id': String(user.id),
          'x-role': 'therapist'
        }
      });
      const payload = await response.json();
      if (payload.success) {
        setSessions(payload.data || []);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await fetch(`/api/support/sessions/${id}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user?.id),
          'x-role': 'therapist'
        },
        body: JSON.stringify({ status: 'approved' })
      });
      const result = await response.json();
      if (result.success) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
        alert('Session approved. A notification has been sent to the client.');
      } else {
        alert(result.error || 'Failed to approve session');
      }
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleDecline = async (id: number) => {
    try {
      const response = await fetch(`/api/support/sessions/${id}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user?.id),
          'x-role': 'therapist'
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      const result = await response.json();
      if (result.success) {
        setSessions(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Decline error:', err);
    }
  };

  const nextSession = sessions.find(s => s.status === 'approved');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Stethoscope size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Clinical Practitioner</p>
            <h1 className="text-2xl font-black">{user?.firstName || 'Dr. Practitioner'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        {/* Urgent/Live Section */}
        {nextSession && (
          <div className="space-y-4">
            <SessionCountdown 
              scheduledTime={nextSession.scheduled_time} 
              isTherapist={true}
              onReady={() => console.log('Session is live!')}
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Completed', value: stats.sessionsCompleted, icon: <CheckCircle className="text-green-500" />, bg: 'bg-green-50' },
            { label: 'Rating', value: stats.avgRating, icon: <Award className="text-yellow-500" />, bg: 'bg-yellow-50' },
            { label: 'Hours', value: stats.hoursContributed, icon: <Clock className="text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'Clinical Impact', value: 'High', icon: <TrendingUp className="text-purple-500" />, bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-3xl ${stat.bg} border-b-4 border-slate-200 shadow-sm`}>
              <div className="mb-3">{stat.icon}</div>
              <p className="text-3xl font-black text-slate-900">{stat.value}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100 p-2">
            {[
              { id: 'queue', label: 'Session Queue', count: sessions.filter(s => s.status === 'pending').length },
              { id: 'upcoming', label: 'Upcoming Appts', count: sessions.filter(s => s.status === 'approved').length },
              { id: 'completed', label: 'Records/History', count: 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            {loading ? (
              <div className="py-20 text-center">
                <Loader className="animate-spin text-purple-600 mx-auto mb-4" size={32} />
                <p className="text-slate-400 font-bold">Synchronizing Encrypted Records...</p>
              </div>
            ) : sessions.filter(s => activeTab === 'queue' ? s.status === 'pending' : (activeTab === 'upcoming' ? s.status === 'approved' : false)).length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="text-slate-200" size={32} />
                </div>
                <p className="text-slate-400 font-bold">Your queue is currently clear.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions
                  .filter(s => activeTab === 'queue' ? s.status === 'pending' : (activeTab === 'upcoming' ? s.status === 'approved' : false))
                  .map(session => (
                    <div key={session.id} className="group p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <User size={24} />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">{session.type}</p>
                        <h3 className="text-lg font-black text-slate-900">{session.client_name}</h3>
                        <p className="text-sm text-slate-500 truncate max-w-sm">{session.issue_description}</p>
                      </div>
                      <div className="flex flex-col items-center md:items-end gap-1">
                        <div className="flex items-center gap-2 text-slate-900 font-black">
                          <Calendar size={14} className="text-slate-400" />
                          {session.scheduled_date}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                          <Clock size={14} />
                          {session.scheduled_time}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeTab === 'queue' ? (
                          <>
                            <button 
                              onClick={() => handleDecline(session.id)}
                              className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                            >
                              <XCircle size={20} />
                            </button>
                            <button 
                              onClick={() => handleApprove(session.id)}
                              className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:scale-105 transition-transform flex items-center gap-2"
                            >
                              <CheckCircle size={18} />
                              Approve
                            </button>
                          </>
                        ) : (
                          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <Video size={18} />
                            Prepare
                          </button>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest border-t border-slate-200 bg-white">
        UNITY WITHIN • SECURE CLINICAL GATEWAY • HIPAA COMPLIANT
      </footer>
    </div>
  );
};
