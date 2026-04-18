import React, { useState, useEffect } from 'react';
import { getTherapistInvite, acceptTherapistInvite } from '../services/therapistService';
import { CheckCircle, AlertCircle, Loader2, Stethoscope } from 'lucide-react';

interface TherapistInviteAcceptProps {
  token: string;
  onSuccess?: () => void;
}

export const TherapistInviteAccept: React.FC<TherapistInviteAcceptProps> = ({ token, onSuccess }) => {
  const [invite, setInvite] = useState<{ email: string; phone?: string; expiresAt?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
    name: '',
    specialization: '',
    bio: '',
    qualifications: '',
    experience: '',
    languages: 'English, Swahili',
    availability: 'online' as 'online' | 'in-person' | 'both',
    availabilitySchedule: '',
    sessionPrice: '',
    termsAccepted: false,
  });

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      const data = await getTherapistInvite(token);
      setInvite({
        email: data.invite.email,
        phone: data.invite.phone,
        expiresAt: data.invite.expiresAt,
      });
      setForm(prev => ({ ...prev, email: data.invite.email }));
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      setSubmitting(false);
      return;
    }
    if (!form.termsAccepted) {
      setError('You must accept the terms and conditions');
      setSubmitting(false);
      return;
    }

    try {
      await acceptTherapistInvite(token, {
        password: form.password,
        name: form.name,
        specialization: form.specialization,
        bio: form.bio,
        qualifications: form.qualifications,
        experience: form.experience,
        languages: form.languages,
        availability: form.availability,
        availabilitySchedule: form.availabilitySchedule,
        sessionPrice: form.sessionPrice,
        termsAccepted: form.termsAccepted,
      });
      setSuccess(true);
      // Redirect to login after a couple seconds
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-unity-500 mb-4" />
        <p className="text-gray-600">Loading invitation...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-unity-black mb-2">Welcome to Unity Within!</h2>
        <p className="text-gray-600 max-w-md">
          Your therapist account has been created successfully. You can now log in and access the Therapist Portal.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <Stethoscope className="text-unity-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-unity-black">Join as a Therapist</h1>
          <p className="text-gray-600 mt-2">
            Complete your profile to start supporting clients. All fields are required unless noted.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg border border-unity-100 p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Dr. Jane Doe"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  name="email"
                  value={invite?.email || ''}
                  disabled
                  className="w-full p-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <input type="hidden" name="email" value={invite?.email || ''} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Repeat password"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specialization *</label>
              <input
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                required
                placeholder="e.g. Anxiety, Depression, Trauma, Relationships"
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio *</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Introduce yourself, your approach, and experience..."
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qualifications</label>
                <input
                  name="qualifications"
                  value={form.qualifications}
                  onChange={handleChange}
                  placeholder="Degrees, certifications (optional)"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Experience</label>
                <input
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5+ years"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Languages (comma separated)</label>
                <input
                  name="languages"
                  value={form.languages}
                  onChange={handleChange}
                  placeholder="English, Swahili"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Availability</label>
                <select
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
                >
                  <option value="online">Online only</option>
                  <option value="in-person">In-person only</option>
                  <option value="both">Both online & in-person</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Availability Schedule</label>
              <textarea
                name="availabilitySchedule"
                value={form.availabilitySchedule}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. Mon-Fri 9am-5pm, Sat 10am-2pm"
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Price / Cost per hour</label>
              <input
                name="sessionPrice"
                value={form.sessionPrice}
                onChange={handleChange}
                placeholder="e.g. $50 / hour or $5 chat / $10 video"
                className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-unity-200 focus:border-unity-400 transition-shadow"
              />
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="termsAccepted"
                id="termsAccepted"
                checked={form.termsAccepted}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-unity-600 rounded border-gray-300 focus:ring-unity-500"
              />
              <label htmlFor="termsAccepted" className="text-sm text-gray-700">
                I accept the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-unity-600 hover:underline">Terms and Conditions</a> and agree to follow the platform guidelines. *
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-unity-500 text-white rounded-xl font-bold hover:bg-unity-600 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Profile & Access Portal'
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          This invitation link expires on {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'the expiration date'}. If you have questions, contact support.
        </p>
      </div>
    </div>
  );
};
