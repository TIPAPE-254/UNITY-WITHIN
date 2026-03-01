import React, { useState } from 'react';
import { Heart, Lock, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface ResetPasswordProps {
    token: string;
    onBackToLogin: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onBackToLogin }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('Please use at least 6 characters for your new password.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Token is invalid or expired. Please request a new reset link.');
                setIsLoading(false);
                return;
            }

            setIsSuccess(true);
            setIsLoading(false);
        } catch (err) {
            console.error('Reset password error:', err);
            setError('Unable to reach the server. Please try again in a moment.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-amber-50 flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                        <Heart className="text-unity-500 fill-unity-100" size={40} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3 leading-tight">
                        New password
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Choose a fresh password for your account.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 md:p-10">
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">Password updated</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                You can now log in with your new password.
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
                            {error && (
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    New password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        id="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="Enter your new password"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm new password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-unity-300 focus:border-transparent transition-all"
                                        placeholder="Re-enter your new password"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-unity-500 to-unity-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Saving...' : 'Reset password'}
                            </button>

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
