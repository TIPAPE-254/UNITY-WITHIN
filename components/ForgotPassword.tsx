import React, { useState } from 'react';
import { Heart, Mail, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface ForgotPasswordProps {
    onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Unable to send reset link right now. Please try again.');
                setIsLoading(false);
                return;
            }

            setIsSent(true);
            setIsLoading(false);
        } catch (err) {
            console.error('Forgot password error:', err);
            setError('Unable to reach the server. Please try again in a moment.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle background shapes */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                        <Heart className="text-unity-500 fill-unity-100" size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 leading-tight">
                        We'll help you.
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Let's reset your password calmly.
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-10">
                    {isSent ? (
                        <div className="text-center py-4">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="text-green-600" size={32} />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">Check your email</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                We've sent you instructions to reset your password. It might take a moment to arrive.
                            </p>
                            <button
                                onClick={onBackToLogin}
                                className="text-unity-600 font-semibold hover:text-unity-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                            >
                                <ArrowLeft size={16} />
                                Back to login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <p className="text-gray-600 leading-relaxed">
                                Enter your email address and we'll send you a link to create a new password.
                            </p>

                            {error && (
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800">
                                    {error}
                                </div>
                            )}

                            {/* Email Field */}
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        id="reset-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-unity-500 to-unity-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending...' : 'Send reset link'}
                            </button>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={onBackToLogin}
                                className="w-full text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Back to login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
