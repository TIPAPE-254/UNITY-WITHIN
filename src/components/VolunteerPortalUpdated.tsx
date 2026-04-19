import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Plus, TrendingUp, Calendar, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface VolunteerPortalProps {
  userEmail?: string;
  onNavigate?: (view: string) => void;
}

interface VolunteerProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  category: string;
  status: string;
  joinedAt: string;
}

interface HoursData {
  total: number;
  target: number;
  percentage: number;
}

interface Task {
  id: number;
  title: string;
  category?: string;
  due_date?: string;
  completed: boolean;
}

interface HourEntry {
  id: number;
  description: string;
  hours: number;
  logged_at: string;
}

export const VolunteerPortal: React.FC<VolunteerPortalProps> = ({ userEmail, onNavigate }) => {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [hours, setHours] = useState<HoursData>({ total: 0, target: 40, percentage: 0 });
  const [tasks, setTasks] = useState<{ list: Task[], completed: number, pending: number, total: number }>({
    list: [],
    completed: 0,
    pending: 0,
    total: 0
  });
  const [activity, setActivity] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHourForm, setShowHourForm] = useState(false);
  const [logForm, setLogForm] = useState({ description: '', hours: '' });
  const [loggingHours, setLoggingHours] = useState(false);

  const email = userEmail || localStorage.getItem('volunteerEmail') || '';

  useEffect(() => {
    fetchPortalData();
  }, [email]);

  const fetchPortalData = async () => {
    if (!email) {
      setError('Please log in to access your volunteer portal');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/portal/me`, {
        headers: { 'x-user-email': email }
      });

      if (!response.ok) {
        throw new Error('Failed to load portal data');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setHours(data.hours);
        setTasks(data.tasks);
        setActivity(data.activity.recent);
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal');
      console.error('Portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.description || !logForm.hours) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoggingHours(true);
      const response = await fetch(`${API_BASE_URL}/api/portal/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({
          description: logForm.description.trim(),
          hours: parseFloat(logForm.hours)
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setLogForm({ description: '', hours: '' });
        setShowHourForm(false);
        await fetchPortalData();
      } else {
        throw new Error(data.error || 'Failed to log hours');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log hours');
    } finally {
      setLoggingHours(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/portal/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({ completed: !currentStatus })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        await fetchPortalData();
      }
    } catch (err) {
      console.error('Task update error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your volunteer portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {profile && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome, {profile.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600">Your volunteer dashboard at UNITY WITHIN</p>
          </div>
        )}

        {error && !loading && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Card */}
        {profile && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-l-4 border-purple-600">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="text-lg font-semibold text-gray-900">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="text-lg font-semibold text-gray-900">{profile.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      profile.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : profile.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hours Tracker */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Hours</h2>
                <div className="relative w-full h-32 mb-4">
                  <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      strokeDasharray={`${hours.percentage * 100.53 / 100} 100.53`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-gray-900">{hours.total}</p>
                    <p className="text-sm text-gray-600">of {hours.target}h</p>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-600">
                  {hours.percentage}% of monthly target
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tasks & Hours Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Tasks Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">📋 Your Tasks</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tasks.completed}/{tasks.total}
                  </p>
                </div>
              </div>

              {tasks.list.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">No tasks assigned yet</p>
                  <p className="text-sm text-gray-500 mt-1">Admin will assign tasks here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.list.map(task => (
                    <div
                      key={task.id}
                      className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className={`font-semibold ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {task.completed && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                          ✓ Done
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Hours */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Recent Hours</h2>
              {activity.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600">No hours logged yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map(entry => (
                    <div key={entry.id} className="flex items-start justify-between p-4 border-2 border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{entry.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(entry.logged_at).toLocaleDateString()} at{' '}
                          {new Date(entry.logged_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-2xl font-bold text-purple-600">{entry.hours}</p>
                        <p className="text-xs text-gray-500">hours</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Log Hours Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">⏱️ Log Hours</h2>

              {showHourForm ? (
                <form onSubmit={handleLogHours} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      What did you work on?
                    </label>
                    <textarea
                      value={logForm.description}
                      onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Moderated 5 forum discussions"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Hours spent
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={logForm.hours}
                      onChange={(e) => setLogForm(prev => ({ ...prev, hours: e.target.value }))}
                      placeholder="e.g., 2.5"
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none text-sm"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loggingHours}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                    >
                      {loggingHours ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowHourForm(false);
                        setLogForm({ description: '', hours: '' });
                      }}
                      className="flex-1 py-2 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowHourForm(true)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Log Hours
                </button>
              )}

              {/* Stats */}
              <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Contributed</p>
                  <p className="text-3xl font-bold text-purple-600">{hours.total}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                  <p className="text-3xl font-bold text-green-600">{tasks.completed}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-start gap-4">
            <MessageSquare size={24} className="text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 mb-4">
                Have questions about your tasks or need support? Contact our volunteer coordinator.
              </p>
              <a
                href="mailto:volunteers@unitywithin.app"
                className="inline-block px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerPortal;
