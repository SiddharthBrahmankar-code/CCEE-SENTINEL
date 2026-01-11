
import api from './apiClient';

// Types for Window.ai
declare global {
  interface Window {
    ai?: {
      canCreateTextSession: () => Promise<string>;
      createTextSession: () => Promise<any>;
    };
  }
}

// Utility to clean Puter.js JSON output
export const cleanJson = (text: string) => {
  try {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = text.lastIndexOf('}') + 1;
    } else if (firstBracket !== -1) {
        start = firstBracket;
        end = text.lastIndexOf(']') + 1;
    }

    if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end));
    }
    
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (e) {
    throw new Error('Failed to parse JSON');
  }
};

/**
 * Clear Puter.js cache and authentication data
 * Call this when encountering low balance, quota exceeded, or auth errors
 */
export const clearPuterCache = (): void => {
  try {
    console.log('🧹 Clearing Puter.js cache and auth data...');
    
    // 1. Clear localStorage items related to Puter
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('puter') || key.includes('puter') || key.includes('Puter'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ✓ Removed localStorage: ${key}`);
    });
    
    // 2. Clear sessionStorage items related to Puter
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('puter') || key.includes('puter') || key.includes('Puter'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`  ✓ Removed sessionStorage: ${key}`);
    });
    
    // 3. Clear Puter.js cookies (if accessible)
    try {
      document.cookie.split(";").forEach(cookie => {
        const name = cookie.split("=")[0].trim();
        if (name.toLowerCase().includes('puter')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          console.log(`  ✓ Cleared cookie: ${name}`);
        }
      });
    } catch (e) {
      console.warn('  ⚠️ Could not clear cookies:', e);
    }
    
    // 4. Reset Puter.js instance if it exists
    if ((window as any).puter) {
      try {
        // Try to sign out if method exists
        if (typeof (window as any).puter.auth?.signOut === 'function') {
          (window as any).puter.auth.signOut();
          console.log('  ✓ Signed out from Puter.js');
        }
        // Delete the puter instance
        delete (window as any).puter;
        console.log('  ✓ Removed Puter.js instance from window');
      } catch (e) {
        console.warn('  ⚠️ Could not reset Puter instance:', e);
      }
    }
    
    console.log('✅ Puter.js cache cleared completely');
    console.log('💡 Tip: Refresh the page to fully reset Puter.js');
  } catch (error) {
    console.error('❌ Error clearing Puter.js cache:', error);
  }
};

export const waitForPuter = async (timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
        if ((window as any).puter) {
            resolve();
            return;
        }

        const start = Date.now();
        const check = setInterval(() => {
            if ((window as any).puter) {
                clearInterval(check);
                resolve();
            } else if (Date.now() - start > timeout) {
                clearInterval(check);
                reject(new Error("Puter.js failed to load"));
            }
        }, 100);
    });
};

/**
 * Tries to generate content using:
 * 1. Window.ai (Local - Free)
 * 2. Backend API (Server - Gemini → AIML → OpenRouter)
 * 3. Puter.js (Cloud - Free, Ultimate Fallback)
 */
export const generateAIContent = async <T>(
    prompt: string, 
    parser?: (text: string) => T,
    fallbackEndpoint: string = '/chat' 
): Promise<{ data: T }> => {
  console.log('🤖 Generating AI Content...');

  // 1. Try Window.ai (Local - Free)
  if (window.ai) {
    try {
        const status = await window.ai.canCreateTextSession();
        if (status === 'readily' || status === 'after-download') {
            console.log('✨ Using Window.ai (Local Chrome Model)');
            const session = await window.ai.createTextSession();
            const result = await session.prompt(prompt);
            await session.destroy();

            console.log('✅ Window.ai Success');
            const parsed = parser ? parser(result) : (result as unknown as T);
            return { data: parsed };
        }
    } catch (localErr) {
        console.warn('⚠️ Window.ai failed, trying Backend:', localErr);
    }
  }

  // 2. Try Backend API (Gemini → AIML → OpenRouter)
  try {
    console.log(`🌐 Calling Backend API: ${fallbackEndpoint}`);
    
    let payload = {};
    if (fallbackEndpoint.includes('diagram')) {
        payload = { description: prompt };
    } else {
        payload = { message: prompt };
    }

    const res = await api.post(fallbackEndpoint, payload);
    
    let text = '';
    if (res.data?.mermaidCode) text = res.data.mermaidCode;
    else if (res.data?.response) text = res.data.response;
    else if (typeof res.data === 'string') text = res.data;
    else text = JSON.stringify(res.data);

    if (!text) throw new Error('Empty Backend Response');

    console.log('✅ Backend API Success');
    const parsed = parser ? parser(text) : (text as unknown as T);
    return { data: parsed };

  } catch (serverErr: any) {
    console.warn('⚠️ Backend API failed, trying Puter.js as fallback:', serverErr?.message);
  }

  // 3. Ultimate Fallback: Puter.js (Cloud - Free)
  try {
      console.log('☁️ Trying Puter.js (Ultimate Fallback)...');
      await waitForPuter(3000);
      
      if (!(window as any).puter?.ai?.chat) throw new Error("Puter AI not ready");

      const response = await (window as any).puter.ai.chat(prompt);
      const text = response?.message?.content?.trim() || '';
      
      if (!text) throw new Error('Empty Puter response');

      console.log('✅ Puter.js Success');
      const parsed = parser ? parser(text) : (text as unknown as T);
      return { data: parsed };

  } catch (puterErr: any) {
      console.error('❌ Puter.js (final fallback) failed:', puterErr);
      clearPuterCache();
  }

  // All providers failed
  throw new Error('AI Service Unavailable: All providers failed (Backend + Puter.js)');
};
