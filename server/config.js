/**
 * AI Configuration for Unity Within
 * 
 * This module centralizes all AI provider configurations.
 * API keys are read from environment variables (Azure App Settings when deployed).
 * 
 * Supported providers:
 * - OpenAI (GPT models)
 * - Groq (Llama/Mixtral-style inference)
 * - Hugging Face (emotion detection)
 */

// AI Provider Configuration
export const aiConfig = {
  // OpenAI Configuration
  openai: {
    key: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    // Azure OpenAI endpoint (optional - use when deployed on Azure with Azure OpenAI)
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || "",
    azureKey: process.env.AZURE_OPENAI_API_KEY || "",
  },

  // Groq Configuration (fast inference for Llama, Mixtral models)
  groq: {
    key: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
  },

  // Hugging Face Configuration (for emotion detection)
  emotion: {
    hfKey: process.env.HUGGINGFACE_API_KEY || "",
    hfModel: process.env.HF_EMOTION_MODEL || "j-hartmann/emotion-english-distilroberta-base",
    // Alternative emotion models
    alternateModels: [
      "bhadresh-savani/distilbert-base-uncased-emotion-student",
      "cardiffnlp/twitter-roberta-base-sentiment",
    ],
  },

  // Hugging Face Datasets for Buddie training data
  datasets: {
    // Primary dataset for conversational dialogues
    dailyDialog: {
      name: process.env.BUDDIE_HF_DATASET || "onyi666/mydataset2",
      config: process.env.BUDDIE_HF_CONFIG || "default",
    },
    // Empathetic dialogues dataset
    empatheticDialogues: {
      name: "facebook/empathetic_dialogues",
      config: "default",
    },
    // Mental health counseling examples
    counseling: {
      name: process.env.BUDDIE_COUNSELING_DATASET || "mental_health_counseling",
      config: "default",
    },
  },
};

// AI Provider Priority Order (used for fallback)
export const AI_PROVIDER_PRIORITY = [
  "openai",
  "groq",
];

// Get available AI providers based on configured API keys
export function getAiProviderStatus() {
  const providers = {};
  
  if (aiConfig.openai.key && !aiConfig.openai.key.startsWith("your_")) {
    providers.openai = {
      available: true,
      model: aiConfig.openai.model,
      type: aiConfig.openai.azureEndpoint ? "azure" : "openai",
    };
  }
  
  if (aiConfig.groq.key && !aiConfig.groq.key.startsWith("your_")) {
    providers.groq = {
      available: true,
      model: aiConfig.groq.model,
    };
  }
  
  if (aiConfig.emotion.hfKey && !aiConfig.emotion.hfKey.startsWith("your_")) {
    providers.huggingface = {
      available: true,
      model: aiConfig.emotion.hfModel,
    };
  }
  
  return providers;
}

// Get the primary AI provider (first available in priority order)
export function getPrimaryProvider() {
  for (const provider of AI_PROVIDER_PRIORITY) {
    const config = aiConfig[provider];
    if (config && config.key && !config.key.startsWith("your_")) {
      return provider;
    }
  }
  return null;
}

// Error message when all AI providers are unavailable
export const AI_UNREACHABLE_MESSAGE = 
  "I'm having trouble connecting right now, but I'm here for you. " +
  "Please try again in a moment, or reach out to our support team if this persists. " +
  "Your wellbeing matters 🤍";

// Default configuration values
export const DEFAULT_CONFIG = {
  aiTimeout: 30000,
  aiRetries: 1,
  buddieMemoryWindow: 6,
  buddieMemoryMax: 60,
  buddieReplyMaxTokens: 85,
  buddieFewShotCount: 2,
};

export default {
  aiConfig,
  AI_PROVIDER_PRIORITY,
  getAiProviderStatus,
  getPrimaryProvider,
  AI_UNREACHABLE_MESSAGE,
  DEFAULT_CONFIG,
};