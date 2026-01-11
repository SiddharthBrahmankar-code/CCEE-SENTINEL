import { generateContent } from './aiService';
import { getModuleById, getModuleContent } from './pdfProcessor';

export const generateNotes = async (moduleId: string, topic: string) => {
  const module = getModuleById(moduleId);
  
  if (!module) {
    throw new Error('Module not found');
  }

  // Extract relevant section from module content
  const fullContent = await getModuleContent(moduleId);
  const relevantContent = fullContent.substring(0, 20000);

  const prompt = `
    You are **CCEE SENTINEL – EXAM INTELLIGENCE ENGINE**.
    Your sole purpose is to generate content that prepares a candidate to **face and clear CCEE under negative marking and time pressure**.
    
    Topic: "${topic}"
    Module: "${module.name}"
    Context: ${relevantContent.substring(0, 5000)}

    **MANDATORY OUTPUT STRUCTURE (JSON ONLY)**:
    {
      "topic": "${topic}",
      "orientation": {
        "examinerIntent": "string",
        "primaryTrap": "string",
        "secondaryTrap": "string",
        "failurePattern": "string",
        "timeToMaster": "string"
      },
      "absoluteFacts": ["string (Fact 1)", "string (Fact 2)"],
      "assumptions": [
        { "assumption": "string (Dangerous intuition)", "reality": "string (Correct behavior)" }
      ],
      "trapZones": [
        { 
          "trap": "string", 
          "why": "string", 
          "reality": "string", 
          "cceeQuestion": "string (Brief description)", 
          "eliminationLogic": "string" 
        }
      ],
      "internalMechanism": ["string (Bullet 1)", "string (Bullet 2)"],
      "codeTricks": [
        {
          "concept": "string",
          "snippet": "string (Deceptive code)",
          "behavior": "string (Output/Result)",
          "whyFail": "string",
          "memoryHook": "string"
        }
      ],
      "binaryTables": [
         { "title": "string", "headers": ["A", "B"], "rows": [["val1", "val2"]] }
      ],
      "killShots": ["string (One-line eliminator)", "string"],
      "checkpoint": ["string (Skill check 1)", "string (Skill check 2)"]
    }

    **RULES**:
    - No storytelling. No padding.
    - If behavior is UNDEFINED, strictly say "UNDEFINED".
    - Code snippets must use 'whitespace-pre-wrap' friendly formatting (short lines if possible).
    - **Focus on CCEE Traps**: Private Destructors, Virtual calls in Constructors, Slicing, Order of Ops.
    - JSON ONLY.
  `;

  try {
    const response = await generateContent(prompt);
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (error) {
    console.error('Error generating notes:', error);
    // FALLBACK: Return dummy notes to prevent 500 crash/Axios Error on frontend
    console.log('⚠️ AI Failed (Notes). Returning Fallback Data.');
    return {
      topic: topic,
      orientation: {
        examinerIntent: "Test error handling",
        primaryTrap: "API Failure",
        secondaryTrap: "Timeout",
        failurePattern: "Dependency on connectivity",
        timeToMaster: "0"
      },
      absoluteFacts: ["AI Service is currently unavailable.", "Fallback data is being shown."],
      assumptions: [],
      trapZones: [
         { 
           trap: "Assuming AI always works", 
           why: "Network partitions exist", 
           reality: "Always handle errors", 
           cceeQuestion: "What happens if API 500s?", 
           eliminationLogic: "Fail safe" 
         }
      ],
      internalMechanism: [],
      codeTricks: [],
      binaryTables: [],
      killShots: ["Check your API Key.", "Check your Internet."],
      checkpoint: ["Fix Backend Connection"]
    };
  }
};
