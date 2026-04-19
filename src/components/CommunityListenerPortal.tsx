/**
 * Community Listener Portal
 * Support & Community volunteers with peer support capabilities
 */

import React, { useState, useEffect } from 'react';
import { getVolunteerDashboardData } from '../services/volunteerService';
import ListenerQueue from './ListenerQueue';

interface CommunityListenerPortalProps {
  userEmail?: string;
  userName?: string;
}

interface DashboardData {
  id: number;
  first_name: string;
  email: string;
  role_title: string;
  is_available: boolean;
  calls_handled?: number;
  average_rating?: number;
}

export const CommunityListenerPortal: React.FC<CommunityListenerPortalProps> = ({
  userEmail = '',
  userName = 'Community Volunteer'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'stats' | 'training'>('queue');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">👋 Welcome, {dashboardData?.first_name || userName}!</h1>
        <p className="text-gray-600 text-lg">Community Listener Portal</p>
      </div>

      {/* Role Info Card */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-lg">
            <p className="text-gray-600 text-sm font-semibold mb-1">Role</p>
            <p className="text-2xl font-bold text-gray-800">{dashboardData.role_title}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-lg">
            <p className="text-gray-600 text-sm font-semibold mb-1">Calls Handled</p>
            <p className="text-2xl font-bold text-green-600">{dashboardData.calls_handled || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-purple-200 shadow-lg">
            <p className="text-gray-600 text-sm font-semibold mb-1">Average Rating</p>
            <p className="text-2xl font-bold text-yellow-600">{dashboardData.average_rating?.toFixed(1) || 'N/A'} ⭐</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 border border-purple-200">
        <div className="flex border-b border-purple-200">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'queue'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎧 Call Queue
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'stats'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'training'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📚 Resources
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'queue' && <ListenerQueue userEmail={userEmail} userName={dashboardData?.first_name} />}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Impact</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-lg p-6 border border-purple-200">
                    <p className="text-gray-600 text-sm mb-2">Total Calls Handled</p>
                    <p className="text-4xl font-bold text-purple-600 mb-2">{dashboardData?.calls_handled || 0}</p>
                    <p className="text-xs text-gray-500">This month and beyond</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-pink-200">
                    <p className="text-gray-600 text-sm mb-2">Avg. Client Rating</p>
                    <p className="text-4xl font-bold text-pink-600 mb-2">{dashboardData?.average_rating?.toFixed(1) || '5.0'}/5</p>
                    <p className="text-xs text-gray-500">Based on client feedback</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 You are making a real difference in clients' lives. Every call you take helps someone during a difficult moment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">📚 Training & Resources</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Active Listening Skills',
                    desc: 'Learn techniques to truly hear and support clients',
                    icon: '👂'
                  },
                  {
                    title: 'Mental Health Basics',
                    desc: 'Understanding common mental health conditions',
                    icon: '🧠'
                  },
                  {
                    title: 'Crisis Response',
                    desc: 'How to respond to clients in crisis situations',
                    icon: '🆘'
                  },
                  {
                    title: 'Self-Care for Listeners',
                    desc: 'Protecting your own wellbeing while supporting others',
                    icon: '💚'
                  }
                ].map((resource, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-6 border border-purple-200 hover:shadow-lg transition cursor-pointer">
                    <p className="text-3xl mb-2">{resource.icon}</p>
                    <h4 className="font-bold text-gray-800 mb-2">{resource.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{resource.desc}</p>
                    <button className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
                      Learn More →
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                <h4 className="font-bold text-amber-900 mb-2">🎯 Helpful Guidelines</h4>
                <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
                  <li>Listen without judgment and offer genuine empathy</li>
                  <li>Maintain confidentiality unless there's an immediate safety concern</li>
                  <li>Know your limits - refer clients to professional help when needed</li>
                  <li>Practice self-care and take breaks when feeling overwhelmed</li>
                  <li>Report concerning situations to your supervisor immediately</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Resources */}
      <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
        <h4 className="font-bold text-red-900 mb-3">🚨 Emergency Resources for Clients</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-red-900">National Suicide Prevention Lifeline</p>
            <p className="text-red-800">1-800-273-8255 (available 24/7)</p>
          </div>
          <div>
            <p className="font-semibold text-red-900">Crisis Text Line</p>
            <p className="text-red-800">Text HOME to 741741</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityListenerPortal;
