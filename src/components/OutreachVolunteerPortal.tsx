/**
 * Outreach Volunteer Portal
 * For volunteers working on community outreach, partnerships, and engagement
 */

import React, { useState, useEffect } from 'react';
import { getVolunteerDashboardData } from '../services/volunteerService';

interface OutreachVolunteerPortalProps {
  userEmail?: string;
  userName?: string;
}

interface DashboardData {
  id: number;
  first_name: string;
  email: string;
  role_title: string;
}

interface OutreachProject {
  id: number;
  title: string;
  description: string;
  type: 'social-media' | 'partnership' | 'event' | 'community';
  status: 'planning' | 'active' | 'completed';
  priority: 'low' | 'medium' | 'high';
  targetAudience: string;
  deadline?: string;
  impact?: string;
}

const MOCK_OUTREACH_PROJECTS: OutreachProject[] = [
  {
    id: 1,
    title: 'Mental Health Awareness Campaign',
    description: 'Create and distribute mental health awareness content across social media',
    type: 'social-media',
    status: 'active',
    priority: 'high',
    targetAudience: 'Ages 18-35',
    deadline: '2024-03-01',
    impact: 'Reach: 50K+ users'
  },
  {
    id: 2,
    title: 'College Partner Outreach',
    description: 'Contact and establish partnerships with college mental health centers',
    type: 'partnership',
    status: 'planning',
    priority: 'high',
    targetAudience: 'College administrators',
    deadline: '2024-02-28'
  },
  {
    id: 3,
    title: 'Community Wellness Event',
    description: 'Organize a virtual wellness event with expert speakers',
    type: 'event',
    status: 'planning',
    priority: 'medium',
    targetAudience: 'General community',
    deadline: '2024-03-15'
  },
  {
    id: 4,
    title: 'High School Partnership Program',
    description: 'Develop school program to promote peer support among students',
    type: 'community',
    status: 'completed',
    priority: 'high',
    targetAudience: 'High school students',
    impact: 'Reached 5 schools, 500+ students'
  }
];

interface EngagementMetric {
  label: string;
  value: number;
  change: string;
  icon: string;
}

interface OutreachTemplate {
  id: number;
  title: string;
  category: string;
  description: string;
  useCount: number;
}

const ENGAGEMENT_METRICS: EngagementMetric[] = [
  { label: 'Social Media Reach', value: 125400, change: '+23%', icon: '📱' },
  { label: 'Community Connections', value: 287, change: '+45', icon: '🤝' },
  { label: 'Event Attendees', value: 1250, change: '+340', icon: '👥' },
  { label: 'Partnerships', value: 12, change: '+3', icon: '🔗' }
];

const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: 1,
    title: 'Mental Health Awareness Post',
    category: 'Social Media',
    description: 'Template for sharing mental health awareness content',
    useCount: 15
  },
  {
    id: 2,
    title: 'Partnership Outreach Email',
    category: 'Partnership',
    description: 'Email template for reaching out to potential partners',
    useCount: 8
  },
  {
    id: 3,
    title: 'Event Announcement',
    category: 'Event',
    description: 'Social media announcement for upcoming events',
    useCount: 22
  }
];

export const OutreachVolunteerPortal: React.FC<OutreachVolunteerPortalProps> = ({
  userEmail = '',
  userName = 'Outreach Volunteer'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'metrics' | 'templates'>('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userEmail) {
      loadDashboardData();
    }
  }, [userEmail]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await getVolunteerDashboardData(userEmail);
      setDashboardData(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'social-media': '📱',
      partnership: '🤝',
      event: '📅',
      community: '👥'
    };
    return icons[type] || '⭐';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      planning: 'bg-blue-50 border-blue-200 text-blue-700',
      active: 'bg-green-50 border-green-200 text-green-700',
      completed: 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[status] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading outreach dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🚀 Welcome, {dashboardData?.first_name || userName}!</h1>
        <p className="text-gray-600 text-lg">Community Outreach Hub</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {ENGAGEMENT_METRICS.map((metric, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-purple-200 shadow-lg hover:shadow-xl transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{metric.label}</p>
                <p className="text-3xl font-bold text-purple-600">{metric.value.toLocaleString()}</p>
              </div>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <p className="text-green-600 text-sm font-semibold mt-2">{metric.change}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 border border-purple-200">
        <div className="flex border-b border-purple-200 flex-wrap">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'projects'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Outreach Projects ({MOCK_OUTREACH_PROJECTS.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'metrics'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'templates'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📄 Templates
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Active Outreach Projects</h3>
              {MOCK_OUTREACH_PROJECTS.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-lg p-6 border-2 hover:shadow-lg transition ${getStatusColor(project.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{getTypeIcon(project.type)}</span>
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">{project.title}</h4>
                          <p className="text-sm text-gray-600 capitalize">{project.type.replace('-', ' ')}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3 ml-11">{project.description}</p>
                      <div className="flex gap-4 text-sm ml-11 flex-wrap">
                        <span className="text-gray-600">
                          Audience: <span className="font-semibold">{project.targetAudience}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          project.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : project.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {project.priority.toUpperCase()} PRIORITY
                        </span>
                        {project.deadline && (
                          <span className="text-gray-600">
                            Due: {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {project.impact && (
                        <div className="mt-3 ml-11 p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
                          <p className="text-sm font-semibold">Impact: {project.impact}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                        project.status === 'planning'
                          ? 'bg-blue-200 text-blue-800'
                          : project.status === 'active'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-purple-200 text-purple-800'
                      }`}>
                        {project.status === 'planning' ? '📝 Planning' : project.status === 'active' ? '🟢 Active' : '✓ Done'}
                      </div>
                    </div>
                  </div>

                  {project.status === 'planning' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4 ml-11">
                      Get Started
                    </button>
                  )}
                  {project.status === 'active' && (
                    <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4 ml-11">
                      View Progress
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Campaign Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-4">Social Media Performance</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Impressions</span>
                        <span className="font-bold text-blue-600">125,400</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Engagement Rate</span>
                        <span className="font-bold text-purple-600">8.3%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Follower Growth</span>
                        <span className="font-bold text-green-600">+12%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-pink-50 rounded-lg p-6 border border-green-200">
                  <h4 className="font-bold text-gray-800 mb-4">Partnership Progress</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <span className="text-gray-700">Active Partnerships</span>
                      <span className="text-2xl font-bold text-green-600">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                      <span className="text-gray-700">In Negotiations</span>
                      <span className="text-2xl font-bold text-blue-600">5</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                      <span className="text-gray-700">Community Reached</span>
                      <span className="text-2xl font-bold text-purple-600">2.8K</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">💡 Performance Tips</h4>
                <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
                  <li>Share content at optimal times (mornings and evenings)</li>
                  <li>Use relevant hashtags and engage with community comments</li>
                  <li>Track metrics weekly to identify successful patterns</li>
                  <li>Collaborate with other outreach volunteers for greater reach</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Outreach Templates</h3>
              <p className="text-gray-600 mb-6">Use these templates as starting points for your outreach materials</p>

              {OUTREACH_TEMPLATES.map((template) => (
                <div key={template.id} className="bg-white rounded-lg p-6 border border-purple-200 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-800 mb-1">{template.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {template.category}
                      </span>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-600 mb-2">Used {template.useCount} times</p>
                      <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition text-sm">
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg text-white font-semibold py-3 px-6 rounded-lg transition mt-6">
                + Create New Template
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutreachVolunteerPortal;
