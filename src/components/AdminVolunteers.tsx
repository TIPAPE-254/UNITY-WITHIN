import React, { useState, useEffect } from 'react';
import { Mail, Copy, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, Users, Eye, Trash2, Shield } from 'lucide-react';
import {
  sendVolunteerInvite,
  getVolunteerInvites,
  approveVolunteer,
  rejectVolunteer,
  copyInviteLink,
  getAdminVolunteers,
  getVolunteerActivity,
  deleteVolunteer,
  deleteInvite,
  approveInviteSubmission,
  rejectInviteSubmission
} from '../services/volunteerService';
import { VolunteerRBACManager } from './VolunteerRBACManager';

interface VolunteerInvite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'active' | 'inactive' | 'rejected';
  inviteToken: string;
  inviteLink: string;
  invitedAt: string;
  approvedAt?: string;
  invitedBy: string;
}

interface AdminVolunteer {
  id: number;
  name?: string;
  email: string;
  status: string;
  hours_contributed?: number;
}

interface VolunteerApplication {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  location?: string;
  category?: string;
  availability?: string;
  roles?: unknown;
  skills?: string;
  why_volunteer: string;
  status: 'pending' | 'pending_admin_review' | 'approved' | 'rejected';
  created_at: string;
  invite_id?: number;
}

interface ApprovedVolunteer {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  approved_at?: string | null;
  activated_at?: string | null;
  role_id?: number | null;
  role_name?: string | null;
  role_display_name?: string | null;
}

interface AdminVolunteersProps {
  onNavigate?: (view: string) => void;
  adminName?: string;
}

export const AdminVolunteers: React.FC<AdminVolunteersProps> = ({ onNavigate, adminName = 'Admin' }) => {
  const [volunteers, setVolunteers] = useState<VolunteerInvite[]>([]);
  const [adminVolunteers, setAdminVolunteers] = useState<AdminVolunteer[]>([]);
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState<ApprovedVolunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'manage' | 'applications' | 'approved' | 'tracking' | 'rbac'>('manage');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [existingInviteLink, setExistingInviteLink] = useState<string | null>(null);
  const [selectedRBACVolunteer, setSelectedRBACVolunteer] = useState<AdminVolunteer | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<VolunteerApplication | null>(null);
  const [approvingWithRole, setApprovingWithRole] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rbacRoles, setRbacRoles] = useState<any[]>([]);
  const [activityVolunteer, setActivityVolunteer] = useState<AdminVolunteer | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityData, setActivityData] = useState<any>(null);
  const [selectedInviteLink, setSelectedInviteLink] = useState<VolunteerInvite | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('listener');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const isPendingApplication = (status: VolunteerApplication['status']) =>
    status === 'pending_admin_review' || status === 'pending';

  const getApplicationRoles = (app: VolunteerApplication): string[] => {
    const raw = app.roles;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const volunteerRoles = [
    { id: 'listener', label: 'Community Listener' },
    { id: 'advocate', label: 'Mental Health Advocate' },
    { id: 'ambassador', label: 'Outreach Ambassador' },
    { id: 'content', label: 'Content & Story Volunteer' },
    { id: 'wellness', label: 'Wellness Program Support' },
    { id: 'tech', label: 'Tech Support Volunteer' }
  ];

  // Fetch volunteers on mount
  useEffect(() => {
    fetchVolunteers();
    fetchAdminVolunteers();
    fetchApplications();
    fetchApprovedVolunteers();
    fetchRoles();
  }, []);

  const getAdminAuthHeaders = (extra?: Record<string, string>) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('unity_user');
    let storedEmail: string | undefined;
    if (storedUser) {
      try {
        storedEmail = (JSON.parse(storedUser)?.email as string | undefined) || undefined;
      } catch {
        storedEmail = undefined;
      }
    }

    const headers: Record<string, string> = {
      ...(extra || {}),
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (storedEmail) headers['x-user-email'] = storedEmail;

    return headers;
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/volunteer-applications', {
        headers: getAdminAuthHeaders()
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch applications');
      }
      setApplications(data?.data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchApprovedVolunteers = async () => {
    try {
      const response = await fetch('/api/admin/approved-volunteers', {
        headers: getAdminAuthHeaders()
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to fetch approved volunteers');
      }
      setApprovedVolunteers(data?.data || []);
    } catch (err) {
      console.error('Error fetching approved volunteers:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/volunteer-rbac/roles', {
        headers: getAdminAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRbacRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const data = await getVolunteerInvites();
      setVolunteers(data.invites || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch volunteers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminVolunteers = async () => {
    try {
      const data = await getAdminVolunteers();
      setAdminVolunteers(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch volunteer tracking data');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRole) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await sendVolunteerInvite(inviteEmail, inviteRole, adminName);
      console.log('Invite result:', result);
      
      if (result.success) {
        const sentMessage = result.emailSent === false
          ? `✓ Invite created for ${inviteEmail}. Email not sent (copy link below to share)`
          : `✓ Invitation sent to ${inviteEmail}`;
        setSuccess(sentMessage);
        setInviteEmail('');
        setInviteRole('listener');
        setExistingInviteLink(result.inviteLink || null);
        console.log('Setting invite link:', result.inviteLink);
        await fetchVolunteers();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.message || 'Failed to send invitation');
        setExistingInviteLink(result.inviteLink || null);
      }
    } catch (err) {
      console.error('Send invite error:', err);
      setError(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInviteLink = (invite: VolunteerInvite) => {
    setSelectedInviteLink(invite);
  };

  const handleApproveVolunteer = async (inviteId: string) => {
    try {
      setLoading(true);
      await approveVolunteer(inviteId);
      setSuccess('Volunteer approved!');
      await fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectVolunteer = async (inviteId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      await rejectVolunteer(inviteId, rejectionReason);
      setSuccess('Volunteer rejected');
      setRejectingId(null);
      setRejectionReason('');
      await fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (inviteLink: string, volunteerEmail: string) => {
    if (!inviteLink) {
      setError('No invite link available for this volunteer');
      return;
    }
    
    try {
      console.log('Copying invite link:', inviteLink);
      await copyInviteLink(inviteLink);
      setCopiedId(volunteerEmail);
      setSuccess('Link copied to clipboard!');
      setTimeout(() => {
        setCopiedId(null);
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Copy error:', err);
      // Fallback: show the link so user can manually copy
      setError(`Failed to auto-copy. Link: ${inviteLink}`);
      // Still show as copied for visual feedback
      setCopiedId(volunteerEmail);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleViewActivity = async (volunteer: AdminVolunteer) => {
    try {
      setActivityLoading(true);
      setActivityVolunteer(volunteer);
      const data = await getVolunteerActivity(volunteer.id);
      setActivityData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load volunteer activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleDeleteVolunteer = async (volunteer: AdminVolunteer) => {
    const confirmed = window.confirm(`Delete volunteer ${volunteer.email}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteVolunteer(volunteer.id);
      setSuccess('Volunteer deleted');
      await fetchAdminVolunteers();
      await fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete volunteer');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (invite: VolunteerInvite) => {
    const confirmed = window.confirm(`Delete invite for ${invite.email}? They won't be able to access the link.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteInvite(invite.id);
      setSuccess('Invite deleted');
      await fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete invite');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInvite = async (invite: VolunteerInvite) => {
    const confirmed = window.confirm(`Approve ${invite.email}? They will be marked as active.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      await approveInviteSubmission(invite.id);
      setSuccess('Volunteer approved');
      await fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve invite');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvite = async (invite: VolunteerInvite) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      setLoading(true);
      await rejectInviteSubmission(invite.id, reason || undefined);
      setSuccess('Volunteer rejected');
      await fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject invite');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (appId: number) => {
    if (!selectedRoleId) {
      setError('Please select a role');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/volunteer-application/${appId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rbacRoleId: selectedRoleId })
      });

      if (!response.ok) {
        throw new Error('Failed to approve application');
      }

      const data = await response.json();
      setSuccess('Application approved! Email sent to volunteer.');
      setSelectedApplication(null);
      setApprovingWithRole(null);
      setSelectedRoleId(null);
      await fetchApplications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectApplication = async (appId: number) => {
    if (!window.confirm('Reject this application?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/volunteer-applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      setSuccess('Application rejected');
      setSelectedApplication(null);
      await fetchApplications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
      case 'pending_admin_review':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'pending':
      case 'pending_admin_review':
        return <Clock size={18} className="text-yellow-600" />;
      case 'rejected':
        return <XCircle size={18} className="text-red-600" />;
      default:
        return <AlertCircle size={18} className="text-gray-600" />;
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    // Show all volunteers in manage tab
    return tab === 'manage';
  });

  const stats = {
    total: volunteers.length,
    pending: volunteers.filter(v => v.status === 'pending').length,
    approved: volunteers.filter(v => ['approved', 'active'].includes(v.status)).length,
    active: volunteers.filter(v => v.status === 'active').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Volunteer Management</h1>
          <p className="text-gray-600">Invite, track, and manage volunteers</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
          </div>
        )}

        {existingInviteLink && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2">📋 Invitation Link Ready</h3>
                <p className="text-sm text-blue-800 mb-2">Copy this link and send it manually to the volunteer:</p>
                <code className="block bg-white p-2 rounded text-xs text-blue-900 break-all mb-2 border border-blue-200">
                  {existingInviteLink}
                </code>
              </div>
              <button
                onClick={() => handleCopyLink(existingInviteLink, 'existing-invite')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                {copiedId === 'existing-invite' ? (
                  <>
                    <CheckCircle size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Volunteers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users size={40} className="text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Pending Approval</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <Clock size={40} className="text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Approved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
              </div>
              <CheckCircle size={40} className="text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Active</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <TrendingUp size={40} className="text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Send New Invitation</h2>
          
          <form onSubmit={handleSendInvite} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Volunteer Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="volunteer@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Volunteer Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                >
                  {volunteerRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Send Invitation
            </button>
          </form>
        </div>

        {/* Volunteers List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 flex-wrap">
            <button
              onClick={() => setTab('manage')}
              className={`flex-1 min-w-[150px] px-6 py-4 font-semibold transition-colors ${
                tab === 'manage'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Send Invites ({volunteers.length})
            </button>
            <button
              onClick={() => setTab('applications')}
              className={`flex-1 min-w-[150px] px-6 py-4 font-semibold transition-colors ${
                tab === 'applications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Applications ({applications.length})
            </button>
            <button
              onClick={() => setTab('approved')}
              className={`flex-1 min-w-[150px] px-6 py-4 font-semibold transition-colors ${
                tab === 'approved'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved Volunteers ({approvedVolunteers.length})
            </button>
            <button
              onClick={() => setTab('tracking')}
              className={`flex-1 min-w-[150px] px-6 py-4 font-semibold transition-colors ${
                tab === 'tracking'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Work Tracking ({adminVolunteers.length})
            </button>
            <button
              onClick={() => setTab('rbac')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                tab === 'rbac'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield size={18} />
              Permissions
            </button>
          </div>

          {/* Volunteers Table/Content */}
          <div className="overflow-x-auto">
            {tab === 'applications' ? (
              <div className="p-6">
                {selectedApplication ? (
                  // Detailed application view with approval
                  <div className="max-w-2xl">
                    <button
                      onClick={() => setSelectedApplication(null)}
                      className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                    >
                      ← Back to Applications
                    </button>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedApplication.first_name} {selectedApplication.last_name}</h2>
                      <p className="text-gray-600 font-medium mb-6">{selectedApplication.email}</p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Phone</p>
                          <p className="text-sm text-gray-900">{selectedApplication.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Location</p>
                          <p className="text-sm text-gray-900">{selectedApplication.location || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Category</p>
                          <p className="text-sm text-gray-900">{selectedApplication.category || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">Availability</p>
                          <p className="text-sm text-gray-900">{selectedApplication.availability || 'Not specified'}</p>
                        </div>
                      </div>

                      {getApplicationRoles(selectedApplication).length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs text-gray-600 font-semibold mb-2">Roles</p>
                          <div className="flex flex-wrap gap-2">
                            {getApplicationRoles(selectedApplication).map((role) => (
                              <span
                                key={role}
                                className="px-3 py-1 bg-white border border-blue-100 rounded-full text-xs font-semibold text-gray-800"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-6">
                        <p className="text-xs text-gray-600 font-semibold mb-2">Why Volunteer</p>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded border border-blue-100">
                          {selectedApplication.why_volunteer}
                        </p>
                      </div>

                      {selectedApplication.skills && (
                        <div className="mb-6">
                          <p className="text-xs text-gray-600 font-semibold mb-2">Skills</p>
                          <p className="text-sm text-gray-900">{selectedApplication.skills}</p>
                        </div>
                      )}

                      <div className="border-t border-blue-200 pt-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Approve & Assign Role</h3>

                        {!isPendingApplication(selectedApplication.status) ? (
                          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${getStatusColor(selectedApplication.status)}`}>
                            {getStatusIcon(selectedApplication.status)}
                            <span className="text-sm font-semibold">
                              {selectedApplication.status === 'approved'
                                ? 'This application is already approved.'
                                : selectedApplication.status === 'rejected'
                                  ? 'This application was rejected.'
                                  : 'This application is not pending review.'}
                            </span>
                          </div>
                         ) : (

                         approvingWithRole === selectedApplication.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select RBAC Role *</label>
                              <select
                                value={selectedRoleId || ''}
                                onChange={(e) => setSelectedRoleId(Number(e.target.value) || null)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">-- Select Role --</option>
                                {rbacRoles.map(role => (
                                  <option key={role.id} value={role.id}>
                                    {role.display_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveApplication(selectedApplication.id)}
                                disabled={loading || !selectedRoleId}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                              >
                                {loading ? 'Approving...' : 'Confirm Approval'}
                              </button>
                              <button
                                onClick={() => setApprovingWithRole(null)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setApprovingWithRole(selectedApplication.id)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectApplication(selectedApplication.id)}
                              disabled={loading}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )

                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // List of applications
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications</h2>

                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        value={applicationSearch}
                        onChange={(e) => setApplicationSearch(e.target.value)}
                        placeholder="Search by name or email"
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={applicationStatusFilter}
                        onChange={(e) => setApplicationStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {applications.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">
                          <p>No applications</p>
                        </div>
                      ) : (
                        applications
                          .slice()
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .filter((app) => {
                            if (applicationStatusFilter === 'pending' && !isPendingApplication(app.status)) return false;
                            if (applicationStatusFilter === 'approved' && app.status !== 'approved') return false;
                            if (applicationStatusFilter === 'rejected' && app.status !== 'rejected') return false;

                            const q = applicationSearch.trim().toLowerCase();
                            if (!q) return true;
                            const name = `${app.first_name || ''} ${app.last_name || ''}`.trim().toLowerCase();
                            const email = String(app.email || '').toLowerCase();
                            return name.includes(q) || email.includes(q);
                          })
                          .map(app => (
                            <div
                              key={app.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                              onClick={() => setSelectedApplication(app)}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{app.first_name} {app.last_name}</p>
                                <p className="text-sm text-gray-600">{app.email}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.status)}`}>
                                {app.status === 'pending_admin_review' || app.status === 'pending'
                                  ? 'Pending Review'
                                  : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : tab === 'approved' ? (
              <div className="p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Approved Volunteers (DB)</h2>
                  <button
                    onClick={fetchApprovedVolunteers}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                  >
                    Refresh
                  </button>
                </div>

                 {approvedVolunteers.length === 0 ? (
                   <div className="text-center py-10 text-gray-600">
                     <p>No approved volunteers found.</p>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full">
                       <thead className="bg-gray-50 border-b border-gray-200">
                         <tr>
                           <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                           <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                           <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                           <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Approved</th>
                           <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Activated</th>
                           <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                         </tr>
                       </thead>
                       <tbody>
                         {approvedVolunteers.map((row) => {
                           const name = `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—';
                           const role = row.role_display_name || row.role_name || '—';
                           const approvedAt = row.approved_at ? new Date(row.approved_at).toLocaleDateString() : '—';
                           const activatedAt = row.activated_at ? new Date(row.activated_at).toLocaleDateString() : 'Not yet';
                           const profileUrl = `/volunteer/${encodeURIComponent(row.email)}`;
                           return (
                             <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                               <td className="px-6 py-4 text-sm text-gray-900">{name}</td>
                               <td className="px-6 py-4 text-sm text-gray-900">{row.email}</td>
                               <td className="px-6 py-4 text-sm text-gray-700">{role}</td>
                               <td className="px-6 py-4 text-sm text-gray-700">{approvedAt}</td>
                               <td className="px-6 py-4 text-sm">
                                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                   row.activated_at
                                     ? 'bg-green-50 border-green-200 text-green-800'
                                     : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                 }`}>
                                   {activatedAt}
                                 </span>
                               </td>
                               <td className="px-6 py-4 text-sm">
                                 <a
                                   href={profileUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                                 >
                                   <Eye size={14} />
                                   View Profile
                                 </a>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
              </div>
            ) : tab === 'rbac' ? (
              <div className="p-6">
                {selectedRBACVolunteer ? (
                  <div>
                    <button
                      onClick={() => setSelectedRBACVolunteer(null)}
                      className="mb-4 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                    >
                      ← Back to Volunteers
                    </button>
                    <VolunteerRBACManager
                      volunteerId={selectedRBACVolunteer.id}
                      onClose={() => setSelectedRBACVolunteer(null)}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Volunteer Permissions (RBAC)</h3>
                    <div className="space-y-2">
                      {adminVolunteers.length === 0 ? (
                        <div className="py-8 text-center text-gray-600">
                          <Shield size={40} className="mx-auto mb-2 opacity-50" />
                          <p>No volunteers found. Create volunteers first to manage permissions.</p>
                        </div>
                      ) : (
                        adminVolunteers.map(volunteer => (
                          <div
                            key={volunteer.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                            onClick={() => setSelectedRBACVolunteer(volunteer)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                                {(volunteer.name || volunteer.email).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{volunteer.name || 'Volunteer'}</p>
                                <p className="text-sm text-gray-600">{volunteer.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                volunteer.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {volunteer.status}
                              </span>
                              <Shield className="text-blue-600" size={20} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : tab === 'tracking' ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Volunteer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hours</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                        No volunteers available for tracking
                      </td>
                    </tr>
                  ) : (
                    adminVolunteers.map(volunteer => (
                      <tr key={volunteer.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                              {(volunteer.name || volunteer.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{volunteer.name || 'Volunteer'}</p>
                              <p className="text-xs text-gray-500">{volunteer.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(volunteer.status)}`}>
                            {getStatusIcon(volunteer.status)}
                            {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {Number(volunteer.hours_contributed || 0).toFixed(1)}h
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewActivity(volunteer)}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition-colors flex items-center gap-1"
                            >
                              <Eye size={14} />
                              View Activity
                            </button>
                            <button
                              onClick={() => handleDeleteVolunteer(volunteer)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors flex items-center gap-1"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invited</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                        No volunteers found
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map(volunteer => (
                      <tr key={volunteer.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                              {volunteer.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{volunteer.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {volunteerRoles.find(r => r.id === volunteer.role)?.label || volunteer.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(volunteer.status)}`}>
                            {getStatusIcon(volunteer.status)}
                            {volunteer.status.charAt(0).toUpperCase() + volunteer.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(volunteer.invitedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {volunteer.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleViewInviteLink(volunteer)}
                                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition-colors flex items-center gap-1"
                                  title="View invite link"
                                >
                                  <Eye size={14} />
                                  View Link
                                </button>
                                <button
                                  onClick={() => handleApproveVolunteer(volunteer.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200 transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectingId(volunteer.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleDeleteInvite(volunteer)}
                                  disabled={loading}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                  title="Delete invite"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleCopyLink(volunteer.inviteLink, volunteer.email)}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors flex items-center gap-1"
                            >
                              {copiedId === volunteer.email ? (
                                <>
                                  <CheckCircle size={14} />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy Link
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteVolunteer({ id: Number(volunteer.id), email: volunteer.email, status: volunteer.status })}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors flex items-center gap-1"
                              title="Delete volunteer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Activity Modal */}
        {activityVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Volunteer Activity</h3>
                  <p className="text-sm text-gray-600">{activityVolunteer.email}</p>
                </div>
                <button
                  onClick={() => {
                    setActivityVolunteer(null);
                    setActivityData(null);
                  }}
                  className="px-3 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
              </div>

              {activityLoading ? (
                <p className="text-gray-600">Loading activity...</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-xs text-purple-700 font-semibold">Total Hours</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {Number(activityData?.summary?.total_hours || 0).toFixed(1)}h
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-700 font-semibold">Tasks</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {activityData?.tasks?.length || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-green-700 font-semibold">Status</p>
                      <p className="text-2xl font-bold text-green-900">
                        {activityData?.summary?.status || activityVolunteer.status}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Hours Log</h4>
                    {activityData?.hours?.length ? (
                      <div className="space-y-2">
                        {activityData.hours.map((entry: any) => (
                          <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{entry.description || 'Logged hours'}</p>
                              <p className="text-xs text-gray-500">{new Date(entry.logged_at).toLocaleString()}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{Number(entry.hours || 0).toFixed(1)}h</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No hours logged yet.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Tasks</h4>
                    {activityData?.tasks?.length ? (
                      <div className="space-y-2">
                        {activityData.tasks.map((task: any) => (
                          <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                              <p className="text-xs text-gray-500">{task.category || 'General'}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {task.completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No tasks assigned yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invite Link Modal */}
        {selectedInviteLink && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Invite Link</h3>
                  <p className="text-sm text-gray-600">{selectedInviteLink.email}</p>
                </div>
                <button
                  onClick={() => setSelectedInviteLink(null)}
                  className="px-3 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-300"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Link Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedInviteLink.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {volunteerRoles.find(r => r.id === selectedInviteLink.role)?.label || selectedInviteLink.role}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{selectedInviteLink.status}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Invited At</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedInviteLink.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Invitation Link</p>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <code className="block text-xs text-blue-900 break-all font-mono mb-3 p-3 bg-white rounded border border-blue-200">
                      {selectedInviteLink.inviteLink}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInviteLink.inviteLink);
                        setCopiedId(selectedInviteLink.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {copiedId === selectedInviteLink.id ? (
                        <>
                          <CheckCircle size={16} />
                          Copied to Clipboard
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Share this link with {selectedInviteLink.email} to activate their volunteer account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Volunteer</h3>
              <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-600 focus:outline-none mb-6 resize-none"
                rows={4}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRejectingId(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRejectVolunteer(rejectingId)}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
