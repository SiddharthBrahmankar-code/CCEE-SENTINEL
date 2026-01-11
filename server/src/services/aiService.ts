import dotenv from 'dotenv';

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const AIML_KEY = process.env.AI_API_KEY;
const OR_KEY = process.env.OPENROUTER_API_KEY;

// Type definitions for API responses
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// Track API health
export let apiStatus = {
  gemini: 'unknown',
  aiml: 'unknown', 
  openrouter: 'unknown',
  lastError: '',
  lastCheck: new Date(),
};

export const generateContent = async (prompt: string): Promise<string> => {
  const errors: string[] = [];

  // Try Gemini with multiple fallback keys
  const GEMINI_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5,
    process.env.GEMINI_API_KEY_6,
    process.env.GEMINI_API_KEY_7,
    process.env.GEMINI_API_KEY_8,
    process.env.GEMINI_API_KEY_9,
    process.env.GEMINI_API_KEY_10,
    process.env.GEMINI_API_KEY_11,
    process.env.GEMINI_API_KEY_12,
    process.env.GEMINI_API_KEY_13,
  ].filter(Boolean);

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const key = GEMINI_KEYS[i];
    if (!key) continue;

    try {
      console.log(`🤖 Trying Gemini API (Key ${i + 1}/${GEMINI_KEYS.length}, 2.5-flash)...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json() as GeminiResponse;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`✅ Gemini SUCCESS (Key ${i + 1})`);
          apiStatus.gemini = 'working';
          return text;
        }
      } else {
        const data = await response.json() as GeminiResponse;
        const errorMsg = data.error?.message || 'Unknown error';
        console.warn(`⚠️ Gemini Key ${i + 1} failed (${response.status}):`, errorMsg.substring(0, 100));
        
        if (response.status === 429) {
          console.log(`💳 Key ${i + 1} quota exceeded, trying next key...`);
          continue; // Try next key
        } else {
          errors.push(`Gemini Key ${i + 1}: ${response.status} ${errorMsg.substring(0, 50)}`);
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ Gemini Key ${i + 1} network error:`, err.message);
      errors.push(`Gemini Key ${i + 1}: ${err.message}`);
    }
  }
  
  if (GEMINI_KEYS.length > 0) {
    apiStatus.gemini = 'all_keys_failed';
  }


  // Try AIML API
  if (AIML_KEY) {
    try {
      console.log('🤖 Trying AIML API...');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AIML_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
        }),
      });

      if (response.ok) {
        const data = await response.json() as ChatCompletionResponse;
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          console.log('✅ AIML SUCCESS');
          apiStatus.aiml = 'working';
          return text;
        }
      } else {
        const errorMsg = await response.text();
        console.warn(`⚠️ AIML failed (${response.status}):`, errorMsg.substring(0, 100));
        apiStatus.aiml = response.status === 403 ? 'no_credits' : 'error';
        errors.push(`AIML: ${response.status} No credits`);
      }
    } catch (err: any) {
      console.warn('⚠️ AIML error:', err.message);
      apiStatus.aiml = 'network_error';
      errors.push(`AIML: ${err.message}`);
    }
  }

  // Try OpenRouter with multiple fallback keys AND models
  const OR_KEYS = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
    process.env.OPENROUTER_API_KEY_4,
  ].filter(Boolean);

  const MODELS = [
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-2-9b-it:free',
  ];

  for (const model of MODELS) {
    for (let i = 0; i < OR_KEYS.length; i++) {
      const key = OR_KEYS[i];
      if (!key) continue;

      try {
        console.log(`🤖 Trying OpenRouter (Key ${i + 1}, Model: ${model.split('/')[1]})...`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'http://localhost:5173',
            'X-Title': 'CCEE Sentinel',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4096,
          }),
        });

      if (response.ok) {
        const data = await response.json() as ChatCompletionResponse;
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          console.log(`✅ OpenRouter SUCCESS (Key ${i + 1}, Model: ${model.split('/')[1]})`);
          apiStatus.openrouter = 'working';
          return text;
        }
      } else {
        const errorMsg = await response.text();
        console.warn(`⚠️ OpenRouter Key ${i + 1} failed (${response.status}):`, errorMsg.substring(0, 100));
        
        if (response.status === 402) {
          console.log(`💳 Key ${i + 1} has no credits, trying next key...`);
          continue; // Try next key
        }
        
        apiStatus.openrouter = 'error';
        errors.push(`OpenRouter Key ${i + 1}: ${response.status}`);
        apiStatus.lastError = `Key ${i + 1}: HTTP ${response.status} - ${errorMsg.substring(0, 50)}`;
      }
    } catch (err: any) {
      console.warn(`⚠️ OpenRouter Key ${i + 1} error:`, err.message);
      errors.push(`OpenRouter Key ${i + 1}: ${err.message}`);
      apiStatus.lastError = `Key ${i + 1}: ${err.message}`;
    }
  }
  }
  if (OR_KEYS.length > 0) {
    apiStatus.openrouter = 'all_keys_failed';
  }

  apiStatus.lastCheck = new Date();
  
  const errorSummary = errors.join('; ');
  console.error('❌ All AI providers failed:', errorSummary);
  throw new Error(`AI Unavailable: ${errorSummary}`);
};
