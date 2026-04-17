import React, { useState } from 'react';
import { Heart, MessageCircle, Users, Sparkles, CheckCircle, ArrowRight, Phone, Mail, MapPin, Clock, Trophy, Zap } from 'lucide-react';

interface VolunteerProps {
  onNavigate?: (view: string) => void;
}

export const Volunteer: React.FC<VolunteerProps> = ({ onNavigate }) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const volunteerRoles = [
    {
      id: 'listener',
      title: 'Community Listener',
      icon: '👂',
      description: 'Offer warm, respectful presence and help people feel heard.',
      requirements: [
        'Empathetic and compassionate',
        '2+ hours per week availability',
        'Good listening skills',
        'Patient and non-judgmental'
      ],
      impact: 'Support 5-10 people per week with meaningful conversations',
      timeCommitment: '2-5 hours/week',
      training: '2-week onboarding'
    },
    {
      id: 'advocate',
      title: 'Mental Health Advocate',
      icon: '📢',
      description: 'Share our message and help normalize support-seeking.',
      requirements: [
        'Passionate about mental health',
        'Strong communication skills',
        '3+ hours per week availability',
        'Experience in community engagement'
      ],
      impact: 'Reach 50-100+ people monthly with awareness campaigns',
      timeCommitment: '3-8 hours/week',
      training: '1-week workshop'
    },
    {
      id: 'ambassador',
      title: 'Outreach Ambassador',
      icon: '🌍',
      description: 'Connect Unity Within with schools, campuses, and communities.',
      requirements: [
        'Network in community',
        'Event coordination experience',
        '4+ hours per week availability',
        'Leadership qualities'
      ],
      impact: 'Partner with 2-3 institutions per month',
      timeCommitment: '4-10 hours/week',
      training: '2-week program'
    },
    {
      id: 'content',
      title: 'Content & Story Volunteer',
      icon: '✍️',
      description: 'Create uplifting posts, stories, and campaign materials.',
      requirements: [
        'Creative skills (writing, design, video)',
        '2-4 hours per week availability',
        'Portfolio/samples',
        'Understanding of mental health'
      ],
      impact: 'Produce 4-8 content pieces per month',
      timeCommitment: '2-6 hours/week',
      training: '1-week content guidelines'
    },
    {
      id: 'wellness',
      title: 'Wellness Program Support',
      icon: '🧘',
      description: 'Assist with events, resources, and guided wellbeing initiatives.',
      requirements: [
        'Some wellness/health background preferred',
        '3+ hours per week availability',
        'Event coordination skills',
        'Collaborative mindset'
      ],
      impact: 'Support 100+ people per event',
      timeCommitment: '3-8 hours/week',
      training: '2-week program'
    },
    {
      id: 'tech',
      title: 'Tech Support Volunteer',
      icon: '💻',
      description: 'Help users navigate the platform and provide technical support.',
      requirements: [
        'Technical aptitude',
        'Patient with users',
        '2-4 hours per week availability',
        'Problem-solving skills'
      ],
      impact: 'Assist 20-50 users weekly',
      timeCommitment: '2-5 hours/week',
      training: '1-week technical training'
    }
  ];

  const volunteerBenefits = [
    {
      icon: '📚',
      title: 'Free Training',
      description: 'Comprehensive onboarding in mental health support and best practices'
    },
    {
      icon: '🎓',
      title: 'Certification',
      description: 'Receive verifiable certificates for your volunteer work'
    },
    {
      icon: '🤝',
      title: 'Community',
      description: 'Join a network of compassionate changemakers'
    },
    {
      icon: '💪',
      title: 'Personal Growth',
      description: 'Develop leadership and communication skills'
    },
    {
      icon: '🏆',
      title: 'Recognition',
      description: 'Be featured in our community monthly highlights'
    },
    {
      icon: '⏱️',
      title: 'Flexible Hours',
      description: 'Choose your own schedule around your life'
    }
  ];

  const volunteerStories = [
    {
      name: 'Sarah M.',
      role: 'Community Listener',
      story: 'Volunteering helped me realize how much impact just listening can have. I\'ve made lifelong friends and grown so much personally.',
      quote: 'Helping others heal has been healing for me too.'
    },
    {
      name: 'James K.',
      role: 'Outreach Ambassador',
      story: 'I never thought I could make a difference in mental health advocacy until I joined Unity Within. Now I\'m reaching thousands.',
      quote: 'Change happens when we show up for each other.'
    },
    {
      name: 'Amina P.',
      role: 'Content Volunteer',
      story: 'Creating meaningful content for mental health has been incredibly fulfilling. I\'m using my creative skills for a cause I believe in.',
      quote: 'Stories save lives. I\'m honored to tell them.'
    }
  ];

  const faqItems = [
    {
      question: 'How much time do I need to commit?',
      answer: 'It depends on your role! We have opportunities ranging from 2-10 hours per week. You set your own schedule within your chosen role.'
    },
    {
      question: 'Do I need mental health experience?',
      answer: 'No! Compassion and willingness to learn are most important. We provide comprehensive training for all volunteers.'
    },
    {
      question: 'Is this a paid position?',
      answer: 'Volunteering with Unity Within is unpaid, but highly rewarding. You\'ll receive training, certification, and be part of a meaningful mission.'
    },
    {
      question: 'How do I get started?',
      answer: 'Click the WhatsApp button to message us! We\'ll discuss your interests, background, and find the perfect role for you.'
    },
    {
      question: 'What kind of training do I get?',
      answer: 'Each role has specialized training (1-2 weeks) covering mental health basics, communication skills, and Unity Within protocols.'
    },
    {
      question: 'Can I switch roles later?',
      answer: 'Absolutely! Many volunteers explore different roles to find what they\'re most passionate about.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fa] to-[#fff5f7]">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 md:px-8 bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 mb-8">
            <Heart size={20} className="fill-white" />
            <span className="text-sm font-semibold uppercase tracking-wide">Make a Difference</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Volunteer with Unity Within
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-light max-w-3xl mx-auto">
            Help us reach more young people and build a safer place to heal. Join our movement of compassionate changemakers across Kenya.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/254715765561?text=Hello%20Unity%20Within%2C%20I%27d%20love%20to%20volunteer%20and%20support%20your%20mission.%20Please%20share%20the%20next%20steps%20and%20available%20roles."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-600 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <MessageCircle size={20} />
              Join via WhatsApp
            </a>
            <button
              onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold rounded-full border-2 border-white/40 hover:bg-white/30 transition-all duration-300"
            >
              Explore Roles
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-16 px-6 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
              <p className="text-gray-600 font-medium">Active Volunteers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">50K+</div>
              <p className="text-gray-600 font-medium">People Reached</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <p className="text-gray-600 font-medium">Conversations</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">25+</div>
              <p className="text-gray-600 font-medium">Communities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Roles */}
      <section id="roles" className="py-24 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-5xl font-bold text-gray-900 mb-6">
              Find Your Calling
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We have roles for every skill set and schedule. Choose what resonates with your heart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteerRoles.map((role) => (
              <div
                key={role.id}
                className="group bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-purple-300 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => {
                  setSelectedRole(selectedRole === role.id ? null : role.id);
                  setIsExpanded({
                    ...isExpanded,
                    [role.id]: !isExpanded[role.id]
                  });
                }}
              >
                <div className="p-8">
                  <div className="text-5xl mb-4">{role.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{role.title}</h3>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">{role.description}</p>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock size={16} className="text-purple-600 flex-shrink-0" />
                      <span>{role.timeCommitment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Sparkles size={16} className="text-pink-600 flex-shrink-0" />
                      <span>{role.training}</span>
                    </div>
                  </div>

                  {isExpanded[role.id] && (
                    <div className="mt-6 pt-6 border-t border-gray-200 animate-in fade-in duration-300">
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle size={18} className="text-green-600" />
                          Requirements
                        </h4>
                        <ul className="space-y-2">
                          {role.requirements.map((req, idx) => (
                            <li key={idx} className="text-gray-600 text-sm flex gap-2">
                              <span className="text-green-600">✓</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Trophy size={18} className="text-amber-600" />
                          Your Impact
                        </h4>
                        <p className="text-gray-600 text-sm">{role.impact}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        `https://wa.me/254715765561?text=Hi%20Unity%20Within%2C%20I%27m%20interested%20in%20the%20${role.title}%20volunteer%20role.`,
                        '_blank'
                      );
                    }}
                    className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={18} />
                    Express Interest
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 md:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-5xl font-bold text-gray-900 mb-6">
              What You Get in Return
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Beyond making a difference, volunteering comes with amazing personal benefits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteerBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Stories */}
      <section className="py-24 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-5xl font-bold text-gray-900 mb-6">
              Hear from Our Volunteers
            </h2>
            <p className="text-xl text-gray-600">
              These are real stories from people making real change.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {volunteerStories.map((story, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-purple-600"
              >
                <div className="mb-6">
                  <p className="text-gray-700 italic text-base leading-relaxed">
                    "{story.story}"
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <p className="text-purple-600 font-bold text-lg mb-1">"{story.quote}"</p>
                  <p className="text-gray-900 font-bold">{story.name}</p>
                  <p className="text-gray-600 text-sm">{story.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 md:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <button
                  onClick={() =>
                    setIsExpanded({
                      ...isExpanded,
                      [`faq-${idx}`]: !isExpanded[`faq-${idx}`]
                    })
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-50 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-left">{item.question}</span>
                  <span
                    className={`text-purple-600 transition-transform duration-300 ${
                      isExpanded[`faq-${idx}`] ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isExpanded[`faq-${idx}`] && (
                  <div className="px-6 py-4 bg-purple-50 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 rounded-3xl p-12 md:p-16 text-white shadow-2xl">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Make an Impact?
              </h2>

              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Our team is excited to learn about you and help you find the perfect role. Reach out today — let's change lives together.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/254715765561?text=Hello%20Unity%20Within%2C%20I%27d%20love%20to%20volunteer%20and%20support%20your%20mission.%20Please%20share%20the%20next%20steps%20and%20available%20roles."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-purple-600 font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <MessageCircle size={20} />
                  Message on WhatsApp
                </a>

                <a
                  href="mailto:volunteer@unitwithin.com"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/20 text-white font-bold rounded-full border-2 border-white/40 hover:bg-white/30 transition-all duration-300"
                >
                  <Mail size={20} />
                  Email Us
                </a>
              </div>

              <div className="mt-12 pt-12 border-t border-white/30 text-white/90">
                <p className="text-sm">
                  Contact: <a href="tel:+254715765561" className="font-bold hover:text-white transition-colors">+254 715 765 561</a> | 
                  Available Monday-Friday, 9 AM - 5 PM EAT
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
