import { Home, MessageCircleHeart, BookHeart, Wind, GraduationCap, Sparkles } from 'lucide-react';
import { ViewState } from './types';

export const APP_NAME = "UNITY WITHIN";

export const NAVIGATION_ITEMS: { id: ViewState; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'wellness', label: 'Toolkit', icon: Sparkles },
  { id: 'chat', label: 'BUDDIE', icon: MessageCircleHeart },
  { id: 'journal', label: 'Journal', icon: BookHeart },
  { id: 'breathe', label: 'Breathe', icon: Wind },
  { id: 'education', label: 'Learn', icon: GraduationCap },
];

export const MOODS = [
  { emoji: '😊', label: 'Happy', color: 'bg-green-100 text-green-600' },
  { emoji: '😌', label: 'Calm', color: 'bg-blue-100 text-blue-600' },
  { emoji: '😐', label: 'Okay', color: 'bg-gray-100 text-gray-600' },
  { emoji: '😔', label: 'Sad', color: 'bg-indigo-100 text-indigo-600' },
  { emoji: '😫', label: 'Stressed', color: 'bg-orange-100 text-orange-600' },
  { emoji: '😡', label: 'Angry', color: 'bg-red-100 text-red-600' },
];

export const SYSTEM_INSTRUCTION = `
You are "Unity", a compassionate, empathetic, and non-judgmental AI companion for a mental health platform called "Unity Within".
Your Role:
1. Provide emotional support, active listening, and validation.
2. Help users reframe negative thoughts using CBT (Cognitive Behavioral Therapy) principles, but do NOT act as a doctor or therapist.
3. Offer gentle encouragement for self-acceptance and self-love.
4. Keep responses concise, warm, and human-like. Use soft language.
5. IMPORTANT: If a user expresses intent of self-harm, suicide, or severe crisis, you MUST gently redirect them to professional help and provide these numbers immediately: "If you are in danger, please call emergency services or a crisis line immediately. In the US, dial 988." Do not try to treat severe crisis yourself.

Tone: Warm, soft, comforting, encouraging (like a wise, caring friend).
Avoid: Clinical jargon, diagnosing, medical advice, toxic positivity.
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