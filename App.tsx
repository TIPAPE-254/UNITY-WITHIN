import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
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
import { Heart } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('unity_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewState);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('unity_user', JSON.stringify(loggedInUser));
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login': // Login now receives onLoginSuccess
        return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
      case 'signup':
        return <Signup onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} userName={user?.firstName} />;
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
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col md:flex-row text-unity-black font-sans selection:bg-unity-200 selection:text-unity-900">

        {/* Sidebar (Desktop) - Hidden on landing, login, and signup pages */}
        {currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && (
          <aside className="hidden md:flex flex-col w-64 bg-white border-r border-unity-100 p-6 fixed h-full z-20">
            <div className="flex items-center gap-2 mb-10 text-unity-600">
              <Heart className="fill-current" size={28} />
              <h1 className="text-xl font-extrabold tracking-tight text-unity-black">UNITY <span className="text-unity-500">WITHIN</span></h1>
            </div>

            <nav className="space-y-2 flex-1">
              {NAVIGATION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
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
                  {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-unity-black">{user?.firstName || 'User Account'}</p>
                  <p className="text-gray-400 text-xs">you matter!</p>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={`${(currentView === 'landing' || currentView === 'login' || currentView === 'signup') ? 'w-full' : 'flex-1 md:ml-64'} p-4 pb-24 md:p-8 md:pb-8 max-w-5xl mx-auto w-full transition-all`}>
          {/* Mobile Header - Hidden on landing, login, and signup pages */}
          {currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && (
            <div className="md:hidden flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-unity-600">
                <Heart className="fill-current" size={24} />
                <span className="font-extrabold text-lg text-unity-black">UNITY</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-unity-100 flex items-center justify-center text-unity-600 text-xs font-bold">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}

          {renderContent()}
        </main>

        {/* Bottom Navigation (Mobile) - Hidden on landing, login, and signup pages */}
        {currentView !== 'landing' && currentView !== 'login' && currentView !== 'signup' && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-unity-100 p-2 z-50 flex justify-around items-center pb-safe">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
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
    </GoogleOAuthProvider>
  );
}