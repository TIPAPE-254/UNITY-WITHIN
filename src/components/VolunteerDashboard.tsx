import React, { useState, useEffect } from 'react';
import { Heart, TrendingUp, Users, Clock, Award, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { User, ViewState } from '../types';
import { getVolunteerDashboardData, getVolunteerProfile, updateVolunteerProfile } from '../services/volunteerService';

interface VolunteerDashboardProps {
  user?: User;
  onNavigate?: (view: ViewState) => void;
}

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ user, onNavigate }) => {
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'activities' | 'impact'>('overview');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      if (!user?.id && !user?.email) return;
      setLoading(true);

      let dashboardData: any = null;
      if (user?.email) {
        const dashboardResponse = await getVolunteerDashboardData(user.email);
        dashboardData = dashboardResponse?.data || null;
      }

      if (dashboardData?.profile) {
        setProfile(dashboardData.profile || {});
        setFormData(dashboardData.profile || {});

        const taskCampaigns = Array.isArray(dashboardData.tasks)
          ? dashboardData.tasks.map((task: any) => ({
              name: task.title || task.name || 'Campaign Task',
              status: task.status || 'active',
              progress: typeof task.progress === 'number' ? task.progress : (task.status === 'completed' ? 100 : 0),
            }))
          : [];

        const shiftActivities = Array.isArray(dashboardData.shifts)
          ? dashboardData.shifts.map((shift: any) => {
              const start = shift.start_time ? new Date(shift.start_time) : null;
              const end = shift.end_time ? new Date(shift.end_time) : null;
              const hours = start && end ? Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60)) : 0;
              return {
                date: shift.start_time || shift.created_at || new Date().toISOString(),
                type: shift.title || shift.name || 'Volunteer Shift',
                hours: Number(hours.toFixed(1)),
                description: shift.notes || shift.description || 'Volunteer contribution',
              };
            })
          : [];

        setCampaigns(taskCampaigns);
        setActivities(shiftActivities);
      } else if (user?.id) {
        const data = await getVolunteerProfile(user.id);
        setProfile(data.profile || {});
        setFormData(data.profile || {});
        setCampaigns(Array.isArray(data.profile?.activeCampaigns)
          ? data.profile.activeCampaigns.map((name: string) => ({ name, status: 'active', progress: 0 }))
          : []);
        setActivities(Array.isArray(data.profile?.activities) ? data.profile.activities : []);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile({
        firstName: user?.firstName || '',
        email: user?.email || '',
        volunteerRole: 'Community Listener',
        volunteerStatus: 'active',
        hoursContributed: 0,
        activeCampaigns: [],
        joinDate: new Date().toISOString(),
        phone: '',
        location: '',
        experience: ''
      });
      setActivities([]);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      await updateVolunteerProfile(user.id, formData);
      setProfile(formData);
      setEditMode(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const peopleSupported = Math.floor((profile?.hoursContributed || 0) * 2);

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your volunteer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome, {profile?.firstName || user?.firstName || 'Volunteer'}!
              </h1>
              <p className="text-gray-600">
                {profile?.volunteerRole || 'Community Volunteer'} • Joined {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'Recently'}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold">
              <CheckCircle size={20} />
              Approved & Active
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-purple-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Hours Contributed</p>
                  <p className="text-3xl font-bold text-gray-900">{profile?.hoursContributed || 0}</p>
                </div>
                <Clock size={40} className="text-purple-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-pink-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Active Campaigns</p>
                  <p className="text-3xl font-bold text-gray-900">{profile?.activeCampaigns?.length || 0}</p>
                </div>
                <TrendingUp size={40} className="text-pink-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">People Helped</p>
                  <p className="text-3xl font-bold text-gray-900">{Math.floor((profile?.hoursContributed || 0) * 2)}</p>
                </div>
                <Users size={40} className="text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-green-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold">Impact Score</p>
                  <p className="text-3xl font-bold text-gray-900">{Math.min(100, Math.floor((profile?.hoursContributed || 0) * 10))}</p>
                </div>
                <Award size={40} className="text-green-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-200 flex-wrap">
            {(['overview', 'profile', 'activities', 'impact'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Campaigns</h2>
                  <div className="space-y-4">
                    {campaigns.length === 0 && (
                      <div className="bg-gray-50 rounded-xl p-6 text-gray-600 text-sm">
                        No active campaigns yet. New tasks will appear here once assigned.
                      </div>
                    )}
                    {campaigns.map((campaign, idx) => (
                      <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            campaign.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${campaign.progress}%` }}
                          />
                        </div>
                        <p className="text-gray-600 text-sm mt-2">{campaign.progress}% Complete</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl hover:shadow-lg transition-all text-left group">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageCircle className="text-purple-600 group-hover:scale-110 transition-transform" size={24} />
                        <h3 className="font-bold text-gray-900">Start Supporting</h3>
                      </div>
                      <p className="text-gray-600 text-sm">Begin a new community listening session</p>
                    </button>
                    <button className="p-6 bg-gradient-to-br from-blue-100 to-green-100 rounded-xl hover:shadow-lg transition-all text-left group">
                      <div className="flex items-center gap-3 mb-2">
                        <Heart className="text-blue-600 group-hover:scale-110 transition-transform fill-current" size={24} />
                        <h3 className="font-bold text-gray-900">Resources</h3>
                      </div>
                      <p className="text-gray-600 text-sm">Access volunteer training materials</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
                  {!editMode && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                <div className={`space-y-6 ${editMode ? 'bg-gray-50 p-8 rounded-xl' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.firstName || ''}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profile?.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <p className="text-gray-900 font-medium">{profile?.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                      {editMode ? (
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profile?.phone || 'Not provided'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profile?.location || 'Not provided'}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Volunteer Role</label>
                      <p className="text-gray-900 font-medium">{profile?.volunteerRole}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Experience & Background</label>
                      {editMode ? (
                        <textarea
                          value={formData.experience || ''}
                          onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                          placeholder="Tell us about your experience..."
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none resize-none"
                          rows={4}
                        />
                      ) : (
                        <p className="text-gray-900">{profile?.experience || 'Not provided'}</p>
                      )}
                    </div>
                  </div>

                  {editMode && (
                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setFormData(profile);
                        }}
                        className="px-6 py-2 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Activities</h2>
                <div className="space-y-4">
                  {activities.length === 0 && (
                    <div className="bg-gray-50 rounded-xl p-6 text-gray-600 text-sm">
                      No volunteer activities logged yet.
                    </div>
                  )}
                  {activities.map((activity, idx) => (
                    <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-600">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{activity.type}</h3>
                        <span className="text-sm font-bold text-purple-600">{activity.hours}h</span>
                      </div>
                      <p className="text-gray-600 mb-2">{activity.description}</p>
                      <p className="text-gray-500 text-sm">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Impact Tab */}
            {activeTab === 'impact' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Impact</h2>
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Impact Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-4xl font-bold text-purple-600 mb-2">{profile?.hoursContributed || 0}</p>
                        <p className="text-gray-700 font-semibold">Hours Volunteered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-pink-600 mb-2">{peopleSupported}</p>
                        <p className="text-gray-700 font-semibold">People Supported</p>
                      </div>
                      <div className="text-center">
                        <p className="text-4xl font-bold text-blue-600 mb-2">{campaigns.length}</p>
                        <p className="text-gray-700 font-semibold">Campaigns</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`border-2 rounded-xl p-6 text-center ${activities.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-3xl mb-2">🌟</p>
                        <p className="font-bold text-gray-900">Getting Started</p>
                        <p className="text-gray-600 text-sm">{activities.length > 0 ? 'Completed first volunteer activity' : 'Complete your first volunteer activity'}</p>
                      </div>
                      <div className={`border-2 rounded-xl p-6 text-center ${peopleSupported >= 20 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-3xl mb-2">🏆</p>
                        <p className="font-bold text-gray-900">Community Champion</p>
                        <p className="text-gray-600 text-sm">{peopleSupported >= 20 ? 'Supported 20+ people' : `Support ${Math.max(0, 20 - peopleSupported)} more people to unlock`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
