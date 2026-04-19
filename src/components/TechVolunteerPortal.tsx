/**
 * Tech Volunteer Portal
 * For technical volunteers working on testing, debugging, and development
 */

import React, { useState, useEffect } from 'react';
import { getVolunteerDashboardData } from '../services/volunteerService';

interface TechVolunteerPortalProps {
  userEmail?: string;
  userName?: string;
}

interface DashboardData {
  id: number;
  first_name: string;
  email: string;
  role_title: string;
}

interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  reportedBy?: string;
  assignedTo?: string;
  createdAt: string;
}

interface TestingTask {
  id: number;
  title: string;
  description: string;
  feature: string;
  devices?: string[];
  status: 'open' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
}

const MOCK_BUG_REPORTS: BugReport[] = [
  {
    id: 1,
    title: 'Login button unresponsive on mobile',
    description: 'The login button does not respond to clicks on iOS devices',
    severity: 'high',
    status: 'open',
    reportedBy: 'User Report',
    createdAt: '2024-02-08'
  },
  {
    id: 2,
    title: 'Breathing exercise timer incorrect',
    description: 'Timer advances faster than actual time elapsed',
    severity: 'medium',
    status: 'in-progress',
    assignedTo: 'You',
    createdAt: '2024-02-05'
  },
  {
    id: 3,
    title: 'Mood graph not displaying correctly',
    description: 'Graph renders with white bars on some screens',
    severity: 'low',
    status: 'open',
    createdAt: '2024-02-10'
  }
];

const MOCK_TESTING_TASKS: TestingTask[] = [
  {
    id: 1,
    title: 'Test Dashboard Responsiveness',
    description: 'Verify dashboard displays correctly on all screen sizes',
    feature: 'Dashboard',
    devices: ['iPhone 12', 'iPad', 'Samsung Galaxy S21', 'Desktop'],
    status: 'open',
    priority: 'high',
    deadline: '2024-02-15'
  },
  {
    id: 2,
    title: 'Test Peer Support Call Flow',
    description: 'Test voice and video call initiation and connection',
    feature: 'Peer Support',
    devices: ['Desktop', 'iPad'],
    status: 'in-progress',
    priority: 'high',
    deadline: '2024-02-18'
  },
  {
    id: 3,
    title: 'Accessibility Testing',
    description: 'Verify all pages are accessible with screen readers',
    feature: 'General',
    status: 'open',
    priority: 'medium',
    deadline: '2024-02-25'
  }
];

export const TechVolunteerPortal: React.FC<TechVolunteerPortalProps> = ({
  userEmail = '',
  userName = 'Tech Volunteer'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'bugs' | 'testing' | 'feedback'>('bugs');
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

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 border-red-300 text-red-700',
      high: 'bg-orange-100 border-orange-300 text-orange-700',
      medium: 'bg-yellow-100 border-yellow-300 text-yellow-700',
      low: 'bg-blue-100 border-blue-300 text-blue-700'
    };
    return colors[severity] || 'bg-gray-100 border-gray-300 text-gray-700';
  };

  const getPriorityIcon = (priority: string) => {
    const icons: { [key: string]: string } = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢'
    };
    return icons[priority] || '⚪';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: 'bg-blue-50 border-blue-200',
      'in-progress': 'bg-yellow-50 border-yellow-200',
      completed: 'bg-green-50 border-green-200',
      resolved: 'bg-green-50 border-green-200',
      closed: 'bg-gray-50 border-gray-200'
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tech dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">💻 Welcome, {dashboardData?.first_name || userName}!</h1>
        <p className="text-gray-600 text-lg">Technical Volunteer Workspace</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 border border-red-200 shadow">
          <p className="text-red-600 font-bold text-2xl">{MOCK_BUG_REPORTS.length}</p>
          <p className="text-gray-600 text-sm">Bug Reports</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-orange-200 shadow">
          <p className="text-orange-600 font-bold text-2xl">
            {MOCK_BUG_REPORTS.filter(b => b.status === 'open').length}
          </p>
          <p className="text-gray-600 text-sm">Open Issues</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-200 shadow">
          <p className="text-blue-600 font-bold text-2xl">{MOCK_TESTING_TASKS.length}</p>
          <p className="text-gray-600 text-sm">Testing Tasks</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200 shadow">
          <p className="text-green-600 font-bold text-2xl">
            {MOCK_TESTING_TASKS.filter(t => t.status === 'completed').length}
          </p>
          <p className="text-gray-600 text-sm">Tests Completed</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 border border-purple-200">
        <div className="flex border-b border-purple-200 flex-wrap">
          <button
            onClick={() => setActiveTab('bugs')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'bugs'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🐛 Bug Reports ({MOCK_BUG_REPORTS.length})
          </button>
          <button
            onClick={() => setActiveTab('testing')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'testing'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🧪 Testing Tasks ({MOCK_TESTING_TASKS.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'feedback'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 Feedback
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'bugs' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Bug Reports & Issues</h3>
              {MOCK_BUG_REPORTS.map((bug) => (
                <div
                  key={bug.id}
                  className={`rounded-lg p-6 border-2 hover:shadow-lg transition ${getStatusColor(bug.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🐛</span>
                        <h4 className="text-lg font-bold text-gray-800">{bug.title}</h4>
                      </div>
                      <p className="text-gray-700 mb-3">{bug.description}</p>
                      <div className="flex gap-4 text-sm flex-wrap">
                        <span className={`px-3 py-1 rounded-full font-semibold ${getSeverityColor(bug.severity)}`}>
                          {bug.severity.toUpperCase()} SEVERITY
                        </span>
                        <span className="text-gray-600">
                          Reported: {new Date(bug.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                        bug.status === 'open'
                          ? 'bg-blue-200 text-blue-800'
                          : bug.status === 'in-progress'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {bug.status === 'open' ? '🔵 Open' : bug.status === 'in-progress' ? '🟡 In Progress' : '✓ Resolved'}
                      </div>
                    </div>
                  </div>

                  {bug.status === 'open' && (
                    <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4">
                      Take Assignment
                    </button>
                  )}
                  {bug.status === 'in-progress' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4">
                      Report Progress
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Testing Tasks</h3>
              {MOCK_TESTING_TASKS.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg p-6 border-2 hover:shadow-lg transition ${getStatusColor(task.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🧪</span>
                        <h4 className="text-lg font-bold text-gray-800">{task.title}</h4>
                      </div>
                      <p className="text-gray-700 mb-3">{task.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-4">
                          <span className="text-gray-600">
                            Feature: <span className="font-semibold">{task.feature}</span>
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getPriorityIcon(task.priority)} {task.priority.toUpperCase()}
                          </span>
                        </div>
                        {task.devices && (
                          <div className="text-gray-600">
                            Devices: <span className="font-semibold">{task.devices.join(', ')}</span>
                          </div>
                        )}
                        {task.deadline && (
                          <div className="text-gray-600">
                            Due: <span className="font-semibold">{new Date(task.deadline).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                        task.status === 'open'
                          ? 'bg-blue-200 text-blue-800'
                          : task.status === 'in-progress'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {task.status === 'open' ? '🔵 Open' : task.status === 'in-progress' ? '⏳ Testing' : '✓ Done'}
                      </div>
                    </div>
                  </div>

                  {task.status === 'open' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4">
                      Start Testing
                    </button>
                  )}
                  {task.status === 'in-progress' && (
                    <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4">
                      Submit Results
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Share Your Feedback</h3>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4">General App Feedback</h4>
                <textarea
                  placeholder="Share your thoughts, observations, and suggestions for improving Unity Within..."
                  className="w-full h-24 p-4 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                />
                <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                  Submit Feedback
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">💡 Tips for Quality Feedback</h4>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                  <li>Be specific about the issue or feature you're discussing</li>
                  <li>Include steps to reproduce bugs when applicable</li>
                  <li>Mention the device, browser, and OS you're using</li>
                  <li>Suggest improvements with reasoning</li>
                  <li>Include screenshots or videos when helpful</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechVolunteerPortal;
