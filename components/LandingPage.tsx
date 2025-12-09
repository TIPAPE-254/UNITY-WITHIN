import React from 'react';
import { Button } from './Button';
import { ImageCarousel } from './ImageCarousel';
import { Heart, Users, Sparkles, Shield, Phone, ExternalLink, Star, ArrowRight, CheckCircle, Wind, Brain, Zap, Flower, Sun, Moon, CloudRain } from 'lucide-react';

export const LandingPage: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Heart className="fill-current text-unity-500" size={48} />
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-unity-black">
              UNITY <span className="text-unity-500">WITHIN</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your compassionate companion for emotional wellness. Find peace, strength, and connection in moments that matter most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-unity-500 hover:bg-unity-600 text-white px-8 py-4 text-lg"
              onClick={() => onNavigate('dashboard')}
            >
              Start Your Journey <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-unity-300 text-unity-600 hover:bg-unity-50 px-8 py-4 text-lg"
              onClick={() => onNavigate('wellness')}
            >
              Explore Tools
            </Button>
          </div>
        </div>
        <div className="absolute top-10 left-10 opacity-20">
          <Flower size={60} className="text-unity-300" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-20">
          <Sun size={80} className="text-unity-400" />
        </div>
      </section>



      {/* What We Do */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-unity-black mb-6">
              ✨ Our Mission in Action
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We help people feel seen, heard, and supported through compassionate AI experiences designed to reduce emotional overwhelm and guide you through difficult moments.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-3xl border border-blue-200">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-unity-black mb-4">Emotional Support AI</h3>
              <p className="text-gray-600">Buddie provides 24/7 compassionate companionship, understanding your feelings without judgment.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-3xl border border-green-200">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-6">
                <Wind size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-unity-black mb-4">Voice-Guided Grounding</h3>
              <p className="text-gray-600">Gentle breathing exercises and grounding techniques to help you return to the present moment.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-3xl border border-purple-200">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-unity-black mb-4">Self-Therapy Tools</h3>
              <p className="text-gray-600">Evidence-informed exercises for emotional regulation, thought reframing, and building resilience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Matter */}
      <section className="py-20 px-4 bg-[#FFF5F7]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-unity-black mb-6">
              💗 The Problem We Solve
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Because no one should feel alone in their toughest moments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-unity-100">
              <CheckCircle className="text-red-400 mb-4" size={24} />
              <p className="text-gray-700">Millions struggle silently with anxiety, panic, shame, and loneliness</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-unity-100">
              <CheckCircle className="text-orange-400 mb-4" size={24} />
              <p className="text-gray-700">Traditional therapy isn't always accessible when you need it most</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-unity-100">
              <CheckCircle className="text-yellow-400 mb-4" size={24} />
              <p className="text-gray-700">People often need immediate emotional support, not a scheduled appointment</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-unity-100">
              <CheckCircle className="text-green-400 mb-4" size={24} />
              <p className="text-gray-700">Emotional regulation skills aren't taught in schools or daily life</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-unity-100">
              <CheckCircle className="text-blue-400 mb-4" size={24} />
              <p className="text-gray-700">Early comfort and grounding can prevent emotional escalation</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-unity-100">
              <CheckCircle className="text-purple-400 mb-4" size={24} />
              <p className="text-gray-700">Everyone deserves tools for emotional wellness, regardless of background</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Unity Within matters because it gives people <strong>immediate emotional first-aid</strong>, anytime, safely, and with compassion.
            </p>
          </div>
        </div>
      </section>

      {/* Self-Therapizing Tools */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-unity-black mb-6">
              🌱 Develop Inner Strength
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tools inspired by modern psychology and somatic practices to help you build emotional resilience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl border border-pink-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
                  <Zap size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-unity-black">5-4-3-2-1 Grounding</h3>
              </div>
              <p className="text-gray-600">Connect with your senses to return to the present moment.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Wind size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-unity-black">Box Breathing</h3>
              </div>
              <p className="text-gray-600">4-4-4-4 breathing technique for calm and focus.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Heart size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-unity-black">Self-Compassion Scripts</h3>
              </div>
              <p className="text-gray-600">Kind words and affirmations for difficult moments.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-unity-black">Thought Reframing</h3>
              </div>
              <p className="text-gray-600">Challenge negative thoughts and find balanced perspectives.</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Star size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-unity-black">Emotion Naming</h3>
              </div>
              <p className="text-gray-600">Identify and understand your feelings with gentle guidance.</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-unity-black">Panic Stabilization</h3>
              </div>
              <p className="text-gray-600">Quick techniques to regain control during intense moments.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-unity-500 hover:bg-unity-600 text-white px-8 py-4 text-lg"
              onClick={() => onNavigate('wellness')}
            >
              Try These Tools <ArrowRight className="ml-2" size={20} />
            </Button>
          </div>
        </div>
      </section>

      {/* Donate Section */}
      <section className="py-20 px-4 bg-[#FFF5F7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-unity-black mb-6">
            🤲 Support the Mission
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Help us keep Buddie free, safe, and accessible for everyone who needs gentle emotional support.
          </p>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-unity-100 mb-8">
            <h3 className="text-2xl font-bold text-unity-black mb-6">Your donation helps us:</h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">Maintain 24/7 server access and safety</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">Improve AI empathy and understanding</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">Expand free tools for underserved communities</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                <span className="text-gray-700">Work with mental health experts for safety</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-unity-100">
              <div className="text-3xl font-bold text-unity-500 mb-2">$3</div>
              <div className="text-gray-600 mb-4">Support One Day of Wellness</div>
              <Button size="sm" className="w-full bg-unity-500 hover:bg-unity-600 text-white">
                Donate
              </Button>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-unity-100">
              <div className="text-3xl font-bold text-unity-500 mb-2">$5</div>
              <div className="text-gray-600 mb-4">Sponsor a Self-Care Toolkit</div>
              <Button size="sm" className="w-full bg-unity-500 hover:bg-unity-600 text-white">
                Donate
              </Button>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-unity-100">
              <div className="text-3xl font-bold text-unity-500 mb-2">$10</div>
              <div className="text-gray-600 mb-4">Help Improve Buddie's Empathy</div>
              <Button size="sm" className="w-full bg-unity-500 hover:bg-unity-600 text-white">
                Donate
              </Button>
            </div>
          </div>

          <p className="text-gray-500 italic">
            If you can't donate right now, that's completely okay. Your healing and well-being matter most.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-unity-black text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Heart className="fill-current text-unity-500" size={32} />
            <span className="text-2xl font-bold">UNITY WITHIN</span>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  <a href="tel:988" className="hover:text-unity-400 transition-colors">
                    Crisis Hotline: 988
                  </a>
                </div>
                <p className="text-sm">Available 24/7 for emotional support</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Tools</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><button onClick={() => onNavigate('breathe')} className="hover:text-unity-400 transition-colors">Breathing Exercises</button></li>
                <li><button onClick={() => onNavigate('wellness')} className="hover:text-unity-400 transition-colors">Wellness Toolkit</button></li>
                <li><button onClick={() => onNavigate('journal')} className="hover:text-unity-400 transition-colors">Journal</button></li>
                <li><button onClick={() => onNavigate('chat')} className="hover:text-unity-400 transition-colors">AI Companion</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">About</h4>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><a href="#" className="hover:text-unity-400 transition-colors">Our Mission</a></li>
                <li><a href="#" className="hover:text-unity-400 transition-colors">Safety & Privacy</a></li>
                <li><a href="#" className="hover:text-unity-400 transition-colors">Research</a></li>
                <li><a href="#" className="hover:text-unity-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <div className="text-gray-300 text-sm space-y-2">
                <p>20,000+ grounding sessions completed</p>
                <p>Users from 30+ countries</p>
                <p>150,000+ wellness messages exchanged</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 Unity Within. Created with compassion for emotional wellness.</p>
            <p className="mt-2">Remember: You are not alone. Help is always available.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
