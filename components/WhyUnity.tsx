
import React from 'react';
import { Shield, Heart, Wind, MessageCircle, Users, Lock, Smile, Activity, Sprout, ArrowLeft } from 'lucide-react';
import { Button } from './Button';

interface WhyUnityProps {
    onBack: () => void;
}

export const WhyUnity: React.FC<WhyUnityProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-[#FFF5F7] text-unity-black font-sans selection:bg-unity-200">
            {/* Nav / Header */}
            <nav className="p-6 md:px-12 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-unity-100">
                <div className="flex items-center gap-2 text-unity-600 cursor-pointer" onClick={onBack}>
                    <Heart className="fill-current" size={24} />
                    <span className="font-extrabold text-lg tracking-tight text-unity-black">UNITY WITHIN</span>
                </div>
                <Button variant="ghost" onClick={onBack} className="gap-2">
                    <ArrowLeft size={18} /> Back
                </Button>
            </nav>

            {/* Hero Section */}
            <header className="relative py-20 px-6 overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-unity-600 text-sm font-bold mb-8 animate-in slide-in-from-bottom-4">
                        <Sprout size={16} />
                        <span>Meeting Kenyan Youth Where They Are</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-unity-900 mb-6 leading-tight tracking-tight">
                        How We Help <span className="text-unity-500">You Bloom</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light max-w-2xl mx-auto">
                        Unity Within is a safe, digital mental-wellness space designed to help you notice, express, and gently respond to your emotions—without pressure, diagnosis, or alarm.
                    </p>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-unity-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
            </header>

            {/* Core Pillars Grid */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* 1. Safe Space */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield className="text-green-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Safe Space, Zero Stigma</h3>
                        <p className="text-gray-600 mb-4">Many avoid help because "people will judge." Here, you can express yourself anonymously using non-clinical language.</p>
                        <blockquote className="text-sm border-l-4 border-green-200 pl-3 italic text-gray-500">
                            "You don’t have to be strong all the time."
                        </blockquote>
                    </div>

                    {/* 2. Emotional Awareness */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Activity className="text-blue-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Noticing Before Crisis</h3>
                        <p className="text-gray-600 mb-4">We help you spot patterns early with gentle mood check-ins, preventing burnout and emotional buildup.</p>
                        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                            <li>Regular check-ins</li>
                            <li>Visible patterns</li>
                            <li>No "bad" emotions</li>
                        </ul>
                    </div>

                    {/* 3. Stress Management */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Wind className="text-purple-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Managing Pressure</h3>
                        <p className="text-gray-600 mb-4">School, money, family—it adds up. We provide calming tools like guided breathing and grounding techniques.</p>
                        <blockquote className="text-sm border-l-4 border-purple-200 pl-3 italic text-gray-500">
                            "Let's slow down together."
                        </blockquote>
                    </div>

                    {/* 4. Healthy Expression */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <MessageCircle className="text-orange-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Breaking "Usionyeshe"</h3>
                        <p className="text-gray-600 mb-4">You were taught to hide feelings. We help you put them into words (text or voice) to reduce internal pressure.</p>
                    </div>

                    {/* 5. BUDDIE */}
                    <div className="bg-gradient-to-br from-unity-500 to-unity-600 p-8 rounded-3xl shadow-lg text-white transform md:-translate-y-4 hover:-translate-y-6 transition-transform">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <Heart className="text-white fill-white" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Gentle AI Support</h3>
                        <p className="text-unity-50 mb-4">BUDDIE isn't a therapist—it's a compassionate guide who listens without judgment and speaks your language.</p>
                        <blockquote className="text-sm border-l-4 border-white/30 pl-3 italic text-unity-50">
                            "Pole. That sounds heavy. Want to talk about it?"
                        </blockquote>
                    </div>

                    {/* 6. Identity & Self-Worth */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Smile className="text-pink-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">You Are Enough</h3>
                        <p className="text-gray-600 mb-4">We reinforce self-kindness and reduce shame, helping you navigate comparisons and self-worth struggles.</p>
                    </div>

                    {/* 7. Peer Support */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Users className="text-yellow-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Not Alone</h3>
                        <p className="text-gray-600 mb-4">Anonymous chats let you share safely, knowing others are struggling too, with moderation for safety.</p>
                    </div>

                    {/* 8. Professional Guidance */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Lock className="text-teal-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Bridge to Help</h3>
                        <p className="text-gray-600 mb-4">We don't replace professionals. We guide you to them when things get too heavy, sharing trusted resources.</p>
                    </div>

                    {/* 9. Habit Building */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-50 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Sprout className="text-indigo-600" size={28} />
                        </div>
                        <h3 className="text-2xl font-bold text-unity-900 mb-3">Daily Habits</h3>
                        <p className="text-gray-600 mb-4">Small actions create big impact. Daily check-ins and reflection build resilience over time.</p>
                    </div>

                </div>
            </section>

            {/* Values Banner */}
            <section className="bg-unity-900 text-white py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">Ethical, Cultural & Campus-Appropriate</h2>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                        {['Trauma-Aware', 'Privacy-First', 'Non-Diagnostic', 'Culturally Grounded', 'Safe Space'].map((val, i) => (
                            <div key={i} className="px-6 py-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 text-sm md:text-lg font-medium">
                                {val}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final Pitch */}
            <section className="py-24 px-6 text-center max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-unity-black mb-8 leading-tight">
                    Why Unity Within Matters
                </h2>
                <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                    Because many Kenyan youths are carrying silent pressure, afraid to speak, and unsure where to turn. Unity Within gives them a place to breathe, reflect, and feel seen.
                </p>
                <div className="bg-unity-50 p-8 rounded-3xl border border-unity-100 italic text-xl md:text-2xl text-unity-800 font-serif leading-relaxed">
                    "UNITY WITHIN helps Kenyan youth understand their emotions, cope with daily pressures, and feel less alone — safely, privately, and without stigma."
                </div>

                <div className="mt-12">
                    <Button onClick={onBack} size="lg" className="px-12 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                        Join Us on the Journey
                    </Button>
                </div>
            </section>
        </div>
    );
};
