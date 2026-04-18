import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Heart, AlertCircle, Mail, Phone, MapPin, Award, LogOut } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface VolunteerPageProps {
    onLogout?: () => void;
}

export const VolunteerPage: React.FC<VolunteerPageProps> = ({ onLogout }) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVolunteerProfile();
    }, []);

    const fetchVolunteerProfile = async () => {
        try {
            setLoading(true);
            const email = localStorage.getItem('user_email');
            const userStr = localStorage.getItem('user');
            let parsedUser: any = null;
            try {
                parsedUser = userStr ? JSON.parse(userStr) : null;
            } catch {
                parsedUser = null;
            }
            const userEmail = email || parsedUser?.email || null;

            if (!userEmail) {
                setError('Not logged in');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/volunteer/profile`, {
                headers: {
                    'x-user-email': String(userEmail).trim().toLowerCase(),
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                setProfile(data.profile);
            } else {
                setError(data.error || 'Failed to load profile');
            }
        } catch (err) {
            console.error('Error fetching volunteer profile:', err);
            setError('Failed to load volunteer profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-unity-200 border-t-unity-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading volunteer profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={onLogout}
                        className="px-6 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-colors"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    const isApproved = profile?.status === 'approved' || profile?.status === 'active';
    const isPending = profile?.status === 'pending_review' || profile?.status === 'pending';
    const isRejected = profile?.status === 'rejected';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-unity-100 text-unity-600 rounded-xl">
                            <Heart size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Volunteer Portal</h1>
                            <p className="text-sm text-gray-500">{profile?.name || 'Welcome, Volunteer'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

                {/* Status Cards */}
                {isPending && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-8 mb-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <Clock size={32} className="text-amber-600 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-amber-900 mb-2">Under Review</h2>
                                <p className="text-amber-800 mb-4">
                                    Thank you for submitting your volunteer profile! Your application is currently being reviewed by our admin team. 
                                </p>
                                <div className="bg-white rounded-xl p-4">
                                    <p className="text-sm text-gray-600">
                                        <strong>What happens next?</strong><br/>
                                        We'll review your profile and qualifications. Once approved, you'll have immediate access to volunteer opportunities, training materials, and the full volunteer dashboard. This typically takes 1-3 business days.
                                    </p>
                                </div>
                                <p className="text-xs text-amber-700 mt-4">
                                    💡 Check back soon or we'll notify you via email when you're approved!
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 mb-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <AlertCircle size={32} className="text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-red-900 mb-2">Application Not Approved</h2>
                                <p className="text-red-800 mb-4">
                                    Your volunteer application was not approved at this time.
                                </p>
                                <div className="bg-white rounded-xl p-4">
                                    <p className="text-sm text-gray-600">
                                        {profile?.rejectionReason || 'No specific reason was provided. Please contact admin@unitywithin.com for more details.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isApproved && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8 mb-8">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-green-900 mb-2">You're Approved! 🎉</h2>
                                <p className="text-green-800">
                                    Welcome to the Unity Within volunteer community. You now have access to all volunteer features and opportunities.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Personal Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Heart size={20} className="text-unity-500" />
                            Personal Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Name</p>
                                <p className="text-gray-800 font-medium">{profile?.name || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1">
                                    <Mail size={12} /> Email
                                </p>
                                <p className="text-gray-800 font-medium break-all">{profile?.email || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1">
                                    <Phone size={12} /> Phone
                                </p>
                                <p className="text-gray-800 font-medium">{profile?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase flex items-center gap-1">
                                    <MapPin size={12} /> Location
                                </p>
                                <p className="text-gray-800 font-medium">{profile?.county || profile?.location || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Volunteer Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Award size={20} className="text-unity-500" />
                            Volunteer Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-3 h-3 rounded-full ${
                                        isApproved ? 'bg-green-500' : 
                                        isPending ? 'bg-amber-500 animate-pulse' : 
                                        'bg-red-500'
                                    }`}></div>
                                    <p className="text-gray-800 font-medium">
                                        {isApproved ? 'Approved' : isPending ? 'Pending Review' : 'Not Approved'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Volunteer Role</p>
                                <p className="text-gray-800 font-medium">{profile?.role_name || 'To be determined'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Skills</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {Array.isArray(profile?.skills) && profile.skills.length > 0 ? (
                                        profile.skills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-sm">Not specified</p>
                                    )}
                                </div>
                            </div>
                            {profile?.joined_date && (
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Joined</p>
                                    <p className="text-gray-800 font-medium">
                                        {new Date(profile.joined_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Approved Features */}
                {isApproved && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Available Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button className="p-4 border border-gray-200 rounded-xl hover:border-unity-300 hover:bg-unity-50 transition-all text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={20} className="text-unity-500" />
                                    <h4 className="font-bold text-gray-800">Dashboard</h4>
                                </div>
                                <p className="text-sm text-gray-600">View your opportunities and progress</p>
                            </button>
                            <button className="p-4 border border-gray-200 rounded-xl hover:border-unity-300 hover:bg-unity-50 transition-all text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={20} className="text-unity-500" />
                                    <h4 className="font-bold text-gray-800">Training</h4>
                                </div>
                                <p className="text-sm text-gray-600">Complete volunteer training modules</p>
                            </button>
                            <button className="p-4 border border-gray-200 rounded-xl hover:border-unity-300 hover:bg-unity-50 transition-all text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={20} className="text-unity-500" />
                                    <h4 className="font-bold text-gray-800">Opportunities</h4>
                                </div>
                                <p className="text-sm text-gray-600">Browse available volunteer roles</p>
                            </button>
                            <button className="p-4 border border-gray-200 rounded-xl hover:border-unity-300 hover:bg-unity-50 transition-all text-left">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={20} className="text-unity-500" />
                                    <h4 className="font-bold text-gray-800">Community</h4>
                                </div>
                                <p className="text-sm text-gray-600">Connect with other volunteers</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Pending Features Notice */}
                {isPending && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                        <h3 className="text-lg font-bold text-blue-900 mb-4">Features Available After Approval</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['Dashboard', 'Training', 'Opportunities', 'Community'].map((feature, idx) => (
                                <div key={idx} className="p-4 bg-white rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-blue-400" />
                                        <p className="text-gray-800 font-medium">{feature}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
