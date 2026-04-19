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
import { VolunteerInviteAccept } from './components/VolunteerInviteAccept';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { usePushNotifications } from './hooks/usePushNotifications';
import { Heart } from 'lucide-react';

export default function App() {
  const { register: requestPushPermission } = usePushNotifications();
  
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

  // Set initial view based on auth status or URL
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      // Check if URL contains volunteer invite token
      const pathname = window.location.pathname;
      if (pathname.includes('/volunteer-invite/')) {
        return 'volunteer-invite';
      }
      
      const savedUser = localStorage.getItem('unity_user');
      const hasUser = savedUser ? JSON.parse(savedUser) : null;
      return hasUser ? 'dashboard' : 'landing';
    } catch (e) {
      return 'landing';
    }
  });

  // Parse URL for invite token on mount
  useEffect(() => {
    try {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/volunteer-invite\/([a-f0-9]+)/i);
      if (match && match[1]) {
        const token = match[1];
        setInviteToken(token);
        setCurrentView('volunteer-invite');
      }
    } catch (error) {
      console.error('Error parsing invite URL:', error);
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
    setCurrentView('dashboard');

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
        return <VolunteerInviteAccept inviteToken={inviteToken} onNavigate={handleNavigate} />;
      case 'volunteer-portal':
        return <VolunteerPortal user={user || undefined} onNavigate={handleNavigate} />;
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
          <div className="md:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-pink-600">
              <Heart className="fill-current" size={24} />
              <span className="font-extrabold text-lg text-gray-900">UNITY</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
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