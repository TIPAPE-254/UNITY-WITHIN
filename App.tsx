// @ts-nocheck
import React, { useState, Suspense, lazy } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { EventsApp } from './components/EventsApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CLERK_PUBLISHABLE_KEY, getStoredUnityUser, storeUnityUser, clearUnityUser, bootstrapUnityUserFromSharedSession } from './clerk';
import { NAVIGATION_ITEMS } from './constants';
import { ViewState } from './types';
import { Home, MessageCircleHeart, BookHeart, Wind, GraduationCap, LogOut, Menu, X, Heart, Loader2, Bell } from 'lucide-react';

import { CrisisResource } from './components/CrisisResource';

// Lazy Load Pages for Performance (Code Splitting)
const NotificationInbox = lazy(() => import('./components/NotificationInbox').then(module => ({ default: module.NotificationInbox })));
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const AIChat = lazy(() => import('./components/AIChat').then(module => ({ default: module.AIChat })));
const Community = lazy(() => import('./components/Community').then(module => ({ default: module.Community })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const Journal = lazy(() => import('./components/Journal').then(module => ({ default: module.Journal })));
const Breathe = lazy(() => import('./components/Breathe').then(module => ({ default: module.Breathe })));
const Education = lazy(() => import('./components/Education').then(module => ({ default: module.Education })));
const Learn = lazy(() => import('./components/Learn').then(module => ({ default: module.Learn })));
const WellnessToolkit = lazy(() => import('./components/WellnessToolkit').then(module => ({ default: module.WellnessToolkit })));
const NameTheFeeling = lazy(() => import('./components/NameTheFeeling').then(module => ({ default: module.NameTheFeeling })));
const CompassionBuilder = lazy(() => import('./components/CompassionBuilder').then(module => ({ default: module.CompassionBuilder })));
const ValuesDirection = lazy(() => import('./components/ValuesDirection').then(module => ({ default: module.ValuesDirection })));
const BodyScan = lazy(() => import('./components/BodyScan').then(module => ({ default: module.BodyScan })));
const SafeSpace = lazy(() => import('./components/SafeSpace').then(module => ({ default: module.SafeSpace })));
const StoryReframer = lazy(() => import('./components/StoryReframer').then(module => ({ default: module.StoryReframer })));
const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const Login = lazy(() => import('./components/Login').then(module => ({ default: module.Login })));
const Signup = lazy(() => import('./components/Signup').then(module => ({ default: module.Signup })));
const ForgotPassword = lazy(() => import('./components/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const ResetPassword = lazy(() => import('./components/ResetPassword').then(module => ({ default: module.ResetPassword })));
const WhyUnity = lazy(() => import('./components/WhyUnity').then(module => ({ default: module.WhyUnity })));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const Support = lazy(() => import('./components/Support').then(module => ({ default: module.Support })));
const TherapistProfile = lazy(() => import('./components/TherapistProfile').then(module => ({ default: module.TherapistProfile })));
const TherapistLogin = lazy(() => import('./components/TherapistLogin').then(module => ({ default: module.TherapistLogin })));
const TherapistPortal = lazy(() => import('./components/TherapistPortal').then(module => ({ default: module.TherapistPortal })));
const TherapistInviteOnboarding = lazy(() => import('./components/TherapistInviteOnboarding').then(module => ({ default: module.TherapistInviteOnboarding })));
import { ClerkOAuthCallback } from './components/ClerkOAuthCallback';
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));

// Loading Component
const PageLoader = () => (
  <div className="h-full flex flex-col items-center justify-center text-unity-400 p-8">
    <Loader2 size={40} className="animate-spin mb-4" />
    <p className="text-sm font-medium animate-pulse">Loading Unity...</p>
  </div>
);

type AppView = ViewState | 'landing' | 'signup' | 'login' | 'therapist-login' | 'therapist-portal' | 'therapist-invite' | 'forgot-password' | 'reset-password' | 'why-unity' | 'sso-callback' | 'privacy' | 'learn';

export default function App() {
  // Only one definition, at the top, before any usage
  const getSafePostLoginRedirect = React.useCallback(() => {
    const rawNext = new URLSearchParams(window.location.search).get('next');
    if (!rawNext) {
      return null;
    }
    try {
      // Handle both relative paths (/events/slug) and absolute URLs
      let targetUrl: URL;
      if (rawNext.startsWith('/')) {
        // Relative path - construct full URL for validation
        targetUrl = new URL(rawNext, window.location.origin);
      } else {
        // Absolute URL
        targetUrl = new URL(rawNext);
      }
      
      const host = targetUrl.hostname.toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      const isAllowedEventsHost = host === 'unitywithin.app' || host.endsWith('unitywithin.app');
      const isSameOrigin = targetUrl.origin === window.location.origin;
      
      if (isAllowedEventsHost || isLocal || isSameOrigin) {
        // For relative paths, return just the path
        if (rawNext.startsWith('/')) {
          console.log('[Auth Redirect] Going to:', rawNext);
          return rawNext;
        }
        return targetUrl.toString();
      }
    } catch (error) {
      console.error('[Auth] Failed to parse next redirect:', error);
      return null;
    }
    return null;
  }, []);

  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [authInitialized, setAuthInitialized] = useState(false); // Track if we've restored auth

  const [navData, setNavData] = useState<any>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; displayName?: string; email: string; role?: string; authProvider?: string; trusted?: boolean; clerkUserId?: string } | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [therapistInviteToken, setTherapistInviteToken] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | undefined>(undefined);
  const [supportMode, setSupportMode] = useState<'chat' | 'voice' | 'video' | undefined>(undefined);
  const [selectedSupportSessionId, setSelectedSupportSessionId] = useState<number | undefined>(undefined);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);


  // No more subdomain redirect: render EventsApp directly for /events and event detail routes




  // Map view state to URL path
  const viewToPath = (view: AppView, data?: any) => {
    switch (view) {
      case 'events': return data?.path || '/events';
      case 'dashboard': return '/dashboard';
      case 'wellness': return '/toolkit';
      case 'chat': return '/chat';
      case 'community': return '/community';
      case 'journal': return '/journal';
      case 'breathe': return '/breathe';
      case 'education': return '/education';
      case 'learn': return '/learn';
      case 'admin': return '/admin';
      case 'namethefeeling': return '/namethefeeling';
      case 'selfcompassion': return '/selfcompassion';
      case 'values': return '/values';
      case 'bodyscan': return '/bodyscan';
      case 'safespace': return '/safespace';
      case 'reframer': return '/reframer';
      case 'profile': return '/profile';
      case 'support': return '/support';
      case 'therapist-profile': return data?.therapistId ? `/support/${data.therapistId}` : (selectedTherapistId ? `/support/${selectedTherapistId}` : '/support');
      case 'landing': return '/';
      case 'signup': return '/sign-up';
      case 'login': return '/sign-in';
      case 'sso-callback': return '/sso-callback';
      case 'therapist-login': return '/therapist-login';
      case 'therapist-portal': return '/therapist-portal';
      case 'therapist-invite': return therapistInviteToken ? `/therapist-invite/${encodeURIComponent(therapistInviteToken)}` : '/therapist-invite';
      case 'forgot-password': return '/forgot-password';
      case 'reset-password': return resetToken ? `/reset-password/${resetToken}` : '/reset-password';
      case 'why-unity': return '/why-unity';
      case 'privacy': return '/privacy';
      default: return '/dashboard';
    }
  };

  // Map URL path to view state
  const pathToView = (pathname: string): AppView => {
    if (/^\/events(\/.*)?$/.test(pathname)) return 'events';
    if (/^\/dashboard$/.test(pathname)) return 'dashboard';
    if (/^\/onboarding$/.test(pathname)) return 'dashboard';
    if (/^\/toolkit$/.test(pathname)) return 'wellness';
    if (/^\/chat$/.test(pathname)) return 'chat';
    if (/^\/community$/.test(pathname)) return 'community';
    if (/^\/journal$/.test(pathname)) return 'journal';
    if (/^\/breathe$/.test(pathname)) return 'breathe';
    if (/^\/education$/.test(pathname)) return 'education';
    if (/^\/learn(:\/[^\/]+\/[^\/]+)?$/.test(pathname)) return 'learn';
    if (/^\/admin$/.test(pathname)) return 'admin';
    if (/^\/namethefeeling$/.test(pathname)) return 'namethefeeling';
    if (/^\/selfcompassion$/.test(pathname)) return 'selfcompassion';
    if (/^\/values$/.test(pathname)) return 'values';
    if (/^\/bodyscan$/.test(pathname)) return 'bodyscan';
    if (/^\/safespace$/.test(pathname)) return 'safespace';
    if (/^\/reframer$/.test(pathname)) return 'reframer';
    if (/^\/profile$/.test(pathname)) return 'profile';
    if (/^\/support$/.test(pathname)) return 'support';
    if (/^\/support\/[0-9]+$/.test(pathname)) return 'therapist-profile';
    if (/^\/landingpage$/.test(pathname)) return 'landing';
    if (/^\/$/.test(pathname)) return 'landing';
    if (/^\/signup$/.test(pathname)) return 'signup';
    if (/^\/sign-up$/.test(pathname)) return 'signup';
    if (/^\/login$/.test(pathname)) return 'login';
    if (/^\/sign-in$/.test(pathname)) return 'login';
    if (/^\/sso-callback$/.test(pathname)) return 'sso-callback';
    if (/^\/therapist-login$/.test(pathname)) return 'therapist-login';
    if (/^\/therapist-portal$/.test(pathname)) return 'therapist-portal';
    if (/^\/therapist-invite\//.test(pathname)) return 'therapist-invite';
    if (/^\/forgot-password$/.test(pathname)) return 'forgot-password';
    if (/^\/reset-password\//.test(pathname)) return 'reset-password';
    if (/^\/why-unity$/.test(pathname)) return 'why-unity';
    if (/^\/privacy$/.test(pathname)) return 'privacy';
    return 'dashboard';
  };

  // Enhanced navigation handler with pushState

  const handleNavigate = (view: AppView, data?: any) => {
    if (view === 'events') {
      setCurrentView('events');
      setIsMobileMenuOpen(false);
      setNavData(data || {});
      window.history.pushState({ view }, '', data?.path || '/events');
      return;
    }

    setCurrentView(view);
    setIsMobileMenuOpen(false);
    if (view === 'therapist-profile') {
      setSelectedTherapistId(Number(data?.therapistId) || undefined);
      setSupportMode(data?.mode);
      setSelectedSupportSessionId(Number(data?.sessionId) || undefined);
    }
    if (view === 'support') {
      setSupportMode(undefined);
      setSelectedSupportSessionId(undefined);
    }
    if (view === 'therapist-invite') {
      setTherapistInviteToken(String(data?.token || ''));
    }
    if (data) {
      setNavData(data);
    } else {
      setNavData({});
    }
    const path = viewToPath(view, data);
    window.history.pushState({ view }, '', path);
  };

  React.useEffect(() => {
    const resetMatch = window.location.pathname.match(/^\/reset-password\/([^/]+)$/);
    if (resetMatch?.[1]) {
      setResetToken(decodeURIComponent(resetMatch[1]));
      setCurrentView('reset-password');
      return;
    }

    const supportMatch = window.location.pathname.match(/^\/support\/([0-9]+)$/);
    if (supportMatch?.[1]) {
      setSelectedTherapistId(Number(supportMatch[1]));
      setCurrentView('therapist-profile');
      return;
    }

    const inviteMatch = window.location.pathname.match(/^\/therapist-invite\/([^/]+)$/);
    if (inviteMatch?.[1]) {
      setTherapistInviteToken(decodeURIComponent(inviteMatch[1]));
      setCurrentView('therapist-invite');
      return;
    }

    // Initialize auth: try localStorage first, then bootstrap from server session
    const initializeAuth = async () => {
      const parsedUser = getStoredUnityUser();
      const initialView = pathToView(window.location.pathname);
      
      console.log('🚀 App initialization - pathname:', window.location.pathname, 'initialView:', initialView);

      setCurrentView(initialView);

      let isUserAuth = false;

      if (parsedUser) {
        // User found in localStorage - restore immediately
        console.log('✅ Restored user from localStorage:', parsedUser.email);
        setUser(parsedUser);
        setIsAuthenticated(true);
        isUserAuth = true;
      } else {
        // Try to bootstrap user from server session cookie
        console.log('🔄 No user in localStorage, checking server session...');
        const bootstrappedUser = await bootstrapUnityUserFromSharedSession();
        if (bootstrappedUser) {
          console.log('✅ Restored user from server session:', bootstrappedUser.email);
          setUser(bootstrappedUser);
          setIsAuthenticated(true);
          isUserAuth = true;
        } else {
          console.log('❌ No active server session found');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      // Mark auth as initialized so app can render protected routes
      setAuthInitialized(true);

      const safeNext = getSafePostLoginRedirect();
      if (safeNext && isUserAuth) {
        window.location.assign(safeNext);
        return;
      }
    };

    initializeAuth();
  }, [getSafePostLoginRedirect]);


  React.useEffect(() => {
    // Keep user in sync with Clerk session
    const user = getStoredUnityUser();
    if (user) {
      setUser(user);
      setIsAuthenticated(true);
    }
  }, [currentView]);

  // After auth is initialized, handle view-based redirects
  React.useEffect(() => {
    if (!authInitialized) {
      return; // Wait for auth check to complete
    }

    // If user is authenticated but on login/signup pages, redirect to dashboard
    if (isAuthenticated && ['landing', 'login', 'signup', 'sso-callback'].includes(currentView)) {
      console.log('🎯 User authenticated on login page, redirecting to dashboard');
      setCurrentView('dashboard');
      window.history.replaceState({ view: 'dashboard' }, '', '/dashboard');
    }
  }, [authInitialized, isAuthenticated, currentView]);

  // Check for auth when currentView changes
  // Note: 'events' is intentionally NOT in protectedRoutes - event details are always visible
  // Only RSVP action requires authentication (handled in EventsApp.tsx)
  // Also 'privacy' is not protected - it's a public info page
  React.useEffect(() => {
    if (!authInitialized) {
      return; // Wait for auth initialization to complete
    }

    const protectedRoutes = ['dashboard', 'chat', 'community', 'profile', 'journal', 'breathe', 'education', 'learn', 'wellness', 'support', 'therapist-profile', 'therapist-portal', 'admin', 'namethefeeling', 'selfcompassion', 'values', 'bodyscan', 'safespace', 'reframer'];
    if (!isAuthenticated && protectedRoutes.includes(currentView)) {
      console.log('🔒 Redirecting to landing - user not authenticated and view is protected:', currentView);
      setCurrentView('landing');
      window.history.replaceState({ view: 'landing' }, '', '/');
    }
  }, [authInitialized, currentView, isAuthenticated]);

  // Check if user is admin (encrypted admin email is decrypted on server)
  React.useEffect(() => {
    if (!user || !isAuthenticated) {
      setIsUserAdmin(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const headers: HeadersInit = {
          'x-user-email': user.email || ''
        };
        const res = await fetch('/api/user/is-admin', { headers });
        const data = await res.json();
        setIsUserAdmin(data.isAdmin || false);
      } catch (error) {
        console.error('Failed to check admin status:', error);
        setIsUserAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/unity-logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Continue local logout even if cookie cleanup request fails.
    }

    clearUnityUser();
    setUser(null);
    setIsAuthenticated(false);
    setAuthInitialized(true); // Auth check is done, result is: not authenticated
    setCurrentView('landing');
    window.history.pushState({ view: 'landing' }, '', '/');
  };

  const renderContent = () => {
    // Show loading screen while auth is being restored on app startup
    const protectedRoutes = ['dashboard', 'chat', 'community', 'profile', 'journal', 'breathe', 'education', 'learn', 'wellness', 'support', 'therapist-profile', 'therapist-portal', 'admin', 'namethefeeling', 'selfcompassion', 'values', 'bodyscan', 'safespace', 'reframer'];
    if (!authInitialized && protectedRoutes.includes(currentView)) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-unity-400 p-8">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="text-sm font-medium animate-pulse">Restoring your session...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'events':
        return (
          <ErrorBoundary>
            <EventsApp />
          </ErrorBoundary>
        );
      case 'landing':
        return <LandingPage onGetStarted={() => handleNavigate('signup')} onNavigate={handleNavigate} />;
      case 'signup':
        return (
          <Signup
            onSignupComplete={() => {
              // Sync auth state from localStorage immediately to prevent race condition
              const parsedUser = getStoredUnityUser();
              if (parsedUser) {
                setUser(parsedUser);
                setIsAuthenticated(true);
              }
              const safeNext = getSafePostLoginRedirect();
              if (safeNext) {
                // Redirect immediately to the next URL
                window.location.assign(safeNext);
                return;
              }
              handleNavigate('dashboard');
            }}
            onSwitchToLogin={() => {
              // Preserve ?next parameter when switching to login
              const nextParam = new URLSearchParams(window.location.search).get('next');
              const newPath = nextParam ? `/sign-in?next=${encodeURIComponent(nextParam)}` : '/sign-in';
              setCurrentView('login');
              setIsMobileMenuOpen(false);
              window.history.pushState({ view: 'login' }, '', newPath);
            }}
          />
        );
      case 'login':
        return (
          <Login
            onLoginComplete={() => {
              // Sync auth state from localStorage immediately to prevent race condition
              const parsedUser = getStoredUnityUser();
              if (parsedUser) {
                setUser(parsedUser);
                setIsAuthenticated(true);
              }
              const safeNext = getSafePostLoginRedirect();
              if (safeNext) {
                // Redirect immediately to the next URL
                window.location.assign(safeNext);
                return;
              }
              handleNavigate('dashboard');
            }}
            onSwitchToSignup={() => {
              // Preserve ?next parameter when switching to signup
              const nextParam = new URLSearchParams(window.location.search).get('next');
              const newPath = nextParam ? `/sign-up?next=${encodeURIComponent(nextParam)}` : '/sign-up';
              setCurrentView('signup');
              setIsMobileMenuOpen(false);
              window.history.pushState({ view: 'signup' }, '', newPath);
            }}
            onForgotPassword={() => handleNavigate('forgot-password')}
          />
        );
      case 'sso-callback':
        return <ClerkOAuthCallback />;
      case 'therapist-login':
        return (
          <TherapistLogin
            onLoginComplete={() => {
              // Clerk removed: getStoredUnityUser
              setIsAuthenticated(true);
              setCurrentView('therapist-portal');
              window.history.pushState({ view: 'therapist-portal' }, '', '/therapist-portal');
            }}
            onBack={() => setCurrentView('landing')}
          />
        );
      case 'therapist-portal':
        return <TherapistPortal onNavigate={handleNavigate} />;
      case 'therapist-invite':
        return <TherapistInviteOnboarding token={therapistInviteToken} onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <ForgotPassword onBackToLogin={() => setCurrentView('login')} />;
      case 'reset-password':
        return <ResetPassword token={resetToken} onBackToLogin={() => setCurrentView('login')} />;
      case 'why-unity':
        return <WhyUnity onBack={() => setCurrentView('landing')} />;
      case 'dashboard':
        return <Dashboard
          onNavigate={handleNavigate}
          userName={user?.displayName || user?.name || 'Friend'}
          userId={user?.id}
        />;
      case 'wellness':
        return <WellnessToolkit onNavigate={handleNavigate} />;
      case 'chat':
        return <AIChat />;
      case 'community':
        return <Community userId={user?.id} userName={user?.displayName || user?.name} />;
      case 'profile':
        return <ProfilePage user={user} />;
      case 'support':
        return <Support onNavigate={handleNavigate} />;
      case 'therapist-profile':
        return <TherapistProfile therapistId={selectedTherapistId} mode={supportMode} initialSessionId={selectedSupportSessionId} onNavigate={handleNavigate} />;
      case 'admin':
        return isUserAdmin ? <AdminDashboard onNavigate={handleNavigate} /> : <Dashboard onNavigate={handleNavigate} userName={user?.displayName || user?.name || 'Friend'} userId={user?.id} />;
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
      case 'learn': {
        const learnMatch = window.location.pathname.match(/^\/learn(?:\/([^\/]+)(?:\/([^\/]+))?)?$/);
        const pathId = learnMatch?.[1];
        const lessonId = learnMatch?.[2];
        return <Learn pathId={pathId} lessonId={lessonId} />;
      }
      case 'privacy':
        return <PrivacyPolicy onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  // Helper to check if we're on an auth/landing page (no sidebar/nav)
  // Also hide nav for events (shared event links should be minimal/distraction-free)
  const isAuthPage = ['landing', 'signup', 'login', 'sso-callback', 'therapist-login', 'therapist-invite', 'forgot-password', 'reset-password', 'why-unity', 'privacy', 'events'].includes(currentView);
  // Hamburger menu items: Toolkit, Learn, Breathe, Journal, Admin (for admins)
  const mobileMenuItemIds = isUserAdmin
    ? ['learn', 'breathe', 'events', 'journal', 'support', 'wellness', 'admin']
    : ['learn', 'breathe', 'events', 'journal', 'support', 'wellness'];
  const canAccessTherapistPortal = user?.role === 'therapist' || isUserAdmin;
  const userDisplayName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = userDisplayName?.charAt(0).toUpperCase() || 'U';
  // Bottom nav items: Home, Community, Buddie, Profile
  const bottomNavOrder = ['dashboard', 'chat', 'community', 'profile'];
  const mobileMenuItems = mobileMenuItemIds.map(id => NAVIGATION_ITEMS.find(item => item.id === id)).filter(Boolean);
  const bottomNavItems = bottomNavOrder.map(id => NAVIGATION_ITEMS.find(item => item.id === id)).filter(Boolean);

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <div className="min-h-screen min-h-dvh bg-[#FFF5F7] flex flex-col md:flex-row text-unity-black font-sans selection:bg-unity-200 selection:text-unity-900 min-w-0-safe">

      {/* Sidebar (Desktop) - Hidden on auth pages */}
      {!isAuthPage && (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-unity-100 p-6 fixed h-full z-20">
          <div className="flex items-center gap-2 mb-10 text-unity-600">
            <Heart className="fill-current" size={28} />
            <h1 className="text-xl font-extrabold tracking-tight text-unity-black">UNITY <span className="text-unity-500">WITHIN</span></h1>
          </div>

          <nav className="space-y-2 flex-1">
            {NAVIGATION_ITEMS.filter(item => item.id === 'admin' ? isUserAdmin : true).map((item) => (
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
            {canAccessTherapistPortal && (
              <button
                onClick={() => handleNavigate('therapist-portal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${currentView === 'therapist-portal'
                  ? 'bg-unity-50 text-unity-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-unity-500'
                  }`}
              >
                <Heart size={20} className={currentView === 'therapist-portal' ? 'stroke-[2.5px]' : 'stroke-2'} />
                Therapist Portal
              </button>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => handleNavigate('profile')}
                className="w-10 h-10 rounded-full bg-unity-100 hover:bg-unity-200 transition-colors flex items-center justify-center text-unity-600 font-bold"
                title="Open profile"
                aria-label="Open profile"
              >
                {userInitial}
              </button>
            </div>
            <div className="text-sm overflow-hidden">
              <button
                onClick={() => handleNavigate('profile')}
                className="font-bold text-unity-black truncate max-w-[120px] text-left hover:text-unity-600 transition-colors"
                title="Open profile"
              >
                {userDisplayName}
              </button>
              <div className="flex items-center gap-2">
                <p className="text-gray-400 text-xs truncate max-w-[120px]">{user?.email || 'Profile'}</p>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500 transition-colors" title="Log Out">
                  <LogOut size={12} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 min-w-0 ${!isAuthPage ? 'md:ml-64 p-4 pt-safe pb-28 md:p-8 md:pb-8' : ''} ${!isAuthPage ? 'max-w-5xl mx-auto' : ''} w-full transition-all`}>
        {/* Mobile Header - Hidden on auth pages */}
        {!isAuthPage && (
          <div className="md:hidden relative flex items-center justify-center mb-6 px-safe min-h-11">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="absolute left-0 w-11 h-11 rounded-full bg-unity-100 text-unity-600 flex items-center justify-center"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2 text-unity-600">
              <Heart className="fill-current" size={24} />
              <span className="font-extrabold text-lg text-unity-black">UNITY WITHIN</span>
            </div>
            <div className="absolute right-0 flex items-center gap-2">
              <button
                onClick={() => setShowNotificationPanel(prev => !prev)}
                className="w-8 h-8 rounded-full bg-white hover:bg-unity-50 transition-colors flex items-center justify-center text-unity-600 text-xs font-bold relative border border-unity-100"
                title="Notifications"
                aria-label="Open notifications"
              >
                <Bell size={14} />
              </button>
              <button
                onClick={() => handleNavigate('profile')}
                className="w-8 h-8 rounded-full bg-unity-100 hover:bg-unity-200 transition-colors flex items-center justify-center text-unity-600 text-xs font-bold"
                title="Open profile"
                aria-label="Open profile"
              >
                {userInitial}
              </button>
            </div>

            {/* Mobile Notification Panel */}
            {showNotificationPanel && (
              <div className="absolute top-full right-0 mt-2 w-[min(22rem,calc(100vw-1rem))] bg-white border border-unity-100 rounded-2xl shadow-lg z-30">
                <NotificationInbox onClose={() => setShowNotificationPanel(false)} />
              </div>
            )}

            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-[min(16rem,calc(100vw-2rem))] bg-white border border-unity-100 rounded-2xl shadow-sm p-2 z-30">
                {mobileMenuItems.filter(item => item.id !== 'admin' || isUserAdmin).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id as AppView)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${currentView === item.id
                      ? 'bg-unity-50 text-unity-600'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
                {canAccessTherapistPortal && (
                  <button
                    onClick={() => handleNavigate('therapist-portal')}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${currentView === 'therapist-portal'
                      ? 'bg-unity-50 text-unity-600'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <Heart size={16} />
                    Therapist Portal
                  </button>
                )}
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 px-safe bg-white/90 backdrop-blur-md border-t border-unity-100 p-2 z-50 flex justify-around items-center pb-safe">
          {bottomNavItems.filter(item => item.id !== 'admin' || isUserAdmin).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as AppView)}
              className={`flex flex-col items-center justify-center gap-1 px-2.5 py-2.5 min-h-11 min-w-[4.25rem] rounded-xl transition-all ${currentView === item.id
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
    </ClerkProvider>
  );
}
