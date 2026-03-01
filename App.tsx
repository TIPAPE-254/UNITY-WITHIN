import React, { useState, Suspense, lazy } from 'react';
import { NAVIGATION_ITEMS } from './constants';
import { ViewState } from './types';
import { Home, MessageCircleHeart, BookHeart, Wind, GraduationCap, LogOut, Menu, X, Heart, Loader2 } from 'lucide-react';

import { CrisisResource } from './components/CrisisResource';

// Lazy Load Pages for Performance (Code Splitting)
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const AIChat = lazy(() => import('./components/AIChat').then(module => ({ default: module.AIChat })));
const Community = lazy(() => import('./components/Community').then(module => ({ default: module.Community })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const Journal = lazy(() => import('./components/Journal').then(module => ({ default: module.Journal })));
const Breathe = lazy(() => import('./components/Breathe').then(module => ({ default: module.Breathe })));
const Education = lazy(() => import('./components/Education').then(module => ({ default: module.Education })));
const WellnessToolkit = lazy(() => import('./components/WellnessToolkit').then(module => ({ default: module.WellnessToolkit })));
const NameTheFeeling = lazy(() => import('./components/NameTheFeeling').then(module => ({ default: module.NameTheFeeling })));
const CompassionBuilder = lazy(() => import('./components/CompassionBuilder').then(module => ({ default: module.CompassionBuilder })));
const ValuesDirection = lazy(() => import('./components/ValuesDirection').then(module => ({ default: module.ValuesDirection })));
const BodyScan = lazy(() => import('./components/BodyScan').then(module => ({ default: module.BodyScan })));
const SafeSpace = lazy(() => import('./components/SafeSpace').then(module => ({ default: module.SafeSpace })));
const StoryReframer = lazy(() => import('./components/StoryReframer').then(module => ({ default: module.StoryReframer })));
const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const Signup = lazy(() => import('./components/Signup').then(module => ({ default: module.Signup })));
const Login = lazy(() => import('./components/Login').then(module => ({ default: module.Login })));
const ForgotPassword = lazy(() => import('./components/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./components/ResetPassword').then(module => ({ default: module.ResetPassword })));
const WhyUnity = lazy(() => import('./components/WhyUnity').then(module => ({ default: module.WhyUnity })));
const ProfilePage = lazy(() => import('./components/ProfilePage'));

// Loading Component
const PageLoader = () => (
  <div className="h-full flex flex-col items-center justify-center text-unity-400 p-8">
    <Loader2 size={40} className="animate-spin mb-4" />
    <p className="text-sm font-medium animate-pulse">Loading Unity...</p>
  </div>
);

type AppView = ViewState | 'landing' | 'signup' | 'login' | 'forgot-password' | 'reset-password' | 'why-unity';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [navData, setNavData] = useState<any>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; email: string; role?: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resetToken, setResetToken] = useState('');


  // Map view state to URL path
  const viewToPath = (view: AppView) => {
    switch (view) {
      case 'dashboard': return '/dashboard';
      case 'wellness': return '/toolkit';
      case 'chat': return '/chat';
      case 'community': return '/community';
      case 'journal': return '/journal';
      case 'breathe': return '/breathe';
      case 'education': return '/education';
      case 'admin': return '/admin';
      case 'namethefeeling': return '/namethefeeling';
      case 'selfcompassion': return '/selfcompassion';
      case 'values': return '/values';
      case 'bodyscan': return '/bodyscan';
      case 'safespace': return '/safespace';
      case 'reframer': return '/reframer';
      case 'profile': return '/profile';
      case 'landing': return '/';
      case 'signup': return '/signup';
      case 'login': return '/login';
      case 'forgot-password': return '/forgot-password';
      case 'reset-password': return resetToken ? `/reset-password/${resetToken}` : '/reset-password';
      case 'why-unity': return '/why-unity';
      default: return '/dashboard';
    }
  };

  // Map URL path to view state
  const pathToView = (pathname: string): AppView => {
    if (/^\/dashboard$/.test(pathname)) return 'dashboard';
    if (/^\/toolkit$/.test(pathname)) return 'wellness';
    if (/^\/chat$/.test(pathname)) return 'chat';
    if (/^\/community$/.test(pathname)) return 'community';
    if (/^\/journal$/.test(pathname)) return 'journal';
    if (/^\/breathe$/.test(pathname)) return 'breathe';
    if (/^\/education$/.test(pathname)) return 'education';
    if (/^\/admin$/.test(pathname)) return 'admin';
    if (/^\/namethefeeling$/.test(pathname)) return 'namethefeeling';
    if (/^\/selfcompassion$/.test(pathname)) return 'selfcompassion';
    if (/^\/values$/.test(pathname)) return 'values';
    if (/^\/bodyscan$/.test(pathname)) return 'bodyscan';
    if (/^\/safespace$/.test(pathname)) return 'safespace';
    if (/^\/reframer$/.test(pathname)) return 'reframer';
    if (/^\/profile$/.test(pathname)) return 'profile';
    if (/^\/landingpage$/.test(pathname)) return 'landing';
    if (/^\/$/.test(pathname)) return 'landing';
    if (/^\/signup$/.test(pathname)) return 'signup';
    if (/^\/login$/.test(pathname)) return 'login';
    if (/^\/forgot-password$/.test(pathname)) return 'forgot-password';
    if (/^\/reset-password\//.test(pathname)) return 'reset-password';
    if (/^\/why-unity$/.test(pathname)) return 'why-unity';
    return 'dashboard';
  };

  // Enhanced navigation handler with pushState
  const handleNavigate = (view: AppView, data?: any) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    if (data) {
      setNavData(data);
    } else {
      setNavData({});
    }
    const path = viewToPath(view);
    // Always update the URL, even if already on this view, to ensure correct URL for SPA
    window.history.pushState({ view }, '', path);
  };

  // Listen for browser navigation (back/forward)
  React.useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const pathname = window.location.pathname;
      if (/^\/reset-password\//.test(pathname)) {
        const match = pathname.match(/^\/reset-password\/([^/]+)$/);
        if (match?.[1]) {
          setResetToken(decodeURIComponent(match[1]));
          setCurrentView('reset-password');
          return;
        }
      }
      setCurrentView(pathToView(pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  React.useEffect(() => {
    const resetMatch = window.location.pathname.match(/^\/reset-password\/([^/]+)$/);
    if (resetMatch?.[1]) {
      setResetToken(decodeURIComponent(resetMatch[1]));
      setCurrentView('reset-password');
      return;
    }

    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      if (currentView === 'landing' || currentView === 'login' || currentView === 'signup') {
        setCurrentView('dashboard');
      }
    }
  }, []);

  // Check for auth when currentView changes
  React.useEffect(() => {
    const protectedRoutes = ['dashboard', 'chat', 'community', 'profile', 'journal', 'breathe', 'education', 'wellness', 'admin', 'namethefeeling', 'selfcompassion', 'values', 'bodyscan', 'safespace', 'reframer'];
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser && protectedRoutes.includes(currentView)) {
      setCurrentView('landing');
    }
  }, [currentView]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('landing');
    window.history.pushState({ view: 'landing' }, '', '/');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={() => setCurrentView('signup')} onNavigate={handleNavigate} />;
      case 'signup':
        return (
          <Signup
            onSignupComplete={() => {
              const stored = localStorage.getItem('user');
              if (stored) setUser(JSON.parse(stored));
              setIsAuthenticated(true);
              setCurrentView('dashboard');
            }}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      case 'login':
        return (
          <Login
            onLoginComplete={() => {
              const stored = localStorage.getItem('user');
              if (stored) setUser(JSON.parse(stored));
              setIsAuthenticated(true);
              setCurrentView('dashboard');
            }}
            onSwitchToSignup={() => setCurrentView('signup')}
            onForgotPassword={() => setCurrentView('forgot-password')}
          />
        );
      case 'forgot-password':
        return <ForgotPassword onBackToLogin={() => setCurrentView('login')} />;
      case 'reset-password':
        return <ResetPassword token={resetToken} onBackToLogin={() => setCurrentView('login')} />;
      case 'why-unity':
        return <WhyUnity onBack={() => setCurrentView('landing')} />;
      case 'dashboard':
        return <Dashboard
          onNavigate={handleNavigate}
          userName={user?.name || 'Friend'}
          userId={user?.id}
        />;
      case 'wellness':
        return <WellnessToolkit onNavigate={handleNavigate} />;
      case 'chat':
        return <AIChat />;
      case 'community':
        return <Community userId={user?.id} userName={user?.name} />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'admin':
        return (user?.email === 'lepiromatayo@gmail.com') ? <AdminDashboard /> : <Dashboard onNavigate={handleNavigate} userName={user?.name || 'Friend'} userId={user?.id} />;
      case 'journal':
        return <Journal userId={user?.id} moodId={navData?.moodId} />;
      case 'breathe':
        return <Breathe />;
      case 'namethefeeling':
        return <NameTheFeeling />;
      case 'selfcompassion':
        return <CompassionBuilder />;
      case 'values':
        return <ValuesDirection />;
      case 'bodyscan':
        return <BodyScan />;
      case 'safespace':
        return <SafeSpace />;
      case 'reframer':
        return <StoryReframer />;
      case 'education':
        return <Education />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  // Helper to check if we're on an auth/landing page (no sidebar/nav)
  const isAuthPage = ['landing', 'signup', 'login', 'forgot-password', 'reset-password', 'why-unity'].includes(currentView);
  // Hamburger menu items: Toolkit, Learn, Breathe, Journal, Admin (only for lepiromatayo@gmail.com)
  const mobileMenuItemIds = user?.email === 'lepiromatayo@gmail.com' 
    ? ['wellness', 'education', 'breathe', 'journal', 'admin']
    : ['wellness', 'education', 'breathe', 'journal'];
  // Bottom nav items: Home, Community, Buddie, Profile
  const bottomNavOrder = ['dashboard', 'chat', 'community', 'profile'];
  const mobileMenuItems = mobileMenuItemIds.map(id => NAVIGATION_ITEMS.find(item => item.id === id)).filter(Boolean);
  const bottomNavItems = bottomNavOrder.map(id => NAVIGATION_ITEMS.find(item => item.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col md:flex-row text-unity-black font-sans selection:bg-unity-200 selection:text-unity-900">

      {/* Sidebar (Desktop) - Hidden on auth pages */}
      {!isAuthPage && (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-unity-100 p-6 fixed h-full z-20">
          <div className="flex items-center gap-2 mb-10 text-unity-600">
            <Heart className="fill-current" size={28} />
            <h1 className="text-xl font-extrabold tracking-tight text-unity-black">UNITY <span className="text-unity-500">WITHIN</span></h1>
          </div>

          <nav className="space-y-2 flex-1">
            {NAVIGATION_ITEMS.filter(item => item.id === 'admin' ? user?.email === 'lepiromatayo@gmail.com' : true).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as AppView)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${currentView === item.id
                  ? 'bg-unity-50 text-unity-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-unity-500'
                  }`}
              >
                <item.icon size={20} className={currentView === item.id ? 'stroke-[2.5px]' : 'stroke-2'} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-unity-100 flex items-center justify-center text-unity-600 font-bold">
                {user ? user.name?.charAt(0).toUpperCase() || 'U' : 'U'}
              </div>
              <div className="text-sm overflow-hidden">
                <p className="font-bold text-unity-black truncate max-w-[100px]">
                  {user ? user.name || 'User' : 'Guest'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400 text-xs">Free Plan</p>
                  <button onClick={handleLogout} className="text-red-400 hover:text-red-500 transition-colors" title="Log Out">
                    <LogOut size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${!isAuthPage ? 'md:ml-64 p-4 pb-24 md:p-8 md:pb-8' : ''} ${!isAuthPage ? 'max-w-5xl mx-auto' : ''} w-full transition-all`}>
        {/* Mobile Header - Hidden on auth pages */}
        {!isAuthPage && (
          <div className="md:hidden relative flex items-center justify-center mb-6">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="absolute left-0 w-9 h-9 rounded-full bg-unity-100 text-unity-600 flex items-center justify-center"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2 text-unity-600">
              <Heart className="fill-current" size={24} />
              <span className="font-extrabold text-lg text-unity-black">UNITY WITHIN</span>
            </div>
            <div className="absolute right-0 w-8 h-8 rounded-full bg-unity-100 flex items-center justify-center text-unity-600 text-xs font-bold">
              {user ? user.name?.charAt(0).toUpperCase() || 'U' : 'U'}
            </div>

            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-unity-100 rounded-2xl shadow-sm p-2 z-30">
                {mobileMenuItems.filter(item => item.id !== 'admin' || user?.email === 'lepiromatayo@gmail.com').map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id as AppView)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-colors ${currentView === item.id
                      ? 'bg-unity-50 text-unity-600'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Suspense fallback={<PageLoader />}>
          {renderContent()}
        </Suspense>

        {/* Global Crisis Resource Fab - Hidden on auth pages */}
        {!isAuthPage && <CrisisResource />}
      </main>

      {/* Bottom Navigation (Mobile) - Hidden on auth pages */}
      {!isAuthPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-unity-100 p-2 z-50 flex justify-around items-center pb-safe">
          {bottomNavItems.filter(item => item.id !== 'admin' || user?.email === 'lepiromatayo@gmail.com').map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as AppView)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${currentView === item.id
                ? 'text-unity-500'
                : 'text-gray-400'
                }`}
            >
              <item.icon size={24} className={currentView === item.id ? 'fill-unity-50' : ''} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}