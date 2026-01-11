
export const waitForPuter = async (timeout = 3000): Promise<void> => {
    // Stub for RN
    console.warn("waitForPuter called on Mobile - Not implemented natively");
    return Promise.resolve();
};

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
    throw new Error('Failed to parse JSON from Puter');
  }
};

export const tryPuter = async <T>(prompt: string, parser?: (text: string) => T): Promise<T> => {
    // Mobile Implementation Gaps:
    // 1. Puter.js requires a browser environment (iframe/script).
    // 2. React Native does not have 'window' or 'document'.
    // 
    // FALLBACK: Return empty or mock data to prevent crash.
    console.warn("tryPuter called on Mobile - Generative AI disabled in native view. Implementation requires WebView bridge.");
    
    // Simulate a network delay
    await new Promise(r => setTimeout(r, 1000));
    
    throw new Error("Generative AI features are currently unavailable on the mobile native app. Please use the web version for AI generation.");
};
