import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants';
import { CalendarDays, Clock3, Video, Phone, Search, Star, CheckCircle2, XCircle, Shield, Stethoscope, MessageSquareText, UserPen } from 'lucide-react';
import { TherapistProfileEditor } from './TherapistProfileEditor';

type SessionType = 'video' | 'voice';

type Therapist = {
  id: number;
  name: string;
  photo?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  qualifications?: string;
  experience?: string;
  languages?: string;
  availability?: string;
  availability_schedule?: string;
  session_price?: string;
  rating?: number;
  status?: string;
  is_online?: boolean;
};

type PortalSession = {
  id: number;
  user_id: number | null;
  therapist_id: number | null;
  user_name?: string;
  user_email?: string;
  therapist_name?: string;
  call_mode?: string;
  status: string;
  scheduled_date?: string;
  scheduled_time?: string;
  issue_description?: string;
  client_name?: string;
  client_email?: string;
  priority?: string;
};

type BookingStep = 1 | 2 | 3 | 4 | 5;

interface TherapySupportProps {
  userId?: number;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  initialTab?: 'directory' | 'my-bookings' | 'therapist-portal';
}

type TherapistPresencePayload = {
  therapistId?: number;
  isOnline?: boolean;
  onlineTherapistIds?: number[];
};

const concernOptions = [
  'Anxiety',
  'Depression',
  'Relationship issues',
  'Stress & burnout',
  'Grief',
  'Trauma',
  'Other',
];

const slotLabels = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '18:00'];

const toIsoDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const authHeaders = (userRole?: string, userId?: number, userEmail?: string) => ({
  'Content-Type': 'application/json',
  'x-role': userRole || 'user',
  'x-user-id': String(userId || ''),
  'x-user-email': userEmail || '',
});

export const TherapySupport: React.FC<TherapySupportProps> = ({ userId, userName = 'Friend', userEmail, userRole = 'user', initialTab }) => {
  const isAdmin = userRole === 'admin' || userEmail === 'lepiromatayo@gmail.com';
  const isTherapist = userRole === 'therapist';
  const socketRef = useRef<Socket | null>(null);

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [onlineTherapistIds, setOnlineTherapistIds] = useState<number[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [therapistQuery, setTherapistQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>(1);
  const [sessionType, setSessionType] = useState<SessionType>('video');
  const [selectedDate, setSelectedDate] = useState(toIsoDate(new Date()));
  const [selectedTime, setSelectedTime] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [concernText, setConcernText] = useState('');
  const [firstTimeTherapy, setFirstTimeTherapy] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'voucher'>('card');
  const [requestResult, setRequestResult] = useState<{ id: number; status: string } | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingBusy, setBookingBusy] = useState(false);

   const [activeSession, setActiveSession] = useState<any>(null);
   const [portalSessions, setPortalSessions] = useState<PortalSession[]>([]);
   const [portalBusy, setPortalBusy] = useState(false);
    const [activeTab, setActiveTab] = useState<'directory' | 'my-bookings' | 'therapist-portal'>(initialTab || (isTherapist ? 'therapist-portal' : 'directory'));
    const [editingProfile, setEditingProfile] = useState(false);

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:5000');

  const filteredTherapists = useMemo(() => {
    const q = therapistQuery.toLowerCase().trim();
    return therapists
      .map((therapist) => ({
        ...therapist,
        is_online: onlineTherapistIds.includes(therapist.id) || Boolean(therapist.is_online),
      }))
      .filter((t) => {
        const s = `${t.name || ''} ${t.specialization || ''} ${t.languages || ''}`.toLowerCase();
        if (q && !s.includes(q)) return false;
        return true;
      });
  }, [therapists, therapistQuery, onlineTherapistIds]);

  const syncTherapistPresence = (payload: TherapistPresencePayload) => {
    if (Array.isArray(payload.onlineTherapistIds)) {
      setOnlineTherapistIds(payload.onlineTherapistIds);
      return;
    }

    if (typeof payload.therapistId === 'number') {
      setOnlineTherapistIds((current) => {
        const hasTherapist = current.includes(payload.therapistId as number);
        if (payload.isOnline) {
          return hasTherapist ? current : [...current, payload.therapistId as number];
        }
        return hasTherapist ? current.filter((id) => id !== payload.therapistId) : current;
      });
    }
  };

  const fetchTherapists = async () => {
    try {
      setLoadingTherapists(true);
      const params = new URLSearchParams();
      if (specializationFilter) params.set('specialization', specializationFilter);
      if (languageFilter) params.set('language', languageFilter);
      if (availabilityFilter) params.set('availability', availabilityFilter);
      if (ratingFilter) params.set('rating', ratingFilter);

      const res = await fetch(`${API_BASE_URL}/support/therapists?${params.toString()}`);
      const data = await res.json();
      const therapistList = data?.success ? (data.data || []) : [];
      setTherapists(
        therapistList.map((therapist: Therapist) => ({
          ...therapist,
          is_online: onlineTherapistIds.includes(therapist.id) || Boolean(therapist.is_online),
        })),
      );
    } catch {
      setTherapists([]);
    } finally {
      setLoadingTherapists(false);
    }
  };

  const fetchPresence = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/support/presence`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.onlineTherapistIds)) {
        setOnlineTherapistIds(data.onlineTherapistIds);
      }
    } catch {
      setOnlineTherapistIds([]);
    }
  };

  const fetchActiveSession = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/support/users/${userId}/sessions/active`);
      const data = await res.json();
      setActiveSession(data?.success ? data.data : null);
    } catch {
      setActiveSession(null);
    }
  };

  const fetchPortalSessions = async () => {
    try {
      setPortalBusy(true);
      const res = await fetch(`${API_BASE_URL}/support/portal/sessions`, {
        headers: authHeaders(userRole, userId, userEmail),
      });
      const data = await res.json();
      setPortalSessions(data?.success ? (data.data?.sessions || []) : []);
    } catch {
      setPortalSessions([]);
    } finally {
      setPortalBusy(false);
    }
   };

   useEffect(() => {
    fetchTherapists();
  }, [specializationFilter, languageFilter, availabilityFilter, ratingFilter]);

  useEffect(() => {
    fetchPresence();

    socketRef.current = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current.on('therapist_presence_changed', (payload: TherapistPresencePayload) => {
      syncTherapistPresence(payload);

      if (typeof payload.therapistId === 'number') {
        setTherapists((current) =>
          current.map((therapist) =>
            therapist.id === payload.therapistId ? { ...therapist, is_online: Boolean(payload.isOnline) } : therapist,
          ),
        );
      }
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl]);

  useEffect(() => {
    setTherapists((current) =>
      current.map((therapist) => ({
        ...therapist,
        is_online: onlineTherapistIds.includes(therapist.id) || Boolean(therapist.is_online),
      })),
    );
  }, [onlineTherapistIds]);

   useEffect(() => {
     if (activeTab === 'my-bookings') {
       fetchActiveSession();
     }
     if (activeTab === 'therapist-portal') {
       fetchPortalSessions();
     }
   }, [activeTab]);

  const resetBooking = () => {
    setBookingStep(1);
    setSessionType('video');
    setSelectedDate(toIsoDate(new Date()));
    setSelectedTime('');
    setConcerns([]);
    setConcernText('');
    setFirstTimeTherapy(false);
    setConsentChecked(false);
    setPaymentMethod('card');
    setRequestResult(null);
    setBookingError('');
  };

  const openBook = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    resetBooking();
  };

  const toggleConcern = (value: string) => {
    setConcerns((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };

  const submitBooking = async () => {
    if (!selectedTherapist || !userId) {
      setBookingError('Please log in first to request a session.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setBookingError('Pick date and time to continue.');
      return;
    }
    if (!consentChecked) {
      setBookingError('Please accept consent to proceed.');
      return;
    }

    const issueParts = [...concerns];
    if (concernText.trim()) issueParts.push(concernText.trim());

    try {
      setBookingBusy(true);
      setBookingError('');
      const res = await fetch(`${API_BASE_URL}/sessions/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistId: selectedTherapist.id,
          userId,
          date: selectedDate,
          time: selectedTime,
          preferredTimeFrame: 'this_week',
          type: sessionType,
          clientName: userName,
          email: userEmail || '',
          issueDescription: issueParts.join(' | '),
          firstTimeTherapy,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        setBookingError(data?.error || 'Booking request failed.');
        return;
      }

      setRequestResult({ id: data.session?.id, status: data.session?.status || 'pending' });
      setBookingStep(5);
      fetchActiveSession();
    } catch {
      setBookingError('Booking request failed. Please try again.');
    } finally {
      setBookingBusy(false);
    }
  };

  const updateSessionStatus = async (sessionId: number, action: 'accept' | 'reject' | 'start' | 'complete') => {
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/${action}`, {
        method: 'POST',
        headers: authHeaders(userRole, userId, userEmail),
      });
      const data = await res.json();
      if (!data?.success) return;
      fetchPortalSessions();
    } catch {
      // no-op for now
    }
  };

  const renderBookingWizard = () => {
    if (!selectedTherapist) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-unity-100 p-6 md:p-8 mt-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-unity-500 font-bold">Session Request</p>
              <h3 className="text-2xl font-bold text-unity-black">Book with {selectedTherapist.name}</h3>
              <p className="text-sm text-gray-500">Step {bookingStep} of 5</p>
            </div>
            <button
              className="text-gray-400 hover:text-unity-600"
              onClick={() => setSelectedTherapist(null)}
            >
              Close
            </button>
          </div>

          {bookingStep === 1 && (
            <div className="space-y-4">
              <h4 className="font-bold text-unity-black">Choose session type</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSessionType('video')}
                  className={`rounded-2xl border p-5 text-left transition-all ${sessionType === 'video' ? 'border-unity-500 bg-unity-50' : 'border-gray-200 hover:border-unity-200'}`}
                >
                  <Video className="mb-2 text-unity-500" size={22} />
                  <p className="font-bold">Video Session</p>
                  <p className="text-sm text-gray-500">Face-to-face support, 50 minutes</p>
                </button>
                <button
                  onClick={() => setSessionType('voice')}
                  className={`rounded-2xl border p-5 text-left transition-all ${sessionType === 'voice' ? 'border-unity-500 bg-unity-50' : 'border-gray-200 hover:border-unity-200'}`}
                >
                  <Phone className="mb-2 text-unity-500" size={22} />
                  <p className="font-bold">Voice Session</p>
                  <p className="text-sm text-gray-500">Audio-only support, 50 minutes</p>
                </button>
              </div>
              <div className="flex justify-end">
                <button className="px-5 py-2.5 rounded-xl bg-unity-500 text-white font-semibold" onClick={() => setBookingStep(2)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="space-y-4">
              <h4 className="font-bold text-unity-black">Pick date and time</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <label className="text-sm text-gray-600">Date</label>
                  <input
                    type="date"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2"
                    value={selectedDate}
                    min={toIsoDate(new Date())}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-2">Available slots</p>
                  <div className="flex flex-wrap gap-2">
                    {slotLabels.map((slot) => (
                      <button
                        key={slot}
                        className={`px-3 py-1.5 rounded-full text-sm border ${selectedTime === slot ? 'bg-unity-500 text-white border-unity-500' : 'bg-white text-gray-600 border-gray-200 hover:border-unity-300'}`}
                        onClick={() => setSelectedTime(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button className="px-5 py-2.5 rounded-xl border border-gray-200" onClick={() => setBookingStep(1)}>Back</button>
                <button className="px-5 py-2.5 rounded-xl bg-unity-500 text-white font-semibold" onClick={() => setBookingStep(3)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-bold text-unity-black">Tell us what support you need</h4>
              <div className="grid md:grid-cols-2 gap-2">
                {concernOptions.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm rounded-xl border border-gray-200 px-3 py-2">
                    <input type="checkbox" checked={concerns.includes(c)} onChange={() => toggleConcern(c)} />
                    {c}
                  </label>
                ))}
              </div>
              <textarea
                value={concernText}
                onChange={(e) => setConcernText(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
                placeholder="Anything else your therapist should know?"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={firstTimeTherapy} onChange={(e) => setFirstTimeTherapy(e.target.checked)} />
                This is my first therapy session
              </label>
              <div className="flex justify-between">
                <button className="px-5 py-2.5 rounded-xl border border-gray-200" onClick={() => setBookingStep(2)}>Back</button>
                <button className="px-5 py-2.5 rounded-xl bg-unity-500 text-white font-semibold" onClick={() => setBookingStep(4)}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {bookingStep === 4 && (
            <div className="space-y-4">
              <h4 className="font-bold text-unity-black">Confirm and request session</h4>
              <div className="rounded-2xl border border-unity-100 bg-unity-50 p-4 text-sm space-y-1">
                <p><strong>Therapist:</strong> {selectedTherapist.name}</p>
                <p><strong>Type:</strong> {sessionType}</p>
                <p><strong>Date:</strong> {selectedDate}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Rate:</strong> {selectedTherapist.session_price || 'Per profile pricing'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Payment preference</p>
                <div className="flex flex-wrap gap-2">
                  {(['card', 'mobile', 'voucher'] as const).map((p) => (
                    <button
                      key={p}
                      className={`px-3 py-1.5 rounded-full border text-sm ${paymentMethod === p ? 'bg-unity-500 text-white border-unity-500' : 'border-gray-200 text-gray-600'}`}
                      onClick={() => setPaymentMethod(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} />
                I consent to data handling for booking and session coordination.
              </label>
              {bookingError && <p className="text-sm text-red-500">{bookingError}</p>}
              <div className="flex justify-between">
                <button className="px-5 py-2.5 rounded-xl border border-gray-200" onClick={() => setBookingStep(3)}>Back</button>
                <button
                  className="px-5 py-2.5 rounded-xl bg-unity-500 text-white font-semibold disabled:opacity-50"
                  onClick={submitBooking}
                  disabled={bookingBusy}
                >
                  {bookingBusy ? 'Submitting...' : 'Request session'}
                </button>
              </div>
            </div>
          )}

          {bookingStep === 5 && (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto text-green-500 mb-3" size={42} />
              <h4 className="text-2xl font-bold text-unity-black mb-2">Request Sent</h4>
              <p className="text-gray-600">Booking ref: #{requestResult?.id}</p>
              <p className="text-gray-600">Status: {requestResult?.status || 'pending therapist approval'}</p>
              <button
                className="mt-6 px-5 py-2.5 rounded-xl bg-unity-500 text-white font-semibold"
                onClick={() => {
                  setSelectedTherapist(null);
                  setActiveTab('my-bookings');
                }}
              >
                View booking status
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="bg-white rounded-3xl border border-unity-100 p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-unity-500">Unity Within Care</p>
        <h2 className="text-3xl font-bold text-unity-black">Therapist Support and Booking</h2>
        <p className="text-gray-600 mt-1">Discover therapists, request sessions, and manage support flow in one place.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'directory' ? 'bg-unity-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          Therapist Directory
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'my-bookings' ? 'bg-unity-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
        >
          My Bookings
        </button>
        {(isTherapist || isAdmin) && (
          <button
            onClick={() => setActiveTab('therapist-portal')}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'therapist-portal' ? 'bg-unity-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            Therapist Portal
          </button>
         )}
       </div>

      {activeTab === 'directory' && (
        <section className="space-y-4">
          <div className="bg-white rounded-2xl border border-unity-100 p-4 grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={therapistQuery}
                onChange={(e) => setTherapistQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200"
                placeholder="Search name or specialty"
              />
            </div>
            <input className="px-3 py-2 rounded-xl border border-gray-200" placeholder="Specialization" value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)} />
            <input className="px-3 py-2 rounded-xl border border-gray-200" placeholder="Language" value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} />
            <input className="px-3 py-2 rounded-xl border border-gray-200" placeholder="Availability" value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} />
          </div>

          {loadingTherapists ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">Loading therapists...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTherapists.map((therapist) => (
                <article key={therapist.id} className="bg-white rounded-2xl border border-unity-100 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-unity-black">{therapist.name}</h3>
                      <p className="text-sm text-gray-500">{therapist.specialization || 'Mental wellness specialist'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${therapist.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`h-2 w-2 rounded-full ${therapist.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {therapist.is_online ? 'Available now' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">{therapist.bio || 'Compassionate support for emotional wellness and practical care planning.'}</p>
                  <div className="flex items-center gap-3 text-sm mt-3 text-gray-600">
                    <span className="inline-flex items-center gap-1"><Star size={14} className="text-yellow-500" />{therapist.rating || 4.5}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{therapist.availability || (therapist.is_online ? 'Online now' : 'Away')}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 size={14} />{therapist.session_price || '$5 chat / $10 video'}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 px-3 py-2 rounded-xl bg-unity-500 text-white text-sm font-semibold" onClick={() => openBook(therapist)}>
                      Book now
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600"
                      onClick={async () => {
                        if (!userId) return;
                        try {
                          await fetch(`${API_BASE_URL}/support/sessions`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ therapistId: therapist.id, type: 'chat', callMode: 'voice', userId, status: 'new', priority: 'normal' }),
                          });
                          setActiveTab('my-bookings');
                          fetchActiveSession();
                        } catch {
                          // no-op
                        }
                      }}
                    >
                      <MessageSquareText size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'my-bookings' && (
        <section className="bg-white rounded-2xl border border-unity-100 p-6 shadow-sm">
          <h3 className="text-xl font-bold text-unity-black mb-4">My Active Session</h3>
          {!activeSession ? (
            <p className="text-gray-500">No active request right now. Book a therapist from the directory.</p>
          ) : (
            <div className="rounded-2xl border border-gray-200 p-4 space-y-2">
              <p><strong>Therapist:</strong> {activeSession.therapistName || 'Assigned therapist'}</p>
              <p><strong>Mode:</strong> {activeSession.sessionType}</p>
              <p><strong>Status:</strong> {activeSession.status}</p>
              <p><strong>Scheduled:</strong> {activeSession.scheduledTime || 'Pending'}</p>
              <p><strong>Join enabled:</strong> {activeSession.joinEnabled ? 'Yes' : 'No'}</p>
            </div>
          )}
        </section>
      )}

          {activeTab === 'therapist-portal' && (
            <section className="space-y-4">
              <div className="bg-white rounded-2xl border border-unity-100 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-unity-black">Therapist Session Workflow</h3>
                  <p className="text-sm text-gray-500">Approve, reject, start, and complete booked sessions.</p>
                </div>
                <div className="flex gap-2">
                  {isTherapist && (
                    <button className="px-3 py-2 rounded-xl border border-gray-200 text-sm flex items-center gap-1" onClick={() => setEditingProfile(!editingProfile)}>
                      <UserPen size={14} />
                      {editingProfile ? 'Cancel' : 'Edit Profile'}
                    </button>
                  )}
                  <button className="px-3 py-2 rounded-xl border border-gray-200 text-sm" onClick={fetchPortalSessions}>Refresh</button>
                </div>
              </div>

              {editingProfile && isTherapist && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <TherapistProfileEditor
                    onSaved={() => setEditingProfile(false)}
                    onCancel={() => setEditingProfile(false)}
                  />
                </div>
              )}

              {portalBusy ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">Loading sessions...</div>
          ) : (
            <div className="grid gap-3">
              {portalSessions.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-unity-black">Session #{s.id} • {s.therapist_name || 'Therapist'} with {s.user_name || s.client_name || 'Client'}</p>
                      <p className="text-sm text-gray-500">{s.scheduled_date || 'TBD'} {s.scheduled_time || ''} • {s.call_mode || 'voice'} • {s.status}</p>
                      {s.issue_description && <p className="text-sm text-gray-600 mt-1">{s.issue_description}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.status === 'new' && (
                        <>
                          <button className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm" onClick={() => updateSessionStatus(s.id, 'accept')}>
                            <CheckCircle2 size={14} className="inline mr-1" />Approve
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm" onClick={() => updateSessionStatus(s.id, 'reject')}>
                            <XCircle size={14} className="inline mr-1" />Decline
                          </button>
                        </>
                      )}
                      {(s.status === 'confirmed' || s.status === 'live') && (
                        <button className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm" onClick={() => updateSessionStatus(s.id, 'start')}>
                          Start session
                        </button>
                      )}
                      {(s.status === 'in_progress' || s.status === 'ongoing') && (
                        <button className="px-3 py-1.5 rounded-lg bg-unity-100 text-unity-700 text-sm" onClick={() => updateSessionStatus(s.id, 'complete')}>
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {portalSessions.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
                  No sessions yet.
                </div>
              )}
            </div>
           )}
         </section>
       )}

      {selectedTherapist && renderBookingWizard()}
    </div>
  );
};

export default TherapySupport;
