
import { generateAIContent } from './aiCommon';

export const chatApi = {
  sendMessage: (message: string, history: Array<{role: string, content: string}>, context?: { title: string, content: any }) => {
    // Construct a rich prompt with context
    let systemContext = '';
    if (context && context.content) {
        const contentStr = typeof context.content === 'string' 
            ? context.content 
            : JSON.stringify(context.content);
        
        systemContext = `
[CURRENT SCREEN CONTEXT]:
- User is looking at: "${context.title}"
- Screen Content: ${contentStr.substring(0, 8000)} // Truncate to avoid token limits
[END CONTEXT]

If the user asks about the current screen, use the info above.`;
    }

    const historyContext = history.map(msg => `${msg.role === 'user' ? 'User' : 'Mentor'}: ${msg.content}`).join('\n');

    return generateAIContent(
      `Role: CCEE Exam Mentor. ${systemContext}
      
${historyContext ? `[PREVIOUS CONVERSATION START]
${historyContext}
[PREVIOUS CONVERSATION END]` : ''}

User: ${message}. 
Respond concisely (Max 3-4 sentences). Avoid fluff. Focus on high-yield exam facts.`,
      (txt) => ({ response: txt }),
      '/chat'
    );
  }
};
