import { generateContent } from './aiService';

// Check if a module is aptitude/communication related
const isAptitudeModule = (moduleId: string): boolean => {
  const aptitudeKeywords = ['aptitude', 'communication', 'reasoning', 'verbal', 'quant'];
  return aptitudeKeywords.some(keyword => moduleId.toLowerCase().includes(keyword));
};

export const generateFlashcards = async (moduleId: string, topic: string) => {
  // Use different prompt for aptitude vs programming modules
  const isAptitude = isAptitudeModule(moduleId);
  
  const aptitudePrompt = `
    You are a competitive exam preparation expert specializing in QUICK TRICKS and SHORTCUTS for CCEE aptitude.
    Generate 10 High-Yield Flashcards for the topic "${topic}".

    FOCUS ON NON-TRADITIONAL SHORTCUTS AND TRICKS THAT SAVE TIME:
    
    Examples of what we want:
    - LCM/HCF: "For two numbers, LCM × HCF = Product of numbers"
    - LCM/HCF Difference Trick: "If diff between two numbers is small, HCF divides that difference"
    - Percentage: "To find X% of Y, calculate Y% of X if easier"
    - Speed-Distance: "If two speeds in ratio a:b, times are in ratio b:a"
    - Profit/Loss: "SP = CP × (100 ± Profit/Loss%)/100"
    - Work Problems: "If A does work in x days, A's 1 day work = 1/x"
    - Age Problems: "Set up equations, differences remain constant"
    - Number Series: "Check differences, then differences of differences"
    - Averages: "New avg = Old avg ± (Change × No. of items changed)/Total"
    - Compound Interest: "CI = P(1 + r/100)^n - P, use approximation for 2-3 years"

    Types of cards to create:
    1. TRICK - Non-obvious shortcuts and mental math tricks (e.g., "To multiply by 25, divide by 4 and add two zeros")
    2. SHORTCUT - Quick formulas that aren't commonly taught in schools
    3. PATTERN - Patterns to recognize in problems for quick solving
    4. PROBLEM - A problem that demonstrates the trick with answer

    RULES:
    - NO basic textbook formulas everyone knows
    - NO true/false questions
    - Focus on EXAM TRICKS that save time
    - Each trick should be actionable and specific
    - Include the "why it works" briefly if helpful

    Output strictly as JSON:
    {
      "flashcards": [
        {
          "type": "TRICK" | "SHORTCUT" | "PATTERN" | "PROBLEM",
          "front": "The Trick or Shortcut Name/Statement",
          "back": "How to apply it with a quick example"
        }
      ]
    }
  `;

  const programmingPrompt = `
    You are a rapid-fire revision engine for CCEE / PG-DAC students.
    Generate 10 High-Yield Flashcards for the topic "${topic}" in Module "${moduleId}".

    Types of cards to mix:
    1. Syntax Spotting (What is wrong with this code?)
    2. True/False (Conceptual traps)
    3. Quick Definition (What does keyword X do?)
    4. Output Prediction

    Output strictly as JSON:
    {
      "flashcards": [
        {
          "type": "SYNTAX" | "TRUE_FALSE" | "CONCEPT" | "OUTPUT",
          "front": "Question or Code Snippet",
          "back": "Short, precise answer"
        }
      ]
    }
  `;

  const prompt = isAptitude ? aptitudePrompt : programmingPrompt;

  try {
    const text = await generateContent(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Flashcard generation failed:", error);
    // Fallback data
    return {
      flashcards: [
        { type: 'CONCEPT', front: 'Error generating cards', back: 'Please try again.' }
      ]
    };
  }
};
