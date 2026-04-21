import React, { useState, useEffect } from 'react';
import { NAVIGATION_ITEMS } from './constants';
import { ViewState, User } from './types';
import { Dashboard } from './components/Dashboard';
import { AIChat } from './components/AIChat';
import { Journal } from './components/Journal';
import { Breathe } from './components/Breathe';
import { Education } from './components/Education';
import { WellnessToolkit } from './components/WellnessToolkit';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Volunteer } from './components/Volunteer';
import { AdminVolunteers } from './components/AdminVolunteers';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { VolunteerPortal } from './components/VolunteerPortal';
import { VolunteerApplicationForm } from './components/VolunteerApplicationForm';
import { VolunteerProfilePage } from './components/VolunteerProfilePage';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { usePushNotifications } from './hooks/usePushNotifications';
import { Heart, Menu, X, ShieldAlert, Phone } from 'lucide-react';

export default function App() {
  const { register: requestPushPermission } = usePushNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);

  // Load user from localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('unity_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      return null;
    }
  });

  // State for volunteer invite token
  const [inviteToken, setInviteToken] = useState<string>('');

  // State for volunteer profile email (for public volunteer pages)
  const [volunteerProfileEmail, setVolunteerProfileEmail] = useState<string | null>(null);

  // Set initial view based on auth status or URL
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  // Parse URL on mount for invite token and volunteer profile
  useEffect(() => {
    try {
      const pathname = window.location.pathname;

      // Check for invite token
      const inviteMatch = pathname.match(/\/volunteer-invite\/([a-f0-9]+)/i);
      if (inviteMatch && inviteMatch[1]) {
        const token = inviteMatch[1];
        setInviteToken(token);
        setCurrentView('volunteer-invite');
        return;
      }

      // Check for volunteer profile page
      const volunteerMatch = pathname.match(/^\/volunteer\/(.+)/);
      if (volunteerMatch && volunteerMatch[1]) {
        const email = decodeURIComponent(volunteerMatch[1]);
        setVolunteerProfileEmail(email);
        setCurrentView('volunteer-profile');
        return;
      }

      // No special URL patterns, determine view from auth
      const savedUser = localStorage.getItem('unity_user');
      const hasUser = savedUser ? JSON.parse(savedUser) : null;

      if (!hasUser) {
        setCurrentView('landing');
        return;
      }

      if (hasUser.role === 'volunteer' || hasUser.volunteerStatus === 'approved') {
        setCurrentView('volunteer-portal');
      } else {
        setCurrentView('dashboard');
      }
    } catch (e) {
      console.error('Error determining initial view:', e);
      setCurrentView('landing');
    }
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    localStorage.removeItem('unity_user');
    localStorage.removeItem('unity_progress');
    localStorage.removeItem('unity_tool_usage');
    localStorage.removeItem('unity_tool_favorites');
    localStorage.removeItem('unity_goals');
    localStorage.removeItem('unity_habits');
    setUser(null);
    setCurrentView('landing');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('unity_user', JSON.stringify(loggedInUser));
    
    // Route volunteers to volunteer portal, regular users to dashboard
    const targetView = loggedInUser.role === 'volunteer' || loggedInUser.volunteerStatus === 'approved' 
      ? 'volunteer-portal' 
      : 'dashboard';
    setCurrentView(targetView);

    void requestPushPermission().catch((error: unknown) => {
      console.error('Push permission request failed:', error);
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} onGetStarted={() => handleNavigate('signup')} />;
      case 'login': // Login now receives onLoginSuccess
        return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
      case 'signup':
        return <Signup onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} userName={user?.firstName} onLogout={handleLogout} />;
      case 'wellness':
        return <WellnessToolkit />;
      case 'chat':
        return <AIChat />;
      case 'journal':
        return <Journal />;
      case 'breathe':
        return <Breathe />;
      case 'education':
        return <Education />;
      case 'volunteer':
        return <Volunteer onNavigate={handleNavigate} />;
      case 'volunteer-invite':
        return <VolunteerApplicationForm inviteToken={inviteToken} onNavigate={handleNavigate} />;
      case 'volunteer-portal':
        return <VolunteerPortal user={user || undefined} onNavigate={handleNavigate} />;
      case 'volunteer-profile':
        return <VolunteerProfilePage email={volunteerProfileEmail || undefined} onNavigate={handleNavigate} />;
      case 'volunteer-dashboard':
        return <VolunteerDashboard user={user || undefined} onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} onGetStarted={() => handleNavigate('signup')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col md:flex-row text-gray-900 font-sans selection:bg-pink-200 selection:text-pink-900">
      <AnalyticsTracker currentView={currentView} />

      {/* Sidebar (Desktop) - Hidden on landing, login, signup, and volunteer-invite pages */}
      {currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && currentView !== 'volunteer-invite' && (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-pink-100 p-6 fixed h-full z-20">
          <div className="flex items-center gap-2 mb-10 text-pink-600">
            <Heart className="fill-current" size={28} />
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">UNITY <span className="text-pink-500">WITHIN</span></h1>
          </div>

          <nav className="space-y-2 flex-1">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${currentView === item.id
                  ? 'bg-pink-50 text-pink-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-pink-500'
                  }`}
              >
                <item.icon size={20} className={currentView === item.id ? 'stroke-[2.5px]' : 'stroke-2'} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-sm">
                <p className="font-bold text-gray-900">{user?.firstName || 'User Account'}</p>
                <p className="text-gray-400 text-xs">you matter!</p>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`${(currentView === 'landing' || currentView === 'login' || currentView === 'signup' || currentView === 'volunteer-invite') ? 'w-full' : 'flex-1 md:ml-64'} p-4 pb-24 md:p-8 md:pb-8 max-w-5xl mx-auto w-full transition-all`}>
        {/* Mobile Header - Hidden on landing, login, signup, and volunteer-invite pages */}
        {currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && currentView !== 'volunteer-invite' && (
          <div className="md:hidden flex items-center justify-between mb-6 px-2">
            {/* Hamburger Menu - Left */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Open menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* UNITY WITHIN - Center */}
            <div className="flex-1 flex items-center justify-center mx-4">
              <div className="flex items-center gap-2 text-pink-600">
                <Heart className="fill-current" size={24} />
                <span className="font-extrabold text-lg text-gray-900">UNITY <span className="text-pink-500">WITHIN</span></span>
              </div>
            </div>

            {/* Crisis Button - Right */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setCrisisModalOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 transition-colors rounded-lg hover:bg-red-50"
                title="Immediate Crisis Help"
                aria-label="Crisis support"
              >
                <ShieldAlert size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && currentView !== 'volunteer-invite' && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 md:hidden z-40"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Drawer */}
            <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-pink-100 z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2 text-pink-600">
                  <Heart className="fill-current" size={28} />
                  <h1 className="text-xl font-extrabold tracking-tight text-gray-900">UNITY <span className="text-pink-500">WITHIN</span></h1>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="space-y-2">
                {NAVIGATION_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${currentView === item.id
                      ? 'bg-pink-50 text-pink-600 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-pink-500'
                      }`}
                  >
                    <item.icon size={20} className={currentView === item.id ? 'stroke-[2.5px]' : 'stroke-2'} />
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                    {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-900">{user?.firstName || 'User Account'}</p>
                    <p className="text-gray-400 text-xs">you matter!</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Crisis Modal */}
        {crisisModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:hidden">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" size={24} />
                    Immediate Support
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">You matter. Help is available.</p>
                </div>
                <button
                  onClick={() => setCrisisModalOpen(false)}
                  className="p-1 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <a
                  href="tel:+254715765561"
                  className="flex items-center gap-4 p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors border border-pink-100 group"
                >
                  <div className="bg-white p-2 rounded-full text-pink-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">UNITY WITHIN Support</div>
                    <div className="text-sm text-pink-600">+254 715 765 561</div>
                  </div>
                </a>

                <a
                  href="tel:1199"
                  className="flex items-center gap-4 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors border border-red-100 group"
                >
                  <div className="bg-white p-2 rounded-full text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Emergency Services</div>
                    <div className="text-sm text-red-600">1199</div>
                  </div>
                </a>

                <a
                  href="tel:116"
                  className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100 group"
                >
                  <div className="bg-white p-2 rounded-full text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Befrienders Kenya</div>
                    <div className="text-sm text-blue-600">116</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Bottom Navigation (Mobile) - Hidden on landing, login, signup, and volunteer-invite pages */}
      {currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && currentView !== 'volunteer-invite' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-pink-100 p-2 z-50 flex justify-around items-center pb-safe">
          {NAVIGATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === item.id
                ? 'text-pink-500'
                : 'text-gray-400'
                }`}
            >
              <item.icon size={24} className={currentView === item.id ? 'fill-pink-50' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}