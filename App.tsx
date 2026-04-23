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
const TherapySupport = lazy(() => import('./components/TherapySupport').then(module => ({ default: module.TherapySupport })));
const NameTheFeeling = lazy(() => import('./components/NameTheFeeling').then(module => ({ default: module.NameTheFeeling })));
const CompassionBuilder = lazy(() => import('./components/CompassionBuilder').then(module => ({ default: module.CompassionBuilder })));
const ValuesDirection = lazy(() => import('./components/ValuesDirection').then(module => ({ default: module.ValuesDirection })));
const BodyScan = lazy(() => import('./components/BodyScan').then(module => ({ default: module.BodyScan })));
const SafeSpace = lazy(() => import('./components/SafeSpace').then(module => ({ default: module.SafeSpace })));
const StoryReframer = lazy(() => import('./components/StoryReframer').then(module => ({ default: module.StoryReframer })));
const VolunteerPage = lazy(() => import('./components/VolunteerPage').then(module => ({ default: module.VolunteerPage })));
const AdminVolunteerPortalMonitor = lazy(() => import('./components/AdminVolunteerPortalMonitor').then(module => ({ default: module.AdminVolunteerPortalMonitor })));
const VolunteerApplicationForm = lazy(() => import('./src/components/VolunteerApplicationForm').then(module => ({ default: module.VolunteerApplicationForm })));
const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const Signup = lazy(() => import('./components/Signup').then(module => ({ default: module.Signup })));
const Login = lazy(() => import('./components/Login').then(module => ({ default: module.Login })));
const ForgotPassword = lazy(() => import('./components/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const WhyUnity = lazy(() => import('./components/WhyUnity').then(module => ({ default: module.WhyUnity })));

// Loading Component
const PageLoader = () => (
  <div className="h-full flex flex-col items-center justify-center text-unity-400 p-8">
    <Loader2 size={40} className="animate-spin mb-4" />
    <p className="text-sm font-medium animate-pulse">Loading Unity...</p>
  </div>
);

type AppView = ViewState | 'volunteer' | 'volunteer-invite' | 'landing' | 'signup' | 'login' | 'forgot-password' | 'why-unity';

export default function App() {
  const inviteMatch = window.location.pathname.match(/^\/volunteer-invite\/([^/?#]+)/i);
  const initialInviteToken = inviteMatch?.[1] || '';

  const [currentView, setCurrentView] = useState<AppView>(initialInviteToken ? 'volunteer-invite' : 'landing');
  const [inviteToken] = useState(initialInviteToken);
  const [navData, setNavData] = useState<any>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; email: string; role?: string } | null>(null);
  const [isVolunteerApproved, setIsVolunteerApproved] = useState(false);

  const checkVolunteerApproval = React.useCallback(async (currentUser: { email?: string } | null) => {
    if (!currentUser?.email) {
      setIsVolunteerApproved(false);
      return;
    }

    try {
      const res = await fetch('/api/volunteer/dashboard', {
        headers: {
          'x-user-email': String(currentUser.email).trim().toLowerCase(),
        },
      });

      if (!res.ok) {
        setIsVolunteerApproved(false);
        return;
      }

      const data = await res.json();
      const status = String(data?.data?.profile?.status || '').toLowerCase();
      setIsVolunteerApproved(status === 'approved' || status === 'active');
    } catch {
      setIsVolunteerApproved(false);
    }
  }, []);

  const handleNavigate = (view: AppView, data?: any) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    if (data) {
      setNavData(data);
    } else {
      setNavData({});
    }
  };

  React.useEffect(() => {
    if (inviteToken) {
      setCurrentView('volunteer-invite');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      void checkVolunteerApproval(parsedUser);
      if (currentView === 'landing' || currentView === 'login' || currentView === 'signup') {
        setCurrentView('dashboard');
      }
    }
  }, [currentView, checkVolunteerApproval, inviteToken]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setIsVolunteerApproved(false);
    setCurrentView('landing');
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
              if (stored) {
                const parsedUser = JSON.parse(stored);
                setUser(parsedUser);
                void checkVolunteerApproval(parsedUser);
              }
              setIsAuthenticated(true);
              setCurrentView('dashboard');
            }}
            onSwitchToSignup={() => setCurrentView('signup')}
            onForgotPassword={() => setCurrentView('forgot-password')}
          />
        );
      case 'forgot-password':
        return <ForgotPassword onBackToLogin={() => setCurrentView('login')} />;
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
       case 'support':
         return (
           <TherapySupport
             userId={user?.id}
             userName={user?.name}
             userEmail={user?.email}
             userRole={user?.role}
             initialTab="directory"
           />
         );
       case 'therapist-portal':
         return (
           <TherapySupport
             userId={user?.id}
             userName={user?.name}
             userEmail={user?.email}
             userRole={user?.role}
             initialTab="therapist-portal"
           />
         );
       case 'chat':
        return <AIChat />;
      case 'community':
        return <Community userId={user?.id} userName={user?.name} />;
      case 'admin':
        return (user?.role === 'admin' || user?.email === 'lepiromatayo@gmail.com') ? <AdminDashboard /> : <Dashboard onNavigate={handleNavigate} userName={user?.name || 'Friend'} userId={user?.id} />;
      case 'admin-volunteer-portal':
        return (user?.role === 'admin' || user?.email === 'lepiromatayo@gmail.com')
          ? <AdminVolunteerPortalMonitor />
          : <Dashboard onNavigate={handleNavigate} userName={user?.name || 'Friend'} userId={user?.id} />;
      case 'journal':
        return <Journal userId={user?.id} moodId={navData?.moodId} />;
      case 'volunteer':
        return isVolunteerApproved
          ? <VolunteerPage onLogout={handleLogout} />
          : <Dashboard onNavigate={handleNavigate} userName={user?.name || 'Friend'} userId={user?.id} />;
      case 'volunteer-invite':
        return <VolunteerApplicationForm inviteToken={inviteToken} onSuccess={() => setCurrentView('login')} />;
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
  const isAuthPage = ['landing', 'signup', 'login', 'forgot-password', 'why-unity', 'volunteer-invite'].includes(currentView);
   const isAdmin = user?.role === 'admin' || user?.email === 'lepiromatayo@gmail.com';
   const isTherapist = user?.role === 'therapist';
   const visibleNavItems = NAVIGATION_ITEMS.filter(item => {
     if (item.id === 'admin') return isAdmin;
     if (item.id === 'admin-volunteer-portal') return isAdmin;
     if (item.id === 'therapist-portal') return isAdmin || isTherapist;
     if (item.id === 'volunteer') return isVolunteerApproved;
     if (item.id === 'journal') return !isVolunteerApproved;
     return true;
   });
  const stickyBottomNavIds: AppView[] = ['dashboard', 'chat', 'community'];
  const mobileBottomNavItems = visibleNavItems.filter(item => stickyBottomNavIds.includes(item.id as AppView));
  const mobileMenuItems = visibleNavItems.filter(item => !stickyBottomNavIds.includes(item.id as AppView));

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
             {visibleNavItems.map((item) => (
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
          <div className="md:hidden flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-unity-600">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="h-9 w-9 rounded-xl bg-white border border-unity-100 text-unity-600 shadow-sm flex items-center justify-center"
                aria-label="Open mobile menu"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <Heart className="fill-current" size={24} />
              <span className="font-extrabold text-lg text-unity-black">UNITY</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-unity-100 flex items-center justify-center text-unity-600 text-xs font-bold">
                {user ? user.name?.charAt(0).toUpperCase() || 'U' : 'U'}
              </div>
            </div>
          </div>
        )}

        {!isAuthPage && isMobileMenuOpen && (
          <div className="md:hidden mb-4 rounded-2xl border border-unity-100 bg-white/95 backdrop-blur-sm shadow-lg p-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
            <p className="px-2 pt-1 pb-2 text-[11px] uppercase tracking-[0.18em] text-unity-400 font-bold">More</p>
            {mobileMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id as AppView)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${currentView === item.id
                  ? 'bg-unity-50 text-unity-600'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <item.icon size={18} className={currentView === item.id ? 'stroke-[2.4px]' : 'stroke-2'} />
                <span>{item.label}</span>
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-unity-100">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
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
          {mobileBottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as AppView)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${currentView === item.id
                ? 'text-unity-500 bg-unity-50/70'
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