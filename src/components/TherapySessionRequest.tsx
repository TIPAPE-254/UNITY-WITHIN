import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Heart, Stethoscope, Star, Clock, 
  MessageCircle, Video, Phone, CheckCircle, ChevronRight,
  ShieldCheck, Calendar, User
} from 'lucide-react';
import { User as UserType, ViewState } from '../types';
import { getTherapists, bookTherapySession } from '../services/therapistService';

interface TherapySessionRequestProps {
  user?: UserType;
  onNavigate?: (view: ViewState) => void;
}

interface Therapist {
  id: number;
  name: string;
  specialization: string;
  bio: string;
  languages: string;
  availability: string;
  session_price: string;
  rating: number;
  sessions_completed: number;
  image?: string;
}

export const TherapySessionRequest: React.FC<TherapySessionRequestProps> = ({ user, onNavigate }) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [bookingMode, setBookingMode] = useState(false);
  const [bookingType, setBookingType] = useState<any>({
    date: '',
    time: '',
    mode: 'video',
    description: ''
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const payload = await getTherapists();
      setTherapists(payload.data || []);
    } catch (err) {
      console.error('Error fetching therapists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedTherapist || !user) return;
    try {
      const payload = await bookTherapySession({
        therapistId: selectedTherapist.id,
        userId: user.id,
        date: bookingType.date,
        time: bookingType.time,
        type: bookingType.mode,
        issueDescription: bookingType.description
      });
      
      if (payload.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setBookingMode(false);
          setSelectedTherapist(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert(err instanceof Error ? err.message : 'Error booking session. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border-2 border-slate-100">
      {!bookingMode ? (
        <>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900">Clinical Support</h2>
              <p className="text-slate-500 font-medium">Professional therapy and expert guidance.</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Stethoscope size={24} />
            </div>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by specialization or name..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-purple-600 transition-colors outline-none font-medium"
            />
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold">Connecting to Clinical Database...</p>
              </div>
            ) : (
              therapists.map(t => (
                <div 
                  key={t.id} 
                  className="group p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-purple-200 hover:bg-white hover:shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center gap-6"
                  onClick={() => setSelectedTherapist(t)}
                >
                  <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center shrink-0 text-slate-400">
                    <User size={32} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h3 className="text-xl font-black text-slate-900">{t.name}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Verified Professional</span>
                    </div>
                    <p className="text-purple-600 font-black text-sm mb-2">{t.specialization}</p>
                    <p className="text-slate-500 text-sm line-clamp-2">{t.bio}</p>
                  </div>
                  <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-yellow-500 font-black">
                      <Star size={16} fill="currentColor" />
                      {t.rating}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTherapist(t);
                        setBookingMode(true);
                      }}
                      className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-purple-600 transition-colors shadow-lg"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 p-4 bg-slate-900 rounded-2xl text-white flex items-center gap-4">
            <ShieldCheck className="text-purple-400" size={24} />
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">All sessions are private and HIPAA compliant.</p>
          </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto py-4">
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Request Sent!</h2>
              <p className="text-slate-500 font-medium">Dr. {selectedTherapist?.name.split(' ').pop()} will review your request and you'll be notified via push notification.</p>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setBookingMode(false)}
                className="mb-8 font-black text-slate-400 hover:text-slate-900 flex items-center gap-2"
              >
                ← Back to Therapists
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{selectedTherapist?.name}</h3>
                  <p className="text-purple-600 font-black text-sm">{selectedTherapist?.specialization}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-2">Request Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-purple-600 outline-none"
                    onChange={(e) => setBookingType({...bookingType, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-2">Preferred Time</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-purple-600 outline-none"
                    onChange={(e) => setBookingType({...bookingType, time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-2">Session Focus</label>
                  <textarea 
                    placeholder="Briefly describe what you'd like to discuss (optional)..."
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-purple-600 outline-none resize-none"
                    rows={4}
                    onChange={(e) => setBookingType({...bookingType, description: e.target.value})}
                  />
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3">
                  <Video className="text-purple-600" size={20} />
                  <p className="text-xs font-bold text-purple-700">This session will be conducted via secure HD Video Call.</p>
                </div>

                <button 
                  onClick={handleBook}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl transition-all"
                >
                  Confirm Request
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
