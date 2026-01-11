import fs from 'fs';
import path from 'path';
import { generateContent } from './aiService';

import pdfParse from 'pdf-parse';

// Use process.cwd() to get the server directory, then resolve to data
const DATA_DIR = path.resolve(process.cwd(), '../data');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');
const SYLLABUS_DIR = path.join(DATA_DIR, 'Syllabus');
const MODULES_FILE = path.join(PROCESSED_DIR, 'modules.json');

export interface Module {
  id: string;
  name: string;
  topics: string[];
  // SourceFile and Content are now optional/resolved on demand
  sourceFile?: string;
  content?: string; 
}

let modulesCache: Module[] = [];
// In-memory cache for PDF text: moduleId -> fullText
const contentCache = new Map<string, string>();

/**
 * Helper to find the PDF file for a given module ID.
 * Handles discrepancies between ID (e.g. 'cplusplus') and Filename (e.g. 'C++').
 */
const findPdfForModule = (moduleId: string): string | null => {
  if (!fs.existsSync(SYLLABUS_DIR)) return null;

  const files = fs.readdirSync(SYLLABUS_DIR).filter(f => f.endsWith('.pdf'));
  
  // 1. Try exact match (if we had sourceFile stored)
  // 2. Try fuzzy id match
  
  // Map specific ID patterns to likely filename patterns
  // id: dac_school_tg_ms_dotnet -> filename: ...MS.Net...
  // id: dac_school_tg_cplusplus -> filename: ...C++...
  // id: aptitude_communication  -> filename: ...Aptitude&Communication...
  
  for (const file of files) {
    const filenameLower = file.toLowerCase();
    const idLower = moduleId.toLowerCase();
    
    // Exact basename match (unlikely due to transformations)
    if (filenameLower === idLower + '.pdf') return file;

    // Smart Matching Logic
    let normalizedId = idLower;
    let normalizedFile = filenameLower
      .replace(/&/g, 'and')
      .replace(/\+/g, 'plus')
      .replace(/\.net/g, 'dotnet');

    // Reverse the ID changes we might have made? 
    // Actually, easier to check for key tokens.
    
    // Special Cases Mapping
    if (idLower.includes('cplusplus') && filenameLower.includes('c++')) return file;
    if (idLower.includes('dotnet') && filenameLower.includes('ms.net')) return file;
    if (idLower.includes('aptitude') && filenameLower.includes('aptitude&communication')) return file;
    if (idLower.includes('cos_sdm') && filenameLower.includes('cos&sdm')) return file;
    
    // General 'contains' match
    // e.g. "dac_school_tg_ads_usingjava" contains "ads_usingjava"
    // file "DAC_School_TG_ADS_UsingJava.pdf" contains "ads_usingjava" (ignoring case/separators)
    const coreIdName = idLower.replace(/^dac_school_tg_/, '').replace(/_/g, '');
    const coreFileName = filenameLower.replace(/^dac_school_tg_/, '').replace(/[\s_\-&]/g, '').replace('.pdf', '');

    if (coreFileName === coreIdName) {
        return file;
    }
  }

  return null;
};

/**
 * Retrieves the full text content of a module.
 * Reads from the source PDF if not in cache.
 */
export const getModuleContent = async (moduleId: string): Promise<string> => {
  // 1. Check Memory Cache
  if (contentCache.has(moduleId)) {
    return contentCache.get(moduleId)!;
  }

  // 2. Resolve File
  const filename = findPdfForModule(moduleId);
  if (!filename) {
    console.warn(`⚠️ PDF not found for module: ${moduleId}`);
    return "";
  }

  const filePath = path.join(SYLLABUS_DIR, filename);
  
  try {
    console.log(`📄 Reading PDF on-demand: ${filename} for ${moduleId}`);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text || "";
    
    // 3. Cache it
    contentCache.set(moduleId, text);
    return text;
  } catch (err) {
    console.error(`❌ Failed to read PDF for ${moduleId}:`, err);
    return "";
  }
};

/**
 * Extract topics from text (Legacy/Updates)
 */
const extractTopics = async (content: string, moduleName: string): Promise<string[]> => {
  try {
    const prompt = `
      Extract a COMPLETE list of ALL topics corresponding to the "Sessions" in the syllabus for "${moduleName}".
      The syllabus usually lists "Session 1: Topic", "Session 2: Topic", etc.
      Extract the Topic Name for EVERY session found. Do not summarize or skip any.
      Risk of missing topics is high, so be thorough.
      
      Return ONLY a JSON string array.
      Example: ["Introduction to OS", "File Systems", "Memory Management", "Deadlocks"]

      Syllabus Text:
      ${content.substring(0, 15000)}
    `;

    // Add delay to prevent rate limits
    await new Promise(resolve => setTimeout(resolve, 4000));

    const result = await generateContent(prompt);
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn(`⚠️ AI Topic Extraction failed for ${moduleName}:`, error);
    return [];
  }
};

const extractTopicsRegex = async (content: string): Promise<string[]> => {
  const topics: string[] = [];
  
  // Pattern 1: Session X: Topic Name (Same Line)
  const sessionPattern = /Session[s]?\s+\d+(?:[\s,&]*\d+)*\s*[:]\s*([^\n\r]+)/gi;
  let match;
  while ((match = sessionPattern.exec(content)) !== null) {
    const candidate = match[1].trim();
    if (candidate.length > 4 && !candidate.toLowerCase().startsWith('lecture')) {
      topics.push(candidate);
    }
  }

  // Pattern 2: Session X:\n(Lecture:)?\nTopic Name
  const sessionNextLinePattern = /Session[s]?\s+\d+(?:[\s,&]*\d+)*\s*[:]?\s*[\r\n]+(?:Lecture\s*[:]?\s*[\r\n]+)?(?:[•\-]s*)?([^\\n\\r]+)/gi;
  
  while ((match = sessionNextLinePattern.exec(content)) !== null) {
    const candidate = match[1].trim();
    // Filter out if it caught "Lecture:" itself or other metadata
    if (candidate.length > 4 && 
        !/^(Lecture|Lab|Session|Unit|Chapter|Page|Objective|Note|Duration)/i.test(candidate) &&
        !candidate.includes('...')) {
      topics.push(candidate);
    }
  }

  const uniqueTopics = [...new Set(topics)];
  return uniqueTopics.length > 0 ? uniqueTopics : ['General Module Topics'];
};


export const processAllPDFs = async () => {
  // Check if modules.json already exists and has granular data
  // We DO NOT want to overwrite the user's manual "truncated" (cleaned) file
  if (fs.existsSync(MODULES_FILE)) {
    try {
      const currentData = JSON.parse(fs.readFileSync(MODULES_FILE, 'utf-8'));
      // Support both Object root and Array root
      const modulesList = Array.isArray(currentData) ? currentData : currentData.modules;

      if (Array.isArray(modulesList) && modulesList.length > 0) {
        // Simple check: does the first module have > 10 topics? 
        // If so, it's likely the "Detailed" user version.
        // Also check if 'content' field is missing (which is what we want now).
        const firstMod = modulesList[0];
        if (firstMod.topics && firstMod.topics.length > 10) {
           console.log("✅ Detected existing detailed modules.json. SKIPPING extraction to protect data.");
           // We might want to just ensure they are in memory
           modulesCache = modulesList;
           return;
        }
      }
    } catch (e) {
      console.warn("⚠️ Error reading modules.json, proceeding to re-process.", e);
    }
  }

  // Fallback: This only runs if modules.json is missing or seems empty
  // ... (Full extraction logic would go here, but omitted to respect "Truncated" goal)
  console.log("⚠️ modules.json missing or invalid. Please verify data integrity.");
};

export const getModules = (): Module[] => {
  if (modulesCache.length === 0 && fs.existsSync(MODULES_FILE)) {
    const data = JSON.parse(fs.readFileSync(MODULES_FILE, 'utf-8'));
    modulesCache = data.modules || data || []; // Handle if it's array root or object root
    // Handle array at root if user manually edited it that way
    if (Array.isArray(data)) modulesCache = data;
  }
  return modulesCache;
};

export const getModuleById = (id: string): Module | undefined => {
  return getModules().find(m => m.id === id);
};
