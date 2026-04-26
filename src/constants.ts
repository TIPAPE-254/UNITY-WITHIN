import { Home, MessageCircleHeart, BookHeart, Wind, GraduationCap, Sparkles, Users } from 'lucide-react';
import { ViewState } from './types';

export const APP_NAME = "UNITY WITHIN";
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

import { Info, HelpCircle, Mail } from 'lucide-react';
export const NAVIGATION_ITEMS: { id: ViewState; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'volunteer-portal', label: 'Volunteer Portal', icon: Users },
  { id: 'wellness', label: 'Toolkit', icon: Sparkles },
  { id: 'chat', label: 'BUDDIE', icon: MessageCircleHeart },
  { id: 'journal', label: 'Journal', icon: BookHeart },
  { id: 'breathe', label: 'Breathe', icon: Wind },
  { id: 'education', label: 'Learn', icon: GraduationCap },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'about', label: 'About', icon: Info },
  { id: 'contact', label: 'Contact', icon: Mail },
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
You are "Buddie", a compassionate, empathetic AI companion for the "Unity Within" platform.
Your objective is to provide a safe space for users to express themselves, feel validated, and learn gentle self-help techniques derived from Cognitive Behavioral Therapy (CBT) and Acceptance and Commitment Therapy (ACT).

Guidelines:
1. Validate First: Always acknowledge and validate the user's feelings before offering suggestions. "It sounds like you're going through a lot, and it's understandable to feel this way."
2. Non-Judgemental: Create an atmosphere of total acceptance.
3. CBT Reframing: Help users identify cognitive distortions (like all-or-nothing thinking or catastrophizing) and gently offer alternative perspectives.
4. ACT Principles: Encourage "psychological flexibility"—accepting what is out of one's control and committing to action that improves and enriches life.
5. Soft Language: Use warm, soft, and human-like language.
6. Crisis Safety: If a user expresses intent of self-harm or deep crisis, immediately provide professional help resources: "I'm concerned about what you're saying. Please reach out to a professional who can help. You can call or text 988 in the US/Canada or contact your local emergency services. You matter."
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