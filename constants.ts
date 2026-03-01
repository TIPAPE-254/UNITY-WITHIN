import { Home, MessageCircleHeart, BookHeart, Wind, GraduationCap, Sparkles, Users, Shield, UserCircle } from 'lucide-react';
import { ViewState } from './types';

export const APP_NAME = "UNITY WITHIN";
export const API_BASE_URL = "/api";

export const NAVIGATION_ITEMS: { id: ViewState; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'wellness', label: 'Toolkit', icon: Sparkles },
  { id: 'chat', label: 'Buddie', icon: MessageCircleHeart },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'journal', label: 'Journal', icon: BookHeart },
  { id: 'breathe', label: 'Breathe', icon: Wind },
  { id: 'education', label: 'Learn', icon: GraduationCap },
  { id: 'admin', label: 'Admin', icon: Shield },
];

export const MOODS = [
  { emoji: '😊', label: 'Happy', color: 'bg-green-100 text-green-600' },
  { emoji: '😌', label: 'Calm', color: 'bg-blue-100 text-blue-600' },
  { emoji: '😐', label: 'Okay', color: 'bg-gray-100 text-gray-600' },
  { emoji: '😔', label: 'Sad', color: 'bg-indigo-100 text-indigo-600' },
  { emoji: '😫', label: 'Stressed', color: 'bg-orange-100 text-orange-600' },
  { emoji: '😡', label: 'Angry', color: 'bg-red-100 text-red-600' },
  { emoji: '😰', label: 'Anxious', color: 'bg-teal-100 text-teal-600' },
  { emoji: '🥱', label: 'Tired', color: 'bg-stone-100 text-stone-600' },
];

export const SYSTEM_INSTRUCTION = `
You are BUDDIE (also known as Unity), a warm, emotionally intelligent digital companion for Unity Within.
You are not a formal assistant. You are a supportive, human-like friend who listens deeply, responds gently, and brings lightness when it helps.

CORE PERSONALITY
- Emotionally intelligent, warm, calm in heavy moments, playful in light moments.
- Cheerful and hopeful without being fake-positive.
- Naturally funny in a kind, relatable way (never forced, never mocking).

EMOTIONAL INTELLIGENCE FIRST
1) Notice the emotional tone.
2) Validate and reflect it sincerely.
3) Offer warmth and gentle support.
4) Add light humor only if it is safe and helpful.

HUMOR STYLE
- Gentle, kind, relatable, slightly witty, culturally warm.
- No sarcasm that could hurt, no jokes about trauma, loss, or self-harm.
- Use humor to lift, never to dismiss.

CONVERSATION STYLE
- Natural, conversational, human-paced.
- Short to medium responses by default.
- Avoid academic tone and avoid robotic lists unless asked.

SUPPORT STYLE
- Encourage small, doable steps: breathing, journaling, reflection, self-kindness.
- Never command or pressure; guide like a caring friend.
- Celebrate small wins and check in naturally.

CULTURAL CONTEXT (KENYA FOCUS)
- Warm, communal tone. Phrases like "Pole" or "take it pole pole" are welcome when natural.
- Be sensitive to academic pressure, family expectations, financial stress, and stigma.
- Acknowledge faith if the user brings it up, remain inclusive.

CRISIS SAFETY MODE (NON-NEGOTIABLE)
If a user expresses intent of self-harm, suicide, or immediate danger:
- Pause normal flow. No humor.
- Respond with calm, compassionate support and encourage reaching out now.
- Provide resources: "In Kenya, contact UNITY WITHIN Support at +254 715 765 561, call 1199 (Red Cross), or +254 722 178 177 (Befrienders Kenya). If elsewhere, use local emergency services."
- Do not attempt therapy in severe crisis.

TONE DO AND DO NOT
- Do: sound like a kind friend who listens without judgment.
- Do not: diagnose, use clinical jargon, or use toxic positivity.
`;

export const EDUCATIONAL_TOPICS = [
  {
    id: '1',
    title: 'Understanding Anxiety',
    category: 'Education',
    duration: '3 min read',
    description: 'Learn the basics of anxiety and how it affects the body and mind.',
  },
  {
    id: '2',
    title: 'The Art of Self-Love',
    category: 'Self-Growth',
    duration: '5 min read',
    description: 'Practical steps to start accepting yourself exactly as you are.',
  },
  {
    id: '3',
    title: 'Setting Healthy Boundaries',
    category: 'Relationships',
    duration: '4 min read',
    description: 'Why saying "no" is actually an act of kindness to yourself.',
  },
  {
    id: '4',
    title: 'Imposter Syndrome',
    category: 'Career & Self',
    duration: '4 min read',
    description: 'Overcoming the feeling that you are not good enough.',
  },
  {
    id: '5',
    title: 'Surviving Exam Season',
    category: 'Student Life',
    duration: '6 min read',
    description: 'Practical strategies to manage pressure and study effectively.',
  },
  {
    id: '6',
    title: 'Burnout vs. Tiredness',
    category: 'Work & Hustle',
    duration: '5 min read',
    description: 'How to spot the signs of burnout and recover before you crash.',
  },

];

export const MICRO_STEPS = [
  "Sit up in bed or a chair.",
  "Drink one sip of water.",
  "Open the curtains to let light in.",
  "Wash your face with cool water.",
  "Put on clean socks.",
  "Step outside for 30 seconds.",
  "Stretch your arms above your head.",
  "Send a text to one person.",
  "Listen to one favorite song.",
  "Make your bed (imperfectly is fine).",
  "Eat a piece of fruit.",
  "Take 3 deep breaths.",
  "Brush your teeth.",
  "Write down one feeling.",
  "Change out of pajamas.",
];

export const CORE_VALUES = [
  "Kindness", "Creativity", "Peace", "Freedom",
  "Connection", "Growth", "Honesty", "Joy",
  "Safety", "Curiosity", "Balance", "Courage",
  "Love", "Health", "Purpose", "Simplicity"
];