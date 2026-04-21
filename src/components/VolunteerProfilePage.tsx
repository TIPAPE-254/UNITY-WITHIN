import React, { useState, useEffect } from 'react';
import {
  Heart, Mail, Phone, MapPin, Clock, Award, Users, CheckCircle,
  ArrowLeft, Sparkles, Star, Activity, Target, ExternalLink
} from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { ViewState } from '../types';

interface VolunteerProfileData {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role_name?: string | null;
  role_display_name?: string | null;
  role_category?: string | null;
  role_description?: string | null;
  approved_at?: string | null;
  activated_at?: string | null;
  hours_contributed?: number;
  sessions_completed?: number;
  skills?: string[];
  phone?: string | null;
  location?: string | null;
  bio?: string | null;
  impact_score?: number;
}

interface VolunteerProfilePageProps {
  email?: string;
  onNavigate?: (view: ViewState) => void;
}

export const VolunteerProfilePage: React.FC<VolunteerProfilePageProps> = ({ email, onNavigate }) => {
  const [profile, setProfile] = useState<VolunteerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (email) {
      fetchVolunteerProfile();
    }
  }, [email]);

  const fetchVolunteerProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/api/volunteer/public?email=${encodeURIComponent(email || '')}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch volunteer profile');
      }

      setProfile(data.profile);
    } catch (err) {
      console.error('Error fetching volunteer profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load volunteer profile');
    } finally {
      setLoading(false);
    }
  };

  const getFullName = () => {
    if (!profile) return 'Volunteer';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Volunteer';
  };

  const getRoleDisplay = () => {
    return profile?.role_display_name || profile?.role_name || 'Community Volunteer';
  };

  const getInitials = () => {
    const firstName = profile?.first_name?.charAt(0) || '';
    const lastName = profile?.last_name?.charAt(0) || '';
    return (firstName + lastName).toUpperCase() || 'V';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading volunteer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The volunteer profile you\'re looking for doesn\'t exist or isn\'t publicly available.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeft size={18} />
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Hours Contributed',
      value: `${profile.hours_contributed || 0}h`,
      icon: <Clock size={20} className="text-pink-600" />,
      color: 'border-pink-200 bg-pink-50'
    },
    {
      label: 'Sessions Completed',
      value: profile.sessions_completed || 0,
      icon: <Activity size={20} className="text-purple-600" />,
      color: 'border-purple-200 bg-purple-50'
    },
    {
      label: 'Impact Score',
      value: profile.impact_score || Math.min(100, Math.floor((profile.hours_contributed || 0) * 10)),
      icon: <Star size={20} className="text-yellow-600" />,
      color: 'border-yellow-200 bg-yellow-50'
    },
    {
      label: 'Role',
      value: getRoleDisplay(),
      icon: <Target size={20} className="text-blue-600" />,
      color: 'border-blue-200 bg-blue-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <button
            onClick={() => onNavigate?.('landing')}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors font-medium bg:transparent border-none cursor-pointer"
          >
            <ArrowLeft size={18} />
            Back to Unity Within
          </button>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center text-5xl md:text-6xl font-black shadow-2xl">
              {getInitials()}
            </div>

            {/* Volunteer Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <CheckCircle size={24} className="text-green-300" />
                <span className="text-sm font-semibold uppercase tracking-wider text-white/90">Approved Volunteer</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black mb-2">
                {getFullName()}
              </h1>

              <p className="text-xl text-white/90 mb-4 flex items-center gap-2 justify-center md:justify-start">
                <Sparkles size={20} />
                {getRoleDisplay()}
              </p>

              {profile.location && (
                <div className="flex items-center gap-2 text-white/80 justify-center md:justify-start mb-2">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.approved_at && (
                <div className="flex items-center gap-2 text-white/80 justify-center md:justify-start">
                  <Clock size={16} />
                  <span> volunteered since {new Date(profile.approved_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 border-2 ${stat.color} shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between mb-3">
                {stat.icon}
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Skills & About */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Skills */}
          <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award size={24} className="text-pink-600" />
              Skills & Expertise
            </h2>

            {profile.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 rounded-full text-sm font-bold border border-pink-200"
                  >
                    ✨ {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No skills listed yet.</p>
            )}
          </div>

          {/* Role Details */}
          <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target size={24} className="text-purple-600" />
              Volunteer Role
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">Role Title</p>
                <p className="text-lg font-bold text-gray-900">{getRoleDisplay()}</p>
              </div>

              {profile.role_description && (
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">Role Description</p>
                  <p className="text-gray-700 leading-relaxed">{profile.role_description}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 font-bold uppercase mb-1">Category</p>
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {profile.role_category || 'Volunteer'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Heart size={24} className="text-red-500" />
            Get in Touch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail size={22} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Email</p>
                  <p className="text-gray-900 font-semibold">{profile.email}</p>
                </div>
                <ExternalLink size={16} className="ml-auto text-gray-400 group-hover:text-pink-600" />
              </a>
            )}

            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone size={22} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase">Phone</p>
                  <p className="text-gray-900 font-semibold">{profile.phone}</p>
                </div>
                <ExternalLink size={16} className="ml-auto text-gray-400 group-hover:text-green-600" />
              </a>
            )}
          </div>

          {!profile.email && !profile.phone && (
            <p className="text-gray-500 italic">This volunteer has not shared contact information.</p>
          )}
        </div>

        {/* About/Contribution */}
        {profile.bio && (
          <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles size={24} className="text-yellow-600" />
              About
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center pb-12">
          <button
            onClick={() => onNavigate?.('volunteer')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all"
          >
            <Users size={20} />
            Become a Volunteer Too
          </button>

          <p className="mt-4 text-gray-600 text-sm">
            Join our community of compassionate volunteers making a difference.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfilePage;
