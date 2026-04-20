/**
 * Admin Volunteer Portal
 * For volunteers with administrative responsibilities
 */

import React, { useState, useEffect } from 'react';
import { Check, X, Eye, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { getVolunteerDashboardData } from '../services/volunteerService';

interface AdminVolunteerPortalProps {
  userEmail?: string;
  userName?: string;
}

interface DashboardData {
  id: number;
  first_name: string;
  email: string;
  role_title: string;
}

interface VolunteerApplication {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location: string;
  availability: string;
  category: string;
  roles: string[];
  skills?: string;
  why_volunteer: string;
  mental_health_context?: string;
  work_preference: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface AdminTask {
  id: number;
  title: string;
  description: string;
  category: 'volunteer-management' | 'training' | 'support' | 'reporting';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed';
  dueDate?: string;
}

interface VolunteerReport {
  total: number;
  active: number;
  pending: number;
  byCategory: { [key: string]: number };
}

const MOCK_ADMIN_TASKS: AdminTask[] = [
  {
    id: 1,
    title: 'Review Pending Volunteer Applications',
    description: 'Review and approve/reject new volunteer applications in the queue',
    category: 'volunteer-management',
    priority: 'high',
    status: 'open',
    dueDate: '2024-02-09'
  },
  {
    id: 2,
    title: 'Conduct Monthly Volunteer Training',
    description: 'Host training session for new volunteers on peer support best practices',
    category: 'training',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2024-02-15'
  },
  {
    id: 3,
    title: 'Generate Activity Report',
    description: 'Create monthly volunteer activity and impact report',
    category: 'reporting',
    priority: 'medium',
    status: 'open',
    dueDate: '2024-02-28'
  },
  {
    id: 4,
    title: 'Resolve Support Issues',
    description: 'Address any technical or support issues reported by volunteers',
    category: 'support',
    priority: 'high',
    status: 'open'
  },
  {
    id: 5,
    title: 'Update Volunteer Handbook',
    description: 'Review and update the volunteer handbook with new policies',
    category: 'volunteer-management',
    priority: 'medium',
    status: 'completed'
  }
];

const MOCK_VOLUNTEER_STATS: VolunteerReport = {
  total: 127,
  active: 89,
  pending: 15,
  byCategory: {
    'Community Support': 23,
    'Creative': 18,
    'Technical': 12,
    'Outreach': 21,
    'Admin': 15
  }
};

export const AdminVolunteerPortal: React.FC<AdminVolunteerPortalProps> = ({
  userEmail = '',
  userName = 'Admin Volunteer'
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'tasks' | 'volunteers' | 'reports'>('applications');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState('');
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApplication, setSelectedApplication] = useState<VolunteerApplication | null>(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);

  useEffect(() => {
    if (userEmail) {
      loadDashboardData();
      loadApplications();
    }
  }, [userEmail]);

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    }
  }, [applicationFilter]);

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

  const loadApplications = async () => {
    try {
      setApplicationsLoading(true);
      const url = new URL(`${API_BASE_URL}/api/admin/volunteer-applications`);
      if (applicationFilter !== 'all') {
        url.searchParams.set('status', applicationFilter);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to load applications');
      
      const data = await response.json();
      setApplications(data.data || []);
      setApplicationsError('');
    } catch (err) {
      setApplicationsError(err instanceof Error ? err.message : 'Failed to load applications');
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleApplicationDecision = async (applicationId: number, decision: 'approved' | 'rejected') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/volunteer-applications/${applicationId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: decision })
        }
      );

      if (!response.ok) throw new Error(`Failed to ${decision} application`);

      // Update the application in the local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: decision } : app
        )
      );

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication({ ...selectedApplication, status: decision });
      }

      // Show success message and refresh
      setTimeout(() => {
        loadApplications();
      }, 500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update application');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'volunteer-management': '👥',
      training: '📚',
      support: '🆘',
      reporting: '📊'
    };
    return icons[category] || '⭐';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      open: 'bg-blue-50 border-blue-200',
      'in-progress': 'bg-yellow-50 border-yellow-200',
      completed: 'bg-green-50 border-green-200'
    };
    return colors[status] || 'bg-gray-50 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">⚙️ Welcome, {dashboardData?.first_name || userName}!</h1>
        <p className="text-gray-600 text-lg">Admin Volunteer Management Portal</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border border-purple-200 shadow-lg">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total Volunteers</p>
          <p className="text-4xl font-bold text-purple-600">{MOCK_VOLUNTEER_STATS.total}</p>
          <p className="text-xs text-gray-500 mt-2">Across all categories</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-green-200 shadow-lg">
          <p className="text-gray-600 text-sm font-semibold mb-2">Active Volunteers</p>
          <p className="text-4xl font-bold text-green-600">{MOCK_VOLUNTEER_STATS.active}</p>
          <p className="text-xs text-gray-500 mt-2">Currently in service</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-orange-200 shadow-lg">
          <p className="text-gray-600 text-sm font-semibold mb-2">Pending Approvals</p>
          <p className="text-4xl font-bold text-orange-600">{MOCK_VOLUNTEER_STATS.pending}</p>
          <p className="text-xs text-gray-500 mt-2">Awaiting review</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-blue-200 shadow-lg">
          <p className="text-gray-600 text-sm font-semibold mb-2">Categories</p>
          <p className="text-4xl font-bold text-blue-600">5</p>
          <p className="text-xs text-gray-500 mt-2">Volunteer types</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow mb-6 border border-purple-200">
        <div className="flex border-b border-purple-200 flex-wrap">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'applications'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Applications ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'tasks'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Admin Tasks ({MOCK_ADMIN_TASKS.filter(t => t.status !== 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'volunteers'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 Volunteer Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === 'reports'
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Reports
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">📋 Volunteer Applications</h3>
                {applicationsError && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700">{applicationsError}</p>
                  </div>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setApplicationFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    applicationFilter === 'all'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({applications.length})
                </button>
                <button
                  onClick={() => setApplicationFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    applicationFilter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pending ({applications.filter(a => a.status === 'pending').length})
                </button>
                <button
                  onClick={() => setApplicationFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    applicationFilter === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Approved ({applications.filter(a => a.status === 'approved').length})
                </button>
                <button
                  onClick={() => setApplicationFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    applicationFilter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Rejected ({applications.filter(a => a.status === 'rejected').length})
                </button>
              </div>

              {/* Applications List */}
              {applicationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading applications...</p>
                  </div>
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <p className="text-gray-600 text-lg">No applications found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-lg border-2 border-gray-200 hover:border-pink-300 hover:shadow-lg transition p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800">
                            {app.first_name} {app.last_name}
                          </h4>
                          <p className="text-gray-600">{app.email}</p>
                          <p className="text-sm text-gray-500">{app.location}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                              app.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : app.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {app.status === 'pending'
                              ? '⏳ Pending'
                              : app.status === 'approved'
                              ? '✓ Approved'
                              : '✕ Rejected'}
                          </span>
                        </div>
                      </div>

                      {/* Application Details Preview */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs font-semibold">Category</p>
                          <p className="text-gray-800 font-bold">{app.category}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs font-semibold">Availability</p>
                          <p className="text-gray-800 font-bold">{app.availability}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs font-semibold">Phone</p>
                          <p className="text-gray-800 font-bold">{app.phone || 'Not provided'}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-gray-600 text-xs font-semibold">Applied</p>
                          <p className="text-gray-800 font-bold">{new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Roles */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">Interested Roles:</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(app.roles) && app.roles.map((role, idx) => (
                            <span key={idx} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Why Volunteer */}
                      <div className="mb-4 bg-gray-50 rounded-lg p-3 border-l-4 border-pink-600">
                        <p className="text-sm font-semibold text-gray-600 mb-1">Why Volunteer:</p>
                        <p className="text-gray-800 text-sm">{app.why_volunteer}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowApplicationDetails(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                        >
                          <Eye size={16} />
                          View Details
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApplicationDecision(app.id, 'approved')}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                            >
                              <Check size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleApplicationDecision(app.id, 'rejected')}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                            >
                              <X size={16} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Application Details Modal */}
          {showApplicationDetails && selectedApplication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </h3>
                    <p className="text-gray-600">{selectedApplication.email}</p>
                  </div>
                  <button
                    onClick={() => setShowApplicationDetails(false)}
                    className="text-gray-600 hover:text-gray-800 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Status Badge */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Status</h4>
                    <span
                      className={`inline-block px-4 py-2 rounded-lg font-semibold text-sm ${
                        selectedApplication.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedApplication.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedApplication.status === 'pending'
                        ? '⏳ Pending Review'
                        : selectedApplication.status === 'approved'
                        ? '✓ Approved'
                        : '✕ Rejected'}
                    </span>
                  </div>

                  {/* Personal Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Email</h4>
                      <p className="text-gray-800">{selectedApplication.email}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Phone</h4>
                      <p className="text-gray-800">{selectedApplication.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Location</h4>
                      <p className="text-gray-800">{selectedApplication.location}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Category</h4>
                      <p className="text-gray-800">{selectedApplication.category}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Availability</h4>
                      <p className="text-gray-800">{selectedApplication.availability}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Work Preference</h4>
                      <p className="text-gray-800">{selectedApplication.work_preference}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Applied On</h4>
                      <p className="text-gray-800">{new Date(selectedApplication.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Roles */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Interested Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedApplication.roles) && selectedApplication.roles.map((role, idx) => (
                        <span key={idx} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Why Volunteer */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Why They Want to Volunteer</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-pink-600">
                      <p className="text-gray-800">{selectedApplication.why_volunteer}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {selectedApplication.skills && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Skills</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800">{selectedApplication.skills}</p>
                      </div>
                    </div>
                  )}

                  {/* Mental Health Context */}
                  {selectedApplication.mental_health_context && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Mental Health Context</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800">{selectedApplication.mental_health_context}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedApplication.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Additional Notes</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-800">{selectedApplication.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap pt-4 border-t border-gray-200">
                    {selectedApplication.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleApplicationDecision(selectedApplication.id, 'approved');
                            setShowApplicationDetails(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex-1"
                        >
                          <Check size={16} />
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleApplicationDecision(selectedApplication.id, 'rejected');
                            setShowApplicationDetails(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex-1"
                        >
                          <X size={16} />
                          Reject Application
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowApplicationDetails(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition flex-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Administrative Tasks</h3>
              {MOCK_ADMIN_TASKS.map((task) => (
                <div
                  key={task.id}
                  className={`rounded-lg p-6 border-2 hover:shadow-lg transition ${getStatusColor(task.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                        <h4 className="text-lg font-bold text-gray-800">{task.title}</h4>
                      </div>
                      <p className="text-gray-700 mb-3 ml-11">{task.description}</p>
                      <div className="flex gap-4 text-sm ml-11 flex-wrap">
                        <span className="text-gray-600 capitalize">
                          Category: <span className="font-semibold">{task.category.replace('-', ' ')}</span>
                        </span>
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                        {task.dueDate && (
                          <span className="text-gray-600">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
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
                        {task.status === 'open' ? '🔵 Open' : task.status === 'in-progress' ? '⏳ In Progress' : '✓ Done'}
                      </div>
                    </div>
                  </div>

                  {task.status === 'open' && (
                    <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4 ml-11">
                      Start Task
                    </button>
                  )}
                  {task.status === 'in-progress' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition mt-4 ml-11">
                      View Progress
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'volunteers' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Volunteer Distribution by Category</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart Style */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                  <h4 className="font-bold text-gray-800 mb-6">Volunteers by Category</h4>
                  <div className="space-y-3">
                    {Object.entries(MOCK_VOLUNTEER_STATS.byCategory).map(([category, count]) => {
                      const percentage = (count / MOCK_VOLUNTEER_STATS.total) * 100;
                      const colors = [
                        'bg-purple-500',
                        'bg-pink-500',
                        'bg-blue-500',
                        'bg-green-500',
                        'bg-yellow-500'
                      ];
                      const colorIndex = Object.keys(MOCK_VOLUNTEER_STATS.byCategory).indexOf(category);
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{category}</span>
                            <span className="font-bold text-gray-800">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${colors[colorIndex % colors.length]} h-2 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-6">Volunteer Status</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition cursor-pointer">
                      <div>
                        <p className="font-bold text-gray-800">Active Volunteers</p>
                        <p className="text-sm text-gray-600">Currently engaged</p>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{MOCK_VOLUNTEER_STATS.active}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 hover:shadow-md transition cursor-pointer">
                      <div>
                        <p className="font-bold text-gray-800">Pending Approval</p>
                        <p className="text-sm text-gray-600">Waiting for review</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">{MOCK_VOLUNTEER_STATS.pending}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition cursor-pointer">
                      <div>
                        <p className="font-bold text-gray-800">Inactive</p>
                        <p className="text-sm text-gray-600">Not currently active</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-600">
                        {MOCK_VOLUNTEER_STATS.total - MOCK_VOLUNTEER_STATS.active - MOCK_VOLUNTEER_STATS.pending}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2">💡 Actions</h4>
                <div className="flex gap-3 flex-wrap">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition text-sm">
                    📋 Review Pending Applications
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition text-sm">
                    📊 Generate Report
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition text-sm">
                    📧 Send Announcement
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Volunteer Program Reports</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Monthly Activity Report', icon: '📈', desc: 'Hours, calls, and contribution metrics' },
                  { title: 'Volunteer Performance', icon: '⭐', desc: 'Ratings, feedback, and impact scores' },
                  { title: 'Training Completion', icon: '📚', desc: 'Training sessions and certifications' },
                  { title: 'Peer Support Statistics', icon: '🎧', desc: 'Call volume, types, and outcomes' }
                ].map((report, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-6 border border-purple-200 hover:shadow-lg transition cursor-pointer"
                  >
                    <p className="text-3xl mb-3">{report.icon}</p>
                    <h4 className="font-bold text-gray-800 mb-2">{report.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{report.desc}</p>
                    <button className="text-purple-600 hover:text-purple-800 font-semibold text-sm">
                      Generate Report →
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <h4 className="font-bold text-purple-900 mb-4">📊 Quick Stats</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-gray-600 text-sm mb-1">Total Hours Volunteered</p>
                    <p className="text-3xl font-bold text-purple-600">2,847</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-pink-200">
                    <p className="text-gray-600 text-sm mb-1">Peer Support Calls</p>
                    <p className="text-3xl font-bold text-pink-600">324</p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-gray-600 text-sm mb-1">Volunteer Satisfaction</p>
                    <p className="text-3xl font-bold text-green-600">4.6/5</p>
                    <p className="text-xs text-gray-500 mt-1">Avg. rating</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVolunteerPortal;
