import React, { useState, useEffect } from 'react';
import {
  X, Clock, Headphones, BookOpen, Video, Sparkles, Play, Star, Users, CheckCircle,
  ChevronRight, Lock, Filter, Search
} from 'lucide-react';

const BRAND = {
  sage: '#1D9E75',
  sageLight: '#E8F5EE',
  lavender: '#7F77DD',
  lavenderLight: '#EFEDF9',
  amber: '#EF9F27',
  amberLight: '#FEF3E2',
  cream: '#FFF5F7',
  creamDark: '#FEF0F2',
};

interface Course {
  id: string;
  title: string;
  type: 'free' | 'paid';
  format: 'gamified' | 'audio' | 'video' | 'live' | 'all-access';
  duration: string;
  xp: number;
  accent: string;
  icon: string;
  category: string;
  price?: string;
  description?: string;
  enrolled?: boolean;
  progress?: number;
  lastLesson?: number;
}

const MOCK_COURSES: Course[] = [
  { id: '1', title: 'Know Your Mind', type: 'free', format: 'gamified', duration: '7 days', xp: 150, accent: '#1D9E75', icon: '🧠', category: 'self-acceptance', description: 'A 7-day journey to understand your thoughts and emotions.' },
  { id: '2', title: 'Calm in the Storm', type: 'free', format: 'gamified', duration: '10 days', xp: 200, accent: '#7F77DD', icon: '🌊', category: 'anxiety', description: 'Learn to quiet your mind when everything feels overwhelming.' },
  { id: '3', title: 'Mirror Work', type: 'free', format: 'gamified', duration: '14 days', xp: 250, accent: '#D4537E', icon: '🪞', category: 'self-acceptance', description: 'Build a kinder relationship with the person in the mirror.' },
  { id: '4', title: 'Speak Your Truth', type: 'free', format: 'audio', duration: '5 sessions', xp: 120, accent: '#EF9F27', icon: '🗣️', category: 'boundaries', description: 'Audio lessons on finding and using your voice.' },
  { id: '5', title: 'Rooted: Heal Your Inner Child', type: 'paid', format: 'live', duration: '28 days', xp: 500, accent: '#085041', icon: '🌿', category: 'identity', price: 'KES 1,500', description: 'A deep 4-week journey to heal childhood wounds.' },
  { id: '6', title: 'Relationship Rewire', type: 'paid', format: 'video', duration: '21 days', xp: 420, accent: '#993556', icon: '💬', category: 'relationships', price: 'KES 1,200', description: 'Transform how you connect with others.' },
  { id: '7', title: 'Burnout to Brilliance', type: 'paid', format: 'video', duration: '42 days', xp: 600, accent: '#B47A10', icon: '⚡', category: 'burnout', price: 'KES 2,000', description: 'Recover from burnout and rediscover your spark.' },
  { id: '8', title: 'UnityWithin+ Membership', type: 'paid', format: 'all-access', duration: 'Monthly', xp: 999, accent: '#3C3489', icon: '🧘🏾', category: 'all', price: 'KES 800/mo', description: 'Unlimited access to all courses, live sessions, and more.' },
];

const CATEGORY_FILTERS = ['All', 'Self-acceptance', 'Anxiety', 'Relationships', 'Burnout', 'Boundaries', 'Identity'];
const FORMAT_FILTERS = ['All', 'Free', 'Paid', 'Audio', 'Gamified', 'Live'];

const InProgressStrip: React.FC<{ course: Course; onContinue: () => void; onDismiss: () => void }> = ({
  course, onContinue, onDismiss
}) => (
  <div className="bg-[#E8F5EE] rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
      style={{ backgroundColor: course.accent }}
    >
      {course.icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-wide">Continue Learning</p>
      <p className="font-bold text-gray-900 truncate">{course.title}</p>
      <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1D9E75] rounded-full transition-all"
          style={{ width: `${course.progress || 0}%` }}
        />
      </div>
    </div>
    <button
      onClick={onContinue}
      className="px-4 py-2 bg-[#1D9E75] text-white font-semibold rounded-full text-sm hover:bg-[#188865] transition-colors whitespace-nowrap"
    >
      Continue
    </button>
    <button onClick={onDismiss} className="p-1 text-gray-400 hover:text-gray-600">
      <X size={18} />
    </button>
  </div>
);

const FilterPills: React.FC<{
  filters: string[];
  active: string;
  onChange: (f: string) => void;
  accentColor?: string;
}> = ({ filters, active, onChange, accentColor }) => (
  <div className="flex flex-wrap gap-2">
    {filters.map((filter) => (
      <button
        key={filter}
        onClick={() => onChange(filter)}
        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          active === filter
            ? 'text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
        style={active === filter ? { backgroundColor: accentColor || BRAND.sage } : {}}
      >
        {filter}
      </button>
    ))}
  </div>
);

const FormatIcon: React.FC<{ format: Course['format'] }> = ({ format }) => {
  const icons: Record<string, React.ReactNode> = {
    gamified: <Sparkles size={14} />,
    audio: <Headphones size={14} />,
    video: <Video size={14} />,
    live: <Users size={14} />,
    'all-access': <Sparkles size={14} />,
  };
  return <span className="text-gray-400">{icons[format] || <BookOpen size={14} />}</span>;
};

const CourseCard: React.FC<{
  course: Course;
  index: number;
  onClick: () => void;
}> = ({ course, index, onClick }) => (
  <div
    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    style={{ animationDelay: `${index * 60}ms` }}
    onClick={onClick}
  >
    <div
      className="h-24 flex items-center justify-center text-4xl relative"
      style={{ backgroundColor: course.accent }}
    >
      <span>{course.icon}</span>
      {course.type === 'free' ? (
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#1D9E75] text-white text-xs font-bold rounded-full">
          FREE
        </span>
      ) : (
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#7F77DD] text-white text-xs font-bold rounded-full">
          {course.price}
        </span>
      )}
    </div>
    <div className="p-4 space-y-3">
      <h3 className="font-bold text-gray-900 text-[15px] leading-tight">{course.title}</h3>
      <p className="text-gray-500 text-[13px] line-clamp-2">{course.description}</p>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1 text-gray-400">
          <Clock size={12} /> {course.duration}
        </span>
        <span className="flex items-center gap-1 text-[#EF9F27] font-semibold">
          +{course.xp} XP
        </span>
        <FormatIcon format={course.format} />
      </div>
      {course.enrolled && course.progress !== undefined && (
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      )}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
        <span className="text-[#1D9E75] text-sm font-semibold">View course →</span>
      </div>
    </div>
  </div>
);

const CourseDrawer: React.FC<{
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
}> = ({ course, isOpen, onClose, onEnroll }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!course || !isOpen) return null;

  const isPaid = course.type === 'paid';
  const installment = isPaid && course.price ? Math.round(parseInt(course.price.replace(/[^0-9]/g, '')) / 3) : 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:w-[480px] bg-white md:rounded-l-3xl rounded-t-3xl shadow-2xl z-50 overflow-y-auto max-h-[90vh] md:max-h-none animate-in slide-in-from-bottom-2 md:slide-in-from-right-2 duration-300">
        <div className="sticky top-0 bg-white p-4 flex items-center justify-between border-b border-gray-100 z-10">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
          <span className="text-sm text-gray-400">Course Details</span>
          <div className="w-9" />
        </div>

        <div className="h-full" style={{ backgroundColor: course.accent }}>
          <div className="h-32 flex items-center justify-center text-6xl">
            {course.icon}
          </div>
        </div>

        <div className="p-6 space-y-6 -mt-8 relative">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                    {course.format}
                  </span>
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs rounded-full flex items-center gap-1">
                    <Sparkles size={12} /> {course.xp} XP
                  </span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full font-semibold text-sm ${
                course.type === 'free' ? 'bg-[#E8F5EE] text-[#1D9E75]' : 'bg-[#EFEDF9] text-[#7F77DD]'
              }`}>
                {course.type === 'free' ? 'FREE' : course.price}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="font-semibold text-gray-900">4.8</span>
            </div>
            <span>•</span>
            <span>1,240 learners joined</span>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">What you'll learn</h3>
            <ul className="space-y-3">
              {['Practical techniques you can use daily', 'Greater self-awareness and emotional intelligence', 'A supportive community of learners'].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#1D9E75] mt-0.5 shrink-0" />
                  <span className="text-gray-600 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">
              Syllabus
            </div>
            {['Day 1: Introduction', 'Day 2: Core Concepts', 'Day 3: Practical Application'].map((lesson, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between border-b border-gray-100 last:border-0">
                <span className="text-gray-700 text-sm">{lesson}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">+{50 + i * 25} XP</span>
                  {isPaid && !course.enrolled && <Lock size={14} className="text-gray-300" />}
                </div>
              </div>
            ))}
          </div>

          {course.type === 'paid' && !course.enrolled && (
            <div className="text-xs text-gray-500 text-center">
              Or pay in 3 × KES {installment.toLocaleString()} with Lipa Pole Pole
            </div>
          )}

          <div className="space-y-3 pt-4">
            {course.enrolled ? (
              <button className="w-full py-4 bg-[#1D9E75] text-white font-bold rounded-2xl hover:bg-[#188865] transition-colors">
                Continue learning
              </button>
            ) : isPaid ? (
              <>
                <button
                  onClick={onEnroll}
                  className="w-full py-4 bg-[#1D9E75] text-white font-bold rounded-2xl hover:bg-[#188865] transition-colors"
                >
                  Enrol — {course.price}
                </button>
                <button className="w-full py-4 bg-[#FFFAF0] text-[#EF9F27] font-bold rounded-2xl border-2 border-[#EF9F27] hover:bg-[#FEF3E2] transition-colors flex items-center justify-center gap-2">
                  <span>Pay with M-Pesa</span>
                  <span className="text-lg">💳</span>
                </button>
              </>
            ) : (
              <button className="w-full py-4 bg-[#1D9E75] text-white font-bold rounded-2xl hover:bg-[#188865] transition-colors">
                Start for free — no account needed
              </button>
            )}
          </div>

          {isPaid && (
            <p className="text-center text-sm text-gray-500">
              Can't afford this right now?{' '}
              <a href="/support" className="text-[#1D9E75] font-semibold hover:underline">
                Apply for a scholarship
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

const EmptyState: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="text-center py-16">
    <div className="w-32 h-32 mx-auto mb-6 relative">
      <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
        <path d="M60 10 C60 10 40 30 40 60 C40 90 60 110 60 110 C60 110 80 90 80 60 C80 30 60 10 60 10Z" fill="#E8F5EE" />
        <path d="M60 30 L60 60 L80 70" stroke="#1D9E75" strokeWidth="4" strokeLinecap="round" />
        <path d="M55 45 C55 43 57 41 60 41 C63 41 65 43 65 45 C65 47 63 49 60 49 C57 49 55 47 55 45Z" fill="#1D9E75" />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">Nothing here yet</h3>
    <p className="text-gray-500 mb-6">Try a different filter to find what you're looking for.</p>
    <button
      onClick={onReset}
      className="px-6 py-3 bg-[#1D9E75] text-white font-semibold rounded-full hover:bg-[#188865] transition-colors"
    >
      See all free courses
    </button>
  </div>
);

export const Education: React.FC = () => {
  const [activeFormat, setActiveFormat] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [inProgressCourse, setInProgressCourse] = useState<Course | null>(null);

  const filteredCourses = MOCK_COURSES.filter(course => {
    const formatMatch = activeFormat === 'All' ||
      (activeFormat === 'Free' && course.type === 'free') ||
      (activeFormat === 'Paid' && course.type === 'paid') ||
      (activeFormat === 'Audio' && course.format === 'audio') ||
      (activeFormat === 'Gamified' && course.format === 'gamified') ||
      (activeFormat === 'Live' && course.format === 'live');
    const categoryMatch = activeCategory === 'All' || course.category === activeCategory.toLowerCase();
    return formatMatch && categoryMatch;
  });

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setIsDrawerOpen(true);
  };

  const handleEnroll = () => {
    alert('M-Pesa payment flow would open here');
  };

  const handleResetFilters = () => {
    setActiveFormat('All');
    setActiveCategory('All');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {inProgressCourse && (
        <InProgressStrip
          course={inProgressCourse}
          onContinue={() => handleCourseClick(inProgressCourse)}
          onDismiss={() => setInProgressCourse(null)}
        />
      )}

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Learn to care for your mind</h1>
          <p className="text-gray-500 mt-1">Short, warm lessons on mental health, self-acceptance, and healing.</p>
        </div>

        <div className="space-y-3">
          <FilterPills
            filters={FORMAT_FILTERS}
            active={activeFormat}
            onChange={setActiveFormat}
            accentColor={BRAND.sage}
          />
          <div className="pl-0">
            <FilterPills
              filters={CATEGORY_FILTERS}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          </div>
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <EmptyState onReset={handleResetFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              index={index}
              onClick={() => handleCourseClick(course)}
            />
          ))}
        </div>
      )}

      <CourseDrawer
        course={selectedCourse}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEnroll={handleEnroll}
      />
    </div>
  );
};