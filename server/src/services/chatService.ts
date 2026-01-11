import { generateContent } from './aiService';

export const chatWithAI = async (message: string, history: { role: string, content: string }[] = []) => {
  // Construct a prompt context
  // We can add a system instruction here to give the chatbot a persona
  const systemPrompt = `
    You are an intelligent teaching assistant for the CCEE / PG-DAC program.
    Your goal is to help students understand programming concepts (Java, OS, C++, Web Dev), 
    solve doubts, and provide code examples.
    
    Be concise, helpful, and encouraging.
    If the user asks about the syllabus, refer to general topics but mention the "Syllabus Radar" tab for details.
    
    IMPORTANT: When providing code examples, ALWAYS use Markdown code blocks (e.g., \`\`\`java, \`\`\`cpp) with proper syntax highlighting. Do not write code in plain text. Format your code for readability.
  `;

  // For a stateless implementation with the current aiService (which takes a single string prompt),
  // we need to format the history into the prompt manually if we want context,
  // OR we just send the latest message if we want to keep it simple for now.
  // Let's do a simple history formatting.
  
  const historyText = history.map(msg => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`).join('\n');
  
  const fullPrompt = `
    ${systemPrompt}

    Conversation History:
    ${historyText}

    Student: ${message}
    Tutor:
  `;

  const response = await generateContent(fullPrompt);
  return { response: response.trim() };
};
