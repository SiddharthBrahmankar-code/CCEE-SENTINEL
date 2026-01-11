import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');
import { generateContent } from './aiService';

const DATA_DIR = path.resolve(__dirname, '../../../data');

export const getSyllabusFiles = () => {
  const syllabusPath = path.join(DATA_DIR, 'Syllabus');
  if (!fs.existsSync(syllabusPath)) return [];
  return fs.readdirSync(syllabusPath).filter(file => file.endsWith('.pdf'));
};

export const parseSyllabus = async (filename: string) => {
  const filePath = path.join(DATA_DIR, 'Syllabus', filename);
  const dataBuffer = fs.readFileSync(filePath);
  let text = '';
  
  try {
    const data = await pdf(dataBuffer);
    text = data.text;

    // NOTE: Removed simple modules.json cache check because we now want DEEP analysis 
    // that the simple cache doesn't provide.

    const prompt = `
      You are an expert academic syllabus analyst for PG-DAC / CCEE programs (ACTS Pune).

      You will be provided with one or more syllabus PDFs.
      Your task is to analyze the PDFs and output a UI-safe, session-wise syllabus structure
      that will be rendered directly in a React application without further processing.

      ========================
      CRITICAL OUTPUT RULES
      ========================
      1. Output MUST be valid JSON.
      2. Output MUST strictly follow the schema below.
      3. Do NOT include markdown, explanations, comments, or extra text.
      4. Every required field MUST exist (never null, never undefined).
      5. Arrays MUST NOT be empty. If data is missing, infer conservatively from context.
      6. Preserve the exact session/day grouping as written in the PDF
         (e.g. "Session 1", "Sessions 2 & 3", "Sessions 19–22").
      7. Topics must be derived ONLY from the PDF (light normalization allowed).
      8. Keep content concise and exam-oriented.
      9. Do NOT generate labs, assignments, durations, or book references.
      10. The result must be safe to render in React with animations.

      ========================
      TARGET REACT DATA MODEL
      ========================

      interface QuickLook {
        important_concepts: string[];
        exam_focus: string[];
        common_traps: string[];
      }

      interface SessionData {
        session: string;
        topics: string[];
        quick_advanced_look: QuickLook;
      }

      interface SyllabusData {
        subject_id: string;
        subject_name: string;
        syllabus: SessionData[];
      }

      ========================
      OUTPUT JSON SCHEMA (STRICT)
      ========================

      {
        "subject_id": "<lowercase_snake_case_identifier>",
        "subject_name": "<official_subject_name>",
        "syllabus": [
          {
            "session": "<Session X | Sessions X & Y>",
            "topics": [
              "<topic 1>",
              "<topic 2>"
            ],
            "quick_advanced_look": {
              "important_concepts": [
                "<how the concept actually works>",
                "<internal flow / architecture / mechanism>"
              ],
              "exam_focus": [
                "<what examiners usually test>",
                "<comparison, diagram, why-type questions>"
              ],
              "common_traps": [
                "<frequent student misconceptions>",
                "<confusing but wrong assumptions>"
              ]
            }
          }
        ]
      }

      ========================
      CONTENT GUIDELINES
      ========================
      • important_concepts → internal mechanics, execution flow, architecture
      • exam_focus → CCEE-style theory questions, comparisons, diagrams
      • common_traps → mistakes that cost marks

      Avoid:
      - textbook definitions
      - vague statements
      - filler phrases
      - generic learning advice

      ========================
      QUALITY BAR
      ========================
      Assume the reader is:
      • a PG-DAC student
      • preparing for CCEE + placements
      • wants fast, high-value revision

      This is NOT beginner content.
      This is NOT full notes.

      ========================
      BEGIN ANALYSIS
      ========================
      Analyze the provided PDF(s) now and return the JSON output ONLY.

      Text to Analyze:
      ${text.substring(0, 25000)} 
    `;

    const response = await generateContent(prompt);
    
    // Robust JSON extraction
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const cleanResponse = jsonMatch ? jsonMatch[0] : response.replace(/```json|```/g, '').trim();
    
    return JSON.parse(cleanResponse);

  } catch (error) {
    console.error('Error parsing syllabus:', error);
    return {
        error: 'AI_FAILED',
        rawText: text, // Use the extracted text
        subject_id: "ERR",
        subject_name: path.basename(filename, '.pdf'),
        syllabus: [
            {
                session: "Analysis Pending",
                topics: ["Server AI failed. Retrying with Client AI..."],
                quick_advanced_look: {
                    important_concepts: ["Pending..."],
                    exam_focus: ["Pending..."],
                    common_traps: ["Pending..."]
                }
            }
        ]
    };
  }
};
