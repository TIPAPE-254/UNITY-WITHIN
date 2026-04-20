import React from 'react';
import { User, ViewState } from '../types';
import { API_BASE_URL } from '../constants';

interface LoginProps {
  onNavigate: (view: ViewState) => void;
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      let user = data.user as User;

      // Check if user has an approved volunteer application
      try {
        const volunteerResponse = await fetch(`${API_BASE_URL}/api/volunteer/status/${encodeURIComponent(email)}`);
        if (volunteerResponse.ok) {
          const volunteerData = await volunteerResponse.json();
          if (volunteerData.success && volunteerData.isApproved) {
            // Add volunteer information to user object
            user = {
              ...user,
              volunteerStatus: volunteerData.status,
              volunteerRoles: volunteerData.roles,
              volunteerCategory: volunteerData.category,
              applicationId: volunteerData.applicationId
            };
          }
        }
      } catch (volunteerError) {
        console.error('Error fetching volunteer status:', volunteerError);
        // Continue with login even if volunteer status fetch fails
      }

      onLoginSuccess(user);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Welcome Back</h1>
      
      {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 text-white py-2 rounded-lg font-semibold hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Don't have an account?{' '}
        <button
          onClick={() => onNavigate('signup')}
          className="text-pink-500 hover:underline font-semibold"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
