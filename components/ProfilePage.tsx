import React, { useState } from 'react';
import { UserCircle, LogOut, Trash2, Download, Shield, Settings, AlertTriangle, Lock, ChevronRight, ChevronDown } from 'lucide-react';
import { MoodHistoryGraph } from './MoodHistoryGraph';
import { Button } from './Button';

interface ProfilePageProps {
  user?: { id: number | string; name: string; email: string; role?: string } | null;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user: propsUser }) => {
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAccountControls, setShowAccountControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editFields, setEditFields] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch profile on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use props user first, then fall back to localStorage
        let userId: string | number | null = propsUser?.id || null;
        let userData = propsUser || null;
        
        // Get user from localStorage - same as App.tsx
        const storedUser = localStorage.getItem('user');
        
        if (!userId && storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            userId = userObj.id;
            userData = userObj;
          } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
          }
        }
        // Also check legacy userId key
        if (!userId) {
          userId = localStorage.getItem('userId');
        }
        
        if (!userId) {
          setError('Please log in to view your profile');
          setLoading(false);
          return;
        }
        
        // Try to fetch from API first
        try {
          const res = await fetch(`/api/profile?userId=${userId}`);
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else if (data.error) {
            // If API fails, use local user data as fallback
            console.warn('Profile API error:', data.error);
            if (userData) {
              setUser(userData);
            } else {
              setError(data.error);
            }
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
          // Fallback to local user data
          if (userData) {
            setUser(userData);
          } else {
            setError('Failed to load profile. Please try again.');
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile:', e);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [propsUser]);

  // Edit handlers
  const handleEditProfile = () => {
    setEditFields({ ...user });
    setEditMode(true);
  };
  const handleFieldChange = (field: string, value: any) => {
    setEditFields((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      let userId = null;
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userId = userObj.id;
      }
      if (!userId) {
        userId = localStorage.getItem('userId');
      }
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editFields, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, ...editFields });
        setEditMode(false);
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;
    setLoading(true);
    try {
      // Get user from localStorage
      const storedUser = localStorage.getItem('user');
      let userId = null;
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userId = userObj.id;
      }
      if (!userId) {
        userId = localStorage.getItem('userId');
      }
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        handleLogout();
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadData = async () => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    let userId = null;
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      userId = userObj.id;
    }
    if (!userId) {
      userId = localStorage.getItem('userId');
    }
    window.open(`/api/profile/download?userId=${userId}`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-lg mt-8 mb-12 border border-unity-100">
      {loading && <div className="text-center text-unity-400">Loading...</div>}
      {!loading && error && (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">{error}</div>
          {!user && <button onClick={() => window.location.href = '/login'} className="px-4 py-2 bg-unity-500 text-white rounded-lg">Log In</button>}
        </div>
      )}
      {!loading && !error && user && (
        <>
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-unity-black">Profile</h2>
            <button onClick={handleEditProfile} className="p-2 rounded-full hover:bg-unity-50 transition"><Settings size={22} /></button>
          </div>

          {/* Profile Overview */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-unity-200 object-cover" />
              ) : (
                <UserCircle className="w-20 h-20 text-unity-200" />
              )}
              {user.isAmbassador && (
                <span className="absolute bottom-0 right-0 bg-unity-500 text-white rounded-full p-1 shadow"><Shield size={16} /></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-unity-black">{user.name || user.username}</span>
                {user.isAnonymous && <span className="ml-2 px-2 py-0.5 text-xs bg-unity-100 text-unity-500 rounded">Anonymous</span>}
              </div>
              <div className="text-sm text-unity-400">Member since {new Date(user.memberSince || user.created_at).toLocaleDateString()}</div>
              {user.bio && <div className="mt-1 text-unity-600 italic">{user.bio}</div>}
            </div>
          </div>

          {/* Edit Profile Section */}
          {editMode && (
            <div className="mb-8 p-4 bg-unity-50 rounded-xl border border-unity-100">
              <h3 className="font-semibold mb-2">Edit Profile</h3>
              <div className="flex flex-col gap-2">
                <label>Username
                  <input className="mt-1 p-2 rounded border" value={editFields.name || ''} onChange={e => handleFieldChange('name', e.target.value)} />
                </label>
                <label>Bio
                  <input className="mt-1 p-2 rounded border" value={editFields.bio || ''} onChange={e => handleFieldChange('bio', e.target.value)} />
                </label>
                <label>Age Range
                  <input className="mt-1 p-2 rounded border" value={editFields.ageRange || ''} onChange={e => handleFieldChange('ageRange', e.target.value)} />
                </label>
                <label>Emergency Contact
                  <input className="mt-1 p-2 rounded border" value={editFields.emergency_contact || ''} onChange={e => handleFieldChange('emergency_contact', e.target.value)} />
                </label>
                <label>Anonymous Mode
                  <input type="checkbox" checked={!!editFields.isAnonymous} onChange={e => handleFieldChange('isAnonymous', e.target.checked)} />
                </label>
                {/* Add more fields as needed */}
              </div>
              <Button onClick={handleSaveProfile} className="mt-2">Save Changes</Button>
            </div>
          )}

          {/* Mood & Wellness Dashboard */}
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Mood & Wellness Dashboard</h3>
            {user && <MoodHistoryGraph userId={user.id} />}
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="bg-unity-50 rounded-xl p-3 flex-1 min-w-[160px]">
                <div className="text-xs text-unity-400">Wellness Streak</div>
                <div className="text-lg font-bold text-unity-600">{user.wellnessStreak || 0} days</div>
              </div>
              <div className="bg-unity-50 rounded-xl p-3 flex-1 min-w-[160px]">
                <div className="text-xs text-unity-400">Weekly Summary</div>
                <div className="text-sm text-unity-700">{user.weeklySummary || ''}</div>
              </div>
            </div>
          </div>

          {/* Personal Goals & Progress */}
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Personal Goals & Progress</h3>
            <ul className="list-disc ml-6 text-unity-700 mb-2">
              {(user.goals || []).map((goal: string, i: number) => <li key={i}>{goal}</li>)}
            </ul>
            <div className="flex flex-wrap gap-2">
              {(user.milestones || []).map((m: string, i: number) => (
                <span key={i} className="bg-unity-100 text-unity-500 px-2 py-0.5 rounded text-xs">{m}</span>
              ))}
            </div>
          </div>

          {/* Safety & Support Settings */}
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Safety & Support Settings</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-unity-700"><AlertTriangle size={16} /> Crisis Sensitivity: <span className="font-semibold">{user.crisisSensitivity || ''}</span></div>
              <div className="flex items-center gap-2 text-unity-700"><ChevronRight size={16} /> Escalation Path: <span className="font-semibold">{user.escalationPath || ''}</span></div>
              <div className="flex items-center gap-2 text-unity-700"><Lock size={16} /> Emergency Contact: <span className="font-semibold">{user.emergencyContact || user.emergency_contact || ''}</span></div>
              <Button className="mt-2 bg-unity-500 text-white hover:bg-unity-600">Get Help Now</Button>
            </div>
          </div>

          {/* Community Settings */}
          <div className="mb-8">
            <h3 className="font-semibold mb-2">Community Settings</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2"><span className="font-semibold">Anonymous Posting:</span> <span className="ml-2 px-2 py-0.5 text-xs bg-unity-100 text-unity-500 rounded">{user.isAnonymous ? 'On' : 'Off'}</span></div>
              <div className="flex items-center gap-2"><span className="font-semibold">Groups:</span> {(user.communityGroups || []).join(', ')}</div>
              <div className="flex items-center gap-2"><span className="font-semibold">Profile Visibility:</span> <span className="ml-2 px-2 py-0.5 text-xs bg-unity-100 text-unity-500 rounded">{user.profileVisibility || ''}</span></div>
            </div>
          </div>

          {/* Account Controls */}
          <div className="mb-2">
            <button onClick={() => setShowAccountControls(v => !v)} className="flex items-center gap-2 text-unity-500 font-semibold text-sm hover:underline">
              <Settings size={16} /> Account Controls {showAccountControls ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {showAccountControls && (
              <div className="mt-2 bg-unity-50 rounded-xl p-4 border border-unity-100 flex flex-col gap-3">
                <Button onClick={handleLogout} className="bg-unity-100 text-unity-500 hover:bg-unity-200 flex items-center gap-2"><LogOut size={16} /> Log Out</Button>
                <Button onClick={handleDeleteAccount} className="bg-red-100 text-red-600 hover:bg-red-200 flex items-center gap-2"><Trash2 size={16} /> Delete Account</Button>
                <Button onClick={handleDownloadData} className="bg-unity-100 text-unity-500 hover:bg-unity-200 flex items-center gap-2"><Download size={16} /> Download My Data</Button>
                <a href="/privacy" className="text-xs text-unity-400 hover:underline">Privacy Policy & Terms</a>
                <div className="text-xs text-unity-400">Manage your data permissions in settings.</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
