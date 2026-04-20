import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, HelpCircle, AlertCircle, CheckCircle, Loader, ArrowRight, ArrowLeft, Heart, Sparkles, Star, Zap, Users, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../constants';

interface VolunteerApplicationFormProps {
  onSuccess?: () => void;
  onNavigate?: (view: string) => void;
  inviteToken?: string;
}

const VOLUNTEER_ROLES = [
  { id: 1, title: 'Community moderator (comments, chats, forums)', category: 'Community', icon: Users, description: 'Maintain a safe and welcoming space in our digital community.' },
  { id: 2, title: 'Social media content creator', category: 'Creative', icon: Sparkles, description: 'Craft engaging content across Instagram, TikTok, and more.' },
  { id: 3, title: 'Social media scheduler and manager', category: 'Creative', icon: Users, description: 'Keep our social presence consistent and organized.' },
  { id: 4, title: 'Graphic designer', category: 'Creative', icon: Star, description: 'Design beautiful visuals for campaigns and posts.' },
  { id: 5, title: 'Video editor', category: 'Creative', icon: Zap, description: 'Transform raw footage into powerful awareness stories.' },
  { id: 6, title: 'Blog writer', category: 'Creative', icon: Sparkles, description: 'Write deep-dives on mental health and self-acceptance.' },
  { id: 7, title: 'Copywriter', category: 'Creative', icon: Heart, description: 'Craft the voice of Unity Within for pages and emails.' },
  { id: 8, title: 'Newsletter and email assistant', category: 'Creative', icon: Mail, description: 'Handle our direct communication with members.' },
  { id: 9, title: 'Website tester', category: 'Tech', icon: ShieldCheck, description: 'Ensure our web platform is bug-free and smooth.' },
  { id: 10, title: 'App tester', category: 'Tech', icon: Zap, description: 'Test mobile and web features pre-launch.' },
  { id: 11, title: 'Community outreach', category: 'Outreach', icon: Users, description: 'Connect with schools, churches, and other partners.' },
  { id: 12, title: 'Partnership coordinator', category: 'Outreach', icon: Heart, description: 'Manage relationships with our mission allies.' },
  { id: 13, title: 'Event planner', category: 'Support & Admin', icon: Star, description: 'Organize workshops and awareness campaigns.' },
  { id: 14, title: 'Event host or virtual assistant', category: 'Support & Admin', icon: Users, description: 'Run the show during live online sessions.' },
  { id: 15, title: 'Peer support listener', category: 'Community', icon: Heart, description: 'Be a listening ear for those who need a friend.' },
  { id: 16, title: 'Resource researcher', category: 'Support & Admin', icon: Sparkles, description: 'Find and curate mental health tools and articles.' },
  { id: 17, title: 'Translation volunteer', category: 'Support & Admin', icon: Users, description: 'Help make Unity Within accessible to everyone.' },
  { id: 18, title: 'Data entry and admin support', category: 'Support & Admin', icon: Users, description: 'Keep our systems accurate and updated.' },
  { id: 19, title: 'Fundraising assistant', category: 'Outreach', icon: Zap, description: 'Help fuel our mission through donation drives.' },
  { id: 20, title: 'Brand ambassador', category: 'Outreach', icon: Star, description: 'Represent Unity Within in your own circles.' },
];

const CATEGORIES = [
  { id: 'Creative', title: 'Creative & Design', description: 'Design, Video, Writing, and Social Media', icon: Sparkles },
  { id: 'Tech', title: 'Tech & Product', description: 'Testing, UX, and Digital reliability', icon: Zap },
  { id: 'Community', title: 'Community Care', description: 'Moderation and Peer Listening', icon: Heart },
  { id: 'Outreach', title: 'Outreach & Growth', description: 'Partnerships and Ambassadorship', icon: Users },
  { id: 'Support & Admin', title: 'Support & Ops', description: 'Events, Admin, and Research', icon: Star },
];

export const VolunteerApplicationForm: React.FC<VolunteerApplicationFormProps> = ({ 
  onSuccess,
  onNavigate,
  inviteToken
}) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [showGreeting, setShowGreeting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
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

  useEffect(() => {
    if (inviteToken) {
      const fetchInvite = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/volunteer/invite/${inviteToken}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.invite) {
              setFormData(prev => ({
                ...prev,
                email: data.invite.email || ''
              }));
            }
          }
        } catch (err) {
          console.error('Error pre-filling invite:', err);
        }
      };
      fetchInvite();
    }
  }, [inviteToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step === 0 && !formData.firstName) {
      setError('Please tell us your name first');
      return;
    }
    if (step === 0 && !showGreeting) {
      setShowGreeting(true);
      setTimeout(() => {
        setError('');
        setStep(1);
      }, 1500);
      return;
    }
    if (step === 1 && !selectedCategory) {
      setError('Please select a category to proceed');
      return;
    }
    if (step === 2 && selectedRoles.length === 0) {
      setError('Select at least one role you are passionate about');
      return;
    }
    setError('');
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
      ? prev.filter(id => id !== roleId)
      : [...prev, roleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const roleNames = selectedRoles
        .map(id => VOLUNTEER_ROLES.find(r => r.id === id)?.title)
        .filter(Boolean);

      const response = await fetch(`${API_BASE_URL}/api/volunteer/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: selectedCategory,
          roles: roleNames,
          token: inviteToken || null,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit application');

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Progress Bar
  const renderProgress = () => {
    const totalSteps = 6;
    const progress = (step / (totalSteps - 1)) * 100;
    return (
      <div className="w-full bg-gray-100 h-1.5 fixed top-0 left-0 z-50">
        <div 
          className="bg-black h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-black uppercase tracking-tighter">Application Sent</h2>
          <p className="text-gray-600 font-medium leading-relaxed">
            Thank you, {formData.firstName}. We've linked your application to your invitation. 
            Our team will reach out to you via <strong>{formData.email}</strong> very soon.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-pink-600 transition-all rounded-none"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-500 text-black selection:bg-black selection:text-white pb-20">
      {renderProgress()}
      
      <div className="max-w-4xl mx-auto px-6 pt-24">
        {/* Step 0: Initial Greeting */}
        {step === 0 && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {showGreeting ? (
              <div className="text-center py-20">
                <h1 className="text-8xl md:text-9xl font-black text-white uppercase tracking-tighter animate-pulse">
                  HELLO, <br /> {formData.firstName}!
                </h1>
              </div>
            ) : (
              <div className="bg-white p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">
                  Let's start with <br /> your name?
                </h1>
                <div className="space-y-8">
                  <div>
                    <input
                      type="text"
                      name="firstName"
                      autoFocus
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="YOUR FIRST NAME"
                      className="w-full bg-white border-b-8 border-black text-4xl md:text-6xl font-black uppercase placeholder:text-gray-200 focus:outline-none py-4"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="AND LAST NAME"
                      className="w-full bg-white border-b-4 border-black text-2xl md:text-4xl font-black uppercase placeholder:text-gray-200 focus:outline-none py-2"
                    />
                  </div>
                  {error && <p className="text-pink-600 font-bold uppercase">{error}</p>}
                  <button 
                    onClick={nextStep}
                    className="group flex items-center gap-4 bg-black text-white px-10 py-6 text-xl font-bold uppercase tracking-widest hover:bg-pink-600 hover:translate-x-2 transition-all"
                  >
                    Continue <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Category Cards */}
        {step === 1 && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <header>
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">Choose Your <br /> Expertise</h2>
              <p className="text-black text-xl font-bold uppercase">Select the category that matches your skills</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); nextStep(); }}
                  className={`group relative bg-white p-8 border-4 border-black text-left transition-all hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${selectedCategory === cat.id ? 'bg-black text-white' : ''}`}
                >
                  <cat.icon size={48} className={`mb-6 ${selectedCategory === cat.id ? 'text-pink-500' : 'text-black'}`} />
                  <h3 className="text-2xl font-black uppercase mb-2 leading-none">{cat.title}</h3>
                  <p className={`text-sm font-bold uppercase ${selectedCategory === cat.id ? 'text-gray-400' : 'text-gray-500'}`}>{cat.description}</p>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight />
                  </div>
                </button>
              ))}
            </div>
            {error && <p className="text-white bg-black p-4 font-bold uppercase">{error}</p>}
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-4 text-white hover:text-black transition-colors cursor-pointer mb-4" onClick={prevStep}>
              <ArrowLeft /> <span className="font-bold uppercase tracking-widest">Back to Categories</span>
            </div>
            <header>
              <h2 className="text-6xl font-black text-black uppercase tracking-tighter leading-none mb-4">Select <br /> Roles</h2>
              <p className="text-white text-xl font-bold uppercase">You can pick multiple roles in {selectedCategory}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOLUNTEER_ROLES.filter(r => r.category === selectedCategory).map(role => (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`flex items-start gap-4 p-6 border-4 border-black text-left transition-all ${selectedRoles.includes(role.id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-pink-100'}`}
                >
                  <div className={`mt-1 flex-shrink-0 w-6 h-6 border-2 border-black rounded-none flex items-center justify-center ${selectedRoles.includes(role.id) ? 'bg-pink-500' : 'bg-white'}`}>
                    {selectedRoles.includes(role.id) && <CheckCircle size={16} className="text-white" />}
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-lg leading-none mb-2">{role.title}</h4>
                    <p className={`text-xs font-bold uppercase ${selectedRoles.includes(role.id) ? 'text-gray-400' : 'text-gray-500'}`}>{role.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            {error && <p className="text-white bg-black p-4 font-bold uppercase">{error}</p>}
            
            <button 
              onClick={nextStep}
              className="w-full bg-black text-white px-10 py-6 text-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4"
            >
              Continue <ArrowRight />
            </button>
          </div>
        )}

        {/* Step 3: Logistics */}
        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
             <div className="flex items-center gap-4 text-white hover:text-black transition-colors cursor-pointer mb-4" onClick={prevStep}>
              <ArrowLeft /> <span className="font-bold uppercase tracking-widest">Back to Roles</span>
            </div>
            <header>
              <h2 className="text-6xl font-black text-black uppercase tracking-tighter leading-none mb-4">Availability <br /> & Mode</h2>
            </header>

            <div className="bg-white border-8 border-black p-10 space-y-10">
              <div className="space-y-4">
                <label className="block text-xl font-black uppercase">How many hours per week?</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['1-3', '4-8', '8-15', '15+'].map(val => (
                    <button
                      key={val}
                      onClick={() => setFormData({ ...formData, availability: val })}
                      className={`py-4 border-4 border-black font-black uppercase transition-all ${formData.availability === val ? 'bg-black text-white' : 'bg-white text-black hover:bg-pink-500 hover:text-white'}`}
                    >
                      {val} hrs
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xl font-black uppercase">Work Preference?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Remote only', 'In-person (Nairobi)', 'Hybrid'].map(val => (
                    <button
                      key={val}
                      onClick={() => setFormData({ ...formData, workPreference: val })}
                      className={`py-4 border-4 border-black font-black uppercase transition-all ${formData.workPreference === val ? 'bg-black text-white' : 'bg-white text-black hover:bg-pink-500 hover:text-white'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xl font-black uppercase">Mental Health Experience?</label>
                <select
                  name="mentalHealthContext"
                  value={formData.mentalHealthContext}
                  onChange={handleInputChange}
                  className="w-full bg-white border-4 border-black p-4 text-xl font-black uppercase focus:outline-none appearance-none"
                >
                  <option value="">Choose One</option>
                  <option value="Yes, personally">Personal Experience</option>
                  <option value="Supporting someone">Supporting Others</option>
                  <option value="Both">Both</option>
                  <option value="Ally">Ally / Supporter</option>
                </select>
              </div>
            </div>

            <button 
              onClick={nextStep}
              className="w-full bg-black text-white px-10 py-6 text-2xl font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4"
            >
              Next Step <ArrowRight />
            </button>
          </div>
        )}

        {/* Step 4: Story */}
        {step === 4 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
             <div className="flex items-center gap-4 text-white hover:text-black transition-colors cursor-pointer mb-4" onClick={prevStep}>
              <ArrowLeft /> <span className="font-bold uppercase tracking-widest">Back to Logistics</span>
            </div>
            <header>
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">Your <br /> Story</h2>
            </header>

            <div className="space-y-8">
              <div className="bg-white border-4 border-black p-8">
                <label className="block text-xl font-black uppercase mb-4">Tell us about your skills & experience</label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="PORTFOLIO LINKS, PAST WORK, OR JUST A SUMMARY..."
                  className="w-full h-40 bg-pink-50 border-4 border-black p-6 text-xl font-bold placeholder:text-gray-300 focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              <div className="bg-black text-white p-8 border-4 border-black">
                <label className="block text-xl font-black uppercase mb-4 text-pink-500">Why do you want to join Unity Within?</label>
                <textarea
                  name="whyVolunteer"
                  value={formData.whyVolunteer}
                  onChange={handleInputChange}
                  placeholder="WHAT DRIVES YOU TO HELP?"
                  className="w-full h-40 bg-gray-900 border-4 border-pink-500 p-6 text-xl font-bold placeholder:text-gray-700 focus:outline-none focus:bg-black transition-colors"
                />
              </div>
            </div>

            <button 
              onClick={nextStep}
              className="w-full bg-white text-black px-10 py-6 text-2xl font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              Final Step <ArrowRight />
            </button>
          </div>
        )}

        {/* Step 5: Final Contact */}
        {step === 5 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-4 text-white hover:text-black transition-colors cursor-pointer mb-4" onClick={prevStep}>
              <ArrowLeft /> <span className="font-bold uppercase tracking-widest">Back to Story</span>
            </div>
            <header>
              <h2 className="text-6xl font-black text-black uppercase tracking-tighter leading-none mb-4">One Last <br /> Thing</h2>
              <p className="text-white text-xl font-bold uppercase">Confirm your contact details</p>
            </header>

            <div className="bg-white border-4 border-black p-8 space-y-8 shadow-[15px_15px_0px_0px_rgba(0,0,0,1)]">
              <div>
                <label className="block text-sm font-black uppercase text-gray-500 mb-1">Email Address (Locked)</label>
                <div className="flex items-center gap-4 text-2xl font-black uppercase text-black break-all">
                  <Mail className="text-pink-500 shrink-0" size={32} />
                  {formData.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-gray-500 mb-2">Phone Number</label>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-black flex items-center justify-center shrink-0">
                    <Phone className="text-white" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+254..."
                    className="flex-1 border-b-4 border-black text-2xl font-black uppercase focus:outline-none py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black uppercase text-gray-500 mb-2">Location (City/County)</label>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-black flex items-center justify-center shrink-0">
                    <MapPin className="text-white" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="E.G. NAIROBI"
                    className="flex-1 border-b-4 border-black text-2xl font-black uppercase focus:outline-none py-2"
                  />
                </div>
              </div>
            </div>

            {error && <div className="p-6 bg-red-600 text-white font-black uppercase border-4 border-black">{error}</div>}

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="group w-full bg-black text-white px-10 py-8 text-3xl font-black uppercase tracking-widest hover:bg-pink-600 transition-all flex items-center justify-center gap-6 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin" /> : <>Finish Application <Zap className="group-hover:fill-current transition-all" /></>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default VolunteerApplicationForm;
