import React, { useState } from 'react';
import { Button } from './Button';
import { GoogleButton } from './GoogleButton';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { Heart, Eye, EyeOff, Mail, Lock, User as UserIcon, Chrome, Apple, Phone } from 'lucide-react';

import { User } from '../types';

export const Signup: React.FC<{ onNavigate: (view: string) => void; onLoginSuccess: (user: User) => void }> = ({ onNavigate, onLoginSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addEmergencyContact, setAddEmergencyContact] = useState<boolean | null>(null);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        const userInfo = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );

        const googleUser: User = {
          id: userInfo.data.sub,
          firstName: userInfo.data.given_name,
          email: userInfo.data.email,
        };

        onLoginSuccess(googleUser);
      } catch (error) {
        console.error('Google Signup Error:', error);
        alert('Failed to sign up with Google.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => alert('Google Signup Failed'),
  });

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          email,
          password,
          emergencyContact,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login page after successful signup
        onNavigate('login');
      } else {
        alert(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred during signup');
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
          <div className="w-20 h-20 bg-gradient-to-br from-[#F7C8D0] to-[#EDE8FF] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <Heart className="text-[#1A1A1A] fill-current" size={32} />
          </div>
          <p className="text-[#1A1A1A] text-lg font-medium">✨ Let's get you settled in.</p>
        </div>

        {/* Signup Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-[#C7C7C7]/20 p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Create Your Safe Space 💛</h1>
            <p className="text-[#C7C7C7] text-sm">Take your time. No rush at all.</p>
          </div>

          <div className="space-y-4">
            {/* First Name Input (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A1A]">
                First name <span className="text-[#C7C7C7]">(optional)</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7]" size={20} />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#FFFCFA] border border-[#C7C7C7]/30 rounded-2xl focus:ring-2 focus:ring-[#F7C8D0] focus:border-transparent outline-none transition-all text-[#1A1A1A] placeholder-[#C7C7C7]"
                  placeholder="How you'd like us to call you"
                />
              </div>
            </div>

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
                  placeholder="Create a safe password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7] hover:text-[#1A1A1A] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-[#C7C7C7]">We'll never share your details. This is your private space.</p>
            </div>
          </div>

          {/* Emergency Contact Option */}
          {addEmergencyContact === null && (
            <div className="bg-[#F7C8D0]/10 rounded-2xl p-4 border border-[#F7C8D0]/20">
              <p className="text-sm text-[#1A1A1A] mb-3 font-medium">
                Would you like to add a trusted contact for emergencies?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setAddEmergencyContact(false)}
                  variant="outline"
                  className="flex-1 border-[#C7C7C7]/30 text-[#1A1A1A] hover:bg-[#FFFCFA]"
                >
                  Add Later
                </Button>
                <Button
                  onClick={() => setAddEmergencyContact(true)}
                  className="flex-1 bg-[#F7C8D0] hover:bg-[#F7C8D0]/90 text-[#1A1A1A]"
                >
                  Add Now
                </Button>
              </div>
            </div>
          )}

          {/* Emergency Contact Input */}
          {addEmergencyContact && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A1A]">Emergency Contact</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7]" size={20} />
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#FFFCFA] border border-[#C7C7C7]/30 rounded-2xl focus:ring-2 focus:ring-[#F7C8D0] focus:border-transparent outline-none transition-all text-[#1A1A1A] placeholder-[#C7C7C7]"
                  placeholder="Phone number for emergencies"
                />
              </div>
              <p className="text-xs text-[#C7C7C7]">Only used in crisis situations. Your safety matters.</p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleSignup}
              disabled={isLoading || !email || !password}
              className={`font-medium py-4 rounded-2xl transition-all ${isLoading || !email || !password
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : 'bg-[#F7C8D0] hover:bg-[#ffb6c1] text-[#1A1A1A] shadow-sm hover:shadow-md'
                }`}
            >
              {isLoading ? 'Creating your space...' : 'Create Account'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#C7C7C7]/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#C7C7C7]">or sign up with</span>
              </div>
            </div>

            <div>
              <GoogleButton onClick={() => handleGoogleSignup()} />
            </div>
          </div>

          {/* Already have an account link */}
          <div className="text-center">
            <button
              onClick={() => onNavigate('login')}
              className="text-[#C7C7C7] hover:text-[#1A1A1A] text-sm transition-colors"
            >
              Already have an account? <span className="font-medium text-[#F7C8D0]">Sign in</span>
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};
