import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageCircle, Users, Sparkles, Zap, Target, Calendar, 
  Award, TrendingUp, Clock, FileText, Video, Globe, Palette, Shield,
  CheckCircle, Bell, Settings, BookOpen, Phone, ChevronRight, Play,
  Star, Activity, Send, HeadphonesMic, Copy
} from 'lucide-react';
import { User, ViewState } from '../types';
import { getVolunteerDashboardData, getVolunteerProfile } from '../services/volunteerService';

interface VolunteerPortalProps {
  user?: User;
  onNavigate?: (view: ViewState) => void;
}

interface RoleConfig {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  features: string[];
  quickActions: { label: string; icon: React.ReactNode; action: string }[];
}

interface CategoryConfig {
  id: string;
  title: string;
  description: string;
  modules: { title: string; description: string; icon: React.ReactNode }[];
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  listener: {
    id: 'listener',
    title: 'Community Listener',
    icon: <HeadphonesMic size={24} />,
    color: 'text-purple-600',
    bgGradient: 'from-purple-600 to-pink-600',
    features: [
      'One-on-one listening sessions',
      'Active listening practice',
      'Empathy building exercises',
      'Crisis recognition training'
    ],
    quickActions: [
      { label: 'Start Session', icon: <MessageCircle size={20} />, action: 'start-session' },
      { label: 'View Schedule', icon: <Calendar size={20} />, action: 'schedule' },
      { label: 'Training', icon: <BookOpen size={20} />, action: 'training' },
      { label: 'Resources', icon: <FileText size={20} />, action: 'resources' }
    ]
  },
  advocate: {
    id: 'advocate',
    title: 'Mental Health Advocate',
    icon: <Zap size={24} />,
    color: 'text-amber-600',
    bgGradient: 'from-amber-500 to-orange-600',
    features: [
      'Social media advocacy',
      'Community outreach',
      'Awareness campaigns',
      'Public speaking opportunities'
    ],
    quickActions: [
      { label: 'Campaigns', icon: <Target size={20} />, action: 'campaigns' },
      { label: 'Share Story', icon: <Send size={20} />, action: 'share' },
      { label: 'Events', icon: <Globe size={20} />, action: 'events' },
      { label: 'Analytics', icon: <TrendingUp size={20} />, action: 'analytics' }
    ]
  },
  ambassador: {
    id: 'ambassador',
    title: 'Outreach Ambassador',
    icon: <Globe size={24} />,
    color: 'text-green-600',
    bgGradient: 'from-green-600 to-teal-600',
    features: [
      'School partnerships',
      'Campus outreach',
      'Event coordination',
      'Community building'
    ],
    quickActions: [
      { label: 'Partners', icon: <Users size={20} />, action: 'partners' },
      { label: 'Schedule Event', icon: <Calendar size={20} />, action: 'schedule-event' },
      { label: 'Materials', icon: <FileText size={20} />, action: 'materials' },
      { label: 'Reporting', icon: <Activity size={20} />, action: 'reporting' }
    ]
  },
  content: {
    id: 'content',
    title: 'Content & Story Volunteer',
    icon: <Palette size={24} />,
    color: 'text-pink-600',
    bgGradient: 'from-pink-500 to-rose-600',
    features: [
      'Social media content',
      'Blog writing',
      'Video scripting',
      'Newsletter contributions'
    ],
    quickActions: [
      { label: 'Create Content', icon: <Sparkles size={20} />, action: 'create' },
      { label: 'Templates', icon: <FileText size={20} />, action: 'templates' },
      { label: 'Approvals', icon: <CheckCircle size={20} />, action: 'approvals' },
      { label: 'Ideas', icon: <Star size={20} />, action: 'ideas' }
    ]
  },
  wellness: {
    id: 'wellness',
    title: 'Wellness Program Support',
    icon: <Activity size={24} />,
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-cyan-600',
    features: [
      'Event facilitation',
      'Workshop support',
      'Resource creation',
      'Group activities'
    ],
    quickActions: [
      { label: 'Programs', icon: <Calendar size={20} />, action: 'programs' },
      { label: 'Lead Session', icon: <Play size={20} />, action: 'lead' },
      { label: 'Resources', icon: <BookOpen size={20} />, action: 'resources' },
      { label: 'Feedback', icon: <Star size={20} />, action: 'feedback' }
    ]
  },
  tech: {
    id: 'tech',
    title: 'Tech Support Volunteer',
    icon: <Shield size={24} />,
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-500 to-purple-600',
    features: [
      'User support tickets',
      'Platform assistance',
      'Bug reporting',
      'Feature testing'
    ],
    quickActions: [
      { label: 'Tickets', icon: <HeadphonesMic size={20} />, action: 'tickets' },
      { label: 'Knowledge Base', icon: <BookOpen size={20} />, action: 'kb' },
      { label: 'Report Issue', icon: <Zap size={20} />, action: 'report' },
      { label: 'Stats', icon: <TrendingUp size={20} />, action: 'stats' }
    ]
  }
};

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  community: {
    id: 'community',
    title: 'Community Support',
    description: 'Peer support, listening sessions, and community engagement tools.',
    modules: [
      { title: 'Peer Support', description: 'Provide non-crisis listening sessions.', icon: <HeadphonesMic size={20} /> },
      { title: 'Community Rooms', description: 'Moderate chats and support rooms.', icon: <MessageCircle size={20} /> },
      { title: 'Care Playbook', description: 'Protocols for supporting community members.', icon: <BookOpen size={20} /> },
    ],
  },
  creative: {
    id: 'creative',
    title: 'Creative Studio',
    description: 'Campaign content, design assets, and storytelling workflows.',
    modules: [
      { title: 'Content Queue', description: 'Draft and manage content requests.', icon: <Sparkles size={20} /> },
      { title: 'Brand Assets', description: 'Access design kits and templates.', icon: <Palette size={20} /> },
      { title: 'Approval Flow', description: 'Submit work for review.', icon: <CheckCircle size={20} /> },
    ],
  },
  tech: {
    id: 'tech',
    title: 'Tech Support',
    description: 'Bug triage, user support, and release testing.',
    modules: [
      { title: 'Support Tickets', description: 'Track incoming user issues.', icon: <Shield size={20} /> },
      { title: 'Testing Lab', description: 'Run pre-release checks.', icon: <Activity size={20} /> },
      { title: 'Knowledge Base', description: 'Answer common questions.', icon: <BookOpen size={20} /> },
    ],
  },
  outreach: {
    id: 'outreach',
    title: 'Outreach Hub',
    description: 'Partnerships, events, and community engagement metrics.',
    modules: [
      { title: 'Partnerships', description: 'Track partner relationships.', icon: <Users size={20} /> },
      { title: 'Event Planner', description: 'Coordinate outreach events.', icon: <Calendar size={20} /> },
      { title: 'Impact Reports', description: 'Log outreach outcomes.', icon: <TrendingUp size={20} /> },
    ],
  },
  supportadmin: {
    id: 'supportadmin',
    title: 'Support & Admin',
    description: 'Operations, resources, and administrative workflows.',
    modules: [
      { title: 'Operations', description: 'Handle admin support tasks.', icon: <Settings size={20} /> },
      { title: 'Resource Library', description: 'Maintain support resources.', icon: <FileText size={20} /> },
      { title: 'Volunteer Ops', description: 'Assist with volunteer coordination.', icon: <Users size={20} /> },
    ],
  },
};

export const VolunteerPortal: React.FC<VolunteerPortalProps> = ({ user, onNavigate }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [supportLink, setSupportLink] = useState<string | null>(null);
  const [supportMode, setSupportMode] = useState<'voice' | 'video'>('voice');
  const [stats, setStats] = useState({
    hoursContributed: 0,
    peopleSupported: 0,
    sessionsCompleted: 0,
    impactScore: 0
  });

  useEffect(() => {
    if (user?.email) {
      fetchPortalData();
    }
  }, [user?.email]);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getVolunteerDashboardData(user?.email || '');
      
      if (dashboardData?.data?.profile) {
        const volProfile = dashboardData.data.profile;
        setProfile(volProfile);
        
        const roleTitle = volProfile.role_title || volProfile.volunteerRole || '';
        const roleKey = roleTitle.toLowerCase().replace(/[^a-z]/g, '');
        
        setStats({
          hoursContributed: volProfile.hours_contributed || 0,
          peopleSupported: Math.floor((volProfile.hours_contributed || 0) * 2),
          sessionsCompleted: volProfile.sessions_completed || 0,
          impactScore: Math.min(100, Math.floor((volProfile.hours_contributed || 0) * 10))
        });
      }
    } catch (err) {
      console.error('Failed to load portal data:', err);
      setProfile({
        firstName: user?.firstName || 'Volunteer',
        volunteerRole: 'Community Listener',
        matched_role_id: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleConfig = (roleTitle: string): RoleConfig => {
    const normalizedRole = roleTitle?.toLowerCase().replace(/[^a-z]/g, '') || 'listener';
    return ROLE_CONFIGS[normalizedRole] || ROLE_CONFIGS.listener;
  };

  const getCategoryConfig = (category: string): CategoryConfig => {
    const normalized = category?.toLowerCase().replace(/[^a-z]/g, '') || 'community';
    return CATEGORY_CONFIGS[normalized] || CATEGORY_CONFIGS.community;
  };

  const roleTitle = profile?.role_title || profile?.volunteerRole || 'Community Listener';
  const roleConfig = getRoleConfig(roleTitle);
  const roleCategory = profile?.role_category || profile?.category || 'Community';
  const categoryConfig = getCategoryConfig(roleCategory);
  const isCommunityListener = roleTitle.toLowerCase().includes('listener') || categoryConfig.id === 'community';

  const createSupportCallLink = (mode: 'voice' | 'video') => {
    const roomId = `support-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return `${window.location.origin}/support-call/${roomId}?mode=${mode}`;
  };

  const handleStartSupportCall = (mode: 'voice' | 'video') => {
    const link = createSupportCallLink(mode);
    setSupportMode(mode);
    setSupportLink(link);
    window.open(link, '_blank');
  };

  const handleCopySupportLink = async () => {
    if (!supportLink) return;
    try {
      await navigator.clipboard.writeText(supportLink);
    } catch {
      // ignore clipboard errors
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7]">
      {/* Header with Role-Based Styling */}
      <header className={`bg-gradient-to-r ${roleConfig.bgGradient} text-white p-6 md:p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                {roleConfig.icon}
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                  Welcome back
                </p>
                <h1 className="text-3xl font-bold">
                  {profile?.firstName || user?.firstName || 'Volunteer'}
                </h1>
                <p className="text-white/90 flex items-center gap-2 mt-1">
                  {roleConfig.icon}
                  <span>{roleConfig.title}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-md">
                <Bell size={20} />
              </button>
              <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-md">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Category Modules */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{categoryConfig.title}</h2>
              <p className="text-gray-600">{categoryConfig.description}</p>
            </div>
            <span className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-semibold">
              Category: {roleCategory}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryConfig.modules.map((module, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4">
                <div className={`${roleConfig.color} mb-2`}>{module.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{module.title}</h3>
                <p className="text-sm text-gray-600">{module.description}</p>
              </div>
            ))}
          </div>
        </div>

        {isCommunityListener && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Peer Support Center</h2>
                <p className="text-gray-600">You are approved to support clients via voice or video calls.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStartSupportCall('voice')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  <Phone size={18} />
                  Start Voice Call
                </button>
                <button
                  onClick={() => handleStartSupportCall('video')}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold flex items-center gap-2"
                >
                  <Video size={18} />
                  Start Video Call
                </button>
              </div>
            </div>
            {supportLink && (
              <div className="mt-4 bg-purple-50 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-purple-800">Share this link with the client</p>
                  <p className="text-xs text-purple-600 break-all">{supportLink}</p>
                </div>
                <button
                  onClick={handleCopySupportLink}
                  className="px-3 py-2 bg-purple-200 text-purple-800 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                  <Copy size={14} />
                  Copy Link
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions - Role Based */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {roleConfig.quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => console.log('Action:', action.action)}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all group text-left"
            >
              <div className={`${roleConfig.color} mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <p className="font-bold text-gray-900">{action.label}</p>
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Hours</p>
                <p className="text-3xl font-bold text-gray-900">{stats.hoursContributed}</p>
              </div>
              <Clock size={40} className="text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-pink-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">People Helped</p>
                <p className="text-3xl font-bold text-gray-900">{stats.peopleSupported}</p>
              </div>
              <Users size={40} className="text-pink-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sessionsCompleted}</p>
              </div>
              <MessageCircle size={40} className="text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Impact</p>
                <p className="text-3xl font-bold text-gray-900">{stats.impactScore}</p>
              </div>
              <Award size={40} className="text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-200 flex-wrap">
            {['dashboard', 'my-role', 'training', 'community'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold transition-colors capitalize ${
                  activeTab === tab
                    ? `${roleConfig.color} border-b-2`
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ 
                  borderColor: activeTab === tab ? roleConfig.color.includes('purple') ? '#9333ea' : roleConfig.color.includes('amber') ? '#d97706' : roleConfig.color.includes('green') ? '#16a34a' : roleConfig.color.includes('pink') ? '#db2777' : roleConfig.color.includes('blue') ? '#2563eb' : '#4f46e5' : 'transparent'
                }}
              >
                {tab === 'my-role' ? 'My Role' : tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Activity</h2>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">This Week</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        On Track
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <p className="text-gray-600 text-sm">3.5 of 5 hours completed</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Calendar size={20} className="text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Weekly Team Sync</p>
                        <p className="text-sm text-gray-600">Tomorrow, 3:00 PM</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <Video size={20} className="text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Training Session</p>
                        <p className="text-sm text-gray-600">Friday, 2:00 PM</p>
                      </div>
                      <ChevronRight size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Role Tab */}
            {activeTab === 'my-role' && (
              <div className="space-y-8">
                <div className={`bg-gradient-to-r ${roleConfig.bgGradient} rounded-2xl p-8 text-white`}>
                  <div className="flex items-center gap-4 mb-4">
                    {roleConfig.icon}
                    <h3 className="text-2xl font-bold">{roleConfig.title}</h3>
                  </div>
                  <p className="text-white/90 mb-6">
                    Your role as a {roleConfig.title.toLowerCase()} helps us reach more young people and provide better support.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roleConfig.features.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Role Responsibilities</h3>
                  <div className="space-y-3">
                    {roleConfig.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <CheckCircle size={20} className="text-green-600" />
                        <p className="text-gray-700">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Training Tab */}
            {activeTab === 'training' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Training</h2>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <CheckCircle size={24} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Introduction to Unity Within</h4>
                          <p className="text-sm text-gray-600">Completed • 2 hours</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Completed
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Play size={24} className="text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Active Listening Fundamentals</h4>
                          <p className="text-sm text-gray-600">45 minutes remaining</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">
                        Continue
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                          <Lock size={24} className="text-gray-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Advanced Techniques</h4>
                          <p className="text-sm text-gray-600">Complete previous modules</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                        Locked
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Community Tab */}
            {activeTab === 'community' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Community</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Users size={24} className="text-purple-600" />
                      <h4 className="font-bold text-gray-900">Volunteer Network</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Connect with 50+ volunteers across Kenya</p>
                    <button className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors">
                      View Directory
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <MessageCircle size={24} className="text-blue-600" />
                      <h4 className="font-bold text-gray-900">Volunteer Chat</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Join the discussion</p>
                    <button className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                      Open Chat
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Star size={24} className="text-green-600" />
                      <h4 className="font-bold text-gray-900">Success Stories</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Share your impact</p>
                    <button className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                      Share Story
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Award size={24} className="text-amber-600" />
                      <h4 className="font-bold text-gray-900">Leaderboard</h4>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">See top volunteers</p>
                    <button className="w-full py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors">
                      View Rankings
                    </button>
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

function Lock({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}