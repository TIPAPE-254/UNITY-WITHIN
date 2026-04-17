/**
 * Gemini Service - Provides AI generated affirmations and responses
 * This is a stub implementation that returns canned responses
 */

const affirmations: Record<string, string[]> = {
  calm: [
    "You are safe. This moment is peaceful, and that's enough.",
    "Breathe deeply. Your body knows how to find peace.",
    "You are stronger than you think, and gentler than you believe.",
    "This feeling will pass. You've survived 100% of your bad days.",
    "You deserve quiet moments to heal and rest."
  ],
  happy: [
    "Your joy makes the world brighter. Keep shining!",
    "You have so much to celebrate. Let yourself feel good.",
    "Happiness looks good on you. Keep going!",
    "Your smile has power. Never underestimate its reach.",
    "You deserve to enjoy this moment fully."
  ],
  sad: [
    "It's okay to feel sad. Your emotions are valid and important.",
    "You're not alone in this. Healing takes time, and that's okay.",
    "This pain is temporary, even if it doesn't feel that way now.",
    "You've overcome difficult moments before. You can do this.",
    "Be gentle with yourself. You deserve compassion, especially from yourself."
  ],
  stressed: [
    "You are not your stress. Take a breath and remember your strength.",
    "One thing at a time. You don't have to solve everything today.",
    "Your worries don't define you. You're doing better than you think.",
    "Pause. Rest. You can't pour from an empty cup.",
    "This too shall pass. You've got this."
  ],
  default: [
    "You matter. Your presence makes a difference.",
    "Progress over perfection. You're on the right path.",
    "Every step forward, no matter how small, is still progress.",
    "You are worthy exactly as you are.",
    "Today is a new opportunity to be kind to yourself."
  ]
};

export const generateDailyAffirmation = async (mood: string): Promise<string> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const moodKey = mood.toLowerCase();
  const affirmationList = affirmations[moodKey] || affirmations.default;
  const randomIndex = Math.floor(Math.random() * affirmationList.length);
  
  return affirmationList[randomIndex];
};

export const generateResponse = async (userMessage: string, _context?: string): Promise<string> => {
  // Stub implementation - returns a generic supportive response
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return 'Thank you for sharing with me. I\'m here to listen and support you. You\'re doing great by taking care of your mental health.';
};
