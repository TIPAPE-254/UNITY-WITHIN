import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ViewState } from '../types';
import { getVolunteerInvite, acceptVolunteerInvite, getVolunteerRoles } from '../services/volunteerService';

interface VolunteerInviteAcceptProps {
  inviteToken: string;
  onNavigate?: (view: ViewState) => void;
}

export const VolunteerInviteAccept: React.FC<VolunteerInviteAcceptProps> = ({ inviteToken, onNavigate }) => {
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [roles, setRoles] = useState<Array<{ id: number; title: string; description?: string }>>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    experience: ''
  });
  const [matchedRoleId, setMatchedRoleId] = useState<number | null>(null);

  useEffect(() => {
    fetchInvite();
    fetchRoles();
  }, [inviteToken]);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      if (!inviteToken || inviteToken.length < 32) {
        setError('Invalid token format. Please check the link and try again.');
        setLoading(false);
        return;
      }
      const data = await getVolunteerInvite(inviteToken);
      if (!data.success) {
        setError(data.error || 'Invalid or expired invitation');
        setLoading(false);
        return;
      }
      setInvite(data.invite);
      if (data.invite?.isExpired) {
        setError('This invitation has expired. Please request a new one from the admin.');
        setLoading(false);
        return;
      }
      setFormData(prev => ({
        ...prev,
        email: data.invite?.email || ''
      }));
      setError('');
    } catch (err) {
      console.error('Fetch invite error:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await getVolunteerRoles();
      const incoming = Array.isArray(data?.data) ? data.data : [];
      setRoles(incoming);
    } catch {
      setRoles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.email || !matchedRoleId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      // In a real app, you'd get userId from the currently logged-in user
      const userId = localStorage.getItem('user_id') || 'temp_' + Date.now();
      
      const payload = {
        ...formData,
        matchedRoleId,
      };

      const result = await acceptVolunteerInvite(inviteToken, userId, payload);
      
      if (result.success) {
        setSuccess(true);
        // Store volunteer info in localStorage
        localStorage.setItem('volunteer_status', 'approved');
        localStorage.setItem('volunteer_profile', JSON.stringify(formData));
        
        // Redirect to volunteer dashboard after 2 seconds
        setTimeout(() => {
          onNavigate?.('volunteer-dashboard');
        }, 2000);
      } else {
        setError(result.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {success ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <CheckCircle size={64} className="text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Unity Within!</h1>
            <p className="text-gray-600 mb-8">
              Your invitation has been accepted. You're now part of our volunteer community.
            </p>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-left mb-8">
              <h2 className="font-bold text-gray-900 mb-4">What's Next?</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Access your volunteer dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Complete your training modules</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Join active campaigns</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Start supporting the community</span>
                </li>
              </ul>
            </div>
            <p className="text-gray-600 text-sm">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome to Unity Within!
              </h1>
              <p className="text-lg text-gray-600">
                You have been invited to volunteer. Choose the category that best matches your skills.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
                <h2 className="font-bold text-gray-900 mb-4">Complete Your Profile</h2>
                <p className="text-gray-600 text-sm">
                  Help us get to know you better so we can match you with the right opportunities.
                </p>
              </div>

              {/* Full Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  placeholder={formData.email || 'john@example.com'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed transition-colors"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">This email is tied to your invitation and cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254 712 345 678"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Nairobi, Kenya"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Experience & Background
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="Tell us about your experience, skills, and why you want to volunteer with Unity Within..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors resize-none"
                  rows={5}
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Volunteer Category *
                </label>
                <select
                  value={matchedRoleId ?? ''}
                  onChange={(e) => setMatchedRoleId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Select a category based on your skills</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                    </option>
                  ))}
                </select>
                <p className="text-gray-500 text-xs mt-1">You can choose the category that best matches your strengths.</p>
              </div>

              {/* Agreement */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-600"
                  />
                  <span className="text-gray-700">
                    I agree to the Unity Within Volunteer Code of Conduct and will uphold our values of compassion, confidentiality, and respect.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Accept Invitation
                  </>
                )}
              </button>

              <p className="text-center text-gray-600 text-sm">
                Questions? <a href="mailto:volunteer@unitywithin.com" className="text-purple-600 font-bold hover:underline">
                  Contact us
                </a>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
