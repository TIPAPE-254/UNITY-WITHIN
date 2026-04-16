import { aiConfig } from "./config.js";

const KENYAN_SLANG_MAP = {
  "mzbaki": "unhappy",
  "mzibaki": "unhappy",
  "naogopa": "worried",
  "naogop": "worried",
  "nasy": "depressed",
  "nasu": "depressed",
  "mkono": "money",
  "cash": "money",
  "poa": "good",
  "fresh": "good",
  "ngaio": "not good",
  "ngia": "not good",
  "huzunu": "sad",
  "huzuni": "sad",
  "wala": "none",
  "haina": "none",
  "mbaya": "bad",
  "baya": "bad",
  "furahi": "happy",
  "naweza": "okay",
  "po": "good",
  "vibaya": "bad",

  "si ui": "I don't know",
  "ata": "even",
  "kumbe": "so",
  "bana": "friend",
  "githeri": "mixed",
  "chavery": "coffee",
  "panda": "to rise/upload",
  "chill": "relax",
  "ngoring": "drunk",
  "zigan": {
    sadness: "sad",
    joy: "happy",
    anger: "angry",
    fear: "afraid",
    disgust: "disgusted"
  }
};

const KENYAN_CRISIS_KEYWORDS = [
  "nilion", "nilion", "nilie", "finish",
  "nakufa", "nakufa", "nakoffa", "nafe",
  "siishi", "siishi", "sisha",
  "kujiua", "kujiua", "kujidh",
  "naona", "naona", "no more",
  "i'm done", "i give up", "end it",
  "jump", "jump off", "roof", "bridge",
  "train", "poison", "pills"
];

export function detectEmotionWithKenyanLayer(text, detectFn) {
  const baseEmotion = detectFn ? detectFn(text) : null;
  
  if (!text || typeof text !== "string") {
    return {
      emotionLabel: baseEmotion?.emotionLabel || "neutral",
      mood: "neutral",
      slangDetected: [],
      isCrisisKeyword: false,
      isKenyan: false,
    };
  }

  const lowerText = text.toLowerCase();
  const slangDetected = [];
  
  for (const [slang, english] of Object.entries(KENYAN_SLANG_MAP)) {
    if (typeof english === "object") continue;
    if (lowerText.includes(slang.toLowerCase())) {
      slangDetected.push({ slang, english });
    }
  }

  const isCrisisKeyword = KENYAN_CRISIS_KEYWORDS.some(
    keyword => lowerText.includes(keyword.toLowerCase())
  );

  let mood = "neutral";
  let emotionLabel = baseEmotion?.emotionLabel || "neutral";

  for (const { slang, english } of slangDetected) {
    const mapped = KENYAN_SLANG_MAP[slang];
    if (typeof mapped === "object" && mapped.emotion) {
      emotionLabel = mapped.emotion;
    } else if (["happy", "good", "fresh", "poa", "po", "furahi"].includes(english)) {
      mood = "positive";
    } else if (["unhappy", "sad", "depressed", "worried", "not good", "bad"].includes(english)) {
      mood = "low";
    }
  }

  if (isCrisisKeyword) {
    emotionLabel = "crisis";
    mood = "crisis";
  }

  return {
    emotionLabel,
    mood,
    slangDetected,
    isCrisisKeyword,
    isKenyan: slangDetected.length > 0,
  };
}

export function getKenyanCrisisBridgeResponse() {
  const responses = [
    "I hear you, and I'm here with you. You're not alone in this. Let's talk about what's happening.",
    "Thank you for sharing this with me. It takes courage. What’s on your mind right now?",
    "I can sense this is really heavy. I want to understand. Tell me more about what’s going on.",
    "Your feelings are valid. You matter, and this conversation matters. Let’s work through this together.",
    "I'm glad you reached out. That shows real strength. What's going on?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function getKenyanSlangContext(text) {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  const matches = [];
  
  for (const [slang, meaning] of Object.entries(KENYAN_SLANG_MAP)) {
    if (typeof meaning === "object") continue;
    if (lowerText.includes(slang.toLowerCase())) {
      matches.push({ slang, meaning });
    }
  }
  
  return matches.length > 0 ? matches : null;
}

export default {
  detectEmotionWithKenyanLayer,
  getKenyanCrisisBridgeResponse,
  getKenyanSlangContext,
};