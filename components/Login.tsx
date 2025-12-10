import React, { useState } from 'react';
import { Button } from './Button';
import { GoogleButton } from './GoogleButton';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Heart, Eye, EyeOff, Mail, Lock, Chrome, Apple } from 'lucide-react';

import { User } from '../types';

interface LoginProps {
  onNavigate: (view: string) => void;
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const googleUser = {
          id: userInfo.data.sub,
          firstName: userInfo.data.given_name,
          email: userInfo.data.email,
        };

        // In a real app, you would send this token/data to your backend to verify and create session
        onLoginSuccess(googleUser);
      } catch (error) {
        console.error('Google Login Error:', error);
        alert('Failed to login with Google.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => alert('Google Login Failed'),
  });

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        onLoginSuccess(data.user);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/images/young-kenyans-unity.png')" }}>
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Buddie Avatar */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#F7C8D0] to-[#EDE8FF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="text-[#1A1A1A] fill-current" size={32} />
          </div>
          <p className="text-[#1A1A1A] text-lg font-medium">✨ Hey, good to see you again.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-[#C7C7C7]/20 p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Welcome Back 🤍</h1>
            <p className="text-[#C7C7C7] text-sm">Take your time. We're here when you're ready.</p>
          </div>

          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7]" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#FFFCFA] border border-[#C7C7C7]/30 rounded-2xl focus:ring-2 focus:ring-[#F7C8D0] focus:border-transparent outline-none transition-all text-[#1A1A1A] placeholder-[#C7C7C7]"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7]" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-[#FFFCFA] border border-[#C7C7C7]/30 rounded-2xl focus:ring-2 focus:ring-[#F7C8D0] focus:border-transparent outline-none transition-all text-[#1A1A1A] placeholder-[#C7C7C7]"
                  placeholder="Your password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7] hover:text-[#1A1A1A] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-[#C7C7C7]">You're safe here. Your info stays private.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className={`font-medium py-4 rounded-2xl transition-all ${isLoading || !email || !password
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-[#F7C8D0] hover:bg-[#ffb6c1] text-[#1A1A1A] shadow-sm hover:shadow-md'
                }`}
            >
              {isLoading ? 'Finding your space...' : 'Continue'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#C7C7C7]/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#C7C7C7]">or continue with</span>
              </div>
            </div>

            <div>
              <GoogleButton onClick={() => handleGoogleLogin()} />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-center">
            <button className="text-sm text-[#C7C7C7] hover:text-[#1A1A1A] transition-colors">
              Forgot it? It's okay. Reset it here.
            </button>
          </div>
        </div>

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-[#C7C7C7] text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-[#F7C8D0] hover:text-[#F7C8D0]/80 font-medium transition-colors"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
