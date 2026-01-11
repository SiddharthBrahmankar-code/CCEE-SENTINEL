
import { tryPuter } from './aiCommon';

export const chatService = {
  sendMessage: async (message: string, history: Array<{role: string, content: string}>) => {
    try {
        return await tryPuter(
            `Role: CCEE Exam Mentor. User: ${message}. Respond concisely.`,
            (txt) => ({ response: txt })
        );
    } catch (e) {
        // Fallback for Demo
        return {
            response: "I'm currently in Offline Demo Mode. I can't process dynamic queries yet, but I can tell you that **React Native** uses the same design system as React! Try asking me on the Web version for real-time answers."
        };
    }
  }
};
