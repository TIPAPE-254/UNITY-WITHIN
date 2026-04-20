import React, { useState } from 'react';
import { Mail, Phone, MapPin, HelpCircle, AlertCircle, CheckCircle, Loader, ChevronRight, ChevronLeft, Heart } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface VolunteerApplicationFormProps {
  onSuccess?: () => void;
  onNavigate?: (view: string) => void;
  inviteEmail?: string;
}

// All 20 volunteer roles from documentation
const VOLUNTEER_ROLES = [
  { id: 1, title: 'Community moderator (comments, chats, forums)', category: 'Community' },
  { id: 2, title: 'Social media content creator (Instagram, TikTok, Facebook, LinkedIn)', category: 'Creative' },
  { id: 3, title: 'Social media scheduler and page manager', category: 'Creative' },
  { id: 4, title: 'Graphic designer (posts, flyers, banners)', category: 'Creative' },
  { id: 5, title: 'Video editor (short-form awareness videos)', category: 'Creative' },
  { id: 6, title: 'Blog writer (mental health, self-acceptance, healing)', category: 'Creative' },
  { id: 7, title: 'Copywriter (website pages, emails, campaigns)', category: 'Creative' },
  { id: 8, title: 'Newsletter writer and email campaign assistant', category: 'Creative' },
  { id: 9, title: 'Website tester (broken links, bugs, UX issues)', category: 'Tech' },
  { id: 10, title: 'App tester (mobile and web features pre-launch)', category: 'Tech' },
  { id: 11, title: 'Community outreach (schools, churches, clubs, partners)', category: 'Outreach' },
  { id: 12, title: 'Partnership coordinator', category: 'Outreach' },
  { id: 13, title: 'Event planner (online workshops, awareness campaigns)', category: 'Support & Admin' },
  { id: 14, title: 'Event host or virtual session assistant', category: 'Support & Admin' },
  { id: 15, title: 'Peer support listener (non-crisis, welcoming)', category: 'Community' },
  { id: 16, title: 'Resource researcher (mental health tools, articles)', category: 'Support & Admin' },
  { id: 17, title: 'Translation volunteer (local languages, accessibility)', category: 'Support & Admin' },
  { id: 18, title: 'Data entry and admin support', category: 'Support & Admin' },
  { id: 19, title: 'Fundraising assistant (donation drives, sponsorship)', category: 'Outreach' },
  { id: 20, title: 'Brand ambassador (peer circles, communities)', category: 'Outreach' },
];

const CATEGORIES = ['Creative', 'Tech', 'Community', 'Outreach', 'Support & Admin'];

export const VolunteerApplicationForm: React.FC<VolunteerApplicationFormProps> = ({ 
  onSuccess,
  onNavigate,
  inviteEmail
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Creative');
  const [phaseErrors, setPhaseErrors] = useState<Record<number, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: inviteEmail || '',
    phone: '',
    location: '',
    availability: '',
    category: '',
    skills: '',
    whyVolunteer: '',
    mentalHealthContext: '',
    workPreference: '',
    notes: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Prevent email changes if this is an invite
    if (name === 'email' && inviteEmail) {
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName as keyof typeof formData] as string);
  };

  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...fieldErrors };

    switch (fieldName) {
      case 'firstName':
        if (!value.trim()) {
          newErrors[fieldName] = 'First name helps us know who you are 💜';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          newErrors[fieldName] = 'Last name is needed to complete your profile 💙';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors[fieldName] = 'We need your email to stay connected 💌';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[fieldName] = 'Oops! That email doesn\'t look quite right ✨';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'location':
        if (!value.trim()) {
          newErrors[fieldName] = 'Tell us where you\'re from 🌍';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'availability':
        if (!value) {
          newErrors[fieldName] = 'Let us know your availability 🌟';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'workPreference':
        if (!value) {
          newErrors[fieldName] = 'Choose how you\'d like to work with us 💼';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'whyVolunteer':
        if (!value.trim()) {
          newErrors[fieldName] = 'Share your passion with us 💝';
        } else {
          delete newErrors[fieldName];
        }
        break;
      default:
        break;
    }

    setFieldErrors(newErrors);
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
      ? prev.filter(id => id !== roleId)
      : [...prev, roleId]
    );
  };

  const validatePhase = (phase: number): boolean => {
    const newErrors = { ...phaseErrors };
    delete newErrors[phase];
    const newFieldErrors: Record<string, string> = {};

    switch (phase) {
      case 0: // Welcome - no validation
        return true;
      case 1: // Basic Info
        if (!formData.firstName.trim()) {
          newFieldErrors['firstName'] = 'First name helps us know who you are 💜';
        }
        if (!formData.lastName.trim()) {
          newFieldErrors['lastName'] = 'Last name is needed to complete your profile 💙';
        }
        // Only validate email if it's not tied to an invitation
        if (!inviteEmail) {
          if (!formData.email.trim()) {
            newFieldErrors['email'] = 'We need your email to stay connected 💌';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newFieldErrors['email'] = 'Oops! That email doesn\'t look quite right ✨';
          }
        } else {
          // If email is from invite, just check it's not empty
          if (!formData.email.trim()) {
            newFieldErrors['email'] = 'We need your email to stay connected 💌';
          }
        }
        if (!formData.location.trim()) {
          newFieldErrors['location'] = 'Tell us where you\'re from 🌍';
        }
        setFieldErrors(newFieldErrors);
        if (Object.keys(newFieldErrors).length > 0) {
          setTouchedFields({ firstName: true, lastName: true, email: true, location: true });
          return false;
        }
        break;
      case 2: // Availability
        if (!formData.availability) {
          newFieldErrors['availability'] = 'Let us know your availability 🌟';
        }
        if (!formData.workPreference) {
          newFieldErrors['workPreference'] = 'Choose how you\'d like to work with us 💼';
        }
        setFieldErrors(newFieldErrors);
        if (Object.keys(newFieldErrors).length > 0) {
          return false;
        }
        break;
      case 3: // Roles
        if (selectedRoles.length === 0) {
          newErrors[phase] = '💖 Choose at least one role that excites you!';
        }
        break;
      case 4: // Experience
        if (!formData.whyVolunteer.trim()) {
          newFieldErrors['whyVolunteer'] = 'Share your passion with us 💝';
        }
        setFieldErrors(newFieldErrors);
        if (Object.keys(newFieldErrors).length > 0) {
          return false;
        }
        break;
      case 5: // Review - no validation
        return true;
    }

    setPhaseErrors(newErrors);
    return Object.keys(newErrors).length === 0 && Object.keys(newFieldErrors).length === 0;
  };

  const nextPhase = () => {
    if (validatePhase(currentPhase)) {
      setCurrentPhase(prev => Math.min(prev + 1, 5));
      setError('');
    }
  };

  const prevPhase = () => {
    setCurrentPhase(prev => Math.max(prev - 1, 0));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate all required fields before submitting
    const submitFieldErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) submitFieldErrors['firstName'] = 'First name is required 💜';
    if (!formData.lastName.trim()) submitFieldErrors['lastName'] = 'Last name is required 💙';
    
    // Email validation - skip if email is tied to invitation
    if (!inviteEmail) {
      if (!formData.email.trim()) submitFieldErrors['email'] = 'Email is required 💌';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) submitFieldErrors['email'] = 'Valid email is required ✨';
    } else {
      // If email is from invite, ensure it's not empty
      if (!formData.email.trim()) {
        submitFieldErrors['email'] = 'Email is required 💌';
      }
    }
    
    if (!formData.location.trim()) submitFieldErrors['location'] = 'Location is required 🌍';
    if (!formData.availability) submitFieldErrors['availability'] = 'Availability is required 🌟';
    if (!formData.workPreference) submitFieldErrors['workPreference'] = 'Work preference is required 💼';
    if (!formData.whyVolunteer.trim()) submitFieldErrors['whyVolunteer'] = 'Tell us why you want to volunteer 💝';
    
    if (selectedRoles.length === 0) {
      setError('💖 Please select at least one volunteer role!');
      setLoading(false);
      return;
    }

    if (!selectedCategory) {
      setError('💖 Please select a volunteer category!');
      setLoading(false);
      return;
    }

    if (Object.keys(submitFieldErrors).length > 0) {
      setFieldErrors(submitFieldErrors);
      setTouchedFields({ 
        firstName: true, 
        lastName: true, 
        email: true, 
        location: true,
        availability: true,
        workPreference: true,
        whyVolunteer: true
      });
      setError('💫 Please fill in all required fields before submitting');
      return;
    }

    setLoading(true);

    try {
      const roleNames = selectedRoles
        .map(id => VOLUNTEER_ROLES.find(r => r.id === id)?.title)
        .filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/api/volunteer/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          location: formData.location.trim(),
          availability: formData.availability,
          category: selectedCategory,
          roles: roleNames,
          skills: formData.skills.trim() || null,
          whyVolunteer: formData.whyVolunteer.trim(),
          mentalHealthContext: formData.mentalHealthContext || null,
          workPreference: formData.workPreference,
          notes: formData.notes.trim() || null,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
      console.error('Application error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4" 
           style={{
             backgroundImage: 'url(/volunteer.jpg)',
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full animate-bounce-slow">
          {/* Decorative gradient header */}
          <div className="h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-pulse">✨</div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-8 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-4xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Welcome Aboard! 💜
              </h2>
              <p className="text-lg text-gray-700 font-semibold">You're Now Part of Unity Within</p>
            </div>

            <div className="bg-pink-50 rounded-2xl p-6 border-2 border-pink-200 space-y-3">
              <p className="text-gray-700 leading-relaxed">
                We're so grateful you chose to join us! Your application has been submitted successfully.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-pink-600 font-bold mt-0.5">✓</span>
                  <p className="text-gray-700"><strong>Confirmation sent to:</strong> <br/><span className="text-pink-600 font-semibold">{formData.email}</span></p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold mt-0.5">⏱</span>
                  <p className="text-gray-700"><strong>Review time:</strong> 3-5 business days</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">💌</span>
                  <p className="text-gray-700"><strong>Next step:</strong> We'll be in touch soon!</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 border border-pink-200">
              <p className="text-gray-800 font-semibold mb-3">While you wait...</p>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>💪 Explore our mental health resources</li>
                <li>🤝 Join our community spaces</li>
                <li>📚 Learn about our mission and impact</li>
                <li>🌟 Share your passion with others</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold rounded-full hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Back to Home
              <span className="text-lg">🏠</span>
            </button>

            <p className="text-xs text-gray-500 italic">
              Thank you for making mental health, self-acceptance, and healing a priority in your community. ❤️
            </p>
          </div>
        </div>
      </div>
    );
  }

  const phases = [
    { id: 0, label: 'Welcome' },
    { id: 1, label: 'Your Info' },
    { id: 2, label: 'Availability' },
    { id: 3, label: 'Select Roles' },
    { id: 4, label: 'Your Story' },
    { id: 5, label: 'Review' },
  ];

  const filteredRoles = VOLUNTEER_ROLES.filter(r => r.category === selectedCategory);

  const phaseError = phaseErrors[currentPhase];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4" 
         style={{
           backgroundImage: 'url(/volunteer.jpg)',
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         }}>
      {/* Background blur overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Main container */}
      <div className="relative w-full max-w-2xl">
        {/* Progress indicators */}
        <div className="mb-8 flex justify-between items-center">
          {phases.map((phase, idx) => (
            <div key={idx} className="flex items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  idx === currentPhase 
                    ? 'bg-pink-600 text-white scale-110' 
                    : idx < currentPhase 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-white text-black border-2 border-black'
                }`}
              >
                {idx < currentPhase ? '✓' : idx + 1}
              </div>
              {idx < phases.length - 1 && (
                <div 
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    idx < currentPhase ? 'bg-pink-600' : 'bg-gray-300'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Phase content with frosted glass effect */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
          
          {phaseError && (
            <div className="mb-6 p-4 bg-pink-50 border-l-4 border-pink-600 text-pink-700 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{phaseError}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-pink-50 border-l-4 border-pink-600 text-pink-700 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* PHASE 0: Welcome */}
          {currentPhase === 0 && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center">
                    <Heart size={40} className="text-white" />
                  </div>
                </div>
                <h1 className="text-5xl font-black text-black">Unity Within</h1>
                <p className="text-xl text-gray-700 font-semibold">Building a Safer, Kinder Space</p>
              </div>

              <div className="bg-black text-white rounded-2xl p-8 space-y-4">
                <h2 className="text-3xl font-black">Join Our Mission</h2>
                <p className="text-lg text-gray-200">Help us create a community where mental health is celebrated, self-acceptance is nurtured, and healing happens together.</p>
                <div className="pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-300">💪 Make a real impact • 🤝 Grow with purpose • ❤️ Spread compassion</p>
                </div>
              </div>

              <div className="bg-pink-50 rounded-2xl p-6 text-left space-y-3">
                <h3 className="font-black text-black text-lg">What you'll do:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex gap-2"><span className="text-pink-600 font-black">→</span> Choose roles that match your talents</li>
                  <li className="flex gap-2"><span className="text-pink-600 font-black">→</span> Work flexibly on your schedule</li>
                  <li className="flex gap-2"><span className="text-pink-600 font-black">→</span> Be part of something meaningful</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600">Take 5 minutes to apply. Let's build something beautiful together.</p>
            </div>
          )}

          {/* PHASE 1: Basic Info */}
          {currentPhase === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-black mb-2">Let's get to know you</h2>
                <p className="text-gray-600">Start with the basics</p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-black mb-3">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('firstName')}
                    placeholder="Your first name"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all ${
                      touchedFields['firstName'] && fieldErrors['firstName']
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-black focus:ring-pink-600'
                    }`}
                    required
                  />
                  {touchedFields['firstName'] && fieldErrors['firstName'] && (
                    <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors['firstName']}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-black text-black mb-3">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={() => handleFieldBlur('lastName')}
                    placeholder="Your last name"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all ${
                      touchedFields['lastName'] && fieldErrors['lastName']
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-black focus:ring-pink-600'
                    }`}
                    required
                  />
                  {touchedFields['lastName'] && fieldErrors['lastName'] && (
                    <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={14} />
                      {fieldErrors['lastName']}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('email')}
                  placeholder={inviteEmail || 'your@email.com'}
                  disabled={!!inviteEmail}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all ${
                    inviteEmail
                      ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed'
                      : touchedFields['email'] && fieldErrors['email']
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-black focus:ring-pink-600'
                  }`}
                  required
                />
                {inviteEmail && (
                  <p className="mt-2 text-sm text-gray-600 font-semibold">
                    ✓ Email tied to your invitation
                  </p>
                )}
                {touchedFields['email'] && fieldErrors['email'] && !inviteEmail && (
                  <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors['email']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Phone (WhatsApp preferred)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('phone')}
                  placeholder="+254..."
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Location (City/County) *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('location')}
                  placeholder="e.g., Nairobi, Kenya"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white transition-all ${
                    touchedFields['location'] && fieldErrors['location']
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-black focus:ring-pink-600'
                  }`}
                  required
                />
                {touchedFields['location'] && fieldErrors['location'] && (
                  <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors['location']}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PHASE 2: Availability */}
          {currentPhase === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-black mb-2">Your Availability</h2>
                <p className="text-gray-600">Help us understand your schedule</p>
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Hours per Week You Can Dedicate *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '1-3', label: '1-3 hours' },
                    { value: '4-8', label: '4-8 hours' },
                    { value: '8-15', label: '8-15 hours' },
                    { value: '15+', label: '15+ hours' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, availability: opt.value }));
                        setTouchedFields(prev => ({ ...prev, availability: true }));
                        validateField('availability', opt.value);
                      }}
                      className={`p-4 rounded-xl font-bold border-2 transition-all ${
                        formData.availability === opt.value
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-black border-black hover:bg-pink-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {touchedFields['availability'] && fieldErrors['availability'] && (
                  <p className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={14} />
                    {fieldErrors['availability']}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Work Preference *
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'Remote only', icon: '💻' },
                    { value: 'In-person (Nairobi)', icon: '🏢' },
                    { value: 'Hybrid', icon: '🔄' }
                  ].map(opt => (
                    <label 
                      key={opt.value} 
                      onClick={() => setTouchedFields({...touchedFields, workPreference: true})}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      formData.workPreference === opt.value
                        ? 'bg-pink-600 text-white border-pink-600'
                        : 'bg-white text-black border-black hover:bg-pink-50'
                    }`}>
                      <input
                        type="radio"
                        name="workPreference"
                        value={opt.value}
                        checked={formData.workPreference === opt.value}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="text-lg">{opt.icon}</span>
                      <span className="font-bold">{opt.value}</span>
                    </label>
                  ))}
                </div>
                {touchedFields.workPreference && fieldErrors.workPreference && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 font-bold text-sm">
                    <AlertCircle size={16} />
                    {fieldErrors.workPreference}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Mental Health Context (Optional)
                </label>
                <select
                  name="mentalHealthContext"
                  value={formData.mentalHealthContext}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white font-bold"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Yes, personally">Yes, I have personal experience</option>
                  <option value="Supporting someone">Supporting someone with mental health</option>
                  <option value="Both">Both personal and supporting others</option>
                  <option value="Ally">I'm an ally/supporter</option>
                </select>
              </div>
            </div>
          )}

          {/* PHASE 3: Role Selection */}
          {currentPhase === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-black mb-2">Choose Your Impact</h2>
                <p className="text-gray-600">Select the roles that excite you (multi-select allowed)</p>
              </div>

              {/* Category Cards */}
              <div className="space-y-4">
                {CATEGORIES.map(category => (
                  <div key={category}>
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full p-5 rounded-2xl font-black text-lg transition-all text-left border-2 ${
                        selectedCategory === category
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-black border-black hover:bg-pink-50'
                      }`}
                    >
                      {category === 'Creative' && '🎨 Creative Roles'}
                      {category === 'Tech' && '💻 Tech Roles'}
                      {category === 'Community' && '🤝 Community Roles'}
                      {category === 'Outreach' && '📢 Outreach Roles'}
                      {category === 'Support & Admin' && '📋 Support & Admin'}
                    </button>

                    {selectedCategory === category && (
                      <div className="mt-4 grid gap-3">
                        {filteredRoles.map(role => (
                          <label
                            key={role.id}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                              selectedRoles.includes(role.id)
                                ? 'bg-pink-100 border-pink-600'
                                : 'bg-white border-gray-300 hover:border-pink-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.id)}
                              onChange={() => {
                                toggleRole(role.id);
                                setTouchedFields({...touchedFields, selectedRoles: true});
                              }}
                              className="mt-1 w-5 h-5 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-black">{role.title}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-black text-white p-4 rounded-xl">
                <p className="font-black text-lg">Selected: {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''}</p>
                {selectedRoles.length > 0 && (
                  <div className="mt-2 text-sm space-y-1">
                    {selectedRoles.map(id => (
                      <div key={id}>• {VOLUNTEER_ROLES.find(r => r.id === id)?.title}</div>
                    ))}
                  </div>
                )}
              </div>

              {touchedFields.selectedRoles && fieldErrors.selectedRoles && (
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 p-3 rounded-xl border-2 border-red-300">
                  <Heart size={16} className="text-red-600" />
                  {fieldErrors.selectedRoles}
                </div>
              )}
            </div>
          )}

          {/* PHASE 4: Your Story */}
          {currentPhase === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-black mb-2">Tell Your Story</h2>
                <p className="text-gray-600">Why does this matter to you?</p>
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Why do you want to volunteer? *
                </label>
                <textarea
                  name="whyVolunteer"
                  value={formData.whyVolunteer}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('whyVolunteer')}
                  placeholder="Share your motivation for joining Unity Within..."
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white min-h-32 font-semibold ${
                    touchedFields.whyVolunteer && fieldErrors.whyVolunteer
                      ? 'border-red-500 focus:ring-red-600'
                      : 'border-black focus:ring-pink-600'
                  }`}
                  required
                />
                {touchedFields.whyVolunteer && fieldErrors.whyVolunteer && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 font-bold text-sm">
                    <AlertCircle size={16} />
                    {fieldErrors.whyVolunteer}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Your Skills & Experience
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="Tell us about your relevant skills, experience, and any portfolio links..."
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white min-h-28 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-3">
                  Anything Else? (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Languages, accessibility needs, references, or any other info..."
                  className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600 focus:border-transparent bg-white min-h-20 font-semibold"
                />
              </div>
            </div>
          )}

          {/* PHASE 5: Review */}
          {currentPhase === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-black mb-2">Review Your Application</h2>
                <p className="text-gray-600">Make sure everything looks good before submitting</p>
              </div>

              <div className="space-y-4">
                {/* Personal Info Card */}
                <div className="bg-pink-50 rounded-2xl p-6 border-2 border-black">
                  <h3 className="font-black text-black text-lg mb-4">👤 Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-semibold">Name</p>
                      <p className="font-black text-black">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Email</p>
                      <p className="font-black text-black">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Phone</p>
                      <p className="font-black text-black">{formData.phone || '–'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-semibold">Location</p>
                      <p className="font-black text-black">{formData.location}</p>
                    </div>
                  </div>
                </div>

                {/* Availability Card */}
                <div className="bg-black text-white rounded-2xl p-6 border-2 border-black">
                  <h3 className="font-black text-white text-lg mb-4">⏰ Availability</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300 font-semibold">Hours per Week</p>
                      <p className="font-black text-white">{formData.availability}</p>
                    </div>
                    <div>
                      <p className="text-gray-300 font-semibold">Work Preference</p>
                      <p className="font-black text-white">{formData.workPreference}</p>
                    </div>
                  </div>
                </div>

                {/* Roles Card */}
                <div className="bg-white rounded-2xl p-6 border-2 border-pink-600">
                  <h3 className="font-black text-black text-lg mb-4">🎯 Selected Roles ({selectedRoles.length})</h3>
                  <div className="space-y-2">
                    {selectedRoles.map(id => (
                      <div key={id} className="flex items-center gap-2 text-sm">
                        <span className="text-pink-600 font-black">✓</span>
                        <p className="font-bold text-black">{VOLUNTEER_ROLES.find(r => r.id === id)?.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Story Card */}
                {(formData.whyVolunteer || formData.skills) && (
                  <div className="bg-pink-50 rounded-2xl p-6 border-2 border-black">
                    <h3 className="font-black text-black text-lg mb-4">💭 Your Story</h3>
                    {formData.whyVolunteer && (
                      <div className="mb-4">
                        <p className="text-gray-600 font-semibold text-sm">Why you want to volunteer</p>
                        <p className="font-semibold text-black mt-1">{formData.whyVolunteer}</p>
                      </div>
                    )}
                    {formData.skills && (
                      <div>
                        <p className="text-gray-600 font-semibold text-sm">Your skills</p>
                        <p className="font-semibold text-black mt-1">{formData.skills}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-4 justify-between">
            <button
              onClick={prevPhase}
              disabled={currentPhase === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                currentPhase === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={20} />
              Back
            </button>

            {currentPhase === 5 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-pink-600 text-white font-black rounded-full hover:bg-pink-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit ✨
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextPhase}
                className="flex items-center gap-2 px-8 py-3 bg-pink-600 text-white font-black rounded-full hover:bg-pink-700 transition-all"
              >
                Continue
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Phase indicator text */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Step {currentPhase + 1} of {phases.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerApplicationForm;
