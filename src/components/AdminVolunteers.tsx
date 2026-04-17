import React, { useState, useEffect } from 'react';
import { Mail, Copy, CheckCircle, Clock, XCircle, AlertCircle, User, TrendingUp, Users, MessageCircle } from 'lucide-react';
import { 
  sendVolunteerInvite, 
  getVolunteerInvites, 
  approveVolunteer, 
  rejectVolunteer,
  copyInviteLink
} from '../services/volunteerService';

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

interface AdminVolunteersProps {
  onNavigate?: (view: string) => void;
  adminName?: string;
}

export const AdminVolunteers: React.FC<AdminVolunteersProps> = ({ onNavigate, adminName = 'Admin' }) => {
  const [volunteers, setVolunteers] = useState<VolunteerInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'manage' | 'pending' | 'approved'>('manage');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('listener');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

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
  }, []);

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
      
      if (result.success) {
        setSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('listener');
        await fetchVolunteers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setLoading(false);
    }
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
    try {
      await copyInviteLink(inviteLink);
      setCopiedId(volunteerEmail);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'pending':
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
        return <Clock size={18} className="text-yellow-600" />;
      case 'rejected':
        return <XCircle size={18} className="text-red-600" />;
      default:
        return <AlertCircle size={18} className="text-gray-600" />;
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    if (tab === 'pending') return v.status === 'pending';
    if (tab === 'approved') return ['approved', 'active'].includes(v.status);
    return true;
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
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('manage')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                tab === 'manage'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Volunteers ({volunteers.length})
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                tab === 'pending'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setTab('approved')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                tab === 'approved'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({stats.approved})
            </button>
          </div>

          {/* Volunteers Table */}
          <div className="overflow-x-auto">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
