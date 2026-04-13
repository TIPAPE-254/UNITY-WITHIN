import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize the client. 
// Note: We use process.env.API_KEY as strictly required by the guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model configuration
const MODEL_NAME = 'gemini-2.5-flash';

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Warm and creative but stable
      topK: 40,
    },
  });
};

export const generateDailyAffirmation = async (mood: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `The user is feeling "${mood}". Write a short, beautiful, comforting daily affirmation (max 20 words) for them. No quotes, just the affirmation.`,
    });
    return response.text?.trim() || "You are enough, exactly as you are.";
  } catch (error) {
    console.error("Affirmation generation failed", error);
    return "Peace comes from within. You are doing great.";
  }
};

export const generateEducationalContent = async (topicTitle: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Write a short, soothing, and educational summary about "${topicTitle}". 
            Structure it with:
            1. A gentle definition.
            2. Three bullet points of advice.
            3. A closing reassuring thought.
            Keep it under 200 words. Format as Markdown.`,
        });
        return response.text || "Content currently unavailable. Please try again later.";
    } catch (error) {
        console.error("Education generation failed", error);
        return "Unable to load content at this moment.";
    }
}

export const generateThoughtReframe = async (anxiousThought: string): Promise<string> => {
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `The user has this anxious thought: "${anxiousThought}". 
        Provide a gentle, non-clinical, and compassionate reframe. 
        Start with "Try looking at it this way:" 
        Keep it under 40 words.`,
      });
      return response.text?.trim() || "It is okay to feel this way, but remember that thoughts are not always facts.";
    } catch (error) {
      console.error("Reframe generation failed", error);
      return "Take a deep breath. You are safe, and this feeling will pass.";
    }
};

export const generateValuesAffirmation = async (values: string[]): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `The user values: ${values.join(", ")}. 
            Write a short, gentle guiding statement (under 30 words) to help them feel direction and purpose based on these values.
            Tone: Warm, hopeful, grounding.`,
        });
        return response.text?.trim() || "Your values are your compass. Trust them to guide you forward.";
    } catch (error) {
        console.error("Values affirmation failed", error);
        return "Follow what matters to you. One step at a time.";
    }
}