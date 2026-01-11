import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');
import { generateContent } from './aiService';

const DATA_DIR = path.resolve(__dirname, '../../../data');

export const getPYQFiles = () => {
  const pyqPath = path.join(DATA_DIR, 'PYQ');
  if (!fs.existsSync(pyqPath)) return [];
  return fs.readdirSync(pyqPath).filter(file => file.endsWith('.pdf'));
};

export const analyzePYQ = async (filename: string) => {
  const filePath = path.join(DATA_DIR, 'PYQ', filename);
  const dataBuffer = fs.readFileSync(filePath);

  try {
    const data = await pdf(dataBuffer);
    const text = data.text;

    const prompt = `
      You are a CCEE Exam Pattern Analyst. 
      Analyze the following exam paper text to extract high-value insights.
      
      Output JSON only:
      {
        "examYear": "string",
        "totalQuestions": number,
        "difficultyLevel": "EASY" | "MEDIUM" | "HARD",
        "trapTopics": ["string", "string"], // Topics where students likely fail
        "repeatedThemes": ["string", "string"], // Themes seen often
        "questionDistribution": {
          "codeOutput": number,
          "theory": number,
          "debugging": number
        }
      }

      Text Sample:
      ${text.substring(0, 20000)}
    `;

    const response = await generateContent(prompt);
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch (error) {
    console.error('Error analyzing PYQ:', error);
    // FALLBACK with Raw Text for Client Retry
    console.log('⚠️ AI Failed (PYQ). Returning Fallback with Raw Text.');
    return {
        error: 'AI_FAILED',
        rawText: (await pdf(dataBuffer)).text, 
        "examYear": "N/A",
        "totalQuestions": 0,
        "difficultyLevel": "MEDIUM",
        "trapTopics": ["Analysis Pending..."],
        "repeatedThemes": ["Retrying with Client AI..."],
        "questionDistribution": {
          "codeOutput": 0,
          "theory": 0,
          "debugging": 0
        }
    };
  }
};
