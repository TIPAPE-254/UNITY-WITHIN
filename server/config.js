/**
 * config.js — AI provider configuration
 * Reads API keys and model names from environment variables.
 */

const readEnv = (key, fallback = '') => {
    return process.env[key] || process.env[`APPSETTING_${key}`] || fallback;
};

export const aiConfig = {
    openai: {
        key: readEnv('OPENAI_API_KEY', 'your_openai_api_key'),
        model: readEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    },
    groq: {
        key: readEnv('GROQ_API_KEY', 'your_groq_api_key'),
        model: readEnv('GROQ_MODEL', 'llama3-8b-8192'),
    },
    gemini: {
        key: readEnv('GOOGLE_API_KEY', 'your_google_api_key'),
        model: readEnv('GEMINI_MODEL', 'gemini-1.5-flash'),
    },
    emotion: {
        hfKey: readEnv('HUGGINGFACE_API_KEY', 'your_huggingface_api_key'),
        hfModel: readEnv('HF_EMOTION_MODEL', 'j-hartmann/emotion-english-distilroberta-base'),
    },
};

export const AI_UNREACHABLE_MESSAGE =
    "I'm having trouble connecting right now. Please try again in a moment, or reach out to a trusted person if you need immediate support.";

export function getAiProviderStatus() {
    const isPlaceholder = (key) => !key || key.startsWith('your_');
    return {
        openai: !isPlaceholder(aiConfig.openai.key),
        groq: !isPlaceholder(aiConfig.groq.key),
        gemini: !isPlaceholder(aiConfig.gemini.key),
        huggingface: !isPlaceholder(aiConfig.emotion.hfKey),
    };
}
