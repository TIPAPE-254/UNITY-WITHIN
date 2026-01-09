import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Wind, BookOpen, Compass, Lock, Shield, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    onNavigate?: (view: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onNavigate }) => {
    const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
    const [currentTestimonialSlide, setCurrentTestimonialSlide] = useState(0);
    const [isHeroPaused, setIsHeroPaused] = useState(false);
    const [isTestimonialPaused, setIsTestimonialPaused] = useState(false);

    // Hero carousel images - calming, gentle imagery from public folder
    const heroSlides = [
        {
            image: '/components/public/img1.jpeg',
            title: 'Empowering Minds, Healing Hearts.',
            subtitle: 'A world-class emotional support ecosystem for Kenyan youth. Safe, anonymous, and free.'
        },
        {
            image: '/components/public/img2.jpeg',
            title: 'You Are Seen. You Are Heard.',
            subtitle: 'Join a community that understands the hustle, the pressure, and the silence.'
        },
        {
            image: '/components/public/img3.jpeg',
            title: 'AI Companion. Human Connection.',
            subtitle: 'Meet Buddie: Your 24/7 non-judgmental friend in a pocket.'
        },
        {
            image: '/components/public/img1.jpeg',
            title: 'Mental Wellness for Everyone.',
            subtitle: 'No stigma. No barriers. Just pure, compassionate support.'
        }
    ];

    const testimonials = [
        {
            text: "Unity Within isn't just an app; it's the friend I didn't know I needed.",
            author: "Anonymous Student, Nairobi"
        },
        {
            text: "The breathing tools stopped my panic attack. I felt safe for the first time in months.",
            author: "User from Mombasa"
        },
        {
            text: "Buddie listens without judging. It helped me find words for my pain.",
            author: "Anonymous"
        },
        {
            text: "Finally, a place that understands the pressure of being young in Kenya.",
            author: "Community Member"
        }
    ];

    // Auto-advance hero carousel
    useEffect(() => {
        if (!isHeroPaused) {
            const timer = setInterval(() => {
                setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
            }, 7000); // 7 seconds per slide - slow and gentle
            return () => clearInterval(timer);
        }
    }, [isHeroPaused, heroSlides.length]);

    // Auto-advance testimonial carousel
    useEffect(() => {
        if (!isTestimonialPaused) {
            const timer = setInterval(() => {
                setCurrentTestimonialSlide((prev) => (prev + 1) % testimonials.length);
            }, 6000); // 6 seconds per slide
            return () => clearInterval(timer);
        }
    }, [isTestimonialPaused, testimonials.length]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7]">
            {/* Hero Section with Carousel */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Carousel Background */}
                <div className="absolute inset-0 transition-all duration-[2000ms] ease-in-out">
                    {heroSlides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${index === currentHeroSlide ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{
                                backgroundImage: `url(${slide.image})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            <div className="absolute inset-0 bg-black/40"></div>
                        </div>
                    ))}
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <div className="mb-8 flex justify-center">
                        <Heart className="text-white fill-white/20" size={64} />
                    </div>

                    {heroSlides.map((slide, index) => (
                        <div
                            key={index}
                            className={`transition-opacity duration-[2000ms] ease-in-out ${index === currentHeroSlide ? 'opacity-100' : 'opacity-0 absolute inset-0'
                                }`}
                        >
                            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                                {slide.title}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed font-light">
                                {slide.subtitle}
                            </p>
                        </div>
                    ))}

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-5 bg-white text-unity-600 font-bold text-lg rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
                        >
                            Talk to Buddie
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-5 bg-white/10 backdrop-blur-md text-white font-bold text-lg rounded-full border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
                        >
                            Start Free
                        </button>
                    </div>

                    {/* Carousel Controls */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                            className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-2">
                            {heroSlides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentHeroSlide(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentHeroSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length)}
                            className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} />
                        </button>

                        <button
                            onClick={() => setIsHeroPaused(!isHeroPaused)}
                            className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all ml-2"
                            aria-label={isHeroPaused ? 'Play' : 'Pause'}
                        >
                            {isHeroPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    </div>
                </div>
            </section>

            {/* What Unity Within Does */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-unity-black">
                        How We Support You
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MessageCircle className="text-purple-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-unity-black">Gentle Conversations</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Talk to Buddie when you feel overwhelmed.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Wind className="text-blue-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-unity-black">Calming Tools</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Breathing, grounding, and panic support — guided gently.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="text-pink-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-unity-black">Private Reflection</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Journaling and mood check-ins, just for you.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Compass className="text-green-600" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-unity-black">Guided Support</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Small steps, no pressure, no judgment.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why We Exist CTA */}
            <section className="bg-unity-900 text-white py-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Heart size={300} />
                </div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">"You don't have to be strong all the time."</h2>
                    <p className="text-xl text-unity-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                        We built Unity Within because we know the silent pressure Kenyan youth carry. We wanted to create a place where you can just be.
                    </p>
                    <button
                        onClick={() => onNavigate && onNavigate('why-unity')}
                        className="px-10 py-4 bg-white text-unity-900 font-bold rounded-full hover:bg-unity-50 hover:scale-105 transition-all shadow-xl"
                    >
                        Read Our Mission
                    </button>
                </div>
            </section>

            {/* Testimonial Carousel */}
            <section className="py-24 px-6 bg-gradient-to-br from-unity-50 to-purple-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-16 text-unity-black">
                        You're Not Alone
                    </h2>

                    <div className="relative min-h-[200px] flex items-center justify-center">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className={`absolute transition-opacity duration-[1500ms] ease-in-out ${index === currentTestimonialSlide ? 'opacity-100' : 'opacity-0'
                                    }`}
                            >
                                <blockquote className="text-2xl md:text-3xl text-gray-700 italic font-light mb-6 leading-relaxed">
                                    "{testimonial.text}"
                                </blockquote>
                                <p className="text-lg text-gray-500">— {testimonial.author}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-12">
                        <button
                            onClick={() => setCurrentTestimonialSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                            className="p-2 rounded-full bg-white text-unity-600 hover:bg-unity-50 transition-all shadow-md"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex gap-2">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonialSlide(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentTestimonialSlide ? 'w-8 bg-unity-500' : 'w-2 bg-gray-300'
                                        }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentTestimonialSlide((prev) => (prev + 1) % testimonials.length)}
                            className="p-2 rounded-full bg-white text-unity-600 hover:bg-unity-50 transition-all shadow-md"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight size={20} />
                        </button>

                        <button
                            onClick={() => setIsTestimonialPaused(!isTestimonialPaused)}
                            className="p-2 rounded-full bg-white text-unity-600 hover:bg-unity-50 transition-all shadow-md ml-2"
                            aria-label={isTestimonialPaused ? 'Play' : 'Pause'}
                        >
                            {isTestimonialPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    </div>
                </div>
            </section>

            {/* Meet Buddie */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 rounded-3xl p-12 md:p-16 text-center shadow-xl">
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                                <Heart className="text-unity-500 fill-unity-100" size={48} />
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-unity-black">
                            Meet Buddie
                        </h2>

                        <p className="text-xl md:text-2xl text-gray-700 mb-6 leading-relaxed font-light max-w-3xl mx-auto">
                            Buddie is a gentle companion designed to listen, guide, and support you when emotions feel heavy.
                        </p>

                        <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Buddie doesn't judge. Buddie doesn't rush.<br />
                            Buddie helps you breathe, ground, and feel heard.
                        </p>

                        <button
                            onClick={onGetStarted}
                            className="px-10 py-5 bg-unity-500 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:bg-unity-600 hover:scale-105 transition-all duration-300"
                        >
                            Chat with Buddie
                        </button>
                    </div>
                </div>
            </section>

            {/* Self-Help Tools Preview */}
            <section className="py-24 px-6 bg-gradient-to-b from-white to-blue-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-unity-black">
                        Tools for Your Wellbeing
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">🌬️</div>
                            <h3 className="text-lg font-bold mb-2 text-unity-black">Guided Breathing</h3>
                            <p className="text-gray-600 text-sm">Calm your nervous system with gentle breathing exercises</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">🪨</div>
                            <h3 className="text-lg font-bold mb-2 text-unity-black">Grounding Exercises</h3>
                            <p className="text-gray-600 text-sm">Return to the present moment when overwhelmed</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">🧠</div>
                            <h3 className="text-lg font-bold mb-2 text-unity-black">Thought Reframing</h3>
                            <p className="text-gray-600 text-sm">Gentle tools to shift negative thinking patterns</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">📝</div>
                            <h3 className="text-lg font-bold mb-2 text-unity-black">Journaling</h3>
                            <p className="text-gray-600 text-sm">Express your thoughts in a safe, private space</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">🌙</div>
                            <h3 className="text-lg font-bold mb-2 text-unity-black">Night Calm Sessions</h3>
                            <p className="text-gray-600 text-sm">Wind down peacefully before sleep</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all">
                            <div className="text-4xl mb-3">💭</div>
                            <h3 className="text-lg font-bold mb-2 text-unity-black">Mood Check-ins</h3>
                            <p className="text-gray-600 text-sm">Track how you're feeling over time</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Donate Section */}
            <section className="py-24 px-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 text-unity-black">
                        Support Mental Wellness
                    </h2>

                    <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                        Your donation helps us keep Unity Within free, safe, and accessible — especially for underserved communities.
                    </p>

                    <div className="bg-white rounded-3xl p-10 shadow-xl mb-10">
                        <h3 className="text-2xl font-bold mb-6 text-unity-black">You're supporting:</h3>
                        <ul className="text-left max-w-2xl mx-auto space-y-4 text-lg text-gray-700">
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>24/7 platform availability</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>Mental-health safety systems</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>Compassionate AI development</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>Free access for those who can't afford care</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <a
                            href="https://www.paypal.com/donate/?hosted_button_id=VXBXM6W268EHS"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-10 py-5 bg-yellow-400 text-yellow-900 font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:bg-yellow-300 hover:scale-105 transition-all duration-300"
                        >
                            💛 Donate Once
                        </a>
                        <a
                            href="https://www.paypal.com/donate/?hosted_button_id=VXBXM6W268EHS"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-10 py-5 bg-blue-500 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:bg-blue-600 hover:scale-105 transition-all duration-300"
                        >
                            💙 Monthly Supporter
                        </a>
                    </div>
                </div>
            </section>

            {/* Trust & Safety */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-unity-black">
                        Safe & Confidential
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="text-green-600" size={32} />
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-unity-black">Private & Confidential</h3>
                            <p className="text-gray-600 text-sm">Your conversations are secure and never shared</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="text-purple-600" size={32} />
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-unity-black">Mental-Health Principles</h3>
                            <p className="text-gray-600 text-sm">Designed with care and compassion</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="text-blue-600" size={32} />
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-unity-black">Human Support</h3>
                            <p className="text-gray-600 text-sm">We encourage professional help when needed</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="text-pink-600" size={32} />
                            </div>
                            <h3 className="font-bold text-lg mb-2 text-unity-black">Complementary Care</h3>
                            <p className="text-gray-600 text-sm">Not a replacement for therapy</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-unity-900 text-white py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Heart className="fill-current" size={24} />
                                <h3 className="text-xl font-bold">UNITY WITHIN</h3>
                            </div>
                            <p className="text-gray-400 text-sm">
                                A safe space for your mind.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4">About</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Our Team</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4">Crisis Resources</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li>Kenya: 0800-221-22</li>
                                <li>US: 988</li>
                                <li>International: befrienders.org</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-8 text-center text-sm text-gray-500">
                        <p>© 2024 Unity Within. Made with ❤️ for mental wellness.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
