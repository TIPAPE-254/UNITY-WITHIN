import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Heart, AlertCircle, Mail, Phone, MapPin, Award, LogOut, BookOpen, Users, Briefcase } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface VolunteerPageProps {
    onLogout?: () => void;
    userEmail?: string | null;
    userId?: number | string | null;
}

export const VolunteerPage: React.FC<VolunteerPageProps> = ({ onLogout, userEmail, userId }) => {
    const [profile, setProfile] = useState<any>(null);
    const [portalData, setPortalData] = useState<any>(null);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFeature, setActiveFeature] = useState<'dashboard' | 'training' | 'opportunities' | 'community'>('dashboard');
    const [logDescription, setLogDescription] = useState('');
    const [logHours, setLogHours] = useState('1');
    const [taskUpdatingId, setTaskUpdatingId] = useState<number | null>(null);
    const [trainingUpdatingId, setTrainingUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        fetchVolunteerProfile();
    }, []);

    const fetchPortalData = async (emailForHeader: string) => {
        const response = await fetch(`${API_BASE_URL}/portal/me`, {
            headers: {
                'x-user-email': String(emailForHeader).trim().toLowerCase(),
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data?.error || 'Failed to load volunteer portal data');
        }
        setPortalData(data);
    };

    const fetchVolunteerPermissions = async (emailForPermission: string) => {
        const actions = [
            'training',
            'resources',
            'start-session',
            'schedule',
            'campaigns',
            'partners',
            'create',
            'tickets',
        ];

        const checks = await Promise.all(actions.map(async (action) => {
            try {
                const response = await fetch(`${API_BASE_URL}/volunteer/check-permission`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailForPermission, action }),
                });
                const data = await response.json();
                return [action, Boolean(data?.hasPermission)] as const;
            } catch {
                return [action, false] as const;
            }
        }));

        const nextPermissions: Record<string, boolean> = {};
        checks.forEach(([action, allowed]) => {
            nextPermissions[action] = allowed;
        });
        setPermissions(nextPermissions);
    };

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
            const resolvedEmail = userEmail || email || parsedUser?.email || null;
            const resolvedUserId = userId || parsedUser?.id || null;

            if (!resolvedEmail && !resolvedUserId) {
                setError('Unable to load volunteer identity. Please return to dashboard and try again.');
                return;
            }

            const requestHeaders: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (resolvedEmail) {
                requestHeaders['x-user-email'] = String(resolvedEmail).trim().toLowerCase();
            }

            // Prefer the email endpoint, but fall back to userId endpoint if needed.
            let response = await fetch(`${API_BASE_URL}/volunteer/profile`, {
                headers: requestHeaders
            });

            if (!response.ok && resolvedUserId) {
                response = await fetch(`${API_BASE_URL}/volunteer/profile/${resolvedUserId}`, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }

            const data = await response.json();
            if (data.success) {
                setProfile(data.profile);
                if (resolvedEmail) {
                    await fetchPortalData(resolvedEmail);
                    await fetchVolunteerPermissions(String(resolvedEmail).trim().toLowerCase());
                }
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

    const handleLogHours = async () => {
        try {
            const email = profile?.email || userEmail;
            if (!email) return;
            const response = await fetch(`${API_BASE_URL}/portal/log`, {
                method: 'POST',
                headers: {
                    'x-user-email': String(email).trim().toLowerCase(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: logDescription || 'Volunteer contribution',
                    hours: Number(logHours || 0),
                })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.error || 'Failed to log hours');
            }
            await fetchPortalData(String(email));
            setLogDescription('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to log hours');
        }
    };

    const toggleTaskCompletion = async (task: any) => {
        try {
            const email = profile?.email || userEmail;
            if (!email) return;
            setTaskUpdatingId(task.id);
            const response = await fetch(`${API_BASE_URL}/portal/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'x-user-email': String(email).trim().toLowerCase(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !Boolean(task.completed) })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.error || 'Failed to update task');
            }
            await fetchPortalData(String(email));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task');
        } finally {
            setTaskUpdatingId(null);
        }
    };

    const toggleTrainingCompletion = async (module: any) => {
        try {
            const email = profile?.email || userEmail;
            if (!email) return;
            setTrainingUpdatingId(module.id);
            const response = await fetch(`${API_BASE_URL}/portal/training/${module.id}`, {
                method: 'PATCH',
                headers: {
                    'x-user-email': String(email).trim().toLowerCase(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: !Boolean(module.completed_at) })
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.error || 'Failed to update training');
            }
            await fetchPortalData(String(email));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update training');
        } finally {
            setTrainingUpdatingId(null);
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
    const tasks = Array.isArray(portalData?.tasks?.list) ? portalData.tasks.list : [];
    const training = Array.isArray(portalData?.training) ? portalData.training : [];
    const matchedBySkills = tasks.filter((task: any) => {
        const skillSet = Array.isArray(profile?.skills) ? profile.skills.map((s: string) => s.toLowerCase()) : [];
        const hay = `${task?.title || ''} ${task?.category || ''}`.toLowerCase();
        return skillSet.some((skill: string) => hay.includes(skill));
    });

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
                            <button onClick={() => setActiveFeature('dashboard')} className={`p-4 border rounded-xl transition-all text-left ${activeFeature === 'dashboard' ? 'border-unity-500 bg-unity-50' : 'border-gray-200 hover:border-unity-300 hover:bg-unity-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={20} className="text-unity-500" />
                                    <h4 className="font-bold text-gray-800">Dashboard</h4>
                                </div>
                                <p className="text-sm text-gray-600">View your opportunities and progress</p>
                            </button>
                            <button onClick={() => setActiveFeature('training')} className={`p-4 border rounded-xl transition-all text-left ${activeFeature === 'training' ? 'border-unity-500 bg-unity-50' : 'border-gray-200 hover:border-unity-300 hover:bg-unity-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen size={20} className="text-blue-500" />
                                    <h4 className="font-bold text-gray-800">Training</h4>
                                </div>
                                <p className="text-sm text-gray-600">Complete volunteer training modules</p>
                            </button>
                            <button onClick={() => setActiveFeature('opportunities')} className={`p-4 border rounded-xl transition-all text-left ${activeFeature === 'opportunities' ? 'border-unity-500 bg-unity-50' : 'border-gray-200 hover:border-unity-300 hover:bg-unity-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Briefcase size={20} className="text-green-500" />
                                    <h4 className="font-bold text-gray-800">Opportunities</h4>
                                </div>
                                <p className="text-sm text-gray-600">Browse available volunteer roles</p>
                            </button>
                            <button onClick={() => setActiveFeature('community')} className={`p-4 border rounded-xl transition-all text-left ${activeFeature === 'community' ? 'border-unity-500 bg-unity-50' : 'border-gray-200 hover:border-unity-300 hover:bg-unity-50'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={20} className="text-purple-500" />
                                    <h4 className="font-bold text-gray-800">Community</h4>
                                </div>
                                <p className="text-sm text-gray-600">Connect with other volunteers</p>
                            </button>
                        </div>

                        <div className="mt-6 rounded-xl border border-gray-100 p-4 bg-gray-50">
                            {activeFeature === 'dashboard' && (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800">Volunteer Dashboard</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-blue-600">{Number(portalData?.hours?.total || 0).toFixed(1)}</p>
                                            <p className="text-xs text-blue-600">Hours Logged</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-green-600">{portalData?.tasks?.completed || 0}</p>
                                            <p className="text-xs text-green-600">Tasks Done</p>
                                        </div>
                                        <div className="p-3 bg-amber-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-amber-600">{portalData?.tasks?.pending || 0}</p>
                                            <p className="text-xs text-amber-600">Pending</p>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                                            <p className="text-2xl font-bold text-purple-600">{training.filter((t: any) => t.completed_at).length}</p>
                                            <p className="text-xs text-purple-600">Trained</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">What You Can Do:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {permissions['start-session'] && (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Peer Support</span>
                                            )}
                                            {permissions['create'] && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Content Creation</span>
                                            )}
                                            {permissions['campaigns'] && (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Campaigns</span>
                                            )}
                                            {permissions['partners'] && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Partnerships</span>
                                            )}
                                            {permissions['tickets'] && (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Tech Support</span>
                                            )}
                                            {permissions['training'] && (
                                                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Training</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            value={logDescription}
                                            onChange={(e) => setLogDescription(e.target.value)}
                                            placeholder="What did you work on?"
                                            className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min="0.5"
                                                step="0.5"
                                                value={logHours}
                                                onChange={(e) => setLogHours(e.target.value)}
                                                className="w-24 px-3 py-2 rounded-lg border border-gray-200"
                                            />
                                            <button onClick={handleLogHours} className="px-3 py-2 rounded-lg bg-unity-600 text-white text-sm font-semibold">Log</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeFeature === 'training' && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <BookOpen size={18} />
                                        Training Modules
                                    </h4>
                                    {!permissions.training && (
                                        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                            Training access is currently restricted for your role.
                                        </p>
                                    )}
                                    {training.length === 0 ? (
                                        <p className="text-sm text-gray-600">No training modules assigned yet. Your admin will assign modules for your role.</p>
                                    ) : (
                                        training.map((module: any) => (
                                            <div key={module.id} className="p-3 rounded-lg bg-white border border-gray-100 flex items-center justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800">{module.title || `Training #${module.id}`}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {module.completed_at ? `Completed on ${new Date(module.completed_at).toLocaleDateString()}` : 'Pending completion'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => toggleTrainingCompletion(module)}
                                                    disabled={trainingUpdatingId === module.id}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${module.completed_at ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                                                >
                                                    {trainingUpdatingId === module.id ? 'Saving...' : module.completed_at ? 'Completed' : 'Mark done'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeFeature === 'opportunities' && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-800">Opportunities Matched to Your Skills</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {[
                                            { label: 'Peer Support Sessions', action: 'start-session' },
                                            { label: 'Scheduling', action: 'schedule' },
                                            { label: 'Campaign Work', action: 'campaigns' },
                                            { label: 'Partnership Outreach', action: 'partners' },
                                            { label: 'Content Creation', action: 'create' },
                                            { label: 'Tech Tickets', action: 'tickets' },
                                        ].map((perm) => (
                                            <div key={perm.action} className={`p-2 rounded-lg border text-xs font-semibold ${permissions[perm.action] ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                {perm.label}: {permissions[perm.action] ? 'Enabled' : 'Not enabled for your role'}
                                            </div>
                                        ))}
                                    </div>
                                    {(matchedBySkills.length > 0 ? matchedBySkills : tasks).length === 0 ? (
                                        <p className="text-sm text-gray-600">No tasks assigned yet. Your opportunities will appear here based on your volunteer role and skills.</p>
                                    ) : (
                                        (matchedBySkills.length > 0 ? matchedBySkills : tasks).map((task: any) => (
                                            <div key={task.id} className="p-3 rounded-lg bg-white border border-gray-100 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                                                    <p className="text-xs text-gray-500">{task.category || 'General'}{task.due_date ? ` • Due ${new Date(task.due_date).toLocaleDateString()}` : ''}</p>
                                                </div>
                                                <button
                                                    onClick={() => toggleTaskCompletion(task)}
                                                    disabled={taskUpdatingId === task.id}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${task.completed ? 'bg-green-100 text-green-700' : 'bg-unity-100 text-unity-700'}`}
                                                >
                                                    {taskUpdatingId === task.id ? 'Saving...' : task.completed ? 'Completed' : 'Mark done'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeFeature === 'community' && (
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Users size={18} />
                                        Volunteer Community
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                            <p className="text-sm font-semibold text-purple-800 mb-1">Peer Chat</p>
                                            <p className="text-xs text-purple-600">Connect with fellow volunteers through peer chat sessions.</p>
                                        </div>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-sm font-semibold text-blue-800 mb-1">Support Forum</p>
                                            <p className="text-xs text-blue-600">Participate in community discussions and share experiences.</p>
                                        </div>
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm font-semibold text-green-800 mb-1">Resource Sharing</p>
                                            <p className="text-xs text-green-600">Share and access volunteer resources and materials.</p>
                                        </div>
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-sm font-semibold text-amber-800 mb-1">Group Activities</p>
                                            <p className="text-xs text-amber-600">Join group volunteering activities and events.</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">Visit the main Community page to access all community features and connect with other volunteers.</p>
                                </div>
                            )}
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
