import React, { useEffect, useState } from 'react';
import { AuthenticateWithRedirectCallback, useSession } from '@clerk/react';
import { Heart, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../constants';

export const ClerkSsoCallback: React.FC = () => {
  const { session, isLoaded } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const syncUserSession = async () => {
      if (!isLoaded || !session) return;

      setIsProcessing(true);
      try {
        // Get the session token
        const token = await session.getToken();
        if (!token) throw new Error('Failed to get session token');

        // Call backend to sync/create user and get user info
        const response = await fetch(`${API_BASE_URL}/auth/clerk-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to sync user session');
        }

        const data = await response.json();

        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard
        window.location.href = '/';
      } catch (err) {
        console.error('Clerk sync error:', err);
        setError('Failed to complete sign-in. Please try again.');
        setIsProcessing(false);
      }
    };

    syncUserSession();
  }, [session, isLoaded]);

  if (!isLoaded || isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <Heart className="text-unity-500 fill-unity-100 animate-pulse" size={40} />
          </div>
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-unity-500 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-800">Creating your space...</h2>
            <p className="text-gray-600 text-sm">We're setting everything up for you gently.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Heart className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-unity-500 text-white rounded-full font-semibold hover:bg-unity-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // This should be handled by the useEffect above, but fallback to Clerk's component
  return <AuthenticateWithRedirectCallback />;
};
