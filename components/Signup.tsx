import React, { useState } from 'react';
import { Heart, Lock, Mail, User, Eye, EyeOff, Phone } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface SignupProps {
    onSignupComplete: () => void;
    onSwitchToLogin: () => void;
}

export const Signup: React.FC<SignupProps> = ({ onSignupComplete, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        emergencyContact: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        // Validate emergency contact starts with +
        if (formData.emergencyContact && !formData.emergencyContact.startsWith('+')) {
            setIsLoading(false);
            setMessage('Emergency contact must start with + (e.g., +1234567890)');
            return;
        }

        try {
            // Call backend API
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    emergencyContact: formData.emergencyContact
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));

                setIsLoading(false);
                setMessage('gentle');

                // Show gentle transition
                setTimeout(() => {
                    onSignupComplete();
                }, 2000);
            } else {
                // Handle error
                setIsLoading(false);
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setIsLoading(false);
            setMessage('Unable to reach the server. Please ensure the backend is running (run npm run dev:all).');
        }
    };

    const handleRetry = async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                if (data.database === 'connected') {
                    setMessage('gentle');
                    setTimeout(() => setMessage(''), 3000);
                } else {
                    setMessage(`Server is UP, but database is ${data.database}.`);
                }
            } else {
                setMessage('Server replied with an error.');
            }
        } catch (e) {
            setMessage('Still unable to connect. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        setMessage('Connecting gently...');
        // Google OAuth would go here
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle background shapes */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Buddie Illustration */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                        <Heart className="text-unity-500 fill-unity-100" size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 leading-tight">
                        You're not alone.
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Create a private space to breathe, reflect, and feel supported.
                    </p>
                </div>

                {/* Signup Form */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-10">
                    {message === 'gentle' ? (
                        <div className="text-center py-8">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="text-green-600 fill-green-200" size={32} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Take a breath.</h2>
                            <p className="text-gray-600">Your space is ready.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {message && message !== 'gentle' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm text-orange-800 flex items-start gap-2">
                                            <span className="text-lg">💭</span>
                                            <span>{message}</span>
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleRetry}
                                            disabled={isLoading}
                                            className="text-xs font-bold text-unity-600 hover:text-unity-700 bg-white border border-unity-200 py-2 rounded-xl transition-all self-end px-4"
                                        >
                                            {isLoading ? 'Checking...' : 'Check Connection'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    What should we call you? <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="Your name or nickname"
                                    />
                                </div>
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-gray-500 font-normal text-xs">(so we can keep your space safe)</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            {/* Emergency Contact Field */}
                            <div>
                                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                                    Emergency Contact <span className="text-gray-500 font-normal text-xs">(optional, must start with +)</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="tel"
                                        id="emergencyContact"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        maxLength={20}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="+1234567890"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Create a password <span className="text-gray-500 font-normal text-xs">(only you can see this)</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="Use something easy to remember"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Privacy Reassurance */}
                            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                                <p className="text-sm text-gray-600 flex items-start gap-2">
                                    <Lock className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                                    <span>
                                        <strong className="text-gray-700">Your thoughts stay private.</strong><br />
                                        We never read or share your personal entries.
                                    </span>
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-unity-500 to-unity-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Creating your space...' : 'Create my safe space'}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">or continue gently with</span>
                                </div>
                            </div>

                            {/* Social Login */}
                            <button
                                type="button"
                                onClick={handleGoogleSignup}
                                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-3"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Link */}
                {message !== 'gentle' && (
                    <div className="text-center mt-6">
                        <p className="text-gray-600">
                            Already have a space?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-unity-600 font-semibold hover:text-unity-700 transition-colors underline"
                            >
                                Welcome back
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
