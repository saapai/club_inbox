import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // During Vercel build, OPENAI_API_KEY might not be available
    // Use a placeholder that won't cause build failures
    // The actual API key will be available at runtime
    const keyToUse = apiKey || 'placeholder-for-build';
    
    openaiInstance = new OpenAI({ 
      apiKey: keyToUse,
      // Suppress errors during build
      dangerouslyAllowBrowser: false,
    });
  }
  return openaiInstance;
}

// Export lazy getter - don't initialize at module load time
// This prevents build-time errors when OPENAI_API_KEY is not set

export const EXTRACTION_MODEL = 'gpt-4-turbo-preview';
export const VISION_MODEL = 'gpt-4-vision-preview';

