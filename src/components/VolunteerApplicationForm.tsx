import React, { useState } from 'react';
import { Mail, Phone, MapPin, HelpCircle, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface VolunteerApplicationFormProps {
  onSuccess?: () => void;
  onNavigate?: (view: string) => void;
}

// All 20 volunteer roles from documentation
const VOLUNTEER_ROLES = [
  { id: 1, title: 'Community moderator (comments, chats, forums)', category: 'Community' },
  { id: 2, title: 'Social media content creator (Instagram, TikTok, Facebook, LinkedIn)', category: 'Creative' },
  { id: 3, title: 'Social media scheduler and page manager', category: 'Creative' },
  { id: 4, title: 'Graphic designer (posts, flyers, banners)', category: 'Creative' },
  { id: 5, title: 'Video editor (short-form awareness videos)', category: 'Creative' },
  { id: 6, title: 'Blog writer (mental health, self-acceptance, healing)', category: 'Creative' },
  { id: 7, title: 'Copywriter (website pages, emails, campaigns)', category: 'Creative' },
  { id: 8, title: 'Newsletter writer and email campaign assistant', category: 'Creative' },
  { id: 9, title: 'Website tester (broken links, bugs, UX issues)', category: 'Tech' },
  { id: 10, title: 'App tester (mobile and web features pre-launch)', category: 'Tech' },
  { id: 11, title: 'Community outreach (schools, churches, clubs, partners)', category: 'Outreach' },
  { id: 12, title: 'Partnership coordinator', category: 'Outreach' },
  { id: 13, title: 'Event planner (online workshops, awareness campaigns)', category: 'Support & Admin' },
  { id: 14, title: 'Event host or virtual session assistant', category: 'Support & Admin' },
  { id: 15, title: 'Peer support listener (non-crisis, welcoming)', category: 'Community' },
  { id: 16, title: 'Resource researcher (mental health tools, articles)', category: 'Support & Admin' },
  { id: 17, title: 'Translation volunteer (local languages, accessibility)', category: 'Support & Admin' },
  { id: 18, title: 'Data entry and admin support', category: 'Support & Admin' },
  { id: 19, title: 'Fundraising assistant (donation drives, sponsorship)', category: 'Outreach' },
  { id: 20, title: 'Brand ambassador (peer circles, communities)', category: 'Outreach' },
];

const CATEGORIES = ['Creative', 'Tech', 'Community', 'Outreach', 'Support & Admin'];

export const VolunteerApplicationForm: React.FC<VolunteerApplicationFormProps> = ({ 
  onSuccess,
  onNavigate 
}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    availability: '',
    category: '',
    skills: '',
    whyVolunteer: '',
    mentalHealthContext: '',
    workPreference: '',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-select category when user selects first role
    if (name === 'category' && !selectedCategory) {
      setSelectedCategory(value);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
      ? prev.filter(id => id !== roleId)
      : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields (First name, Last name, Email)');
      setLoading(false);
      return;
    }

    if (selectedRoles.length === 0) {
      setError('Please select at least one volunteer role');
      setLoading(false);
      return;
    }

    try {
      const roleNames = selectedRoles
        .map(id => VOLUNTEER_ROLES.find(r => r.id === id)?.title)
        .filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/api/volunteer/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          location: formData.location.trim(),
          availability: formData.availability,
          category: formData.category,
          roles: roleNames,
          skills: formData.skills.trim() || null,
          whyVolunteer: formData.whyVolunteer.trim(),
          mentalHealthContext: formData.mentalHealthContext || null,
          workPreference: formData.workPreference,
          notes: formData.notes.trim() || null,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
      console.error('Application error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h2>
          <p className="text-gray-600 mb-4">Thank you for your interest in volunteering with Unity Within.</p>
          <p className="text-sm text-gray-500 mb-6">We've sent a confirmation email to <strong>{formData.email}</strong>. Our team will review your application and be in touch within 3-5 business days.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const filteredRoles = selectedCategory 
    ? VOLUNTEER_ROLES.filter(r => r.category === selectedCategory)
    : VOLUNTEER_ROLES;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7] p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Volunteer with Unity Within</h1>
          <p className="text-gray-600 text-lg">Join us in building a safer, kinder space for mental health, self-acceptance, and healing.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Your first name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Your last name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address * <Mail size={14} className="inline ml-1" />
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone (WhatsApp preferred)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+254..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Location (City/County) * <MapPin size={14} className="inline ml-1" />
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Nairobi, Kenya"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Availability & Preferences */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⏰ Availability & Preferences</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hours per Week *
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  required
                >
                  <option value="">Select availability</option>
                  <option value="1-3">1-3 hours per week</option>
                  <option value="4-8">4-8 hours per week</option>
                  <option value="8-15">8-15 hours per week</option>
                  <option value="15+">15+ hours per week</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Work Preference *
                </label>
                <select
                  name="workPreference"
                  value={formData.workPreference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
                  required
                >
                  <option value="">Select preference</option>
                  <option value="Remote only">Remote only</option>
                  <option value="In-person (Nairobi)">In-person (Nairobi)</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mental Health Context
              </label>
              <select
                name="mentalHealthContext"
                value={formData.mentalHealthContext}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none"
              >
                <option value="">Prefer not to say</option>
                <option value="Yes, personally">Yes, I have personal experience</option>
                <option value="Supporting someone">Supporting someone with mental health</option>
                <option value="Both">Both personal and supporting others</option>
                <option value="Ally">I'm an ally/supporter</option>
              </select>
            </div>
          </div>

          {/* Volunteer Roles */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎯 Select Volunteer Roles *</h2>
            <p className="text-gray-600 text-sm mb-6">Select all roles that interest you (multi-select allowed)</p>

            {/* Category Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Category:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedCategory === ''
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Roles
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Checkboxes */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRoles.map(role => (
                <label
                  key={role.id}
                  className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{role.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{role.category}</div>
                  </div>
                </label>
              ))}
            </div>

            {selectedRoles.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Please select at least one role to continue
              </div>
            )}
          </div>

          {/* Experience & Motivation */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💪 Experience & Motivation</h2>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Skills & Experience
              </label>
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="Tell us about your relevant skills, experience, and any portfolio links..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none min-h-24"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Why do you want to volunteer? * <HelpCircle size={14} className="inline ml-1" />
              </label>
              <textarea
                name="whyVolunteer"
                value={formData.whyVolunteer}
                onChange={handleInputChange}
                placeholder="Share your motivation for volunteering with Unity Within..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none min-h-32"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any other information you'd like to share? (languages, accessibility needs, references, etc.)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:outline-none min-h-20"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                ✨ Submit My Application
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            By applying, you agree to join Unity Within's volunteer community and will be contacted soon.
          </p>
        </form>
      </div>
    </div>
  );
};

export default VolunteerApplicationForm;
