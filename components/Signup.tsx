import React, { useState } from 'react';
import { Button } from './Button';
import { Heart, Eye, EyeOff, Mail, Lock, User, Chrome, Apple, Phone } from 'lucide-react';

export const Signup: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addEmergencyContact, setAddEmergencyContact] = useState<boolean | null>(null);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    setIsLoading(true);
    // Simulate signup process
    setTimeout(() => {
      setIsLoading(false);
      onNavigate('dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFCFA] via-[#F7C8D0]/20 to-[#EDE8FF]/30 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-unity-200"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-unity-300"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-unity-100"></div>
      </div>

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
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C7C7C7]" size={20} />
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
              className="bg-[#F7C8D0] hover:bg-[#F7C8D0]/90 text-[#1A1A1A] font-medium py-4 rounded-2xl transition-all"
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

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-3 py-3 px-4 bg-[#FFFCFA] border border-[#C7C7C7]/30 rounded-2xl hover:bg-[#F7C8D0]/10 transition-all">
                <Chrome size={20} className="text-[#1A1A1A]" />
                <span className="text-sm font-medium text-[#1A1A1A]">Google</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-3 px-4 bg-[#FFFCFA] border border-[#C7C7C7]/30 rounded-2xl hover:bg-[#F7C8D0]/10 transition-all">
                <Apple size={20} className="text-[#1A1A1A]" />
                <span className="text-sm font-medium text-[#1A1A1A]">Apple</span>
              </button>
            </div>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-[#C7C7C7] text-sm">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#F7C8D0] hover:text-[#F7C8D0]/80 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
