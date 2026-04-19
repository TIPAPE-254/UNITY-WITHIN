/**
 * Creative Volunteer Portal
 * For volunteers working on content creation, art, music, writing, etc.
 */

import React, { useState, useEffect } from 'react';
import { getVolunteerDashboardData } from '../services/volunteerService';

interface CreativeVolunteerPortalProps {
  userEmail?: string;
  userName?: string;
}

interface DashboardData {
  id: number;
  first_name: string;
  email: string;
  role_title: string;
}

interface CreativeTask {
  id: number;
  title: string;
  description: string;
  type: 'content' | 'art' | 'music' | 'writing' | 'design';
  deadline?: string;
  status: 'open' | 'in-progress' | 'completed';
}

const MOCK_CREATIVE_TASKS: CreativeTask[] = [
  {
    id: 1,
    title: 'Create Mindfulness Poster',
    description: 'Design a calming visual poster for the dashboard',
    type: 'art',
    deadline: '2024-02-15',
    status: 'open'
  },
  {
    id: 2,
    title: 'Write Wellness Blog Post',
    description: 'Write an inspiring article about mental health',
    type: 'writing',
    deadline: '2024-02-20',
    status: 'open'
  },
  {
    id: 3,
    title: 'Music Playlist Curation',
    description: 'Curate relaxation music tracks for the breathing exercise',
    type: 'music',
    deadline: '2024-02-25',
    status: 'open'
  },
  {
    id: 4,
    title: 'Meditation Guide Recording',
    description: 'Record a guided meditation script',
    type: 'content',
    deadline: '2024-03-01',
    status: 'in-progress'
  }
];

interface SubmittedWork {
  id: number;
  title: string;
  taskId: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'needs-revision';
  feedback?: string;
}

export const CreativeVolunteerPortal: React.FC<CreativeVolunteerPortalProps> = ({
  userEmail = '',
  userName = 'Creative Volunteer'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions' | 'portfolio'>('tasks');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittedWork, setSubmittedWork] = useState<SubmittedWork[]>([
    {
      id: 1,
      title: 'Self-Care Infographic',
      taskId: 5,
      submittedAt: '2024-01-28',
      status: 'approved',
      feedback: 'Beautiful design! Great use of colors.'
    },
    {
      id: 2,
      title: 'Daily Affirmations Playlist',
      taskId: 6,
      submittedAt: '2024-02-05',
      status: 'pending'
    }
  ]);

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

  const getTaskIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      art: '🎨',
      music: '🎵',
      writing: '✍️',
      content: '📹',
      design: '🎭'
    };
    return icons[type] || '⭐';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: 'bg-blue-50 border-blue-200 text-blue-700',
      'in-progress': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      completed: 'bg-green-50 border-green-200 text-green-700',
      approved: 'bg-green-50 border-green-200 text-green-700',
      pending: 'bg-gray-50 border-gray-200 text-gray-700',
      'needs-revision': 'bg-orange-50 border-orange-200 text-orange-700'
    };
    return colors[status] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your creative studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🎨 Welcome, {dashboardData?.first_name || userName}!</h1>
        <p className="text-gray-600 text-lg">Creative Volunteer Studio</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 border border-purple-200">
        <div className="flex border-b border-purple-200 flex-wrap">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'tasks'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Available Tasks ({MOCK_CREATIVE_TASKS.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'submissions'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📤 My Submissions ({submittedWork.length})
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'portfolio'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ⭐ Portfolio
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Available Creative Tasks</h3>
              {MOCK_CREATIVE_TASKS.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg p-6 border-2 hover:shadow-lg transition ${getStatusColor(task.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-3xl">{getTaskIcon(task.type)}</span>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 mb-1">{task.title}</h4>
                        <p className="text-gray-600">{task.description}</p>
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="text-gray-600">
                            Type: <span className="font-semibold capitalize">{task.type}</span>
                          </span>
                          {task.deadline && (
                            <span className="text-gray-600">
                              Due: <span className="font-semibold">{new Date(task.deadline).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                        task.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : task.status === 'in-progress'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status === 'open' ? '✨ Open' : task.status === 'in-progress' ? '⏳ In Progress' : '✓ Completed'}
                      </span>
                    </div>
                  </div>

                  {task.status === 'open' && (
                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4">
                      Start Working
                    </button>
                  )}

                  {task.status === 'in-progress' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4">
                      Submit Work
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Submissions</h3>
              {submittedWork.length > 0 ? (
                submittedWork.map((submission) => (
                  <div key={submission.id} className={`rounded-lg p-6 border-2 ${getStatusColor(submission.status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-800 mb-1">{submission.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>

                        {submission.status === 'pending' && (
                          <div className="inline-block px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-semibold">
                            ⏳ Awaiting Review
                          </div>
                        )}
                        {submission.status === 'approved' && (
                          <div className="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                            ✓ Approved
                          </div>
                        )}
                        {submission.status === 'needs-revision' && (
                          <div className="inline-block px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-semibold">
                            📝 Needs Revision
                          </div>
                        )}

                        {submission.feedback && (
                          <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-30">
                            <p className="text-sm font-semibold mb-1">Feedback:</p>
                            <p className="text-sm">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No submissions yet. Start a task to submit your creative work!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Creative Portfolio</h3>

              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 border border-purple-300">
                <div className="text-center mb-6">
                  <p className="text-5xl mb-2">⭐</p>
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">Your Creative Impact</h4>
                  <p className="text-gray-700">
                    {submittedWork.filter(w => w.status === 'approved').length} approved works
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center border border-purple-200">
                    <p className="text-3xl font-bold text-purple-600">{submittedWork.length}</p>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-green-200">
                    <p className="text-3xl font-bold text-green-600">
                      {submittedWork.filter(w => w.status === 'approved').length}
                    </p>
                    <p className="text-sm text-gray-600">Approved Works</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
                    <p className="text-3xl font-bold text-blue-600">
                      {submittedWork.filter(w => w.status !== 'approved').length}
                    </p>
                    <p className="text-sm text-gray-600">In Review</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">💡 Portfolio Tips</h4>
                <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                  <li>Your approved works will be featured on the Unity Within platform</li>
                  <li>Share your creative portfolio with friends and family</li>
                  <li>Request feedback from our review team to improve your skills</li>
                  <li>Consider connecting with other creative volunteers for collaboration</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeVolunteerPortal;
