
import api from './apiClient';
import { generateAIContent, cleanJson } from './aiCommon';

const SYLLABUS_PROMPT_TEMPLATE = (text: string) => `
You are an expert academic syllabus analyst for PG-DAC / CCEE.
Analyze this text and output a UI-safe, session-wise syllabus structure.

========================
CRITICAL OUTPUT RULES
========================
1. Output MUST be valid JSON.
2. Output MUST strictly follow the schema below.
3. Do NOT include markdown blocks, just the raw JSON.
4. Input Text: ${text.substring(0, 15000)}

SCHEMA:
{
  "subject_id": "string",
  "subject_name": "string",
  "syllabus": [
    {
      "session": "string",
      "topics": ["string"],
      "quick_advanced_look": {
        "important_concepts": ["string"],
        "exam_focus": ["string"],
        "common_traps": ["string"]
      }
    }
  ]
}`;

const PYQ_PROMPT_TEMPLATE = (text: string) => `
Analyze this CCEE Exam Paper text. Output JSON only (No markdown).

JSON Schema:
{
"examYear": "string",
"totalQuestions": number,
"difficultyLevel": "EASY" | "MEDIUM" | "HARD",
"trapTopics": ["string"], 
"repeatedThemes": ["string"], 
"questionDistribution": { "codeOutput": number, "theory": number, "debugging": number }
}

Text: ${text.substring(0, 15000)}
`;

export const syllabusApi = {
  getFiles: () => api.get<string[]>('/syllabus/files'),
  parse: (filename: string) => 
    api.post('/syllabus/parse', { filename })
      .then(res => {
          // If backend specific logic failed, try generic fallback (Window.ai -> Backend Retry)
          if (res.data?.error === 'AI_FAILED' && res.data?.rawText) {
              console.warn('Backend AI Failed. Switching to Generic AI Fallback for Syllabus Analysis...');
              return generateAIContent(SYLLABUS_PROMPT_TEMPLATE(res.data.rawText), cleanJson, '/chat')
                     .then(aiRes => ({ data: aiRes.data })); 
          }
          return res;
      }),
};

export const pyqApi = {
  getFiles: () => api.get<string[]>('/pyq/files'),
  analyze: (filename: string) => 
    api.post('/pyq/analyze', { filename })
      .then(res => {
          if (res.data?.error === 'AI_FAILED' && res.data?.rawText) {
               console.warn('Backend AI Failed. Switching to Generic AI Fallback for PYQ Analysis...');
               return generateAIContent(PYQ_PROMPT_TEMPLATE(res.data.rawText), cleanJson, '/chat')
                      .then(aiRes => ({ data: aiRes.data }));
          }
          return res;
      }),
};
