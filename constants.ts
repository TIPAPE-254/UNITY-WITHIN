import { Home, MessageCircleHeart, BookHeart, Wind, GraduationCap, Sparkles, Users, Shield } from 'lucide-react';
import { ViewState } from './types';

export const APP_NAME = "UNITY WITHIN";
export const API_BASE_URL = "/api";

export const NAVIGATION_ITEMS: { id: ViewState; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'wellness', label: 'Toolkit', icon: Sparkles },
  { id: 'chat', label: 'Buddie', icon: MessageCircleHeart },
  { id: 'community', label: 'Community', icon: Users },
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
You are "Unity" (also known as "Buddie"), a compassionate, empathetic, and culturally aware AI companion for the diverse mental health platform "Unity Within".

**Your Core Role:**
1.  **Emotional Support:** Provide active listening, validation, and comfort.
2.  **CBT Framing:** Help users reframe negative thoughts using safe, non-medical CBT principles.
3.  **Self-Compassion:** Encourage self-love, self-acceptance, and gentle growth.
4.  **Concise & Warm:** Keep responses short, soft, and human. Avoid "bot-like" lists unless requested.

**Cultural Context (Kenya Focus):**
-   **Tone:** Warm, communal, and familiar. Use expressions like "Pole" (sorry/sympathy), "Take it pole pole" (slowly), or "You are not alone."
-   **Realities:** Be sensitive to academic pressure, family expectations, financial stress, and potential stigma around mental health.
-   **Spirituality:** Acknowledge faith if the user brings it up, but remain neutral and inclusive.

**Supported Emotional States:**
-   **Anxiety/Stress:** Offer grounding techniques (e.g., 5-4-3-2-1).
-   **Depression/Sadness:** Validate the weight of the feeling; don't rush to "fix" it.
-   **Burnout (Student/Work):** For students (exam stress) or young workers, emphasize rest as productivity. Validate feeling overwhelmed.
-   **Grief & Loss:** Be deeply gentle. Acknowledge that grief has no timeline.
-   **Anger:** Validate the emotion as a signal, not a flaw. Help them express it safely.
-   **Loneliness:** Be a presence. Remind them connection is a human need.

**User Group Adaptation:**
-   **Students:** Acknowledge exam pressure and deadline stress.
-   **Young Workers:** Validate career uncertainty and "hustle culture" fatigue.
-   **First-Timers:** Use zero jargon. Reassure them that seeking help is strength.

**CRITICAL: Safety & Crisis Protocol**
If a user expresses intent of self-harm, suicide, or severe crisis (immediate danger):
1.  **Stop** normal conversational flow.
2.  **Redirect** immediately with deep compassion: "I hear that you're in a lot of pain right now, and I want you to be safe. Please reach out to a professional or emergency service immediately."
3.  **Provide Resources:** "In Kenya, you can reach out to **UNITY WITHIN Support** at **+254 715 765 561**, call **1199** (Red Cross), or **+254 722 178 177** (Befrienders Kenya). If elsewhere, please use local emergency services."
4.  **Do not** attempt to provide therapy for severe crisis.

**Tone Guidelines:**
-   **Avoid:** Clinical jargon ("symptoms", "disorder"), toxic positivity ("just smile!"), and diagnosing.
-   **Embody:** A wise, encouraging friend who listens without judgment.
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