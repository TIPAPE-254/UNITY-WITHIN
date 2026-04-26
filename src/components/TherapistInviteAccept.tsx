import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader, User, Briefcase, Stethoscope, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { ViewState } from '../types';
import { getTherapistInvite, acceptTherapistInvite } from '../services/therapistService';

interface TherapistInviteAcceptProps {
  inviteToken: string;
  onNavigate?: (view: ViewState) => void;
}

export const TherapistInviteAccept: React.FC<TherapistInviteAcceptProps> = ({ inviteToken, onNavigate }) => {
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    bio: '',
    languages: 'English',
    availability: 'Monday-Friday, 9am-5pm',
    sessionPrice: 'Free (Platform Volunteer)',
    termsAccepted: false
  });

  useEffect(() => {
    fetchInvite();
  }, [inviteToken]);

  const fetchInvite = async () => {
    try {
      setLoading(true);
      if (!inviteToken) {
        setError('No invitation token found.');
        setLoading(false);
        return;
      }
      const data = await getTherapistInvite(inviteToken);
      setInvite(data.invite);
      setFormData(prev => ({
        ...prev,
        email: data.invite?.email || ''
      }));
      setError('');
    } catch (err) {
      console.error('Fetch therapist invite error:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.password || !formData.termsAccepted) {
      setError('Please fill in all required fields and accept the terms.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const result = await acceptTherapistInvite(inviteToken, formData);
      
      if (result.success) {
        setSuccess(true);
        // Store therapist info if needed, though usually therapist-portal view handles it
        localStorage.setItem('unity_user', JSON.stringify(result.user));
        
        setTimeout(() => {
          onNavigate?.('therapist-portal');
        }, 2500);
      } else {
        setError(result.error || 'Failed to complete registration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verifying professional invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invitation</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {success ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-slate-100">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">Professional Account Verified</h1>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              Welcome to the Unity Within clinical team. Your profile is now active and ready to support our community.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-500 text-sm font-medium animate-pulse">
              <Loader size={14} className="animate-spin" />
              Redirecting to Clinical Portal...
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 p-10 text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                  Professional Onboarding
                </span>
                <h1 className="text-4xl font-bold mb-2">Clinical Practitioner Registration</h1>
                <p className="text-slate-400">Complete your professional profile to begin hosting therapeutic sessions.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg animate-shake">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Personal Info Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User size={18} className="text-purple-600" />
                  <h2 className="font-bold text-slate-900">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name (including titles)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Dr. Jane Smith, LCSW"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Login Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed italic"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Create Portal Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </section>

              {/* Clinical Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Stethoscope size={18} className="text-purple-600" />
                  <h2 className="font-bold text-slate-900">Clinical Profile</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g. Trauma-Informed CBT, Anxiety"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Session Fee Mode</label>
                    <select
                      value={formData.sessionPrice}
                      onChange={(e) => setFormData({ ...formData, sessionPrice: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="Free (Platform Volunteer)">Free (Platform Volunteer)</option>
                      <option value="Subsidized (Grant Funded)">Subsidized (Grant Funded)</option>
                      <option value="Standard Professional Rate">Standard Professional Rate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Professional Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Highlight your clinical experience and therapeutic approach..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    rows={4}
                    required
                  />
                </div>
              </section>

              {/* Logistics Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Clock size={18} className="text-purple-600" />
                  <h2 className="font-bold text-slate-900">Availability & Logistics</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Languages Spoken</label>
                    <input
                      type="text"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Timeline</label>
                    <input
                      type="text"
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Terms Section */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="mt-1 w-5 h-5 accent-purple-600 border-2 border-slate-300 rounded focus:ring-purple-500"
                    required
                  />
                  <div className="text-sm text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-900 mb-1">HIPAA & Professional Terms</p>
                    I certify that I am a licensed mental health professional. I agree to use the platform in a HIPAA-compliant manner, maintain clinical confidentiality, and adhere to Unity Within's ethics guidelines for digital therapy.
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <Loader size={20} className="animate-spin text-purple-400" />
                    Finalizing Credentials...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} className="text-purple-400" />
                    Complete Registration
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
