import { API_BASE_URL } from "../constants";

export const generateDailyAffirmation = async (mood: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/affirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood })
    });
    const result = await response.json();
    return result.text || "You are enough, exactly as you are.";
  } catch (error) {
    console.error("Affirmation generation failed", error);
    return "Peace comes from within. You are doing great.";
  }
};

export const generateEducationalContent = async (topicTitle: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/educational`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicTitle })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Education generation failed", error);
    return { synthesis: "Unable to load content at this moment.", sources: [] };
  }
}

export const generateThoughtReframe = async (anxiousThought: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/reframe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anxiousThought })
    });
    const result = await response.json();
    return result.text || "It is okay to feel this way, but remember that thoughts are not always facts.";
  } catch (error) {
    console.error("Reframe generation failed", error);
    return "Take a deep breath. You are safe, and this feeling will pass.";
  }
};

export const generateValuesAffirmation = async (values: string[]): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/values-affirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
    const result = await response.json();
    return result.text || "Your values are your compass. Trust them to guide you forward.";
  } catch (error) {
    console.error("Values affirmation failed", error);
    return "Follow what matters to you. One step at a time.";
  }
}